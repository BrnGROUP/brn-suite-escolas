import { BankTransaction } from '../types';

export interface ParseResult {
  transactions: BankTransaction[];
  errors: string[];
}

/**
 * Generates a clean random ID.
 */
const generateId = (): string => Math.random().toString(36).substring(2, 11);

/**
 * Parsers an OFX file content to a list of BankTransactions.
 * Tolerates malformed or incomplete blocks.
 */
export const parseOFX = (
  text: string,
  _fileName: string,
  uploadTypeShort: 'Conta Corrente' | 'Conta Investimento'
): ParseResult => {
  const newTransactions: BankTransaction[] = [];
  const errors: string[] = [];

  // Use a robust regex to find all <STMTTRN> blocks
  const blockRegex = /<STMTTRN>([\s\S]*?)(?:<\/STMTTRN>|(?=<STMTTRN>)|$)/gi;
  let match;
  let blockIndex = 0;

  while ((match = blockRegex.exec(text)) !== null) {
    const block = match[1];
    if (!block) continue;

    const getTagValue = (tag: string) => {
      const regex = new RegExp(`<${tag}>([^<\\r\\n]*)`, 'i');
      const m = block.match(regex);
      return (m && m[1]) ? m[1].trim() : null;
    };

    const dtposted = getTagValue('DTPOSTED');
    const trnamt = getTagValue('TRNAMT');
    const rawFitid = getTagValue('FITID') || `fit-${blockIndex}`;
    const memoSymbol = getTagValue('MEMO') || getTagValue('NAME') || getTagValue('PAYEEID') || 'Sem descrição';

    if (dtposted && trnamt) {
      // Parse date (YYYYMMDD...)
      const year = dtposted.substring(0, 4);
      const month = dtposted.substring(4, 6);
      const day = dtposted.substring(6, 8);
      const date = `${year}-${month}-${day}`;

      // Parse amount (handle both . and ,)
      const amountValue = parseFloat(trnamt.replace(',', '.'));

      if (!isNaN(amountValue) && amountValue !== 0) {
        const uniqueFitid = `${rawFitid}_${Math.abs(amountValue)}_${blockIndex}`;

        newTransactions.push({
          id: generateId(),
          date,
          description: memoSymbol.toUpperCase(),
          value: Math.abs(amountValue),
          type: amountValue > 0 ? 'C' : 'D',
          fitid: uniqueFitid,
          status: 'new',
          extract_type: uploadTypeShort
        });
      } else {
        errors.push(`Bloco OFX #${blockIndex + 1} ignorado: Valor de transação inválido (${trnamt}).`);
      }
    } else {
      errors.push(`Bloco OFX #${blockIndex + 1} ignorado: Ausência de Data ou Valor.`);
    }
    blockIndex++;
  }

  // If block parsing failed, try a very permissive line-based split as fallback
  if (newTransactions.length === 0) {
    const legacyBlocks = text.split(/<STMTTRN>/i);
    legacyBlocks.shift();
    legacyBlocks.forEach((block, idx) => {
      const getTagValue = (tag: string) => {
        const regex = new RegExp(`<${tag}>([^<\\r\\n]*)`, 'i');
        const m = block.match(regex);
        return (m && m[1]) ? m[1].trim() : null;
      };
      const dt = getTagValue('DTPOSTED');
      const amt = getTagValue('TRNAMT');
      if (dt && amt) {
        const val = parseFloat(amt.replace(',', '.'));
        if (!isNaN(val)) {
          newTransactions.push({
            id: generateId(),
            date: `${dt.substring(0, 4)}-${dt.substring(4, 6)}-${dt.substring(6, 8)}`,
            description: (getTagValue('MEMO') || getTagValue('NAME') || 'Sem descrição').toUpperCase(),
            value: Math.abs(val),
            type: val > 0 ? 'C' : 'D',
            fitid: `${getTagValue('FITID') || 'idx'}_${idx}`,
            status: 'new',
            extract_type: uploadTypeShort
          });
        } else {
          errors.push(`Linha legada OFX #${idx + 1} ignorada: Valor inválido.`);
        }
      } else {
        errors.push(`Linha legada OFX #${idx + 1} ignorada: Campos incompletos.`);
      }
    });
  }

  // Filter out internal noise but keep everything else
  const filtered = newTransactions.filter(t => {
    const desc = t.description.toUpperCase();
    const isFee = /TAR|TARIFA|PIX|IMPOSTO|IOF|CPMF|JUROS|COMISS|MANUTEN/.test(desc);
    if (isFee) return true;

    // Em Contas Correntes, filtramos resgates (RESG) inteiramente, pois são apenas coberturas automáticas
    if (uploadTypeShort === 'Conta Corrente') {
      const isInternal = /RESG|SALDO DIA|SDO CTA\/APL/.test(desc);
      return !isInternal;
    }

    const isInternal = /SALDO DIA|SDO CTA\/APL/.test(desc);
    return !isInternal;
  });

  return { transactions: filtered, errors };
};

/**
 * Parses a CSV bank statement to a list of BankTransactions.
 * Tolerates malformed lines, empty rows, and auto-detects delimiter (, or ;).
 */
export const parseCSV = (
  text: string,
  fileName: string,
  uploadTypeShort: 'Conta Corrente' | 'Conta Investimento'
): ParseResult => {
  const rows = text.split(/\r?\n/).filter(row => row.trim().length > 0);
  const newTransactions: BankTransaction[] = [];
  const errors: string[] = [];
  let startIdx = 0;

  // Try to find header or start from 0 if it looks like data
  if (rows[0] && (rows[0].toLowerCase().includes('data') || rows[0].toLowerCase().includes('date'))) {
    startIdx = 1;
  }

  rows.slice(startIdx).forEach((row, index) => {
    const cols = row.split(/[,;]/);
    const lineNum = index + 1 + startIdx;

    if (cols.length >= 3) {
      const dateRaw = cols[0]?.trim();
      const desc = cols[1]?.trim() || 'Sem descrição';
      const valueRaw = cols[2]?.trim();

      if (dateRaw && valueRaw) {
        let date = dateRaw;
        if (dateRaw.includes('/')) {
          const parts = dateRaw.split('/');
          if (parts[0] && parts[1] && parts[2] && parts[0].length === 2) {
            date = `${parts[2]}-${parts[1]}-${parts[0]}`;
          }
        }
        let cleanVal = valueRaw.replace(/[R$\s]/g, '');
        if (cleanVal.includes(',')) {
          // Brazilian format: remove dots and replace comma with dot
          cleanVal = cleanVal.replace(/\./g, '').replace(',', '.');
        }
        const value = parseFloat(cleanVal);
        if (!isNaN(value)) {
          newTransactions.push({
            id: generateId(),
            date,
            description: desc.toUpperCase(),
            value: Math.abs(value),
            type: value > 0 ? 'C' : 'D',
            fitid: `csv-${fileName}-${index}`,
            status: 'pending',
            extract_type: uploadTypeShort
          });
        } else {
          errors.push(`Linha ${lineNum} ignorada: Valor numérico inválido (${valueRaw}).`);
        }
      } else {
        errors.push(`Linha ${lineNum} ignorada: Falta Data ou Valor.`);
      }
    } else {
      errors.push(`Linha ${lineNum} ignorada: Colunas insuficientes (esperado >= 3).`);
    }
  });

  const filtered = newTransactions.filter(t => {
    const desc = t.description.toUpperCase();
    const isFee = /TAR|TARIFA|PIX|IMPOSTO|IOF|CPMF|JUROS|COMISS|MANUTEN/.test(desc);
    if (isFee) return true;

    if (uploadTypeShort === 'Conta Corrente') {
      const isInternal = /RESG|SALDO DIA|SDO CTA\/APL/.test(desc);
      return !isInternal;
    }

    const isInternal = /SALDO DIA|SDO CTA\/APL/.test(desc);
    return !isInternal;
  });

  return { transactions: filtered, errors };
};
