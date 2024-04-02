import { AppDataSource } from '@/appDataSource';
import { AdministrativeArea } from '@/typeorm/Entities/AdministrativeArea';
import { AdministrativeAreaFilter } from './administrativeAreaSchema';
import { DeepPartial, FindOptionsOrder } from 'typeorm';
import { ErrorWithCode } from '@/utilities/customErrors/ErrorWithCode';

const getAdministrativeAreas = (filter: AdministrativeAreaFilter) => {
  return AppDataSource.getRepository(AdministrativeArea).find({
    where: {
      Name: filter.name,
      ProvinceId: filter.provinceId,
    },
    take: filter.quantity,
    skip: (filter.quantity ?? 0) * (filter.page ?? 0),
    order: filter.sort as FindOptionsOrder<AdministrativeArea>,
  });
};

const getAdministrativeAreaById = (id: number) => {
  return AppDataSource.getRepository(AdministrativeArea).findOne({
    relations: {
      RegionalDistrict: true,
    },
    where: { Id: id },
  });
};

const updateAdministrativeArea = async (adminArea: DeepPartial<AdministrativeArea>) => {
  const exists = await getAdministrativeAreaById(adminArea.Id);
  if (!exists) {
    throw new ErrorWithCode('Administrative area does not exist.', 404);
  }
  await AppDataSource.getRepository(AdministrativeArea).update(adminArea.Id, adminArea);
  return getAdministrativeAreaById(adminArea.Id);
};

const administrativeAreasServices = {
  getAdministrativeAreas,
  getAdministrativeAreaById,
  updateAdministrativeArea,
};

export default administrativeAreasServices;
