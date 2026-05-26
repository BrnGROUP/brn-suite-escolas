import React, { useState, useMemo } from 'react';
import { PlatformBilling, School, User } from '../../types';
import { formatCurrency } from '../../lib/printUtils';

interface BillingSectionProps {
    billingRecords: PlatformBilling[];
    schools: School[];
    loading: boolean;
    onUpdateStatus: (data: { id: string, status: string, payment_date?: string, payment_method?: string, paid_amount?: number, description?: string, amount?: number, reference_month?: string }) => void;
    onGenerate: (month: string) => void;
    onCreate: (data: { school_id: string, reference_month: string, amount: number, description: string, status: string }) => void;
    currentUser: User;
}

const MONTH_INPUT_TYPE = 'month';

const BillingSection: React.FC<BillingSectionProps> = ({
    billingRecords, schools, loading, onUpdateStatus, onGenerate, onCreate, currentUser
}) => {
    const isAdmin = currentUser.role === 'Administrador' || currentUser.role === 'Operador';
    // Basic Filters State
    const [showFilters, setShowFilters] = useState(false);
    const [periodStart, setPeriodStart] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    });
    const [periodEnd, setPeriodEnd] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    });

    // Filter toggles
    const [filterSchoolId, setFilterSchoolId] = useState('');
    const [filterSearch, setFilterSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    // Modals
    const [paymentModal, setPaymentModal] = useState<{ open: boolean, record: PlatformBilling | null }>({ open: false, record: null });
    const [amountToPay, setAmountToPay] = useState('');
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [paymentMethod, setPaymentMethod] = useState('Pix');

    const [editModal, setEditModal] = useState<{ open: boolean, record: PlatformBilling | null }>({ open: false, record: null });
    const [editDescription, setEditDescription] = useState('');
    const [editAmount, setEditAmount] = useState('');
    const [editReferenceMonth, setEditReferenceMonth] = useState('');

    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [newItem, setNewItem] = useState({
        school_id: '',
        amount: '',
        description: '',
        reference_month: ''
    });

    // ----------------------------------------------------------------------
    // FILTER LOGIC
    // ----------------------------------------------------------------------
    const filteredRecords = useMemo(() => {
        return billingRecords.filter(r => {
            // 1. Period Filter (YYYY-MM string comparison works)
            const month = r.reference_month.slice(0, 7); // ensure format
            if (month < periodStart || month > periodEnd) return false;

            // 2. School Filter
            if (filterSchoolId && r.school_id !== filterSchoolId) return false;

            // 3. Status Filter
            if (filterStatus && r.status !== filterStatus) return false;

            // 4. Search Filter (School Name or Description)
            if (filterSearch) {
                const searchLower = filterSearch.toLowerCase();
                const schoolName = r.schools?.name?.toLowerCase() || '';
                const desc = r.description?.toLowerCase() || '';
                if (!schoolName.includes(searchLower) && !desc.includes(searchLower)) return false;
            }

            return true;
        });
    }, [billingRecords, periodStart, periodEnd, filterSchoolId, filterStatus, filterSearch]);

    // ----------------------------------------------------------------------
    // STATS CALCULATION
    // ----------------------------------------------------------------------
    const stats = useMemo(() => {
        return filteredRecords.reduce((acc, curr) => {
            const total = Number(curr.amount) || 0;
            const paid = Number(curr.paid_amount) || (curr.status === 'Pago' ? total : 0);
            const remaining = Math.max(0, total - paid);

            acc.total += total;
            acc.received += paid;
            acc.pending += remaining;
            return acc;
        }, { total: 0, received: 0, pending: 0 });
    }, [filteredRecords]);

    // Late calculation (ignores period filter to show accumulated debt, but respects school/search filters)
    const totalLateAmount = useMemo(() => {
        const currentYearMonth = new Date().toISOString().slice(0, 7);
        return billingRecords
            .filter(r => {
                // 1. School Filter
                if (filterSchoolId && r.school_id !== filterSchoolId) return false;

                // 2. Search Filter
                if (filterSearch) {
                    const searchLower = filterSearch.toLowerCase();
                    const schoolName = r.schools?.name?.toLowerCase() || '';
                    const desc = r.description?.toLowerCase() || '';
                    if (!schoolName.includes(searchLower) && !desc.includes(searchLower)) return false;
                }

                // 3. Must be pending and past due month
                return r.status === 'Pendente' && r.reference_month < `${currentYearMonth}-01`;
            })
            .reduce((acc, curr) => acc + (Number(curr.amount) - (Number(curr.paid_amount) || 0)), 0);
    }, [billingRecords, filterSchoolId, filterSearch]);

    // ----------------------------------------------------------------------
    // HANDLERS
    // ----------------------------------------------------------------------

    const handleQuickPeriod = (value: string) => {
        const year = new Date().getFullYear();
        if (value === 'curr_year') {
            setPeriodStart(`${year}-01`);
            setPeriodEnd(`${year}-12`);
        } else if (value === 'curr_sem1') {
            setPeriodStart(`${year}-01`);
            setPeriodEnd(`${year}-06`);
        } else if (value === 'curr_sem2') {
            setPeriodStart(`${year}-07`);
            setPeriodEnd(`${year}-12`);
        } else if (value === 'prev_year') {
            setPeriodStart(`${year - 1}-01`);
            setPeriodEnd(`${year - 1}-12`);
        } else if (value === 'next_year') {
            setPeriodStart(`${year + 1}-01`);
            setPeriodEnd(`${year + 1}-12`);
        } else if (value === 'prev_sem1') {
            setPeriodStart(`${year - 1}-01`);
            setPeriodEnd(`${year - 1}-06`);
        } else if (value === 'prev_sem2') {
            setPeriodStart(`${year - 1}-07`);
            setPeriodEnd(`${year - 1}-12`);
        }
    };

    const openPaymentModal = (record: PlatformBilling) => {
        const remaining = Number(record.amount) - (Number(record.paid_amount) || 0);
        setPaymentModal({ open: true, record });
        setAmountToPay(remaining.toFixed(2));
    };

    const openEditModal = (record: PlatformBilling) => {
        setEditModal({ open: true, record });
        setEditDescription(record.description || 'Mensalidade');
        setEditAmount(record.amount.toString());
        setEditReferenceMonth(record.reference_month?.slice(0, 7) || '');
    };

    const handleConfirmPayment = () => {
        if (!paymentModal.record) return;
        const payVal = parseFloat(amountToPay);
        if (isNaN(payVal) || payVal <= 0) return alert('Valor inválido');

        const currentPaid = Number(paymentModal.record.paid_amount) || 0;
        const total = Number(paymentModal.record.amount);
        const newPaidTotal = currentPaid + payVal;
        const isPaidInFull = newPaidTotal >= (total - 0.01);

        onUpdateStatus({
            id: paymentModal.record.id,
            status: isPaidInFull ? 'Pago' : 'Pendente',
            payment_date: new Date(paymentDate).toISOString(),
            payment_method: paymentMethod,
            paid_amount: newPaidTotal
        });
        setPaymentModal({ open: false, record: null });
    };

    const handleConfirmEdit = () => {
        if (!editModal.record) return;
        const val = parseFloat(editAmount);
        if (isNaN(val) || val < 0) return alert('Valor inválido');

        onUpdateStatus({
            id: editModal.record.id,
            status: editModal.record.status,
            description: editDescription,
            amount: val,
            reference_month: `${editReferenceMonth}-01`
        });
        setEditModal({ open: false, record: null });
    };

    const handleCreateService = () => {
        if (!newItem.school_id || !newItem.amount || !newItem.description || !newItem.reference_month) {
            return alert('Preencha todos os campos');
        }
        onCreate({
            school_id: newItem.school_id,
            amount: parseFloat(newItem.amount),
            description: newItem.description,
            reference_month: `${newItem.reference_month}-01`,
            status: 'Pendente'
        });
        setCreateModalOpen(false);
        setNewItem({ school_id: '', amount: '', description: '', reference_month: '' });
    };
    const handlePrintReceipt = (record: PlatformBilling) => {
        const school = record.schools;
        const paid = Number(record.paid_amount) || Number(record.amount);
        const date = record.payment_date ? new Date(record.payment_date) : new Date();
        const formattedDate = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

        const printContent = `
            <html>
                <head>
                    <title>Recibo de Pagamento - ${school?.name || 'Escola'}</title>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
                        body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; background: white; }
                        .receipt-container { max-width: 800px; margin: 0 auto; border: 2px solid #e2e8f0; padding: 40px; position: relative; }
                        .header { text-align: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 30px; }
                        .brn-logo { font-weight: 900; font-size: 24px; color: #0f172a; margin-bottom: 5px; }
                        .brn-sub { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 2px; }
                        .title { font-size: 48px; font-weight: 900; color: #f1f5f9; position: absolute; top: 10px; right: 40px; text-transform: uppercase; z-index: -1; }
                        .info-row { display: flex; justify-content: space-between; margin-bottom: 40px; }
                        .val-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px 25px; border-radius: 12px; }
                        .val-label { font-size: 10px; font-weight: 900; color: #64748b; text-transform: uppercase; margin-bottom: 5px; }
                        .val-amount { font-size: 24px; font-weight: 900; color: #0f172a; }
                        .content { line-height: 1.8; font-size: 16px; text-align: justify; margin-bottom: 60px; }
                        .content b { color: #0f172a; }
                        .footer { margin-top: 100px; display: flex; flex-direction: column; align-items: center; }
                        .sig-line { width: 300px; border-top: 1px solid #1e293b; margin-bottom: 10px; }
                        .sig-name { font-weight: 900; font-size: 12px; text-transform: uppercase; }
                        .sig-sub { font-size: 10px; color: #64748b; }
                        .date-line { text-align: right; font-style: italic; font-size: 14px; color: #64748b; margin-bottom: 40px; }
                        @media print { .no-print { display: none; } }
                    </style>
                </head>
                <body>
                    <div class="receipt-container">
                        <div class="title">Recibo</div>
                        <div class="header">
                            <div class="brn-logo">BRN GROUP</div>
                            <div class="brn-sub">Assessoria e Tecnologia Educacional</div>
                        </div>

                        <div class="info-row">
                            <div>
                                <div class="val-label">Documento</div>
                                <div style="font-weight: 700; font-size: 14px;">#FAT-${record.id.slice(0, 8).toUpperCase()}</div>
                            </div>
                            <div class="val-box">
                                <div class="val-label">Valor Recebido</div>
                                <div class="val-amount">${formatCurrency(paid)}</div>
                            </div>
                        </div>

                        <div class="content">
                            Recebemos de <b>${school?.name || 'N/A'}</b>, 
                            ${school?.cnpj ? `inscrito sob o CNPJ <b>${school.cnpj}</b>,` : ''}
                            localizado em ${school?.address || 'Endereço não informado'}, ${school?.city || ''}/${school?.uf || ''}, 
                            a importância de <b>${formatCurrency(paid)}</b>, 
                            referente ao pagamento de <b>${record.description || 'Mensalidade'}</b> 
                            do período de <b>${record.reference_month.slice(0, 7)}</b>.
                        </div>

                        <div class="date-line">
                            ${school?.city || 'João Pessoa'}, ${formattedDate}
                        </div>

                        <div class="footer">
                            <div class="sig-line"></div>
                            <div class="sig-name">BRN GROUP</div>
                            <div class="sig-sub">Departamento Financeiro</div>
                        </div>
                    </div>
                    <div style="margin-top: 30px; text-align: center;" class="no-print">
                        <button onclick="window.print()" style="padding: 10px 20px; background: #0f172a; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 700;">Imprimir Recibo</button>
                    </div>
                </body>
            </html>
        `;

        const win = window.open('', '', 'width=900,height=700');
        if (win) {
            win.document.write(printContent);
            win.document.close();
            win.focus();
        }
    };

    const handlePrintReport = () => {
        const printContent = `
            <html>
                <head>
                    <title>Relatório Financeiro</title>
                    <style>
                        body { font-family: sans-serif; padding: 20px; }
                        h1 { color: #333; }
                        .stats { display: flex; gap: 20px; margin-bottom: 20px; }
                        .card { border: 1px solid #ddd; padding: 10px 20px; border-radius: 8px; background: #f9f9f9; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
                        th { background-color: #f2f2f2; }
                        .total-row { font-weight: bold; background-color: #eee; }
                        .status-pago { color: green; font-weight: bold; }
                        .status-pendente { color: orange; font-weight: bold; }
                        .status-atrasado { color: red; font-weight: bold; }
                    </style>
                </head>
                <body>
                    <h1>Relatório Financeiro</h1>
                    <p>Período: ${periodStart} a ${periodEnd}</p>
                    
                    <div class="stats">
                        <div class="card"><strong>Total Gerado:</strong> ${formatCurrency(stats.total)}</div>
                        <div class="card"><strong>Recebido:</strong> ${formatCurrency(stats.received)}</div>
                        <div class="card"><strong>Pendente:</strong> ${formatCurrency(stats.pending)}</div>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>Mês Ref.</th>
                                <th>Escola</th>
                                <th>Descrição</th>
                                <th>Status</th>
                                <th>Valor Total</th>
                                <th>Pago</th>
                                <th>Restante</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filteredRecords.map(r => {
            const paid = Number(r.paid_amount) || (r.status === 'Pago' ? Number(r.amount) : 0);
            const remaining = Math.max(0, Number(r.amount) - paid);
            return `
                                    <tr>
                                        <td>${r.reference_month.slice(0, 7)}</td>
                                        <td>${r.schools?.name || '-'}</td>
                                        <td>${r.description || 'Mensalidade'}</td>
                                        <td class="status-${r.status.toLowerCase()}">${r.status}</td>
                                        <td>${formatCurrency(r.amount)}</td>
                                        <td>${formatCurrency(paid)}</td>
                                        <td>${formatCurrency(remaining)}</td>
                                    </tr>
                                `;
        }).join('')}
                        </tbody>
                        <tfoot>
                            <tr class="total-row">
                                <td colspan="4">TOTAIS</td>
                                <td>${formatCurrency(stats.total)}</td>
                                <td>${formatCurrency(stats.received)}</td>
                                <td>${formatCurrency(stats.pending)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </body>
            </html>
        `;

        const win = window.open('', '', 'width=900,height=600');
        if (win) {
            win.document.write(printContent);
            win.document.close();
            win.focus();
            win.print();
        }
    };

    return (
        <div className="flex flex-col gap-8 animate-in fade-in duration-500">
            {/* Header / Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="bg-[#111a22] p-4 sm:p-5 lg:p-6 rounded-2xl border border-white/5 flex flex-col gap-1 min-w-0 overflow-hidden">
                    <span className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest truncate">Total no Período</span>
                    <span className="text-lg sm:text-xl xl:text-lg min-[1400px]:text-2xl font-black text-white whitespace-nowrap truncate hover:overflow-visible hover:whitespace-normal transition-all" title={formatCurrency(stats.total)}>{formatCurrency(stats.total)}</span>
                </div>
                <div className="bg-emerald-500/5 p-4 sm:p-5 lg:p-6 rounded-2xl border border-emerald-500/10 flex flex-col gap-1 min-w-0 overflow-hidden">
                    <span className="text-[9px] sm:text-[10px] font-black text-emerald-500 uppercase tracking-widest truncate">Recebido</span>
                    <span className="text-lg sm:text-xl xl:text-lg min-[1400px]:text-2xl font-black text-emerald-500 whitespace-nowrap truncate hover:overflow-visible hover:whitespace-normal transition-all" title={formatCurrency(stats.received)}>{formatCurrency(stats.received)}</span>
                </div>
                <div className="bg-amber-500/5 p-4 sm:p-5 lg:p-6 rounded-2xl border border-amber-500/10 flex flex-col gap-1 min-w-0 overflow-hidden">
                    <span className="text-[9px] sm:text-[10px] font-black text-amber-500 uppercase tracking-widest truncate">Pendente</span>
                    <span className="text-lg sm:text-xl xl:text-lg min-[1400px]:text-2xl font-black text-amber-500 whitespace-nowrap truncate hover:overflow-visible hover:whitespace-normal transition-all" title={formatCurrency(stats.pending)}>{formatCurrency(stats.pending)}</span>
                </div>
                <div className="bg-red-500/5 p-4 sm:p-5 lg:p-6 rounded-2xl border border-red-500/10 flex flex-col gap-1 min-w-0 overflow-hidden">
                    <span className="text-[9px] sm:text-[10px] font-black text-red-500 uppercase tracking-widest truncate">Em Atraso (Geral)</span>
                    <span className="text-lg sm:text-xl xl:text-lg min-[1400px]:text-2xl font-black text-red-500 whitespace-nowrap truncate hover:overflow-visible hover:whitespace-normal transition-all" title={formatCurrency(totalLateAmount)}>{formatCurrency(totalLateAmount)}</span>
                </div>
            </div>

            {/* Toolbar: Actions & Filter Toggle */}
            <div className="flex flex-col md:flex-row justify-between gap-4">
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all border ${showFilters ? 'bg-primary text-white border-primary' : 'bg-[#111a22] text-slate-400 border-white/5 hover:text-white hover:bg-white/5'}`}
                >
                    <span className="material-symbols-outlined text-[18px]">filter_list</span>
                    {showFilters ? 'Ocultar Filtros' : 'Filtros Avançados'}
                </button>

                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    {isAdmin && (
                        <>
                            <button
                                onClick={() => setCreateModalOpen(true)}
                                className="flex-1 md:flex-none px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all border border-white/5"
                            >
                                <span className="material-symbols-outlined text-[16px]">add_circle</span>
                                Novo Extra
                            </button>
                            <button
                                onClick={() => onGenerate(periodEnd + '-01')}
                                className="flex-1 md:flex-none px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/20 rounded-lg font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                                title="Gera cobranças para o mês final selecionado"
                            >
                                <span className="material-symbols-outlined text-[16px]">sync</span>
                                Gerar (Fim)
                            </button>
                        </>
                    )}
                    <button
                        onClick={handlePrintReport}
                        className="flex-1 md:flex-none px-6 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                    >
                        <span className="material-symbols-outlined text-[18px]">print</span>
                        Imprimir
                    </button>
                </div>
            </div>

            {/* Expansible Filters Bar */}
            {showFilters && (
                <div className="bg-[#111a22] p-4 md:p-6 rounded-2xl border border-white/5 flex flex-col gap-4 animate-in slide-in-from-top-4 duration-300">

                    {/* QUICK PERIOD SELECTOR */}
                    <div className="w-full">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Período Rápido</label>
                        <div className="flex gap-2 flex-wrap">
                            <button onClick={() => handleQuickPeriod('prev_sem1')} className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-bold text-slate-400 hover:text-white uppercase tracking-wide border border-white/10 transition-all active:scale-95">1º Sem {new Date().getFullYear() - 1}</button>
                            <button onClick={() => handleQuickPeriod('prev_sem2')} className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-bold text-slate-400 hover:text-white uppercase tracking-wide border border-white/10 transition-all active:scale-95">2º Sem {new Date().getFullYear() - 1}</button>
                            <button onClick={() => handleQuickPeriod('prev_year')} className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-bold text-slate-400 hover:text-white uppercase tracking-wide border border-white/10 transition-all active:scale-95">Ano {new Date().getFullYear() - 1}</button>

                            <div className="w-[1px] h-8 bg-white/10 mx-2 hidden md:block"></div>

                            <button onClick={() => handleQuickPeriod('curr_sem1')} className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-bold text-slate-300 hover:text-white uppercase tracking-wide border border-white/10 transition-all active:scale-95">1º Sem {new Date().getFullYear()}</button>
                            <button onClick={() => handleQuickPeriod('curr_sem2')} className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-bold text-slate-300 hover:text-white uppercase tracking-wide border border-white/10 transition-all active:scale-95">2º Sem {new Date().getFullYear()}</button>
                            <button onClick={() => handleQuickPeriod('curr_year')} className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-bold text-slate-300 hover:text-white uppercase tracking-wide border border-white/10 transition-all active:scale-95">Ano {new Date().getFullYear()}</button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end border-t border-white/5 pt-4">
                        {/* Start Date */}
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Início</label>
                            <input
                                title="Data Inicial"
                                type={MONTH_INPUT_TYPE}
                                placeholder="AAAA-MM"
                                value={periodStart}
                                onChange={e => setPeriodStart(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-primary"
                            />
                        </div>

                        {/* End Date */}
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Fim</label>
                            <input
                                title="Data Final"
                                type={MONTH_INPUT_TYPE}
                                placeholder="AAAA-MM"
                                value={periodEnd}
                                onChange={e => setPeriodEnd(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-primary"
                            />
                        </div>

                        {/* School Filter */}
                        {/* School Filter - Only for Admin */}
                        {isAdmin && (
                            <div className="col-span-2 md:col-span-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Escola</label>
                                <select
                                    title="Filtrar por Escola"
                                    value={filterSchoolId}
                                    onChange={e => setFilterSchoolId(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-primary appearance-none"
                                >
                                    <option value="">Todas as Escolas</option>
                                    {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                        )}

                        {/* Search Text */}
                        <div className="col-span-2 md:col-span-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Pesquisar</label>
                            <input
                                title="Pesquisar por escola ou descrição"
                                type="text"
                                placeholder="Nome ou descrição..."
                                value={filterSearch}
                                onChange={e => setFilterSearch(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-primary"
                            />
                        </div>
                    </div>

                </div>
            )}

            {/* List */}
            <div className="grid grid-cols-1 gap-3">
                {loading ? (
                    <div className="text-center py-20 text-slate-500 italic">Carregando registros...</div>
                ) : filteredRecords.length === 0 ? (
                    <div className="bg-black/20 border border-dashed border-white/5 rounded-3xl p-20 text-center text-slate-500 italic">
                        <span className="material-symbols-outlined text-5xl mb-4 opacity-10">filter_list_off</span>
                        <p>Nenhum registro encontrado com os filtros atuais.</p>
                    </div>
                ) : (
                    filteredRecords.map((record) => {
                        const paid = Number(record.paid_amount) || 0;
                        const total = Number(record.amount);
                        const progress = Math.min(100, (paid / total) * 100);
                        const remaining = Math.max(0, total - paid);

                        // Extract style to variable to appease linter
                        const progressBarStyle = { '--prog-width': `${progress}%` } as React.CSSProperties;

                        return (
                            <div key={record.id} className="bg-[#111a22] border border-white/5 p-5 rounded-2xl flex flex-col xl:flex-row xl:items-stretch justify-between gap-4 xl:gap-6 hover:bg-white/[0.02] transition-all group overflow-hidden relative">
                                {paid > 0 && record.status !== 'Pago' && (
                                    <div className="absolute bottom-0 left-0 h-1 bg-emerald-500/20 w-[var(--prog-width)]" style={progressBarStyle}></div>
                                )}

                                <div className="flex items-start gap-4 w-full">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 mt-1 md:mt-0 ${record.status === 'Pago' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                        <span className="material-symbols-outlined text-[24px]">
                                            {record.status === 'Pago' ? 'check_circle' : (paid > 0 ? 'timelapse' : 'hourglass_empty')}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0 flex flex-col gap-2">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-black text-white text-base md:text-lg uppercase tracking-tight break-words leading-tight">{record.schools?.name || 'Escola Desconhecida'}</h4>
                                            {/* Botão de editar discreto */}
                                            <button
                                                onClick={() => openEditModal(record)}
                                                title="Editar Detalhes"
                                                className={`w-6 h-6 flex items-center justify-center rounded-full text-slate-600 hover:bg-white/10 hover:text-white transition-all opacity-50 group-hover:opacity-100 ${!isAdmin ? 'hidden' : ''}`}
                                            >
                                                <span className="material-symbols-outlined text-[14px]">edit</span>
                                            </button>
                                        </div>

                                        <p className="text-xs md:text-sm font-medium text-slate-400 leading-normal break-words max-w-full md:max-w-2xl">
                                            {record.description || 'Mensalidade'}
                                        </p>

                                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase whitespace-nowrap bg-white/5 px-2 py-0.5 rounded md:bg-transparent md:px-0 md:py-0">{record.reference_month?.slice(0, 7)}</span>
                                            <span className="hidden sm:inline w-1 h-1 rounded-full bg-slate-700"></span>
                                            <span className="text-[10px] font-bold text-slate-500 uppercase whitespace-nowrap">{record.schools?.plan_id || 'Plano não definido'}</span>
                                            <span className="hidden sm:inline w-1 h-1 rounded-full bg-slate-700"></span>
                                            <span className={`text-[10px] font-black uppercase whitespace-nowrap ${record.status === 'Pago' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                {record.status} {paid > 0 && record.status !== 'Pago' && ` (${progress.toFixed(0)}% Pago)`}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-8 w-full xl:w-auto mt-2 xl:mt-0 border-t border-white/5 pt-4 xl:border-0 xl:pt-0 shrink-0">
                                    <div className="flex flex-row xl:flex-col justify-between xl:justify-end items-center xl:items-end">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest xl:block">Valor Total</span>
                                        <div className="text-right">
                                            <span className="text-lg font-black text-white">{formatCurrency(total)}</span>
                                            {paid > 0 && record.status !== 'Pago' && (
                                                <span className="text-[10px] font-bold text-emerald-500 block">Pago: {formatCurrency(paid)}</span>
                                            )}
                                        </div>
                                    </div>

                                    {record.status !== 'Pago' && (
                                        <div className="flex flex-col w-full xl:w-auto gap-2">
                                            <button
                                                onClick={() => openPaymentModal(record)}
                                                disabled={!isAdmin}
                                                className={`h-10 w-full xl:w-[180px] flex items-center justify-center rounded-lg font-bold text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95 whitespace-nowrap ${isAdmin
                                                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                                                    : 'bg-slate-700 text-slate-400 cursor-not-allowed shadow-none'
                                                    }`}
                                            >
                                                {isAdmin ? 'Informar Pagamento' : 'Aguardando Pagamento'}
                                            </button>
                                            {paid > 0 && (
                                                <span className="text-[10px] text-amber-500 font-bold text-center xl:text-right w-full">Restam: {formatCurrency(remaining)}</span>
                                            )}
                                        </div>
                                    )}

                                    {record.status === 'Pago' && (
                                            <div className="flex items-center justify-between xl:justify-end gap-2 w-full xl:w-auto">
                                                <div className="text-right">
                                                    <span className="text-[10px] font-black text-emerald-500/50 uppercase tracking-widest block italic">Pago em</span>
                                                    <span className="text-[10px] font-bold text-emerald-500 italic">
                                                        {record.payment_date ? new Date(record.payment_date).toLocaleDateString('pt-BR') : '-'}
                                                    </span>
                                                </div>
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={() => handlePrintReceipt(record)}
                                                        title="Gerar Recibo"
                                                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all transition-colors flex-shrink-0"
                                                    >
                                                        <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                                                    </button>
                                                    <button
                                                        onClick={() => openPaymentModal(record)}
                                                        disabled={!isAdmin}
                                                        title="Editar Pagamento"
                                                        className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors flex-shrink-0 ${isAdmin ? 'bg-white/5 hover:bg-white/10 text-white/50 hover:text-white' : 'hidden'}`}
                                                    >
                                                        <span className="material-symbols-outlined text-xs">edit</span>
                                                    </button>
                                                </div>
                                            </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Create Service Modal */}
            {createModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200 overflow-y-auto">
                    <div className="bg-[#111a22] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
                        <button
                            onClick={() => setCreateModalOpen(false)}
                            className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>

                        <h3 className="text-lg font-black text-white uppercase tracking-tight mb-6">Novo Serviço Extra</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Escola</label>
                                <select
                                    title="Selecione a Escola"
                                    value={newItem.school_id}
                                    onChange={e => setNewItem({ ...newItem, school_id: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-primary transition-all appearance-none"
                                >
                                    <option value="">Selecione...</option>
                                    {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Descrição</label>
                                <input
                                    type="text"
                                    title="Descrição"
                                    placeholder="Ex: Criação de Horário, Visita Técnica..."
                                    value={newItem.description}
                                    onChange={e => setNewItem({ ...newItem, description: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-primary transition-all"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Mês de Cobrança</label>
                                    <input
                                        title="Mês de Cobrança"
                                        type={MONTH_INPUT_TYPE}
                                        placeholder="AAAA-MM"
                                        value={newItem.reference_month}
                                        onChange={e => setNewItem({ ...newItem, reference_month: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-primary transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Valor (R$)</label>
                                    <input
                                        title="Valor do Serviço"
                                        type="number"
                                        placeholder="0.00"
                                        value={newItem.amount}
                                        onChange={e => setNewItem({ ...newItem, amount: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-emerald-500 transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex gap-3">
                            <button
                                onClick={() => setCreateModalOpen(false)}
                                className="flex-1 h-12 rounded-xl font-bold text-xs uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleCreateService}
                                className="flex-1 h-12 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all"
                            >
                                Criar Cobrança
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Description/Amount Modal */}
            {editModal.open && editModal.record && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200 overflow-y-auto">
                    <div className="bg-[#111a22] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
                        <button
                            onClick={() => setEditModal({ open: false, record: null })}
                            className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>

                        <h3 className="text-lg font-black text-white uppercase tracking-tight mb-6">Editar Detalhes</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Descrição</label>
                                <textarea
                                    title="Descrição"
                                    rows={3}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-medium outline-none focus:border-primary transition-all resize-none"
                                    value={editDescription}
                                    onChange={e => setEditDescription(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Mês de Cobrança</label>
                                    <input
                                        title="Mês de Cobrança"
                                        type={MONTH_INPUT_TYPE}
                                        placeholder="AAAA-MM"
                                        value={editReferenceMonth}
                                        onChange={e => setEditReferenceMonth(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-primary transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Valor Total (R$)</label>
                                    <input
                                        title="Valor Total"
                                        type="number"
                                        value={editAmount}
                                        onChange={e => setEditAmount(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-emerald-500 transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex gap-3">
                            <button
                                onClick={() => setEditModal({ open: false, record: null })}
                                className="flex-1 h-12 rounded-xl font-bold text-xs uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmEdit}
                                className="flex-1 h-12 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all"
                            >
                                Salvar Alterações
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Modal */}
            {paymentModal.open && paymentModal.record && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200 overflow-y-auto">
                    <div className="bg-[#111a22] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
                        <button
                            onClick={() => setPaymentModal({ open: false, record: null })}
                            className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>

                        <h3 className="text-lg font-black text-white uppercase tracking-tight mb-1">Registrar Pagamento</h3>
                        <p className="text-sm text-slate-400 mb-6">{paymentModal.record.schools?.name}</p>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Valor a deduzir (R$)</label>
                                <input
                                    title="Valor a deduzir"
                                    type="number"
                                    value={amountToPay}
                                    onChange={e => setAmountToPay(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-emerald-500 transition-all"
                                    placeholder="0.00"
                                />
                                <div className="flex justify-between mt-1 text-[10px] font-bold">
                                    <span className="text-slate-500">Total: {formatCurrency(paymentModal.record.amount)}</span>
                                    <span className="text-amber-500">Restante: {formatCurrency(Math.max(0, Number(paymentModal.record.amount) - (Number(paymentModal.record.paid_amount) || 0)))}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Data</label>
                                    <input
                                        title="Data do Pagamento"
                                        type="date"
                                        value={paymentDate}
                                        onChange={e => setPaymentDate(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-primary transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Método</label>
                                    <select
                                        value={paymentMethod}
                                        title="Método de Pagamento"
                                        onChange={e => setPaymentMethod(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-primary transition-all appearance-none"
                                    >
                                        <option value="Pix">Pix</option>
                                        <option value="Boleto">Boleto</option>
                                        <option value="Transferência">Transferência</option>
                                        <option value="Cartão">Cartão</option>
                                        <option value="Dinheiro">Dinheiro</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex gap-3">
                            <button
                                onClick={() => setPaymentModal({ open: false, record: null })}
                                className="flex-1 h-12 rounded-xl font-bold text-xs uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmPayment}
                                className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl">
                <div className="flex gap-3">
                    <span className="material-symbols-outlined text-primary">info</span>
                    <p className="text-xs text-slate-400 leading-relaxed font-medium">
                        <strong className="text-primary uppercase mr-1">Nota:</strong>
                        Este módulo é de uso exclusivo da <strong>BRN GROUP</strong>. Estes pagamentos referem-se à licença de uso do software e assessoria, pagos de forma externa pelos gestores, não impactando o livro caixa oficial das escolas cadastrado no sistema.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default BillingSection;
