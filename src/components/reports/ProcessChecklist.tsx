import React from 'react';

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

interface ProcessChecklistProps {
  checklist: ChecklistItem[];
  setChecklist: (nc: ChecklistItem[]) => void;
  isContractBased: boolean;
  selectedEntry: any;
}

export const ProcessChecklist: React.FC<ProcessChecklistProps> = ({
  checklist,
  setChecklist,
  isContractBased,
  selectedEntry
}) => {
  return (
    <section className="bg-white/[0.02] p-5 md:p-8 rounded-2xl md:rounded-[36px] border border-white/5 shadow-2xl space-y-4 md:space-y-6">
      <label className="text-[8px] md:text-[10px] font-black uppercase text-primary tracking-widest md:tracking-[0.25em] mb-2 block opacity-60">
        3. Checklist
      </label>
      <div className="grid grid-cols-1 gap-2.5">
        {checklist.map((item, idx) => {
          if (isContractBased && item.id === 'quotations') return null;
          // Hide Invoice/Payment items for initial Contract Cotação (Award) processes
          if (!selectedEntry && (item.id === 'invoice' || item.id === 'payment_proof')) return null;

          return (
            <label
              key={item.id}
              className="flex items-center gap-3 p-3.5 md:p-4.5 bg-black/30 rounded-xl md:rounded-[24px] border border-white/5 cursor-pointer hover:bg-white/[0.04] transition-all group/check shrink-0"
            >
              <div
                className={`w-6 h-6 md:w-7 md:h-7 rounded-lg md:rounded-xl flex items-center justify-center border-2 transition-all shrink-0 ${
                  item.checked ? 'bg-primary border-primary text-white' : 'border-white/10 group-hover/check:border-primary/40'
                }`}
              >
                {item.checked && <span className="material-symbols-outlined text-sm md:text-[18px]">check_circle</span>}
                <input
                  type="checkbox"
                  className="hidden"
                  checked={item.checked}
                  onChange={e => {
                    const nc = [...checklist];
                    const target = nc[idx];
                    if (target) {
                      target.checked = e.target.checked;
                      setChecklist(nc);
                    }
                  }}
                />
              </div>
              <span
                className={`text-[9px] md:text-[11px] font-black uppercase tracking-widest ${
                  item.checked ? 'text-white' : 'text-slate-600'
                }`}
              >
                {item.label}
              </span>
            </label>
          );
        })}
        {isContractBased && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3">
            <span className="material-symbols-outlined text-emerald-500">contract</span>
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
              Disposto sob Contrato Vigente
            </span>
          </div>
        )}
      </div>
    </section>
  );
};
