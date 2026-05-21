import React from 'react';
import {
    ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, Line, PieChart, Pie, Cell
} from 'recharts';
import Card from '../common/Card';

const COLORS = ['#137fec', '#0bda5b', '#fb923c', '#94a3b8'];

const ChartEmptyState: React.FC<{ message: string, icon: string }> = ({ message, icon }) => (
    <div className="flex flex-col items-center justify-center h-full w-full py-12 text-center animate-in fade-in zoom-in duration-700">
        <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center mb-6 border border-white/10 shadow-2xl relative group">
            <div className="absolute inset-0 bg-primary/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <span className="material-symbols-outlined text-5xl text-text-secondary opacity-40 relative z-10">{icon}</span>
        </div>
        <h4 className="text-white/80 font-bold text-sm mb-2">Sem dados no período</h4>
        <p className="text-text-secondary text-xs max-w-[240px] leading-relaxed px-4">{message}</p>
    </div>
);

interface DashboardChartsProps {
    flowData: any[];
    pieData: any[];
}

const DashboardCharts: React.FC<DashboardChartsProps> = ({ flowData, pieData }) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 p-6 flex flex-col min-h-[400px]" animate={false}>
                <div className="mb-6">
                    <h3 className="text-white font-bold text-lg">Fluxo de Caixa</h3>
                    <p className="text-text-secondary text-sm">Comparativo Receita vs Despesa (Mensal)</p>
                </div>
                <div className="flex-1 w-full min-h-[300px]">
                    {flowData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={flowData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#2d3f52" vertical={false} />
                                <XAxis dataKey="name" stroke="#92adc9" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#92adc9" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value / 1000}k`} />
                                <Tooltip
                                    formatter={(value: any) =>
                                        new Intl.NumberFormat('pt-BR', {
                                            style: 'currency',
                                            currency: 'BRL'
                                        }).format(Number(value || 0))
                                    }
                                    contentStyle={{ backgroundColor: '#1c2936', borderColor: '#2d3f52', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)' }}
                                    itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                                    labelStyle={{ color: '#94a3b8', fontSize: '10px', fontWeight: 'black', textTransform: 'uppercase', marginBottom: '4px' }}
                                />
                                <Legend iconType="circle" />
                                <Bar dataKey="receita" fill="#10b981" radius={[4, 4, 0, 0]} name="Receita" />
                                <Bar dataKey="despesa" fill="#ef4444" radius={[4, 4, 0, 0]} name="Despesa" />
                                <Line type="monotone" dataKey="saldoAcumulado" stroke="#3b82f6" strokeWidth={3} name="Saldo em Conta" dot={{ r: 4 }} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    ) : (
                        <ChartEmptyState
                            message="Não encontramos lançamentos financeiros com os filtros aplicados para gerar o comparativo mensal."
                            icon="bar_chart_4_bars"
                        />
                    )}
                </div>
            </Card>

            <Card className="p-6 flex flex-col min-h-[400px]" animate={false}>
                <div className="mb-6">
                    <h3 className="text-white font-bold text-lg">Resumo</h3>
                    <p className="text-text-secondary text-sm">Distribuição Estimada</p>
                </div>
                <div className="flex-1 w-full flex items-center justify-center min-h-[300px]">
                    {pieData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieData.map((_entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value: any) =>
                                        new Intl.NumberFormat('pt-BR', {
                                            style: 'currency',
                                            currency: 'BRL'
                                        }).format(Number(value || 0))
                                    }
                                    contentStyle={{ backgroundColor: '#1c2936', border: 'none', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)' }}
                                    itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                                />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <ChartEmptyState
                            message="A distribuição por natureza de despesa será exibida assim que houverem pagamentos registrados."
                            icon="pie_chart"
                        />
                    )}
                </div>
            </Card>
        </div>
    );
};

export default DashboardCharts;
