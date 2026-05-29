
import React, { useState } from 'react';
import { User, AccountabilityProcess, UserRole } from '../types';
import { printDocument, getContractPrintTitle } from '../lib/printUtils';
import { 
  generateAtaHTML, 
  generateConsolidacaoHTML, 
  generateOrdemHTML, 
  generateReciboHTML, 
  generateCotacaoHTML, 
  generateContratoServicoHTML,
  generateContratoGasHTML,
  generateAditivoHTML
} from '../lib/documentTemplates';
import { supabase } from '../lib/supabaseClient';
import { usePermissions, useAccessibleSchools } from '../hooks/usePermissions';
import { useReports } from '../hooks/useReports';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { formatCurrency } from '../lib/printUtils';

// Subcomponents
import ReportsTable from '../components/reports/ReportsTable';
import AccountabilityProcessModal from '../components/reports/AccountabilityProcessModal';
import SupplierContractModal from '../components/reports/SupplierContractModal';
import ContractsTable from '../components/reports/ContractsTable';

const Reports: React.FC<{ user: User }> = ({ user }) => {
  // UI State
  const [showNewProcessModal, setShowNewProcessModal] = useState(false);
  const [showNewContractModal, setShowNewContractModal] = useState(false);
  const [editingProcessId, setEditingProcessId] = useState<string | null>(null);
  const [editingContractId, setEditingContractId] = useState<string | null>(null);
  const [view, setView] = useState<'processes' | 'contracts'>('processes');
  const { addToast } = useToast();
  const { confirm } = useConfirm();

  // Filters
  const [filters, setFilters] = useState({
    schoolId: '',
    programId: '',
    status: '',
    search: '',
    startDate: '',
    endDate: ''
  });

  // Data Hook
  const {
    loading,
    processes,
    contracts,
    availableEntries,
    suppliers,
    schools,
    programs,
    templateUrl,
    stats,
    refresh
  } = useReports(user, filters);

  // Permissions
  const reportPerm = usePermissions(user, 'reports');
  const accessibleSchools = useAccessibleSchools(user, schools);

  const handlePrint = (process: AccountabilityProcess, type: string) => {
    try {
      let html = '';
      
      switch (type) {
        case 'ata':
          html = generateAtaHTML(process);
          break;
        case 'ordem':
          html = generateOrdemHTML(process);
          break;
        case 'consolidacao':
          html = generateConsolidacaoHTML(process);
          break;
        case 'recibo':
          html = generateReciboHTML(process);
          break;
        case 'cotacao1':
          html = generateCotacaoHTML(process, 0);
          break;
        case 'cotacao2':
          html = generateCotacaoHTML(process, 1);
          break;
        case 'cotacao3':
          html = generateCotacaoHTML(process, 2);
          break;
        case 'contrato':
          html = generateContratoServicoHTML(process);
          break;
        default:
          return;
      }
      const printTitle = type === 'contrato' ? getContractPrintTitle(process) : undefined;
      printDocument(html, printTitle);
    } catch (error: any) {
      addToast(error.message, 'error');
    }
  };

  const handlePrintContract = (contract: any) => {
    try {
      // Wrap contract in a structure similar to process for the template
      const pseudoProcess = {
        id: contract.id,
        contract: contract,
        financial_entries: [{
          schools: contract.schools,
          suppliers: contract.suppliers,
          programs: contract.programs,
          rubrics: contract.rubrics,
          description: contract.description,
          date: contract.start_date,
          category: contract.category
        }]
      };

      let html = '';
      if (contract.terms_json?.is_aditivo) {
        html = generateAditivoHTML(pseudoProcess);
      } else if (contract.category === 'GÁS') {
        html = generateContratoGasHTML(pseudoProcess);
      } else {
        html = generateContratoServicoHTML(pseudoProcess);
      }
      
      printDocument(html, getContractPrintTitle(pseudoProcess));
    } catch (error: any) {
      addToast(error.message, 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!await confirm({
      title: 'Excluir Prestação de Contas',
      message: 'Tem certeza que deseja excluir esta prestação de contas? Esta ação é irreversível.',
      isDestructive: true
    })) return;

    const { error } = await supabase.from('accountability_processes').delete().eq('id', id);

    if (error) {
      addToast('Erro ao excluir: ' + error.message, 'error');
    } else {
      addToast('Excluído com sucesso.', 'success');
      refresh();
    }
  };

  const handleDeleteContract = async (id: string) => {
    if (!await confirm({
      title: 'Excluir Contrato de Fornecedor',
      message: 'Tem certeza que deseja excluir este contrato? Isso não excluirá os lançamentos vinculados.',
      isDestructive: true
    })) return;

    const { error } = await supabase.from('supplier_contracts').delete().eq('id', id);

    if (error) {
      addToast('Erro ao excluir contrato: ' + error.message, 'error');
    } else {
      addToast('Contrato excluído com sucesso.', 'success');
      refresh();
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full p-4 md:p-8 max-w-7xl mx-auto animate-in fade-in duration-500 pb-32">
      {/* Header Area */}
      <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black text-white">Prestação de Contas</h1>
          <p className="text-slate-400 text-sm">Controle de cotações, itens de nota e finalização documental.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 lg:gap-3">
          {/* View Toggle */}
          <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
            <button
              onClick={() => setView('processes')}
              className={`px-4 md:px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'processes' ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
            >
              Prestações
            </button>
            <button
              onClick={() => setView('contracts')}
              className={`px-4 md:px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'contracts' ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
            >
              Contratos
            </button>
          </div>

          {/* Action Buttons */}
          {reportPerm.canCreate && user.role !== UserRole.DIRETOR && (
            <div className="flex items-center gap-2 md:gap-3 flex-wrap">
              <button
                onClick={() => setShowNewContractModal(true)}
                className="h-12 px-4 md:px-6 bg-white/5 hover:bg-white/10 text-white rounded-2xl flex items-center gap-2 transition-all border border-white/10 group whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform text-xl">history_edu</span>
                <span className="text-[10px] font-black uppercase tracking-widest">Contrato</span>
              </button>

              <button
                onClick={() => {
                  setEditingProcessId(null);
                  setShowNewProcessModal(true);
                }}
                className="h-12 px-4 md:px-6 bg-primary hover:bg-primary-hover text-white rounded-2xl flex items-center gap-2 shadow-xl shadow-primary/20 active:scale-95 transition-all group whitespace-nowrap"
              >
                <span className="material-symbols-outlined group-hover:rotate-12 transition-transform text-xl">add_circle</span>
                <span className="text-[10px] font-black uppercase tracking-widest">Nova Prestação</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Warning Area */}
      {availableEntries.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-red-500">warning</span>
            <span className="text-sm font-bold text-red-200">
              Atenção: Existem {availableEntries.length} lançamentos aguardando prestação de contas.
            </span>
          </div>
          <button onClick={() => { setEditingProcessId(null); setShowNewProcessModal(true); }} className="text-xs bg-red-500 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-red-600 transition-colors">
            Resolver Agora
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {(view === 'contracts' ? [
          { label: 'Contratos Ativos', val: stats.activeContracts || 0, icon: 'history_edu', color: 'amber' },
          { label: 'Total Contratado', val: formatCurrency(stats.totalContracted || 0), icon: 'account_balance_wallet', color: 'emerald' },
          { label: 'Total Executado', val: formatCurrency(stats.totalExecuted || 0), icon: 'payments', color: 'blue' },
          { label: 'Saldo Restante', val: formatCurrency(stats.remainingBalance || 0), icon: 'savings', color: 'cyan' },
        ] : [
          { label: 'Processos em Aberto', val: stats.pendingProcesses, icon: 'pending_actions', color: 'amber' },
          { label: 'Processos Concluídos', val: stats.completedProcesses, icon: 'verified', color: 'emerald' },
          { label: 'Total em Notas', val: formatCurrency(stats.totalNotesValue), icon: 'receipt', color: 'blue' },
          { label: 'Cotações Realizadas', val: stats.totalQuotes, icon: 'request_quote', color: 'cyan' },
        ]).map((s, idx) => {
          const colorClasses = {
            amber: { bg: 'bg-amber-500/10', text: 'text-amber-500' },
            emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-500' },
            blue: { bg: 'bg-blue-500/10', text: 'text-blue-500' },
            cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-500' }
          }[s.color] || { bg: 'bg-cyan-500/10', text: 'text-cyan-500' };

          return (
            <div key={idx} className="bg-[#111a22] p-6 rounded-3xl border border-white/5 flex items-center gap-5 hover:border-primary/20 transition-all group">
              <div className={`w-14 h-14 rounded-2xl ${colorClasses.bg} flex items-center justify-center ${colorClasses.text} shrink-0 group-hover:scale-110 transition-transform`}>
                <span className="material-symbols-outlined text-3xl">{s.icon}</span>
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1 truncate">{s.label}</span>
                <span className="text-xl font-black text-white block truncate">{s.val}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter Bar */}
      <div className="bg-[#111a22] border border-surface-border rounded-2xl p-4 md:p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 items-end">
        <div className="flex flex-col gap-2">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest ml-1">Escola</label>
            <select
                title="Filtrar por Escola"
                aria-label="Filtrar por Escola"
                value={filters.schoolId}
                onChange={(e) => setFilters({ ...filters, schoolId: e.target.value })}
                className="w-full h-11 bg-black/40 border border-white/10 rounded-xl px-4 text-xs text-white outline-none focus:border-primary transition-all"
            >
                <option value="">Todas as Escolas</option>
                {accessibleSchools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
        </div>
        <div className="flex flex-col gap-2">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest ml-1">Programa</label>
            <select
                title="Filtrar por Programa"
                aria-label="Filtrar por Programa"
                value={filters.programId}
                onChange={(e) => setFilters({ ...filters, programId: e.target.value })}
                className="w-full h-11 bg-black/40 border border-white/10 rounded-xl px-4 text-xs text-white outline-none focus:border-primary transition-all"
            >
                <option value="">Todos os Programas</option>
                {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
        </div>
        <div className="flex flex-col gap-2">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest ml-1">Status</label>
            <select
                title="Filtrar por Status"
                aria-label="Filtrar por Status"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full h-11 bg-black/40 border border-white/10 rounded-xl px-4 text-xs text-white outline-none focus:border-primary transition-all"
            >
                <option value="">Todos os Status</option>
                <option value="Em Andamento">Em Andamento</option>
                <option value="Concluído">Concluído</option>
            </select>
        </div>
        <div className="flex flex-col gap-2">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest ml-1">Busca Rápida</label>
            <input
                placeholder="Filtrar por descrição..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full h-11 bg-black/40 border border-white/10 rounded-xl px-4 text-xs text-white outline-none focus:border-primary transition-all"
            />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilters({ schoolId: '', programId: '', status: '', search: '', startDate: '', endDate: '' })}
            className="w-full bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest h-11 rounded-xl hover:bg-slate-700 transition-all active:scale-95"
          >
            Limpar Filtros
          </button>
        </div>
      </div>

      {/* List Section */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-surface-dark border border-surface-border rounded-2xl animate-pulse"></div>
          ))}
        </div>
      ) : view === 'processes' ? (
        <ReportsTable
          processes={processes}
          onEdit={(p) => { setEditingProcessId(p.id); setShowNewProcessModal(true); }}
          onDelete={handleDelete}
          onPrint={handlePrint}
        />
      ) : (
        <ContractsTable
          contracts={contracts}
          onDelete={handleDeleteContract}
          onEdit={(c) => { setEditingContractId(c.id); setShowNewContractModal(true); }}
          onPrint={handlePrintContract}
        />
      )}

      {/* Modals */}
      <AccountabilityProcessModal
        isOpen={showNewProcessModal}
        onClose={() => setShowNewProcessModal(false)}
        user={user}
        editingId={editingProcessId}
        onSave={refresh}
        auxData={{
          schools,
          programs,
          suppliers,
          templateUrl,
          availableEntries
        }}
      />

      <SupplierContractModal
        isOpen={showNewContractModal}
        onClose={() => { setShowNewContractModal(false); setEditingContractId(null); }}
        user={user}
        auxData={{ schools, programs, suppliers }}
        onSave={refresh}
        editingId={editingContractId}
      />
    </div>
  );
};

export default Reports;
