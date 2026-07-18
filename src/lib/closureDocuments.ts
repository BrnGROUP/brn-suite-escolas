import { formatCurrency } from './printUtils';
import { printDocument } from './printUtils';

const PRINT_STYLES = `
    body { font-family: 'Segoe UI', Tahoma, sans-serif; color: #1a1a2e; margin: 0; padding: 20px; }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #0f4c81; padding-bottom: 15px; }
    .header h1 { font-size: 16px; text-transform: uppercase; letter-spacing: 3px; margin: 0 0 5px; color: #0f4c81; }
    .header h2 { font-size: 13px; margin: 0 0 5px; font-weight: normal; }
    .header p { font-size: 11px; color: #555; margin: 2px 0; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 20px; font-size: 11px; }
    .info-grid .item { display: flex; gap: 6px; }
    .info-grid .label { font-weight: bold; color: #0f4c81; text-transform: uppercase; white-space: nowrap; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 10px; }
    th { background: #0f4c81; color: white; padding: 8px 10px; text-align: left; text-transform: uppercase; font-size: 9px; letter-spacing: 1px; }
    td { padding: 6px 10px; border-bottom: 1px solid #e0e0e0; }
    tr:nth-child(even) { background: #f8f9fa; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .bold { font-weight: bold; }
    .total-row { background: #e8f0fe !important; font-weight: bold; border-top: 2px solid #0f4c81; }
    .subtotal-row { background: #f0f4f8 !important; font-weight: bold; font-size: 10px; }
    .section { margin: 25px 0; }
    .section-title { font-size: 12px; font-weight: bold; color: #0f4c81; text-transform: uppercase; letter-spacing: 2px; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 10px; }
    .summary-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 20px 0; }
    .summary-card { border: 1px solid #ddd; border-radius: 8px; padding: 12px; text-align: center; }
    .summary-card .value { font-size: 16px; font-weight: bold; color: #0f4c81; }
    .summary-card .label { font-size: 9px; text-transform: uppercase; color: #777; letter-spacing: 1px; }
    .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 60px; }
    .signature-line { text-align: center; border-top: 1px solid #333; padding-top: 5px; font-size: 10px; }
    .positive { color: #0a7c42; }
    .negative { color: #c0392b; }
    @media print { body { padding: 10px; } }
`;

interface ClosureDocData {
    schoolName: string;
    semester: string;
    year: number;
    semesterNumber: 1 | 2;
    dateStart: string;
    dateEnd: string;
    lines: any[];
    stats: any;
    programs: any[];
    rubrics: any[];
    bankAccounts: any[];
}

const formatDate = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('pt-BR');

// ==================================
// DEMONSTRATIVO DE EXECUÇÃO
// ==================================
export const generateDemonstrativoHTML = (data: ClosureDocData): string => {
    const { schoolName, semester, lines, stats, programs } = data;

    // Group lines by program
    const byProgram = new Map<string, any[]>();
    lines.forEach(l => {
        const key = l.program_id;
        if (!byProgram.has(key)) byProgram.set(key, []);
        byProgram.get(key)!.push(l);
    });

    let tableRows = '';
    byProgram.forEach((pLines, programId) => {
        const prog = programs.find((p: any) => p.id === programId);
        const programName = prog?.name || 'Programa não identificado';

        const custeio = pLines.filter((l: any) => l.nature === 'Custeio');
        const capital = pLines.filter((l: any) => l.nature === 'Capital');

        const sumIncome = (arr: any[]) => arr.reduce((a, l) => a + Number(l.total_income || 0), 0);
        const sumExpense = (arr: any[]) => arr.reduce((a, l) => a + Number(l.total_expense || 0), 0);
        const sumBalance = (arr: any[]) => arr.reduce((a, l) => a + Number(l.balance || 0), 0);
        const sumReprog = (arr: any[]) => arr.reduce((a, l) => a + Number(l.reprogrammed_value || l.reprogrammed_from_prev || 0), 0);

        tableRows += `
            <tr class="subtotal-row">
                <td colspan="6" style="font-size:11px; color:#0f4c81;">${programName}</td>
            </tr>
        `;

        if (custeio.length > 0) {
            tableRows += `
                <tr>
                    <td style="padding-left:20px;">Custeio</td>
                    <td class="text-right">${formatCurrency(sumReprog(custeio))}</td>
                    <td class="text-right">${formatCurrency(sumIncome(custeio))}</td>
                    <td class="text-right">${formatCurrency(sumExpense(custeio))}</td>
                    <td class="text-right bold ${sumBalance(custeio) >= 0 ? 'positive' : 'negative'}">${formatCurrency(sumBalance(custeio))}</td>
                    <td class="text-right">${formatCurrency(Math.max(0, sumBalance(custeio)))}</td>
                </tr>
            `;
        }
        if (capital.length > 0) {
            tableRows += `
                <tr>
                    <td style="padding-left:20px;">Capital</td>
                    <td class="text-right">${formatCurrency(sumReprog(capital))}</td>
                    <td class="text-right">${formatCurrency(sumIncome(capital))}</td>
                    <td class="text-right">${formatCurrency(sumExpense(capital))}</td>
                    <td class="text-right bold ${sumBalance(capital) >= 0 ? 'positive' : 'negative'}">${formatCurrency(sumBalance(capital))}</td>
                    <td class="text-right">${formatCurrency(Math.max(0, sumBalance(capital)))}</td>
                </tr>
            `;
        }
    });

    return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${PRINT_STYLES}</style></head><body>
        <div class="header">
            <h1>Demonstrativo de Execução da Receita e Despesa</h1>
            <h2>${schoolName}</h2>
            <p>Período: ${semester} (${formatDate(data.dateStart)} a ${formatDate(data.dateEnd)})</p>
        </div>

        <div class="summary-cards">
            <div class="summary-card"><div class="label">Saldo Anterior</div><div class="value">${formatCurrency(stats.totalReprogrammed || 0)}</div></div>
            <div class="summary-card"><div class="label">Total Receitas</div><div class="value positive">${formatCurrency(stats.totalIncome)}</div></div>
            <div class="summary-card"><div class="label">Total Despesas</div><div class="value negative">${formatCurrency(stats.totalExpense)}</div></div>
            <div class="summary-card"><div class="label">Saldo Final</div><div class="value">${formatCurrency(stats.totalBalance)}</div></div>
        </div>

        <div class="section">
            <div class="section-title">Detalhamento por Programa e Natureza</div>
            <table>
                <thead>
                    <tr>
                        <th>Programa / Natureza</th>
                        <th class="text-right">Saldo Anterior</th>
                        <th class="text-right">Receitas</th>
                        <th class="text-right">Despesas</th>
                        <th class="text-right">Saldo</th>
                        <th class="text-right">A Reprogramar</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                    <tr class="total-row">
                        <td>TOTAL GERAL</td>
                        <td class="text-right">${formatCurrency(stats.totalReprogrammed || 0)}</td>
                        <td class="text-right">${formatCurrency(stats.totalIncome)}</td>
                        <td class="text-right">${formatCurrency(stats.totalExpense)}</td>
                        <td class="text-right ${stats.totalBalance >= 0 ? 'positive' : 'negative'}">${formatCurrency(stats.totalBalance)}</td>
                        <td class="text-right">${formatCurrency(Math.max(0, stats.totalBalance))}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="signatures">
            <div><div class="signature-line">Presidente do Conselho Escolar (Diretor)</div></div>
            <div><div class="signature-line">Tesoureiro do Conselho Escolar</div></div>
        </div>
    </body></html>`;
};

// ==================================
// CONCILIAÇÃO BANCÁRIA CONSOLIDADA
// ==================================
export const generateConciliacaoConsolidadaHTML = (data: ClosureDocData): string => {
    const { schoolName, semester, lines, bankAccounts } = data;

    // Group by bank account
    const byAccount = new Map<string, any[]>();
    lines.forEach(l => {
        const key = l.bank_account_id || 'sem_conta';
        if (!byAccount.has(key)) byAccount.set(key, []);
        byAccount.get(key)!.push(l);
    });

    let tableRows = '';
    let totalBalance = 0;

    byAccount.forEach((aLines, accountId) => {
        const account = bankAccounts.find((ba: any) => ba.id === accountId);
        const accountName = account ? `${account.bank_name} - ${account.name}` : 'Conta não vinculada';
        const income = aLines.reduce((a: number, l: any) => a + Number(l.total_income || 0), 0);
        const expense = aLines.reduce((a: number, l: any) => a + Number(l.total_expense || 0), 0);
        const balance = aLines.reduce((a: number, l: any) => a + Number(l.balance || 0), 0);
        totalBalance += balance;

        tableRows += `
            <tr>
                <td>${accountName}</td>
                <td class="text-right">${formatCurrency(income)}</td>
                <td class="text-right">${formatCurrency(expense)}</td>
                <td class="text-right bold ${balance >= 0 ? 'positive' : 'negative'}">${formatCurrency(balance)}</td>
            </tr>
        `;
    });

    return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${PRINT_STYLES}</style></head><body>
        <div class="header">
            <h1>Conciliação Bancária Consolidada</h1>
            <h2>${schoolName}</h2>
            <p>Período: ${semester} (${formatDate(data.dateStart)} a ${formatDate(data.dateEnd)})</p>
        </div>

        <table>
            <thead>
                <tr>
                    <th>Conta Bancária</th>
                    <th class="text-right">Total Créditos</th>
                    <th class="text-right">Total Débitos</th>
                    <th class="text-right">Saldo Final</th>
                </tr>
            </thead>
            <tbody>
                ${tableRows}
                <tr class="total-row">
                    <td>TOTAL</td>
                    <td></td>
                    <td></td>
                    <td class="text-right ${totalBalance >= 0 ? 'positive' : 'negative'}">${formatCurrency(totalBalance)}</td>
                </tr>
            </tbody>
        </table>

        <div class="signatures" style="margin-top:80px;">
            <div><div class="signature-line">Presidente do Conselho Escolar (Diretor)</div></div>
            <div><div class="signature-line">Tesoureiro do Conselho Escolar</div></div>
        </div>
    </body></html>`;
};

// ==================================
// PRINT HELPERS
// ==================================
export const printClosureDocument = (html: string, title: string) => {
    printDocument(html, title);
};
