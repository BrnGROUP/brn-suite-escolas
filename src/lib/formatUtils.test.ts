import { describe, it, expect } from 'vitest';
import { formatCNPJ, formatPhone, formatCPFCNPJ } from './formatUtils';

describe('formatUtils', () => {
  describe('formatCNPJ', () => {
    it('should format CNPJ raw input correctly', () => {
      expect(formatCNPJ('12345678000199')).toBe('12.345.678/0001-99');
    });

    it('should handle partial CNPJ formatting', () => {
      expect(formatCNPJ('12')).toBe('12');
      expect(formatCNPJ('123')).toBe('12.3');
      expect(formatCNPJ('123456')).toBe('12.345.6');
      expect(formatCNPJ('123456780001')).toBe('12.345.678/0001');
    });
  });

  describe('formatPhone', () => {
    it('should format landline number correctly', () => {
      expect(formatPhone('1134567890')).toBe('(11) 3456-7890');
    });

    it('should format mobile phone number correctly', () => {
      expect(formatPhone('11987654321')).toBe('(11) 9 8765-4321');
    });

    it('should handle partial phone formatting', () => {
      expect(formatPhone('11')).toBe('11');
      expect(formatPhone('119')).toBe('(11) 9');
    });
  });

  describe('formatCPFCNPJ', () => {
    it('should format CPF correctly', () => {
      expect(formatCPFCNPJ('12345678909')).toBe('123.456.789-09');
    });

    it('should format CNPJ correctly', () => {
      expect(formatCPFCNPJ('12345678000199')).toBe('12.345.678/0001-99');
    });

    it('should handle partial inputs', () => {
      expect(formatCPFCNPJ('123')).toBe('123');
      expect(formatCPFCNPJ('12345678')).toBe('123.456.78');
    });
  });
});
