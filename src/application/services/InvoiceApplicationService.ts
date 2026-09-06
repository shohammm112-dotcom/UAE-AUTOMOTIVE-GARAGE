import { IInvoiceRepository } from '../../domain/repositories/IInvoiceRepository.ts';
import { IApprovalRepository } from '../../domain/repositories/IApprovalRepository.ts';
import { IEstimateRepository } from '../../domain/repositories/IEstimateRepository.ts';
import { ICustomerRepository } from '../../domain/repositories/ICustomerRepository.ts';
import { IEventBus, InvoiceIssuedEvent } from '../../domain/events/DomainEvent.ts';
import { Invoice, PaymentMethod } from '../../domain/entities/Invoice.ts';
import { MoneyAed } from '../../domain/valueObjects/MoneyAed.ts';
import { AuthenticatedContext } from '../security/AuthenticatedContext.ts';
import { AuthorizationGuard } from '../security/AuthorizationGuard.ts';
import { InvoiceResponseDto } from '../dto/AppDtos.ts';
import { ResourceNotFoundError, ValidationFailedError } from '../errors/ApplicationError.ts';

export class InvoiceApplicationService {
  constructor(
    private readonly invoiceRepo: IInvoiceRepository,
    private readonly approvalRepo: IApprovalRepository,
    private readonly estimateRepo: IEstimateRepository,
    private readonly eventBus?: IEventBus,
    private readonly customerRepo?: ICustomerRepository
  ) {}

  public async listInvoicesForCustomer(context: AuthenticatedContext): Promise<InvoiceResponseDto[]> {
    AuthorizationGuard.assertAuthenticated(context);
    if (!context.customerId) return [];

    const invoices = await this.invoiceRepo.findByCustomerId(context.customerId);
    return invoices.map((inv) => this.toDto(inv));
  }

  public async getAllInvoices(context: AuthenticatedContext): Promise<InvoiceResponseDto[]> {
    AuthorizationGuard.assertStaffRole(context, ["admin", "workshop_manager", "service_advisor", "advisor", "technician", "mechanic"]);
    const invoices = await this.invoiceRepo.listAll();
    return invoices.map((inv) => this.toDto(inv));
  }

  public async getInvoiceById(
    context: AuthenticatedContext,
    invoiceId: string
  ): Promise<InvoiceResponseDto> {
    AuthorizationGuard.assertAuthenticated(context);

    const invoice = await this.invoiceRepo.findById(invoiceId);
    if (!invoice) {
      throw new ResourceNotFoundError('Invoice', invoiceId);
    }

    AuthorizationGuard.assertCustomerOwnsEntity(context, invoice.customerId, 'Invoice');
    return this.toDto(invoice);
  }

  /**
   * Generates an authoritative Invoice derived from an approved commercial record.
   * Restricted strictly to garage staff roles. Customers cannot invoke this.
   *
   * Enforces SEC-CRIT-01: Invariant ONE APPROVAL -> AT MOST ONE AUTHORITATIVE INVOICE.
   * If an invoice already exists for the approval, returns it idempotently without re-creating.
   */
  public async generateInvoiceFromApproval(
    context: AuthenticatedContext,
    approvalId: string
  ): Promise<InvoiceResponseDto> {
    AuthorizationGuard.assertStaffRole(context, ['advisor', 'service_advisor', 'workshop_manager', 'admin']);

    // 1. Idempotency fast-path: Check if an authoritative invoice already exists
    const existingInvoice = await this.invoiceRepo.findByApprovalId(approvalId);
    if (existingInvoice) {
      return this.toDto(existingInvoice);
    }

    const approval = await this.approvalRepo.findById(approvalId);
    if (!approval) {
      throw new ResourceNotFoundError('ApprovalRecord', approvalId);
    }

    const estimate = await this.estimateRepo.findById(approval.estimateId);
    if (!estimate) {
      throw new ResourceNotFoundError('Estimate', approval.estimateId);
    }

    if (approval.approvedTotalFils <= 0) {
      throw new ValidationFailedError(
        `Cannot issue invoice for approval ${approvalId} with total 0 fils (all items were rejected)`
      );
    }

    // Build line items snapshot from approved items
    const approvedLineItems = approval.lineItemsSnapshot
      .filter((item) => item.approved)
      .map((item) => ({
        itemId: item.itemId,
        type: item.type,
        description: item.description,
        quantity: item.quantity,
        unitPriceFils: item.unitPriceFils,
        lineTotalFils: item.lineTotalFils,
        vatFils: Math.round(item.lineTotalFils * 0.05),
      }));

    let customerName: string | undefined;
    if (this.customerRepo) {
      const customer = await this.customerRepo.findById(approval.customerId);
      if (customer) {
        customerName = customer.fullName;
      }
    }

    const invoiceId = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const invoice = new Invoice({
      id: invoiceId,
      jobId: estimate.jobId,
      customerId: approval.customerId,
      customerName,
      estimateId: approval.estimateId,
      estimateVersion: approval.estimateVersion,
      approvalId: approval.id,
      status: 'issued',
      subtotal: MoneyAed.fromFils(approval.approvedSubtotalFils),
      vat: MoneyAed.fromFils(approval.approvedVatFils),
      total: MoneyAed.fromFils(approval.approvedTotalFils),
      taxRegistrationNumber: estimate.taxPolicy.taxRegistrationNumber,
      supplierName: 'ROCD Auto Care LLC (Dubai)',
      dateOfSupply: new Date().toISOString(),
      items: approvedLineItems,
      recordedByStaffId: context.staffId || context.authenticatedProviderUid || 'staff_authorized',
    });

    try {
      await this.invoiceRepo.save(invoice);
    } catch (err: any) {
      // In concurrent race conditions, if another thread completed first, return the authoritative invoice idempotently
      if (err.message && (err.message.includes('already been') || err.message.includes('CONCURRENCY_CONFLICT'))) {
        const concurrentInvoice = await this.invoiceRepo.findByApprovalId(approvalId);
        if (concurrentInvoice) {
          return this.toDto(concurrentInvoice);
        }
      }
      throw err;
    }

    if (this.eventBus) {
      await this.eventBus.publish(
        new InvoiceIssuedEvent({
          invoiceId: invoice.id,
          customerId: invoice.customerId,
          jobId: invoice.jobId,
          totalFils: invoice.total.amountFils,
        })
      );
    }

    return this.toDto(invoice);
  }

  /**
   * Records payment received against an invoice.
   * Gated strictly to staff with staff audit capture.
   */
  public async recordPayment(
    context: AuthenticatedContext,
    invoiceId: string,
    method: PaymentMethod
  ): Promise<InvoiceResponseDto> {
    AuthorizationGuard.assertStaffRole(context, ['advisor', 'service_advisor', 'workshop_manager', 'admin']);

    const invoice = await this.invoiceRepo.findById(invoiceId);
    if (!invoice) {
      throw new ResourceNotFoundError('Invoice', invoiceId);
    }

    const recordedStaffId =
      context.staffId ||
      context.authenticatedProviderUid ||
      (context.actorType === 'staff' ? 'staff_session' : undefined);
    if (!recordedStaffId) {
      throw new ValidationFailedError('An identifiable staff ID or provider UID is required to record payment');
    }
    invoice.recordPayment(method, recordedStaffId);
    await this.invoiceRepo.update(invoice);
    return this.toDto(invoice);
  }

  private toDto(inv: Invoice): InvoiceResponseDto {
    return {
      id: inv.id,
      jobId: inv.jobId,
      customerId: inv.customerId,
      estimateId: inv.estimateId,
      estimateVersion: inv.estimateVersion,
      approvalId: inv.approvalId,
      status: inv.status,
      subtotalFils: inv.subtotal.amountFils,
      vatFils: inv.vat.amountFils,
      totalFils: inv.total.amountFils,
      subtotalDisplay: inv.subtotal.toDisplayString(),
      vatDisplay: inv.vat.toDisplayString(),
      totalDisplay: inv.total.toDisplayString(),
      taxRegistrationNumber: inv.taxRegistrationNumber,
      supplierName: inv.supplierName,
      customerName: inv.customerName,
      dateOfSupply: inv.dateOfSupply,
      recordedByStaffId: inv.recordedByStaffId,
      items: inv.items.map((i) => ({
        itemId: i.itemId,
        type: i.type,
        description: i.description,
        quantity: i.quantity,
        unitPriceFils: i.unitPriceFils,
        lineTotalFils: i.lineTotalFils,
        vatFils: i.vatFils,
        unitPriceDisplay: MoneyAed.fromFils(i.unitPriceFils).toDisplayString(),
        lineTotalDisplay: MoneyAed.fromFils(i.lineTotalFils).toDisplayString(),
      })),
      paymentMethod: inv.paymentMethod,
      issuedAt: inv.issuedAt,
      paidAt: inv.paidAt,
    };
  }
}
