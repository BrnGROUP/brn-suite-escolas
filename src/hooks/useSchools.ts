import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { User, School, UserRole, ContractSignature } from '../types';
import { useAccessibleSchools } from './usePermissions';
import { useToast } from '../context/ToastContext';
import { compressImage } from '../lib/imageUtils';

export interface UseSchoolsProps {
  user: User;
}

export const useSchools = ({ user }: UseSchoolsProps) => {
  const [schools, setSchools] = useState<School[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [gees, setGees] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [viewingContract, setViewingContract] = useState<{ school: School; directorUser: User; signature: ContractSignature } | null>(null);
  const [isFetchingContract, setIsFetchingContract] = useState(false);
  const [availablePlans, setAvailablePlans] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [teachingModalities, setTeachingModalities] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    inep: '',
    seec: '',
    conselho_escolar: '',
    cnpj: '',
    phone: '',
    director: '',
    secretary: '',
    address: '',
    city: '',
    uf: '',
    cep: '',
    image_url: '',
    gee: '',
    gee_id: '',
    plan_id: '',
    custom_price: '',
    custom_title: '',
    discount_value: 0,
    director_cpf: '',
    director_rg: '',
    director_address: '',
    custom_description: '',
    active: true,
    notes: '',
    teaching_modality: '',
    ata_conselho_url: '',
    cardapio_url: '',
    ficha_tecnica_url: ''
  });

  const { addToast } = useToast();

  const accessibleSchools = useAccessibleSchools(user, schools);

  const displayedSchools = useMemo(() => {
    if (!searchTerm) return accessibleSchools;
    const lowerSearch = searchTerm.trim().toLowerCase();
    const cleanSearch = lowerSearch.replace(/\D/g, '');

    return accessibleSchools.filter((school) => {
      const matchName = school.name?.toLowerCase().includes(lowerSearch);
      const matchDirector = school.director?.toLowerCase().includes(lowerSearch);
      const matchCity = school.city?.toLowerCase().includes(lowerSearch);
      const matchGee = school.gee?.toLowerCase().includes(lowerSearch);
      const matchInep = school.inep?.includes(lowerSearch);
      const matchCnpj = cleanSearch !== '' && school.cnpj?.replace(/\D/g, '').includes(cleanSearch);

      return matchName || matchDirector || matchCity || matchGee || matchInep || matchCnpj;
    });
  }, [accessibleSchools, searchTerm]);

  useEffect(() => {
    fetchSchools();
    fetchGEEs();
    fetchPlans();
    fetchTeachingModalities();
  }, []);

  useEffect(() => {
    if (formData.uf) {
      fetchCities(formData.uf);
    } else {
      setCities([]);
    }
  }, [formData.uf]);

  const fetchPlans = async () => {
    const { data } = await supabase.from('system_settings').select('value').eq('key', 'landing_page_plans').maybeSingle();
    if (data?.value) setAvailablePlans(data.value);
  };

  const fetchTeachingModalities = async () => {
    const { data } = await supabase
      .from('teaching_modalities')
      .select('name')
      .order('name');
    if (data) setTeachingModalities(data.map(d => d.name));
  };

  const fetchGEEs = async () => {
    const { data } = await supabase.from('gee').select('id, name').order('name');
    if (data) setGees(data);
  };

  const fetchSchools = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('schools')
      .select('*')
      .order('name');

    if (data) setSchools(data);
    if (error) console.error('Error fetching schools:', error);
    setLoading(false);
  };

  const fetchCities = async (uf: string) => {
    setIsLoadingCities(true);
    try {
      const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`);
      const data = await response.json();
      setCities(data.map((c: any) => c.nome).sort());
    } catch (error) {
      console.error('Error fetching cities:', error);
    } finally {
      setIsLoadingCities(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      name: '',
      inep: '',
      seec: '',
      conselho_escolar: '',
      cnpj: '',
      phone: '',
      director: '',
      secretary: '',
      address: '',
      city: '',
      uf: '',
      cep: '',
      image_url: '',
      gee: '',
      gee_id: '',
      plan_id: '',
      custom_price: '',
      custom_title: '',
      discount_value: 0,
      director_cpf: '',
      director_rg: '',
      director_address: '',
      custom_description: '',
      active: true,
      notes: '',
      teaching_modality: '',
      ata_conselho_url: '',
      cardapio_url: '',
      ficha_tecnica_url: ''
    });
  };

  const handleEdit = (school: School) => {
    setEditingId(school.id);
    setFormData({
      name: school.name,
      inep: school.inep || '',
      seec: school.seec || '',
      conselho_escolar: school.conselho_escolar || '',
      cnpj: school.cnpj || '',
      phone: school.phone || '',
      director: school.director || '',
      secretary: school.secretary || '',
      address: school.address || '',
      city: school.city || '',
      uf: school.uf || '',
      cep: school.cep || '',
      image_url: school.image_url || '',
      gee: school.gee || '',
      gee_id: school.gee_id || '',
      plan_id: school.plan_id || '',
      custom_price: school.custom_price || '',
      custom_title: school.custom_title || '',
      discount_value: school.discount_value || 0,
      director_cpf: school.director_cpf || '',
      director_rg: school.director_rg || '',
      director_address: school.director_address || '',
      custom_description: school.custom_description || '',
      active: school.active !== undefined ? school.active : true,
      notes: school.notes || '',
      teaching_modality: school.teaching_modality || '',
      ata_conselho_url: school.ata_conselho_url || '',
      cardapio_url: school.cardapio_url || '',
      ficha_tecnica_url: school.ficha_tecnica_url || ''
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.name) {
      addToast('O nome da escola é obrigatório.', 'warning');
      return;
    }

    setLoading(true);
    try {
      if (editingId) {
        const { error } = await supabase
          .from('schools')
          .update(formData)
          .eq('id', editingId);
        if (error) throw error;
        addToast('Escola atualizada com sucesso', 'success');
      } else {
        const { error } = await supabase
          .from('schools')
          .insert([formData]);
        if (error) throw error;
        addToast('Escola cadastrada com sucesso', 'success');
      }

      setShowForm(false);
      resetForm();
      fetchSchools();
    } catch (error: any) {
      addToast(`Erro ao salvar: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('schools')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      addToast('Escola excluída com sucesso', 'success');
      fetchSchools();
    } catch (error: any) {
      addToast(`Erro ao excluir: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleViewContract = async (school: School) => {
    setIsFetchingContract(true);
    try {
      // 1. Buscar o usuário diretor da escola
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('school_id', school.id)
        .eq('role', UserRole.DIRETOR)
        .limit(1)
        .maybeSingle();

      if (userError || !userData) {
        addToast('Não foi possível localizar o cadastro do diretor vinculado a esta escola.', 'warning');
        return;
      }

      // 2. Buscar a assinatura do contrato deste diretor
      const { data: sigData, error: sigError } = await supabase
        .from('contract_signatures')
        .select('*')
        .eq('user_id', userData.id)
        .order('signed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (sigError || !sigData) {
        addToast('Este diretor ainda não assinou o contrato digital.', 'info');
        return;
      }

      setViewingContract({
        school,
        directorUser: userData,
        signature: sigData
      });
    } catch (error: any) {
      addToast('Erro ao carregar contrato: ' + error.message, 'error');
    } finally {
      setIsFetchingContract(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'ata' | 'cardapio' | 'ficha') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `schools/${type}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('attachments')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('attachments')
        .getPublicUrl(fileName);

      if (type === 'ata') {
        setFormData((prev: any) => ({ ...prev, ata_conselho_url: publicUrl }));
      } else if (type === 'cardapio') {
        setFormData((prev: any) => ({ ...prev, cardapio_url: publicUrl }));
      } else {
        setFormData((prev: any) => ({ ...prev, ficha_tecnica_url: publicUrl }));
      }
      addToast('Arquivo anexado com sucesso!', 'success');
    } catch (error: any) {
      addToast(`Erro no upload: ${error.message}`, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const processedFile = file.type.startsWith('image/') ? await compressImage(file) : file;
      const fileExt = file.name.split('.').pop();
      const fileName = `logos/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('attachments')
        .upload(fileName, processedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('attachments')
        .getPublicUrl(fileName);

      setFormData((prev) => ({ ...prev, image_url: publicUrl }));
    } catch (error: any) {
      addToast(`Erro no upload: ${error.message}`, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  return {
    schools,
    cities,
    gees,
    loading,
    showForm,
    setShowForm,
    editingId,
    isUploading,
    isLoadingCities,
    viewingContract,
    setViewingContract,
    isFetchingContract,
    availablePlans,
    searchTerm,
    setSearchTerm,
    formData,
    setFormData,
    resetForm,
    handleEdit,
    handleSave,
    handleDelete,
    handleViewContract,
    handleImageUpload,
    handleFileUpload,
    displayedSchools,
    teachingModalities
  };
};
