import { AppDataSource } from '@/appDataSource';
import { Agency } from '@/typeorm/Entities/Agency';
import { Building } from '@/typeorm/Entities/Building';
import { NotificationQueue } from '@/typeorm/Entities/NotificationQueue';
import { Parcel } from '@/typeorm/Entities/Parcel';
import { Project } from '@/typeorm/Entities/Project';
import { ProjectAgencyResponse } from '@/typeorm/Entities/ProjectAgencyResponse';
import { ProjectNote } from '@/typeorm/Entities/ProjectNote';
import { ProjectProperty } from '@/typeorm/Entities/ProjectProperty';
import { ProjectSnapshot } from '@/typeorm/Entities/ProjectSnapshot';
import { ProjectStatusHistory } from '@/typeorm/Entities/ProjectStatusHistory';
import { ProjectTask } from '@/typeorm/Entities/ProjectTask';
import { ErrorWithCode } from '@/utilities/customErrors/ErrorWithCode';
import logger from '@/utilities/winstonLogger';
import { DeepPartial } from 'typeorm';

const projectRepo = AppDataSource.getRepository(Project);
const projectPropertiesRepo = AppDataSource.getRepository(ProjectProperty);
const parcelRepo = AppDataSource.getRepository(Parcel);
const buildingRepo = AppDataSource.getRepository(Building);
export interface ProjectPropertyIds {
  parcels?: number[];
  buildings?: number[];
}

/**
 * Retrieves a project by its ID.
 *
 * @param id - The ID of the project to retrieve.
 * @returns A Promise that resolves to the project object or null if not found.
 */
const getProjectById = async (id: number) => {
  const project = await projectRepo.findOne({
    where: {
      Id: id,
    },
    relations: {
      Agency: true,
      Workflow: true,
      TierLevel: true,
      Status: true,
      Risk: true,
      ProjectProperties: true,
    },
    select: {
      Workflow: {
        Name: true,
        Code: true,
        Description: true,
      },
      Agency: {
        Name: true,
        Code: true,
      },
      TierLevel: {
        Name: true,
        Description: true,
      },
      Status: {
        Name: true,
        GroupName: true,
        Description: true,
        IsTerminal: true,
        IsMilestone: true,
      },
      Risk: {
        Name: true,
        Code: true,
        Description: true,
      },
    },
  });
  return project;
};

/**
 * Adds a new project to the database.
 *
 * @param project - The project object to be added.
 * @param propertyIds - The IDs of the properties (parcels and buildings) to be associated with the project.
 * @returns The newly created project.
 * @throws ErrorWithCode - If the project name is missing, agency is not found, or there is an error creating the project.
 */
const addProject = async (project: DeepPartial<Project>, propertyIds: ProjectPropertyIds) => {
  // Does the project have a name?
  if (!project.Name) throw new ErrorWithCode('Projects must have a name.', 400);

  // Check if agency exists
  if (!(await AppDataSource.getRepository(Agency).exists({ where: { Id: project.AgencyId } }))) {
    throw new ErrorWithCode(`Agency with ID ${project.AgencyId} not found.`, 404);
  }

  // Workflow ID during submission will always be the submit entry
  project.WorkflowId = 1; // 1 == Submit Disposal

  // Only project type at the moment is 1 (Disposal)
  project.ProjectType = 1;

  // What type of submission is this? Regular (7) or Exemption (8)?
  project.StatusId = project.Metadata?.exemptionRequested ? 8 : 7;

  // Get a project number from the sequence
  const [{ nextval }] = await AppDataSource.query("SELECT NEXTVAL('project_num_seq')");

  // TODO: If drafts become possible, this can't always be SPP.
  project.ProjectNumber = `SPP-${nextval}`;
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.startTransaction();
  try {
    const newProject = await projectRepo.save(project);
    // After project is saved, add parcel/building relations
    const { parcels, buildings } = propertyIds;
    if (parcels) await addProjectParcelRelations(newProject, parcels);
    if (buildings) await addProjectBuildingRelations(newProject, buildings);
    await queryRunner.commitTransaction();
    return newProject;
  } catch (e) {
    await queryRunner.rollbackTransaction();
    logger.warn(e.message);
    if (e instanceof ErrorWithCode) throw e;
    throw new ErrorWithCode('Error creating project.', 500);
  }
};

/**
 * Adds parcel relations to a project.
 *
 * @param project - The project to add parcel relations to.
 * @param parcelIds - An array of parcel IDs to add as relations.
 * @throws {ErrorWithCode} - If the parcel with the given ID does not exist or already belongs to another project.
 * @returns {Promise<void>} - A promise that resolves when the parcel relations have been added.
 */
const addProjectParcelRelations = async (project: Project, parcelIds: number[]) => {
  await Promise.all(
    parcelIds?.map(async (parcelId) => {
      const existingParcel = await parcelRepo.findOne({ where: { Id: parcelId } });
      if (!existingParcel) {
        throw new ErrorWithCode(`Parcel with ID ${parcelId} does not exist.`, 404);
      }
      if (
        await projectPropertiesRepo.exists({
          where: {
            ProjectId: project.Id,
            PropertyTypeId: 1,
            ParcelId: parcelId,
          },
        })
      ) {
        throw new ErrorWithCode(
          `Parcel with ID ${parcelId} already belongs to another project.`,
          400,
        );
      }
      // Is this a land (0) or subdivision (2)
      const propertyType = existingParcel.ParentParcelId ? 2 : 0;
      const entry: Partial<ProjectProperty> = {
        CreatedById: project.CreatedById,
        ProjectId: project.Id,
        PropertyTypeId: propertyType,
        ParcelId: parcelId,
      };
      await projectPropertiesRepo.save(entry);
    }),
  );
};

/**
 * Adds building relations to a project.
 *
 * @param {Project} project - The project to add building relations to.
 * @param {number[]} buildingIds - An array of building IDs to add as relations.
 * @returns {Promise<void>} - A promise that resolves when the building relations have been added.
 * @throws {ErrorWithCode} - If a building with the given ID does not exist or if the building already belongs to another project.
 */
const addProjectBuildingRelations = async (project: Project, buildingIds: number[]) => {
  await Promise.all(
    buildingIds?.map(async (buildingId) => {
      const existingBuilding = await buildingRepo.findOne({ where: { Id: buildingId } });
      if (!existingBuilding) {
        throw new ErrorWithCode(`Building with ID ${buildingId} does not exist.`, 404);
      }
      if (
        await projectPropertiesRepo.exists({
          where: {
            ProjectId: project.Id,
            PropertyTypeId: 1,
            BuildingId: buildingId,
          },
        })
      ) {
        throw new ErrorWithCode(
          `Building with ID ${buildingId} already belongs to another project.`,
          400,
        );
      }
      // Property type building (1)
      const entry: Partial<ProjectProperty> = {
        CreatedById: project.CreatedById,
        ProjectId: project.Id,
        PropertyTypeId: 1,
        BuildingId: buildingId,
      };
      await projectPropertiesRepo.save(entry);
    }),
  );
};

/**
 * Removes the relations between a project and the specified parcel IDs.
 *
 * @param {Project} project - The project from which to remove the parcel relations.
 * @param {number[]} parcelIds - An array of parcel IDs to remove the relations for.
 * @returns {Promise<void>} - A promise that resolves when the relations have been removed.
 */
const removeProjectParcelRelations = async (project: Project, parcelIds: number[]) => {
  await Promise.all(
    parcelIds?.map(async (parcelId) => {
      await projectPropertiesRepo.delete({
        ProjectId: project.Id,
        ParcelId: parcelId,
      });
    }),
  );
};

/**
 * Removes the relationship between a project and the specified buildings.
 *
 * @param {Project} project - The project from which to remove the building relationships.
 * @param {number[]} buildingIds - An array of building IDs to be removed from the project.
 * @returns {Promise<void>} - A promise that resolves when the building relationships have been removed.
 */
const removeProjectBuildingRelations = async (project: Project, buildingIds: number[]) => {
  await Promise.all(
    buildingIds?.map(async (buildingId) => {
      await projectPropertiesRepo.delete({
        ProjectId: project.Id,
        BuildingId: buildingId,
      });
    }),
  );
};

/**
 * Updates a project with the given changes and property IDs.
 *
 * @param project - The project object containing the changes to be made.
 * @param propertyIds - The IDs of the properties to be associated with the project.
 * @returns The result of the project update.
 * @throws {ErrorWithCode} If the project name is empty or null, if the project does not exist, if the project number or agency cannot be changed, or if there is an error updating the project.
 */
const updateProject = async (project: DeepPartial<Project>, propertyIds: ProjectPropertyIds) => {
  // Project must still have a name
  // undefined is allowed because it is not always updated
  if (project.Name === null || project.Name === '') {
    throw new ErrorWithCode('Projects must have a name.', 400);
  }
  const originalProject = await projectRepo.findOne({ where: { Id: project.Id } });
  if (!originalProject) {
    throw new ErrorWithCode('Project does not exist.', 404);
  }
  // Not allowed to change Project Number
  if (project.ProjectNumber && originalProject.ProjectNumber !== project.ProjectNumber) {
    throw new ErrorWithCode('Project Number may not be changed.', 403);
  } // Not allowed to change the agency
  if (project.AgencyId && originalProject.AgencyId !== project.AgencyId) {
    throw new ErrorWithCode('Project Agency may not be changed.', 403);
  }

  /* TODO: Need something that checks for valid changes between status, workflow, etc.
   * Can address this when business logic is determined.
   */

  const queryRunner = await AppDataSource.createQueryRunner();
  queryRunner.startTransaction();
  try {
    // Metadata field is not preserved if a metadata property is set. It is overwritten.
    // Construct the proper metadata before continuing.
    const newMetadata = { ...originalProject.Metadata, ...project.Metadata };

    // If status was changed, write result to Project Status History table.
    if (originalProject.StatusId !== project.StatusId) {
      await AppDataSource.getRepository(ProjectStatusHistory).insert({
        CreatedById: project.UpdatedById,
        ProjectId: project.Id,
        WorkflowId: project.WorkflowId,
        StatusId: project.StatusId,
      });
    }

    const updateResult = await projectRepo.update(
      { Id: project.Id },
      { ...project, Metadata: newMetadata },
    );

    // Update related Project Properties
    const existingProjectProperties = await projectPropertiesRepo.find({
      where: { ProjectId: originalProject.Id },
    });
    const existingParcelIds = existingProjectProperties
      .map((record) => record.ParcelId)
      .filter((id) => id);
    const existingBuildingIds = existingProjectProperties
      .map((record) => record.BuildingId)
      .filter((id) => id);
    // Adding new Project Properties
    const propertiesToAdd: ProjectPropertyIds = {
      parcels: propertyIds.parcels
        ? propertyIds.parcels.filter((id) => !existingParcelIds.includes(id))
        : [],
      buildings: propertyIds.buildings
        ? propertyIds.buildings.filter((id) => !existingBuildingIds.includes(id))
        : [],
    };
    const { parcels: parcelsToAdd, buildings: buildingsToAdd } = propertiesToAdd;
    if (parcelsToAdd) await addProjectParcelRelations(originalProject, parcelsToAdd);
    if (buildingsToAdd) await addProjectBuildingRelations(originalProject, buildingsToAdd);
    // Removing the old project properties
    const propertiesToRemove: ProjectPropertyIds = {
      parcels: parcelsToAdd ? existingParcelIds.filter((id) => !parcelsToAdd.includes(id)) : [],
      buildings: buildingsToAdd
        ? existingBuildingIds.filter((id) => !buildingsToAdd.includes(id))
        : [],
    };
    const { parcels: parcelsToRemove, buildings: buildingsToRemove } = propertiesToRemove;
    if (parcelsToRemove) await removeProjectParcelRelations(originalProject, parcelsToRemove);
    if (buildingsToRemove) await removeProjectBuildingRelations(originalProject, buildingsToRemove);

    queryRunner.commitTransaction();
    return updateResult;
  } catch (e) {
    await queryRunner.rollbackTransaction();
    logger.warn(e.message);
    if (e instanceof ErrorWithCode) throw e;
    throw new ErrorWithCode('Error updating project.', 500);
  }
};

/**
 * Deletes a project by its ID.
 *
 * @param {number} id - The ID of the project to delete.
 * @returns {Promise<DeleteResult>} - A promise that resolves to the delete result.
 * @throws {ErrorWithCode} - If the project does not exist, or if there is an error deleting the project.
 */
const deleteProjectById = async (id: number) => {
  if (!(await projectRepo.exists({ where: { Id: id } }))) {
    throw new ErrorWithCode('Project does not exist.', 404);
  }
  const queryRunner = await AppDataSource.createQueryRunner();
  queryRunner.startTransaction();
  try {
    // Remove Project Properties relations
    await projectPropertiesRepo.delete({ ProjectId: id });
    // Remove Project Status History
    await AppDataSource.getRepository(ProjectStatusHistory).delete({ ProjectId: id });
    // Remove Project Notes
    await AppDataSource.getRepository(ProjectNote).delete({ ProjectId: id });
    // Remove Project Snapshots
    await AppDataSource.getRepository(ProjectSnapshot).delete({ ProjectId: id });
    // Remove Project Tasks
    await AppDataSource.getRepository(ProjectTask).delete({ ProjectId: id });
    // Remove Project Agency Responses
    await AppDataSource.getRepository(ProjectAgencyResponse).delete({ ProjectId: id });
    // Remove Notifications from Project
    /* FIXME: This should eventually be done with the notifications service.
     * Otherwise, any notifications sent to CHES won't be cancelled.
     */
    await AppDataSource.getRepository(NotificationQueue).delete({ ProjectId: id });
    // Delete the project
    const deleteResult = await projectRepo.delete({ Id: id });
    queryRunner.commitTransaction();
    return deleteResult;
  } catch (e) {
    await queryRunner.rollbackTransaction();
    logger.warn(e.message);
    if (e instanceof ErrorWithCode) throw e;
    throw new ErrorWithCode('Error deleting project.', 500);
  }
};

const projectServices = {
  addProject,
  getProjectById,
  deleteProjectById,
  updateProject,
};

export default projectServices;
