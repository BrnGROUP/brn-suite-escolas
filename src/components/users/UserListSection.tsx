import React from 'react';
import { User, UserRole } from '../../types';

interface UserListSectionProps {
    users: User[];
    currentUser: User;
    searchTerm: string;
    setSearchTerm: (s: string) => void;
    filterRole: string;
    setFilterRole: (r: string) => void;
    filterStatus: string;
    setFilterStatus: (s: string) => void;
    onEdit: (u: User) => void;
    onDelete: (id: string) => void;
    onToggleStatus: (id: string, current: boolean) => void;
}

export const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
        case UserRole.ADMIN: return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200';
        case UserRole.OPERADOR: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200';
        case UserRole.DIRETOR: return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
        case UserRole.TECNICO_GEE: return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200';
        case UserRole.CLIENTE: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200';
        default: return 'bg-gray-100 text-gray-800';
    }
};

const UserListSection: React.FC<UserListSectionProps> = ({
    users, currentUser, searchTerm, setSearchTerm, filterRole, setFilterRole, filterStatus, setFilterStatus,
    onEdit, onDelete, onToggleStatus
}) => {
    const filteredUsers = users.filter(u => {
        const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = filterRole === 'all' || u.role === filterRole;
        const matchesStatus = filterStatus === 'all' || (filterStatus === 'active' && u.active) || (filterStatus === 'inactive' && !u.active);
        return matchesSearch && matchesRole && matchesStatus;
    });

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white/50 dark:bg-slate-800/50 p-4 rounded-3xl border border-slate-200/50 dark:border-slate-700/50">
                <input type="text" placeholder="Pesquisar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="input-field" aria-label="Pesquisar usuários" />
                <select title="Filtrar por cargo" value={filterRole} onChange={e => setFilterRole(e.target.value)} className="input-field" aria-label="Filtrar por cargo">
                    <option value="all">Todos os Cargos</option>
                    {Object.values(UserRole).map(role => <option key={role} value={role}>{role}</option>)}
                </select>
                <select title="Filtrar por status" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input-field" aria-label="Filtrar por status">
                    <option value="all">Todos os Status</option>
                    <option value="active">Ativos</option>
                    <option value="inactive">Inativos</option>
                </select>
            </div>

            <div className="card overflow-hidden">
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800 text-xs text-slate-500 uppercase font-bold">
                            <tr>
                                <th className="px-6 py-4">Usuário</th>
                                <th className="px-6 py-4">Função</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {filteredUsers.map(u => (
                                <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">{u.name.charAt(0)}</div>
                                            <div>
                                                <p className="font-bold text-slate-800 dark:text-white">{u.name}</p>
                                                <p className="text-xs text-slate-400">{u.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase ${getRoleBadgeColor(u.role)}`}>{u.role}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => onToggleStatus(u.id, u.active ?? false)}
                                            disabled={u.id === currentUser.id}
                                            className={`text-xs font-bold ${u.active ? 'text-emerald-500' : 'text-rose-500'} ${u.id === currentUser.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            {u.active ? 'Ativo' : 'Inativo'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => onEdit(u)} className="p-2 hover:bg-primary/10 rounded-lg text-primary"><span className="material-symbols-outlined text-sm">edit</span></button>
                                            {u.id !== currentUser.id && (
                                                <button onClick={() => onDelete(u.id)} className="p-2 hover:bg-rose-50 rounded-lg text-rose-500"><span className="material-symbols-outlined text-sm">delete</span></button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-700 text-slate-800 dark:text-slate-100">
                    {filteredUsers.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 italic">Nenhum resultado encontrado.</div>
                    ) : (
                        filteredUsers.map(u => (
                            <div key={u.id} className="p-4 space-y-3">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">{u.name.charAt(0)}</div>
                                        <div>
                                            <p className="font-bold leading-tight">{u.name}</p>
                                            <p className="text-xs text-slate-400">{u.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => onEdit(u)} className="p-2 text-primary"><span className="material-symbols-outlined text-[20px]">edit</span></button>
                                        {u.id !== currentUser.id && (
                                            <button onClick={() => onDelete(u.id)} className="p-2 text-rose-500"><span className="material-symbols-outlined text-[20px]">delete</span></button>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between pt-1">
                                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${getRoleBadgeColor(u.role)}`}>{u.role}</span>
                                    <button
                                        onClick={() => onToggleStatus(u.id, u.active ?? false)}
                                        disabled={u.id === currentUser.id}
                                        className={`text-[11px] font-black uppercase px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-lg ${u.active ? 'text-emerald-500' : 'text-rose-500'} ${u.id === currentUser.id ? 'opacity-50' : ''}`}
                                    >
                                        {u.active ? 'Ativo' : 'Inativo'}
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserListSection;
