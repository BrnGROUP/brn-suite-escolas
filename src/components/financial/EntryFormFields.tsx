import * as React from 'react';
import { TransactionStatus, User, UserRole } from '../../types';
import { ENTRY_CATEGORIES, EXIT_CATEGORIES } from '../../lib/constants';

interface EntryFormFieldsProps {
    user: User;
    type: 'Entrada' | 'Saída';
    setType: (val: 'Entrada' | 'Saída') => void;
    totalValue: string;
    setTotalValue: (val: string) => void;
    date: string;
    setDate: (val: string) => void;
    selectedSchoolId: string;
    setSelectedSchoolId: (val: string) => void;
    schoolSearch: string;
    setSchoolSearch: (val: string) => void;
    filteredSchools: any[];
    category: string;
    setCategory: (val: string) => void;
    selectedProgramId: string;
    setSelectedProgramId: (val: string) => void;
    programSearch: string;
    setProgramSearch: (val: string) => void;
    filteredPrograms: any[];
    isSimplified: boolean;
    selectedSupplierId: string;
    setSelectedSupplierId: (val: string) => void;
    supplierSearch: string;
    setSupplierSearch: (val: string) => void;
    filteredSuppliers: any[];
    mainDescription: string;
    setMainDescription: (val: string) => void;
    isBankOp: boolean;
    selectedBankAccountId: string;
    setSelectedBankAccountId: (val: string) => void;
    selectedPaymentMethodId: string;
    setSelectedPaymentMethodId: (val: string) => void;
    status: TransactionStatus;
    setStatus: (val: TransactionStatus) => void;
    documentNumber: string;
    setDocumentNumber: (val: string) => void;
    authNumber: string;
    setAuthNumber: (val: string) => void;
    invoiceDate: string;
    setInvoiceDate: (val: string) => void;
    paymentDate: string;
    setPaymentDate: (val: string) => void;
    auxData: {
        bankAccounts: any[];
        paymentMethods: any[];
    };
}

export const EntryFormFields: React.FC<EntryFormFieldsProps> = ({
    user,
    type,
    setType,
    totalValue,
    setTotalValue,
    date,
    setDate,
    selectedSchoolId,
    setSelectedSchoolId,
    schoolSearch,
    setSchoolSearch,
    filteredSchools,
    category,
    setCategory,
    selectedProgramId,
    setSelectedProgramId,
    programSearch,
    setProgramSearch,
    filteredPrograms,
    isSimplified,
    selectedSupplierId,
    setSelectedSupplierId,
    supplierSearch,
    setSupplierSearch,
    filteredSuppliers,
    mainDescription,
    setMainDescription,
    isBankOp,
    selectedBankAccountId,
    setSelectedBankAccountId,
    selectedPaymentMethodId,
    setSelectedPaymentMethodId,
    status,
    setStatus,
    documentNumber,
    setDocumentNumber,
    authNumber,
    setAuthNumber,
    invoiceDate,
    setInvoiceDate,
    paymentDate,
    setPaymentDate,
    auxData
}) => {
    const { bankAccounts, paymentMethods } = auxData;

    const isPnae = React.useMemo(() => {
        if (!selectedProgramId || !filteredPrograms) return false;
        const prog = filteredPrograms.find((p: any) => p.id === selectedProgramId);
        if (!prog) return false;
        return (prog.name || '').toUpperCase().includes('PNAE');
    }, [selectedProgramId, filteredPrograms]);

    const schoolOptions = React.useMemo(() => 
        filteredSchools.map(s => <option key={s.id} value={s.id}>{s.name}</option>), 
        [filteredSchools]
    );

    const programOptions = React.useMemo(() => 
        filteredPrograms.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>), 
        [filteredPrograms]
    );

    const supplierOptions = React.useMemo(() => 
        filteredSuppliers.map((s: any) => (
            <option key={s.id} value={s.id}>
                {s.name}{s.cnpj ? ` (${s.cnpj})` : ''}
            </option>
        )), 
        [filteredSuppliers]
    );

    const bankAccountOptions = React.useMemo(() => 
        bankAccounts
            .filter((b: any) => b.school_id === selectedSchoolId && b.program_id === selectedProgramId)
            .map((b: any) => (
                <option key={b.id} value={b.id}>
                    {b.name} ({b.account_number})
                </option>
            )), 
        [bankAccounts, selectedSchoolId, selectedProgramId]
    );

    const paymentMethodOptions = React.useMemo(() => 
        paymentMethods.map((pm: any) => <option key={pm.id} value={pm.id}>{pm.name}</option>), 
        [paymentMethods]
    );

    return (
        <div className="flex flex-col gap-6">
            <div className="flex gap-4">
                <button
                    type="button"
                    onClick={() => setType('Saída')}
                    className={`flex-1 py-3 font-bold rounded-xl transition-all ${type === 'Saída' ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20' : 'bg-[#1e293b] text-slate-400'}`}
                >
                    Saída
                </button>
                <button
                    type="button"
                    onClick={() => setType('Entrada')}
                    className={`flex-1 py-3 font-bold rounded-xl transition-all ${type === 'Entrada' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'bg-[#1e293b] text-slate-400'}`}
                >
                    Entrada
                </button>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
                <div className="flex flex-col gap-2">
                    <label htmlFor="totalValue" className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Valor R$</label>
                    <input 
                        id="totalValue" 
                        type="number" 
                        value={totalValue} 
                        onChange={e => setTotalValue(e.target.value)} 
                        className="bg-[#1e293b] rounded-xl h-12 px-4 text-white text-lg font-mono outline-none border border-white/5 focus:border-cyan-500" 
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-end px-1">
                        <label htmlFor="entry_school_id" className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Escola</label>
                        <div className="relative w-40">
                            <input 
                                type="text" 
                                placeholder="Buscar..." 
                                value={schoolSearch}
                                onChange={e => setSchoolSearch(e.target.value)}
                                className="w-full bg-[#1e293b]/50 border border-white/5 rounded-lg h-6 px-2 pl-6 text-[10px] text-white outline-none focus:border-cyan-500 transition-colors placeholder:text-slate-600"
                            />
                            <span className="material-symbols-outlined absolute left-1.5 top-1 text-[12px] text-slate-500">search</span>
                        </div>
                    </div>
                    <select
                        title="Selecione a Escola"
                        id="entry_school_id"
                        aria-label="Selecione a Escola"
                        value={selectedSchoolId}
                        onChange={e => setSelectedSchoolId(e.target.value)}
                        className="bg-[#1e293b] rounded-xl h-12 px-4 text-white outline-none border border-white/5 focus:border-cyan-500"
                        disabled={user.role === UserRole.DIRETOR}
                    >
                        <option value="">Selecione...</option>
                        {schoolOptions}
                    </select>
                </div>
                <div className="flex flex-col gap-2">
                    <label htmlFor="entry_category" className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Categoria</label>
                    <select
                        title="Selecione a Categoria"
                        aria-label="Selecione a Categoria"
                        id="entry_category"
                        value={category}
                        onChange={e => setCategory(e.target.value)}
                        className="bg-[#1e293b] rounded-xl h-12 px-4 text-white outline-none border border-white/5 focus:border-cyan-500"
                    >
                        {(type === 'Saída' ? EXIT_CATEGORIES : ENTRY_CATEGORIES).map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-end px-1">
                        <label htmlFor="entry_program_id" className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Programa</label>
                        <div className="relative w-40">
                            <input 
                                type="text" 
                                placeholder="Buscar..." 
                                value={programSearch}
                                onChange={e => setProgramSearch(e.target.value)}
                                className="w-full bg-[#1e293b]/50 border border-white/5 rounded-lg h-6 px-2 pl-6 text-[10px] text-white outline-none focus:border-cyan-500 transition-colors placeholder:text-slate-600"
                            />
                            <span className="material-symbols-outlined absolute left-1.5 top-1 text-[12px] text-slate-500">search</span>
                        </div>
                    </div>
                    <select
                        title="Selecione o Programa"
                        aria-label="Selecione o Programa"
                        id="entry_program_id"
                        value={selectedProgramId}
                        onChange={e => setSelectedProgramId(e.target.value)}
                        className="bg-[#1e293b] rounded-xl h-12 px-4 text-white outline-none border border-white/5 focus:border-cyan-500"
                    >
                        <option value="">Selecione...</option>
                        {programOptions}
                    </select>
                </div>
                {!isSimplified && (
                    <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-end px-1">
                            <label htmlFor="entry_supplier_id" className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Fornecedor</label>
                            <div className="relative w-40">
                                <input 
                                    type="text" 
                                    placeholder="Buscar..." 
                                    value={supplierSearch}
                                    onChange={e => setSupplierSearch(e.target.value)}
                                    className="w-full bg-[#1e293b]/50 border border-white/5 rounded-lg h-6 px-2 pl-6 text-[10px] text-white outline-none focus:border-cyan-500 transition-colors placeholder:text-slate-600"
                                />
                                <span className="material-symbols-outlined absolute left-1.5 top-1 text-[12px] text-slate-500">search</span>
                            </div>
                        </div>
                        <select
                            title="Selecione o Fornecedor"
                            aria-label="Selecione o Fornecedor"
                            id="entry_supplier_id"
                            value={selectedSupplierId}
                            onChange={e => setSelectedSupplierId(e.target.value)}
                            className="bg-[#1e293b] rounded-xl h-12 px-4 text-white outline-none border border-white/5 focus:border-cyan-500"
                        >
                            <option value="">Selecione...</option>
                            {supplierOptions}
                        </select>
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-2">
                <label htmlFor="main_description" className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Descrição</label>
                <input
                    id="main_description"
                    type="text"
                    value={mainDescription}
                    onChange={e => setMainDescription(e.target.value.toUpperCase())}
                    className="bg-[#1e293b] rounded-xl h-12 px-4 text-white outline-none border border-white/5 focus:border-cyan-500"
                    placeholder={isBankOp ? "EX: TARIFA BANCÁRIA MENSAL" : "EX: COMPRA DE MATERIAIS"}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {!isPnae && (
                    <div className="flex flex-col gap-2">
                        <label htmlFor="entry_bank_account_id" className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Conta Bancária</label>
                        <select
                            title="Selecione a Conta Bancária"
                            aria-label="Selecione a Conta Bancária"
                            id="entry_bank_account_id"
                            value={selectedBankAccountId}
                            onChange={e => setSelectedBankAccountId(e.target.value)}
                            className="bg-[#1e293b] rounded-xl h-12 px-4 text-white outline-none border border-white/5 focus:border-cyan-500"
                        >
                            <option value="">Selecione...</option>
                            {bankAccountOptions}
                        </select>
                    </div>
                )}
                <div className={`flex flex-col gap-2 ${isPnae ? 'md:col-span-2' : ''}`}>
                    <label htmlFor="entry_payment_method_id" className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Forma de Pagamento</label>
                    <select
                        title="Selecione a Forma de Pagamento"
                        aria-label="Selecione a Forma de Pagamento"
                        id="entry_payment_method_id"
                        value={selectedPaymentMethodId}
                        onChange={e => setSelectedPaymentMethodId(e.target.value)}
                        className="bg-[#1e293b] rounded-xl h-12 px-4 text-white outline-none border border-white/5 focus:border-cyan-500"
                    >
                        <option value="">Selecione...</option>
                        {paymentMethodOptions}
                    </select>
                </div>
            </div>

            <div className="flex flex-col gap-2">
                <label htmlFor="entry_status" className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Status</label>
                <select
                    title="Selecione o Status"
                    aria-label="Selecione o Status"
                    id="entry_status"
                    value={status}
                    onChange={e => setStatus(e.target.value as TransactionStatus)}
                    className="bg-[#1e293b] rounded-xl h-12 px-4 text-white outline-none border border-white/5 focus:border-cyan-500"
                >
                    <option value={TransactionStatus.PENDENTE}>Pendente</option>
                    <option value={TransactionStatus.PAGO}>Pago / Recebido</option>
                    <option value={TransactionStatus.CONCILIADO}>Conciliado</option>
                    <option value={TransactionStatus.ESTORNADO}>Estornado / Cancelado</option>
                </select>
            </div>

            {!isSimplified && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                            <label htmlFor="document_number" className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Nº Documento</label>
                            <input 
                                id="document_number" 
                                type="text" 
                                value={documentNumber} 
                                onChange={e => setDocumentNumber(e.target.value)} 
                                className="bg-[#1e293b] rounded-xl h-12 px-4 text-white outline-none border border-white/5 focus:border-cyan-500" 
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label htmlFor="auth_number" className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Nº Autenticação</label>
                            <input 
                                id="auth_number" 
                                type="text" 
                                value={authNumber} 
                                onChange={e => setAuthNumber(e.target.value)} 
                                className="bg-[#1e293b] rounded-xl h-12 px-4 text-white outline-none border border-white/5 focus:border-cyan-500" 
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                            <label htmlFor="invoice_date" className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Data da Nota</label>
                            <input 
                                id="invoice_date" 
                                type="date" 
                                value={invoiceDate} 
                                onChange={e => setInvoiceDate(e.target.value)} 
                                className="bg-[#1e293b] rounded-xl h-12 px-4 text-white outline-none border border-white/5 focus:border-cyan-500" 
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label htmlFor="payment_date" className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Data do Pagamento</label>
                            <input 
                                id="payment_date" 
                                type="date" 
                                value={paymentDate} 
                                onChange={e => setPaymentDate(e.target.value)} 
                                className="bg-[#1e293b] rounded-xl h-12 px-4 text-white outline-none border border-white/5 focus:border-cyan-500" 
                            />
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
