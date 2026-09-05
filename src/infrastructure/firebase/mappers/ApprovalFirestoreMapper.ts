import { ApprovalRecord, EstimateSnapshotItem } from '../../../domain/entities/ApprovalRecord.ts';

export interface ApprovalFirestoreDocument {
  id: string;
  estimateId: string;
  estimateVersion: number;
  customerId: string;
  authenticatedProviderUid: string;
  approvedItemIds: string[];
  rejectedItemIds: string[];
  lineItemsSnapshot: Array<{
    itemId: string;
    type: 'part' | 'labor' | 'consumable';
    description: string;
    quantity: number;
    unitPriceFils: number;
    lineTotalFils: number;
    isMandatory: boolean;
    approved: boolean;
    customerRejectionReason?: string;
  }>;
  approvedSubtotalFils: number;
  approvedVatFils: number;
  approvedTotalFils: number;
  idempotencyKey?: string;
  serverTimestamp: string;
  serverRecordedIp: string;
  userAgent: string;
}

export class ApprovalFirestoreMapper {
  public static toDocument(entity: ApprovalRecord): ApprovalFirestoreDocument {
    return {
      id: entity.id,
      estimateId: entity.estimateId,
      estimateVersion: entity.estimateVersion,
      customerId: entity.customerId,
      authenticatedProviderUid: entity.authenticatedProviderUid,
      approvedItemIds: [...entity.approvedItemIds],
      rejectedItemIds: [...entity.rejectedItemIds],
      lineItemsSnapshot: entity.lineItemsSnapshot.map((s) => ({ ...s })),
      approvedSubtotalFils: entity.approvedSubtotalFils,
      approvedVatFils: entity.approvedVatFils,
      approvedTotalFils: entity.approvedTotalFils,
      idempotencyKey: entity.idempotencyKey,
      serverTimestamp: entity.serverTimestamp,
      serverRecordedIp: entity.serverRecordedIp,
      userAgent: entity.userAgent,
    };
  }

  public static toDomain(doc: ApprovalFirestoreDocument): ApprovalRecord {
    return new ApprovalRecord({
      id: doc.id,
      estimateId: doc.estimateId,
      estimateVersion: doc.estimateVersion,
      customerId: doc.customerId,
      authenticatedProviderUid: doc.authenticatedProviderUid,
      approvedItemIds: doc.approvedItemIds,
      rejectedItemIds: doc.rejectedItemIds,
      lineItemsSnapshot: doc.lineItemsSnapshot as EstimateSnapshotItem[],
      approvedSubtotalFils: doc.approvedSubtotalFils,
      approvedVatFils: doc.approvedVatFils,
      approvedTotalFils: doc.approvedTotalFils,
      idempotencyKey: doc.idempotencyKey,
      serverTimestamp: doc.serverTimestamp,
      serverRecordedIp: doc.serverRecordedIp,
      userAgent: doc.userAgent,
    });
  }
}
