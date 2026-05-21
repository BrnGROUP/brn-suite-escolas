import React, { useEffect, useRef } from 'react';
import { School } from '../../types';

interface CreateBillingModalProps {
    isOpen: boolean;
    onClose: () => void;
    schools: School[];
    newItem: { school_id: string; amount: string; description: string; reference_month: string; };
    setNewItem: (val: any) => void;
    onCreate: () => void;
}

export const CreateBillingModal: React.FC<CreateBillingModalProps> = ({
    isOpen,
    onClose,
    schools,
    newItem,
    setNewItem,
    onCreate
}) => {
    const firstSelectRef = useRef<HTMLSelectElement>(null);

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);

        if (firstSelectRef.current) {
            firstSelectRef.current.focus();
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200 overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-modal-title"
        >
            <div className="bg-[#111a22] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
                    aria-label="Fechar"
                >
                    <span className="material-symbols-outlined">close</span>
                </button>

                <h3 id="create-modal-title" className="text-lg font-black text-white uppercase tracking-tight mb-6">Novo Serviço Extra</h3>

                <div className="space-y-4">
                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Escola</label>
                        <select
                            ref={firstSelectRef}
                            title="Selecione a Escola"
                            value={newItem.school_id}
                            onChange={e => setNewItem({ ...newItem, school_id: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-cyan-500 transition-all appearance-none"
                        >
                            <option value="">Selecione...</option>
                            {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Descrição</label>
                        <input
                            type="text"
                            title="Descrição"
                            placeholder="Ex: Criação de Horário, Visita Técnica..."
                            value={newItem.description}
                            onChange={e => setNewItem({ ...newItem, description: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-cyan-500 transition-all"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Mês de Cobrança</label>
                            <input
                                title="Mês de Cobrança"
                                type="month"
                                placeholder="AAAA-MM"
                                value={newItem.reference_month}
                                onChange={e => setNewItem({ ...newItem, reference_month: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-cyan-500 transition-all"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Valor (R$)</label>
                            <input
                                title="Valor do Serviço"
                                type="number"
                                placeholder="0.00"
                                value={newItem.amount}
                                onChange={e => setNewItem({ ...newItem, amount: e.target.value })}
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
                        onClick={onCreate}
                        className="flex-1 h-12 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-cyan-600/20 active:scale-95 transition-all"
                    >
                        Criar Cobrança
                    </button>
                </div>
            </div>
        </div>
    );
};
