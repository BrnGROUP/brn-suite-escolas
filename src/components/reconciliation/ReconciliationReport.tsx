import React from 'react';
import { BankTransaction } from '../../types';

interface ReconciliationReportProps {
    transactions: BankTransaction[];
    systemEntries: any[];
    schools: any[];
    bankAccounts: any[];
    selectedSchoolId: string;
    selectedBankAccountId: string;
    filterMonth: string;
    onClose: () => void;
}

const ReconciliationReport: React.FC<ReconciliationReportProps> = ({
    transactions, systemEntries, schools, bankAccounts, selectedSchoolId, selectedBankAccountId, filterMonth, onClose
}) => {
    const school = schools.find(s => s.id === selectedSchoolId);
    const bankAccount = bankAccounts.find(acc => acc.id === selectedBankAccountId);

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in transition-all">
            <div className="w-full max-w-4xl max-h-[90vh] bg-white text-slate-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col print:m-0 print:p-0 print:shadow-none print:w-full">
                {/* Header */}
                <div className="p-8 border-b border-slate-100 flex justify-between items-start print:hidden">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Termo de Conciliação Bancária</h2>
                        <p className="text-slate-500 text-sm font-medium">Relatório detalhado para fins de prestação de contas.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => window.print()}
                            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-sm">print</span>
                            Imprimir PDF
                        </button>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 transition-all"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>
                </div>

                {/* Report Content */}
                <div className="flex-1 overflow-y-auto p-12 print:p-8">
                    {/* School & Bank Header */}
                    <div className="flex flex-col gap-6 mb-12">
                        <div className="flex justify-between items-end border-b-2 border-slate-900 pb-4">
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Entidade</span>
                                <h1 className="text-xl font-black truncate">{school?.name}</h1>
                            </div>
                            <div className="text-right flex flex-col gap-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Período de Referência</span>
                                <span className="text-lg font-bold">{new Date(filterMonth + '-02').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase()}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8 py-4 px-6 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Conta Bancária</span>
                                <span className="text-sm font-bold text-slate-700">
                                    {bankAccount?.bank_name} - {bankAccount?.name}
                                </span>
                                <span className="text-xs text-slate-500">Ag: {bankAccount?.agency} | Cta: {bankAccount?.account_number}</span>
                            </div>
                            <div className="text-right flex flex-col gap-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data de Emissão</span>
                                <span className="text-sm font-bold text-slate-700 font-mono">{new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}</span>
                            </div>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-3 gap-4 mb-12 print:grid-cols-3">
                        <div className="p-6 rounded-2xl border-2 border-slate-100 flex flex-col gap-1 bg-white">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total no Extrato</span>
                            <span className="text-xl font-black text-slate-800">
                                {transactions.reduce((acc, t) => acc + (t.type === 'C' ? t.value : -t.value), 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                            <span className="text-[9px] text-slate-400 font-bold uppercase">{transactions.length} movimentações</span>
                        </div>
                        <div className="p-6 rounded-2xl border-2 border-emerald-100 flex flex-col gap-1 bg-emerald-50/20">
                            <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Conciliados (Ok)</span>
                            <span className="text-xl font-black text-emerald-600">
                                {transactions.filter(t => t.status === 'matched' || t.status === 'new').length} Itens
                            </span>
                            <span className="text-[9px] text-emerald-400 font-bold uppercase">Validado com o sistema</span>
                        </div>
                        <div className="p-6 rounded-2xl border-2 border-amber-100 flex flex-col gap-1 bg-amber-50/20">
                            <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest">Pendentes</span>
                            <span className="text-xl font-black text-amber-600">
                                {transactions.filter(t => t.status === 'pending').length} Itens
                            </span>
                            <span className="text-[9px] text-amber-400 font-bold uppercase">Aguardando ação</span>
                        </div>
                    </div>

                    {/* Detailed Table */}
                    <div className="flex flex-col gap-4">
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-[0.2em] border-l-4 border-slate-900 pl-4">Detalhamento das Operações</h3>
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</th>
                                    <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Descrição Bancária</th>
                                    <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor</th>
                                    <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                    <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ref. Sistema</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {transactions.map(t => {
                                    const match = systemEntries.find(se => se.id === t.matched_entry_id);
                                    return (
                                        <tr key={t.id} className="text-xs">
                                            <td className="px-4 py-4 font-mono text-slate-500">{new Date(t.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                                            <td className="px-4 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-800">{t.description}</span>
                                                    <span className="text-[9px] text-slate-400 font-mono italic">{t.fitid}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className={`font-black ${t.type === 'C' ? 'text-emerald-600' : 'text-red-500'}`}>
                                                    {t.type === 'C' ? '+' : '-'} {t.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-md ${t.status === 'matched' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                    {t.status === 'matched' ? 'Conciliado' : 'Pendente'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-slate-400 italic">
                                                {match ? match.description : '--'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Signatures */}
                    <div className="mt-24 grid grid-cols-2 gap-12 print:mt-16">
                        <div className="flex flex-col items-center gap-2 border-t border-slate-300 pt-4">
                            <span className="text-xs font-bold text-slate-700">Diretor(a) Escolar</span>
                            <span className="text-[10px] text-slate-400 font-mono">Assinatura / Carimbo</span>
                        </div>
                        <div className="flex flex-col items-center gap-2 border-t border-slate-300 pt-4">
                            <span className="text-xs font-bold text-slate-700">Responsável Financeiro</span>
                            <span className="text-[10px] text-slate-400 font-mono">Assinatura / Carimbo</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReconciliationReport;
