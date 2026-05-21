import { BankTransaction } from '../types';

export interface SystemEntry {
  id: string;
  bank_transaction_ref?: string | null;
  is_reconciled: boolean;
  date: string;
  payment_date?: string | null;
  value: number | string;
  type: 'Entrada' | 'Saída';
}

/** Transactions matching these patterns are investment movements and should be ignored in reconciliation. */
const INVESTMENT_PATTERN = /APLIC|APLICA[ÇC][AÃ]O|APLICACAO|RESGATE/i;

export const isInvestmentMovement = (description: string): boolean =>
  INVESTMENT_PATTERN.test(description);

/**
 * Automates matching between bank statement transactions and system financial entries.
 *
 * Matching Priorities:
 * 0. Investment movements (APLIC/RESGATE) → auto-ignored, no action needed.
 * 1. Exact FITID match (references that were already processed/mapped).
 * 2. Hybrid heuristic match: Same value, matched type (Inflow/Outflow), and payment date difference <= 3 days.
 */
export const autoMatch = (
  parsedDocs: BankTransaction[],
  currentSystemEntries: SystemEntry[]
): BankTransaction[] => {
  return parsedDocs.map(bt => {
    // Priority 0: Auto-ignore investment application/redemption movements
    if (isInvestmentMovement(bt.description)) {
      return { ...bt, status: 'ignored' };
    }

    // Priority 1: Exact FITID Match
    const exactMatch = currentSystemEntries.find(se => se.bank_transaction_ref === bt.fitid);
    if (exactMatch) {
      return {
        ...bt,
        matched_entry_id: exactMatch.id,
        status: exactMatch.is_reconciled ? 'reconciled' : 'matched'
      };
    }

    // Priority 2: Date + Value + Type Match
    const match = currentSystemEntries.find(se => {
      if (se.is_reconciled) return false; // Don't auto-match already reconciled entries unless FITID matches

      const systemDateStr = se.payment_date || se.date;
      if (!systemDateStr) return false;

      // Extract raw date components to avoid timezone offsets causing daily shifts in date calculation
      const systemDate = new Date(systemDateStr);
      const bankDate = new Date(bt.date);

      if (isNaN(systemDate.getTime()) || isNaN(bankDate.getTime())) return false;

      const dateDiffDays = Math.abs(systemDate.getTime() - bankDate.getTime()) / (1000 * 60 * 60 * 24);
      const valueMatch = Math.abs(Number(se.value)) === bt.value;
      const typeMatch =
        (bt.type === 'C' && se.type === 'Entrada') ||
        (bt.type === 'D' && se.type === 'Saída');

      return dateDiffDays <= 3 && valueMatch && typeMatch;
    });

    if (match) {
      return {
        ...bt,
        matched_entry_id: match.id,
        status: 'matched'
      };
    }

    return bt;
  });
};
