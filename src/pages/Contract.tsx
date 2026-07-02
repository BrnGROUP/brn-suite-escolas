import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { User, ContractSignature } from '../types';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';

interface ContractProps {
    user: User;
    onSigned?: () => void;
}

const Contract: React.FC<ContractProps> = ({ user, onSigned }) => {
    const [loading, setLoading] = useState(false);
    const [signed, setSigned] = useState(false);
    const [signatureData, setSignatureData] = useState<ContractSignature | null>(null);
    const [ip, setIp] = useState('');
    const { addToast } = useToast();
    const { confirm } = useConfirm();

    useEffect(() => {
        checkSignature();
        fetchIp();
    }, []);

    const fetchIp = async () => {
        try {
            const res = await fetch('https://api.ipify.org?format=json');
            const data = await res.json();
            setIp(data.ip);
        } catch (e) {
            console.error('Failed to fetch IP', e);
            setIp('0.0.0.0 (Indisponível)');
        }
    };

    const checkSignature = async () => {
        const { data } = await supabase
            .from('contract_signatures')
            .select('*')
            .eq('user_id', user.id)
            .order('signed_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (data) {
            setSigned(true);
            setSignatureData(data);
        }
    };

    const handleSign = async () => {
        if (!await confirm({
            title: 'Assinar Termo de Responsabilidade',
            message: 'Ao clicar em OK, você concorda com todos os termos apresentados e assina digitalmente este contrato.',
            confirmText: 'Aceitar e Assinar',
            cancelText: 'Cancelar'
        })) return;

        setLoading(true);
        try {
            const { error } = await supabase.from('contract_signatures').insert({
                user_id: user.id,
                contract_version: 'v1.0-2026',
                ip_address: ip,
                status: 'signed',
                user_agent: navigator.userAgent
            });

            if (error) throw error;
            addToast('Contrato assinado com sucesso! O acesso ao sistema está liberado.', 'success');
            setSigned(true);
            checkSignature();
            if (onSigned) onSigned();

        } catch (error: any) {
            console.error(error);
            addToast('Erro ao assinar contrato: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    if (signed && signatureData) {
        return (
            <div className="min-h-screen bg-[#111827] flex flex-col items-center p-4 md:p-8 text-white font-sans overflow-y-auto print:bg-white print:p-0 print:block print:overflow-visible">
                <style>{`
                    @media print {
                        .print-root {
                            position: static !important;
                            display: block !important;
                            width: 100% !important;
                            background: white !important;
                            color: black !important;
                        }

                        .clause-block {
                            page-break-inside: avoid;
                            break-inside: avoid;
                            margin-bottom: 20px !important;
                        }

                        .signature-block {
                            page-break-inside: avoid;
                            break-inside: avoid;
                            margin-top: 50px !important;
                        }
                    }
                `}</style>

                <div className="print-root print-inner max-w-4xl w-full bg-[#16202a] border border-emerald-500/30 p-8 md:p-12 rounded-3xl shadow-2xl relative overflow-hidden mb-8 print:shadow-none print:border-none print:bg-white print:text-black print:p-0 print:m-0 print:overflow-visible">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full -mr-10 -mt-10 print:hidden pointer-events-none"></div>

                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start mb-8 gap-6 print:flex-row print:items-center print:border-b print:border-slate-200 print:pb-6 print:mb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 print:bg-slate-100 print:text-slate-800 print:w-12 print:h-12">
                                <span className="material-symbols-outlined text-4xl print:text-2xl">verified_user</span>
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-white print:text-black print:text-xl uppercase">Contrato Digital</h1>
                                <p className="text-emerald-500 font-bold text-xs uppercase tracking-widest print:text-slate-500 print:text-[10px]">Documento Assinado e Vigente</p>
                            </div>
                        </div>
                        <button
                            onClick={() => window.print()}
                            className="bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl flex items-center gap-2 border border-white/10 transition-all active:scale-95 print:hidden cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-sm">print</span>
                            Imprimir / PDF
                        </button>
                    </div>

                    <div className="bg-black/30 p-6 rounded-2xl border border-white/5 mb-8 print:bg-white print:border-none print:p-0 print:mb-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:grid-cols-2 print:gap-12">
                            <div>
                                <h2 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-4 print:text-slate-400">Informações do Signatário</h2>
                                <p className="text-white font-bold text-lg uppercase print:text-black print:text-base">{user.name}</p>
                                <p className="text-slate-400 text-sm print:text-slate-600 print:text-xs">{user.email}</p>
                            </div>
                            <div className="flex flex-col gap-4">
                                <h2 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2 print:text-slate-400">Selo de Autenticidade Digital</h2>
                                <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl font-mono text-[10px] leading-relaxed break-all text-emerald-300 print:bg-slate-50 print:border-slate-200 print:text-slate-600 print:p-3 print:text-[9px]">
                                    AUTH_ID: {signatureData.id}<br />
                                    TIMESTAMP: {new Date(signatureData.signed_at).toISOString()}<br />
                                    NETWORK_IP: {signatureData.ip_address || '0.0.0.0'}<br />
                                    VERSION: {signatureData.contract_version}<br />
                                    SIGNED_DOC_VERIFIED_BY_BRN_SYSTEM
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="prose prose-invert max-w-none text-slate-400 text-sm space-y-6 print:text-black print:prose-p:text-xs print:prose-h3:text-sm print:prose-h3:mt-6 print:prose-h3:mb-2 print:space-y-4">
                        <h3 className="text-white font-bold uppercase text-xs border-b border-white/10 pb-2 print:text-black print:border-slate-300 print:font-black">Termos do Contrato</h3>
                        <ContractTerms user={user} />
                    </div>

                    <div className="signature-block mt-12 pt-8 border-t border-white/10 flex flex-col items-center text-center gap-2 opacity-50 print:opacity-100 print:mt-16 print:pt-8 print:border-slate-200">
                        <div className="w-48 h-px bg-slate-500 mb-2 print:bg-slate-300"></div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300 print:text-black print:text-xs">{user.name}</p>
                        <p className="text-[9px] text-slate-500 print:text-slate-500">Assinado Eletronicamente em {new Date(signatureData.signed_at).toLocaleString('pt-BR')}</p>
                    </div>
                </div>

                {onSigned && (
                    <button
                        onClick={() => onSigned()}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-12 py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 mb-12 print:hidden"
                    >
                        Continuar para o Sistema
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#111827] flex items-center justify-center p-4 md:p-8 text-white font-sans print:bg-white print:p-0">
            <div className="print-root max-w-4xl w-full bg-[#16202a] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[85vh] print:h-auto print:border-none print:shadow-none print:bg-white">

                {/* Header */}
                <div className="bg-[#0f151c] p-6 border-b border-white/10 flex items-center justify-between shrink-0 print:border-slate-200">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-yellow-500 text-3xl print:text-slate-700">gavel</span>
                        <div>
                            <h2 className="text-xl font-bold uppercase tracking-wider print:text-black">Termo de Responsabilidade</h2>
                            <p className="text-xs text-slate-400 print:text-slate-500">Leia atentamente antes de prosseguir</p>
                        </div>
                    </div>
                    <button
                        onClick={() => window.print()}
                        className="text-white/60 hover:text-white flex items-center gap-2 text-xs font-bold uppercase bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 transition-all print:hidden"
                    >
                        <span className="material-symbols-outlined text-sm">print</span> Imprimir
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-8 text-slate-300 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent print:overflow-visible print:h-auto print:p-0 print:pt-6">
                    <div className="prose prose-invert max-w-none text-sm leading-relaxed">
                        <p className="text-lg font-medium text-white mb-6">
                            Pelo presente instrumento, eu, <strong className="text-yellow-500 uppercase">{user.name}</strong>, inscrito como usuário do sistema <strong>BRN Suite Escolas</strong>, declaro para os devidos fins que:
                        </p>

                        <ContractTerms user={user} />

                        <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-xl mt-8">
                            <p className="text-yellow-200 text-xs font-bold uppercase tracking-wider mb-2">Declaração Final</p>
                            <p className="text-yellow-100 text-sm italic">
                                "Declaro ter lido, compreendido e aceito todos os termos acima descritos, assumindo plena responsabilidade pelo uso ético e legal do sistema."
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer - Action */}
                <div className="bg-[#0f151c] p-6 border-t border-white/10 shrink-0 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="text-xs text-slate-500 text-center md:text-left">
                        <p>Endereço IP para registro: <span className="text-slate-300 font-mono">{ip || 'Carregando...'}</span></p>
                        <p>Data: <span className="text-slate-300">{new Date().toLocaleDateString('pt-BR')}</span></p>
                    </div>

                    <button
                        onClick={handleSign}
                        disabled={loading || !ip}
                        className={`
                            px-8 py-3 rounded-xl font-black uppercase tracking-widest text-sm transition-all shadow-lg
                            ${loading || !ip
                                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                : 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white hover:scale-105 hover:shadow-emerald-500/20'}
                        `}
                    >
                        {loading ? 'Assinando...' : 'Aceitar e Assinar Digitalmente'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const ContractTerms: React.FC<{ user: User }> = ({ user }) => {
    const [plan, setPlan] = React.useState<any>(null);

    React.useEffect(() => {
        const fetchPlanData = async () => {
            const schoolId = user.schoolId || (user as any).school_id;
            if (!schoolId) return;

            try {
                // 1. Get school's plan_id
                const { data: school } = await supabase
                    .from('schools')
                    .select('plan_id, custom_title, custom_price, discount_value, custom_description')
                    .eq('id', schoolId)
                    .maybeSingle();

                if (school) {
                    // Helper to check if a value is a valid price
                    const isValidPrice = (val: any) => val !== null && val !== "" && !isNaN(Number(val));

                    // Initialize default plan data
                    let finalPlan: any = {
                        title: school.custom_title || 'Contratado',
                        price_value: isValidPrice(school.custom_price) ? Number(school.custom_price) : null,
                        discount_value: school.discount_value || 0,
                        features: []
                    };

                    // 2. If there's a base plan, enrichment with its features/default price
                    if (school.plan_id && school.plan_id !== 'custom') {
                        const { data: settings } = await supabase
                            .from('system_settings')
                            .select('value')
                            .eq('key', 'landing_page_plans')
                            .maybeSingle();

                        if (settings?.value) {
                            const matchedPlan = settings.value.find((p: any) => p.id === school.plan_id);
                            if (matchedPlan) {
                                // Rule: Standard plans ALWAYS use their base price. 
                                // Clean the price string (it might contain "R$ ", etc)
                                const rawPrice = matchedPlan.price_value || matchedPlan.price || 0;
                                const cleanBasePrice = typeof rawPrice === 'string'
                                    ? Number(rawPrice.replace(/[^\d,.]/g, '').replace(',', '.'))
                                    : Number(rawPrice);

                                const basePrice = isNaN(cleanBasePrice) ? 0 : cleanBasePrice;
                                const discountValue = Number(school.discount_value || 0);

                                finalPlan = {
                                    ...matchedPlan,
                                    title: school.custom_title || matchedPlan.title,
                                    price_value: basePrice - discountValue,
                                    discount_value: discountValue
                                };
                            }
                        }
                    } else if (school.plan_id === 'custom') {
                        // For custom plans, we use the manually entered data
                        const basePrice = isValidPrice(school.custom_price) ? Number(school.custom_price) : 0;
                        const discountValue = Number(school.discount_value || 0);

                        finalPlan = {
                            title: school.custom_title || 'Plano Personalizado',
                            price_value: basePrice - discountValue,
                            discount_value: discountValue,
                            description: school.custom_description,
                            features: [] // Custom plans start with no predefined features
                        };
                    }

                    setPlan(finalPlan);
                }
            } catch (error) {
                console.error('Error fetching plan data:', error);
            }
        };

        fetchPlanData();
    }, [user.schoolId, (user as any).school_id]);

    const formatCurrency = (value: number | null) => {
        if (value === null || value === undefined) return 'valor sob consulta';
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    return (
        <>
            <div className="clause-block">
                <h3 className="text-white font-bold uppercase text-sm border-b border-white/10 pb-2 mb-3 mt-6 print:text-black print:border-slate-300">1. Acesso e Segurança</h3>
                <p>
                    Estou ciente de que meu acesso (login e senha) é <strong>pessoal e intransferível</strong>. Assumo total responsabilidade por todas as ações realizadas no sistema sob minhas credenciais, comprometendo-me a manter minha senha em sigilo absoluto e a não compartilhá-la com terceiros, sob pena de responsabilização administrativa.
                </p>
            </div>

            <div className="clause-block">
                <h3 className="text-white font-bold uppercase text-sm border-b border-white/10 pb-2 mb-3 mt-6 print:text-black print:border-slate-300">2. Veracidade das Informações</h3>
                <p>
                    Declaro que todas as informações inseridas no sistema, incluindo lançamentos financeiros, cadastros de fornecedores e documentos anexados, são <strong>verdadeiras e correspondem fielmente aos documentos originais</strong>. Reconheço que a inserção de dados falsos pode acarretar em sanções legais, conforme legislação vigente sobre falsidade ideológica e improbidade administrativa.
                </p>
            </div>

            <div className="clause-block">
                <h3 className="text-white font-bold uppercase text-sm border-b border-white/10 pb-2 mb-3 mt-6 print:text-black print:border-slate-300">3. Responsabilidades do Gestor</h3>
                <p>
                    É de inteira responsabilidade do gestor a <strong>coleta de todas as assinaturas</strong> necessárias nos documentos gerados pelo sistema, bem como a guarda dos mesmos. Além disso, o gestor compromete-se a fornecer/anexar no sistema a <strong>Nota Fiscal, Comprovante de Pagamento, Extratos de Investimento e Conta Corrente</strong> de cada conta bancária vinculada, além das certidões negativas de débito, impreterivelmente até o <strong>5º dia útil de cada mês</strong>.
                </p>
            </div>

            <div className="clause-block">
                <h3 className="text-white font-bold uppercase text-sm border-b border-white/10 pb-2 mb-3 mt-6 print:text-black print:border-slate-300">4. Obrigações da BRN GROUP</h3>
                <div className="space-y-3">
                    <p>
                        A empresa <strong>BRN GROUP</strong> obriga-se a cumprir com os itens descritos no plano <strong>{plan?.title || 'Contratado'}</strong>,
                        pelo valor mensal de <strong>{formatCurrency(plan?.price_value)}</strong>
                        {plan?.discount_value > 0 && (
                            <span> (valor original com bonificação mensal de <strong>{formatCurrency(plan.discount_value)}</strong> já aplicada)</span>
                        )},
                        garantindo à instituição:
                    </p>
                    {plan?.description && (
                        <p className="text-xs italic text-slate-400 border-l-2 border-emerald-500/30 pl-3 py-1 mb-2">
                            {plan.description}
                        </p>
                    )}
                    {plan?.features && plan.features.length > 0 ? (
                        <ul className="list-disc pl-5 space-y-1 text-slate-400 print:text-black">
                            {plan.features.map((feature: string, idx: number) => (
                                <li key={idx} className="text-xs">{feature}</li>
                            ))}
                        </ul>
                    ) : (
                        !plan?.description && <p className="text-xs italic text-slate-500">Planos e funcionalidades conforme proposta comercial aceita.</p>
                    )}
                </div>
            </div>

            <div className="clause-block">
                <h3 className="text-white font-bold uppercase text-sm border-b border-white/10 pb-2 mb-3 mt-6 print:text-black print:border-slate-300">5. Conformidade Legal e Auditoria</h3>
                <p>
                    Comprometo-me a seguir as normas do FNDE (PNAE/PDDE). Estou ciente de que todas as ações no sistema são registradas para fins de auditoria interna ou externa pelos órgãos de controle, incluindo registro de IP e timestamp de cada operação.
                </p>
            </div>

            <div className="clause-block">
                <h3 className="text-white font-bold uppercase text-sm border-b border-white/10 pb-2 mb-3 mt-6 print:text-black print:border-slate-300">6. Prioridade de Atendimento</h3>
                <p>
                    Visando oferecer um serviço de excelência e valorizar a agilidade de nossos parceiros, o nosso atendimento e a resolução das demandas seguem uma fila de prioridade baseada na ordem de recebimento da documentação <strong>completa</strong>. O gestor que nos enviar primeiramente todos os documentos solicitados terá o seu processo atendido prioritariamente. Caso a documentação seja enviada de forma incompleta ou fora dos padrões orientados, visando não prejudicar o gestor que cumpriu com todos os requisitos prontamente, o processo será reposicionado para o final da fila, aguardando os demais atendimentos para ser retomado. Agradecemos a compreensão e a colaboração de todos para que possamos manter a agilidade para todos os clientes.
                </p>
            </div>

            <div className="clause-block bg-slate-400/5 p-6 rounded-2xl border border-white/5 mt-8 print:bg-transparent print:p-0 print:border-none">
                <h3 className="text-white font-bold uppercase text-sm border-b border-white/10 pb-2 mb-4 print:text-black print:border-slate-300">7. Procedimentos de Análise Técnica e Prazos</h3>

                <div className="space-y-4">
                    <p>Para garantir a segurança jurídica, a legitimidade contábil e a celeridade dos processos, o gestor concorda e compromete-se com as seguintes diretrizes:</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                            <p className="text-primary font-bold mb-1 uppercase tracking-tighter text-[10px]">7.1 Prazo de Análise</p>
                            <p>Estimado em até <strong>24 horas úteis</strong>, a contar do recebimento da documentação integral e correta.</p>
                        </div>
                        <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                            <p className="text-primary font-bold mb-1 uppercase tracking-tighter text-[10px]">7.3 Canal de Envio</p>
                            <p>Preferencialmente via <strong>e-mail oficial da BRN</strong>, para registro e rastro da comunicação.</p>
                        </div>
                    </div>

                    <div>
                        <p className="font-bold text-white mb-2 text-xs uppercase tracking-widest">7.2 Documentação Obrigatória (Condições e Formatos):</p>
                        <ul className="list-none space-y-2 text-xs">
                            <li className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[10px]">1</span>
                                <span><strong>Nota Fiscal:</strong> Arquivos originais em <strong>PDF e XML</strong>.</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[10px]">2</span>
                                <span><strong>Certidões Negativas:</strong> Municipal, Estadual, Federal, FGTS e Trabalhista em <strong>PDF</strong>.</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[10px]">3</span>
                                <span><strong>Comprovante de Pagamento:</strong> Arquivo original em <strong>PDF</strong>.</span>
                            </li>
                        </ul>
                    </div>

                    <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                        <p className="text-orange-400 font-bold text-xs uppercase mb-1 flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">priority_high</span>
                            7.4 Qualidade e Autenticidade
                        </p>
                        <p className="text-xs italic underline decoration-orange-500/30 underline-offset-4">
                            <strong>Evite documentos escaneados.</strong> Prefira arquivos digitais originais para preservar metadados, legibilidade e a plena autenticidade documental.
                        </p>
                    </div>

                    <div className="p-4 bg-red-500/20 border border-red-500/40 rounded-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-2 opacity-20">
                            <span className="material-symbols-outlined text-4xl">warning</span>
                        </div>
                        <p className="text-red-400 font-black text-xs uppercase mb-2">⚠️ Alerta de Conformidade</p>
                        <p className="text-slate-200 text-xs leading-relaxed font-medium">
                            A inobservância destas medidas impossibilita que a <strong>BRN GROUP</strong> ateste a conformidade fiscal da compra ou a autenticidade dos documentos apresentados perante os órgãos de controle.
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Contract;
