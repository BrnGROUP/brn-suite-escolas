import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useToast } from '../context/ToastContext';
import { User } from '../types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRubricSettings } from './settings/useRubricSettings';
import { useSupplierSettings } from './settings/useSupplierSettings';
import { useBankSettings } from './settings/useBankSettings';
import { useConfirm } from '../context/ConfirmContext';


export const BRAZIL_STATES = [
    { uf: 'AC', name: 'Acre' }, { uf: 'AL', name: 'Alagoas' }, { uf: 'AP', name: 'Amapá' },
    { uf: 'AM', name: 'Amazonas' }, { uf: 'BA', name: 'Bahia' }, { uf: 'CE', name: 'Ceará' },
    { uf: 'DF', name: 'Distrito Federal' }, { uf: 'ES', name: 'Espírito Santo' }, { uf: 'GO', name: 'Goiás' },
    { uf: 'MA', name: 'Maranhão' }, { uf: 'MT', name: 'Mato Grosso' }, { uf: 'MS', name: 'Mato Grosso do Sul' },
    { uf: 'MG', name: 'Minas Gerais' }, { uf: 'PA', name: 'Pará' }, { uf: 'PB', name: 'Paraíba' },
    { uf: 'PR', name: 'Paraná' }, { uf: 'PE', name: 'Pernambuco' }, { uf: 'PI', name: 'Piauí' },
    { uf: 'RJ', name: 'Rio de Janeiro' }, { uf: 'RN', name: 'Rio Grande do Norte' }, { uf: 'RS', name: 'Rio Grande do Sul' },
    { uf: 'RO', name: 'Rondônia' }, { uf: 'RR', name: 'Roraima' }, { uf: 'SC', name: 'Santa Catarina' },
    { uf: 'SP', name: 'São Paulo' }, { uf: 'SE', name: 'Sergipe' }, { uf: 'TO', name: 'Tocantins' }
];

const DEFAULT_PLANS = [
    {
        id: "bbagil_gestao",
        title: "BBÁgil & Gestão",
        subtitle: "Ferramentas Digitais",
        price_value: "R$ 300",
        price_period: "/mês",
        billing_info: "Valor mensal: R$ 300,00. Valor anual: R$ 3.600,00. O controle absoluto nas suas mãos.",
        features: ["BBÁgil Automático", "Livro Caixa Digital", "Livro Tombo Patrimonial", "Atas de Assembleia", "Planos de Ação"],
        details: "O pacote completo de ferramentas digitais para facilitar a gestão do dia a dia.",
        highlight: false,
        highlight_text: "",
        icon: "auto_awesome",
        order: 1
    },
    {
        id: "combo_full",
        title: "BRN Suite FULL",
        subtitle: "Assessoria + Tecnologia",
        price_value: "R$ 750",
        price_period: "/mês",
        billing_info: "Economia de R$ 150/mês!",
        features: ["Tudo do plano Prestação de Contas", "Tudo do plano BBÁgil & Gestão", "Suporte VIP prioritário"],
        details: "A experiência máxima do BRN Suite.",
        highlight: true,
        highlight_text: "Melhor Custo-Benefício",
        icon: "star",
        order: 2
    },
    {
        id: "prestacao_contas",
        title: "Prestação de Contas",
        subtitle: "Assessoria Especializada",
        price_value: "R$ 600",
        price_period: "/mês",
        billing_info: "Valor mensal: R$ 600,00.",
        features: ["Confecção de Notas e Espelhos", "Consolidação de Documentos", "Ordens de Compra e Serviço"],
        details: "Este é o plano de assessoria especializada.",
        highlight: false,
        highlight_text: "",
        icon: "verified_user",
        order: 3
    }
];

export const useSettings = (user: User) => {
    const queryClient = useQueryClient();
    const { addToast } = useToast();
    const { confirm } = useConfirm();
    const [activeTab, setActiveTab] = useState('profile');


    // Consolidate Rubric, Supplier, and Bank Settings into sub-hooks
    const rubricSettings = useRubricSettings();
    const supplierSettings = useSupplierSettings();
    const bankSettings = useBankSettings();

    // Local states
    const [newProgram, setNewProgram] = useState({ name: '', description: '' });
    const [newPaymentMethod, setNewPaymentMethod] = useState('');
    const [newPeriod, setNewPeriod] = useState({ name: '', is_active: true });

    const [profileData, setProfileData] = useState({ name: user.name, email: user.email || '' });
    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });

    // Queries
    const { data: schools = [] } = useQuery({ queryKey: ['schools'], queryFn: async () => (await supabase.from('schools').select('*').order('name')).data || [] });
    const { data: programs = [] } = useQuery({ queryKey: ['programs'], queryFn: async () => (await supabase.from('programs').select('*').order('name')).data || [] });
    const { data: paymentMethods = [], isLoading: loadingPayments } = useQuery({ queryKey: ['payment_methods'], queryFn: async () => (await supabase.from('payment_methods').select('*').order('name')).data || [] });
    const { data: periods = [], isLoading: loadingPeriods } = useQuery({ queryKey: ['periods'], queryFn: async () => (await supabase.from('periods').select('*').order('name', { ascending: false })).data || [] });
    
    const { data: billingRecords = [], isLoading: loadingBilling } = useQuery({
        queryKey: ['platform_billing', user.schoolId],
        queryFn: async () => {
            let query = supabase.from('platform_billing').select('*, schools(name, plan_id, custom_price, discount_value, address, city, uf, cnpj)').order('reference_month', { ascending: false });

            if (user.role !== 'Administrador' && user.role !== 'Operador') {
                if (user.schoolId) {
                    query = query.eq('school_id', user.schoolId);
                } else {
                    return [];
                }
            }

            return (await query).data || [];
        },
        enabled: ['Administrador', 'Operador', 'Diretor', 'Cliente'].includes(user.role)
    });

    const { data: systemSettings = { contacts: { email: '', phone: '', whatsapp: '', instagram: '', website: '' }, plans: DEFAULT_PLANS, templateUrl: '' } } = useQuery({
        queryKey: ['system_settings'],
        queryFn: async () => {
            const { data } = await supabase.from('system_settings').select('key, value');
            const map: any = {};
            data?.forEach(d => map[d.key] = d.value);
            return {
                contacts: map.support_contacts || { email: '', phone: '', whatsapp: '', instagram: '', website: '' },
                plans: map.landing_page_plans || DEFAULT_PLANS,
                templateUrl: map.import_template_url || ''
            };
        }
    });

    // Derived states (reactive to systemSettings)
    const [localPlans, setLocalPlans] = React.useState<any[]>([]);
    const [localContacts, setLocalContacts] = React.useState<any>({ email: '', phone: '', whatsapp: '', instagram: '', website: '' });

    React.useEffect(() => {
        if (systemSettings) {
            setLocalPlans(systemSettings.plans);
            setLocalContacts(systemSettings.contacts);
        }
    }, [systemSettings]);

    // Program Mutations
    const createProgramMut = useMutation({
        mutationFn: async (payload: any) => {
            const { error } = await supabase.from('programs').insert(payload);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['programs'] });
            queryClient.invalidateQueries({ queryKey: ['aux_data'] });
            queryClient.invalidateQueries({ queryKey: ['reports_aux'] });
            setNewProgram({ name: '', description: '' });
            addToast('Programa criado!', 'success');
        },
        onError: (err: any) => addToast('Erro ao criar programa: ' + err.message, 'error')
    });

    const deleteProgramMut = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('programs').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['programs'] });
            queryClient.invalidateQueries({ queryKey: ['aux_data'] });
            queryClient.invalidateQueries({ queryKey: ['reports_aux'] });
            addToast('Excluído com sucesso!', 'success');
        },
        onError: (err: any) => addToast('Erro ao excluir: ' + (err.message || err.details || 'Verifique se existem registros vinculados.'), 'error')
    });

    // Payment Method Mutations
    const createPaymentMethodMut = useMutation({
        mutationFn: async (payload: { name: string }) => {
            const { error } = await supabase.from('payment_methods').insert(payload);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payment_methods'] });
            queryClient.invalidateQueries({ queryKey: ['aux_data'] });
            queryClient.invalidateQueries({ queryKey: ['reports_aux'] });
            setNewPaymentMethod('');
            addToast('Método de pagamento criado!', 'success');
        },
        onError: (err: any) => addToast('Erro ao criar método de pagamento: ' + err.message, 'error')
    });

    const deletePaymentMethodMut = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('payment_methods').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payment_methods'] });
            queryClient.invalidateQueries({ queryKey: ['aux_data'] });
            queryClient.invalidateQueries({ queryKey: ['reports_aux'] });
            addToast('Excluído com sucesso!', 'success');
        },
        onError: (err: any) => addToast('Erro ao excluir: ' + (err.message || err.details || 'Verifique se existem registros vinculados.'), 'error')
    });

    // Period Mutations
    const createPeriodMut = useMutation({
        mutationFn: async (payload: any) => {
            const { error } = await supabase.from('periods').insert(payload);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['periods'] });
            queryClient.invalidateQueries({ queryKey: ['aux_data'] });
            queryClient.invalidateQueries({ queryKey: ['reports_aux'] });
            setNewPeriod({ name: '', is_active: true });
            addToast('Período criado!', 'success');
        },
        onError: (err: any) => addToast('Erro ao criar período: ' + err.message, 'error')
    });

    const updatePeriodMut = useMutation({
        mutationFn: async ({ id, payload }: { id: string, payload: any }) => {
            const { error } = await supabase.from('periods').update(payload).eq('id', id);
            if (error) throw error;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['periods'] });
            queryClient.invalidateQueries({ queryKey: ['aux_data'] });
            queryClient.invalidateQueries({ queryKey: ['reports_aux'] });
            addToast(`Período ${variables.payload.is_active ? 'ativado' : 'desativado'}!`, 'success');
        },
        onError: (err: any) => addToast('Erro ao atualizar período: ' + err.message, 'error')
    });

    const deletePeriodMut = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('periods').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['periods'] });
            queryClient.invalidateQueries({ queryKey: ['aux_data'] });
            queryClient.invalidateQueries({ queryKey: ['reports_aux'] });
            addToast('Excluído com sucesso!', 'success');
        },
        onError: (err: any) => addToast('Erro ao excluir: ' + (err.message || err.details || 'Verifique se existem registros vinculados.'), 'error')
    });

    // Specific Local Mutations
    const upsertSettingMut = useMutation({
        mutationFn: async ({ key, value }: { key: string, value: any }) => {
            const { error } = await supabase.from('system_settings').upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
            if (error) throw error;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['system_settings'] })
    });

    const updateProfileMut = useMutation({
        mutationFn: async (name: string) => await supabase.from('users').update({ name }).eq('id', user.id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['current_user'] });
            addToast('Perfil atualizado com sucesso!', 'success');
        },
        onError: (err: any) => addToast(err.message, 'error')
    });

    const updateBillingStatusMut = useMutation({
        mutationFn: async ({ id, status, payment_date, payment_method, amount, paid_amount, description, reference_month }: { id: string, status: string, payment_date?: string, payment_method?: string, amount?: number, paid_amount?: number, description?: string, reference_month?: string }) => {
            const payload: any = { status, updated_at: new Date().toISOString() };
            if (payment_date) payload.payment_date = payment_date;
            if (payment_method) payload.payment_method = payment_method;
            if (amount !== undefined) payload.amount = amount;
            if (paid_amount !== undefined) payload.paid_amount = paid_amount;
            if (description !== undefined) payload.description = description;
            if (reference_month !== undefined) payload.reference_month = reference_month;

            const { error } = await supabase.from('platform_billing').update(payload).eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['platform_billing'] });
            addToast('Registro de faturamento atualizado!', 'success');
        },
        onError: (err: any) => addToast('Erro ao atualizar faturamento: ' + err.message, 'error')
    });

    const createBillingRecordMut = useMutation({
        mutationFn: async (payload: { school_id: string, reference_month: string, amount: number, description: string, status: string }) => {
            const { error } = await supabase.from('platform_billing').insert({ ...payload, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['platform_billing'] });
            addToast('Cobrança adicional criada!', 'success');
        },
        onError: (err: any) => addToast('Erro ao criar cobrança: ' + err.message, 'error')
    });

    const generateBillingMut = useMutation({
        mutationFn: async (month: string) => {
            const { data: schoolsWithPlan } = await supabase.from('schools').select('id, plan_id, custom_price, discount_value').not('plan_id', 'is', null);
            if (!schoolsWithPlan || schoolsWithPlan.length === 0) return;

            const { data: existingRecords } = await supabase
                .from('platform_billing')
                .select('school_id')
                .eq('reference_month', month)
                .ilike('description', 'Mensalidade');

            const existingSchoolIds = new Set(existingRecords?.map(r => r.school_id) || []);

            const recordsToInsert = schoolsWithPlan
                .filter(s => !existingSchoolIds.has(s.id))
                .map(s => {
                    const plan = localPlans.find(p => p.id === s.plan_id);
                    const basePriceStr = s.custom_price || (plan?.price_value || '0');
                    const basePrice = parseFloat(basePriceStr.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
                    const discount = s.discount_value || 0;
                    const finalAmount = Math.max(0, basePrice - discount);

                    return {
                        school_id: s.id,
                        reference_month: month,
                        amount: finalAmount,
                        description: 'Mensalidade',
                        status: 'Pendente',
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    };
                });

            if (recordsToInsert.length === 0) return;

            const { error } = await supabase.from('platform_billing').insert(recordsToInsert);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['platform_billing'] });
            addToast('Cobranças geradas com sucesso!', 'success');
        },
        onError: (err: any) => addToast('Erro ao gerar cobranças: ' + err.message, 'error')
    });

    // Handlers
    const handleCreateProgram = () => newProgram.name && createProgramMut.mutate(newProgram);
    const handleDeleteProgram = async (id: string) => {
        try {
            // Verificar vínculos
            const [entriesRes, contractsRes, rubricsRes, bankAccountsRes, balancesRes] = await Promise.all([
                supabase.from('financial_entries').select('id').eq('program_id', id),
                supabase.from('supplier_contracts').select('id').eq('program_id', id),
                supabase.from('rubrics').select('id').eq('program_id', id),
                supabase.from('bank_accounts').select('id').eq('program_id', id),
                supabase.from('reprogrammed_balances').select('id').eq('program_id', id)
            ]);

            const relations: string[] = [];
            const entriesCount = entriesRes.data?.length || 0;
            const contractsCount = contractsRes.data?.length || 0;
            const rubricsCount = rubricsRes.data?.length || 0;
            const bankAccountsCount = bankAccountsRes.data?.length || 0;
            const balancesCount = balancesRes.data?.length || 0;

            if (entriesCount > 0) relations.push(`- ${entriesCount} Lançamento(s) Financeiro(s)`);
            if (contractsCount > 0) relations.push(`- ${contractsCount} Contrato(s) de Fornecedor`);
            if (rubricsCount > 0) relations.push(`- ${rubricsCount} Rúbrica(s)`);
            if (bankAccountsCount > 0) relations.push(`- ${bankAccountsCount} Conta(s) Bancária(s)`);
            if (balancesCount > 0) relations.push(`- ${balancesCount} Saldo(s) Reprogramado(s)`);

            if (relations.length > 0) {
                await confirm({
                    title: 'Não é possível excluir o programa',
                    message: `Este programa não pode ser excluído porque possui os seguintes registros vinculados:\n\n${relations.join('\n')}\n\nPor favor, desvincule ou exclua estes registros antes de tentar excluir o programa novamente.`,
                    confirmText: 'Entendido',
                    cancelText: 'Voltar',
                    isDestructive: false
                });
                return;
            }

            if (await confirm({
                title: 'Excluir Programa',
                message: 'Deseja realmente excluir este programa? Esta ação não pode ser desfeita.',
                isDestructive: true
            })) {
                deleteProgramMut.mutate(id);
            }
        } catch (err: any) {
            addToast('Erro ao verificar vínculos do programa: ' + err.message, 'error');
        }
    };

    const handleCreatePaymentMethod = () => newPaymentMethod && createPaymentMethodMut.mutate({ name: newPaymentMethod });
    const handleDeletePaymentMethod = async (id: string) => {
        if (await confirm({
            title: 'Excluir Método de Pagamento',
            message: 'Deseja realmente excluir este método de pagamento? Esta ação não pode ser desfeita.',
            isDestructive: true
        })) {
            deletePaymentMethodMut.mutate(id);
        }
    };

    const handleCreatePeriod = () => newPeriod.name && createPeriodMut.mutate(newPeriod);
    const handleTogglePeriod = (id: string, current: boolean) => updatePeriodMut.mutate({ id, payload: { is_active: !current } });
    const handleDeletePeriod = async (id: string) => {
        if (await confirm({
            title: 'Excluir Período',
            message: 'Deseja realmente excluir este período? Esta ação não pode ser desfeita.',
            isDestructive: true
        })) {
            deletePeriodMut.mutate(id);
        }
    };

    const handleUpdateProfile = () => profileData.name.trim() && updateProfileMut.mutate(profileData.name.trim());

    const handleChangePassword = async () => {
        if (passwords.new !== passwords.confirm) return addToast('Senhas não conferem', 'warning');
        if (!passwords.new) return;

        const { error } = await supabase.auth.updateUser({ password: passwords.new });
        if (error) addToast(error.message, 'error');
        else { addToast('Senha alterada com sucesso!', 'success'); setPasswords({ current: '', new: '', confirm: '' }); }
    };

    const handleSaveContacts = () => upsertSettingMut.mutate({ key: 'support_contacts', value: localContacts }, { onSuccess: () => addToast('Contatos salvos!', 'success') });
    const handleSavePlans = () => upsertSettingMut.mutate({ key: 'landing_page_plans', value: localPlans }, { onSuccess: () => addToast('Planos salvos!', 'success') });

    const handleTemplateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const fileName = `templates/model_${Date.now()}.${file.name.split('.').pop()}`;
            await supabase.storage.from('attachments').upload(fileName, file);
            const { data: { publicUrl } } = supabase.storage.from('attachments').getPublicUrl(fileName);
            upsertSettingMut.mutate({ key: 'import_template_url', value: publicUrl }, { onSuccess: () => addToast('Modelo atualizado!', 'success') });
        } catch (err: any) { addToast(err.message, 'error'); }
    };

    return {
        activeTab, setActiveTab,
        schools, programs,
        cities: supplierSettings.cities,
        loadingCities: supplierSettings.loadingCities,
        
        // Rubric settings delegator
        rubrics: rubricSettings.rubrics,
        newRubric: rubricSettings.newRubric,
        setNewRubric: rubricSettings.setNewRubric,
        editingRubricId: rubricSettings.editingRubricId,
        setEditingRubricId: rubricSettings.setEditingRubricId,
        rubricSearch: rubricSettings.rubricSearch,
        setRubricSearch: rubricSettings.setRubricSearch,
        rubricFilterProgram: rubricSettings.rubricFilterProgram,
        setRubricFilterProgram: rubricSettings.setRubricFilterProgram,
        rubricFilterSchool: rubricSettings.rubricFilterSchool,
        setRubricFilterSchool: rubricSettings.setRubricFilterSchool,
        handleSaveRubric: rubricSettings.handleSaveRubric,
        handleEditRubric: rubricSettings.handleEditRubric,
        handleDeleteRubric: rubricSettings.handleDeleteRubric,
        
        newProgram, setNewProgram,
        handleCreateProgram,
        handleDeleteProgram,
        
        // Supplier settings delegator
        suppliers: supplierSettings.suppliers,
        newSupplier: supplierSettings.newSupplier,
        setNewSupplier: supplierSettings.setNewSupplier,
        editingSupplierId: supplierSettings.editingSupplierId,
        setEditingSupplierId: supplierSettings.setEditingSupplierId,
        isUploadingStamp: supplierSettings.isUploadingStamp,
        handleCreateSupplier: supplierSettings.handleCreateSupplier,
        handleEditSupplier: supplierSettings.handleEditSupplier,
        handleDeleteSupplier: supplierSettings.handleDeleteSupplier,
        handleStampUpload: supplierSettings.handleStampUpload,
        fetchCities: supplierSettings.fetchCities,
        
        // Bank settings delegator
        bankAccounts: bankSettings.bankAccounts,
        newBank: bankSettings.newBank,
        setNewBank: bankSettings.setNewBank,
        editingBankId: bankSettings.editingBankId,
        setEditingBankId: bankSettings.setEditingBankId,
        bankSearch: bankSettings.bankSearch,
        setBankSearch: bankSettings.setBankSearch,
        bankFilterProgram: bankSettings.bankFilterProgram,
        setBankFilterProgram: bankSettings.setBankFilterProgram,
        bankFilterSchool: bankSettings.bankFilterSchool,
        setBankFilterSchool: bankSettings.setBankFilterSchool,
        handleCreateBank: bankSettings.handleCreateBank,
        handleEditBank: bankSettings.handleEditBank,
        handleDeleteBank: bankSettings.handleDeleteBank,
        
        paymentMethods, newPaymentMethod, setNewPaymentMethod,
        handleCreatePaymentMethod,
        handleDeletePaymentMethod,
        periods, newPeriod, setNewPeriod, isSavingPeriod: createPeriodMut.isPending,
        handleCreatePeriod,
        handleTogglePeriod,
        handleDeletePeriod,
        profileData, setProfileData, updatingProfile: updateProfileMut.isPending, passwords, setPasswords,
        handleUpdateProfile,
        handleChangePassword,
        updatingPassword: false,
        supportContacts: localContacts, setSupportContacts: setLocalContacts, loadingContacts: false, savingContacts: upsertSettingMut.isPending,
        handleSaveContacts,
        plans: localPlans, setPlans: setLocalPlans, loadingPlans: false, savingPlans: upsertSettingMut.isPending,
        handleSavePlans,
        billingRecords, loadingBilling,
        handleUpdateBilling: updateBillingStatusMut.mutate,
        handleCreateBilling: createBillingRecordMut.mutate,
        handleGenerateBilling: generateBillingMut.mutate,
        templateUrl: systemSettings.templateUrl, loadingAssets: false, isUploadingTemplate: false,
        handleTemplateUpload,
        loading: rubricSettings.loadingRubrics || supplierSettings.loadingSuppliers || bankSettings.loadingBanks || loadingPayments || loadingPeriods || loadingBilling,
        fetchAuxOptions: () => { },
        fetchRubricData: () => { },
        fetchSupplierData: () => { },
        fetchBankData: () => { },
        fetchPaymentData: () => { },
        fetchPeriodData: () => { },
        fetchSupportContacts: () => { },
        fetchPlans: () => { },
        fetchAssets: () => { },
        
        updatePlanField: (i: number, f: string, v: any) => { const p = [...localPlans]; p[i] = { ...p[i], [f]: v }; setLocalPlans(p); },
        handleAddFeature: (pi: number) => { const p = [...localPlans]; if (!p[pi].features) p[pi].features = []; p[pi].features.push(""); setLocalPlans(p); },
        handleRemoveFeature: (pi: number, fi: number) => { const p = [...localPlans]; p[pi].features = p[pi].features.filter((_: any, i: number) => i !== fi); setLocalPlans(p); },
        handleUpdateFeature: (pi: number, fi: number, v: string) => { const p = [...localPlans]; p[pi].features[fi] = v; setLocalPlans(p); },
        handleAddPlan: () => {
            const newPlan = {
                id: `custom_${Date.now()}`,
                title: 'Novo Plano',
                subtitle: 'Personalizado',
                price_value: '0',
                price_period: '/mês',
                billing_info: '',
                features: [],
                details: '',
                highlight: false,
                highlight_text: '',
                icon: 'auto_awesome',
                order: localPlans.length + 1
            };
            setLocalPlans([...localPlans, newPlan]);
        }
    };
};
