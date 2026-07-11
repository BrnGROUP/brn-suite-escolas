import React from 'react';
import { User, Supplier } from '../../types';
import { formatCurrency, printDocument, getContractPrintTitle } from '../../lib/printUtils';
import { generateContratoServicoHTML, generateAditivoHTML } from '../../lib/documentTemplates';
import { useAccountabilityProcess } from '../../hooks/useAccountabilityProcess';
import { ProcessChecklist } from './ProcessChecklist';
import { ImportModal } from './ImportModal';
import { AccountabilityItemsTable } from './AccountabilityItemsTable';
import { useToast } from '../../context/ToastContext';

interface AccountabilityProcessModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  editingId: string | null;
  auxData: {
    schools: any[];
    programs: any[];
    suppliers: Supplier[];
    templateUrl: string | null;
    availableEntries: any[];
  };
  onSave: () => void;
}

const ACCOUNTABILITY_DOC_CATEGORIES = [
  'Ata de Assembleia',
  'Consolidação',
  'Ordem de Compra / Serviço',
  'Pesquisa de Preços (Cotações)',
  'Certidões',
  'CNPJ',
  'Nota Fiscal',
  'Recibo / Quitação',
  'Comprovante de Pagamento',
  'Outros'
];

const AccountabilityProcessModal: React.FC<AccountabilityProcessModalProps> = ({
  isOpen,
  onClose,
  user,
  editingId,
  auxData,
  onSave
}) => {
  const { addToast } = useToast();
  const {
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
  } = useAccountabilityProcess({ isOpen, onClose, user, editingId, auxData, onSave });

  const ValueCounter = () => {
    const siblingTotal = batchSiblings.reduce((acc, s) => acc + Math.abs(Number(s.value)), 0);
    const target = selectedEntry ? Math.abs(selectedEntry.value) + siblingTotal : (linkedContract?.total_value || 0);
    const subtotal = items.reduce((acc, it) => acc + ((it.quantity || 0) * (it.winner_unit_price || 0)), 0);
    const totalAfterDiscount = subtotal - discount;
    const remaining = target - totalAfterDiscount;
    const isOk = Math.abs(remaining) < 0.01;

    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 bg-white/[0.02] p-4 md:p-6 rounded-2xl md:rounded-3xl border border-white/5 shadow-2xl">
        <div className="flex flex-col gap-1.5 p-3 bg-black/20 rounded-xl md:rounded-2xl border border-white/5">
          <span className="text-[8px] uppercase font-black text-slate-500 tracking-widest leading-none">
            {selectedEntry ? (batchSiblings.length > 0 ? 'Valor Original' : 'Lançamento') : 'Valor Contrato'}
          </span>
          <span className="text-[11px] md:text-[13px] font-bold text-white whitespace-nowrap">{formatCurrency(target)}</span>
          {batchSiblings.length > 0 && <span className="text-[7px] text-cyan-400 font-bold">Inclui saldo de split</span>}
        </div>
        <div className="flex flex-col gap-1.5 p-3 bg-black/20 rounded-xl md:rounded-2xl border border-white/5">
          <span className="text-[8px] uppercase font-black text-slate-500 tracking-widest leading-none">Soma Itens</span>
          <span className="text-[11px] md:text-[13px] font-bold text-white whitespace-nowrap">{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex flex-col gap-1.5 p-3 bg-amber-500/5 rounded-xl md:rounded-2xl border border-amber-500/10">
          <span className="text-[8px] uppercase font-black text-amber-500/70 tracking-widest leading-none">Desconto</span>
          <span className="text-[11px] md:text-[13px] font-bold text-amber-500">
            {discount > 0 ? `– ${formatCurrency(discount)}` : 'R$ 0,00'}
          </span>
        </div>
        <div className="flex flex-col gap-1.5 p-3 bg-primary/5 rounded-xl md:rounded-2xl border border-primary/10">
          <span className="text-[8px] uppercase font-black text-primary/70 tracking-widest leading-none">Líquido</span>
          <span className={`text-[11px] md:text-[13px] font-bold ${isOk ? 'text-green-400' : 'text-primary'}`}>{formatCurrency(totalAfterDiscount)}</span>
        </div>
        <div className={`flex flex-col gap-1.5 p-3 rounded-xl md:rounded-2xl border col-span-2 md:col-span-1 transition-all ${isOk ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/5 border-red-500/10'}`}>
          <span className={`text-[8px] uppercase font-black tracking-widest leading-none ${isOk ? 'text-green-500' : 'text-red-400'}`}>Pendente</span>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] md:text-[13px] font-black ${isOk ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(remaining)}</span>
            {isOk && <span className="material-symbols-outlined text-green-500 text-sm">verified</span>}
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-0 md:p-8 bg-black/95 backdrop-blur-xl overflow-y-auto pt-0 md:pt-20">
      <div className="w-full max-w-7xl bg-[#0a0f14] border-x md:border border-white/10 rounded-none md:rounded-[40px] shadow-2xl flex flex-col animate-in zoom-in-95 duration-300 relative min-h-screen md:min-h-0">
        {/* Header */}
        <div className="p-4 md:p-8 lg:p-10 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-[#0a0f14] rounded-t-none md:rounded-t-[40px] sticky top-0 z-20">
          <div className="flex flex-col gap-1 w-full md:w-auto">
            <h2 className="text-xl md:text-3xl font-black text-white flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-2xl md:text-3xl">assignment_turned_in</span>
              <span className="truncate">{editingId ? 'Editar Processo' : 'Novo Processo'}</span>
            </h2>
            <p className="text-[8px] md:text-xs text-slate-500 uppercase font-black tracking-widest md:tracking-[0.2em]">Fluxo: Lançamento • Cotações • Checklist</p>
          </div>
          <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto">
            <button onClick={onClose} className="flex-1 md:flex-none h-10 md:h-14 px-4 md:px-8 rounded-xl md:rounded-2xl text-slate-400 font-bold hover:bg-white/5 transition-all text-[10px] md:text-sm uppercase tracking-widest">Descartar</button>
            <button onClick={handleSave} disabled={loading} className="flex-[2] md:flex-none h-10 md:h-14 px-4 md:px-12 rounded-xl md:rounded-2xl bg-primary text-white font-black text-[10px] md:text-sm uppercase tracking-widest shadow-2xl shadow-primary/30 hover:bg-primary-hover active:scale-95 transition-all disabled:opacity-50">
              {loading ? 'Sincronizando...' : 'Finalizar Processo'}
            </button>
          </div>
        </div>

        <div className="flex-1 p-4 md:p-8 lg:p-10 space-y-6 md:space-y-10">
          <ValueCounter />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Section 1 & 3 */}
            <div className="space-y-10">
              <section className="bg-white/[0.02] p-5 md:p-8 rounded-2xl md:rounded-[36px] border border-white/5 shadow-2xl space-y-6 md:space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                  <div className="md:col-span-2">
                    <label htmlFor="entry_select" className="text-[8px] md:text-[10px] font-black uppercase text-primary tracking-widest md:tracking-[0.25em] mb-3 block opacity-60">1. Lançamento Base</label>
                    <button id="entry_select" onClick={() => setShowEntryModal(true)} className="w-full bg-black/40 border border-white/10 rounded-xl md:rounded-2xl h-12 md:h-14 px-4 md:px-5 flex items-center justify-between hover:border-primary/40 hover:bg-black/60 transition-all group/btn">
                      <span className={`text-[11px] truncate uppercase tracking-tight ${selectedEntry || linkedContract ? 'text-white font-black' : 'text-slate-600 italic font-bold'}`}>
                        {selectedEntry ? selectedEntry.description : linkedContract ? `COTAÇÃO INICIAL: ${linkedContract.description.substring(0, 30)}...` : 'Selecionar...'}
                      </span>
                      <span className="material-symbols-outlined text-primary/30 group-hover/btn:text-primary transition-all text-sm">receipt</span>
                    </button>
                  </div>
                  <div>
                    <label htmlFor="process_status" className="text-[8px] md:text-[10px] font-black uppercase text-slate-500 tracking-widest md:tracking-[0.25em] mb-3 block opacity-60">Status</label>
                    <select title="Selecionar Status do Processo" aria-label="Selecionar Status do Processo" id="process_status" value={processStatus} onChange={e => setProcessStatus(e.target.value as any)} className="w-full bg-black/40 border border-white/10 rounded-xl md:rounded-2xl h-12 md:h-14 px-4 md:px-5 text-white text-[11px] font-black focus:border-primary outline-none transition-all">
                      <option value="Em Andamento">Em Andamento</option>
                      <option value="Concluído">Concluído</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 items-end">
                  <div className="md:col-span-2">
                    {(selectedEntry || linkedContract) && (
                      <div className="h-12 md:h-14 px-4 md:px-5 bg-primary/5 border border-primary/10 rounded-xl md:rounded-2xl flex items-center gap-3">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                          <span className="material-symbols-outlined text-sm md:text-[18px] font-black">verified</span>
                        </div>
                        <div className="truncate">
                          <span className="text-[7px] font-black text-primary/60 uppercase tracking-widest block mb-0.5">Vencedor</span>
                          <span className="text-[10px] md:text-[12px] font-black text-white uppercase truncate block">
                            {(selectedEntry as any)?.suppliers?.name || linkedContract?.suppliers?.name || 'N/A'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <label htmlFor="discount_input" className="text-[8px] md:text-[10px] font-black uppercase text-amber-500/70 tracking-widest md:tracking-[0.25em] mb-3 block">Desconto (R$)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500/40 font-black text-[10px]">R$</span>
                      <input id="discount_input" type="number" step="any" value={discount} onChange={e => setDiscount(Number(e.target.value))} className="w-full bg-black/40 border border-amber-500/20 rounded-xl md:rounded-2xl h-12 md:h-14 pl-10 pr-5 text-amber-500 text-[12px] md:text-[13px] font-black focus:border-amber-500 outline-none transition-all" />
                    </div>
                  </div>
                </div>

                {/* Batch Siblings (Split Payments) */}
                {batchSiblings.length > 0 && (
                  <div className="mt-4 p-4 bg-cyan-500/5 border border-cyan-500/15 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-cyan-500 text-sm">call_split</span>
                      <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest">Pagamento Dividido — Saldo Vinculado</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-black/30 rounded-xl border border-white/5">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-green-500 text-xs">check_circle</span>
                          <span className="text-[10px] font-bold text-slate-300 uppercase">Parcela Paga</span>
                        </div>
                        <span className="text-[11px] font-black text-green-400">{formatCurrency(Math.abs(selectedEntry!.value))}</span>
                      </div>
                      {batchSiblings.map(sib => (
                        <div key={sib.id} className="flex items-center justify-between p-3 bg-black/30 rounded-xl border border-white/5">
                          <div className="flex items-center gap-2">
                            <span className={`material-symbols-outlined text-xs ${sib.is_reconciled ? 'text-green-500' : 'text-amber-500'}`}>
                              {sib.is_reconciled ? 'check_circle' : 'schedule'}
                            </span>
                            <span className="text-[10px] font-bold text-slate-300 uppercase truncate">{sib.description}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`text-[11px] font-black ${sib.is_reconciled ? 'text-green-400' : 'text-amber-400'}`}>
                              {formatCurrency(Math.abs(Number(sib.value)))}
                            </span>
                            <span className={`text-[7px] font-black px-1.5 py-0.5 rounded uppercase ${sib.is_reconciled ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>
                              {sib.status || (sib.is_reconciled ? 'Conciliado' : 'Pendente')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-cyan-500/10">
                      <span className="text-[8px] font-black text-cyan-400/60 uppercase tracking-widest">Valor Total Original</span>
                      <span className="text-[12px] font-black text-cyan-400">
                        {formatCurrency(Math.abs(selectedEntry!.value) + batchSiblings.reduce((acc, s) => acc + Math.abs(Number(s.value)), 0))}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 p-4 bg-primary/5 border border-white/5 rounded-2xl cursor-pointer hover:bg-primary/10 transition-all mt-4" onClick={() => setIsContractBased(!isContractBased)}>
                  <div className={`w-10 h-5 rounded-full relative transition-all ${isContractBased ? 'bg-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]' : 'bg-slate-700'}`}>
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isContractBased ? 'left-6' : 'left-1'}`} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-white uppercase tracking-widest leading-none mb-1">Serviço Recorrente (Contrato)</span>
                    <span className="text-[8px] text-slate-500 font-bold uppercase">Dispensar cotações mensais para este fornecedor</span>
                  </div>
                </div>

                {isContractBased && (
                  <div className="mt-4 p-4 bg-white/5 rounded-2xl border border-white/5 space-y-3">
                    <label className="text-[8px] font-black uppercase text-slate-500 tracking-widest mb-2 block">
                      Vincular Contrato
                    </label>
                    <select
                      title="Selecionar Contrato"
                      aria-label="Selecionar Contrato"
                      value={linkedContract?.id || ''}
                      onChange={e => {
                        const contractId = e.target.value;
                        const contract = schoolContracts.find(c => c.id === contractId);
                        setLinkedContract(contract || null);
                      }}
                      className="w-full bg-black/40 border border-white/10 rounded-xl h-12 px-4 text-white outline-none focus:border-primary transition-all text-xs"
                    >
                      <option value="">Nenhum contrato selecionado</option>
                      {schoolContracts.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.contract_number ? `${c.contract_number} - ` : ''}{c.suppliers?.name} ({c.description.substring(0, 50)}...)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {isContractBased && linkedContract && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                    <button
                      onClick={() => {
                        try {
                          const printData = {
                            id: selectedEntry?.id || 'temp',
                            financial_entry: selectedEntry,
                            contract: linkedContract,
                            discount: discount
                          };
                          printDocument(generateContratoServicoHTML(printData), getContractPrintTitle(printData));
                        } catch (error: any) {
                          addToast(error.message, 'error');
                        }
                      }}
                      className="w-full flex items-center justify-center gap-2 p-4 bg-white/5 border border-primary/20 hover:bg-primary/10 hover:border-primary/50 text-primary rounded-2xl transition-all font-black uppercase text-[10px] tracking-widest"
                    >
                      <span className="material-symbols-outlined text-sm">print</span>
                      Contrato Original
                    </button>
                    <button
                      onClick={() => {
                        try {
                          const printData = {
                            id: selectedEntry?.id || 'temp',
                            financial_entry: selectedEntry,
                            contract: linkedContract,
                            discount: discount
                          };
                          printDocument(generateAditivoHTML(printData), getContractPrintTitle(printData));
                        } catch (error: any) {
                          addToast(error.message, 'error');
                        }
                      }}
                      className="w-full flex items-center justify-center gap-2 p-4 bg-white/5 border border-amber-500/20 hover:bg-amber-500/10 hover:border-amber-500/50 text-amber-500 rounded-2xl transition-all font-black uppercase text-[10px] tracking-widest"
                    >
                      <span className="material-symbols-outlined text-sm">history_edu</span>
                      Imprimir Aditivo
                    </button>
                  </div>
                )}
              </section>

              <ProcessChecklist
                checklist={checklist}
                setChecklist={setChecklist}
                isContractBased={isContractBased}
                selectedEntry={selectedEntry}
              />
            </div>

            {/* Items Section */}
            <section className="space-y-6 md:space-y-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h4 className="text-[10px] md:text-[12px] font-black uppercase text-white tracking-widest md:tracking-[0.2em]">2. Itens e Cotações</h4>
                <div className="flex gap-2 w-full md:w-auto">
                  <input
                    type="file"
                    accept=".xml"
                    ref={xmlInputRef}
                    className="hidden"
                    onChange={handleXMLImport}
                    aria-label="Selecionar arquivo XML de Nota Fiscal"
                    title="Selecionar arquivo XML de Nota Fiscal"
                  />
                  <button
                    onClick={() => xmlInputRef.current?.click()}
                    className="flex-1 md:flex-none h-10 md:h-12 px-4 md:px-6 rounded-xl bg-orange-500/10 text-orange-500 text-[8px] md:text-[10px] font-black uppercase tracking-widest border border-orange-500/20 hover:bg-orange-500 hover:text-white transition-all flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">xml</span> Nota XML
                  </button>
                  <button onClick={() => setShowImportModal(true)} className="flex-1 md:flex-none h-10 md:h-12 px-4 md:px-6 rounded-xl bg-emerald-500/10 text-emerald-500 text-[8px] md:text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all">Planilha</button>
                  <button onClick={handleAddItem} className="flex-1 md:flex-none h-10 md:h-12 px-4 md:px-6 rounded-xl bg-primary/10 text-primary text-[8px] md:text-[10px] font-black uppercase tracking-widest border border-primary/20 hover:bg-primary hover:text-white transition-all">Novo Item</button>
                </div>
              </div>

              <AccountabilityItemsTable
                items={items}
                setItems={setItems}
                competitorQuotes={competitorQuotes}
                setCompetitorQuotes={setCompetitorQuotes}
                isContractBased={isContractBased}
                handleRemoveItem={handleRemoveItem}
                setShowSupplierModal={setShowSupplierModal}
              />
            </section>
          </div>

          {/* Attachments */}
          <div className="flex flex-col lg:grid lg:grid-cols-2 gap-6 md:gap-10 pb-20 md:pb-0">
            <section className="bg-white/[0.02] p-5 md:p-8 rounded-2xl md:rounded-[36px] border border-white/5 shadow-2xl space-y-6 md:space-y-8">
              <h4 className="text-[10px] md:text-[12px] font-black uppercase text-white tracking-widest md:tracking-[0.2em] flex items-center gap-3"><span className="material-symbols-outlined text-primary text-lg">cloud_upload</span> 4. Anexos Técnicos</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 md:gap-3">
                {ACCOUNTABILITY_DOC_CATEGORIES.map(cat => (
                  <label key={cat} className="flex flex-col items-center justify-center p-2 md:p-3 h-20 md:h-24 bg-black/40 border border-white/5 rounded-xl md:rounded-2xl text-[7px] md:text-[8px] font-black text-slate-500 uppercase tracking-tight text-center cursor-pointer hover:bg-primary hover:text-white transition-all gap-1.5 md:gap-2 group/up">
                    <span className="material-symbols-outlined text-base md:text-lg opacity-40 group-hover/up:opacity-100 group-hover/up:scale-110 transition-all">upload</span>
                    <span className="line-clamp-2 leading-tight">{cat}</span>
                    <input
                      type="file"
                      className="hidden"
                      disabled={isUploadingDoc}
                      aria-label={`Upload de ${cat}`}
                      title={`Upload de ${cat}`}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        await handleUploadAttachment(file, cat);
                      }} />
                  </label>
                ))}
              </div>
              <div className="space-y-3">
                {processAttachments.map(att => (
                  <div key={att.id} className="flex flex-col gap-3 p-4 bg-primary/5 rounded-2xl border border-primary/10 group/itematt">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 truncate">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary transition-transform shrink-0"><span className="material-symbols-outlined">attachment</span></div>
                        <div className="truncate">
                          <span className="text-[11px] text-white font-black block truncate">{att.name}</span>
                          <span className="text-[8px] text-primary font-black uppercase opacity-60">{att.category}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setCheckingDocId(checkingDocId === att.id ? null : att.id)}
                          className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all ${att.audit_done ? 'bg-green-500 text-white' : 'bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white'}`}
                          title="Realizar Conferência de Auditoria"
                        >
                          <span className="material-symbols-outlined text-[18px]">{att.audit_done ? 'verified' : 'fact_check'}</span>
                        </button>
                        <a href={att.url} target="_blank" rel="noopener noreferrer" className="w-9 h-9 flex items-center justify-center bg-black/40 hover:bg-primary text-slate-500 hover:text-white rounded-xl transition-all"><span className="material-symbols-outlined text-[18px]">visibility</span></a>
                        <button onClick={() => setProcessAttachments(processAttachments.filter((a: any) => a.id !== att.id))} className="w-9 h-9 flex items-center justify-center bg-black/40 hover:bg-red-500 text-slate-500 hover:text-white rounded-xl transition-all"><span className="material-symbols-outlined text-[18px]">delete</span></button>
                      </div>
                    </div>

                    {/* Audit Checklist Drawer */}
                    {checkingDocId === att.id && (
                      <div className="mt-2 p-4 bg-black/40 rounded-xl border border-white/5 space-y-4 animate-in slide-in-from-top-2 duration-200">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Conferência de Auditoria: {att.category}</span>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                          {(() => {
                            const cat = att.category;
                            const checks = att.checks || {};

                            const renderCheck = (id: string, label: string) => (
                              <label key={id} className="flex items-center gap-3 cursor-pointer group/chk">
                                <input
                                  type="checkbox"
                                  className="hidden"
                                  checked={!!checks[id]}
                                  onChange={e => {
                                    const updated = processAttachments.map((a: any) => {
                                      if (a.id === att.id) {
                                        const newChecks = { ...checks, [id]: e.target.checked };
                                        return { ...a, checks: newChecks, audit_done: Object.values(newChecks).some(v => v === true) };
                                      }
                                      return a;
                                    });
                                    setProcessAttachments(updated);
                                  }}
                                />
                                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${checks[id] ? 'bg-primary border-primary text-white' : 'border-white/20 group-hover/chk:border-primary/50'}`}>
                                  {checks[id] && <span className="material-symbols-outlined text-xs">check</span>}
                                </div>
                                <span className="text-[10px] font-bold text-slate-300 uppercase leading-none">{label}</span>
                              </label>
                            );

                            const renderInput = (id: string, label: string, type: string) => (
                              <div key={id} className="flex flex-col gap-1.5">
                                <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{label}</label>
                                <input
                                  type={type}
                                  aria-label={label}
                                  placeholder={label}
                                  value={checks[id] || ''}
                                  onChange={e => {
                                    const updated = processAttachments.map((a: any) => {
                                      if (a.id === att.id) {
                                        return { ...a, checks: { ...checks, [id]: e.target.value } };
                                      }
                                      return a;
                                    });
                                    setProcessAttachments(updated);
                                  }}
                                  className="bg-black/40 border border-white/10 rounded-lg h-8 px-3 text-[10px] text-white outline-none focus:border-primary/50"
                                />
                              </div>
                            );

                            const fields = [];
                            if (cat === 'Ata de Assembleia') {
                              fields.push(renderCheck('ata_complete', 'ATA: Assinatura de no mín. 6 conselheiros (inc. Secretário e Diretor)'));
                            } else if (cat === 'Consolidação') {
                              fields.push(renderCheck('president', 'CONSOLIDAÇÃO: Assinatura do presidente (diretor)'));
                            } else if (cat === 'Ordem de Compra / Serviço') {
                              fields.push(renderCheck('president', 'ORDEM DE COMPRA/SERVIÇO: Assinatura do presidente (diretor)'));
                            } else if (cat === 'Pesquisa de Preços (Cotações)') {
                              fields.push(renderCheck('supplier_sig_stamp', 'COTAÇÕES: Assinatura e carimbo do fornecedor'));
                            } else if (cat === 'Certidões' || cat === 'CNPJ') {
                              fields.push(renderCheck('president_sig', 'CERTIDÕES: Assinatura do presidente (diretor)'));
                              fields.push(renderInput('president_matr', 'Matrícula do Diretor', 'text'));
                            } else if (cat === 'Recibo / Quitação') {
                              fields.push(renderCheck('recibo_check', 'RECIBO: Assinatura e carimbo do fornecedor'));
                            } else if (cat === 'Comprovante de Pagamento') {
                              fields.push(renderCheck('counselor_confere', 'CONFERE COM O ORIGINAL: Assinatura 1º ou 2º Conselheiro'));
                              fields.push(renderInput('stamp_date', 'Data do Carimbo', 'date'));
                            } else if (cat === 'Nota Fiscal') {
                              fields.push(renderCheck('atesto_recebimento', 'ATESTO RECEBIMENTO: Assinatura e Matrícula 1º e 2º Conselheiros'));
                              fields.push(renderCheck('atesto_quitacao', 'ATESTO QUITAÇÃO: Assinatura Fornecedor'));
                              fields.push(renderCheck('resource_id', 'IDENTIFICAÇÃO RECURSO: Carimbo com recurso pago'));
                              fields.push(renderInput('stamps_date', 'Data nos Carimbos', 'date'));
                            } else {
                              fields.push(<p key="na" className="text-[9px] text-slate-500 italic">Nenhum requisito específico para esta categoria.</p>);
                            }

                            return fields;
                          })()}
                        </div>
                        <button
                          onClick={() => {
                            const updated = processAttachments.map((a: any) => {
                              if (a.id === att.id) return { ...a, audit_done: true };
                              return a;
                            });
                            setProcessAttachments(updated);
                            setCheckingDocId(null);
                          }}
                          className="w-full py-2 bg-primary/20 text-primary rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all"
                        >
                          Finalizar Conferência
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-white/[0.02] p-8 rounded-[36px] border border-white/5 border-dashed shadow-2xl space-y-8 opacity-60">
              <h4 className="text-[12px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-3"><span className="material-symbols-outlined">history_edu</span> Anexos Financeiros</h4>
              <div className="space-y-3">
                {selectedEntry?.attachments?.map((att: any) => (
                  <div key={att.id} className="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-4 truncate">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-600 shrink-0"><span className="material-symbols-outlined">receipt_long</span></div>
                      <div className="truncate">
                        <span className="text-[11px] text-white font-black block truncate">{att.name}</span>
                        <span className="text-[8px] text-slate-600 font-black uppercase">{att.category || 'FINANCEIRO'}</span>
                      </div>
                    </div>
                    <a href={att.url} target="_blank" rel="noopener noreferrer" className="w-9 h-9 flex items-center justify-center bg-white/5 hover:bg-white/20 rounded-xl text-slate-500 hover:text-white transition-all"><span className="material-symbols-outlined text-[18px]">visibility</span></a>
                  </div>
                )) || <div className="text-center py-10 text-slate-700 text-[10px] font-black uppercase tracking-widest">Nenhum anexo.</div>}
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Entry Selection Modal */}
      {showEntryModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/98 backdrop-blur-md">
          <div className="bg-[#0f172a] border border-white/10 w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[80vh]">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#111a22]">
              <h3 className="text-lg font-bold text-white uppercase tracking-widest">Selecionar Lançamento</h3>
              <button onClick={() => setShowEntryModal(false)} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="p-6 flex flex-col gap-4 overflow-hidden">
              <input aria-label="Buscar lançamento" placeholder="Buscar lançamento..." className="w-full bg-black/40 border border-white/10 rounded-xl h-12 px-5 text-white outline-none focus:border-primary transition-all" value={entrySearch} onChange={e => setEntrySearch(e.target.value)} autoFocus />
              <div className="overflow-y-auto space-y-2 custom-scrollbar">
                {auxData.availableEntries.filter(e =>
                  e.description.toLowerCase().includes(entrySearch.toLowerCase()) ||
                  e.programs?.name?.toLowerCase().includes(entrySearch.toLowerCase()) ||
                  e.suppliers?.name?.toLowerCase().includes(entrySearch.toLowerCase())
                ).map(e => (
                  <button key={e.id} onClick={() => { setSelectedEntry(e); setCompetitorQuotes([{ supplier_id: '', supplier_name: '', supplier_cnpj: '', items: items.map(it => ({ ...it, unit_price: 0 })) }, { supplier_id: '', supplier_name: '', supplier_cnpj: '', items: items.map(it => ({ ...it, unit_price: 0 })) }]); setShowEntryModal(false); setEntrySearch(''); }} className="w-full p-4 bg-white/5 border border-white/5 rounded-2xl flex justify-between items-center hover:bg-primary/10 transition-all text-left">
                    <div className="flex-1 truncate pr-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-white truncate">{e.description}</span>
                        <span className="bg-primary/20 text-primary text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter shrink-0">
                          {e.programs?.name || e.program || 'SEM PROGRAMA'}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 uppercase block truncate">
                        {e.suppliers?.name || e.supplier || 'SEM FORNECEDOR'} • {e.schools?.name || e.school}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-sm font-black text-white">{formatCurrency(Math.abs(e.value))}</span>
                      <span className="text-[10px] text-slate-500 block">{new Date(e.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Supplier Selection Modal */}
      {showSupplierModal.open && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/98 backdrop-blur-md">
          <div className="bg-[#0f172a] border border-white/10 w-full max-w-md rounded-3xl shadow-2xl flex flex-col max-h-[70vh]">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#111a22]">
              <h3 className="text-lg font-bold text-white uppercase tracking-widest">Selecionar Fornecedor</h3>
              <button onClick={() => setShowSupplierModal({ open: false, quoteIdx: -1 })} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="p-6 flex flex-col gap-4 overflow-hidden">
              <input aria-label="Buscar fornecedor por nome ou CNPJ" placeholder="Buscar por nome ou CNPJ..." className="w-full bg-black/40 border border-white/10 rounded-xl h-12 px-5 text-white outline-none focus:border-primary transition-all" value={supplierSearch} onChange={e => setSupplierSearch(e.target.value)} autoFocus />
              <div className="overflow-y-auto space-y-2 custom-scrollbar">
                {auxData.suppliers.filter(s => {
                  const matchesSearch = s.name.toLowerCase().includes(supplierSearch.toLowerCase()) ||
                    (s.cnpj && s.cnpj.replace(/\D/g, '').includes(supplierSearch.replace(/\D/g, '')));
                  if (!matchesSearch) return false;

                  const winningSupplierId = selectedEntry?.supplier_id || linkedContract?.supplier_id;
                  if (winningSupplierId && s.id === winningSupplierId) return false;

                  if (showSupplierModal.quoteIdx !== -1) {
                    const otherIdx = showSupplierModal.quoteIdx === 0 ? 1 : 0;
                    const otherCompetitorId = competitorQuotes[otherIdx]?.supplier_id;
                    if (otherCompetitorId && s.id === otherCompetitorId) return false;
                  }

                  return true;
                }).map(s => (
                  <button key={s.id} onClick={() => handleSelectSupplier(s)} className="w-full p-4 bg-white/5 border border-white/5 rounded-2xl text-left hover:bg-primary/10 hover:border-primary/30 transition-all">
                    <span className="text-sm font-bold text-white block">{s.name}</span>
                    <span className="text-[10px] text-slate-500">{s.cnpj || 'SEM CNPJ'}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        importText={importText}
        setImportText={setImportText}
        processImport={processImport}
        downloadTemplate={downloadTemplate}
      />
    </div>
  );
};

export default AccountabilityProcessModal;
