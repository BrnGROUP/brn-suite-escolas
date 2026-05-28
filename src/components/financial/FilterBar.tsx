
import React from 'react';

interface FilterBarProps {
    filters: any;
    setFilters: (filters: any) => void;
    showFilters: boolean;
    setShowFilters: (show: boolean) => void;
    quickFilter: string;
    setQuickFilter: (filter: string) => void;
    auxData: {
        schools: any[];
        programs: any[];
        rubrics: any[];
        suppliers: any[];
        periods: any[];
    };
    onPrintReport: () => void;
}

const FilterBar: React.FC<FilterBarProps> = ({
    filters,
    setFilters,
    showFilters,
    setShowFilters,
    quickFilter,
    setQuickFilter,
    auxData,
    onPrintReport
}) => {
    const [schoolSearch, setSchoolSearch] = React.useState('');
    const [supplierSearch, setSupplierSearch] = React.useState('');

    const clearFilters = () => {
        setFilters({
            school: '',
            program: '',
            rubric: '',
            supplier: '',
            startDate: '',
            endDate: '',
            nature: '',
            search: ''
        });
        setSchoolSearch('');
        setSupplierSearch('');
    };

    const filteredSchools = React.useMemo(() => {
        if (!schoolSearch) return auxData.schools;
        const s = schoolSearch.toLowerCase().trim();
        return auxData.schools.filter((school: any) => 
            school.id === filters.school || 
            school.name.toLowerCase().includes(s)
        );
    }, [auxData.schools, schoolSearch, filters.school]);

    const filteredSuppliers = React.useMemo(() => {
        if (!supplierSearch) return auxData.suppliers;
        const s = supplierSearch.toLowerCase().trim();
        const sClean = s.replace(/[^\d]/g, '');

        return auxData.suppliers.filter((supp: any) => {
            if (supp.id === filters.supplier) return true;
            
            const matchName = supp.name?.toLowerCase().includes(s);
            let matchCnpj = false;
            
            if (supp.cnpj) {
                if (supp.cnpj.toLowerCase().includes(s)) {
                    matchCnpj = true;
                } else if (sClean.length > 0) {
                    const cnpjClean = supp.cnpj.replace(/[^\d]/g, '');
                    if (cnpjClean.includes(sClean)) {
                        matchCnpj = true;
                    }
                }
            }
            
            return matchName || matchCnpj;
        });
    }, [auxData.suppliers, supplierSearch, filters.supplier]);

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <button
                    onClick={() => setQuickFilter('all')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${quickFilter === 'all' ? 'bg-white text-black border-white' : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'}`}
                >
                    Todos Lançamentos
                </button>
                <button
                    onClick={() => setQuickFilter('entradas')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${quickFilter === 'entradas' ? 'bg-green-500 text-white border-green-500 shadow-lg shadow-green-500/20' : 'bg-green-500/5 text-green-400 border-green-500/20 hover:bg-green-500/10'}`}
                >
                    Entradas
                </button>
                <button
                    onClick={() => setQuickFilter('saidas')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${quickFilter === 'saidas' ? 'bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/20' : 'bg-rose-500/5 text-rose-400 border-rose-500/20 hover:bg-rose-500/10'}`}
                >
                    Saídas
                </button>
                <button
                    onClick={() => setQuickFilter('pending_today')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${quickFilter === 'pending_today' ? 'bg-yellow-500 text-black border-yellow-500' : 'bg-yellow-500/5 text-yellow-500 border-yellow-500/20 hover:bg-yellow-500/10'}`}
                >
                    Pendentes de Hoje
                </button>
                <button
                    onClick={() => setQuickFilter('this_month')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${quickFilter === 'this_month' ? 'bg-blue-500 text-white border-blue-500' : 'bg-blue-500/5 text-blue-400 border-blue-500/20 hover:bg-blue-500/10'}`}
                >
                    Este Mês
                </button>
                <button
                    onClick={() => setQuickFilter('high_value')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${quickFilter === 'high_value' ? 'bg-red-500 text-white border-red-500' : 'bg-red-500/5 text-red-500 border-red-500/20 hover:bg-red-500/10'}`}
                >
                    Alto Valor (± R$ 1k)
                </button>
                <button
                    onClick={() => setQuickFilter('repasses')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${quickFilter === 'repasses' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-emerald-500/5 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/10'}`}
                >
                    Repasses
                </button>
                <button
                    onClick={() => setQuickFilter('tarifas')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${quickFilter === 'tarifas' ? 'bg-amber-600 text-white border-amber-600' : 'bg-amber-600/5 text-amber-600 border-amber-600/20 hover:bg-amber-600/10'}`}
                >
                    Tarifas
                </button>
                <button
                    onClick={() => setQuickFilter('rendimentos')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${quickFilter === 'rendimentos' ? 'bg-orange-500 text-white border-orange-500' : 'bg-orange-500/5 text-orange-400 border-orange-500/20 hover:bg-orange-500/10'}`}
                >
                    Rendimentos
                </button>

                <div className="flex-1"></div>

                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${showFilters ? 'bg-primary text-white border-primary' : 'bg-white/5 text-white border-white/10 hover:bg-white/10'}`}
                >
                    <span className="material-symbols-outlined text-[18px]">{showFilters ? 'close' : 'filter_list'}</span>
                    {showFilters ? 'Fechar Filtros' : 'Filtros Avançados'}
                </button>
            </div>

            {showFilters && (
                <div className="bg-[#111a22] border border-surface-border rounded-2xl p-4 md:p-6 grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-6 items-end animate-in fade-in slide-in-from-top-4">
                    <div className="flex flex-col gap-2 relative">
                        <div className="flex justify-between items-end px-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Unidade Escolar</label>
                            <div className="relative w-32">
                                <input 
                                    type="text" 
                                    placeholder="Buscar..." 
                                    value={schoolSearch}
                                    onChange={e => setSchoolSearch(e.target.value)}
                                    className="w-full bg-[#1c2936]/50 border border-white/5 rounded-lg h-6 px-2 pl-6 text-[10px] text-white outline-none focus:border-primary transition-colors placeholder:text-slate-600"
                                />
                                <span className="material-symbols-outlined absolute left-1.5 top-1 text-[12px] text-slate-500">search</span>
                            </div>
                        </div>
                        <select title="Filtrar por Unidade Escolar" aria-label="Filtrar por Unidade Escolar"
                            value={filters.school}
                            onChange={e => setFilters({ ...filters, school: e.target.value })}
                            className="w-full bg-[#1c2936] text-white text-xs h-10 px-3 rounded-xl border border-white/10 outline-none focus:border-primary"
                        >
                            <option value="">Todas as Escolas</option>
                            {filteredSchools.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Programa / Recurso</label>
                        <select title="Filtrar por Programa" aria-label="Filtrar por Programa"
                            value={filters.program}
                            onChange={e => setFilters({ ...filters, program: e.target.value, rubric: '' })}
                            className="w-full bg-[#1c2936] text-white text-xs h-10 px-3 rounded-xl border border-white/10 outline-none focus:border-primary"
                        >
                            <option value="">Todos</option>
                            {auxData.programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Rubrica</label>
                        <select title="Filtrar por Rubrica" aria-label="Filtrar por Rubrica"
                            value={filters.rubric}
                            onChange={e => setFilters({ ...filters, rubric: e.target.value })}
                            className="w-full bg-[#1c2936] text-white text-xs h-10 px-3 rounded-xl border border-white/10 outline-none focus:border-primary"
                        >
                            <option value="">Todas</option>
                            <option value="none">Nenhuma / Natureza Direta</option>
                            {auxData.rubrics
                                .filter(r => !filters.program || r.program_id === filters.program)
                                .filter(r => !filters.school || !r.school_id || r.school_id === filters.school)
                                .map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Período</label>
                        <select title="Selecionar Período Pré-definido" aria-label="Selecionar Período Pré-definido"
                            onChange={(e) => {
                                const val = e.target.value;
                                if (!val) return;
                                const year = parseInt(val.match(/\d{4}/)?.[0] || new Date().getFullYear().toString());
                                if (val.includes('1º') || val.includes('.1')) {
                                    setFilters({ ...filters, startDate: `${year}-01-01`, endDate: `${year}-06-30` });
                                } else if (val.includes('2º') || val.includes('.2')) {
                                    setFilters({ ...filters, startDate: `${year}-07-01`, endDate: `${year}-12-31` });
                                } else {
                                    setFilters({ ...filters, startDate: `${year}-01-01`, endDate: `${year}-12-31` });
                                }
                            }}
                            className="bg-[#1c2936] text-white text-xs h-10 px-3 rounded-xl border border-white/10 outline-none focus:border-primary"
                        >
                            <option value="">Personalizado...</option>
                            {auxData.periods.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                        </select>
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Data Inicial</label>
                        <input type="date" aria-label="Data Inicial" value={filters.startDate} onChange={e => setFilters({ ...filters, startDate: e.target.value })} className="w-full bg-[#1c2936] text-white text-xs h-10 px-3 rounded-xl border border-white/10 outline-none focus:border-primary" />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Data Final</label>
                        <input type="date" aria-label="Data Final" value={filters.endDate} onChange={e => setFilters({ ...filters, endDate: e.target.value })} className="w-full bg-[#1c2936] text-white text-xs h-10 px-3 rounded-xl border border-white/10 outline-none focus:border-primary" />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Natureza</label>
                        <select title="Filtrar por Natureza" aria-label="Filtrar por Natureza" value={filters.nature} onChange={e => setFilters({ ...filters, nature: e.target.value })} className="w-full bg-[#1c2936] text-white text-xs h-10 px-3 rounded-xl border border-white/10 outline-none focus:border-primary">
                            <option value="">Todas</option>
                            <option value="Custeio">Custeio</option>
                            <option value="Capital">Capital</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-2 relative">
                        <div className="flex justify-between items-end px-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Fornecedor</label>
                            <div className="relative w-32">
                                <input 
                                    type="text" 
                                    placeholder="Buscar..." 
                                    value={supplierSearch}
                                    onChange={e => setSupplierSearch(e.target.value)}
                                    className="w-full bg-[#1c2936]/50 border border-white/5 rounded-lg h-6 px-2 pl-6 text-[10px] text-white outline-none focus:border-primary transition-colors placeholder:text-slate-600"
                                />
                                <span className="material-symbols-outlined absolute left-1.5 top-1 text-[12px] text-slate-500">search</span>
                            </div>
                        </div>
                        <select title="Filtrar por Fornecedor" aria-label="Filtrar por Fornecedor" value={filters.supplier} onChange={e => setFilters({ ...filters, supplier: e.target.value })} className="w-full bg-[#1c2936] text-white text-xs h-10 px-3 rounded-xl border border-white/10 outline-none focus:border-primary">
                            <option value="">Todos</option>
                            {filteredSuppliers.map((s: any) => <option key={s.id} value={s.id}>{s.name}{s.cnpj ? ` (${s.cnpj})` : ''}</option>)}
                        </select>
                    </div>
                    <div className="md:col-span-3 lg:col-span-4 flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Pesquisar por Descrição</label>
                        <input type="text" aria-label="Pesquisar por Descrição" value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} className="w-full bg-[#1c2936] text-white text-xs h-10 px-4 rounded-xl border border-white/10 outline-none focus:border-primary" placeholder="Digite algo para buscar..." />
                    </div>
                    <div className="md:col-span-1 lg:col-span-2 grid grid-cols-2 gap-2">
                        <button onClick={clearFilters} className="bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-tighter h-10 rounded-xl hover:bg-white/10 transition-colors">Limpar</button>
                        <button onClick={onPrintReport} className="bg-blue-600 border border-blue-500 text-white text-[10px] font-black uppercase tracking-tighter h-10 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined text-sm">print</span>
                            Relatório
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FilterBar;
