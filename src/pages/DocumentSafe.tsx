
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { User, UserRole } from '../types';
import { useAccessibleSchools } from '../hooks/usePermissions';
import { useToast } from '../context/ToastContext';

interface DocumentFile {
    id: string;
    name: string;
    url: string;
    type: string;
    category: string;
    entry_id: string;
    entry_description: string;
    entry_date: string;
    school_id: string; // Added ID for better filtering
    school_name: string;
    program_name: string;
    value: number;
    checklist?: {
        has_signature: boolean;
        has_stamp: boolean;
        is_legible: boolean;
        is_correct_value: boolean;
        is_correct_date: boolean;
        notes: string;
    };
    process_id?: string;
    process_info?: string;
    supplier_name?: string;
}

const DocumentSafe: React.FC<{ user: User }> = ({ user }) => {
    const [documents, setDocuments] = useState<DocumentFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterSearch, setFilterSearch] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterSchool, setFilterSchool] = useState('');
    const [filterProcess, setFilterProcess] = useState('');
    const [filterPeriod, setFilterPeriod] = useState(''); // Format: "MM-YYYY"
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');
    const { addToast } = useToast();
    const [schools, setSchools] = useState<any[]>([]);
    const [selectedDoc, setSelectedDoc] = useState<DocumentFile | null>(null);
    const [showChecklist, setShowChecklist] = useState(false);
    const [isSavingChecklist, setIsSavingChecklist] = useState(false);

    const accessibleSchools = useAccessibleSchools(user, schools);

    // Initial load
    useEffect(() => {
        fetchInitialData();
        fetchDocuments();
    }, [user]); // Re-fetch when user changes to ensure fresh data/permissions

    const fetchInitialData = async () => {
        const { data } = await supabase.from('schools').select('id, name').order('name');
        if (data) setSchools(data);
    };

    const fetchDocuments = async () => {
        setLoading(true);
        try {
            // Fetch entries with attachments
            let query = supabase.from('financial_entries').select(`
                id, date, description, value, attachments, school_id,
                schools(name), programs(name), suppliers(name)
            `).not('attachments', 'is', null);

            if (user.role !== UserRole.ADMIN && user.role !== UserRole.OPERADOR) {
                if (user.schoolId) query = query.eq('school_id', user.schoolId);
                else if (user.assignedSchools?.length) query = query.in('school_id', user.assignedSchools);
            }

            const { data: entries } = await query;

            // Fetch processes with technical attachments
            let procQuery = supabase.from('accountability_processes').select(`
                id, financial_entry_id, school_id, attachments,
                schools(name),
                financial_entries(description, date, value, programs(name), suppliers(name))
            `).not('attachments', 'is', null);

            if (user.role !== UserRole.ADMIN && user.role !== UserRole.OPERADOR) {
                if (user.schoolId) procQuery = procQuery.eq('school_id', user.schoolId);
                else if (user.assignedSchools?.length) procQuery = procQuery.in('school_id', user.assignedSchools);
            }

            const { data: procsWithAtts } = await procQuery;

            // Fetch checklists
            const { data: checklists } = await supabase.from('document_checklists').select('*');

            // Map for quick process lookup
            const { data: allProcs } = await supabase.from('accountability_processes').select('id, financial_entry_id');

            const allDocs: DocumentFile[] = [];

            // Add documents from entries
            (entries as any[])?.forEach(entry => {
                const attachments = Array.isArray(entry.attachments) ? entry.attachments : [];
                const process = allProcs?.find(p => p.financial_entry_id === entry.id);

                attachments.forEach((att: any) => {
                    const checklist = checklists?.find(c => c.attachment_id === att.id);
                    allDocs.push({
                        id: att.id,
                        name: att.name || 'Sem nome',
                        url: att.url,
                        type: att.type,
                        category: att.category || 'Outros',
                        entry_id: entry.id,
                        entry_description: entry.description,
                        entry_date: entry.date,
                        school_id: entry.school_id,
                        school_name: entry.schools?.name || 'Escola não vinculada',
                        program_name: entry.programs?.name || 'Geral',
                        supplier_name: entry.suppliers?.name || 'Sem fornecedor',
                        value: entry.value,
                        process_id: process?.id || entry.id,
                        process_info: process?.id ? entry.description : `[Lançamento] ${entry.description}`,
                        checklist: checklist ? {
                            has_signature: checklist.has_signature,
                            has_stamp: checklist.has_stamp,
                            is_legible: checklist.is_legible,
                            is_correct_value: checklist.is_correct_value,
                            is_correct_date: checklist.is_correct_date,
                            notes: checklist.notes || ''
                        } : undefined
                    });
                });
            });

            // Add technical documents from processes
            (procsWithAtts as any[])?.forEach(proc => {
                const attachments = Array.isArray(proc.attachments) ? proc.attachments : [];
                const entry = proc.financial_entries;

                attachments.forEach((att: any) => {
                    // Avoid duplicates if same ID exists (though usually they are in different tables)
                    if (allDocs.some(d => d.id === att.id)) return;

                    const checklist = checklists?.find(c => c.attachment_id === att.id);
                    allDocs.push({
                        id: att.id,
                        name: att.name || 'Sem nome',
                        url: att.url,
                        type: att.type,
                        category: att.category || 'Outros',
                        entry_id: proc.financial_entry_id,
                        entry_description: entry?.description || 'Processo Técnico',
                        entry_date: entry?.date || new Date().toISOString(),
                        school_id: proc.school_id,
                        school_name: proc.schools?.name || 'Escola não vinculada',
                        program_name: entry?.programs?.name || 'Geral',
                        supplier_name: entry?.suppliers?.name || 'Sem fornecedor',
                        value: entry?.value || 0,
                        process_id: proc.id,
                        process_info: entry?.description || 'Processo Técnico',
                        checklist: checklist ? {
                            has_signature: checklist.has_signature,
                            has_stamp: checklist.has_stamp,
                            is_legible: checklist.is_legible,
                            is_correct_value: checklist.is_correct_value,
                            is_correct_date: checklist.is_correct_date,
                            notes: checklist.notes || ''
                        } : undefined
                    });
                });
            });

            setDocuments(allDocs);
        } catch (error) {
            console.error('Error fetching vault data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveChecklist = async (doc: DocumentFile, checklist: any) => {
        setIsSavingChecklist(true);
        try {
            const { error } = await supabase.from('document_checklists').upsert({
                attachment_id: doc.id,
                entry_id: doc.entry_id,
                ...checklist,
                checked_by: user.id,
                updated_at: new Date().toISOString()
            }, { onConflict: 'attachment_id' });

            if (error) throw error;
            fetchDocuments(); // Refresh list
            setShowChecklist(false);
        } catch (error) {
            addToast('Erro ao salvar conferência: ' + (error as any).message, 'error');
        } finally {
            setIsSavingChecklist(false);
        }
    };

    const filteredDocs = documents.filter(doc => {
        const matchesSearch = !filterSearch ||
            doc.name.toLowerCase().includes(filterSearch.toLowerCase()) ||
            doc.entry_description.toLowerCase().includes(filterSearch.toLowerCase()) ||
            doc.supplier_name?.toLowerCase().includes(filterSearch.toLowerCase());
        
        const matchesCategory = !filterCategory || (
            filterCategory === 'Certidões'
                ? (doc.category === 'Certidões' || doc.category?.startsWith('Certidão'))
                : doc.category === filterCategory
        );
        
        const matchesSchool = !filterSchool || doc.school_id === filterSchool;

        // Process Filter Logic:
        // If a process is selected, only show docs from that process.
        // The process filter dropdown itself is already filtered by the selected school.
        const matchesProcess = !filterProcess || doc.process_id === filterProcess;

        const matchesPeriod = !filterPeriod || (() => {
            const date = new Date(doc.entry_date);
            const period = `${String(date.getUTCMonth() + 1).padStart(2, '0')}-${date.getUTCFullYear()}`;
            return period === filterPeriod;
        })();

        const matchesDateRange = (!filterStartDate || doc.entry_date >= filterStartDate) &&
                                 (!filterEndDate || doc.entry_date <= filterEndDate);

        return matchesSearch && matchesCategory && matchesSchool && matchesProcess && matchesPeriod && matchesDateRange;
    });

    const availablePeriods = React.useMemo(() => {
        const periods = documents.map(doc => {
            const date = new Date(doc.entry_date);
            const m = String(date.getUTCMonth() + 1).padStart(2, '0');
            const y = date.getUTCFullYear();
            return {
                value: `${m}-${y}`,
                label: date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' })
            };
        });

        const seen = new Set();
        return periods.filter(p => {
            if (seen.has(p.value)) return false;
            seen.add(p.value);
            return true;
        }).sort((a, b) => {
            const partsA = a.value.split('-').map(Number);
            const partsB = b.value.split('-').map(Number);
            const am = partsA[0] || 0;
            const ay = partsA[1] || 0;
            const bm = partsB[0] || 0;
            const by = partsB[1] || 0;
            return by - ay || bm - am;
        });
    }, [documents]);

    const stats = {
        total: documents.length,
        checked: documents.filter(d => !!d.checklist).length,
        pending: documents.filter(d => !d.checklist).length
    };

    return (
        <div className="flex flex-col gap-6 animate-in fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col">
                    <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <span className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                            <span className="material-symbols-outlined text-3xl">folder_managed</span>
                        </span>
                        Cofre Digital de Documentos
                    </h1>
                    <p className="text-slate-400 text-sm mt-1 italic">Conferência e checklist para Prestação de Contas.</p>
                </div>
            </div>

            {/* Audit Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-card-dark/40 border border-white/5 p-6 rounded-3xl flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total de Arquivos</span>
                        <span className="material-symbols-outlined text-slate-500">inventory_2</span>
                    </div>
                    <span className="text-3xl font-black text-white">{stats.total}</span>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden mt-2">
                        <div className="h-full bg-slate-500 w-full"></div>
                    </div>
                </div>
                <div className="bg-emerald-500/5 border border-emerald-500/10 p-6 rounded-3xl flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-emerald-500/70 uppercase tracking-widest">Conferidos</span>
                        <span className="material-symbols-outlined text-emerald-500">task_alt</span>
                    </div>
                    <span className="text-3xl font-black text-emerald-400">{stats.checked}</span>
                    <progress
                        value={stats.checked}
                        max={stats.total || 1}
                        className="w-full h-1.5 rounded-full overflow-hidden mt-2 appearance-none [&::-webkit-progress-bar]:bg-emerald-500/10 [&::-webkit-progress-value]:bg-emerald-500 [&::-moz-progress-bar]:bg-emerald-500"
                    />
                </div>
                <div className="bg-amber-500/5 border border-amber-500/10 p-6 rounded-3xl flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-amber-500/70 uppercase tracking-widest">Pendentes</span>
                        <span className="material-symbols-outlined text-amber-500">pending_actions</span>
                    </div>
                    <span className="text-3xl font-black text-amber-400">{stats.pending}</span>
                    <progress
                        value={stats.pending}
                        max={stats.total || 1}
                        className="w-full h-1.5 rounded-full overflow-hidden mt-2 appearance-none [&::-webkit-progress-bar]:bg-amber-500/10 [&::-webkit-progress-value]:bg-amber-500 [&::-moz-progress-bar]:bg-amber-500"
                    />
                </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-4 bg-card-dark/50 p-4 rounded-2xl border border-surface-border">
                <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Buscar Termo</label>
                    <input
                        type="text"
                        value={filterSearch}
                        onChange={e => setFilterSearch(e.target.value)}
                        placeholder="Nome ou descrição..."
                        className="bg-surface-dark border border-surface-border rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-indigo-500 transition-all"
                    />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Categoria</label>
                    <select
                        title="Filtrar por Categoria"
                        value={filterCategory}
                        aria-label="Filtrar por Categoria"
                        onChange={e => setFilterCategory(e.target.value)}
                        className="bg-surface-dark border border-surface-border rounded-xl px-4 py-2 text-xs text-white outline-none"
                    >
                        <option value="">Todas</option>
                        {['Nota Fiscal', 'Espelho da Nota', 'Comprovante', 'Extrato Bancário', 'CNPJ', 'Certidões', 'Outros'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Escola</label>
                    <select
                        title="Filtrar por Escola"
                        value={filterSchool}
                        aria-label="Filtrar por Escola"
                        onChange={e => { setFilterSchool(e.target.value); setFilterProcess(''); }}
                        className="bg-surface-dark border border-surface-border rounded-xl px-4 py-2 text-xs text-white outline-none"
                    >
                        <option value="">{user.role === UserRole.ADMIN || user.role === UserRole.OPERADOR ? 'Todas as Escolas' : 'Minhas Escolas'}</option>
                        {accessibleSchools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Prestação (Processo)</label>
                    <select
                        title="Filtrar por Prestação de Contas"
                        value={filterProcess}
                        aria-label="Filtrar por Prestação de Contas"
                        onChange={e => setFilterProcess(e.target.value)}
                        className="bg-surface-dark border border-surface-border rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-indigo-500"
                    >
                        <option value="">Todas as Prestações</option>
                        {Array.from(new Set(documents
                            .filter(d => !filterSchool || d.school_id === filterSchool)
                            .map(d => JSON.stringify({ id: d.process_id, info: d.process_info }))
                        )).map((procStr: string) => {
                            const proc = JSON.parse(procStr);
                            if (!proc.id) return null;
                            return <option key={proc.id} value={proc.id}>{proc.info}</option>
                        })}
                    </select>
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Mês / Ano</label>
                    <select
                        title="Filtrar por Mês e Ano"
                        value={filterPeriod}
                        aria-label="Filtrar por Mês e Ano"
                        onChange={e => setFilterPeriod(e.target.value)}
                        className="bg-surface-dark border border-surface-border rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-indigo-500"
                    >
                        <option value="">Todos os Meses</option>
                        {availablePeriods.map(p => (
                            <option key={p.value} value={p.value}>{p.label.charAt(0).toUpperCase() + p.label.slice(1)}</option>
                        ))}
                    </select>
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Data Início</label>
                    <input
                        type="date"
                        title="Data de Início"
                        aria-label="Data de Início"
                        value={filterStartDate}
                        onChange={e => setFilterStartDate(e.target.value)}
                        className="bg-surface-dark border border-surface-border rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-indigo-500 [color-scheme:dark]"
                    />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Data Fim</label>
                    <input
                        type="date"
                        title="Data de Fim"
                        aria-label="Data de Fim"
                        value={filterEndDate}
                        onChange={e => setFilterEndDate(e.target.value)}
                        className="bg-surface-dark border border-surface-border rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-indigo-500 [color-scheme:dark]"
                    />
                </div>
                <div className="flex items-end col-span-2 md:col-span-1 lg:col-span-1">
                    <button
                        onClick={() => { 
                            setFilterSearch(''); 
                            setFilterCategory(''); 
                            setFilterSchool(''); 
                            setFilterProcess(''); 
                            setFilterPeriod(''); 
                            setFilterStartDate(''); 
                            setFilterEndDate(''); 
                        }}
                        className="w-full h-10 rounded-xl bg-white/5 border border-white/10 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                    >
                        Limpar Filtros
                    </button>
                </div>
            </div>

            {/* Documents Grid/Table */}
            <div className="bg-card-dark rounded-3xl border border-surface-border overflow-hidden shadow-2xl pb-20 md:pb-0">
                {/* Desktop View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-surface-dark/50 border-b border-surface-border">
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Documento</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Contexto (Escola/Programa)</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Lançamento / Valor</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Checklist</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-border">
                            {loading ? (
                                [1, 2, 3].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="px-6 py-8"><div className="h-4 bg-surface-dark rounded w-full"></div></td>
                                    </tr>
                                ))
                            ) : filteredDocs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500 italic">Nenhum documento encontrado com os filtros aplicados.</td>
                                </tr>
                            ) : filteredDocs.map(doc => (
                                <tr key={doc.id} className="group hover:bg-white/[0.02] transition-all">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-indigo-400 transition-colors">
                                                <span className="material-symbols-outlined">description</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-white line-clamp-1">{doc.name}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{doc.category}</span>
                                                    {doc.supplier_name && doc.supplier_name !== 'Sem fornecedor' && (
                                                        <>
                                                            <span className="text-slate-700">•</span>
                                                            <span className="text-[10px] text-indigo-400/70 font-bold uppercase truncate max-w-[150px]">{doc.supplier_name}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-white font-bold">{doc.school_name}</span>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <span className="material-symbols-outlined text-[12px] text-indigo-400">account_balance_wallet</span>
                                                <span className="text-[10px] text-slate-400 font-medium truncate">{doc.program_name}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-white font-mono font-bold">{new Date(doc.entry_date).toLocaleDateString('pt-BR')}</span>
                                                <span className="bg-emerald-500/10 text-emerald-400 text-[10px] px-1.5 py-0.5 rounded font-black">{doc.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 mt-1">
                                                <span className="material-symbols-outlined text-[12px] text-slate-500">description</span>
                                                <span className="text-[10px] text-slate-400 italic line-clamp-1 max-w-[180px]">{doc.process_info || doc.entry_description}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <ChecklistBadge doc={doc} />
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => { setSelectedDoc(doc); setShowChecklist(true); }}
                                                className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all flex items-center justify-center border border-indigo-500/20"
                                                title="Fazer Checklist"
                                            >
                                                <span className="material-symbols-outlined text-[20px]">fact_check</span>
                                            </button>
                                            <a
                                                href={doc.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="w-10 h-10 rounded-xl bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-all flex items-center justify-center border border-white/5"
                                                title="Visualizar Arquivo"
                                            >
                                                <span className="material-symbols-outlined text-[20px]">visibility</span>
                                            </a>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile View */}
                <div className="md:hidden p-4 space-y-4">
                    {loading ? (
                        [1, 2, 3].map(i => <div key={i} className="h-40 bg-white/5 rounded-2xl animate-pulse" />)
                    ) : filteredDocs.length === 0 ? (
                        <div className="py-12 text-center text-slate-500 italic">Nenhum documento encontrado.</div>
                    ) : filteredDocs.map(doc => (
                        <div key={doc.id} className="bg-white/5 border border-white/5 rounded-2xl p-5 space-y-4">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
                                        <span className="material-symbols-outlined">description</span>
                                    </div>
                                    <div className="min-w-0">
                                        <span className="text-sm font-bold text-white block truncate">{doc.name}</span>
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{doc.category}</span>
                                            {doc.supplier_name && doc.supplier_name !== 'Sem fornecedor' && (
                                                <>
                                                    <span className="text-slate-700">•</span>
                                                    <span className="text-[10px] text-indigo-400/70 font-bold uppercase truncate max-w-[120px]">{doc.supplier_name}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <ChecklistBadge doc={doc} />
                            </div>

                            <div className="grid grid-cols-1 gap-3 pt-2 border-t border-white/5">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm text-slate-500">school</span>
                                    <span className="text-xs text-white font-medium">{doc.school_name}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-sm text-slate-500">calendar_today</span>
                                        <span className="text-xs text-slate-400">{new Date(doc.entry_date).toLocaleDateString('pt-BR')}</span>
                                    </div>
                                    <span className="text-xs text-emerald-400 font-black">{doc.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                </div>
                                <div className="p-3 bg-black/40 rounded-xl border border-white/5 text-[10px] text-slate-400 italic">
                                    {doc.process_info || doc.entry_description}
                                </div>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button
                                    onClick={() => { setSelectedDoc(doc); setShowChecklist(true); }}
                                    className="flex-1 h-11 bg-white/5 border border-white/10 rounded-xl text-indigo-400 font-bold text-xs flex items-center justify-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-lg">fact_check</span>
                                    Checklist
                                </button>
                                <a
                                    href={doc.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-12 h-11 bg-slate-800 rounded-xl flex items-center justify-center text-white border border-white/5"
                                >
                                    <span className="material-symbols-outlined">visibility</span>
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Checklist Modal */}
            {showChecklist && selectedDoc && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                    <div className="w-full max-w-2xl bg-[#0f172a] border border-indigo-500/30 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-white/5 bg-indigo-500/5 flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                                    <span className="material-symbols-outlined">fact_check</span>
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-white tracking-tight">Checklist de Auditoria</h3>
                                    <p className="text-slate-500 text-xs">Conferência técnica para Prestação de Contas.</p>
                                </div>
                            </div>
                            <button onClick={() => setShowChecklist(false)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/5 text-slate-400 transition-colors"><span className="material-symbols-outlined">close</span></button>
                        </div>

                        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 overflow-y-auto">
                            {/* File Preview Card */}
                            <div className="bg-white/[0.03] p-6 rounded-2xl border border-white/5 flex flex-col gap-4 h-fit">
                                <div className="text-center">
                                    <span className="material-symbols-outlined text-5xl text-indigo-400 opacity-50 mb-2">description</span>
                                    <h4 className="text-sm font-bold text-white line-clamp-2">{selectedDoc.name}</h4>
                                    <div className="flex flex-col items-center">
                                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black">{selectedDoc.category}</span>
                                        {selectedDoc.supplier_name && selectedDoc.supplier_name !== 'Sem fornecedor' && (
                                            <span className="text-[10px] text-indigo-400 font-bold uppercase mt-0.5">{selectedDoc.supplier_name}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-3 mt-4 pt-4 border-t border-white/5">
                                    <div className="flex justify-between text-xs gap-4">
                                        <span className="text-slate-500 shrink-0">Escola:</span>
                                        <span className="text-white font-bold text-right truncate">{selectedDoc.school_name}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-500">Data Lanç.:</span>
                                        <span className="text-white font-bold">{new Date(selectedDoc.entry_date).toLocaleDateString('pt-BR')}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-500">Valor Doc.:</span>
                                        <span className="text-emerald-400 font-mono font-bold">{selectedDoc.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                    </div>
                                </div>
                                <a
                                    href={selectedDoc.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-4 w-full h-10 rounded-xl bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 hover:bg-indigo-600 transition-all active:scale-95"
                                >
                                    <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                                    Ver Arquivo Completo
                                </a>
                            </div>

                            {/* Checklist Inputs */}
                            <div className="flex flex-col gap-5">
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5 pb-2">Critérios de Conferência</h4>

                                <CheckItem
                                    label="Possui Assinatura do Diretor?"
                                    checked={selectedDoc.checklist?.has_signature || false}
                                    onChange={(v) => setSelectedDoc({ ...selectedDoc, checklist: { ...(selectedDoc.checklist || {}), has_signature: v } as any })}
                                />
                                <CheckItem
                                    label="Possui Carimbo do Conselho?"
                                    checked={selectedDoc.checklist?.has_stamp || false}
                                    onChange={(v) => setSelectedDoc({ ...selectedDoc, checklist: { ...(selectedDoc.checklist || {}), has_stamp: v } as any })}
                                />
                                <CheckItem
                                    label="Documento está legível?"
                                    checked={selectedDoc.checklist?.is_legible || false}
                                    onChange={(v) => setSelectedDoc({ ...selectedDoc, checklist: { ...(selectedDoc.checklist || {}), is_legible: v } as any })}
                                />
                                <CheckItem
                                    label="Valor bate com sistema?"
                                    checked={selectedDoc.checklist?.is_correct_value || false}
                                    onChange={(v) => setSelectedDoc({ ...selectedDoc, checklist: { ...(selectedDoc.checklist || {}), is_correct_value: v } as any })}
                                />
                                <CheckItem
                                    label="Data bate com o semestre?"
                                    checked={selectedDoc.checklist?.is_correct_date || false}
                                    onChange={(v) => setSelectedDoc({ ...selectedDoc, checklist: { ...(selectedDoc.checklist || {}), is_correct_date: v } as any })}
                                />

                                <div className="flex flex-col gap-1 mt-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase">Observações Técnicas</label>
                                    <textarea
                                        className="bg-surface-dark border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-indigo-500 h-24 shrink-0 resize-none"
                                        placeholder="Ex: Nota fiscal com rasura no CNPJ..."
                                        value={selectedDoc.checklist?.notes || ''}
                                        onChange={(e) => setSelectedDoc({ ...selectedDoc, checklist: { ...(selectedDoc.checklist || {}), notes: e.target.value } as any })}
                                    />
                                </div>

                                <button
                                    onClick={() => handleSaveChecklist(selectedDoc, selectedDoc.checklist)}
                                    disabled={isSavingChecklist}
                                    className="w-full h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-xs shadow-lg shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50 mt-4 shrink-0 mb-4"
                                >
                                    {isSavingChecklist ? 'Sincronizando...' : 'Finalizar Conferência'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const ChecklistBadge: React.FC<{ doc: DocumentFile }> = ({ doc }) => {
    if (!doc.checklist) {
        return (
            <div className="flex items-center gap-2 bg-slate-500/10 border border-slate-500/20 text-slate-500 px-3 py-1 rounded-full w-fit mx-auto">
                <span className="material-symbols-outlined text-[16px]">pending</span>
                <span className="text-[10px] font-black uppercase tracking-widest">Pendente</span>
            </div>
        );
    }
    const checks = [
        doc.checklist.has_signature,
        doc.checklist.has_stamp,
        doc.checklist.is_legible,
        doc.checklist.is_correct_value,
        doc.checklist.is_correct_date
    ];
    const allPassed = checks.every(Boolean);
    const passedCount = checks.filter(Boolean).length;

    if (allPassed) {
        return (
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 px-3 py-1 rounded-full w-fit mx-auto">
                <span className="material-symbols-outlined text-[16px]">verified</span>
                <span className="text-[10px] font-black uppercase tracking-widest">Validado</span>
            </div>
        );
    } else {
        return (
            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-500 px-3 py-1 rounded-full w-fit mx-auto" title={`${passedCount}/5 critérios atendidos`}>
                <span className="material-symbols-outlined text-[16px]">gpp_maybe</span>
                <span className="text-[10px] font-black uppercase tracking-widest">Ressalvas ({passedCount}/5)</span>
            </div>
        );
    }
};

// Helper Sub-component for Checklist Items
const CheckItem: React.FC<{ label: string, checked: boolean, onChange: (v: boolean) => void }> = ({ label, checked, onChange }) => (
    <div
        onClick={() => onChange(!checked)}
        className="flex items-center justify-between p-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 rounded-2xl cursor-pointer transition-all active:scale-[0.98]"
    >
        <span className="text-xs md:text-sm text-slate-200 font-medium pr-4">{label}</span>
        <div
            className={`w-12 h-7 rounded-full relative transition-all duration-300 shrink-0 ${checked ? 'bg-emerald-500/80 shadow-[0_0_12px_rgba(16,185,129,0.3)]' : 'bg-slate-700'}`}
        >
            <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-lg transition-transform duration-300 ${checked ? 'translate-x-5' : ''}`}></div>
        </div>
    </div>
);

export default DocumentSafe;
