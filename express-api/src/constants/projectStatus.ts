/**
 * @enum
 * Contains past and current project statuses and their IDs.
 */
export enum ProjectStatus {
  DRAFT = 1,
  SELECT_PROPERTIES = 2,
  UPDATE_INFORMATION = 3,
  REQUIRED_DOCUMENTATION = 4,
  APPROVAL = 5,
  REVIEW = 6,
  SUBMITTED = 7,
  SUBMITTED_EXEMPTION = 8,
  DOCUMENT_REVIEW = 10,
  APPRAISAL_REVIEW = 11,
  FIRST_NATION_CONSULTATION = 12,
  EXEMPTION_REVIEW = 13,
  APPROVED_FOR_ERP = 14,
  APPROVED_FOR_EXEMPTION = 15,
  DENIED = 16,
  TRANSFERRED_WITHIN_GRE = 20,
  APPROVED_FOR_SPL = 21,
  NOT_IN_SPL = 22,
  CANCELLED = 23,
  IN_ERP = 30,
  ON_HOLD = 31,
  DISPOSED = 32,
  PRE_MARKETING = 40,
  ON_MARKET = 41,
  CONTRACT_IN_PLACE_CONDITIONAL = 42,
  CONTRACT_IN_PLACE_UNCONDITIONAL = 43,
}