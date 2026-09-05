import { ApprovalId, CustomerId, EstimateId } from '../types.ts';
import { InvariantViolationError } from '../errors/DomainError.ts';

export interface EstimateSnapshotItem {
  readonly itemId: string;
  readonly type: 'part' | 'labor' | 'consumable';
  readonly description: string;
  readonly quantity: number;
  readonly unitPriceFils: number;
  readonly lineTotalFils: number;
  readonly isMandatory: boolean;
  readonly approved: boolean;
  readonly customerRejectionReason?: string;
}

export interface ApprovalRecordProps {
  id: ApprovalId;
  estimateId: EstimateId;
  estimateVersion: number;
  customerId: CustomerId;
  authenticatedProviderUid: string;
  approvedItemIds: string[];
  rejectedItemIds: string[];
  lineItemsSnapshot: EstimateSnapshotItem[];
  approvedSubtotalFils: number;
  approvedVatFils: number;
  approvedTotalFils: number;
  idempotencyKey?: string;
  serverTimestamp?: string;
  serverRecordedIp?: string;
  userAgent?: string;
}

export class ApprovalRecord {
  readonly id: ApprovalId;
  readonly estimateId: EstimateId;
  readonly estimateVersion: number;
  readonly customerId: CustomerId;
  readonly authenticatedProviderUid: string;
  readonly approvedItemIds: readonly string[];
  readonly rejectedItemIds: readonly string[];
  readonly lineItemsSnapshot: readonly EstimateSnapshotItem[];
  readonly approvedSubtotalFils: number;
  readonly approvedVatFils: number;
  readonly approvedTotalFils: number;
  readonly idempotencyKey?: string;
  readonly serverTimestamp: string;
  readonly serverRecordedIp: string;
  readonly userAgent: string;

  constructor(props: ApprovalRecordProps) {
    if (!props.id) throw new InvariantViolationError('ApprovalId cannot be empty');
    if (!props.estimateId) throw new InvariantViolationError('ApprovalRecord must be tied to an EstimateId');
    if (!props.customerId) throw new InvariantViolationError('ApprovalRecord must be tied to a CustomerId');
    if (!props.lineItemsSnapshot || props.lineItemsSnapshot.length === 0) {
      throw new InvariantViolationError('ApprovalRecord must contain a line items snapshot');
    }

    this.id = props.id;
    this.estimateId = props.estimateId;
    this.estimateVersion = props.estimateVersion;
    this.customerId = props.customerId;
    this.authenticatedProviderUid = props.authenticatedProviderUid || 'unspecified_provider_uid';
    this.approvedItemIds = Object.freeze([...props.approvedItemIds]);
    this.rejectedItemIds = Object.freeze([...props.rejectedItemIds]);
    this.lineItemsSnapshot = Object.freeze([...props.lineItemsSnapshot]);
    this.approvedSubtotalFils = props.approvedSubtotalFils;
    this.approvedVatFils = props.approvedVatFils;
    this.approvedTotalFils = props.approvedTotalFils;
    this.idempotencyKey = props.idempotencyKey;
    this.serverTimestamp = props.serverTimestamp || new Date().toISOString();
    this.serverRecordedIp = props.serverRecordedIp || '127.0.0.1';
    this.userAgent = props.userAgent || 'unknown';
  }

  public isOwnedBy(customerId: CustomerId): boolean {
    return this.customerId === customerId;
  }
}
