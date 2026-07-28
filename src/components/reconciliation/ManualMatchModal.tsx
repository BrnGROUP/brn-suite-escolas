import React, { useState } from 'react';
import { BankTransaction } from '../../types';

interface ManualMatchModalProps {
    bt: BankTransaction;
    systemEntries: any[];
    suppliers: any[];
    programs: any[];
    rubrics: any[];
    manualSearch: string;
    setManualSearch: (s: string) => void;
    onConfirmMatch: (bt: BankTransaction, entryIds: string[], splitInfo?: { originalEntryId: string, value: number }) => void;
    onClose: () => void;
}

const ManualMatchModal: React.FC<ManualMatchModalProps> = ({
    bt, systemEntries, suppliers, programs, rubrics, manualSearch, setManualSearch, onConfirmMatch, onClose
}) => {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [showSplitConfirm, setShowSplitConfirm] = useState(false);
    const [filterByType, setFilterByType] = useState(true);

    // Map system entries to include display names of supplier, program, and rubric
    const mappedEntries = React.useMemo(() => {
        return systemEntries.map(e => ({
            ...e,
            supplierName: suppliers.find(s => s.id === e.supplier_id)?.name || 'Geral/Outros',
            programName: programs.find(p => p.id === e.program_id)?.name || 'Sem Programa',
            rubricName: rubrics.find(r => r.id === e.rubric_id)?.name || 'Sem Rubrica'
        }));
    }, [systemEntries, suppliers, programs, rubrics]);

    const filteredEntries = mappedEntries
        .filter(e => {
            if (e.is_reconciled) return false;

            // Option to strictly match standard accounting types (C = Entrada, D = Saída)
            if (filterByType) {
                const typeMatches = bt.type === 'C' ? e.type === 'Entrada' : e.type === 'Saída';
                if (!typeMatches) return false;
            }

            // If there's no search term, return all entries
            if (!manualSearch.trim()) return true;

            const searchLower = manualSearch.toLowerCase().trim();

            // Match text fields
            const matchesText = 
                e.description.toLowerCase().includes(searchLower) ||
                e.supplierName.toLowerCase().includes(searchLower) ||
                e.programName.toLowerCase().includes(searchLower) ||
                (e.document_number && e.document_number.toLowerCase().includes(searchLower));

            if (matchesText) return true;

            // Match numeric values in multiple BRL/standard formats
            const valNum = Math.abs(Number(e.value)); // use absolute value for comparisons
            const valStr = valNum.toString();
            const valFixed = valNum.toFixed(2);
            const valBrl = valNum.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
            const valBrlNoDec = valNum.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
            const valCurrency = valNum.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }).toLowerCase();

            return (
                valStr.includes(searchLower) ||
                valFixed.includes(searchLower) ||
                valBrl.includes(searchLower) ||
                valBrlNoDec.includes(searchLower) ||
                valCurrency.includes(searchLower)
            );
        })
        .sort((a, b) => {
            const aValDiff = Math.abs(Number(a.value) - bt.value);
            const bValDiff = Math.abs(Number(b.value) - bt.value);
            if (aValDiff !== bValDiff) return aValDiff - bValDiff;
            return new Date(b.date).getTime() - new Date(a.date).getTime();
        });

    const selectedEntries = mappedEntries.filter(e => selectedIds.includes(e.id));
    const totalSelected = selectedEntries.reduce((sum, e) => sum + Math.abs(Number(e.value)), 0);
    const diff = bt.value - totalSelected;
    const isExactMatch = Math.abs(diff) < 0.01;
    const isPartialPayment = selectedIds.length === 1 && Math.abs(Number(selectedEntries[0]?.value)) > bt.value;

    const toggleId = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleConfirm = () => {
        if (isExactMatch) {
            onConfirmMatch(bt, selectedIds);
        } else if (isPartialPayment) {
            setShowSplitConfirm(true);
        }
    };

    const handleSplitConfirm = () => {
        const entry = selectedEntries[0];
        onConfirmMatch(bt, [], { originalEntryId: entry.id, value: bt.value });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-3xl bg-[#0f172a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95">
                {/* Header */}
                <div className="p-6 border-b border-white/5 bg-white/5 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                            <span className="material-symbols-outlined text-2xl">account_balance_wallet</span>
                        </div>
                        <div>
                            <h3 className="text-white font-black text-lg uppercase tracking-tight">Vincular Lançamentos</h3>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-slate-500 text-[10px] uppercase font-black tracking-widest">Extrato:</span>
                                <span className="text-white text-[11px] font-bold px-2 py-0.5 bg-white/5 rounded-md border border-white/10 uppercase">{bt.description}</span>
                                <span className={`text-[11px] font-black ${bt.type === 'C' ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {bt.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-all">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="flex h-[480px]">
                    {/* Left Side: Search & List */}
                    <div className="flex-1 flex flex-col p-6 gap-4 border-r border-white/5 min-w-0">
                        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                            <div className="relative flex-1">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 text-sm">search</span>
                                <input
                                    type="text"
                                    value={manualSearch}
                                    onChange={e => setManualSearch(e.target.value)}
                                    placeholder="Buscar por descrição, fornecedor, programa ou valor..."
                                    className="w-full bg-card-dark border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-xs text-white outline-none focus:border-indigo-500 transition-all"
                                />
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer px-4 py-2 bg-white/5 border border-white/10 rounded-2xl select-none hover:bg-white/10 transition-all shrink-0">
                                <input
                                    type="checkbox"
                                    checked={filterByType}
                                    onChange={e => setFilterByType(e.target.checked)}
                                    className="w-4 h-4 rounded border-white/20 bg-[#0f172a] text-indigo-500 focus:ring-indigo-500/50"
                                />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    Apenas {bt.type === 'C' ? 'Entradas' : 'Saídas'}
                                </span>
                            </label>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            <div className="flex flex-col gap-2">
                                {filteredEntries.map(entry => {
                                    const isSelected = selectedIds.includes(entry.id);
                                    return (
                                        <button
                                            key={entry.id}
                                            onClick={() => toggleId(entry.id)}
                                            className={`w-full text-left p-4 rounded-2xl border transition-all flex gap-3 items-center group ${
                                                isSelected 
                                                ? 'bg-indigo-500/20 border-indigo-500/50 ring-1 ring-indigo-500/50' 
                                                : 'bg-white/5 border-white/5 hover:bg-white/10'
                                            }`}
                                        >
                                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all shrink-0 ${
                                                isSelected ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-white/20'
                                            }`}>
                                                {isSelected && <span className="material-symbols-outlined text-xs font-black">check</span>}
                                            </div>
                                            <div className="flex-1 min-w-0 flex flex-col gap-1">
                                                <span className={`text-xs font-black uppercase tracking-tight truncate ${isSelected ? 'text-indigo-300' : 'text-white'}`}>
                                                    {entry.description}
                                                </span>
                                                
                                                {/* Date & Document Info */}
                                                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                                                    <span className="flex items-center gap-1 text-slate-400 shrink-0">
                                                        <span className="material-symbols-outlined text-[12px]">calendar_today</span>
                                                        {new Date(entry.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                                                    </span>
                                                    {entry.document_number && (
                                                        <>
                                                            <span className="text-white/10">•</span>
                                                            <span className="flex items-center gap-1 text-slate-500 shrink-0">
                                                                <span className="material-symbols-outlined text-[12px]">description</span>
                                                                Nº {entry.document_number}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>

                                                {/* Supplier & Program/Rubric metadata */}
                                                <div className="flex flex-col gap-0.5 mt-0.5 text-slate-500">
                                                    <div className="text-[10px] text-slate-300 font-bold flex items-center gap-1 truncate">
                                                        <span className="material-symbols-outlined text-[13px] text-indigo-400 shrink-0">person</span>
                                                        <span className="truncate">Fornecedor: {entry.supplierName}</span>
                                                    </div>
                                                    <div className="text-[9px] text-slate-500 font-medium flex items-center gap-1 truncate">
                                                        <span className="material-symbols-outlined text-[13px] text-slate-600 shrink-0">label</span>
                                                        <span className="truncate">{entry.programName} {entry.rubricName && `• ${entry.rubricName}`}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end shrink-0 pl-2">
                                                <span className={`text-xs font-black ${entry.type === 'Entrada' ? 'text-emerald-400' : 'text-red-400'}`}>
                                                    {Number(entry.value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                                {filteredEntries.length === 0 && (
                                    <div className="py-20 text-center">
                                        <span className="material-symbols-outlined text-5xl mb-3 block text-slate-700">filter_list_off</span>
                                        <p className="text-xs text-slate-500 uppercase font-black tracking-widest">Nenhum lançamento compatível</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Selection Summary */}
                    <div className="w-[280px] bg-black/20 p-6 flex flex-col justify-between shrink-0">
                        <div className="flex flex-col gap-4 min-h-0">
                            <div>
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Itens Selecionados ({selectedIds.length})</h4>
                                <div className="space-y-3 max-h-[240px] overflow-y-auto pr-2 custom-scrollbar">
                                    {selectedEntries.map(e => (
                                        <div key={e.id} className="flex justify-between items-start group bg-white/[0.02] border border-white/5 rounded-xl p-2.5 gap-2">
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[10px] text-white font-black uppercase truncate">{e.description}</p>
                                                <p className="text-[9px] text-indigo-300 font-bold truncate mt-0.5">{e.supplierName}</p>
                                                <div className="flex items-center gap-1 text-[8px] text-slate-500 font-medium mt-0.5">
                                                    <span>{new Date(e.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span>
                                                    {e.document_number && <span>• Nº {e.document_number}</span>}
                                                </div>
                                            </div>
                                            <span className="text-[10px] text-emerald-400 font-black whitespace-nowrap pt-0.5">
                                                {Number(e.value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </span>
                                        </div>
                                    ))}
                                    {selectedIds.length === 0 && (
                                        <p className="text-[10px] text-slate-600 italic">Nenhum item selecionado</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 pt-6 border-t border-white/5">
                            <div className="space-y-2">
                                <div className="flex justify-between text-[11px]">
                                    <span className="text-slate-500 uppercase font-black">Total Selecionado</span>
                                    <span className="text-white font-black">{totalSelected.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                </div>
                                <div className="flex justify-between text-[11px]">
                                    <span className="text-slate-500 uppercase font-black">Diferença</span>
                                    <span className={`font-black ${isExactMatch ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {diff.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </span>
                                </div>
                            </div>

                            {isPartialPayment && !isExactMatch && !showSplitConfirm && (
                                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="material-symbols-outlined text-amber-500 text-sm">info</span>
                                        <span className="text-[9px] font-black text-amber-500 uppercase">Pagamento Parcial</span>
                                    </div>
                                    <p className="text-[9px] text-slate-400 leading-relaxed font-medium">
                                        O valor do banco é menor. Deseja dividir o lançamento original?
                                    </p>
                                </div>
                            )}

                            <button
                                onClick={handleConfirm}
                                disabled={selectedIds.length === 0 || (!isExactMatch && !isPartialPayment)}
                                className={`w-full py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                    isExactMatch 
                                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' 
                                    : isPartialPayment
                                    ? 'bg-amber-500 hover:bg-amber-600 text-black shadow-lg shadow-amber-500/20'
                                    : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                                }`}
                            >
                                {isExactMatch ? 'Confirmar Vínculo' : isPartialPayment ? 'Conciliar e Dividir' : 'Ajustar Seleção'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Split Confirmation Overlay */}
            {showSplitConfirm && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="w-full max-w-sm bg-[#1e293b] border border-amber-500/30 rounded-3xl p-8 text-center shadow-3xl">
                        <div className="w-16 h-16 bg-amber-500/20 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="material-symbols-outlined text-3xl">call_split</span>
                        </div>
                        <h4 className="text-white font-black text-lg uppercase tracking-tight mb-2">Confirmar Divisão</h4>
                        <p className="text-slate-400 text-xs leading-relaxed mb-8 font-medium">
                            O lançamento original será dividido:<br/>
                            <span className="text-emerald-400 font-black mt-2 block">
                                Pago: {bt.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                            <span className="text-amber-400 font-black block">
                                Restante: {Math.abs(diff).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            <button 
                                onClick={() => setShowSplitConfirm(false)}
                                className="py-3 px-4 bg-white/5 hover:bg-white/10 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleSplitConfirm}
                                className="py-3 px-4 bg-amber-500 hover:bg-amber-600 text-black rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-amber-500/20"
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManualMatchModal;


