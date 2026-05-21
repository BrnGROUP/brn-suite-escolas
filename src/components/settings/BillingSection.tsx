import React, { useState, useMemo } from 'react';
import { PlatformBilling, School, User } from '../../types';
import { formatCurrency } from '../../lib/printUtils';
import { useToast } from '../../context/ToastContext';

// Import decomposed subcomponents
import { BillingStatsCards } from './BillingStatsCards';
import { BillingFilters } from './BillingFilters';
import { PaymentModal } from './PaymentModal';
import { EditBillingModal } from './EditBillingModal';
import { CreateBillingModal } from './CreateBillingModal';

interface BillingSectionProps {
    billingRecords: PlatformBilling[];
    schools: School[];
    loading: boolean;
    onUpdateStatus: (data: { id: string, status: string, payment_date?: string, payment_method?: string, paid_amount?: number, description?: string, amount?: number, reference_month?: string }) => void;
    onGenerate: (month: string) => void;
    onCreate: (data: { school_id: string, reference_month: string, amount: number, description: string, status: string }) => void;
    currentUser: User;
}

const BillingSection: React.FC<BillingSectionProps> = ({
    billingRecords, schools, loading, onUpdateStatus, onGenerate, onCreate, currentUser
}) => {
    const isAdmin = currentUser.role === 'Administrador' || currentUser.role === 'Operador';
    const { addToast } = useToast();

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
    const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0] || '');
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

    // FILTER LOGIC
    const filteredRecords = useMemo(() => {
        return billingRecords.filter(r => {
            const month = r.reference_month.slice(0, 7);
            if (month < periodStart || month > periodEnd) return false;
            if (filterSchoolId && r.school_id !== filterSchoolId) return false;
            if (filterStatus && r.status !== filterStatus) return false;

            if (filterSearch) {
                const searchLower = filterSearch.toLowerCase();
                const schoolName = r.schools?.name?.toLowerCase() || '';
                const desc = r.description?.toLowerCase() || '';
                if (!schoolName.includes(searchLower) && !desc.includes(searchLower)) return false;
            }

            return true;
        });
    }, [billingRecords, periodStart, periodEnd, filterSchoolId, filterStatus, filterSearch]);

    // STATS CALCULATION
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

    // Late calculation (ignores period filter to show accumulated debt)
    const totalLateAmount = useMemo(() => {
        const currentYearMonth = new Date().toISOString().slice(0, 7);
        return billingRecords
            .filter(r => {
                if (filterSchoolId && r.school_id !== filterSchoolId) return false;
                if (filterSearch) {
                    const searchLower = filterSearch.toLowerCase();
                    const schoolName = r.schools?.name?.toLowerCase() || '';
                    const desc = r.description?.toLowerCase() || '';
                    if (!schoolName.includes(searchLower) && !desc.includes(searchLower)) return false;
                }
                return r.status === 'Pendente' && r.reference_month < `${currentYearMonth}-01`;
            })
            .reduce((acc, curr) => acc + (Number(curr.amount) - (Number(curr.paid_amount) || 0)), 0);
    }, [billingRecords, filterSchoolId, filterSearch]);

    // HANDLERS
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
        if (isNaN(payVal) || payVal <= 0) {
            addToast('Valor de pagamento inválido', 'warning');
            return;
        }

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
        addToast('Pagamento registrado com sucesso!', 'success');
    };

    const handleConfirmEdit = () => {
        if (!editModal.record) return;
        const val = parseFloat(editAmount);
        if (isNaN(val) || val < 0) {
            addToast('Valor de cobrança inválido', 'warning');
            return;
        }

        onUpdateStatus({
            id: editModal.record.id,
            status: editModal.record.status,
            description: editDescription,
            amount: val,
            reference_month: `${editReferenceMonth}-01`
        });
        setEditModal({ open: false, record: null });
        addToast('Cobrança atualizada com sucesso!', 'success');
    };

    const handleCreateService = () => {
        if (!newItem.school_id || !newItem.amount || !newItem.description || !newItem.reference_month) {
            addToast('Preencha todos os campos obrigatórios', 'warning');
            return;
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
        addToast('Nova cobrança de serviço extra criada!', 'success');
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
            {/* Decomposed Stats Cards */}
            <BillingStatsCards
                total={stats.total}
                received={stats.received}
                pending={stats.pending}
                totalLateAmount={totalLateAmount}
            />

            {/* Toolbar: Actions & Filter Component */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                    <BillingFilters
                        showFilters={showFilters}
                        setShowFilters={setShowFilters}
                        periodStart={periodStart}
                        setPeriodStart={setPeriodStart}
                        periodEnd={periodEnd}
                        setPeriodEnd={setPeriodEnd}
                        filterSchoolId={filterSchoolId}
                        setFilterSchoolId={setFilterSchoolId}
                        filterSearch={filterSearch}
                        setFilterSearch={setFilterSearch}
                        filterStatus={filterStatus}
                        setFilterStatus={setFilterStatus}
                        schools={schools}
                        isAdmin={isAdmin}
                    />

                    <div className="flex flex-wrap gap-2 w-full md:w-auto h-fit items-center mt-2 md:mt-0">
                        {isAdmin && (
                            <>
                                <button
                                    onClick={() => setCreateModalOpen(true)}
                                    className="flex-1 md:flex-none px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all border border-white/5 active:scale-95"
                                >
                                    <span className="material-symbols-outlined text-[16px]">add_circle</span>
                                    Novo Extra
                                </button>
                                <button
                                    onClick={() => onGenerate(periodEnd + '-01')}
                                    className="flex-1 md:flex-none px-4 py-2 bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 border border-cyan-500/20 rounded-lg font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95"
                                    title="Gera cobranças para o mês final selecionado"
                                >
                                    <span className="material-symbols-outlined text-[16px]">sync</span>
                                    Gerar (Fim)
                                </button>
                            </>
                        )}
                        <button
                            onClick={handlePrintReport}
                            className="flex-1 md:flex-none px-6 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95"
                        >
                            <span className="material-symbols-outlined text-[18px]">print</span>
                            Imprimir
                        </button>
                    </div>
                </div>
            </div>

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

                        const progressBarStyle = { '--prog-width': `${progress}%` } as React.CSSProperties;

                        return (
                            <div key={record.id} className="bg-[#111a22] border border-white/5 p-5 rounded-2xl flex flex-col md:flex-row md:items-stretch justify-between gap-4 md:gap-6 hover:bg-white/[0.02] transition-all group overflow-hidden relative">
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
                                            {isAdmin && (
                                                <button
                                                    onClick={() => openEditModal(record)}
                                                    title="Editar Detalhes"
                                                    className="w-6 h-6 flex items-center justify-center rounded-full text-slate-600 hover:bg-white/10 hover:text-white transition-all opacity-50 group-hover:opacity-100"
                                                >
                                                    <span className="material-symbols-outlined text-[14px]">edit</span>
                                                </button>
                                            )}
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

                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-8 w-full md:w-auto mt-2 md:mt-0 border-t border-white/5 pt-4 md:border-0 md:pt-0 shrink-0">
                                    <div className="flex flex-row md:flex-col justify-between md:justify-end items-center md:items-end">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest md:block">Valor Total</span>
                                        <div className="text-right">
                                            <span className="text-lg font-black text-white">{formatCurrency(total)}</span>
                                            {paid > 0 && record.status !== 'Pago' && (
                                                <span className="text-[10px] font-bold text-emerald-500 block">Pago: {formatCurrency(paid)}</span>
                                            )}
                                        </div>
                                    </div>

                                    {record.status !== 'Pago' && (
                                        <div className="flex flex-col w-full md:w-auto gap-2">
                                            <button
                                                onClick={() => openPaymentModal(record)}
                                                disabled={!isAdmin}
                                                className={`h-10 w-full md:w-[180px] flex items-center justify-center rounded-lg font-bold text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95 whitespace-nowrap ${isAdmin
                                                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                                                    : 'bg-slate-700 text-slate-400 cursor-not-allowed shadow-none'
                                                    }`}
                                            >
                                                {isAdmin ? 'Informar Pagamento' : 'Aguardando Pagamento'}
                                            </button>
                                            {paid > 0 && (
                                                <span className="text-[10px] text-amber-500 font-bold text-center md:text-right w-full">Restam: {formatCurrency(remaining)}</span>
                                            )}
                                        </div>
                                    )}

                                    {record.status === 'Pago' && (
                                        <div className="flex items-center justify-between md:justify-end gap-2 w-full md:w-auto">
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
                                                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all flex-shrink-0"
                                                >
                                                    <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                                                </button>
                                                {isAdmin && (
                                                    <button
                                                        onClick={() => openPaymentModal(record)}
                                                        title="Editar Pagamento"
                                                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all flex-shrink-0"
                                                    >
                                                        <span className="material-symbols-outlined text-xs">edit</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Decomposed Modals */}
            <CreateBillingModal
                isOpen={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                schools={schools}
                newItem={newItem}
                setNewItem={setNewItem}
                onCreate={handleCreateService}
            />

            <EditBillingModal
                isOpen={editModal.open}
                onClose={() => setEditModal({ open: false, record: null })}
                record={editModal.record}
                description={editDescription}
                setDescription={setEditDescription}
                amount={editAmount}
                setAmount={setEditAmount}
                referenceMonth={editReferenceMonth}
                setReferenceMonth={setEditReferenceMonth}
                onConfirm={handleConfirmEdit}
            />

            <PaymentModal
                isOpen={paymentModal.open}
                onClose={() => setPaymentModal({ open: false, record: null })}
                record={paymentModal.record}
                amountToPay={amountToPay}
                setAmountToPay={setAmountToPay}
                paymentDate={paymentDate}
                setPaymentDate={setPaymentDate}
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                onConfirm={handleConfirmPayment}
            />

            <div className="p-4 bg-cyan-500/5 border border-cyan-500/10 rounded-2xl">
                <div className="flex gap-3">
                    <span className="material-symbols-outlined text-cyan-500">info</span>
                    <p className="text-xs text-slate-400 leading-relaxed font-medium">
                        <strong className="text-cyan-500 uppercase mr-1">Nota:</strong>
                        Este módulo é de uso exclusivo da <strong>BRN GROUP</strong>. Estes pagamentos referem-se à licença de uso do software e assessoria, pagos de forma externa pelos gestores, não impactando o livro caixa oficial das escolas cadastrado no sistema.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default BillingSection;
