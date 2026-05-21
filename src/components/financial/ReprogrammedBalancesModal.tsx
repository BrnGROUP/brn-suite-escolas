import * as React from 'react';
import { supabase } from '../../lib/supabaseClient';
import { TransactionNature } from '../../types';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';

interface ReprogrammedBalancesModalProps {
    isOpen: boolean;
    onClose: () => void;
    reprogrammedBalances: any[];
    fetchReprogrammedBalances: () => void;
    accessibleSchools: any[];
    programs: any[];
    rubrics: any[];
    periods: any[];
}

const ReprogrammedListItem = React.memo(({ rb, onDelete }: { rb: any, onDelete: (id: string) => void }) => {
    const rubricName = rb.rubrics?.name;
    return (
        <div className="bg-white/5 hover:bg-white/10 p-4 rounded-xl flex justify-between items-center group transition-all border border-transparent hover:border-white/10">
            <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                    <span className="bg-blue-500/20 text-blue-400 text-[10px] font-black px-1.5 py-0.5 rounded uppercase">{rb.period}</span>
                    <span className="text-white font-bold text-sm truncate max-w-[200px] md:max-w-xs" title={rb.programs?.name}>{rb.programs?.name}</span>
                </div>
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[10px]">school</span>
                    {rb.schools?.name}
                </span>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{rb.nature}</span>
                    {rubricName && (
                        <>
                            <span className="text-slate-700">·</span>
                            <span className="text-[10px] text-cyan-400/80 font-bold uppercase tracking-wider flex items-center gap-1">
                                <span className="material-symbols-outlined text-[9px]">label</span>
                                {rubricName}
                            </span>
                        </>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-4">
                <span className="text-lg font-black text-emerald-400 font-mono tracking-tight">{rb.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                <button onClick={() => onDelete(rb.id)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-500/20 text-slate-600 hover:text-red-500 transition-all opacity-100 lg:opacity-0 lg:group-hover:opacity-100 focus:opacity-100">
                    <span className="material-symbols-outlined text-lg">delete</span>
                </button>
            </div>
        </div>
    );
});

ReprogrammedListItem.displayName = 'ReprogrammedListItem';

const ReprogrammedBalancesModal: React.FC<ReprogrammedBalancesModalProps> = ({
    isOpen,
    onClose,
    reprogrammedBalances,
    fetchReprogrammedBalances,
    accessibleSchools,
    programs,
    rubrics,
    periods
}) => {
    const [newReprogrammed, setNewReprogrammed] = React.useState({
        school_id: '', program_id: '', rubric_id: '', nature: TransactionNature.CUSTEIO, period: '', value: ''
    });
    const [isSavingReprogrammed, setIsSavingReprogrammed] = React.useState(false);
    const [searchVal, setSearchVal] = React.useState('');
    const [reprogSchoolFilter, setReprogSchoolFilter] = React.useState('');
    const { addToast } = useToast();
    const { confirm } = useConfirm();

    const filteredBalances = React.useMemo(() => {
        const query = searchVal.toLowerCase();
        return reprogrammedBalances.filter(rb => {
            const matchesSearch = !query || rb.programs?.name.toLowerCase().includes(query) || rb.schools?.name.toLowerCase().includes(query) || rb.period.toLowerCase().includes(query);
            const matchesSchool = !reprogSchoolFilter || rb.school_id === reprogSchoolFilter;
            return matchesSearch && matchesSchool;
        });
    }, [reprogrammedBalances, searchVal, reprogSchoolFilter]);

    const handleSaveReprogrammed = async () => {
        if (!newReprogrammed.school_id || !newReprogrammed.program_id || !newReprogrammed.value || !newReprogrammed.period) {
            addToast('Escola, Programa, Ano/Período e Valor são obrigatórios.', 'warning');
            return;
        }
        setIsSavingReprogrammed(true);
        try {
            const { error } = await supabase.from('reprogrammed_balances').upsert({
                school_id: newReprogrammed.school_id,
                program_id: newReprogrammed.program_id,
                rubric_id: newReprogrammed.rubric_id || null,
                nature: newReprogrammed.nature,
                period: newReprogrammed.period,
                value: parseFloat(newReprogrammed.value)
            });
            if (error) throw error;
            fetchReprogrammedBalances();
            addToast('Saldo salvo com sucesso!', 'success');
            setNewReprogrammed({ ...newReprogrammed, value: '', rubric_id: '' });
        } catch (error: any) {
            addToast(`Erro ao salvar saldo reprogramado: ${error.message}`, 'error');
        } finally { setIsSavingReprogrammed(false); }
    };

    const handleDeleteReprogrammed = React.useCallback(async (id: string) => {
        if (!await confirm({
            title: 'Excluir Saldo Reprogramado',
            message: 'Tem certeza que deseja excluir este saldo reprogramado? Esta ação não pode ser desfeita.',
            isDestructive: true
        })) return;
        try {
            const { error } = await supabase.from('reprogrammed_balances').delete().eq('id', id);
            if (error) throw error;
            addToast('Saldo excluído com sucesso.', 'success');
            fetchReprogrammedBalances();
        } catch (error: any) {
            addToast(`Erro ao excluir: ${error.message}`, 'error');
        }
    }, [fetchReprogrammedBalances, addToast, confirm]);

    const schoolOptions = React.useMemo(() => accessibleSchools.map(s => <option key={s.id} value={s.id}>{s.name}</option>), [accessibleSchools]);
    const programOptions = React.useMemo(() => programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>), [programs]);
    const periodOptions = React.useMemo(() => periods.map(p => <option key={p.name} value={p.name}>{p.name}</option>), [periods]);

    const filteredRubrics = React.useMemo(() =>
        rubrics.filter(r => 
            r.program_id === newReprogrammed.program_id && 
            (!r.school_id || r.school_id === newReprogrammed.school_id)
        ),
        [rubrics, newReprogrammed.program_id, newReprogrammed.school_id]
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="w-full max-w-4xl bg-[#0f172a] border border-blue-500/20 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[95vh] md:max-h-[90vh]">
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-blue-500/5 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                            <span className="material-symbols-outlined">restart_alt</span>
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white px-2">Saldos Reprogramados</h3>
                            <p className="text-xs text-slate-400 px-2">Gerencie os saldos de exercícios anteriores</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/5 text-slate-400">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-8 overflow-y-auto lg:overflow-hidden flex-1 custom-scrollbar">
                    <div className="bg-white/[0.02] p-6 rounded-2xl border border-white/5 flex flex-col gap-4 text-xs h-fit lg:h-full lg:overflow-y-auto custom-scrollbar shrink-0 lg:shrink">
                        <h4 className="text-sm font-bold text-blue-400 mb-2 flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">add_circle</span>
                            Novo Registro
                        </h4>
                        <label htmlFor="reprog_new_school" className="text-slate-400 uppercase font-black">Escola</label>
                        <select
                            title="Selecione a Escola"
                            id="reprog_new_school"
                            aria-label="Selecione a Escola"
                            value={newReprogrammed.school_id}
                            onChange={e => setNewReprogrammed({ ...newReprogrammed, school_id: e.target.value })}
                            className="bg-[#1e293b] rounded-lg h-10 px-3 text-white border-none outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="">Selecione...</option>
                            {schoolOptions}
                        </select>
                        <label htmlFor="reprog_new_program" className="text-slate-400 uppercase font-black">Programa</label>
                        <select
                            title="Selecione o Programa"
                            id="reprog_new_program"
                            aria-label="Selecione o Programa"
                            value={newReprogrammed.program_id}
                            onChange={e => setNewReprogrammed({ ...newReprogrammed, program_id: e.target.value, rubric_id: '' })}
                            className="bg-[#1e293b] rounded-lg h-10 px-3 text-white border-none outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="">Selecione...</option>
                            {programOptions}
                        </select>
                        <label htmlFor="reprog_new_rubric" className="text-slate-400 uppercase font-black">Rubrica <span className="text-slate-600 normal-case font-normal">(opcional)</span></label>
                        <select
                            title="Selecione a Rubrica"
                            id="reprog_new_rubric"
                            aria-label="Selecione a Rubrica"
                            value={newReprogrammed.rubric_id}
                            onChange={e => setNewReprogrammed({ ...newReprogrammed, rubric_id: e.target.value })}
                            disabled={!newReprogrammed.program_id}
                            className="bg-[#1e293b] rounded-lg h-10 px-3 text-white border-none outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <option value="">Nenhuma (apenas natureza)</option>
                            {filteredRubrics.map(r => (
                                <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                        </select>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="flex flex-col gap-2">
                                <label htmlFor="reprog_new_nature" className="text-slate-400 uppercase font-black">Natureza</label>
                                <select
                                    title="Selecione a Natureza"
                                    id="reprog_new_nature"
                                    aria-label="Selecione a Natureza"
                                    value={newReprogrammed.nature}
                                    onChange={e => setNewReprogrammed({ ...newReprogrammed, nature: e.target.value as TransactionNature })}
                                    className="bg-[#1e293b] rounded-lg h-10 px-2 text-white border-none outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value={TransactionNature.CUSTEIO}>Custeio</option>
                                    <option value={TransactionNature.CAPITAL}>Capital</option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label htmlFor="reprog_new_period" className="text-slate-400 uppercase font-black">Ano</label>
                                <select
                                    title="Selecione o Ano"
                                    id="reprog_new_period"
                                    aria-label="Selecione o Ano"
                                    value={newReprogrammed.period}
                                    onChange={e => setNewReprogrammed({ ...newReprogrammed, period: e.target.value })}
                                    className="bg-[#1e293b] rounded-lg h-10 px-2 text-white border-none outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value="">...</option>
                                    {periodOptions}
                                </select>
                            </div>
                        </div>
                        <label htmlFor="reprog_value" className="text-slate-400 uppercase font-black">Valor R$</label>
                        <input id="reprog_value" type="number" step="0.01" value={newReprogrammed.value} onChange={e => setNewReprogrammed({ ...newReprogrammed, value: e.target.value })} className="bg-[#1e293b] rounded-lg h-10 px-3 text-white border-none outline-none focus:ring-1 focus:ring-blue-500 font-mono text-lg" placeholder="0,00" />
                        <button onClick={handleSaveReprogrammed} disabled={isSavingReprogrammed} className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold min-h-[48px] py-3 rounded-xl transition-all shadow-lg shadow-blue-900/20 active:scale-95 flex items-center justify-center gap-2 shrink-0">
                            {isSavingReprogrammed ? <span className="material-symbols-outlined animate-spin text-sm">sync</span> : 'Salvar Saldo'}
                        </button>
                    </div>

                    <div className="lg:col-span-2 flex flex-col gap-4 h-full lg:overflow-hidden min-h-[400px] lg:min-h-0">
                        <div className="flex flex-col md:flex-row gap-3 bg-black/20 p-3 rounded-xl border border-white/5">
                            <div className="flex-1 relative">
                                <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-500 text-sm">search</span>
                                <input
                                    aria-label="Buscar por escola ou programa"
                                    type="text"
                                    placeholder="Buscar por escola ou programa..."
                                    value={searchVal}
                                    onChange={e => setSearchVal(e.target.value)}
                                    className="w-full bg-[#0f172a] h-9 pl-9 pr-3 rounded-lg text-xs text-white border border-white/10 focus:border-blue-500 outline-none placeholder:text-slate-600"
                                />
                            </div>
                            <div className="w-full md:w-48">
                                <label htmlFor="reprog_list_school_filter" className="sr-only">Filtrar por Escola</label>
                                <select
                                    title="Filtrar por Escola"
                                    id="reprog_list_school_filter"
                                    aria-label="Filtrar por Escola"
                                    value={reprogSchoolFilter}
                                    onChange={e => setReprogSchoolFilter(e.target.value)}
                                    className="w-full bg-[#0f172a] h-9 px-3 rounded-lg text-xs text-white border border-white/10 focus:border-blue-500 outline-none"
                                >
                                    <option value="">Todas as Escolas</option>
                                    {schoolOptions}
                                </select>
                            </div>
                        </div>

                        <div className="overflow-y-auto flex-1 pr-2 space-y-2 custom-scrollbar">
                            {filteredBalances.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-48 text-slate-500 opacity-50">
                                    <span className="material-symbols-outlined text-4xl mb-2">search_off</span>
                                    <p className="text-xs">Nenhum saldo encontrado.</p>
                                </div>
                            ) : (
                                filteredBalances.map(rb => (
                                    <ReprogrammedListItem key={rb.id} rb={rb} onDelete={handleDeleteReprogrammed} />
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default React.memo(ReprogrammedBalancesModal);
