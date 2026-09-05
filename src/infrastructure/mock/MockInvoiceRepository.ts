import { IInvoiceRepository } from '../../domain/repositories/IInvoiceRepository.ts';
import { Invoice } from '../../domain/entities/Invoice.ts';
import { ApprovalId, CustomerId, InvoiceId, JobId } from '../../domain/types.ts';

export class MockInvoiceRepository implements IInvoiceRepository {
  private readonly store = new Map<InvoiceId, Invoice>();
  private readonly approvalToInvoiceId = new Map<ApprovalId, InvoiceId>();

  public async findById(id: InvoiceId): Promise<Invoice | null> {
    return this.store.get(id) || null;
  }

  public async findByJobId(jobId: JobId): Promise<Invoice | null> {
    for (const inv of this.store.values()) {
      if (inv.jobId === jobId) {
        return inv;
      }
    }
    return null;
  }

  public async findByCustomerId(customerId: CustomerId): Promise<Invoice[]> {
    const results: Invoice[] = [];
    for (const inv of this.store.values()) {
      if (inv.customerId === customerId) {
        results.push(inv);
      }
    }
    return results.sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime());
  }

  public async findByApprovalId(approvalId: ApprovalId): Promise<Invoice | null> {
    for (const inv of this.store.values()) {
      if (inv.approvalId === approvalId) {
        return inv;
      }
    }
    return null;
  }

  public async save(invoice: Invoice): Promise<void> {
    const existingId = this.approvalToInvoiceId.get(invoice.approvalId);
    if (existingId && existingId !== invoice.id) {
      throw new Error(
        `CONCURRENCY_CONFLICT: An invoice (${existingId}) has already been generated for approval ${invoice.approvalId}`
      );
    }
    this.approvalToInvoiceId.set(invoice.approvalId, invoice.id);
    this.store.set(invoice.id, invoice);
  }

  public async update(invoice: Invoice): Promise<void> {
    this.store.set(invoice.id, invoice);
  }

  public clear(): void {
    this.store.clear();
    this.approvalToInvoiceId.clear();
  }
}

