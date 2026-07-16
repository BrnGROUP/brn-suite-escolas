import React, { useState } from 'react';
import { BankTransaction } from '../../types';

interface TransactionTableProps {
    transactions: BankTransaction[];
    systemEntries: any[];
    isMatching: boolean;
    onFileUpload: (file: File) => void;
    onBulkReconcile: () => void;
    onConfirmMatch: (bt: BankTransaction) => void;
    onQuickCreateStart: (bt: BankTransaction) => void;
    onManualMatchStart: (bt: BankTransaction) => void;
    onShowReport: () => void;
    onClear: () => void;
    onUnlink?: (bt: BankTransaction) => void;
}

const TransactionTable: React.FC<TransactionTableProps> = ({
    transactions, systemEntries, isMatching,
    onFileUpload, onBulkReconcile, onConfirmMatch, onQuickCreateStart, onManualMatchStart, onShowReport, onClear,
    onUnlink
}) => {
    const [showIgnored, setShowIgnored] = useState(false);

    const ignoredCount = transactions.filter(t => t.status === 'ignored').length;
    const visibleTransactions = showIgnored
        ? transactions
        : transactions.filter(t => t.status !== 'ignored');

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) onFileUpload(file);
    };

    return (
        <div className="bg-card-dark rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
            <div className="p-4 md:p-6 bg-white/5 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full md:w-auto">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Movimentações do Extrato</span>
                    <div className="flex flex-wrap gap-2 w-full md:w-auto">
                        <label className="text-[9px] md:text-[10px] bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-full font-black uppercase tracking-widest cursor-pointer hover:bg-emerald-500/20 transition-all flex items-center gap-1.5 flex-1 md:flex-none justify-center">
                            <span className="material-symbols-outlined text-sm">add</span>
                            Extrato
                            <input type="file" className="hidden" accept=".ofx,.csv" onChange={handleFileChange} />
                        </label>
                        {transactions.some(t => t.status === 'matched') && !isMatching && (
                            <button
                                onClick={onBulkReconcile}
                                className="text-[9px] md:text-[10px] bg-primary/10 text-primary px-4 py-1.5 rounded-full font-black uppercase tracking-widest hover:bg-primary/20 transition-all flex items-center gap-1.5 flex-1 md:flex-none justify-center"
                            >
                                <span className="material-symbols-outlined text-[14px]">done_all</span>
                                Conciliar {transactions.filter(t => t.status === 'matched').length}
                            </button>
                        )}
                        {ignoredCount > 0 && (
                            <button
                                onClick={() => setShowIgnored(v => !v)}
                                className={`text-[9px] md:text-[10px] px-3 py-1.5 rounded-full font-black uppercase tracking-widest transition-all flex items-center gap-1.5 flex-1 md:flex-none justify-center ${
                                    showIgnored
                                        ? 'bg-slate-500/20 text-slate-300 border border-slate-500/30'
                                        : 'bg-slate-500/10 text-slate-500 hover:bg-slate-500/20 hover:text-slate-400'
                                }`}
                            >
                                <span className="material-symbols-outlined text-[14px]">{showIgnored ? 'visibility_off' : 'visibility'}</span>
                                {ignoredCount} Aplicaç{ignoredCount === 1 ? 'ão' : 'ões'}
                            </button>
                        )}
                    </div>
                </div>
                <div className="flex items-center justify-between w-full md:w-auto gap-4 md:gap-6 border-t md:border-t-0 border-white/5 pt-3 md:pt-0">
                    <button
                        onClick={onShowReport}
                        disabled={transactions.length === 0}
                        className="text-[10px] text-emerald-400 font-bold uppercase hover:underline disabled:opacity-50"
                    >
                        Gerar Termo
                    </button>
                    <button onClick={onClear} className="text-[10px] text-slate-400 font-bold uppercase hover:text-white transition-colors">Fechar Extrato</button>
                </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-white/5 bg-black/20">
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Data</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Descrição no Banco</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Valor</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status / Correspondência</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Ação</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {visibleTransactions.map(bt => {
                            const matchedEntry = systemEntries.find(e => e.id === bt.matched_entry_id);

                            // Ignored row: investment application/redemption — no action needed
                            if (bt.status === 'ignored') {
                                return (
                                    <tr key={bt.id} className="opacity-40">
                                        <td className="px-6 py-3 whitespace-nowrap">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-xs text-slate-400 font-mono">{new Date(bt.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span>
                                                <span className="text-[8px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded-md w-fit bg-slate-500/10 text-slate-500 border border-slate-500/20">
                                                    {bt.extract_type === 'Conta Corrente' ? 'C. Corrente' : 'Investimento'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3">
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-xs text-slate-500 font-bold line-clamp-1">{bt.description}</span>
                                                <span className="text-[9px] text-slate-700 font-mono">{bt.fitid}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className="text-xs font-black text-slate-600">
                                                {bt.type === 'C' ? '+' : '-'} {bt.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3">
                                            <div className="flex items-center gap-2 text-slate-600 p-2 border border-dashed border-slate-700 rounded-xl">
                                                <span className="material-symbols-outlined text-sm">do_not_disturb_on</span>
                                                <span className="text-[10px] font-black uppercase tracking-wide">Desconsiderada</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            <span className="text-[9px] text-slate-700 font-black uppercase">Aplicação / Resgate</span>
                                        </td>
                                    </tr>
                                );
                            }

                            return (
                                <tr key={bt.id} className="group hover:bg-white/[0.02] transition-all">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs text-white font-mono">{new Date(bt.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span>
                                            <span className={`text-[8px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded-md w-fit ${bt.extract_type === 'Conta Corrente' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}>
                                                {bt.extract_type === 'Conta Corrente' ? 'C. Corrente' : 'Investimento'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-xs text-white font-bold line-clamp-1">{bt.description}</span>
                                                <span className="text-[9px] text-slate-600 font-mono">{bt.fitid}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`text-xs font-black ${bt.type === 'C' ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {bt.type === 'C' ? '+' : '-'} {bt.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {bt.status === 'reconciled' && matchedEntry ? (
                                            <div className="flex flex-col gap-2 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-2xl relative group/card overflow-hidden">
                                                <div className="absolute top-0 right-0 p-1 bg-emerald-500/20 text-[8px] font-black text-emerald-400 uppercase tracking-tighter rounded-bl-lg">Conciliado</div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                                                        <span className="material-symbols-outlined text-[14px]">verified</span>
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-[10px] text-white font-black truncate max-w-[150px]">{matchedEntry.description}</span>
                                                        <span className="text-[8px] text-emerald-500/60 font-black uppercase tracking-widest mt-0.5">Lançamento no Sistema</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : bt.status === 'reconciled' && !matchedEntry ? (
                                            <div className="flex flex-col gap-1.5 bg-amber-500/10 border border-amber-500/20 p-3 rounded-2xl">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                                                        <span className="material-symbols-outlined text-[14px]">link_off</span>
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-[10px] text-amber-400 font-black uppercase tracking-wide">Lançamento removido</span>
                                                        <span className="text-[8px] text-amber-300/50 font-bold mt-0.5">O registro vinculado foi apagado</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : bt.status === 'matched' && matchedEntry ? (
                                            <div className="flex flex-col gap-2 bg-emerald-500/5 border border-emerald-500/20 p-3 rounded-2xl relative group/card overflow-hidden">
                                                <div className="absolute top-0 right-0 p-1 bg-emerald-500 text-[8px] font-black text-white uppercase tracking-tighter rounded-bl-lg transform translate-x-1 -translate-y-1 group-hover/card:translate-x-0 group-hover/card:translate-y-0 transition-transform">95% Match</div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                                                        <span className="material-symbols-outlined text-[14px]">account_balance_wallet</span>
                                                    </div>
                                                    <span className="text-[10px] text-emerald-400 font-bold uppercase truncate max-w-[150px]">{matchedEntry.description}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-[9px]">
                                                    <span className="text-slate-500 flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-[10px]">calendar_today</span>
                                                        {new Date(matchedEntry.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                                                    </span>
                                                    <span className="text-emerald-500 font-black">
                                                        {Number(matchedEntry.value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                    </span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-amber-500/50 italic p-3 border border-dashed border-amber-500/20 rounded-2xl">
                                                <span className="material-symbols-outlined text-sm">search</span>
                                                <span className="text-[10px] font-medium uppercase tracking-tighter">Nenhuma correspondência exata</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex flex-col gap-1">
                                            {bt.status === 'reconciled' && matchedEntry ? (
                                                <div className="flex flex-col items-end gap-1">
                                                    <div className="flex items-center gap-2 text-emerald-500 p-2">
                                                        <span className="text-[10px] font-black uppercase">Conciliado</span>
                                                        <span className="material-symbols-outlined text-lg">check_circle</span>
                                                    </div>
                                                    <button
                                                        onClick={() => onUnlink?.(bt)}
                                                        className="text-[9px] text-slate-600 hover:text-rose-400 font-black uppercase tracking-widest transition-colors"
                                                    >
                                                        Desvincular
                                                    </button>
                                                </div>
                                            ) : bt.status === 'reconciled' && !matchedEntry ? (
                                                <button
                                                    onClick={() => onQuickCreateStart(bt)}
                                                    className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500 hover:text-white text-amber-400 border border-amber-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap"
                                                >
                                                    Criar Lançamento
                                                </button>
                                            ) : (
                                                <>
                                                    {bt.status === 'matched' ? (
                                                        <button
                                                            onClick={() => onConfirmMatch(bt)}
                                                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 whitespace-nowrap"
                                                        >
                                                            Confirmar Lançamento
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => onQuickCreateStart(bt)}
                                                            className="px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500 hover:text-white text-indigo-400 border border-indigo-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap"
                                                        >
                                                            Criar Novo Lançamento
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => onManualMatchStart(bt)}
                                                        className="px-4 py-1 text-slate-500 hover:text-white text-[9px] font-black uppercase tracking-widest transition-all"
                                                    >
                                                        Vincular Manualmente
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-white/5 p-4 space-y-4">
                {visibleTransactions.map(bt => {
                    const matchedEntry = systemEntries.find(e => e.id === bt.matched_entry_id);

                    // Ignored card: investment application/redemption
                    if (bt.status === 'ignored') {
                        return (
                            <div key={bt.id} className="bg-white/[0.02] rounded-2xl p-4 space-y-2 border border-dashed border-slate-800 opacity-40">
                                <div className="flex justify-between items-center">
                                    <span className="text-[9px] text-slate-600 font-mono">{new Date(bt.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span>
                                    <span className="text-xs font-black text-slate-700">
                                        {bt.type === 'C' ? '+' : '-'} {bt.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </span>
                                </div>
                                <span className="text-xs text-slate-600 font-bold block">{bt.description}</span>
                                <div className="flex items-center gap-1.5 text-slate-700">
                                    <span className="material-symbols-outlined text-sm">do_not_disturb_on</span>
                                    <span className="text-[9px] font-black uppercase tracking-widest">Desconsiderada — Aplica&#231;&#227;o / Resgate</span>
                                </div>
                            </div>
                        );
                    }

                    return (
                        <div key={bt.id} className="bg-white/5 rounded-2xl p-5 space-y-4 border border-white/5">
                            <div className="flex justify-between items-start">
                                <div className="flex flex-col">
                                    <span className="text-xs text-white font-mono">{new Date(bt.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span>
                                    <span className={`text-[8px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded-md w-fit mt-1 ${bt.extract_type === 'Conta Corrente' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}>
                                        {bt.extract_type === 'Conta Corrente' ? 'C. Corrente' : 'Investimento'}
                                    </span>
                                </div>
                                <span className={`text-sm font-black p-2 rounded-xl bg-black/40 ${bt.type === 'C' ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {bt.type === 'C' ? '+' : '-'} {bt.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </span>
                            </div>

                            <div className="flex flex-col gap-2">
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs text-white font-bold leading-tight">{bt.description}</span>
                                    <span className="text-[9px] text-slate-600 font-mono break-all">{bt.fitid}</span>
                                </div>
                            </div>

                            {/* Matching Section */}
                            <div className="pt-2">
                                {bt.status === 'reconciled' && matchedEntry ? (
                                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                                                <span className="material-symbols-outlined text-[18px]">verified</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <span className="text-[10px] text-white font-bold uppercase truncate block">{matchedEntry.description}</span>
                                                <span className="text-[9px] text-emerald-500/60 font-medium">Lançamento Conciliado</span>
                                            </div>
                                        </div>
                                    </div>
                                ) : bt.status === 'reconciled' && !matchedEntry ? (
                                    <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                                                <span className="material-symbols-outlined text-[18px]">link_off</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <span className="text-[10px] text-amber-400 font-bold uppercase truncate block">Lançamento removido</span>
                                                <span className="text-[9px] text-amber-300/50 font-medium">O registro vinculado foi apagado</span>
                                            </div>
                                        </div>
                                    </div>
                                ) : bt.status === 'matched' && matchedEntry ? (
                                    <div className="bg-emerald-500/5 border border-emerald-500/20 p-3 rounded-xl relative overflow-hidden">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                                                <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <span className="text-[10px] text-emerald-400 font-bold uppercase truncate block">{matchedEntry.description}</span>
                                                <div className="flex justify-between items-center text-[9px] mt-1">
                                                    <span className="text-slate-500">{new Date(matchedEntry.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span>
                                                    <span className="text-emerald-500 font-black">{Number(matchedEntry.value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-amber-500/50 italic p-3 border border-dashed border-amber-500/20 rounded-xl bg-black/20">
                                        <span className="material-symbols-outlined text-sm">search</span>
                                        <span className="text-[9px] font-medium uppercase tracking-tighter">Nenhuma correspondência exata</span>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
                                {bt.status === 'reconciled' && matchedEntry ? (
                                    <div className="flex flex-col gap-1">
                                        <div className="w-full py-3 bg-emerald-500/10 text-emerald-500 rounded-xl text-[10px] font-black uppercase tracking-widest text-center border border-emerald-500/20 flex items-center justify-center gap-2">
                                            <span className="material-symbols-outlined text-base">check_circle</span>
                                            Conciliado
                                        </div>
                                        <button
                                            onClick={() => onUnlink?.(bt)}
                                            className="w-full py-2 text-slate-600 hover:text-rose-400 text-[9px] font-black uppercase tracking-widest transition-colors"
                                        >
                                            Desvincular
                                        </button>
                                    </div>
                                ) : bt.status === 'reconciled' && !matchedEntry ? (
                                    <button
                                        onClick={() => onQuickCreateStart(bt)}
                                        className="w-full h-11 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-base">add_circle</span>
                                        Criar Lançamento
                                    </button>
                                ) : (
                                    <>
                                        {bt.status === 'matched' ? (
                                            <button
                                                onClick={() => onConfirmMatch(bt)}
                                                className="w-full h-11 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                            >
                                                Confirmar Lançamento
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => onQuickCreateStart(bt)}
                                                className="w-full h-11 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                            >
                                                Criar Novo Lançamento
                                            </button>
                                        )}
                                        <button
                                            onClick={() => onManualMatchStart(bt)}
                                            className="w-full py-2 text-slate-500 text-[9px] font-black uppercase tracking-widest"
                                        >
                                            Vincular Manualmente
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default TransactionTable;
