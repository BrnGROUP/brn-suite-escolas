import * as React from 'react';
import { TransactionNature } from '../../types';
import { SplitItem } from '../../hooks/useEntryForm';

interface SplitModeSectionProps {
    isSplitMode: boolean;
    setIsSplitMode: (val: boolean) => void;
    splitItems: SplitItem[];
    setSplitItems: React.Dispatch<React.SetStateAction<SplitItem[]>>;
    singleRubricId: string;
    setSingleRubricId: (val: string) => void;
    singleNature: TransactionNature;
    setSingleNature: (val: TransactionNature) => void;
    filteredRubrics: any[];
    allRubrics: any[];
}

export const SplitModeSection: React.FC<SplitModeSectionProps> = ({
    isSplitMode,
    setIsSplitMode,
    splitItems,
    setSplitItems,
    singleRubricId,
    setSingleRubricId,
    singleNature,
    setSingleNature,
    filteredRubrics,
    allRubrics
}) => {
    return (
        <div className="flex flex-col gap-4 border-t border-white/5 pt-6">
            <div className="flex justify-between items-center">
                <h4 className="text-white font-bold">Classificação Financeira</h4>
                <label className="flex items-center gap-2 text-slate-400 text-xs cursor-pointer select-none">
                    <input 
                        type="checkbox" 
                        aria-label="Ativar Rateio" 
                        checked={isSplitMode} 
                        onChange={e => setIsSplitMode(e.target.checked)} 
                    /> 
                    Ativar Rateio
                </label>
            </div>

            {isSplitMode ? (
                <div className="flex flex-col gap-3">
                    {splitItems.map((item, idx) => (
                        <div key={item.id || idx} className="flex flex-col gap-2 bg-white/[0.02] p-4 rounded-xl border border-white/5 relative group">
                            <div className="flex flex-col md:flex-row gap-2">
                                <div className="flex-1">
                                    <label htmlFor={`entry_rubric_${idx}`} className="text-[9px] text-slate-500 font-bold uppercase mb-1 block">Rubrica</label>
                                    <select
                                        title="Selecione a Rubrica"
                                        aria-label="Selecione a Rubrica"
                                        id={`entry_rubric_${idx}`}
                                        value={item.rubricId}
                                        onChange={e => {
                                            const ns = [...splitItems];
                                            if (ns[idx]) {
                                                ns[idx].rubricId = e.target.value;
                                                const rub = allRubrics.find((r: any) => r.id === e.target.value);
                                                if (rub?.default_nature) {
                                                    ns[idx].nature = rub.default_nature as TransactionNature;
                                                }
                                                setSplitItems(ns);
                                            }
                                        }}
                                        className="bg-[#1e293b] text-white text-xs h-10 rounded-lg px-3 w-full border border-white/5 outline-none focus:border-cyan-500"
                                    >
                                        <option value="">Nenhuma / Natureza Direta</option>
                                        {filteredRubrics.map(r => (
                                            <option key={r.id} value={r.id}>{r.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="w-full md:w-32">
                                    <label htmlFor={`entry_nature_${idx}`} className="text-[9px] text-slate-500 font-bold uppercase mb-1 block">Natureza</label>
                                    <select
                                        title="Selecione a Natureza"
                                        aria-label="Selecione a Natureza"
                                        id={`entry_nature_${idx}`}
                                        value={item.nature}
                                        onChange={e => {
                                            const ns = [...splitItems];
                                            if (ns[idx]) {
                                                ns[idx].nature = e.target.value as TransactionNature;
                                                setSplitItems(ns);
                                            }
                                        }}
                                        className="bg-[#1e293b] text-white text-xs h-10 rounded-lg px-3 w-full border border-white/5 outline-none focus:border-cyan-500"
                                    >
                                        <option value={TransactionNature.CUSTEIO}>Custeio</option>
                                        <option value={TransactionNature.CAPITAL}>Capital</option>
                                    </select>
                                </div>
                                <div className="w-full md:w-32">
                                    <label htmlFor={`value_${idx}`} className="text-[9px] text-slate-500 font-bold uppercase mb-1 block">Valor R$</label>
                                    <input 
                                        id={`value_${idx}`} 
                                        type="number" 
                                        step="0.01" 
                                        value={item.value || ''} 
                                        onChange={e => { 
                                            const ns = [...splitItems]; 
                                            if (ns[idx]) {
                                                ns[idx].value = parseFloat(e.target.value) || 0; 
                                                setSplitItems(ns);
                                            }
                                        }} 
                                        className="bg-[#1e293b] text-white text-xs h-10 rounded-lg px-3 w-full border border-white/5 outline-none font-mono focus:border-cyan-500" 
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2 items-center">
                                <div className="flex-1">
                                    <label htmlFor={`desc_${idx}`} className="text-[9px] text-slate-500 font-bold uppercase mb-1 block">Comp. Descrição</label>
                                    <input 
                                        id={`desc_${idx}`} 
                                        type="text" 
                                        value={item.description} 
                                        onChange={e => { 
                                            const ns = [...splitItems]; 
                                            if (ns[idx]) {
                                                ns[idx].description = e.target.value; 
                                                setSplitItems(ns);
                                            }
                                        }} 
                                        className="bg-[#1e293b] text-white text-[10px] h-8 rounded-lg px-3 w-full border border-white/5 outline-none focus:border-cyan-500 uppercase" 
                                        placeholder="Ex: Item X" 
                                    />
                                </div>
                                <button 
                                    type="button"
                                    onClick={() => setSplitItems(splitItems.filter((_, i) => i !== idx))} 
                                    className="mt-5 w-8 h-8 flex items-center justify-center text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[20px]">delete</span>
                                </button>
                            </div>
                        </div>
                    ))}
                    <button 
                        type="button"
                        onClick={() => setSplitItems([...splitItems, { id: Math.random().toString(), rubricId: '', rubricName: '', nature: TransactionNature.CUSTEIO, value: 0, description: '' }])} 
                        className="w-full py-3 rounded-xl border-2 border-dashed border-white/5 text-cyan-400 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all font-bold text-xs flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined text-[18px]">add_circle</span> Adicionar Nova Classificação
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                        <label htmlFor="entry_single_rubric" className="sr-only">Rubrica</label>
                        <select
                            title="Selecione a Rubrica"
                            aria-label="Selecione a Rubrica"
                            id="entry_single_rubric"
                            value={singleRubricId}
                            onChange={e => {
                                setSingleRubricId(e.target.value);
                                const rub = allRubrics.find((r: any) => r.id === e.target.value);
                                if (rub?.default_nature) {
                                    setSingleNature(rub.default_nature as TransactionNature);
                                }
                            }}
                            className="bg-[#1e293b] rounded-xl h-12 px-4 text-white outline-none w-full border border-white/5 focus:border-cyan-500"
                        >
                            <option value="">Nenhuma / Natureza Direta</option>
                            {filteredRubrics.map(r => (
                                <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="entry_single_nature" className="sr-only">Natureza</label>
                        <select
                            title="Selecione a Natureza"
                            aria-label="Selecione a Natureza"
                            id="entry_single_nature"
                            value={singleNature}
                            onChange={e => setSingleNature(e.target.value as TransactionNature)}
                            className="bg-[#1e293b] rounded-xl h-12 px-4 text-white outline-none w-full border border-white/5 focus:border-cyan-500"
                        >
                            <option value={TransactionNature.CUSTEIO}>Custeio</option>
                            <option value={TransactionNature.CAPITAL}>Capital</option>
                        </select>
                    </div>
                </div>
            )}
        </div>
    );
};
