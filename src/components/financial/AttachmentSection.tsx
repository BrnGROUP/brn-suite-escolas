import * as React from 'react';
import { formatCurrency } from '../../lib/printUtils';

interface AttachmentSectionProps {
    isSimplified: boolean;
    category: string;
    type: 'Entrada' | 'Saída';
    attachLabel: string;
    isUploading: boolean;
    attachments: any[];
    handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>, cat: string) => Promise<void>;
    removeAttachment: (id: string) => void;
    linkedStatements: any[];
    schoolContracts: any[];
    selectedContractId: string;
    setSelectedContractId: (val: string) => void;
    setSelectedProgramId: (val: string) => void;
    setSingleRubricId: (val: string) => void;
    setTotalValue: (val: string) => void;
    setMainDescription: (val: string) => void;
}

export const AttachmentSection: React.FC<AttachmentSectionProps> = ({
    isSimplified,
    category,
    type,
    attachLabel,
    isUploading,
    attachments,
    handleFileUpload,
    removeAttachment,
    linkedStatements,
    schoolContracts,
    selectedContractId,
    setSelectedContractId,
    setSelectedProgramId,
    setSingleRubricId,
    setTotalValue,
    setMainDescription
}) => {
    return (
        <div className="border-t border-white/5 pt-8 mt-4 bg-white/[0.01] -mx-4 md:-mx-8 px-4 md:px-8 pb-8">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                        <span className="material-symbols-outlined">description</span>
                    </div>
                    <div>
                        <h4 className="text-white font-bold">Documentação do Lançamento</h4>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">{attachLabel}</p>
                    </div>
                </div>
                {isUploading && (
                    <div className="flex items-center gap-2 text-cyan-400 animate-pulse">
                        <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                        <span className="text-[10px] font-bold uppercase">Enviando...</span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap gap-2">
                        {(() => {
                            const isImposto = category === 'Impostos / Tributos';
                            const cats = [];

                            // Guia para Impostos (Substitui Nota Fiscal)
                            if (isImposto) {
                                cats.push({ label: 'Guia (DARF/GPS)', icon: 'description' });
                            }
                            // Nota Fiscal apenas se NÃO for simplificado
                            else if (!isSimplified) {
                                cats.push({ label: 'Nota Fiscal', icon: 'receipt_long' });
                                cats.push({ label: 'Espelho da Nota', icon: 'content_copy' });
                            }

                            // Comprovante: Obrigatório para Doação e Devolução, ou se não for simplificado
                            if (['Doação', 'Devolução de Recurso (FNDE/Estado)'].includes(category) || !isSimplified) {
                                cats.push({ label: 'Comprovante', icon: 'payments' });
                            }

                            // Extrato Bancário: Apenas para os simplificados
                            if (isSimplified) {
                                cats.push({ label: 'Extrato Bancário', icon: 'account_balance' });
                            }

                            // Certidões e CNPJ: Apenas se NÃO for simplificado
                            if (!isSimplified) {
                                cats.push({ label: 'Certidões', icon: 'verified' });
                                cats.push({ label: 'CNPJ', icon: 'badge' });
                            }

                            // Caso especial para Reembolso / Estorno
                            if (category === 'Reembolso / Estorno' && !isSimplified) {
                                cats.push({ label: 'Extrato Bancário', icon: 'account_balance' });
                            }

                            return cats.map(c => (
                                <label 
                                    key={c.label} 
                                    className="cursor-pointer group flex flex-col items-center justify-center w-[calc(33.33%-8px)] aspect-square bg-white/5 border border-white/10 rounded-2xl hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all text-center p-2"
                                >
                                    <span className="material-symbols-outlined text-slate-500 group-hover:text-cyan-400 transition-colors mb-1">{c.icon}</span>
                                    <span className="text-[8px] font-black text-slate-400 group-hover:text-white uppercase leading-tight">{c.label}</span>
                                    <input 
                                        type="file" 
                                        aria-label={`Anexar ${c.label}`} 
                                        className="hidden" 
                                        onChange={e => handleFileUpload(e, c.label)} 
                                        disabled={isUploading} 
                                    />
                                </label>
                            ));
                        })()}
                    </div>

                    <div className="space-y-2 mt-2">
                        <h5 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Arquivos Anexados ({attachments.length})</h5>
                        {attachments.map(att => (
                            <div 
                                key={att.id} 
                                className={`flex items-center justify-between p-3 rounded-2xl border group transition-all ${att.source === 'accountability' ? 'bg-cyan-500/5 border-cyan-500/10 hover:border-cyan-500/30' : 'bg-black/40 border-white/5 hover:border-cyan-500/30'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${att.source === 'accountability' ? 'bg-cyan-500/20' : 'bg-white/5'}`}>
                                        <span className={`material-symbols-outlined text-base ${att.source === 'accountability' ? 'text-cyan-400' : 'text-slate-500'}`}>
                                            {att.source === 'accountability' ? 'verified' : 'attachment'}
                                        </span>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs text-white font-bold truncate max-w-[150px]">{att.name}</p>
                                        <div className="flex items-center gap-1.5">
                                            <span className={`text-[9px] font-black uppercase tracking-tighter ${att.source === 'accountability' ? 'text-cyan-400' : 'text-cyan-400'}`}>
                                                {att.category}
                                            </span>
                                            {att.source === 'accountability' && (
                                                <span className="text-[7px] font-black bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded uppercase">Via Prestação</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <a 
                                        href={att.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all"
                                    >
                                        <span className="material-symbols-outlined text-base">visibility</span>
                                    </a>
                                    {att.source !== 'accountability' && (
                                        <button 
                                            type="button"
                                            onClick={() => removeAttachment(att.id)} 
                                            className="w-8 h-8 flex items-center justify-center hover:bg-red-500/10 rounded-xl text-slate-400 hover:text-red-500 transition-all"
                                        >
                                            <span className="material-symbols-outlined text-base">delete</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}

                        {linkedStatements && linkedStatements.length > 0 && (
                            <div className="flex flex-col gap-3 w-full">
                                {linkedStatements.map(statement => {
                                    const isInvest = statement.account_type === 'Conta Investimento';
                                    const badgeClasses = isInvest 
                                        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' 
                                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
                                    const iconName = isInvest ? 'trending_up' : 'account_balance_wallet';

                                    return (
                                        <div key={statement.id} className="bg-black/20 border border-white/5 p-4 rounded-2xl space-y-3 animate-in fade-in slide-in-from-left-2 duration-300">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className={`material-symbols-outlined text-sm ${isInvest ? 'text-cyan-400' : 'text-emerald-400'}`}>{iconName}</span>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Extratos vinculados</span>
                                                </div>
                                                <span className={`text-[8px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${badgeClasses}`}>
                                                    {statement.account_type}
                                                </span>
                                            </div>
                                            
                                            <div className="space-y-2">
                                                {statement.pdf_url && (
                                                    <div className={`flex items-center justify-between p-3 rounded-xl border transition-all ${statement.pdf_url === 'EXEMPT' ? 'bg-amber-500/5 border-amber-500/10' : 'bg-emerald-500/5 border-emerald-500/10 hover:border-emerald-500/30'}`}>
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${statement.pdf_url === 'EXEMPT' ? 'bg-amber-500/20 text-amber-500' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                                                <span className="material-symbols-outlined text-base">
                                                                    {statement.pdf_url === 'EXEMPT' ? 'block' : 'account_balance'}
                                                                </span>
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-xs text-white font-bold truncate max-w-[200px]">{statement.pdf_name}</p>
                                                                <p className={`text-[9px] font-black uppercase tracking-tighter ${statement.pdf_url === 'EXEMPT' ? 'text-amber-500' : 'text-emerald-400'}`}>
                                                                    {statement.pdf_url === 'EXEMPT' ? 'Extrato PDF: Não se aplica' : 'Extrato Oficial (PDF)'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        {statement.pdf_url !== 'EXEMPT' ? (
                                                            <a 
                                                                href={statement.pdf_url} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                                className="w-8 h-8 flex items-center justify-center rounded-xl transition-all hover:bg-emerald-500/20 text-emerald-400 hover:text-white"
                                                            >
                                                                <span className="material-symbols-outlined text-base">visibility</span>
                                                            </a>
                                                        ) : (
                                                            <div className="w-8 h-8 flex items-center justify-center text-slate-500 cursor-help" title={`Dispensado: ${statement.no_movement_reason || 'Não se aplica'}`}>
                                                                <span className="material-symbols-outlined text-base">help</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {statement.file_url && (
                                                    <div className={`flex items-center justify-between p-3 rounded-xl border transition-all ${statement.file_url === 'EXEMPT' ? 'bg-amber-500/5 border-amber-500/10' : 'bg-cyan-500/5 border-cyan-500/10 hover:border-cyan-500/30'}`}>
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${statement.file_url === 'EXEMPT' ? 'bg-amber-500/20 text-amber-500' : 'bg-cyan-500/20 text-cyan-400'}`}>
                                                                <span className="material-symbols-outlined text-base">
                                                                    {statement.file_url === 'EXEMPT' ? 'block' : 'database'}
                                                                </span>
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-xs text-white font-bold truncate max-w-[200px]">{statement.file_name}</p>
                                                                <p className={`text-[9px] font-black uppercase tracking-tighter ${statement.file_url === 'EXEMPT' ? 'text-amber-500' : 'text-cyan-400'}`}>
                                                                    {statement.file_url === 'EXEMPT' ? 'Dados OFX: Não se aplica' : 'Extrato de Dados (OFX/CSV)'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        {statement.file_url !== 'EXEMPT' ? (
                                                            <a 
                                                                href={statement.file_url} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                                className="w-8 h-8 flex items-center justify-center rounded-xl transition-all hover:bg-cyan-500/20 text-cyan-400 hover:text-white"
                                                            >
                                                                <span className="material-symbols-outlined text-base">visibility</span>
                                                            </a>
                                                        ) : (
                                                            <div className="w-8 h-8 flex items-center justify-center text-slate-500 cursor-help" title={`Dispensado: ${statement.no_movement_reason || 'Não se aplica'}`}>
                                                                <span className="material-symbols-outlined text-base">help</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {attachments.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-white/[0.02] rounded-3xl">
                                <span className="material-symbols-outlined text-3xl text-slate-700 mb-2">cloud_upload</span>
                                <p className="text-[10px] text-slate-600 font-bold uppercase">Nenhum documento anexado ainda</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {schoolContracts.length > 0 && (
                <div className="mt-6 p-6 md:p-8 bg-cyan-500/5 border border-cyan-500/20 rounded-[32px] overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <span className="material-symbols-outlined text-8xl">history_edu</span>
                    </div>
                    <label className="text-[10px] font-black uppercase text-cyan-400 tracking-[0.2em] mb-4 block leading-none">Contrato de Repasse de Serviços</label>
                    <div className="relative z-10">
                        <select
                            title="Selecione o Contrato"
                            value={selectedContractId}
                            onChange={e => {
                                const contractId = e.target.value;
                                setSelectedContractId(contractId);
                                const contract = schoolContracts.find(c => c.id === contractId);
                                if (contract) {
                                    setSelectedProgramId(contract.program_id);
                                    setSingleRubricId(contract.rubric_id || '');
                                    setTotalValue(Math.abs(contract.monthly_value).toString());

                                    const identifier = contract.contract_number
                                        ? `${contract.contract_number} - ${contract.description}`
                                        : contract.description;
                                    setMainDescription(identifier.toUpperCase());
                                }
                            }}
                            className="w-full bg-black/40 border border-white/10 rounded-2xl h-14 px-5 pr-12 text-white text-sm focus:border-cyan-500 outline-none transition-all appearance-none font-bold"
                        >
                            <option value="">Nenhum Contrato Selecionado</option>
                            {schoolContracts.map(c => (
                                <option key={c.id} value={c.id}>
                                    {c.contract_number ? `${c.contract_number} - ` : ''}{c.description.substring(0, 60)}{c.description.length > 60 ? '...' : ''} ({formatCurrency(c.monthly_value)}/mês)
                                </option>
                            ))}
                        </select>
                        <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-cyan-400 pointer-events-none">expand_more</span>
                    </div>

                    {selectedContractId && (
                        <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                            {(() => {
                                const c = schoolContracts.find(con => con.id === selectedContractId);
                                if (!c) return null;
                                const total = c.total_value || 0;
                                const executed = c.executed_value || 0;
                                const progress = total > 0 ? (executed / total) * 100 : 0;
                                return (
                                    <>
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Execução do Contrato</p>
                                                <p className="text-xs font-black text-white">{formatCurrency(executed)} <span className="opacity-40">/ {formatCurrency(total)}</span></p>
                                            </div>
                                            <p className={`text-xs font-black transition-colors duration-500 ${progress < 30 ? 'text-red-500' :
                                                progress < 60 ? 'text-yellow-500' :
                                                    progress < 90 ? 'text-orange-500' : 'text-green-500'
                                                }`}>{progress.toFixed(1)}%</p>
                                        </div>
                                        <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
                                            <div
                                                className={`h-full transition-all duration-500 ${progress < 30 ? 'bg-red-500' :
                                                    progress < 60 ? 'bg-yellow-500' :
                                                        progress < 90 ? 'bg-orange-500' : 'bg-green-500'
                                                    }`}
                                                style={{ width: `${Math.min(100, progress)}%` }}
                                            ></div>
                                        </div>
                                        <div className="flex items-center gap-2 pt-2 border-t border-white/5 mt-2">
                                            <span className="material-symbols-outlined text-[14px] text-emerald-500">check_circle</span>
                                            <p className="text-[9px] text-emerald-500 font-black uppercase tracking-widest">Saldo disponível para execução</p>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
