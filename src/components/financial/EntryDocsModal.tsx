import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '../../context/ToastContext';
import { printDocument, getContractPrintTitle } from '../../lib/printUtils';
import {
    generateAtaHTML,
    generateOrdemHTML,
    generateConsolidacaoHTML,
    generateReciboHTML,
    generateCotacaoHTML,
    generateContratoServicoHTML,
    generateAditivoHTML,
    generateContratoGasHTML
} from '../../lib/documentTemplates';

interface EntryDocsModalProps {
    isOpen: boolean;
    onClose: () => void;
    entry: any | null;
}

const EntryDocsModal: React.FC<EntryDocsModalProps> = ({ isOpen, onClose, entry }) => {
    const { addToast } = useToast();

    const { data: process, isLoading } = useQuery({
        queryKey: ['accountability_process_for_entry', entry?.id],
        queryFn: async () => {
            if (!entry?.id) return null;
            const { data, error } = await supabase
                .from('accountability_processes')
                .select(`
                    *, 
                    schools(name),
                    financial_entries(*, schools(*), programs(name), rubrics(name), suppliers(*), payment_methods(name)),
                    supplier_contracts(*, schools(name), programs(name), rubrics(name), suppliers(*)),
                    accountability_items(*),
                    accountability_quotes(*, suppliers(*), accountability_quote_items(*))
                `)
                .eq('financial_entry_id', entry.id)
                .maybeSingle();

            if (error) throw error;
            return data;
        },
        enabled: !!entry?.id && isOpen
    });

    if (!isOpen) return null;

    const handlePrint = (printProcess: any, type: string) => {
        try {
            let html = '';
            switch (type) {
                case 'ata':
                    html = generateAtaHTML(printProcess);
                    break;
                case 'ordem':
                    html = generateOrdemHTML(printProcess);
                    break;
                case 'consolidacao':
                    html = generateConsolidacaoHTML(printProcess);
                    break;
                case 'recibo':
                    html = generateReciboHTML(printProcess);
                    break;
                case 'cotacao1':
                    html = generateCotacaoHTML(printProcess, 0);
                    break;
                case 'cotacao2':
                    html = generateCotacaoHTML(printProcess, 1);
                    break;
                case 'cotacao3':
                    html = generateCotacaoHTML(printProcess, 2);
                    break;
                case 'contrato':
                    html = generateContratoServicoHTML(printProcess);
                    break;
                default:
                    return;
            }
            const printTitle = type === 'contrato' ? getContractPrintTitle(printProcess) : undefined;
            printDocument(html, printTitle);
        } catch (error: any) {
            addToast(error.message, 'error');
        }
    };

    const handlePrintDirectReceipt = () => {
        if (!entry) return;
        const mockProcess = {
            id: 'mock',
            financial_entries: [entry],
            quotes: [],
            discount: 0
        };
        handlePrint(mockProcess, 'recibo');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-surface-dark border border-white/10 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden relative z-10 flex flex-col animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-6 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                            <span className="material-symbols-outlined">description</span>
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-white uppercase tracking-tight">Documentos</h2>
                            <p className="text-xs text-slate-400">Prestação de contas do lançamento</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 flex items-center justify-center transition-all">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="p-6 flex flex-col gap-6">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-8 gap-4">
                            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-sm text-slate-400">Buscando processo...</p>
                        </div>
                    ) : process ? (
                        <div className="flex flex-col gap-4">
                            <p className="text-xs text-slate-400 text-center uppercase tracking-widest font-bold">Documentos da Prestação</p>
                            
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => handlePrint(process, 'ata')} className="p-4 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5 hover:border-white/10 rounded-2xl transition-all flex flex-col items-center gap-2 group">
                                    <span className="material-symbols-outlined text-3xl group-hover:scale-110 transition-transform">description</span>
                                    <span className="text-[10px] font-black uppercase tracking-widest">Ata de Assembleia</span>
                                </button>
                                <button onClick={() => handlePrint(process, 'ordem')} className="p-4 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5 hover:border-white/10 rounded-2xl transition-all flex flex-col items-center gap-2 group">
                                    <span className="material-symbols-outlined text-3xl group-hover:scale-110 transition-transform">shopping_cart</span>
                                    <span className="text-[10px] font-black uppercase tracking-widest">Ordem de Compra</span>
                                </button>
                                <button onClick={() => handlePrint(process, 'consolidacao')} className="p-4 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5 hover:border-white/10 rounded-2xl transition-all flex flex-col items-center gap-2 group">
                                    <span className="material-symbols-outlined text-3xl group-hover:scale-110 transition-transform">analytics</span>
                                    <span className="text-[10px] font-black uppercase tracking-widest">Consolidação</span>
                                </button>
                                <button onClick={() => handlePrint(process, 'recibo')} className="p-4 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-2xl transition-all flex flex-col items-center gap-2 group">
                                    <span className="material-symbols-outlined text-3xl group-hover:scale-110 transition-transform">payments</span>
                                    <span className="text-[10px] font-black uppercase tracking-widest">Recibo Pagto</span>
                                </button>
                            </div>

                            <div className="w-full h-px bg-white/5 my-2"></div>
                            <p className="text-xs text-slate-400 text-center uppercase tracking-widest font-bold">Cotações (Pesquisa de Preço)</p>

                            <div className="grid grid-cols-3 gap-3">
                                <button onClick={() => handlePrint(process, 'cotacao1')} className="p-3 bg-white/5 hover:bg-primary/20 text-slate-300 hover:text-primary border border-white/5 hover:border-primary/20 rounded-xl transition-all flex flex-col items-center gap-1 group">
                                    <span className="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform">request_quote</span>
                                    <span className="text-[9px] font-black uppercase tracking-widest">Cotação 1</span>
                                </button>
                                <button onClick={() => handlePrint(process, 'cotacao2')} className="p-3 bg-white/5 hover:bg-primary/20 text-slate-300 hover:text-primary border border-white/5 hover:border-primary/20 rounded-xl transition-all flex flex-col items-center gap-1 group">
                                    <span className="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform">request_quote</span>
                                    <span className="text-[9px] font-black uppercase tracking-widest">Cotação 2</span>
                                </button>
                                <button onClick={() => handlePrint(process, 'cotacao3')} className="p-3 bg-white/5 hover:bg-primary/20 text-slate-300 hover:text-primary border border-white/5 hover:border-primary/20 rounded-xl transition-all flex flex-col items-center gap-1 group">
                                    <span className="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform">request_quote</span>
                                    <span className="text-[9px] font-black uppercase tracking-widest">Cotação 3</span>
                                </button>
                            </div>

                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-6 gap-4 text-center">
                            <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mb-2">
                                <span className="material-symbols-outlined text-3xl">sentiment_dissatisfied</span>
                            </div>
                            <h3 className="text-white font-bold">Sem Prestação de Contas</h3>
                            <p className="text-sm text-slate-400 max-w-[300px]">
                                Este lançamento ainda não possui um processo de prestação de contas vinculado.
                            </p>
                            
                            <div className="w-full h-px bg-white/5 my-2"></div>
                            
                            <button onClick={handlePrintDirectReceipt} className="w-full p-4 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-2xl transition-all flex items-center justify-center gap-3 group">
                                <span className="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform">payments</span>
                                <span className="text-[11px] font-black uppercase tracking-widest">Gerar Recibo Avulso</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EntryDocsModal;
