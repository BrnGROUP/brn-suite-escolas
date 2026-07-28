import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { BankTransaction, TransactionStatus, User } from '../types';
import { parseOFX, parseCSV } from '../lib/bankParsers';
import { autoMatch } from '../lib/reconciliationMatcher';
import { useFileUpload } from './useFileUpload';
import { useConfirm } from '../context/ConfirmContext';


interface ReconciliationUploadParams {
  user: User;
  selectedSchoolId: string;
  selectedBankAccountId: string;
  filterMonth: string;
  uploadType: 'Conta Corrente' | 'Conta Investimento';
  transactions: BankTransaction[];
  setTransactions: React.Dispatch<React.SetStateAction<BankTransaction[]>>;
  systemEntries: any[];
  bankAccounts: any[];
  rubrics: any[];
  capaForm: { revenue: number; taxes: number; balance: number };
  setCapaForm: React.Dispatch<
    React.SetStateAction<{ revenue: number; taxes: number; balance: number }>
  >;
  setShowCapaModal: (show: boolean) => void;
  setShowMonthStatus: (show: boolean) => void;
  addToast: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export const useReconciliationUpload = ({
  user,
  selectedSchoolId,
  selectedBankAccountId,
  filterMonth,
  uploadType,
  transactions,
  setTransactions,
  systemEntries,
  bankAccounts,
  rubrics,
  capaForm,
  setCapaForm,
  setShowCapaModal,
  setShowMonthStatus,
  addToast,
}: ReconciliationUploadParams) => {
  const queryClient = useQueryClient();
  const { confirm } = useConfirm();
  const { uploadFile } = useFileUpload({ bucket: 'statements' });

  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isReimport, setIsReimport] = useState(false);
  const [existingRendimentoId, setExistingRendimentoId] = useState<string | null>(null);

  const recordUploadMutation = useMutation({
    mutationFn: async ({
      file,
      schoolId,
      bankAccountId,
      month,
      year,
      accountType,
      capaData,
      isPdf,
      isNoMovement,
    }: {
      file: File;
      schoolId: string;
      bankAccountId: string;
      month: number;
      year: number;
      accountType: string;
      capaData?: any;
      isPdf?: boolean;
      isNoMovement?: boolean;
    }) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${schoolId}/${year}/${month}/${accountType.replace(
        ' ',
        '_'
      )}_${isPdf ? 'DOC' : 'DATA'}_${Date.now()}.${fileExt}`;
      const filePath = fileName;

      // 1. Upload to Storage using shared hook
      const { publicUrl } = await uploadFile(file, filePath);

      // 2. Fetch existing to merge (avoid losing PDF if uploading data OR vice versa)
      const { data: existing } = await supabase
        .from('bank_statement_uploads')
        .select('*')
        .eq('bank_account_id', bankAccountId)
        .eq('month', month)
        .eq('year', year)
        .eq('account_type', accountType)
        .maybeSingle();

      const payload: any = {
        ...(existing || {}),
        school_id: schoolId,
        bank_account_id: bankAccountId,
        month,
        year,
        account_type: accountType,
        uploaded_by: user.id,
      };

      if (isPdf) {
        payload.pdf_url = publicUrl;
        payload.pdf_name = file.name;
      } else {
        payload.file_url = publicUrl;
        payload.file_name = file.name;
      }

      if (capaData) {
        payload.reported_revenue = capaData.revenue || 0;
        payload.reported_taxes = capaData.taxes || 0;
        payload.reported_balance = capaData.balance || 0;
      }

      if (isNoMovement) {
        payload.no_movement = true;
        payload.no_movement_confirmed_by = user.id;
        payload.no_movement_confirmed_at = new Date().toISOString();
      }

      // 3. Save record in database
      const { error: dbError } = await supabase.from('bank_statement_uploads').upsert(payload, {
        onConflict: 'bank_account_id, month, year, account_type',
      });

      if (dbError) throw dbError;

      return { publicUrl };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current_uploads'] });
      queryClient.invalidateQueries({ queryKey: ['reconciliation_history'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard_data'] });
    },
  });

  const handleFileUpload = async (file: File, isNoMovement: boolean = false) => {
    if (!selectedSchoolId || !selectedBankAccountId) {
      addToast('Selecione uma escola e uma conta bancária antes de importar.', 'error');
      return;
    }

    const lowName = file.name.toLowerCase();

    if (isNoMovement && !lowName.endsWith('.pdf')) {
      addToast(
        'Para declarar o mês sem movimentação, anexe apenas um extrato em PDF justificando a ausência de lançamentos.',
        'error'
      );
      return;
    }

    // Investment PDF logic - Show Capa de Conferência first
    if (uploadType === 'Conta Investimento' && lowName.endsWith('.pdf') && !isNoMovement) {
      const parts = filterMonth.split('-').map(Number);
      const year = parts[0] || new Date().getFullYear();
      const month = parts[1] || (new Date().getMonth() + 1);
      const lastDay = new Date(year, month, 0).getDate();
      const entryDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

      // Check if a rendimento entry already exists for this month/account
      const { data: existing } = await supabase
        .from('financial_entries')
        .select('id, description, value')
        .eq('school_id', selectedSchoolId)
        .eq('bank_account_id', selectedBankAccountId)
        .eq('date', entryDate)
        .eq('category', 'Rendimento de Aplicação')
        .maybeSingle();

      if (existing) {
        const confirmed = await confirm({
          title: 'Extrato já importado',
          message: `O extrato de investimento deste mês já foi importado anteriormente.\n\nLançamento existente: "${existing.description}" — R$ ${existing.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\nSe continuar, o lançamento anterior será substituído pelos novos valores. Deseja reimportar?`,
          isDestructive: true,
        });
        if (!confirmed) return;
        setIsReimport(true);
        setExistingRendimentoId(existing.id);
      } else {
        setIsReimport(false);
        setExistingRendimentoId(null);
      }

      setPendingFile(file);
      setShowCapaModal(true);
      return;
    }

    try {
      const isPdf = lowName.endsWith('.pdf');
      const parts = filterMonth.split('-').map(Number);
      const year = parts[0] || new Date().getFullYear();
      const month = parts[1] || (new Date().getMonth() + 1);
      let newBatch: BankTransaction[] = [];

      if (!isPdf) {
        // 1. Initial Parse for data validation
        const text = await file.text();

        // Validate bank account number to avoid wrong statement uploads
        const currentAccount = bankAccounts.find((a: any) => a.id === selectedBankAccountId);
        if (currentAccount && currentAccount.account_number) {
          const cleanSelectedAcc = currentAccount.account_number.replace(/[^\d]/g, '').replace(/^0+/, '');
          
          if (lowName.endsWith('.ofx') || lowName.endsWith('.ofc')) {
            const acctIdMatch = text.match(/<ACCTID>([^<\r\n]*)/i);
            if (acctIdMatch && acctIdMatch[1]) {
              const fileAccRaw = acctIdMatch[1].trim();
              const cleanFileAcc = fileAccRaw.replace(/[^\d]/g, '').replace(/^0+/, '');
              
              if (cleanSelectedAcc && cleanFileAcc && cleanSelectedAcc !== cleanFileAcc) {
                const proceed = await confirm({
                  title: 'Aviso de Conta Bancária Divergente',
                  message: `Atenção: O extrato importado parece pertencer à conta bancária de número "${fileAccRaw}", mas a conta selecionada no sistema é "${currentAccount.name}" (${currentAccount.account_number}).\n\nDeseja realizar a importação mesmo assim?`,
                  isDestructive: true
                });
                if (!proceed) return;
              }
            }
          } else if (lowName.endsWith('.csv')) {
            const hasAccInName = file.name.replace(/[^\d]/g, '').includes(cleanSelectedAcc);
            const hasAccInText = text.replace(/[^\d]/g, '').includes(cleanSelectedAcc);
            
            if (cleanSelectedAcc.length >= 4 && !hasAccInName && !hasAccInText) {
              const proceed = await confirm({
                title: 'Aviso de Conta Bancária Divergente (CSV)',
                message: `Atenção: Não encontramos o número da conta "${currentAccount.account_number}" no conteúdo ou no nome do arquivo CSV importado.\n\nDeseja realizar a importação mesmo assim?`,
                isDestructive: true
              });
              if (!proceed) return;
            }
          }
        }

        let parseResult;
        if (lowName.endsWith('.ofx') || lowName.endsWith('.ofc')) {
          parseResult = parseOFX(text, file.name, uploadType);
        } else if (lowName.endsWith('.csv')) {
          parseResult = parseCSV(text, file.name, uploadType);
        } else {
          return addToast('Para processar dados, use os formatos .OFX, .OFC ou .CSV.', 'error');
        }

        newBatch = parseResult.transactions;

        // Opção A: Exibir toast sobre as linhas com problemas ignoradas
        if (parseResult.errors && parseResult.errors.length > 0) {
          addToast(
            `Importação concluída: ${parseResult.errors.length} linhas com formatação inválida foram ignoradas automaticamente.`,
            'warning'
          );
        }

        if (newBatch.length === 0) {
          return addToast(
            'Nenhuma transação válida encontrada no arquivo. Verifique se o formato está correto.',
            'warning'
          );
        }

        // 2. Cross-check reference month vs file data
        const mismatchedDates = newBatch.filter((t) => {
          const tParts = t.date.split('-').map(Number);
          const tYear = tParts[0] || year;
          const tMonth = tParts[1] || month;
          return tYear !== year || tMonth !== month;
        });

        if (mismatchedDates.length > 0) {
          const monthsCount: Record<string, number> = {};
          newBatch.forEach((t) => {
            const ym = t.date.substring(0, 7);
            monthsCount[ym] = (monthsCount[ym] || 0) + 1;
          });
          const majorityMonth = Object.keys(monthsCount).sort(
            (a, b) => (monthsCount[b] || 0) - (monthsCount[a] || 0)
          )[0] || filterMonth;
          const mParts = majorityMonth.split('-');
          const mYear = mParts[0] || String(year);
          const mMonth = mParts[1] || String(month);

          if (
            !await confirm({
              title: 'Aviso de Mês Divergente',
              message: `Atenção: O mês na tela é ${String(month).padStart(
                2,
                '0'
              )}/${year}, mas o arquivo é de ${mMonth}/${mYear}.\n\nDeseja realizar a importação mesmo assim?`,
              isDestructive: false
            })
          ) {
            return; // User cancelled
          }
        }
      }

      // 3. Record the upload in DB and storage
      await recordUploadMutation.mutateAsync({
        file,
        schoolId: selectedSchoolId,
        bankAccountId: selectedBankAccountId,
        month,
        year,
        accountType: uploadType,
        isPdf,
        isNoMovement,
      });

      // If it's just a PDF, we stop here (no transaction parsing)
      if (isPdf) {
        setShowMonthStatus(true);
        return addToast(
          isNoMovement
            ? 'Mês declarado como Sem Movimentação com sucesso.'
            : 'Extrato PDF vinculado como documento oficial do mês.',
          'success'
        );
      }

      // 4. Merge and process new transactions
      const combined = [...transactions];
      let addedCount = 0;
      newBatch.forEach((nt) => {
        if (!combined.some((t) => t.fitid === nt.fitid)) {
          combined.push(nt);
          addedCount++;
        }
      });

      const matched = autoMatch(combined, systemEntries);
      setTransactions(matched);

      if (addedCount > 0) {
        addToast(`${addedCount} novas transações processadas com sucesso!`, 'success');
      } else {
        addToast('Arquivo processado, mas todas as transações já tinham sido importadas.', 'info');
      }
    } catch (e: any) {
      console.error(e);
      addToast('Falha no upload/processamento: ' + e.message, 'error');
    }
  };

  const handleConfirmCapa = async () => {
    if (!pendingFile || !selectedSchoolId || !selectedBankAccountId) return;

    try {
      const parts = filterMonth.split('-').map(Number);
      const year = parts[0] || new Date().getFullYear();
      const month = parts[1] || (new Date().getMonth() + 1);

      // 1. Record the upload and get the public URL
      const { publicUrl } = await recordUploadMutation.mutateAsync({
        file: pendingFile,
        schoolId: selectedSchoolId,
        bankAccountId: selectedBankAccountId,
        month,
        year,
        accountType: uploadType,
        capaData: capaForm,
        isPdf: true,
      });

      // 2. Automate Net Income Entry
      const netIncome = (capaForm.revenue || 0) - (capaForm.taxes || 0);

      if (netIncome !== 0) {
        // Determine the last day of the month for the entry
        const lastDay = new Date(year, month, 0).getDate();
        const entryDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(
          2,
          '0'
        )}`;

        // Get program from bank account for fallback
        const bankAcc = bankAccounts.find((a: any) => a.id === selectedBankAccountId);

        // Seek a default rubric for "Rendimento" if possible
        const rendimentoRubric = rubrics.find(
          (r: any) =>
            r.name.toLowerCase().includes('rendimento') ||
            r.name.toLowerCase().includes('aplicação')
        );

        // If reimporting, delete the old rendimento entry first to avoid duplication
        if (isReimport && existingRendimentoId) {
          await supabase.from('financial_entries').delete().eq('id', existingRendimentoId);
        }

        await supabase.from('financial_entries').insert({
          school_id: selectedSchoolId,
          bank_account_id: selectedBankAccountId,
          date: entryDate,
          description: `Rendimento Líquido Aplicação - ${new Date(
            year,
            month - 1
          ).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`,
          value: netIncome,
          type: 'Entrada',
          nature: 'Custeio',
          program_id: rendimentoRubric?.program_id || bankAcc?.program_id || null,
          rubric_id: rendimentoRubric?.id || null,
          payment_method_id: null,
          category: 'Rendimento de Aplicação',
          status: TransactionStatus.CONCILIADO,
          is_reconciled: true,
          reconciled_at: new Date().toISOString(),
          attachments: [
            {
              id: Math.random().toString(),
              name: pendingFile.name,
              url: publicUrl,
              type: 'pdf',
              uploaded_at: new Date().toISOString(),
            },
          ],
        });

        addToast(
          isReimport
            ? 'Rendimento substituído com sucesso! Lançamento anterior removido.'
            : 'Rendimento líquido lançado e conciliado!',
          'success'
        );
        queryClient.invalidateQueries({ queryKey: ['system_entries'] });
      }

      addToast('Extrato de Investimento vinculado com sucesso!', 'success');
      setShowCapaModal(false);
      setPendingFile(null);
      setCapaForm({ revenue: 0, taxes: 0, balance: 0 });
      setIsReimport(false);
      setExistingRendimentoId(null);
    } catch (e: any) {
      addToast('Erro ao salvar conferência: ' + e.message, 'error');
    }
  };

  const declareFileExempt = useMutation({
    mutationFn: async ({
      fileType,
      reason,
    }: {
      fileType: 'OFX' | 'PDF';
      reason: string;
    }) => {
      const parts = filterMonth.split('-').map(Number);
      const year = parts[0] || new Date().getFullYear();
      const month = parts[1] || (new Date().getMonth() + 1);

      // Fetch existing to merge
      const { data: existing } = await supabase
        .from('bank_statement_uploads')
        .select('*')
        .eq('bank_account_id', selectedBankAccountId)
        .eq('month', month)
        .eq('year', year)
        .eq('account_type', uploadType)
        .maybeSingle();

      const payload: any = {
        ...(existing || {}),
        school_id: selectedSchoolId,
        bank_account_id: selectedBankAccountId,
        month,
        year,
        account_type: uploadType,
        uploaded_by: user.id,
      };

      if (fileType === 'OFX') {
        payload.file_url = 'EXEMPT';
        payload.file_name = `Não se aplica: ${reason}`;
      } else {
        payload.pdf_url = 'EXEMPT';
        payload.pdf_name = `Não se aplica: ${reason}`;
      }

      payload.no_movement_reason = reason;
      payload.no_movement_confirmed_by = user.id;
      payload.no_movement_confirmed_at = new Date().toISOString();

      const { error: dbError } = await supabase.from('bank_statement_uploads').upsert(payload, {
        onConflict: 'bank_account_id, month, year, account_type',
      });

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current_uploads'] });
      queryClient.invalidateQueries({ queryKey: ['reconciliation_history'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard_data'] });
      addToast('Isenção de documento registrada com sucesso.', 'success');
    },
  });

  return {
    handleFileUpload,
    handleConfirmCapa,
    pendingFile,
    setPendingFile,
    isReimport,
    recordUploadMutation,
    declareFileExempt,
  };
};

