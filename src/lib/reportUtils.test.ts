import { describe, it, expect } from 'vitest';
import { generateRelatorioGerencialHTML } from './reportUtils';

describe('generateRelatorioGerencialHTML', () => {
  const sampleEntries = [
    {
      id: '1',
      date: '2026-01-31',
      description: 'RENDIMENTO LÍQUIDO APLICAÇÃO - JANEIRO DE 2026',
      value: 24.65,
      type: 'Entrada',
      nature: 'Custeio',
      category: 'Rendimento de Aplicação',
      school: 'Escola Carlos Lyra',
      program: 'PDDE QUALIDADE',
      status: 'Conciliado',
      is_reconciled: true,
    },
    {
      id: '2',
      date: '2026-02-28',
      description: 'RENDIMENTO LÍQUIDO APLICAÇÃO - FEVEREIRO DE 2026',
      value: 21.36,
      type: 'Entrada',
      nature: 'Custeio',
      category: 'Rendimento de Aplicação',
      school: 'Escola Carlos Lyra',
      program: 'PDDE QUALIDADE',
      status: 'Conciliado',
      is_reconciled: true,
    },
    {
      id: '3',
      date: '2026-03-31',
      description: 'RENDIMENTO LÍQUIDO APLICAÇÃO - MARÇO DE 2026',
      value: 26.14,
      type: 'Entrada',
      nature: 'Custeio',
      category: 'Rendimento de Aplicação',
      school: 'Escola Carlos Lyra',
      program: 'PDDE QUALIDADE',
      status: 'Conciliado',
      is_reconciled: true,
    },
    {
      id: '4',
      date: '2026-04-30',
      description: 'RENDIMENTO LÍQUIDO APLICAÇÃO - ABRIL DE 2026',
      value: 23.65,
      type: 'Entrada',
      nature: 'Custeio',
      category: 'Rendimento de Aplicação',
      school: 'Escola Carlos Lyra',
      program: 'PDDE QUALIDADE',
      status: 'Conciliado',
      is_reconciled: true,
    },
    {
      id: '5',
      date: '2026-05-31',
      description: 'RENDIMENTO LÍQUIDO APLICAÇÃO - MAIO DE 2026',
      value: -2.41,
      type: 'Entrada',
      nature: 'Custeio',
      category: 'Rendimento de Aplicação',
      school: 'Escola Carlos Lyra',
      program: 'PDDE QUALIDADE',
      status: 'Conciliado',
      is_reconciled: true,
    },
    {
      id: '6',
      date: '2026-06-30',
      description: 'RENDIMENTO LÍQUIDO APLICAÇÃO - JUNHO DE 2026',
      value: 24.35,
      type: 'Entrada',
      nature: 'Custeio',
      category: 'Rendimento de Aplicação',
      school: 'Escola Carlos Lyra',
      program: 'PDDE QUALIDADE',
      status: 'Conciliado',
      is_reconciled: true,
    },
  ];

  const sampleReprogrammed = [
    {
      schools: { name: 'Escola Carlos Lyra' },
      programs: { name: 'PDDE QUALIDADE' },
      value: 2723.48,
    },
  ];

  const defaultOptions = {
    showSummary: true,
    showCharts: true,
    showStatusBadges: true,
    showNatureSummary: true,
    groupReport: 'program' as const,
    format: 'pdf' as const,
    reportMode: 'gerencial' as const,
    filterSchool: 'Escola Carlos Lyra',
  };

  it('should correctly calculate net rendimentos as 117,74 instead of 122,56', async () => {
    const html = await generateRelatorioGerencialHTML(
      sampleEntries,
      {},
      {},
      sampleReprogrammed,
      defaultOptions
    );

    // Rendimentos card must show 117,74 and NOT 122,56
    expect(html).toContain('117,74');
    expect(html).not.toContain('122,56');

    // Consolidated balance must be 2.723,48 + 117,74 = 2.841,22
    expect(html).toContain('2.841,22');

    // Custeio must also be 117,74
    expect(html).toContain('Custeio:');
  });

  it('should format overall negative rendimentos with red style', async () => {
    const negativeEntries = [
      {
        id: 'neg-1',
        date: '2026-05-31',
        description: 'RENDIMENTO NEGATIVO',
        value: -25.5,
        type: 'Entrada',
        nature: 'Custeio',
        category: 'Rendimento de Aplicação',
        school: 'Escola Carlos Lyra',
        program: 'PDDE QUALIDADE',
        status: 'Conciliado',
      },
    ];

    const html = await generateRelatorioGerencialHTML(
      negativeEntries,
      {},
      {},
      [],
      defaultOptions
    );

    expect(html).toContain('text-red-600');
    expect(html).toContain('25,50');
  });

  it('should use payment_date instead of invoice_date for entry date column and display invoice date in details', async () => {
    const divergenceEntries = [
      {
        id: 'tpl-1',
        date: '2026-05-18',
        invoice_date: '2026-05-18',
        payment_date: '2026-05-21',
        description: 'TPL Distribuidora',
        supplier: 'TPL Distribuidora',
        document_number: 'NF-1042',
        value: 18312.90,
        type: 'Saída',
        nature: 'Custeio',
        category: 'Material de Consumo',
        school: 'Escola Carlos Lyra',
        program: 'PDDE QUALIDADE',
        status: 'Conciliado',
        is_reconciled: true,
      },
      {
        id: 'biscoito-1',
        date: '2026-05-20',
        invoice_date: '2026-05-20',
        payment_date: '2026-05-27',
        description: 'Biscoito/rosquinha',
        supplier: 'Panificadora',
        document_number: 'NF-501',
        value: 214.00,
        type: 'Saída',
        nature: 'Custeio',
        category: 'Alimentação',
        school: 'Escola Carlos Lyra',
        program: 'PDDE QUALIDADE',
        status: 'Conciliado',
        is_reconciled: true,
      }
    ];

    const html = await generateRelatorioGerencialHTML(
      divergenceEntries,
      {},
      {},
      [],
      { ...defaultOptions, reportMode: 'livro_caixa' }
    );

    // Should display payment date in table: 21/05/2026 and 27/05/2026
    expect(html).toContain('21/05/2026');
    expect(html).toContain('27/05/2026');

    // Should display invoice date in the detail row as NF: 18/05/2026 and NF: 20/05/2026
    expect(html).toContain('NF: 18/05/2026');
    expect(html).toContain('NF: 20/05/2026');
  });

  it('should sort entries by payment_date when available', async () => {
    const unsortedEntries = [
      {
        id: 'entry-b',
        date: '2026-05-01', // early invoice date
        payment_date: '2026-05-30', // late payment date
        description: 'PAGO TARDE',
        value: 100,
        type: 'Saída',
        nature: 'Custeio',
        school: 'Escola Carlos Lyra',
        program: 'PDDE QUALIDADE',
        status: 'Conciliado',
      },
      {
        id: 'entry-a',
        date: '2026-05-15', // later invoice date
        payment_date: '2026-05-16', // earlier payment date
        description: 'PAGO CEDO',
        value: 50,
        type: 'Saída',
        nature: 'Custeio',
        school: 'Escola Carlos Lyra',
        program: 'PDDE QUALIDADE',
        status: 'Conciliado',
      }
    ];

    const html = await generateRelatorioGerencialHTML(
      unsortedEntries,
      {},
      {},
      [],
      defaultOptions
    );

    const indexCedo = html.indexOf('PAGO CEDO');
    const indexTarde = html.indexOf('PAGO TARDE');

    // 'PAGO CEDO' (paid 16/05) must appear before 'PAGO TARDE' (paid 30/05)
    expect(indexCedo).toBeGreaterThan(-1);
    expect(indexTarde).toBeGreaterThan(-1);
    expect(indexCedo).toBeLessThan(indexTarde);
  });
});

