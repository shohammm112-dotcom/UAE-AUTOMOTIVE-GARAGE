import { Invoice, PaymentMethod } from '../../../domain/entities/Invoice.ts';
import { InvoiceStatus } from '../../../domain/stateMachines/InvoiceStateMachine.ts';
import { MoneyAed } from '../../../domain/valueObjects/MoneyAed.ts';

export interface InvoiceFirestoreDocument {
  id: string;
  jobId: string;
  customerId: string;
  estimateId: string;
  estimateVersion: number;
  approvalId: string;
  status: string;
  subtotalFils: number;
  vatFils: number;
  totalFils: number;
  taxRegistrationNumber?: string;
  supplierName?: string;
  customerName?: string;
  dateOfSupply?: string;
  items?: any[];
  paymentMethod?: string;
  recordedByStaffId?: string;
  issuedAt: string;
  paidAt?: string;
}

export class InvoiceFirestoreMapper {
  public static toDocument(entity: Invoice): InvoiceFirestoreDocument {
    return {
      id: entity.id,
      jobId: entity.jobId,
      customerId: entity.customerId,
      estimateId: entity.estimateId,
      estimateVersion: entity.estimateVersion,
      approvalId: entity.approvalId,
      status: entity.status,
      subtotalFils: entity.subtotal.amountFils,
      vatFils: entity.vat.amountFils,
      totalFils: entity.total.amountFils,
      taxRegistrationNumber: entity.taxRegistrationNumber,
      supplierName: entity.supplierName,
      customerName: entity.customerName,
      dateOfSupply: entity.dateOfSupply,
      items: [...entity.items],
      paymentMethod: entity.paymentMethod,
      recordedByStaffId: entity.recordedByStaffId,
      issuedAt: entity.issuedAt,
      paidAt: entity.paidAt,
    };
  }

  public static toDomain(doc: InvoiceFirestoreDocument): Invoice {
    return new Invoice({
      id: doc.id,
      jobId: doc.jobId,
      customerId: doc.customerId,
      estimateId: doc.estimateId,
      estimateVersion: doc.estimateVersion,
      approvalId: doc.approvalId,
      status: doc.status as InvoiceStatus,
      subtotal: MoneyAed.fromFils(doc.subtotalFils),
      vat: MoneyAed.fromFils(doc.vatFils),
      total: MoneyAed.fromFils(doc.totalFils),
      taxRegistrationNumber: doc.taxRegistrationNumber,
      supplierName: doc.supplierName,
      customerName: doc.customerName,
      dateOfSupply: doc.dateOfSupply,
      items: doc.items || [],
      paymentMethod: doc.paymentMethod as PaymentMethod | undefined,
      recordedByStaffId: doc.recordedByStaffId,
      issuedAt: doc.issuedAt,
      paidAt: doc.paidAt,
    });
  }
}
