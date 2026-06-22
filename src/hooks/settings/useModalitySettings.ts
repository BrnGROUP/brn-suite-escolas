import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';

export const useModalitySettings = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const { confirm } = useConfirm();

  const [newModality, setNewModality] = useState({ name: '' });
  const [editingModalityId, setEditingModalityId] = useState<string | null>(null);

  // Queries
  const { data: modalities = [], isLoading: loadingModalities } = useQuery({
    queryKey: ['teaching_modalities'],
    queryFn: async () =>
      (await supabase.from('teaching_modalities').select('*').order('name')).data || [],
  });

  // Mutations
  const saveModalityMut = useMutation({
    mutationFn: async (payload: { name: string }) => {
      const cleanName = payload.name.trim();
      if (!cleanName) throw new Error('O nome da modalidade não pode ser vazio.');

      if (editingModalityId) {
        // 1. Get old name
        const { data: oldMod, error: fetchErr } = await supabase
          .from('teaching_modalities')
          .select('name')
          .eq('id', editingModalityId)
          .single();

        if (fetchErr) throw fetchErr;
        const oldName = oldMod?.name;

        // 2. Update modality name
        const { error: updateErr } = await supabase
          .from('teaching_modalities')
          .update({ name: cleanName })
          .eq('id', editingModalityId);

        if (updateErr) throw updateErr;

        // 3. Update schools with the old name
        if (oldName && oldName !== cleanName) {
          const { data: affectedSchools } = await supabase
            .from('schools')
            .select('id, teaching_modality')
            .ilike('teaching_modality', `%${oldName}%`);

          if (affectedSchools && affectedSchools.length > 0) {
            for (const school of affectedSchools) {
              if (!school.teaching_modality) continue;
              const parts = school.teaching_modality.split(', ').map((p: string) => p.trim());
              const index = parts.indexOf(oldName);
              if (index !== -1) {
                parts[index] = cleanName;
                const updatedStr = parts.filter(Boolean).join(', ');
                await supabase
                  .from('schools')
                  .update({ teaching_modality: updatedStr })
                  .eq('id', school.id);
              }
            }
          }
        }
      } else {
        // Create new modality
        const { error: insertErr } = await supabase
          .from('teaching_modalities')
          .insert({ name: cleanName });

        if (insertErr) throw insertErr;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teaching_modalities'] });
      queryClient.invalidateQueries({ queryKey: ['schools'] });
      setNewModality({ name: '' });
      setEditingModalityId(null);
      addToast(editingModalityId ? 'Modalidade atualizada!' : 'Modalidade criada!', 'success');
    },
    onError: (err: any) => addToast('Erro ao salvar modalidade: ' + err.message, 'error'),
  });

  const deleteModalityMut = useMutation({
    mutationFn: async (id: string) => {
      // 1. Get old name
      const { data: oldMod, error: fetchErr } = await supabase
        .from('teaching_modalities')
        .select('name')
        .eq('id', id)
        .single();

      if (fetchErr) throw fetchErr;
      const oldName = oldMod?.name;

      // 2. Delete modality
      const { error: deleteErr } = await supabase
        .from('teaching_modalities')
        .delete()
        .eq('id', id);

      if (deleteErr) throw deleteErr;

      // 3. Remove from schools
      if (oldName) {
        const { data: affectedSchools } = await supabase
          .from('schools')
          .select('id, teaching_modality')
          .ilike('teaching_modality', `%${oldName}%`);

        if (affectedSchools && affectedSchools.length > 0) {
          for (const school of affectedSchools) {
            if (!school.teaching_modality) continue;
            const parts = school.teaching_modality.split(', ').map((p: string) => p.trim());
            const updatedParts = parts.filter((p: string) => p !== oldName);
            const updatedStr = updatedParts.join(', ');
            await supabase
              .from('schools')
              .update({ teaching_modality: updatedStr })
              .eq('id', school.id);
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teaching_modalities'] });
      queryClient.invalidateQueries({ queryKey: ['schools'] });
      addToast('Modalidade excluída!', 'success');
    },
    onError: (err: any) => addToast('Erro ao excluir modalidade: ' + err.message, 'error'),
  });

  // Handlers
  const handleSaveModality = () => {
    if (!newModality.name.trim()) {
      return addToast('Digite o nome da modalidade', 'warning');
    }
    saveModalityMut.mutate(newModality);
  };

  const handleEditModality = (m: any) => {
    setNewModality({ name: m.name });
    setEditingModalityId(m.id);
  };

  const handleDeleteModality = async (id: string) => {
    if (await confirm({
      title: 'Excluir Modalidade',
      message: 'Deseja realmente excluir esta modalidade? Esta ação não pode ser desfeita e removerá a modalidade correspondente de todas as escolas vinculadas.',
      isDestructive: true
    })) {
      deleteModalityMut.mutate(id);
    }
  };

  return {
    modalities,
    newModality,
    setNewModality,
    editingModalityId,
    setEditingModalityId,
    loadingModalities,
    handleSaveModality,
    handleEditModality,
    handleDeleteModality,
    isSaving: saveModalityMut.isPending,
  };
};
