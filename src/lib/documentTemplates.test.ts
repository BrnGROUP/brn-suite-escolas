import { describe, it, expect } from 'vitest';
import {
    generateAtaHTML,
    generateConsolidacaoHTML,
    generateOrdemHTML,
    generateReciboHTML,
    generateCotacaoHTML,
    generateContratoServicoHTML,
    generateContratoGasHTML,
    generateAditivoHTML
} from './documentTemplates';

const mockProcess = {
    id: 'test-process-id-12345678',
    discount: 10,
    financial_entries: {
        value: -100,
        date: '2025-01-15',
        payment_date: '2025-01-16',
        description: 'Aquisição de Gás P13',
        document_number: '12345',
        payment_method: 'Pix',
        auth_number: '98765',
        schools: {
            name: 'Escola Estadual Teste',
            conselho_escolar: 'Conselho Escolar da Escola Estadual Teste',
            cnpj: '12345678000190',
            city: 'Santana do Mundaú',
            seec: 'SEEC-123',
            secretary: 'João Secretário',
            director: 'Maria Diretora',
            director_rg: '123456',
            director_cpf: '111.111.111-11',
            address: 'Rua da Escola, 123',
            phone: '(82) 99999-9999'
        },
        programs: {
            name: 'PNAE'
        },
        rubrics: {
            name: 'CUSTEIO'
        },
        nature: 'Custeio',
        suppliers: {
            name: 'Fornecedor A Ltda',
            cnpj: '98765432000110',
            address: 'Rua do Fornecedor, 456',
            phone: '(82) 88888-8888',
            city: 'Maceió',
            uf: 'AL',
            rep_name: 'Representante Fornecedor',
            rep_cpf: '222.222.222-22',
            rep_rg: '78910'
        }
    },
    quotes: [
        {
            supplier_name: 'Fornecedor A Ltda',
            supplier_cnpj: '98765432000110',
            total_value: 90,
            is_winner: true,
            accountability_quote_items: [
                { description: 'Gás P13', unit_price: 90 }
            ]
        },
        {
            supplier_name: 'Fornecedor B Ltda',
            supplier_cnpj: '98765432000120',
            total_value: 95,
            is_winner: false,
            accountability_quote_items: [
                { description: 'Gás P13', unit_price: 95 }
            ]
        }
    ],
    items: [
        {
            description: 'Gás P13',
            unit: 'Unid',
            quantity: 1,
            winner_unit_price: 90
        }
    ],
    contract: {
        contract_number: '001/2025',
        start_date: '2025-01-15',
        end_date: '2026-01-14',
        monthly_value: 90,
        total_value: 1080,
        category: 'GÁS',
        terms_json: {
            witness_1_name: 'Testemunha 1',
            witness_1_cpf: '333.333.333-33',
            witness_2_name: 'Testemunha 2',
            witness_2_cpf: '444.444.444-44',
            foro_city: 'Santana do Mundaú'
        }
    }
};

describe('documentTemplates', () => {
    it('deve gerar Ata HTML corretamente', () => {
        const html = generateAtaHTML(mockProcess);
        expect(html).toContain('ATA DA ASSEMBLEIA GERAL EXTRAORDINÁRIA');
        expect(html).toContain('ESCOLA ESTADUAL TESTE');
        expect(html).toContain('FORNECEDOR A LTDA');
        expect(html).toContain('98.765.432/0001-10');
    });

    it('deve gerar Consolidação HTML corretamente', () => {
        const html = generateConsolidacaoHTML(mockProcess);
        expect(html).toContain('CONSOLIDAÇÃO DE PESQUISAS DE PREÇOS');
        expect(html).toContain('Fornecedor A Ltda');
        expect(html).toContain('Fornecedor B Ltda');
    });

    it('deve gerar Ordem de Compra HTML corretamente', () => {
        const html = generateOrdemHTML(mockProcess);
        expect(html).toContain('ORDEM DE COMPRA');
        expect(html).toContain('FORNECEDOR A LTDA');
        expect(html).toContain('Autorizo o fornecimento do produto/material');
    });

    it('deve gerar Ordem de Serviço HTML com texto de serviço quando for categoria diferente de GÁS', () => {
        const serviceProcess = {
            ...mockProcess,
            contract: { ...mockProcess.contract, category: 'INTERNET' }
        };
        const html = generateOrdemHTML(serviceProcess);
        expect(html).toContain('ORDEM DE SERVIÇO');
        expect(html).toContain('Autorizo a prestação dos serviços');
    });

    it('deve gerar Recibo HTML corretamente', () => {
        const html = generateReciboHTML(mockProcess);
        expect(html).toContain('RECIBO');
        expect(html.toUpperCase()).toContain('FORNECEDOR A LTDA');
    });

    it('deve gerar Cotacao HTML corretamente', () => {
        const html = generateCotacaoHTML(mockProcess, 0);
        expect(html).toContain('PLANILHA DE PESQUISA DE PREÇOS');
        expect(html).toContain('Fornecedor A Ltda');
    });

    it('deve gerar Contrato de Servico HTML corretamente', () => {
        // Altera categoria para testar contrato de serviço comum
        const serviceProcess = {
            ...mockProcess,
            contract: { ...mockProcess.contract, category: 'INTERNET' }
        };
        const html = generateContratoServicoHTML(serviceProcess);
        expect(html).toContain('CONTRATO DE PRESTAÇÃO DE SERVIÇOS');
        expect(html).toContain('INTERNET');
    });

    it('deve gerar Contrato de Gas HTML corretamente', () => {
        const html = generateContratoGasHTML(mockProcess);
        expect(html).toContain('CONTRATO DE FORNECIMENTO CONTÍNUO DE PRODUTOS');
        expect(html).toContain('GÁS LIQUEFEITO DE PETRÓLEO');
    });

    it('deve gerar Termo Aditivo HTML corretamente', () => {
        const html = generateAditivoHTML(mockProcess);
        expect(html).toContain('TERMO ADITIVO DE PRORROGAÇÃO E REAJUSTE');
        expect(html).toContain('CONTRATO');
    });

    it('deve lançar erro se o programa de recursos financeiros não estiver cadastrado', () => {
        const invalidProcess = {
            ...mockProcess,
            financial_entries: {
                ...mockProcess.financial_entries,
                programs: null
            }
        };
        expect(() => generateAtaHTML(invalidProcess)).toThrow('O programa de recursos financeiros');
    });

    it('deve lançar erro se faltar qualquer campo obrigatorio na validação de contrato', () => {
        const invalidContractProcess = {
            ...mockProcess,
            financial_entries: {
                ...mockProcess.financial_entries,
                schools: {
                    ...mockProcess.financial_entries.schools,
                    address: undefined
                }
            }
        };
        expect(() => generateContratoServicoHTML(invalidContractProcess)).toThrow('Não foi possível gerar o contrato. Corrija os seguintes dados');
    });
});
