import { describe, it, expect } from 'vitest';
import { calculateFinancialStats, EntryLike } from './financialCalculations';
import { TransactionStatus } from '../types';

describe('calculateFinancialStats', () => {
  it('should return zeros for empty list', () => {
    const stats = calculateFinancialStats([]);
    expect(stats).toEqual({
      receita: 0,
      despesa: 0,
      pendencias: 0,
      repasses: 0,
      rendimentos: 0,
      tarifas: 0,
      impostosDevolucoes: 0,
      reprogramado: 0,
      saldo: 0,
      totalDisponivel: 0,
    });
  });

  it('should calculate inputs and outputs correctly', () => {
    const entries: EntryLike[] = [
      { value: 1000, type: 'Entrada', status: TransactionStatus.RECEBIDO, category: 'Repasse / Crédito' },
      { value: 200, type: 'Saída', status: TransactionStatus.PAGO, category: 'Tarifa Bancária' },
      { value: 150, type: 'Saída', status: TransactionStatus.PENDENTE, category: 'Material de Consumo' },
      { value: 50.5, type: 'Entrada', status: TransactionStatus.RECEBIDO, category: 'Rendimento de Aplicação' },
    ];

    const stats = calculateFinancialStats(entries, 500);

    expect(stats.receita).toBe(1050.5);
    expect(stats.despesa).toBe(350);
    expect(stats.pendencias).toBe(1);
    expect(stats.repasses).toBe(1000);
    expect(stats.rendimentos).toBe(50.5);
    expect(stats.tarifas).toBe(200);
    expect(stats.reprogramado).toBe(500);
    expect(stats.saldo).toBe(700.5);
    expect(stats.totalDisponivel).toBe(1200.5);
  });

  it('should aggregate taxes and refunds under impostosDevolucoes', () => {
    const entries: EntryLike[] = [
      { value: 100, type: 'Saída', status: TransactionStatus.PAGO, category: 'Impostos / Tributos' },
      { value: 250, type: 'Saída', status: TransactionStatus.PAGO, category: 'Devolução de Recurso (FNDE/Estado)' },
    ];

    const stats = calculateFinancialStats(entries);
    expect(stats.impostosDevolucoes).toBe(350);
  });
});
