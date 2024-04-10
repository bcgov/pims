import { AppDataSource } from '@/appDataSource';
import { Agency } from '@/typeorm/Entities/Agency';
import { Building } from '@/typeorm/Entities/Building';
import { Parcel } from '@/typeorm/Entities/Parcel';
import { Project } from '@/typeorm/Entities/Project';
import { ProjectProperty } from '@/typeorm/Entities/ProjectProperty';
import { ErrorWithCode } from '@/utilities/customErrors/ErrorWithCode';

const projectRepo = AppDataSource.getRepository(Project);
const projectPropertiesRepo = AppDataSource.getRepository(ProjectProperty);
const parcelRepo = AppDataSource.getRepository(Parcel);
const buildingRepo = AppDataSource.getRepository(Building);
export interface ProjectPropertyIds {
  parcels?: number[];
  buildings?: number[];
}

const addProject = async (project: Project, propertyIds?: ProjectPropertyIds) => {
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
  project.StatusId = project.Metadata.exemptionRequested ? 8 : 7;

  // Get a project number from the sequence
  const [{ nextval }] = await AppDataSource.query("SELECT NEXTVAL('project_num_seq')");

  // TODO: If drafts become possible, this can't always be SPP.
  project.ProjectNumber = `SPP-${nextval}`;
  const newProject = await projectRepo.save(project);

  // After project is saved, add parcel/building relations
  const { parcels, buildings } = propertyIds;
  await addProjectParcelRelations(newProject, parcels);
  await addProjectBuildingRelations(newProject, buildings);

  return newProject;
};

const addProjectParcelRelations = async (project: Project, parcelIds: number[]) => {
  await Promise.all(
    parcelIds?.map(async (parcelId) => {
      const existingParcel = await parcelRepo.findOne({ where: { Id: parcelId } });
      if (!existingParcel) {
        throw new ErrorWithCode(`Parcel with ID ${parcelId} does not exist.`, 404);
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

const addProjectBuildingRelations = async (project: Project, buildingIds: number[]) => {
  await Promise.all(
    buildingIds?.map(async (buildingId) => {
      const existingBuilding = await buildingRepo.findOne({ where: { Id: buildingId } });
      if (!existingBuilding) {
        throw new ErrorWithCode(`Building with ID ${buildingId} does not exist.`, 404);
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

const projectServices = {
  addProject,
};

export default projectServices;
