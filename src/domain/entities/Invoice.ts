import { ApprovalId, CustomerId, EstimateId, InvoiceId, JobId } from '../types.ts';
import { InvoiceStatus, InvoiceStateMachine } from '../stateMachines/InvoiceStateMachine.ts';
import { MoneyAed } from '../valueObjects/MoneyAed.ts';
import { InvariantViolationError } from '../errors/DomainError.ts';

export type PaymentMethod = 'card_online' | 'cash_counter' | 'pos_terminal' | 'bank_transfer';

export interface InvoiceLineItem {
  readonly itemId: string;
  readonly type: 'part' | 'labor' | 'consumable';
  readonly description: string;
  readonly quantity: number;
  readonly unitPriceFils: number;
  readonly lineTotalFils: number;
  readonly vatFils: number;
}

export interface InvoiceProps {
  id: InvoiceId;
  jobId: JobId;
  customerId: CustomerId;
  estimateId: EstimateId;
  estimateVersion: number;
  approvalId: ApprovalId;
  status?: InvoiceStatus;
  subtotal: MoneyAed;
  vat: MoneyAed;
  total: MoneyAed;
  taxRegistrationNumber?: string;
  supplierName?: string;
  customerName?: string;
  dateOfSupply?: string;
  items?: readonly InvoiceLineItem[];
  paymentMethod?: PaymentMethod;
  recordedByStaffId?: string;
  issuedAt?: string;
  paidAt?: string;
}

export class Invoice {
  readonly id: InvoiceId;
  readonly jobId: JobId;
  readonly customerId: CustomerId;
  readonly estimateId: EstimateId;
  readonly estimateVersion: number;
  readonly approvalId: ApprovalId;
  private _status: InvoiceStatus;
  readonly subtotal: MoneyAed;
  readonly vat: MoneyAed;
  readonly total: MoneyAed;
  readonly taxRegistrationNumber?: string;
  readonly supplierName?: string;
  readonly customerName?: string;
  readonly dateOfSupply?: string;
  readonly items: readonly InvoiceLineItem[];
  private _paymentMethod?: PaymentMethod;
  private _recordedByStaffId?: string;
  readonly issuedAt: string;
  private _paidAt?: string;

  constructor(props: InvoiceProps) {
    if (!props.id) throw new InvariantViolationError('InvoiceId cannot be empty');
    if (!props.jobId) throw new InvariantViolationError('Invoice must be linked to a JobId');
    if (!props.customerId) throw new InvariantViolationError('Invoice must be linked to a CustomerId');
    if (!props.approvalId) throw new InvariantViolationError('Invoice must be derived from an ApprovalId');

    this.id = props.id;
    this.jobId = props.jobId;
    this.customerId = props.customerId;
    this.estimateId = props.estimateId;
    this.estimateVersion = props.estimateVersion;
    this.approvalId = props.approvalId;
    this._status = props.status || 'draft';
    this.subtotal = props.subtotal;
    this.vat = props.vat;
    this.total = props.total;
    this.taxRegistrationNumber = props.taxRegistrationNumber;
    this.supplierName = props.supplierName || 'ROCD Auto Care LLC (Dubai)';
    this.customerName = props.customerName;
    this.dateOfSupply = props.dateOfSupply || new Date().toISOString();
    this.items = Object.freeze([...(props.items || [])]);
    this._paymentMethod = props.paymentMethod;
    this._recordedByStaffId = props.recordedByStaffId;
    this.issuedAt = props.issuedAt || new Date().toISOString();
    this._paidAt = props.paidAt;
  }

  get status(): InvoiceStatus {
    return this._status;
  }

  get paymentMethod(): PaymentMethod | undefined {
    return this._paymentMethod;
  }

  get recordedByStaffId(): string | undefined {
    return this._recordedByStaffId;
  }

  get paidAt(): string | undefined {
    return this._paidAt;
  }

  public issue(): void {
    InvoiceStateMachine.assertTransition(this._status, 'issued');
    this._status = 'issued';
  }

  public recordPayment(method: PaymentMethod, staffId?: string): void {
    InvoiceStateMachine.assertTransition(this._status, 'paid');
    this._status = 'paid';
    this._paymentMethod = method;
    this._paidAt = new Date().toISOString();
    if (staffId) {
      this._recordedByStaffId = staffId;
    }
  }

  public voidInvoice(): void {
    InvoiceStateMachine.assertTransition(this._status, 'void');
    this._status = 'void';
  }

  public isOwnedBy(customerId: CustomerId): boolean {
    return this.customerId === customerId;
  }
}
