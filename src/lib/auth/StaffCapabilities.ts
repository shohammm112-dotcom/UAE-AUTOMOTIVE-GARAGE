export type StaffCapability =
  | "estimates:view"
  | "estimates:create"
  | "estimates:edit"
  | "estimates:submit"
  | "invoices:view"
  | "invoices:generate"
  | "payments:record";

export function hasCapability(roles: string[], capability: StaffCapability): boolean {
  if (!roles || roles.length === 0) return false;
  
  // As verified in InvoiceApplicationService and EstimateApplicationService,
  // 'advisor', 'service_advisor', 'workshop_manager', and 'admin' have full commercial capabilities.
  const isCommercialStaff = roles.some(r => ['admin', 'workshop_manager', 'service_advisor', 'advisor'].includes(r));
  
  switch (capability) {
    case 'estimates:view':
    case 'estimates:create':
    case 'estimates:edit':
    case 'estimates:submit':
    case 'invoices:view':
    case 'invoices:generate':
    case 'payments:record':
      return isCommercialStaff;
    default:
      return false;
  }
}
