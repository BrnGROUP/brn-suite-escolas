import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { User, UserRole } from '../types';

export const useReconciliationHistory = (user: User, filters: { schoolId: string, bankAccountId: string }) => {
    return useQuery({
        queryKey: ['reconciliation_history', filters.schoolId, filters.bankAccountId],
        queryFn: async () => {
            let query = supabase
                .from('bank_statement_uploads')
                .select(`
                    *,
                    schools(name),
                    bank_accounts(name, bank_name, account_number),
                    users:uploaded_by(name)
                `)
                .order('year', { ascending: false })
                .order('month', { ascending: false });

            if (filters.schoolId) {
                query = query.eq('school_id', filters.schoolId);
            }
            if (filters.bankAccountId) {
                query = query.eq('bank_account_id', filters.bankAccountId);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data || [];
        }
    });
};

export const useDeleteReconciliationHistory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const { data, error } = await supabase.from('bank_statement_uploads').delete().eq('id', id).select();
            if (error) throw error;
            if (!data || data.length === 0) {
                throw new Error('Você não tem permissão para excluir este registro (bloqueado por segurança) ou ele não existe mais.');
            }
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reconciliation_history'] });
            queryClient.invalidateQueries({ queryKey: ['current_uploads'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard_data'] });
        }
    });
};
