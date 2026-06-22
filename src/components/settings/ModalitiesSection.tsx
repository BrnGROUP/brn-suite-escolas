import React from 'react';

interface ModalitiesSectionProps {
    modalities: any[];
    newModality: any;
    setNewModality: (data: any) => void;
    editingModalityId: string | null;
    setEditingModalityId: (id: string | null) => void;
    handleSaveModality: () => void;
    handleEditModality: (m: any) => void;
    handleDeleteModality: (id: string) => void;
    loading: boolean;
    isSaving: boolean;
}

const ModalitiesSection: React.FC<ModalitiesSectionProps> = ({
    modalities,
    newModality,
    setNewModality,
    editingModalityId,
    setEditingModalityId,
    handleSaveModality,
    handleEditModality,
    handleDeleteModality,
    loading,
    isSaving
}) => {
    return (
        <div className="flex flex-col gap-8 animate-in fade-in">
            <div className="flex items-center gap-4 border-b border-surface-border pb-4">
                <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                    <span className="material-symbols-outlined text-3xl">school</span>
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white uppercase tracking-wider">Modalidades de Ensino</h3>
                    <p className="text-slate-400 text-sm italic">Defina as modalidades atendidas pelas escolas (ex: Integral 9h, EJA).</p>
                </div>
            </div>

            <div className="bg-[#111a22] p-6 rounded-2xl border border-surface-border flex flex-col gap-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                        <label htmlFor="modality_name" className="text-xs text-slate-400 font-bold uppercase mb-1 block">
                            {editingModalityId ? 'Editar Nome da Modalidade' : 'Nova Modalidade'}
                        </label>
                        <input
                            id="modality_name"
                            type="text"
                            value={newModality.name}
                            onChange={e => setNewModality({ name: e.target.value })}
                            placeholder="Ex: Integral 9h, EJA, Parcial..."
                            className="w-full bg-surface-dark border border-surface-border rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none transition-all"
                        />
                    </div>
                    <div className="flex items-end gap-2">
                        <button
                            onClick={handleSaveModality}
                            disabled={isSaving}
                            className="flex-1 h-[46px] bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50 text-sm"
                        >
                            {isSaving ? 'Salvando...' : editingModalityId ? 'Salvar' : 'Adicionar'}
                        </button>
                        {editingModalityId && (
                            <button
                                onClick={() => {
                                    setNewModality({ name: '' });
                                    setEditingModalityId(null);
                                }}
                                className="h-[46px] px-4 bg-white/5 hover:bg-white/10 text-slate-300 font-bold rounded-xl transition-all text-sm"
                            >
                                Cancelar
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    {modalities.map((m: any) => (
                        <div key={m.id} className="bg-surface-dark border border-surface-border rounded-2xl p-4 flex items-center justify-between group hover:border-blue-500/50 transition-all">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-slate-500 text-lg">school</span>
                                <span className="font-bold text-white">{m.name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => handleEditModality(m)}
                                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition-opacity opacity-0 group-hover:opacity-100 animate-in fade-in"
                                    title="Editar"
                                >
                                    <span className="material-symbols-outlined text-[18px]">edit</span>
                                </button>
                                <button
                                    onClick={() => handleDeleteModality(m.id)}
                                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-500/10 text-slate-500 hover:text-red-500 transition-opacity opacity-0 group-hover:opacity-100 animate-in fade-in"
                                    title="Excluir"
                                >
                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                </button>
                            </div>
                        </div>
                    ))}
                    {modalities.length === 0 && !loading && (
                        <div className="md:col-span-2 text-center py-8 text-slate-500 italic border border-dashed border-slate-700 rounded-2xl">
                            Nenhuma modalidade cadastrada.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ModalitiesSection;
