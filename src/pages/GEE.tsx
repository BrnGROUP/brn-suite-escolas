
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { User, UserRole } from '../types';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';

interface GEE {
    id: string;
    name: string;
    description: string;
    created_at: string;
}

const GEEPage: React.FC<{ user: User }> = ({ user }) => {
    const [gees, setGees] = useState<GEE[]>([]);
    const { addToast } = useToast();
    const { confirm } = useConfirm();
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingGee, setEditingGee] = useState<GEE | null>(null);
    const [formData, setFormData] = useState({ name: '', description: '' });

    useEffect(() => {
        fetchGEEs();
    }, []);

    const fetchGEEs = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('gee')
            .select('*')
            .order('name');

        if (data) setGees(data);
        if (error) console.error('Error fetching GEEs:', error);
        setLoading(false);
    };

    const handleSave = async () => {
        if (!formData.name) {
            addToast('O nome da GEE é obrigatório.', 'warning');
            return;
        }

        setLoading(true);
        try {
            if (editingGee) {
                const { error } = await supabase
                    .from('gee')
                    .update(formData)
                    .eq('id', editingGee.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('gee')
                    .insert([formData]);
                if (error) throw error;
            }

            setShowForm(false);
            setEditingGee(null);
            setFormData({ name: '', description: '' });
            fetchGEEs();
        } catch (error: any) {
            addToast(`Erro ao salvar: ${error.message}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (gee: GEE) => {
        setEditingGee(gee);
        setFormData({ name: gee.name, description: gee.description || '' });
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!await confirm({
            title: 'Excluir Regional (GEE)',
            message: 'Tem certeza? Isso pode afetar o vínculo de técnicos e escolas. Esta ação não poderá ser desfeita.',
            isDestructive: true
        })) return;

        setLoading(true);
        const { error } = await supabase.from('gee').delete().eq('id', id);
        if (error) addToast(error.message, 'error');
        else fetchGEEs();
        setLoading(false);
    };

    const isManager = user.role === UserRole.ADMIN || user.role === UserRole.OPERADOR;

    if (!isManager) return <div className="p-8 text-white">Acesso negado.</div>;

    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white">
                    Regionais (GEE)
                    <span className="text-sm font-normal text-slate-400 block">Gerências Executivas de Educação</span>
                </h1>
                <button
                    onClick={() => { setEditingGee(null); setFormData({ name: '', description: '' }); setShowForm(true); }}
                    className="bg-primary hover:bg-primary-hover text-white px-6 py-2 rounded-lg font-bold shadow-lg flex items-center gap-2"
                >
                    <span className="material-symbols-outlined">add</span> Nova GEE
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {gees.map(gee => (
                    <div key={gee.id} className="bg-surface-dark border border-surface-border rounded-2xl p-6 shadow-xl relative group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                <span className="material-symbols-outlined">map</span>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEdit(gee)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors">
                                    <span className="material-symbols-outlined text-sm">edit</span>
                                </button>
                                <button onClick={() => handleDelete(gee.id)} className="p-2 hover:bg-rose-500/10 rounded-lg text-slate-400 hover:text-rose-500 transition-colors">
                                    <span className="material-symbols-outlined text-sm">delete</span>
                                </button>
                            </div>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1 uppercase">{gee.name}</h3>
                        <p className="text-sm text-slate-400 leading-relaxed line-clamp-2">{gee.description || 'Sem descrição.'}</p>
                    </div>
                ))}
            </div>

            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-lg bg-[#0f172a] border border-surface-border rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in">
                        <div className="p-8 border-b border-surface-border flex justify-between items-center bg-[#1e293b]">
                            <h3 className="text-xl font-bold text-white">{editingGee ? 'Editar GEE' : 'Nova GEE'}</h3>
                            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white"><span className="material-symbols-outlined">close</span></button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Nome da GEE</label>
                                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value.toUpperCase() })} className="w-full bg-[#1e293b] border border-slate-700 rounded-xl text-white p-4 focus:border-primary outline-none" placeholder="Ex: GEE METROPOLITANA SUL" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Descrição / Abrangência</label>
                                <textarea rows={4} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full bg-[#1e293b] border border-slate-700 rounded-xl text-white p-4 focus:border-primary outline-none" placeholder="Quais cidades ou bairros esta GEE atende?" />
                            </div>
                            <button onClick={handleSave} disabled={loading} className="w-full bg-primary hover:bg-primary-hover text-white py-4 rounded-2xl font-bold shadow-xl shadow-primary/20 transition-all">{loading ? 'Salvando...' : 'Confirmar Cadastro'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GEEPage;
