import React from 'react';
import Card from '../common/Card';

interface DashboardStatsProps {
    stats: {
        totalDisponivel: number;
        reprogramado: number;
        repasses: number;
        rendimentos: number;
        despesa: number;
        tarifas: number;
        impostosDevolucoes: number;
        reembolsos?: number;
    };
    loading: boolean;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ stats, loading }) => {
    const formatCurrency = (val: number) => {
        return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    if (loading) {
        return (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {[1, 2, 3, 4].map(i => (
                    <Card key={i} className="h-28 md:h-32 animate-pulse p-4 md:p-6 flex flex-col gap-4">
                        <div className="h-2 w-24 bg-white/5 rounded"></div>
                        <div className="h-6 w-32 bg-white/5 rounded"></div>
                    </Card>
                ))}
            </div>
        );
    }

    const cards = [
        {
            label: 'Saldo Total',
            value: formatCurrency(stats.totalDisponivel),
            subtitle: `Sendo ${formatCurrency(stats.reprogramado)} reprogramado`,
            icon: 'account_balance',
            color: 'text-blue-400',
            bg: 'bg-blue-500/5',
            border: 'border-blue-500/20'
        },
        {
            label: 'Novos Repasses',
            value: formatCurrency(stats.repasses),
            subtitle: 'Recebimentos no período',
            icon: 'trending_up',
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/5',
            border: 'border-emerald-500/20'
        },
        {
            label: 'Reserva & Rend.',
            value: formatCurrency(stats.reprogramado + stats.rendimentos),
            subtitle: 'Saldo anterior + Juros',
            icon: 'savings',
            color: 'text-orange-400',
            bg: 'bg-orange-500/5',
            border: 'border-orange-500/20'
        },
        {
            label: 'Execução (Saídas)',
            value: formatCurrency(stats.despesa),
            subtitle: `Tarifas: ${formatCurrency(stats.tarifas)}${stats.impostosDevolucoes > 0 ? ` + Imp/Dev: ${formatCurrency(stats.impostosDevolucoes)}` : ''}`,
            icon: 'trending_down',
            color: 'text-red-400',
            bg: 'bg-red-500/5',
            border: 'border-red-500/20'
        }
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
            {cards.map((stat, i) => {
                // Specialized rendering for Reserva & Rend. detailing
                const isReservoirCard = stat.label === 'Reserva & Rend.';
                const isSaldoTotalCard = stat.label === 'Saldo Total';

                return (
                    <Card
                        key={i}
                        className={`p-4 md:p-6 flex flex-col gap-1 relative overflow-hidden group border ${stat.border} ${stat.bg} shadow-xl hover:scale-[1.02]`}
                        animate={false}
                    >
                        <div className={`absolute -right-2 -bottom-2 opacity-10 group-hover:opacity-20 transition-opacity`}>
                            <span className={`material-symbols-outlined text-6xl md:text-8xl ${stat.color}`}>{stat.icon}</span>
                        </div>
                        <p className="text-slate-500 text-[8px] md:text-[10px] font-black uppercase tracking-widest truncate">{stat.label}</p>
                        <div className="flex flex-col mt-1">
                            <h3 className="text-white text-base sm:text-lg md:text-3xl font-black tracking-tight">{stat.value}</h3>

                            {isReservoirCard ? (
                                <div className="mt-1 flex flex-col gap-0.5">
                                    <div className="flex items-center gap-1">
                                        <div className="w-1 h-1 rounded-full bg-orange-500 shrink-0"></div>
                                        <span className="text-[7px] md:text-[9px] text-slate-400 font-bold uppercase truncate">
                                            Reprog: {formatCurrency(stats.reprogramado)}
                                        </span>
                                    </div>
                                    {stats.rendimentos > 0 && (
                                        <div className="flex items-center gap-1">
                                            <div className="w-1 h-1 rounded-full bg-yellow-500 shrink-0"></div>
                                            <span className="text-[7px] md:text-[9px] text-slate-400 font-bold uppercase truncate">
                                                Rend: {formatCurrency(stats.rendimentos)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ) : isSaldoTotalCard && stats.reembolsos !== undefined && stats.reembolsos > 0 ? (
                                <div className="mt-1 flex flex-col gap-0.5 animate-in fade-in duration-300">
                                    <div className="flex items-center gap-1">
                                        <div className="w-1 h-1 rounded-full bg-blue-500 shrink-0"></div>
                                        <span className="text-[7px] md:text-[9px] text-slate-400 font-bold uppercase truncate">
                                            Reprog: {formatCurrency(stats.reprogramado)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <div className="w-1 h-1 rounded-full bg-emerald-500 shrink-0"></div>
                                        <span className="text-[7px] md:text-[9px] text-slate-400 font-bold uppercase truncate">
                                            Reembolsos: {formatCurrency(stats.reembolsos)}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <span className="text-[8px] md:text-[10px] text-slate-400 font-bold mt-1 uppercase line-clamp-1">
                                    {stat.subtitle}
                                </span>
                            )}
                        </div>
                    </Card>
                );
            })}
        </div>
    );
};

export default DashboardStats;
