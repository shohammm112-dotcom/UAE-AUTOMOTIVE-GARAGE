import { InvalidStateTransitionError } from '../errors/DomainError.ts';

export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'void';

export class InvoiceStateMachine {
  private static readonly LEGAL_TRANSITIONS: Record<InvoiceStatus, InvoiceStatus[]> = {
    draft: ['issued', 'void'],
    issued: ['paid', 'void'],
    paid: [], // Terminal
    void: [], // Terminal
  };

  public static canTransition(current: InvoiceStatus, target: InvoiceStatus): boolean {
    const allowed = this.LEGAL_TRANSITIONS[current] || [];
    return allowed.includes(target);
  }

  public static assertTransition(current: InvoiceStatus, target: InvoiceStatus): void {
    if (!this.canTransition(current, target)) {
      throw new InvalidStateTransitionError('Invoice', current, target);
    }
  }
}
