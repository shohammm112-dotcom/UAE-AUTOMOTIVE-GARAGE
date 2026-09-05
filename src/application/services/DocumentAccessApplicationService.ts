import { AuthenticatedContext } from '../security/AuthenticatedContext.ts';
import { AuthorizationGuard } from '../security/AuthorizationGuard.ts';
import { IDocumentStorageService } from '../ports/IDocumentStorageService.ts';
import { IJobRepository } from '../../domain/repositories/IJobRepository.ts';
import { IInspectionRepository } from '../../domain/repositories/IInspectionRepository.ts';
import { IInvoiceRepository } from '../../domain/repositories/IInvoiceRepository.ts';
import { ResourceNotFoundError, ValidationFailedError } from '../errors/ApplicationError.ts';

export interface DocumentAccessResponseDto {
  readonly documentId: string;
  readonly downloadUrl: string;
  readonly expiresAt: string;
}

export class DocumentAccessApplicationService {
  constructor(
    private readonly storageService: IDocumentStorageService,
    private readonly jobRepo: IJobRepository,
    private readonly inspectionRepo: IInspectionRepository,
    private readonly invoiceRepo: IInvoiceRepository
  ) {}

  /**
   * Authorizes access to a private document (e.g. inspection photo, invoice PDF)
   * only after verifying authenticated customer owns the parent business resource.
   */
  public async getSecureDocumentUrl(
    context: AuthenticatedContext,
    params: {
      parentResourceType: 'job' | 'inspection' | 'invoice';
      parentResourceId: string;
      documentKey: string;
    }
  ): Promise<DocumentAccessResponseDto> {
    AuthorizationGuard.assertAuthenticated(context);

    if (!params.documentKey || params.documentKey.includes('..') || params.documentKey.startsWith('/')) {
      throw new ValidationFailedError('Invalid or unsafe document key requested');
    }

    let storageKey = '';

    if (params.parentResourceType === 'job') {
      const job = await this.jobRepo.findById(params.parentResourceId);
      if (!job) {
        throw new ResourceNotFoundError('Job', params.parentResourceId);
      }
      AuthorizationGuard.assertCustomerOwnsEntity(context, job.customerId, 'Job Document');
      storageKey = `jobs/${job.id}/${params.documentKey}`;
    } else if (params.parentResourceType === 'inspection') {
      const inspection = await this.inspectionRepo.findById(params.parentResourceId);
      if (!inspection) {
        throw new ResourceNotFoundError('InspectionReport', params.parentResourceId);
      }
      const job = await this.jobRepo.findById(inspection.jobId);
      if (!job) {
        throw new ResourceNotFoundError('Job', inspection.jobId);
      }
      AuthorizationGuard.assertCustomerOwnsEntity(context, job.customerId, 'Inspection Document');

      // Verify the requested media key actually belongs to one of the report findings
      const validKeys = inspection.findings.flatMap((f) => f.mediaStorageKeys);
      if (!validKeys.includes(params.documentKey)) {
        throw new ResourceNotFoundError('Document', params.documentKey);
      }
      storageKey = params.documentKey;
    } else if (params.parentResourceType === 'invoice') {
      const invoice = await this.invoiceRepo.findById(params.parentResourceId);
      if (!invoice) {
        throw new ResourceNotFoundError('Invoice', params.parentResourceId);
      }
      AuthorizationGuard.assertCustomerOwnsEntity(context, invoice.customerId, 'Invoice Document');
      storageKey = `invoices/${invoice.id}/${params.documentKey}`;
    } else {
      throw new ValidationFailedError(`Unsupported parent resource type: ${params.parentResourceType}`);
    }

    const expiresInSeconds = 900; // 15 minutes short-lived
    const downloadUrl = await this.storageService.generateSignedAccessUrl(storageKey, expiresInSeconds);
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();

    return {
      documentId: params.documentKey,
      downloadUrl,
      expiresAt,
    };
  }
}
