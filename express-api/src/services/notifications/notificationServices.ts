import { AppDataSource } from '@/appDataSource';
import { Agency } from '@/typeorm/Entities/Agency';
import { NotificationQueue } from '@/typeorm/Entities/NotificationQueue';
import { NotificationTemplate } from '@/typeorm/Entities/NotificationTemplate';
import { Project } from '@/typeorm/Entities/Project';
import { ProjectStatusNotification } from '@/typeorm/Entities/ProjectStatusNotification';
import { User } from '@/typeorm/Entities/User';
import { UUID, randomUUID } from 'crypto';
import nunjucks from 'nunjucks';
import { IsNull, QueryRunner } from 'typeorm';
import chesServices, {
  EmailBody,
  EmailEncoding,
  EmailPriority,
  // IChesStatusResponse,
  IEmail,
} from '../ches/chesServices';
import { SSOUser } from '@bcgov/citz-imb-sso-express';
import { ProjectAgencyResponse } from '@/typeorm/Entities/ProjectAgencyResponse';
import logger from '@/utilities/winstonLogger';
import getConfig from '@/constants/config';

export interface AccessRequestData {
  FirstName: string;
  LastName: string;
}

export enum NotificationStatus {
  Accepted = 0,
  Pending = 1,
  Cancelled = 2,
  Failed = 3,
  Completed = 4,
}

export enum NotificationAudience {
  ProjectOwner = 'ProjectOwner',
  OwningAgency = 'OwningAgency',
  Agencies = 'Agencies',
  ParentAgencies = 'ParentAgencies',
  Default = 'Default',
  WatchingAgencies = 'WatchingAgencies',
}

export enum AgencyResponseType {
  Unsubscribe = 0,
  Subscribe = 1,
  Watch = 2,
}
export interface ProjectNotificationFilter {
  projectId: number;
  pageNumber?: number;
  pageSize?: number;
}
export interface NotificationQueueModel {
  id: number;
  chesMessageId?: string;
  status: string;
  sendOn: Date;
  to: string;
  subject: string;
}
export interface PageModel<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
}

const config = getConfig();
const Title = config.notificationTemplate.title;
const Uri = config.notificationTemplate.uri;

const flattenProjectProperties = (project: Project) => {
  const flattenedProperties = project.ProjectProperties.map((projectProperty) => {
    if (projectProperty.Building != null) {
      return {
        ...projectProperty.Building,
        Type: 'Building',
      };
    } else {
      return {
        ...projectProperty.Parcel,
        Type: 'Parcel',
      };
    }
  });
  return {
    ...project,
    Properties: flattenedProperties,
  };
};

const generateAccessRequestNotification = async (
  accessRequest: AccessRequestData,
  templateId: number,
  to?: string,
): Promise<NotificationQueue> => {
  const systemUser = await AppDataSource.getRepository(User).findOne({
    where: { Username: 'system' },
  });
  const template = await AppDataSource.getRepository(NotificationTemplate).findOne({
    where: { Id: templateId },
  });
  const body = nunjucks.renderString(template.Body, {
    Title: Title,
    Uri: Uri,
    AccessRequest: accessRequest,
  });
  const queueObject = {
    Key: randomUUID(), // The .NET backend seems to just generate this in the API. Not sure what purpose this serves when there's also a serialized int id.
    Status: NotificationStatus.Pending,
    Priority: template.Priority,
    Encoding: template.Encoding,
    SendOn: new Date(),
    Subject: template.Subject,
    BodyType: template.BodyType,
    To: to ?? template.To,
    Cc: template.Cc,
    Bcc: template.Bcc,
    Body: body,
    TemplateId: template.Id,
    CreatedById: systemUser.Id,
  };
  return AppDataSource.getRepository(NotificationQueue).save(queueObject);
};

const insertProjectNotificationQueue = async (
  template: NotificationTemplate,
  projStatusNotif: ProjectStatusNotification,
  project: Project,
  agency?: Agency,
  overrideTo?: string,
  queryRunner?: QueryRunner,
) => {
  const query = queryRunner ?? AppDataSource.createQueryRunner();
  const sendDate = new Date();
  sendDate.setDate(sendDate.getDate() + projStatusNotif.DelayDays);
  const queueObject = {
    Key: randomUUID(),
    Status: NotificationStatus.Pending,
    Priority: template.Priority,
    Encoding: template.Encoding,
    SendOn: sendDate,
    Subject: nunjucks.renderString(template.Subject, { Project: project }),
    BodyType: template.BodyType,
    Body: nunjucks.renderString(template.Body, {
      Title: Title,
      Uri: Uri,
      ToAgency: agency,
      Project: flattenProjectProperties(project),
    }),
    TemplateId: template.Id,
    To: [overrideTo ?? agency?.Email, template.To].filter((a) => a).join(';'),
    Cc: [agency?.CCEmail, template.Cc].filter((a) => a).join(';'),
    Bcc: template.Bcc,
    CreatedById: project.UpdatedById ?? project.CreatedById,
    ProjectId: project.Id,
    ToAgencyId: agency?.Id,
  };
  if (queryRunner === undefined) {
    //If no arg passed we spawned a new query runner and we must release that!
    await query.release();
  }
  const insertedNotif = await query.manager.save(NotificationQueue, queueObject);
  return insertedNotif;
};

const generateProjectNotifications = async (
  project: Project,
  previousStatusId: number,
  queryRunner?: QueryRunner,
) => {
  const query = queryRunner ?? AppDataSource.createQueryRunner();
  const projectStatusNotif1 = await query.manager.find(ProjectStatusNotification, {
    where: { FromStatusId: previousStatusId, ToStatusId: project.StatusId },
  });
  const projectStatusNotif2 = await query.manager.find(ProjectStatusNotification, {
    where: { FromStatusId: IsNull(), ToStatusId: project.StatusId },
  });
  const projectStatusNotifications = [...projectStatusNotif1, ...projectStatusNotif2];
  const returnNotifications = [];
  for (const projStatusNotif of projectStatusNotifications) {
    const template = await query.manager.findOne(NotificationTemplate, {
      where: { Id: projStatusNotif.TemplateId },
    });

    let overrideTo: string | null = null;
    if (template.Audience == NotificationAudience.ProjectOwner) {
      const owningUser = await query.manager.findOne(User, {
        where: { Id: project.CreatedById },
      });
      overrideTo = owningUser.Email;
      returnNotifications.push(
        insertProjectNotificationQueue(
          template,
          projStatusNotif,
          project,
          project.Agency,
          overrideTo,
          queryRunner,
        ),
      );
    } else if (template.Audience == NotificationAudience.OwningAgency) {
      returnNotifications.push(
        insertProjectNotificationQueue(
          template,
          projStatusNotif,
          project,
          project.Agency,
          undefined,
          queryRunner,
        ),
      );
    } else if (template.Audience == NotificationAudience.Agencies) {
      const agencies = await AppDataSource.getRepository(Agency)
        .createQueryBuilder('a')
        .leftJoin(
          ProjectAgencyResponse,
          'par',
          'a.id = par.agency_id AND par.project_id = :projectId',
          {
            projectId: project.Id,
          },
        )
        .andWhere('a.is_disabled = false')
        .andWhere('a.send_email = true')
        .andWhere(
          '(par.agency_id IS NULL OR (par.response != :unsubscribe AND par.response != :watch))',
          {
            unsubscribe: AgencyResponseType.Unsubscribe,
            watch: AgencyResponseType.Watch,
          },
        )
        .getMany();
      agencies.forEach((agc) =>
        returnNotifications.push(
          insertProjectNotificationQueue(
            template,
            projStatusNotif,
            project,
            agc,
            undefined,
            queryRunner,
          ),
        ),
      );
    } else if (template.Audience == NotificationAudience.ParentAgencies) {
      const agencies = await AppDataSource.getRepository(Agency)
        .createQueryBuilder('a')
        .leftJoin(
          ProjectAgencyResponse,
          'par',
          'a.id = par.agency_id AND par.project_id = :projectId',
          {
            projectId: project.Id,
          },
        )
        .where('a.parent_id IS NULL')
        .andWhere('a.is_disabled = false')
        .andWhere('a.send_email = true')
        .andWhere(
          '(par.agency_id IS NULL OR (par.response != :unsubscribe AND par.response != :watch))',
          {
            unsubscribe: AgencyResponseType.Unsubscribe,
            watch: AgencyResponseType.Watch,
          },
        )
        .getMany();
      agencies.forEach((agc) =>
        returnNotifications.push(
          insertProjectNotificationQueue(
            template,
            projStatusNotif,
            project,
            agc,
            undefined,
            queryRunner,
          ),
        ),
      );
    } else if (template.Audience == NotificationAudience.WatchingAgencies) {
      const agencies = await AppDataSource.getRepository(Agency)
        .createQueryBuilder('a')
        .leftJoin(
          ProjectAgencyResponse,
          'par',
          'a.id = par.agency_id AND par.project_id = :projectId',
          {
            projectId: project.Id,
          },
        )
        .andWhere('a.is_disabled = false')
        .andWhere('a.send_email = true')
        .andWhere('(par.agency_id IS NOT NULL AND par.response = :watch)', {
          watch: AgencyResponseType.Watch,
        })
        .getMany();
      agencies.forEach((agc) =>
        returnNotifications.push(
          insertProjectNotificationQueue(
            template,
            projStatusNotif,
            project,
            agc,
            undefined,
            queryRunner,
          ),
        ),
      );
    } else if (template.Audience == NotificationAudience.Default) {
      returnNotifications.push(
        insertProjectNotificationQueue(
          template,
          projStatusNotif,
          project,
          undefined,
          undefined,
          queryRunner,
        ),
      );
    }
  }
  if (queryRunner === undefined) {
    await query.release();
  }
  return await Promise.all(returnNotifications);
};

const sendNotification = async (
  notification: NotificationQueue,
  user: SSOUser,
  queryRunner?: QueryRunner,
) => {
  const query = queryRunner ?? AppDataSource.createQueryRunner();
  let retNotif: NotificationQueue = null;
  try {
    const email: IEmail = {
      to: notification.To?.split(';').map((a) => a.trim()) ?? [],
      cc: notification.Cc?.split(';').map((a) => a.trim()) ?? [],
      bcc: notification.Bcc?.split(';').map((a) => a.trim()) ?? [],
      bodyType: EmailBody[notification.BodyType as keyof typeof EmailBody],
      subject: notification.Subject,
      body: notification.Body,
      encoding: EmailEncoding[notification.Encoding as keyof typeof EmailEncoding],
      priority: EmailPriority[notification.Priority as keyof typeof EmailPriority],
      tag: notification.Tag,
      delayTS: notification.SendOn.getTime(),
    };
    const response = await chesServices.sendEmailAsync(email, user);
    if (response) {
      // Note: Email may be intentionally disabled, thus yielding null response.
      retNotif = await query.manager.save(NotificationQueue, {
        ...notification,
        ChesTransactionId: response.txId as UUID,
        ChesMessageId: response.messages[0].msgId as UUID,
      });
    } else {
      retNotif = await query.manager.save(NotificationQueue, {
        ...notification,
        Status: NotificationStatus.Failed,
      });
    }
  } catch (e) {
    logger.error(e.message);
    retNotif = await query.manager.save(NotificationQueue, {
      ...notification,
      Status: NotificationStatus.Failed,
    });
  } finally {
    if (queryRunner === undefined) {
      await query.release();
    }
  }
  return retNotif;
};

const convertChesStatusToNotificationStatus = (chesStatus: string): NotificationStatus => {
  switch (chesStatus) {
    case 'accepted':
      return NotificationStatus.Accepted;
    case 'pending':
      return NotificationStatus.Pending;
    case 'cancelled':
      return NotificationStatus.Cancelled;
    case 'failed':
      return NotificationStatus.Failed;
    case 'completed':
      return NotificationStatus.Completed;
    default:
      return NotificationStatus.Failed;
  }
};

const updateNotificationStatus = async (
  notificationId: number,
  user: User,
  queryRunner?: QueryRunner,
) => {
  const query = queryRunner ?? AppDataSource.createQueryRunner();
  try {
    //await query.startTransaction(); // Start transaction if queryRunner is provided

    const notification = await query.manager.findOne(NotificationQueue, {
      where: { Id: notificationId },
    });

    if (!notification || Object.keys(notification).length === 0) {
      throw new Error(`Notification with id ${notificationId} not found.`);
    }

    const statusResponse = await chesServices.getStatusByIdAsync(notification.ChesMessageId);

    if (statusResponse) {
      notification.Status = convertChesStatusToNotificationStatus(statusResponse.status);
      notification.UpdatedOn = new Date();
      notification.UpdatedById = user.Id;
      const updatedNotification = await query.manager.save(NotificationQueue, notification);

      return updatedNotification;
    } else {
      throw new Error(`Failed to retrieve status for notification with id ${notificationId}.`);
    }
  } catch (error) {
    await query.rollbackTransaction(); // Rollback transaction on error

    throw error; // Rethrow the error for handling elsewhere if needed
  } finally {
    if (!queryRunner) {
      await query.release(); // Release queryRunner if it was created locally
    }
  }
};

const getProjectNotificationsInQueue = async (
  filter: ProjectNotificationFilter,
  user: User,
): Promise<PageModel<NotificationQueue>> => {
  const { projectId, pageNumber, pageSize } = filter;
  const notifications = await AppDataSource.getRepository(NotificationQueue).find({
    where: {
      ProjectId: projectId,
    },
    skip: (pageNumber ?? 0) * (pageSize ?? 0),
    take: pageSize ?? 0,
    order: { SendOn: 'ASC' },
  });

  const updatedNotifications: Promise<NotificationQueue>[] = [];
  for (const notification of notifications) {
    // run the updates for notifications that are in Pending or Accepted status as the other statuses are final
    if (
      notification.Status === NotificationStatus.Pending ||
      notification.Status === NotificationStatus.Accepted
    ) {
      const updatedNotification = updateNotificationStatus(notification.Id, user);
      updatedNotifications.push(updatedNotification);
    } else {
      updatedNotifications.push(Promise.resolve(notification));
    }
  }

  const pageModel: PageModel<NotificationQueue> = {
    items: await Promise.all(updatedNotifications),
    pageNumber: pageNumber ?? 0,
    pageSize: pageSize ?? 0,
  };

  return pageModel;
};

const notificationServices = {
  generateProjectNotifications,
  generateAccessRequestNotification,
  sendNotification,
  updateNotificationStatus,
  getProjectNotificationsInQueue,
  convertChesStatusToNotificationStatus,
};

export default notificationServices;
