import { AppointmentId, CustomerId, JobId, VehicleId } from '../types.ts';
import { JobStage, JobStateMachine } from '../stateMachines/JobStateMachine.ts';
import { InvariantViolationError } from '../errors/DomainError.ts';

export interface JobProps {
  id: JobId;
  customerId: CustomerId;
  vehicleId: VehicleId;
  appointmentId?: AppointmentId;
  stage?: JobStage;
  serviceAdvisorName: string;
  assignedTechnician?: string;
  customerConcern: string;
  diagnosticSummary?: string;
  mileageInKm: number;
  estimatedCompletionAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export class Job {
  readonly id: JobId;
  readonly customerId: CustomerId;
  readonly vehicleId: VehicleId;
  readonly appointmentId?: AppointmentId;
  private _stage: JobStage;
  private _serviceAdvisorName: string;
  private _assignedTechnician?: string;
  readonly customerConcern: string;
  private _diagnosticSummary: string;
  readonly mileageInKm: number;
  private _estimatedCompletionAt?: string;
  readonly createdAt: string;
  private _updatedAt: string;

  constructor(props: JobProps) {
    if (!props.id) throw new InvariantViolationError('JobId cannot be empty');
    if (!props.customerId) throw new InvariantViolationError('Job must be associated with a CustomerId');
    if (!props.vehicleId) throw new InvariantViolationError('Job must be associated with a VehicleId');
    if (props.mileageInKm < 0) throw new InvariantViolationError('Mileage cannot be negative');

    this.id = props.id;
    this.customerId = props.customerId;
    this.vehicleId = props.vehicleId;
    this.appointmentId = props.appointmentId;
    this._stage = props.stage || 'intake_checkin';
    this._serviceAdvisorName = props.serviceAdvisorName || 'Lead Service Advisor';
    this._assignedTechnician = props.assignedTechnician;
    this.customerConcern = props.customerConcern ? props.customerConcern.trim() : 'General service';
    this._diagnosticSummary = props.diagnosticSummary ? props.diagnosticSummary.trim() : '';
    this.mileageInKm = Math.round(props.mileageInKm);
    this._estimatedCompletionAt = props.estimatedCompletionAt;
    const now = new Date().toISOString();
    this.createdAt = props.createdAt || now;
    this._updatedAt = props.updatedAt || now;
  }

  get stage(): JobStage {
    return this._stage;
  }

  get serviceAdvisorName(): string {
    return this._serviceAdvisorName;
  }

  get assignedTechnician(): string | undefined {
    return this._assignedTechnician;
  }

  get diagnosticSummary(): string {
    return this._diagnosticSummary;
  }

  get estimatedCompletionAt(): string | undefined {
    return this._estimatedCompletionAt;
  }

  get updatedAt(): string {
    return this._updatedAt;
  }

  /**
   * Advances the job stage in accordance with workshop lifecycle transitions.
   * Customers cannot call this method; access is gated by Application Services.
   */
  public advanceStage(targetStage: JobStage): void {
    JobStateMachine.assertTransition(this._stage, targetStage);
    this._stage = targetStage;
    this._updatedAt = new Date().toISOString();
  }

  public updateDiagnostics(summary: string): void {
    this._diagnosticSummary = summary.trim();
    this._updatedAt = new Date().toISOString();
  }

  public assignTechnician(technicianName: string): void {
    this._assignedTechnician = technicianName.trim();
    this._updatedAt = new Date().toISOString();
  }

  public isOwnedBy(customerId: CustomerId): boolean {
    return this.customerId === customerId;
  }
}
