import { TransactionStatus } from '../types';

export interface EntryLike {
  value: number | string;
  type: 'Entrada' | 'Saída';
  status: string;
  category?: string | null;
  nature?: string | null;
  date?: string | null;
}

export interface FinancialStats {
  receita: number;
  despesa: number;
  pendencias: number;
  repasses: number;
  rendimentos: number;
  tarifas: number;
  impostosDevolucoes: number;
  reprogramado: number;
  saldo: number;
  totalDisponivel: number;
  reembolsos: number;
}

/**
 * Calculates financial statistics for a set of entries.
 */
export const calculateFinancialStats = (
  entries: EntryLike[],
  reprogrammedTotal: number = 0
): FinancialStats => {
  let receita = 0;
  let despesa = 0;
  let pendencias = 0;
  let repasses = 0;
  let rendimentos = 0;
  let tarifas = 0;
  let impostosDevolucoes = 0;
  let reembolsos = 0;

  entries.forEach((e) => {
    const val = Number(e.value);
    const absVal = Math.abs(val);

    if (e.status === TransactionStatus.PENDENTE || e.status === 'Pendente') {
      pendencias++;
    }

    if (e.type === 'Entrada') {
      receita += val;

      const catUpper = (e.category || '').toUpperCase().trim();
      if (catUpper.includes('RENDIMENTO')) {
        rendimentos += val;
      } else if (catUpper.includes('REPASSE') || catUpper === 'OUTROS') {
        repasses += absVal;
      } else if (catUpper.includes('REEMBOLSO') || catUpper.includes('ESTORNO')) {
        reembolsos += absVal;
      }
    } else {
      despesa += absVal;
      const catUpper = (e.category || '').toUpperCase().trim();
      if (catUpper.includes('TARIFA')) {
        tarifas += absVal;
      }
      if (
        catUpper.includes('IMPOSTOS') ||
        catUpper.includes('TRIBUTOS') ||
        catUpper.includes('DEVOLUÇÃO') ||
        catUpper.includes('DEVOLUCAO')
      ) {
        impostosDevolucoes += absVal;
      }
      if (catUpper.includes('RENDIMENTO')) {
        rendimentos -= absVal;
      }
    }
  });

  const saldo = receita - despesa;

  return {
    receita: Number(receita.toFixed(2)),
    despesa: Number(despesa.toFixed(2)),
    pendencias,
    repasses: Number(repasses.toFixed(2)),
    rendimentos: Number(rendimentos.toFixed(2)),
    tarifas: Number(tarifas.toFixed(2)),
    impostosDevolucoes: Number(impostosDevolucoes.toFixed(2)),
    reprogramado: Number(reprogrammedTotal.toFixed(2)),
    saldo: Number(saldo.toFixed(2)),
    totalDisponivel: Number((saldo + reprogrammedTotal).toFixed(2)),
    reembolsos: Number(reembolsos.toFixed(2)),
  };
};
