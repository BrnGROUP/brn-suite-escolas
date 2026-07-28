
import React from 'react';
import { TransactionStatus, User } from '../../types';
import { FinancialEntryExtended } from '../../hooks/useFinancialEntries';
import Skeleton from '../common/Skeleton';

interface FinancialTableProps {
    entries: FinancialEntryExtended[];
    loading: boolean;
    selectedIds: string[];
    canEdit: boolean;
    isAdmin: boolean;
    onToggleSelect: (id: string) => void;
    onToggleSelectAll: () => void;
    onEdit: (entry: FinancialEntryExtended) => void;
    onDelete: (entry: FinancialEntryExtended) => void;
    onConciliate: (id: string, currentStatus: string) => void;
}

const FinancialTable: React.FC<FinancialTableProps> = ({
    entries,
    loading,
    selectedIds,
    canEdit,
    isAdmin,
    onToggleSelect,
    onToggleSelectAll,
    onEdit,
    onDelete,
    onConciliate
}) => {

    if (loading) {
        return (
            <div className="bg-surface-dark border border-surface-border rounded-2xl overflow-hidden min-h-[400px]">
                <div className="animate-pulse">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="flex border-b border-surface-border p-4 gap-4 items-center">
                            <Skeleton variant="rect" width={20} height={20} className="rounded" />
                            <div className="flex-1 space-y-2">
                                <Skeleton variant="text" width="60%" />
                                <Skeleton variant="text" width="40%" />
                            </div>
                            <Skeleton variant="rect" width={80} height={24} className="rounded-lg" />
                            <Skeleton variant="rect" width={100} height={24} className="rounded-lg" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const StatusBadge = ({ s }: { s: string }) => (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border border-white/10 ${s === TransactionStatus.PAGO || s === TransactionStatus.RECEBIDO ? 'text-green-500 bg-green-500/10' :
            s === TransactionStatus.PENDENTE ? 'text-yellow-500 bg-yellow-500/10' :
                s === TransactionStatus.CONSOLIDADO ? 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' :
                    'text-blue-500 bg-blue-500/10'
            }`}>
            {s}
        </span>
    );

    return (
        <div className="bg-surface-dark border border-surface-border rounded-2xl overflow-hidden shadow-2xl min-h-[400px]">
            {/* Mobile View: Cards */}
            <div className="md:hidden flex flex-col divide-y divide-surface-border/30">
                {entries.length === 0 ? (
                    <div className="p-20 text-center text-slate-500 italic">
                        Nenhum lançamento encontrado para os filtros selecionados.
                    </div>
                ) : (
                    entries.map((entry) => {
                        const displayDate = entry.payment_date || entry.invoice_date || entry.date;
                        const hasPaymentData = !!(entry.payment_date && entry.auth_number);
                        const hasPaymentVoucher = !!(entry.attachments && entry.attachments.some((a: any) => a.category === 'Comprovante' || a.category === 'Comprovante de Pagamento' || a.name?.toLowerCase().includes('comprovante')));

                        return (
                            <div key={entry.id} className="p-4 flex flex-col gap-4 hover:bg-white/[0.02] transition-colors relative overflow-hidden group">
                                {/* Subtle background glow for entry type */}
                                <div className={`absolute -right-4 -top-4 w-16 h-16 rounded-full blur-2xl opacity-10 transition-opacity ${entry.type === 'Entrada' ? 'bg-green-500' : 'bg-red-500'}`} />

                                <div className="flex justify-between items-start relative z-10">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[10px] font-black uppercase tracking-[0.1em] px-2 py-0.5 rounded-md border ${entry.type === 'Entrada' ? 'text-green-400 bg-green-500/10 border-green-500/20' : 'text-orange-400 bg-orange-500/10 border-orange-500/20'}`}>
                                                {entry.type}
                                            </span>
                                            <span className="text-xs text-slate-400 font-bold bg-white/5 px-2 py-0.5 rounded-md" title={entry.payment_date ? 'Data do Pagamento' : (entry.invoice_date ? 'Data da Nota' : 'Data do Lançamento')}>
                                                {new Date(displayDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                                            </span>
                                        </div>
                                        <h4 className="text-sm text-white font-bold leading-tight mt-1 line-clamp-2 flex items-center gap-2">
                                            {entry.description}
                                            {entry.attachments && entry.attachments.length > 0 && (
                                                <span className="material-symbols-outlined text-[16px] text-primary shrink-0">attachment</span>
                                            )}
                                        </h4>
                                    </div>
                                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                                        <div className={`text-base font-black tracking-tight ${entry.type === 'Entrada' ? 'text-green-400' : 'text-red-400'}`}>
                                            {entry.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <StatusBadge s={entry.status} />
                                            {entry.is_reconciled && (
                                                <span className="material-symbols-outlined text-[14px] text-emerald-500" title="Verificado pelo Banco">verified</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 bg-black/20 p-3 rounded-xl border border-white/[0.03]">
                                    <div className="flex items-center gap-4 text-[10px]">
                                        <div className="flex items-center gap-1.5 text-slate-400 font-medium truncate">
                                            <span className="material-symbols-outlined text-[14px] text-primary">store</span>
                                            {entry.supplier || 'Sem Fornecedor'}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-slate-400 font-medium truncate">
                                            <span className="material-symbols-outlined text-[14px] text-primary">school</span>
                                            {entry.school.substring(0, 15)}...
                                        </div>
                                    </div>
                                    {entry.type === 'Saída' && entry.category !== 'Tarifa Bancária' && (
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`text-[8px] font-bold uppercase flex items-center gap-1 ${hasPaymentData ? 'text-emerald-500/80' : 'text-slate-500'}`} title={hasPaymentData ? 'Dados de pagamento completos' : 'Faltam dados de pagamento (data e número)'}>
                                                <span className="material-symbols-outlined text-[10px]">{hasPaymentData ? 'task_alt' : 'hourglass_empty'}</span>
                                                Dados Pgto
                                            </span>
                                            <span className={`text-[8px] font-bold uppercase flex items-center gap-1 ${hasPaymentVoucher ? 'text-emerald-500/80' : 'text-slate-500'}`} title={hasPaymentVoucher ? 'Comprovante anexado' : 'Falta anexo do comprovante'}>
                                                <span className="material-symbols-outlined text-[10px]">{hasPaymentVoucher ? 'verified_user' : 'error'}</span>
                                                Comprovante
                                            </span>
                                        </div>
                                    )}
                                    <div className="h-px bg-white/[0.05] w-full" />
                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-xs text-blue-400 font-black uppercase tracking-wider">{entry.program}</span>
                                            <span className="text-xs text-slate-500 font-medium line-clamp-1">{entry.rubric}</span>
                                        </div>
                                        <div className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${entry.nature === 'Custeio' ? 'text-sky-400 bg-sky-500/10' : 'text-amber-400 bg-amber-500/10'}`}>
                                            {entry.nature}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center bg-white/[0.02] -mx-4 -mb-4 px-4 py-3 border-t border-white/5">
                                    <div className="text-[10px] text-slate-500 font-bold flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-sm">payments</span>
                                        {entry.payment_method}
                                    </div>
                                    {canEdit && (
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => onEdit(entry)} className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center transition-all active:scale-95 shadow-sm border border-primary/20">
                                                <span className="material-symbols-outlined text-[20px]">edit</span>
                                            </button>
                                            <button onClick={() => onDelete(entry)} className="w-11 h-11 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center transition-all active:scale-95 shadow-sm border border-red-500/20">
                                                <span className="material-symbols-outlined text-[20px]">{isAdmin ? 'delete' : (entry.status === TransactionStatus.ESTORNADO ? 'restore_from_trash' : 'block')}</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Desktop View: Table */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                    <thead className="bg-[#111a22]/80 backdrop-blur-md sticky top-0 z-10">
                        <tr className="border-b border-surface-border">
                            <th className="p-5 w-12">
                                <input
                                    type="checkbox"
                                    aria-label="Selecionar todos"
                                    checked={selectedIds.length === entries.length && entries.length > 0}
                                    onChange={onToggleSelectAll}
                                    className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-primary focus:ring-primary focus:ring-offset-background-dark"
                                />
                            </th>
                            <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Fluxo</th>
                            <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Descrição / Contexto</th>
                            <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Recurso & Natureza</th>
                            <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Valor</th>
                            <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Status</th>
                            {canEdit && <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Gestão</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {entries.length === 0 ? (
                            <tr>
                                <td colSpan={canEdit ? 7 : 6} className="p-20 text-center text-slate-500 italic">
                                    Nenhum lançamento encontrado para os filtros selecionados.
                                </td>
                            </tr>
                        ) : (
                            entries.map((entry) => {
                                const displayDate = entry.payment_date || entry.invoice_date || entry.date;
                                const hasPaymentData = !!(entry.payment_date && entry.auth_number);
                                const hasPaymentVoucher = !!(entry.attachments && entry.attachments.some((a: any) => a.category === 'Comprovante' || a.category === 'Comprovante de Pagamento' || a.name?.toLowerCase().includes('comprovante')));

                                return (
                                    <tr key={entry.id} className={`border-b border-surface-border/50 hover:bg-white/5 transition-colors group ${selectedIds.includes(entry.id) ? 'bg-primary/5' : ''}`}>
                                        <td className="p-5 w-12">
                                            <input
                                                type="checkbox"
                                                aria-label="Selecionar"
                                                checked={selectedIds.includes(entry.id)}
                                                onChange={() => onToggleSelect(entry.id)}
                                                className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-primary"
                                            />
                                        </td>
                                        <td className="p-5">
                                            <div className="flex flex-col">
                                                <span className={`text-[10px] font-black uppercase tracking-tighter ${entry.type === 'Entrada' ? 'text-green-500' : 'text-orange-500'}`}>
                                                    {entry.type}
                                                </span>
                                                <span className="text-xs text-slate-300 font-mono mt-0.5" title={entry.payment_date ? 'Data do Pagamento' : (entry.invoice_date ? 'Data da Nota' : 'Data do Lançamento')}>
                                                    {new Date(displayDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-sm text-white font-bold line-clamp-1 flex items-center gap-2">
                                                    {entry.description}
                                                    {entry.attachments && entry.attachments.length > 0 && (
                                                        <span className="material-symbols-outlined text-[16px] text-primary shrink-0" title={`${entry.attachments.length} anexo(s)`}>attachment</span>
                                                    )}
                                                </span>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-[12px]">store</span>
                                                        {entry.supplier}
                                                    </span>
                                                    <span className="text-slate-700 text-[10px]">•</span>
                                                    <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-[12px]">school</span>
                                                        {entry.school}
                                                    </span>
                                                    {entry.type === 'Saída' && entry.category !== 'Tarifa Bancária' && (
                                                        <>
                                                            <span className="text-slate-700 text-[10px]">•</span>
                                                            <span className={`text-[8px] font-bold uppercase flex items-center gap-1 ${hasPaymentData ? 'text-emerald-500/80' : 'text-slate-500'}`} title={hasPaymentData ? 'Dados de pagamento completos' : 'Faltam dados de pagamento (data e número)'}>
                                                                <span className="material-symbols-outlined text-[10px]">{hasPaymentData ? 'task_alt' : 'hourglass_empty'}</span>
                                                                Dados Pgto
                                                            </span>
                                                            <span className="text-slate-700 text-[10px]">•</span>
                                                            <span className={`text-[8px] font-bold uppercase flex items-center gap-1 ${hasPaymentVoucher ? 'text-emerald-500/80' : 'text-slate-500'}`} title={hasPaymentVoucher ? 'Comprovante anexado' : 'Falta anexo do comprovante'}>
                                                                <span className="material-symbols-outlined text-[10px]">{hasPaymentVoucher ? 'verified_user' : 'error'}</span>
                                                                Comprovante
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <div className="flex flex-col">
                                                <span className="text-xs text-blue-400 font-bold">{entry.program}</span>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <span className="text-[10px] text-slate-400">{entry.rubric}</span>
                                                    <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                                                    <span className={`text-[10px] font-black uppercase ${entry.nature === 'Custeio' ? 'text-sky-400' : 'text-amber-400'}`}>
                                                        {entry.nature}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-5 text-right font-mono">
                                            <div className={`text-sm font-black ${entry.type === 'Entrada' ? 'text-green-400' : 'text-red-400'}`}>
                                                {entry.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </div>
                                            <div className="text-[9px] text-slate-500 mt-0.5 font-bold uppercase tracking-tighter">
                                                {entry.payment_method}
                                            </div>
                                        </td>
                                        <td className="p-5 text-center">
                                            <div className="flex flex-col items-center gap-1.5">
                                                <div className="flex items-center gap-1.5">
                                                    <StatusBadge s={entry.status} />
                                                    {entry.is_reconciled && (
                                                        <span className="material-symbols-outlined text-[16px] text-emerald-500" title="Auditado: Conciliado com extrato bancário">verified</span>
                                                    )}
                                                </div>
                                                {canEdit && entry.type === 'Saída' && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); onConciliate(entry.id, entry.status); }}
                                                        className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg transition-all ${entry.status === TransactionStatus.CONCILIADO ? 'bg-blue-500 text-white' : 'text-slate-500 hover:text-white hover:bg-white/10'}`}
                                                    >
                                                        {entry.status === TransactionStatus.CONCILIADO ? 'Conciliado' : 'Conciliar'}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                        {canEdit && (
                                            <td className="p-5">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button onClick={() => onEdit(entry)} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-primary/20 text-slate-400 hover:text-primary transition-all flex items-center justify-center">
                                                        <span className="material-symbols-outlined text-[18px]">edit</span>
                                                    </button>
                                                    <button onClick={() => onDelete(entry)} className={`w-8 h-8 rounded-lg bg-white/5 transition-all flex items-center justify-center ${!isAdmin && entry.status === TransactionStatus.ESTORNADO ? 'hover:bg-blue-500/20 text-slate-400 hover:text-blue-500' : 'hover:bg-red-500/20 text-slate-400 hover:text-red-500'}`} title={isAdmin ? 'Excluir permanentemente' : (entry.status === TransactionStatus.ESTORNADO ? 'Reativar Lançamento' : 'Desativar/Estornar')}>
                                                        <span className="material-symbols-outlined text-[18px]">
                                                            {isAdmin ? 'delete' : (entry.status === TransactionStatus.ESTORNADO ? 'restore_from_trash' : 'block')}
                                                        </span>
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default FinancialTable;
