import { Invoice } from '../entities/Invoice.ts';
import { ApprovalId, CustomerId, InvoiceId, JobId } from '../types.ts';

export interface IInvoiceRepository {
  findById(id: InvoiceId): Promise<Invoice | null>;
  findByJobId(jobId: JobId): Promise<Invoice | null>;
  findByCustomerId(customerId: CustomerId): Promise<Invoice[]>;
  findByApprovalId(approvalId: ApprovalId): Promise<Invoice | null>;
  listAll(): Promise<Invoice[]>;
  save(invoice: Invoice): Promise<void>;
  update(invoice: Invoice): Promise<void>;
}
