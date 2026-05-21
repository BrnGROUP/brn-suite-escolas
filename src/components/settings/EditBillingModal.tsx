import React, { useEffect, useRef } from 'react';
import { PlatformBilling } from '../../types';

interface EditBillingModalProps {
    isOpen: boolean;
    onClose: () => void;
    record: PlatformBilling | null;
    description: string;
    setDescription: (val: string) => void;
    amount: string;
    setAmount: (val: string) => void;
    referenceMonth: string;
    setReferenceMonth: (val: string) => void;
    onConfirm: () => void;
}

export const EditBillingModal: React.FC<EditBillingModalProps> = ({
    isOpen,
    onClose,
    record,
    description,
    setDescription,
    amount,
    setAmount,
    referenceMonth,
    setReferenceMonth,
    onConfirm
}) => {
    const firstInputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);

        if (firstInputRef.current) {
            firstInputRef.current.focus();
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen || !record) return null;

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200 overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-modal-title"
        >
            <div className="bg-[#111a22] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
                    aria-label="Fechar"
                >
                    <span className="material-symbols-outlined">close</span>
                </button>

                <h3 id="edit-modal-title" className="text-lg font-black text-white uppercase tracking-tight mb-6">Editar Detalhes</h3>

                <div className="space-y-4">
                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Descrição</label>
                        <textarea
                            ref={firstInputRef}
                            title="Descrição"
                            rows={3}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-medium outline-none focus:border-cyan-500 transition-all resize-none"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Mês de Cobrança</label>
                            <input
                                title="Mês de Cobrança"
                                type="month"
                                placeholder="AAAA-MM"
                                value={referenceMonth}
                                onChange={e => setReferenceMonth(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-cyan-500 transition-all"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Valor Total (R$)</label>
                            <input
                                title="Valor Total"
                                type="number"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-emerald-500 transition-all"
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 h-12 rounded-xl font-bold text-xs uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 h-12 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-cyan-600/20 active:scale-95 transition-all"
                    >
                        Salvar Alterações
                    </button>
                </div>
            </div>
        </div>
    );
};
