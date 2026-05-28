
import React from 'react';
import { TransactionStatus } from '../../types';

interface StatsCardsProps {
    stats: {
        income: number;
        expense: number;
        balance: number;
        pending: number;
        repasses: number;
        rendimentos: number;
        tarifas: number;
        reprogrammed: number;
        impostosDevolucoes?: number;
        reembolsos?: number;
    };
}

const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
    const totalAccountBalance = stats.balance + (stats.reprogrammed || 0);
    const reservesAndEarnings = (stats.reprogrammed || 0) + stats.rendimentos;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 min-[1400px]:grid-cols-4 gap-4 md:gap-6">
            {/* CARD 1: SALDO TOTAL */}
            <div className="group bg-surface-dark border border-blue-500/20 p-4 sm:p-5 lg:p-6 rounded-2xl shadow-xl transition-all hover:border-blue-500/40 hover:bg-blue-500/5 min-w-0 overflow-hidden">
                <div className="flex justify-between items-start mb-2">
                    <span className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest truncate">Saldo Total Disponível</span>
                    <span className="material-symbols-outlined text-blue-500 text-[20px] opacity-50 group-hover:opacity-100 shrink-0">account_balance_wallet</span>
                </div>
                <div className="text-lg lg:text-xl min-[1400px]:text-2xl font-black text-white whitespace-nowrap truncate" title={totalAccountBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}>{totalAccountBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                <div className="mt-2 flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>
                        <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase truncate" title={`Sendo ${stats.reprogrammed.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} Reprogramado`}>Sendo {stats.reprogrammed.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} Reprogramado</span>
                    </div>
                    {stats.reembolsos !== undefined && stats.reembolsos > 0 && (
                        <div className="flex items-center gap-1.5 min-w-0 animate-in fade-in duration-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                            <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase truncate" title={`Sendo ${stats.reembolsos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} Reembolsos/Estornos`}>Sendo {stats.reembolsos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} Reembolsos/Estornos</span>
                        </div>
                    )}
                </div>
                </div>
            </div>

            {/* CARD 2: REPASSES */}
            <div className="group bg-surface-dark border border-green-500/20 p-4 sm:p-5 lg:p-6 rounded-2xl shadow-xl transition-all hover:border-green-500/40 hover:bg-green-500/5 min-w-0 overflow-hidden">
                <div className="flex justify-between items-start mb-2">
                    <span className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest truncate">Novos Repasses</span>
                    <span className="material-symbols-outlined text-green-500 text-[20px] opacity-50 group-hover:opacity-100 shrink-0">trending_up</span>
                </div>
                <div className="text-lg lg:text-xl min-[1400px]:text-2xl font-black text-green-400 whitespace-nowrap truncate" title={stats.repasses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}>{stats.repasses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                <div className="mt-2 flex items-center gap-1.5 min-w-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0"></span>
                    <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase truncate">Recebimentos no Período</span>
                </div>
            </div>

            {/* CARD 3: RESERVAS & RENDIMENTOS */}
            <div className="group bg-surface-dark border border-orange-500/20 p-4 sm:p-5 lg:p-6 rounded-2xl shadow-xl transition-all hover:border-orange-500/40 hover:bg-orange-500/5 min-w-0 overflow-hidden">
                <div className="flex justify-between items-start mb-2">
                    <span className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest truncate">Reserva & Rendimentos</span>
                    <span className="material-symbols-outlined text-orange-500 text-[20px] opacity-50 group-hover:opacity-100 shrink-0">savings</span>
                </div>
                <div className="text-lg lg:text-xl min-[1400px]:text-2xl font-black text-orange-400 whitespace-nowrap truncate" title={reservesAndEarnings.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}>{reservesAndEarnings.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                <div className="mt-2 flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0"></span>
                        <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase truncate" title={`Reprogramado: ${stats.reprogrammed.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`}>Reprogramado: {stats.reprogrammed.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    </div>
                    {stats.rendimentos > 0 && (
                        <div className="flex items-center gap-1.5 min-w-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 shrink-0"></span>
                            <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase truncate" title={`Rendimentos: ${stats.rendimentos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`}>Rendimentos: {stats.rendimentos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* CARD 4: DESPESAS */}
            <div className="group bg-surface-dark border border-red-500/20 p-4 sm:p-5 lg:p-6 rounded-2xl shadow-xl transition-all hover:border-red-500/40 hover:bg-red-500/5 min-w-0 overflow-hidden">
                <div className="flex justify-between items-start mb-2">
                    <span className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest truncate">Execução (Saídas)</span>
                    <span className="material-symbols-outlined text-red-500 text-[20px] opacity-50 group-hover:opacity-100 shrink-0">trending_down</span>
                </div>
                <div className="text-lg lg:text-xl min-[1400px]:text-2xl font-black text-red-400 whitespace-nowrap truncate" title={stats.expense.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}>{stats.expense.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                <div className="mt-2 flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>
                        <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase truncate" title={`Tarifas: ${stats.tarifas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`}>Tarifas: {stats.tarifas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    </div>
                    {(stats.impostosDevolucoes || 0) > 0 && (
                        <div className="flex items-center gap-1.5 min-w-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0"></span>
                            <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase truncate" title={`Impostos/Dev: ${stats.impostosDevolucoes?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`}>Impostos/Dev: {stats.impostosDevolucoes?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StatsCards;
