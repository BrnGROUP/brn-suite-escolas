import React from 'react';
import { TransactionStatus } from '../../types';
import { generateCSV, generateRelatorioGerencialHTML } from '../../lib/reportUtils';

interface MonthStatusTableProps {
    systemEntries: any[];
    programs: any[];
    schools: any[];
    rubrics: any[];
    suppliers: any[];
    filterMonth: string;
    onClose: () => void;
}

const MonthStatusTable: React.FC<MonthStatusTableProps> = ({ systemEntries, programs, schools, rubrics, suppliers, filterMonth, onClose }) => {
    // Determine which month an entry belongs to: 
    // If reconciled, it belongs to the month of payment.
    // If pending, it belongs to the month of the document date.
    const filteredEntries = systemEntries.filter(e => {
        if (!filterMonth) return true;

        const referenceDate = e.payment_date || e.date;
        const isCurrentMonth = referenceDate.startsWith(filterMonth);
        const isPastAndPending = referenceDate < filterMonth && !e.is_reconciled;

        return isCurrentMonth || isPastAndPending;
    });

    const reconciled = filteredEntries.filter(e => e.is_reconciled);
    const pending = filteredEntries.filter(e => !e.is_reconciled);

    const getMappedEntries = () => {
        return reconciled.map(e => {
            const schoolObj = schools.find(s => s.id === e.school_id);
            return {
                ...e,
                school: schoolObj?.name || 'Sem Escola',
                inep: schoolObj?.inep || '',
                program: programs.find(p => p.id === e.program_id)?.name || 'Sem Programa',
                rubric: rubrics.find(r => r.id === e.rubric_id)?.name || 'Sem Rubrica',
                supplier: suppliers.find(s => s.id === e.supplier_id)?.name || 'Geral'
            };
        });
    };

    const handleExportPDF = async () => {
        if (reconciled.length === 0) return;
        const [y, m] = filterMonth.split('-');
        const lastDay = new Date(Number(y), Number(m), 0).getDate();

        const html = await generateRelatorioGerencialHTML(getMappedEntries(), {}, {}, [], {
            showSummary: true,
            showCharts: false,
            showStatusBadges: true,
            showNatureSummary: true,
            groupReport: 'program',
            format: 'pdf',
            reportMode: 'gerencial',
            filterStartDate: `${filterMonth}-01`,
            filterEndDate: `${filterMonth}-${lastDay.toString().padStart(2, '0')}`
        });
        const w = window.open('', '_blank');
        if (w) {
            w.document.write(html);
            w.document.close();
        }
    };

    const handleExportCSV = () => {
        if (reconciled.length === 0) return;
        generateCSV(getMappedEntries());
    };

    return (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-card-dark rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
                <div className="p-6 bg-white/5 border-b border-white/5 flex justify-between items-center">
                    <div className="flex flex-col gap-1">
                        <h3 className="text-sm font-black text-white uppercase tracking-widest">Resumo de Lançamentos do Mês</h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Status da conciliação dos lançamentos registrados no sistema</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-[10px] text-slate-500 hover:text-white font-black uppercase tracking-widest transition-all"
                    >
                        Voltar para Importação
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/5">
                    <div className="p-8 bg-card-dark flex flex-col items-center gap-4 relative">
                        <div className="flex flex-col items-center gap-2">
                            <span className="text-4xl font-black text-emerald-500">{reconciled.length}</span>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Conciliados (OK)</span>
                        </div>
                        {reconciled.length > 0 && (
                            <div className="flex gap-2 mt-2">
                                <button onClick={handleExportPDF} className="p-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-lg transition-all flex items-center gap-1" title="Baixar PDF">
                                    <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
                                    <span className="text-[9px] font-black uppercase">PDF</span>
                                </button>
                                <button onClick={handleExportCSV} className="p-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-lg transition-all flex items-center gap-1" title="Baixar Excel/CSV">
                                    <span className="material-symbols-outlined text-[16px]">grid_on</span>
                                    <span className="text-[9px] font-black uppercase">Excel</span>
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="p-8 bg-card-dark flex flex-col items-center gap-2">
                        <span className="text-4xl font-black text-amber-500">{pending.length}</span>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Pendentes de Conciliação</span>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/5 bg-black/20">
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Data</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Descrição</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Valor</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredEntries.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500 italic text-sm">
                                        Nenhum lançamento encontrado para este mês.
                                    </td>
                                </tr>
                            ) : (
                                filteredEntries.map(entry => (
                                    <tr key={entry.id} className={`group hover:bg-white/[0.02] transition-all ${entry.date < filterMonth ? 'bg-amber-500/5' : ''}`}>
                                        <td className="px-6 py-4 text-xs text-slate-400 font-mono">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex flex-col">
                                                    <span className="text-white font-bold">
                                                        {new Date(entry.payment_date || entry.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                                                    </span>
                                                    <span className="text-[9px] text-slate-500 uppercase font-black">
                                                        {entry.payment_date ? 'Data Pagto' : 'Data Documento'}
                                                    </span>
                                                </div>
                                                {(!entry.is_reconciled && entry.date < filterMonth) && (
                                                    <span className="text-[8px] bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded-md font-black uppercase tracking-tighter w-fit">
                                                        Atrasado / Retroativo
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-xs text-white font-bold">{entry.description}</span>
                                                <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                                                    {programs.find(p => p.id === entry.program_id)?.name || 'Sem Programa'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`text-xs font-black ${entry.type === 'Entrada' ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {entry.type === 'Entrada' ? '+' : '-'} {Number(entry.value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center">
                                                {entry.is_reconciled ? (
                                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full">
                                                        <span className="material-symbols-outlined text-sm">verified</span>
                                                        <span className="text-[9px] font-black uppercase">Conciliado</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full">
                                                        <span className="material-symbols-outlined text-sm">pending</span>
                                                        <span className="text-[9px] font-black uppercase">Pendente</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex justify-center">
                <button
                    onClick={onClose}
                    className="px-8 py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all border border-white/5"
                >
                    Voltar para Importação
                </button>
            </div>
        </div>
    );
};

export default MonthStatusTable;
