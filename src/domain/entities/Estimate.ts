import { CustomerId, EstimateId, JobId } from '../types.ts';
import { EstimateStatus, EstimateStateMachine } from '../stateMachines/EstimateStateMachine.ts';
import { MoneyAed } from '../valueObjects/MoneyAed.ts';
import { TaxCalculationService, TaxPolicy, UAE_STANDARD_TAX_POLICY } from '../policies/TaxPolicy.ts';
import { InvariantViolationError } from '../errors/DomainError.ts';

export type EstimateItemType = 'part' | 'labor' | 'consumable';
export type ItemApprovalDecision = 'approved' | 'rejected';

export interface EstimateItem {
  readonly id: string;
  readonly type: EstimateItemType;
  readonly description: string;
  readonly quantity: number;
  readonly unitPrice: MoneyAed;
  readonly lineTotal: MoneyAed;
  readonly isMandatory: boolean;
  readonly decision?: ItemApprovalDecision;
  readonly customerRejectionReason?: string;
}

export interface EstimateProps {
  id: EstimateId;
  jobId: JobId;
  customerId: CustomerId;
  version?: number;
  parentEstimateId?: EstimateId;
  status?: EstimateStatus;
  items: EstimateItem[];
  taxPolicy?: TaxPolicy;
  createdAt?: string;
  lockedAt?: string;
}

export class Estimate {
  readonly id: EstimateId;
  readonly jobId: JobId;
  readonly customerId: CustomerId;
  readonly version: number;
  readonly parentEstimateId?: EstimateId;
  private _status: EstimateStatus;
  private _items: EstimateItem[];
  private _subtotal: MoneyAed;
  private _vat: MoneyAed;
  private _total: MoneyAed;
  private _approvedSubtotal: MoneyAed;
  private _approvedVat: MoneyAed;
  private _approvedTotal: MoneyAed;
  readonly taxPolicy: TaxPolicy;
  readonly createdAt: string;
  private _lockedAt?: string;

  constructor(props: EstimateProps) {
    if (!props.id) throw new InvariantViolationError('EstimateId cannot be empty');
    if (!props.jobId) throw new InvariantViolationError('Estimate must be linked to a JobId');
    if (!props.customerId) throw new InvariantViolationError('Estimate must be linked to a CustomerId');
    if (!props.items || props.items.length === 0) {
      throw new InvariantViolationError('Estimate must contain at least one line item');
    }

    this.id = props.id;
    this.jobId = props.jobId;
    this.customerId = props.customerId;
    this.version = props.version && props.version > 0 ? props.version : 1;
    this.parentEstimateId = props.parentEstimateId;
    this._status = props.status || 'draft';
    this.taxPolicy = props.taxPolicy || UAE_STANDARD_TAX_POLICY;
    this.createdAt = props.createdAt || new Date().toISOString();
    this._lockedAt = props.lockedAt;

    // Validate line items and calculate initial totals
    this._items = props.items.map((item) => {
      if (item.quantity <= 0) {
        throw new InvariantViolationError(`Quantity for item "${item.description}" must be positive`);
      }
      const calculatedLineTotal = item.unitPrice.multiply(item.quantity);
      return {
        ...item,
        lineTotal: calculatedLineTotal,
      };
    });

    // Compute gross estimate totals
    let grossSubtotal = MoneyAed.zero();
    for (const item of this._items) {
      grossSubtotal = grossSubtotal.add(item.lineTotal);
    }
    this._subtotal = grossSubtotal;

    const grossTax = TaxCalculationService.calculate(this._subtotal, this.taxPolicy);
    this._vat = grossTax.vat;
    this._total = grossTax.total;

    // Calculate approved totals based on decisions
    this._approvedSubtotal = MoneyAed.zero();
    this._approvedVat = MoneyAed.zero();
    this._approvedTotal = MoneyAed.zero();
    this.recalculateApprovedTotals();
  }

  get status(): EstimateStatus {
    return this._status;
  }

  get items(): readonly EstimateItem[] {
    return Object.freeze([...this._items]);
  }

  get subtotal(): MoneyAed {
    return this._subtotal;
  }

  get vat(): MoneyAed {
    return this._vat;
  }

  get total(): MoneyAed {
    return this._total;
  }

  get approvedSubtotal(): MoneyAed {
    return this._approvedSubtotal;
  }

  get approvedVat(): MoneyAed {
    return this._approvedVat;
  }

  get approvedTotal(): MoneyAed {
    return this._approvedTotal;
  }

  get lockedAt(): string | undefined {
    return this._lockedAt;
  }

  public submitToCustomer(): void {
    EstimateStateMachine.assertTransition(this._status, 'pending_customer_decision');
    this._status = 'pending_customer_decision';
  }

  /**
   * Applies customer decision to individual line items.
   * This locks the estimate immediately, ensuring immutability.
   */
  public applyCustomerDecision(
    itemDecisions: Array<{ itemId: string; decision: ItemApprovalDecision; reason?: string }>
  ): { targetStatus: EstimateStatus; approvedTotal: MoneyAed } {
    if (!EstimateStateMachine.isActionableByCustomer(this._status)) {
      throw new InvariantViolationError(
        `Estimate ${this.id} is not pending customer decision (current status: ${this._status})`
      );
    }

    const decisionMap = new Map<string, { decision: ItemApprovalDecision; reason?: string }>();
    for (const d of itemDecisions) {
      decisionMap.set(d.itemId, d);
    }

    // Verify all items are accounted for
    for (const item of this._items) {
      if (!decisionMap.has(item.id)) {
        throw new InvariantViolationError(`Decision missing for estimate item ID "${item.id}"`);
      }
    }

    // Update items with customer choices
    let approvedCount = 0;
    let rejectedCount = 0;

    this._items = this._items.map((item) => {
      const dec = decisionMap.get(item.id)!;
      if (dec.decision === 'approved') {
        approvedCount++;
      } else {
        rejectedCount++;
      }
      return {
        ...item,
        decision: dec.decision,
        customerRejectionReason: dec.reason,
      };
    });

    let intermediateStatus: EstimateStatus;
    if (approvedCount === this._items.length) {
      intermediateStatus = 'approved';
    } else if (rejectedCount === this._items.length) {
      intermediateStatus = 'rejected';
    } else {
      intermediateStatus = 'partially_approved';
    }

    EstimateStateMachine.assertTransition(this._status, intermediateStatus);
    this._status = intermediateStatus;

    // Recalculate approved financial totals
    this.recalculateApprovedTotals();

    // Seal and Lock: Once decided, the estimate is locked permanently
    EstimateStateMachine.assertTransition(this._status, 'locked');
    this._status = 'locked';
    this._lockedAt = new Date().toISOString();

    return {
      targetStatus: intermediateStatus,
      approvedTotal: this._approvedTotal,
    };
  }

  private recalculateApprovedTotals(): void {
    let approvedFils = 0;
    for (const item of this._items) {
      if (item.decision === 'approved') {
        approvedFils += item.lineTotal.amountFils;
      }
    }
    this._approvedSubtotal = MoneyAed.fromFils(approvedFils);
    const taxCalc = TaxCalculationService.calculate(this._approvedSubtotal, this.taxPolicy);
    this._approvedVat = taxCalc.vat;
    this._approvedTotal = taxCalc.total;
  }

  public isOwnedBy(customerId: CustomerId): boolean {
    return this.customerId === customerId;
  }
}
