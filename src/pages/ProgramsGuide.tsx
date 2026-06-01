import React, { useState } from 'react';
import { printDocument } from '../lib/printUtils';
import { generateAtaHTML, generateOrdemHTML, generateConsolidacaoHTML } from '../lib/documentTemplates';
import { useToast } from '../context/ToastContext';

const prestacaoDocs = [
    {
        id: 'ata',
        name: 'Ata de Compra',
        phase: 'compras',
        phaseLabel: 'Seleção / Compras',
        purpose: 'Registra a reunião e a deliberação do Conselho Escolar homologando o processo de compra, justificando a escolha das propostas e autorizando o gasto.',
        whoSigns: '1º Secretário, Presidente e no mínimo mais 4 Conselheiros.',
        whereSigns: 'No encerramento da ata, nas linhas destinadas nominalmente a cada membro participante.',
        stampType: 'signature_list',
        icon: 'groups'
    },
    {
        id: 'ordem',
        name: 'Ordem de Compra / Serviço',
        phase: 'compras',
        phaseLabel: 'Seleção / Compras',
        purpose: 'Autoriza formalmente o fornecedor vencedor a entregar as mercadorias ou iniciar a prestação de serviços nas condições acordadas.',
        whoSigns: 'Presidente do Conselho Escolar.',
        whereSigns: 'No campo específico de assinatura do emitente/comprador no rodapé do documento.',
        stampType: 'president_signature',
        icon: 'shopping_cart_checkout'
    },
    {
        id: 'consolidacao',
        name: 'Consolidação de Pesquisa de Preços',
        phase: 'compras',
        phaseLabel: 'Seleção / Compras',
        purpose: 'Quadro comparativo que reúne os preços obtidos de todas as cotações, demonstrando e justificando a escolha da proposta de menor valor.',
        whoSigns: 'Presidente do Conselho Escolar.',
        whereSigns: 'Ao final da tabela de comparação, no campo reservado à assinatura do Presidente do Conselho.',
        stampType: 'president_signature',
        icon: 'analytics'
    },
    {
        id: 'nf_atesto',
        name: 'Nota Fiscal — Atesto de Recebimento',
        phase: 'fiscal',
        phaseLabel: 'Faturamento / Fiscal',
        purpose: 'Atesta formalmente que os materiais foram entregues ou os serviços prestados conforme solicitado e em perfeitas condições.',
        whoSigns: '1º e 2º Conselheiros.',
        whereSigns: 'No verso da Nota Fiscal (sobre o carimbo "Atesto Recebimento" preenchido com data, nomes, funções e matrículas).',
        stampType: 'atesto_recebimento',
        icon: 'assignment_turned_in'
    },
    {
        id: 'nf_quitacao',
        name: 'Nota Fiscal — Atestado de Quitação',
        phase: 'fiscal',
        phaseLabel: 'Faturamento / Fiscal',
        purpose: 'Declaração formal do fornecedor atestando que os valores correspondentes à nota fiscal foram totalmente quitados e recebidos.',
        whoSigns: 'Fornecedor Vencedor.',
        whereSigns: 'No corpo ou verso da Nota Fiscal (sobre o carimbo "Atestado Quitação" preenchido com data e assinatura do representante legal ou carimbo de CNPJ).',
        stampType: 'atestado_quitacao',
        icon: 'payments'
    },
    {
        id: 'nf_pago',
        name: 'Nota Fiscal — Pago com Recurso',
        phase: 'fiscal',
        phaseLabel: 'Faturamento / Fiscal',
        purpose: 'Carimbo de controle que vincula formalmente a Nota Fiscal ao programa específico de recurso e ano de exercício, inviabilizando reutilizações.',
        whoSigns: 'Não exige assinatura (apenas aplicação física do carimbo informativo).',
        whereSigns: 'Na frente da Nota Fiscal, em local visível que não cubra dados essenciais de produtos ou valores.',
        stampType: 'pago_com_recurso',
        icon: 'receipt'
    },
    {
        id: 'comprovante_confere',
        name: 'Comprovante de Pagamento — Confere com o Original',
        phase: 'financeiro',
        phaseLabel: 'Pagamento / Financeiro',
        purpose: 'Certifica formalmente que a cópia impressa do comprovante de transferência bancária, PIX ou cartão condiz exatamente com o original emitido.',
        whoSigns: '1º ou 2º Conselheiro.',
        whereSigns: 'Diretamente sobre o carimbo "Confere com o original" aposto no comprovante impresso.',
        stampType: 'confere_original',
        icon: 'receipt_long'
    },
    {
        id: 'recibo',
        name: 'Recibo',
        phase: 'financeiro',
        phaseLabel: 'Pagamento / Financeiro',
        purpose: 'Documento emitido pelo fornecedor que comprova o recebimento do pagamento correspondente à transação comercial.',
        whoSigns: 'Fornecedor Vencedor.',
        whereSigns: 'No campo de assinatura do emitente/fornecedor, com assinatura de próprio punho ou certificado digital, e carimbo do CNPJ.',
        stampType: 'supplier_signature',
        icon: 'currency_exchange'
    },
    {
        id: 'cotacao_vencedora',
        name: 'Cotação Vencedora',
        phase: 'compras',
        phaseLabel: 'Seleção / Compras',
        purpose: 'Proposta comercial de menor preço que serviu de base para a contratação e aquisição do item ou serviço.',
        whoSigns: 'Fornecedor Vencedor.',
        whereSigns: 'Ao final do orçamento/proposta comercial da empresa vencedora.',
        stampType: 'supplier_signature',
        icon: 'price_check'
    },
    {
        id: 'outras_cotacoes',
        name: 'Demais Cotações',
        phase: 'compras',
        phaseLabel: 'Seleção / Compras',
        purpose: 'Orçamentos das outras empresas participantes para comprovar a realização de pesquisa mercadológica ampla com pelo menos 3 propostas.',
        whoSigns: 'Representantes legais das empresas participantes concorrentes.',
        whereSigns: 'Ao final de cada proposta apresentada pelas demais empresas.',
        stampType: 'concorrente_signature',
        icon: 'request_quote'
    },
    {
        id: 'certidoes',
        name: 'Certidões de Regularidade',
        phase: 'certidoes',
        phaseLabel: 'Regularidade / Certidões',
        purpose: 'Comprovam a regularidade fiscal, tributária, previdenciária e trabalhista da empresa fornecedora junto aos órgãos públicos (ex: FGTS, Receita, Estado, Município).',
        whoSigns: 'Não exigem assinatura do fornecedor (são autenticadas por código verificador eletrônico via internet).',
        whereSigns: 'Não aplicável (apenas consulta e impressão direta do portal).',
        stampType: 'none',
        icon: 'verified'
    },
    {
        id: 'certidoes_autentica',
        name: 'Autenticações das Certidões',
        phase: 'certidoes',
        phaseLabel: 'Regularidade / Certidões',
        purpose: 'Certifica que a validade e a autenticidade das certidões impressas da internet foram devidamente consultadas e confirmadas pela Gestão Escolar.',
        whoSigns: 'Gestora da Unidade de Ensino.',
        whereSigns: 'Na própria folha da certidão impressa, carimbando com o "Carimbo da Gestora" e preenchendo a matrícula e portaria/SEDUC.',
        stampType: 'gestora_ensino',
        icon: 'fact_check'
    }
];

const StampRenderer: React.FC<{ type: string; program?: string }> = ({ type, program = 'PNAE/FNDE' }) => {
    // Style for realistic ink stamp
    const stampBaseClass = "border-4 font-sans p-6 rounded-sm uppercase tracking-wide bg-white/90 relative select-none shadow-[2px_2px_12px_rgba(0,0,0,0.15)] transition-transform duration-300 hover:scale-[1.02] transform transition-all";

    if (type === 'confere_original') {
        return (
            <div className={`${stampBaseClass} max-w-sm border-slate-700/80 text-slate-800 -rotate-[1deg]`}>
                <div className="text-center font-black text-lg tracking-widest border-b-2 border-slate-800/80 pb-2 mb-4">
                    CONFERE COM O ORIGINAL
                </div>
                <div className="space-y-3 font-mono text-xs normal-case text-left text-slate-700 font-bold">
                    <div className="flex items-center gap-2">
                        <span>DATA:</span>
                        <span className="flex-1 border-b border-dashed border-slate-500 pb-0.5">____ / ____ / ________</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span>NOME:</span>
                        <span className="flex-1 border-b border-dashed border-slate-500 pb-0.5">_______________________________</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span>ASSINATURA:</span>
                        <span className="flex-1 border-b border-dashed border-slate-500 pb-0.5">_________________________</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span>MATRÍCULA:</span>
                        <span className="flex-1 border-b border-dashed border-slate-500 pb-0.5">____________________________</span>
                    </div>
                </div>
            </div>
        );
    }

    if (type === 'atestado_quitacao') {
        return (
            <div className={`${stampBaseClass} max-w-md border-blue-600/80 text-blue-600 -rotate-[1.5deg]`}>
                <div className="text-center font-black text-xl tracking-widest mb-1 text-blue-700">
                    ATESTADO QUITAÇÃO
                </div>
                <div className="text-center text-[10px] font-bold tracking-wider mb-4 border-b border-blue-600 pb-2 text-slate-500">
                    Atesto a quitação da despesa efetiva.
                </div>
                <div className="space-y-3 font-mono text-xs normal-case text-left text-blue-800 font-bold">
                    <div className="flex items-center gap-2">
                        <span>DATA:</span>
                        <span className="flex-1 border-b border-dashed border-blue-500 pb-0.5">____ / ____ / ________</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span>NOME:</span>
                        <span className="flex-1 border-b border-dashed border-blue-500 pb-0.5">_______________________________</span>
                    </div>
                </div>
            </div>
        );
    }

    if (type === 'atesto_recebimento') {
        return (
            <div className={`${stampBaseClass} max-w-lg border-blue-600/80 text-blue-600 flex gap-4 p-4 items-stretch rotate-[1deg]`}>
                {/* Left vertical data bar */}
                <div className="flex flex-col justify-between items-center border-r-2 border-blue-600/80 pr-4 py-2 font-mono text-[9px] shrink-0 text-blue-800">
                    <div className="rotate-[-90deg] origin-center translate-y-5 font-bold tracking-widest text-xs">
                        DATA:
                    </div>
                    <div className="flex flex-col gap-3 font-black text-sm">
                        <span>/</span>
                        <span>/</span>
                    </div>
                    <div className="h-4"></div>
                </div>

                {/* Right content */}
                <div className="flex-1 text-left">
                    <div className="text-center font-black text-xl tracking-widest mb-1 text-blue-700">
                        ATESTO RECEBIMENTO
                    </div>
                    <div className="text-center text-[9px] font-medium leading-relaxed tracking-wider mb-4 border-b border-blue-600/80 pb-3 normal-case text-slate-500 font-bold">
                        Atesto para os devidos fins que recebi os materiais e/ou constatei a realização dos serviços relacionado(s) no presente documento.
                    </div>
                    <div className="space-y-3 font-mono text-[11px] normal-case text-blue-800 font-bold">
                        <div className="flex items-center gap-2">
                            <span>NOME:</span>
                            <span className="flex-1 border-b border-dashed border-blue-500 pb-0.5">_________________________________________</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span>FUNÇÃO:</span>
                            <span className="flex-1 border-b border-dashed border-blue-500 pb-0.5">_______________________________________</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span>ASSINATURA:</span>
                            <span className="flex-1 border-b border-dashed border-blue-500 pb-0.5">___________________________________</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span>MATRÍCULA:</span>
                            <span className="flex-1 border-b border-dashed border-blue-500 pb-0.5">______________________________________</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (type === 'pago_com_recurso') {
        return (
            <div className={`${stampBaseClass} border-red-600/80 text-red-600 rotate-[1.5deg] max-w-sm text-center px-8 py-5 border-[3px]`}>
                <div className="font-black text-md tracking-widest">
                    PAGO COM RECURSO
                </div>
                <div className="font-black text-xl tracking-widest border-t-2 border-red-600 mt-2 pt-2 text-red-700">
                    {program}
                </div>
            </div>
        );
    }

    if (type === 'gestora_ensino') {
        return (
            <div className={`${stampBaseClass} max-w-[220px] border-slate-700/80 text-slate-800 -rotate-[0.5deg] text-center font-sans py-4 px-5 border-[3px] rounded-sm bg-white/90 shadow-md`}>
                <div className="font-bold text-[9px] uppercase tracking-widest text-slate-500 mb-1">
                    CARIMBO
                </div>
                <div className="font-black text-[11px] uppercase tracking-wide text-slate-800 leading-tight mb-2 border-b border-slate-200 pb-2">
                    Gestora de Unidade de Ensino
                </div>
                <div className="space-y-1.5 font-mono text-[9px] text-slate-600 font-bold">
                    <div className="flex items-center justify-between border border-dashed border-slate-300 px-2 py-1 bg-slate-50/50 rounded-sm">
                        <span>Matrícula nº:</span>
                        <span className="text-[10px] font-black text-slate-700">______</span>
                    </div>
                    <div className="flex items-center justify-between border border-dashed border-slate-300 px-2 py-1 bg-slate-50/50 rounded-sm">
                        <span>PORTARIA/SEDUC Nº:</span>
                        <span className="text-[10px] font-black text-slate-700">____/2026</span>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

interface ProgramsGuideProps {
    onBack: () => void;
}

const ProgramsGuide: React.FC<ProgramsGuideProps> = ({ onBack }) => {
    const { addToast } = useToast();
    const [activeTab, setActiveTab] = useState<'federal' | 'estadual' | 'execucao' | 'contas'>('federal');
    
    // States for Accountabilitly (Prestação de Contas)
    const [selectedFilter, setSelectedFilter] = useState<string>('all');
    const [selectedDoc, setSelectedDoc] = useState<any>(prestacaoDocs[0]);
    const [selectedStampProgram, setSelectedStampProgram] = useState<string>('PNAE/FNDE');
    const [invoicePage, setInvoicePage] = useState<'lauda1' | 'verso' | 'lauda2'>('lauda1');
    const [caseStudyType, setCaseStudyType] = useState<'produto' | 'servico' | 'pix' | 'certidao'>('produto');
    const [selectedCertType, setSelectedCertType] = useState<'municipal' | 'estadual' | 'federal' | 'fgts' | 'cndt'>('municipal');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [checklistItems, setChecklistItems] = useState([
        { id: 1, text: "A nota fiscal está em nome do Conselho Escolar correto?", checked: false },
        { id: 2, text: "O CNPJ do Conselho está correto?", checked: false },
        { id: 3, text: "O fornecedor da nota é o mesmo da cotação vencedora/contrato?", checked: false },
        { id: 4, text: "O valor da nota é o mesmo do pagamento?", checked: false },
        { id: 5, text: "A descrição do produto ou serviço está correta?", checked: false },
        { id: 6, text: "A NF-e de produto possui espelho/consulta de autorização?", checked: false },
        { id: 7, text: "A NFS-e possui chave de acesso ou QR Code?", checked: false },
        { id: 8, text: "As certidões estavam válidas na data da validação da nota?", checked: false },
        { id: 9, text: "As autenticações das certidões foram anexadas?", checked: false },
        { id: 10, text: "A ata de compra foi assinada por no mínimo 6 membros, quando exigida?", checked: false },
        { id: 11, text: "A ordem de compra foi assinada pelo presidente?", checked: false },
        { id: 12, text: "A consolidação foi assinada pelo presidente, quando exigida?", checked: false },
        { id: 13, text: "Cotação vencedora e demais cotações assinadas pelos fornecedores?", checked: false },
        { id: 14, text: "O recibo foi assinado pelo fornecedor vencedor?", checked: false },
        { id: 15, text: "O fornecedor assinou o atestado de quitação na nota?", checked: false },
        { id: 16, text: "Os dois conselheiros assinaram os atestos de recebimento?", checked: false },
        { id: 17, text: "Os conselheiros preencheram matrícula e data nos carimbos?", checked: false },
        { id: 18, text: "O comprovante de pagamento recebeu o carimbo 'Confere com o original'?", checked: false },
        { id: 19, text: "O gestor aguardou o parecer positivo da BRN antes de pagar?", checked: false },
        { id: 20, text: "O pagamento foi realizado somente após a conferência completa?", checked: false },
        { id: 21, text: "A prestação foi devidamente arquivada na pasta do programa correspondente?", checked: false }
    ]);

    const filteredDocs = selectedFilter === 'all'
        ? prestacaoDocs
        : prestacaoDocs.filter(doc => doc.phase === selectedFilter);

    const searchedDocs = prestacaoDocs.filter(doc =>
        doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.whoSigns.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.phaseLabel.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleDownload = (type: 'ata' | 'ordem' | 'consolidacao') => {
        const blankProcess = {
            id: "MODELO",
            financial_entries: {
                description: "DESCRIÇÃO DO PRODUTO (PREENCHER)",
                date: new Date().toISOString(),
                schools: {
                    name: "ESCOLA ESTADUAL (NOME DA ESCOLA)",
                    city: "CIDADE/AL",
                    director: "NOME DO PRESIDENTE",
                    secretary: "NOME DO SECRETÁRIO",
                    cnpj: "CNPJ DA ESCOLA",
                    seec: "CÓDIGO SEEC"
                },
                programs: { name: "NOME DO PROGRAMA (PREENCHER)" },
                suppliers: { cnpj: "CNPJ VENCEDOR" }
            },
            quotes: [
                {
                    supplier_name: "EMPRESA VENCEDORA (PREENCHER)",
                    supplier_cnpj: "CNPJ: 00.000.000/0000-00",
                    is_winner: true,
                    total_value: 0,
                    accountability_quote_items: []
                },
                {
                    supplier_name: "EMPRESA PARTICIPANTE B (PREENCHER)",
                    supplier_cnpj: "CNPJ: 00.000.000/0000-00",
                    is_winner: false,
                    total_value: 0,
                    accountability_quote_items: []
                },
                {
                    supplier_name: "EMPRESA PARTICIPANTE C (PREENCHER)",
                    supplier_cnpj: "CNPJ: 00.000.000/0000-00",
                    is_winner: false,
                    total_value: 0,
                    accountability_quote_items: []
                }
            ],
            accountability_items: [
                { description: "ITEM 1 (DESCREVER)", quantity: "___", unit: "UND", winner_unit_price: 0, unit_price: 0 },
                { description: "ITEM 2 (DESCREVER)", quantity: "___", unit: "UND", winner_unit_price: 0, unit_price: 0 },
                { description: "ITEM 3 (DESCREVER)", quantity: "___", unit: "UND", winner_unit_price: 0, unit_price: 0 }
            ],
            discount: 0
        };

        if (type === 'ata') printDocument(generateAtaHTML(blankProcess));
        if (type === 'ordem') printDocument(generateOrdemHTML(blankProcess));
        if (type === 'consolidacao') printDocument(generateConsolidacaoHTML(blankProcess));
    };

    return (
        <div className="min-h-screen bg-[#111827] text-white font-sans selection:bg-primary/30">
            {/* Hero Header */}
            <div className="relative overflow-hidden bg-[#0f172a] border-b border-white/5">
                <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:50px_50px]"></div>
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 blur-[100px] rounded-full -mr-20 -mt-20"></div>

                <div className="max-w-7xl mx-auto px-6 py-20 relative z-10">
                    <button
                        onClick={onBack}
                        className="mb-8 flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest group"
                    >
                        <span className="material-symbols-outlined text-lg group-hover:-translate-x-1 transition-transform">arrow_back</span>
                        Voltar para o Início
                    </button>

                    <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
                        Manual do <span className="text-primary">Gestor Escolar</span>
                    </h1>
                    <p className="text-lg md:text-xl text-slate-400 max-w-3xl leading-relaxed">
                        Guia completo sobre a execução financeira, compras e prestação de contas dos recursos
                        do <strong className="text-white">PDDE, FNDE</strong> e <strong className="text-white">Programas Estaduais de Alagoas</strong>.
                    </p>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="sticky top-0 z-50 bg-[#111827]/95 backdrop-blur-md border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 flex gap-8 overflow-x-auto">
                    {[
                        { id: 'federal', label: 'Programas Federais (PDDE/FNDE)', icon: 'account_balance' },
                        { id: 'estadual', label: 'Recursos Estaduais (Alagoas)', icon: 'location_on' },
                        { id: 'execucao', label: 'Manual de Execução & Compras', icon: 'shopping_cart' },
                        { id: 'contas', label: 'Prestação de Contas', icon: 'fact_check' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-3 py-6 border-b-2 text-sm font-bold uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id
                                ? 'border-primary text-primary'
                                : 'border-transparent text-slate-500 hover:text-white hover:border-white/20'
                                }`}
                        >
                            <span className="material-symbols-outlined text-xl">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="max-w-7xl mx-auto px-6 py-12">

                {/* TAB: FEDERAL */}
                {activeTab === 'federal' && (
                    <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Intro */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                            <div>
                                <h2 className="text-3xl font-black text-white mb-6">PDDE Básico e Ações Agregadas</h2>
                                <p className="text-slate-400 leading-relaxed mb-6">
                                    O Programa Dinheiro Direto na Escola (PDDE) tem por finalidade prestar assistência financeira às escolas,
                                    em caráter suplementar, a fim de contribuir para manutenção e melhoria da infraestrutura física e pedagógica.
                                </p>
                                <div className="flex flex-wrap gap-4">
                                    <a href="https://www.gov.br/fnde/pt-br/acesso-a-informacao/acoes-e-programas/financiamento/pdde" target="_blank" rel="noopener noreferrer" className="btn-outline">
                                        Portal do FNDE
                                    </a>
                                    <a href="https://www.fnde.gov.br/index.php/programas/pdde/area-para-gestores/manuais-e-orientacoes-pdde" target="_blank" rel="noopener noreferrer" className="btn-outline">
                                        Manuais Oficiais
                                    </a>
                                </div>
                            </div>
                            <div className="bg-gradient-to-br from-primary/20 to-blue-600/5 p-1 rounded-[40px] border border-white/5">
                                <div className="bg-[#16202a] rounded-[38px] p-8 border border-white/5">
                                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-3">
                                        <span className="material-symbols-outlined text-yellow-500">warning</span>
                                        Regra de Ouro (Custeio vs. Capital)
                                    </h3>
                                    <ul className="space-y-4 text-sm text-slate-400">
                                        <li className="flex gap-3">
                                            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2"></span>
                                            <span><strong>Custeio:</strong> Materiais de consumo (papelaria, limpeza), pequenos reparos, serviços de terceiros.</span>
                                        </li>
                                        <li className="flex gap-3">
                                            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2"></span>
                                            <span><strong>Capital:</strong> Equipamentos duráveis (computadores, móveis, eletrodomésticos) que incorporam ao patrimônio.</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Program Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <ProgramCard
                                title="PDDE Básico"
                                icon="school"
                                description="Recurso livre para manutenção da escola e pequenos investimentos."
                                items={['Material de expediente', 'Produtos de limpeza', 'Lâmpadas e reparos', 'Mobiliário escolar']}
                                colorTheme="blue"
                            />
                            <ProgramCard
                                title="PDDE Educação Conectada"
                                icon="wifi"
                                description="Focado na contratação de internet e infraestrutura de rede."
                                items={['Serviço de internet', 'Roteadores e Cabos', 'Serviços de rede', 'Dispositivos eletrônicos']}
                                colorTheme="cyan"
                            />
                            <ProgramCard
                                title="PDDE Tempo Integral"
                                icon="schedule"
                                description="Adaptação de espaços e aquisição de materiais para jornada ampliada."
                                items={['Colchonetes e roupas de cama', 'Jogos pedagógicos', 'Instalação de chuveiros', 'Utensílios de cozinha']}
                                colorTheme="cyan"
                            />
                            <ProgramCard
                                title="PDDE Sala de Recursos"
                                icon="accessible"
                                description="Para Atendimento Educacional Especializado (AEE) e acessibilidade."
                                items={['Materiais de tecnologia assistiva', 'Jogos adaptados', 'Mobiliário acessível', 'Reformas de acessibilidade']}
                                colorTheme="pink"
                            />
                            <ProgramCard
                                title="Mais Alfabetização"
                                icon="menu_book"
                                description="Apoio financeiro para assistentes de alfabetização e materiais."
                                items={['Ressarcimento de assistentes', 'Material de papelaria', 'Jogos de alfabetização', 'Reprodução de apostilas']}
                                colorTheme="indigo"
                            />
                            <ProgramCard
                                title="PNAE (Merenda)"
                                icon="restaurant"
                                description="Exclusivo para gêneros alimentícios. Atenção aos 30% da Agricultura Familiar."
                                items={['Gêneros perecíveis', 'Gêneros não perecíveis', 'Agricultura Familiar (obrigatório)', 'Gás de cozinha (limitado)']}
                                colorTheme="green"
                            />
                        </div>
                    </div>
                )}

                {/* TAB: ESTADUAL */}
                {activeTab === 'estadual' && (
                    <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-primary/5 border border-primary/20 rounded-3xl p-8 text-center">
                            <h2 className="text-2xl font-black text-white mb-4">Secretaria de Estado da Educação de Alagoas (SEDUC-AL)</h2>
                            <p className="text-slate-400 max-w-2xl mx-auto">
                                Recursos estaduais transferidos para manutenção e desenvolvimento do ensino.
                                A execução deve seguir rigorosamente as portarias vigentes (Consulte a GEE).
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <ProgramCard
                                title="Escola da Hora"
                                icon="school"
                                description="Principal programa de transferência financeira para unidades de ensino estaduais, dividido em rubricas específicas."
                                colorTheme="blue"
                                listTitle="Rubricas do Programa"
                                items={[
                                    { label: 'Fardamento', icon: 'checkroom' },
                                    { label: 'Gás de Cozinha', icon: 'propane' },
                                    { label: 'Escola Web', icon: 'language' },
                                    { label: 'Ações Democráticas', icon: 'how_to_vote' }
                                ]}
                            />

                            <ProgramCard
                                title="Rumo às Aulas"
                                icon="directions_run"
                                description="Recurso destinado à preparação da escola para o retorno e manutenção das atividades letivas, focando em adequações e suprimentos necessários."
                                colorTheme="emerald"
                                items={[
                                    'Pequenos reparos e manutenção',
                                    'Aquisição de materiais de consumo',
                                    'Itens de higiene e limpeza'
                                ]}
                            />

                            <ProgramCard
                                title="Mais Merenda"
                                icon="restaurant_menu"
                                description="Complemento estadual ao PNAE para qualificar a alimentação escolar, permitindo a aquisição de itens que diversifiquem o cardápio."
                                colorTheme="orange"
                                items={[
                                    'Complementação nutricional',
                                    'Diversificação do cardápio',
                                    'Produtos da agricultura familiar'
                                ]}
                            />
                        </div>

                        <div className="bg-[#16202a] rounded-[32px] p-8 border border-white/5 mt-8">
                            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                                <span className="material-symbols-outlined text-yellow-500">info</span>
                                Informações Importantes sobre Recursos Estaduais
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 shrink-0">
                                        <span className="material-symbols-outlined">description</span>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white text-sm mb-1">Prestação de Contas</h4>
                                        <p className="text-xs text-slate-400 leading-relaxed">Deve ser realizada separadamente para cada programa e rubrica, respeitando os prazos estabelecidos pela SEDUC.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 shrink-0">
                                        <span className="material-symbols-outlined">gavel</span>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white text-sm mb-1">Aplicação Financeira</h4>
                                        <p className="text-xs text-slate-400 leading-relaxed">Os recursos devem ser mantidos em conta específica e aplicados, com os rendimentos revertidos para o objeto do programa.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 shrink-0">
                                        <span className="material-symbols-outlined">group</span>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white text-sm mb-1">Conselho Escolar</h4>
                                        <p className="text-xs text-slate-400 leading-relaxed">Toda execução deve ser aprovada e fiscalizada pelo Conselho Escolar, garantindo a gestão democrática.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB: EXECUÇÃO */}
                {activeTab === 'execucao' && (
                    <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Timeline */}
                        <div className="relative">
                            <div className="absolute left-8 top-0 bottom-0 w-px bg-white/10 md:left-1/2"></div>

                            <Step
                                num="01"
                                title="Planejamento"
                                desc="Reúna o Conselho Escolar. Defina as prioridades e verifique o saldo disponível em conta (Custeio e Capital)."
                                align="right"
                            />
                            <Step
                                num="02"
                                title="Pesquisa de Preços"
                                desc="Para compras acima do limite de dispensa, realize no mínimo 3 cotações com fornecedores diferentes. O sistema BRN Suite ajuda a organizar isso."
                                align="left"
                            />
                            <Step
                                num="03"
                                title="Aquisição e Pagamento"
                                desc="Selecione o menor preço por item ou lote global. O pagamento deve ser feito via cheque nominativo, transferência, PIX ou cartão do programa."
                                align="right"
                            />
                            <Step
                                num="04"
                                title="Documentação Fiscal"
                                desc="Exija Nota Fiscal Eletrônica (NF-e). A nota DEVE conter no campo 'Informações Complementares' o nome do programa e o ID da escola. Exija também as certidões atualizadas e válidas"
                                align="left"
                            />
                            <Step
                                num="05"
                                title="Prestação de Contas"
                                desc="Organize o processo físico (cotações, cartões CNPJ, ata, consolidação, ordem de compra, certidões, autenticações, nota, espelho, recibo e comprovante de pagamento), tudo assinado e carimbado."
                                align="right"
                            />
                        </div>

                        {/* Downloads */}
                        <div className="bg-[#16202a] border border-white/5 rounded-[40px] p-10 mt-12">
                            <h3 className="text-2xl font-black text-white mb-8 text-center">Documentos e Modelos Úteis</h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <DocButton icon="group" label="Modelo de Ata de Reunião" onClick={() => handleDownload('ata')} />
                                <DocButton icon="request_quote" label="Planilha de Pesquisa de Preço" onClick={() => addToast('Modelo disponível no portal FNDE.', 'info')} />
                                <DocButton icon="gavel" label="Termo de Referência" onClick={() => addToast('Modelo disponível no portal FNDE.', 'info')} />
                                <DocButton icon="inventory" label="Termo de Doação (Capital)" onClick={() => addToast('Modelo em desenvolvimento.', 'info')} />
                                <DocButton icon="shopping_cart_checkout" label="Ordem de Compra/Serviço" onClick={() => handleDownload('ordem')} />
                                <DocButton icon="analytics" label="Consolidação de Preços" onClick={() => handleDownload('consolidacao')} />
                                <DocButton icon="check_circle" label="Atestado de Recebimento" onClick={() => addToast('Utilize o carimbo no verso da Nota Fiscal.', 'info')} />
                                <DocButton icon="rule" label="Parecer do Conselho Fiscal" onClick={() => addToast('Modelo em desenvolvimento.', 'info')} />
                            </div>
                        </div>

                        {/* Signatures & Stamps Checklist */}
                        <div className="bg-[#16202a] border border-white/5 rounded-[40px] p-10 mt-8 mb-20 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-primary/5 blur-[80px] rounded-full -mr-20 -mt-20"></div>

                            <h3 className="text-2xl font-black text-white mb-8 text-center flex items-center justify-center gap-3 relative z-10">
                                <span className="material-symbols-outlined text-yellow-500 text-3xl">verified_user</span>
                                Checklist de Assinaturas e Carimbos Obrigatórios
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                                {/* Nota Fiscal */}
                                <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">
                                    <h4 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary">receipt_long</span>
                                        Nota Fiscal
                                    </h4>
                                    <ul className="space-y-4">
                                        <li>
                                            <span className="text-xs font-bold uppercase text-slate-500 block mb-1">Recebimento</span>
                                            <p className="text-sm text-slate-300">Carimbo de Recebimento de Mercadoria/Serviço assinado pelo <strong>1º e 2º Conselheiros</strong> (com data e matrícula).</p>
                                        </li>
                                        <li>
                                            <span className="text-xs font-bold uppercase text-slate-500 block mb-1">Pagamento</span>
                                            <p className="text-sm text-slate-300">Carimbo de Quitação de Despesas com assinatura e <strong>matrícula dos conselheiros</strong> + Data de Fornecimento.</p>
                                        </li>
                                    </ul>
                                </div>

                                {/* Cotações */}
                                <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">
                                    <h4 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary">request_quote</span>
                                        Cotações
                                    </h4>
                                    <ul className="space-y-4">
                                        <li>
                                            <span className="text-xs font-bold uppercase text-slate-500 block mb-1">Pelo Fornecedor</span>
                                            <p className="text-sm text-slate-300">Todas as cotações devem conter <strong>assinatura e carimbo</strong> do fornecedor.</p>
                                        </li>
                                        <li>
                                            <span className="text-xs font-bold uppercase text-slate-500 block mb-1">Data</span>
                                            <p className="text-sm text-slate-300">Data da emissão da cotação visível e dentro da validade.</p>
                                        </li>
                                    </ul>
                                </div>

                                {/* Ata de Compra */}
                                <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">
                                    <h4 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary">groups</span>
                                        Ata de Realização
                                    </h4>
                                    <ul className="space-y-4">
                                        <li>
                                            <span className="text-xs font-bold uppercase text-slate-500 block mb-1">Assinaturas</span>
                                            <p className="text-sm text-slate-300">
                                                Devem assinar:
                                                <br />• Presidente
                                                <br />• 1º Secretário
                                                <br />• Mínimo de <strong>4 Conselheiros</strong>
                                            </p>
                                        </li>
                                    </ul>
                                </div>

                                {/* Certidões */}
                                <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">
                                    <h4 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary">verified</span>
                                        Certidões e Autenticação
                                    </h4>
                                    <ul className="space-y-4">
                                        <li>
                                            <span className="text-xs font-bold uppercase text-slate-500 block mb-1">Validação</span>
                                            <p className="text-sm text-slate-300">Assinatura do <strong>Presidente + Matrícula</strong> nas certidões, atestando que foram consultadas e são verídicas.</p>
                                        </li>
                                    </ul>
                                </div>

                                {/* Consolidação e OC */}
                                <div className="bg-white/5 border border-white/10 p-6 rounded-3xl col-span-1 md:col-span-2 lg:col-span-1">
                                    <h4 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary">assignment_turned_in</span>
                                        Consolidação/Ordem de Compra.
                                    </h4>
                                    <ul className="space-y-4">
                                        <li>
                                            <span className="text-xs font-bold uppercase text-slate-500 block mb-1">Parecer Final</span>
                                            <p className="text-sm text-slate-300">Assinatura obrigatória do <strong>Presidente do Conselho</strong> na Consolidação de Pesquisas e na Ordem de Compra.</p>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB: PRESTAÇÃO DE CONTAS */}
                {activeTab === 'contas' && (
                    <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Sub-header */}
                        <div className="bg-gradient-to-r from-amber-500/10 via-emerald-500/5 to-transparent border border-white/5 rounded-3xl p-8 md:p-10 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-500/5 blur-[100px] rounded-full -mr-20 -mt-20"></div>
                            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-amber-500/5 blur-[80px] rounded-full -ml-20 -mb-20"></div>
                            
                            <div className="relative z-10 max-w-4xl">
                                <h2 className="text-3xl font-black text-white mb-4 flex items-center gap-3">
                                    <span className="material-symbols-outlined text-amber-500 text-3xl">fact_check</span>
                                    Guia de Prestação de Contas & Carimbos
                                </h2>
                                <p className="text-slate-300 leading-relaxed text-sm">
                                    A prestação de contas é a fase mais sensível da gestão escolar. Este guia reúne as orientações detalhadas de todos os <strong>12 documentos obrigatórios</strong> e simula de forma idêntica os <strong>carimbos físicos reais</strong> homologados pela GEE e SEDUC, mostrando quem assina, onde assina e como carimbar corretamente.
                                </p>
                            </div>
                        </div>

                        {/* REGRA PRINCIPAL: FLUXO DE PAGAMENTO SEGURO */}
                        <div className="bg-[#16202a] border border-white/5 rounded-[40px] p-8 md:p-10 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-[300px] h-[300px] bg-emerald-500/5 blur-[80px] rounded-full -ml-20 -mt-20"></div>
                            <div className="absolute bottom-0 right-0 w-[200px] h-[200px] bg-amber-500/5 blur-[60px] rounded-full -mr-20 -mb-20"></div>
                            
                            <div className="relative z-10 space-y-8">
                                <div className="text-center md:text-left space-y-2 max-w-3xl">
                                    <span className="text-[10px] font-black uppercase text-emerald-400 tracking-widest bg-emerald-500/10 px-3.5 py-1 rounded-full">Fluxo de Conformidade Mandatório</span>
                                    <h3 className="text-2xl font-black text-white">Regra Principal Antes do Pagamento</h3>
                                    <p className="text-slate-400 text-xs leading-relaxed">
                                        Para evitar problemas graves como falta de assinaturas de fornecedores, certidões vencidas ou pagamentos rejeitados em diligências futuras, o gestor escolar **NUNCA** deve efetuar o pagamento ao fornecedor antes da conferência completa realizada pela assessoria técnica da BRN. Siga rigorosamente os 10 passos sequenciais abaixo:
                                    </p>
                                </div>

                                {/* Flow Steps (Collapsible on mobile, Grid on desktop) */}
                                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 relative">
                                    {/* Connection Line (Desktop) */}
                                    <div className="hidden md:block absolute top-[28px] left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-emerald-500 via-amber-500 to-slate-700 z-0"></div>

                                    {[
                                        { num: '01', title: 'Faturamento', desc: 'Fornecedor emite a Nota Fiscal Eletrônica (NF-e/NFS-e).' },
                                        { num: '02', title: 'Reunião', desc: 'A escola reúne toda a pasta documental do processo.' },
                                        { num: '03', title: 'Envio BRN', desc: 'Documentos são apresentados ao técnico da BRN.' },
                                        { num: '04', title: 'Conferência', desc: 'BRN valida notas, certidões, carimbos, atas e propostas.' },
                                        { num: '05', title: 'Parecer Positivo', desc: 'BRN emite orientação formal de liberação do pagamento.' }
                                    ].map((step, idx) => (
                                        <div key={idx} className="bg-white/5 border border-white/10 p-5 rounded-3xl relative z-10 flex flex-col items-center text-center space-y-3 transition-transform hover:scale-[1.03] duration-300">
                                            <div className="w-10 h-10 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-black text-sm shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                                                {step.num}
                                            </div>
                                            <h4 className="font-extrabold text-white text-xs">{step.title}</h4>
                                            <p className="text-[10px] text-slate-400 leading-normal">{step.desc}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 relative pt-4">
                                    {/* Connection Line (Desktop) */}
                                    <div className="hidden md:block absolute top-[28px] left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-slate-700 via-amber-500 to-emerald-500 z-0"></div>

                                    {[
                                        { num: '06', title: 'Assinatura Fornecedor', desc: 'Fornecedor assina todos os documentos pertinentes (Recibo, Cotação, etc.).' },
                                        { num: '07', title: 'Pagamento Seguro', desc: 'Gestor realiza a transferência ou PIX ao fornecedor.' },
                                        { num: '08', title: 'Comprovante', desc: 'O comprovante impresso é anexado imediatamente à pasta.' },
                                        { num: '09', title: 'Assinaturas Escola', desc: 'Coleta de assinaturas/matrículas dos conselheiros e gestores nos carimbos.' },
                                        { num: '10', title: 'Arquivamento', desc: 'Pasta é arquivada organizadamente na caixa do respectivo programa.' }
                                    ].map((step, idx) => (
                                        <div key={idx} className="bg-white/5 border border-white/10 p-5 rounded-3xl relative z-10 flex flex-col items-center text-center space-y-3 transition-transform hover:scale-[1.03] duration-300">
                                            <div className="w-10 h-10 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-black text-sm shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                                                {step.num}
                                            </div>
                                            <h4 className="font-extrabold text-white text-xs">{step.title}</h4>
                                            <p className="text-[10px] text-slate-400 leading-normal">{step.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* RESPONSABILIDADE DO GESTOR CALLOUT */}
                        <div className="bg-gradient-to-r from-amber-600/10 to-red-600/5 border border-amber-500/20 rounded-3xl p-6 relative overflow-hidden flex flex-col md:flex-row items-center gap-6">
                            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
                                <span className="material-symbols-outlined text-2xl font-black">gavel</span>
                            </div>
                            <div className="space-y-1 text-left flex-1">
                                <h4 className="text-sm font-black text-white uppercase tracking-wider">Aviso Legal: Responsabilidade da Coleta de Assinaturas</h4>
                                <p className="text-xs text-slate-350 leading-relaxed">
                                    É de responsabilidade **exclusiva e integral** do gestor escolar a coleta física das assinaturas, preenchimento das matrículas nos carimbos e a guarda organizada da documentação. A BRN atua prestando assessoria técnica, indicando pendências e emitindo orientações, mas a validação final em auditorias da SEDUC e FNDE depende do cumprimento físico das assinaturas pelo Conselho Escolar.
                                </p>
                            </div>
                        </div>

                        {/* Interactive Inspector Layout */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                            {/* Left: Document List (35%) */}
                            <div className="lg:col-span-4 bg-[#16202a] border border-white/5 rounded-3xl p-6 space-y-6">
                                <div>
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Filtros por Etapa</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            { id: 'all', label: 'Todos', color: 'hover:border-slate-500' },
                                            { id: 'compras', label: 'Seleção/Compras', color: 'hover:border-blue-500' },
                                            { id: 'fiscal', label: 'Faturamento', color: 'hover:border-emerald-500' },
                                            { id: 'financeiro', label: 'Pagamentos', color: 'hover:border-amber-500' },
                                            { id: 'certidoes', label: 'Certidões', color: 'hover:border-cyan-500' }
                                        ].map((filter) => (
                                            <button
                                                key={filter.id}
                                                onClick={() => {
                                                    setSelectedFilter(filter.id);
                                                    const match = prestacaoDocs.find(d => filter.id === 'all' || d.phase === filter.id);
                                                    if (match) setSelectedDoc(match);
                                                }}
                                                className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border transition-all ${
                                                    selectedFilter === filter.id
                                                        ? 'bg-white text-slate-900 border-white'
                                                        : 'bg-white/5 text-slate-400 border-transparent ' + filter.color
                                                }`}
                                            >
                                                {filter.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="border-t border-white/5 pt-4">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center justify-between">
                                        <span>Lista de Documentos</span>
                                        <span className="bg-white/5 text-slate-400 text-xs px-2.5 py-0.5 rounded-full font-mono">{filteredDocs.length}</span>
                                    </h3>
                                    <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                        {filteredDocs.map((doc) => {
                                            const isSelected = selectedDoc.id === doc.id;
                                            const phaseColors: Record<string, string> = {
                                                compras: 'text-blue-400',
                                                fiscal: 'text-emerald-400',
                                                financeiro: 'text-amber-400',
                                                certidoes: 'text-cyan-400'
                                            };
                                            return (
                                                <button
                                                    key={doc.id}
                                                    onClick={() => setSelectedDoc(doc)}
                                                    className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center gap-4 group ${
                                                        isSelected
                                                            ? 'bg-white/10 border-white/20 shadow-lg'
                                                            : 'bg-white/5 border-transparent hover:bg-white/[0.08] hover:border-white/10'
                                                    }`}
                                                >
                                                    <span className={`material-symbols-outlined text-xl shrink-0 transition-colors ${
                                                        isSelected ? phaseColors[doc.phase] : 'text-slate-400 group-hover:text-white'
                                                    }`}>{doc.icon}</span>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-bold text-sm text-white truncate leading-tight">{doc.name}</h4>
                                                        <span className={`text-[9px] font-bold uppercase tracking-wider ${phaseColors[doc.phase]}`}>{doc.phaseLabel}</span>
                                                    </div>
                                                    <span className="material-symbols-outlined text-slate-500 text-sm group-hover:translate-x-1 transition-transform">chevron_right</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Right: Document Inspector (65%) */}
                            <div className="lg:col-span-8 space-y-6">
                                <div className="bg-[#16202a] border border-white/5 rounded-3xl p-8 relative overflow-hidden min-h-[500px] flex flex-col justify-between">
                                    <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-white/5 blur-[50px] rounded-full -mr-10 -mt-10"></div>
                                    
                                    {/* Header Inspector */}
                                    <div className="border-b border-white/5 pb-6 mb-6 flex flex-wrap gap-4 items-center justify-between relative z-10">
                                        <div className="space-y-1">
                                            <h3 className="text-2xl font-black text-white leading-tight">{selectedDoc.name}</h3>
                                            <div className="flex gap-2 items-center">
                                                <span className={`w-2 h-2 rounded-full ${
                                                    selectedDoc.phase === 'compras' ? 'bg-blue-400' :
                                                    selectedDoc.phase === 'fiscal' ? 'bg-emerald-400' :
                                                    selectedDoc.phase === 'financeiro' ? 'bg-amber-400' : 'bg-cyan-400'
                                                }`}></span>
                                                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black">{selectedDoc.phaseLabel}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Info Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 relative z-10 flex-1">
                                        <div className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-2">
                                            <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-sm text-emerald-400">help</span>
                                                Para que serve?
                                            </h4>
                                            <p className="text-xs text-slate-300 leading-relaxed">{selectedDoc.purpose}</p>
                                        </div>
                                        <div className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-2">
                                            <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-sm text-amber-400">rate_review</span>
                                                Quem assina?
                                            </h4>
                                            <p className="text-xs text-slate-300 font-bold leading-relaxed">{selectedDoc.whoSigns}</p>
                                        </div>
                                        <div className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-2">
                                            <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-sm text-blue-400">location_on</span>
                                                Onde assina?
                                            </h4>
                                            <p className="text-xs text-slate-300 leading-relaxed">{selectedDoc.whereSigns}</p>
                                        </div>
                                    </div>

                                    {/* Visual Stamp Simulation Box */}
                                    <div className="mt-auto bg-slate-950/40 border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[220px] relative">
                                        <div className="absolute top-3 left-4 text-[9px] font-bold text-slate-500 uppercase tracking-widest">Visualização do Carimbo Obrigatório</div>
                                        
                                        {selectedDoc.stampType === 'none' && (
                                            <div className="text-center space-y-3 p-6 max-w-sm">
                                                <span className="material-symbols-outlined text-5xl text-slate-600">block</span>
                                                <h5 className="font-bold text-sm text-slate-400 uppercase">Não exige carimbo físico</h5>
                                                <p className="text-xs text-slate-500 leading-normal">Este documento possui validação eletrônica automática por código de autenticidade emitido pela internet.</p>
                                            </div>
                                        )}

                                        {selectedDoc.stampType === 'signature_list' && (
                                            <div className="w-full max-w-md border border-dashed border-white/15 p-4 rounded-xl space-y-4 bg-slate-900/10">
                                                <div className="text-center text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-white/5 pb-2 mb-2">Representação de Assinaturas Obrigatórias</div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    {['Presidente', '1º Secretário', 'Conselheiro 1', 'Conselheiro 2', 'Conselheiro 3', 'Conselheiro 4'].map((role) => (
                                                        <div key={role} className="border-b border-dashed border-white/20 pb-1 text-center font-mono">
                                                            <div className="text-[8px] text-slate-500 uppercase">Assinatura</div>
                                                            <div className="h-6"></div>
                                                            <div className="text-[9px] font-bold text-slate-400">{role}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {selectedDoc.stampType === 'president_signature' && (
                                            <div className="w-full max-w-xs border border-dashed border-white/15 p-5 rounded-xl text-center space-y-4 bg-slate-900/10 font-mono">
                                                <div className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Espaço de Assinatura do Gestor</div>
                                                <div className="border-b border-dashed border-white/20 pt-6 pb-1">
                                                    <span className="text-[10px] text-slate-400 font-bold">PRESIDENTE DO CONSELHO ESCOLAR</span>
                                                </div>
                                                <div className="text-[8px] text-slate-500 uppercase">Conselho Escolar - Gestão Financeira</div>
                                            </div>
                                        )}

                                        {selectedDoc.stampType === 'supplier_signature' && (
                                            <div className="w-full max-w-sm border border-dashed border-white/15 p-5 rounded-xl text-center space-y-4 bg-slate-900/10 font-mono">
                                                <div className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Espaço de Quitação do Fornecedor</div>
                                                <div className="border-b border-dashed border-white/20 pt-8 pb-1">
                                                    <span className="text-[10px] text-slate-400 font-bold">FORNECEDOR VENCEDOR</span>
                                                </div>
                                                <div className="text-[8px] text-slate-500 uppercase">Assinatura do Representante / Carimbo CNPJ</div>
                                            </div>
                                        )}

                                        {selectedDoc.stampType === 'concorrente_signature' && (
                                            <div className="w-full max-w-sm border border-dashed border-white/15 p-5 rounded-xl text-center space-y-4 bg-slate-900/10 font-mono">
                                                <div className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Validação da Cotação Concorrente</div>
                                                <div className="border-b border-dashed border-white/20 pt-8 pb-1">
                                                    <span className="text-[10px] text-slate-400 font-bold">EMPRESA PARTICIPANTE</span>
                                                </div>
                                                <div className="text-[8px] text-slate-500 uppercase">Representante Legal da Empresa Concorrente</div>
                                            </div>
                                        )}

                                        {selectedDoc.stampType === 'confere_original' && (
                                            <StampRenderer type="confere_original" />
                                        )}

                                        {selectedDoc.stampType === 'atestado_quitacao' && (
                                            <StampRenderer type="atestado_quitacao" />
                                        )}

                                        {selectedDoc.stampType === 'atesto_recebimento' && (
                                            <StampRenderer type="atesto_recebimento" />
                                        )}

                                        {selectedDoc.stampType === 'gestora_ensino' && (
                                            <StampRenderer type="gestora_ensino" />
                                        )}

                                        {selectedDoc.stampType === 'pago_com_recurso' && (
                                            <div className="flex flex-col items-center gap-6 w-full">
                                                <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-xl border border-white/10">
                                                    <span className="text-xs font-bold text-slate-400 uppercase">Recurso do Carimbo:</span>
                                                    <select
                                                        value={selectedStampProgram}
                                                        onChange={(e) => setSelectedStampProgram(e.target.value)}
                                                        className="bg-slate-900 border border-white/10 rounded px-2.5 py-1 text-xs text-white font-bold focus:outline-none focus:border-amber-500"
                                                    >
                                                        <option value="PNAE/FNDE">PNAE/FNDE</option>
                                                        <option value="RUMO ÀS AULAS">RUMO ÀS AULAS</option>
                                                        <option value="PDDE EQUIDADE">PDDE EQUIDADE</option>
                                                        <option value="ESCOLA DA HORA/AL">ESCOLA DA HORA/AL</option>
                                                        <option value="PDDE QUALIDADE">PDDE QUALIDADE</option>
                                                        <option value="PDDE MANUTENÇÃO ESCOLAR">PDDE MANUTENÇÃO ESCOLAR</option>
                                                        <option value="MAIS MERENDA">MAIS MERENDA</option>
                                                    </select>
                                                </div>
                                                <StampRenderer type="pago_com_recurso" program={selectedStampProgram} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* CASE STUDY: DYNAMIC INVOICE & RECEIPT SIMULATOR */}
                        <div className="bg-[#16202a] border border-white/5 rounded-[40px] p-8 md:p-12 mt-12 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/[0.02] blur-[120px] rounded-full -mr-20 -mt-20"></div>
                            
                            <div className="max-w-4xl mx-auto space-y-8 relative z-10">
                                <div className="text-center space-y-3">
                                    <span className="text-[10px] font-black uppercase text-amber-500 tracking-widest bg-amber-500/10 px-3.5 py-1 rounded-full">Casos de Sucesso Reais</span>
                                    <h3 className="text-2xl md:text-3xl font-black text-white leading-tight font-sans">Laboratório Interativo de Documentos & Carimbos</h3>
                                    <p className="text-slate-400 text-sm max-w-2xl mx-auto leading-relaxed font-sans">
                                        Selecione um dos exemplos abaixo obtidos de prestações de contas reais aprovadas para entender como carimbar notas de produtos, serviços e comprovantes de pagamento.
                                    </p>
                                </div>

                                {/* Case Study Type Selector */}
                                <div className="flex justify-center border-b border-white/5 pb-4">
                                    <div className="flex gap-2 bg-slate-900 border border-white/10 p-1.5 rounded-full">
                                        {[
                                            { id: 'produto', label: '1. Nota de Produto (DANFE)', icon: 'shopping_bag' },
                                            { id: 'servico', label: '2. Nota de Serviço (NFS-e)', icon: 'engineering' },
                                            { id: 'pix', label: '3. Comprovante de Pagamento (PIX)', icon: 'receipt_long' },
                                            { id: 'certidao', label: '4. Certidões de Regularidade', icon: 'verified' }
                                        ].map((caseItem) => (
                                            <button
                                                key={caseItem.id}
                                                onClick={() => {
                                                    setCaseStudyType(caseItem.id as any);
                                                    if (caseItem.id !== 'produto') {
                                                        setInvoicePage('lauda1');
                                                    }
                                                }}
                                                className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold transition-all uppercase tracking-wider ${
                                                    caseStudyType === caseItem.id
                                                        ? 'bg-amber-500 text-slate-900 shadow-md font-bold'
                                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                                }`}
                                            >
                                                <span className="material-symbols-outlined text-[16px]">{caseItem.icon}</span>
                                                {caseItem.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Certificate Selector (only for certidao case study) */}
                                {caseStudyType === 'certidao' && (
                                    <div className="flex justify-center pb-2">
                                        <div className="flex flex-wrap gap-2 bg-slate-950/40 p-1.5 rounded-full border border-white/5 justify-center">
                                            {[
                                                { id: 'municipal', label: 'Municipal', icon: 'location_city' },
                                                { id: 'estadual', label: 'Estadual', icon: 'map' },
                                                { id: 'federal', label: 'Federal', icon: 'account_balance' },
                                                { id: 'fgts', label: 'FGTS (Caixa)', icon: 'badge' },
                                                { id: 'cndt', label: 'Trabalhista (CNDT)', icon: 'gavel' }
                                            ].map((cert) => (
                                                <button
                                                    key={cert.id}
                                                    onClick={() => setSelectedCertType(cert.id as any)}
                                                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all uppercase tracking-wider ${
                                                        selectedCertType === cert.id
                                                            ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                                                            : 'text-slate-400 hover:text-white'
                                                    }`}
                                                >
                                                    <span className="material-symbols-outlined text-[16px]">{cert.icon}</span>
                                                    {cert.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Page Switcher Tabs for Product Invoice ONLY */}
                                {caseStudyType === 'produto' && (
                                    <div className="flex justify-center pb-2">
                                        <div className="flex gap-2 bg-slate-950/40 p-1.5 rounded-full border border-white/5">
                                            {[
                                                { id: 'lauda1', label: 'Lauda 1 (Frente)', icon: 'description' },
                                                { id: 'verso', label: 'Verso da Lauda 1', icon: 'flip' },
                                                { id: 'lauda2', label: 'Lauda 2 (Frente)', icon: 'description' }
                                            ].map((page) => (
                                                <button
                                                    key={page.id}
                                                    onClick={() => setInvoicePage(page.id as any)}
                                                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all uppercase tracking-wider ${
                                                        invoicePage === page.id
                                                            ? 'bg-white text-slate-900 shadow-md font-bold'
                                                            : 'text-slate-400 hover:text-white'
                                                    }`}
                                                >
                                                    <span className="material-symbols-outlined text-[16px]">{page.icon}</span>
                                                    {page.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Interactive Simulated Sheet */}
                                <div className="bg-[#fcfcfc] text-slate-800 p-6 md:p-10 rounded-2xl shadow-2xl max-w-3xl mx-auto border border-slate-200 relative overflow-hidden font-sans min-h-[680px] flex flex-col justify-between selection:bg-slate-300">
                                    
                                    {/* CASE 1: PRODUCT INVOICE */}
                                    {caseStudyType === 'produto' && invoicePage === 'lauda1' && (
                                        <div className="space-y-6 flex-1 flex flex-col justify-between h-full text-slate-800 text-[10px]">
                                            {/* Simulated Invoice Header */}
                                            <div className="border border-slate-400 p-2 space-y-4 text-[9px] uppercase font-mono relative">
                                                <div className="grid grid-cols-12 border-b border-slate-400 pb-2">
                                                    <div className="col-span-4 border-r border-slate-400 pr-2 font-bold text-center flex flex-col justify-center">
                                                        <div className="text-[12px] font-black text-orange-600 tracking-wider">SUPERMERCADO ECONÔMICO</div>
                                                        <div className="text-[7px] text-slate-500 font-sans normal-case mt-1">PARQUE ANTENOR UCHOA, 74 - CENTRO<br/>UNIAO DOS PALMARES - AL</div>
                                                    </div>
                                                    <div className="col-span-4 border-r border-slate-400 px-2 text-center flex flex-col justify-center items-center">
                                                        <div className="font-black text-sm">DANFE</div>
                                                        <div className="text-[7px] font-sans normal-case leading-tight text-center">Documento Auxiliar da<br/>Nota Fiscal Eletrônica</div>
                                                        <div className="flex gap-2 mt-2 border border-slate-400 px-2 py-0.5 font-bold">
                                                            <span>SAÍDA: 1</span>
                                                            <span className="border-l border-slate-400 pl-2">Nº 27582</span>
                                                        </div>
                                                        <div className="font-bold text-[8px] mt-1">PÁGINA 1 DE 2</div>
                                                    </div>
                                                    <div className="col-span-4 pl-2 break-all text-[8px] flex flex-col justify-center">
                                                        <span className="font-bold">CHAVE DE ACESSO:</span>
                                                        <span className="font-bold text-slate-600 block mt-0.5 tracking-tighter">2726 0524 3278 5000 0167 5501 0000 0275 8210 9973 9084</span>
                                                        <span className="text-[6px] normal-case text-slate-500 mt-2 block">Consulta de autenticidade no portal nacional da NF-e</span>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-3 gap-2 text-[7px]">
                                                    <div>
                                                        <span className="font-bold block text-slate-500">INSCRIÇÃO ESTADUAL</span>
                                                        <span className="font-bold">240749707</span>
                                                    </div>
                                                    <div>
                                                        <span className="font-bold block text-slate-500">INSCRIÇÃO MUNICIPAL</span>
                                                        <span className="font-bold">--</span>
                                                    </div>
                                                    <div>
                                                        <span className="font-bold block text-slate-500">CNPJ</span>
                                                        <span className="font-bold">24.327.850/0001-67</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Destinatário */}
                                            <div className="border border-slate-400 p-2 text-[8px] font-mono uppercase space-y-1">
                                                <div className="font-bold text-slate-500 text-[6px] border-b border-slate-200 pb-0.5">DESTINATÁRIO / REMETENTE</div>
                                                <div className="grid grid-cols-12 gap-2">
                                                    <div className="col-span-8">
                                                        <span className="font-bold text-slate-500">NOME / RAZÃO SOCIAL:</span>
                                                        <span className="font-black block text-[9px] text-slate-900">CONSELHO ESC EST ROCHA CAVALCANTI</span>
                                                    </div>
                                                    <div className="col-span-4">
                                                        <span className="font-bold text-slate-500">CNPJ:</span>
                                                        <span className="font-bold block">00.769.380/0001-52</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Simulated Items list (Page 1) */}
                                            <div className="border border-slate-400 p-2 flex-1 text-[8px] uppercase font-mono">
                                                <div className="font-bold text-slate-500 text-[6px] border-b border-slate-300 pb-1 mb-1">DADOS DOS PRODUTOS E SERVIÇOS</div>
                                                <table className="w-full text-left text-[7px]">
                                                    <thead>
                                                        <tr className="border-b border-slate-300 text-slate-500 font-bold">
                                                            <th className="py-1">CÓD.</th>
                                                            <th className="py-1">DESCRIÇÃO</th>
                                                            <th className="py-1">NCM</th>
                                                            <th className="py-1">UN</th>
                                                            <th className="py-1">QTD</th>
                                                            <th className="py-1">VL. UNIT</th>
                                                            <th className="py-1">VL. TOTAL</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-200 text-slate-700">
                                                        <tr><td>4398</td><td className="font-bold text-slate-900">ACUCAR CAETE CRISTAL 1KG</td><td>17019900</td><td>UN</td><td>90,000</td><td>3,690</td><td>332,10</td></tr>
                                                        <tr><td>5712</td><td className="font-bold text-slate-900">ALHO KG</td><td>07032090</td><td>KG</td><td>10,000</td><td>34,900</td><td>349,00</td></tr>
                                                        <tr><td>20693</td><td className="font-bold text-slate-900">ARROZ RAMPINELLI PARBOILIZADO 1KG</td><td>10062010</td><td>UN</td><td>60,000</td><td>3,990</td><td>239,40</td></tr>
                                                        <tr><td>52557</td><td className="font-bold text-slate-900">ARROZ TIO VIEIRA BRANCO T1 KG</td><td>10063021</td><td>UN</td><td>10,000</td><td>3,790</td><td>37,90</td></tr>
                                                        <tr><td>38993</td><td className="font-bold text-slate-900">AVEIA YOKI FLOCOS FINOS 170G</td><td>11041200</td><td>UN</td><td>12,000</td><td>3,990</td><td>47,88</td></tr>
                                                        <tr><td>46847</td><td className="font-bold text-slate-900">BEB LACT. BOM LEITE MORG. 150G</td><td>04039000</td><td>UN</td><td>1.470,000</td><td>1,590</td><td>2.337,30</td></tr>
                                                        <tr><td>50348</td><td className="font-bold text-slate-900">BISC. VITARELLA C. CRACKER 350G</td><td>19053100</td><td>UN</td><td>200,000</td><td>5,990</td><td>1.198,00</td></tr>
                                                    </tbody>
                                                </table>
                                                <div className="text-center py-2 text-slate-400 text-[6px] border-t border-slate-300 mt-2">Continua na Lauda 2...</div>
                                            </div>

                                            {/* Page 1 Bottom Blank Area Stamped */}
                                            <div className="border border-slate-400 p-4 min-h-[140px] flex items-center justify-end gap-6 bg-slate-100/50 relative">
                                                <div className="absolute top-2 left-3 text-[7px] text-slate-400 font-mono">DADOS ADICIONAIS / ÁREA DE CARIMBOS</div>
                                                
                                                {/* Mini Stamp 1: Pago com Recurso PNAE/FNDE */}
                                                <div className="border-2 border-red-600/80 text-red-600 text-[8px] font-sans font-bold p-2 rounded-sm tracking-wider uppercase bg-white/70 select-none transform rotate-[1deg] text-center shadow-sm">
                                                    <div>PAGO COM RECURSO</div>
                                                    <div className="border-t border-red-600/80 mt-1 pt-0.5 text-[9px] font-black">PNAE/FNDE</div>
                                                </div>

                                                {/* Mini Stamp 2: Atestado Quitação */}
                                                <div className="border-2 border-blue-600/80 text-blue-600 text-[8px] font-sans p-2 rounded-sm uppercase tracking-wide bg-white/70 text-center select-none transform -rotate-[2deg] shadow-sm max-w-[150px]">
                                                    <div className="font-black text-[9px] tracking-wide">ATESTADO QUITAÇÃO</div>
                                                    <div className="text-[5px] font-medium leading-none mb-1 text-slate-600">Atesto a quitação da despesa efetiva.</div>
                                                    <div className="text-[6px] text-left font-mono font-bold mt-1 text-blue-800 leading-normal">
                                                        DATA: ___/___/___<br/>
                                                        NOME: ________________
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {caseStudyType === 'produto' && invoicePage === 'verso' && (
                                        <div className="space-y-6 flex-1 flex flex-col justify-around h-full py-8 border border-dashed border-slate-300 bg-white/90">
                                            <div className="text-center font-mono text-[9px] uppercase tracking-widest text-slate-400 border-b border-slate-200 pb-2 mx-8">
                                                Verso da Lauda 1 (Página sem texto - Reservada para carimbos)
                                            </div>

                                            {/* Layout of stamps on the back */}
                                            <div className="grid grid-cols-2 gap-8 px-6 items-center">
                                                
                                                {/* Stamp 1: Atesto Recebimento (1º Conselheiro) */}
                                                <div className="border-2 border-blue-600/80 text-blue-600 font-sans p-3 rounded-sm uppercase tracking-wide bg-white select-none transform -rotate-[1deg] flex gap-2 items-stretch max-w-[280px]">
                                                    <div className="flex flex-col justify-between items-center border-r border-blue-600 pr-2 font-mono text-[8px] shrink-0 text-blue-800">
                                                        <div className="rotate-[-90deg] origin-center translate-y-3 font-bold text-[7px]">DATA:</div>
                                                        <div className="font-black">/</div>
                                                    </div>
                                                    <div className="flex-1 text-left">
                                                        <div className="font-black text-[10px] tracking-wider text-center">ATESTO RECEBIMENTO</div>
                                                        <div className="text-[5px] text-slate-500 mb-1 font-sans text-center normal-case font-bold leading-none">RECEBI OS MATERIAIS E/OU CONSTATEI A REALIZAÇÃO DOS SERVIÇOS</div>
                                                        <div className="space-y-1.5 font-mono text-[7px] text-blue-800 normal-case leading-normal font-bold">
                                                            <div>NOME: __________________________</div>
                                                            <div>FUNÇÃO: 1º CONSELHEIRO</div>
                                                            <div>ASSINATURA: __________________</div>
                                                            <div>MATRÍCULA: ___________________</div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Stamp 2: Pago com Recurso PNAE */}
                                                <div className="border-2 border-red-600/80 text-red-600 text-[10px] font-sans font-bold p-3 rounded-sm tracking-wider uppercase bg-white select-none transform rotate-[2deg] text-center w-48 justify-self-center">
                                                    <div>PAGO COM RECURSO</div>
                                                    <div className="border-t border-red-600/80 mt-1 pt-1 font-black">PNAE/FNDE</div>
                                                </div>

                                                {/* Stamp 3: Atesto Recebimento (2º Conselheiro) */}
                                                <div className="border-2 border-blue-600/80 text-blue-600 font-sans p-3 rounded-sm uppercase tracking-wide bg-white select-none transform rotate-[1deg] flex gap-2 items-stretch max-w-[280px]">
                                                    <div className="flex flex-col justify-between items-center border-r border-blue-600 pr-2 font-mono text-[8px] shrink-0 text-blue-800">
                                                        <div className="rotate-[-90deg] origin-center translate-y-3 font-bold text-[7px]">DATA:</div>
                                                        <div className="font-black">/</div>
                                                    </div>
                                                    <div className="flex-1 text-left">
                                                        <div className="font-black text-[10px] tracking-wider text-center">ATESTO RECEBIMENTO</div>
                                                        <div className="text-[5px] text-slate-500 mb-1 font-sans text-center normal-case font-bold leading-none">RECEBI OS MATERIAIS E/OU CONSTATEI A REALIZAÇÃO DOS SERVIÇOS</div>
                                                        <div className="space-y-1.5 font-mono text-[7px] text-blue-800 normal-case leading-normal font-bold">
                                                            <div>NOME: __________________________</div>
                                                            <div>FUNÇÃO: 2º CONSELHEIRO</div>
                                                            <div>ASSINATURA: __________________</div>
                                                            <div>MATRÍCULA: ___________________</div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Stamp 4: Atestado Quitação */}
                                                <div className="border-2 border-blue-600/80 text-blue-600 text-[8px] font-sans p-3 rounded-sm uppercase tracking-wide bg-white text-center select-none transform -rotate-[1.5deg] max-w-[180px] justify-self-center">
                                                    <div className="font-black text-[10px] tracking-wide">ATESTADO QUITAÇÃO</div>
                                                    <div className="text-[6px] font-bold text-slate-500 mb-1.5 leading-none">Atesto a quitação da despesa efetiva.</div>
                                                    <div className="space-y-1 font-mono font-bold text-left text-blue-800 leading-normal">
                                                        <div>DATA: ____ / ____ / ________</div>
                                                        <div>NOME: ________________________</div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="text-center font-mono text-[8px] text-slate-400 mx-8 border-t border-slate-200 pt-2 leading-normal italic normal-case">
                                                *Nota: Como a frente da Lauda 1 não possuía espaço livre para acomodar todos os carimbos de controle de forma clara e visível, a lavratura dos carimbos foi realizada no seu Verso, garantindo a integridade dos dados fiscais e o pleno compliance do processo físico.
                                            </div>
                                        </div>
                                    )}

                                    {caseStudyType === 'produto' && invoicePage === 'lauda2' && (
                                        <div className="space-y-6 flex-1 flex flex-col justify-between h-full text-slate-800 text-[10px]">
                                            {/* Simulated Invoice Header Page 2 */}
                                            <div className="border border-slate-400 p-2 space-y-4 text-[9px] uppercase font-mono">
                                                <div className="grid grid-cols-12">
                                                    <div className="col-span-5 pr-2 font-bold flex flex-col justify-center">
                                                        <div className="text-[11px] font-black text-orange-600 tracking-wider">SUPERMERCADO ECONÔMICO</div>
                                                    </div>
                                                    <div className="col-span-3 px-2 text-center flex flex-col justify-center border-l border-r border-slate-400">
                                                        <div className="font-black text-sm">DANFE</div>
                                                        <div className="font-bold text-[8px]">PÁGINA 2 DE 2</div>
                                                    </div>
                                                    <div className="col-span-4 pl-2 break-all text-[8px] flex flex-col justify-center">
                                                        <span className="font-bold">Nº 27582</span>
                                                        <span className="font-bold block mt-0.5">SÉRIE: 10</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Simulated Items list (Page 2) */}
                                            <div className="border border-slate-400 p-2 flex-1 text-[8px] uppercase font-mono">
                                                <div className="font-bold text-slate-500 text-[6px] border-b border-slate-300 pb-1 mb-1">DADOS DOS PRODUTOS E SERVIÇOS (Continuação)</div>
                                                <table className="w-full text-left text-[7px]">
                                                    <thead>
                                                        <tr className="border-b border-slate-300 text-slate-500 font-bold">
                                                            <th className="py-1">CÓD.</th>
                                                            <th className="py-1">DESCRIÇÃO</th>
                                                            <th className="py-1">NCM</th>
                                                            <th className="py-1">UN</th>
                                                            <th className="py-1">QTD</th>
                                                            <th className="py-1">VL. UNIT</th>
                                                            <th className="py-1">VL. TOTAL</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-200 text-slate-700">
                                                        <tr><td>56046</td><td className="font-bold text-slate-900">PAO FRANCES KG</td><td>19059090</td><td>KG</td><td>105,000</td><td>14,500</td><td>1.522,50</td></tr>
                                                        <tr><td>31600</td><td className="font-bold text-slate-900">PROT. SORA DE SOJA ESC 400G</td><td>21061000</td><td>UN</td><td>50,000</td><td>7,490</td><td>374,50</td></tr>
                                                        <tr><td>31085</td><td className="font-bold text-slate-900">SAL MOIDO PUROSAL 1KG</td><td>25010020</td><td>UN</td><td>30,000</td><td>1,500</td><td>45,00</td></tr>
                                                        <tr><td>5722</td><td className="font-bold text-slate-900">TEMPERO CASEIRO MOIDO KG</td><td>21039029</td><td>KG</td><td>5,000</td><td>45,000</td><td>225,00</td></tr>
                                                        <tr><td>1876</td><td className="font-bold text-slate-900">VINAGRE PALADAR 900ML</td><td>22090000</td><td>UN</td><td>12,000</td><td>4,750</td><td>57,00</td></tr>
                                                    </tbody>
                                                </table>
                                                
                                                <div className="grid grid-cols-3 gap-2 border-t border-slate-300 mt-4 pt-2 text-[8px] font-bold text-slate-700">
                                                    <div></div>
                                                    <div></div>
                                                    <div className="text-right">VALOR TOTAL DA NOTA: R$ 22.882,26</div>
                                                </div>
                                            </div>

                                            {/* Page 2 Bottom Blank Area Stamped with all 4 stamps! */}
                                            <div className="border border-slate-400 p-4 min-h-[220px] grid grid-cols-2 gap-4 items-center bg-slate-100/50 relative">
                                                <div className="absolute top-2 left-3 text-[7px] text-slate-400 font-mono">DADOS ADICIONAIS / ÁREA DE CARIMBOS</div>
                                                
                                                {/* Stamp 1: Atesto Recebimento (1º Conselheiro) */}
                                                <div className="border-2 border-blue-600/80 text-blue-600 font-sans p-2 rounded-sm uppercase tracking-wide bg-white/70 select-none transform -rotate-[1deg] flex gap-2 items-stretch max-w-[240px]">
                                                    <div className="flex flex-col justify-between items-center border-r border-blue-600 pr-1.5 font-mono text-[7px] shrink-0 text-blue-800">
                                                        <div className="rotate-[-90deg] origin-center translate-y-2.5 font-bold text-[6px]">DATA:</div>
                                                        <div className="font-black">/</div>
                                                    </div>
                                                    <div className="flex-1 text-left">
                                                        <div className="font-black text-[8px] tracking-wider text-center">ATESTO RECEBIMENTO</div>
                                                        <div className="space-y-1 font-mono text-[6px] text-blue-800 normal-case leading-normal font-bold">
                                                            <div>NOME: __________________________</div>
                                                            <div>FUNÇÃO: 1º CONSELHEIRO</div>
                                                            <div>ASSINATURA: __________________</div>
                                                            <div>MATRÍCULA: ___________________</div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Stamp 2: Pago com Recurso PNAE */}
                                                <div className="border-2 border-red-600/80 text-red-600 text-[8px] font-sans font-bold p-2 rounded-sm tracking-wider uppercase bg-white/70 select-none transform rotate-[2deg] text-center w-36 justify-self-center">
                                                    <div>PAGO COM RECURSO</div>
                                                    <div className="border-t border-red-600/80 mt-1 pt-0.5 font-black text-[9px]">PNAE/FNDE</div>
                                                </div>

                                                {/* Stamp 3: Atesto Recebimento (2º Conselheiro) */}
                                                <div className="border-2 border-blue-600/80 text-blue-600 font-sans p-2 rounded-sm uppercase tracking-wide bg-white/70 select-none transform rotate-[1deg] flex gap-2 items-stretch max-w-[240px]">
                                                    <div className="flex flex-col justify-between items-center border-r border-blue-600 pr-1.5 font-mono text-[7px] shrink-0 text-blue-800">
                                                        <div className="rotate-[-90deg] origin-center translate-y-2.5 font-bold text-[6px]">DATA:</div>
                                                        <div className="font-black">/</div>
                                                    </div>
                                                    <div className="flex-1 text-left">
                                                        <div className="font-black text-[8px] tracking-wider text-center">ATESTO RECEBIMENTO</div>
                                                        <div className="space-y-1 font-mono text-[6px] text-blue-800 normal-case leading-normal font-bold">
                                                            <div>NOME: __________________________</div>
                                                            <div>FUNÇÃO: 2º CONSELHEIRO</div>
                                                            <div>ASSINATURA: __________________</div>
                                                            <div>MATRÍCULA: ___________________</div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Stamp 4: Atestado Quitação */}
                                                <div className="border-2 border-blue-600/80 text-blue-600 text-[8px] font-sans p-2 rounded-sm uppercase tracking-wide bg-white/70 text-center select-none transform -rotate-[1.5deg] max-w-[150px] justify-self-center">
                                                    <div className="font-black text-[8px] tracking-wide">ATESTADO QUITAÇÃO</div>
                                                    <div className="space-y-0.5 font-mono font-bold text-left text-blue-800 leading-normal text-[6px] mt-1">
                                                        <div>DATA: ____ / ____ / ________</div>
                                                        <div>NOME: ________________________</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* CASE 2: SERVICE INVOICE (NFS-e) */}
                                    {caseStudyType === 'servico' && (
                                        <div className="space-y-6 flex-1 flex flex-col justify-between h-full text-slate-800 text-[10px]">
                                            {/* NFS-e Header */}
                                            <div className="border border-slate-400 p-2 uppercase font-mono relative">
                                                <div className="grid grid-cols-12 border-b border-slate-400 pb-2 items-center">
                                                    <div className="col-span-3 text-center border-r border-slate-400 pr-2">
                                                        <span className="font-black text-[12px] block text-sky-700">NFSe</span>
                                                        <span className="text-[6px] text-slate-500 font-sans normal-case block leading-none">Nota Fiscal de Serviço Eletrônica</span>
                                                    </div>
                                                    <div className="col-span-6 text-center border-r border-slate-400 px-2 flex flex-col justify-center items-center">
                                                        <div className="font-black text-[9px]">DANFSe v1.0</div>
                                                        <div className="text-[7px] leading-tight text-center normal-case text-slate-500">Documento Auxiliar da NFS-e</div>
                                                    </div>
                                                    <div className="col-span-3 pl-2 text-center text-[7px] flex flex-col items-center">
                                                        <span className="font-bold text-[8px]">Prefeitura Municipal de União dos Palmares</span>
                                                    </div>
                                                </div>
                                                
                                                <div className="grid grid-cols-3 gap-2 text-[7px] pt-2 border-b border-slate-200 pb-2">
                                                    <div>
                                                        <span className="font-bold block text-slate-500">Número da NFS-e</span>
                                                        <span className="font-black text-slate-900">28</span>
                                                    </div>
                                                    <div>
                                                        <span className="font-bold block text-slate-500">Competência da NFS-e</span>
                                                        <span className="font-black text-slate-900">12/05/2026</span>
                                                    </div>
                                                    <div>
                                                        <span className="font-bold block text-slate-500">Data e Hora da Emissão</span>
                                                        <span className="font-black text-slate-900">12/05/2026 09:40:07</span>
                                                    </div>
                                                </div>

                                                {/* Emitente */}
                                                <div className="border-b border-slate-200 py-1.5 grid grid-cols-12 gap-1 text-[7px] text-left">
                                                    <div className="col-span-12 font-bold text-slate-500 text-[6px]">EMITENTE DA NFS-e (Prestador)</div>
                                                    <div className="col-span-7">
                                                        <span className="font-bold text-slate-500">NOME:</span> <span className="font-black">60.098.447 THADEU CALADO ARAUJO</span>
                                                    </div>
                                                    <div className="col-span-5 text-right">
                                                        <span className="font-bold text-slate-500">CNPJ:</span> <span className="font-black">60.098.447/0001-77</span>
                                                    </div>
                                                    <div className="col-span-12">
                                                        <span className="font-bold text-slate-500">ENDEREÇO:</span> <span>10A RUA DR. DUERNO WANDERLEY DE MELO, 21, CENTRO - UNIÃO DOS PALMARES/AL</span>
                                                    </div>
                                                </div>

                                                {/* Tomador */}
                                                <div className="py-1.5 grid grid-cols-12 gap-1 text-[7px] text-left">
                                                    <div className="col-span-12 font-bold text-slate-500 text-[6px]">TOMADOR DO SERVIÇO (Cliente)</div>
                                                    <div className="col-span-7">
                                                        <span className="font-bold text-slate-500">NOME:</span> <span className="font-black">CONSELHO ESTADUAL MANOEL DE MATOS</span>
                                                    </div>
                                                    <div className="col-span-5 text-right">
                                                        <span className="font-bold text-slate-500">CNPJ:</span> <span className="font-black">00.773.791/0001-92</span>
                                                    </div>
                                                    <div className="col-span-12">
                                                        <span className="font-bold text-slate-500">ENDEREÇO:</span> <span>SANTANA DO MUNDAU, QUADRA 33, S/N, JUSSARA - SANTANA DO MUNDAU/AL</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Serviço Prestado */}
                                            <div className="border border-slate-400 p-2 text-[8px] uppercase font-mono space-y-1 text-left">
                                                <div className="font-bold text-slate-500 text-[6px] border-b border-slate-200 pb-0.5">SERVIÇO PRESTADO</div>
                                                <div>
                                                    <span className="font-bold text-slate-500">DESCRIÇÃO DO SERVIÇO:</span>
                                                    <p className="font-black text-slate-900 text-[9px] mt-1 normal-case leading-relaxed">
                                                        Instalação de sistema de gás de alta pressão, conforme especificações técnicas e normas de segurança vigentes: Instalação de linha de tubulação em cobre, Conexão de reguladores de pressão de dois estágios, Instalação de válvulas de bloqueio e alívio de pressão, Teste de estanqueidade com gás inerte ou ar comprimido (pressurização e verificação com detetor de vazamentos).
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Valores e Impostos */}
                                            <div className="border border-slate-400 p-2 text-[8px] uppercase font-mono grid grid-cols-4 gap-2 text-left">
                                                <div>
                                                    <span className="font-bold text-slate-500 block text-[6px]">VALOR DO SERVIÇO</span>
                                                    <span className="font-black text-[10px] text-slate-900">R$ 1.090,00</span>
                                                </div>
                                                <div>
                                                    <span className="font-bold text-slate-500 block text-[6px]">DESCONTOS</span>
                                                    <span className="font-black text-slate-900">R$ 0,00</span>
                                                </div>
                                                <div>
                                                    <span className="font-bold text-slate-500 block text-[6px]">RETENÇÕES FEDERAIS</span>
                                                    <span className="font-black text-slate-900">R$ 0,00</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="font-bold text-slate-500 block text-[6px]">VALOR LÍQUIDO</span>
                                                    <span className="font-black text-[10px] text-emerald-700">R$ 1.090,00</span>
                                                </div>
                                            </div>

                                            {/* bottom area with stamps */}
                                            <div className="border border-slate-400 p-4 min-h-[220px] grid grid-cols-2 gap-4 items-center bg-slate-50 relative">
                                                <div className="absolute top-2 left-3 text-[7px] text-slate-400 font-mono">DADOS ADICIONAIS / INFORMAÇÕES COMPLEMENTARES</div>
                                                
                                                {/* Stamp 1: Atesto Recebimento (1º Conselheiro) */}
                                                <div className="border-2 border-blue-600/80 text-blue-600 font-sans p-1.5 rounded-sm uppercase tracking-wide bg-white/70 select-none transform -rotate-[1deg] flex gap-1.5 items-stretch max-w-[240px]">
                                                    <div className="flex flex-col justify-between items-center border-r border-blue-600 pr-1.5 font-mono text-[7px] shrink-0 text-blue-800">
                                                        <div className="rotate-[-90deg] origin-center translate-y-2.5 font-bold text-[6px]">DATA:</div>
                                                        <div className="font-black">/</div>
                                                    </div>
                                                    <div className="flex-1 text-left">
                                                        <div className="font-black text-[8px] tracking-wider text-center">ATESTO RECEBIMENTO</div>
                                                        <div className="space-y-0.5 font-mono text-[6px] text-blue-800 normal-case leading-normal font-bold">
                                                            <div>NOME: __________________________</div>
                                                            <div>FUNÇÃO: 1º CONSELHEIRO</div>
                                                            <div>ASSINATURA: __________________</div>
                                                            <div>MATRÍCULA: ___________________</div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Stamp 2: Pago com Recurso ESCOLA DA HORA/AL */}
                                                <div className="border-2 border-red-600/80 text-red-600 text-[8px] font-sans font-bold p-2.5 rounded-sm tracking-wider uppercase bg-white/70 select-none transform rotate-[2deg] text-center w-40 justify-self-center">
                                                    <div>PAGO COM RECURSO</div>
                                                    <div className="border-t border-red-600 mt-1 pt-0.5 font-black text-[9px]">ESCOLA DA HORA/AL</div>
                                                </div>

                                                {/* Stamp 3: Atesto Recebimento (2º Conselheiro) */}
                                                <div className="border-2 border-blue-600/80 text-blue-600 font-sans p-1.5 rounded-sm uppercase tracking-wide bg-white/70 select-none transform rotate-[1deg] flex gap-1.5 items-stretch max-w-[240px]">
                                                    <div className="flex flex-col justify-between items-center border-r border-blue-600 pr-1.5 font-mono text-[7px] shrink-0 text-blue-800">
                                                        <div className="rotate-[-90deg] origin-center translate-y-2.5 font-bold text-[6px]">DATA:</div>
                                                        <div className="font-black">/</div>
                                                    </div>
                                                    <div className="flex-1 text-left">
                                                        <div className="font-black text-[8px] tracking-wider text-center">ATESTO RECEBIMENTO</div>
                                                        <div className="space-y-0.5 font-mono text-[6px] text-blue-800 normal-case leading-normal font-bold">
                                                            <div>NOME: __________________________</div>
                                                            <div>FUNÇÃO: 2º CONSELHEIRO</div>
                                                            <div>ASSINATURA: __________________</div>
                                                            <div>MATRÍCULA: ___________________</div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Stamp 4: Atestado Quitação */}
                                                <div className="border-2 border-blue-600/80 text-blue-600 text-[7px] font-sans p-1.5 rounded-sm uppercase tracking-wide bg-white/70 text-center select-none transform -rotate-[1.5deg] max-w-[145px] justify-self-center">
                                                    <div className="font-black text-[8px] tracking-wide">ATESTADO QUITAÇÃO</div>
                                                    <div className="space-y-0.5 font-mono font-bold text-left text-blue-800 leading-normal text-[6px] mt-1">
                                                        <div>DATA: ____ / ____ / ________</div>
                                                        <div>NOME: ________________________</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* CASE 3: PIX PAYMENT RECEIPT */}
                                    {caseStudyType === 'pix' && (
                                        <div className="flex flex-col md:flex-row gap-6 items-stretch flex-1 h-full text-slate-800 text-[10px] font-sans">
                                            {/* PIX receipt columns */}
                                            <div className="flex-1 bg-white border border-slate-200 rounded-xl p-4 max-w-[320px] shadow-sm text-left">
                                                {/* Caixa header */}
                                                <div className="bg-[#0264a7] text-white p-3 rounded-t-lg -mx-4 -mt-4 font-bold text-xs flex justify-between items-center">
                                                    <span>Comprovante de Pix enviado</span>
                                                    <span className="text-[14px] font-black tracking-widest text-[#f59e0b]">CAIXA</span>
                                                </div>
                                                
                                                <div className="text-center py-4 border-b border-slate-100">
                                                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Valor</span>
                                                    <div className="text-xl font-black text-slate-900 my-0.5">R$ 1.090,00</div>
                                                    <span className="text-[8px] font-bold text-slate-500">14/05/2026 18:39:04</span>
                                                    <div className="mt-2.5 inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[9px] font-bold px-2 py-0.5 rounded-full">
                                                        <span className="material-symbols-outlined text-[12px] font-black">check_circle</span>
                                                        Pix realizado com sucesso!
                                                    </div>
                                                </div>

                                                <div className="py-3 space-y-3 border-b border-slate-100 text-[9px]">
                                                    <div>
                                                        <span className="font-bold text-slate-400 block uppercase text-[7px] tracking-wider">Dados do Recebedor</span>
                                                        <span className="font-black text-slate-800 block text-[9.5px]">THADEU CALADO ARAUJO</span>
                                                        <span className="text-slate-500 block">CNPJ: 60.098.447/0001-77</span>
                                                        <span className="text-slate-500 block">Instituição: BCO SANTANDER (BRASIL) S.A.</span>
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-slate-400 block uppercase text-[7px] tracking-wider">Dados do Pagador</span>
                                                        <span className="font-black text-slate-800 block text-[9.5px]">CONSELHO ESC EST MANOEL DE MATOS</span>
                                                        <span className="text-slate-500 block">CNPJ: 00.773.791/0001-92</span>
                                                        <span className="text-slate-500 block">Instituição: CAIXA ECONÔMICA FEDERAL</span>
                                                    </div>
                                                </div>

                                                <div className="py-3 space-y-2 text-[8px] text-slate-500">
                                                    <span className="font-bold text-slate-400 block uppercase text-[7px] tracking-wider">Dados da Transação</span>
                                                    <div>
                                                        <span className="font-bold block">ID TRANSAÇÃO:</span>
                                                        <span className="font-mono block truncate break-all text-[7.5px] text-slate-700">E003603052026051421195f73aac7ff2</span>
                                                    </div>
                                                    <div>
                                                        <span className="font-bold block">CÓDIGO OPERAÇÃO:</span>
                                                        <span className="font-mono font-bold text-slate-700 text-[7.5px]">64751381387</span>
                                                    </div>
                                                    <div>
                                                        <span className="font-bold block">CHAVE PIX:</span>
                                                        <span className="font-mono text-[7.5px]">60098447000177</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right Area for Stamps placement */}
                                            <div className="w-full md:w-56 flex flex-col justify-around items-center bg-slate-100/40 p-4 border border-slate-200 rounded-xl relative min-h-[300px]">
                                                <div className="absolute top-2 left-3 text-[7px] text-slate-400 font-mono">DADOS ADICIONAIS / ÁREA DE VALIDAÇÃO</div>
                                                
                                                {/* Stamp 1: Confere com o Original */}
                                                <div className="border-2 border-slate-700 text-slate-800 font-sans p-3 rounded-sm uppercase tracking-wide bg-white/90 select-none transform -rotate-[2deg] flex flex-col max-w-[200px] shadow-sm">
                                                    <div className="text-center font-black text-[9px] tracking-wider border-b border-slate-700 pb-1 mb-2">CONFERE COM O ORIGINAL</div>
                                                    <div className="space-y-1 font-mono text-[7px] text-left text-slate-700 leading-normal font-bold">
                                                        <div>DATA: 14/05/2026</div>
                                                        <div>NOME: ______________________</div>
                                                        <div>ASSINATURA: ______________</div>
                                                        <div>MATRÍCULA: _______________</div>
                                                    </div>
                                                </div>

                                                {/* Stamp 2: Pago com Recurso ESCOLA DA HORA/AL */}
                                                <div className="border-2 border-red-600/80 text-red-600 text-[8px] font-sans font-bold p-2.5 rounded-sm tracking-wider uppercase bg-white/80 select-none transform rotate-[2deg] text-center w-40 shadow-sm">
                                                    <div>PAGO COM RECURSO</div>
                                                    <div className="border-t border-red-600 mt-1 pt-0.5 font-black text-[9px]">ESCOLA DA HORA/AL</div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {caseStudyType === 'certidao' && (
                                        <div className="flex flex-col gap-6 items-stretch flex-1 h-full text-slate-800 text-[10px] font-sans">
                                            {/* Simulated Certificate Sheet */}
                                            <div className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 shadow-sm text-left relative overflow-hidden flex-1 flex flex-col justify-between min-h-[500px]">
                                                
                                                {/* 1. MUNICIPAL CERTIFICATE */}
                                                {selectedCertType === 'municipal' && (
                                                    <div className="space-y-4 flex-1 flex flex-col justify-between">
                                                        {/* Header */}
                                                        <div className="flex justify-between items-start border-b border-slate-200 pb-3">
                                                            <div className="flex gap-3 items-center">
                                                                <div className="text-left">
                                                                    <div className="text-orange-600 font-extrabold text-[9px] uppercase tracking-wider">Secretaria de Finanças</div>
                                                                    <div className="text-slate-800 font-black text-[12px] uppercase leading-none">União dos Palmares</div>
                                                                    <div className="text-slate-500 font-bold text-[7px] uppercase mt-0.5">Tocando pra Frente</div>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-[12px] font-black text-slate-850 uppercase tracking-wide font-sans">CERTIDÃO NEGATIVA</div>
                                                                <div className="text-[7px] text-slate-500 font-bold uppercase font-sans">de Débitos para com a Fazenda Municipal</div>
                                                            </div>
                                                        </div>

                                                        {/* Contribuinte Box */}
                                                        <div className="border border-slate-300 p-2.5 rounded space-y-1.5 uppercase font-mono text-[7px]">
                                                            <div className="font-bold text-slate-405 text-[6px] border-b border-slate-200 pb-0.5">CONTRIBUINTE</div>
                                                            <div className="grid grid-cols-12 gap-1.5">
                                                                <div className="col-span-5">
                                                                    <span className="text-slate-400 font-bold">CPF/CNPJ:</span> <span className="font-black text-slate-800">24.327.850/0001-67</span>
                                                                </div>
                                                                <div className="col-span-4">
                                                                    <span className="text-slate-400 font-bold">Optante Simples:</span> <span className="font-black text-slate-800">SIM</span>
                                                                </div>
                                                                <div className="col-span-3">
                                                                    <span className="text-slate-400 font-bold">Inscrição:</span> <span className="font-black text-slate-800">175/1995</span>
                                                                </div>
                                                                <div className="col-span-12">
                                                                    <span className="text-slate-400 font-bold">Razão Social:</span> <span className="font-black text-[8px] text-slate-900">SUPERMERCADO ECONOMICO UNIAO LTDA</span>
                                                                </div>
                                                                <div className="col-span-12">
                                                                    <span className="text-slate-400 font-bold">Fantasia:</span> <span className="font-bold text-slate-800">SUPERMERCADO ECONOMICO</span>
                                                                </div>
                                                                <div className="col-span-12">
                                                                    <span className="text-slate-400 font-bold">Endereço:</span> <span className="text-slate-700">PRAÇA ANTENOR DE MENDONÇA UCHOA Nº 74 - CENTRO. ANEXO GALPÃO 40</span>
                                                                </div>
                                                                <div className="col-span-12">
                                                                    <span className="text-slate-400 font-bold">Cidade:</span> <span className="text-slate-700">UNIÃO DOS PALMARES - AL | CEP: 57.800-000</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Text */}
                                                        <div className="text-[8.5px] leading-relaxed text-slate-750 text-justify px-2 my-2 font-serif font-bold">
                                                            Certificamos, com fundamento nas informações constantes em nosso sistema de cadastro e controle de arrecadação, e ressalvado o direito de a Fazenda Municipal inscrever e cobrar as dívidas que venham a ser apuradas, que em relação ao CONTRIBUINTE acima identificado, INEXISTE DÉBITO impeditivo a expedição desta certidão.
                                                        </div>

                                                        {/* Footer layout with QR Code & stamp */}
                                                        <div className="border-t border-slate-200 pt-3 mt-3 flex justify-between items-center relative">
                                                            <div className="flex gap-3 items-center">
                                                                <div className="border border-slate-400 p-1 w-12 h-12 flex items-center justify-center bg-slate-50 font-mono text-[7px] text-center font-bold">
                                                                    QR CODE<br/>3B87E8
                                                                </div>
                                                                <div className="text-[6.5px] text-slate-500 font-mono normal-case leading-snug">
                                                                    Código: <strong className="text-slate-700 font-black">3B87E8</strong><br/>
                                                                    Emissão: 06/05/2026<br/>
                                                                    Validade: <strong className="text-slate-850 font-black">05/07/2026</strong>
                                                                </div>
                                                            </div>

                                                            {/* Gestora Stamp applied directly on the certificate */}
                                                            <div className="transform rotate-[-3deg] shadow-md origin-bottom-right z-10 scale-90">
                                                                <div className="border-2 border-slate-700 text-slate-800 p-2.5 rounded-sm uppercase tracking-wide bg-white/95 max-w-[170px] text-center font-sans">
                                                                    <div className="font-extrabold text-[7px] text-slate-500 mb-0.5">AUTENTICADO</div>
                                                                    <div className="font-black text-[9px] text-slate-805 leading-tight border-b border-slate-200 pb-1 mb-1">
                                                                        Gestora de Unidade de Ensino
                                                                    </div>
                                                                    <div className="space-y-1 font-mono text-[7px] text-slate-650 font-bold leading-none text-left">
                                                                        <div>Matrícula nº: <strong className="text-slate-800">48572-1</strong></div>
                                                                        <div>PORTARIA Nº: <strong className="text-slate-800">125/2026</strong></div>
                                                                        <div className="border-t border-dashed border-slate-300 pt-1 mt-1 text-center font-serif italic text-[8px] text-slate-500 capitalize leading-none">
                                                                            Maria da Silva
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* 2. STATE CERTIFICATE */}
                                                {selectedCertType === 'estadual' && (
                                                    <div className="space-y-4 flex-1 flex flex-col justify-between">
                                                        {/* Header */}
                                                        <div className="flex justify-between items-start border-b border-slate-200 pb-3">
                                                            <div className="text-left flex items-center gap-2">
                                                                <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-300 flex items-center justify-center text-emerald-600 shrink-0 font-bold text-xs">
                                                                    AL
                                                                </div>
                                                                <div>
                                                                    <div className="text-slate-700 font-bold text-[8px] uppercase">Estado de Alagoas</div>
                                                                    <div className="text-slate-900 font-black text-[10px] uppercase leading-none">Secretaria de Estado da Fazenda</div>
                                                                    <div className="text-slate-500 font-bold text-[7px] uppercase mt-0.5">Superintendência da Receita Estadual</div>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-[11px] font-black text-slate-800 uppercase tracking-wide font-sans">CERTIDÃO NEGATIVA DE DÉBITOS</div>
                                                                <div className="text-[7px] text-slate-500 font-bold uppercase font-sans">de Tributos Estaduais</div>
                                                            </div>
                                                        </div>

                                                        {/* Content Body */}
                                                        <div className="space-y-3 text-[7.5px] uppercase font-mono text-left leading-normal text-slate-705">
                                                            <div>
                                                                <span className="font-bold text-slate-400 block text-[6px]">CONTRIBUINTE:</span>
                                                                <span className="font-black text-slate-900 text-[8.5px]">SUPERMERCADO ECONOMICO UNIAO LTDA</span>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div>
                                                                    <span className="font-bold text-slate-400 block text-[6px]">CNPJ / CPF:</span>
                                                                    <span className="font-black text-slate-805">24.327.850/0001-67</span>
                                                                </div>
                                                                <div>
                                                                    <span className="font-bold text-slate-400 block text-[6px]">CÓDIGO DE CONTROLE:</span>
                                                                    <span className="font-black text-slate-805">4B02-39D3-C78A-4C02</span>
                                                                </div>
                                                            </div>

                                                            {/* Text */}
                                                            <div className="border-t border-b border-slate-100 py-2 my-2 text-[8px] normal-case text-slate-700 text-justify leading-relaxed font-serif font-bold">
                                                                Ressalvado o direito da Fazenda Pública Estadual cobrar débitos ainda não registrados ou que venham a ser apurados, certificamos que, verifying os registros da Secretaria de Estado da Fazenda, constatamos não existir, até a presente data, pendências em nome do contribuinte acima identificado.
                                                            </div>

                                                            <div className="text-[6.5px] text-slate-500 normal-case leading-snug space-y-1">
                                                                <p>• Obs.: Esta Certidão engloba todos os estabelecimentos do contribuinte e refere-se a débitos de natureza tributária e descumprimento de obrigações acessórias.</p>
                                                                <p>• Certidão emitida nos termos do art. 78 da Lei nº 6.771/06 e do art. 255 do Decreto nº 25.370/13.</p>
                                                            </div>
                                                        </div>

                                                        {/* Footer & Stamp */}
                                                        <div className="border-t border-slate-200 pt-3 mt-3 flex justify-between items-center">
                                                            <div className="text-[6.5px] text-slate-500 font-mono normal-case leading-snug text-left">
                                                                Emitida em: 29/05/2026 às 18:41:35<br/>
                                                                Válida até: <strong className="text-slate-850 font-black">28/07/2026</strong><br/>
                                                                Endereço: www.sefaz.al.gov.br
                                                            </div>

                                                            {/* Gestora Stamp applied directly on the certificate */}
                                                            <div className="transform rotate-[2deg] shadow-md origin-bottom-right z-10 scale-90">
                                                                <div className="border-2 border-slate-700 text-slate-800 p-2.5 rounded-sm uppercase tracking-wide bg-white/95 max-w-[170px] text-center font-sans">
                                                                    <div className="font-extrabold text-[7px] text-slate-500 mb-0.5">AUTENTICADO</div>
                                                                    <div className="font-black text-[9px] text-slate-805 leading-tight border-b border-slate-200 pb-1 mb-1">
                                                                        Gestora de Unidade de Ensino
                                                                    </div>
                                                                    <div className="space-y-1 font-mono text-[7px] text-slate-650 font-bold leading-none text-left">
                                                                        <div>Matrícula nº: <strong className="text-slate-800">48572-1</strong></div>
                                                                        <div>PORTARIA Nº: <strong className="text-slate-800">125/2026</strong></div>
                                                                        <div className="border-t border-dashed border-slate-300 pt-1 mt-1 text-center font-serif italic text-[8px] text-slate-500 capitalize leading-none">
                                                                            Maria da Silva
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* 3. FEDERAL CERTIFICATE */}
                                                {selectedCertType === 'federal' && (
                                                    <div className="space-y-3 flex-1 flex flex-col justify-between">
                                                        {/* Header */}
                                                        <div className="flex justify-between items-start border-b border-slate-200 pb-3">
                                                            <div className="text-left flex items-center gap-2">
                                                                <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-300 flex items-center justify-center text-slate-600 shrink-0 font-bold text-xs">
                                                                    BR
                                                                </div>
                                                                <div>
                                                                    <div className="text-slate-700 font-bold text-[8px] uppercase">Ministério da Fazenda</div>
                                                                    <div className="text-slate-955 font-black text-[9px] uppercase leading-none">Receita Federal do Brasil</div>
                                                                    <div className="text-slate-500 font-bold text-[7px] uppercase mt-0.5">Procuradoria-Geral da Fazenda Nacional</div>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-[10px] font-black text-slate-900 uppercase tracking-wide text-right max-w-[220px] leading-tight font-sans">CERTIDÃO POSITIVA COM EFEITOS DE NEGATIVA</div>
                                                                <div className="text-[6px] text-slate-500 font-bold uppercase mt-0.5 font-sans">Relativa aos Tributos Federais e à Dívida Ativa da União</div>
                                                            </div>
                                                        </div>

                                                        {/* Content Body */}
                                                        <div className="space-y-2 text-[7.5px] uppercase font-mono text-left leading-normal text-slate-705">
                                                            <div className="grid grid-cols-12 gap-2">
                                                                <div className="col-span-8">
                                                                    <span className="font-bold text-slate-400 block text-[6px]">NOME COMPLETO DO SUJEITO PASSIVO:</span>
                                                                    <span className="font-black text-slate-900 text-[8px]">SUPERMERCADO ECONOMICO UNIAO LTDA</span>
                                                                </div>
                                                                <div className="col-span-4">
                                                                    <span className="font-bold text-slate-400 block text-[6px]">CNPJ / CPF:</span>
                                                                    <span className="font-black text-slate-805">24.327.850/0001-67</span>
                                                                </div>
                                                            </div>

                                                            {/* Text */}
                                                            <div className="text-[7.5px] normal-case text-slate-650 text-justify leading-relaxed font-serif my-1 font-bold">
                                                                Ressalvado o direito de a Fazenda Nacional cobrar e inscrever quaisquer dívidas de responsabilidade do sujeito passivo acima identificado que vierem a ser apuradas, é certificado que:<br/>
                                                                1. constam débitos administrados pela Secretaria da Receita Federal do Brasil (RFB) com exigibilidade suspensa nos termos do art. 151 da Lei nº 5.172, de 25 de outubro de 1966 - Código Tributário Nacional (CTN), ou objeto de decisão judicial que determina sua desconsideração para fins de certificação da regularidade fiscal, ou ainda não vencidos; e<br/>
                                                                2. não constam inscrições em Dívida Ativa da União (DAU) na Procuradoria-Geral da Fazenda Nacional (PGFN).<br/>
                                                                <strong className="text-slate-855 font-black">Conforme disposto nos arts. 205 e 206 do CTN, este documento tem os mesmos efeitos da certidão negativa.</strong>
                                                            </div>
                                                        </div>

                                                        {/* Footer & Stamp */}
                                                        <div className="border-t border-slate-200 pt-3 mt-2 flex justify-between items-center">
                                                            <div className="text-[6.5px] text-slate-500 font-mono normal-case leading-snug text-left space-y-0.5">
                                                                <div>Emitida em: 03/05/2026 às 04:21:23</div>
                                                                <div>Válida até: <strong className="text-slate-855 font-black">30/10/2026</strong></div>
                                                                <div>Código: <strong className="text-slate-750 font-black">76FA.A52B.1E04.2A60</strong></div>
                                                            </div>

                                                            {/* Gestora Stamp applied directly on the certificate */}
                                                            <div className="transform rotate-[-1deg] shadow-md origin-bottom-right z-10 scale-90">
                                                                <div className="border-2 border-slate-700 text-slate-800 p-2.5 rounded-sm uppercase tracking-wide bg-white/95 max-w-[170px] text-center font-sans">
                                                                    <div className="font-extrabold text-[7px] text-slate-500 mb-0.5">AUTENTICADO</div>
                                                                    <div className="font-black text-[9px] text-slate-805 leading-tight border-b border-slate-200 pb-1 mb-1">
                                                                        Gestora de Unidade de Ensino
                                                                    </div>
                                                                    <div className="space-y-1 font-mono text-[7px] text-slate-650 font-bold leading-none text-left">
                                                                        <div>Matrícula nº: <strong className="text-slate-800">48572-1</strong></div>
                                                                        <div>PORTARIA Nº: <strong className="text-slate-800">125/2026</strong></div>
                                                                        <div className="border-t border-dashed border-slate-300 pt-1 mt-1 text-center font-serif italic text-[8px] text-slate-500 capitalize leading-none">
                                                                            Maria da Silva
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* 4. FGTS CERTIFICATE */}
                                                {selectedCertType === 'fgts' && (
                                                    <div className="space-y-4 flex-1 flex flex-col justify-between">
                                                        {/* Header */}
                                                        <div className="flex justify-between items-center border-b border-slate-250 pb-3">
                                                            <div className="font-black text-[18px] text-[#00609f] tracking-widest flex items-center gap-1">
                                                                CAIXA
                                                                <span className="text-[7px] text-slate-500 tracking-normal normal-case font-bold block leading-none ml-2">CAIXA ECONÔMICA FEDERAL</span>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-[12px] font-black text-slate-800 uppercase tracking-wide leading-tight font-sans">Certificado de Regularidade do FGTS - CRF</div>
                                                            </div>
                                                        </div>

                                                        {/* Fields Table */}
                                                        <div className="border border-slate-305 text-[8px] font-mono uppercase text-left leading-relaxed">
                                                            <div className="grid grid-cols-12 border-b border-slate-200 p-2 bg-slate-50">
                                                                <div className="col-span-4 font-bold text-slate-500">INSCRIÇÃO:</div>
                                                                <div className="col-span-8 font-black text-slate-900">24.327.850/0001-67</div>
                                                            </div>
                                                            <div className="grid grid-cols-12 border-b border-slate-200 p-2">
                                                                <div className="col-span-4 font-bold text-slate-500">RAZÃO SOCIAL:</div>
                                                                <div className="col-span-8 font-black text-slate-900">SUPERMERCADO ECONOMICO UNIAO LTDA</div>
                                                            </div>
                                                            <div className="grid grid-cols-12 p-2">
                                                                <div className="col-span-4 font-bold text-slate-500">ENDEREÇO:</div>
                                                                <div className="col-span-8 text-[7.5px] leading-snug">PAR INFANTIL ANTENOR UCHOA 74 ANEXO GALPAO 40 / CENTRO / UNIAO DOS PALMARES / AL / 57800-000</div>
                                                            </div>
                                                        </div>

                                                        {/* Text Body */}
                                                        <div className="text-[8px] leading-relaxed text-slate-705 text-justify px-2 font-serif font-bold">
                                                            A Caixa Econômica Federal, no uso da atribuição que lhe confere o Art. 7, da Lei 8.036, de 11 de maio de 1990, certifica que, nesta data, a empresa acima identificada encontra-se em situação regular perante o Fundo de Garantia do Tempo de Servico - FGTS.<br/>
                                                            O presente Certificado não servirá de prova contra cobrança de quaisquer débitos referentes a contribuições e/ou encargos devidos, decorrentes das obrigações com o FGTS.
                                                        </div>

                                                        {/* Footer & Stamp */}
                                                        <div className="border-t border-slate-200 pt-3 mt-3 flex justify-between items-center">
                                                            <div className="text-[6.5px] text-slate-500 font-mono normal-case text-left leading-snug">
                                                                Validade: <strong className="text-slate-855 font-black">24/05/2026 a 22/06/2026</strong><br/>
                                                                Certificação nº: <strong className="text-slate-750 font-black">2026052400380269072170</strong><br/>
                                                                Obtido em: 29/05/2026 18:45:02
                                                            </div>

                                                            {/* Gestora Stamp applied directly on the certificate */}
                                                            <div className="transform rotate-[1.5deg] shadow-md origin-bottom-right z-10 scale-90">
                                                                <div className="border-2 border-slate-700 text-slate-800 p-2.5 rounded-sm uppercase tracking-wide bg-white/95 max-w-[170px] text-center font-sans">
                                                                    <div className="font-extrabold text-[7px] text-slate-500 mb-0.5">AUTENTICADO</div>
                                                                    <div className="font-black text-[9px] text-slate-805 leading-tight border-b border-slate-200 pb-1 mb-1">
                                                                        Gestora de Unidade de Ensino
                                                                    </div>
                                                                    <div className="space-y-1 font-mono text-[7px] text-slate-655 font-bold leading-none text-left">
                                                                        <div>Matrícula nº: <strong className="text-slate-800">48572-1</strong></div>
                                                                        <div>PORTARIA Nº: <strong className="text-slate-800">125/2026</strong></div>
                                                                        <div className="border-t border-dashed border-slate-300 pt-1 mt-1 text-center font-serif italic text-[8px] text-slate-500 capitalize leading-none">
                                                                            Maria da Silva
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* 5. CNDT CERTIFICATE */}
                                                {selectedCertType === 'cndt' && (
                                                    <div className="space-y-4 flex-1 flex flex-col justify-between">
                                                        {/* Header */}
                                                        <div className="flex justify-between items-start border-b border-slate-200 pb-3">
                                                            <div className="text-left flex items-center gap-2">
                                                                <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-300 flex items-center justify-center text-slate-650 shrink-0 font-bold text-[14px]">
                                                                    ⚖️
                                                                </div>
                                                                <div>
                                                                    <div className="text-slate-700 font-bold text-[8px] uppercase">Poder Judiciário</div>
                                                                    <div className="text-slate-900 font-black text-[11px] uppercase leading-none">Justiça do Trabalho</div>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-[11px] font-black text-slate-900 uppercase tracking-wide leading-tight font-sans">CERTIDÃO NEGATIVA DE DÉBITOS TRABALHISTAS</div>
                                                                <div className="text-[6px] text-slate-500 font-bold uppercase mt-0.5 font-sans">Emitida nos termos do art. 642-A da CLT</div>
                                                            </div>
                                                        </div>

                                                        {/* Contribuinte Box */}
                                                        <div className="grid grid-cols-12 gap-2 text-[7.5px] uppercase font-mono text-left bg-slate-50 p-2.5 rounded border border-slate-200">
                                                            <div className="col-span-8">
                                                                <span className="font-bold text-slate-400 block text-[6px]">NOME COMPLETO:</span>
                                                                <span className="font-black text-slate-900 text-[8.5px]">SUPERMERCADO ECONOMICO UNIAO LTDA (MATRIZ E FILIAIS)</span>
                                                            </div>
                                                            <div className="col-span-4">
                                                                <span className="font-bold text-slate-400 block text-[6px]">CNPJ / CPF:</span>
                                                                <span className="font-black text-slate-805">24.327.850/0001-67</span>
                                                            </div>
                                                        </div>

                                                        {/* Text Body */}
                                                        <div className="text-[8px] leading-relaxed text-slate-700 text-justify px-2 font-serif font-bold">
                                                            Certifica-se que <strong className="text-slate-800">SUPERMERCADO ECONOMICO UNIAO LTDA (MATRIZ E FILIAIS)</strong>, inscrito(a) no CNPJ sob o nº 24.327.850/0001-67, <strong className="text-emerald-700 font-black uppercase">NÃO CONSTA</strong> como inadimplente no Banco Nacional de Devedores Trabalhistas.<br/>
                                                            Certidão emitida com base nos arts. 642-A e 883-A da Consolidação das Leis do Trabalho (CLT), acrescidos pelas Leis ns. 12.440/2011 e 13.467/2017. Os dados constantes desta Certidão são de responsabilidade dos Tribunais do Trabalho.<br/>
                                                            A aceitação desta certidão está condicionada à verificação de sua autenticidade no portal do Tribunal Superior do Trabalho na Internet (http://www.tst.jus.br).
                                                        </div>

                                                        {/* Footer & Stamp */}
                                                        <div className="border-t border-slate-200 pt-3 mt-3 flex justify-between items-center">
                                                            <div className="text-[6.5px] text-slate-500 font-mono normal-case text-left leading-snug space-y-0.5">
                                                                <div>Certidão nº: <strong className="text-slate-800 font-black">51319797/2026</strong></div>
                                                                <div>Expedição: 29/05/2026, às 18:46:58</div>
                                                                <div>Validade até: <strong className="text-slate-855 font-black">25/11/2026</strong> (180 dias)</div>
                                                            </div>

                                                            {/* Gestora Stamp applied directly on the certificate */}
                                                            <div className="transform rotate-[-2deg] shadow-md origin-bottom-right z-10 scale-90">
                                                                <div className="border-2 border-slate-700 text-slate-800 p-2.5 rounded-sm uppercase tracking-wide bg-white/95 max-w-[170px] text-center font-sans">
                                                                    <div className="font-extrabold text-[7px] text-slate-500 mb-0.5">AUTENTICADO</div>
                                                                    <div className="font-black text-[9px] text-slate-805 leading-tight border-b border-slate-200 pb-1 mb-1">
                                                                        Gestora de Unidade de Ensino
                                                                    </div>
                                                                    <div className="space-y-1 font-mono text-[7px] text-slate-650 font-bold leading-none text-left">
                                                                        <div>Matrícula nº: <strong className="text-slate-800">48572-1</strong></div>
                                                                        <div>PORTARIA Nº: <strong className="text-slate-800">125/2026</strong></div>
                                                                        <div className="border-t border-dashed border-slate-300 pt-1 mt-1 text-center font-serif italic text-[8px] text-slate-500 capitalize leading-none">
                                                                            Maria da Silva
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                            </div>

                                            {/* Explanatory notes under certificates case study */}
                                            <div className="bg-slate-950/20 border border-slate-200/50 rounded-xl p-4 text-left font-sans text-slate-600 space-y-2 mt-2">
                                                <h4 className="text-[9px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5 leading-none">
                                                    <span className="material-symbols-outlined text-[13px] text-cyan-600 font-black">info</span>
                                                    Manual de Validação pela Gestora Escolar
                                                </h4>
                                                <p className="text-[10px] leading-relaxed text-slate-500">
                                                    As certidões de regularidade de fornecedores (Municipal, Estadual, Federal, FGTS e Trabalhista CNDT) não exigem carimbos do fornecedor. No entanto, é <strong className="text-slate-300 font-bold">obrigatório</strong> que a <strong className="text-slate-300 font-bold">Gestora da Unidade de Ensino</strong> consulte a validade e a autenticidade de cada uma delas nos respectivos portais oficiais da internet, imprima o documento de confirmação e aplique o <strong className="text-slate-400 font-black">Carimbo de Gestora</strong> no próprio corpo da certidão impressa, preenchendo sua matrícula, número da portaria e assinando. Isso comprova aos auditores da GEE/SEDUC que a escola validou preventivamente a idoneidade fiscal da empresa antes de fechar a compra.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* CASOS ESPECIAIS DE PRESTAÇÃO DE CONTAS */}
                        <div className="bg-[#16202a] border border-white/5 rounded-[40px] p-8 md:p-10 mt-12 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-cyan-500/5 blur-[80px] rounded-full -mr-20 -mt-20"></div>
                            
                            <div className="relative z-10 space-y-8 font-sans">
                                <div className="text-center md:text-left space-y-2 max-w-3xl">
                                    <span className="text-[10px] font-black uppercase text-cyan-400 tracking-widest bg-cyan-500/10 px-3.5 py-1 rounded-full">Casos Especiais & Destaques</span>
                                    <h3 className="text-2xl font-black text-white">Composição de Pastas por Tipo de Aquisição</h3>
                                    <p className="text-slate-400 text-xs leading-relaxed">
                                        A composição de documentos varia conforme a modalidade de despesa. Siga a regra específica para cada caso para garantir a correta homologação do processo físico:
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-sans">
                                    {/* Case 1: Compra Comum */}
                                    <div className="bg-white/5 border border-white/10 p-6 rounded-3xl space-y-4 flex flex-col justify-between hover:border-cyan-500/30 transition-all duration-305 group">
                                        <div className="space-y-3 text-left">
                                            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-black">
                                                <span className="material-symbols-outlined text-lg">shopping_basket</span>
                                            </div>
                                            <h4 className="font-extrabold text-white text-sm">1. Compra Comum sem Contrato</h4>
                                            <p className="text-[11px] text-slate-400 leading-relaxed">
                                                Para compras de materiais de consumo ou equipamentos eventuais por pesquisa de preços convencional.
                                            </p>
                                            <div className="border-t border-white/5 pt-2 mt-2">
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Documentos Obrigatórios:</span>
                                                <ul className="text-[10.5px] text-slate-300 space-y-1">
                                                    <li>• Ata de Reunião e Compra do Conselho</li>
                                                    <li>• Consolidação da Pesquisa de Preços</li>
                                                    <li>• 3 Cotações de Preços Originais</li>
                                                    <li>• Ordem de Compra assinada</li>
                                                    <li>• Nota Fiscal (DANFE)</li>
                                                    <li>• Espelho de Autorização da NF-e</li>
                                                    <li>• Certidões de Regularidade Válidas</li>
                                                    <li>• Autenticações das Certidões</li>
                                                    <li>• Recibo assinado pelo Fornecedor</li>
                                                    <li>• Comprovante com "Confere com Original"</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Case 2: Serviço com NFS-e */}
                                    <div className="bg-white/5 border border-white/10 p-6 rounded-3xl space-y-4 flex flex-col justify-between hover:border-emerald-500/30 transition-all duration-305 group">
                                        <div className="space-y-3 text-left">
                                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-black">
                                                <span className="material-symbols-outlined text-lg">engineering</span>
                                            </div>
                                            <h4 className="font-extrabold text-white text-sm">2. Serviço Eventual com NFS-e</h4>
                                            <p className="text-[11px] text-slate-400 leading-relaxed">
                                                Para contratação de serviços pontuais de terceiros (reparos, limpezas de caixas d'água, etc.) via Nota Fiscal de Serviço Eletrônica.
                                            </p>
                                            <div className="border-t border-white/5 pt-2 mt-2">
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Regras e Documentos:</span>
                                                <ul className="text-[10.5px] text-slate-300 space-y-1">
                                                    <li className="text-emerald-400 font-bold">• NÃO precisa anexar Espelho da Nota (desde que a NFS-e possua chave ou QR Code de consulta).</li>
                                                    <li>• Nota Fiscal de Serviço (NFS-e)</li>
                                                    <li>• Atesto de Execução (1º e 2º conselheiro)</li>
                                                    <li>• Atestado de Quitação (fornecedor)</li>
                                                    <li>• Certidões de Regularidade Válidas</li>
                                                    <li>• Autenticações das Certidões</li>
                                                    <li>• Recibo comercial do Prestador</li>
                                                    <li>• Comprovante com "Confere com Original"</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Case 3: Despesa Vinculada a Contrato */}
                                    <div className="bg-white/5 border border-white/10 p-6 rounded-3xl space-y-4 flex flex-col justify-between hover:border-amber-500/30 transition-all duration-305 group">
                                        <div className="space-y-3 text-left">
                                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-black">
                                                <span className="material-symbols-outlined text-lg">border_color</span>
                                            </div>
                                            <h4 className="font-extrabold text-white text-sm">3. Despesa Vinculada a Contrato</h4>
                                            <p className="text-[11px] text-slate-400 leading-relaxed">
                                                Para pagamentos mensais recorrentes previstos em contrato formalizado (ex: mensalidade de internet, fornecimento mensal de gás, contratos continuados).
                                            </p>
                                            <div className="border-t border-white/5 pt-2 mt-2">
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Regras e Diferenciais:</span>
                                                <ul className="text-[10.5px] text-slate-300 space-y-1">
                                                    <li className="text-amber-450 font-bold">• NÃO exige nova Ata de Compra a cada pagamento.</li>
                                                    <li className="text-amber-450 font-bold">• NÃO exige nova Consolidação de Pesquisa a cada mês.</li>
                                                    <p className="text-[9.5px] text-slate-400 leading-tight italic py-1 border-b border-white/5">*Nota: Ata e Consolidação só são exigidas uma única vez na formalização/assinatura inicial do contrato principal.</p>
                                                    <li>• Nota Fiscal correspondente ao mês</li>
                                                    <li>• Atesto de Execução do Serviço do mês</li>
                                                    <li>• Certidões de Regularidade Válidas do mês</li>
                                                    <li>• Comprovante com "Confere com Original"</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* TABLE: QUICK SEARCH FOR COMPLIANCE SIGNATURES */}
                        <div className="bg-[#16202a] border border-white/5 rounded-[40px] p-8 md:p-10 mt-12 relative overflow-hidden">
                            <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-primary/5 blur-[80px] rounded-full -mr-20 -mb-20"></div>
                            
                            <div className="relative z-10 space-y-6">
                                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/5 pb-6">
                                    <div>
                                        <h3 className="text-xl font-black text-white">Resumo Geral de Assinaturas</h3>
                                        <p className="text-xs text-slate-400 mt-1">Consulte rapidamente qual documento exige a assinatura de cada cargo ou fornecedor.</p>
                                    </div>
                                    <div className="relative w-full md:w-80">
                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">search</span>
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Buscar por documento ou cargo..."
                                            className="w-full bg-slate-950/60 border border-white/5 hover:border-white/10 focus:border-amber-500 rounded-full py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead>
                                            <tr className="border-b border-white/5 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                                                <th className="py-4 px-4">Documento</th>
                                                <th className="py-4 px-4">Etapa</th>
                                                <th className="py-4 px-4">Quem Assina</th>
                                                <th className="py-4 px-4">Onde Assina</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/[0.03] text-slate-300">
                                            {searchedDocs.map((doc, idx) => {
                                                const phaseColors: Record<string, string> = {
                                                    compras: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                                                    fiscal: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                                                    financeiro: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                                                    certidoes: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                                                };
                                                return (
                                                    <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                                                        <td className="py-4 px-4 font-bold text-white flex items-center gap-2">
                                                            <span className="material-symbols-outlined text-slate-500 text-base">{doc.icon}</span>
                                                            {doc.name}
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${phaseColors[doc.phase]}`}>
                                                                {doc.phaseLabel}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 px-4 font-mono font-bold text-slate-200">{doc.whoSigns}</td>
                                                        <td className="py-4 px-4 text-slate-400 max-w-xs truncate" title={doc.whereSigns}>{doc.whereSigns}</td>
                                                    </tr>
                                                );
                                            })}
                                            {searchedDocs.length === 0 && (
                                                <tr>
                                                    <td colSpan={4} className="py-8 text-center text-slate-500 italic">Nenhum documento encontrado para a busca realizada.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* INTERACTIVE COMPLIANCE AUDIT CHECKLIST */}
                        <div className="bg-[#16202a] border border-white/5 rounded-[40px] p-8 md:p-10 mt-12 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-amber-500/5 blur-[80px] rounded-full -mr-20 -mt-20"></div>
                            
                            <div className="relative z-10 space-y-6 font-sans">
                                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/5 pb-6">
                                    <div className="text-left">
                                        <span className="text-[10px] font-black uppercase text-amber-500 tracking-widest bg-amber-500/10 px-3.5 py-1 rounded-full">Ferramenta Interativa de Auditoria</span>
                                        <h3 className="text-xl font-black text-white mt-2">Checklist de Conformidade do Gestor</h3>
                                        <p className="text-xs text-slate-400">Audite sua pasta de prestação de contas respondendo às perguntas abaixo antes de finalizá-la:</p>
                                    </div>
                                    <div className="bg-slate-900 border border-white/10 px-5 py-3 rounded-2xl flex flex-col items-center justify-center shrink-0 min-w-[150px] shadow-md font-mono">
                                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Progresso da Auditoria</span>
                                        <span className="text-2xl font-black text-amber-500 my-0.5">
                                            {checklistItems.filter(i => i.checked).length} / {checklistItems.length}
                                        </span>
                                        {/* Simple Progress Bar */}
                                        <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1 border border-white/5">
                                            <div 
                                                className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-500" 
                                                style={{ width: `${(checklistItems.filter(i => i.checked).length / checklistItems.length) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Checklist Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                                    {checklistItems.map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() => {
                                                setChecklistItems(
                                                    checklistItems.map(i => i.id === item.id ? { ...i, checked: !i.checked } : i)
                                                );
                                            }}
                                            className={`flex items-start gap-4 p-3.5 rounded-2xl border transition-all text-left group ${
                                                item.checked 
                                                    ? 'bg-emerald-500/10 border-emerald-500/30' 
                                                    : 'bg-white/5 border-transparent hover:bg-white/[0.08] hover:border-white/10'
                                            }`}
                                        >
                                            <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border mt-0.5 transition-all ${
                                                item.checked 
                                                    ? 'bg-emerald-500 border-emerald-500 text-slate-950 shadow-[0_0_8px_rgba(16,185,129,0.3)]' 
                                                    : 'border-slate-500 text-transparent group-hover:border-white'
                                            }`}>
                                                <span className="material-symbols-outlined text-[14px] font-black">check</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-[11.5px] leading-snug font-bold ${item.checked ? 'text-emerald-300' : 'text-slate-300 group-hover:text-white'}`}>
                                                    {item.text}
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* COMPLIANCE GOLDEN RULES CARD */}
                        <div className="bg-[#16202a] border border-white/5 rounded-[40px] p-8 md:p-10 mt-12 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-[300px] h-[300px] bg-amber-500/5 blur-[80px] rounded-full -ml-20 -mt-20"></div>
                            
                            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
                                <div className="lg:col-span-1 space-y-3 text-left">
                                    <h3 className="text-2xl font-black text-white leading-tight font-sans">Regras de Ouro de Conformidade</h3>
                                    <p className="text-xs text-slate-400 leading-relaxed font-sans">Siga estas diretrizes práticas para garantir a aprovação sumária e evitar diligências em sua prestação de contas.</p>
                                </div>
                                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 font-sans">
                                    <div className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-2 text-left">
                                        <h4 className="font-bold text-white text-xs flex items-center gap-2">
                                            <span className="material-symbols-outlined text-red-400 text-sm">edit_off</span>
                                            Zero Rasuras
                                        </h4>
                                        <p className="text-[11px] text-slate-400 leading-normal">Não utilize corretivo, não risque nem rasure nenhum carimbo ou assinatura. Havendo erro, inutilize a lauda e peça para refazer se for o caso.</p>
                                    </div>
                                    <div className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-2 text-left">
                                        <h4 className="font-bold text-white text-xs flex items-center gap-2">
                                            <span className="material-symbols-outlined text-amber-400 text-sm">calendar_month</span>
                                            Atenção às Datas
                                        </h4>
                                        <p className="text-[11px] text-slate-400 leading-normal">A data do Atesto de Recebimento deve ser <strong>igual ou posterior</strong> à data de emissão da Nota Fiscal. Nunca ateste antes da emissão formal do documento fiscal.</p>
                                    </div>
                                    <div className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-2 text-left">
                                        <h4 className="font-bold text-white text-xs flex items-center gap-2">
                                            <span className="material-symbols-outlined text-emerald-400 text-sm">verified_user</span>
                                            Validade das Certidões
                                        </h4>
                                        <p className="text-[11px] text-slate-400 leading-normal">Todas as certidões (FGTS, INSS, Trabalhista, Federal, Estadual e Municipal) devem estar <strong>válidas na data da validação/conferência da nota fiscal</strong>. Em caso de vencimento anterior ao pagamento, exija uma nova atualizada do fornecedor.</p>
                                    </div>
                                    <div className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-2 text-left">
                                        <h4 className="font-bold text-white text-xs flex items-center gap-2">
                                            <span className="material-symbols-outlined text-blue-400 text-sm">filter_none</span>
                                            Uso do Verso (Lauda Adicional)
                                        </h4>
                                        <p className="text-[11px] text-slate-400 leading-normal">Se a frente da nota fiscal não tiver espaço em branco para receber todos os carimbos de controle de forma organizada, carimbe o <strong>Verso</strong> de forma legível.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* REGRA DE OURO DA PRESTAÇÃO DE CONTAS */}
                        <div className="bg-gradient-to-r from-amber-500/20 via-[#1e293b] to-emerald-500/20 border-2 border-amber-500/30 rounded-[40px] p-8 md:p-12 text-center max-w-4xl mx-auto shadow-2xl relative overflow-hidden transition-all duration-300 hover:scale-[1.01] hover:border-emerald-500/30 mb-10">
                            {/* Ambient Light Effects */}
                            <div className="absolute top-0 left-0 w-[200px] h-[200px] bg-amber-500/10 blur-[80px] rounded-full -ml-20 -mt-20"></div>
                            <div className="absolute bottom-0 right-0 w-[200px] h-[200px] bg-emerald-500/10 blur-[80px] rounded-full -mr-20 -mb-20"></div>
                            
                            <div className="relative z-10 space-y-4 max-w-3xl mx-auto font-sans">
                                <span className="text-[11px] font-black uppercase text-amber-500 tracking-widest bg-amber-500/10 px-4 py-1.5 rounded-full border border-amber-500/20">
                                    Regra de Ouro da Prestação de Contas
                                </span>
                                <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-tight">
                                    "Antes de pagar, confira.<br/>
                                    Antes de arquivar, assine.<br/>
                                    Antes de finalizar, organize."
                                </h3>
                                <div className="h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent w-full my-4"></div>
                                <p className="text-slate-300 text-xs md:text-sm leading-relaxed max-w-2xl mx-auto italic font-bold">
                                    "O pagamento somente deve ser realizado após a documentação estar completa, conferida pela assessoria técnica da BRN, com parecer positivo emitido e com todas as assinaturas necessárias devidamente coletadas do fornecedor."
                                </p>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

// Sub-components
interface ProgramCardProps {
    title: string;
    description: string;
    items: Array<string | { label: string; icon: string }>;
    icon: string;
    colorTheme?: 'primary' | 'blue' | 'emerald' | 'orange' | 'cyan' | 'pink' | 'green' | 'indigo';
    listTitle?: string;
}

const ProgramCard: React.FC<ProgramCardProps> = ({ title, description, items, icon, colorTheme = 'primary', listTitle = 'O que comprar?' }) => {

    const themeStyles = {
        primary: { bg: 'bg-primary/10', text: 'text-primary', border: 'group-hover:border-primary/30', glow: 'bg-primary/20' },
        blue: { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'group-hover:border-blue-500/30', glow: 'bg-blue-500/20' },
        emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'group-hover:border-emerald-500/30', glow: 'bg-emerald-500/20' },
        green: { bg: 'bg-green-500/10', text: 'text-green-500', border: 'group-hover:border-green-500/30', glow: 'bg-green-500/20' },
        orange: { bg: 'bg-orange-500/10', text: 'text-orange-500', border: 'group-hover:border-orange-500/30', glow: 'bg-orange-500/20' },
        cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-500', border: 'group-hover:border-cyan-500/30', glow: 'bg-cyan-500/20' },
        pink: { bg: 'bg-pink-500/10', text: 'text-pink-500', border: 'group-hover:border-pink-500/30', glow: 'bg-pink-500/20' },
        indigo: { bg: 'bg-indigo-500/10', text: 'text-indigo-500', border: 'group-hover:border-indigo-500/30', glow: 'bg-indigo-500/20' },
    };

    const currentTheme = themeStyles[colorTheme] || themeStyles.primary;

    return (
        <div className={`bg-[#16202a] p-8 rounded-[32px] border border-white/5 transition-all group flex flex-col relative overflow-hidden ${currentTheme.border}`}>
            {/* Glow Effect */}
            <div className={`absolute top-0 right-0 w-32 h-32 blur-[60px] rounded-full -mr-10 -mt-10 transition-all opacity-50 group-hover:opacity-100 ${currentTheme.glow}`}></div>

            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 relative z-10 transition-colors ${currentTheme.bg} ${currentTheme.text}`}>
                <span className="material-symbols-outlined text-3xl">{icon}</span>
            </div>

            <h3 className="text-xl font-bold text-white mb-3 relative z-10">{title}</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-6 relative z-10 flex-1">{description}</p>

            <div className="mt-auto relative z-10">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-4 block">{listTitle}</span>
                <div className="space-y-2">
                    {items.map((item, idx) => {
                        const isObject = typeof item === 'object';
                        const label = isObject ? (item as any).label : item;
                        const itemIcon = isObject ? (item as any).icon : 'check';

                        return (
                            <div key={idx} className="flex items-start gap-3 text-xs text-slate-300">
                                <span className={`material-symbols-outlined text-[16px] mt-0.5 ${currentTheme.text}`}>{itemIcon}</span>
                                <span className="leading-snug">{label}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

const Step = ({ num, title, desc, align }: any) => {
    const isRight = align === 'right';
    return (
        <div className={`flex flex-col md:flex-row items-center gap-8 mb-16 relative ${isRight ? '' : 'md:flex-row-reverse'}`}>
            <div className={`w-full md:w-1/2 ${isRight ? 'md:text-right md:pr-12' : 'md:text-left md:pl-12'} pl-20 md:pl-0`}>
                <h3 className="text-2xl font-black text-white mb-2">{title}</h3>
                <p className="text-slate-400 leading-relaxed">{desc}</p>
            </div>

            <div className="absolute left-8 md:left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-[#111827] border-4 border-primary flex items-center justify-center z-10">
                <span className="font-black text-white">{num}</span>
            </div>

            <div className="w-full md:w-1/2 hidden md:block"></div>
        </div>
    );
};

const DocButton = ({ icon, label, onClick }: any) => (
    <button onClick={onClick} className="flex flex-col items-center gap-4 p-6 bg-white/5 rounded-3xl hover:bg-white/10 transition-all border border-transparent hover:border-white/10 group">
        <span className="material-symbols-outlined text-3xl text-slate-400 group-hover:text-primary transition-colors">{icon}</span>
        <span className="text-xs font-bold uppercase tracking-widest text-center">{label}</span>
    </button>
);

export default ProgramsGuide;
