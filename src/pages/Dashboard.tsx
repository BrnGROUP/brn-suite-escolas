
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { usePermissions, useAccessibleSchools } from '../hooks/usePermissions';
import { useDashboard } from '../hooks/useDashboard';
import Button from '../components/common/Button';
import DashboardStats from '../components/financial/DashboardStats';
import DashboardCharts from '../components/financial/DashboardCharts';
import DashboardAlerts from '../components/financial/DashboardAlerts';

const Dashboard: React.FC<{ user: User }> = ({ user }) => {
  const {
    isLoading: loading,
    auxData: availableOptions,
    stats,
    flowData,
    pieData,
    alerts,
    filters, setFilters,
    showBroadcast, setShowBroadcast,
    selectedAlert, setSelectedAlert,
    broadcastForm, setBroadcastForm,
    refresh,
    sendBroadcast,
    isSendingBroadcast
  } = useDashboard(user);

  const accessibleSchools = useAccessibleSchools(user, availableOptions.schools);
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Filters Summary & Actions */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4 bg-card-dark/50 p-3 rounded-xl border border-border-dark overflow-x-auto">
          <div className="flex items-center gap-2">
            <Button
              variant={showFilters ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              icon={showFilters ? 'close' : 'filter_list'}
            >
              {showFilters ? 'Fechar Filtros' : 'Filtros Avançados'}
            </Button>

            {!showFilters && (
              <div className="hidden sm:flex items-center gap-2 overflow-x-auto scrollbar-hide">
                {filters.schoolId && filters.schoolId !== (user.schoolId || '') && (
                  <span className="px-2 py-1 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-[10px] font-bold whitespace-nowrap">
                    {availableOptions.schools.find(s => s.id === filters.schoolId)?.name?.substring(0, 15)}...
                  </span>
                )}
                {filters.program && (
                  <span className="px-2 py-1 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-bold whitespace-nowrap">
                    {availableOptions.programs.find(p => p.id === filters.program)?.name}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {user.role === UserRole.ADMIN && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowBroadcast(true)}
                icon="campaign"
                className="text-[10px] font-black uppercase tracking-widest"
              >
                <span className="hidden md:inline">Comunicado</span>
              </Button>
            )}
            {stats.pendencias > 0 && (
              <div className="flex items-center gap-1.5 px-2 md:px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-lg animate-pulse shrink-0">
                <span className="material-symbols-outlined text-orange-500 text-sm">priority_high</span>
                <span className="text-[10px] font-black text-orange-500 uppercase">{stats.pendencias} <span className="hidden sm:inline">Pendentes</span></span>
              </div>
            )}
            <Button
              variant="primary"
              size="md"
              onClick={() => refresh()}
              isLoading={loading}
              icon="refresh"
              className="w-10 h-10 md:w-auto p-0 md:px-5"
            >
              <span className="hidden md:inline">Atualizar</span>
            </Button>
          </div>
        </div>

        {/* Collapsible Filters Area */}
        {showFilters && (
          <div className="bg-[#111a22] border border-surface-border rounded-2xl p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 items-end animate-in fade-in slide-in-from-top-4">
            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-text-secondary text-xs font-semibold uppercase tracking-wider">Escola</label>
              {user.schoolId ? (
                <div className="text-white font-bold capitalize px-3 py-2 bg-background-dark rounded border border-border-dark truncate text-xs">
                  {availableOptions.schools.find(s => s.id === user.schoolId)?.name || 'Minha Escola'}
                </div>
              ) : (
                <>
                  <label htmlFor="dash_school_filter" className="text-text-secondary text-xs font-semibold uppercase tracking-wider">Escola</label>
                  <select
                    id="dash_school_filter"
                    title="Filtrar por Escola"
                    aria-label="Filtrar por Escola"
                    value={filters.schoolId}
                    onChange={(e) => setFilters(prev => ({ ...prev, schoolId: e.target.value }))}
                    className="bg-background-dark text-white border border-border-dark rounded-lg px-3 py-2 text-xs focus:border-primary outline-none"
                  >
                    <option value="">Todas as Escolas</option>
                    {accessibleSchools.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </>
              )}
            </div>

            <div className="flex flex-col gap-1.5 w-full">
              <label htmlFor="dash_program_filter" className="text-text-secondary text-xs font-semibold uppercase tracking-wider">Conta / Programa</label>
              <select
                id="dash_program_filter"
                title="Filtrar por Conta/Programa"
                aria-label="Filtrar por Conta/Programa"
                value={filters.program}
                onChange={(e) => setFilters(prev => ({ ...prev, program: e.target.value, rubric: '' }))}
                className="bg-background-dark text-white border border-border-dark rounded-lg px-3 py-2 text-xs focus:border-primary outline-none"
              >
                <option value="">Todas</option>
                {availableOptions.programs.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5 w-full">
              <label htmlFor="dash_rubric_filter" className="text-text-secondary text-xs font-semibold uppercase tracking-wider">Rubrica</label>
              <select
                id="dash_rubric_filter"
                title="Filtrar por Rubrica"
                aria-label="Filtrar por Rubrica"
                value={filters.rubric}
                onChange={(e) => setFilters(prev => ({ ...prev, rubric: e.target.value }))}
                className="bg-background-dark text-white border border-border-dark rounded-lg px-3 py-2 text-xs focus:border-primary outline-none"
              >
                <option value="">Todas</option>
                <option value="none">Nenhuma / Natureza Direta</option>
                {availableOptions.rubrics
                  .filter(r => !filters.program || r.program_id === filters.program)
                  .filter(r => {
                    const activeSchool = user.schoolId || filters.schoolId;
                    return !activeSchool || !r.school_id || r.school_id === activeSchool;
                  })
                  .map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5 w-full">
              <label htmlFor="dash_nature_filter" className="text-text-secondary text-xs font-semibold uppercase tracking-wider">Natureza</label>
              <select
                id="dash_nature_filter"
                title="Filtrar por Natureza"
                aria-label="Filtrar por Natureza"
                value={filters.nature}
                onChange={(e) => setFilters(prev => ({ ...prev, nature: e.target.value }))}
                className="bg-background-dark text-white border border-border-dark rounded-lg px-3 py-2 text-xs focus:border-primary outline-none"
              >
                <option value="">Todas</option>
                <option value="Custeio">Custeio</option>
                <option value="Capital">Capital</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="w-full text-xs"
                onClick={() => setFilters({ schoolId: user.schoolId || '', program: '', rubric: '', nature: '', supplier: '' })}
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        )}
      </div>

      <DashboardStats stats={stats} loading={loading} />

      <DashboardCharts flowData={flowData} pieData={pieData} />

      <DashboardAlerts
        alerts={alerts}
        selectedAlert={selectedAlert}
        setSelectedAlert={setSelectedAlert}
      />

      {/* Broadcast Modal */}
      {showBroadcast && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-lg bg-[#0f172a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-white/5 bg-primary/5 flex justify-between items-center text-primary">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined font-black">campaign</span>
                <h3 className="font-bold">Comunicado aos Usuários</h3>
              </div>
              <button onClick={() => setShowBroadcast(false)} className="text-slate-500 hover:text-white"><span className="material-symbols-outlined">close</span></button>
            </div>

            <div className="p-8 flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label htmlFor="broadcast_target" className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Público Alvo</label>
                <select
                  id="broadcast_target"
                  title="Selecionar público alvo do comunicado"
                  aria-label="Selecionar público alvo do comunicado"
                  value={broadcastForm.targetRole}
                  onChange={e => setBroadcastForm({ ...broadcastForm, targetRole: e.target.value })}
                  className="bg-background-dark text-white border border-border-dark rounded-xl px-4 py-3 text-sm focus:border-primary outline-none"
                >
                  <option value="Todos">Todos os Usuários</option>
                  {Object.values(UserRole).map(role => <option key={role} value={role}>{role}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Título do Comunicado</label>
                <input
                  type="text"
                  value={broadcastForm.title}
                  onChange={e => setBroadcastForm({ ...broadcastForm, title: e.target.value.toUpperCase() })}
                  className="bg-background-dark text-white border border-border-dark rounded-xl px-4 py-3 text-sm focus:border-primary outline-none"
                  placeholder="ASSUNTO DA MENSAGEM"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Conteúdo da Mensagem</label>
                <textarea
                  rows={4}
                  value={broadcastForm.message}
                  onChange={e => setBroadcastForm({ ...broadcastForm, message: e.target.value })}
                  className="bg-background-dark text-white border border-border-dark rounded-xl px-4 py-3 text-sm focus:border-primary outline-none resize-none"
                  placeholder="Escreva aqui as orientações ou avisos importantes..."
                />
              </div>

              <Button
                variant="primary"
                size="lg"
                onClick={() => sendBroadcast()}
                isLoading={isSendingBroadcast}
                icon="send"
              >
                Disparar Mensagem Agora
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
