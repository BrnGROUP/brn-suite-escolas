import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { User, Supplier } from '../../types';
import { useToast } from '../../context/ToastContext';
import { FORO_CITIES } from '../../lib/constants';

interface SupplierContractModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User;
    auxData: {
        schools: any[];
        programs: any[];
        suppliers: Supplier[];
    };
    onSave: () => void;
    editingId?: string | null;
}

const SupplierContractModal: React.FC<SupplierContractModalProps> = ({
    isOpen,
    onClose,
    user,
    auxData,
    onSave,
    editingId
}) => {
    const [loading, setLoading] = useState(false);
    const { addToast } = useToast();

    // Form State
    const [schoolId, setSchoolId] = useState(user.schoolId || '');
    const [supplierId, setSupplierId] = useState('');
    const [programId, setProgramId] = useState('');
    const [rubricId, setRubricId] = useState('');
    const [contractNumber, setContractNumber] = useState('');
    const [description, setDescription] = useState('');
    const [monthlyValue, setMonthlyValue] = useState('');
    const [totalValue, setTotalValue] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [durationMonths, setDurationMonths] = useState('12');
    const [category, setCategory] = useState<'INTERNET' | 'GÁS' | 'OUTROS'>('INTERNET');
    const [gasUnitPrice, setGasUnitPrice] = useState('');
    const [gasQuantity, setGasQuantity] = useState('');
    const [status, setStatus] = useState<'Ativo' | 'Encerrado' | 'Suspenso'>('Ativo');
    const [creationMode, setCreationMode] = useState<'NEW' | 'ADITIVO'>('NEW');
    const [parentContractId, setParentContractId] = useState('');
    const [existingContracts, setExistingContracts] = useState<any[]>([]);

    // Witnesses (terms_json)
    const [w1Name, setW1Name] = useState('');
    const [w1Cpf, setW1Cpf] = useState('');
    const [w1Rg, setW1Rg] = useState('');
    const [w2Name, setW2Name] = useState('');
    const [w2Cpf, setW2Cpf] = useState('');
    const [w2Rg, setW2Rg] = useState('');

    const [rubrics, setRubrics] = useState<any[]>([]);
    const [supplierSearch, setSupplierSearch] = useState('');
    const [schoolSearch, setSchoolSearch] = useState('');
    const [foroCity, setForoCity] = useState('');
    const [internetSpeed, setInternetSpeed] = useState('200 Mbps');
    const [customDirectorName, setCustomDirectorName] = useState('');
    const [customDirectorCpf, setCustomDirectorCpf] = useState('');
    const [customDirectorRg, setCustomDirectorRg] = useState('');
    const [customDirectorAddress, setCustomDirectorAddress] = useState('');



    useEffect(() => {
        if (isOpen) {
            fetchRubrics();
            if (editingId) {
                fetchContract();
            } else {
                resetForm();
                fetchExistingContracts();
                if (user.schoolId) setSchoolId(user.schoolId);
            }
        }
    }, [isOpen, editingId, user.schoolId]);

    const fetchExistingContracts = async () => {
        if (!schoolId) return;
        const { data } = await supabase
            .from('supplier_contracts')
            .select('*, suppliers(name)')
            .eq('school_id', schoolId)
            .eq('status', 'Ativo')
            .order('created_at', { ascending: false });
        setExistingContracts(data || []);
    };

    useEffect(() => {
        if (schoolId) fetchExistingContracts();
    }, [schoolId]);

    const handleSelectParent = (id: string) => {
        const parent = existingContracts.find(c => c.id === id);
        if (parent) {
            setParentContractId(id);
            setSupplierId(parent.supplier_id);
            setProgramId(parent.program_id);
            setRubricId(parent.rubric_id || '');
            setCategory(parent.category);
            setContractNumber(`${parent.contract_number}/ADITIVO`);
            setDescription(`TERMO ADITIVO AO CONTRATO Nº ${parent.contract_number} - ${parent.description}`);

            const terms = parent.terms_json || {};
            setW1Name(terms.witness_1_name || '');
            setW1Cpf(terms.witness_1_cpf || '');
            setW1Rg(terms.witness_1_rg || '');
            setW2Name(terms.witness_2_name || '');
            setW2Cpf(terms.witness_2_cpf || '');
            setW2Rg(terms.witness_2_rg || '');
            setInternetSpeed(terms.internet_speed || '200 Mbps');
            setCustomDirectorName(terms.custom_director_name || '');
            setCustomDirectorCpf(terms.custom_director_cpf || '');
            setCustomDirectorRg(terms.custom_director_rg || '');
            setCustomDirectorAddress(terms.custom_director_address || '');
            setGasUnitPrice(terms.gas_unit_price ? terms.gas_unit_price.toString() : '');
            setGasQuantity(terms.gas_quantity ? terms.gas_quantity.toString() : '');
        }
    };

    const fetchContract = async () => {
        const { data, error } = await supabase
            .from('supplier_contracts')
            .select('*')
            .eq('id', editingId)
            .single();

        if (data && !error) {
            setSchoolId(data.school_id);
            setSupplierId(data.supplier_id);
            setProgramId(data.program_id);
            setRubricId(data.rubric_id || '');
            setContractNumber(data.contract_number || '');
            setDescription(data.description);
            setMonthlyValue(data.monthly_value.toString());
            setTotalValue(data.total_value ? data.total_value.toString() : '');
            setStartDate(data.start_date);
            setEndDate(data.end_date);
            setCategory(data.category);
            setStatus(data.status);

            if (data.start_date && data.end_date) {
                const start = new Date(data.start_date + 'T12:00:00');
                const end = new Date(data.end_date + 'T12:00:00');
                const yearsDiff = end.getFullYear() - start.getFullYear();
                const monthsDiff = end.getMonth() - start.getMonth();
                const daysDiff = (end.getDate() - start.getDate()) / 30;
                const diff = Math.max(1, Math.round(yearsDiff * 12 + monthsDiff + daysDiff));
                setDurationMonths(diff.toString());
            }

            const terms = data.terms_json || {};
            setW1Name(terms.witness_1_name || '');
            setW1Cpf(terms.witness_1_cpf || '');
            setW1Rg(terms.witness_1_rg || '');
            setW2Name(terms.witness_2_name || '');
            setW2Cpf(terms.witness_2_cpf || '');
            setW2Rg(terms.witness_2_rg || '');
            setForoCity(terms.foro_city || '');
            setInternetSpeed(terms.internet_speed || '200 Mbps');
            setCustomDirectorName(terms.custom_director_name || '');
            setCustomDirectorCpf(terms.custom_director_cpf || '');
            setCustomDirectorRg(terms.custom_director_rg || '');
            setCustomDirectorAddress(terms.custom_director_address || '');
            setGasUnitPrice(terms.gas_unit_price ? terms.gas_unit_price.toString() : '');
            setGasQuantity(terms.gas_quantity ? terms.gas_quantity.toString() : '');
        }
    };

    useEffect(() => {
        if (startDate && durationMonths && creationMode === 'NEW') {
            const start = new Date(startDate + 'T12:00:00');
            const end = new Date(start);
            end.setMonth(start.getMonth() + parseInt(durationMonths));
            
            // Format to YYYY-MM-DD
            const yyyy = end.getFullYear();
            const mm = String(end.getMonth() + 1).padStart(2, '0');
            const dd = String(end.getDate()).padStart(2, '0');
            setEndDate(`${yyyy}-${mm}-${dd}`);

            // Also auto-calculate total value if monthly exists (only for non-GAS contracts)
            if (monthlyValue && category !== 'GÁS') {
                setTotalValue((parseFloat(monthlyValue) * parseInt(durationMonths)).toString());
            }
        }
    }, [startDate, durationMonths, monthlyValue, creationMode, category]);

    const handleGasUnitPriceChange = (val: string) => {
        setGasUnitPrice(val);
        const price = parseFloat(val);
        if (price > 0) {
            if (gasQuantity) {
                const qty = parseFloat(gasQuantity);
                const total = price * qty;
                setTotalValue(total.toString());
                const months = parseInt(durationMonths) || 12;
                setMonthlyValue((total / months).toFixed(2));
            } else if (totalValue) {
                const total = parseFloat(totalValue);
                const qty = Math.floor(total / price);
                setGasQuantity(qty.toString());
            }
        }
    };

    const handleGasQuantityChange = (val: string) => {
        setGasQuantity(val);
        const qty = parseFloat(val);
        if (qty > 0 && gasUnitPrice) {
            const price = parseFloat(gasUnitPrice);
            const total = price * qty;
            setTotalValue(total.toString());
            const months = parseInt(durationMonths) || 12;
            setMonthlyValue((total / months).toFixed(2));
        }
    };

    const handleTotalValueChange = (val: string) => {
        setTotalValue(val);
        const total = parseFloat(val);
        if (total > 0) {
            const months = parseInt(durationMonths) || 12;
            setMonthlyValue((total / months).toFixed(2));
            if (category === 'GÁS' && gasUnitPrice) {
                const price = parseFloat(gasUnitPrice);
                if (price > 0) {
                    const qty = Math.floor(total / price);
                    setGasQuantity(qty.toString());
                }
            }
        }
    };

    const handleMonthlyValueChange = (val: string) => {
        setMonthlyValue(val);
        const monthly = parseFloat(val);
        if (monthly > 0) {
            const months = parseInt(durationMonths) || 12;
            const total = monthly * months;
            setTotalValue(total.toString());
            if (category === 'GÁS' && gasUnitPrice) {
                const price = parseFloat(gasUnitPrice);
                if (price > 0) {
                    const qty = Math.floor(total / price);
                    setGasQuantity(qty.toString());
                }
            }
        }
    };

    const handleDurationMonthsChange = (val: string) => {
        setDurationMonths(val);
        const months = parseInt(val);
        if (months > 0) {
            if (category === 'GÁS') {
                if (totalValue) {
                    const total = parseFloat(totalValue);
                    setMonthlyValue((total / months).toFixed(2));
                } else if (monthlyValue) {
                    const monthly = parseFloat(monthlyValue);
                    const total = monthly * months;
                    setTotalValue(total.toString());
                    if (gasUnitPrice) {
                        const price = parseFloat(gasUnitPrice);
                        if (price > 0) {
                            const qty = Math.floor(total / price);
                            setGasQuantity(qty.toString());
                        }
                    }
                }
            }
        }
    };

    const handleTotalValueBlur = () => {
        if (category === 'GÁS' && gasUnitPrice && totalValue) {
            const price = parseFloat(gasUnitPrice);
            const totalAvail = parseFloat(totalValue);
            if (price > 0 && totalAvail > 0) {
                const qty = Math.floor(totalAvail / price);
                const adjusted = qty * price;
                setTotalValue(adjusted.toString());
                setGasQuantity(qty.toString());
                const months = parseInt(durationMonths) || 12;
                setMonthlyValue((adjusted / months).toFixed(2));
            }
        }
    };

    const handleGasUnitPriceBlur = () => {
        if (category === 'GÁS' && gasUnitPrice && totalValue && !gasQuantity) {
            const price = parseFloat(gasUnitPrice);
            const totalAvail = parseFloat(totalValue);
            if (price > 0 && totalAvail > 0) {
                const qty = Math.floor(totalAvail / price);
                const adjusted = qty * price;
                setTotalValue(adjusted.toString());
                setGasQuantity(qty.toString());
                const months = parseInt(durationMonths) || 12;
                setMonthlyValue((adjusted / months).toFixed(2));
            }
        }
    };

    const fetchRubrics = async () => {
        const { data } = await supabase.from('rubrics').select('*').order('name');
        setRubrics(data || []);
    };

    const handleSave = async () => {
        if (!schoolId || !supplierId || !programId || !description || !monthlyValue || !startDate || !endDate) {
            addToast('Por favor, preencha todos os campos obrigatórios.', 'warning');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                school_id: schoolId,
                supplier_id: supplierId,
                program_id: programId,
                rubric_id: rubricId || null,
                contract_number: contractNumber,
                description: description.toUpperCase(),
                monthly_value: parseFloat(monthlyValue),
                total_value: parseFloat(totalValue) || 0,
                start_date: startDate,
                end_date: endDate,
                category,
                status,
                terms_json: {
                    is_aditivo: creationMode === 'ADITIVO',
                    parent_contract_id: parentContractId || null,
                    internet_speed: category === 'INTERNET' ? internetSpeed : null,
                    gas_unit_price: category === 'GÁS' && gasUnitPrice ? parseFloat(gasUnitPrice) : null,
                    gas_quantity: category === 'GÁS' && gasQuantity ? parseFloat(gasQuantity) : null,
                    custom_director_name: customDirectorName,
                    custom_director_cpf: customDirectorCpf,
                    custom_director_rg: customDirectorRg,
                    custom_director_address: customDirectorAddress,
                    witness_1_name: w1Name,
                    witness_1_cpf: w1Cpf,
                    witness_1_rg: w1Rg,
                    witness_2_name: w2Name,
                    witness_2_cpf: w2Cpf,
                    witness_2_rg: w2Rg,
                    foro_city: foroCity
                }
            };

            if (editingId) {
                const { error } = await supabase.from('supplier_contracts').update(payload).eq('id', editingId);
                if (error) throw error;
                addToast('Contrato atualizado com sucesso!', 'success');
            } else {
                const { data: newContract, error: cError } = await supabase.from('supplier_contracts').insert([payload]).select().single();
                if (cError) throw cError;

                // Automatically create initial "Award/Quotation" accountability process
                if (creationMode === 'NEW') {
                    const { data: process, error: pError } = await supabase.from('accountability_processes').insert({
                        school_id: schoolId,
                        contract_id: newContract.id,
                        status: 'Em Andamento',
                        is_contract_based: false, // This is the search-of-prices phase
                        description: `COTAÇÃO DE PREÇOS: ${description.toUpperCase()}`
                    }).select().single();

                    if (!pError) {
                        // Add the main contract item to the process
                        await supabase.from('accountability_items').insert({
                            process_id: process.id,
                            description: description.toUpperCase(),
                            quantity: parseInt(durationMonths) || 1,
                            unit: 'Mês',
                            winner_unit_price: parseFloat(monthlyValue)
                        });

                        // Add the winner quote
                        const supplier = auxData.suppliers.find(s => s.id === supplierId);
                        await supabase.from('accountability_quotes').insert({
                            process_id: process.id,
                            supplier_id: supplierId,
                            supplier_name: supplier?.name || 'Vencedor',
                            supplier_cnpj: supplier?.cnpj || null,
                            is_winner: true,
                            total_value: parseFloat(totalValue) || 0
                        });
                    }
                }
                
                addToast('Contrato registrado com sucesso!', 'success');
            }
            onSave();
            onClose();
            resetForm();
        } catch (err: any) {
            addToast('Erro ao salvar contrato: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        if (!user.schoolId) setSchoolId('');
        setSupplierId('');
        setProgramId('');
        setRubricId('');
        setContractNumber('');
        setDescription('');
        setMonthlyValue('');
        setTotalValue('');
        setStartDate('');
        setEndDate('');
        setDurationMonths('12');
        setW1Name('');
        setW1Cpf('');
        setW1Rg('');
        setW2Name('');
        setW2Cpf('');
        setW2Rg('');
        setForoCity('');
        setInternetSpeed('200 Mbps');
        setCustomDirectorName('');
        setCustomDirectorCpf('');
        setCustomDirectorRg('');
        setCustomDirectorAddress('');
        setGasUnitPrice('');
        setGasQuantity('');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-0 md:p-4 bg-black/95 backdrop-blur-md">
            <div className="w-full max-w-4xl bg-[#0a0f14] border-x md:border border-white/10 rounded-none md:rounded-[32px] shadow-2xl flex flex-col h-full md:h-auto md:max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
                <div className={`p-6 md:p-8 border-b border-white/5 flex flex-col ${editingId ? 'gap-0' : 'gap-6 md:gap-8'} bg-[#0d1218] rounded-t-none md:rounded-t-[32px] shrink-0 z-20`}>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3 md:gap-4">
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20 shrink-0">
                                <span className="material-symbols-outlined text-xl md:text-2xl">history_edu</span>
                            </div>
                            <div>
                                <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight leading-none mb-1">{editingId ? 'Editar Contrato' : 'Novo Contrato'}</h3>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">Serviços Recorrentes</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {!editingId && (
                                <div className="hidden lg:flex bg-black/40 p-1 rounded-xl border border-white/5 mr-4">
                                    <button
                                        onClick={() => { setCreationMode('NEW'); resetForm(); }}
                                        className={`px-6 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all gap-2 flex items-center ${creationMode === 'NEW' ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                                    >
                                        <span className="material-symbols-outlined text-sm">add_circle</span>
                                        Novo
                                    </button>
                                    <button
                                        onClick={() => setCreationMode('ADITIVO')}
                                        className={`px-6 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all gap-2 flex items-center ${creationMode === 'ADITIVO' ? 'bg-amber-500 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                                    >
                                        <span className="material-symbols-outlined text-sm">history_edu</span>
                                        Aditivo
                                    </button>
                                </div>
                            )}
                            <button onClick={onClose} className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center text-slate-400 hover:bg-white/5 hover:text-white transition-all shrink-0">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                    </div>

                    {/* Mobile Tabs */}
                    {!editingId && (
                        <div className="lg:hidden flex bg-black/40 p-1 rounded-xl border border-white/5 w-full">
                            <button
                                onClick={() => { setCreationMode('NEW'); resetForm(); }}
                                className={`flex-1 py-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all gap-2 flex items-center justify-center ${creationMode === 'NEW' ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                            >
                                <span className="material-symbols-outlined text-sm">add_circle</span> Novo
                            </button>
                            <button
                                onClick={() => setCreationMode('ADITIVO')}
                                className={`flex-1 py-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all gap-2 flex items-center justify-center ${creationMode === 'ADITIVO' ? 'bg-amber-500 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                            >
                                <span className="material-symbols-outlined text-sm">history_edu</span> Aditivo
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14">
                        {/* Seção 1: Dados do Contrato */}
                        <section className="space-y-8">
                            <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] border-b border-primary/10 pb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">{creationMode === 'ADITIVO' ? 'history_edu' : 'description'}</span>
                                {creationMode === 'ADITIVO' ? '1. Contrato Original e Aditivo' : '1. Objeto e Fornecedor'}
                            </h4>

                            <div className="space-y-5">
                                {creationMode === 'ADITIVO' && !editingId && (
                                    <div className="p-5 bg-amber-500/5 border border-amber-500/20 rounded-2xl animate-in slide-in-from-top-2 duration-300">
                                        <label className="text-[8px] font-black uppercase text-amber-500/70 tracking-widest mb-2 block">Selecionar Contrato para Aditar</label>
                                        <select
                                            title="Selecionar Contrato"
                                            value={parentContractId}
                                            onChange={e => handleSelectParent(e.target.value)}
                                            aria-label="Selecionar Contrato Original"
                                            className="w-full bg-black/40 border border-amber-500/20 rounded-xl h-12 px-4 text-white outline-none focus:border-amber-500 transition-all appearance-none text-xs"
                                        >
                                            <option value="">Escolher contrato ativo...</option>
                                            {existingContracts.map(c => (
                                                <option key={c.id} value={c.id}>
                                                    {c.contract_number} - {c.suppliers?.name} ({c.description.substring(0, 30)}...)
                                                </option>
                                            ))}
                                        </select>
                                        <p className="text-[9px] text-amber-500/50 mt-2 font-bold uppercase italic">* Ao selecionar, os dados do fornecedor e testemunhas serão importados.</p>
                                    </div>
                                )}
                                <div>
                                    <label className="text-[8px] font-black uppercase text-slate-500 tracking-widest mb-2 block">Fornecedor (CONTRATADA)</label>
                                    <div className="space-y-2">
                                        <div className="relative group">
                                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm group-focus-within:text-primary transition-colors">search</span>
                                            <input
                                                type="text"
                                                placeholder="Filtrar fornecedor por nome ou CNPJ..."
                                                className="w-full bg-black/40 border border-white/5 rounded-xl h-10 pl-11 pr-4 text-[10px] text-white outline-none focus:border-primary/30 transition-all font-bold"
                                                value={supplierSearch}
                                                onChange={e => setSupplierSearch(e.target.value)}
                                            />
                                        </div>
                                        <select
                                            title="Selecionar Fornecedor"
                                            value={supplierId}
                                            onChange={e => setSupplierId(e.target.value)}
                                            aria-label="Selecionar Fornecedor"
                                            className="w-full bg-black/40 border border-white/10 rounded-2xl h-14 px-5 text-white outline-none focus:border-primary transition-all appearance-none"
                                        >
                                            <option value="">Selecionar Fornecedor...</option>
                                            {auxData.suppliers
                                                .filter(s =>
                                                    !supplierSearch ||
                                                    s.name.toLowerCase().includes(supplierSearch.toLowerCase()) ||
                                                    (s.cnpj && s.cnpj.includes(supplierSearch))
                                                )
                                                .map(s => <option key={s.id} value={s.id}>{s.name} ({s.cnpj})</option>)
                                            }
                                        </select>
                                    </div>
                                </div>

                                {!user.schoolId && (
                                    <div>
                                        <label className="text-[8px] font-black uppercase text-slate-500 tracking-widest mb-2 block">Unidade Escolar (CONTRATANTE)</label>
                                        <div className="space-y-2">
                                            <div className="relative group">
                                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm group-focus-within:text-primary transition-colors">search</span>
                                                <input
                                                    type="text"
                                                    placeholder="Filtrar escola por nome..."
                                                    className="w-full bg-black/40 border border-white/5 rounded-xl h-10 pl-11 pr-4 text-[10px] text-white outline-none focus:border-primary/30 transition-all font-bold"
                                                    value={schoolSearch}
                                                    onChange={e => setSchoolSearch(e.target.value)}
                                                />
                                            </div>
                                            <select
                                                title="Selecionar Unidade Escolar"
                                                value={schoolId}
                                                onChange={e => setSchoolId(e.target.value)}
                                                aria-label="Selecionar Unidade Escolar"
                                                className="w-full bg-black/40 border border-white/10 rounded-2xl h-14 px-5 text-white outline-none focus:border-primary transition-all appearance-none border-dashed border-primary/30"
                                            >
                                                <option value="">Selecionar Unidade...</option>
                                                {auxData.schools
                                                    .filter(s => !schoolSearch || s.name.toLowerCase().includes(schoolSearch.toLowerCase()))
                                                    .map(s => <option key={s.id} value={s.id}>{s.name}</option>)
                                                }
                                            </select>
                                        </div>
                                    </div>
                                )}

                                <div className={`grid ${category === 'INTERNET' ? 'grid-cols-3' : 'grid-cols-2'} gap-4`}>
                                    <div>
                                        <label className="text-[8px] font-black uppercase text-slate-500 tracking-widest mb-2 block">Tipo de Contrato</label>
                                        <select
                                            title="Tipo de Contrato"
                                            value={category}
                                            onChange={e => setCategory(e.target.value as any)}
                                            aria-label="Tipo de Contrato"
                                            className="w-full bg-black/40 border border-white/10 rounded-2xl h-14 px-5 text-white outline-none focus:border-primary transition-all appearance-none text-primary font-bold"
                                        >
                                            <option value="INTERNET">INTERNET</option>
                                            <option value="GÁS">GÁS</option>
                                            <option value="OUTROS">OUTROS</option>
                                        </select>
                                    </div>
                                    {category === 'INTERNET' && (
                                        <div className="animate-in fade-in zoom-in-95 duration-200">
                                            <label className="text-[8px] font-black uppercase text-slate-500 tracking-widest mb-2 block">Velocidade</label>
                                            <select
                                                title="Velocidade da Internet"
                                                value={internetSpeed}
                                                onChange={e => setInternetSpeed(e.target.value)}
                                                aria-label="Velocidade da Internet"
                                                className="w-full bg-black/40 border border-white/10 rounded-2xl h-14 px-5 text-white outline-none focus:border-primary transition-all appearance-none font-bold"
                                            >
                                                <option value="100 Mbps">100 Mbps</option>
                                                <option value="200 Mbps">200 Mbps</option>
                                                <option value="300 Mbps">300 Mbps</option>
                                                <option value="400 Mbps">400 Mbps</option>
                                                <option value="500 Mbps">500 Mbps</option>
                                                <option value="600 Mbps">600 Mbps</option>
                                                <option value="1 Gbps">1 Gbps</option>
                                            </select>
                                        </div>
                                    )}
                                    <div>
                                        <label className="text-[8px] font-black uppercase text-slate-500 tracking-widest mb-2 block">Nº Contrato</label>
                                        <input
                                            placeholder="Ex: 04/2025"
                                            aria-label="Número do Contrato"
                                            className="w-full bg-black/40 border border-white/10 rounded-2xl h-14 px-5 text-white outline-none focus:border-primary transition-all uppercase"
                                            value={contractNumber}
                                            onChange={e => setContractNumber(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[8px] font-black uppercase text-slate-500 tracking-widest mb-2 block">Descrição (Objeto detalhado)</label>
                                    <textarea
                                        placeholder="Ex: PRESTAÇÃO DE SERVIÇOS DE INTERNET BANDA LARGA COM VELOCIDADE DE 500MBPS..."
                                        aria-label="Descrição do Contrato"
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-white outline-none focus:border-primary transition-all min-h-[100px] text-xs resize-none"
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[8px] font-black uppercase text-slate-500 tracking-widest mb-2 block">Programa</label>
                                        <select
                                            title="Selecionar Programa"
                                            value={programId}
                                            onChange={e => setProgramId(e.target.value)}
                                            aria-label="Selecionar Programa"
                                            className="w-full bg-black/40 border border-white/10 rounded-2xl h-14 px-5 text-white outline-none focus:border-primary transition-all appearance-none"
                                        >
                                            <option value="">Programa...</option>
                                            {auxData.programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[8px] font-black uppercase text-slate-500 tracking-widest mb-2 block">Rubrica</label>
                                        <select
                                            title="Selecionar Rubrica"
                                            value={rubricId}
                                            onChange={e => setRubricId(e.target.value)}
                                            aria-label="Selecionar Rubrica"
                                            disabled={!programId}
                                            className="w-full bg-black/40 border border-white/10 rounded-2xl h-14 px-5 text-white outline-none focus:border-primary transition-all appearance-none disabled:opacity-20"
                                        >
                                            <option value="">Rubrica...</option>
                                            {rubrics
                                                .filter(r => r.program_id === programId && (!r.school_id || r.school_id === schoolId))
                                                .map(r => <option key={r.id} value={r.id}>{r.name}</option>)
                                            }
                                        </select>
                                    </div>
                                </div>

                                {category === 'GÁS' && (
                                    <div className="grid grid-cols-2 gap-4 animate-in fade-in zoom-in-95 duration-200">
                                        <div>
                                            <label className="text-[8px] font-black uppercase text-slate-500 tracking-widest mb-2 block">Preço Unitário do Botijão (R$)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                placeholder="0,00"
                                                aria-label="Preço Unitário"
                                                className="w-full bg-black/40 border border-white/10 rounded-2xl h-14 px-5 text-white outline-none focus:border-primary transition-all font-black text-sm"
                                                value={gasUnitPrice}
                                                onChange={e => handleGasUnitPriceChange(e.target.value)}
                                                onBlur={handleGasUnitPriceBlur}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[8px] font-black uppercase text-slate-500 tracking-widest mb-2 block">Quantidade de Botijões</label>
                                            <input
                                                type="number"
                                                step="1"
                                                placeholder="Ex: 32"
                                                aria-label="Quantidade"
                                                className="w-full bg-black/40 border border-white/10 rounded-2xl h-14 px-5 text-white outline-none focus:border-primary transition-all font-black text-sm"
                                                value={gasQuantity}
                                                onChange={e => handleGasQuantityChange(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[8px] font-black uppercase text-slate-500 tracking-widest mb-2 block">Valor Mensal (R$)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            placeholder="0,00"
                                            aria-label="Valor Mensal"
                                            className="w-full bg-black/40 border border-white/10 rounded-2xl h-14 px-5 text-white outline-none focus:border-primary transition-all font-black text-lg"
                                            value={monthlyValue}
                                            onChange={e => handleMonthlyValueChange(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[8px] font-black uppercase text-slate-500 tracking-widest mb-2 block">Valor Total do Contrato (R$)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            placeholder="0,00"
                                            aria-label="Valor Total"
                                            className="w-full bg-primary/5 border border-primary/20 rounded-2xl h-14 px-5 text-primary outline-none focus:border-primary transition-all font-black text-lg"
                                            value={totalValue}
                                            onChange={e => handleTotalValueChange(e.target.value)}
                                            onBlur={handleTotalValueBlur}
                                        />
                                    </div>
                                </div>

                                {category === 'GÁS' && gasUnitPrice && totalValue && (
                                    (() => {
                                        const price = parseFloat(gasUnitPrice);
                                        const totalAvail = parseFloat(totalValue);
                                        if (price > 0 && totalAvail > 0) {
                                            const qty = Math.floor(totalAvail / price);
                                            const adjusted = qty * price;
                                            const sobra = totalAvail - adjusted;
                                            if (sobra > 0) {
                                                return (
                                                    <div className="text-[10px] text-amber-500/90 font-bold uppercase tracking-wider flex items-center gap-1.5 animate-in slide-in-from-top-1 duration-200">
                                                        <span className="material-symbols-outlined text-sm">info</span>
                                                        Sobra não contratada: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sobra)} (será ajustado para {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(adjusted)} com {qty} unidades ao sair do campo)
                                                    </div>
                                                );
                                            }
                                        }
                                        return null;
                                    })()
                                )}

                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="text-[8px] font-black uppercase text-slate-500 tracking-widest mb-2 block">Data Início</label>
                                        <input
                                            type="date"
                                            aria-label="Data de Início"
                                            className="w-full bg-black/40 border border-white/10 rounded-2xl h-14 px-5 text-white outline-none focus:border-primary transition-all"
                                            value={startDate}
                                            onChange={e => setStartDate(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[8px] font-black uppercase text-slate-500 tracking-widest mb-2 block">Vigência (Meses)</label>
                                        <input
                                            type="number"
                                            placeholder="12"
                                            aria-label="Meses de Vigência"
                                            className="w-full bg-black/40 border border-white/10 rounded-2xl h-14 px-5 text-white outline-none focus:border-primary transition-all font-black"
                                            value={durationMonths}
                                            onChange={e => handleDurationMonthsChange(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[8px] font-black uppercase text-slate-500 tracking-widest mb-2 block">Data Término</label>
                                        <input
                                            type="date"
                                            aria-label="Data de Término"
                                            className="w-full bg-black/40 border border-white/10 rounded-2xl h-14 px-5 text-white outline-none focus:border-primary transition-all"
                                            value={endDate}
                                            onChange={e => setEndDate(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[8px] font-black uppercase text-slate-500 tracking-widest mb-2 block">Cidade do Foro (Comarca)</label>
                                    <div className="relative group">
                                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary text-sm">gavel</span>
                                        <select
                                            title="Selecionar Cidade do Foro"
                                            value={foroCity}
                                            onChange={e => setForoCity(e.target.value)}
                                            aria-label="Selecionar Cidade do Foro"
                                            className="w-full bg-black/40 border border-white/10 rounded-2xl h-14 pl-12 pr-5 text-white outline-none focus:border-primary transition-all appearance-none text-xs font-bold"
                                        >
                                            <option value="">Automático (Baseado na Escola)</option>
                                            {FORO_CITIES.map(city => (
                                                <option key={city} value={city}>{city}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <p className="text-[9px] text-slate-500 mt-2 font-bold uppercase italic">* Se não selecionado, o sistema usará a cidade polo da região da escola.</p>
                                </div>
                            </div>
                        </section>

                        {/* Seção 2: Representantes e Testemunhas */}
                        <section className="space-y-8">
                            <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] border-b border-primary/10 pb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">groups</span> 2. Representantes e Testemunhas
                            </h4>

                            <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[32px] space-y-8 shadow-inner">
                                {/* Representante da Escola (Gestor Retroativo) */}
                                <div className="space-y-5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-xs font-black">
                                            <span className="material-symbols-outlined text-sm">assignment_ind</span>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-white uppercase tracking-widest leading-none">Representante da Escola (Presidente/Diretor)</p>
                                            <p className="text-[7px] font-bold text-slate-500 uppercase tracking-widest mt-1">Preencha apenas se for diferente do atual (retroativo)</p>
                                        </div>
                                    </div>
                                    <input
                                        placeholder="Nome do Diretor/Presidente do Contrato"
                                        aria-label="Nome do Representante da Escola"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl h-12 px-5 text-xs text-white outline-none focus:border-primary transition-all"
                                        value={customDirectorName}
                                        onChange={e => setCustomDirectorName(e.target.value)}
                                    />
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="flex flex-col gap-1.5">
                                            <input placeholder="CPF do Representante" aria-label="CPF do Representante" className="bg-black/40 border border-white/10 rounded-xl h-12 px-5 text-xs text-white outline-none focus:border-primary transition-all" value={customDirectorCpf} onChange={e => setCustomDirectorCpf(e.target.value)} />
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <input placeholder="RG do Representante" aria-label="RG do Representante" className="bg-black/40 border border-white/10 rounded-xl h-12 px-5 text-xs text-white outline-none focus:border-primary transition-all" value={customDirectorRg} onChange={e => setCustomDirectorRg(e.target.value)} />
                                        </div>
                                    </div>
                                    <input
                                        placeholder="Endereço Residencial do Representante"
                                        aria-label="Endereço Residencial do Representante"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl h-12 px-5 text-xs text-white outline-none focus:border-primary transition-all"
                                        value={customDirectorAddress}
                                        onChange={e => setCustomDirectorAddress(e.target.value)}
                                    />
                                </div>

                                <div className="w-full h-px bg-white/5"></div>

                                <div className="space-y-5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-xs font-black">01</div>
                                        <p className="text-[10px] font-black text-white uppercase tracking-widest">Testemunha 01</p>
                                    </div>
                                    <input
                                        placeholder="Nome Completo"
                                        aria-label="Nome Testemunha 1"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl h-12 px-5 text-xs text-white outline-none focus:border-primary transition-all"
                                        value={w1Name}
                                        onChange={e => setW1Name(e.target.value)}
                                    />
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="flex flex-col gap-1.5">
                                            <input placeholder="CPF" aria-label="CPF Testemunha 1" className="bg-black/40 border border-white/10 rounded-xl h-12 px-5 text-xs text-white outline-none focus:border-primary transition-all" value={w1Cpf} onChange={e => setW1Cpf(e.target.value)} />
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <input placeholder="RG / CNH" aria-label="RG Testemunha 1" className="bg-black/40 border border-white/10 rounded-xl h-12 px-5 text-xs text-white outline-none focus:border-primary transition-all" value={w1Rg} onChange={e => setW1Rg(e.target.value)} />
                                        </div>
                                    </div>
                                </div>

                                <div className="w-full h-px bg-white/5"></div>

                                <div className="space-y-5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-xs font-black">02</div>
                                        <p className="text-[10px] font-black text-white uppercase tracking-widest">Testemunha 02</p>
                                    </div>
                                    <input
                                        placeholder="Nome Completo"
                                        aria-label="Nome Testemunha 2"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl h-12 px-5 text-xs text-white outline-none focus:border-primary transition-all"
                                        value={w2Name}
                                        onChange={e => setW2Name(e.target.value)}
                                    />
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="flex flex-col gap-1.5">
                                            <input placeholder="CPF" aria-label="CPF Testemunha 2" className="bg-black/40 border border-white/10 rounded-xl h-12 px-5 text-xs text-white outline-none focus:border-primary transition-all" value={w2Cpf} onChange={e => setW2Cpf(e.target.value)} />
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <input placeholder="RG / CNH" aria-label="RG Testemunha 2" className="bg-black/40 border border-white/10 rounded-xl h-12 px-5 text-xs text-white outline-none focus:border-primary transition-all" value={w2Rg} onChange={e => setW2Rg(e.target.value)} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-5 md:p-6 bg-primary/5 border border-primary/10 rounded-2xl md:rounded-3xl flex items-start gap-3 md:gap-4">
                                <span className="material-symbols-outlined text-primary text-sm md:text-base">verified_user</span>
                                <p className="text-[9px] md:text-[10px] text-slate-400 font-medium leading-relaxed">
                                    Estes dados serão utilizados para preencher as cláusulas de assinaturas do contrato padrão SEEC/AL na geração do PDF.
                                </p>
                            </div>
                        </section>
                    </div>
                </div>

                <div className="p-6 md:p-8 border-t border-white/5 flex flex-col sm:flex-row justify-end gap-3 bg-black/20 rounded-b-none md:rounded-b-[32px] sticky bottom-0 z-10 backdrop-blur-xl">
                    <button onClick={onClose} className="w-full sm:w-auto px-8 py-3 rounded-2xl text-slate-400 font-bold uppercase text-[10px] tracking-widest hover:bg-white/5 transition-all">Cancelar</button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="w-full sm:w-auto px-12 py-3 bg-primary hover:bg-primary-hover text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl shadow-primary/30 active:scale-95 transition-all disabled:opacity-50"
                    >
                        {loading ? 'Sincronizando...' : editingId ? 'Salvar Alterações' : 'Concluir Registro'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SupplierContractModal;
