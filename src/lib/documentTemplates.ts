import { formatCurrency, numberToWords, numberToWordsPure, getSchoolDayBefore, formatCNPJ, escapeHtmlDeep } from './printUtils';

export interface DocumentProcess {
    id: string;
    financial_entries?: any;
    financial_entry?: any;
    quotes?: any[];
    accountability_quotes?: any[];
    accountability_quote?: any[];
    items?: any[];
    accountability_items?: any[];
    contract?: any;
    discount?: number;
    category?: string;
    monthly_value?: number;
}

const getForoByCity = (city: string = '') => {
    const cityUpper = city.toUpperCase().trim();
    const mapping: { [key: string]: string } = {
        'SANTANA DO MUNDAÚ': 'UNIÃO DOS PALMARES',
        'BRANQUINHA': 'MURICI',
        'CHÃ PRETA': 'VIÇOSA',
        'IBATEGUARA': 'UNIÃO DOS PALMARES',
        'JAPARATINGA': 'MARAGOGI',
        'PINDORAMA': 'PENEDO',
    };
    return mapping[cityUpper] || cityUpper;
};

export const extractDocumentData = (rawProcess: DocumentProcess) => {
    const process = escapeHtmlDeep(rawProcess);
    let entry = process.financial_entries || process.financial_entry;
    if (Array.isArray(entry)) entry = entry[0];

    const school = entry?.schools || entry?.school || process.schools || (process as any).contract?.schools;
    const program = entry?.programs || entry?.program || process.programs || (process as any).contract?.programs;

    // Block official document generation if the program resources are not registered
    const programName = program?.name || (entry as any)?.program || (process as any).contract?.programs?.name || (typeof program === 'string' ? program : '');
    if (!programName || !programName.trim()) {
        throw new Error('O programa de recursos financeiros (ex: PDDE Básico, PDDE Qualidade) não está cadastrado ou vinculado a este processo. A geração do documento oficial foi bloqueada para evitar informações incorretas. Por favor, vincule um programa válido.');
    }

    let quotes = process.quotes || process.accountability_quotes || process.accountability_quote || [];

    // Fallback: If no quotes found, try to use supplier from financial entry
    if (quotes.length === 0 && entry?.suppliers) {
        const sup = entry.suppliers;
        quotes = [{
            supplier_name: sup.name,
            supplier_cnpj: sup.cnpj,
            total_value: Math.abs(entry.value || 0),
            is_winner: true,
            supplier_id: sup.id,
            suppliers: sup
        }];
    }

    const winnerQuote = quotes.find((q: any) => q.is_winner);
    const competitorQuotes = quotes.filter((q: any) => !q.is_winner) || [];
    const allQuotes = [winnerQuote, ...competitorQuotes].filter(Boolean).slice(0, 3);
    const winner = winnerQuote;
    const supplier = winnerQuote?.suppliers || winnerQuote?.supplier || entry?.suppliers || entry?.supplier;

    const invoiceDate = entry?.date ? new Date(entry.date) : new Date();
    const paymentDate = entry?.payment_date ? new Date(entry.payment_date) : null;

    return {
        entry,
        school,
        program,
        quotes,
        winnerQuote,
        competitorQuotes,
        allQuotes,
        winner,
        supplier,
        invoiceDate,
        paymentDate
    };
};

export const validateContractData = (process: DocumentProcess) => {
    const { entry, school, program, supplier } = extractDocumentData(process);
    const contract = process.contract;
    const terms = contract?.terms_json || {};

    const legalRepresentativeName = terms.custom_director_name || school?.director;
    const legalRepresentativeCpf = terms.custom_director_cpf || school?.director_cpf;
    const legalRepresentativeRg = terms.custom_director_rg || school?.director_rg;

    const supplierRepName = contract?.representative_name || supplier?.rep_name;
    const supplierRepCpf = contract?.representative_cpf || supplier?.rep_cpf;

    const rubricName = (entry as any)?.rubrics?.name || (process as any).contract?.rubrics?.name || (entry as any)?.rubric;
    const rubricObj = (entry as any)?.rubrics || (process as any).contract?.rubrics;
    const natureDisplay = entry?.nature || (contract as any)?.nature || rubricObj?.default_nature || 'Custeio';

    const monthlyValue = contract?.monthly_value || (Math.abs(entry?.value || 0));
    const startDate = contract?.start_date;
    const endDate = contract?.end_date;

    const checks = [
        { value: school?.conselho_escolar, label: 'Conselho Escolar da Escola (UEx)' },
        { value: school?.cnpj, label: 'CNPJ do Conselho Escolar' },
        { value: school?.address, label: 'Endereço da Escola' },
        { value: legalRepresentativeName, label: 'Nome do Presidente/Diretor do Conselho' },
        { value: legalRepresentativeCpf, label: 'CPF do Presidente/Diretor do Conselho' },
        { value: legalRepresentativeRg, label: 'RG do Presidente/Diretor do Conselho' },
        { value: supplier?.name, label: 'Nome/Razão Social do Fornecedor' },
        { value: supplier?.cnpj, label: 'CNPJ do Fornecedor' },
        { value: supplier?.address, label: 'Endereço do Fornecedor' },
        { value: supplierRepName, label: 'Nome do Representante Legal do Fornecedor' },
        { value: supplierRepCpf, label: 'CPF do Representante Legal do Fornecedor' },
        { value: startDate, label: 'Data de Início da Vigência' },
        { value: endDate, label: 'Data de Fim da Vigência' },
        { value: monthlyValue, label: 'Valor Mensal do Contrato' },
        { value: program?.name, label: 'Programa de Recursos (FNDE/SEDUC)' },
        { value: rubricName, label: 'Rubrica Financeira (Custeio/Capital)' },
        { value: natureDisplay, label: 'Natureza da Despesa' }
    ];

    const missing: string[] = [];
    const isPlaceholder = (val: any) => {
        if (val === null || val === undefined) return true;
        const s = String(val).trim();
        return (
            s === '' ||
            s.startsWith('___') ||
            s.includes('_____') ||
            s.toLowerCase().includes('preencher')
        );
    };

    checks.forEach(item => {
        if (isPlaceholder(item.value)) {
            missing.push(item.label);
        }
    });

    if (missing.length > 0) {
        throw new Error(`Não foi possível gerar o contrato. Corrija os seguintes dados no cadastro do processo ou contrato:\n\n• ${missing.join('\n• ')}`);
    }
};

export const getDocumentBaseCSS = (customStyles: string = '', isLandscape: boolean = false) => {
    return `<head>
    <meta charset="utf-8"/>
    <style>
        /* Modern System Sans-Serif Stack (Offline & High-Quality) */
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #ffffff;
            color: black;
            margin: 0;
            padding: 0;
        }
        
        @media print {
            body { background: white !important; padding: 0 !important; margin: 0 !important; }
            .no-print { display: none !important; }
            @page { size: ${isLandscape ? 'A4 landscape' : 'A4'}; margin: ${isLandscape ? '1cm' : '0'}; }
        }

        /* Native CSS Utilities replacing Tailwind CSS for absolute offline reliability */
        .w-full { width: 100%; }
        .w-1\\/2 { width: 50%; }
        .w-1\\/3 { width: 33.333333%; }
        .w-2\\/3 { width: 66.666667%; }
        .w-1\\/4 { width: 25%; }
        .w-3\\/4 { width: 75%; }
        .w-24 { width: 6rem; }
        .w-28 { width: 7rem; }
        .w-32 { width: 8rem; }
        .w-36 { width: 9rem; }
        .w-40 { width: 10rem; }
        .w-48 { width: 12rem; }
        
        .flex { display: flex; }
        .flex-col { flex-direction: column; }
        .flex-row { flex-direction: row; }
        .justify-between { justify-content: space-between; }
        .justify-center { justify-content: center; }
        .justify-end { justify-content: flex-end; }
        .items-center { align-items: center; }
        .items-end { align-items: flex-end; }
        .items-start { align-items: flex-start; }
        
        .gap-1 { gap: 0.25rem; }
        .gap-2 { gap: 0.5rem; }
        .gap-3 { gap: 0.75rem; }
        .gap-4 { gap: 1rem; }
        .gap-6 { gap: 1.5rem; }
        
        .grid { display: grid; }
        .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        .grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
        .gap-x-20 { column-gap: 5rem; }
        .gap-y-4 { row-gap: 1rem; }
        
        .text-left { text-align: left; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .text-justify { text-align: justify; }
        .text-justified { text-align: justify; text-justify: inter-word; }
        
        .font-bold { font-weight: bold; }
        .font-semibold { font-weight: 600; }
        .font-medium { font-weight: 500; }
        .font-light { font-weight: 300; }
        
        .uppercase { text-transform: uppercase; }
        .underline { text-decoration: underline; }
        .underline-offset-8 { text-underline-offset: 8px; }
        .decoration-transparent { text-decoration-color: transparent; }
        
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
        .text-\\[12px\\] { font-size: 12px; }
        .text-\\[14px\\] { font-size: 14px; }
        
        .mt-auto { margin-top: auto; }
        .mb-1 { margin-bottom: 0.25rem; }
        .mb-2 { margin-bottom: 0.5rem; }
        .mb-3 { margin-bottom: 0.75rem; }
        .mb-4 { margin-bottom: 1rem; }
        .mb-6 { margin-bottom: 1.5rem; }
        .mb-8 { margin-bottom: 2rem; }
        .mb-10 { margin-bottom: 2.5rem; }
        .mb-12 { margin-bottom: 3rem; }
        .mb-16 { margin-bottom: 4rem; }
        
        .mt-1 { margin-top: 0.25rem; }
        .mt-2 { margin-top: 0.5rem; }
        .mt-3 { margin-top: 0.75rem; }
        .mt-4 { margin-top: 1rem; }
        .mt-6 { margin-top: 1.5rem; }
        .mt-8 { margin-top: 2rem; }
        .mt-10 { margin-top: 2.5rem; }
        .mt-12 { margin-top: 3rem; }
        .mt-16 { margin-top: 4rem; }
        
        .p-4 { padding: 1rem; }
        .p-6 { padding: 1.5rem; }
        .p-12 { padding: 3rem; }
        .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
        .pb-1 { padding-bottom: 0.25rem; }
        .pb-2 { padding-bottom: 0.5rem; }
        .pb-4 { padding-bottom: 1rem; }
        .pb-6 { padding-bottom: 1.5rem; }
        .pt-1 { padding-top: 0.25rem; }
        .pt-2 { padding-top: 0.5rem; }
        .pt-4 { padding-top: 1rem; }
        .pt-6 { padding-top: 1.5rem; }
        .pt-10 { padding-top: 2.5rem; }
        
        .border-t { border-top: 1px solid #e2e8f0; }
        .border-b { border-bottom: 1px solid #e2e8f0; }
        .border { border: 1px solid #e2e8f0; }
        .border-slate-100 { border-color: #f1f5f9; }
        .border-gray-100 { border-color: #f3f4f6; }
        .text-gray-300 { color: #d1d5db; }
        .text-slate-400 { color: #94a3b8; }
        .bg-gray-100 { background-color: #f3f4f6; }
        
        ${customStyles}
    </style>
</head>`;
};

export const generateAtaHTML = (process: DocumentProcess) => {
    const { entry, school, program, winnerQuote, allQuotes } = extractDocumentData(process);

    const invoiceDate = entry?.date ? new Date(entry.date) : new Date();
    const docDate = getSchoolDayBefore(invoiceDate, 2);
    const meetingTime = docDate.getDate() % 2 === 0 ? '15:30' : '09:00';

    const customStyles = `
        body { padding: 20px; }
        @media print {
            .print-container { box-shadow: none !important; border: none !important; width: 100% !important; padding: 1.5cm 2cm !important; }
        }
        .print-container { background: white; width: 210mm; margin: 0 auto; padding: 2cm; min-height: 297mm; }
        .text-justified { line-height: 1.6; }
    `;

    return `<!DOCTYPE html>
<html lang="pt-BR">
${getDocumentBaseCSS(customStyles)}
<body class="flex flex-col items-center">
    <div class="print-container">
        <!-- Header -->
        <div class="text-center mb-10 space-y-4">
            <h2 class="text-[14px] font-bold uppercase">${(school?.conselho_escolar || `CONSELHO ESCOLAR DA ESCOLA ESTADUAL ${school?.name || 'UNIDADE EXECUTORA'}`).toUpperCase()}</h2>
            <h1 class="text-[14px] font-bold uppercase leading-tight">
                ATA DA ASSEMBLEIA GERAL EXTRAORDINÁRIA DA UNIDADE EXECUTORA CONSELHO ESCOLAR<br/>
                DA ESCOLA ESTADUAL ${school?.name?.toUpperCase() || 'UNIDADE EXECUTORA'}
            </h1>
        </div>

        <!-- Paragraph 1 -->
        <div class="text-justified text-[14px] mb-10">
            Às ${meetingTime} horas do dia <strong>${docDate.getDate()} DE ${docDate.toLocaleString('pt-BR', { month: 'long' }).toUpperCase()} DE ${docDate.getFullYear()}</strong>, foi realizada pesquisa de preços para aquisição de produtos do <strong>${entry?.description?.toUpperCase()}</strong>, com recursos oriundos do <strong>${program?.name || 'PNAE/FNDE'}</strong>, entre as empresas:
        </div>

        <!-- Proponents Section -->
        <div class="space-y-6 mb-12 text-[14px]">
            ${allQuotes.map((q: any, i: number) => `
            <div>
                <p class="font-bold mb-1">${i + 1} - ${q.supplier_name?.toUpperCase()}</p>
                <div class="ml-4 grid grid-cols-[60px_1fr] gap-x-2 leading-relaxed">
                    <span class="font-medium text-gray-700">CNPJ:</span>
                    <span>${formatCNPJ(q.supplier_cnpj)}</span>
                    <span class="font-medium text-gray-700">VALOR:</span>
                    <div>
                        <span class="font-bold">${formatCurrency(q.total_value)}</span>
                        <span class="ml-2 italic text-gray-600">(${numberToWords(q.total_value)})</span>
                    </div>
                </div>
            </div>`).join('')}
        </div>

        <!-- Paragraph 2 -->
        <div class="text-justified text-[14px] mb-12">
            Portanto, verificamos que o fornecedor <strong>${winnerQuote?.supplier_name?.toUpperCase()}</strong>, apresentou a melhor proposta, sendo assim autorizamos a aquisição dos produtos ofertados, atendendo as normas do FNDE. Nada mais havendo a tratar, o Presidente, deu por encerrada a reunião. Eu, <strong>${school?.secretary?.toUpperCase() || '____________________'}</strong>, lavrei a presente ata que depois de lida e aprovada, será assinada por mim e pelos demais presentes.
        </div>

        <!-- Location and Date -->
        <div class="text-center font-bold text-[14px] mb-16 uppercase">
            ${school?.city?.toUpperCase() || 'ALAGOAS'}/AL, ${docDate.getDate()} DE ${docDate.toLocaleString('pt-BR', { month: 'long' }).toUpperCase()} DE ${docDate.getFullYear()}
        </div>

        <!-- Signatures Section -->
        <div class="grid grid-cols-2 gap-x-20 mb-8 items-end">
            <div class="text-left">
                <p class="text-[14px] font-bold underline underline-offset-8 decoration-transparent">Primeiro Secretário:</p>
            </div>
            <div class="text-left">
                <p class="text-[14px] font-bold underline underline-offset-8 decoration-transparent">Presidente:</p>
            </div>
        </div>

        <!-- Conselheiros Section -->
        <div class="text-[14px] mb-10">
            <p class="font-bold">Conselheiros:</p>
        </div>

        <!-- Subtle Footer Info -->
        <div class="mt-auto pt-10 flex justify-between items-center text-[8px] text-gray-300 border-t border-gray-100 no-print">
            <div>Hash ID: ${process.id.substring(0, 8).toUpperCase()}</div>
            <div>Emitido via BRN Suite Escolas em ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
    </div>
</body>
</html>`;
};



export const generateConsolidacaoHTML = (process: DocumentProcess) => {
    const { school, program, allQuotes, invoiceDate } = extractDocumentData(process);
    const items = (process.items || process.accountability_items || []);

    const getUnitPrice = (item: any, quote: any) => {
        const qItem = quote.accountability_quote_items?.find((qi: any) => qi.description === item.description);
        return quote.is_winner ? item.winner_unit_price : (qItem?.unit_price || 0);
    };

    const customStyles = `
        body { padding: 10px; font-size: 8px; }
        @media print { body { padding: 0; } }
        table { width: 100%; border-collapse: collapse; margin-bottom: 5px; }
        th, td { border: 1.5px solid black; padding: 2px 4px; }
        .bg-gray { background-color: #f3f3f3; }
        .font-bold { font-weight: bold; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .uppercase { text-transform: uppercase; }
        .bloco-title { background: #eee; font-weight: bold; padding: 4px; border: 1.5px solid black; border-bottom: none; }
    `;

    return `<!DOCTYPE html>
<html lang="pt-BR">
${getDocumentBaseCSS(customStyles, true)}
<body>
    <div class="w-full">
        <div class="flex justify-between items-end mb-4">
            <div class="font-bold text-lg">PNAE/FNDE</div>
            <div class="font-bold text-lg">CONSOLIDAÇÃO DE PESQUISAS DE PREÇOS</div>
        </div>

        <div class="bloco-title uppercase">BLOCO I - IDENTIFICAÇÃO DA UNIDADE EXECUTORA PRÓPRIA (UEx) / ENTIDADE MANTENEDORA (EM)</div>
        <table>
            <tr>
                <td width="55%"><span class="font-bold">Uex:</span> ${(school?.conselho_escolar || `CONSELHO ESCOLAR DA ESCOLA ESTADUAL ${school?.name || ''}`).toUpperCase()}</td>
                <td width="15%">${formatCNPJ(school?.cnpj)}</td>
                <td width="10%" class="bg-gray font-bold">RECURSO:</td>
                <td width="10%">${program?.name || '---'}</td>
                <td width="5%" class="bg-gray font-bold">EXERCÍCIO:</td>
                <td width="5%">${invoiceDate.getFullYear()}</td>
            </tr>
        </table>

        <div class="bloco-title uppercase">BLOCO II - IDENTIFICAÇÃO DOS PROPONENTES</div>
        <table>
            <tr class="bg-gray font-bold text-center">
                <td>PROPONENTE (A)</td>
                <td>PROPONENTE (B)</td>
                <td>PROPONENTE (C)</td>
            </tr>
            <tr class="uppercase">
                <td>${allQuotes[0]?.supplier_name || '---'}<br/>${formatCNPJ(allQuotes[0]?.supplier_cnpj)}</td>
                <td>${allQuotes[1]?.supplier_name || '---'}<br/>${formatCNPJ(allQuotes[1]?.supplier_cnpj)}</td>
                <td>${allQuotes[2]?.supplier_name || '---'}<br/>${formatCNPJ(allQuotes[2]?.supplier_cnpj)}</td>
            </tr>
        </table>

        <div class="bloco-title uppercase">BLOCO III - PROPOSTAS</div>
        <table>
            <thead class="bg-gray font-bold text-center">
                <tr>
                    <td rowspan="2">Item</td>
                    <td rowspan="2">Descrição</td>
                    <td rowspan="2">Unid</td>
                    <td rowspan="2">Qtde</td>
                    <td colspan="4">PREÇOS UNITÁRIOS</td>
                    <td>Vencedor</td>
                    <td colspan="3">MENOR PREÇO POR ITEM</td>
                    <td colspan="3">MENOR PREÇO GLOBAL</td>
                </tr>
                <tr>
                    <td>Prop (A)</td>
                    <td>Prop (B)</td>
                    <td>Prop (C)</td>
                    <td>M. Preço</td>
                    <td></td>
                    <td>Prop (A)</td>
                    <td>Prop (B)</td>
                    <td>Prop (C)</td>
                    <td>Prop (A)</td>
                    <td>Prop (B)</td>
                    <td>Prop (C)</td>
                </tr>
            </thead>
            <tbody>
                ${items.map((it, idx) => {
        const pA = allQuotes[0] ? getUnitPrice(it, allQuotes[0]) : 0;
        const pB = allQuotes[1] ? getUnitPrice(it, allQuotes[1]) : 0;
        const pC = allQuotes[2] ? getUnitPrice(it, allQuotes[2]) : 0;
        const prices = [pA, pB, pC].filter(p => p > 0);
        const minP = prices.length > 0 ? Math.min(...prices) : 0;
        return `
                <tr class="uppercase text-center">
                    <td>${String(idx + 1).padStart(2, '0')}</td>
                    <td class="text-left">${it.description}</td>
                    <td>${it.unit}</td>
                    <td>${it.quantity}</td>
                    <td class="${pA === minP && pA > 0 ? 'bg-yellow-100' : ''}">${pA ? formatCurrency(pA) : ''}</td>
                    <td class="${pB === minP && pB > 0 ? 'bg-yellow-100' : ''}">${pB ? formatCurrency(pB) : ''}</td>
                    <td class="${pC === minP && pC > 0 ? 'bg-yellow-100' : ''}">${pC ? formatCurrency(pC) : ''}</td>
                    <td>${formatCurrency(minP)}</td>
                    <td>Prop (${pA === minP ? 'A' : pB === minP ? 'B' : 'C'})</td>
                    <td>${pA === minP ? formatCurrency(pA * it.quantity) : ''}</td>
                    <td>${pB === minP ? formatCurrency(pB * it.quantity) : ''}</td>
                    <td>${pC === minP ? formatCurrency(pC * it.quantity) : ''}</td>
                    <td>${pA ? formatCurrency(pA * it.quantity) : ''}</td>
                    <td>${pB ? formatCurrency(pB * it.quantity) : ''}</td>
                    <td>${pC ? formatCurrency(pC * it.quantity) : ''}</td>
                </tr>`;
    }).join('')}
            </tbody>
        </table>

        <div class="bloco-title uppercase">BLOCO IV - APURAÇÃO DAS PROPOSTAS</div>
        <table>
            <tr class="font-bold bg-gray">
                <td>VALOR TOTAL DAS PROPOSTAS</td>
                <td class="text-right">${formatCurrency(allQuotes[0]?.total_value || 0)}</td>
                <td class="text-right">${formatCurrency(allQuotes[1]?.total_value || 0)}</td>
                <td class="text-right">${formatCurrency(allQuotes[2]?.total_value || 0)}</td>
            </tr>
            <tr class="font-bold">
                <td>VALOR TOTAL COM DESCONTO</td>
                <td class="text-right text-blue-700">${formatCurrency(allQuotes[0]?.total_value - (process.discount || 0))}</td>
                <td class="text-right">${allQuotes[1] ? formatCurrency(allQuotes[1]?.total_value) : ''}</td>
                <td class="text-right">${allQuotes[2] ? formatCurrency(allQuotes[2]?.total_value) : ''}</td>
            </tr>
        </table>

        <div class="grid grid-cols-2 gap-8 mt-4">
            <div class="text-center font-bold">
                <p>LOCAL E DATA: ${school?.city?.toUpperCase() || 'ALAGOAS'}, ${invoiceDate.toLocaleDateString('pt-BR')}</p>
            </div>
            <div class="text-center font-bold">
                <div class="border-t border-black mb-1 mx-8 pt-1">${school?.director?.toUpperCase() || 'PRESIDENTE'}</div>
                <p>NOME DO PRESIDENTE DA Uex</p>
            </div>
        </div>
    </div>
</body>
</html>`;
};

export const generateOrdemHTML = (process: DocumentProcess) => {
    const { school, winner, invoiceDate } = extractDocumentData(process);
    const items = (process.items || process.accountability_items || []).slice(0, 27);
    const dateText = invoiceDate.toLocaleDateString('pt-BR');

    const rows = [...items];
    while (rows.length < 27) rows.push({});

    const customStyles = `
        * { box-sizing: border-box; }
        body { padding: 10px; font-size: 10px; }
        @media print { body { padding: 0; } }
        table { width: 100%; border-collapse: collapse; margin-bottom: -1px; table-layout: fixed; }
        th, td { border: 1.5px solid black; padding: 4px 8px; height: 18px; word-wrap: break-word; overflow: hidden; }
        .bg-gray { background-color: #f3f3f3; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .uppercase { text-transform: uppercase; }
    `;

    return `<!DOCTYPE html>
<html lang="pt-BR">
${getDocumentBaseCSS(customStyles)}
<body>
    <div style="width: 100%; max-width: 190mm; margin: 0 auto;">
        <table>
            <tr>
                <td class="font-bold text-sm">PNAE/FNDE</td>
                <td class="text-right font-bold text-sm">ORDEM DE COMPRA</td>
            </tr>
        </table>
        <table>
            <tr>
                <td width="15%" class="font-bold text-center bg-gray">UEX CONTRATANTE:</td>
                <td>${(school?.conselho_escolar || `CONSELHO ESCOLAR DA ESCOLA ESTADUAL ${school?.name || '---'}`).toUpperCase()}</td>
                <td width="10%" class="font-bold text-center bg-gray">CNPJ:</td>
                <td width="20%">${formatCNPJ(school?.cnpj)}</td>
            </tr>
            <tr>
                <td class="font-bold text-center bg-gray">NOME DA ESCOLA:</td>
                <td>${school?.name?.toUpperCase() || '---'}</td>
                <td class="font-bold text-center bg-gray">SEEC:</td>
                <td>${school?.seec || '---'}</td>
            </tr>
        </table>
        <table>
            <tr>
                <td width="15%" class="font-bold text-center bg-gray uppercase">Proponente Vencedor:</td>
                <td>${winner?.supplier_name?.toUpperCase() || '---'}</td>
                <td width="10%" class="font-bold text-center bg-gray">CNPJ:</td>
                <td width="20%">${formatCNPJ(winner?.supplier_cnpj)}</td>
            </tr>
        </table>
        <div class="text-[9px] p-2 leading-tight border-x border-black">
            Autorizo o fornecimento do produto/material, conforme descrição na planilha abaixo, em razão do proponente acima identificado ter apresentado uma proposta adequada e de menor preço, conforme previsto na RESOLUÇÃO CD/FNDE Nº 09, DE 02 DE MARÇO DE 2011.
        </div>
        <table>
            <thead class="bg-gray font-bold text-center uppercase">
                <tr>
                    <td width="5%">ITEM</td>
                    <td width="50%">DESCRIÇÃO</td>
                    <td width="8%">UND.</td>
                    <td width="8%">QTD.</td>
                    <td width="14%">VALOR UNITÁRIO</td>
                    <td width="15%">VALOR TOTAL</td>
                </tr>
            </thead>
            <tbody>
                ${rows.map((it: any, idx) => `
                <tr class="uppercase">
                    <td class="text-center">${it.description ? String(idx + 1).padStart(2, '0') : ''}</td>
                    <td>${it.description || ''}</td>
                    <td class="text-center">${it.unit || ''}</td>
                    <td class="text-center">${it.quantity || ''}</td>
                    <td class="text-right">${it.winner_unit_price ? formatCurrency(it.winner_unit_price) : ''}</td>
                    <td class="text-right font-bold">${it.description ? formatCurrency((it.quantity || 0) * (it.winner_unit_price || 0)) : ''}</td>
                </tr>
                `).join('')}
            </tbody>
            <tfoot>
                <tr>
                    <td colspan="5" class="text-right font-bold bg-gray uppercase">TOTAL</td>
                    <td class="text-right font-bold">${formatCurrency((winner?.total_value || 0) - (process.discount || 0))}</td>
                </tr>
            </tfoot>
        </table>
        <table>
            <tr>
                <td class="font-bold text-center bg-gray" width="20%">NOME DO(A) RESPONSÁVEL</td>
                <td>${school?.director?.toUpperCase() || '---'}</td>
                <td class="font-bold text-center bg-gray" width="15%">FUNÇÃO</td>
                <td class="text-center uppercase" width="25%">PRESIDENTE</td>
            </tr>
        </table>
        <table>
            <tr>
                <td class="font-bold text-center bg-gray" width="20%">LOCAL E DATA</td>
                <td>${school?.city?.toUpperCase() || 'ALAGOAS'}, ${dateText}</td>
                <td class="font-bold text-center bg-gray" width="20%">ASSINATURA DO(A) RESPONSÁVEL</td>
                <td class="h-10"></td>
            </tr>
        </table>
    </div>
</body>
</html>`;
};

export const generateReciboHTML = (process: DocumentProcess) => {
    const { entry, school, program, winner, supplier, paymentDate } = extractDocumentData(process);

    // Dates
    const invoiceDate = entry?.date ? new Date(entry.date) : null;

    const dispInvoiceDate = invoiceDate ? invoiceDate.toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '___/___/_____';
    const dispPaymentDate = paymentDate ? paymentDate.toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '___/___/_____';

    // Bottom date uses payment date
    const dateLong = (paymentDate || new Date()).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

    const totalValue = (winner?.total_value || 0) - (process.discount || 0);

    // Payment method label
    const paymentMethod = entry?.payment_method?.toLowerCase() || '';
    let paymentLabel = 'AUTORIZAÇÃO';
    if (paymentMethod.includes('pix')) {
        paymentLabel = 'OPERAÇÃO';
    } else if (paymentMethod.includes('cartão') || paymentMethod.includes('cartao')) {
        paymentLabel = 'AUTORIZAÇÃO';
    } else if (paymentMethod.includes('cheque')) {
        paymentLabel = 'CHEQUE';
    } else if (paymentMethod.includes('transferência') || paymentMethod.includes('transferencia')) {
        paymentLabel = 'TRANSFERÊNCIA';
    }

    const customStyles = `
        * { box-sizing: border-box; }
        body { background: #f8fafc; padding: 20px; }
        @media print { 
            body { background: white !important; padding: 0 !important; }
            .print-container { padding: 1.5cm !important; width: 100% !important; border: none !important; box-shadow: none !important; } 
        }
        .print-container { background: white; width: 190mm; margin: 0 auto; padding: 2cm; min-height: 297mm; border: 1px solid #e2e8f0; position: relative; }
        .text-justified { text-align: justify; text-justify: inter-word; line-height: 1.8; }
    `;

    return `<!DOCTYPE html>
<html lang="pt-BR">
${getDocumentBaseCSS(customStyles)}
<body class="flex flex-col items-center">
    <div class="print-container">
        <div class="text-center border-b pb-8 mb-12">
            <h1 class="text-xl font-black uppercase mb-2">${supplier?.name || winner?.supplier_name || 'FORNECEDOR'}</h1>
            <div class="text-[11px] text-gray-500 font-medium space-y-0.5">
                <p>CNPJ: ${formatCNPJ(supplier?.cnpj || winner?.supplier_cnpj)}</p>
                <p>${supplier?.address || 'ENDEREÇO'}</p>
                <p>CEP: ${supplier?.cep || '00.000-000'} - ${supplier?.city || 'LOCAL'}/AL</p>
            </div>
        </div>

        <div class="flex justify-between items-center mb-16">
            <h2 class="text-4xl font-black uppercase tracking-tighter">RECIBO</h2>
            <div class="border-2 border-gray-100 bg-gray-50 p-4 rounded-xl text-right min-w-[200px]">
                <span class="block text-[10px] uppercase font-bold text-gray-400 mb-1">VALOR TOTAL</span>
                <span class="text-2xl font-black">${formatCurrency(totalValue)}</span>
            </div>
        </div>

        <div class="p-8 text-justified text-[14px] bg-gray-50/30 rounded-2xl border border-gray-100">
            RECEBEMOS DO <strong>${(school?.conselho_escolar || `CONSELHO ESCOLAR DA ESCOLA ESTADUAL ${school?.name || 'UNIDADE EXECUTORA'}`).toUpperCase()}</strong>, 
            CNPJ <strong>${formatCNPJ(school?.cnpj)}</strong>, SITUADO NA <strong>${school?.address?.toUpperCase()}${school?.city ? `, NO MUNICÍPIO DE ${school.city.toUpperCase()}` : ''}${school?.uf ? ` - ${school.uf.toUpperCase()}` : ''}${school?.cep ? `, CEP: ${school.cep}` : ''}</strong>, 
            A IMPORTÂNCIA DE <strong>${formatCurrency(totalValue)} (${numberToWords(totalValue).toUpperCase()})</strong>, 
            REFERENTE A COMPRA DE PRODUTOS CONFORME NOTA FISCAL DE Nº <strong>${entry?.document_number || entry?.invoice_number || '_______'}</strong>, 
            DATADA DE <strong>${dispInvoiceDate}</strong>.
            <br/><br/>
            PAGO COM RECURSO <strong>${program?.name?.toUpperCase() || 'PNAE/FNDE'}</strong>, 
            ${paymentLabel} Nº <strong>${entry?.auth_number || '_______'}</strong>, 
            DATADA DE <strong>${dispPaymentDate}</strong>.
        </div>

        <div class="text-right italic text-[13px] mt-20 mb-32">
            ${school?.city || 'ALAGOAS'}, ${dateLong}
        </div>

        <div class="flex flex-col items-center relative">
            ${supplier?.stamp_url ? `
                <div class="absolute -top-24 opacity-80 mix-blend-multiply pointer-events-none" style="z-index: 10;">
                    <img src="${supplier.stamp_url}" class="rotate-[-5deg]" style="width: 200px; height: auto; display: block;" />
                </div>
            ` : ''}
            <div class="w-2/3 border-t border-black mb-2"></div>
            <p class="text-[11px] font-black uppercase text-gray-900">ASSINATURA DO FORNECEDOR</p>
            <p class="text-[10px] text-gray-400 font-medium uppercase">${supplier?.name || winner?.supplier_name}</p>
        </div>
    </div>
</body>
</html>`;
};

export const generateCotacaoHTML = (process: DocumentProcess, supplierIdx: number = 0) => {
    const { school, allQuotes, invoiceDate } = extractDocumentData(process);
    const quote = allQuotes[supplierIdx];

    if (!quote) return '<h1>Erro: Cotação não encontrada</h1>';

    const supplier = (quote as any).suppliers || (quote as any).supplier;
    const items = (process.items || process.accountability_items || []).slice(0, 27);
    const quoteDate = getSchoolDayBefore(invoiceDate, 15);
    const dateText = quoteDate.toLocaleDateString('pt-BR');

    const rows = [...items];
    while (rows.length < 27) rows.push({});

    const customStyles = `
        * { box-sizing: border-box; }
        body { padding: 10px; font-size: 9px; }
        @media print { body { padding: 0; } }
        table { width: 100%; border-collapse: collapse; margin-bottom: -1px; table-layout: fixed; }
        th, td { border: 1px solid black; padding: 3px 6px; height: 18px; word-wrap: break-word; }
        .bg-gray { background-color: #f3f3f3; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
    `;

    return `<!DOCTYPE html>
<html lang="pt-BR">
${getDocumentBaseCSS(customStyles)}
<body>
    <div style="width: 100%; max-width: 190mm; margin: 0 auto;">
        <table>
            <tr class="bg-gray font-bold text-center text-[10px]">
                <td>PNAE/FNDE - PLANILHA DE PESQUISA DE PREÇOS - ORÇAMENTO</td>
            </tr>
        </table>
        <table>
            <tr>
                <td width="65%" class="font-bold bg-gray"></td>
                <td width="10%" class="font-bold bg-gray">CNPJ:</td>
                <td>${formatCNPJ(quote.supplier_cnpj)}</td>
            </tr>
            <tr>
                <td class="font-bold uppercase">NOME DO FORNECEDOR: ${quote.supplier_name}</td>
                <td colspan="2"></td>
            </tr>
            <tr>
                <td colspan="3"><span class="font-bold uppercase">ENDEREÇO:</span> ${supplier?.address || '---'}</td>
            </tr>
            <tr>
                <td class="uppercase"><span class="font-bold">UF:</span> ${supplier?.uf || 'AL'} <span class="font-bold ml-4">MUNICÍPIO:</span> ${supplier?.city || '---'} <span class="font-bold ml-4">CEP:</span> ${supplier?.cep || '---'} <span class="font-bold ml-4">TELEFONE:</span> ${supplier?.phone || '---'}</td>
                <td colspan="2"></td>
            </tr>
        </table>
        <table class="border-t-2">
            <tr>
                <td width="65%" class="font-bold bg-gray"></td>
                <td width="10%" class="font-bold bg-gray">CNPJ:</td>
                <td>${formatCNPJ(school?.cnpj)}</td>
            </tr>
            <tr>
                <td class="font-bold uppercase">NOME DO CLIENTE: ${(school?.conselho_escolar || `CONSELHO ESCOLAR DA ESCOLA ESTADUAL ${school?.name || '---'}`).toUpperCase()}</td>
                <td colspan="2"></td>
            </tr>
            <tr>
                <td colspan="3"><span class="font-bold uppercase">ENDEREÇO:</span> ${school?.address || '---'}</td>
            </tr>
            <tr>
                <td class="uppercase"><span class="font-bold">UF:</span> ${school?.uf || 'AL'} <span class="font-bold ml-4">MUNICÍPIO:</span> ${school?.city || '---'} <span class="font-bold ml-4">CEP:</span> ${school?.cep || '---'} <span class="font-bold ml-4">TELEFONE:</span> ${school?.phone || '---'}</td>
                <td colspan="2"></td>
            </tr>
        </table>
        <table class="mt-4">
            <thead class="bg-gray font-bold text-center">
                <tr>
                    <td width="5%">ITEM</td>
                    <td width="50%">DESCRIÇÃO</td>
                    <td width="8%">UND.</td>
                    <td width="8%">QTD.</td>
                    <td width="15%">VALOR UNITÁRIO</td>
                    <td width="15%">VALOR TOTAL</td>
                </tr>
            </thead>
            <tbody>
                ${rows.map((it: any, idx) => {
        const qItem = quote.accountability_quote_items?.find((qi: any) => qi.description === it.description);
        const price = quote.is_winner ? it.winner_unit_price : (qItem?.unit_price || 0);
        return `
                <tr class="uppercase text-[9px]">
                    <td class="text-center">${it.description ? String(idx + 1).padStart(2, '0') : ''}</td>
                    <td>${it.description || ''}</td>
                    <td class="text-center">${it.unit || ''}</td>
                    <td class="text-center">${it.quantity || ''}</td>
                    <td class="text-right">${price ? formatCurrency(price) : ''}</td>
                    <td class="text-right font-bold">${price ? formatCurrency(price * it.quantity) : ''}</td>
                </tr>`;
    }).join('')}
            </tbody>
            <tfoot>
                <tr class="bg-gray font-bold">
                    <td colspan="5" class="text-center uppercase">VALOR TOTAL</td>
                    <td class="text-right">${formatCurrency(quote.total_value)}</td>
                </tr>
            </tfoot>
        </table>
        <div class="mt-6 text-center font-bold uppercase">
            <span>DATA:</span> <span>${dateText}</span>
        </div>

        <div class="mt-2 flex justify-between items-end gap-4 relative min-h-[100px]">
            <div class="space-y-1 font-bold text-[8px] leading-tight flex-1">
                <p>Serão atendidas as seguintes condições:</p>
                <p>Todos os itens da planilha deverão ser cotados;</p>
                <p>Período de validade da proposta: 30 dias da catação;</p>
                <p>Prazo máximo de entrega/execução: 02 dias a partir da ordem de compra/serviço pela Unidade Executora;</p>
                <p>Recebimento mediante apresentação de nota fiscal e certidões;</p>
                <p>Pagamento após conferência atesto da nota fiscal, mediante apresentação de recibo.</p>
            </div>
            ${supplier?.stamp_url ? `
            <div class="flex items-center justify-center min-w-[140px] h-[80px] mr-4 relative" style="z-index: 10;">
                <img src="${supplier.stamp_url}" class="rotate-[-3deg]" style="width: 170px; height: auto; display: block; pointer-events: none;" />
            </div>
            ` : ''}
        </div>
</body>
</html>`;
};

export const generateContratoServicoHTML = (process: DocumentProcess) => {
    // Perform thorough contract validation first
    validateContractData(process);

    const { entry, school, program, supplier } = extractDocumentData(process);
    const contract = process.contract;
    const terms = contract?.terms_json || {};
    const category = process.category || contract?.category || entry?.category;

    if (category === 'GÁS') {
        return generateContratoGasHTML(process);
    }

    const monthlyValue = contract?.monthly_value || (Math.abs(entry?.value || 0));
    const startDateStr = contract?.start_date || (entry?.date ? entry.date : new Date().toISOString().split('T')[0]);
    const endDateStr = contract?.end_date || new Date(new Date(startDateStr).setMonth(new Date(startDateStr).getMonth() + 12)).toISOString().split('T')[0];

    const s = new Date(startDateStr + 'T12:00:00');
    const e = new Date(endDateStr + 'T12:00:00');
    let diffMonths = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
    if (diffMonths <= 0) diffMonths = 12;

    const contractTotalValue = contract?.total_value || (monthlyValue * diffMonths);
    const formattedMonthlyValue = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthlyValue);
    const formattedTotalValue = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(contractTotalValue);

    const docDate = new Date(startDateStr + 'T12:00:00');
    const dateLong = docDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
    const startDate = new Date(startDateStr + 'T12:00:00').toLocaleDateString('pt-BR');
    const endDate = new Date(endDateStr + 'T12:00:00').toLocaleDateString('pt-BR');

    const durationDisplay = `${diffMonths} (${numberToWordsPure(diffMonths)})`;
    const natureDisplay = entry?.nature || (contract as any)?.nature || 'Custeio';

    const internetSpeed = terms.internet_speed || '200 Mbps';
    const getSpeedText = (speed: string = '') => {
        const clean = speed.toUpperCase().replace(/\s+/g, '');
        if (clean.includes('100MB')) return 'cem megabits por segundo';
        if (clean.includes('200MB')) return 'duzentos megabits por segundo';
        if (clean.includes('300MB')) return 'trezentos megabits por segundo';
        if (clean.includes('400MB')) return 'quatrocentos megabits por segundo';
        if (clean.includes('500MB')) return 'quinhentos megabits por segundo';
        if (clean.includes('600MB')) return 'seiscentos megabits por segundo';
        if (clean.includes('1GB') || clean.includes('1000MB')) return 'um gigabit por segundo';
        return '';
    };
    const speedText = getSpeedText(internetSpeed);
    const speedDisplay = speedText ? `${internetSpeed} (${speedText})` : internetSpeed;

    const directorName = (terms.custom_director_name || school?.director || '____________________').toUpperCase();
    const directorCpf = terms.custom_director_cpf || school?.director_cpf || '___.___.___-__';
    const directorRg = terms.custom_director_rg || school?.director_rg || '___________';

    const customStyles = `
        body { 
            line-height: 1.5; 
            font-size: 11px;
            -webkit-print-color-adjust: exact;
        }
        .print-container { width: 210mm; margin: 0 auto; padding: 1.5cm 2.5cm; min-height: 297mm; }
        .text-justified p { margin-bottom: 8px; text-align: justify; text-justify: inter-word; }
        h1 { font-size: 14px; font-weight: 700; text-align: center; text-transform: uppercase; margin-bottom: 20px; }
        .clause { margin-top: 18px; font-weight: 700; text-transform: uppercase; border-bottom: 1px solid black; display: block; margin-bottom: 10px; font-size: 11px; break-after: avoid; page-break-after: avoid; }
        .clause-block { break-inside: avoid; page-break-inside: avoid; margin-bottom: 14px; }
        @media print {
            @page {
                size: A4;
                margin: 2.0cm 2.0cm 2.0cm 2.5cm !important;
            }
            .print-container { 
                padding: 0 !important; 
                width: 100% !important; 
                margin: 0 !important; 
                box-shadow: none !important;
                border: none !important;
            }
        }
        .header-box { border-bottom: 1.5px solid black; padding-bottom: 10px; margin-bottom: 20px; text-align: center; }
    `;

    return `<!DOCTYPE html>
<html lang="pt-BR">
${getDocumentBaseCSS(customStyles)}
<body>
    <div class="print-container">
        <div class="header-box">
            <p class="font-bold text-[10px] m-0">ESTADO DE ALAGOAS</p>
            <p class="font-bold text-[10px] m-0">SECRETARIA DE ESTADO DA EDUCAÇÃO</p>
            <p class="font-bold text-[10px] m-0">7ª GERÊNCIA REGIONAL DE EDUCAÇÃO - GRE</p>
            <p class="font-bold text-[11px] mt-1">${(school?.conselho_escolar || `CONSELHO ESCOLAR DA ESCOLA ESTADUAL ${school?.name || 'UNIDADE EXECUTORA'}`).toUpperCase()}</p>
        </div>

        <h1>CONTRATO DE PRESTAÇÃO DE SERVIÇOS CONTÍNUOS Nº ${contract?.contract_number || '___/2025'}</h1>

        <div class="text-justified">
            <p>Pelo presente instrumento particular jurídico, de um lado, o <strong>${(school?.conselho_escolar || `CONSELHO ESCOLAR DA ESCOLA ESTADUAL ${school?.name || ''}`).toUpperCase()}</strong>, Unidade Executora (UEx) devidamente constituída, com sede na ${school?.address || '____________________'}${school?.city ? `, no município de ${school.city}` : ''}${school?.uf ? ` - ${school.uf}` : ''}${school?.cep ? `, CEP: ${school.cep}` : ''}, inscrito no CNPJ sob o nº <strong>${formatCNPJ(school?.cnpj)}</strong>, neste ato representado por seu Presidente, o(a) Sr(a). <strong>${directorName}</strong>, portador(a) do RG nº <strong>${directorRg}</strong> e CPF nº <strong>${directorCpf}</strong>, doravante denominado simplesmente <strong>CONTRATANTE</strong>.</p>
            
            <p>E, de outro lado, a empresa <strong>${supplier?.name?.toUpperCase() || '____________________'}</strong>, inscrita no CNPJ sob o nº <strong>${formatCNPJ(supplier?.cnpj)}</strong>, com sede estabelecida na ${supplier?.address?.toUpperCase() || '____________________'}${supplier?.city ? `, no município de ${supplier.city.toUpperCase()}` : ''}${supplier?.uf ? ` - ${supplier.uf.toUpperCase()}` : ''}${supplier?.cep ? `, CEP: ${supplier.cep}` : ''}, neste ato representada por <strong>${contract?.representative_name || supplier?.rep_name || '____________________'}</strong>, portador(a) do RG nº <strong>${contract?.representative_rg || supplier?.rep_rg || '___________'}</strong> e CPF nº <strong>${contract?.representative_cpf || supplier?.rep_cpf || '___________'}</strong>, doravante denominada simplesmente <strong>CONTRATADA</strong>.</p>

            <p>As partes acima identificadas, de comum acordo, celebram o presente contrato administrativo, regendo-se pelas normas da <strong>Lei Federal nº 14.133/2021</strong>, mediante as seguintes cláusulas:</p>

            <div class="clause-block">
                <div class="clause">CLÁUSULA PRIMEIRA – DO OBJETO E ESPECIFICAÇÕES</div>
                <p>1.1. O objeto do presente contrato consiste na prestação de serviço contínuo de <strong>CONEXÃO À INTERNET BANDA LARGA</strong>, via tecnologia de fibra óptica, com velocidade nominal de <strong>${speedDisplay}</strong>, sem limite de franquia de dados (ilimitado).</p>
                <p>1.2. O serviço compreende o fornecimento de link compartilhado com garantia mínima de estabilidade, suporte técnico preventivo e corretivo, manutenção de infraestrutura e garantia de disponibilidade.</p>
            </div>

            <div class="clause-block">
                <div class="clause">CLÁUSULA SEGUNDA – DO REGIME DE EXECUÇÃO E QUALIDADE (SLA)</div>
                <p>2.1. Os serviços deverão ser prestados com observância aos seguintes padrões de qualidade (Service Level Agreement - SLA):</p>
                <ul class="list-contract" style="margin-left: 20px; list-style-type: disc;">
                    <li>Disponibilidade (Uptime): Mínimo de 95% (noventa e cinco por cento) ao mês, garantindo a continuidade das atividades administrativas e pedagógicas.</li>
                    <li>Suporte Técnico (Reparo): Prazo máximo de 24 (vinte e quatro) horas para solução de incidentes contados a partir da abertura do chamado/notificação.</li>
                    <li>Prazo de Instalação: Em caso de mudança ou nova sede, o prazo limite é de 15 (quinze) dias úteis.</li>
                </ul>
            </div>

            <div class="clause-block">
                <div class="clause">CLÁUSULA TERCEIRA – DAS OBRIGAÇÕES DA CONTRATADA</div>
                <p>3.1. Prestar os serviços com o emprego de mão de obra qualificada e equipamentos adequados, mantendo todos os requisitos de regularidade fiscal e trabalhista durante a vigência contratual.</p>
                <p>3.2. Responder por quaisquer danos causados à CONTRATANTE ou a terceiros, decorrentes de erro, negligência ou imperícia na execução do objeto.</p>
                <p>3.3. Manter sigilo sobre quaisquer dados ou informações da Unidade Escolar que venha a ter acesso em virtude da manutenção dos serviços.</p>
            </div>

            <div class="clause-block">
                <div class="clause">CLÁUSULA QUARTA – DAS OBRIGAÇÕES DA CONTRATANTE</div>
                <p>4.1. Proporcionar as condições necessárias para que a CONTRATADA possa cumprir o objeto contratado, garantindo acesso às dependências da escola quando necessário.</p>
                <p>4.2. Efetuar o pagamento nos prazos e condições pactuados, após o atesto da efetiva prestação dos serviços.</p>
            </div>

            <div class="clause-block">
                <div class="clause">CLÁUSULA QUINTA – DA FISCALIZAÇÃO E GESTÃO</div>
                <p>5.1. A gestão e fiscalização da execução deste Contrato ficarão a cargo do Presidente do Conselho Escolar (Gestor), auxiliado pelo Conselho Escolar para fins de auditoria interna e prestação de contas junto ao FNDE/SEDUC.</p>
            </div>

            <div class="clause-block">
                <div class="clause">CLÁUSULA SEXTA – DO VALOR E DOTAÇÃO ORÇAMENTÁRIA</div>
                <p>6.1. O valor mensal do presente ajuste é de <strong>${formattedMonthlyValue}</strong>, perfazendo o montante total para <strong>${durationDisplay}</strong> meses de <strong>${formattedTotalValue}</strong> (${numberToWords(contractTotalValue).toUpperCase()}).</p>
                <p>6.2. As despesas decorrentes deste contrato correrão à conta de recursos repassados pelo programa <strong>${(program?.name || (entry as any)?.program || (process as any).contract?.programs?.name || 'PDDE QUALIDADE').toUpperCase()} - ${((entry as any)?.rubrics?.name || (process as any).contract?.rubrics?.name || (entry as any)?.rubric || 'CUSTEIO').toUpperCase()}</strong>, especificamente na categoria de ${natureDisplay}.</p>
            </div>

            <div class="clause-block">
                <div class="clause">CLÁUSULA SÉTIMA – DA VIGÊNCIA</div>
                <p>7.1. O presente contrato terá vigência de <strong>${durationDisplay}</strong> meses, iniciando-se em <strong>${startDate}</strong> e finalizando em <strong>${endDate}</strong>, podendo ser prorrogado mediante termo aditivo, desde que observada a vantajosidade e os limites da legislação vigente.</p>
            </div>

            <div class="clause-block">
                <div class="clause">CLÁUSULA OITAVA – DA FORMA DE PAGAMENTO</div>
                <p>8.1. O pagamento será processado mensalmente, no prazo de até 05 (cinco) dias úteis após o atesto da efetiva prestação dos serviços (liquidação da despesa), condicionado à apresentação da Nota Fiscal/Fatura acompanhada obrigatoriamente das seguintes Certidões de Regularidade Fiscal e Trabalhista, em plena validade:</p>
                <ul class="list-contract" style="margin-left: 20px; list-style-type: decimal;">
                    <li>Certidão de Regularidade perante a Fazenda Pública Federal;</li>
                    <li>Certidão de Regularidade perante a Fazenda Pública Estadual;</li>
                    <li>Certidão de Regularidade perante a Fazenda Pública Municipal;</li>
                    <li>Certificado de Regularidade do FGTS (CRF);</li>
                    <li>Certidão Negativa de Débitos Trabalhistas (CNDT);</li>
                    <li>Comprovante de Inscrição e de Situação Cadastral (CNPJ) atualizado, comprovando a manutenção das condições de habilitação.</li>
                </ul>
            </div>

            <div class="clause-block">
                <div class="clause">CLÁUSULA NONA – DO REAJUSTE</div>
                <p>9.1. Caso haja prorrogação, os valores serão reajustados anualmente pela variação acumulada do IGP-M/FGV, ou outro índice oficial que venha a substituí-lo, respeitando a periodicidade mínima de 12 meses.</p>
            </div>

            <div class="clause-block">
                <div class="clause">CLÁUSULA DÉCIMA – DAS PENALIDADES E SANÇÕES</div>
                <p>10.1. Pelo descumprimento total ou parcial do objeto, a CONTRATANTE poderá aplicar advertência, impedimento de licitar ou multa de 0,5% ao dia sobre o valor mensal, limitada a 10% (dez por cento) do valor total.</p>
            </div>

            <div class="clause-block">
                <div class="clause">CLÁUSULA DÉCIMA PRIMEIRA – DA RESCISÃO</div>
                <p>11.1. O contrato poderá ser rescindido unilateralmente pela CONTRATANTE por razões de interesse público ou descumprimento injustificado de SLA, conforme artigos 137 a 139 da Lei 14.133/2021.</p>
            </div>

            <div class="clause-block">
                <div class="clause">CLÁUSULA DÉCIMA SEGUNDA – DA LEI GERAL DE PROTEÇÃO DE DADOS (LGPD)</div>
                <p>12.1. As partes comprometem-se a cumprir integralmente a <strong>Lei nº 13.709/2018 (LGPD)</strong>, tratando dados pessoais apenas para as finalidades vinculadas ao objeto deste contrato.</p>
            </div>

            <div class="clause-block" style="break-inside: avoid;">
                <div class="clause">CLÁUSULA DÉCIMA TERCEIRA – DO FORO</div>
                <p>13.1. Fica eleito o Foro da Comarca de <strong>${(contract?.terms_json?.foro_city || getForoByCity(school?.city)).toUpperCase()}/AL</strong> para dirimir quaisquer controvérsias oriundas deste ajuste.</p>

                <div class="mt-6 text-center font-bold">
                    ${school?.city?.toUpperCase() || 'ALAGOAS'}/AL, ${dateLong.toUpperCase()}
                </div>

                <div class="mt-14 grid grid-cols-2 gap-12 text-center">
                    <div class="border-t border-black pt-2">
                        <p class="font-bold text-[11px]">${directorName}</p>
                        <p class="text-[9px]">CONTRATANTE</p>
                        <p class="text-[8px]">CPF: <strong>${directorCpf}</strong></p>
                    </div>
                    <div class="border-t border-black pt-2">
                        <p class="font-bold text-[11px]">${(contract?.representative_name || supplier?.rep_name || 'REPRESENTANTE LEGAL').toUpperCase()}</p>
                        <p class="text-[9px]">CONTRATADA</p>
                        <p class="text-[8px]">CPF: <strong>${contract?.representative_cpf || supplier?.rep_cpf || '___.___.___-__'}</strong></p>
                    </div>
                </div>

                <div class="mt-12 grid grid-cols-2 gap-12 text-center mb-6">
                    <div class="border-t border-black pt-2 px-4">
                        <p class="font-bold text-[9px]">${(terms.witness_1_name || 'TESTEMUNHA 01').toUpperCase()}</p>
                        ${terms.witness_1_name ? `<p class="text-[8px] uppercase">TESTEMUNHA 01</p>` : ''}
                        <p class="text-[7px]">CPF: <strong>${terms.witness_1_cpf || '___.___.___-__'}</strong></p>
                    </div>
                    <div class="border-t border-black pt-2 px-4">
                        <p class="font-bold text-[9px]">${(terms.witness_2_name || 'TESTEMUNHA 02').toUpperCase()}</p>
                        ${terms.witness_2_name ? `<p class="text-[8px] uppercase">TESTEMUNHA 02</p>` : ''}
                        <p class="text-[7px]">CPF: <strong>${terms.witness_2_cpf || '___.___.___-__'}</strong></p>
                    </div>
                </div>
            </div>

            <div class="mt-8 text-[8px] text-gray-400 text-center border-t pt-1 no-print italic">
                Documento gerado eletronicamente em conformidade com a Lei 14.133/21 pelo sistema BRN Suite Escolas. Hash: ${process.id?.substring(0, 8).toUpperCase() || 'N/A'}
            </div>
        </div>
    </div>
</body>
</html>`;
};

export const generateContratoGasHTML = (process: DocumentProcess) => {
    // Perform thorough contract validation first
    validateContractData(process);

    const { entry, school, program, supplier } = extractDocumentData(process);
    const contract = process.contract;
    const terms = contract?.terms_json || {};

    const directorName = (terms.custom_director_name || school?.director || '____________________').toUpperCase();
    const directorCpf = terms.custom_director_cpf || school?.director_cpf || '___.___.___-__';
    const directorRg = terms.custom_director_rg || school?.director_rg || '___________';

    const totalValue = contract?.total_value || (Math.abs(entry?.value || 0));
    const formattedTotalValue = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue);

    const startDateStr = contract?.start_date || (entry?.date ? entry.date : new Date().toISOString().split('T')[0]);
    const endDateStr = contract?.end_date || new Date(new Date(startDateStr).setMonth(new Date(startDateStr).getMonth() + 12)).toISOString().split('T')[0];

    const docDate = new Date(startDateStr + 'T12:00:00');
    const dateLong = docDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
    const startDate = new Date(startDateStr + 'T12:00:00').toLocaleDateString('pt-BR');
    const endDate = new Date(endDateStr + 'T12:00:00').toLocaleDateString('pt-BR');

    const customStyles = `
        body { font-family: 'Inter', sans-serif; background: white; color: black; line-height: 1.5; font-size: 11px; -webkit-print-color-adjust: exact; }
        .print-container { width: 210mm; margin: 0 auto; padding: 1.5cm 2.5cm; min-height: 297mm; }
        .text-justified { text-align: justify; text-justify: inter-word; }
        .text-justified p { margin-bottom: 8px; text-align: justify; text-justify: inter-word; }
        h1 { font-size: 14px; font-weight: 700; text-align: center; text-transform: uppercase; margin-bottom: 20px; }
        .clause { margin-top: 18px; font-weight: 700; text-transform: uppercase; border-bottom: 1px solid black; display: block; margin-bottom: 10px; font-size: 11px; break-after: avoid; page-break-after: avoid; }
        .clause-block { break-inside: avoid; page-break-inside: avoid; margin-bottom: 14px; }
        @media print {
            @page {
                size: A4;
                margin: 2.0cm 2.0cm 2.0cm 2.5cm !important;
            }
            .print-container { 
                padding: 0 !important; 
                width: 100% !important; 
                margin: 0 !important; 
                box-shadow: none !important;
                border: none !important;
            }
        }
        .header-box { border-bottom: 1.5px solid black; padding-bottom: 10px; margin-bottom: 20px; text-align: center; }
    `;

    return `<!DOCTYPE html>
<html lang="pt-BR">
${getDocumentBaseCSS(customStyles)}
<body>
    <div class="print-container">
        <div class="header-box">
            <p class="font-bold text-[10px] m-0">ESTADO DE ALAGOAS</p>
            <p class="font-bold text-[10px] m-0">SECRETARIA DE ESTADO DA EDUCAÇÃO</p>
            <p class="font-bold text-[10px] m-0">7ª GERÊNCIA REGIONAL DE EDUCAÇÃO - GRE</p>
            <p class="font-black text-[12px] mt-1">${(school?.conselho_escolar || `CONSELHO ESCOLAR DA ESCOLA ESTADUAL ${school?.name || 'UNIDADE EXECUTORA'}`).toUpperCase()}</p>
        </div>

        <h1>CONTRATO DE FORNECIMENTO CONTÍNUO DE PRODUTOS Nº ${contract?.contract_number || '___/2025'}</h1>

        <div class="text-justified">
            <p>Pelo presente instrumento o <strong>${(school?.conselho_escolar || `CONSELHO ESCOLAR DA ESCOLA ESTADUAL ${school?.name || ''}`).toUpperCase()}</strong>, estabelecido na ${school?.address || '____________________'}${school?.city ? `, no município de ${school.city}` : ''}${school?.uf ? ` - ${school.uf}` : ''}${school?.cep ? `, CEP: ${school.cep}` : ''}, inscrito no CNPJ sob o nº <strong>${formatCNPJ(school?.cnpj)}</strong>, neste ato representado por seu Presidente, o(a) Sr(a). <strong>${directorName}</strong>, portador(a) do RG nº <strong>${directorRg}</strong> e CPF nº <strong>${directorCpf}</strong>, doravante denominado simplesmente <strong>CONTRATANTE</strong>.</p>
            
            <p>E, de outro lado, a empresa <strong>${supplier?.name?.toUpperCase() || '____________________'}</strong>, inscrita no CNPJ sob o nº <strong>${formatCNPJ(supplier?.cnpj)}</strong>, com sede estabelecida na ${supplier?.address?.toUpperCase() || '____________________'}${supplier?.city ? `, no município de ${supplier.city.toUpperCase()}` : ''}${supplier?.uf ? ` - ${supplier.uf.toUpperCase()}` : ''}${supplier?.cep ? `, CEP: ${supplier.cep}` : ''}, neste ato representada por <strong>${contract?.representative_name || supplier?.rep_name || '____________________'}</strong>, portador(a) do RG nº <strong>${contract?.representative_rg || supplier?.rep_rg || '___________'}</strong> e CPF nº <strong>${contract?.representative_cpf || supplier?.rep_cpf || '___________'}</strong>, doravante denominada simplesmente <strong>CONTRATADA</strong>.</p>

            <p>Celebram o presente Contrato sob a égide da <strong>Lei Federal nº 14.133/2021</strong>, mediante as cláusulas seguintes:</p>

            <div class="clause-block">
                <div class="clause">CLÁUSULA PRIMEIRA – DO OBJETO</div>
                <p>1.1. Constitui objeto do presente Contrato o fornecimento de GÁS LIQUEFEITO DE PETRÓLEO (GÁS DE COZINHA - P13), para preparação da alimentação escolar da Unidade, conforme proposta da contratada.</p>
                <p>1.2. A entrega deverá ocorrer no prazo máximo de 24 horas contadas da solicitação da CONTRATANTE.</p>
            </div>

            <div class="clause-block">
                <div class="clause">CLÁUSULA SEGUNDA – DO VALOR</div>
                <p>2.1. O valor global estimado do presente Contrato é de <strong>${formattedTotalValue}</strong> (${numberToWords(totalValue).toUpperCase()}).</p>
            </div>

            <div class="clause-block">
                <div class="clause">CLÁUSULA TERCEIRA – DA VIGÊNCIA</div>
                <p>3.1. O prazo de vigência deste Contrato será de <strong>12 (doze) meses</strong>, iniciando-se em <strong>${startDate}</strong> e finalizando em <strong>${endDate}</strong>.</p>
            </div>

            <div class="clause-block">
                <div class="clause">CLÁUSULA QUARTA – DA FORMA DE PAGAMENTO</div>
                <p>4.1. O pagamento será processado mensalmente, no prazo de até 05 (cinco) dias úteis após o atesto do recebimento definitivo do produto (liquidação da despesa), condicionado à apresentação da Nota Fiscal acompanhada obrigatoriamente das seguintes Certidões de Regularidade Fiscal e Trabalhista, em plena validade:</p>
                <ul class="list-contract" style="margin-left: 20px; list-style-type: decimal;">
                    <li>Certidão de Regularidade perante a Fazenda Pública Federal;</li>
                    <li>Certidão de Regularidade perante a Fazenda Pública Estadual;</li>
                    <li>Certidão de Regularidade perante a Fazenda Pública Municipal;</li>
                    <li>Certificado de Regularidade do FGTS (CRF);</li>
                    <li>Certidão Negativa de Débitos Trabalhistas (CNDT);</li>
                    <li>Comprovante de Inscrição e de Situação Cadastral (CNPJ) atualizado, comprovando a manutenção das condições de habilitação.</li>
                </ul>
            </div>

            <div class="clause-block">
                <div class="clause">CLÁUSULA QUINTA – DA FONTE DE RECURSOS</div>
                <p>5.1. As despesas decorrentes deste Contrato correrão à conta de recurso repassado pelo programa <strong>${(program?.name || (entry as any)?.program || (process as any).contract?.programs?.name || 'PDDE').toUpperCase()} - ${((entry as any)?.rubrics?.name || (process as any).contract?.rubrics?.name || (entry as any)?.rubric || 'QUALIDADE').toUpperCase()}</strong>.</p>
            </div>

            <div class="clause-block">
                <div class="clause">CLÁUSULA SEXTA – DAS PENALIDADES</div>
                <p>6.1. Pelo atraso injustificado na entrega, a CONTRATANTE poderá aplicar multa de 0,5% ao dia sobre o valor da parcela, limitada a 10%, sem prejuízo de outras sanções da <strong>Lei 14.133/2021</strong>.</p>
            </div>

            <div class="clause-block" style="break-inside: avoid;">
                <div class="clause">CLÁUSULA SÉTIMA – DO FORO</div>
                <p>7.1. Fica eleito o Foro da Comarca de <strong>${(contract?.terms_json?.foro_city || getForoByCity(school?.city)).toUpperCase()}/AL</strong> para dirimir quaisquer controvérsias.</p>

                <div class="mt-6 text-center font-bold">
                    ${school?.city?.toUpperCase() || 'ALAGOAS'}/AL, ${dateLong.toUpperCase()}
                </div>

                <div class="mt-14 grid grid-cols-2 gap-12 text-center">
                    <div class="border-t border-black pt-2">
                        <p class="font-bold text-[11px]">${directorName}</p>
                        <p class="text-[9px]">CONTRATANTE</p>
                        <p class="text-[8px]">CPF: ${directorCpf}</p>
                    </div>
                    <div class="border-t border-black pt-2">
                        <p class="font-bold text-[11px]">${(contract?.representative_name || supplier?.rep_name || 'REPRESENTANTE LEGAL').toUpperCase()}</p>
                        <p class="text-[9px]">CONTRATADA</p>
                        <p class="text-[8px]">CPF: ${contract?.representative_cpf || supplier?.rep_cpf || '___.___.___-__'}</p>
                    </div>
                </div>

                <div class="mt-12 grid grid-cols-2 gap-12 text-center mb-6">
                    <div class="border-t border-black pt-2 px-4">
                        <p class="font-bold text-[9px]">${(terms.witness_1_name || 'TESTEMUNHA 01').toUpperCase()}</p>
                        ${terms.witness_1_name ? `<p class="text-[8px] uppercase">TESTEMUNHA 01</p>` : ''}
                        <p class="text-[7px]">CPF: <strong>${terms.witness_1_cpf || '___.___.___-__'}</strong></p>
                    </div>
                    <div class="border-t border-black pt-2 px-4">
                        <p class="font-bold text-[9px]">${(terms.witness_2_name || 'TESTEMUNHA 02').toUpperCase()}</p>
                        ${terms.witness_2_name ? `<p class="text-[8px] uppercase">TESTEMUNHA 02</p>` : ''}
                        <p class="text-[7px]">CPF: <strong>${terms.witness_2_cpf || '___.___.___-__'}</strong></p>
                    </div>
                </div>
            </div>

            <div class="mt-8 text-[8px] text-gray-400 text-center border-t pt-1 no-print italic">
                Documento gerado eletronicamente em conformidade com a Lei 14.133/21 pelo sistema BRN Suite Escolas. Hash: ${process.id?.substring(0, 8).toUpperCase() || 'N/A'}
            </div>
        </div>
    </div>
</body>
</html>`;
};

export const generateAditivoHTML = (process: DocumentProcess) => {
    const { school, supplier } = extractDocumentData(process);
    const contract = (process as any).contract;
    const terms = contract?.terms_json || {};

    const directorName = (terms.custom_director_name || school?.director || '____________________').toUpperCase();
    const directorCpf = terms.custom_director_cpf || school?.director_cpf || '___.___.___-__';
    const directorRg = terms.custom_director_rg || school?.director_rg || '___________';
    const directorAddress = (terms.custom_director_address || school?.director_address || 'ENDEREÇO NÃO INFORMADO').toUpperCase();

    const docDate = contract?.start_date ? new Date(contract.start_date + 'T12:00:00') : new Date();
    const dateLong = docDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });

    const contractNumber = (process as any).contract?.contract_number || '___/2025';
    const startDate = (process as any).contract?.start_date ? new Date((process as any).contract.start_date + 'T12:00:00').toLocaleDateString('pt-BR') : '___/___/_____';
    const endDate = (process as any).contract?.end_date ? new Date((process as any).contract.end_date + 'T12:00:00').toLocaleDateString('pt-BR') : '___/___/_____';
    const monthlyValue = (process as any).monthly_value || (process as any).contract?.monthly_value || 0;

    const formattedTotalValue = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((process as any).contract?.total_value || 0);
    const customStyles = `
        body { 
            line-height: 1.5; 
            font-size: 11px; 
            -webkit-print-color-adjust: exact;
        }
        .print-container { width: 210mm; margin: 0 auto; padding: 1.5cm 2.5cm; min-height: 297mm; }
        .text-justified p { margin-bottom: 8px; text-align: justify; text-justify: inter-word; }
        h1 { text-transform: uppercase; font-weight: 700; text-align: center; font-size: 16px; margin-bottom: 30px; }
        .clause { font-weight: 700; text-transform: uppercase; margin-top: 18px; margin-bottom: 10px; text-decoration: underline; break-after: avoid; page-break-after: avoid; }
        .clause-block { break-inside: avoid; page-break-inside: avoid; margin-bottom: 14px; }
        @media print {
            @page {
                size: A4;
                margin: 2.0cm 2.0cm 2.0cm 2.5cm !important;
            }
            .print-container { 
                padding: 0 !important; 
                width: 100% !important; 
                margin: 0 !important; 
                box-shadow: none !important;
                border: none !important;
            }
        }
    `;

    return `<!DOCTYPE html>
<html lang="pt-BR">
${getDocumentBaseCSS(customStyles)}
<body>
    <div class="print-container">
        <h1>TERMO ADITIVO DE PRORROGAÇÃO E REAJUSTE DE CONTRATO</h1>

        <div class="text-justified">
            <p>Pelo presente instrumento particular, de um lado a <strong>${(school?.conselho_escolar || `CONSELHO ESCOLAR DA ESCOLA ESTADUAL ${school?.name || 'UNIDADE EXECUTORA'}`).toUpperCase()}</strong>, inscrita no CNPJ sob o nº <strong>${school?.cnpj || '___.___.___/____-__'}</strong>, com sede na ${school?.address || 'ENDEREÇO NÃO CADASTRADO'}${school?.city ? `, no município de ${school.city}` : ''}${school?.uf ? ` - ${school.uf}` : ''}${school?.cep ? `, CEP: ${school.cep}` : ''}, doravante denominada <strong>CONTRATANTE</strong>, representada neste ato por seu Presidente, o(a) Sr(a). <strong>${directorName}</strong>, portador(a) do RG nº <strong>${directorRg}</strong> e CPF nº <strong>${directorCpf}</strong>, residente e domiciliado(a) na ${directorAddress}.</p>

            <p class="mt-4">E de outro lado, a empresa <strong>${supplier?.name?.toUpperCase() || 'RAZÃO SOCIAL DO FORNECEDOR'}</strong>, inscrita no CNPJ sob o nº <strong>${supplier?.cnpj || '___.___.___/____-__'}</strong>, com sede na ${supplier?.address || 'ENDEREÇO DO FORNECEDOR'}${supplier?.city ? `, no município de ${supplier.city}` : ''}${supplier?.uf ? ` - ${supplier.uf}` : ''}${supplier?.cep ? `, CEP: ${supplier.cep}` : ''}, doravante denominada <strong>CONTRATADA</strong>, neste ato representada por <strong>${(process as any).contract?.representative_name || supplier?.rep_name || '____________________'}</strong>, portador(a) do RG nº <strong>${(process as any).contract?.representative_rg || supplier?.rep_rg || '___________'}</strong> e CPF nº <strong>${(process as any).contract?.representative_cpf || supplier?.rep_cpf || '___________'}</strong>, residente e domiciliado(a) na ${(process as any).contract?.representative_address || supplier?.rep_address?.toUpperCase() || '____________________'}.</p>

            <p class="mt-6">As partes acima qualificadas resolvem, de mútuo acordo, aditar o <strong>Contrato nº ${contractNumber}</strong>, originalmente firmado em <strong>${startDate}</strong>, mediante as seguintes cláusulas e condições:</p>

            <div class="clause-block">
                <div class="clause">CLÁUSULA PRIMEIRA – DO OBJETO</div>
                <p>O presente Termo Aditivo tem por objeto a prorrogação do prazo de vigência e o reajuste do valor mensal para a continuidade da prestação de serviços de <strong>${(process as any).contract?.category || 'SERVIÇOS RECORRENTES'}</strong>, conforme necessidade da Unidade Escolar.</p>
            </div>

            <div class="clause-block">
                <div class="clause">CLÁUSULA SEGUNDA – DA PRORROGAÇÃO</div>
                <p>Fica prorrogado o prazo de vigência do contrato original por mais <strong>12 (doze) meses</strong>, iniciando-se em <strong>${endDate}</strong> e finalizando em <strong>${new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toLocaleDateString('pt-BR')}</strong>, ou até que ocorra nova pactuação ou rescisão.</p>
            </div>

            <div class="clause-block">
                <div class="clause">CLÁUSULA TERCEIRA – DO VALOR E REAJUSTE</div>
                <p>Em virtude da prorrogação e aplicação de reajuste anual pactuado nas cláusulas do contrato original, o valor mensal passa a ser de <strong>${formatCurrency(monthlyValue)}</strong> (${numberToWords(monthlyValue)}), mantendo-se as dotações orçamentárias provenientes do programa <strong>${((process as any).contract?.programs?.name || 'PDDE QUALIDADE').toUpperCase()} - ${(((process as any).contract?.rubrics?.name || (process as any).contract?.rubric) || 'CUSTEIO').toUpperCase()}</strong>.</p>
            </div>

            <div class="clause-block" style="break-inside: avoid;">
                <div class="clause">CLÁUSULA QUARTA – DA RATIFICAÇÃO</div>
                <p>Ficam ratificadas todas as demais cláusulas e condições do contrato original que não foram alteradas pelo presente termo aditivo, elegendo-se o Foro da Comarca de <strong>${((process as any).contract?.terms_json?.foro_city || getForoByCity(school?.city)).toUpperCase()}/AL</strong> para dirimir quaisquer dúvidas.</p>

                <div class="mt-8 text-center font-bold">
                    ${school?.city?.toUpperCase() || 'ALAGOAS'}/AL, ${dateLong.toUpperCase()}
                </div>

                <div class="mt-14 grid grid-cols-2 gap-12 text-center">
                    <div class="border-t border-black pt-2">
                        <p class="text-[11px]">${directorName}</p>
                        <p class="text-[9px]">CONTRATANTE</p>
                        <p class="text-[8px]">CPF: <strong>${directorCpf}</strong></p>
                        <p class="text-[8px]">RG: <strong>${directorRg}</strong></p>
                    </div>
                    <div class="border-t border-black pt-2">
                        <p class="text-[11px]">${supplier?.name?.toUpperCase()}</p>
                        <p class="text-[9px]">CONTRATADA</p>
                        <p class="text-[7px]">CPF: <strong>${(process as any).contract?.representative_cpf || supplier?.rep_cpf || '___.___.___---'}</strong></p>
                        <p class="text-[7px]">RG: <strong>${(process as any).contract?.representative_rg || supplier?.rep_rg || '___________'}</strong></p>
                    </div>
                </div>

                <div class="mt-12 grid grid-cols-2 gap-12 text-center mb-10">
                    <div>
                        <div class="border-t border-black pt-2">
                            <p class="font-bold text-[9px]">${(process as any).contract?.terms_json?.witness_1_name ? (process as any).contract.terms_json.witness_1_name.toUpperCase() : 'TESTEMUNHA 01'}</p>
                            ${(process as any).contract?.terms_json?.witness_1_name ? `<p class="text-[9px]">TESTEMUNHA 01</p>` : ''}
                            <p class="text-[8px]">CPF: ${(process as any).contract?.terms_json?.witness_1_cpf || '___.___.___-__'}</p>
                            <p class="text-[8px]">RG: ${(process as any).contract?.terms_json?.witness_1_rg || '___________'}</p>
                        </div>
                    </div>
                    <div>
                        <div class="border-t border-black pt-2">
                            <p class="font-bold text-[9px]">${(process as any).contract?.terms_json?.witness_2_name ? (process as any).contract.terms_json.witness_2_name.toUpperCase() : 'TESTEMUNHA 02'}</p>
                            ${(process as any).contract?.terms_json?.witness_2_name ? `<p class="text-[9px]">TESTEMUNHA 02</p>` : ''}
                            <p class="text-[8px]">CPF: ${(process as any).contract?.terms_json?.witness_2_cpf || '___.___.___-__'}</p>
                            <p class="text-[8px]">RG: ${(process as any).contract?.terms_json?.witness_2_rg || '___________'}</p>
                        </div>
                    </div>
                </div>
            </div>
    </div>
</body>
</html>`;
};
