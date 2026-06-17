import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { User, Supplier } from '../../types';
import { useToast } from '../../context/ToastContext';
import { useFileUpload } from '../../hooks/useFileUpload';
import { formatCurrency, formatCNPJ, printDocument, getContractPrintTitle } from '../../lib/printUtils';
import { 
  generateAtaHTML, 
  generateConsolidacaoHTML, 
  generateOrdemHTML, 
  generateCotacaoHTML,
  generateContratoServicoHTML,
  generateContratoGasHTML,
  generateAditivoHTML
} from '../../lib/documentTemplates';

interface ContractDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  contract: any;
  processId: string | null;
  auxData: {
    suppliers: Supplier[];
  };
  onSave: () => void;
}

export const ContractDocsModal: React.FC<ContractDocsModalProps> = ({
  isOpen,
  onClose,
  user,
  contract,
  processId,
  auxData,
  onSave
}) => {
  const { addToast } = useToast();
  const { uploadFile } = useFileUpload({ bucket: 'documents', compress: true });

  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

  // 2 Competitors state
  const [competitors, setCompetitors] = useState<any[]>([
    { supplier_id: '', supplier_name: '', supplier_cnpj: '', items: [] },
    { supplier_id: '', supplier_name: '', supplier_cnpj: '', items: [] }
  ]);

  const [competitorSearch, setCompetitorSearch] = useState<string[]>(['', '']);


  useEffect(() => {
    if (isOpen && processId) {
      fetchProcessData();
    }
  }, [isOpen, processId]);

  const fetchProcessData = async () => {
    if (!processId) return;
    setLoading(true);
    try {
      const { data: process, error } = await supabase
        .from('accountability_processes')
        .select(`
          *,
          accountability_items(*),
          accountability_quotes(*, suppliers(*), accountability_quote_items(*))
        `)
        .eq('id', processId)
        .single();

      if (error) throw error;

      if (process) {
        setAttachments(process.attachments || []);

        // Calculate contract duration in months
        const sDate = new Date(contract.start_date + 'T12:00:00');
        const eDate = new Date(contract.end_date + 'T12:00:00');
        let contractMonths = (eDate.getFullYear() - sDate.getFullYear()) * 12 + (eDate.getMonth() - sDate.getMonth());
        if (contractMonths <= 0) contractMonths = 12;

        // Load items or set default
        let docItems = process.accountability_items || [];
        if (docItems.length === 0) {
          docItems.push({
            description: contract.description,
            quantity: contractMonths,
            unit: 'Mês',
            winner_unit_price: contract.monthly_value
          });
        } else {
          // Force items with unit === 'Mês' to have contractMonths quantity
          docItems = docItems.map((it: any) => {
            if (it.unit === 'Mês') {
              return { ...it, quantity: contractMonths };
            }
            return it;
          });
        }
        setItems(docItems);

        // Load competitor quotes
        const rawQuotes = process.accountability_quotes || [];
        const comps = rawQuotes.filter((q: any) => !q.is_winner);

        const mappedComps = [0, 1].map((idx) => {
          const quote = comps[idx];
          if (quote) {
            const rawItems = quote.accountability_quote_items || [];
            const alignedItems = docItems.map((docItem: any) => {
              const match = rawItems.find((ri: any) => ri.description === docItem.description);
              return match
                ? { ...match, quantity: docItem.quantity, unit: docItem.unit }
                : { description: docItem.description, quantity: docItem.quantity, unit: docItem.unit, unit_price: 0 };
            });
            return {
              id: quote.id,
              supplier_id: quote.supplier_id || '',
              supplier_name: quote.supplier_name || '',
              supplier_cnpj: quote.supplier_cnpj || '',
              items: alignedItems
            };
          } else {
            return {
              supplier_id: '',
              supplier_name: '',
              supplier_cnpj: '',
              items: docItems.map((docItem: any) => ({
                description: docItem.description,
                quantity: docItem.quantity,
                unit: docItem.unit,
                unit_price: 0
              }))
            };
          }
        });
        setCompetitors(mappedComps);
        setCompetitorSearch(mappedComps.map(c => c.supplier_name || ''));
      }
    } catch (err: any) {
      addToast('Erro ao carregar documentos do contrato: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCompetitor = (idx: number, supplier: Supplier) => {
    const updated = [...competitors];
    updated[idx] = {
      ...updated[idx],
      supplier_id: supplier.id,
      supplier_name: supplier.name,
      supplier_cnpj: supplier.cnpj || '',
      items: updated[idx].items.map((it: any) => ({
        ...it,
        supplier_id: supplier.id
      }))
    };
    setCompetitors(updated);
    
    const searches = [...competitorSearch];
    searches[idx] = supplier.name;
    setCompetitorSearch(searches);
  };

  const handleCompetitorPriceChange = (compIdx: number, itemIdx: number, val: number) => {
    const updated = [...competitors];
    updated[compIdx].items[itemIdx].unit_price = val;
    setCompetitors(updated);
  };

  const handleUploadAttachment = async (file: File, category: string) => {
    setIsUploadingDoc(true);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const customPath = `contract_docs/${contract.id}/${Date.now()}_${safeName}`;
      
      const { publicUrl } = await uploadFile(file, customPath);
      
      setAttachments(prev => [
        ...prev,
        {
          id: Math.random().toString(),
          name: file.name,
          url: publicUrl,
          category
        }
      ]);
      addToast('Documento anexado com sucesso!', 'success');
    } catch (err: any) {
      addToast('Erro no upload: ' + err.message, 'error');
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const handleSave = async () => {
    if (!processId) return;
    setIsSaving(true);
    try {
      // 1. Update items in database
      // Delete existing
      await supabase.from('accountability_items').delete().eq('process_id', processId);
      // Insert updated
      const cleanItems = items.map(({ id, ...rest }) => ({
        ...rest,
        process_id: processId
      }));
      await supabase.from('accountability_items').insert(cleanItems);

      // 2. Save Winner Quote (ensure it exists and is updated)
      const subtotal = items.reduce((acc, it) => acc + (it.quantity || 0) * (it.winner_unit_price || 0), 0);
      
      // Delete existing quotes and quote items
      const { data: existingQuotes } = await supabase.from('accountability_quotes').select('id').eq('process_id', processId);
      if (existingQuotes && existingQuotes.length > 0) {
        const quoteIds = existingQuotes.map(q => q.id);
        await supabase.from('accountability_quote_items').delete().in('quote_id', quoteIds);
        await supabase.from('accountability_quotes').delete().eq('process_id', processId);
      }

      // Re-insert winner quote
      await supabase.from('accountability_quotes').insert({
        process_id: processId,
        supplier_id: contract.supplier_id,
        supplier_name: contract.suppliers?.name || 'Vencedor',
        supplier_cnpj: contract.suppliers?.cnpj || null,
        is_winner: true,
        total_value: subtotal
      });

      // Insert competitor quotes
      for (const comp of competitors) {
        if (!comp.supplier_name) continue;
        const totalVal = comp.items.reduce((acc: number, curr: any) => acc + (curr.quantity || 0) * (curr.unit_price || 0), 0);
        const { data: quote, error: qe } = await supabase
          .from('accountability_quotes')
          .insert({
            process_id: processId,
            supplier_id: comp.supplier_id || null,
            supplier_name: comp.supplier_name,
            supplier_cnpj: comp.supplier_cnpj || null,
            is_winner: false,
            total_value: totalVal
          })
          .select()
          .single();

        if (qe) throw qe;

        const qItems = comp.items.map((it: any) => ({
          quote_id: quote.id,
          description: it.description,
          quantity: it.quantity,
          unit: it.unit,
          unit_price: it.unit_price
        }));
        await supabase.from('accountability_quote_items').insert(qItems);
      }

      // 3. Update attachments on the process
      await supabase.from('accountability_processes').update({
        attachments,
        updated_at: new Date().toISOString()
      }).eq('id', processId);

      addToast('Documentação e cotações salvas com sucesso!', 'success');
      onSave();
      onClose();
    } catch (err: any) {
      addToast('Erro ao salvar documentos: ' + err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrintDoc = async (type: string) => {
    try {
      // Build process object for template matching
      const fullQuotes = [
        {
          supplier_name: contract.suppliers?.name,
          supplier_cnpj: contract.suppliers?.cnpj,
          is_winner: true,
          total_value: items.reduce((acc, it) => acc + (it.quantity || 0) * (it.winner_unit_price || 0), 0),
          suppliers: contract.suppliers
        },
        ...competitors.map(c => {
          const compSup = auxData.suppliers.find(s => s.id === c.supplier_id);
          return {
            supplier_name: c.supplier_name,
            supplier_cnpj: c.supplier_cnpj,
            is_winner: false,
            total_value: c.items.reduce((acc: number, curr: any) => acc + (curr.quantity || 0) * (curr.unit_price || 0), 0),
            suppliers: compSup
          };
        })
      ].filter(q => q.supplier_name);

      const pseudoProcess = {
        id: processId || '',
        contract: contract,
        schools: contract.schools,
        programs: contract.programs,
        accountability_items: items,
        accountability_quotes: fullQuotes
      };

      let html = '';
      if (type === 'ata') {
        html = generateAtaHTML(pseudoProcess);
      } else if (type === 'consolidacao') {
        html = generateConsolidacaoHTML(pseudoProcess);
      } else if (type === 'ordem') {
        html = generateOrdemHTML(pseudoProcess);
      } else if (type === 'cotacao1') {
        html = generateCotacaoHTML(pseudoProcess, 0);
      } else if (type === 'cotacao2') {
        html = generateCotacaoHTML(pseudoProcess, 1);
      } else if (type === 'cotacao3') {
        html = generateCotacaoHTML(pseudoProcess, 2);
      } else if (type === 'contrato') {
        if (contract.terms_json?.is_aditivo) {
          html = generateAditivoHTML(pseudoProcess);
        } else if (contract.category === 'GÁS') {
          html = generateContratoGasHTML(pseudoProcess);
        } else {
          html = generateContratoServicoHTML(pseudoProcess);
        }
      }

      const printTitle = type === 'contrato' ? getContractPrintTitle(pseudoProcess) : undefined;
      printDocument(html, printTitle);
    } catch (error: any) {
      addToast('Erro ao gerar documento: ' + error.message, 'error');
    }
  };

  if (!isOpen) return null;

  const winnerName = contract.suppliers?.name || 'Vencedor';
  const comp1Name = competitors[0]?.supplier_name || 'Concorrente 1';
  const comp2Name = competitors[1]?.supplier_name || 'Concorrente 2';

  return (
    <div className="fixed inset-0 z-[140] flex items-start justify-center p-0 md:p-8 bg-black/95 backdrop-blur-xl overflow-y-auto pt-0 md:pt-20">
      <div className="w-full max-w-5xl bg-[#0a0f14] border-x md:border border-white/10 rounded-none md:rounded-[32px] shadow-2xl flex flex-col relative min-h-screen md:min-h-0">
        
        {/* Header */}
        <div className="p-6 md:p-8 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-[#0a0f14] rounded-t-none md:rounded-t-[32px] sticky top-0 z-20">
          <div className="flex flex-col gap-1 w-full md:w-auto">
            <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-2xl">folder_shared</span>
              <span className="truncate">Documentação de Cotação</span>
            </h2>
            <p className="text-[9px] md:text-xs text-slate-500 uppercase font-black tracking-widest leading-none">
              Contrato: {contract.contract_number} • {contract.suppliers?.name}
            </p>
          </div>
          <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto">
            <button onClick={onClose} className="flex-1 md:flex-none h-10 md:h-12 px-6 rounded-xl text-slate-400 font-bold hover:bg-white/5 transition-all text-[10px] md:text-xs uppercase tracking-widest">
              Cancelar
            </button>
            <button onClick={handleSave} disabled={isSaving || loading} className="flex-[2] md:flex-none h-10 md:h-12 px-8 rounded-xl bg-primary text-white font-black text-[10px] md:text-xs uppercase tracking-widest shadow-2xl shadow-primary/30 hover:bg-primary-hover active:scale-95 transition-all disabled:opacity-50">
              {isSaving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 p-10 flex flex-col items-center justify-center gap-4 text-slate-500 min-h-[300px]">
            <span className="material-symbols-outlined text-4xl animate-spin text-primary">sync</span>
            <span className="text-xs uppercase font-black tracking-widest">Carregando dados...</span>
          </div>
        ) : (
          <div className="flex-1 p-6 md:p-8 space-y-8">
            
            {/* 1. Proponentes (Bidders) Config */}
            <section className="space-y-4">
              <h4 className="text-[10px] md:text-[12px] font-black uppercase text-white tracking-widest">
                1. Identificação dos Bidders (Proponentes)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Proponente 1 (Winner) */}
                <div className="p-5 bg-primary/5 border border-primary/20 rounded-2xl space-y-4">
                  <div className="flex items-center gap-2 text-primary">
                    <span className="material-symbols-outlined text-base">verified</span>
                    <span className="text-[9px] font-black uppercase tracking-wider">Proponente 1 (Vencedor)</span>
                  </div>
                  <div>
                    <span className="text-[8px] font-black text-slate-500 uppercase block mb-1">Razão Social</span>
                    <span className="text-xs font-bold text-white block truncate uppercase">{winnerName}</span>
                  </div>
                  <div>
                    <span className="text-[8px] font-black text-slate-500 uppercase block mb-1">CNPJ</span>
                    <span className="text-xs font-mono text-slate-300">{formatCNPJ(contract.suppliers?.cnpj)}</span>
                  </div>
                </div>

                {/* Proponente 2 (Competitor 1) */}
                {[0, 1].map((idx) => {
                  const comp = competitors[idx];
                  return (
                    <div key={idx} className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl space-y-4">
                      <div className="flex items-center gap-2 text-slate-400">
                        <span className="material-symbols-outlined text-base">compare_arrows</span>
                        <span className="text-[9px] font-black uppercase tracking-wider">Proponente {idx + 2} (Concorrente)</span>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[8px] font-black text-slate-500 uppercase block mb-1">Buscar Fornecedor</label>
                        <select
                          title={`Selecionar Fornecedor Concorrente ${idx + 1}`}
                          aria-label={`Selecionar Fornecedor Concorrente ${idx + 1}`}
                          value={comp?.supplier_id || ''}
                          onChange={(e) => {
                            const sup = auxData.suppliers.find(s => s.id === e.target.value);
                            if (sup) handleSelectCompetitor(idx, sup);
                          }}
                          className="w-full bg-black/40 border border-white/10 rounded-xl h-10 px-3 text-white text-xs outline-none focus:border-primary appearance-none"
                        >
                          <option value="">Selecionar...</option>
                          {auxData.suppliers.filter(s => s.id !== contract.supplier_id).map(s => (
                            <option key={s.id} value={s.id}>{s.name} ({s.cnpj})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <span className="text-[8px] font-black text-slate-500 uppercase block mb-1">CNPJ</span>
                        <span className="text-xs font-mono text-slate-300 block min-h-[16px]">
                          {comp?.supplier_cnpj ? formatCNPJ(comp.supplier_cnpj) : '---'}
                        </span>
                      </div>
                    </div>
                  );
                })}

              </div>
            </section>

            {/* 2. Preços da Cotação (Price Grid) */}
            <section className="space-y-4">
              <h4 className="text-[10px] md:text-[12px] font-black uppercase text-white tracking-widest">
                2. Planilha Comparativa de Preços
              </h4>
              <div className="bg-[#111a22] border border-white/5 rounded-2xl overflow-hidden">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-white/5 text-[9px] font-black text-slate-400 uppercase tracking-wider border-b border-white/5">
                      <th className="p-4 w-[40%]">Item</th>
                      <th className="p-4 text-center">Unid/Qtd</th>
                      <th className="p-4 text-right">{winnerName.substring(0, 15)}...</th>
                      <th className="p-4 text-right">{comp1Name.substring(0, 15)}...</th>
                      <th className="p-4 text-right">{comp2Name.substring(0, 15)}...</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs">
                    {items.map((it, itemIdx) => (
                      <tr key={itemIdx} className="hover:bg-white/[0.01]">
                        <td className="p-4 font-bold text-slate-200 uppercase">{it.description}</td>
                        <td className="p-4 text-center">
                          <span className="text-xs font-bold text-slate-300">
                            {it.quantity} {it.unit}
                          </span>
                        </td>
                        <td className="p-4 text-right font-black text-primary">
                          {formatCurrency(it.winner_unit_price)}
                        </td>
                        {[0, 1].map((compIdx) => (
                          <td key={compIdx} className="p-4 text-right">
                            <input
                              type="number"
                              step="0.01"
                              value={competitors[compIdx]?.items[itemIdx]?.unit_price || 0}
                              onChange={(e) => handleCompetitorPriceChange(compIdx, itemIdx, parseFloat(e.target.value) || 0)}
                              className="bg-black/40 border border-white/10 rounded-lg h-9 px-3 text-right text-xs text-white outline-none focus:border-primary w-24"
                              aria-label={`Preço para ${competitors[compIdx]?.supplier_name || `Concorrente ${compIdx + 1}`}`}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* 3. Documentos Oficiais (Print actions) */}
            <section className="space-y-4">
              <h4 className="text-[10px] md:text-[12px] font-black uppercase text-white tracking-widest">
                3. Gerar Documentos da Cotação
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-3">
                <button onClick={() => handlePrintDoc('ata')} className="h-20 bg-white/5 border border-white/10 rounded-2xl hover:bg-primary/20 hover:border-primary/40 text-slate-300 hover:text-primary transition-all flex flex-col items-center justify-center gap-2 p-3 text-center">
                  <span className="material-symbols-outlined text-2xl">description</span>
                  <span className="text-[8px] font-black uppercase tracking-wider">Ata da Assembleia</span>
                </button>
                <button onClick={() => handlePrintDoc('consolidacao')} className="h-20 bg-white/5 border border-white/10 rounded-2xl hover:bg-primary/20 hover:border-primary/40 text-slate-300 hover:text-primary transition-all flex flex-col items-center justify-center gap-2 p-3 text-center">
                  <span className="material-symbols-outlined text-2xl">analytics</span>
                  <span className="text-[8px] font-black uppercase tracking-wider">Consolidação</span>
                </button>
                <button onClick={() => handlePrintDoc('ordem')} className="h-20 bg-white/5 border border-white/10 rounded-2xl hover:bg-primary/20 hover:border-primary/40 text-slate-300 hover:text-primary transition-all flex flex-col items-center justify-center gap-2 p-3 text-center">
                  <span className="material-symbols-outlined text-2xl">shopping_cart</span>
                  <span className="text-[8px] font-black uppercase tracking-wider">Ordem de Compra</span>
                </button>
                <button onClick={() => handlePrintDoc('contrato')} className="h-20 bg-white/5 border border-white/10 rounded-2xl hover:bg-primary/20 hover:border-primary/40 text-slate-300 hover:text-primary transition-all flex flex-col items-center justify-center gap-2 p-3 text-center">
                  <span className="material-symbols-outlined text-2xl">history_edu</span>
                  <span className="text-[8px] font-black uppercase tracking-wider">Contrato</span>
                </button>
                <button onClick={() => handlePrintDoc('cotacao1')} className="h-20 bg-white/5 border border-white/10 rounded-2xl hover:bg-primary/20 hover:border-primary/40 text-slate-300 hover:text-primary transition-all flex flex-col items-center justify-center gap-2 p-3 text-center">
                  <span className="material-symbols-outlined text-2xl">request_quote</span>
                  <span className="text-[8px] font-black uppercase tracking-wider">Cotação Vencedor</span>
                </button>
                <button onClick={() => handlePrintDoc('cotacao2')} disabled={!competitors[0]?.supplier_name} className="h-20 bg-white/5 border border-white/10 rounded-2xl hover:bg-primary/20 hover:border-primary/40 text-slate-300 hover:text-primary transition-all flex flex-col items-center justify-center gap-2 p-3 text-center disabled:opacity-20">
                  <span className="material-symbols-outlined text-2xl">request_quote</span>
                  <span className="text-[8px] font-black uppercase tracking-wider">Cotação Concorrente 1</span>
                </button>
                <button onClick={() => handlePrintDoc('cotacao3')} disabled={!competitors[1]?.supplier_name} className="h-20 bg-white/5 border border-white/10 rounded-2xl hover:bg-primary/20 hover:border-primary/40 text-slate-300 hover:text-primary transition-all flex flex-col items-center justify-center gap-2 p-3 text-center disabled:opacity-20">
                  <span className="material-symbols-outlined text-2xl">request_quote</span>
                  <span className="text-[8px] font-black uppercase tracking-wider">Cotação Concorrente 2</span>
                </button>
              </div>
            </section>

            {/* 4. Anexos de Certidões e CNPJ (File Attachments) */}
            <section className="space-y-4">
              <h4 className="text-[10px] md:text-[12px] font-black uppercase text-white tracking-widest">
                4. Certidões e Cartão CNPJ dos Proponentes
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Upload Winner */}
                <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl space-y-4">
                  <div className="text-[9px] font-black text-primary uppercase tracking-wider truncate mb-2">Proponente 1: {winnerName.substring(0, 20)}...</div>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex flex-col items-center justify-center p-3 h-20 bg-black/40 border border-white/5 rounded-xl text-[8px] font-black text-slate-500 uppercase tracking-tight text-center cursor-pointer hover:bg-primary hover:text-white transition-all gap-1 group/up">
                      <span className="material-symbols-outlined text-base opacity-40 group-hover/up:opacity-100 transition-all">upload</span>
                      <span>Cartão CNPJ</span>
                      <input type="file" className="hidden" disabled={isUploadingDoc} onChange={(e) => e.target.files?.[0] && handleUploadAttachment(e.target.files[0], `CNPJ - ${winnerName}`)} />
                    </label>
                    <label className="flex flex-col items-center justify-center p-3 h-20 bg-black/40 border border-white/5 rounded-xl text-[8px] font-black text-slate-500 uppercase tracking-tight text-center cursor-pointer hover:bg-primary hover:text-white transition-all gap-1 group/up">
                      <span className="material-symbols-outlined text-base opacity-40 group-hover/up:opacity-100 transition-all">upload</span>
                      <span>Certidões</span>
                      <input type="file" className="hidden" disabled={isUploadingDoc} onChange={(e) => e.target.files?.[0] && handleUploadAttachment(e.target.files[0], `Certidão - ${winnerName}`)} />
                    </label>
                  </div>
                </div>

                {/* Upload Competitor 1 & 2 */}
                {[0, 1].map((idx) => {
                  const compName = competitors[idx]?.supplier_name || `Concorrente ${idx + 1}`;
                  const hasSupplier = !!competitors[idx]?.supplier_name;
                  return (
                    <div key={idx} className={`p-5 bg-white/[0.02] border border-white/5 rounded-2xl space-y-4 ${!hasSupplier ? 'opacity-20' : ''}`}>
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-wider truncate mb-2">Proponente {idx + 2}: {compName.substring(0, 20)}...</div>
                      <div className="grid grid-cols-2 gap-2">
                        <label className={`flex flex-col items-center justify-center p-3 h-20 bg-black/40 border border-white/5 rounded-xl text-[8px] font-black text-slate-500 uppercase tracking-tight text-center transition-all gap-1 group/up ${hasSupplier ? 'cursor-pointer hover:bg-primary hover:text-white' : 'pointer-events-none'}`}>
                          <span className="material-symbols-outlined text-base opacity-40 group-hover/up:opacity-100 transition-all">upload</span>
                          <span>Cartão CNPJ</span>
                          {hasSupplier && <input type="file" className="hidden" disabled={isUploadingDoc} onChange={(e) => e.target.files?.[0] && handleUploadAttachment(e.target.files[0], `CNPJ - ${compName}`)} />}
                        </label>
                        <label className={`flex flex-col items-center justify-center p-3 h-20 bg-black/40 border border-white/5 rounded-xl text-[8px] font-black text-slate-500 uppercase tracking-tight text-center transition-all gap-1 group/up ${hasSupplier ? 'cursor-pointer hover:bg-primary hover:text-white' : 'pointer-events-none'}`}>
                          <span className="material-symbols-outlined text-base opacity-40 group-hover/up:opacity-100 transition-all">upload</span>
                          <span>Certidões</span>
                          {hasSupplier && <input type="file" className="hidden" disabled={isUploadingDoc} onChange={(e) => e.target.files?.[0] && handleUploadAttachment(e.target.files[0], `Certidão - ${compName}`)} />}
                        </label>
                      </div>
                    </div>
                  );
                })}

              </div>

              {/* Attachments list */}
              <div className="space-y-2 pt-4 border-t border-white/5">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-2">Arquivos Anexados</span>
                {attachments.length === 0 ? (
                  <div className="text-center py-6 text-slate-700 text-[10px] font-black uppercase tracking-widest border border-dashed border-white/5 rounded-2xl">
                    Nenhum documento anexado ainda.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {attachments.map(att => (
                      <div key={att.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                        <div className="flex items-center gap-3 truncate min-w-0">
                          <span className="material-symbols-outlined text-primary text-lg">attachment</span>
                          <div className="truncate text-left">
                            <span className="text-[11px] text-white font-black block truncate">{att.name}</span>
                            <span className="text-[8px] text-primary font-black uppercase opacity-60">{att.category}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <a href={att.url} target="_blank" rel="noopener noreferrer" className="w-8 h-8 flex items-center justify-center bg-black/40 hover:bg-primary text-slate-500 hover:text-white rounded-lg transition-all">
                            <span className="material-symbols-outlined text-sm">visibility</span>
                          </a>
                          <button onClick={() => setAttachments(attachments.filter(a => a.id !== att.id))} className="w-8 h-8 flex items-center justify-center bg-black/40 hover:bg-red-500 text-slate-500 hover:text-white rounded-lg transition-all">
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

          </div>
        )}

      </div>
    </div>
  );
};
