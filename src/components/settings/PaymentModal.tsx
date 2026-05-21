import React, { useEffect, useRef } from 'react';
import { PlatformBilling } from '../../types';
import { formatCurrency } from '../../lib/printUtils';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    record: PlatformBilling | null;
    amountToPay: string;
    setAmountToPay: (val: string) => void;
    paymentDate: string;
    setPaymentDate: (val: string) => void;
    paymentMethod: string;
    setPaymentMethod: (val: string) => void;
    onConfirm: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
    isOpen,
    onClose,
    record,
    amountToPay,
    setAmountToPay,
    paymentDate,
    setPaymentDate,
    paymentMethod,
    setPaymentMethod,
    onConfirm
}) => {
    const firstInputRef = useRef<HTMLInputElement>(null);

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

    const remaining = Math.max(0, Number(record.amount) - (Number(record.paid_amount) || 0));

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200 overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-modal-title"
        >
            <div className="bg-[#111a22] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
                    aria-label="Fechar"
                >
                    <span className="material-symbols-outlined">close</span>
                </button>

                <h3 id="payment-modal-title" className="text-lg font-black text-white uppercase tracking-tight mb-1">Registrar Pagamento</h3>
                <p className="text-sm text-slate-400 mb-6">{record.schools?.name}</p>

                <div className="space-y-4">
                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Valor a deduzir (R$)</label>
                        <input
                            ref={firstInputRef}
                            title="Valor a deduzir"
                            type="number"
                            value={amountToPay}
                            onChange={e => setAmountToPay(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-emerald-500 transition-all"
                            placeholder="0.00"
                        />
                        <div className="flex justify-between mt-1 text-[10px] font-bold">
                            <span className="text-slate-500">Total: {formatCurrency(Number(record.amount))}</span>
                            <span className="text-amber-500">Restante: {formatCurrency(remaining)}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Data</label>
                            <input
                                title="Data do Pagamento"
                                type="date"
                                value={paymentDate}
                                onChange={e => setPaymentDate(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-cyan-500 transition-all"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Método</label>
                            <select
                                value={paymentMethod}
                                title="Método de Pagamento"
                                onChange={e => setPaymentMethod(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-cyan-500 transition-all appearance-none"
                            >
                                <option value="Pix">Pix</option>
                                <option value="Boleto">Boleto</option>
                                <option value="Transferência">Transferência</option>
                                <option value="Cartão">Cartão</option>
                                <option value="Dinheiro">Dinheiro</option>
                            </select>
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
                        className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
                    >
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
};
