
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
        }

        // Calular natureza para todas as entradas exibidas (conforme filtro ativo)
        if (e.nature === 'Custeio') {
            dataBySchool[schoolName]!.custeio += Math.abs(val);
        } else if (e.nature === 'Capital') {
            dataBySchool[schoolName]!.capital += Math.abs(val);
        }

        progNode.entries.push(e);
    });

    const totalPrev = Object.values(dataBySchool).reduce((acc, s) => acc + s.previousBalance, 0);
    const totalCred = Object.values(dataBySchool).reduce((acc, s) => acc + s.credits, 0);
    const totalDeb = Object.values(dataBySchool).reduce((acc, s) => acc + s.debits, 0);
    const totalCusteio = Object.values(dataBySchool).reduce((acc, s) => acc + s.custeio, 0);
    const totalCapital = Object.values(dataBySchool).reduce((acc, s) => acc + s.capital, 0);

    let totalRepasses = 0;
    let totalTarifas = 0;
    let totalRendimentos = 0;

    entries.forEach(e => {
        const catUpper = (e.category || '').toUpperCase().trim();
        const val = Math.abs(Number(e.value));
        
        if (catUpper.includes('REPASSE')) {
            totalRepasses += val;
        } else if (catUpper.includes('TARIFA')) {
            totalTarifas += val;
        } else if (catUpper.includes('RENDIMENTO')) {
            totalRendimentos += val;
        }
    });

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
    
    <!-- Google Fonts & Icons -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Outfit:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
    
    <style>
        body { 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; 
            background-color: #f8fafc;
            color: #0f172a;
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        
        h1, h2, h3, h4, .font-outfit {
            font-family: 'Outfit', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        .print-container {
            background-color: #ffffff;
            max-width: 210mm;
            margin: 2rem auto;
            padding: 3rem;
            box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 2px 30px -4px rgba(0, 0, 0, 0.05);
            border: 1px solid #e2e8f0;
            border-radius: 24px;
            min-height: 297mm;
            position: relative;
            box-sizing: border-box;
        }
        
        @media print {
            body { background-color: white !important; margin: 0; padding: 0; }
            .print-container { 
                box-shadow: none !important; 
                border: none !important; 
                max-width: 100% !important;
                padding: 1.2cm !important;
                margin: 0 !important;
                border-radius: 0 !important;
            }
            .page-break { page-break-before: always; }
            .no-break { break-inside: avoid; }
            @page { size: A4; margin: 1.5cm 1.2cm; }
            .no-print { display: none !important; }
            
            /* High contrast adjustments for print */
            .summary-nature-card {
                background: #ffffff !important;
                color: #0f172a !important;
                border: 2px solid #0f172a !important;
                box-shadow: none !important;
            }
            .summary-nature-card h3,
            .summary-nature-card span,
            .summary-nature-card p,
            .summary-nature-card div {
                color: #0f172a !important;
            }
            .summary-nature-card .text-emerald-400 {
                color: #059669 !important;
            }
            .summary-nature-card .chart-bar-bg {
                background: #f1f5f9 !important;
                border: 1px solid #cbd5e1 !important;
            }
        }

        /* Essential Utility Classes */
        .w-full { width: 100%; }
        .w-1\\/2 { width: 50%; }
        .w-1\\/3 { width: 33.333333%; }
        .w-2\\/3 { width: 66.666667%; }
        .w-1\\/4 { width: 25%; }
        .w-3\\/4 { width: 75%; }
        .mx-auto { margin-left: auto; margin-right: auto; }
        
        .flex { display: flex; }
        .flex-col { flex-direction: column; }
        .flex-row { flex-direction: row; }
        .justify-between { justify-content: space-between; }
        .justify-center { justify-content: center; }
        .justify-end { justify-content: flex-end; }
        .items-center { align-items: center; }
        .items-end { align-items: flex-end; }
        .items-start { align-items: flex-start; }
        .inline-flex { display: inline-flex; }
        .flex-shrink-0 { flex-shrink: 0; }
        .flex-1 { flex: 1 1 0%; }
        
        .gap-1 { gap: 0.25rem; }
        .gap-2 { gap: 0.5rem; }
        .gap-3 { gap: 0.75rem; }
        .gap-4 { gap: 1rem; }
        .gap-6 { gap: 1.5rem; }
        
        .grid { display: grid; }
        .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        .grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
        
        .col-span-1 { grid-column: span 1 / span 1; }
        .col-span-2 { grid-column: span 2 / span 2; }
        .col-span-3 { grid-column: span 3 / span 3; }
        
        .text-left { text-align: left; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        
        .font-bold { font-weight: bold; }
        .font-semibold { font-weight: 600; }
        .font-medium { font-weight: 500; }
        .font-black { font-weight: 900; }
        
        .uppercase { text-transform: uppercase; }
        
        .text-xs { font-size: 0.75rem; }
        .text-sm { font-size: 0.875rem; }
        .text-base { font-size: 1rem; }
        .text-lg { font-size: 1.125rem; }
        .text-xl { font-size: 1.25rem; }
        .text-2xl { font-size: 1.5rem; }
        .text-3xl { font-size: 1.875rem; }
        .text-4xl { font-size: 2.25rem; }
        
        .text-\\[8px\\] { font-size: 8px; }
        .text-\\[9px\\] { font-size: 9px; }
        .text-\\[10px\\] { font-size: 10px; }
        .text-\\[11px\\] { font-size: 11px; }
        .text-\\[12px\\] { font-size: 12px; }
        .text-\\[14px\\] { font-size: 14px; }
        .text-\\[18px\\] { font-size: 18px; }
        
        .mb-1 { margin-bottom: 0.25rem; }
        .mb-2 { margin-bottom: 0.5rem; }
        .mb-3 { margin-bottom: 0.75rem; }
        .mb-4 { margin-bottom: 1rem; }
        .mb-6 { margin-bottom: 1.5rem; }
        .mb-8 { margin-bottom: 2rem; }
        .mb-10 { margin-bottom: 2.5rem; }
        .mb-12 { margin-bottom: 3rem; }
        .mt-1 { margin-top: 0.25rem; }
        .mt-1\\.5 { margin-top: 0.375rem; }
        .mt-2 { margin-top: 0.5rem; }
        .mt-4 { margin-top: 1rem; }
        .mt-6 { margin-top: 1.5rem; }
        .mt-10 { margin-top: 2.5rem; }
        .mt-12 { margin-top: 3rem; }
        .mt-20 { margin-top: 5rem; }
        .ml-4 { margin-left: 1rem; }
        .pl-4 { padding-left: 1rem; }
        .pr-4 { padding-right: 1rem; }
        
        .p-4 { padding: 1rem; }
        .p-6 { padding: 1.5rem; }
        .p-12 { padding: 3rem; }
        .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
        .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
        .py-4 { padding-top: 1rem; padding-bottom: 1rem; }
        .py-5 { padding-top: 1.25rem; padding-bottom: 1.25rem; }
        .px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
        .px-4 { padding-left: 1rem; padding-right: 1rem; }
        .px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }
        .pb-2 { padding-bottom: 0.5rem; }
        .pb-6 { padding-bottom: 1.5rem; }
        .pb-20 { padding-bottom: 5rem; }
        .pt-10 { padding-top: 2.5rem; }
        
        .border-b { border-bottom: 1px solid #e2e8f0; }
        .border-t { border-top: 1px solid #e2e8f0; }
        .border { border: 1px solid #e2e8f0; }
        .border-dashed { border-style: dashed; }
        .border-slate-100 { border-color: #f1f5f9; }
        .border-slate-200 { border-color: #cbd5e1; }
        
        .bg-white { background-color: #ffffff; }
        .bg-slate-50 { background-color: #f8fafc; }
        .bg-slate-50\\/50 { background-color: rgba(248, 250, 252, 0.5); }
        .bg-slate-50\\/20 { background-color: rgba(248, 250, 252, 0.2); }
        .bg-slate-900 { background-color: #0f172a; }
        .text-white { color: #ffffff; }
        
        .bg-blue-500 { background-color: #3b82f6; }
        .bg-orange-500 { background-color: #f97316; }
        .bg-emerald-50 { background-color: #ecfdf5; }
        .bg-yellow-50 { background-color: #fefce8; }
        .bg-red-50\\/20 { background-color: rgba(254, 242, 242, 0.1); }
        .bg-white\\/10 { background-color: rgba(255, 255, 255, 0.1); }
        
        .text-emerald-600 { color: #059669; }
        .text-emerald-400 { color: #34d399; }
        .text-yellow-600 { color: #d97706; }
        .text-slate-300 { color: #cbd5e1; }
        .text-slate-400 { color: #94a3b8; }
        .text-slate-500 { color: #64748b; }
        .text-slate-600 { color: #475569; }
        .text-orange-600 { color: #ea580c; }
        .text-blue-600 { color: #2563eb; }
        .text-red-600 { color: #dc2626; }
        
        .rounded-lg { border-radius: 0.5rem; }
        .rounded-xl { border-radius: 0.75rem; }
        .rounded-2xl { border-radius: 1rem; }
        .rounded-3xl { border-radius: 1.5rem; }
        .rounded-full { border-radius: 9999px; }
        .rounded-\\[1\\.5rem\\] { border-radius: 1.5rem; }
        .rounded-\\[2rem\\] { border-radius: 2rem; }
        
        .tracking-tight { letter-spacing: -0.025em; }
        .tracking-widest { letter-spacing: 0.1em; }
        
        .relative { position: relative; }
        .absolute { position: absolute; }
        .top-0 { top: 0; }
        .right-0 { right: 0; }
        .z-0 { z-index: 0; }
        .z-10 { z-index: 10; }
        .opacity-50 { opacity: 0.5; }
        .opacity-10 { opacity: 0.1; }
        
        .h-64 { height: 16rem; }
        .w-64 { width: 16rem; }
        .w-14 { width: 56px; }
        .h-14 { height: 56px; }
        .h-6 { height: 24px; }
        .w-1 { width: 4px; }
        .h-1 { height: 4px; }
        .w-3 { width: 12px; }
        .h-3 { height: 12px; }
        .h-3 { height: 12px; }
        .w-full { width: 100%; }
        .-mr-32 { margin-right: -8rem; }
        .-mt-32 { margin-top: -8rem; }
        
        .min-h-\\[297mm\\] { min-height: 297mm; }
        .border-collapse { border-collapse: collapse; }
        .underline { text-decoration: underline; }
        .decoration-slate-200 { text-decoration-color: #cbd5e1; }
        .decoration-2 { text-decoration-thickness: 2px; }
        .underline-offset-4 { text-underline-offset: 4px; }
        .italic { font-style: italic; }
        .whitespace-nowrap { white-space: nowrap; }
        .break-all { word-break: break-all; }
        .font-mono { font-family: monospace; }
        
        .space-y-4 > * + * { margin-top: 1rem; }
        .space-y-12 > * + * { margin-top: 3rem; }
        .divide-y > * + * { border-top: 1px solid #f1f5f9; }
        
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
        
        .ring-4 { box-shadow: 0 0 0 4px #f1f5f9; }
        .transition-colors { transition: background-color 0.15s ease; }
        .transition-all { transition: all 0.15s ease; }
        .cursor-pointer { cursor: pointer; }
    </style>
</head>
<body class="p-4 md:p-12">
    <div class="print-container bg-white max-w-[210mm] mx-auto p-12 shadow-[0_0_50px_rgba(0,0,0,0.05)] border border-slate-100 min-h-[297mm] relative overflow-hidden">
        
        <div class="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 z-0 opacity-50"></div>

        <header class="relative z-10 flex justify-between items-start mb-10 pb-6 border-b border-slate-100">
            <div>
                <div class="inline-flex items-center gap-2 px-3 py-1 bg-slate-900 text-white rounded-lg mb-4">
                    <span class="text-[9px] font-black uppercase tracking-widest">${inepCode ? `CÓDIGO INEP: ${inepCode}` : 'SISTEMA OFICIAL DE PRESTAÇÃO DE CONTAS'}</span>
                </div>
                <h1 class="text-3xl font-black text-slate-900 tracking-tight mb-2">${reportTitle}</h1>
                <p class="text-slate-400 font-bold uppercase text-[9px] tracking-[0.25em] mt-1">${isLivroCaixa ? 'Registro Formal de Movimentação Financeira' : 'Dashboard Executivo de Prestação de Contas'}</p>
            </div>
            <div class="text-right">
                <p class="text-[9px] font-black uppercase text-slate-400 mb-1">Emissão em</p>
                <p class="text-lg font-bold text-slate-900">${reportDate}</p>
                <p class="text-[9px] text-slate-400 font-medium">${reportTime}</p>
                <p class="text-[10px] text-slate-400 font-medium mt-2">Ref: ${periodText.replace('Período: ', '')}</p>
            </div>
        </header>

        ${options.showSummary ? `
        <section class="mb-10 no-break relative z-10">
            <div class="grid grid-cols-3 gap-6">
                <!-- Card 1: Fluxo de Caixa -->
                <div class="p-6 bg-slate-50 border border-slate-100 rounded-3xl overflow-hidden shadow-sm flex flex-col justify-between">
                    <div>
                        <span class="block text-[10px] font-black uppercase text-slate-400 mb-4 tracking-tighter">Fluxo de Caixa</span>
                        <div class="space-y-2">
                            <div class="flex justify-between text-[11px]">
                                <span class="text-slate-500 font-medium">Saldo Anterior:</span>
                                <span class="font-bold text-slate-700">${formatCurrency(totalPrev)}</span>
                            </div>
                            <div class="flex justify-between text-[11px]">
                                <span class="text-slate-500 font-medium">Entradas:</span>
                                <span class="font-bold text-emerald-600">+ ${formatCurrency(totalCred)}</span>
                            </div>
                            <div class="flex justify-between text-[11px]">
                                <span class="text-slate-500 font-medium">Saídas (Execução):</span>
                                <span class="font-bold text-red-600">- ${formatCurrency(totalDeb)}</span>
                            </div>
                        </div>
                    </div>
                    <div class="mt-4 pt-4 border-t border-slate-100">
                        <span class="block text-[9px] font-black uppercase text-slate-400 mb-1">Saldo Geral Consolidado</span>
                        <span class="text-xl font-black ${(totalPrev + totalCred - totalDeb) < 0 ? 'text-red-600' : 'text-slate-900'}">${formatCurrency(totalPrev + totalCred - totalDeb)}</span>
                    </div>
                </div>

                <!-- Card 2: Detalhamento por Categoria -->
                <div class="p-6 bg-slate-50 border border-slate-100 rounded-3xl overflow-hidden shadow-sm flex flex-col justify-between">
                    <div>
                        <span class="block text-[10px] font-black uppercase text-slate-400 mb-4 tracking-tighter">Detalhamento de Fluxos</span>
                        <div class="space-y-2">
                            <div class="flex justify-between text-[11px]">
                                <span class="text-slate-500 font-medium">Repasses / Créditos:</span>
                                <span class="font-bold text-slate-700">${formatCurrency(totalRepasses)}</span>
                            </div>
                            <div class="flex justify-between text-[11px]">
                                <span class="text-slate-500 font-medium">Rendimentos:</span>
                                <span class="font-bold text-slate-700">${formatCurrency(totalRendimentos)}</span>
                            </div>
                            <div class="flex justify-between text-[11px]">
                                <span class="text-slate-500 font-medium">Tarifas Bancárias:</span>
                                <span class="font-bold text-slate-700">${formatCurrency(totalTarifas)}</span>
                            </div>
                            <div class="flex justify-between text-[11px]">
                                <span class="text-slate-500 font-medium">Reprogramados:</span>
                                <span class="font-bold text-slate-700">${formatCurrency(totalPrev)}</span>
                            </div>
                        </div>
                    </div>
                    <div class="mt-4 flex items-center gap-2">
                        <div class="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                        <span class="text-[9px] font-bold text-slate-500 uppercase leading-tight">Valores do período</span>
                    </div>
                </div>

                <!-- Card 3: Análise de Natureza -->
                <div class="summary-nature-card p-6 bg-slate-900 rounded-3xl text-white shadow-xl shadow-slate-900/20 flex flex-col justify-between">
                    <div>
                        <div class="flex justify-between items-start mb-4">
                            <div>
                                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Resumo Financeiro</span>
                                <h3 class="text-sm font-black mt-1">Análise de Natureza</h3>
                            </div>
                        </div>

                        ${options.showCharts ? `
                        <div class="space-y-3">
                            <div class="relative w-full h-2 bg-white/10 rounded-full overflow-hidden flex chart-bar-bg">
                                <div style="width: ${custeioPerc}%" class="h-full bg-blue-500 transition-all"></div>
                                <div style="width: ${capitalPerc}%" class="h-full bg-orange-500 transition-all"></div>
                            </div>
                            <div class="space-y-1 mt-2">
                                <div class="flex items-center justify-between text-[10px]">
                                    <div class="flex items-center gap-1.5 font-bold uppercase tracking-tighter">
                                        <div class="w-2 h-2 rounded-full bg-blue-500"></div>
                                        <span>Custeio:</span>
                                    </div>
                                    <span class="font-mono">${formatCurrency(totalCusteio)} (${custeioPerc.toFixed(1)}%)</span>
                                </div>
                                <div class="flex items-center justify-between text-[10px]">
                                    <div class="flex items-center gap-1.5 font-bold uppercase tracking-tighter">
                                        <div class="w-2 h-2 rounded-full bg-orange-500"></div>
                                        <span>Capital:</span>
                                    </div>
                                    <span class="font-mono">${formatCurrency(totalCapital)} (${capitalPerc.toFixed(1)}%)</span>
                                </div>
                            </div>
                        </div>
                        ` : ''}
                    </div>
                    <div class="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
                        <span class="text-[9px] font-bold text-slate-400 uppercase">Total Movimentado</span>
                        <span class="text-[11px] font-black text-emerald-400">${formatCurrency(totalCusteio + totalCapital)}</span>
                    </div>
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
                        <div class="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg ring-4 ring-slate-100 uppercase flex-shrink-0">
                            ${school.name.charAt(0)}
                        </div>
                        <div>
                            <h2 class="text-lg font-black text-slate-900 uppercase tracking-tighter">${(school.conselho_escolar || `CONSELHO ESCOLAR DA ESCOLA ESTADUAL ${school.name}`).toUpperCase()}</h2>
                            <div class="flex gap-3 mt-1">
                                <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Unidade Executora</span>
                                <div class="w-1 h-1 rounded-full bg-slate-300 mt-1.5"></div>
                                <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">${Object.keys(school.programs).length} Programas Ativos</span>
                            </div>
                        </div>
                    </div>
                    <div class="text-right flex-shrink-0">
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
                                <div class="h-6 w-1 bg-slate-900 rounded-full flex-shrink-0"></div>
                                <h4 class="text-xs font-black text-slate-900 uppercase tracking-widest">${progName}</h4>
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
                <div class="flex flex-col gap-4 w-2/3">
                    <div>
                        <p class="text-[10px] font-black uppercase text-slate-900 tracking-tighter mb-2 flex items-center gap-2">
                            <span class="material-symbols-outlined text-[16px] text-emerald-600">verified_user</span>
                            Assinatura Digital - Chave de Autenticação (Hash SHA-256)
                        </p>
                        <p class="text-[9px] text-slate-500 font-mono break-all bg-slate-50 p-3 rounded-lg border border-slate-200 font-bold tracking-tight">
                            ${docHash.toUpperCase()}
                        </p>
                    </div>
                    <div class="flex gap-4">
                        <div class="px-3 py-1 bg-slate-900 text-white rounded text-[8px] font-bold uppercase tracking-widest">Documento Original</div>
                        <div class="px-3 py-1 border border-slate-200 text-slate-400 rounded text-[8px] font-bold uppercase tracking-widest">Prestação de Contas Verificada</div>
                    </div>
                </div>

                <div class="w-1/3 text-right">
                    <div class="mb-6 h-px bg-slate-200"></div>
                    <p class="text-[10px] font-black uppercase text-slate-900">Tesoureiro</p>
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
        <button onclick="window.print()" class="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-2 cursor-pointer transition-all hover:bg-slate-800">
            <span class="material-symbols-outlined">print</span>
            Imprimir Livro Caixa
        </button>
        <button onclick="window.close()" class="bg-red-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-500/20 flex items-center gap-2 cursor-pointer">
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
