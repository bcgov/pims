import z, { ZodTypeAny } from 'zod';

/**
 * Takes a zod schema type. Tries to break a string into an array of those types.
 * @param schema  e.g. z.number()
 * @returns An array of the given schema type.
 */
const arrayFromString = <T extends ZodTypeAny>(schema: T) => {
  return z.preprocess((obj) => {
    if (Array.isArray(obj)) {
      return obj;
    } else if (typeof obj === 'string') {
      return obj.split(',');
    } else {
      return [];
    }
  }, z.array(schema));
};

const numberSchema = z.coerce.number().nonnegative().optional();

/**
 * Schema object for properties returned for the map.
 */
export const MapFilterSchema = z.object({
  PID: numberSchema,
  PIN: numberSchema,
  Address: z.string().optional(),
  AgencyIds: arrayFromString(numberSchema),
  AdministrativeAreaIds: arrayFromString(numberSchema),
  ClassificationIds: arrayFromString(numberSchema),
  PropertyTypeIds: arrayFromString(numberSchema),
  ProjectStatusId: z.coerce.number().optional(),
  Name: z.string().optional(),
  RegionalDistrictIds: arrayFromString(numberSchema),
  UserAgencies: z.array(z.number().int()).optional(),
  Polygon: z.string().optional(),
  ExcelExport: z.coerce.boolean().optional(),
});

export type MapFilter = z.infer<typeof MapFilterSchema>;

export const PropertyUnionFilterSchema = z.object({
  pid: z.string().optional(),
  pin: z.string().optional(),
  classification: z.string().optional(),
  agency: z.string().optional(),
  agencyIds: z.array(z.number().int().nonnegative()).optional(),
  propertyType: z.string().optional(),
  address: z.string().optional(),
  administrativeArea: z.string().optional(),
  landArea: z.string().optional(),
  updatedOn: z.string().optional(),
  projectStatus: z.string().optional(),
  quickFilter: z.string().optional(),
  sortKey: z.string().optional(),
  sortOrder: z.string().optional(),
  page: z.coerce.number().optional(),
  quantity: z.coerce.number().optional(),
});

export type PropertyUnionFilter = z.infer<typeof PropertyUnionFilterSchema>;

export const ImportResultFilterSchema = z.object({
  page: z.coerce.number().optional(),
  quantity: z.coerce.number().optional(),
  sortKey: z.string().optional(),
  sortOrder: z.string().optional(),
});

export type ImportResultFilter = z.infer<typeof ImportResultFilterSchema>;
