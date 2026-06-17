import { useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { User, UserRole, AccountabilityProcess, FinancialEntry, Supplier } from '../types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface ReportsFilters {
    schoolId: string;
    programId: string;
    status: string;
    search: string;
}

export const useReports = (user: User, filters: ReportsFilters) => {
    const queryClient = useQueryClient();
    // Queries
    const { data: auxData = { schools: [], programs: [], templateUrl: null } } = useQuery({
        queryKey: ['reports_aux'],
        queryFn: async () => {
            const [s, p, t] = await Promise.all([
                supabase.from('schools').select('id, name, inep').order('name'),
                supabase.from('programs').select('id, name').order('name'),
                supabase.from('system_settings').select('value').eq('key', 'import_template_url').maybeSingle()
            ]);
            return {
                schools: s.data || [],
                programs: p.data || [],
                templateUrl: (t.data as any)?.value || null
            };
        },
        staleTime: 1000 * 60 * 30
    });

    const { data: suppliers = [] } = useQuery({
        queryKey: ['suppliers_list'],
        queryFn: async () => (await supabase.from('suppliers').select('*').order('name')).data || [],
        staleTime: 1000 * 60 * 10
    });

    const { data: availableEntries = [], isLoading: loadingEntries } = useQuery({
        queryKey: ['available_entries', user.id, user.schoolId, user.assignedSchools],
        queryFn: async () => {
            let entriesQuery = supabase
                .from('financial_entries')
                .select('*, schools(*), programs(name), rubrics(name), suppliers(id, name, cnpj)')
                .eq('type', 'Saída');

            if (user.role !== UserRole.ADMIN && user.role !== UserRole.OPERADOR) {
                if (user.role === UserRole.DIRETOR || user.role === UserRole.CLIENTE) {
                    entriesQuery = entriesQuery.eq('school_id', user.schoolId || '');
                } else if (user.role === UserRole.TECNICO_GEE) {
                    if (user.assignedSchools && user.assignedSchools.length > 0) {
                        entriesQuery = entriesQuery.in('school_id', user.assignedSchools);
                    } else return [];
                }
            }

            const [entriesRes, existingRes] = await Promise.all([
                entriesQuery,
                supabase.from('accountability_processes').select('financial_entry_id')
            ]);

            const usedIds = new Set((existingRes.data || []).map(p => p.financial_entry_id));
            return (entriesRes.data || []).filter(e =>
                !usedIds.has(e.id) &&
                e.category !== 'Tarifa Bancária' &&
                e.category !== 'Rendimento de Aplicação' &&
                !e.description.startsWith('[SALDO]') // Saldo de split pertence ao processo do lançamento original
            ) as FinancialEntry[];
        },
        enabled: !!user.id
    });

    const { data: processes = [], isLoading: loadingProcesses, refetch: refreshProcesses } = useQuery({
        queryKey: ['accountability_processes', user.id, filters],
        queryFn: async () => {
            let query = supabase
                .from('accountability_processes')
                .select(`
                    *, 
                    schools(name),
                    financial_entries(*, schools(*), programs(name), rubrics(name), suppliers(*), payment_methods(name)),
                    supplier_contracts(*, schools(name), programs(name), rubrics(name), suppliers(*)),
                    accountability_items(*),
                    accountability_quotes(*, suppliers(*), accountability_quote_items(*))
                `)
                .order('created_at', { ascending: false });

            if (filters.schoolId) query = query.eq('school_id', filters.schoolId);
            if (filters.status) query = query.eq('status', filters.status);
            if (filters.search) query = query.or(`description.ilike.%${filters.search}%,financial_entries.description.ilike.%${filters.search}%`);

            if (user.role !== UserRole.ADMIN && user.role !== UserRole.OPERADOR) {
                if (user.role === UserRole.DIRETOR || user.role === UserRole.CLIENTE) {
                    query = query.eq('school_id', user.schoolId);
                } else if (user.role === UserRole.TECNICO_GEE) {
                    if (user.assignedSchools && user.assignedSchools.length > 0) {
                        query = query.in('school_id', user.assignedSchools);
                    } else return [];
                }
            }

            const { data, error } = await query;
            if (error) throw error;

            let results = (data || []).map((p: any) => {
                const schoolObj = p.schools || p.financial_entries?.schools || p.supplier_contracts?.schools || null;
                const programObj = p.financial_entries?.programs || p.supplier_contracts?.programs || null;
                return {
                    ...p,
                    schools: schoolObj,
                    programs: programObj
                };
            });

            if (filters.programId) {
                results = results.filter((p: any) => 
                    p.financial_entries?.program_id === filters.programId || 
                    p.supplier_contracts?.program_id === filters.programId
                );
            }

            return results as AccountabilityProcess[];
        },
        enabled: !!user.id
    });

    const { data: contracts = [], isLoading: loadingContracts, refetch: refreshContracts } = useQuery({
        queryKey: ['supplier_contracts', user.id, filters],
        queryFn: async () => {
            let query = supabase
                .from('supplier_contracts')
                .select(`
                    *,
                    schools(*),
                    suppliers(*),
                    programs(name),
                    rubrics(name),
                    financial_entries(date, description, value)
                `)
                .order('created_at', { ascending: false });

            if (filters.schoolId) query = query.eq('school_id', filters.schoolId);
            if (filters.programId) query = query.eq('program_id', filters.programId);
            if (filters.search) query = query.or(`description.ilike.%${filters.search}%,contract_number.ilike.%${filters.search}%`);

            if (user.role !== UserRole.ADMIN && user.role !== UserRole.OPERADOR) {
                if (user.role === UserRole.DIRETOR || user.role === UserRole.CLIENTE) {
                    query = query.eq('school_id', user.schoolId);
                } else if (user.role === UserRole.TECNICO_GEE) {
                    if (user.assignedSchools && user.assignedSchools.length > 0) {
                        query = query.in('school_id', user.assignedSchools);
                    } else return [];
                }
            }

            const { data, error } = await query;
            if (error) throw error;

            // Calculate executed value for each contract
            return (data || []).map((c: any) => {
                const executed_value = (c.financial_entries || []).reduce((acc: number, entry: any) => acc + Math.abs(entry.value), 0);
                return { ...c, executed_value };
            });
        },
        enabled: !!user.id
    });

    const deleteProcessMut = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('accountability_processes').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['accountability_processes'] });
            queryClient.invalidateQueries({ queryKey: ['available_entries'] });
        }
    });

    const { schools, programs, templateUrl } = auxData;
    const stats = useMemo(() => {
        // Prestações stats
        const pendingProcesses = processes.filter(p => p.status !== 'Concluído').length;
        const completedProcesses = processes.filter(p => p.status === 'Concluído').length;
        // The join result in the query is named 'financial_entries'
        const totalNotesValue = processes.reduce((acc, p) => acc + Math.abs((p as any).financial_entries?.value || 0), 0);
        // The join result in the query is named 'accountability_quotes'
        const totalQuotes = processes.reduce((acc, p) => acc + ((p as any).accountability_quotes?.length || 0), 0);

        // Contratos stats
        const activeContracts = contracts.filter(c => c.status === 'Ativo').length;
        const totalContracted = contracts.reduce((acc, c) => acc + (c.total_value || 0), 0);
        const totalExecuted = contracts.reduce((acc, c) => acc + (c.executed_value || 0), 0);
        const remainingBalance = totalContracted - totalExecuted;

        return { 
            pendingProcesses, 
            completedProcesses, 
            totalNotesValue, 
            totalQuotes,
            activeContracts,
            totalContracted,
            totalExecuted,
            remainingBalance
        };
    }, [processes, contracts]);

    return {
        loading: loadingProcesses || loadingEntries || loadingContracts,
        processes,
        contracts,
        availableEntries,
        suppliers,
        schools,
        programs,
        templateUrl,
        stats,
        refresh: () => {
            queryClient.invalidateQueries({ queryKey: ['accountability_processes'] });
            queryClient.invalidateQueries({ queryKey: ['available_entries'] });
            queryClient.invalidateQueries({ queryKey: ['supplier_contracts'] });
            queryClient.invalidateQueries({ queryKey: ['financial_entries'] });
            queryClient.invalidateQueries({ queryKey: ['suppliers_list'] });
            queryClient.invalidateQueries({ queryKey: ['aux_data'] });
            queryClient.invalidateQueries({ queryKey: ['reports_aux'] });
        },
        deleteProcess: deleteProcessMut.mutate
    };
};
