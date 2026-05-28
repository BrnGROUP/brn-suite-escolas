import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { User, BankTransaction } from '../types';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '../context/ToastContext';
import { generateCSV, generateRelatorioGerencialHTML } from '../lib/reportUtils';
import { autoMatch } from '../lib/reconciliationMatcher';
import { useAuxData } from './useAuxData';
import { useReconciliationFilters } from './useReconciliationFilters';
import { useReconciliationMutations } from './useReconciliationMutations';
import { useReconciliationUpload } from './useReconciliationUpload';

export const useBankReconciliation = (user: User) => {
    const { addToast } = useToast();
    const [transactions, setTransactions] = useState<BankTransaction[]>([]);
    const [dragActive, setDragActive] = useState(false);
    const [isExportingAll, setIsExportingAll] = useState(false);

    // Queries
    const { data: auxData = {
        schools: [],
        bankAccounts: [],
        programs: [],
        rubrics: [],
        suppliers: []
    } } = useAuxData();

    const { schools, bankAccounts, programs, rubrics, suppliers } = auxData;

    // Filters and UI State custom hook
    const filters = useReconciliationFilters(user, bankAccounts);

    const {
        selectedSchoolId,
        setSelectedSchoolId,
        selectedBankAccountId,
        setSelectedBankAccountId,
        filterMonth,
        setFilterMonth,
        uploadType,
        setUploadType,
        showQuickCreate,
        setShowQuickCreate,
        showManualMatch,
        setShowManualMatch,
        showHelp,
        setShowHelp,
        showReport,
        setShowReport,
        showCapaModal,
        setShowCapaModal,
        showHistory,
        setShowHistory,
        showMonthStatus,
        setShowMonthStatus,
        quickCreateBT,
        setQuickCreateBT,
        manualMatchBT,
        setManualMatchBT,
        manualSearch,
        setManualSearch,
        capaForm,
        setCapaForm,
        quickForm,
        setQuickForm
    } = filters;

    // System entries query
    const { data: systemEntries = [], isLoading: isLoadingSystem, refetch: fetchSystemEntries } = useQuery({
        queryKey: ['system_entries', selectedSchoolId, selectedBankAccountId, filterMonth],
        queryFn: async () => {
            if (!selectedSchoolId) return [];

            const parts = filterMonth.split('-').map(Number);
            const year = parts[0] || new Date().getFullYear();
            const month = parts[1] || (new Date().getMonth() + 1);
            const startDate = new Date(year, month - 4, 1).toISOString().split('T')[0];
            const endDate = new Date(year, month, 0).toISOString().split('T')[0];

            let query = supabase.from('financial_entries')
                .select('*')
                .eq('school_id', selectedSchoolId)
                .gte('date', startDate)
                .lte('date', endDate)
                .order('date', { ascending: false })
                .limit(1000);

            if (selectedBankAccountId) {
                query = query.or(`bank_account_id.eq.${selectedBankAccountId},bank_account_id.is.null`);
                query = query.or(`is_reconciled.eq.false,bank_transaction_ref.not.is.null`);
            } else {
                query = query.eq('is_reconciled', false);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data || [];
        },
        enabled: !!selectedSchoolId
    });

    // Fetch upload records for the selected month/year
    const { data: currentUploads = [], isLoading: isLoadingUploads, refetch: refetchUploads } = useQuery({
        queryKey: ['current_uploads', selectedSchoolId, selectedBankAccountId, filterMonth],
        queryFn: async () => {
            if (!selectedSchoolId || !selectedBankAccountId || !filterMonth) return [];
            const parts = filterMonth.split('-').map(Number);
            const year = parts[0] || new Date().getFullYear();
            const month = parts[1] || (new Date().getMonth() + 1);

            const { data, error } = await supabase
                .from('bank_statement_uploads')
                .select('*')
                .eq('school_id', selectedSchoolId)
                .eq('bank_account_id', selectedBankAccountId)
                .eq('month', month)
                .eq('year', year);
            if (error) throw error;
            return data || [];
        },
        enabled: !!selectedSchoolId && !!selectedBankAccountId && !!filterMonth
    });

    // Reactive Matching: autoMatch when transactions or systemEntries change
    useEffect(() => {
        if (transactions.length > 0 && !isLoadingSystem) {
            const matched = autoMatch(transactions, systemEntries);
            const hasChanges = JSON.stringify(matched) !== JSON.stringify(transactions);
            if (hasChanges) {
                setTransactions(matched);
            }
        }
    }, [systemEntries, isLoadingSystem, transactions.length]);

    // Mutations Custom Hook
    const mutations = useReconciliationMutations({
        selectedSchoolId,
        selectedBankAccountId,
        bankAccounts,
        setTransactions,
        setShowQuickCreate,
        setQuickCreateBT,
        setShowManualMatch,
        setManualMatchBT,
        addToast
    });

    const {
        handleConfirmMatch,
        handleReconcileAsInvestment,
        handleUnlink,
        isMatching
    } = mutations;

    // Upload & Statement Processing Custom Hook
    const upload = useReconciliationUpload({
        user,
        selectedSchoolId,
        selectedBankAccountId,
        filterMonth,
        uploadType,
        transactions,
        setTransactions,
        systemEntries,
        bankAccounts,
        rubrics,
        capaForm,
        setCapaForm,
        setShowCapaModal,
        setShowMonthStatus,
        addToast
    });

    const {
        handleFileUpload,
        handleConfirmCapa,
        pendingFile,
        setPendingFile,
        isReimport,
        declareFileExempt
    } = upload;

    // Custom wrappers & extra helpers
    const handleBulkReconcile = async () => {
        await mutations.handleBulkReconcile(transactions);
    };

    const handleQuickCreate = async () => {
        await mutations.handleQuickCreate(quickCreateBT, quickForm);
    };

    const handleQuickCreateStart = (bt: BankTransaction) => {
        const desc = bt.description.toUpperCase();
        const currentAccount = bankAccounts.find((a: any) => a.id === selectedBankAccountId);
        let suggestedProgramId = currentAccount?.program_id || '';
        let suggestedRubricId = '', suggestedNature = 'Custeio';
        const findRubric = (term: string) => rubrics.find((r: any) => r.name.toUpperCase().includes(term));

        let suggestedCategory = 'Compras e Serviços';

        if (bt.extract_type === 'Conta Investimento' || desc.includes('RENDIMENTO') || desc.includes('APLIC') || desc.includes('INVEST')) {
            suggestedCategory = 'Rendimento de Aplicação';
            const r = findRubric('RENDIMENTO') || findRubric('APLICAÇÃO');
            if (r) {
                suggestedRubricId = r.id;
                suggestedProgramId = r.program_id;
                if ((r as any).default_nature) suggestedNature = (r as any).default_nature;
            }
        } else if (desc.includes('TARIFA') || desc.includes('CESTA') || desc.includes('MAN CC') || desc.includes('ENCARGO') || desc.includes('TAXA') || desc.includes('TAR PIX')) {
            suggestedCategory = 'Tarifa Bancária';
            const r = findRubric('TARIFA') || findRubric('SERVIÇO') || findRubric('BANCO');
            if (r) {
                suggestedRubricId = r.id;
                suggestedProgramId = r.program_id;
                if ((r as any).default_nature) suggestedNature = (r as any).default_nature;
            }
        } else if (desc.includes('REPASSE') || desc.includes('CRED OB') || desc.includes('DEPOSITO') || desc.includes('TED') || desc.includes('DOC') || desc.includes('CRED PIX')) {
            if (bt.type === 'C') suggestedCategory = 'Repasse / Crédito';
        }

        setQuickCreateBT(bt);
        setQuickForm({
            program_id: suggestedProgramId,
            rubric_id: suggestedRubricId,
            supplier_id: '',
            category: suggestedCategory,
            description: bt.description,
            nature: suggestedNature as any
        });
        setShowQuickCreate(true);
    };

    const handleExportAllReconciled = async (format: 'pdf' | 'csv') => {
        if (!selectedSchoolId) {
            addToast('Selecione uma escola para exportar o relatório.', 'warning');
            return;
        }

        setIsExportingAll(true);
        try {
            let query = supabase.from('financial_entries')
                .select('*')
                .eq('school_id', selectedSchoolId)
                .eq('is_reconciled', true)
                .order('date', { ascending: false });

            if (selectedBankAccountId) {
                query = query.eq('bank_account_id', selectedBankAccountId);
            }

            const { data, error } = await query;
            if (error) throw error;

            if (!data || data.length === 0) {
                addToast('Nenhum lançamento conciliado encontrado para exportar.', 'warning');
                setIsExportingAll(false);
                return;
            }

            const mapped = data.map(e => ({
                ...e,
                school: schools.find((s: any) => s.id === e.school_id)?.name || 'Sem Escola',
                program: programs.find((p: any) => p.id === e.program_id)?.name || 'Sem Programa',
                rubric: rubrics.find((r: any) => r.id === e.rubric_id)?.name || 'Sem Rubrica',
                supplier: suppliers.find((s: any) => s.id === e.supplier_id)?.name || 'Geral'
            }));

            if (format === 'csv') {
                generateCSV(mapped);
                addToast('Relatório Excel baixado com sucesso.', 'success');
            } else {
                const html = await generateRelatorioGerencialHTML(mapped, {}, {}, [], {
                    showSummary: true,
                    showCharts: false,
                    showStatusBadges: true,
                    showNatureSummary: true,
                    groupReport: 'program',
                    format: 'pdf',
                    reportMode: 'gerencial'
                });
                const w = window.open('', '_blank');
                if (w) {
                    w.document.write(html);
                    w.document.close();
                }
            }
        } catch (e: any) {
            addToast('Erro ao exportar relatório: ' + e.message, 'error');
        } finally {
            setIsExportingAll(false);
        }
    };

    return {
        transactions, setTransactions,
        systemEntries,
        loading: isLoadingSystem,
        isMatching,
        dragActive, setDragActive,
        schools, bankAccounts, programs, rubrics, suppliers,
        selectedSchoolId, setSelectedSchoolId,
        selectedBankAccountId, setSelectedBankAccountId,
        filterMonth, setFilterMonth,
        uploadType, setUploadType,
        showQuickCreate, setShowQuickCreate,
        showManualMatch, setShowManualMatch,
        showHelp, setShowHelp,
        showReport, setShowReport,
        showCapaModal, setShowCapaModal,
        quickCreateBT, setQuickCreateBT,
        manualMatchBT, setManualMatchBT,
        manualSearch, setManualSearch,
        quickForm, setQuickForm,
        capaForm, setCapaForm,
        showHistory, setShowHistory,
        handleFileUpload,
        handleConfirmCapa,
        handleConfirmMatch,
        handleBulkReconcile,
        handleQuickCreateStart,
        handleQuickCreate,
        handleReconcileAsInvestment,
        handleUnlink,
        fetchSystemEntries,
        showMonthStatus,
        setShowMonthStatus,
        handleExportAllReconciled,
        isExportingAll,
        pendingFile,
        setPendingFile,
        isReimport,
        currentUploads,
        isLoadingUploads,
        refetchUploads,
        declareFileExempt
    };
};
