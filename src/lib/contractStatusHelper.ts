import { supabase } from './supabaseClient';

/**
 * Recalculates the executed value of a contract and updates its status automatically:
 * - If executed value reaches or exceeds the total value (with 0.05 BRL tolerance):
 *   - Updates status from 'Ativo' to 'Encerrado'
 * - If executed value is below the total value:
 *   - Reverts status from 'Encerrado' to 'Ativo'
 */
export const updateContractStatusFromEntries = async (contractId: string | null | undefined): Promise<void> => {
    if (!contractId) return;

    try {
        // 1. Fetch contract total_value and current status
        const { data: contract, error: contractError } = await supabase
            .from('supplier_contracts')
            .select('total_value, status')
            .eq('id', contractId)
            .single();

        if (contractError || !contract) {
            console.error('Error fetching contract for status update:', contractError);
            return;
        }

        // 2. Fetch all financial entries for this contract
        const { data: entries, error: entriesError } = await supabase
            .from('financial_entries')
            .select('value')
            .eq('contract_id', contractId);

        if (entriesError || !entries) {
            console.error('Error fetching financial entries for status update:', entriesError);
            return;
        }

        // 3. Calculate executed value (sum of absolute values of entries)
        const executed = entries.reduce((acc, entry) => acc + Math.abs(entry.value || 0), 0);
        const total = Math.abs(contract.total_value || 0);

        let newStatus = contract.status;
        if (executed >= total - 0.05) {
            // If executed reaches or exceeds total, mark as Encerrado automatically if it was Ativo
            if (contract.status === 'Ativo') {
                newStatus = 'Encerrado';
            }
        } else {
            // If executed is less than total, revert to Ativo automatically if it was Encerrado
            if (contract.status === 'Encerrado') {
                newStatus = 'Ativo';
            }
        }

        // 4. If status changed, update in database
        if (newStatus !== contract.status) {
            const { error: updateError } = await supabase
                .from('supplier_contracts')
                .update({ status: newStatus })
                .eq('id', contractId);

            if (updateError) {
                console.error('Error updating contract status:', updateError);
            }
        }
    } catch (err) {
        console.error('Unexpected error in updateContractStatusFromEntries:', err);
    }
};
