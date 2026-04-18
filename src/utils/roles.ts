export const Roles = {
  PUBLIC: 'Public',
  ACQUISITION_SPECIALIST: 'Acquisition Specialist',
  SALES_AGENT: 'Sales Agent',
  OPERATING_MANAGER: 'Operating Manager',
  OWNER: 'Owner',
};

export type Role = (typeof Roles)[keyof typeof Roles];
