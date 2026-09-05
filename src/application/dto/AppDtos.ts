export interface CustomerResponseDto {
  readonly id: string;
  readonly fullName: string;
  readonly email: string;
  readonly phone: string;
  readonly emirate: string;
  readonly preferredLanguage: 'en' | 'ar';
  readonly createdAt: string;
}

export interface UpdateCustomerProfileDto {
  readonly fullName?: string;
  readonly phone?: string;
  readonly emirate?: string;
  readonly preferredLanguage?: 'en' | 'ar';
}

export interface RegisterVehicleDto {
  readonly vin: string;
  readonly emirate: string;
  readonly plateCode: string;
  readonly plateNumber: string;
  readonly make: string;
  readonly model: string;
  readonly year: number;
  readonly color: string;
  readonly currentMileageKm: number;
}

export interface VehicleResponseDto {
  readonly id: string;
  readonly customerId: string;
  readonly vin: string;
  readonly plate: {
    readonly emirate: string;
    readonly code: string;
    readonly number: string;
    readonly displayString: string;
  };
  readonly make: string;
  readonly model: string;
  readonly year: number;
  readonly color: string;
  readonly odometerReadingKm: number;
  readonly createdAt: string;
}

export interface RequestAppointmentDto {
  readonly vehicleId?: string;
  readonly serviceType: string;
  readonly preferredDate: string;
  readonly preferredTimeSlot: string;
  readonly dropoffType: 'customer_dropoff' | 'flatbed_recovery';
  readonly customerNotes?: string;
}

export interface AppointmentResponseDto {
  readonly id: string;
  readonly customerId: string;
  readonly vehicleId?: string;
  readonly serviceType: string;
  readonly preferredDate: string;
  readonly preferredTimeSlot: string;
  readonly dropoffType: string;
  readonly customerNotes: string;
  readonly status: string;
  readonly createdAt: string;
}

export interface ItemDecisionInput {
  readonly itemId: string;
  readonly decision: 'approved' | 'rejected';
  readonly reason?: string;
}

export interface CreateEstimateItemDto {
  readonly id?: string;
  readonly type?: 'part' | 'labor' | 'consumable';
  readonly description: string;
  readonly quantity: number;
  readonly unitPriceFils: number;
  readonly isMandatory?: boolean;
}

export interface CreateEstimateDto {
  readonly jobId: string;
  readonly customerId: string;
  readonly items: readonly CreateEstimateItemDto[];
}

export interface SubmitEstimateDecisionDto {
  readonly estimateId: string;
  readonly decisions: readonly ItemDecisionInput[];
  /** Optional client-provided request token for idempotent replay handling */
  readonly idempotencyKey?: string;
}

export interface EstimateLineItemDto {
  readonly id: string;
  readonly type: string;
  readonly description: string;
  readonly quantity: number;
  readonly unitPriceFils: number;
  readonly lineTotalFils: number;
  readonly unitPriceDisplay: string;
  readonly lineTotalDisplay: string;
  readonly isMandatory: boolean;
  readonly decision?: string;
  readonly customerRejectionReason?: string;
}

export interface EstimateResponseDto {
  readonly id: string;
  readonly jobId: string;
  readonly customerId: string;
  readonly version: number;
  readonly parentEstimateId?: string;
  readonly status: string;
  readonly items: readonly EstimateLineItemDto[];
  readonly subtotalFils: number;
  readonly vatFils: number;
  readonly totalFils: number;
  readonly subtotalDisplay: string;
  readonly vatDisplay: string;
  readonly totalDisplay: string;
  readonly approvedTotalFils: number;
  readonly approvedTotalDisplay: string;
  readonly isActionable: boolean;
  readonly isLocked: boolean;
  readonly createdAt: string;
  readonly lockedAt?: string;
}

export interface JobResponseDto {
  readonly id: string;
  readonly customerId: string;
  readonly vehicleId: string;
  readonly stage: string;
  readonly serviceAdvisorName: string;
  readonly assignedTechnician?: string;
  readonly customerConcern: string;
  readonly diagnosticSummary: string;
  readonly mileageInKm: number;
  readonly estimatedCompletionAt?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface InvoiceLineItemDto {
  readonly itemId: string;
  readonly type: string;
  readonly description: string;
  readonly quantity: number;
  readonly unitPriceFils: number;
  readonly lineTotalFils: number;
  readonly vatFils: number;
  readonly unitPriceDisplay: string;
  readonly lineTotalDisplay: string;
}

export interface InvoiceResponseDto {
  readonly id: string;
  readonly jobId: string;
  readonly customerId: string;
  readonly estimateId: string;
  readonly estimateVersion: number;
  readonly approvalId: string;
  readonly status: string;
  readonly subtotalFils: number;
  readonly vatFils: number;
  readonly totalFils: number;
  readonly subtotalDisplay: string;
  readonly vatDisplay: string;
  readonly totalDisplay: string;
  readonly taxRegistrationNumber?: string;
  readonly supplierName?: string;
  readonly customerName?: string;
  readonly dateOfSupply?: string;
  readonly items?: readonly InvoiceLineItemDto[];
  readonly recordedByStaffId?: string;
  readonly paymentMethod?: string;
  readonly issuedAt: string;
  readonly paidAt?: string;
}
