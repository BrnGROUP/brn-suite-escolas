import * as React from 'react';
import { User } from '../../types';
import { useEntryForm } from '../../hooks/useEntryForm';
import { EntryFormFields } from './EntryFormFields';
import { SplitModeSection } from './SplitModeSection';
import { AttachmentSection } from './AttachmentSection';
import { AuditLogTab } from './AuditLogTab';

interface EntryFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User;
    editingId: string | null;
    editingBatchId: string | null;
    auxData: any;
    accessibleSchools: any[];
    onSave: () => void;
}

const EntryFormModal: React.FC<EntryFormModalProps> = (props) => {
    const { isOpen, onClose, editingId, editingBatchId } = props;

    // Close on Escape key press
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);


    const {
        activeTab,
        setActiveTab,
        isUploading,
        type,
        setType,
        category,
        setCategory,
        selectedSchoolId,
        setSelectedSchoolId,
        date,
        setDate,
        selectedProgramId,
        setSelectedProgramId,
        totalValue,
        setTotalValue,
        mainDescription,
        setMainDescription,
        selectedSupplierId,
        setSelectedSupplierId,
        supplierSearch,
        setSupplierSearch,
        schoolSearch,
        setSchoolSearch,
        programSearch,
        setProgramSearch,
        status,
        setStatus,
        invoiceDate,
        setInvoiceDate,
        paymentDate,
        setPaymentDate,
        selectedBankAccountId,
        setSelectedBankAccountId,
        selectedPaymentMethodId,
        setSelectedPaymentMethodId,
        documentNumber,
        setDocumentNumber,
        authNumber,
        setAuthNumber,
        attachments,
        entryLogs,
        linkedStatements,
        selectedContractId,
        setSelectedContractId,
        schoolContracts,
        auditInfo,
        isSplitMode,
        setIsSplitMode,
        splitItems,
        setSplitItems,
        singleRubricId,
        setSingleRubricId,
        singleNature,
        setSingleNature,
        filteredRubrics,
        isSimplified,
        isBankOp,
        attachLabel,
        filteredSchools,
        filteredPrograms,
        filteredSuppliers,
        handleFileUpload,
        removeAttachment,
        handleSave
    } = useEntryForm(props);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <div className="w-full max-w-5xl bg-[#0f172a] border border-white/10 rounded-[32px] shadow-2xl flex flex-col min-h-[600px] max-h-[90vh] animate-in zoom-in-95 duration-200">
                
                {/* Header */}
                <div className="p-6 md:p-8 border-b border-white/5 flex flex-col gap-6 shrink-0">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-cyan-400">edit_note</span>
                            {editingId || editingBatchId ? 'Editar Lançamento' : 'Novo Lançamento'}
                        </h3>
                        <button 
                            type="button"
                            onClick={onClose} 
                            className="text-slate-400 hover:text-white transition-colors"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>
                    {(editingId || editingBatchId) && (
                        <div className="flex gap-1 bg-black/20 p-1 rounded-xl w-fit self-center">
                            <button 
                                type="button"
                                onClick={() => setActiveTab('dados')} 
                                className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'dados' ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                Dados Gerais
                            </button>
                            <button 
                                type="button"
                                onClick={() => setActiveTab('historico')} 
                                className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'historico' ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                Histórico ({entryLogs.length})
                            </button>
                        </div>
                    )}
                </div>

                {/* Body Content */}
                {activeTab === 'dados' ? (
                    <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col gap-6 custom-scrollbar">
                        <EntryFormFields
                            user={props.user}
                            type={type}
                            setType={setType}
                            totalValue={totalValue}
                            setTotalValue={setTotalValue}
                            date={date}
                            setDate={setDate}
                            selectedSchoolId={selectedSchoolId}
                            setSelectedSchoolId={setSelectedSchoolId}
                            schoolSearch={schoolSearch}
                            setSchoolSearch={setSchoolSearch}
                            filteredSchools={filteredSchools}
                            category={category}
                            setCategory={setCategory}
                            selectedProgramId={selectedProgramId}
                            setSelectedProgramId={setSelectedProgramId}
                            programSearch={programSearch}
                            setProgramSearch={setProgramSearch}
                            filteredPrograms={filteredPrograms}
                            isSimplified={isSimplified}
                            selectedSupplierId={selectedSupplierId}
                            setSelectedSupplierId={setSelectedSupplierId}
                            supplierSearch={supplierSearch}
                            setSupplierSearch={setSupplierSearch}
                            filteredSuppliers={filteredSuppliers}
                            mainDescription={mainDescription}
                            setMainDescription={setMainDescription}
                            isBankOp={isBankOp}
                            selectedBankAccountId={selectedBankAccountId}
                            setSelectedBankAccountId={setSelectedBankAccountId}
                            selectedPaymentMethodId={selectedPaymentMethodId}
                            setSelectedPaymentMethodId={setSelectedPaymentMethodId}
                            status={status}
                            setStatus={setStatus}
                            documentNumber={documentNumber}
                            setDocumentNumber={setDocumentNumber}
                            authNumber={authNumber}
                            setAuthNumber={setAuthNumber}
                            invoiceDate={invoiceDate}
                            setInvoiceDate={setInvoiceDate}
                            paymentDate={paymentDate}
                            setPaymentDate={setPaymentDate}
                            auxData={props.auxData}
                        />

                        <SplitModeSection
                            isSplitMode={isSplitMode}
                            setIsSplitMode={setIsSplitMode}
                            splitItems={splitItems}
                            setSplitItems={setSplitItems}
                            singleRubricId={singleRubricId}
                            setSingleRubricId={setSingleRubricId}
                            singleNature={singleNature}
                            setSingleNature={setSingleNature}
                            filteredRubrics={filteredRubrics}
                            allRubrics={props.auxData.rubrics}
                            selectedProgramId={selectedProgramId}
                            programs={props.auxData.programs}
                            type={type}
                        />

                        <AttachmentSection
                            isSimplified={isSimplified}
                            category={category}
                            type={type}
                            attachLabel={attachLabel}
                            isUploading={isUploading}
                            attachments={attachments}
                            handleFileUpload={handleFileUpload}
                            removeAttachment={removeAttachment}
                            linkedStatements={linkedStatements}
                            schoolContracts={schoolContracts}
                            selectedContractId={selectedContractId}
                            setSelectedContractId={setSelectedContractId}
                            setSelectedProgramId={setSelectedProgramId}
                            setSingleRubricId={setSingleRubricId}
                            setTotalValue={setTotalValue}
                            setMainDescription={setMainDescription}
                        />

                        {/* Audit Info Display */}
                        {auditInfo && (
                            <div className="mt-8 pt-6 border-t border-white/5 flex flex-wrap gap-x-8 gap-y-3 opacity-60">
                                {auditInfo.created_by && (
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-sm text-slate-500">add_circle</span>
                                        <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">
                                            Criado por: <span className="text-white ml-1">{auditInfo.created_by}</span>
                                        </p>
                                    </div>
                                )}
                                {auditInfo.updated_by && auditInfo.updated_by !== auditInfo.created_by && (
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-sm text-slate-500">edit</span>
                                        <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">
                                            Última edição: <span className="text-white ml-1">{auditInfo.updated_by}</span>
                                        </p>
                                    </div>
                                )}
                                {auditInfo.created_at && (
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-sm text-slate-500">calendar_today</span>
                                        <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">
                                            Em: <span className="text-white ml-1">{new Date(auditInfo.created_at).toLocaleString('pt-BR')}</span>
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <AuditLogTab entryLogs={entryLogs} />
                )}

                {/* Footer */}
                <div className="p-6 md:p-8 border-t border-white/5 flex justify-end gap-3 bg-cyan-500/5 shrink-0">
                    <button 
                        type="button"
                        onClick={onClose} 
                        className="px-6 py-3 rounded-xl text-slate-400 hover:bg-white/5 font-bold transition-all"
                    >
                        Cancelar
                    </button>
                    <button 
                        type="button"
                        onClick={handleSave} 
                        className="px-10 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-bold shadow-lg shadow-cyan-500/20 transition-all active:scale-95"
                    >
                        Salvar Lançamento
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EntryFormModal;
