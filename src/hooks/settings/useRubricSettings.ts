import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';

export const useRubricSettings = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const { confirm } = useConfirm();

  const [newRubric, setNewRubric] = useState({
    name: '',
    program_id: '',
    school_id: '',
    default_nature: 'Custeio',
  });
  const [editingRubricId, setEditingRubricId] = useState<string | null>(null);
  const [rubricSearch, setRubricSearch] = useState('');
  const [rubricFilterProgram, setRubricFilterProgram] = useState('');
  const [rubricFilterSchool, setRubricFilterSchool] = useState('');

  // Queries
  const { data: rubrics = [], isLoading: loadingRubrics } = useQuery({
    queryKey: ['rubrics'],
    queryFn: async () =>
      (await supabase.from('rubrics').select('*, programs(name), schools(name)').order('name'))
        .data || [],
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
  const saveRubricMut = useMutation({
    mutationFn: async (payload: any) => {
      if (editingRubricId) {
        const { error } = await supabase
          .from('rubrics')
          .update(payload)
          .eq('id', editingRubricId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('rubrics').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rubrics'] });
      queryClient.invalidateQueries({ queryKey: ['aux_data'] });
      queryClient.invalidateQueries({ queryKey: ['reports_aux'] });
      setNewRubric({ name: '', program_id: '', school_id: '', default_nature: 'Custeio' });
      setEditingRubricId(null);
      addToast(editingRubricId ? 'Rubrica atualizada!' : 'Rubrica criada!', 'success');
    },
    onError: (err: any) => addToast('Erro ao salvar rubrica: ' + err.message, 'error'),
  });

  const deleteRubricMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('rubrics').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rubrics'] });
      queryClient.invalidateQueries({ queryKey: ['aux_data'] });
      queryClient.invalidateQueries({ queryKey: ['reports_aux'] });
      addToast('Rubrica excluída!', 'success');
    },
    onError: (err: any) => addToast('Erro ao excluir rubrica: ' + err.message, 'error'),
  });

  // Handlers
  const handleSaveRubric = () => {
    if (!newRubric.name || !newRubric.program_id) {
      return addToast('Preencha os campos obrigatórios', 'warning');
    }
    saveRubricMut.mutate({ ...newRubric, school_id: newRubric.school_id || null });
  };

  const handleEditRubric = (r: any) => {
    setNewRubric({
      name: r.name,
      program_id: r.program_id,
      school_id: r.school_id || '',
      default_nature: r.default_nature || 'Custeio',
    });
    setEditingRubricId(r.id);
  };

  const handleDeleteRubric = async (id: string) => {
    if (await confirm({
      title: 'Excluir Rubrica',
      message: 'Deseja realmente excluir esta rubrica? Esta ação não pode ser desfeita e pode afetar lançamentos vinculados.',
      isDestructive: true
    })) {
      deleteRubricMut.mutate(id);
    }
  };

  return {
    rubrics,
    schools,
    programs,
    newRubric,
    setNewRubric,
    editingRubricId,
    setEditingRubricId,
    rubricSearch,
    setRubricSearch,
    rubricFilterProgram,
    setRubricFilterProgram,
    rubricFilterSchool,
    setRubricFilterSchool,
    loadingRubrics,
    handleSaveRubric,
    handleEditRubric,
    handleDeleteRubric,
    isSaving: saveRubricMut.isPending,
  };
};
