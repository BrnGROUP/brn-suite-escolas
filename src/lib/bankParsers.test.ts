import { describe, it, expect } from 'vitest';
import { parseOFX, parseCSV } from './bankParsers';

describe('bankParsers', () => {
  describe('parseOFX', () => {
    it('should successfully parse valid OFX content', () => {
      const ofx = `
        OFXHEADER:100
        <OFX>
          <BANKMSGSRSV1>
            <STMTTRN>
              <TRNTYPE>DEBIT
              <DTPOSTED>20260515120000[-3:BRT]
              <TRNAMT>-150.00
              <FITID>123456789
              <MEMO>PIX EMITIDO PARA FORNECEDOR
            </STMTTRN>
            <STMTTRN>
              <TRNTYPE>CREDIT
              <DTPOSTED>20260516120000[-3:BRT]
              <TRNAMT>2500.50
              <FITID>987654321
              <MEMO>REPASSE FNDE
            </STMTTRN>
          </BANKMSGSRSV1>
        </OFX>
      `;

      const result = parseOFX(ofx, 'test.ofx', 'Conta Corrente');
      expect(result.transactions).toHaveLength(2);
      expect(result.errors).toHaveLength(0);

      const t1 = result.transactions[0]!;
      expect(t1.value).toBe(150.00);
      expect(t1.type).toBe('D');
      expect(t1.date).toBe('2026-05-15');
      expect(t1.description).toBe('PIX EMITIDO PARA FORNECEDOR');
      expect(t1.extract_type).toBe('Conta Corrente');

      const t2 = result.transactions[1]!;
      expect(t2.value).toBe(2500.50);
      expect(t2.type).toBe('C');
      expect(t2.date).toBe('2026-05-16');
      expect(t2.description).toBe('REPASSE FNDE');
    });

    it('should tolerate and report malformed blocks in OFX', () => {
      const malformedOfx = `
        <OFX>
          <STMTTRN>
            <DTPOSTED>20260515
            <FITID>123
            <MEMO>TRANSACAO SEM VALOR
          </STMTTRN>
          <STMTTRN>
            <TRNTYPE>DEBIT
            <DTPOSTED>20260517
            <TRNAMT>-99.90
            <FITID>456
            <MEMO>TRANSACAO VALIDA
          </STMTTRN>
        </OFX>
      `;

      const result = parseOFX(malformedOfx, 'test_error.ofx', 'Conta Investimento');
      expect(result.transactions).toHaveLength(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Ausência de Data ou Valor');
      expect(result.transactions[0]!.value).toBe(99.90);
    });

    it('should fallback to line-based parsing if block parsing returns zero transactions', () => {
      // Missing proper closing tags but having raw fields
      const legacyOfx = `
        <STMTTRN>
        <DTPOSTED>20260520
        <TRNAMT>50.00
        <FITID>abc
        <MEMO>Tarifa bancaria
      `;

      const result = parseOFX(legacyOfx, 'legacy.ofx', 'Conta Corrente');
      expect(result.transactions).toHaveLength(1);
      expect(result.transactions[0]!.value).toBe(50.00);
      expect(result.transactions[0]!.description).toBe('TARIFA BANCARIA');
    });
  });

  describe('parseCSV', () => {
    it('should successfully parse valid CSV content with comma separator', () => {
      const csv = `Data,Descricao,Valor\n2026-05-10,COMPRA DE MATERIAIS,-120.30\n2026-05-11,REPASSE SALDO,5000.00`;
      const result = parseCSV(csv, 'test.csv', 'Conta Corrente');

      expect(result.transactions).toHaveLength(2);
      expect(result.errors).toHaveLength(0);

      expect(result.transactions[0]!.value).toBe(120.30);
      expect(result.transactions[0]!.type).toBe('D');
      expect(result.transactions[1]!.value).toBe(5000.00);
      expect(result.transactions[1]!.type).toBe('C');
    });

    it('should auto-detect semicolon separator and parse correctly', () => {
      const csv = `Data;Descricao;Valor\n12/05/2026;CONTRATACAO DE SERVICO;-1500,00`;
      const result = parseCSV(csv, 'test_semi.csv', 'Conta Corrente');

      expect(result.transactions).toHaveLength(1);
      expect(result.errors).toHaveLength(0);
      expect(result.transactions[0]!.date).toBe('2026-05-12');
      expect(result.transactions[0]!.value).toBe(1500.00);
      expect(result.transactions[0]!.description).toBe('CONTRATACAO DE SERVICO');
    });

    it('should tolerate bad lines in CSV and collect errors', () => {
      const csv = `Data,Descricao,Valor
2026-05-10,COMPRA VALIDA,-45.00
2026-05-11,COMPRA INVALIDA,VALOR_ESTRANHO
2026-05-12
2026-05-13,COMPRA VALIDA 2,-90.00`;

      const result = parseCSV(csv, 'test_bad.csv', 'Conta Corrente');
      expect(result.transactions).toHaveLength(2);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0]).toContain('Valor numérico inválido');
      expect(result.errors[1]).toContain('Colunas insuficientes');
    });
  });
});
