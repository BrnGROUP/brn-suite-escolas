import React, { useState, useMemo } from 'react';
import { User, UserRole } from '../types';
import { useAccessibleSchools } from '../hooks/usePermissions';
import { useSemesterClosure } from '../hooks/useSemesterClosure';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { formatCurrency } from '../lib/printUtils';
import { generateDemonstrativoHTML, generateConciliacaoConsolidadaHTML, printClosureDocument } from '../lib/closureDocuments';

const currentYear = new Date().getFullYear();
const currentSemester = new Date().getMonth() < 6 ? 1 : 2;

const SemesterClosure: React.FC<{ user: User }> = ({ user }) => {
    const [selectedSchoolId, setSelectedSchoolId] = useState('');
    const [year, setYear] = useState(currentYear);
    const [semesterNumber, setSemesterNumber] = useState<1 | 2>(currentSemester as 1 | 2);

    // Schools
    const { data: allSchools = [] } = useQuery({
        queryKey: ['schools_list'],
        queryFn: async () => {
            const { data } = await supabase.from('schools').select('id, name').order('name');
            return data || [];
        }
    });
    const accessibleSchools = useAccessibleSchools(user, allSchools as any);

    const {
        existingClosure,
        calculatedLines,
        closureHistory,
        summaryStats,
        validationChecks,
        auxData,
        semesterLabel,
        dateStart,
        dateEnd,
        loadingClosure,
        isCalculating,
        isExecuting,
        isReopening,
        executeClosure,
        reopenClosure
    } = useSemesterClosure({
        user,
        schoolId: selectedSchoolId,
        year,
        semesterNumber
    });

    const isClosed = existingClosure?.status === 'Concluído';
    const isReopened = existingClosure?.status === 'Reaberto';
    const lines = existingClosure?.semester_closure_lines || calculatedLines;
    const schoolName = accessibleSchools.find((s: any) => s.id === selectedSchoolId)?.name || '';

    // Group lines by program for display
    const groupedByProgram = useMemo(() => {
        const map = new Map<string, { name: string; lines: any[] }>();
        lines.forEach((l: any) => {
            const prog = auxData.programs.find((p: any) => p.id === l.program_id);
            const name = prog?.name || l.programs?.name || 'Programa não identificado';
            if (!map.has(l.program_id)) map.set(l.program_id, { name, lines: [] });
            map.get(l.program_id)!.lines.push(l);
        });
        return Array.from(map.entries());
    }, [lines, auxData.programs]);

    const handlePrintDemonstrativo = () => {
        const docData = {
            schoolName,
            semester: semesterLabel,
            year,
            semesterNumber,
            dateStart,
            dateEnd,
            lines,
            stats: summaryStats,
            programs: auxData.programs,
            rubrics: auxData.rubrics,
            bankAccounts: auxData.bankAccounts
        };
        const html = generateDemonstrativoHTML(docData);
        printClosureDocument(html, `Demonstrativo_${semesterLabel}_${schoolName}`);
    };

    const handlePrintConciliacao = () => {
        const docData = {
            schoolName,
            semester: semesterLabel,
            year,
            semesterNumber,
            dateStart,
            dateEnd,
            lines,
            stats: summaryStats,
            programs: auxData.programs,
            rubrics: auxData.rubrics,
            bankAccounts: auxData.bankAccounts
        };
        const html = generateConciliacaoConsolidadaHTML(docData);
        printClosureDocument(html, `Conciliacao_${semesterLabel}_${schoolName}`);
    };

    const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                        <span className="material-symbols-outlined text-3xl">event_repeat</span>
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-white uppercase tracking-wider">Fechamento Semestral</h1>
                        <p className="text-xs text-slate-400 mt-1">Encerramento de exercício e reprogramação de saldos</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="card p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label htmlFor="closure_school" className="text-xs text-slate-400 font-bold uppercase block mb-1">Escola</label>
                        <select
                            id="closure_school"
                            value={selectedSchoolId}
                            onChange={e => setSelectedSchoolId(e.target.value)}
                            className="w-full bg-surface-dark border border-surface-border rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none transition-all"
                        >
                            <option value="">Selecione a escola...</option>
                            {accessibleSchools.map((s: any) => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="closure_year" className="text-xs text-slate-400 font-bold uppercase block mb-1">Ano</label>
                        <select
                            id="closure_year"
                            value={year}
                            onChange={e => setYear(Number(e.target.value))}
                            className="w-full bg-surface-dark border border-surface-border rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none transition-all"
                        >
                            {yearOptions.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="closure_sem" className="text-xs text-slate-400 font-bold uppercase block mb-1">Semestre</label>
                        <select
                            id="closure_sem"
                            value={semesterNumber}
                            onChange={e => setSemesterNumber(Number(e.target.value) as 1 | 2)}
                            className="w-full bg-surface-dark border border-surface-border rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none transition-all"
                        >
                            <option value={1}>1º Semestre (Jan–Jun)</option>
                            <option value={2}>2º Semestre (Jul–Dez)</option>
                        </select>
                    </div>
                </div>
            </div>

            {!selectedSchoolId && (
                <div className="card p-20 text-center">
                    <span className="material-symbols-outlined text-6xl text-slate-600 mb-4">school</span>
                    <p className="text-slate-500 font-bold uppercase tracking-widest">Selecione uma escola para começar</p>
                </div>
            )}

            {selectedSchoolId && (loadingClosure || isCalculating) && (
                <div className="card p-20 text-center">
                    <span className="material-symbols-outlined text-4xl animate-spin text-amber-500">sync</span>
                    <p className="text-sm text-slate-500 mt-4">Calculando saldos do período...</p>
                </div>
            )}

            {selectedSchoolId && !loadingClosure && !isCalculating && (
                <>
                    {/* Status Banner */}
                    {isClosed && (
                        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-center gap-4">
                            <span className="material-symbols-outlined text-emerald-500 text-2xl">check_circle</span>
                            <div className="flex-1">
                                <p className="text-emerald-400 font-bold">Período Encerrado</p>
                                <p className="text-xs text-slate-400">
                                    Encerrado por {existingClosure?.users?.name || '—'} em {existingClosure?.executed_at ? new Date(existingClosure.executed_at).toLocaleDateString('pt-BR') : '—'}
                                </p>
                            </div>
                            {user.role === UserRole.ADMIN && (
                                <button
                                    onClick={reopenClosure}
                                    disabled={isReopening}
                                    className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 text-xs font-bold uppercase rounded-xl transition-all flex items-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-sm">lock_open</span>
                                    {isReopening ? 'Reabrindo...' : 'Reabrir Período'}
                                </button>
                            )}
                        </div>
                    )}
                    {isReopened && (
                        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center gap-3">
                            <span className="material-symbols-outlined text-amber-500 text-2xl">lock_open</span>
                            <p className="text-amber-400 font-bold text-sm">Este período foi reaberto. Você pode executar um novo fechamento.</p>
                        </div>
                    )}

                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="card p-5 text-center">
                            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Total Receitas</p>
                            <p className="text-xl font-black text-emerald-400 font-mono">{formatCurrency(summaryStats.totalIncome)}</p>
                        </div>
                        <div className="card p-5 text-center">
                            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Total Despesas</p>
                            <p className="text-xl font-black text-rose-400 font-mono">{formatCurrency(summaryStats.totalExpense)}</p>
                        </div>
                        <div className="card p-5 text-center">
                            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Custeio</p>
                            <p className={`text-xl font-black font-mono ${summaryStats.custeio.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {formatCurrency(summaryStats.custeio.balance)}
                            </p>
                        </div>
                        <div className="card p-5 text-center">
                            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Capital</p>
                            <p className={`text-xl font-black font-mono ${summaryStats.capital.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {formatCurrency(summaryStats.capital.balance)}
                            </p>
                        </div>
                    </div>

                    {/* Validation Checklist */}
                    <div className="card p-6">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm text-amber-500">checklist</span>
                            Validações do Período
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            {[
                                {
                                    label: 'Lançamentos Conciliados',
                                    passed: validationChecks.allReconciled,
                                    detail: validationChecks.allReconciled
                                        ? `${(validationChecks as any).reconciledCount || 0} / ${(validationChecks as any).totalEntries || 0}`
                                        : `${(validationChecks as any).reconciledCount || 0} / ${(validationChecks as any).totalEntries || 0} conciliados`
                                },
                                {
                                    label: 'Prestações de Contas',
                                    passed: validationChecks.allAccountable,
                                    detail: validationChecks.allAccountable
                                        ? 'Todas concluídas'
                                        : `${(validationChecks as any).unaccountedCount || 0} saída(s) sem prestação`
                                },
                                {
                                    label: 'Extratos Bancários',
                                    passed: validationChecks.allStatements,
                                    detail: validationChecks.allStatements
                                        ? 'Todos enviados'
                                        : `Faltam meses: ${((validationChecks as any).missingMonths || []).join(', ')}`
                                },
                                {
                                    label: 'Pendências',
                                    passed: validationChecks.pendingCount === 0,
                                    detail: validationChecks.pendingCount === 0
                                        ? 'Nenhuma pendência'
                                        : `${validationChecks.pendingCount} lançamento(s) pendente(s)`
                                }
                            ].map((check, idx) => (
                                <div
                                    key={idx}
                                    className={`p-4 rounded-xl border flex items-start gap-3 ${check.passed
                                        ? 'bg-emerald-500/5 border-emerald-500/20'
                                        : 'bg-amber-500/5 border-amber-500/20'
                                        }`}
                                >
                                    <span className={`material-symbols-outlined text-lg mt-0.5 ${check.passed ? 'text-emerald-500' : 'text-amber-500'}`}>
                                        {check.passed ? 'check_circle' : 'warning'}
                                    </span>
                                    <div>
                                        <p className="text-xs font-bold text-white">{check.label}</p>
                                        <p className="text-[10px] text-slate-400 mt-0.5">{check.detail}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Detail Table */}
                    {lines.length > 0 && (
                        <div className="card overflow-hidden">
                            <div className="p-6 border-b border-surface-border flex items-center justify-between">
                                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm text-blue-400">table_chart</span>
                                    Detalhamento por Programa
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left min-w-[700px]">
                                    <thead className="bg-[#0f172a] text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                        <tr>
                                            <th className="px-6 py-3">Programa / Rubrica</th>
                                            <th className="px-6 py-3">Natureza</th>
                                            <th className="px-6 py-3 text-right">Receitas</th>
                                            <th className="px-6 py-3 text-right">Despesas</th>
                                            <th className="px-6 py-3 text-right">Saldo</th>
                                            <th className="px-6 py-3 text-right">A Reprogramar</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5 text-slate-100">
                                        {groupedByProgram.map(([programId, group]) => (
                                            <React.Fragment key={programId}>
                                                <tr className="bg-white/[0.03]">
                                                    <td colSpan={6} className="px-6 py-3 text-xs font-black text-blue-400 uppercase">{group.name}</td>
                                                </tr>
                                                {group.lines.map((line: any, idx: number) => {
                                                    const rubricName = line.rubrics?.name || auxData.rubrics.find((r: any) => r.id === line.rubric_id)?.name || '—';
                                                    const balance = Number(line.balance || 0);
                                                    const reprogValue = Number(line.reprogrammed_value || line.reprogrammed_from_prev || 0);
                                                    return (
                                                        <tr key={idx} className="hover:bg-white/[0.02]">
                                                            <td className="px-6 py-3 pl-10 text-xs">{rubricName}</td>
                                                            <td className="px-6 py-3">
                                                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${line.nature === 'Custeio' ? 'bg-sky-500/10 text-sky-400' : 'bg-purple-500/10 text-purple-400'}`}>
                                                                    {line.nature}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-3 text-right text-xs font-mono text-emerald-400">{formatCurrency(Number(line.total_income || 0))}</td>
                                                            <td className="px-6 py-3 text-right text-xs font-mono text-rose-400">{formatCurrency(Number(line.total_expense || 0))}</td>
                                                            <td className={`px-6 py-3 text-right text-xs font-mono font-bold ${balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                                {formatCurrency(balance)}
                                                            </td>
                                                            <td className="px-6 py-3 text-right text-xs font-mono font-bold text-amber-400">
                                                                {formatCurrency(Math.max(0, reprogValue))}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </React.Fragment>
                                        ))}
                                        <tr className="bg-white/[0.05] border-t-2 border-white/10">
                                            <td colSpan={2} className="px-6 py-4 text-xs font-black text-white uppercase">Total Geral</td>
                                            <td className="px-6 py-4 text-right text-sm font-mono font-bold text-emerald-400">{formatCurrency(summaryStats.totalIncome)}</td>
                                            <td className="px-6 py-4 text-right text-sm font-mono font-bold text-rose-400">{formatCurrency(summaryStats.totalExpense)}</td>
                                            <td className={`px-6 py-4 text-right text-sm font-mono font-bold ${summaryStats.totalBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {formatCurrency(summaryStats.totalBalance)}
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm font-mono font-bold text-amber-400">
                                                {formatCurrency(Math.max(0, summaryStats.totalBalance))}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Documents Panel */}
                    <div className="card p-6">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm text-cyan-400">print</span>
                            Documentos do Fechamento
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            <button
                                onClick={handlePrintDemonstrativo}
                                disabled={lines.length === 0}
                                className="p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] transition-all text-left disabled:opacity-30 disabled:cursor-not-allowed group"
                            >
                                <span className="material-symbols-outlined text-blue-400 text-2xl group-hover:scale-110 transition-transform">summarize</span>
                                <p className="text-xs font-bold text-white mt-2">Demonstrativo de Execução</p>
                                <p className="text-[10px] text-slate-500 mt-1">Receita e Despesa por programa</p>
                            </button>
                            <button
                                onClick={handlePrintConciliacao}
                                disabled={lines.length === 0}
                                className="p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] transition-all text-left disabled:opacity-30 disabled:cursor-not-allowed group"
                            >
                                <span className="material-symbols-outlined text-emerald-400 text-2xl group-hover:scale-110 transition-transform">account_balance</span>
                                <p className="text-xs font-bold text-white mt-2">Conciliação Consolidada</p>
                                <p className="text-[10px] text-slate-500 mt-1">Saldo por conta bancária</p>
                            </button>
                            <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] opacity-40 cursor-not-allowed">
                                <span className="material-symbols-outlined text-purple-400 text-2xl">inventory_2</span>
                                <p className="text-xs font-bold text-white mt-2">Relação de Bens</p>
                                <p className="text-[10px] text-slate-500 mt-1">Em breve</p>
                            </div>
                            <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] opacity-40 cursor-not-allowed">
                                <span className="material-symbols-outlined text-amber-400 text-2xl">handshake</span>
                                <p className="text-xs font-bold text-white mt-2">Termo de Doação</p>
                                <p className="text-[10px] text-slate-500 mt-1">Em breve</p>
                            </div>
                        </div>
                    </div>

                    {/* Execute / Actions */}
                    {!isClosed && (
                        <div className="card p-6 bg-amber-500/5 border-amber-500/20">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-amber-500 text-3xl">key_visualizer</span>
                                    <div>
                                        <p className="text-white font-bold">Executar Fechamento — {semesterLabel}</p>
                                        <p className="text-xs text-slate-400">Trava lançamentos e reprograma saldos para o próximo semestre</p>
                                    </div>
                                </div>
                                <button
                                    onClick={executeClosure}
                                    disabled={isExecuting || lines.length === 0}
                                    className="btn-primary bg-amber-500 hover:bg-amber-600 shadow-amber-500/20 px-8 py-3 flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
                                >
                                    {isExecuting ? (
                                        <><span className="material-symbols-outlined animate-spin text-sm">sync</span> Executando...</>
                                    ) : (
                                        <><span className="material-symbols-outlined">lock</span> Executar Encerramento</>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* History */}
                    {closureHistory.length > 0 && (
                        <div className="card overflow-hidden">
                            <div className="p-6 border-b border-surface-border">
                                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm text-slate-400">history</span>
                                    Histórico de Fechamentos
                                </h3>
                            </div>
                            <div className="divide-y divide-white/5">
                                {closureHistory.map((h: any) => (
                                    <div key={h.id} className="px-6 py-4 flex items-center justify-between hover:bg-white/[0.02]">
                                        <div className="flex items-center gap-3">
                                            <span className={`w-2.5 h-2.5 rounded-full ${h.status === 'Concluído' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : h.status === 'Reaberto' ? 'bg-amber-500' : 'bg-slate-500'}`} />
                                            <div>
                                                <p className="text-sm font-bold text-white">{h.semester}</p>
                                                <p className="text-[10px] text-slate-500">{h.schools?.name}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${h.status === 'Concluído' ? 'bg-emerald-500/10 text-emerald-400' : h.status === 'Reaberto' ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-500/10 text-slate-400'}`}>
                                                {h.status}
                                            </span>
                                            <p className="text-[10px] text-slate-500 mt-1">
                                                {h.executed_at ? new Date(h.executed_at).toLocaleDateString('pt-BR') : '—'}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default SemesterClosure;
