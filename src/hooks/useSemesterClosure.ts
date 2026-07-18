import { useState, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { User, UserRole, SemesterClosure, SemesterClosureLine } from '../types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';

interface UseSemesterClosureProps {
    user: User;
    schoolId: string;
    year: number;
    semesterNumber: 1 | 2;
}

const getSemesterDates = (year: number, sem: 1 | 2) => ({
    start: sem === 1 ? `${year}-01-01` : `${year}-07-01`,
    end: sem === 1 ? `${year}-06-30` : `${year}-12-31`
});

const getSemesterLabel = (year: number, sem: 1 | 2) => `${year}.${sem}`;

export const useSemesterClosure = ({ user, schoolId, year, semesterNumber }: UseSemesterClosureProps) => {
    const { addToast } = useToast();
    const { confirm } = useConfirm();
    const queryClient = useQueryClient();
    const semesterLabel = getSemesterLabel(year, semesterNumber);
    const { start: dateStart, end: dateEnd } = getSemesterDates(year, semesterNumber);

    // Aux data
    const { data: auxData = { schools: [], programs: [], rubrics: [], bankAccounts: [] } } = useQuery({
        queryKey: ['closure_aux'],
        queryFn: async () => {
            const [s, p, r, ba] = await Promise.all([
                supabase.from('schools').select('id, name').order('name'),
                supabase.from('programs').select('id, name').order('name'),
                supabase.from('rubrics').select('id, name, program_id').order('name'),
                supabase.from('bank_accounts').select('id, name, bank_name, school_id, program_id').order('name')
            ]);
            return {
                schools: s.data || [],
                programs: p.data || [],
                rubrics: r.data || [],
                bankAccounts: ba.data || []
            };
        },
        staleTime: 1000 * 60 * 30
    });

    // Existing closure for this school + semester
    const { data: existingClosure, isLoading: loadingClosure } = useQuery({
        queryKey: ['semester_closure', schoolId, semesterLabel],
        queryFn: async () => {
            if (!schoolId) return null;
            const { data, error } = await supabase
                .from('semester_closures')
                .select(`
                    *,
                    schools(name),
                    users(name),
                    semester_closure_lines(*,
                        programs(name),
                        rubrics(name),
                        bank_accounts(name, bank_name)
                    ),
                    semester_closure_documents(*)
                `)
                .eq('school_id', schoolId)
                .eq('semester', semesterLabel)
                .maybeSingle();
            if (error) throw error;
            return data as SemesterClosure | null;
        },
        enabled: !!schoolId
    });

    // All closures for history
    const { data: closureHistory = [], isLoading: loadingHistory } = useQuery({
        queryKey: ['closure_history', schoolId],
        queryFn: async () => {
            let query = supabase
                .from('semester_closures')
                .select('*, schools(name), users(name)')
                .order('year', { ascending: false })
                .order('semester_number', { ascending: false });
            if (schoolId) query = query.eq('school_id', schoolId);
            const { data, error } = await query;
            if (error) throw error;
            return data || [];
        }
    });

    // Calculate balances
    const { data: calculatedLines = [], isLoading: isCalculating } = useQuery({
        queryKey: ['closure_calc', schoolId, semesterLabel],
        queryFn: async () => {
            if (!schoolId) return [];

            // Fetch entries for the semester period
            const { data: entries, error: entriesErr } = await supabase
                .from('financial_entries')
                .select('program_id, rubric_id, bank_account_id, nature, type, value, category')
                .eq('school_id', schoolId)
                .gte('date', dateStart)
                .lte('date', dateEnd);
            if (entriesErr) throw entriesErr;

            // Fetch reprogrammed balances for previous period
            const prevSemLabel = semesterNumber === 1
                ? `${year - 1}.2`
                : `${year}.1`;
            const { data: reprogs, error: reprogErr } = await supabase
                .from('reprogrammed_balances')
                .select('program_id, rubric_id, nature, value')
                .eq('school_id', schoolId)
                .eq('period', prevSemLabel);
            if (reprogErr) throw reprogErr;

            // Group by program + rubric + nature + bank_account
            const map = new Map<string, {
                program_id: string;
                rubric_id: string | null;
                bank_account_id: string | null;
                nature: string;
                total_income: number;
                total_expense: number;
                reprogrammed_from_prev: number;
            }>();

            const makeKey = (programId: string, rubricId: string | null, bankAccountId: string | null, nature: string) =>
                `${programId}|${rubricId || ''}|${bankAccountId || ''}|${nature}`;

            const getOrCreate = (programId: string, rubricId: string | null, bankAccountId: string | null, nature: string) => {
                const key = makeKey(programId, rubricId, bankAccountId, nature);
                if (!map.has(key)) {
                    map.set(key, {
                        program_id: programId,
                        rubric_id: rubricId,
                        bank_account_id: bankAccountId,
                        nature,
                        total_income: 0,
                        total_expense: 0,
                        reprogrammed_from_prev: 0
                    });
                }
                return map.get(key)!;
            };

            // Add reprogrammed balances from previous period
            (reprogs || []).forEach(r => {
                const line = getOrCreate(r.program_id, r.rubric_id || null, null, r.nature);
                line.reprogrammed_from_prev += Number(r.value || 0);
            });

            // Aggregate entries
            (entries || []).forEach(e => {
                const line = getOrCreate(e.program_id, e.rubric_id || null, e.bank_account_id || null, e.nature);
                const val = Math.abs(Number(e.value));
                if (e.type === 'Entrada') {
                    line.total_income += val;
                } else {
                    line.total_expense += val;
                }
            });

            return Array.from(map.values()).map(line => ({
                ...line,
                balance: Number((line.reprogrammed_from_prev + line.total_income - line.total_expense).toFixed(2)),
                reprogrammed_value: Math.max(0, Number((line.reprogrammed_from_prev + line.total_income - line.total_expense).toFixed(2)))
            }));
        },
        enabled: !!schoolId && !existingClosure
    });

    // Validation checks
    const { data: validationChecks = { allReconciled: false, allAccountable: false, allStatements: false, pendingCount: 0 } } = useQuery({
        queryKey: ['closure_validation', schoolId, semesterLabel],
        queryFn: async () => {
            if (!schoolId) return { allReconciled: false, allAccountable: false, allStatements: false, pendingCount: 0 };

            const [entriesRes, processesRes, uploadsRes] = await Promise.all([
                supabase
                    .from('financial_entries')
                    .select('id, is_reconciled, type, status')
                    .eq('school_id', schoolId)
                    .gte('date', dateStart)
                    .lte('date', dateEnd),
                supabase
                    .from('accountability_processes')
                    .select('id, status, financial_entry_id')
                    .eq('school_id', schoolId),
                supabase
                    .from('statement_uploads')
                    .select('id, month, year')
                    .eq('school_id', schoolId)
                    .eq('year', year)
            ]);

            const entries = entriesRes.data || [];
            const processes = processesRes.data || [];
            const uploads = uploadsRes.data || [];

            const pendingEntries = entries.filter(e => e.status === 'Pendente');
            const reconciledCount = entries.filter(e => e.is_reconciled).length;
            const allReconciled = entries.length > 0 && reconciledCount === entries.length;

            // Check accountability
            const exitEntries = entries.filter(e => e.type === 'Saída');
            const processedEntryIds = new Set(processes.map(p => p.financial_entry_id));
            const unaccountedExits = exitEntries.filter(e => !processedEntryIds.has(e.id));
            const allAccountable = unaccountedExits.length === 0;

            // Check statements
            const semMonths = semesterNumber === 1 ? [1, 2, 3, 4, 5, 6] : [7, 8, 9, 10, 11, 12];
            const uploadedMonths = new Set(uploads.filter(u => u.year === year).map(u => u.month));
            const allStatements = semMonths.every(m => uploadedMonths.has(m));

            return {
                allReconciled,
                allAccountable,
                allStatements,
                pendingCount: pendingEntries.length,
                totalEntries: entries.length,
                reconciledCount,
                exitEntries: exitEntries.length,
                unaccountedCount: unaccountedExits.length,
                missingMonths: semMonths.filter(m => !uploadedMonths.has(m))
            };
        },
        enabled: !!schoolId
    });

    // Summary stats
    const summaryStats = useMemo(() => {
        const lines = existingClosure?.semester_closure_lines || calculatedLines;
        const totalIncome = lines.reduce((acc: number, l: any) => acc + Number(l.total_income || 0), 0);
        const totalExpense = lines.reduce((acc: number, l: any) => acc + Number(l.total_expense || 0), 0);
        const totalBalance = lines.reduce((acc: number, l: any) => acc + Number(l.balance || 0), 0);
        const totalReprog = lines.reduce((acc: number, l: any) => acc + Number(l.reprogrammed_value || l.reprogrammed_from_prev || 0), 0);

        const custeioLines = lines.filter((l: any) => l.nature === 'Custeio');
        const capitalLines = lines.filter((l: any) => l.nature === 'Capital');

        return {
            totalIncome: Number(totalIncome.toFixed(2)),
            totalExpense: Number(totalExpense.toFixed(2)),
            totalBalance: Number(totalBalance.toFixed(2)),
            totalReprogrammed: Number(totalReprog.toFixed(2)),
            custeio: {
                income: Number(custeioLines.reduce((a: number, l: any) => a + Number(l.total_income || 0), 0).toFixed(2)),
                expense: Number(custeioLines.reduce((a: number, l: any) => a + Number(l.total_expense || 0), 0).toFixed(2)),
                balance: Number(custeioLines.reduce((a: number, l: any) => a + Number(l.balance || 0), 0).toFixed(2))
            },
            capital: {
                income: Number(capitalLines.reduce((a: number, l: any) => a + Number(l.total_income || 0), 0).toFixed(2)),
                expense: Number(capitalLines.reduce((a: number, l: any) => a + Number(l.total_expense || 0), 0).toFixed(2)),
                balance: Number(capitalLines.reduce((a: number, l: any) => a + Number(l.balance || 0), 0).toFixed(2))
            }
        };
    }, [existingClosure, calculatedLines]);

    // Execute closure
    const executeClosureMutation = useMutation({
        mutationFn: async () => {
            if (!schoolId) throw new Error('Escola não selecionada');

            const confirmed = await confirm({
                title: 'Executar Fechamento Semestral',
                message: `Tem certeza que deseja encerrar o semestre ${semesterLabel} para esta escola?\n\nIsso irá:\n• Travar todos os lançamentos do período\n• Reprogramar os saldos positivos para o próximo semestre\n\nEsta ação pode ser revertida apenas por um Administrador.`,
                isDestructive: true
            });
            if (!confirmed) throw new Error('CANCELLED');

            // 1. Create closure record
            const { data: closure, error: closureErr } = await supabase
                .from('semester_closures')
                .insert({
                    school_id: schoolId,
                    semester: semesterLabel,
                    year,
                    semester_number: semesterNumber,
                    status: 'Concluído',
                    executed_by: user.id,
                    executed_at: new Date().toISOString(),
                    summary_snapshot: { stats: summaryStats, validation: validationChecks }
                })
                .select()
                .single();
            if (closureErr) throw closureErr;

            // 2. Insert closure lines
            const lineInserts = calculatedLines.map(line => ({
                closure_id: closure.id,
                program_id: line.program_id,
                rubric_id: line.rubric_id || null,
                bank_account_id: line.bank_account_id || null,
                nature: line.nature,
                total_income: line.total_income,
                total_expense: line.total_expense,
                balance: line.balance,
                reprogrammed_value: line.reprogrammed_value
            }));

            if (lineInserts.length > 0) {
                const { error: linesErr } = await supabase
                    .from('semester_closure_lines')
                    .insert(lineInserts);
                if (linesErr) throw linesErr;
            }

            // 3. Lock entries for the period
            const { error: lockErr } = await supabase
                .from('financial_entries')
                .update({ is_locked: true, locked_by_closure_id: closure.id })
                .eq('school_id', schoolId)
                .gte('date', dateStart)
                .lte('date', dateEnd);
            if (lockErr) throw lockErr;

            // 4. Reprogrammed balances for next period
            const nextSemLabel = semesterNumber === 1 ? `${year}.2` : `${year + 1}.1`;
            const reprogInserts = calculatedLines
                .filter(line => line.reprogrammed_value > 0)
                .map(line => ({
                    school_id: schoolId,
                    program_id: line.program_id,
                    rubric_id: line.rubric_id || null,
                    nature: line.nature,
                    period: nextSemLabel,
                    value: line.reprogrammed_value
                }));

            if (reprogInserts.length > 0) {
                const { error: reprogErr } = await supabase
                    .from('reprogrammed_balances')
                    .insert(reprogInserts);
                if (reprogErr) throw reprogErr;
            }

            return closure;
        },
        onSuccess: () => {
            addToast('Fechamento semestral executado com sucesso!', 'success');
            queryClient.invalidateQueries({ queryKey: ['semester_closure'] });
            queryClient.invalidateQueries({ queryKey: ['closure_history'] });
            queryClient.invalidateQueries({ queryKey: ['closure_calc'] });
        },
        onError: (err: any) => {
            if (err.message === 'CANCELLED') return;
            addToast('Erro ao executar fechamento: ' + err.message, 'error');
        }
    });

    // Reopen closure
    const reopenClosureMutation = useMutation({
        mutationFn: async () => {
            if (!existingClosure) throw new Error('Nenhum fechamento encontrado');
            if (user.role !== UserRole.ADMIN) throw new Error('Apenas Administradores podem reabrir períodos');

            const confirmed = await confirm({
                title: 'Reabrir Período Encerrado',
                message: `Tem certeza que deseja reabrir o semestre ${semesterLabel}?\n\nIsso irá:\n• Desbloquear todos os lançamentos do período\n• Remover os saldos reprogramados gerados por este fechamento\n\nOs documentos gerados serão mantidos para referência.`,
                isDestructive: true
            });
            if (!confirmed) throw new Error('CANCELLED');

            const closureId = existingClosure.id;

            // 1. Unlock entries
            await supabase
                .from('financial_entries')
                .update({ is_locked: false, locked_by_closure_id: null })
                .eq('locked_by_closure_id', closureId);

            // 2. Remove reprogrammed balances for the next period
            const nextSemLabel = semesterNumber === 1 ? `${year}.2` : `${year + 1}.1`;
            await supabase
                .from('reprogrammed_balances')
                .delete()
                .eq('school_id', schoolId)
                .eq('period', nextSemLabel);

            // 3. Delete closure lines
            await supabase
                .from('semester_closure_lines')
                .delete()
                .eq('closure_id', closureId);

            // 4. Update closure status
            const { error } = await supabase
                .from('semester_closures')
                .update({ status: 'Reaberto', updated_at: new Date().toISOString() })
                .eq('id', closureId);
            if (error) throw error;
        },
        onSuccess: () => {
            addToast('Período reaberto com sucesso!', 'success');
            queryClient.invalidateQueries({ queryKey: ['semester_closure'] });
            queryClient.invalidateQueries({ queryKey: ['closure_history'] });
            queryClient.invalidateQueries({ queryKey: ['closure_calc'] });
        },
        onError: (err: any) => {
            if (err.message === 'CANCELLED') return;
            addToast('Erro ao reabrir período: ' + err.message, 'error');
        }
    });

    return {
        // Data
        existingClosure,
        calculatedLines,
        closureHistory,
        summaryStats,
        validationChecks,
        auxData,
        semesterLabel,
        dateStart,
        dateEnd,

        // Loading
        loadingClosure,
        loadingHistory,
        isCalculating,
        isExecuting: executeClosureMutation.isPending,
        isReopening: reopenClosureMutation.isPending,

        // Actions
        executeClosure: () => executeClosureMutation.mutate(),
        reopenClosure: () => reopenClosureMutation.mutate(),

        // Helpers
        getSemesterDates,
        getSemesterLabel
    };
};
