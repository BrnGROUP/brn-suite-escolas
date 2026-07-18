
import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { generateRelatorioGerencialHTML } from '../lib/reportUtils';
import { TransactionStatus, User, UserRole } from '../types';
import { usePermissions, useAccessibleSchools } from '../hooks/usePermissions';
import StatsCards from '../components/financial/StatsCards';
import FilterBar from '../components/financial/FilterBar';
import FinancialTable from '../components/financial/FinancialTable';
import { useFinancialEntries, FinancialEntryExtended } from '../hooks/useFinancialEntries';
import ReprogrammedBalancesModal from '../components/financial/ReprogrammedBalancesModal';
import EntryFormModal from '../components/financial/EntryFormModal';
import ReportOptionsModal from '../components/reports/ReportOptionsModal';
import { generateCSV, ReportOptions } from '../lib/reportUtils';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { updateContractStatusFromEntries } from '../lib/contractStatusHelper';

const FinancialEntries: React.FC<{ user: User }> = ({ user }) => {
    const { confirm } = useConfirm();
    // Search and Filter States
    const [filters, setFilters] = useState({
        school: '',
        program: '',
        supplier: '',
        startDate: '',
        endDate: '',
        nature: '',
        search: ''
    });
    const [quickFilter, setQuickFilter] = useState('all');

    // Hook for data fetching and management
    const {
        entries,
        stats,
        auxData,
        loading,
        reprogrammedBalances,
        fetchReprogrammedBalances,
        refresh
    } = useFinancialEntries(user, { ...filters, quick: quickFilter });

    // UI States
    const [showForm, setShowForm] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [showReprogrammedModal, setShowReprogrammedModal] = useState(false);
    const [showReportOptions, setShowReportOptions] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // Editing state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingBatchId, setEditingBatchId] = useState<string | null>(null);

    // Destructure auxData
    const { schools, programs, rubrics, periods } = auxData;

    // Permissions and accessibility
    const entryPerm = usePermissions(user, 'entries');
    const accessibleSchools = useAccessibleSchools(user, schools);

    const { addToast } = useToast();

    const handleEdit = (entry: FinancialEntryExtended) => {
        if (entry.is_locked && user.role !== UserRole.ADMIN) {
            addToast('Este lançamento está travado por um fechamento semestral e não pode ser editado.', 'warning');
            return;
        }
        setEditingId(entry.id);
        setEditingBatchId(entry.batch_id || null);
        setShowForm(true);
    };

    const handleDelete = async (entry: FinancialEntryExtended) => {
        if (entry.is_locked && user.role !== UserRole.ADMIN) {
            addToast('Este lançamento está travado por um fechamento semestral e não pode ser excluído.', 'warning');
            return;
        }
        if (!await confirm({
            title: entry.is_locked ? 'Excluir Lançamento Travado (Aviso de Admin)' : 'Excluir Lançamento',
            message: entry.is_locked 
                ? 'ATENÇÃO: Este lançamento está travado por um fechamento semestral. Deseja realmente excluí-lo? Esta ação será registrada no log de auditoria.'
                : 'Tem certeza de que deseja excluir este lançamento? Esta ação não pode ser desfeita.',
            isDestructive: true
        })) return;
        const { error } = await supabase.from('financial_entries').delete().eq('id', entry.id);

        if (error) {
            addToast(`Erro: ${error.message}`, 'error');
        } else {
            if (entry.is_locked) {
                await supabase.from('audit_logs').insert({
                    user_name: user.name,
                    action: 'DELETE_LOCKED',
                    details: `ADMIN BYPASS: Lançamento travado pelo fechamento ID ${entry.locked_by_closure_id || 'N/A'} excluído. Descrição: ${entry.description}, Valor: ${entry.value}, Data: ${entry.date}`
                });
            }
            if (entry.contract_id) {
                await updateContractStatusFromEntries(entry.contract_id);
            }
            addToast('Lançamento excluído com sucesso', 'success');
            refresh();
        }
    };

    const onToggleSelect = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const onToggleSelectAll = () => {
        setSelectedIds(prev => prev.length === entries.length ? [] : entries.map(e => e.id));
    };

    const handleBulkDelete = async () => {
        const selectedEntries = entries.filter(e => selectedIds.includes(e.id));
        const hasLocked = selectedEntries.some(e => e.is_locked);
        if (hasLocked && user.role !== UserRole.ADMIN) {
            addToast('Um ou mais lançamentos selecionados estão travados por um fechamento semestral e não podem ser excluídos.', 'warning');
            return;
        }
        if (!await confirm({
            title: hasLocked ? 'Excluir Lançamentos Travados (Aviso de Admin)' : 'Excluir Lançamentos Selecionados',
            message: hasLocked
                ? `ATENÇÃO: Dentre os selecionados, existem lançamentos travados por fechamento semestral. Deseja realmente excluir todos os ${selectedIds.length} lançamentos selecionados? Esta ação será registrada no log de auditoria.`
                : `Tem certeza de que deseja excluir os ${selectedIds.length} lançamentos selecionados? Esta ação não pode ser desfeita.`,
            isDestructive: true
        })) return;
        const contractIdsToUpdate = Array.from(
            new Set(selectedEntries.map(e => e.contract_id).filter(Boolean))
        );

        const { error } = await supabase.from('financial_entries').delete().in('id', selectedIds);
        if (error) {
            addToast(`Erro: ${error.message}`, 'error');
        } else {
            // Audit log for locked entries
            const lockedEntries = selectedEntries.filter(e => e.is_locked);
            if (lockedEntries.length > 0) {
                const details = lockedEntries.map(e => `[Desc: ${e.description}, Val: ${e.value}, Data: ${e.date}, Fechamento ID: ${e.locked_by_closure_id || 'N/A'}]`).join('; ');
                await supabase.from('audit_logs').insert({
                    user_name: user.name,
                    action: 'BULK_DELETE_LOCKED',
                    details: `ADMIN BYPASS: Exclusão em lote de ${lockedEntries.length} lançamento(s) travado(s): ${details}`
                });
            }
            for (const cid of contractIdsToUpdate) {
                await updateContractStatusFromEntries(cid);
            }
            addToast(`${selectedIds.length} lançamentos excluídos!`, 'success');
            setSelectedIds([]);
            refresh();
        }
    };

    const handleExport = async (options: ReportOptions) => {
        setShowReportOptions(false);
        try {
            let exportEntries = entries;
            let exportReprogrammed = reprogrammedBalances;

            const filtersChanged =
                options.filterSchool !== filters.school ||
                options.filterProgram !== filters.program ||
                options.filterStartDate !== filters.startDate ||
                options.filterEndDate !== filters.endDate;

            if (filtersChanged) {
                // Fetch specific data for report to avoid affecting main list UI
                let query = supabase
                    .from('financial_entries')
                    .select('*, schools(name, inep), programs(name), rubrics(name), suppliers(name)')
                    .order('date', { ascending: true });

                if (options.filterSchool) query = query.eq('school_id', options.filterSchool);
                if (options.filterProgram) query = query.eq('program_id', options.filterProgram);
                if (options.filterStartDate) query = query.gte('date', options.filterStartDate);
                if (options.filterEndDate) query = query.lte('date', options.filterEndDate);

                const { data, error } = await query;
                if (error) throw error;

                // Format for consistency
                exportEntries = (data || []).map(e => ({
                    ...e,
                    school: e.schools?.name,
                    inep: e.schools?.inep || '',
                    program: e.programs?.name,
                    rubric: e.rubrics?.name,
                    supplier: e.suppliers?.name
                }));
            }

            // Always filter reprogrammed balances to match report scope
            exportReprogrammed = reprogrammedBalances.filter((r: any) => {
                const schoolMatch = !options.filterSchool || r.school_id === options.filterSchool;
                const programMatch = !options.filterProgram || r.program_id === options.filterProgram;
                return schoolMatch && programMatch;
            });

            // Recalculate stats for the report specifically
            const exportStats = {
                income: 0,
                expense: 0,
                balance: 0,
                reprogrammed: exportReprogrammed.reduce((acc, r: any) => acc + Number(r.value || 0), 0)
            };

            exportEntries.forEach(e => {
                const val = Math.abs(e.value);
                if (e.type === 'Entrada') exportStats.income += val;
                else exportStats.expense += val;
            });
            exportStats.balance = exportStats.income - exportStats.expense;

            if (options.format === 'csv') {
                generateCSV(exportEntries);
                addToast('Planilha Excel gerada com sucesso!', 'success');
                return;
            }

            const html = await generateRelatorioGerencialHTML(exportEntries, exportStats, filters, exportReprogrammed, options);
            const win = window.open('', '_blank');
            if (win) {
                win.document.write(html);
                win.document.close();
            }
        } catch (err) {
            console.error('Export Error:', err);
            addToast('Erro ao gerar relatório', 'error');
        }
    };

    const reconcileEntries = async (ids: string[]) => {
        if (!await confirm({
            title: 'Conciliar Lançamentos',
            message: `Deseja realmente conciliar os ${ids.length} lançamentos selecionados? Isso consolidará os registros no sistema.`
        })) return;
        const { error } = await supabase.from('financial_entries').update({ status: TransactionStatus.CONCILIADO }).in('id', ids);
        if (error) {
            addToast(`Erro: ${error.message}`, 'error');
        } else {
            addToast(`${ids.length} lançamentos conciliados`, 'success');
        }
        setSelectedIds([]);
        refresh();
    };

    return (
        <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500 pb-32">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                        <span className="material-symbols-outlined text-3xl">account_balance</span>
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tight">Movimentação Financeira</h1>
                        <p className="text-slate-500 font-medium">Gestão de entradas e saídas de recursos</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    {entryPerm.canCreate && (
                        <button
                            onClick={() => { setEditingId(null); setEditingBatchId(null); setShowForm(true); }}
                            className="bg-primary hover:bg-primary-hover text-white font-black px-6 py-3 rounded-2xl flex items-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-95 flex-1 md:flex-none justify-center"
                        >
                            <span className="material-symbols-outlined">add_circle</span>
                            Novo Lançamento
                        </button>
                    )}
                    <button
                        onClick={() => setShowReprogrammedModal(true)}
                        className="bg-surface-dark hover:bg-white/5 text-slate-400 hover:text-white font-black px-6 py-3 rounded-2xl flex items-center gap-2 border border-white/5 transition-all flex-1 md:flex-none justify-center"
                    >
                        <span className="material-symbols-outlined">restart_alt</span>
                        Saldos Reprogramados
                    </button>
                </div>
            </div>

            {/* Stats Summary */}
            <StatsCards stats={stats} />

            {/* Main Action Bar */}
            <div className="bg-surface-dark border border-white/5 rounded-[2rem] shadow-2xl overflow-hidden">
                <div className="p-4 md:p-6 space-y-6">
                    <FilterBar
                        filters={filters}
                        setFilters={setFilters}
                        quickFilter={quickFilter}
                        setQuickFilter={setQuickFilter}
                        showFilters={showFilters}
                        setShowFilters={setShowFilters}
                        auxData={auxData}
                        onPrintReport={() => setShowReportOptions(true)}
                    />

                    <FinancialTable
                        entries={entries}
                        loading={loading}
                        selectedIds={selectedIds}
                        canEdit={entryPerm.canEdit}
                        isAdmin={user.role === UserRole.ADMIN}
                        onToggleSelect={onToggleSelect}
                        onToggleSelectAll={onToggleSelectAll}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onConciliate={(id) => reconcileEntries([id])}
                    />
                </div>
            </div>

            {/* Selection Toolbar (Floating) */}
            {selectedIds.length > 0 && (
                <div className="fixed bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 bg-[#0f172a] border border-primary/30 w-[95%] md:w-auto px-4 py-3 md:px-6 md:py-4 rounded-3xl shadow-2xl shadow-primary/20 flex flex-row items-center justify-between md:justify-center gap-3 md:gap-8 z-40 animate-in slide-in-from-bottom-8">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-black shrink-0">
                            {selectedIds.length}
                        </div>
                        <span className="hidden md:inline text-white font-bold text-sm tracking-tight">Selecionados</span>
                    </div>
                    <div className="h-8 w-px bg-white/10" />
                    <div className="flex items-center gap-2">
                        <button onClick={() => reconcileEntries(selectedIds)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all">Conciliar</button>
                        <button onClick={handleBulkDelete} className="bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border border-red-600/20">Excluir</button>
                        <button onClick={() => setSelectedIds([])} className="text-slate-400 hover:text-white text-xs font-bold px-2">Limpar</button>
                    </div>
                </div>
            )}

            {/* Modals */}
            <EntryFormModal
                isOpen={showForm}
                onClose={() => setShowForm(false)}
                user={user}
                editingId={editingId}
                editingBatchId={editingBatchId}
                auxData={auxData}
                accessibleSchools={accessibleSchools}
                onSave={() => refresh()}
            />

            <ReprogrammedBalancesModal
                isOpen={showReprogrammedModal}
                onClose={() => setShowReprogrammedModal(false)}
                reprogrammedBalances={reprogrammedBalances}
                fetchReprogrammedBalances={fetchReprogrammedBalances}
                accessibleSchools={accessibleSchools}
                programs={programs}
                rubrics={rubrics}
                periods={periods}
            />
            <ReportOptionsModal
                isOpen={showReportOptions}
                onClose={() => setShowReportOptions(false)}
                onGenerate={handleExport}
                auxData={{
                    schools: auxData.schools,
                    programs: auxData.programs,
                    periods: auxData.periods
                }}
                currentFilters={filters}
            />
        </div>
    );
};

export default FinancialEntries;
