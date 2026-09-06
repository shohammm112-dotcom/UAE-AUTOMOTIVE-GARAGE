import { IJobRepository } from '../../domain/repositories/IJobRepository.ts';
import { IInspectionRepository } from '../../domain/repositories/IInspectionRepository.ts';
import { IVehicleRepository } from '../../domain/repositories/IVehicleRepository.ts';
import { Job } from '../../domain/entities/Job.ts';
import { JobStage } from '../../domain/stateMachines/JobStateMachine.ts';
import { AuthenticatedContext } from '../security/AuthenticatedContext.ts';
import { AuthorizationGuard } from '../security/AuthorizationGuard.ts';
import { JobResponseDto } from '../dto/AppDtos.ts';
import { ResourceNotFoundError } from '../errors/ApplicationError.ts';

export class JobApplicationService {
  constructor(
    private readonly jobRepo: IJobRepository,
    private readonly inspectionRepo: IInspectionRepository,
    private readonly vehicleRepo: IVehicleRepository
  ) {}

  public async listJobsForCustomer(context: AuthenticatedContext): Promise<JobResponseDto[]> {
    AuthorizationGuard.assertAuthenticated(context);
    if (!context.customerId) return [];

    const jobs = await this.jobRepo.findByCustomerId(context.customerId);
    return jobs.map((j) => this.toDto(j));
  }

  public async listJobsForCustomerByStaff(context: AuthenticatedContext, customerId: string): Promise<JobResponseDto[]> {
    AuthorizationGuard.assertStaffRole(context, ["admin", "workshop_manager", "service_advisor", "advisor", "technician", "mechanic"]);
    const jobs = await this.jobRepo.findByCustomerId(customerId);
    return jobs.map((j) => this.toDto(j));
  }

  public async listJobsForVehicleByStaff(context: AuthenticatedContext, vehicleId: string): Promise<JobResponseDto[]> {
    AuthorizationGuard.assertStaffRole(context, ["admin", "workshop_manager", "service_advisor", "advisor", "technician", "mechanic"]);
    const jobs = await this.jobRepo.findByVehicleId(vehicleId);
    return jobs.map((j) => this.toDto(j));
  }

  public async getJobDetails(context: AuthenticatedContext, jobId: string): Promise<JobResponseDto> {
    AuthorizationGuard.assertAuthenticated(context);

    const job = await this.jobRepo.findById(jobId);
    if (!job) {
      throw new ResourceNotFoundError('Job', jobId);
    }

    AuthorizationGuard.assertCustomerOwnsEntity(context, job.customerId, 'Job');
    return this.toDto(job);
  }

  /**
   * Advances the job stage.
   * Gated strictly to authorized staff roles.
   */
  public async advanceJobStage(
    context: AuthenticatedContext,
    jobId: string,
    targetStage: JobStage
  ): Promise<JobResponseDto> {
    AuthorizationGuard.assertStaffRole(context, ['advisor', 'technician', 'workshop_manager', 'admin']);

    const job = await this.jobRepo.findById(jobId);
    if (!job) {
      throw new ResourceNotFoundError('Job', jobId);
    }

    job.advanceStage(targetStage);
    await this.jobRepo.update(job);
    return this.toDto(job);
  }

  private toDto(j: Job): JobResponseDto {
    return {
      id: j.id,
      customerId: j.customerId,
      vehicleId: j.vehicleId,
      stage: j.stage,
      serviceAdvisorName: j.serviceAdvisorName,
      assignedTechnician: j.assignedTechnician,
      customerConcern: j.customerConcern,
      diagnosticSummary: j.diagnosticSummary,
      mileageInKm: j.mileageInKm,
      estimatedCompletionAt: j.estimatedCompletionAt,
      createdAt: j.createdAt,
      updatedAt: j.updatedAt,
    };
  }
}
