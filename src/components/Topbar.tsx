import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../types';
import { supabase } from '../lib/supabaseClient';
import HelpModal from './common/HelpModal';

interface TopbarProps {
  user: User;
  activePageName: string;
  onOpenMobileMenu?: () => void;
}

const HELP_CONTENT: Record<string, { title: string, description: string, sections: any[] }> = {
  dashboard: {
    title: "Painel de Controle",
    description: "Monitoramento Estratégico e Saúde Bancária",
    sections: [
      {
        title: "Visão Geral de Ganhos e Gastos",
        icon: "insights",
        items: [
          { label: "Receita", desc: "Soma de todos os repasses, rendimentos e doações do período selecionado." },
          { label: "Despesa", desc: "Total de pagamentos e saídas confirmadas." },
          { label: "Saldo Real", desc: "Diferença entre receita e despesa, somando o saldo reprogramado." }
        ]
      },
      {
        title: "Sistema de Alertas",
        icon: "warning",
        items: [
          { label: "Pendências Antigas", desc: "Avisos sobre lançamentos pendentes que podem ter sido esquecidos no banco." },
          { label: "Falta de Prestação", desc: "Identifica pagamentos confirmados sem documentação anexada." }
        ]
      }
    ]
  },
  entries: {
    title: "Manual de Lançamentos",
    description: "Gestão de Entradas, Saídas e Rateios",
    sections: [
      {
        title: "Fluxo de Trabalho",
        icon: "account_tree",
        items: [
          { label: "Status", desc: "Pendentes (aguardando), Pagos (concluídos no banco), Conciliados (conferidos no extrato)." },
          { label: "Rateio", desc: "Use quando um único pagamento deve ser dividido entre diferentes rubricas." }
        ]
      },
      {
        title: "Segurança",
        icon: "security",
        items: [
          { label: "Exclusão", desc: "Operadores desativam lançamentos. Apenas Admins excluem permanentemente." },
          { label: "Auditoria", desc: "Cada modificação gera um registro no histórico para rastreabilidade." }
        ]
      }
    ]
  },
  reports: {
    title: "Guia de Prestação de Contas",
    description: "Fluxo Documental e Cotações",
    sections: [
      {
        title: "Processo de Cotação",
        icon: "payments",
        items: [
          { label: "Mínimo de Orçamentos", desc: "Todo processo exige no mínimo 3 cotações de fornecedores distintos." },
          { label: "Vencedor", desc: "O sistema seleciona o menor preço. Justifique caso escolha outro." }
        ]
      },
      {
        title: "Documentação",
        icon: "fact_check",
        items: [
          { label: "Documentos", desc: "Gere Ata, Mapa e Ordem de Compra automaticamente após as cotações." },
          { label: "Checklist", desc: "Certifique-se de anexar Notas Fiscais e Certidões vigentes." }
        ]
      }
    ]
  },
  schools: {
    title: "Gestão de Escolas",
    description: "Configuração de Unidades",
    sections: [
      {
        title: "Cadastro e Acesso",
        icon: "school",
        items: [
          { label: "Dados Oficiais", desc: "Mantenha CNPJ e Códigos INEP/SEEC atualizados para os relatórios." },
          { label: "Regionais", desc: "Vincule a escola a um GEE para monitoramento técnico correto." }
        ]
      }
    ]
  },
  users: {
    title: "Gestão de Usuários",
    description: "Controle de Acessos e Perfis",
    sections: [
      {
        title: "Aprovação e Perfis",
        icon: "manage_accounts",
        items: [
          { label: "Novos Usuários", desc: "Aprove ou rejeite cadastros pendentes. Defina o papel (ADM, Diretor, etc.) corretamente." },
          { label: "Vínculo Escolar", desc: "Certifique-se de associar diretores e técnicos às suas respectivas escolas ou regionais." }
        ]
      }
    ]
  },
  reconciliation: {
    title: "Conciliação Bancária",
    description: "Sincronização com Extrato OFX/CSV",
    sections: [
      {
        title: "Processo de Importação",
        icon: "upload_file",
        items: [
          { label: "Formatos", desc: "Importe extratos em formato OFX ou CSV gerados pelo seu Internet Banking." },
          { label: "Manual de Match", desc: "O sistema tenta cruzar valores automaticamente. Use o manual para ajustes finos." }
        ]
      }
    ]
  },
  vault: {
    title: "Cofre de Documentos",
    description: "Repositório Seguro de Arquivos",
    sections: [
      {
        title: "Organização",
        icon: "folder",
        items: [
          { label: "Pesquisa Rápida", desc: "Localize notas fiscais, atas e comprovantes por escola ou período." },
          { label: "Segurança", desc: "Documentos aqui armazenados são protegidos por criptografia e backups diários." }
        ]
      }
    ]
  }
};

const Topbar: React.FC<TopbarProps> = ({ user, activePageName, onOpenMobileMenu }) => {
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  const pageTitles: Record<string, string> = {
    dashboard: 'Visão Geral',
    entries: 'Lançamentos Financeiros',
    reports: 'Relatórios & Auditoria',
    settings: 'Configurações do Sistema',
    schools: 'Gestão de Escolas',
    help: 'Ajuda & Suporte',
    waiting: 'Introdução ao Sistema',
    users: 'Gestão de Usuários',
    vault: 'Cofre de Documentos',
    reconciliation: 'Conciliação Bancária',
    gee: 'Regionais (GEE)',
    notifications: 'Central de Alertas'
  };

  useEffect(() => {
    fetchNotifications();
    const subscription = supabase
      .channel('notifications_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, () => {
        fetchNotifications();
      })
      .subscribe();

    return () => { supabase.removeChannel(subscription); };
  }, [user.id]);

  const fetchNotifications = async () => {
    setLoadingNotifications(true);
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (data) setNotifications(data);
    setLoadingNotifications(false);
  };

  const getBreadcrumbs = () => {
    const categories: Record<string, { label: string, icon: string }> = {
      dashboard: { label: 'Operações', icon: 'dashboard' },
      entries: { label: 'Operações', icon: 'receipt_long' },
      reports: { label: 'Operações', icon: 'description' },
      vault: { label: 'Operações', icon: 'folder_managed' },
      reconciliation: { label: 'Operações', icon: 'account_balance' },
      schools: { label: 'Gestão', icon: 'school' },
      gee: { label: 'Gestão', icon: 'map' },
      users: { label: 'Gestão', icon: 'group' },
      notifications: { label: 'Suporte', icon: 'notifications' },
      settings: { label: 'Suporte', icon: 'settings' },
      help: { label: 'Suporte', icon: 'help' },
      waiting: { label: 'Início', icon: 'hourglass_empty' }
    };

    const cat = categories[activePageName] || { label: 'Sistema', icon: 'grid_view' };
    const page = pageTitles[activePageName] || 'Página';

    return (
      <nav className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-black text-slate-500 mb-1">
        <span className="material-symbols-outlined text-[14px]">{cat.icon}</span>
        <span>{cat.label}</span>
        <span className="text-slate-700">/</span>
        <span className="text-primary">{page}</span>
      </nav>
    );
  };

  return (
    <>
      <header className="flex items-center justify-between border-b border-white/5 bg-[#0f172a]/80 backdrop-blur-xl px-4 md:px-6 py-4 sticky top-0 z-[55]">
        <div className="flex items-center gap-4">
          {/* Mobile Menu Button */}
          <button
            onClick={onOpenMobileMenu}
            className="md:hidden text-white p-1 hover:bg-white/10 rounded-lg"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>

          <div className="flex flex-col">
            {getBreadcrumbs()}
            <h2 className="text-white text-xl font-black tracking-tight leading-none overflow-hidden truncate">
              {pageTitles[activePageName] || 'BRN Suite'}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-4 md:gap-6">
          <div className="flex items-center gap-3 relative">

            {/* Notifications Button */}
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`relative flex h-10 w-10 items-center justify-center rounded-lg border transition-colors ${showNotifications ? 'bg-primary text-white border-primary' : 'bg-[#1e293b] border-white/5 text-white hover:bg-white/10'}`}
            >
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              {notifications.filter(n => !n.is_read).length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black text-white ring-2 ring-[#0f172a] shadow-lg animate-pulse">
                  {notifications.filter(n => !n.is_read).length}
                </span>
              )}
            </button>

            {/* Notifications Popup */}
            {showNotifications && (
              <div className="absolute top-12 right-0 w-80 bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-20 animate-in fade-in slide-in-from-top-2">
                <div className="p-4 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
                  <span className="text-xs font-black text-white uppercase tracking-widest">Alertas Recentes</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-black">{notifications.filter(n => !n.is_read).length} NOVOS</span>
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto custom-scrollbar">
                  {loadingNotifications ? (
                    <div className="p-8 text-center"><span className="material-symbols-outlined animate-spin text-primary">sync</span></div>
                  ) : notifications.length === 0 ? (
                    <div className="p-10 text-center text-slate-500">
                      <span className="material-symbols-outlined text-4xl mb-2 opacity-20">notifications_off</span>
                      <p className="text-xs italic">Nenhum alerta recente.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col divide-y divide-white/5">
                      {notifications.map((n) => (
                        <div key={n.id} className={`p-4 transition-colors flex gap-3 ${!n.is_read ? 'bg-primary/5' : 'opacity-60'}`}>
                          <div className={`mt-0.5 rounded-lg w-8 h-8 flex items-center justify-center ${n.type === 'error' ? 'bg-red-500/20 text-red-500' :
                            n.type === 'warning' ? 'bg-amber-500/20 text-amber-500' :
                              n.type === 'success' ? 'bg-emerald-500/20 text-emerald-500' :
                                'bg-blue-500/20 text-blue-500'
                            }`}>
                            <span className="material-symbols-outlined text-sm">{
                              n.type === 'error' ? 'error' :
                                n.type === 'warning' ? 'warning' :
                                  n.type === 'success' ? 'check_circle' :
                                    'info'
                            }</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold text-white truncate">{n.title}</h4>
                            <p className="text-[10px] text-slate-400 leading-tight mt-0.5 line-clamp-2">{n.message}</p>
                            <span className="text-[9px] text-slate-600 mt-1 block font-mono">{new Date(n.created_at).toLocaleTimeString('pt-BR')}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="p-3 bg-white/[0.02] border-t border-white/5 text-center">
                  <button
                    onClick={() => { setShowNotifications(false); navigate('/notifications'); }}
                    className="text-[10px] font-black text-primary uppercase hover:underline tracking-widest"
                  >
                    Ver todas as notificações
                  </button>
                </div>
              </div>
            )}

            {/* Help Button */}
            <button
              onClick={() => setShowHelp(true)}
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1e293b] border border-white/5 text-white hover:bg-white/10 transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">contact_support</span>
            </button>

          </div>
        </div>
      </header>

      {/* Help Modal */}
      {HELP_CONTENT[activePageName] && (
        <HelpModal
          isOpen={showHelp}
          onClose={() => setShowHelp(false)}
          title={HELP_CONTENT[activePageName].title}
          description={HELP_CONTENT[activePageName].description}
          sections={HELP_CONTENT[activePageName].sections}
        />
      )}
    </>
  );
};

export default Topbar;
