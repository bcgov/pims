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
  Name: z.string().optional(),
  RegionalDistrictIds: arrayFromString(numberSchema),
});