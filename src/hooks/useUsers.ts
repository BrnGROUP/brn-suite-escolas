import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { User, UserRole, School, RolePermission } from '../types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';

export interface SupportRequest {
    id: string;
    user_id: string;
    name: string;
    email: string;
    phone: string;
    message: string;
    status: 'Pendente' | 'Em Atendimento' | 'Resolvido';
    created_at: string;
}

export interface UserForm {
    id?: string;
    name: string;
    email: string;
    role: UserRole;
    schoolId?: string;
    gee?: string;
    assignedSchools?: string[];
    active: boolean;
    avatar_url?: string;
}

const DEFAULT_ROLE_PERMISSIONS = [
    { role: 'Administrador', resource: 'entries', can_view: true, can_create: true, can_edit: true, can_delete: true },
    { role: 'Administrador', resource: 'schools', can_view: true, can_create: true, can_edit: true, can_delete: true },
    { role: 'Administrador', resource: 'reports', can_view: true, can_create: true, can_edit: true, can_delete: true },
    { role: 'Administrador', resource: 'settings', can_view: true, can_create: true, can_edit: true, can_delete: true },
    { role: 'Administrador', resource: 'users', can_view: true, can_create: true, can_edit: true, can_delete: true },
    { role: 'Operador', resource: 'entries', can_view: true, can_create: true, can_edit: true, can_delete: true },
    { role: 'Operador', resource: 'schools', can_view: true, can_create: true, can_edit: true, can_delete: true },
    { role: 'Operador', resource: 'reports', can_view: true, can_create: true, can_edit: true, can_delete: true },
    { role: 'Operador', resource: 'settings', can_view: true, can_create: true, can_edit: true, can_delete: true },
    { role: 'Operador', resource: 'users', can_view: true, can_create: true, can_edit: true, can_delete: false },
    { role: 'Diretor', resource: 'entries', can_view: true, can_create: true, can_edit: true, can_delete: true },
    { role: 'Diretor', resource: 'schools', can_view: true, can_create: false, can_edit: true, can_delete: false },
    { role: 'Diretor', resource: 'reports', can_view: true, can_create: true, can_edit: true, can_delete: true },
    { role: 'Diretor', resource: 'settings', can_view: true, can_create: false, can_edit: false, can_delete: false },
    { role: 'Diretor', resource: 'users', can_view: false, can_create: false, can_edit: false, can_delete: false },
    { role: 'Técnico GEE', resource: 'entries', can_view: true, can_create: false, can_edit: false, can_delete: false },
    { role: 'Técnico GEE', resource: 'schools', can_view: true, can_create: false, can_edit: false, can_delete: false },
    { role: 'Técnico GEE', resource: 'reports', can_view: true, can_create: false, can_edit: true, can_delete: false },
    { role: 'Técnico GEE', resource: 'settings', can_view: true, can_create: false, can_edit: false, can_delete: false },
    { role: 'Técnico GEE', resource: 'users', can_view: false, can_create: false, can_edit: false, can_delete: false },
    { role: 'Cliente', resource: 'entries', can_view: true, can_create: false, can_edit: false, can_delete: false },
    { role: 'Cliente', resource: 'schools', can_view: true, can_create: false, can_edit: false, can_delete: false },
    { role: 'Cliente', resource: 'reports', can_view: true, can_create: false, can_edit: false, can_delete: false },
    { role: 'Cliente', resource: 'settings', can_view: false, can_create: false, can_edit: false, can_delete: false },
    { role: 'Cliente', resource: 'users', can_view: false, can_create: false, can_edit: false, can_delete: false },
];

export const useUsers = (currentUser: User) => {
    const queryClient = useQueryClient();
    const { addToast } = useToast();
    const { confirm } = useConfirm();
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<UserForm | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [uploading, setUploading] = useState(false);
    const [activeTab, setActiveTab] = useState<'users' | 'approvals' | 'permissions' | 'support' | 'announcements' | 'closure'>('users');
    const [announcement, setAnnouncement] = useState({ title: '', message: '', target: 'all' as UserRole | 'all' });
    const [sendingNotice, setSendingNotice] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; userId: string | null }>({ isOpen: false, userId: null });
    const [closurePeriodName, setClosurePeriodName] = useState('');

    // Queries
    const { data: users = [], isLoading: isLoadingUsers } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const { data, error } = await supabase.from('users').select('*').order('name');
            if (error) throw error;
            return data.map(u => ({
                id: u.id,
                name: u.name,
                email: u.email,
                role: u.role as UserRole,
                schoolId: u.school_id,
                assignedSchools: u.assigned_schools,
                active: u.active ?? true,
                gee: u.gee,
                avatar_url: u.avatar_url
            })) as User[];
        }
    });

    const { data: supportRequests = [], isLoading: isLoadingSupport } = useQuery({
        queryKey: ['support_requests'],
        queryFn: async () => {
            const { data, error } = await supabase.from('support_requests').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            return data as SupportRequest[];
        }
    });

    const { data: schools = [] } = useQuery({
        queryKey: ['schools'],
        queryFn: async () => {
            const { data, error } = await supabase.from('schools').select('*').order('name');
            if (error) throw error;
            return data as School[];
        }
    });

    const { data: rolePermissions = [], isLoading: isLoadingPerms } = useQuery({
        queryKey: ['role_permissions'],
        queryFn: async () => {
            const { data, error } = await supabase.from('role_permissions').select('*').order('role', { ascending: true });
            if (error) throw error;

            if (!data || data.length === 0) {
                const { data: newData, error: insertError } = await supabase.from('role_permissions').upsert(DEFAULT_ROLE_PERMISSIONS, { onConflict: 'role, resource' }).select();
                if (insertError) throw insertError;
                return newData || [];
            }
            return data;
        }
    });

    const { data: closureSummary = [], isLoading: isCalculatingClosure } = useQuery({
        queryKey: ['closure_summary'],
        queryFn: async () => {
            const [entriesRes, reprogRes] = await Promise.all([
                supabase.from('financial_entries').select('school_id, program_id, value, type'),
                supabase.from('reprogrammed_balances').select('school_id, program_id, value')
            ]);
            const entries = entriesRes.data || [];
            const reprogs = reprogRes.data || [];
            const map = new Map();

            reprogs.forEach(r => {
                const key = `${r.school_id}-${r.program_id}`;
                if (!map.has(key)) map.set(key, { school_id: r.school_id, program_id: r.program_id, balance: 0 });
                map.get(key).balance += Number(r.value);
            });

            entries.forEach(e => {
                const key = `${e.school_id}-${e.program_id}`;
                if (!map.has(key)) map.set(key, { school_id: e.school_id, program_id: e.program_id, balance: 0 });
                const val = Number(e.value);
                if (e.type === 'Entrada') map.get(key).balance += val;
                else map.get(key).balance -= val;
            });

            return Array.from(map.values());
        },
        enabled: activeTab === 'closure'
    });

    // Mutations
    const saveUserMutation = useMutation({
        mutationFn: async (userData: any) => {
            if (userData.id) {
                const { error } = await supabase.from('users').update(userData).eq('id', userData.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('users').insert([userData]);
                if (error) throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setShowModal(false);
            setEditingUser(null);
        }
    });

    const deleteUserMutation = useMutation({
        mutationFn: async (userId: string) => {
            // Deletar registros relacionados de forma sequencial para maior controle
            // 1. Assinaturas de Contrato (Causa comum de erro de FK)
            const { error: sigError } = await supabase.from('contract_signatures').delete().eq('user_id', userId);
            if (sigError) console.warn('Aviso: Erro ao remover assinaturas:', sigError.message);

            // 2. Notificações (Ambas as tabelas possíveis no sistema)
            await supabase.from('notifications').delete().eq('user_id', userId);
            await supabase.from('accountability_notifications').delete().eq('user_id', userId);

            // 3. Solicitações de Suporte
            const { error: supportError } = await supabase.from('support_requests').delete().eq('user_id', userId);
            if (supportError) console.warn('Aviso: Erro ao remover suporte:', supportError.message);

            // 4. Logs de Auditoria (se vinculados por ID em alguma versão)
            // Tenta deletar de possíveis tabelas de log/histórico que usem user_id
            await supabase.from('audit_logs').delete().eq('user_id', userId);
            await supabase.from('xp_logs').delete().eq('user_id', userId);

            // Deleção final do usuário
            const { error } = await supabase.from('users').delete().eq('id', userId);

            if (error) {
                if (error.code === '23503') {
                    throw new Error('Não foi possível excluir o usuário pois ele possui registros vinculados que não puderam ser removidos automaticamente. Recomendamos desativar o usuário.');
                }
                throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setConfirmDelete({ isOpen: false, userId: null });
        }
    });

    const toggleStatusMutation = useMutation({
        mutationFn: async ({ userId, active }: { userId: string, active: boolean }) => {
            const { error } = await supabase.from('users').update({ active }).eq('id', userId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        }
    });

    const updateSupportStatusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: string, status: SupportRequest['status'] }) => {
            const { error } = await supabase.from('support_requests').update({ status }).eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['support_requests'] });
        }
    });

    const togglePermissionMutation = useMutation({
        mutationFn: async ({ role, resource, field }: { role: UserRole, resource: RolePermission['resource'], field: string }) => {
            const dbField = field === 'canView' ? 'can_view' : field === 'canCreate' ? 'can_create' : field === 'canEdit' ? 'can_edit' : 'can_delete';
            const existing = rolePermissions.find(rp => rp.role === role && rp.resource === resource);
            const newValue = existing ? !(existing as any)[dbField] : true;

            if (existing) {
                const { error } = await supabase.from('role_permissions').update({ [dbField]: newValue }).eq('id', existing.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('role_permissions').insert([{ role, resource, [dbField]: newValue }]);
                if (error) throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['role_permissions'] });
        }
    });

    const resetPermissionsMutation = useMutation({
        mutationFn: async () => {
            const { error } = await supabase.from('role_permissions').upsert(DEFAULT_ROLE_PERMISSIONS, { onConflict: 'role, resource' });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['role_permissions'] });
        }
    });

    const executeClosureMutation = useMutation({
        mutationFn: async () => {
            const inserts = closureSummary
                .filter((c: any) => c.balance > 0)
                .map((c: any) => ({ school_id: c.school_id, program_id: c.program_id, period: closurePeriodName, value: c.balance, nature: 'Custeio' }));

            if (inserts.length > 0) {
                const { error } = await supabase.from('reprogrammed_balances').insert(inserts);
                if (error) throw error;
            }

            await supabase.from('periods').insert([{ name: closurePeriodName, is_active: true }]);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['closure_summary'] });
            setClosurePeriodName('');
            addToast('Encerramento realizado!', 'success');
        }
    });

    // Helper counts
    const counts = {
        pendingUsers: users.filter(u => u.active === false || (u.role === UserRole.CLIENTE && !u.schoolId)).length,
        pendingSupport: supportRequests.filter(r => r.status === 'Pendente').length
    };

    // Public Handlers
    const handleSaveUser = async () => {
        if (!editingUser) return;
        if (!editingUser.name.trim() || !editingUser.email.trim()) return addToast('Nome e Email são obrigatórios', 'warning');

        const userData = {
            id: editingUser.id,
            name: editingUser.name.trim(),
            email: editingUser.email.trim().toLowerCase(),
            role: editingUser.role,
            school_id: (editingUser.role === UserRole.DIRETOR || editingUser.role === UserRole.CLIENTE) ? editingUser.schoolId : null,
            gee: editingUser.role === UserRole.TECNICO_GEE ? editingUser.gee : null,
            assigned_schools: editingUser.role === UserRole.TECNICO_GEE ? editingUser.assignedSchools : null,
            active: editingUser.active,
            avatar_url: editingUser.avatar_url
        };

        saveUserMutation.mutate(userData, {
            onError: (err: any) => addToast('Erro ao salvar: ' + err.message, 'error'),
            onSuccess: () => addToast('Usuário salvo com sucesso!', 'success')
        });
    };

    const processDelete = async () => {
        if (!confirmDelete.userId) return;
        deleteUserMutation.mutate(confirmDelete.userId, {
            onError: (err: any) => addToast('Erro ao excluir: ' + err.message, 'error'),
            onSuccess: () => addToast('Usuário excluído!', 'success')
        });
    };

    const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
        if (userId === currentUser.id) return;
        toggleStatusMutation.mutate({ userId, active: !currentStatus }, {
            onError: (err: any) => addToast('Erro ao alterar status: ' + err.message, 'error'),
            onSuccess: () => addToast('Status alterado!', 'success')
        });
    };

    const handleSupportStatus = (id: string, status: SupportRequest['status']) => {
        updateSupportStatusMutation.mutate({ id, status }, {
            onError: (err: any) => addToast('Erro ao atualizar suporte: ' + err.message, 'error'),
            onSuccess: () => addToast('Status de suporte atualizado!', 'success')
        });
    };

    const handleTogglePermission = (role: UserRole, resource: RolePermission['resource'], field: string) => {
        togglePermissionMutation.mutate({ role, resource, field }, {
            onError: (err: any) => addToast('Erro ao salvar permissão: ' + err.message, 'error')
        });
    };

    const handleResetPermissions = async () => {
        if (!await confirm({
            title: 'Redefinir Permissões',
            message: 'Deseja redefinir todas as permissões para os padrões do sistema? Esta ação afetará todos os usuários instantaneamente.',
            isDestructive: true
        })) return;
        resetPermissionsMutation.mutate(undefined, {
            onError: (err: any) => addToast('Erro ao resetar permissões: ' + err.message, 'error'),
            onSuccess: () => addToast('Permissões redefinidas!', 'success')
        });
    };

    const handleSendAnnouncement = async () => {
        if (!announcement.title || !announcement.message) return addToast('Preencha o título e a mensagem.', 'warning');
        setSendingNotice(true);
        try {
            let targetUsers = users;
            if (announcement.target !== 'all') targetUsers = users.filter(u => u.role === announcement.target);
            const notifications = targetUsers.map(u => ({ user_id: u.id, title: announcement.title, message: announcement.message, type: 'info' }));
            const { error } = await supabase.from('notifications').insert(notifications);
            if (error) throw error;
            addToast('Comunicado enviado!', 'success');
            setAnnouncement({ title: '', message: '', target: 'all' });
        } catch (error: any) {
            addToast('Erro: ' + error.message, 'error');
        } finally {
            setSendingNotice(false);
        }
    };

    const handleExecuteClosure = async () => {
        if (!closurePeriodName.trim()) return addToast('Informe o nome do novo período', 'warning');
        if (!await confirm({
            title: 'Encerrar Exercício Atual',
            message: 'Deseja realmente realizar o encerramento do exercício atual? Esta é uma operação administrativa de alta criticidade.',
            isDestructive: true
        })) return;
        executeClosureMutation.mutate(undefined, {
            onError: (err: any) => addToast('Erro: ' + err.message, 'error')
        });
    };

    return {
        users, schools, supportRequests, rolePermissions, closureSummary,
        loading: isLoadingUsers || isLoadingSupport,
        isLoadingPerms,
        isCalculatingClosure,
        showModal, setShowModal,
        editingUser, setEditingUser,
        searchTerm, setSearchTerm,
        filterRole, setFilterRole,
        filterStatus, setFilterStatus,
        uploading, setUploading,
        activeTab, setActiveTab,
        announcement, setAnnouncement,
        sendingNotice,
        confirmDelete, setConfirmDelete,
        closurePeriodName, setClosurePeriodName,
        counts,
        handleSupportStatus,
        handleTogglePermission,
        handleResetPermissions,
        handleSendAnnouncement,
        handleSaveUser,
        processDelete,
        handleToggleStatus,
        handleExecuteClosure
    };
};
