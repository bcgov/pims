import { ProjectFilterSchema, ProjectFilter } from '@/services/projects/projectSchema';
import { Request, Response } from 'express';
import { SSOUser } from '@bcgov/citz-imb-sso-express';
import projectServices, { ProjectPropertyIds } from '@/services/projects/projectsServices';
import userServices from '@/services/users/usersServices';
import { isAdmin, isAuditor, checkUserAgencyPermission } from '@/utilities/authorizationChecks';
import { DeepPartial } from 'typeorm';
import { Project } from '@/typeorm/Entities/Project';
import notificationServices from '@/services/notifications/notificationServices';

/**
 * @description Get disposal project by either the numeric id or projectNumber.
 * @param {Request}     req Incoming request.
 * @param {Response}    res Outgoing response.
 * @returns {Response}      A 200 status with the requested project.
 */
export const getDisposalProject = async (req: Request, res: Response) => {
  /**
   * #swagger.tags = ['Projects']
   * #swagger.description = 'Get disposal project by either the numeric id or projectNumber.'
   * #swagger.security = [{
   *   "bearerAuth" : []
   * }]
   */
  const user = req.user as SSOUser;
  const projectId = Number(req.params.projectId);
  if (isNaN(projectId)) {
    return res.status(400).send('Project ID was invalid.');
  }
  const project = await projectServices.getProjectById(projectId);
  if (!project) {
    return res.status(404).send('Project matching this internal ID not found.');
  }

  if (!(await checkUserAgencyPermission(user, [project.AgencyId]))) {
    return res.status(403).send('You are not authorized to view this project.');
  }

  const buildings = project.ProjectProperties.filter((a) => a.Building != null).map(
    (a) => a.Building,
  );
  const parcels = project.ProjectProperties.filter((p) => p.Parcel != null).map((p) => p.Parcel);
  return res.status(200).send({ ...project, Buildings: buildings, Parcels: parcels });
};

/**
 * @description Update disposal project by either the numeric id.
 * @param {Request}     req Incoming request.
 * @param {Response}    res Outgoing response.
 * @returns {Response}      A 200 status with the updated project.
 */
export const updateDisposalProject = async (req: Request, res: Response) => {
  /**
   * #swagger.tags = ['Projects']
   * #swagger.description = 'Update the project for the specified id.'
   * #swagger.security = [{
   *   "bearerAuth" : []
   * }]
   */

  // Only admins can edit projects
  if (!isAdmin(req.user)) {
    return res.status(403).send('Projects only editable by Administrator role.');
  }

  const projectId = Number(req.params.projectId);
  if (isNaN(projectId)) {
    return res.status(400).send('Invalid Project ID');
  }

  if (!req.body.project || !req.body.propertyIds) {
    return res
      .status(400)
      .send('Request must include the following: {project:..., propertyIds:...}');
  }

  if (projectId != req.body.project.Id) {
    return res.status(400).send('The param ID does not match the request body.');
  }
  // need to coordinate how we want tasks to be translated
  const user = await userServices.getUser(req.user.preferred_username);
  const updateBody = { ...req.body.project, UpdatedById: user.Id };
  const project = await projectServices.updateProject(updateBody, req.body.propertyIds, req.user);
  return res.status(200).send(project);
};

/**
 * @description Delete disposal project by either the numeric id or projectNumber.
 * @param {Request}     req Incoming request.
 * @param {Response}    res Outgoing response.
 * @returns {Response}      A 200 status with the deleted project.
 */
export const deleteDisposalProject = async (req: Request, res: Response) => {
  /**
   * #swagger.tags = ['Projects']
   * #swagger.description = 'Delete the project for the specified id.'
   * #swagger.security = [{
   *   "bearerAuth" : []
   * }]
   */
  const projectId = Number(req.params.projectId);
  if (isNaN(projectId)) {
    return res.status(400).send('Invalid Project ID');
  }
  // Only admins can delete projects
  if (!isAdmin(req.user)) {
    return res.status(403).send('Projects can only be deleted by Administrator role.');
  }

  const delProject = await projectServices.deleteProjectById(
    projectId,
    req.user.preferred_username,
  );
  const notifications = await notificationServices.cancelAllProjectNotifications(projectId);

  return res.status(200).send({ project: delProject, notifications });
};

/**
 * @description Add disposal project.
 * @param {Request}     req Incoming request.
 * @param {Response}    res Outgoing response.
 * @returns {Response}      A 200 status with the new project.
 */
export const addDisposalProject = async (req: Request, res: Response) => {
  // Extract project data from request body
  // Extract projectData and propertyIds from the request body
  const {
    project,
    projectPropertyIds,
  }: { project: DeepPartial<Project>; projectPropertyIds: ProjectPropertyIds } = req.body;
  const user = await userServices.getUser((req.user as SSOUser).preferred_username);
  const addBody = { ...project, CreatedById: user.Id, AgencyId: user.AgencyId };

  // Call the addProject service function with the project data
  const newProject = await projectServices.addProject(
    addBody,
    projectPropertyIds,
    req.user as SSOUser,
  );

  // Return the new project in the response
  return res.status(201).json(newProject);
};

/**
 * @description Get all of the projects matching the request body.
 * @param {Request}     req Incoming request.
 * @param {Response}    res Outgoing response.
 * @returns {Response}      A 200 status with the an array of projects.
 */
export const getProjects = async (req: Request, res: Response) => {
  const filter = ProjectFilterSchema.safeParse(req.query);
  const forExcelExport = req.query.excelExport === 'true';
  if (!filter.success) {
    return res.status(400).send('Could not parse filter.');
  }
  const filterResult = filter.data;
  const kcUser = req.user as unknown as SSOUser;
  if (!(isAdmin(kcUser) || isAuditor(kcUser))) {
    // get array of user's agencies
    const usersAgencies = await userServices.getAgencies(kcUser.preferred_username);
    filterResult.agencyId = usersAgencies;
  }
  // Get projects associated with agencies of the requesting user
  const projects = forExcelExport
    ? await projectServices.getProjectsForExport(filterResult as ProjectFilter)
    : await projectServices.getProjects(filterResult as ProjectFilter);
  return res.status(200).send(projects);
};
