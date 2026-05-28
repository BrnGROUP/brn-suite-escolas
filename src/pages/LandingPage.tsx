import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

interface LandingPageProps {
    onLoginClick: () => void;
    onGuideClick?: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick, onGuideClick }) => {
    const [activeFaq, setActiveFaq] = useState<number | null>(null);

    const defaultPlans = [
        {
            id: "bbagil_gestao",
            title: "BBÁgil & Gestão",
            subtitle: "Ferramentas Digitais",
            price_value: "R$ 300",
            price_period: "/mês",
            billing_info: "Valor mensal: R$ 300,00. Valor anual: R$ 3.600,00. O controle absoluto nas suas mãos.",
            features: [
                "BBÁgil Automático",
                "Livro Caixa Digital",
                "Livro Tombo Patrimonial",
                "Atas de Assembleia",
                "Planos de Action"
            ],
            highlight: false,
            highlight_text: "",
            icon: "auto_awesome",
            order: 1
        },
        {
            id: "combo_full",
            title: "BRN Suite FULL",
            subtitle: "Assessoria + Tecnologia",
            price_value: "R$ 750",
            price_period: "/mês",
            billing_info: "Economia de R$ 150/mês! Valor anual: R$ 9.000,00. A solução completa e definitiva.",
            features: [
                "Tudo do plano Prestação de Contas",
                "Tudo do plano BBÁgil & Gestão",
                "Suporte VIP prioritário",
                "Economia real de R$ 1.800/ano"
            ],
            highlight: true,
            highlight_text: "Melhor Custo-Benefício",
            icon: "star",
            order: 2
        },
        {
            id: "prestacao_contas",
            title: "Prestação de Contas",
            subtitle: "Assessoria Especializada",
            price_value: "R$ 600",
            price_period: "/mês",
            billing_info: "Valor mensal: R$ 600,00. Valor anual: R$ 7.200,00. Tranquilidade e conformidade total.",
            features: [
                "Confecção de Notas e Espelhos",
                "Consolidação de Documentos",
                "Ordens de Compra e Serviço",
                "Atas de Compra e Certidões",
                "Recibos e Autenticações"
            ],
            highlight: false,
            highlight_text: "",
            icon: "verified_user",
            order: 3
        }
    ];

    const [plans, setPlans] = useState(defaultPlans);
    const [showContactModal, setShowContactModal] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<any>(null);
    const [contacts, setContacts] = useState({
        email: 'contato@brnsuite.com',
        phone: '',
        whatsapp: '',
        instagram: '',
        website: ''
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [plansRes, contactsRes] = await Promise.all([
                    supabase.from('system_settings').select('value').eq('key', 'landing_page_plans').maybeSingle(),
                    supabase.from('system_settings').select('value').eq('key', 'support_contacts').maybeSingle()
                ]);

                if (plansRes.data?.value) {
                    setPlans(plansRes.data.value);
                }
                if (contactsRes.data?.value) {
                    setContacts(contactsRes.data.value);
                }
            } catch (error) {
                console.error("Erro ao buscar dados", error);
            }
        };
        fetchData();
    }, []);



    return (
        <div className="min-h-screen bg-slate-50 dark:bg-background-dark text-slate-900 dark:text-white font-sans transition-colors duration-300">

            {/* Navbar */}
            <nav className="fixed w-full z-50 bg-white/80 dark:bg-surface-dark/90 backdrop-blur-md border-b border-slate-200 dark:border-surface-border">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <div className="flex items-center gap-3">
                            <img src="/assets/logo/logo-horizontal.png" alt="BRN GROUP" className="h-10 w-auto" />
                        </div>
                        <div className="flex items-center gap-2 sm:gap-4">
                            {onGuideClick && (
                                <button
                                    onClick={onGuideClick}
                                    className="flex items-center gap-1.5 px-2 sm:px-4 py-2 text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors shrink-0"
                                >
                                    <span className="material-symbols-outlined text-lg sm:text-xl">menu_book</span>
                                    <span className="hidden sm:inline">Manual do Gestor</span>
                                    <span className="sm:hidden">Manual</span>
                                </button>
                            )}
                            <button
                                onClick={onLoginClick}
                                className="btn-primary flex items-center gap-2 group !px-3 sm:!px-6 !py-2 sm:!py-2.5 !text-xs sm:!text-sm shrink-0"
                            >
                                <span className="hidden xs:inline sm:inline">Acessar Sistema</span>
                                <span className="xs:hidden sm:hidden">Entrar</span>
                                <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">login</span>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 lg:pt-48 lg:pb-32 relative overflow-hidden">
                <div className="absolute inset-0 bg-grid-slate-200/50 dark:bg-grid-slate-800/20 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))] pointer-events-none" />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/30 text-primary dark:text-blue-300 font-medium text-sm mb-8 border border-blue-100 dark:border-blue-800 animate-fade-in-up">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                        Gestão Financeira Escolar Especializada
                    </div>

                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 text-slate-900 dark:text-white leading-tight">
                        Excelência em <br />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-emerald-500">Prestação de Contas</span>
                    </h1>

                    <p className="mt-6 text-xl text-slate-600 dark:text-text-secondary max-w-3xl mx-auto mb-10 leading-relaxed">
                        Tenha a tranquilidade de uma gestão financeira impecável. Unimos a tecnologia do nosso sistema exclusivo com uma assessoria especializada para garantir a conformidade total da sua escola.
                    </p>

                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <button onClick={() => setShowContactModal(true)} className="btn-primary text-lg !px-8 !py-4 shadow-xl hover:shadow-2xl hover:bg-primary-hover transform hover:-translate-y-1 transition-all duration-300">
                            Começar Agora
                        </button>
                        <button onClick={() => setShowContactModal(true)} className="px-8 py-4 rounded-xl font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-surface-dark border border-slate-200 dark:border-surface-border hover:bg-slate-50 dark:hover:bg-card-dark transition-all flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined">call</span>
                            Fale com Consultor
                        </button>
                    </div>
                </div>
            </section>

            {/* Services Plans Section */}
            <section className="py-24 bg-white dark:bg-surface-dark relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-20">
                        <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">Nossos Planos e Serviços</h2>
                        <p className="text-xl text-slate-600 dark:text-text-secondary max-w-2xl mx-auto">
                            Soluções completas para cada necessidade financeira da sua instituição escolar.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {plans.map((plan: any, index: number) => (
                            <div key={index} className={`col-span-1 lg:col-span-1 relative ${plan.highlight ? 'bg-slate-50 dark:bg-card-dark border-2 border-primary dark:border-primary/50 shadow-2xl' : 'bg-white dark:bg-surface-dark border border-slate-200 dark:border-surface-border shadow-lg'} rounded-3xl p-8 flex flex-col hover:shadow-xl transition-all duration-300`}>

                                {plan.highlight && (
                                    <div className="absolute top-0 right-0 bg-primary text-white text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-2xl uppercase tracking-wider">
                                        {plan.highlight_text || 'Destaque'}
                                    </div>
                                )}

                                <div className="mb-6 flex items-center gap-4">
                                    <div className={`p-3 rounded-2xl ${plan.highlight ? 'bg-blue-100 dark:bg-blue-900/50 text-primary' : 'bg-slate-100 dark:bg-surface-border/50 text-slate-600 dark:text-slate-400'}`}>
                                        <span className="material-symbols-outlined text-3xl">{plan.icon}</span>
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{plan.title}</h3>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm">{plan.subtitle}</p>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-extrabold text-slate-900 dark:text-white">{plan.price_value}</span>
                                        <span className="text-slate-500 font-medium">{plan.price_period}</span>
                                    </div>
                                </div>

                                <div className="mb-8 p-3 rounded-lg bg-slate-100 dark:bg-black/20 border border-slate-200 dark:border-surface-border/50">
                                    <p className="text-sm text-slate-600 dark:text-slate-300 font-medium leading-snug">
                                        <span className="material-symbols-outlined text-base align-middle mr-1 text-emerald-500">payments</span>
                                        {plan.billing_info}
                                    </p>
                                </div>

                                <ul className="space-y-4 mb-8 flex-1">
                                    {Array.isArray(plan.features) && plan.features.map((item: any, i: number) => (
                                        <li key={i} className="flex items-start gap-3 text-slate-700 dark:text-slate-300">
                                            <span className="material-symbols-outlined text-primary text-xl shrink-0">check_circle</span>
                                            <span className="text-sm leading-tight">{typeof item === 'string' ? item : `${item.text} - ${item.detail || ''}`}</span>
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    onClick={() => setSelectedPlan(plan)}
                                    className={`w-full py-3 rounded-xl font-bold transition-all ${plan.highlight ? 'btn-primary' : 'border-2 border-slate-200 dark:border-surface-border text-slate-700 dark:text-white hover:border-primary hover:text-primary'} `}
                                >
                                    {plan.highlight ? 'Contratar Agora' : 'Saber Mais'}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features / Why Us */}
            <section className="py-24 bg-slate-50 dark:bg-background-dark">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">

                        <div className="mb-12 lg:mb-0">
                            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
                                Por que escolher o <span className="text-primary">BRN Suite</span> + Nossa Assessoria?
                            </h2>
                            <p className="text-lg text-slate-600 dark:text-text-secondary mb-8">
                                Não entregamos apenas um software, mas uma parceria completa para o sucesso da gestão escolar.
                            </p>

                            <div className="space-y-6">
                                {[
                                    { title: "Segurança Jurídica", desc: "Todos os processos auditados e em conformidade com as leis vigentes.", icon: "gavel" },
                                    { title: "Agilidade Comprovada", desc: "Redução de até 70% no tempo gasto com burocracia.", icon: "speed" },
                                    { title: "Transparência Total", desc: "Acompanhe cada centavo e cada documento em tempo real.", icon: "visibility" },
                                    { title: "Gestão Livre de Erros", desc: "Nosso sistema + assessoria eliminam riscos na execução financeira e na prestação de contas.", icon: "fact_check" },
                                    { title: "Suporte Especializado", desc: "Equipe que entende do dia a dia da gestão escolar.", icon: "support_agent" }
                                ].map((feat, i) => (
                                    <div key={i} className="flex gap-4">
                                        <div className="shrink-0 w-12 h-12 rounded-xl bg-white dark:bg-surface-dark shadow-sm flex items-center justify-center text-primary">
                                            <span className="material-symbols-outlined">{feat.icon}</span>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 dark:text-white text-lg">{feat.title}</h4>
                                            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{feat.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="relative">
                            {/* Abstract decorative composition */}
                            <div className="absolute -top-10 -right-10 w-72 h-72 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full blur-3xl opacity-20 animate-pulse"></div>
                            <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full blur-3xl opacity-20 animate-pulse delay-1000"></div>

                            <div className="relative bg-white dark:bg-surface-dark border border-slate-200 dark:border-surface-border rounded-2xl shadow-2xl p-6 md:p-8">
                                {/* Mock UI Element - Dashboard Preview */}
                                <div className="flex items-center justify-between mb-8 border-b border-slate-100 dark:border-surface-border pb-4">
                                    <div className="flex gap-2">
                                        <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                        <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                        <div className="w-3 h-3 rounded-full bg-green-400"></div>
                                    </div>
                                    <div className="text-xs text-slate-400 font-mono">dashboard.tsx</div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex gap-4">
                                        <div className="flex-1 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl">
                                            <div className="text-blue-500 text-xs font-bold uppercase mb-1">Saldo Atual</div>
                                            <div className="text-slate-900 dark:text-white text-2xl font-bold">R$ 42.590,00</div>
                                        </div>
                                        <div className="flex-1 bg-green-50 dark:bg-green-900/20 p-4 rounded-xl">
                                            <div className="text-green-500 text-xs font-bold uppercase mb-1">Aprovados</div>
                                            <div className="text-slate-900 dark:text-white text-2xl font-bold">128</div>
                                        </div>
                                    </div>

                                    <div className="h-32 bg-slate-50 dark:bg-slate-800/50 rounded-xl flex items-end justify-between p-4 px-6 gap-2">
                                        <div className="w-full bg-blue-400/30 h-[40%] rounded-t-sm"></div>
                                        <div className="w-full bg-blue-400/50 h-[70%] rounded-t-sm"></div>
                                        <div className="w-full bg-primary h-[55%] rounded-t-sm"></div>
                                        <div className="w-full bg-blue-400/40 h-[85%] rounded-t-sm"></div>
                                        <div className="w-full bg-blue-400/20 h-[30%] rounded-t-sm"></div>
                                    </div>

                                    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-surface-border/30 rounded-lg">
                                        <span className="material-symbols-outlined text-green-500">check_circle</span>
                                        <div className="flex-1">
                                            <div className="h-2 w-24 bg-slate-200 dark:bg-slate-600 rounded mb-1"></div>
                                            <div className="h-1.5 w-16 bg-slate-100 dark:bg-slate-700 rounded"></div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-surface-border/30 rounded-lg">
                                        <span className="material-symbols-outlined text-blue-500">history</span>
                                        <div className="flex-1">
                                            <div className="h-2 w-32 bg-slate-200 dark:bg-slate-600 rounded mb-1"></div>
                                            <div className="h-1.5 w-20 bg-slate-100 dark:bg-slate-700 rounded"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-white dark:bg-surface-dark border-t border-slate-200 dark:border-surface-border py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <img src="/assets/logo/logo-horizontal.png" alt="BRN GROUP" className="h-10 w-auto" />
                    </div>

                    <div className="text-slate-500 dark:text-slate-400 text-sm text-center md:text-right">
                        <p className="mb-2">© {new Date().getFullYear()} Todos os direitos reservados.</p>
                        <p>Feito com ❤️ para escolas.</p>
                    </div>
                </div>
            </footer>

            {/* CONTACT MODAL */}
            {showContactModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white dark:bg-surface-dark w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-surface-border overflow-hidden">
                        <div className="p-6 border-b border-slate-200 dark:border-surface-border flex justify-between items-center bg-slate-50 dark:bg-black/20">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">contact_support</span>
                                Fale Conosco
                            </h3>
                            <button onClick={() => setShowContactModal(false)} className="text-slate-500 hover:text-red-500 transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-8 flex flex-col gap-6">
                            <p className="text-slate-600 dark:text-text-secondary text-center mb-2">
                                Nossa equipe de especialistas está pronta para atender sua escola. Entre em contato pelos canais abaixo:
                            </p>

                            <div className="grid gap-4">
                                <a href={`mailto:${contacts.email}`} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-surface-border/30 hover:bg-slate-100 dark:hover:bg-surface-border/50 transition-colors group">
                                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                                        <span className="material-symbols-outlined">mail</span>
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-500 uppercase font-bold">E-mail</div>
                                        <div className="text-slate-900 dark:text-white font-medium">{contacts.email || 'contato@brnsuite.com'}</div>
                                    </div>
                                </a>

                                <a href={`https://wa.me/55${contacts.whatsapp?.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-surface-border/30 hover:bg-slate-100 dark:hover:bg-surface-border/50 transition-colors group">
                                    <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform">
                                        <span className="material-symbols-outlined">chat</span>
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-500 uppercase font-bold">WhatsApp</div>
                                        <div className="text-slate-900 dark:text-white font-medium">{contacts.whatsapp || '(00) 00000-0000'}</div>
                                    </div>
                                </a>

                                {contacts.instagram && (
                                    <a href={`https://instagram.com/${contacts.instagram.replace('@', '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-surface-border/30 hover:bg-slate-100 dark:hover:bg-surface-border/50 transition-colors group">
                                        <div className="w-12 h-12 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center text-pink-600 dark:text-pink-400 group-hover:scale-110 transition-transform">
                                            <span className="material-symbols-outlined">photo_camera</span>
                                        </div>
                                        <div>
                                            <div className="text-xs text-slate-500 uppercase font-bold">Instagram</div>
                                            <div className="text-slate-900 dark:text-white font-medium">{contacts.instagram}</div>
                                        </div>
                                    </a>
                                )}
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-black/20 text-center">
                            <button onClick={() => setShowContactModal(false)} className="text-sm font-bold text-slate-500 hover:text-primary">
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* PLAN DETAILS MODAL */}
            {selectedPlan && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white dark:bg-surface-dark w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-surface-border overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="p-8 pb-4 relative">
                            <button onClick={() => setSelectedPlan(null)} className="absolute top-6 right-6 w-10 h-10 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-500 hover:text-red-500 hover:bg-slate-200 dark:hover:bg-white/20 transition-all">
                                <span className="material-symbols-outlined">close</span>
                            </button>

                            <div className="flex items-center gap-4 mb-2">
                                <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                    <span className="material-symbols-outlined text-3xl">{selectedPlan.icon}</span>
                                </div>
                                <div>
                                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white">{selectedPlan.title}</h2>
                                    <p className="text-lg text-slate-500 dark:text-slate-400">{selectedPlan.subtitle}</p>
                                </div>
                            </div>
                        </div>

                        {/* Content Scrollable */}
                        <div className="p-8 pt-2 overflow-y-auto custom-scrollbar">
                            <div className="flex flex-col gap-6">
                                <div className="p-6 bg-slate-50 dark:bg-black/20 rounded-2xl border border-slate-100 dark:border-white/5">
                                    <div className="flex items-baseline gap-2 mb-2">
                                        <span className="text-5xl font-extrabold text-primary">{selectedPlan.price_value}</span>
                                        <span className="text-xl text-slate-500">{selectedPlan.price_period}</span>
                                    </div>
                                    <p className="text-slate-600 dark:text-slate-300 font-medium flex items-center gap-2">
                                        <span className="material-symbols-outlined text-emerald-500">payments</span>
                                        {selectedPlan.billing_info}
                                    </p>
                                </div>

                                <div>
                                    <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-3">Sobre este plano</h4>
                                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-lg">
                                        {selectedPlan.details || 'Entre em contato para saber mais detalhes sobre este plano personalizado para sua escola.'}
                                    </p>
                                </div>

                                <div>
                                    <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-3">O que está incluso:</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {Array.isArray(selectedPlan.features) && selectedPlan.features.map((item: any, i: number) => (
                                            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-white/5">
                                                <span className="material-symbols-outlined text-primary text-xl shrink-0">check_circle</span>
                                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-tight">
                                                    {typeof item === 'string' ? item : `${item.text} - ${item.detail || ''}`}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="p-6 border-t border-slate-200 dark:border-surface-border bg-slate-50 dark:bg-black/20 flex justify-end gap-3 z-10">
                            <button onClick={() => setSelectedPlan(null)} className="px-6 py-3 rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">
                                Fechar
                            </button>
                            <button
                                onClick={() => { setSelectedPlan(null); setShowContactModal(true); }}
                                className="px-8 py-3 rounded-xl font-bold text-white bg-primary hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all active:scale-95"
                            >
                                Tenho Interesse
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default LandingPage;
