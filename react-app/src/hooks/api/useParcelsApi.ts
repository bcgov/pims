import { Property } from '@/interfaces/IProperty';
import { IFetch } from '../useFetch';
import { BaseEntityInterface } from '@/interfaces/IBaseEntity';
import { EvaluationKey } from '@/interfaces/IEvaluationKey';
import { FiscalKey } from '@/interfaces/IFiscalKey';
import { DeepPartial } from 'react-hook-form';

export interface ParcelEvaluation extends BaseEntityInterface {
  ParcelId: number;
  Parcel?: Parcel;
  Year: number;
  Value: string | number;
  Firm?: string;
  EvaluationKeyId: number;
  EvaluationKey?: EvaluationKey;
  Note?: string;
}

type ParcelEvaluationAdd = Omit<
  ParcelEvaluation,
  'ParcelId' | 'CreatedOn' | 'CreatedById' | 'UpdatedOn' | 'UpdatedById'
>;
type ParcelFiscalAdd = Omit<
  ParcelFiscal,
  'ParcelId' | 'CreatedOn' | 'CreatedById' | 'UpdatedOn' | 'UpdatedById'
>;

export interface ParcelFiscal extends BaseEntityInterface {
  FiscalYear: number;
  EffectiveDate: Date;
  Value: string | number;
  Note?: string;
  FiscalKeyId: number;
  FiscalKey?: FiscalKey;
}

export interface Parcel extends Property {
  Evaluations?: ParcelEvaluation[] | null;
  Fiscals?: ParcelFiscal[] | null;
  LandArea?: number;
  LandLegalDescription?: string;
  Zoning?: string;
  ZoningPotential?: string;
  ParentParcelId?: number;
  ParentParcel?: Parcel;
  NotOwned?: boolean;
  PropertyTypeId: number;
}

export type ParcelUpdate = Partial<Parcel>;
export type ParcelAdd = Omit<
  Parcel,
  'Id' | 'CreatedOn' | 'CreatedById' | 'UpdatedOn' | 'UpdatedById' | 'Evaluations' | 'Fiscals'
> & { Evaluations: ParcelEvaluationAdd[]; Fiscals: ParcelFiscalAdd[] };

export interface IParcelsGetParams {
  pid?: number;
  includeRelations?: boolean;
  excelExport?: boolean;
}

const useParcelsApi = (absoluteFetch: IFetch) => {
  const addParcel = async (parcel: ParcelAdd) => {
    const response = await absoluteFetch.post('/parcels', parcel);
    return response;
  };
  const updateParcelById = async (id: number, parcel: DeepPartial<ParcelUpdate>) => {
    const response = await absoluteFetch.put(`/parcels/${id}`, parcel);
    return response;
  };
  const getParcels = async (params?: IParcelsGetParams) => {
    const noNullParam = params
      ? // eslint-disable-next-line @typescript-eslint/no-unused-vars
        Object.fromEntries(Object.entries(params).filter(([_, v]) => v != null))
      : undefined;
    const { parsedBody } = await absoluteFetch.get('/parcels', noNullParam);
    if (parsedBody.error) {
      return [];
    }
    return parsedBody as Parcel[];
  };
  const getParcelsWithRelations = async () => {
    const { parsedBody } = await absoluteFetch.get('/parcels?includeRelations=true');
    if (parsedBody.error) {
      return [];
    }
    return parsedBody as Parcel[];
  };
  const getParcelById = async (id: number) => {
    const { parsedBody } = await absoluteFetch.get(`/parcels/${id}`);
    return parsedBody as Parcel;
  };
  const deleteParcelById = async (id: number) => {
    const { parsedBody } = await absoluteFetch.del(`/parcels/${id}`);
    return parsedBody as Parcel;
  };
  return {
    addParcel,
    updateParcelById,
    getParcels,
    getParcelsWithRelations,
    getParcelById,
    deleteParcelById,
  };
};

export default useParcelsApi;
