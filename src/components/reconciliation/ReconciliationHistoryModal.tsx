
import React from 'react';
import { useReconciliationHistory, useDeleteReconciliationHistory } from '../../hooks/useReconciliationHistory';
import { User } from '../../types';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';

interface ReconciliationHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User;
    schoolId: string;
    bankAccountId: string;
}

const ReconciliationHistoryModal: React.FC<ReconciliationHistoryModalProps> = ({
    isOpen, onClose, user, schoolId, bankAccountId
}) => {
    const { data: history = [], isLoading } = useReconciliationHistory(user, { schoolId, bankAccountId });
    const { addToast } = useToast();
    const { confirm } = useConfirm();
    const deleteMutation = useDeleteReconciliationHistory();

    const handleDelete = async (id: string) => {
        if (!await confirm({
            title: 'Excluir Extrato do Histórico',
            message: 'Deseja excluir este extrato do histórico? (Lançamentos já conciliados na aba Financeiro precisarão ser desfeitos manualmente se necessário). Esta ação é irreversível.',
            isDestructive: true
        })) return;
        deleteMutation.mutate(id, {
            onSuccess: () => addToast('Registro excluído com sucesso.', 'success'),
            onError: (err: any) => addToast('Erro ao excluir: ' + err.message, 'error')
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
            <div className="bg-[#0f172a] border border-white/10 rounded-[40px] w-full max-w-6xl h-[85vh] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined text-3xl">history</span>
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Histórico de Conciliação</h2>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Registros de uploads e conferências mensais</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 transition-all flex items-center justify-center">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8">
                    {isLoading ? (
                        <div className="flex flex-col gap-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse" />
                            ))}
                        </div>
                    ) : history.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-4">
                            <span className="material-symbols-outlined text-6xl opacity-20">cloud_off</span>
                            <p className="font-bold uppercase tracking-widest text-[10px]">Nenhum registro encontrado para esta conta.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {history.map((record: any) => (
                                <div key={record.id} className="bg-white/5 border border-white/5 rounded-3xl p-6 hover:bg-white/[0.08] transition-all group relative overflow-hidden">
                                    {/* Background glow for record type */}
                                    {record.account_type === 'Conta Investimento' && (
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-[60px] pointer-events-none" />
                                    )}

                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
                                        {/* Info Side */}
                                        <div className="flex gap-4 flex-1">
                                            <div className="flex flex-col items-center justify-center min-w-[64px] bg-black/20 rounded-xl p-2 h-fit border border-white/5">
                                                <span className="text-[10px] font-black text-primary uppercase tracking-tighter">
                                                    {new Date(0, record.month - 1).toLocaleString('pt-BR', { month: 'short' }).toUpperCase()}
                                                </span>
                                                <span className="text-xl font-black text-white leading-none">{record.year}</span>
                                            </div>

                                            <div className="flex flex-col gap-0.5">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${record.account_type === 'Conta Investimento' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                                        {record.account_type}
                                                    </span>
                                                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-[12px]">person</span>
                                                        {record.users?.name || 'Sistema'}
                                                    </span>
                                                </div>
                                                <h3 className="text-white font-black text-sm uppercase tracking-tight truncate max-w-[200px]">{record.bank_accounts?.name}</h3>
                                                <p className="text-slate-500 text-[10px] font-medium flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-[12px]">account_balance</span>
                                                    {record.bank_accounts?.bank_name} • AG: {record.bank_accounts?.agency} • CTA: {record.bank_accounts?.account_number}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Data Side (Investment Totals) */}
                                        {record.account_type === 'Conta Investimento' && (
                                            <div className="flex gap-2 bg-black/20 rounded-xl p-3 border border-white/5 flex-wrap sm:flex-nowrap">
                                                <div className="flex flex-col gap-0.5 min-w-[80px]">
                                                    <span className="text-[8px] font-black text-slate-500 uppercase">Rendimento</span>
                                                    <span className="text-xs font-black text-emerald-400">
                                                        {Number(record.reported_revenue || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                    </span>
                                                </div>
                                                <div className="w-px h-8 bg-white/5 hidden sm:block" />
                                                <div className="flex flex-col gap-0.5 min-w-[80px]">
                                                    <span className="text-[8px] font-black text-slate-500 uppercase">Impostos</span>
                                                    <span className="text-xs font-black text-rose-400">
                                                        {Number(record.reported_taxes || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                    </span>
                                                </div>
                                                <div className="w-px h-8 bg-white/5 hidden sm:block" />
                                                <div className="flex flex-col gap-0.5 min-w-[80px]">
                                                    <span className="text-[8px] font-black text-slate-500 uppercase">Saldo Final</span>
                                                    <span className="text-xs font-black text-white">
                                                        {Number(record.reported_balance || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Actions Side */}
                                        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                                            {record.pdf_url && (
                                                record.pdf_url === 'EXEMPT' ? (
                                                    <div 
                                                        className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-xl cursor-help relative group/tooltip"
                                                        title={`PDF Dispensado: ${record.pdf_name || record.no_movement_reason || 'Sem justificativa'}`}
                                                    >
                                                        <span className="material-symbols-outlined text-base">block</span>
                                                        <span className="text-[9px] font-black uppercase tracking-widest whitespace-nowrap">PDF: N/A</span>
                                                        {/* Premium dynamic tooltip */}
                                                        <div className="absolute bottom-full mb-2 hidden group-hover/tooltip:flex flex-col bg-slate-950 border border-white/10 rounded-xl p-3 shadow-2xl z-50 text-[10px] w-64 text-left pointer-events-none -right-4 transition-all animate-in fade-in slide-in-from-bottom-2 duration-150">
                                                            <div className="flex flex-col gap-1 text-slate-400">
                                                                <span className="text-amber-400 font-black uppercase text-[8px] tracking-wider">🚫 PDF Dispensado (N/A)</span>
                                                                <p className="text-slate-300 font-bold leading-relaxed">{record.pdf_name?.replace('Não se aplica: ', '') || record.no_movement_reason}</p>
                                                                <div className="border-t border-white/5 my-1" />
                                                                <span className="flex items-center gap-1 font-medium"><span className="material-symbols-outlined text-[12px]">person</span> Por: {record.users?.name || 'Gestor'}</span>
                                                                <span className="flex items-center gap-1 font-medium"><span className="material-symbols-outlined text-[12px]">event</span> Em: {record.no_movement_confirmed_at ? new Date(record.no_movement_confirmed_at).toLocaleString('pt-BR') : 'N/A'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <a
                                                        href={record.pdf_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-2 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl transition-all"
                                                    >
                                                        <span className="material-symbols-outlined text-xl">picture_as_pdf</span>
                                                        <span className="text-[9px] font-black uppercase tracking-widest whitespace-nowrap">PDF</span>
                                                    </a>
                                                )
                                            )}
                                            {record.file_url && (
                                                record.file_url === 'EXEMPT' ? (
                                                    <div 
                                                        className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-xl cursor-help relative group/tooltip"
                                                        title={`Dados Dispensados: ${record.file_name || record.no_movement_reason || 'Sem justificativa'}`}
                                                    >
                                                        <span className="material-symbols-outlined text-base">block</span>
                                                        <span className="text-[9px] font-black uppercase tracking-widest whitespace-nowrap">DADOS: N/A</span>
                                                        {/* Premium dynamic tooltip */}
                                                        <div className="absolute bottom-full mb-2 hidden group-hover/tooltip:flex flex-col bg-slate-950 border border-white/10 rounded-xl p-3 shadow-2xl z-50 text-[10px] w-64 text-left pointer-events-none -right-4 transition-all animate-in fade-in slide-in-from-bottom-2 duration-150">
                                                            <div className="flex flex-col gap-1 text-slate-400">
                                                                <span className="text-amber-400 font-black uppercase text-[8px] tracking-wider">🚫 Dados Dispensados (N/A)</span>
                                                                <p className="text-slate-300 font-bold leading-relaxed">{record.file_name?.replace('Não se aplica: ', '') || record.no_movement_reason}</p>
                                                                <div className="border-t border-white/5 my-1" />
                                                                <span className="flex items-center gap-1 font-medium"><span className="material-symbols-outlined text-[12px]">person</span> Por: {record.users?.name || 'Gestor'}</span>
                                                                <span className="flex items-center gap-1 font-medium"><span className="material-symbols-outlined text-[12px]">event</span> Em: {record.no_movement_confirmed_at ? new Date(record.no_movement_confirmed_at).toLocaleString('pt-BR') : 'N/A'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <a
                                                        href={record.file_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-2 px-3 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 rounded-xl transition-all"
                                                    >
                                                        <span className="material-symbols-outlined text-xl">database</span>
                                                        <span className="text-[9px] font-black uppercase tracking-widest whitespace-nowrap">DADOS</span>
                                                    </a>
                                                )
                                            )}
                                            <button
                                                onClick={() => handleDelete(record.id)}
                                                disabled={deleteMutation.isPending}
                                                className="flex items-center justify-center w-10 h-10 bg-white/5 hover:bg-rose-500/10 text-slate-500 hover:text-rose-500 border border-white/5 rounded-xl transition-all disabled:opacity-50 shrink-0"
                                                title="Excluir Extrato"
                                            >
                                                <span className="material-symbols-outlined text-xl">delete</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 bg-white/5 border-t border-white/5 flex justify-end">
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Os PDFs e dados de conciliação são armazenados para fins de auditoria e prestação de contas.</p>
                </div>
            </div>
        </div>
    );
};

export default ReconciliationHistoryModal;
