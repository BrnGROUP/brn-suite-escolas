
import React, { useState } from 'react';
import { formatCurrency } from '../../lib/printUtils';

interface ContractTableProps {
    contracts: any[];
    onDelete?: (id: string) => void;
    onEdit?: (contract: any) => void;
    onPrint?: (contract: any) => void;
    onManageDocuments?: (contract: any) => void;
}

const ContractsTable: React.FC<ContractTableProps> = ({ contracts, onDelete, onEdit, onPrint, onManageDocuments }) => {
    const [expandedContractId, setExpandedContractId] = useState<string | null>(null);

    if (contracts.length === 0) {
        return (
            <div className="bg-surface-dark border border-surface-border rounded-3xl p-20 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-4xl text-slate-600">history_edu</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Nenhum contrato encontrado</h3>
                <p className="text-slate-500 max-w-md">Registre novos contratos de serviços recorrentes para gerenciar o saldo e as prestações vinculadas.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {contracts.map(contract => {
                const entries = contract.financial_entries || [];
                // Use Math.abs because financial entry values for expenses are usually negative
                const executed = entries.reduce((acc: number, entry: any) => acc + Math.abs(entry.value || 0), 0);
                const total = Math.abs(contract.total_value || 0);
                const balance = Math.max(0, total - executed);
                const progress = total > 0 ? (executed / total) * 100 : 0;
                const isExpanded = expandedContractId === contract.id;

                // Color logic: Starts red, goes to yellow/orange, and green at 100%
                const getStatusColor = (pct: number) => {
                    if (pct >= 100) return 'emerald';
                    if (pct >= 70) return 'orange';
                    if (pct >= 30) return 'yellow';
                    return 'red';
                };

                const statusColor = getStatusColor(progress);

                return (
                    <div key={contract.id} className={`bg-[#111a22] border border-white/5 rounded-[32px] p-6 md:p-8 hover:border-primary/30 transition-all group shadow-xl transition-all duration-300 ${isExpanded ? 'md:col-span-2' : ''}`}>
                        <div className="flex justify-between items-start mb-6 gap-4">
                            <div className="flex items-center gap-4 min-w-0">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0 ${contract.category === 'INTERNET' ? 'bg-blue-500/20 text-blue-400' :
                                    contract.category === 'GÁS' ? 'bg-orange-500/20 text-orange-400' : 'bg-primary/20 text-primary'
                                    }`}>
                                    <span className="material-symbols-outlined">
                                        {contract.category === 'INTERNET' ? 'wifi' : contract.category === 'GÁS' ? 'propane_tank' : 'description'}
                                    </span>
                                </div>
                                <div className="min-w-0">
                                    <h4 className="font-black text-white uppercase tracking-tight line-clamp-1">{contract.suppliers?.name}</h4>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{contract.contract_number || 'Sem Número'}</p>
                                </div>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shrink-0 ${contract.status === 'Ativo' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                                }`}>
                                {contract.status}
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Objeto do Contrato</p>
                                <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">{contract.description}</p>
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 text-center">Valor Total</p>
                                    <p className="text-sm font-black text-white text-center">{formatCurrency(total)}</p>
                                </div>
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 text-center">Valor Mensal</p>
                                    <p className="text-sm font-black text-primary text-center">{formatCurrency(contract.monthly_value)}</p>
                                </div>
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 text-center">Executado</p>
                                    <p className="text-sm font-black text-emerald-500 text-center">{formatCurrency(executed)}</p>
                                </div>
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 text-center">Saldo</p>
                                    <p className="text-sm font-black text-slate-300 text-center">{formatCurrency(balance)}</p>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-end mb-3">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Status de Execução</p>
                                        <p className="text-xs font-black text-white">{formatCurrency(executed)} <span className="text-slate-500 font-medium">de {formatCurrency(total)}</span></p>
                                    </div>
                                    <p className={`text-xs font-black transition-colors duration-500 text-${statusColor}-500`}>{progress.toFixed(1)}%</p>
                                </div>
                                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                                    <div
                                        className={`h-full transition-all duration-1000 bg-${statusColor}-500 shadow-[0_0_10px_rgba(0,0,0,0.3)] shadow-${statusColor}-500/30`}
                                        style={{ width: `${Math.min(100, progress)}%` }}
                                    ></div>
                                </div>
                            </div>

                            {isExpanded && (
                                <div className="pt-6 border-t border-white/5 animate-in slide-in-from-top-4 duration-500">
                                    <div className="flex items-center justify-between mb-4">
                                        <h5 className="text-[10px] font-black text-primary uppercase tracking-widest">Lançamentos / Notas Fiscais</h5>
                                        <span className="text-[10px] text-slate-500 font-bold">{entries.length} registro(s)</span>
                                    </div>
                                    {entries.length === 0 ? (
                                        <p className="text-[10px] text-slate-500 italic text-center py-4">Nenhum lançamento vinculado a este contrato até o momento.</p>
                                    ) : (
                                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                                            {entries.map((entry: any, index: number) => (
                                                <div key={index} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                                                    <div className="flex flex-col gap-0.5 min-w-0">
                                                        <span className="text-[10px] font-black text-white truncate">{entry.description || 'Lançamento sem descrição'}</span>
                                                        <span className="text-[9px] text-slate-500 font-bold uppercase">{new Date(entry.date).toLocaleDateString('pt-BR')}</span>
                                                    </div>
                                                    <span className="text-xs font-black text-white shrink-0 ml-4">{formatCurrency(entry.value)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="pt-4 border-t border-white/5 flex flex-wrap items-center justify-between gap-4">
                                <div className="flex items-center gap-2 shrink-0">
                                    <span className="material-symbols-outlined text-slate-500 text-sm">calendar_month</span>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight whitespace-nowrap">
                                        {new Date(contract.start_date).toLocaleDateString()} — {new Date(contract.end_date).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 shrink-0">
                                    <button
                                        onClick={() => setExpandedContractId(isExpanded ? null : contract.id)}
                                        className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${isExpanded ? 'bg-primary text-white' : 'bg-white/5 text-slate-500 hover:text-white hover:bg-white/10'}`}
                                        title="Ver Lançamentos"
                                    >
                                        <span className="material-symbols-outlined text-lg">{isExpanded ? 'visibility_off' : 'receipt_long'}</span>
                                        <span className="hidden sm:inline">{isExpanded ? 'Ocultar' : 'Lançamentos'}</span>
                                    </button>
                                    <button
                                        onClick={() => onPrint?.(contract)}
                                        className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                                        title="Imprimir Contrato"
                                    >
                                        <span className="material-symbols-outlined text-lg">print</span>
                                    </button>
                                    <button
                                        onClick={() => onManageDocuments?.(contract)}
                                        className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                                        title="Documentos de Cotação"
                                    >
                                        <span className="material-symbols-outlined text-lg">folder_shared</span>
                                    </button>
                                    <button
                                        onClick={() => onEdit?.(contract)}
                                        className="p-2 text-slate-500 hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                                        title="Editar Contrato"
                                    >
                                        <span className="material-symbols-outlined text-lg">edit</span>
                                    </button>
                                    <button
                                        onClick={() => onDelete?.(contract.id)}
                                        className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                                        title="Excluir Contrato"
                                    >
                                        <span className="material-symbols-outlined text-lg">delete</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default ContractsTable;
