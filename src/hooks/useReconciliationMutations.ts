import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { BankTransaction, TransactionStatus } from '../types';
import { useConfirm } from '../context/ConfirmContext';

interface ReconciliationMutationsParams {
  selectedSchoolId: string;
  selectedBankAccountId: string;
  bankAccounts: any[];
  setTransactions: React.Dispatch<React.SetStateAction<BankTransaction[]>>;
  setShowQuickCreate: (show: boolean) => void;
  setQuickCreateBT: (bt: BankTransaction | null) => void;
  setShowManualMatch: (show: boolean) => void;
  setManualMatchBT: (bt: BankTransaction | null) => void;
  addToast: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export const useReconciliationMutations = ({
  selectedSchoolId,
  selectedBankAccountId,
  bankAccounts,
  setTransactions,
  setShowQuickCreate,
  setQuickCreateBT,
  setShowManualMatch,
  setManualMatchBT,
  addToast,
}: ReconciliationMutationsParams) => {
  const queryClient = useQueryClient();
  const { confirm } = useConfirm();


  const reconcileMutation = useMutation({
    mutationFn: async ({
      bt,
      entryIds,
      splitInfo,
    }: {
      bt: BankTransaction;
      entryIds: string[];
      splitInfo?: { originalEntryId: string; value: number };
    }) => {
      if (splitInfo) {
        // PARTIAL RECONCILIATION (SPLIT LOGIC)
        const { data: original } = await supabase
          .from('financial_entries')
          .select('*')
          .eq('id', splitInfo.originalEntryId)
          .single();

        if (!original) throw new Error('Lançamento original não encontrado');

        const isNegative = Number(original.value) < 0;
        const reconciledValue = Number((isNegative ? -Math.abs(splitInfo.value) : Math.abs(splitInfo.value)).toFixed(2));
        const diffValue = Math.abs(Number(original.value)) - Math.abs(splitInfo.value);
        const remainingValue = Number((isNegative ? -Math.abs(diffValue) : Math.abs(diffValue)).toFixed(2));
        // 1. Create the "remaining balance" entry
        const { error: insertError } = await supabase
          .from('financial_entries')
          .insert({
            ...original,
            id: undefined, // Let DB generate new ID
            value: remainingValue,
            is_reconciled: false,
            reconciled_at: null,
            bank_transaction_ref: null,
            status: TransactionStatus.PENDENTE,
            description: `[SALDO] ${original.description}`,
            batch_id: null, // Force to null so it's a standalone entry, not grouped in Rateio
            created_at: new Date().toISOString(),
          });

        if (insertError) throw insertError;

        // 2. Update and reconcile the original entry with the paid amount
        const { error: updateError } = await supabase
          .from('financial_entries')
          .update({
            value: reconciledValue,
            is_reconciled: true,
            reconciled_at: new Date().toISOString(),
            payment_date: bt.date,
            bank_transaction_ref: bt.fitid,
            bank_account_id: selectedBankAccountId,
            status: TransactionStatus.CONCILIADO,
          })
          .eq('id', splitInfo.originalEntryId);

        if (updateError) throw updateError;
      } else {
        // BULK RECONCILIATION OF MULTIPLE ENTRIES
        const { error } = await supabase
          .from('financial_entries')
          .update({
            is_reconciled: true,
            reconciled_at: new Date().toISOString(),
            payment_date: bt.date,
            bank_transaction_ref: bt.fitid,
            bank_account_id: selectedBankAccountId,
            status: TransactionStatus.CONCILIADO,
          })
          .in('id', entryIds);

        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['system_entries'] });
      queryClient.invalidateQueries({ queryKey: ['financial_entries'] });
      setTransactions((prev) => prev.filter((t) => t.id !== variables.bt.id));
      setShowManualMatch(false);
      setManualMatchBT(null);
    },
  });

  const bulkReconcileMutation = useMutation({
    mutationFn: async (matchedList: BankTransaction[]) => {
      const updates = matchedList.map((bt) =>
        supabase
          .from('financial_entries')
          .update({
            is_reconciled: true,
            reconciled_at: new Date().toISOString(),
            payment_date: bt.date, // Store the bank date as payment date
            bank_transaction_ref: bt.fitid,
            bank_account_id: selectedBankAccountId, // Ensure account is linked
            status: TransactionStatus.CONCILIADO,
          })
          .eq('id', bt.matched_entry_id)
      );

      const results = await Promise.all(updates);
      const errors = results.filter((r) => r.error);
      if (errors.length > 0) throw new Error('Alguns lançamentos falharam na conciliação.');
    },
    onSuccess: (_, matchedList) => {
      queryClient.invalidateQueries({ queryKey: ['system_entries'] });
      queryClient.invalidateQueries({ queryKey: ['financial_entries'] });
      const matchedIds = matchedList.map((m) => m.id);
      setTransactions((prev) => prev.filter((t) => !matchedIds.includes(t.id)));
    },
  });

  const quickCreateMutation = useMutation({
    mutationFn: async ({ bt, form }: { bt: BankTransaction; form: any }) => {
      const { error } = await supabase.from('financial_entries').insert({
        school_id: selectedSchoolId,
        bank_account_id: selectedBankAccountId,
        date: bt.date,
        description: form.description || bt.description,
        value: bt.value,
        type: bt.type === 'C' ? 'Entrada' : 'Saída',
        nature: form.nature,
        program_id: form.program_id || null,
        rubric_id: form.rubric_id || null,
        supplier_id: form.supplier_id || null,
        category: form.category || 'Compras e Serviços',
        status: TransactionStatus.CONCILIADO,
        is_reconciled: true,
        reconciled_at: new Date().toISOString(),
        payment_date: bt.date, // Store the bank date as payment date
        bank_transaction_ref: bt.fitid,
      });
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['system_entries'] });
      queryClient.invalidateQueries({ queryKey: ['financial_entries'] });
      setTransactions((prev) => prev.filter((t) => t.id !== variables.bt.id));
      setShowQuickCreate(false);
      setQuickCreateBT(null);
    },
  });

  const reconcileAsInvestmentMutation = useMutation({
    mutationFn: async (bt: BankTransaction) => {
      const currentAccount = bankAccounts.find((a: any) => a.id === selectedBankAccountId);
      const programId = currentAccount?.program_id || null;
      const isCredit = bt.type === 'C';
      const category = isCredit ? 'Resgate de Aplicação' : 'Aplicação Financeira';
      const type = isCredit ? 'Entrada' : 'Saída';

      const { error } = await supabase.from('financial_entries').insert({
        school_id: selectedSchoolId,
        bank_account_id: selectedBankAccountId,
        date: bt.date,
        description: bt.description,
        value: bt.value,
        type,
        nature: 'Custeio',
        program_id: programId,
        rubric_id: null,
        supplier_id: null,
        category,
        status: TransactionStatus.CONCILIADO,
        is_reconciled: true,
        reconciled_at: new Date().toISOString(),
        payment_date: bt.date,
        bank_transaction_ref: bt.fitid,
      });
      if (error) throw error;
    },
    onSuccess: (_, bt) => {
      queryClient.invalidateQueries({ queryKey: ['system_entries'] });
      queryClient.invalidateQueries({ queryKey: ['financial_entries'] });
      setTransactions((prev) => prev.filter((t) => t.id !== bt.id));
      addToast(
        bt.type === 'C'
          ? 'Resgate conciliado com sucesso!'
          : 'Aplicação conciliada com sucesso!',
        'success'
      );
    },
    onError: (err: any) => {
      addToast('Erro ao conciliar aplicação: ' + err.message, 'error');
    },
  });

  const handleConfirmMatch = async (
    bt: BankTransaction,
    entryIds?: string[],
    splitInfo?: { originalEntryId: string; value: number }
  ) => {
    const finalIds = entryIds || (bt.matched_entry_id ? [bt.matched_entry_id] : []);
    if (finalIds.length === 0 && !splitInfo) return;
    reconcileMutation.mutate(
      { bt, entryIds: finalIds, splitInfo },
      {
        onError: (err: any) => addToast('Erro ao conciliar: ' + err.message, 'error'),
        onSuccess: () => addToast('Conciliado com sucesso!', 'success'),
      }
    );
  };

  const handleBulkReconcile = async (transactions: BankTransaction[]) => {
    const matched = transactions.filter((t) => t.status === 'matched' && t.matched_entry_id);
    if (matched.length === 0) return;
    if (!await confirm({
      title: 'Conciliar em Lote',
      message: `Deseja realmente conciliar os ${matched.length} lançamentos auto-identificados?`,
      isDestructive: false
    })) return;
    bulkReconcileMutation.mutate(matched, {
      onError: (err: any) => addToast('Erro na conciliação batch: ' + err.message, 'error'),
      onSuccess: () => addToast(`${matched.length} lançamentos conciliados!`, 'success'),
    });
  };

  const handleQuickCreate = async (quickCreateBT: BankTransaction | null, quickForm: any) => {
    if (!quickCreateBT || !selectedSchoolId || !selectedBankAccountId) return;
    quickCreateMutation.mutate(
      { bt: quickCreateBT, form: quickForm },
      {
        onError: (err: any) => addToast('Erro: ' + err.message, 'error'),
        onSuccess: () => addToast('Lançamento criado e conciliado!', 'success'),
      }
    );
  };

  const handleReconcileAsInvestment = (bt: BankTransaction) => {
    reconcileAsInvestmentMutation.mutate(bt);
  };

  // Unlink: removes the reconciliation reference from the financial entry and resets the bank transaction
  const unlinkMutation = useMutation({
    mutationFn: async ({ entryId }: { entryId: string }) => {
      const { error } = await supabase
        .from('financial_entries')
        .update({
          is_reconciled: false,
          bank_transaction_ref: null,
          reconciled_at: null,
          status: TransactionStatus.PENDENTE,
        })
        .eq('id', entryId);
      if (error) throw error;
    },
    onSuccess: (_, { entryId }) => {
      queryClient.invalidateQueries({ queryKey: ['system_entries'] });
      queryClient.invalidateQueries({ queryKey: ['financial_entries'] });
      // Reset the matched bt to pending in local state
      setTransactions(prev =>
        prev.map(t =>
          t.matched_entry_id === entryId
            ? { ...t, status: 'pending', matched_entry_id: undefined }
            : t
        )
      );
    },
  });

  const handleUnlink = async (bt: BankTransaction) => {
    if (!bt.matched_entry_id) return;
    const ok = await confirm({
      title: 'Desvincular Conciliação',
      message:
        'Isso vai remover o vínculo entre o extrato bancário e o lançamento do sistema.\n\nO lançamento voltará para "Pendente" e poderá ser relançado ou revinculado.\n\nDeseja continuar?',
      isDestructive: true,
    });
    if (!ok) return;
    unlinkMutation.mutate(
      { entryId: bt.matched_entry_id },
      {
        onError: (err: any) => addToast('Erro ao desvincular: ' + err.message, 'error'),
        onSuccess: () => addToast('Conciliação desvinculada. Lançamento voltou para Pendente.', 'info'),
      }
    );
  };

  return {
    reconcileMutation,
    bulkReconcileMutation,
    quickCreateMutation,
    reconcileAsInvestmentMutation,
    unlinkMutation,
    handleConfirmMatch,
    handleBulkReconcile,
    handleQuickCreate,
    handleReconcileAsInvestment,
    handleUnlink,
    isMatching:
      reconcileMutation.isPending ||
      bulkReconcileMutation.isPending ||
      quickCreateMutation.isPending ||
      reconcileAsInvestmentMutation.isPending ||
      unlinkMutation.isPending,
  };
};
