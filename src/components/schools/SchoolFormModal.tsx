import React, { useEffect, useRef } from 'react';
import { School } from '../../types';
import { formatCNPJ, formatPhone, formatCPFCNPJ } from '../../lib/formatUtils';

interface SchoolFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingId: string | null;
  formData: {
    name: string;
    inep: string;
    seec: string;
    conselho_escolar: string;
    cnpj: string;
    phone: string;
    director: string;
    secretary: string;
    address: string;
    city: string;
    uf: string;
    cep: string;
    image_url: string;
    gee: string;
    gee_id: string;
    plan_id: string;
    custom_price: string;
    custom_title: string;
    discount_value: number;
    director_cpf: string;
    director_rg: string;
    director_address: string;
    custom_description: string;
    active: boolean;
    notes: string;
    teaching_modality: string;
    ata_conselho_url: string;
    cardapio_url: string;
  };
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  gees: { id: string; name: string }[];
  availablePlans: any[];
  cities: string[];
  isLoadingCities: boolean;
  isUploading: boolean;
  loading: boolean;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>, type: 'ata' | 'cardapio') => Promise<void>;
  onSave: () => Promise<void>;
}

export const SchoolFormModal: React.FC<SchoolFormModalProps> = ({
  isOpen,
  onClose,
  editingId,
  formData,
  setFormData,
  gees,
  availablePlans,
  cities,
  isLoadingCities,
  isUploading,
  loading,
  onImageUpload,
  onFileUpload,
  onSave,
}) => {
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus trap: focus first field on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        firstInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="w-full md:max-w-2xl h-full bg-[#0f172a] border-l border-surface-border flex flex-col shadow-2xl animate-in slide-in-from-right">
        {/* Header */}
        <div className="p-6 border-b border-surface-border flex justify-between items-center bg-[#1e293b]">
          <h3 id="modal-title" className="text-xl font-bold text-white">
            {editingId ? 'Editar Escola' : 'Nova Escola'}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
            aria-label="Fechar formulário"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {/* Logo Upload */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative group">
              {formData.image_url ? (
                <img
                  src={formData.image_url}
                  alt="Logo da Escola"
                  className="w-32 h-32 rounded-3xl object-cover border-4 border-slate-700 shadow-xl"
                />
              ) : (
                <div className="w-32 h-32 rounded-3xl bg-slate-800 flex items-center justify-center border-4 border-slate-700 border-dashed">
                  <span className="material-symbols-outlined text-4xl text-slate-600">add_a_photo</span>
                </div>
              )}
              <input
                type="file"
                onChange={onImageUpload}
                className="hidden"
                id="logo-input"
                accept="image/*"
              />
              <label
                htmlFor="logo-input"
                className="absolute inset-0 cursor-pointer flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl text-white font-bold text-xs uppercase"
              >
                Alterar Logo
              </label>
              {isUploading && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-3xl">
                  <span className="material-symbols-outlined animate-spin text-white">sync</span>
                </div>
              )}
            </div>
            <span className="text-[10px] text-slate-500 font-bold uppercase">Logotipo da Instituição</span>
          </div>

          {/* School Status Toggle */}
          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 flex items-center justify-between">
            <div>
              <p className="text-white font-bold text-sm">Status da Escola</p>
              <p className="text-[10px] text-slate-500 uppercase font-bold">Ativar ou desativar acesso da unidade</p>
            </div>
            <label htmlFor="school-active" className="relative inline-flex items-center cursor-pointer">
              <input
                id="school-active"
                type="checkbox"
                checked={formData.active}
                onChange={(e) => setFormData((prev: any) => ({ ...prev, active: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              <span className="sr-only">Status da Escola</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* School Name */}
            <div className="md:col-span-2">
              <label htmlFor="school-name" className="text-xs font-bold text-slate-400 uppercase mb-1 block">
                Nome da Instituição (Escola)
              </label>
              <input
                ref={firstInputRef}
                id="school-name"
                type="text"
                aria-label="Nome da Instituição (Escola)"
                placeholder="Ex: ESCOLA ESTADUAL..."
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev: any) => ({ ...prev, name: e.target.value.toUpperCase() }))
                }
                className="w-full bg-[#1e293b] border border-slate-700 rounded-lg text-white p-3 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all"
              />
            </div>

            {/* CNPJ */}
            <div>
              <label htmlFor="school-cnpj" className="text-xs font-bold text-slate-400 uppercase mb-1 block">
                CNPJ
              </label>
              <input
                id="school-cnpj"
                type="text"
                aria-label="CNPJ"
                value={formData.cnpj}
                onChange={(e) => setFormData((prev: any) => ({ ...prev, cnpj: formatCNPJ(e.target.value) }))}
                className="w-full bg-[#1e293b] border border-slate-700 rounded-lg text-white p-3 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                placeholder="00.000.000/0001-00"
                maxLength={18}
              />
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="school-phone" className="text-xs font-bold text-slate-400 uppercase mb-1 block">
                Telefone
              </label>
              <input
                id="school-phone"
                type="text"
                aria-label="Telefone"
                value={formData.phone}
                onChange={(e) => setFormData((prev: any) => ({ ...prev, phone: formatPhone(e.target.value) }))}
                className="w-full bg-[#1e293b] border border-slate-700 rounded-lg text-white p-3 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                placeholder="(00) 0 0000-0000"
                maxLength={16}
              />
            </div>

            {/* INEP */}
            <div>
              <label htmlFor="school-inep" className="text-xs font-bold text-slate-400 uppercase mb-1 block">
                Código INEP
              </label>
              <input
                id="school-inep"
                type="text"
                aria-label="Código INEP"
                placeholder="00000000"
                value={formData.inep}
                onChange={(e) => setFormData((prev: any) => ({ ...prev, inep: e.target.value }))}
                className="w-full bg-[#1e293b] border border-slate-700 rounded-lg text-white p-3 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all"
              />
            </div>

            {/* SEEC */}
            <div>
              <label htmlFor="school-seec" className="text-xs font-bold text-slate-400 uppercase mb-1 block">
                Código SEEC
              </label>
              <input
                id="school-seec"
                type="text"
                aria-label="Código SEEC"
                placeholder="000"
                value={formData.seec}
                onChange={(e) => setFormData((prev: any) => ({ ...prev, seec: e.target.value }))}
                className="w-full bg-[#1e293b] border border-slate-700 rounded-lg text-white p-3 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all"
              />
            </div>

            {/* GEE Regional */}
            <div className="md:col-span-2">
              <label htmlFor="school_gee_id" className="text-xs font-bold text-slate-400 uppercase mb-1 block">
                Regional (GEE)
              </label>
              <select
                title="Regional (GEE)"
                aria-label="Regional (GEE)"
                id="school_gee_id"
                value={formData.gee_id}
                onChange={(e) => {
                  const selected = gees.find((g) => g.id === e.target.value);
                  setFormData((prev: any) => ({
                    ...prev,
                    gee_id: e.target.value,
                    gee: selected ? selected.name : '',
                  }));
                }}
                className="w-full bg-[#1e293b] border border-slate-700 rounded-lg text-white p-3 focus:border-primary outline-none"
              >
                <option value="">Selecione uma regional...</option>
                {gees.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-1">
                Vincule esta escola a uma Gerência Executiva para gestão de técnicos.
              </p>
            </div>

            {/* Plan contract */}
            <div className="md:col-span-2">
              <label htmlFor="school_plan_id" className="text-xs font-bold text-slate-400 uppercase mb-1 block">
                Plano Contratado
              </label>
              <select
                title="Plano Contratado"
                aria-label="Plano Contratado"
                id="school_plan_id"
                value={formData.plan_id}
                onChange={(e) => setFormData((prev: any) => ({ ...prev, plan_id: e.target.value }))}
                className="w-full bg-[#1e293b] border border-slate-700 rounded-lg text-white p-3 focus:border-primary outline-none font-bold"
              >
                <option value="">Selecione o plano...</option>
                {availablePlans.map((plan) => {
                  const rawPrice = plan.price_value || plan.price || '0';
                  const cleanPrice =
                    typeof rawPrice === 'string'
                      ? Number(rawPrice.replace(/[^\d,.]/g, '').replace(',', '.'))
                      : Number(rawPrice);

                  return (
                    <option key={plan.id} value={plan.id}>
                      {plan.title} ({new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cleanPrice)})
                    </option>
                  );
                })}
                <option value="custom" className="text-emerald-500 font-bold">
                  ✨ PLANO PERSONALIZADO (CRIAR AGORA)
                </option>
              </select>
              <p className="text-xs text-emerald-500/60 mt-1 font-medium">
                {formData.plan_id === 'custom'
                  ? 'Você está criando um plano do zero. Preencha os campos abaixo.'
                  : 'Os itens deste plano serão descritos automaticamente no contrato digital.'}
              </p>
            </div>

            {/* Custom Plan Specifics */}
            {formData.plan_id && (
              <div
                className={`md:col-span-2 p-4 border rounded-2xl space-y-4 ${
                  formData.plan_id === 'custom'
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-slate-500/5 border-slate-700/30'
                }`}
              >
                <div className="flex items-center gap-2 text-emerald-500 font-bold text-[10px] uppercase">
                  <span className="material-symbols-outlined text-sm">settings_suggest</span>
                  {formData.plan_id === 'custom' ? 'Configurar Plano Personalizado' : 'Personalizar para esta Escola'}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={formData.plan_id === 'custom' ? '' : 'md:col-span-2'}>
                    <label htmlFor="custom-title" className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">
                      {formData.plan_id === 'custom' ? 'Título do Plano (Obrigatório)' : 'Título Customizado (Opcional)'}
                    </label>
                    <input
                      id="custom-title"
                      type="text"
                      placeholder={formData.plan_id === 'custom' ? 'Ex: Pacote Premium' : 'Ex: Pacote Especial Escolas'}
                      value={formData.custom_title}
                      onChange={(e) => setFormData((prev: any) => ({ ...prev, custom_title: e.target.value }))}
                      className="w-full bg-[#0f172a] border border-slate-800 rounded-lg text-white p-2 text-sm outline-none focus:border-emerald-500/50"
                    />
                  </div>

                  {formData.plan_id === 'custom' && (
                    <div>
                      <label htmlFor="custom-price" className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">
                        Preço Mensal (Obrigatório)
                      </label>
                      <input
                        id="custom-price"
                        type="text"
                        placeholder="Ex: R$ 450"
                        value={formData.custom_price}
                        onChange={(e) => setFormData((prev: any) => ({ ...prev, custom_price: e.target.value }))}
                        className="w-full bg-[#0f172a] border border-slate-800 rounded-lg text-white p-2 text-sm outline-none focus:border-emerald-500/50"
                      />
                    </div>
                  )}

                  {formData.plan_id === 'custom' && (
                    <div className="md:col-span-2">
                      <label htmlFor="custom-description" className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">
                        Descrição Adicional do Plano (Opcional)
                      </label>
                      <textarea
                        id="custom-description"
                        rows={3}
                        placeholder="Descreva os detalhes específicos deste plano personalizado..."
                        value={formData.custom_description}
                        onChange={(e) => setFormData((prev: any) => ({ ...prev, custom_description: e.target.value }))}
                        className="w-full bg-[#0f172a] border border-slate-800 rounded-lg text-white p-2 text-sm outline-none focus:border-emerald-500/50 resize-none"
                      />
                    </div>
                  )}

                  <div className="md:col-span-2">
                    <label htmlFor="discount-value" className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">
                      Valor do Desconto Mensal (R$)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 font-bold text-xs">R$</span>
                      <input
                        id="discount-value"
                        type="number"
                        placeholder="0"
                        value={formData.discount_value}
                        onChange={(e) => setFormData((prev: any) => ({ ...prev, discount_value: Number(e.target.value) }))}
                        className="w-full bg-[#0f172a] border border-slate-800 rounded-lg text-white p-2 pl-9 text-sm outline-none focus:border-emerald-500/50"
                      />
                    </div>
                    <p className="text-[9px] text-slate-500 mt-1 italic">Este valor será subtraído do preço final exibido no contrato.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Modalidades de Ensino */}
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">
                Modalidades de Ensino
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-[#1e293b] border border-slate-700 rounded-lg p-4">
                {['Integral 9h', 'Integral 7h', 'Parcial', 'EJA'].map((mod) => {
                  const selected = (formData.teaching_modality || '').split(', ').includes(mod);
                  return (
                    <label key={mod} className="flex items-center gap-2 text-xs text-white cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={(e) => {
                          const current = (formData.teaching_modality || '').split(', ').filter(Boolean);
                          let updated;
                          if (e.target.checked) {
                            updated = [...current, mod];
                          } else {
                            updated = current.filter((c) => c !== mod);
                          }
                          setFormData((prev: any) => ({ ...prev, teaching_modality: updated.join(', ') }));
                        }}
                        className="rounded border-slate-700 bg-slate-800 text-primary focus:ring-primary/20 w-4 h-4 cursor-pointer"
                      />
                      {mod}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Conselho Escolar */}
            <div className="md:col-span-2">
              <label htmlFor="conselho-escolar" className="text-xs font-bold text-slate-400 uppercase mb-1 block">
                Conselho Escolar
              </label>
              <input
                id="conselho-escolar"
                type="text"
                aria-label="Conselho Escolar"
                value={formData.conselho_escolar}
                onChange={(e) =>
                  setFormData((prev: any) => ({ ...prev, conselho_escolar: e.target.value.toUpperCase() }))
                }
                className="w-full bg-[#1e293b] border border-slate-700 rounded-lg text-white p-3 focus:border-primary outline-none"
                placeholder="Nome do conselho..."
              />
            </div>

            {/* Director */}
            <div className="md:col-span-2">
              <label htmlFor="school-director" className="text-xs font-bold text-slate-400 uppercase mb-1 block">
                Diretor(a) / Presidente
              </label>
              <input
                id="school-director"
                type="text"
                aria-label="Diretor(a)"
                placeholder="Nome completo do diretor"
                value={formData.director}
                onChange={(e) =>
                  setFormData((prev: any) => ({ ...prev, director: e.target.value.toUpperCase() }))
                }
                className="w-full bg-[#1e293b] border border-slate-700 rounded-lg text-white p-3 focus:border-primary outline-none"
                title="Nome do Diretor"
              />
            </div>

            {/* Director Details Section */}
            <div className="md:col-span-2 p-4 bg-primary/5 border border-primary/10 rounded-2xl space-y-4">
              <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase">
                <span className="material-symbols-outlined text-sm">badge</span>
                Dados do Representante Legal (Presidente)
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="dir-cpf" className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">
                    CPF do Diretor
                  </label>
                  <input
                    id="dir-cpf"
                    type="text"
                    placeholder="000.000.000-00"
                    value={formData.director_cpf}
                    onChange={(e) =>
                      setFormData((prev: any) => ({ ...prev, director_cpf: formatCPFCNPJ(e.target.value) }))
                    }
                    className="w-full bg-[#0f172a] border border-slate-800 rounded-lg text-white p-2 text-sm outline-none focus:border-primary/50"
                    maxLength={14}
                  />
                </div>
                <div>
                  <label htmlFor="dir-rg" className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">
                    RG do Diretor
                  </label>
                  <input
                    id="dir-rg"
                    type="text"
                    placeholder="0.000.000"
                    value={formData.director_rg}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, director_rg: e.target.value }))}
                    className="w-full bg-[#0f172a] border border-slate-800 rounded-lg text-white p-2 text-sm outline-none focus:border-primary/50"
                  />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="dir-addr" className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">
                    Endereço Residencial
                  </label>
                  <input
                    id="dir-addr"
                    type="text"
                    placeholder="Rua, nº, Bairro, Cidade..."
                    value={formData.director_address}
                    onChange={(e) =>
                      setFormData((prev: any) => ({ ...prev, director_address: e.target.value.toUpperCase() }))
                    }
                    className="w-full bg-[#0f172a] border border-slate-800 rounded-lg text-white p-2 text-sm outline-none focus:border-primary/50"
                  />
                </div>
              </div>
            </div>

            {/* Documentos e Anexos */}
            <div className="md:col-span-2 p-4 bg-slate-800/40 border border-slate-700/50 rounded-2xl space-y-4">
              <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase">
                <span className="material-symbols-outlined text-sm">folder_open</span>
                Documentos e Anexos da Unidade
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Ata do Conselho */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">
                    Ata do Conselho Escolar
                  </label>
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      type="file"
                      id="ata-conselho-input"
                      accept=".pdf,image/*"
                      onChange={(e) => onFileUpload(e, 'ata')}
                      className="hidden"
                    />
                    <label
                      htmlFor="ata-conselho-input"
                      className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 select-none"
                    >
                      <span className="material-symbols-outlined text-sm">upload_file</span>
                      {formData.ata_conselho_url ? 'Alterar Ata' : 'Anexar Ata'}
                    </label>
                    {formData.ata_conselho_url && (
                      <a
                        href={formData.ata_conselho_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-xs flex items-center gap-1 font-bold"
                      >
                        <span className="material-symbols-outlined text-sm">open_in_new</span>
                        Visualizar
                      </a>
                    )}
                  </div>
                </div>

                {/* Cardápio Escolar */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">
                    Cardápio Escolar
                  </label>
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      type="file"
                      id="cardapio-input"
                      accept=".pdf,image/*"
                      onChange={(e) => onFileUpload(e, 'cardapio')}
                      className="hidden"
                    />
                    <label
                      htmlFor="cardapio-input"
                      className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 select-none"
                    >
                      <span className="material-symbols-outlined text-sm">upload_file</span>
                      {formData.cardapio_url ? 'Alterar Cardápio' : 'Anexar Cardápio'}
                    </label>
                    {formData.cardapio_url && (
                      <a
                        href={formData.cardapio_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-xs flex items-center gap-1 font-bold"
                      >
                        <span className="material-symbols-outlined text-sm">open_in_new</span>
                        Visualizar
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Secretary */}
            <div className="md:col-span-2">
              <label htmlFor="school-secretary" className="text-xs font-bold text-slate-400 uppercase mb-1 block">
                Secretário(a) do Conselho
              </label>
              <input
                id="school-secretary"
                type="text"
                aria-label="Secretário(a) do Conselho"
                placeholder="Nome do secretário"
                value={formData.secretary}
                onChange={(e) =>
                  setFormData((prev: any) => ({ ...prev, secretary: e.target.value.toUpperCase() }))
                }
                className="w-full bg-[#1e293b] border border-slate-700 rounded-lg text-white p-3 focus:border-primary outline-none"
                title="Nome do Secretário"
              />
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label htmlFor="school-address" className="text-xs font-bold text-slate-400 uppercase mb-1 block">
                Logradouro / Endereço
              </label>
              <input
                id="school-address"
                type="text"
                aria-label="Logradouro / Endereço"
                placeholder="Endereço, Nº, Bairro"
                value={formData.address}
                onChange={(e) =>
                  setFormData((prev: any) => ({ ...prev, address: e.target.value.toUpperCase() }))
                }
                className="w-full bg-[#1e293b] border border-slate-700 rounded-lg text-white p-3 focus:border-primary outline-none"
              />
            </div>

            {/* CEP */}
            <div>
              <label htmlFor="school_cep" className="text-xs font-bold text-slate-400 uppercase mb-1 block">
                CEP
              </label>
              <input
                id="school_cep"
                type="text"
                placeholder="00000-000"
                value={formData.cep || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  const clean = val.replace(/\D/g, '');
                  let formatted = clean;
                  if (clean.length > 5) {
                    formatted = `${clean.substring(0, 5)}-${clean.substring(5, 8)}`;
                  }
                  setFormData((prev: any) => ({ ...prev, cep: formatted.substring(0, 9) }));
                }}
                className="w-full bg-[#1e293b] border border-slate-700 rounded-lg text-white p-3 focus:border-primary outline-none"
              />
            </div>

            {/* UF */}
            <div>
              <label htmlFor="school_uf" className="text-xs font-bold text-slate-400 uppercase mb-1 block">
                UF
              </label>
              <select
                title="UF"
                aria-label="UF"
                id="school_uf"
                value={formData.uf}
                onChange={(e) => setFormData((prev: any) => ({ ...prev, uf: e.target.value, city: '' }))}
                className="w-full bg-[#1e293b] border border-slate-700 rounded-lg text-white p-3 focus:border-primary outline-none"
              >
                <option value="">Selecione...</option>
                {[
                  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
                  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
                ].map((uf) => (
                  <option key={uf} value={uf}>
                    {uf}
                  </option>
                ))}
              </select>
            </div>

            {/* City */}
            <div className="md:col-span-2">
              <label htmlFor="school_city" className="text-xs font-bold text-slate-400 uppercase mb-1 block">
                Cidade
              </label>
              <select
                title="Cidade"
                aria-label="Cidade"
                id="school_city"
                disabled={!formData.uf || isLoadingCities}
                value={formData.city}
                onChange={(e) => setFormData((prev: any) => ({ ...prev, city: e.target.value }))}
                className="w-full bg-[#1e293b] border border-slate-700 rounded-lg text-white p-3 focus:border-primary outline-none disabled:opacity-50"
              >
                <option value="">{isLoadingCities ? 'Carregando...' : 'Selecione...'}</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <label htmlFor="school-notes" className="text-xs font-bold text-slate-400 uppercase mb-1 block">
                Observações Gerais
              </label>
              <textarea
                id="school-notes"
                rows={3}
                placeholder="Alguma observação importante sobre esta escola..."
                value={formData.notes}
                onChange={(e) => setFormData((prev: any) => ({ ...prev, notes: e.target.value }))}
                className="w-full bg-[#1e293b] border border-slate-700 rounded-lg text-white p-3 focus:border-primary outline-none resize-none"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 md:p-8 border-t border-surface-border flex gap-4 bg-[#1e293b]/50">
          <button
            onClick={onClose}
            className="flex-1 py-3 text-slate-400 font-bold hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            disabled={loading}
            className="flex-[2] bg-primary hover:bg-primary-hover text-white py-3 rounded-xl font-bold shadow-lg shadow-primary/20 disabled:opacity-50 transition-all active:scale-95"
          >
            {loading ? 'Salvando...' : 'Salvar Instituição'}
          </button>
        </div>
      </div>
    </div>
  );
};
