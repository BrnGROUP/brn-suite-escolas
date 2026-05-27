import { useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { TransactionStatus, TransactionNature, User, UserRole } from '../types';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export interface FinancialEntryExtended {
    id: string;
    date: string;
    description: string;
    value: number;
    type: 'Entrada' | 'Saída';
    status: TransactionStatus;
    category?: string;
    school: string;
    school_id: string;
    program: string;
    program_id: string;
    rubric: string;
    rubric_id?: string;
    nature: TransactionNature;
    supplier: string;
    supplier_id?: string;
    bank_account: string;
    bank_account_id?: string;
    payment_method: string;
    payment_method_id?: string;
    batch_id?: string;
    invoice_date?: string;
    document_number?: string;
    auth_number?: string;
    attachments?: any[];
    is_reconciled: boolean;
    bank_transaction_ref?: string;
    payment_date?: string;
}

export function useFinancialEntries(user: User, filters: any = {}) {
    const queryClient = useQueryClient();

    // Query for Auxiliary Data
    const { data: auxData = {
        schools: [],
        programs: [],
        rubrics: [],
        suppliers: [],
        bankAccounts: [],
        paymentMethods: [],
        periods: []
    } } = useQuery({
        queryKey: ['aux_data'],
        queryFn: async () => {
            const [s, p, r, sup, b, pm, per] = await Promise.all([
                supabase.from('schools').select('id, name').order('name'),
                supabase.from('programs').select('id, name').order('name'),
                supabase.from('rubrics').select('id, name, program_id, default_nature, school_id').order('name'),
                supabase.from('suppliers').select('id, name, cnpj').order('name'),
                supabase.from('bank_accounts').select('id, name, program_id, school_id, account_number, bank_name, agency').order('name'),
                supabase.from('payment_methods').select('id, name').order('name'),
                supabase.from('periods').select('name, is_active').order('name', { ascending: false })
            ]);

            return {
                schools: s.data || [],
                programs: p.data || [],
                rubrics: r.data || [],
                suppliers: sup.data || [],
                bankAccounts: b.data || [],
                paymentMethods: pm.data || [],
                periods: per.data || []
            };
        },
        staleTime: 1000 * 60 * 30 // Aux data changes rarely
    });

    // Query for Reprogrammed Balances
    const { data: reprogrammedBalances = [] } = useQuery({
        queryKey: ['reprogrammed_balances'],
        queryFn: async () => {
            const { data, error } = await supabase.from('reprogrammed_balances').select(`
                *, schools(name), programs(name), rubrics(name)
            `).order('period', { ascending: false });
            if (error) throw error;
            return data || [];
        }
    });

    // Main Query for Financial Entries
    const { data: entries = [], isLoading: loading, refetch: refreshQuery } = useQuery({
        queryKey: ['financial_entries', user.id, filters],
        queryFn: async () => {
            let q = supabase.from('financial_entries').select(`
                *, 
                schools(name), 
                programs(name), 
                rubrics(name), 
                suppliers(name),
                bank_accounts(agency, account_number),
                payment_methods(name)
            `).order('date', { ascending: false });

            // Role-based security filters
            if (user.role !== UserRole.ADMIN && user.role !== UserRole.OPERADOR) {
                if (user.role === UserRole.DIRETOR || user.role === UserRole.CLIENTE) {
                    q = q.eq('school_id', user.schoolId);
                } else if (user.role === UserRole.TECNICO_GEE) {
                    if (user.assignedSchools && user.assignedSchools.length > 0) {
                        q = q.in('school_id', user.assignedSchools);
                    } else {
                        return [];
                    }
                }
            }

            // UI Filter logic
            if (filters.school) q = q.eq('school_id', filters.school);
            if (filters.program) q = q.eq('program_id', filters.program);
            if (filters.rubric) {
                if (filters.rubric === 'none') {
                    q = q.is('rubric_id', null);
                } else {
                    q = q.eq('rubric_id', filters.rubric);
                }
            }
            if (filters.supplier) q = q.eq('supplier_id', filters.supplier);
            if (filters.startDate) q = q.gte('date', filters.startDate);
            if (filters.endDate) q = q.lte('date', filters.endDate);
            if (filters.nature) q = q.eq('nature', filters.nature);
            if (filters.search) q = q.ilike('description', `%${filters.search}%`);

            if (filters.quick === 'pending') q = q.eq('status', TransactionStatus.PENDENTE);
            if (filters.quick === 'paid') q = q.eq('status', TransactionStatus.PAGO);
            if (filters.quick === 'repasses') q = q.eq('category', 'Repasse / Crédito');
            if (filters.quick === 'tarifas') q = q.eq('category', 'Tarifa Bancária');
            if (filters.quick === 'rendimentos') q = q.eq('category', 'Rendimento de Aplicação');
            if (filters.quick === 'entradas') q = q.eq('type', 'Entrada');
            if (filters.quick === 'saidas') q = q.eq('type', 'Saída');

            const { data, error } = await q;
            if (error) throw error;

            return (data || []).map((i: any) => {
                const ba = Array.isArray(i.bank_accounts) ? i.bank_accounts[0] : i.bank_accounts;
                return {
                    ...i,
                    school: i.schools?.name || 'N/A',
                    program: i.programs?.name || 'N/A',
                    rubric: i.rubrics?.name || 'Geral',
                    supplier: i.suppliers?.name || 'Não Informado',
                    bank_account: ba ? `Ag: ${ba.agency || 'N/A'} / Cc: ${ba.account_number || 'N/A'}` : '-',
                    payment_method: i.payment_methods?.name || '-',
                    value: Number(i.value),
                    is_reconciled: i.is_reconciled,
                    bank_transaction_ref: i.bank_transaction_ref
                };
            }) as FinancialEntryExtended[];
        },
        enabled: !!user // Only run if user is loaded
    });

    // Compute stats derived from entries
    const stats = useMemo(() => {
        let inc = 0, exp = 0, pen = 0, rep = 0, rend = 0, tar = 0, impDev = 0, reprogTotal = 0;

        // Sum reprogrammed balances based on filters
        reprogrammedBalances.forEach((r: any) => {
            const matchesSchool = !filters.school || r.school_id === filters.school;
            const matchesProgram = !filters.program || r.program_id === filters.program;
            if (matchesSchool && matchesProgram) {
                reprogTotal += Number(r.value);
            }
        });

        entries.forEach((e) => {
            const val = Math.abs(e.value);
            if (e.type === 'Entrada') {
                inc += val;

                // Strict Category-based identification
                const catUpper = (e.category || '').toUpperCase().trim();

                if (catUpper === 'RENDIMENTO DE APLICAÇÃO') {
                    rend += val;
                } else if (catUpper === 'REPASSE / CRÉDITO' || catUpper === 'OUTROS') {
                    rep += val;
                }
            } else {
                exp += val;
                if (e.category === 'Tarifa Bancária') tar += val;
                if (e.category === 'Impostos / Tributos' || e.category === 'Devolução de Recurso (FNDE/Estado)') impDev += val;
            }
            if (e.status === TransactionStatus.PENDENTE) pen++;
        });

        return {
            income: inc,
            expense: exp,
            balance: inc - exp,
            pending: pen,
            repasses: rep,
            rendimentos: rend,
            tarifas: tar,
            impostosDevolucoes: impDev,
            reprogrammed: reprogTotal
        };
    }, [entries, reprogrammedBalances, filters.school, filters.program]);

    return {
        entries,
        loading,
        stats,
        auxData,
        reprogrammedBalances,
        fetchReprogrammedBalances: () => queryClient.invalidateQueries({ queryKey: ['reprogrammed_balances'] }),
        refresh: () => {
             queryClient.invalidateQueries({ queryKey: ['financial_entries'] });
             queryClient.invalidateQueries({ queryKey: ['reprogrammed_balances'] });
             queryClient.invalidateQueries({ queryKey: ['available_entries'] });
             queryClient.invalidateQueries({ queryKey: ['accountability_processes'] });
             queryClient.invalidateQueries({ queryKey: ['supplier_contracts'] });
             queryClient.invalidateQueries({ queryKey: ['suppliers_list'] });
             queryClient.invalidateQueries({ queryKey: ['aux_data'] });
             queryClient.invalidateQueries({ queryKey: ['reports_aux'] });
        }
    };
}
