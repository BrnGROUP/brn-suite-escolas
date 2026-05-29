
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { User } from '../types';
import SupportModal from '../components/SupportModal';

const Help: React.FC<{ user: User }> = ({ user }) => {
    const [showSupport, setShowSupport] = useState(false);
    const [contacts, setContacts] = useState({
        email: 'carregando...',
        phone: 'carregando...',
        whatsapp: 'carregando...',
        instagram: '',
        website: ''
    });

    useEffect(() => {
        fetchContacts();
    }, []);

    const fetchContacts = async () => {
        try {
            const { data } = await supabase
                .from('system_settings')
                .select('value')
                .eq('key', 'support_contacts')
                .maybeSingle();

            if (data?.value) {
                setContacts(data.value);
            }
        } catch (error) {
            console.error('Error fetching contacts:', error);
        }
    };

    const helpSections = [
        {
            title: 'Entendendo os Status',
            icon: 'sync',
            color: 'text-primary',
            items: [
                { label: 'Pendente', desc: 'Lançamento registrado, mas a transação financeira ainda não ocorreu.' },
                { label: 'Pago / Recebido', desc: 'A transação foi concluída. O dinheiro saiu ou entrou efetivamente.' },
                { label: 'Conciliado', desc: 'Lançamento conferido com o extrato bancário. Status final de auditoria.' }
            ]
        },
        {
            title: 'Modelos e Seções de Relatório',
            icon: 'description',
            color: 'text-cyan-400',
            items: [
                { label: 'Modo Gerencial vs Livro Caixa', desc: 'O Modo Gerencial foca em análises e auditorias internas de conformidade (agrupando por programa, exibindo natureza de recursos e selos de status). O Modo Livro Caixa é o registro contábil oficial cronológico com colunas estritas de Entrada, Saída e Saldo Acumulado, ideal para homologações e assinaturas físicas pelo Diretor e Tesoureiro.' },
                { label: 'Seção: Resumo Global', desc: 'Painel superior consolidado exibindo o saldo geral em conta, receitas acumuladas e o balanço líquido do período selecionado.' },
                { label: 'Seção: Análise Visual', desc: 'Gráficos e barras dinâmicas que ilustram a divisão proporcional dos gastos ou repasses no período.' },
                { label: 'Seção: Resumo Natureza', desc: 'Detalhamento dos recursos distribuídos estritamente entre Custeio (gastos cotidianos e consumo) e Capital (investimento em bens duráveis e estrutura).' },
                { label: 'Seção: Status Detalhado', desc: 'Exibição de selos de auditoria (CONCIL / PEND) para comprovar instantaneamente quais lançamentos já foram conferidos com o extrato bancário.' }
            ]
        },
        {
            title: 'Boas Práticas',
            icon: 'verified',
            color: 'text-orange-500',
            items: [
                { label: 'Data da Nota', desc: 'Sempre registre a data de emissão da NF para bater com o documento físico.' },
                { label: 'Uso de Rubricas', desc: 'Vincule cada gasto à sua rubrica correta para gerar a prestação automática.' }
            ]
        },
        {
            title: 'Segurança e Autenticidade',
            icon: 'verified_user',
            color: 'text-emerald-500',
            items: [
                { label: 'Token de Assinatura (SHA-256)', desc: 'Cada relatório possui uma impressão digital única e irreversível baseada nos dados financeiros e na data de emissão. Se qualquer dado for alterado, o código torna-se inválido.' },
                { label: 'Validação via QR Code', desc: 'Aponte a câmera do celular para o QR Code no rodapé do relatório para abrir o certificado de autenticidade original em nossos servidores.' },
                { label: 'Identidade Única', desc: 'Cada PDF gerado é exclusivo. Mesmo relatórios iguais emitidos em momentos diferentes terão tokens distintos para evitar clonagem de documentos.' }
            ]
        }
    ];

    const getRoleHelp = () => {
        switch (user.role) {
            case 'Administrador':
                return {
                    title: 'Gestão Administrativa',
                    icon: 'admin_panel_settings',
                    color: 'text-rose-500',
                    items: [
                        { label: 'Controle de Acesso', desc: 'Gerencie permissões em Gestão > Permissões e aprove novos usuários em Gestão > Usuários.' },
                        { label: 'Exclusão de Dados', desc: 'Apenas você pode apagar lançamentos definitivamente. Utilize com cautela.' },
                        { label: 'Comunicados', desc: 'No Dashboard, utilize o botão "Comunicado" para enviar avisos globais no sistema.' }
                    ]
                };
            case 'Operador':
                return {
                    title: 'Operação de Lançamentos',
                    icon: 'settings_account_box',
                    color: 'text-indigo-500',
                    items: [
                        { label: 'Lançamentos e Edição', desc: 'Você pode criar e editar qualquer lançamento. Para "excluir", use a função desativar.' },
                        { label: 'Prestação de Contas', desc: 'Vincule as notas fiscais e cotações aos pagamentos realizados para liberar o técnico.' }
                    ]
                };
            case 'Técnico GEE':
                return {
                    title: 'Monitoramento Técnico',
                    icon: 'fact_check',
                    color: 'text-emerald-500',
                    items: [
                        { label: 'Minhas Escolas', desc: 'Você visualiza apenas as escolas vinculadas à sua regional de atuação.' },
                        { label: 'Análise Documental', desc: 'Verifique se as atas e cotações anexadas pelos operadores estão em conformidade.' }
                    ]
                };
            case 'Diretor':
                return {
                    title: 'Visão do Gestor Escolar',
                    icon: 'visibility',
                    color: 'text-amber-500',
                    items: [
                        { label: 'Acompanhamento Real', desc: 'Você tem acesso total à visualização do saldo e extratos da sua escola.' },
                        { label: 'Prestação de Contas', desc: 'Por enquanto, seu acesso é apenas para conferência e emissão de relatórios.' }
                    ]
                };
            default:
                return null;
        }
    };

    const roleHelp = getRoleHelp();

    return (
        <div className="flex flex-col gap-8 w-full max-w-5xl mx-auto animate-in fade-in duration-500 pb-12">
            <div className="flex flex-col gap-2 text-center md:text-left">
                <h1 className="text-4xl font-black tracking-tight text-white flex items-center justify-center md:justify-start gap-3">
                    <span className="material-symbols-outlined text-4xl text-primary">live_help</span>
                    Ajuda & Fluxo de Trabalho
                </h1>
                <p className="text-text-secondary text-lg">Entenda seu papel e as permissões do seu perfil.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* FAQ Style Sections */}
                <div className="md:col-span-2 grid grid-cols-1 gap-6">
                    {/* Role Specific Section */}
                    {roleHelp && (
                        <div className="bg-primary/10 border border-primary/20 rounded-2xl p-8 shadow-xl animate-in zoom-in-95">
                            <div className="flex items-center gap-4 mb-6">
                                <div className={`w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center ${roleHelp.color}`}>
                                    <span className="material-symbols-outlined text-3xl">{roleHelp.icon}</span>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-white">{roleHelp.title}</h2>
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Seu Perfil: {user.role}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                {roleHelp.items.map((item, i) => (
                                    <div key={i} className="bg-black/20 p-5 rounded-2xl border border-white/5">
                                        <h4 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                                            {item.label}
                                        </h4>
                                        <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {helpSections.map((section, idx) => (
                        <div key={idx} className="bg-surface-dark border border-surface-border rounded-2xl p-6 shadow-xl hover:border-primary/30 transition-all group">
                            <div className="flex items-center gap-3 mb-6">
                                <div className={`w-12 h-12 rounded-xl bg-surface-border flex items-center justify-center ${section.color}`}>
                                    <span className="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform">{section.icon}</span>
                                </div>
                                <h2 className="text-xl font-bold text-white uppercase tracking-tight">{section.title}</h2>
                            </div>

                            <div className="flex flex-col gap-3">
                                {section.items.map((item, i) => (
                                    <div key={i} className="flex flex-col gap-1 border-l-2 border-surface-border pl-4 hover:border-primary transition-colors">
                                        <span className="text-sm font-bold text-white">{item.label}</span>
                                        <p className="text-xs text-text-secondary leading-relaxed">{item.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Contact Sidebar */}
                <div className="flex flex-col gap-6">
                    <div className="bg-primary/5 border border-primary/20 rounded-3xl p-8 flex flex-col gap-6 shadow-2xl">
                        <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined text-3xl">support_agent</span>
                        </div>

                        <div>
                            <h3 className="text-xl font-bold text-white">Precisa de Ajuda?</h3>
                            <p className="text-slate-400 text-xs mt-1 leading-relaxed">Nossa equipe de suporte está pronta para te auxiliar com qualquer dúvida técnica ou operacional.</p>
                        </div>

                        <div className="space-y-4 pt-2">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-primary text-lg">mail</span>
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-slate-500 font-bold uppercase">E-mail</span>
                                    <span className="text-sm text-white font-medium">{contacts.email}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-emerald-500 text-lg">phone_iphone</span>
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-slate-500 font-bold uppercase">WhatsApp / Fone</span>
                                    <span className="text-sm text-white font-medium">{contacts.whatsapp || contacts.phone}</span>
                                </div>
                            </div>
                            {contacts.instagram && (
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-rose-400 text-lg">photo_camera</span>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-slate-500 font-bold uppercase">Instagram</span>
                                        <span className="text-sm text-white font-medium">{contacts.instagram}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => setShowSupport(true)}
                            className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 mt-2"
                        >
                            <span className="material-symbols-outlined">chat</span>
                            Abrir Ticket de Suporte
                        </button>
                    </div>

                    <div className="bg-surface-dark border border-surface-border rounded-2xl p-6 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400">
                            <span className="material-symbols-outlined">language</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] text-slate-500 font-bold uppercase">Nosso Site</span>
                            <a href={`http://${contacts.website}`} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">{contacts.website || 'www.brnsuite.com'}</a>
                        </div>
                    </div>
                </div>
            </div>

            <SupportModal
                user={user}
                isOpen={showSupport}
                onClose={() => setShowSupport(false)}
            />

            <footer className="text-center py-8 border-t border-surface-border mt-8">
                <p className="text-text-secondary text-sm">BRN Suite &copy; 2026 - Central de Apoio v1.2</p>
            </footer>
        </div>
    );
};

export default Help;
