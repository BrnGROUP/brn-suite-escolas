import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';

export interface AuxData {
  schools: any[];
  programs: any[];
  rubrics: any[];
  suppliers: any[];
  bankAccounts: any[];
  paymentMethods: any[];
  periods: any[];
}

/**
 * Custom hook to fetch all master auxiliary lists in a single, high-performance, cached query.
 */
export const useAuxData = () => {
  return useQuery<AuxData>({
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
    staleTime: 1000 * 60 * 30 // 30 minutes cache, since auxiliary data changes rarely
  });
};
