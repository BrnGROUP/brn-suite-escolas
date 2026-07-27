
import React, { useState } from 'react';

import { ReportOptions } from '../../lib/reportUtils';

interface ReportOptionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (options: ReportOptions) => void;
    auxData: {
        schools: any[];
        programs: any[];
        periods: any[];
    };
    currentFilters: any;
}

const ReportOptionsModal: React.FC<ReportOptionsModalProps> = ({ isOpen, onClose, onGenerate, auxData, currentFilters }) => {
    const [isDetailed, setIsDetailed] = useState(false);
    const [options, setOptions] = useState<ReportOptions>({
        showSummary: true,
        showCharts: true,
        showStatusBadges: true,
        showNatureSummary: true,
        groupReport: 'school',
        format: 'pdf',
        filterSchool: currentFilters.school || '',
        filterProgram: currentFilters.program || '',
        filterStartDate: currentFilters.startDate || '',
        filterEndDate: currentFilters.endDate || '',
        reportMode: 'gerencial'
    });

    // Update internal state when external filters change and modal opens
    React.useEffect(() => {
        if (isOpen) {
            setOptions(prev => ({
                ...prev,
                filterSchool: currentFilters.school || '',
                filterProgram: currentFilters.program || '',
                filterStartDate: currentFilters.startDate || '',
                filterEndDate: currentFilters.endDate || ''
            }));
        }
    }, [isOpen, currentFilters]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-surface-dark border border-white/10 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-8 space-y-8">
                    {/* Header */}
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                <span className="material-symbols-outlined text-3xl">print_connect</span>
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-white tracking-tight">Opções do Relatório</h2>
                                <p className="text-slate-500 text-sm font-medium">Personalize sua exportação</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    {/* Options Grid */}
                    <div className="grid grid-cols-1 gap-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                        {/* Filters Refinement */}
                        <div className="bg-white/5 border border-white/5 rounded-3xl p-6 mb-2">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary text-xl">tune</span>
                                    <h3 className="text-xs font-black text-white uppercase tracking-widest">Contexto do Relatório</h3>
                                </div>
                                <button
                                    onClick={() => setIsDetailed(!isDetailed)}
                                    className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all flex items-center gap-2 border ${isDetailed ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
                                >
                                    <span className={`w-1.5 h-1.5 rounded-full ${isDetailed ? 'bg-white animate-pulse' : 'bg-slate-600'}`}></span>
                                    {isDetailed ? 'Personalizado' : 'Personalizar'}
                                </button>
                            </div>

                            {isDetailed ? (
                                <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Escola</label>
                                        <div className="relative">
                                            <select
                                                title="Escolher Escola no Relatório"
                                                aria-label="Escolher Escola no Relatório"
                                                value={options.filterSchool}
                                                onChange={(e) => setOptions({ ...options, filterSchool: e.target.value })}
                                                className="w-full bg-[#0f172a] text-white text-[10px] h-10 px-3 rounded-xl border border-white/5 outline-none focus:border-primary/30 appearance-none pr-8 cursor-pointer"
                                            >
                                                <option value="">Todas as Unidades</option>
                                                {auxData.schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                            </select>
                                            <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none text-lg">expand_more</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Programa</label>
                                        <div className="relative">
                                            <select
                                                title="Escolher Programa no Relatório"
                                                aria-label="Escolher Programa no Relatório"
                                                value={options.filterProgram}
                                                onChange={(e) => setOptions({ ...options, filterProgram: e.target.value })}
                                                className="w-full bg-[#0f172a] text-white text-[10px] h-10 px-3 rounded-xl border border-white/5 outline-none focus:border-primary/30 appearance-none pr-8 cursor-pointer"
                                            >
                                                <option value="">Resumo Conexo</option>
                                                {auxData.programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                            </select>
                                            <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none text-lg">expand_more</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Data Início</label>
                                        <input
                                            type="date"
                                            value={options.filterStartDate}
                                            onChange={(e) => setOptions({ ...options, filterStartDate: e.target.value })}
                                            aria-label="Data Início no Relatório"
                                            className="w-full bg-[#0f172a] text-white text-[10px] h-10 px-3 rounded-xl border border-white/5 outline-none focus:border-primary/30 cursor-pointer"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Data Fim</label>
                                        <input
                                            type="date"
                                            value={options.filterEndDate}
                                            onChange={(e) => setOptions({ ...options, filterEndDate: e.target.value })}
                                            aria-label="Data Fim no Relatório"
                                            className="w-full bg-[#0f172a] text-white text-[10px] h-10 px-3 rounded-xl border border-white/5 outline-none focus:border-primary/30 cursor-pointer"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <p className="text-[10px] text-slate-500 font-medium pl-1 italic">
                                    Utilizando filtros atuais da listagem financeira.
                                </p>
                            )}
                        </div>

                        {options.reportMode !== 'livro_tombo' && (
                            <div className="flex flex-col gap-3">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Seções do Documento</label>

                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setOptions({ ...options, showSummary: !options.showSummary })}
                                        className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 text-center ${options.showSummary ? 'bg-primary/10 border-primary text-white' : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10'}`}
                                    >
                                        <span className="material-symbols-outlined text-2xl">summarize</span>
                                        <span className="text-[10px] font-bold uppercase">Resumo Global</span>
                                    </button>

                                    <button
                                        onClick={() => setOptions({ ...options, showCharts: !options.showCharts })}
                                        className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 text-center ${options.showCharts ? 'bg-primary/10 border-primary text-white' : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10'}`}
                                    >
                                        <span className="material-symbols-outlined text-2xl">pie_chart</span>
                                        <span className="text-[10px] font-bold uppercase">Análise Visual</span>
                                    </button>

                                    <button
                                        onClick={() => setOptions({ ...options, showNatureSummary: !options.showNatureSummary })}
                                        className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 text-center ${options.showNatureSummary ? 'bg-primary/10 border-primary text-white' : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10'}`}
                                    >
                                        <span className="material-symbols-outlined text-2xl">category</span>
                                        <span className="text-[10px] font-bold uppercase">Resumo Natureza</span>
                                    </button>

                                    <button
                                        onClick={() => setOptions({ ...options, showStatusBadges: !options.showStatusBadges })}
                                        className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 text-center ${options.showStatusBadges ? 'bg-primary/10 border-primary text-white' : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10'}`}
                                    >
                                        <span className="material-symbols-outlined text-2xl">verified</span>
                                        <span className="text-[10px] font-bold uppercase">Status Detalhado</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {options.reportMode !== 'livro_tombo' && (
                            <div className="flex flex-col gap-2 pt-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Exibição de Dados</label>
                                <div className="relative">
                                    <select
                                        title="Critério de agrupamento de dados"
                                        aria-label="Critério de agrupamento de dados"
                                        value={options.groupReport}
                                        onChange={(e) => setOptions({ ...options, groupReport: e.target.value as any })}
                                        className="w-full bg-[#0f172a] text-white text-xs h-12 px-4 rounded-2xl border border-white/5 outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all cursor-pointer appearance-none pr-10"
                                    >
                                        <option value="school" className="bg-[#1c2936]">Agrupar por Unidade Escolar</option>
                                        <option value="program" className="bg-[#1c2936]">Agrupar por Programa</option>
                                        <option value="none" className="bg-[#1c2936]">Lista Contínua (Sem Agrupamento)</option>
                                    </select>
                                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none text-xl">expand_more</span>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col gap-2 pt-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Modelo de Relatório</label>
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    onClick={() => setOptions({ ...options, reportMode: 'gerencial' })}
                                    className={`h-12 rounded-2xl font-black text-[9px] uppercase transition-all flex items-center justify-center gap-2 border ${options.reportMode === 'gerencial' || !options.reportMode ? 'bg-primary/10 border-primary text-primary' : 'bg-[#0f172a] text-slate-500 border-white/5 hover:bg-white/5'}`}
                                >
                                    <span className="material-symbols-outlined text-lg">dashboard</span>
                                    Gerencial
                                </button>
                                <button
                                    onClick={() => setOptions({ ...options, reportMode: 'livro_caixa', groupReport: 'program' })}
                                    className={`h-12 rounded-2xl font-black text-[9px] uppercase transition-all flex items-center justify-center gap-2 border ${options.reportMode === 'livro_caixa' ? 'bg-amber-500/10 border-amber-500 text-amber-500' : 'bg-[#0f172a] text-slate-500 border-white/5 hover:bg-white/5'}`}
                                >
                                    <span className="material-symbols-outlined text-lg">menu_book</span>
                                    Livro Caixa
                                </button>
                                <button
                                    onClick={() => setOptions({ ...options, reportMode: 'livro_tombo', groupReport: 'none' })}
                                    className={`h-12 rounded-2xl font-black text-[9px] uppercase transition-all flex items-center justify-center gap-2 border ${options.reportMode === 'livro_tombo' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' : 'bg-[#0f172a] text-slate-500 border-white/5 hover:bg-white/5'}`}
                                >
                                    <span className="material-symbols-outlined text-lg">inventory_2</span>
                                    Livro Tombo
                                </button>
                            </div>
                            <p className="text-[8px] text-slate-500 italic pl-1 leading-tight">
                                {options.reportMode === 'livro_caixa'
                                    ? 'O Modo Livro Caixa utiliza colunas de Entrada, Saída e Saldo Progressivo, ideal para prestação de contas formal.'
                                    : options.reportMode === 'livro_tombo'
                                    ? 'O Modo Livro Tombo é um relatório exclusivo para lançamentos de Capital com detalhamento dos bens adquiridos.'
                                    : 'O Modo Gerencial foca em análise de gastos, natureza de recurso e badges de status.'}
                            </p>
                        </div>

                        <div className="flex flex-col gap-2 pt-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Formato de Saída</label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setOptions({ ...options, format: 'pdf' })}
                                    className={`flex-1 h-12 rounded-2xl font-black text-xs uppercase transition-all flex items-center justify-center gap-2 border ${options.format === 'pdf' ? 'bg-white text-black border-white' : 'bg-[#0f172a] text-slate-500 border-white/5 hover:bg-white/5'}`}
                                >
                                    <span className="material-symbols-outlined">picture_as_pdf</span>
                                    Documento PDF
                                </button>
                                <button
                                    onClick={() => setOptions({ ...options, format: 'csv' })}
                                    className={`flex-1 h-12 rounded-2xl font-black text-xs uppercase transition-all flex items-center justify-center gap-2 border ${options.format === 'csv' ? 'bg-[#107c10] text-white border-[#107c10]' : 'bg-[#0f172a] text-slate-500 border-white/5 hover:bg-white/5'}`}
                                >
                                    <span className="material-symbols-outlined">description</span>
                                    Planilha Excel
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 pt-4 border-t border-white/5">
                        <button onClick={onClose} className="flex-1 h-14 rounded-2xl font-black text-xs uppercase text-slate-400 hover:text-white hover:bg-white/5 transition-all">Cancelar</button>
                        <button
                            onClick={() => onGenerate(options)}
                            className="flex-1 h-14 rounded-2xl font-black text-xs uppercase bg-primary hover:bg-primary-hover text-white shadow-lg shadow-primary/25 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined">download_done</span>
                            Gerar Relatório
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportOptionsModal;
