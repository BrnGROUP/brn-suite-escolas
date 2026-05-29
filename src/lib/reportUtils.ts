
import { formatCurrency } from './printUtils';

export interface ReportOptions {
    showSummary: boolean;
    showCharts: boolean;
    showStatusBadges: boolean;
    showNatureSummary: boolean;
    groupReport: 'school' | 'program' | 'none';
    format: 'pdf' | 'csv';
    filterSchool?: string;
    filterProgram?: string;
    filterStartDate?: string;
    filterEndDate?: string;
    reportMode?: 'gerencial' | 'livro_caixa';
}

/**
 * Simple SHA-256 Hash implementation for doc authenticity
 */
async function generateDocHash(data: string) {
    const msgBuffer = new TextEncoder().encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 40);
}

export const generateRelatorioGerencialHTML = async (entries: any[], stats: any, filters: any, reprogrammed: any[] = [], options: ReportOptions) => {
    const now = new Date();
    const reportDate = now.toLocaleDateString('pt-BR');
    const reportTime = now.toLocaleTimeString('pt-BR');
    const isLivroCaixa = options.reportMode === 'livro_caixa';
    let reportTitle = isLivroCaixa ? 'Livro Caixa - Prestação de Contas' : 'Relatório de Movimentação';

    let inepCode = '';
    const entryWithInep = entries.find(e => e.inep || e.schools?.inep);
    if (entryWithInep) {
        inepCode = entryWithInep.inep || entryWithInep.schools?.inep || '';
    }

    if (options.filterSchool) {
        const schoolName = entries.find(e => e.school_id === options.filterSchool)?.school || 'Unidade Específica';
        reportTitle = isLivroCaixa ? `Livro Caixa: ${schoolName}` : `Relatório: ${schoolName}`;
    } else if (options.filterProgram) {
        const programName = entries.find(e => e.program_id === options.filterProgram)?.program || 'Programa Específico';
        reportTitle = isLivroCaixa ? `Livro Caixa: ${programName}` : `Relatório Conexo: ${programName}`;
    }

    const periodText = (options.filterStartDate && options.filterEndDate)
        ? `Período: ${new Date(options.filterStartDate + 'T00:00:00').toLocaleDateString('pt-BR')} a ${new Date(options.filterEndDate + 'T00:00:00').toLocaleDateString('pt-BR')}`
        : 'Período: Completo / Todos os Lançamentos';

    interface ProgramData {
        previousBalance: number;
        credits: number;
        debits: number;
        entries: any[];
    }
    interface SchoolData {
        name: string;
        previousBalance: number;
        credits: number;
        debits: number;
        custeio: number;
        capital: number;
        programs: Record<string, ProgramData>;
        conselho_escolar?: string;
    }

    const dataBySchool: Record<string, SchoolData> = {};

    const ensurePath = (schoolName: string, programName: string, conselhoEscolar?: string) => {
        if (!dataBySchool[schoolName]) {
            dataBySchool[schoolName] = { name: schoolName, conselho_escolar: conselhoEscolar, previousBalance: 0, credits: 0, debits: 0, custeio: 0, capital: 0, programs: {} };
        } else if (conselhoEscolar && !dataBySchool[schoolName].conselho_escolar) {
            dataBySchool[schoolName].conselho_escolar = conselhoEscolar;
        }
        if (!dataBySchool[schoolName].programs[programName]) {
            dataBySchool[schoolName].programs[programName] = { previousBalance: 0, credits: 0, debits: 0, entries: [] };
        }
        return dataBySchool[schoolName].programs[programName];
    };

    reprogrammed.forEach(r => {
        const schoolName = r.schools?.name || 'Escola Desconhecida';
        const progName = r.programs?.name || 'Sem Programa';
        const val = Number(r.value || 0);
        const progNode = ensurePath(schoolName, progName, r.schools?.conselho_escolar);
        progNode.previousBalance += val;
        dataBySchool[schoolName]!.previousBalance += val;
    });

    entries.forEach(e => {
        const schoolName = e.school || 'Escola não Identificada';
        const progName = e.program || 'Sem Programa';
        const val = Number(e.value);
        const type = e.type;

        const progNode = ensurePath(schoolName, progName, e.schools?.conselho_escolar);

        if (type === 'Entrada') {
            progNode.credits += val;
            dataBySchool[schoolName]!.credits += val;
        } else {
            progNode.debits += Math.abs(val);
            dataBySchool[schoolName]!.debits += Math.abs(val);
            if (e.nature === 'Custeio') dataBySchool[schoolName]!.custeio += Math.abs(val);
            else if (e.nature === 'Capital') dataBySchool[schoolName]!.capital += Math.abs(val);
        }
        progNode.entries.push(e);
    });

    const totalPrev = Object.values(dataBySchool).reduce((acc, s) => acc + s.previousBalance, 0);
    const totalCred = Object.values(dataBySchool).reduce((acc, s) => acc + s.credits, 0);
    const totalDeb = Object.values(dataBySchool).reduce((acc, s) => acc + s.debits, 0);
    const totalCusteio = Object.values(dataBySchool).reduce((acc, s) => acc + s.custeio, 0);
    const totalCapital = Object.values(dataBySchool).reduce((acc, s) => acc + s.capital, 0);

    const totalNat = totalCusteio + totalCapital || 1;
    const custeioPerc = (totalCusteio / totalNat) * 100;
    const capitalPerc = (totalCapital / totalNat) * 100;

    const docHash = await generateDocHash(reportDate + totalCred + totalDeb + entries.length + 'brn-suite-v5');

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>${reportTitle} - BRN Suite</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet"/>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=block" />
    <style>
        @media print {
            body { background-color: white !important; margin: 0; padding: 0; }
            .print-container { 
                box-shadow: none !important; 
                border: none !important; 
                max-width: 100% !important;
                padding: 1.2cm !important;
            }
            .page-break { page-break-before: always; }
            .no-break { break-inside: avoid; }
            @page { size: A4; margin: 0; }
            .no-print { display: none !important; }
        }
        body { 
            font-family: 'Outfit', sans-serif; 
            background-color: #f1f5f9;
            color: #0f172a;
        }
        .summary-card {
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
        }
        .badge {
            padding: 2px 8px;
            border-radius: 6px;
            font-size: 9px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
    </style>
</head>
<body class="p-4 md:p-12">
    <div class="print-container bg-white max-w-[210mm] mx-auto p-12 shadow-[0_0_50px_rgba(0,0,0,0.1)] border border-slate-100 min-h-[297mm] relative overflow-hidden">
        
        <div class="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 z-0 opacity-50"></div>

        <header class="relative z-10 flex justify-between items-start mb-10 pb-6 border-b border-slate-100">
            <div>
                <div class="inline-flex items-center gap-2 px-3 py-1 bg-slate-900 text-white rounded-lg mb-4">
                    <span class="text-[9px] font-black uppercase tracking-widest">${inepCode ? `CÓDIGO INEP: ${inepCode}` : 'SISTEMA OFICIAL DE PRESTAÇÃO DE CONTAS'}</span>
                </div>
                <h1 class="text-4xl font-black text-slate-900 tracking-tight">${reportTitle}</h1>
                <p class="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em] mt-2">${isLivroCaixa ? 'Registro Formal de Movimentação Financeira' : 'Dashboard Executivo de Prestação de Contas'}</p>
            </div>
            <div class="text-right">
                <p class="text-[9px] font-black uppercase text-slate-400 mb-1">Emissão em</p>
                <p class="text-xl font-bold text-slate-900">${reportDate}</p>
                <p class="text-[9px] text-slate-400 font-medium">${reportTime}</p>
                <p class="text-[10px] text-slate-400 font-medium mt-1">Ref: ${periodText.replace('Período: ', '')}</p>
            </div>
        </header>

        ${options.showSummary ? `
        <section class="mb-10 no-break relative z-10">
            <div class="grid grid-cols-3 gap-6">
                <div class="col-span-1 p-6 bg-slate-50 border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                    <span class="block text-[10px] font-black uppercase text-slate-400 mb-4 tracking-tighter">Saldo Geral Consolidado</span>
                    <div class="whitespace-nowrap pb-2">
                        <span class="text-2xl font-black ${(totalPrev + totalCred - totalDeb) < 0 ? 'text-red-600' : 'text-slate-900'}">${formatCurrency(totalPrev + totalCred - totalDeb)}</span>
                    </div>
                    <div class="mt-4 flex items-center gap-2">
                        <div class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span class="text-[9px] font-bold text-slate-500 uppercase leading-tight">Fundo disponível em conta</span>
                    </div>
                </div>

                <div class="col-span-2 p-6 bg-slate-900 rounded-3xl text-white shadow-xl shadow-slate-900/20">
                    <div class="flex justify-between items-start mb-6">
                        <div>
                            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Distribuição de Recursos</span>
                            <h3 class="text-lg font-black mt-1">Análise de Natureza</h3>
                        </div>
                        <div class="text-right">
                            <span class="text-2xl font-black text-emerald-400">+ ${formatCurrency(totalCred)}</span>
                            <p class="text-[9px] font-bold text-slate-500 uppercase">Receita Total do Período</p>
                        </div>
                    </div>

                    ${options.showCharts ? `
                    <div class="space-y-4">
                        <div class="relative w-full h-3 bg-white/10 rounded-full overflow-hidden flex">
                            <div style="width: ${custeioPerc}%" class="h-full bg-blue-500 transition-all"></div>
                            <div style="width: ${capitalPerc}%" class="h-full bg-orange-500 transition-all"></div>
                        </div>
                        <div class="flex gap-6">
                            <div class="flex items-center gap-2">
                                <div class="w-3 h-3 rounded-full bg-blue-500"></div>
                                <span class="text-[11px] font-bold uppercase tracking-tighter">Custeio: ${formatCurrency(totalCusteio)} (${custeioPerc.toFixed(1)}%)</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <div class="w-3 h-3 rounded-full bg-orange-500"></div>
                                <span class="text-[11px] font-bold uppercase tracking-tighter">Capital: ${formatCurrency(totalCapital)} (${capitalPerc.toFixed(1)}%)</span>
                            </div>
                        </div>
                    </div>
                    ` : ''}
                </div>
            </div>
        </section>
        ` : ''}

        ${Object.values(dataBySchool).map((school, schoolIdx) => {
        const schoolBalance = school.previousBalance + school.credits - school.debits;
        return `
            <div class="mb-12 ${schoolIdx > 0 ? 'page-break mt-12' : ''}">
                <div class="flex items-center justify-between mb-8 no-break bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100">
                    <div class="flex items-center gap-4">
                        <div class="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg ring-4 ring-slate-100 uppercase">
                            ${school.name.charAt(0)}
                        </div>
                        <div>
                            <h2 class="text-2xl font-black text-slate-900 uppercase tracking-tighter">${(school.conselho_escolar || `CONSELHO ESCOLAR DA ESCOLA ESTADUAL ${school.name}`).toUpperCase()}</h2>
                            <div class="flex gap-3 mt-1">
                                <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Unidade Executora</span>
                                <div class="w-1 h-1 rounded-full bg-slate-300 mt-1.5"></div>
                                <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">${Object.keys(school.programs).length} Programas Ativos</span>
                            </div>
                        </div>
                    </div>
                    <div class="text-right">
                        <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Saldo da Unidade</span>
                        <p class="text-2xl font-black whitespace-nowrap ${schoolBalance < 0 ? 'text-red-600' : 'text-slate-900'}">${formatCurrency(schoolBalance)}</p>
                    </div>
                </div>

                <div class="space-y-12">
                    ${Object.entries(school.programs).map(([progName, progData]) => {
            const progBal = progData.previousBalance + progData.credits - progData.debits;
            let currentRollingBalance = progData.previousBalance;
            const sortedEntries = [...progData.entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

            return `
                        <div class="no-break group">
                            <div class="flex items-center gap-3 mb-6">
                                <div class="h-6 w-1 bg-slate-900 rounded-full"></div>
                                <h4 class="text-sm font-black text-slate-900 uppercase tracking-widest">${progName}</h4>
                                <div class="flex-1 border-b border-dashed border-slate-200 ml-4"></div>
                                <div class="pl-4 whitespace-nowrap">
                                    <span class="text-[10px] font-black ${progBal < 0 ? 'text-red-600' : 'text-emerald-600'}">${formatCurrency(progBal)}</span>
                                </div>
                            </div>
                            
                            <div class="bg-white border border-slate-100 rounded-[1.5rem] overflow-hidden shadow-sm">
                                <table class="w-full text-left text-[11px] border-collapse">
                                    <thead>
                                        <tr class="bg-slate-50/50 text-slate-400 uppercase font-black text-[9px] tracking-[0.15em] border-b border-slate-100">
                                            <th class="px-6 py-4">Data</th>
                                            <th class="px-4 py-4">${isLivroCaixa ? 'Histórico / Documento' : 'Ficha / Fornecedor / Rubrica'}</th>
                                            ${isLivroCaixa ? `
                                                <th class="px-4 py-4 text-right">Entradas</th>
                                                <th class="px-4 py-4 text-right">Saídas</th>
                                                <th class="px-6 py-4 text-right">Saldo</th>
                                            ` : `
                                                <th class="px-4 py-4">Natureza</th>
                                                <th class="px-6 py-4 text-right">Valor</th>
                                            `}
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-slate-50">
                                        ${isLivroCaixa ? `
                                            <tr class="bg-slate-50/20 italic">
                                                <td class="px-6 py-4 text-slate-400 font-bold">-</td>
                                                <td class="px-4 py-4 font-black text-slate-600">SALDO ANTERIOR / REPROGRAMADO</td>
                                                <td class="px-4 py-4 text-right">-</td>
                                                <td class="px-4 py-4 text-right">-</td>
                                                <td class="px-6 py-4 text-right font-black text-slate-900">${formatCurrency(progData.previousBalance)}</td>
                                            </tr>
                                        ` : ''}
                                        ${sortedEntries.map(e => {
                const val = Math.abs(Number(e.value));
                if (isLivroCaixa) {
                    if (e.type === 'Entrada') currentRollingBalance += val;
                    else currentRollingBalance -= val;
                }

                return `
                                            <tr class="hover:bg-slate-50/30 transition-colors">
                                                <td class="px-6 py-5 font-bold text-slate-400 whitespace-nowrap">${new Date(e.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                                                <td class="px-4 py-5">
                                                    <div class="flex items-center gap-2">
                                                        ${options.showStatusBadges ? `
                                                            <span class="badge ${(e.is_reconciled || e.status === 'Conciliado' || e.status === 'CONCILIADO') ? 'bg-emerald-50 text-emerald-600' : 'bg-yellow-50 text-yellow-600'}">
                                                                ${(e.is_reconciled || e.status === 'Conciliado' || e.status === 'CONCILIADO') ? 'CONCIL' : 'PEND'}
                                                            </span>
                                                        ` : ''}
                                                        <span class="font-black text-slate-900 uppercase text-[11px] tracking-tight">${e.description}</span>
                                                    </div>
                                                    <div class="mt-1 flex gap-2 flex-wrap items-center">
                                                        <span class="text-[9px] text-slate-400 font-bold uppercase italic">${e.supplier || 'Geral'}</span>
                                                        ${e.document_number ? `
                                                            <span class="text-[10px] text-slate-300">|</span>
                                                            <span class="text-[9px] font-black text-primary uppercase">Doc: ${e.document_number}</span>
                                                        ` : ''}
                                                        <span class="text-[10px] text-slate-300">|</span>
                                                        <span class="text-[9px] text-slate-400 font-medium">${e.rubric || 'Recurso Direto'}</span>
                                                        ${e.nature ? `
                                                            <span class="text-[10px] text-slate-300">|</span>
                                                            <span class="text-[9px] font-black uppercase ${e.nature === 'Capital' ? 'text-orange-600' : 'text-blue-600'}">${e.nature}</span>
                                                        ` : ''}
                                                    </div>
                                                </td>
                                                ${isLivroCaixa ? `
                                                    <td class="px-4 py-5 text-right font-black ${e.type === 'Entrada' ? 'text-emerald-600' : 'text-slate-300'} whitespace-nowrap">
                                                        ${e.type === 'Entrada' ? formatCurrency(val) : '<span class="opacity-20">-</span>'}
                                                    </td>
                                                    <td class="px-4 py-5 text-right font-black ${e.type === 'Saída' ? 'text-red-600' : 'text-slate-300'} whitespace-nowrap">
                                                        ${e.type === 'Saída' ? formatCurrency(val) : '<span class="opacity-20">-</span>'}
                                                    </td>
                                                    <td class="px-6 py-5 text-right font-black text-slate-900 underline decoration-slate-200 decoration-2 underline-offset-4 whitespace-nowrap">
                                                        ${formatCurrency(currentRollingBalance)}
                                                    </td>
                                                ` : `
                                                    <td class="px-4 py-5 font-bold uppercase text-[9px] tracking-widest">
                                                        <span class="${e.nature === 'Capital' ? 'text-orange-600' : 'text-blue-600'}">${e.nature}</span>
                                                    </td>
                                                    <td class="px-6 py-5 text-right font-black ${e.type === 'Entrada' ? 'text-emerald-600' : 'text-red-600 bg-red-50/20'} whitespace-nowrap">
                                                        <div class="flex items-center justify-end gap-1">
                                                            <span class="text-[10px] opacity-70 mb-0.5">${e.type === 'Entrada' ? '+' : '-'}</span>
                                                            <span>${formatCurrency(val)}</span>
                                                        </div>
                                                    </td>
                                                `}
                                            </tr>
                                            `;
            }).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        `;
        }).join('')}
                </div>
            </div>
            `;
    }).join('')}

        <footer class="mt-20 pt-10 border-t-[3px] border-slate-900 no-break">
            <div class="flex justify-between items-start gap-10">
                <div class="flex items-start gap-6 w-2/3">
                    <div class="bg-white p-2 border border-slate-200 rounded-xl shadow-sm">
                        <img 
                            src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(docHash)}" 
                            alt="QR Code de Autenticidade"
                            style="width: 80px; height: 80px;"
                        />
                    </div>
                    
                    <div class="space-y-4 flex-1">
                        <div>
                            <p class="text-[10px] font-black uppercase text-slate-900 tracking-tighter mb-1 flex items-center gap-2">
                                <span class="material-symbols-outlined text-[12px] text-emerald-600">verified_user</span>
                                Digital Signature Audit Hash
                            </p>
                            <p class="text-[9px] text-slate-400 font-mono break-all bg-slate-50 p-2 rounded-lg border border-slate-100">
                                ${docHash}
                            </p>
                        </div>
                        <div class="flex gap-4">
                            <div class="px-3 py-1 bg-slate-900 text-white rounded text-[8px] font-bold uppercase tracking-widest">Original Document</div>
                            <div class="px-3 py-1 border border-slate-200 text-slate-400 rounded text-[8px] font-bold uppercase tracking-widest">Accountability Verified</div>
                        </div>
                    </div>
                </div>

                <div class="w-1/3 text-right">
                    <div class="mb-4 h-px bg-slate-200"></div>
                    <p class="text-[10px] font-black uppercase text-slate-900">Responsável Financeiro</p>
                    <p class="text-[8px] text-slate-400 uppercase tracking-widest mb-4">Assinatura / Carimbo</p>
                    <p class="text-[8px] text-slate-400 font-bold uppercase tracking-[0.4em]">BRN Suite • v5.0</p>
                </div>
            </div>
            
            <div class="mt-10 flex justify-center opacity-10">
                <p class="text-[10px] font-black uppercase text-slate-900 tracking-[1em]">Documento Processado Digitalmente</p>
            </div>
        </footer>
    </div>

    <div class="no-print mt-8 flex justify-center gap-4 pb-20">
        <button onclick="window.print()" class="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-2">
            <span class="material-symbols-outlined">print</span>
            Imprimir Livro Caixa
        </button>
        <button onclick="window.close()" class="bg-red-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-500/20 flex items-center gap-2">
            <span class="material-symbols-outlined">close</span>
            Fechar Visualização
        </button>
    </div>
</body>
</html>`;
};

export const generateCSV = (entries: any[]) => {
    const headers = ['Data', 'Descrição', 'Doc/NF', 'Escola', 'Programa', 'Rubrica', 'Fornecedor', 'Natureza', 'Tipo', 'Status', 'Valor (R$)'];
    const rows = entries.map(e => [
        new Date(e.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' }),
        `"${e.description.replace(/"/g, '""')}"`,
        `"${e.document_number || ''}"`,
        `"${e.school}"`,
        `"${e.program}"`,
        `"${e.rubric}"`,
        `"${e.supplier}"`,
        e.nature,
        e.type,
        e.status,
        e.value.toString().replace('.', ',')
    ]);

    const csvContent = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_financeiro_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
