import type { JobStage } from "@/domain/stateMachines/JobStateMachine.ts";

export interface CustomerResponseDto {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  emirate: string;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleResponseDto {
  id: string;
  customerId: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  plateCode: string;
  plateNumber: string;
  plateEmirate: string;
  mileage: number;
}

export interface AppointmentResponseDto {
  id: string;
  customerId: string;
  vehicleId?: string;
  preferredDate: string;
  preferredTimeSlot: 'morning' | 'afternoon';
  status: 'requested' | 'confirmed' | 'cancelled' | 'completed';
  serviceType: string;
  customerNotes?: string;
}

export interface JobResponseDto {
  id: string;
  customerId: string;
  vehicleId: string;
  stage: JobStage;
  customerConcern: string;
  diagnosticSummary?: string;
  mileageAtIntake: number;
  advisorName?: string;
}

export interface EstimateItemDto {
  id: string;
  description: string;
  partCostFils: number;
  laborCostFils: number;
  isMandatory: boolean;
  isApproved?: boolean;
}

export interface EstimateResponseDto {
  id: string;
  jobId: string;
  customerId: string;
  status: 'draft' | 'pending_review' | 'approved' | 'rejected' | 'partially_approved';
  items: EstimateItemDto[];
  totalFils: number;
  vatFils: number;
  grandTotalFils: number;
  isActionable: boolean;
  expiresAt: string;
}

export interface InvoiceItemDto {
  description: string;
  amountFils: number;
}

export interface InvoiceResponseDto {
  id: string;
  jobId: string;
  customerId: string;
  status: 'draft' | 'issued' | 'paid' | 'void';
  items: InvoiceItemDto[];
  subtotalFils: number;
  vatFils: number;
  totalFils: number;
  paidAt?: string;
  paymentMethod?: string;
}

export interface NotificationResponseDto {
  id: string;
  customerId: string;
  channel: 'sms' | 'email' | 'in_app';
  title: string;
  body: string;
  metadata?: Record<string, string>;
  read: boolean;
  createdAt: string;
}

export interface AuthContextDto {
  uid: string;
  roles: string[];
  actorType: 'customer' | 'staff';
  customerId?: string;
  verifiedEmail?: string;
  customer?: CustomerResponseDto;
}
