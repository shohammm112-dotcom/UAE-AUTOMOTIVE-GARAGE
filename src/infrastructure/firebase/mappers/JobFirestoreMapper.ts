import { Job } from '../../../domain/entities/Job.ts';
import { JobStage } from '../../../domain/stateMachines/JobStateMachine.ts';

export interface JobFirestoreDocument {
  id: string;
  customerId: string;
  vehicleId: string;
  appointmentId?: string;
  stage: string;
  serviceAdvisorName: string;
  assignedTechnician?: string;
  customerConcern: string;
  diagnosticSummary: string;
  mileageInKm: number;
  estimatedCompletionAt?: string;
  createdAt: string;
  updatedAt: string;
}

export class JobFirestoreMapper {
  public static toDocument(entity: Job): JobFirestoreDocument {
    return {
      id: entity.id,
      customerId: entity.customerId,
      vehicleId: entity.vehicleId,
      appointmentId: entity.appointmentId,
      stage: entity.stage,
      serviceAdvisorName: entity.serviceAdvisorName,
      assignedTechnician: entity.assignedTechnician,
      customerConcern: entity.customerConcern,
      diagnosticSummary: entity.diagnosticSummary,
      mileageInKm: entity.mileageInKm,
      estimatedCompletionAt: entity.estimatedCompletionAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  public static toDomain(doc: JobFirestoreDocument): Job {
    return new Job({
      id: doc.id,
      customerId: doc.customerId,
      vehicleId: doc.vehicleId,
      appointmentId: doc.appointmentId,
      stage: doc.stage as JobStage,
      serviceAdvisorName: doc.serviceAdvisorName,
      assignedTechnician: doc.assignedTechnician,
      customerConcern: doc.customerConcern,
      diagnosticSummary: doc.diagnosticSummary,
      mileageInKm: doc.mileageInKm,
      estimatedCompletionAt: doc.estimatedCompletionAt,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}
