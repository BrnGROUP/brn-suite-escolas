import { describe, it, expect } from 'vitest';
import { formatCurrency, formatCNPJ, numberToWords, subtractBusinessDays, getSchoolInitials, getContractPrintTitle } from './printUtils';

describe('printUtils', () => {
    describe('formatCurrency', () => {
        it('deve formatar valores numericos para Real (BRL)', () => {
            const result = formatCurrency(1250.5);
            // Substitui espacos nao-quebraveis por espacos normais para evitar falsos negativos
            const normalized = result.replace(/\u00a0/g, ' ');
            expect(normalized).toContain('R$');
            expect(normalized).toContain('1.250,50');
        });

        it('deve formatar zero corretamente', () => {
            const result = formatCurrency(0);
            const normalized = result.replace(/\u00a0/g, ' ');
            expect(normalized).toContain('R$');
            expect(normalized).toContain('0,00');
        });
    });

    describe('formatCNPJ', () => {
        it('deve formatar um CNPJ valido de 14 digitos', () => {
            expect(formatCNPJ('12345678000199')).toBe('12.345.678/0001-99');
        });

        it('deve formatar um CPF valido de 11 digitos', () => {
            expect(formatCNPJ('12345678901')).toBe('123.456.789-01');
        });

        it('deve retornar "---" se a string for vazia ou nula', () => {
            expect(formatCNPJ('')).toBe('---');
        });
    });

    describe('numberToWords', () => {
        it('deve converter valores inteiros por extenso em reais', () => {
            expect(numberToWords(1)).toBe('um real');
            expect(numberToWords(5)).toBe('cinco reais');
            expect(numberToWords(100)).toBe('cem reais');
            expect(numberToWords(150)).toBe('cento e cinquenta reais');
        });

        it('deve converter valores decimais (centavos)', () => {
            expect(numberToWords(0.50)).toBe('cinquenta centavos');
            expect(numberToWords(1.05)).toBe('um real e cinco centavos');
            expect(numberToWords(150.75)).toBe('cento e cinquenta reais e setenta e cinco centavos');
        });

        it('deve converter milhares e milhoes', () => {
            expect(numberToWords(1000)).toBe('mil reais');
            expect(numberToWords(2500.20)).toBe('dois mil e quinhentos reais e vinte centavos');
            expect(numberToWords(1000000)).toBe('um milhão reais');
        });

        it('deve lidar com o valor zero', () => {
            expect(numberToWords(0)).toBe('zero reais');
        });
    });

    describe('subtractBusinessDays', () => {
        it('deve subtrair dias uteis pulando finais de semana', () => {
            // Quarta-feira, 20 de Maio de 2026
            const date = new Date(2026, 4, 20); 
            // 2 dias uteis antes deve ser Segunda-feira, 18 de Maio
            const result = subtractBusinessDays(date, 2);
            expect(result.getDay()).toBe(1); // 1 = Segunda
            expect(result.getDate()).toBe(18);
        });

        it('deve pular finais de semana inteiros', () => {
            // Segunda-feira, 18 de Maio de 2026
            const date = new Date(2026, 4, 18);
            // 1 dia util antes deve ser Sexta-feira, 15 de Maio (pula Domingo/Sabado)
            const result = subtractBusinessDays(date, 1);
            expect(result.getDay()).toBe(5); // 5 = Sexta
            expect(result.getDate()).toBe(15);
        });

        it('deve pular feriados nacionais cadastrados', () => {
            // Dia do Trabalho: 1 de Maio é feriado nacional
            // Sexta-feira, 1 de Maio de 2026.
            // Segunda-feira, 4 de Maio de 2026.
            const date = new Date(2026, 4, 4); // Segunda
            // 1 dia util antes deve ser Quinta-feira, 30 de Abril, porque 1 de Maio é feriado e final de semana é pulado
            const result = subtractBusinessDays(date, 1);
            expect(result.getDate()).toBe(30);
            expect(result.getMonth()).toBe(3); // 3 = Abril (0-indexed)
        });
    });

    describe('getSchoolInitials', () => {
        it('deve extrair as iniciais do nome de uma escola pulando preposicoes', () => {
            expect(getSchoolInitials('Escola Estadual Dr. Carlos Gomes de Barros')).toBe('EEDCGB');
            expect(getSchoolInitials('Escola Estadual Branquinha')).toBe('EEB');
            expect(getSchoolInitials('U.E. Conselheiro Manoel de Souza')).toBe('UCMS');
            expect(getSchoolInitials('')).toBe('');
        });
    });

    describe('getContractPrintTitle', () => {
        it('deve gerar o titulo do arquivo PDF de contrato no padrao solicitado', () => {
            const pseudoProcess = {
                id: '123',
                contract: {
                    id: 'c123',
                    contract_number: '01/2026',
                    category: 'INTERNET',
                    start_date: '2026-02-11',
                    terms_json: {
                        is_aditivo: false
                    }
                },
                financial_entries: [{
                    school: {
                        name: 'Escola Estadual Dr. Carlos Gomes de Barros'
                    }
                }]
            };

            const title = getContractPrintTitle(pseudoProcess);
            expect(title).toBe('CONTRATO - INTERNET - 01_2026 - 11.02.2026 - EEDCGB');
        });

        it('deve gerar titulo de termo aditivo corretamente', () => {
            const pseudoProcess = {
                id: '123',
                contract: {
                    id: 'c123',
                    contract_number: '05/2025/ADITIVO',
                    category: 'GÁS',
                    start_date: '2026-05-29',
                    terms_json: {
                        is_aditivo: true
                    }
                },
                financial_entries: [{
                    school: {
                        name: 'Escola Estadual Branquinha'
                    }
                }]
            };

            const title = getContractPrintTitle(pseudoProcess);
            expect(title).toBe('ADITIVO - GÁS - 05_2025_ADITIVO - 29.05.2026 - EEB');
        });
    });
});
