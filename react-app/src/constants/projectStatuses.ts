/**
 * @enum
 * Contains past and current project statuses and their IDs.
 */
export enum ProjectStatus {
  // DRAFT = 1, // Disabled
  // SELECT_PROPERTIES = 2, // Disabled
  // UPDATE_INFORMATION = 3, // Disabled
  REQUIRED_DOCUMENTATION = 4,
  // APPROVAL = 5, // Disabled
  // REVIEW = 6, // Disabled
  SUBMITTED = 7,
  SUBMITTED_EXEMPTION = 8,
  // DOCUMENT_REVIEW = 10, // Disabled
  // APPRAISAL_REVIEW = 11, // Disabled
  // FIRST_NATION_CONSULTATION = 12, // Disabled
  // EXEMPTION_REVIEW = 13, // Disabled
  APPROVED_FOR_ERP = 14,
  APPROVED_FOR_EXEMPTION = 15,
  DENIED = 16,
  TRANSFERRED_WITHIN_GRE = 20,
  APPROVED_FOR_SPL = 21,
  NOT_IN_SPL = 22,
  CANCELLED = 23,
  // IN_ERP = 30, // Disabled
  ON_HOLD = 31,
  DISPOSED = 32,
  PRE_MARKETING = 40,
  ON_MARKET = 41,
  CONTRACT_IN_PLACE = 42, // Previously CONTRACT_IN_PLACE_CONDITIONAL
  // CONTRACT_IN_PLACE_UNCONDITIONAL = 43, // Disabled
  CLOSE_OUT = 44,
}

/**
 * Used in parallel with checks in API.
 * Projects and properties in ERP are shown to agencies outside of their owning agency.
 * Properties in active projects with these status will be highlighted.
 */
export const exposedProjectStatuses = [ProjectStatus.APPROVED_FOR_ERP];