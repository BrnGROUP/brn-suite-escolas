import { describe, it, expect } from 'vitest';
import { autoMatch, SystemEntry } from './reconciliationMatcher';
import { BankTransaction } from '../types';

describe('reconciliationMatcher', () => {
  const mockTransactions: BankTransaction[] = [
    {
      id: 'bt-1',
      date: '2026-05-15',
      description: 'FORNECEDOR GAS',
      value: 120.00,
      type: 'D',
      fitid: 'fit-abc-123',
      status: 'new',
      extract_type: 'Conta Corrente'
    },
    {
      id: 'bt-2',
      date: '2026-05-18',
      description: 'REPASSE RECEBIDO',
      value: 5000.00,
      type: 'C',
      fitid: 'fit-xyz-789',
      status: 'new',
      extract_type: 'Conta Corrente'
    },
    {
      id: 'bt-3',
      date: '2026-05-20',
      description: 'COMPRA SEM FITID MATCH',
      value: 450.00,
      type: 'D',
      fitid: 'csv-test-3',
      status: 'pending',
      extract_type: 'Conta Corrente'
    }
  ];

  const mockSystemEntries: SystemEntry[] = [
    // Exact FITID match
    {
      id: 'se-1',
      bank_transaction_ref: 'fit-abc-123',
      is_reconciled: false,
      date: '2026-05-15',
      value: 120.00,
      type: 'Saída'
    },
    // Exact FITID match but already reconciled
    {
      id: 'se-2',
      bank_transaction_ref: 'fit-xyz-789',
      is_reconciled: true,
      date: '2026-05-18',
      value: 5000.00,
      type: 'Entrada'
    },
    // Heuristic match: value matches (450), type matches (Saída), date within 2 days (2026-05-22)
    {
      id: 'se-3',
      bank_transaction_ref: null,
      is_reconciled: false,
      date: '2026-05-22',
      value: 450.00,
      type: 'Saída'
    },
    // Matches value but date is 5 days off (should NOT match)
    {
      id: 'se-4',
      bank_transaction_ref: null,
      is_reconciled: false,
      date: '2026-05-25',
      value: 450.00,
      type: 'Saída'
    }
  ];

  it('should match exactly when fitid is present in both bank transaction and system entry', () => {
    const result = autoMatch([mockTransactions[0]!], mockSystemEntries);
    expect(result[0]!.matched_entry_id).toBe('se-1');
    expect(result[0]!.status).toBe('matched');
  });

  it('should mark as reconciled if the matching fitid entry is already reconciled', () => {
    const result = autoMatch([mockTransactions[1]!], mockSystemEntries);
    expect(result[0]!.matched_entry_id).toBe('se-2');
    expect(result[0]!.status).toBe('reconciled');
  });

  it('should fallback to heuristic match on date/value/type within 3 days window', () => {
    const result = autoMatch([mockTransactions[2]!], mockSystemEntries);
    expect(result[0]!.matched_entry_id).toBe('se-3');
    expect(result[0]!.status).toBe('matched');
  });

  it('should not match if date difference is greater than 3 days', () => {
    const noMatchTransaction: BankTransaction = {
      ...mockTransactions[2]!,
      date: '2026-05-10' // 12 days difference from se-3 (2026-05-22)
    };
    const result = autoMatch([noMatchTransaction], mockSystemEntries);
    expect(result[0]!.matched_entry_id).toBeUndefined();
    expect(result[0]!.status).toBe('pending');
  });

  it('should not match if transaction types do not match (Entrada vs Saída)', () => {
    const typeMismatchTransaction: BankTransaction = {
      ...mockTransactions[2]!,
      type: 'C' // Credit (Entrada) but se-3 is Debit (Saída)
    };
    const result = autoMatch([typeMismatchTransaction], mockSystemEntries);
    expect(result[0]!.matched_entry_id).toBeUndefined();
  });
});
