import React from 'react';
import { AccountabilityItem, AccountabilityQuoteItem } from '../../types';

interface AccountabilityItemsTableProps {
  items: Partial<AccountabilityItem>[];
  setItems: (items: Partial<AccountabilityItem>[]) => void;
  competitorQuotes: {
    supplier_id: string;
    supplier_name: string;
    supplier_cnpj: string;
    items: Partial<AccountabilityQuoteItem>[];
  }[];
  setCompetitorQuotes: (quotes: any[]) => void;
  isContractBased: boolean;
  handleRemoveItem: (idx: number) => void;
  setShowSupplierModal: (state: { open: boolean; quoteIdx: number }) => void;
}

export const AccountabilityItemsTable: React.FC<AccountabilityItemsTableProps> = ({
  items,
  setItems,
  competitorQuotes,
  setCompetitorQuotes,
  isContractBased,
  handleRemoveItem,
  setShowSupplierModal
}) => {
  return (
    <div className="space-y-4 md:space-y-6 max-h-[500px] md:max-h-[600px] overflow-y-auto pr-1 md:pr-2 custom-scrollbar">
      {items.map((item, idx) => (
        <div
          key={idx}
          className="bg-white/[0.01] border border-white/5 p-4 md:p-8 rounded-2xl md:rounded-[32px] space-y-4 md:space-y-6 relative overflow-hidden group/item"
        >
          <div className="flex flex-col md:grid md:grid-cols-12 gap-4 md:gap-6 items-end">
            <div className="w-full md:col-span-11 grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4">
              <div className="md:col-span-6">
                <label
                  htmlFor={`desc_${idx}`}
                  className="text-[8px] md:text-[9px] font-black text-slate-500 uppercase mb-1.5 block tracking-widest opacity-60"
                >
                  Descrição
                </label>
                <input
                  id={`desc_${idx}`}
                  value={item.description || ''}
                  onChange={e => {
                    const it = [...items];
                    const targetItem = it[idx];
                    if (targetItem) {
                      targetItem.description = e.target.value;
                      setItems(it);
                    }

                    const cq = [...competitorQuotes];
                    cq.forEach(q => {
                      const quoteItem = q.items[idx];
                      if (quoteItem) {
                        quoteItem.description = e.target.value;
                      }
                    });
                    setCompetitorQuotes(cq);
                  }}
                  className="w-full bg-black/40 border border-white/10 rounded-lg md:rounded-xl h-10 md:h-11 px-3 md:px-4 text-[10px] md:text-[11px] text-white focus:border-primary/50 transition-all outline-none"
                />
              </div>
              <div className="grid grid-cols-3 gap-3 md:col-span-6">
                <div className="col-span-1">
                  <label
                    htmlFor={`qty_${idx}`}
                    className="text-[8px] md:text-[9px] font-black text-slate-500 uppercase mb-1.5 block tracking-widest opacity-60 text-center"
                  >
                    Qtd
                  </label>
                  <input
                    id={`qty_${idx}`}
                    type="number"
                    value={item.quantity || 0}
                    onChange={e => {
                      const it = [...items];
                      const targetItem = it[idx];
                      if (targetItem) {
                        targetItem.quantity = Number(e.target.value);
                        setItems(it);
                      }

                      const cq = [...competitorQuotes];
                      cq.forEach(q => {
                        const quoteItem = q.items[idx];
                        if (quoteItem) {
                          quoteItem.quantity = Number(e.target.value);
                        }
                      });
                      setCompetitorQuotes(cq);
                    }}
                    className="w-full bg-black/40 border border-white/10 rounded-lg md:rounded-xl h-10 md:h-11 text-center text-[10px] md:text-[11px] text-white outline-none"
                  />
                </div>
                <div className="col-span-1">
                  <label
                    htmlFor={`unit_${idx}`}
                    className="text-[8px] md:text-[9px] font-black text-slate-500 uppercase mb-1.5 block tracking-widest opacity-60 text-center"
                  >
                    Unid
                  </label>
                  <input
                    id={`unit_${idx}`}
                    value={item.unit || ''}
                    onChange={e => {
                      const it = [...items];
                      const targetItem = it[idx];
                      if (targetItem) {
                        targetItem.unit = e.target.value;
                        setItems(it);
                      }

                      const cq = [...competitorQuotes];
                      cq.forEach(q => {
                        const quoteItem = q.items[idx];
                        if (quoteItem) {
                          quoteItem.unit = e.target.value;
                        }
                      });
                      setCompetitorQuotes(cq);
                    }}
                    className="w-full bg-black/40 border border-white/10 rounded-lg md:rounded-xl h-10 md:h-11 text-center text-[10px] md:text-[11px] text-white uppercase outline-none"
                  />
                </div>
                <div className="col-span-1">
                  <label
                    htmlFor={`win_price_${idx}`}
                    className="text-[8px] md:text-[9px] font-black text-primary uppercase mb-1.5 block tracking-widest text-center"
                  >
                    Preço R$
                  </label>
                  <input
                    id={`win_price_${idx}`}
                    type="number"
                    step="any"
                    value={item.winner_unit_price || 0}
                    onChange={e => {
                      const it = [...items];
                      const targetItem = it[idx];
                      if (targetItem) {
                        targetItem.winner_unit_price = Number(e.target.value);
                        setItems(it);
                      }
                    }}
                    className="w-full bg-primary/10 border border-primary/20 rounded-lg md:rounded-xl h-10 md:h-11 px-3 text-center text-[10px] md:text-[11px] text-primary font-black outline-none"
                  />
                </div>
              </div>
            </div>
            <div className="w-full md:col-span-1 flex justify-end">
              <button
                onClick={() => handleRemoveItem(idx)}
                className="h-10 w-full md:w-11 md:h-11 flex items-center justify-center rounded-lg md:rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"
              >
                <span className="material-symbols-outlined text-[18px] md:text-[20px]">delete</span>
                <span className="md:hidden text-[10px] font-bold ml-2">Remover Item</span>
              </button>
            </div>
          </div>

          {!isContractBased && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 pt-4 md:pt-6 border-t border-white/5">
              {competitorQuotes.map((q, qIdx) => (
                <div
                  key={qIdx}
                  className="bg-black/30 p-3 md:p-5 rounded-xl md:rounded-2xl border border-white/5 space-y-3 md:space-y-4 relative group/quote"
                >
                  <div className="absolute -top-2.5 left-4 px-2 py-0.5 bg-amber-500 text-amber-950 rounded-full text-[7px] md:text-[8px] font-black uppercase">
                    Concorrente {qIdx + 1}
                  </div>
                  <button
                    onClick={() => setShowSupplierModal({ open: true, quoteIdx: qIdx })}
                    className="w-full bg-black/40 p-3 rounded-lg md:rounded-xl border border-white/5 flex justify-between items-center hover:border-amber-500/40 transition-all outline-none"
                  >
                    <span
                      className={`text-[10px] md:text-[11px] uppercase truncate font-bold text-left ${
                        q.supplier_name ? 'text-white' : 'text-slate-600 italic'
                      }`}
                    >
                      {q.supplier_name || 'Vincular...'}
                    </span>
                    <span className="material-symbols-outlined text-amber-500 text-xs md:text-sm shrink-0 ml-2">
                      search
                    </span>
                  </button>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500/30 font-black text-[9px]">
                      R$
                    </span>
                    <input
                      aria-label={`Preço Unitário Concorrente ${qIdx + 1}`}
                      type="number"
                      step="any"
                      value={q.items[idx]?.unit_price || 0}
                      onChange={e => {
                        const cq = [...competitorQuotes];
                        const quoteItem = cq[qIdx]?.items[idx];
                        if (quoteItem) {
                          quoteItem.unit_price = Number(e.target.value);
                          setCompetitorQuotes(cq);
                        }
                      }}
                      className="w-full bg-black/40 border border-white/10 rounded-lg md:rounded-xl h-10 pl-8 pr-3 text-[12px] md:text-[13px] text-amber-500 font-black focus:border-amber-500/50 outline-none transition-all"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
