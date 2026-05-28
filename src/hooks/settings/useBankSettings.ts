import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';

export const useBankSettings = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const { confirm } = useConfirm();

  const [newBank, setNewBank] = useState({
    name: '',
    bank_name: '',
    agency: '',
    account_number: '',
    school_id: '',
    program_id: '',
  });
  const [editingBankId, setEditingBankId] = useState<string | null>(null);
  const [bankSearch, setBankSearch] = useState('');
  const [bankFilterProgram, setBankFilterProgram] = useState('');
  const [bankFilterSchool, setBankFilterSchool] = useState('');

  // Queries
  const { data: bankAccounts = [], isLoading: loadingBanks } = useQuery({
    queryKey: ['bank_accounts'],
    queryFn: async () =>
      (
        await supabase
          .from('bank_accounts')
          .select('*, schools(name), programs(name)')
          .order('name')
      ).data || [],
  });

  const { data: schools = [] } = useQuery({
    queryKey: ['schools'],
    queryFn: async () => (await supabase.from('schools').select('*').order('name')).data || [],
  });

  const { data: programs = [] } = useQuery({
    queryKey: ['programs'],
    queryFn: async () => (await supabase.from('programs').select('*').order('name')).data || [],
  });

  // Mutations
  const saveBankMut = useMutation({
    mutationFn: async (payload: any) => {
      if (editingBankId) {
        const { error } = await supabase
          .from('bank_accounts')
          .update(payload)
          .eq('id', editingBankId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('bank_accounts').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank_accounts'] });
      queryClient.invalidateQueries({ queryKey: ['aux_data'] });
      queryClient.invalidateQueries({ queryKey: ['reports_aux'] });
      setNewBank({
        name: '',
        bank_name: '',
        agency: '',
        account_number: '',
        school_id: '',
        program_id: '',
      });
      setEditingBankId(null);
      addToast(
        editingBankId ? 'Conta bancária atualizada!' : 'Conta bancária criada!',
        'success'
      );
    },
    onError: (err: any) => addToast('Erro ao salvar conta bancária: ' + err.message, 'error'),
  });

  const deleteBankMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('bank_accounts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank_accounts'] });
      queryClient.invalidateQueries({ queryKey: ['aux_data'] });
      queryClient.invalidateQueries({ queryKey: ['reports_aux'] });
      addToast('Conta bancária excluída!', 'success');
    },
    onError: (err: any) => addToast('Erro ao excluir conta bancária: ' + err.message, 'error'),
  });

  // Handlers
  const handleCreateBank = () => {
    if (!newBank.name || !newBank.bank_name) {
      return addToast('Campos obrigatórios', 'warning');
    }
    saveBankMut.mutate({
      ...newBank,
      school_id: newBank.school_id || null,
      program_id: newBank.program_id || null,
    });
  };

  const handleEditBank = (b: any) => {
    setNewBank({
      name: b.name || '',
      bank_name: b.bank_name || '',
      agency: b.agency || '',
      account_number: b.account_number || '',
      school_id: b.school_id || '',
      program_id: b.program_id || '',
    });
    setEditingBankId(b.id);
  };

  const handleDeleteBank = async (id: string) => {
    if (await confirm({
      title: 'Excluir Conta Bancária',
      message: 'Deseja realmente excluir esta conta bancária? Esta ação não pode ser desfeita e pode afetar lançamentos vinculados.',
      isDestructive: true
    })) {
      deleteBankMut.mutate(id);
    }
  };

  return {
    bankAccounts,
    schools,
    programs,
    newBank,
    setNewBank,
    editingBankId,
    setEditingBankId,
    bankSearch,
    setBankSearch,
    bankFilterProgram,
    setBankFilterProgram,
    bankFilterSchool,
    setBankFilterSchool,
    loadingBanks,
    handleCreateBank,
    handleEditBank,
    handleDeleteBank,
    isSaving: saveBankMut.isPending,
  };
};
