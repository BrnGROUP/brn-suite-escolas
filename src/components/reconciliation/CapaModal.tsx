
import React from 'react';

interface CapaModalProps {
    capaForm: { revenue: number, taxes: number, balance: number };
    setCapaForm: (form: { revenue: number, taxes: number, balance: number }) => void;
    onConfirm: () => void;
    onClose: () => void;
    schoolName: string;
    accountName: string;
    monthYear: string;
    isReimport?: boolean;
}

const CapaModal: React.FC<CapaModalProps> = ({
    capaForm, setCapaForm, onConfirm, onClose, schoolName, accountName, monthYear, isReimport
}) => {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-[#0f172a] border border-white/10 rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-8 bg-gradient-to-br from-indigo-500/10 to-transparent border-b border-white/5">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                            <span className="material-symbols-outlined text-3xl">analytics</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white uppercase tracking-tight">Capa de Conferência</h2>
                            <p className="text-indigo-400/60 text-[10px] font-bold uppercase tracking-widest">Auditoria de Conta Investimento</p>
                        </div>
                    </div>
                    <p className="text-slate-400 text-xs mt-4 leading-relaxed">
                        Para garantir a auditoria do **Técnico GEE**, informe os valores totais que aparecem no **Resumo do Mês** do seu extrato PDF.
                    </p>
                </div>

                {/* Reimport warning */}
                {isReimport && (
                    <div className="px-8 py-4 bg-amber-500/10 border-b border-amber-500/20 flex items-start gap-3">
                        <span className="material-symbols-outlined text-amber-400 text-xl mt-0.5 flex-shrink-0">warning</span>
                        <div>
                            <p className="text-amber-400 text-xs font-black uppercase tracking-wide">Extrato já importado anteriormente</p>
                            <p className="text-amber-300/70 text-[11px] mt-1 leading-relaxed">
                                O lançamento de rendimento deste mês será <strong className="text-amber-300">substituído</strong> pelos valores informados abaixo. O registro anterior será removido.
                            </p>
                        </div>
                    </div>
                )}

                {/* Info Card */}
                <div className="px-8 py-4 bg-white/5 flex flex-col gap-1 border-b border-white/5">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter">
                        <span className="text-slate-500">Escola:</span>
                        <span className="text-white">{schoolName}</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter">
                        <span className="text-slate-500">Conta:</span>
                        <span className="text-white">{accountName}</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter">
                        <span className="text-slate-500">Mês:</span>
                        <span className="text-white">{monthYear}</span>
                    </div>
                </div>

                {/* Form */}
                <div className="p-8 flex flex-col gap-6">
                    <div className="grid grid-cols-1 gap-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Rendimento Bruto no Mês (+)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500 font-bold text-xs">R$</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={capaForm.revenue || ''}
                                    onChange={e => setCapaForm({ ...capaForm, revenue: parseFloat(e.target.value) })}
                                    className="w-full bg-card-dark border border-white/10 rounded-2xl py-3 pl-10 pr-4 text-white font-bold outline-none focus:border-emerald-500 transition-all"
                                    placeholder="0,00"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Impostos (IRRF + IOF) (-)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-500 font-bold text-xs">R$</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={capaForm.taxes || ''}
                                    onChange={e => setCapaForm({ ...capaForm, taxes: parseFloat(e.target.value) })}
                                    className="w-full bg-card-dark border border-white/10 rounded-2xl py-3 pl-10 pr-4 text-white font-bold outline-none focus:border-rose-500 transition-all"
                                    placeholder="0,00"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Saldo Bruto Atual (=)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500 font-bold text-xs">R$</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={capaForm.balance || ''}
                                    onChange={e => setCapaForm({ ...capaForm, balance: parseFloat(e.target.value) })}
                                    className="w-full bg-card-dark border border-white/10 rounded-2xl py-3 pl-10 pr-4 text-white font-bold outline-none focus:border-indigo-500 transition-all font-mono"
                                    placeholder="0,00"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={onClose}
                            className="flex-1 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest text-[10px] py-4 rounded-2xl transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={onConfirm}
                            className={`flex-[2] ${isReimport ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20'} text-white font-black uppercase tracking-widest text-[10px] py-4 rounded-2xl shadow-xl transition-all active:scale-95`}
                        >
                            {isReimport ? 'Substituir Lançamento' : 'Finalizar e Vincular'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CapaModal;
