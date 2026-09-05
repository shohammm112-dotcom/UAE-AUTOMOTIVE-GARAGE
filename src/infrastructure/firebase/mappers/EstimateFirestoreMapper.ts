import { Estimate, EstimateItemType, ItemApprovalDecision } from '../../../domain/entities/Estimate.ts';
import { EstimateStatus } from '../../../domain/stateMachines/EstimateStateMachine.ts';
import { MoneyAed } from '../../../domain/valueObjects/MoneyAed.ts';
import { TaxPolicy } from '../../../domain/policies/TaxPolicy.ts';

export interface EstimateFirestoreDocument {
  id: string;
  jobId: string;
  customerId: string;
  version: number;
  parentEstimateId?: string;
  status: string;
  items: Array<{
    id: string;
    type: string;
    description: string;
    quantity: number;
    unitPriceFils: number;
    lineTotalFils: number;
    isMandatory: boolean;
    decision?: string;
    customerRejectionReason?: string;
  }>;
  subtotalFils: number;
  vatFils: number;
  totalFils: number;
  approvedSubtotalFils: number;
  approvedVatFils: number;
  approvedTotalFils: number;
  taxPolicy: {
    jurisdiction: string;
    taxRateBasisPoints: number;
    taxRegistrationNumber?: string;
  };
  createdAt: string;
  lockedAt?: string;
}

export class EstimateFirestoreMapper {
  public static toDocument(entity: Estimate): EstimateFirestoreDocument {
    return {
      id: entity.id,
      jobId: entity.jobId,
      customerId: entity.customerId,
      version: entity.version,
      parentEstimateId: entity.parentEstimateId,
      status: entity.status,
      items: entity.items.map((i) => ({
        id: i.id,
        type: i.type,
        description: i.description,
        quantity: i.quantity,
        unitPriceFils: i.unitPrice.amountFils,
        lineTotalFils: i.lineTotal.amountFils,
        isMandatory: i.isMandatory,
        decision: i.decision,
        customerRejectionReason: i.customerRejectionReason,
      })),
      subtotalFils: entity.subtotal.amountFils,
      vatFils: entity.vat.amountFils,
      totalFils: entity.total.amountFils,
      approvedSubtotalFils: entity.approvedSubtotal.amountFils,
      approvedVatFils: entity.approvedVat.amountFils,
      approvedTotalFils: entity.approvedTotal.amountFils,
      taxPolicy: {
        jurisdiction: entity.taxPolicy.jurisdiction,
        taxRateBasisPoints: entity.taxPolicy.taxRateBasisPoints,
        taxRegistrationNumber: entity.taxPolicy.taxRegistrationNumber,
      },
      createdAt: entity.createdAt,
      lockedAt: entity.lockedAt,
    };
  }

  public static toDomain(doc: EstimateFirestoreDocument): Estimate {
    const items = doc.items.map((i) => ({
      id: i.id,
      type: i.type as EstimateItemType,
      description: i.description,
      quantity: i.quantity,
      unitPrice: MoneyAed.fromFils(i.unitPriceFils),
      lineTotal: MoneyAed.fromFils(i.lineTotalFils),
      isMandatory: i.isMandatory,
      decision: i.decision as ItemApprovalDecision | undefined,
      customerRejectionReason: i.customerRejectionReason,
    }));

    const taxPolicy: TaxPolicy = {
      jurisdiction: doc.taxPolicy?.jurisdiction ?? 'UAE',
      taxRateBasisPoints: doc.taxPolicy?.taxRateBasisPoints ?? 500,
      taxRegistrationNumber: doc.taxPolicy?.taxRegistrationNumber ?? 'TRN-100-2026-0001',
    };

    return new Estimate({
      id: doc.id,
      jobId: doc.jobId,
      customerId: doc.customerId,
      version: doc.version,
      parentEstimateId: doc.parentEstimateId,
      status: doc.status as EstimateStatus,
      items,
      taxPolicy,
      createdAt: doc.createdAt,
      lockedAt: doc.lockedAt,
    });
  }
}
