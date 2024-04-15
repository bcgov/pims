import { AppDataSource } from '@/appDataSource';
import projectServices from '@/services/projects/projectsServices';
import { Agency } from '@/typeorm/Entities/Agency';
import { Building } from '@/typeorm/Entities/Building';
import { Parcel } from '@/typeorm/Entities/Parcel';
import { Project } from '@/typeorm/Entities/Project';
import { ProjectProperty } from '@/typeorm/Entities/ProjectProperty';
import { ErrorWithCode } from '@/utilities/customErrors/ErrorWithCode';
import { faker } from '@faker-js/faker';
import {
  produceBuilding,
  produceParcel,
  produceProject,
  produceProjectProperty,
} from 'tests/testUtils/factories';
import { DeepPartial } from 'typeorm';

const _projectsSave = jest
  .spyOn(AppDataSource.getRepository(Project), 'save')
  .mockImplementation(async (project: DeepPartial<Project> & Project) => project);

const _agencyExists = jest
  .spyOn(AppDataSource.getRepository(Agency), 'exists')
  .mockImplementation(async () => true);

const _projectPropertyExists = jest
  .spyOn(AppDataSource.getRepository(ProjectProperty), 'exists')
  .mockImplementation(async () => false);

const _projectPropertySave = jest
  .spyOn(AppDataSource.getRepository(ProjectProperty), 'save')
  .mockImplementation(async () => produceProjectProperty({}));

const _getNextSequence = jest.spyOn(AppDataSource, 'query').mockImplementation(async () => [
  {
    nextval: faker.number.int(),
  },
]);

const _parcelFindOne = jest
  .spyOn(AppDataSource.getRepository(Parcel), 'findOne')
  .mockImplementation(async () => produceParcel());
const _buildingFindOne = jest
  .spyOn(AppDataSource.getRepository(Building), 'findOne')
  .mockImplementation(async () => produceBuilding());

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _queryRunner = jest.spyOn(AppDataSource, 'createQueryRunner').mockReturnValue({
  ...jest.requireActual('@/appDataSource').createQueryRunner,
  startTransaction: async () => {},
  rollbackTransaction: async () => {},
  commitTransaction: async () => {},
});

describe('UNIT - Project Services', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe('addProject', () => {
    it('should add a project and its relevant project property entries', async () => {
      const project = produceProject({ Name: 'Test Project' });
      const result = await projectServices.addProject(project, {
        parcels: [3],
        buildings: [1],
      });
      // Agency is checked for existance
      expect(_agencyExists).toHaveBeenCalledTimes(1);
      // The sequence is called
      expect(_getNextSequence).toHaveBeenCalledTimes(1);
      // Project is saved
      expect(_projectsSave).toHaveBeenCalledTimes(1);
      // One building and one parcel are saved
      expect(_projectPropertySave).toHaveBeenCalledTimes(2);
      // Parcels and buildings are checked to already be in project before adding
      expect(_projectPropertyExists).toHaveBeenCalledTimes(2);
      // Parcels and buildings are checked to exist before adding
      expect(_parcelFindOne).toHaveBeenCalledTimes(1);
      expect(_buildingFindOne).toHaveBeenCalledTimes(1);
      // The created project has the expected values
      expect(result.Name).toEqual('Test Project');
      expect(result.WorkflowId).toEqual(1);
      expect(result.ProjectType).toEqual(1);
      expect(result.StatusId).toEqual(7);
      expect(result.ProjectNumber).toMatch(/^SPP-\d+$/);
    });

    it('should throw an error if the project is missing a name', async () => {
      const project = produceProject({ Name: undefined });
      expect(
        async () =>
          await projectServices.addProject(project, {
            parcels: [1],
            buildings: [1],
          }),
      ).rejects.toThrow(new ErrorWithCode('Projects must have a name.', 400));
    });

    it('should throw an error if the agency does not exist', async () => {
      _agencyExists.mockImplementationOnce(async () => false);
      const project = produceProject({});
      expect(
        async () =>
          await projectServices.addProject(project, {
            parcels: [1],
            buildings: [1],
          }),
      ).rejects.toThrow(new ErrorWithCode(`Agency with ID ${project.AgencyId} not found.`, 404));
    });

    it('should throw an error if the project save fails', async () => {
      _projectsSave.mockImplementationOnce(async () => {
        throw new Error();
      });
      const project = produceProject({});
      expect(
        async () =>
          await projectServices.addProject(project, {
            parcels: [1],
            buildings: [1],
          }),
      ).rejects.toThrow(new ErrorWithCode('Error creating project.', 500));
    });

    it('should throw an error if the parcel attached to project does not exist', async () => {
      _parcelFindOne.mockImplementationOnce(async () => null);
      const project = produceProject({});
      expect(
        async () =>
          await projectServices.addProject(project, {
            parcels: [1],
            buildings: [1],
          }),
      ).rejects.toThrow(new ErrorWithCode(`Parcel with ID 1 does not exist.`, 404));
    });

    it('should throw an error if the building attached to project does not exist', async () => {
      _buildingFindOne.mockImplementationOnce(async () => null);
      const project = produceProject({});
      expect(
        async () =>
          await projectServices.addProject(project, {
            parcels: [1],
            buildings: [1],
          }),
      ).rejects.toThrow(new ErrorWithCode(`Building with ID 1 does not exist.`, 404));
    });

    it('should throw an error if the parcel belongs to another project', async () => {
      _projectPropertyExists.mockImplementationOnce(async () => true);
      const project = produceProject({});
      expect(
        async () =>
          await projectServices.addProject(project, {
            parcels: [1],
          }),
      ).rejects.toThrow(
        new ErrorWithCode(`Parcel with ID 1 already belongs to another project.`, 400),
      );
    });

    it('should throw an error if the building belongs to another project', async () => {
      _projectPropertyExists.mockImplementationOnce(async () => true);
      const project = produceProject({});
      expect(
        async () =>
          await projectServices.addProject(project, {
            buildings: [1],
          }),
      ).rejects.toThrow(
        new ErrorWithCode(`Building with ID 1 already belongs to another project.`, 400),
      );
    });
  });
});