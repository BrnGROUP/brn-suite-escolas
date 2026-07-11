import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { User, FinancialEntry, AccountabilityItem, AccountabilityQuoteItem, Supplier } from '../types';
import { useToast } from '../context/ToastContext';
import { parseInvoiceXML } from '../lib/xmlParser';
import { useFileUpload } from './useFileUpload';

interface UseAccountabilityProcessProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  editingId: string | null;
  auxData: {
    schools: any[];
    programs: any[];
    suppliers: Supplier[];
    templateUrl: string | null;
    availableEntries: FinancialEntry[];
  };
  onSave: () => void;
}

export const useAccountabilityProcess = ({
  isOpen,
  onClose,
  user,
  editingId,
  auxData,
  onSave
}: UseAccountabilityProcessProps) => {
  const { addToast } = useToast();
  const { uploadFile } = useFileUpload({ bucket: 'documents', compress: true });

  const [loading, setLoading] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<FinancialEntry | null>(null);
  const [processStatus, setProcessStatus] = useState<'Em Andamento' | 'Concluído'>('Em Andamento');
  const [isContractBased, setIsContractBased] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [checklist, setChecklist] = useState<{ id: string; label: string; checked: boolean }[]>([
    { id: 'quotations', label: '3 Orçamentos anexados', checked: false },
    { id: 'winner_price', label: 'Vencedor validado com menor preço', checked: false },
    { id: 'invoice', label: 'Nota Fiscal anexa', checked: false },
    { id: 'certificates', label: 'Certidões negativas válidas', checked: false },
    { id: 'minutes', label: 'Ata de Assembleia assinada', checked: false }
  ]);

  const [items, setItems] = useState<Partial<AccountabilityItem>[]>([
    { description: '', quantity: 1, unit: 'Unid.', winner_unit_price: 0 }
  ]);
  const [processAttachments, setProcessAttachments] = useState<any[]>([]);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [competitorQuotes, setCompetitorQuotes] = useState<{
    supplier_id: string;
    supplier_name: string;
    supplier_cnpj: string;
    items: Partial<AccountabilityQuoteItem>[];
  }[]>([
    { supplier_id: '', supplier_name: '', supplier_cnpj: '', items: [{ description: '', quantity: 1, unit: 'Unid.', unit_price: 0 }] },
    { supplier_id: '', supplier_name: '', supplier_cnpj: '', items: [{ description: '', quantity: 1, unit: 'Unid.', unit_price: 0 }] }
  ]);

  // Sub-modals & search states
  const [showSupplierModal, setShowSupplierModal] = useState<{ open: boolean; quoteIdx: number }>({ open: false, quoteIdx: -1 });
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [linkedContract, setLinkedContract] = useState<any | null>(null);
  const [schoolContracts, setSchoolContracts] = useState<any[]>([]);
  const [batchSiblings, setBatchSiblings] = useState<any[]>([]);
  const [checkingDocId, setCheckingDocId] = useState<string | null>(null);
  const [supplierSearch, setSupplierSearch] = useState('');
  const [entrySearch, setEntrySearch] = useState('');
  const [importText, setImportText] = useState('');
  const xmlInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setSelectedEntry(null);
    setBatchSiblings([]);
    setProcessStatus('Em Andamento');
    setIsContractBased(false);
    setDiscount(0);
    setProcessAttachments([]);
    setChecklist([
      { id: 'quotations', label: '3 Orçamentos anexados', checked: false },
      { id: 'winner_price', label: 'Vencedor validado com menor preço', checked: false },
      { id: 'invoice', label: 'Nota Fiscal anexa', checked: false },
      { id: 'certificates', label: 'Certidões negativas válidas', checked: false },
      { id: 'minutes', label: 'Ata de Assembleia assinada', checked: false }
    ]);
    setItems([{ description: '', quantity: 1, unit: 'Unid.', winner_unit_price: 0 }]);
    setCompetitorQuotes([
      { supplier_id: '', supplier_name: '', supplier_cnpj: '', items: [{ description: '', quantity: 1, unit: 'Unid.', unit_price: 0 }] },
      { supplier_id: '', supplier_name: '', supplier_cnpj: '', items: [{ description: '', quantity: 1, unit: 'Unid.', unit_price: 0 }] }
    ]);
  };

  const fetchProcessData = async () => {
    if (!editingId) return;
    setLoading(true);
    try {
      const { data: process, error } = await supabase
        .from('accountability_processes')
        .select(`
          *,
          financial_entries(*, schools(*), programs(name), rubrics(name), suppliers(*), payment_methods(name)),
          accountability_items(*),
          accountability_quotes(*, suppliers(*), accountability_quote_items(*))
        `)
        .eq('id', editingId)
        .single();

      if (error) throw error;

      if (process) {
        const entry = process.financial_entries;
        setSelectedEntry(entry);
        setProcessStatus(process.status);
        setIsContractBased(process.is_contract_based || false);
        setDiscount(process.discount || 0);
        setProcessAttachments(process.attachments || []);
        if (process.checklist) setChecklist(process.checklist);

        const docItems = process.accountability_items || [];
        setItems(docItems);

        const competitors = (process.accountability_quotes || [])
          .filter((q: any) => !q.is_winner)
          .map((q: any) => {
            const rawItems = q.accountability_quote_items || [];
            const alignedItems = docItems.map((docItem: any) => {
              const match = rawItems.find((ri: any) => ri.description === docItem.description);
              return match
                ? { ...match, quantity: docItem.quantity, unit: docItem.unit }
                : { description: docItem.description, quantity: docItem.quantity, unit: docItem.unit, unit_price: 0 };
            });
            return {
              supplier_id: q.supplier_id || '',
              supplier_name: q.supplier_name,
              supplier_cnpj: q.supplier_cnpj || '',
              items: alignedItems
            };
          });

        setCompetitorQuotes(competitors);

        const contractIdToFetch = entry?.contract_id || process.contract_id;

        if (contractIdToFetch) {
          const { data: contract } = await supabase
            .from('supplier_contracts')
            .select(`
              *,
              schools(*),
              suppliers(*),
              programs(name),
              rubrics(name)
            `)
            .eq('id', contractIdToFetch)
            .single();
          setLinkedContract(contract);
          if (entry) setIsContractBased(true);
        }

        while (competitors.length < 2) {
          competitors.push({
            supplier_id: '',
            supplier_name: '',
            supplier_cnpj: '',
            items: docItems.map((it: any) => ({ ...it, unit_price: 0 }))
          });
        }
        setCompetitorQuotes(competitors.slice(0, 2));
      }
    } catch (err: any) {
      addToast('Erro ao carregar dados do processo: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (editingId) {
        fetchProcessData();
      } else {
        resetForm();
      }
    }
  }, [isOpen, editingId]);

  useEffect(() => {
    if (selectedEntry?.contract_id) {
      supabase
        .from('supplier_contracts')
        .select(`
          *,
          schools(*),
          suppliers(*),
          programs(name),
          rubrics(name)
        `)
        .eq('id', selectedEntry.contract_id)
        .single()
        .then(({ data }) => {
          setLinkedContract(data);
          setIsContractBased(true);
        });
    } else {
      setLinkedContract(null);
    }

    if (selectedEntry?.batch_id) {
      supabase
        .from('financial_entries')
        .select('*, programs(name)')
        .eq('batch_id', selectedEntry.batch_id)
        .neq('id', selectedEntry.id)
        .then(({ data }) => setBatchSiblings(data || []));
    } else {
      setBatchSiblings([]);
    }
  }, [selectedEntry]);

  const activeSchoolId = selectedEntry?.school_id || linkedContract?.school_id || (user?.schoolId && user.schoolId !== 'all' ? user.schoolId : null);

  useEffect(() => {
    const fetchSchoolContracts = async () => {
      if (!activeSchoolId) {
        setSchoolContracts([]);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('supplier_contracts')
          .select(`
            *,
            schools(*),
            suppliers(*),
            programs(name),
            rubrics(name)
          `)
          .eq('school_id', activeSchoolId)
          .eq('status', 'Ativo')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setSchoolContracts(data || []);
      } catch (err: any) {
        console.error('Erro ao buscar contratos da escola:', err.message);
      }
    };

    fetchSchoolContracts();
  }, [activeSchoolId]);

  const handleAddItem = () => {
    const newItem = { description: '', quantity: 1, unit: 'un', winner_unit_price: 0 };
    setItems([...items, newItem]);
    setCompetitorQuotes(
      competitorQuotes.map(q => ({
        ...q,
        items: [...q.items, { ...newItem, unit_price: 0 }]
      }))
    );
  };

  const handleRemoveItem = (idx: number) => {
    if (items.length <= 1) return;
    const newItems = items.filter((_, i) => i !== idx);
    setItems(newItems);
    setCompetitorQuotes(
      competitorQuotes.map(q => ({
        ...q,
        items: q.items.filter((_, i) => i !== idx)
      }))
    );
  };

  const handleSelectSupplier = (supplier: Supplier) => {
    const { quoteIdx } = showSupplierModal;
    if (quoteIdx === -1) return;

    // Check if supplier is the winner
    const winningSupplierId = selectedEntry?.supplier_id || linkedContract?.supplier_id;
    if (winningSupplierId && supplier.id === winningSupplierId) {
      addToast('O concorrente não pode ser igual ao fornecedor vencedor.', 'error');
      return;
    }

    // Check if supplier is the other competitor
    const otherIdx = quoteIdx === 0 ? 1 : 0;
    const otherCompetitorId = competitorQuotes[otherIdx]?.supplier_id;
    if (otherCompetitorId && supplier.id === otherCompetitorId) {
      addToast('Os concorrentes não podem ser o mesmo fornecedor.', 'error');
      return;
    }

    const cq = [...competitorQuotes];
    const targetQuote = cq[quoteIdx];
    if (targetQuote) {
      targetQuote.supplier_id = supplier.id;
      targetQuote.supplier_name = supplier.name;
      targetQuote.supplier_cnpj = supplier.cnpj || '';
      setCompetitorQuotes(cq);
    }
    setShowSupplierModal({ open: false, quoteIdx: -1 });
    setSupplierSearch('');
  };

  const handleSave = async () => {
    if (!selectedEntry && !linkedContract) return;

    const winningSupplierId = selectedEntry?.supplier_id || linkedContract?.supplier_id;
    if (!isContractBased) {
      if (competitorQuotes.some(q => !q.supplier_id)) {
        return addToast('Selecione os 2 fornecedores proponentes (ou ative Serviço sob Contrato).', 'warning');
      }

      const c1 = competitorQuotes[0]?.supplier_id;
      const c2 = competitorQuotes[1]?.supplier_id;

      if (c1 && winningSupplierId && c1 === winningSupplierId) {
        return addToast('O concorrente 1 não pode ser igual ao fornecedor vencedor.', 'error');
      }
      if (c2 && winningSupplierId && c2 === winningSupplierId) {
        return addToast('O concorrente 2 não pode ser igual ao fornecedor vencedor.', 'error');
      }
      if (c1 && c2 && c1 === c2) {
        return addToast('O concorrente 1 não pode ser igual ao concorrente 2.', 'error');
      }
    }

    const subtotal = items.reduce((acc, it) => acc + (it.quantity || 0) * (it.winner_unit_price || 0), 0);
    const totalAfterDiscount = subtotal - discount;
    const siblingTotal = batchSiblings.reduce((acc, s) => acc + Math.abs(Number(s.value)), 0);
    const targetValue = selectedEntry ? Math.abs(selectedEntry.value) + siblingTotal : linkedContract?.total_value || 0;

    if (Math.abs(totalAfterDiscount - targetValue) > 0.01) {
      const errorLabel = selectedEntry ? 'valor da nota' : 'valor total do contrato';
      return addToast(
        `O valor líquido (${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
          totalAfterDiscount
        )}) não corresponde ao ${errorLabel} (${new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(targetValue)}).`,
        'error'
      );
    }

    setLoading(true);
    try {
      let processId = editingId;

      if (editingId) {
        const { error: updateErr } = await supabase
          .from('accountability_processes')
          .update({
            status: processStatus,
            is_contract_based: isContractBased,
            discount,
            checklist,
            attachments: processAttachments,
            contract_id: linkedContract?.id || selectedEntry?.contract_id || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingId);

        if (updateErr) throw updateErr;

        const { error: delItemsErr } = await supabase.from('accountability_items').delete().eq('process_id', editingId);
        if (delItemsErr) throw delItemsErr;

        const { error: delQuotesErr } = await supabase.from('accountability_quotes').delete().eq('process_id', editingId);
        if (delQuotesErr) throw delQuotesErr;
      } else {
        const { data: process, error: pError } = await supabase
          .from('accountability_processes')
          .insert({
            financial_entry_id: selectedEntry?.id || null,
            school_id: selectedEntry?.school_id || linkedContract?.school_id,
            status: processStatus,
            is_contract_based: isContractBased,
            discount,
            checklist,
            contract_id: linkedContract?.id || selectedEntry?.contract_id || null,
            attachments: processAttachments
          })
          .select()
          .single();
        if (pError) throw pError;
        processId = process.id;
      }

      if (!processId) throw new Error('ID do processo não encontrado.');

      const cleanItems = items.map(it => {
        const { id, ...rest } = it as any;
        return { ...rest, process_id: processId };
      });
      const { error: insertItemsErr } = await supabase.from('accountability_items').insert(cleanItems);
      if (insertItemsErr) throw insertItemsErr;

      const { data: winQuote, error: insertQuotesErr } = await supabase
        .from('accountability_quotes')
        .insert({
          process_id: processId,
          supplier_id: selectedEntry?.supplier_id || linkedContract?.supplier_id,
          supplier_name: (selectedEntry as any)?.suppliers?.name || linkedContract?.suppliers?.name || 'Vencedor',
          supplier_cnpj: (selectedEntry as any)?.suppliers?.cnpj || linkedContract?.suppliers?.cnpj || null,
          is_winner: true,
          total_value: subtotal
        })
        .select()
        .single();
      if (insertQuotesErr) throw insertQuotesErr;

      const winQItems = items.map(it => {
        const { id, ...rest } = it as any;
        return {
          quote_id: winQuote.id,
          description: rest.description,
          quantity: rest.quantity,
          unit: rest.unit,
          unit_price: rest.winner_unit_price
        };
      });
      const { error: winItemsErr } = await supabase.from('accountability_quote_items').insert(winQItems);
      if (winItemsErr) throw winItemsErr;

      if (!isContractBased) {
        for (const comp of competitorQuotes) {
          const totalVal = comp.items.reduce((acc, curr) => acc + (curr.quantity || 0) * (curr.unit_price || 0), 0);
          const { data: q, error: qe } = await supabase
            .from('accountability_quotes')
            .insert({
              process_id: processId,
              supplier_id: comp.supplier_id || null,
              supplier_name: comp.supplier_name,
              supplier_cnpj: comp.supplier_cnpj,
              is_winner: false,
              total_value: totalVal
            })
            .select()
            .single();

          if (qe) throw qe;

          const qItems = comp.items.map(it => {
            const { id, ...rest } = it as any;
            return {
              quote_id: q.id,
              description: rest.description,
              quantity: rest.quantity,
              unit: rest.unit,
              unit_price: rest.unit_price
            };
          });
          const { error: qItemsErr } = await supabase.from('accountability_quote_items').insert(qItems);
          if (qItemsErr) throw qItemsErr;
        }
      }

      if (processStatus === 'Concluído' && selectedEntry) {
        const { error: updateFinErr } = await supabase
          .from('financial_entries')
          .update({ status: 'Consolidado' })
          .eq('id', selectedEntry.id);
        if (updateFinErr) throw updateFinErr;

        if (selectedEntry.batch_id) {
          const { error: updateBatchErr } = await supabase
            .from('financial_entries')
            .update({ status: 'Consolidado' })
            .eq('batch_id', selectedEntry.batch_id)
            .neq('id', selectedEntry.id);
          if (updateBatchErr) throw updateBatchErr;
        }
      }

      if (selectedEntry && processAttachments.length > 0) {
        const existingAttachments: any[] = selectedEntry.attachments || [];
        const existingUrls = new Set(existingAttachments.map((a: any) => a.url));
        const newFromProcess = processAttachments.filter(pa => !existingUrls.has(pa.url));
        if (newFromProcess.length > 0) {
          const merged = [...existingAttachments, ...newFromProcess];
          const { error: updateAttachErr } = await supabase
            .from('financial_entries')
            .update({ attachments: merged })
            .eq('id', selectedEntry.id);
          if (updateAttachErr) throw updateAttachErr;
        }
      }

      onSave();
      onClose();
    } catch (err: any) {
      addToast('Erro ao salvar processo: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const processImport = () => {
    if (!importText.trim()) return;
    const lines = importText.trim().split(/\r?\n/);
    const parsedRows: any[] = [];

    const parseNumber = (str: string) => {
      if (!str) return 0;
      let clean = str.replace(/[R$\s]/g, '');
      if (clean.includes(',')) clean = clean.replace(/\./g, '').replace(',', '.');
      return parseFloat(clean) || 0;
    };

    const firstLine = lines[0] || '';
    let delimiter = '\t';
    if (firstLine.includes(';')) delimiter = ';';
    else if (firstLine.includes(',')) delimiter = ',';

    const startIndex =
      firstLine.toLowerCase().includes('descrição') || firstLine.toLowerCase().includes('quantidade') ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;
      const cleanLine = line.replace(/[;,\t\r\n]/g, '').trim();
      if (!cleanLine) continue;
      const cols = line.split(delimiter);
      if (cols.length < 2) continue;
      parsedRows.push({
        item: {
          description: cols[0]?.trim() || '',
          quantity: parseNumber(cols[1] || ''),
          unit: cols[2]?.trim() || 'Unid.',
          winner_unit_price: parseNumber(cols[3] || '')
        },
        comp1Price: parseNumber(cols[4] || ''),
        comp2Price: parseNumber(cols[5] || '')
      });
    }

    if (parsedRows.length === 0) return addToast('Formato inválido.', 'error');

    const newItemsList = parsedRows.map(r => r.item);
    setItems(prev => {
      const current = prev.length === 1 && !prev[0]?.description ? [] : prev;
      const updated = [...current, ...newItemsList];
      setCompetitorQuotes(
        competitorQuotes.map((q, qIdx) => ({
          ...q,
          items: updated.map((mi, idx) => {
            if (idx < current.length) return q.items[idx]!;
            const imp = parsedRows[idx - current.length];
            return {
              description: mi.description!,
              quantity: mi.quantity!,
              unit: mi.unit!,
              unit_price: qIdx === 0 ? imp.comp1Price : imp.comp2Price
            };
          })
        }))
      );
      return updated;
    });
    setShowImportModal(false);
    setImportText('');
  };

  /**
   * Safe parser for NF-e XML (Option B):
   * strict format mapping. If unsupported, abort and prompt for manual entry.
   */
  const handleXMLImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      // Use helper from Fase 3 central services
      const { items: newItemsList, competitorPrices } = parseInvoiceXML(text);

      if (newItemsList.length === 0) {
        return addToast('Nenhum item encontrado no XML.', 'warning');
      }

      setItems(prev => {
        const current = prev.length === 1 && !prev[0]?.description ? [] : prev;
        const updated = [...current, ...newItemsList];
        setCompetitorQuotes(
          competitorQuotes.map((q, qIdx) => ({
            ...q,
            items: updated.map((mi, idx) => {
              if (idx < current.length) return q.items[idx]!;
              const prices = competitorPrices[idx - current.length]!;
              return {
                description: mi.description!,
                quantity: mi.quantity!,
                unit: mi.unit!,
                unit_price: qIdx === 0 ? prices.p1 : prices.p2
              };
            })
          }))
        );
        return updated;
      });

      addToast(`${newItemsList.length} itens importados com sucesso!`, 'success');
    } catch (error: any) {
      console.error('XML Import Error:', error);
      // Abort and warn Option B
      if (error.message === 'XML não suportado') {
        addToast('XML não suportado. O formulário foi mantido limpo para preenchimento manual completo.', 'error');
      } else {
        addToast('Erro ao processar o XML da Nota Fiscal. Tente preenchimento manual.', 'error');
      }
      resetForm(); // Reset clean form for manual fill
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  const handleUploadAttachment = async (file: File, category: string) => {
    setIsUploadingDoc(true);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const customPath = `accountability/${Date.now()}_${safeName}`;
      
      const { publicUrl } = await uploadFile(file, customPath);
      
      setProcessAttachments(prev => [
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

  const downloadTemplate = () => {
    if (auxData.templateUrl) return window.open(auxData.templateUrl);
    const BOM = '\uFEFF';
    const headers = [
      'Descrição Detalhada',
      'Quantidade',
      'Unidade',
      'Preço Vencedor (R$)',
      'Preço Concorrente 1 (R$)',
      'Preço Concorrente 2 (R$)'
    ];
    const example = ['Arroz Parboilizado Tipo 1', '50', 'kg', '5,50', '5,90', '6,15'];
    const csvContent = BOM + headers.join(';') + '\n' + example.join(';');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'modelo_importacao_itens.csv';
    link.click();
  };

  return {
    loading,
    selectedEntry,
    setSelectedEntry,
    processStatus,
    setProcessStatus,
    isContractBased,
    setIsContractBased,
    discount,
    setDiscount,
    checklist,
    setChecklist,
    items,
    setItems,
    processAttachments,
    setProcessAttachments,
    isUploadingDoc,
    competitorQuotes,
    setCompetitorQuotes,
    showSupplierModal,
    setShowSupplierModal,
    showEntryModal,
    setShowEntryModal,
    showImportModal,
    setShowImportModal,
    linkedContract,
    setLinkedContract,
    schoolContracts,
    batchSiblings,
    checkingDocId,
    setCheckingDocId,
    supplierSearch,
    setSupplierSearch,
    entrySearch,
    setEntrySearch,
    importText,
    setImportText,
    xmlInputRef,
    handleAddItem,
    handleRemoveItem,
    handleSelectSupplier,
    handleSave,
    processImport,
    handleXMLImport,
    handleUploadAttachment,
    downloadTemplate
  };
};
