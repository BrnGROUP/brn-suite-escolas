import React, { useState } from 'react';
import { printDocument } from '../lib/printUtils';
import { generateAtaHTML, generateOrdemHTML, generateConsolidacaoHTML } from '../lib/documentTemplates';
import { useToast } from '../context/ToastContext';

interface ProgramsGuideProps {
    onBack: () => void;
}

const ProgramsGuide: React.FC<ProgramsGuideProps> = ({ onBack }) => {
    const { addToast } = useToast();
    const [activeTab, setActiveTab] = useState<'federal' | 'estadual' | 'execucao'>('federal');

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
