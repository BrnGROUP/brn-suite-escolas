import * as React from 'react';
import { supabase } from '../lib/supabaseClient';
import { TransactionStatus, TransactionNature, User } from '../types';
import { useToast } from '../context/ToastContext';
import { useFileUpload } from './useFileUpload';
import { ENTRY_CATEGORIES, EXIT_CATEGORIES } from '../lib/constants';

export interface SplitItem {
    id: string;
    rubricId: string;
    rubricName: string;
    nature: TransactionNature;
    value: number;
    description: string;
}

interface UseEntryFormProps {
    isOpen: boolean;
    onClose: () => void;
    user: User;
    editingId: string | null;
    editingBatchId: string | null;
    auxData: any;
    accessibleSchools: any[];
    onSave: () => void;
}

export const useEntryForm = ({
    isOpen,
    onClose,
    user,
    editingId,
    editingBatchId,
    auxData,
    accessibleSchools,
    onSave
}: UseEntryFormProps) => {
    // UI States
    const [activeTab, setActiveTab] = React.useState<'dados' | 'historico'>('dados');
    const { addToast } = useToast();
    const { uploadFile, isUploading } = useFileUpload({ bucket: 'documents', compress: true });

    // Form State
    const [type, setType] = React.useState<'Entrada' | 'Saída'>('Saída');
    const [category, setCategory] = React.useState('');
    const [selectedSchoolId, setSelectedSchoolId] = React.useState('');
    const [date, setDate] = React.useState('');
    const [selectedProgramId, setSelectedProgramId] = React.useState('');
    const [totalValue, setTotalValue] = React.useState('');
    const [mainDescription, setMainDescription] = React.useState('');
    const [selectedSupplierId, setSelectedSupplierId] = React.useState('');
    const [supplierSearch, setSupplierSearch] = React.useState('');
    const [schoolSearch, setSchoolSearch] = React.useState('');
    const [programSearch, setProgramSearch] = React.useState('');
    const [status, setStatus] = React.useState<TransactionStatus>(TransactionStatus.PENDENTE);
    const [invoiceDate, setInvoiceDate] = React.useState('');
    const [paymentDate, setPaymentDate] = React.useState('');
    const [selectedBankAccountId, setSelectedBankAccountId] = React.useState('');
    const [selectedPaymentMethodId, setSelectedPaymentMethodId] = React.useState('');
    const [documentNumber, setDocumentNumber] = React.useState('');
    const [authNumber, setAuthNumber] = React.useState('');
    const [attachments, setAttachments] = React.useState<any[]>([]);
    const [technicalProcess, setTechnicalProcess] = React.useState<any>(null);
    const [entryLogs, setEntryLogs] = React.useState<any[]>([]);
    const [linkedStatements, setLinkedStatements] = React.useState<any[]>([]);
    const lastFetchRef = React.useRef<{ accId: string; date: string } | null>(null);
    const [selectedContractId, setSelectedContractId] = React.useState('');
    const [schoolContracts, setSchoolContracts] = React.useState<any[]>([]);
    const [auditInfo, setAuditInfo] = React.useState<{ created_by?: string; updated_by?: string; created_at?: string } | null>(null);

    const [isSplitMode, setIsSplitMode] = React.useState(false);
    const [splitItems, setSplitItems] = React.useState<SplitItem[]>([]);
    const [singleRubricId, setSingleRubricId] = React.useState('');
    const [singleNature, setSingleNature] = React.useState<TransactionNature>(TransactionNature.CUSTEIO);

    const { programs, rubrics: allRubrics, suppliers, paymentMethods } = auxData;

    // Memoized filters and properties
    const filteredRubrics = React.useMemo(() => {
        if (selectedProgramId && allRubrics) {
            return allRubrics.filter((r: any) => 
                r.program_id === selectedProgramId && 
                (!r.school_id || r.school_id === selectedSchoolId)
            );
        }
        return [];
    }, [selectedProgramId, selectedSchoolId, allRubrics]);

    const isSimplified = React.useMemo(() => {
        const simplifiedCats = [
            'Tarifa Bancária',
            'Rendimento de Aplicação',
            'Aplicação Financeira',
            'Resgate de Aplicação',
            'Devolução de Recurso (FNDE/Estado)',
            'Repasse / Crédito',
            'Doação/Recursos próprios',
            'Impostos / Tributos',
            'Reembolso / Estorno'
        ];
        return simplifiedCats.some(cat => category?.trim().toUpperCase() === cat.trim().toUpperCase());
    }, [category]);

    const isBankOp = React.useMemo(() => {
        const bankCats = ['Tarifa Bancária', 'Rendimento de Aplicação', 'Aplicação Financeira', 'Resgate de Aplicação', 'Repasse / Crédito'];
        return bankCats.some(cat => category?.trim().toUpperCase() === cat.trim().toUpperCase());
    }, [category]);

    const attachLabel = type === 'Entrada' ? 'Anexar Comprovante de Crédito' : 'Anexar Documentos de Despesa';

    const resetForm = React.useCallback(() => {
        setType('Saída');
        setCategory('Compra de Produtos');
        setDate(new Date().toISOString().split('T')[0] || '');
        setTotalValue('');
        setMainDescription('');
        setSelectedSupplierId('');
        setSelectedSchoolId(user.schoolId || '');
        setSupplierSearch('');
        setSchoolSearch('');
        setProgramSearch('');
        setSelectedProgramId('');
        setStatus(TransactionStatus.PENDENTE);
        setInvoiceDate('');
        setSelectedBankAccountId('');
        setSelectedPaymentMethodId('');
        setDocumentNumber('');
        setAuthNumber('');
        setPaymentDate('');
        setAttachments([]);
        setTechnicalProcess(null);
        setLinkedStatements([]);
        setIsSplitMode(false);
        setSplitItems([]);
        setSingleRubricId('');
        setSingleNature(TransactionNature.CUSTEIO);
        setActiveTab('dados');
        setSelectedContractId('');
    }, [user.schoolId]);

    const fetchLinkedStatement = React.useCallback(async (accId?: string, entryDateStr?: string) => {
        const targetAccId = accId || selectedBankAccountId;
        const targetDate = entryDateStr || paymentDate || date;

        if (!targetAccId || !targetDate) {
            lastFetchRef.current = null;
            setLinkedStatements([]);
            return;
        }

        const currentFetch = { accId: targetAccId, date: targetDate };
        lastFetchRef.current = currentFetch;

        try {
            const parts = targetDate.split('-');
            if (parts.length < 2) return;

            const year = parseInt(parts[0] || '');
            const month = parseInt(parts[1] || '');

            const { data, error } = await supabase
                .from('bank_statement_uploads')
                .select('*')
                .eq('bank_account_id', targetAccId)
                .eq('month', month)
                .eq('year', year);

            if (error) throw error;
            if (lastFetchRef.current === currentFetch) {
                setLinkedStatements(data || []);
            }
        } catch (error) {
            console.error('Erro ao buscar extrato vinculado:', error);
        }
    }, [selectedBankAccountId, paymentDate, date]);

    const fetchLogs = React.useCallback(async () => {
        if (!editingId && !editingBatchId) return;
        try {
            let query = supabase.from('audit_logs').select('*');
            
            if (editingId && editingBatchId) {
                query = query.or(`entry_id.eq.${editingId},details.ilike.%${editingBatchId}%`);
            } else if (editingId) {
                query = query.eq('entry_id', editingId);
            } else if (editingBatchId) {
                query = query.ilike('details', `%${editingBatchId}%`);
            }
            
            const { data, error } = await query.order('timestamp', { ascending: false });
            if (error) {
                const fallback = await supabase.from('audit_logs').select('*').eq('entry_id', editingId || '').order('timestamp', { ascending: false });
                setEntryLogs(fallback.data || []);
            } else {
                setEntryLogs(data || []);
            }
        } catch (error) {
            console.error('Erro ao buscar logs:', error);
        }
    }, [editingId, editingBatchId]);

    const fetchTechnicalProcess = React.useCallback(async () => {
        if (!selectedSchoolId || !selectedProgramId || !date) return;
        try {
            const year = new Date(date).getFullYear();
            const { data, error } = await supabase
                .from('accountability_processes')
                .select('*')
                .eq('school_id', selectedSchoolId)
                .eq('program_id', selectedProgramId)
                .eq('year', year)
                .single();
            if (error && error.code !== 'PGRST116') throw error;
            setTechnicalProcess(data);
        } catch (error) {
            console.error('Erro ao buscar processo técnico:', error);
        }
    }, [selectedSchoolId, selectedProgramId, date]);

    const fetchEntryData = React.useCallback(async () => {
        try {
            if (editingBatchId) {
                const { data: entries, error } = await supabase
                    .from('financial_entries')
                    .select('*, schools(name), programs(name), suppliers(name), bank_accounts(name, agency, account_number)')
                    .eq('batch_id', editingBatchId);

                if (error) throw error;
                if (entries && entries.length > 0) {
                    const first = entries[0];
                    setIsSplitMode(true);
                    setType(first.type === 'Entrada' ? 'Entrada' : 'Saída');
                    setCategory(first.category);
                    setSelectedSchoolId(first.school_id);
                    setSelectedProgramId(first.program_id);
                    setDate(first.date);
                    setStatus(first.status);
                    setInvoiceDate(first.invoice_date || '');
                    setSelectedBankAccountId(first.bank_account_id || '');
                    setSelectedPaymentMethodId(first.payment_method_id || '');
                    setDocumentNumber(first.document_number || '');
                    setAuthNumber(first.auth_number || '');
                    setPaymentDate(first.payment_date || '');
                    setAttachments(first.attachments || []);
                    setSelectedContractId(first.contract_id || '');
                    const descParts = first.description.split(' - ');
                    setMainDescription(descParts[0]);
                    setSplitItems(entries.map((e: any) => ({
                        id: e.id,
                        rubricId: e.rubric_id || '',
                        rubricName: e.rubrics?.name || '',
                        nature: e.nature,
                        value: Math.abs(e.value),
                        description: e.description.split(' - ')[1] || ''
                    })));
                    const total = entries.reduce((acc: number, e: any) => acc + Math.abs(e.value), 0);
                    setTotalValue(total.toString());
                    setAuditInfo({
                        created_by: first.created_by_name,
                        updated_by: first.updated_by_name,
                        created_at: first.created_at
                    });
                    fetchLinkedStatement(first.bank_account_id || undefined, first.payment_date || first.date || undefined);

                    const { data: linkedProc } = await supabase
                        .from('accountability_processes')
                        .select('attachments')
                        .eq('financial_entry_id', entries[0].id)
                        .maybeSingle();
                    if (linkedProc?.attachments?.length) {
                        const entryAtts = first.attachments || [];
                        const entryUrls = new Set(entryAtts.map((a: any) => a.url));
                        const procAtts = linkedProc.attachments
                            .filter((a: any) => !entryUrls.has(a.url))
                            .map((a: any) => ({ ...a, source: 'accountability' }));
                        if (procAtts.length > 0) setAttachments([...entryAtts, ...procAtts]);
                    }
                }
            } else if (editingId) {
                const { data, error } = await supabase
                    .from('financial_entries')
                    .select('*, schools(name), programs(name), suppliers(name), bank_accounts(name, agency, account_number)')
                    .eq('id', editingId)
                    .single();

                if (error) throw error;
                if (data) {
                    setIsSplitMode(false);
                    setType(data.type === 'Entrada' ? 'Entrada' : 'Saída');
                    setCategory(data.category);
                    setSelectedSchoolId(data.school_id);
                    setSelectedProgramId(data.program_id);
                    setDate(data.date);
                    setTotalValue(Math.abs(data.value).toString());
                    setMainDescription(data.description);
                    setSelectedSupplierId(data.supplier_id || '');
                    setStatus(data.status);
                    setInvoiceDate(data.invoice_date || '');
                    setSelectedBankAccountId(data.bank_account_id || '');
                    setSelectedPaymentMethodId(data.payment_method_id || '');
                    setDocumentNumber(data.document_number || '');
                    setAuthNumber(data.auth_number || '');
                    setPaymentDate(data.payment_date || '');
                    setAttachments(data.attachments || []);
                    setSingleRubricId(data.rubric_id || '');
                    setSelectedContractId(data.contract_id || '');
                    setSingleNature(data.nature);
                    setAuditInfo({
                        created_by: data.created_by_name,
                        updated_by: data.updated_by_name,
                        created_at: data.created_at
                    });
                    fetchLinkedStatement(data.bank_account_id || undefined, data.payment_date || data.date || undefined);

                    const { data: linkedProc } = await supabase
                        .from('accountability_processes')
                        .select('attachments')
                        .eq('financial_entry_id', editingId)
                        .maybeSingle();
                    if (linkedProc?.attachments?.length) {
                        const entryAtts = data.attachments || [];
                        const entryUrls = new Set(entryAtts.map((a: any) => a.url));
                        const procAtts = linkedProc.attachments
                            .filter((a: any) => !entryUrls.has(a.url))
                            .map((a: any) => ({ ...a, source: 'accountability' }));
                        if (procAtts.length > 0) setAttachments([...entryAtts, ...procAtts]);
                    }
                }
            }
            fetchLogs();
            fetchTechnicalProcess();
        } catch (error: any) {
            addToast(`Erro ao carregar dados: ${error.message}`, 'error');
        }
    }, [editingId, editingBatchId, fetchLinkedStatement, fetchLogs, fetchTechnicalProcess, addToast]);

    // File handling
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, cat: string) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `entries/${Math.random()}.${fileExt}`;
            
            const { publicUrl } = await uploadFile(file, fileName);
            
            const newAttachment = {
                id: Math.random().toString(),
                name: file.name,
                category: cat,
                url: publicUrl,
                timestamp: new Date().toISOString()
            };
            setAttachments(prev => [...prev, newAttachment]);
            addToast('Upload concluído com sucesso!', 'success');
        } catch (error: any) {
            console.error('Upload error details:', error);
        }
    };

    const removeAttachment = (id: string) => {
        setAttachments(prev => prev.filter(a => a.id !== id));
    };

    // Save handling
    const handleSave = async () => {
        if (!selectedSchoolId || !selectedProgramId || !date || !totalValue || !mainDescription) {
            addToast('Preencha todos os campos obrigatórios.', 'warning');
            return;
        }
        const valNum = parseFloat(totalValue);
        if (isNaN(valNum)) {
            addToast('Valor inválido.', 'warning');
            return;
        }
        if (isSplitMode) {
            const splitTotal = splitItems.reduce((acc, item) => acc + item.value, 0);
            if (Math.abs(splitTotal - valNum) > 0.01) {
                addToast(`A soma dos itens (R$ ${splitTotal.toFixed(2)}) deve ser igual ao valor total (R$ ${valNum.toFixed(2)}).`, 'warning');
                return;
            }
            if (splitItems.some(item => !item.nature || item.value <= 0)) {
                addToast('Todos os itens do rateio devem ter natureza e valor positivo.', 'warning');
                return;
            }
        } else {
            if (!singleNature) {
                addToast('A natureza é obrigatória.', 'warning');
                return;
            }
        }

        try {
            const batchId = editingBatchId || (isSplitMode ? (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16); })) : null);
            let originalData: any = null;
            if (editingId) {
                const { data } = await supabase.from('financial_entries').select('*').eq('id', editingId).single();
                originalData = data;
            }

            if (isSplitMode) {
                if (editingBatchId) {
                    await supabase.from('financial_entries').delete().eq('batch_id', editingBatchId);
                }
                const entriesToSave = splitItems.map(item => ({
                    school_id: selectedSchoolId,
                    program_id: selectedProgramId,
                    date,
                    description: item.description ? `${mainDescription} - ${item.description.toUpperCase()}` : mainDescription,
                    value: item.value * (type === 'Saída' ? -1 : 1),
                    type,
                    status,
                    category,
                    nature: item.nature,
                    rubric_id: item.rubricId || null,
                    supplier_id: selectedSupplierId || null,
                    bank_account_id: selectedBankAccountId || null,
                    payment_method_id: selectedPaymentMethodId || null,
                    invoice_date: invoiceDate || null,
                    document_number: documentNumber || null,
                    auth_number: authNumber || null,
                    payment_date: paymentDate || null,
                    attachments,
                    batch_id: batchId,
                    contract_id: selectedContractId || null,
                    created_by_name: editingBatchId ? undefined : user.name,
                    updated_by_name: user.name
                }));

                const { data: savedEntries, error } = await supabase.from('financial_entries').insert(entriesToSave).select();
                if (error) throw error;
                if (savedEntries && savedEntries.length > 0) {
                    await supabase.from('audit_logs').insert({
                        entry_id: savedEntries[0].id,
                        user_name: user.name,
                        action: editingBatchId ? 'UPDATE' : 'CREATE',
                        details: editingBatchId ? `Edição de lote (rateio) - ID Lote: ${batchId}` : `Criação de lote (rateio) - ID Lote: ${batchId}`
                    }).select();
                }
            } else {
                const payload = {
                    school_id: selectedSchoolId,
                    program_id: selectedProgramId,
                    date,
                    description: mainDescription,
                    value: valNum * (type === 'Saída' ? -1 : 1),
                    type,
                    status,
                    category,
                    nature: singleNature,
                    rubric_id: singleRubricId || null,
                    supplier_id: selectedSupplierId || null,
                    bank_account_id: selectedBankAccountId || null,
                    payment_method_id: selectedPaymentMethodId || null,
                    invoice_date: invoiceDate || null,
                    document_number: documentNumber || null,
                    auth_number: authNumber || null,
                    payment_date: paymentDate || null,
                    attachments,
                    batch_id: null,
                    contract_id: selectedContractId || null,
                    created_by_name: editingId ? undefined : user.name,
                    updated_by_name: user.name
                };

                const { data: savedData, error } = editingId
                    ? await supabase.from('financial_entries').update(payload).eq('id', editingId).select().single()
                    : await supabase.from('financial_entries').insert([payload]).select().single();

                if (error) throw error;
                const savedId = savedData?.id;
                if (savedId) {
                    const changes: any = {};
                    if (editingId && originalData) {
                        const fields = ['description', 'value', 'status', 'date', 'category', 'nature', 'rubric_id', 'supplier_id', 'bank_account_id', 'payment_method_id', 'invoice_date', 'document_number', 'auth_number', 'payment_date'];
                        fields.forEach(f => {
                            if (JSON.stringify(originalData[f]) !== JSON.stringify(payload[f as keyof typeof payload])) {
                                changes[f] = { old: originalData[f], new: (payload as any)[f] };
                            }
                        });
                    }
                    await supabase.from('audit_logs').insert({
                        entry_id: savedId,
                        user_name: user.name,
                        action: editingId ? 'UPDATE' : 'CREATE',
                        changes: editingId ? (Object.keys(changes).length > 0 ? changes : null) : null,
                        details: editingId ? 'Alteração de dados cadastrais' : 'Criação do lançamento'
                    }).select();
                }
            }
            onSave();
            addToast('Lançamento salvo com sucesso!', 'success');
            onClose();
        } catch (err: any) {
            addToast(`Erro ao salvar: ${err.message}`, 'error');
        }
    };

    // Trigger loads
    React.useEffect(() => {
        if (isOpen) {
            if (editingId || editingBatchId) {
                fetchEntryData();
            } else {
                resetForm();
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, editingId, editingBatchId]);

    // Force valid category when type changes
    React.useEffect(() => {
        if (!isOpen) return;
        const validCategories = type === 'Saída' ? EXIT_CATEGORIES : ENTRY_CATEGORIES;
        if (!validCategories.includes(category)) {
            setCategory(validCategories[0] || '');
        }
    }, [type, isOpen, category]);

    // Force Custeio nature for PNAE and Mais Merenda programs, force default empty rubric for PNAE inflow, and reset bank account for PNAE
    React.useEffect(() => {
        if (!isOpen || !selectedProgramId || !programs) return;
        const prog = programs.find((p: any) => p.id === selectedProgramId);
        if (!prog) return;
        const nameUpper = (prog.name || '').toUpperCase().trim();
        const isPnae = nameUpper.includes('PNAE');
        const isMaisMerenda = nameUpper.includes('MAIS MERENDA');

        if (isMaisMerenda || isPnae) {
            setSingleNature(TransactionNature.CUSTEIO);
            setSplitItems(prev => {
                const hasNonCusteio = prev.some(item => item.nature !== TransactionNature.CUSTEIO);
                if (hasNonCusteio) {
                    return prev.map(item => ({ ...item, nature: TransactionNature.CUSTEIO }));
                }
                return prev;
            });
        }

        const hasSchoolSpecificRubrics = allRubrics?.some((r: any) => 
            r.program_id === selectedProgramId && 
            r.school_id === selectedSchoolId
        );

        if (((isPnae && type === 'Entrada') || isMaisMerenda) && !hasSchoolSpecificRubrics) {
            setSingleRubricId('');
            setIsSplitMode(false);
        }

        if (isPnae) {
            setSelectedBankAccountId('');
            if (paymentMethods && paymentMethods.length > 0) {
                const debitCard = paymentMethods.find((pm: any) => {
                    const nameUpper = (pm.name || '').toUpperCase().trim();
                    return nameUpper.includes('DÉBITO') || nameUpper.includes('DEBITO') || nameUpper.includes('CARTÃO DE DÉBITO');
                });
                if (debitCard) {
                    setSelectedPaymentMethodId(debitCard.id);
                }
            }
        }
    }, [selectedProgramId, programs, isOpen, type, paymentMethods, allRubrics, selectedSchoolId]);

    // Contracts loader
    React.useEffect(() => {
        if (!isOpen || !selectedSchoolId || !selectedSupplierId) {
            setSchoolContracts([]);
            return;
        }
        const fetchContracts = async () => {
            const { data } = await supabase
                .from('supplier_contracts')
                .select('*, financial_entries(value)')
                .eq('school_id', selectedSchoolId)
                .eq('supplier_id', selectedSupplierId)
                .eq('status', 'Ativo');

            const processed = (data || []).map((c: any) => {
                const executed_value = (c.financial_entries || []).reduce((acc: number, entry: any) => acc + Math.abs(entry.value), 0);
                return { ...c, executed_value };
            });
            setSchoolContracts(processed);
        };
        fetchContracts();
    }, [selectedSchoolId, selectedSupplierId, isOpen]);

    // Statement automatic loader
    React.useEffect(() => {
        if (isOpen) {
            if (selectedBankAccountId && (paymentDate || date)) {
                fetchLinkedStatement();
            } else {
                setLinkedStatements([]);
            }
        }
    }, [selectedBankAccountId, date, paymentDate, fetchLinkedStatement, isOpen]);

    // Filters logic
    const filteredSchools = React.useMemo(() => {
        if (!schoolSearch) return accessibleSchools;
        const s = schoolSearch.toLowerCase().trim();
        return accessibleSchools.filter(school => 
            school.id === selectedSchoolId || 
            school.name.toLowerCase().includes(s)
        );
    }, [accessibleSchools, schoolSearch, selectedSchoolId]);

    const filteredPrograms = React.useMemo(() => {
        if (!programSearch) return programs;
        const s = programSearch.toLowerCase().trim();
        return programs.filter((prog: any) => 
            prog.id === selectedProgramId || 
            prog.name.toLowerCase().includes(s)
        );
    }, [programs, programSearch, selectedProgramId]);

    const filteredSuppliers = React.useMemo(() => {
        if (!supplierSearch) return suppliers;
        const s = supplierSearch.toLowerCase().trim();
        const sClean = s.replace(/[^\d]/g, '');

        return suppliers.filter((supp: any) => {
            if (supp.id === selectedSupplierId) return true;
            
            const matchName = supp.name?.toLowerCase().includes(s);
            let matchCnpj = false;
            
            if (supp.cnpj) {
                if (supp.cnpj.toLowerCase().includes(s)) {
                    matchCnpj = true;
                } else if (sClean.length > 0) {
                    const cnpjClean = supp.cnpj.replace(/[^\d]/g, '');
                    if (cnpjClean.includes(sClean)) {
                        matchCnpj = true;
                    }
                }
            }
            
            return matchName || matchCnpj;
        });
    }, [suppliers, supplierSearch, selectedSupplierId]);

    return {
        // UI States
        activeTab,
        setActiveTab,
        isUploading,

        // Form States
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
        technicalProcess,
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

        // Computed Lists
        filteredRubrics,
        isSimplified,
        isBankOp,
        attachLabel,
        filteredSchools,
        filteredPrograms,
        filteredSuppliers,

        // Actions
        handleFileUpload,
        removeAttachment,
        handleSave
    };
};
