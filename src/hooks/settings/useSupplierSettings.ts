import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import { compressImage } from '../../lib/imageUtils';

export const useSupplierSettings = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const { confirm } = useConfirm();

  const [newSupplier, setNewSupplier] = useState({
    name: '',
    cnpj: '',
    email: '',
    phone: '',
    cep: '',
    address: '',
    city: '',
    uf: '',
    stamp_url: '',
    rep_name: '',
    rep_cpf: '',
    rep_rg: '',
    rep_address: '',
  });
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null);
  const [isUploadingStamp, setIsUploadingStamp] = useState(false);
  const [cities, setCities] = useState<string[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);

  // Queries
  const { data: suppliers = [], isLoading: loadingSuppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => (await supabase.from('suppliers').select('*').order('name')).data || [],
  });

  // Mutations
  const saveSupplierMut = useMutation({
    mutationFn: async (payload: any) => {
      if (editingSupplierId) {
        const { error } = await supabase
          .from('suppliers')
          .update(payload)
          .eq('id', editingSupplierId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('suppliers').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['aux_data'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers_list'] });
      setNewSupplier({
        name: '',
        cnpj: '',
        email: '',
        phone: '',
        cep: '',
        address: '',
        city: '',
        uf: '',
        stamp_url: '',
        rep_name: '',
        rep_cpf: '',
        rep_rg: '',
        rep_address: '',
      });
      setEditingSupplierId(null);
      addToast(
        editingSupplierId ? 'Fornecedor atualizado!' : 'Fornecedor cadastrado!',
        'success'
      );
    },
    onError: (err: any) => addToast('Erro ao salvar fornecedor: ' + err.message, 'error'),
  });

  const deleteSupplierMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('suppliers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['aux_data'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers_list'] });
      addToast('Fornecedor excluído!', 'success');
    },
    onError: (err: any) => addToast('Erro ao excluir fornecedor: ' + err.message, 'error'),
  });

  // Handlers
  const handleCreateSupplier = () => {
    if (!newSupplier.name) return addToast('Nome obrigatório', 'warning');
    if (!newSupplier.cnpj) return addToast('CNPJ obrigatório', 'warning');

    const cleanCNPJ = newSupplier.cnpj.replace(/\D/g, '');
    const cleanName = newSupplier.name.trim().toLowerCase();

    const isDuplicate = suppliers.some((s: any) => {
      if (editingSupplierId && s.id === editingSupplierId) return false;

      const existingCNPJ = (s.cnpj || '').replace(/\D/g, '');
      const existingName = (s.name || '').trim().toLowerCase();

      return existingCNPJ === cleanCNPJ || existingName === cleanName;
    });

    if (isDuplicate) {
      return addToast('Já existe um fornecedor cadastrado com este Nome ou CNPJ.', 'error');
    }

    saveSupplierMut.mutate(newSupplier);
  };

  const handleEditSupplier = (s: any) => {
    setNewSupplier({
      ...s,
      rep_name: s.rep_name || '',
      rep_cpf: s.rep_cpf || '',
      rep_rg: s.rep_rg || '',
      rep_address: s.rep_address || '',
    });
    setEditingSupplierId(s.id);
  };

  const handleDeleteSupplier = async (id: string) => {
    if (await confirm({
      title: 'Excluir Fornecedor',
      message: 'Deseja realmente excluir este fornecedor? Esta ação não pode ser desfeita e pode afetar contratos e cotações vinculados.',
      isDestructive: true
    })) {
      deleteSupplierMut.mutate(id);
    }
  };

  const fetchCities = async (uf: string) => {
    setLoadingCities(true);
    try {
      const res = await fetch(
        `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`
      );
      const data = await res.json();
      setCities(data.map((c: any) => c.nome).sort());
    } catch (err: any) {
      console.error('Erro ao buscar cidades:', err);
    } finally {
      setLoadingCities(false);
    }
  };

  const handleStampUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingStamp(true);
    try {
      const processedFile = file.type.startsWith('image/') ? await compressImage(file) : file;
      const fileName = `stamps/${Date.now()}.${file.name.split('.').pop()}`;
      await supabase.storage.from('attachments').upload(fileName, processedFile);
      const {
        data: { publicUrl },
      } = supabase.storage.from('attachments').getPublicUrl(fileName);
      setNewSupplier((prev) => ({ ...prev, stamp_url: publicUrl }));
      addToast('Carimbo enviado com sucesso!', 'success');
    } catch (err: any) {
      addToast(err.message, 'error');
    } finally {
      setIsUploadingStamp(false);
    }
  };

  return {
    suppliers,
    newSupplier,
    setNewSupplier,
    editingSupplierId,
    setEditingSupplierId,
    isUploadingStamp,
    cities,
    loadingCities,
    loadingSuppliers,
    handleCreateSupplier,
    handleEditSupplier,
    handleDeleteSupplier,
    fetchCities,
    handleStampUpload,
    isSaving: saveSupplierMut.isPending,
  };
};
