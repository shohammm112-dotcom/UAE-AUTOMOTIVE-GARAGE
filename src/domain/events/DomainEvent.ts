export interface DomainEvent {
  readonly eventName: string;
  readonly occurredAt: string;
  readonly payload: Record<string, unknown>;
}

export interface IEventBus {
  publish(event: DomainEvent): Promise<void>;
  subscribe(eventName: string, handler: (event: DomainEvent) => Promise<void> | void): void;
}

export class EstimateSubmittedEvent implements DomainEvent {
  readonly eventName = 'EstimateSubmitted';
  readonly occurredAt = new Date().toISOString();
  constructor(public readonly payload: { estimateId: string; customerId: string; version: number }) {}
}

export class EstimateApprovedEvent implements DomainEvent {
  readonly eventName = 'EstimateApproved';
  readonly occurredAt = new Date().toISOString();
  constructor(
    public readonly payload: {
      estimateId: string;
      approvalId: string;
      customerId: string;
      approvedTotalFils: number;
    }
  ) {}
}

export class EstimateRejectedEvent implements DomainEvent {
  readonly eventName = 'EstimateRejected';
  readonly occurredAt = new Date().toISOString();
  constructor(public readonly payload: { estimateId: string; customerId: string }) {}
}

export class JobStageChangedEvent implements DomainEvent {
  readonly eventName = 'JobStageChanged';
  readonly occurredAt = new Date().toISOString();
  constructor(
    public readonly payload: {
      jobId: string;
      customerId: string;
      fromStage: string;
      toStage: string;
    }
  ) {}
}

export class InvoiceIssuedEvent implements DomainEvent {
  readonly eventName = 'InvoiceIssued';
  readonly occurredAt = new Date().toISOString();
  constructor(
    public readonly payload: {
      invoiceId: string;
      customerId: string;
      jobId: string;
      totalFils: number;
    }
  ) {}
}

export class VehicleReadyForDeliveryEvent implements DomainEvent {
  readonly eventName = 'VehicleReadyForDelivery';
  readonly occurredAt = new Date().toISOString();
  constructor(public readonly payload: { jobId: string; customerId: string; vehicleId: string }) {}
}
