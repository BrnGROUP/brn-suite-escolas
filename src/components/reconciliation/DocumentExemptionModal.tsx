import React, { useState } from 'react';

interface DocumentExemptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  documentName: string;
  monthName: string;
  accountName: string;
}

const PREDEFINED_REASONS = [
  'Sem movimentação bancária no período',
  'O banco não disponibilizou o arquivo para exportação',
  'Conta bancária recém-aberta ou inativa no período',
  'Outros (justificativa manual)',
];

const DocumentExemptionModal: React.FC<DocumentExemptionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  documentName,
  monthName,
  accountName,
}) => {
  const [selectedReason, setSelectedReason] = useState(PREDEFINED_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = selectedReason === 'Outros (justificativa manual)'
      ? customReason.trim()
      : selectedReason;

    if (!finalReason) {
      setError('Por favor, informe uma justificativa para a indisponibilidade.');
      return;
    }

    onConfirm(finalReason);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0f172a] border border-white/10 rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <span className="material-symbols-outlined text-2xl">block</span>
            </div>
            <div>
              <h3 className="text-base font-black text-white uppercase tracking-tight">Declarar Não se Aplica</h3>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Documento de Conformidade</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 transition-all flex items-center justify-center"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6">
          
          {/* Document Summary Card */}
          <div className="bg-black/25 rounded-2xl p-4 border border-white/5 flex flex-col gap-2">
            <div>
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block leading-none mb-1">Documento selecionado</span>
              <span className="text-xs font-black text-white uppercase tracking-wide">{documentName}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-2 pt-2 border-t border-white/5">
              <div>
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block leading-none mb-0.5">Conta bancária</span>
                <span className="text-[11px] font-bold text-slate-300 truncate block">{accountName}</span>
              </div>
              <div>
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block leading-none mb-0.5">Período de referência</span>
                <span className="text-[11px] font-bold text-slate-300 block">{monthName}</span>
              </div>
            </div>
          </div>

          {/* Selector / Reasons */}
          <div className="flex flex-col gap-3">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Selecione o motivo da indisponibilidade</label>
            <div className="flex flex-col gap-2">
              {PREDEFINED_REASONS.map((reason) => (
                <label
                  key={reason}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                    selectedReason === reason
                      ? 'bg-amber-500/10 border-amber-500/35 text-white'
                      : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="exemption_reason"
                    checked={selectedReason === reason}
                    onChange={() => {
                      setSelectedReason(reason);
                      setError('');
                    }}
                    className="w-4 h-4 rounded-full border-white/20 bg-black/40 text-amber-500 focus:ring-amber-500/50 cursor-pointer"
                  />
                  <span className="text-xs font-bold uppercase tracking-tight">{reason}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Custom text input */}
          {selectedReason === 'Outros (justificativa manual)' && (
            <div className="flex flex-col gap-2 animate-in slide-in-from-top-2 duration-200">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Escreva a justificativa para auditoria</label>
              <textarea
                value={customReason}
                onChange={(e) => {
                  setCustomReason(e.target.value);
                  setError('');
                }}
                rows={3}
                placeholder="Exemplo: Conta recém-criada, primeiro repasse agendado para o mês seguinte."
                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-xs outline-none focus:border-amber-500 transition-all font-medium resize-none"
              />
            </div>
          )}

          {error && (
            <p className="text-rose-500 text-[10px] font-black uppercase tracking-wide flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">error</span>
              {error}
            </p>
          )}

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-2 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-500/90 text-white shadow-lg shadow-amber-500/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
            >
              Confirmar Isenção
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default DocumentExemptionModal;
