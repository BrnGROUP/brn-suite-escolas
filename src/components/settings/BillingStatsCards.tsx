import React from 'react';
import { formatCurrency } from '../../lib/printUtils';

interface BillingStatsCardsProps {
    total: number;
    received: number;
    pending: number;
    totalLateAmount: number;
}

export const BillingStatsCards: React.FC<BillingStatsCardsProps> = ({
    total,
    received,
    pending,
    totalLateAmount
}) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-[#111a22] p-6 rounded-2xl border border-white/5 flex flex-col gap-1">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total no Período</span>
                <span className="text-2xl font-black text-white">{formatCurrency(total)}</span>
            </div>
            <div className="bg-emerald-500/5 p-6 rounded-2xl border border-emerald-500/10 flex flex-col gap-1">
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Recebido</span>
                <span className="text-2xl font-black text-emerald-500">{formatCurrency(received)}</span>
            </div>
            <div className="bg-amber-500/5 p-6 rounded-2xl border border-amber-500/10 flex flex-col gap-1">
                <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Pendente</span>
                <span className="text-2xl font-black text-amber-500">{formatCurrency(pending)}</span>
            </div>
            <div className="bg-red-500/5 p-6 rounded-2xl border border-red-500/10 flex flex-col gap-1">
                <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Em Atraso (Geral)</span>
                <span className="text-2xl font-black text-red-500">{formatCurrency(totalLateAmount)}</span>
            </div>
        </div>
    );
};
