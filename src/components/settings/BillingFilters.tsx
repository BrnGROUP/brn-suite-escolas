import React from 'react';
import { School } from '../../types';

interface BillingFiltersProps {
    showFilters: boolean;
    setShowFilters: (val: boolean) => void;
    periodStart: string;
    setPeriodStart: (val: string) => void;
    periodEnd: string;
    setPeriodEnd: (val: string) => void;
    filterSchoolId: string;
    setFilterSchoolId: (val: string) => void;
    filterSearch: string;
    setFilterSearch: (val: string) => void;
    filterStatus: string;
    setFilterStatus: (val: string) => void;
    schools: School[];
    isAdmin: boolean;
}

export const BillingFilters: React.FC<BillingFiltersProps> = ({
    showFilters,
    setShowFilters,
    periodStart,
    setPeriodStart,
    periodEnd,
    setPeriodEnd,
    filterSchoolId,
    setFilterSchoolId,
    filterSearch,
    setFilterSearch,
    schools,
    isAdmin
}) => {
    const handleQuickPeriod = (value: string) => {
        const year = new Date().getFullYear();
        if (value === 'curr_year') {
            setPeriodStart(`${year}-01`);
            setPeriodEnd(`${year}-12`);
        } else if (value === 'curr_sem1') {
            setPeriodStart(`${year}-01`);
            setPeriodEnd(`${year}-06`);
        } else if (value === 'curr_sem2') {
            setPeriodStart(`${year}-07`);
            setPeriodEnd(`${year}-12`);
        } else if (value === 'prev_year') {
            setPeriodStart(`${year - 1}-01`);
            setPeriodEnd(`${year - 1}-12`);
        } else if (value === 'next_year') {
            setPeriodStart(`${year + 1}-01`);
            setPeriodEnd(`${year + 1}-12`);
        } else if (value === 'prev_sem1') {
            setPeriodStart(`${year - 1}-01`);
            setPeriodEnd(`${year - 1}-06`);
        } else if (value === 'prev_sem2') {
            setPeriodStart(`${year - 1}-07`);
            setPeriodEnd(`${year - 1}-12`);
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row justify-between gap-4">
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all border ${
                        showFilters 
                            ? 'bg-cyan-600 text-white border-cyan-600' 
                            : 'bg-[#111a22] text-slate-400 border-white/5 hover:text-white hover:bg-white/5'
                    }`}
                >
                    <span className="material-symbols-outlined text-[18px]">filter_list</span>
                    {showFilters ? 'Ocultar Filtros' : 'Filtros Avançados'}
                </button>
            </div>

            {showFilters && (
                <div className="bg-[#111a22] p-4 md:p-6 rounded-2xl border border-white/5 flex flex-col gap-4 animate-in slide-in-from-top-4 duration-300">
                    {/* QUICK PERIOD SELECTOR */}
                    <div className="w-full">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Período Rápido</label>
                        <div className="flex gap-2 flex-wrap">
                            <button onClick={() => handleQuickPeriod('prev_sem1')} className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-bold text-slate-400 hover:text-white uppercase tracking-wide border border-white/10 transition-all active:scale-95">1º Sem {new Date().getFullYear() - 1}</button>
                            <button onClick={() => handleQuickPeriod('prev_sem2')} className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-bold text-slate-400 hover:text-white uppercase tracking-wide border border-white/10 transition-all active:scale-95">2º Sem {new Date().getFullYear() - 1}</button>
                            <button onClick={() => handleQuickPeriod('prev_year')} className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-bold text-slate-400 hover:text-white uppercase tracking-wide border border-white/10 transition-all active:scale-95">Ano {new Date().getFullYear() - 1}</button>

                            <div className="w-[1px] h-8 bg-white/10 mx-2 hidden md:block"></div>

                            <button onClick={() => handleQuickPeriod('curr_sem1')} className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-bold text-slate-300 hover:text-white uppercase tracking-wide border border-white/10 transition-all active:scale-95">1º Sem {new Date().getFullYear()}</button>
                            <button onClick={() => handleQuickPeriod('curr_sem2')} className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-bold text-slate-300 hover:text-white uppercase tracking-wide border border-white/10 transition-all active:scale-95">2º Sem {new Date().getFullYear()}</button>
                            <button onClick={() => handleQuickPeriod('curr_year')} className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-bold text-slate-300 hover:text-white uppercase tracking-wide border border-white/10 transition-all active:scale-95">Ano {new Date().getFullYear()}</button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end border-t border-white/5 pt-4">
                        {/* Start Date */}
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Início</label>
                            <input
                                title="Data Inicial"
                                type="month"
                                placeholder="AAAA-MM"
                                value={periodStart}
                                onChange={e => setPeriodStart(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-cyan-500"
                            />
                        </div>

                        {/* End Date */}
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Fim</label>
                            <input
                                title="Data Final"
                                type="month"
                                placeholder="AAAA-MM"
                                value={periodEnd}
                                onChange={e => setPeriodEnd(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-cyan-500"
                            />
                        </div>

                        {/* School Filter */}
                        {isAdmin && (
                            <div className="col-span-2 md:col-span-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Escola</label>
                                <select
                                    title="Filtrar por Escola"
                                    value={filterSchoolId}
                                    onChange={e => setFilterSchoolId(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-cyan-500 appearance-none"
                                >
                                    <option value="">Todas as Escolas</option>
                                    {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                        )}

                        {/* Search Text */}
                        <div className="col-span-2 md:col-span-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Pesquisar</label>
                            <input
                                title="Pesquisar por escola ou descrição"
                                type="text"
                                placeholder="Nome ou descrição..."
                                value={filterSearch}
                                onChange={e => setFilterSearch(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-cyan-500"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
