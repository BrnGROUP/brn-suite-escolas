import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../common/Card';
import Button from '../common/Button';

interface DashboardAlertsProps {
    alerts: any[];
    selectedAlert: any | null;
    setSelectedAlert: (alert: any | null) => void;
}

const DashboardAlerts: React.FC<DashboardAlertsProps> = ({ alerts, selectedAlert, setSelectedAlert }) => {
    const navigate = useNavigate();
    const [activeAlertTab, setActiveAlertTab] = useState<'Tudo' | 'Auditoria' | 'Gestão' | 'Financeiro' | 'Sistema' | 'Conciliação'>('Tudo');
    const [alertSchoolSearch, setAlertSchoolSearch] = useState('');

    const filtered = (activeAlertTab === 'Tudo' ? alerts : alerts.filter((a: any) => a.category === activeAlertTab))
        .filter((a: any) => !alertSchoolSearch || (a.schoolName || '').toUpperCase().includes(alertSchoolSearch.toUpperCase()));

    // Group by School
    const groups: Record<string, any[]> = {};
    filtered.forEach((a: any) => {
        const key = a.schoolName || 'Geral';
        if (!groups[key]) groups[key] = [];
        groups[key].push(a);
    });

    const handleExportCSV = () => {
        if (filtered.length === 0) return;
        const headers = ['Data', 'Escola', 'Categoria', 'Severidade', 'Título', 'Descrição'];
        const rows = filtered.map(a => [
            new Date(a.timestamp).toLocaleString('pt-BR'),
            `"${a.schoolName ? `CONSELHO ESCOLAR DA ESCOLA ESTADUAL ${a.schoolName.toUpperCase()}` : 'Geral'}"`,
            a.category,
            a.severity,
            `"${a.title.replace(/"/g, '""')}"`,
            `"${a.description.replace(/"/g, '""')}"`
        ]);

        const csvContent = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `relatorio_alertas_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportPDF = () => {
        if (filtered.length === 0) return;

        const html = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <title>Relatório de Alertas</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
                body { font-family: 'Inter', sans-serif; padding: 40px; color: #0f172a; background: #fff; }
                h1 { font-size: 24px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 5px; color: #0f172a; }
                p.subtitle { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; margin-bottom: 40px; }
                .school-group { margin-bottom: 40px; }
                .school-title { font-size: 14px; font-weight: 900; text-transform: uppercase; border-bottom: 2px solid #0f172a; padding-bottom: 5px; margin-bottom: 15px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 10px; }
                th { text-align: left; padding: 10px; background: #f8fafc; font-weight: 900; text-transform: uppercase; color: #475569; border-bottom: 2px solid #e2e8f0; }
                td { padding: 10px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
                .severity-critico { color: #dc2626; font-weight: bold; }
                .severity-medio, .severity-atencao { color: #d97706; font-weight: bold; }
                .meta { font-size: 8px; color: #94a3b8; font-family: monospace; white-space: nowrap; }
                .title { font-weight: bold; margin-bottom: 4px; font-size: 11px; }
                .desc { color: #475569; }
                @media print {
                    body { padding: 0; }
                    .no-print { display: none; }
                    .page-break { page-break-after: always; }
                }
            </style>
        </head>
        <body>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px;">
                <div>
                    <h1>Relatório de Alertas</h1>
                    <p class="subtitle">Categoria: ${activeAlertTab} | Escolas: ${alertSchoolSearch || 'Todas'}</p>
                </div>
                <div style="text-align: right;">
                    <p style="font-size: 10px; font-weight: bold; margin: 0;">EMITIDO EM</p>
                    <p style="font-size: 14px; font-weight: 900; margin: 0;">${new Date().toLocaleDateString('pt-BR')}</p>
                    <p style="font-size: 10px; color: #64748b; margin: 0;">${new Date().toLocaleTimeString('pt-BR')}</p>
                </div>
            </div>

            ${Object.entries(groups).map(([schoolName, schoolAlerts]) => `
                <div class="school-group text-left">
                    <div class="school-title">${schoolName !== 'Geral' ? `CONSELHO ESCOLAR DA ESCOLA ESTADUAL ${schoolName.toUpperCase()}` : 'Geral'} <span style="color: #64748b; font-size: 10px; margin-left: 10px;">(${schoolAlerts.length} alertas)</span></div>
                    <table style="width: 100%;">
                        <thead>
                            <tr>
                                <th style="width: 120px;">Data/Hora</th>
                                <th style="width: 80px;">Grau</th>
                                <th style="width: 100px;">Categoria</th>
                                <th>Alerta / Detalhamento</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${schoolAlerts.map(alert => `
                                <tr>
                                    <td class="meta">${new Date(alert.timestamp).toLocaleString('pt-BR')}</td>
                                    <td class="${alert.severity === 'Crítico' ? 'severity-critico' : 'severity-medio'}">${alert.severity}</td>
                                    <td style="font-weight: bold; color: #64748b;">${alert.category}</td>
                                    <td>
                                        <div class="title">${alert.title}</div>
                                        <div class="desc">${alert.description}</div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `).join('')}

            <div class="no-print" style="margin-top: 40px; display: flex; gap: 10px; justify-content: center;">
                <button onclick="window.print()" style="background: #0f172a; color: white; padding: 12px 24px; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">Imprimir / Salvar PDF</button>
                <button onclick="window.close()" style="background: #ef4444; color: white; padding: 12px 24px; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">Fechar</button>
            </div>
        </body>
        </html>
        `;

        const w = window.open('', '_blank');
        if (w) {
            w.document.write(html);
            w.document.close();
        }
    };

    return (
        <section className="bg-card-dark border border-border-dark rounded-xl flex flex-col overflow-hidden min-h-[300px]">
            <div className="flex flex-col sm:flex-row border-b border-border-dark bg-[#111a22]">
                <div className="px-6 py-4 flex items-center gap-2 border-r border-border-dark/50">
                    <span className="material-symbols-outlined text-primary text-[20px]">notification_important</span>
                    <span className="text-sm font-bold text-white uppercase tracking-widest whitespace-nowrap">Alertas do Sistema</span>
                </div>

                <div className="flex-1 flex overflow-x-auto scrollbar-hide border-r border-border-dark/50">
                    {(['Tudo', 'Auditoria', 'Gestão', 'Financeiro', 'Sistema', 'Conciliação'] as const).map(tab => {
                        const count = tab === 'Tudo' ? alerts.length : alerts.filter((a: any) => a.category === tab).length;
                        return (
                            <button
                                key={tab}
                                onClick={() => setActiveAlertTab(tab)}
                                className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all border-b-2 whitespace-nowrap ${activeAlertTab === tab ? 'text-primary border-primary bg-primary/5' : 'text-slate-500 border-transparent hover:text-slate-300'
                                    }`}
                            >
                                {tab}
                                {count > 0 && (
                                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] ${tab === 'Auditoria' || tab === 'Gestão' || tab === 'Conciliação' ? 'bg-red-500 text-white' : 'bg-slate-700 text-slate-300'
                                        }`}>
                                        {count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                <div className="px-4 py-2 flex items-center gap-2 bg-white/[0.02]">
                    <div className="flex items-center gap-2 border-r border-white/10 pr-4 mr-2">
                        {filtered.length > 0 && (
                            <>
                                <button onClick={handleExportPDF} title="Baixar PDF de Alertas" className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all">
                                    <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
                                </button>
                                <button onClick={handleExportCSV} title="Baixar Excel/CSV de Alertas" className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all">
                                    <span className="material-symbols-outlined text-[16px]">grid_on</span>
                                </button>
                            </>
                        )}
                    </div>
                    <span className="material-symbols-outlined text-slate-500 text-sm">search</span>
                    <input
                        type="text"
                        placeholder="BUSCAR ESCOLA..."
                        value={alertSchoolSearch}
                        onChange={e => setAlertSchoolSearch(e.target.value.toUpperCase())}
                        className="bg-transparent border-none outline-none text-[10px] font-black text-white placeholder:text-slate-600 w-32 md:w-48 tracking-widest"
                    />
                </div>
            </div >

            <div className="p-6">
                {alerts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-500 opacity-60">
                        <span className="material-symbols-outlined text-5xl mb-4">check_circle</span>
                        <p className="font-bold uppercase tracking-widest text-[10px]">Tudo azul! Nenhum alerta pendente.</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-slate-500 animate-in fade-in">
                        <span className="material-symbols-outlined text-3xl mb-2">search_off</span>
                        <p className="text-[10px] font-black uppercase tracking-widest">Nenhum alerta nesta categoria/busca.</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-8">
                        {Object.entries(groups).map(([schoolName, schoolAlerts]) => (
                            <div key={schoolName} className="flex flex-col gap-4 animate-in fade-in slide-in-from-left-4">
                                <div className="flex items-center gap-3 px-2">
                                    <div className="w-1 h-4 bg-primary rounded-full" />
                                    <span className="text-xs font-black text-white uppercase tracking-widest">{schoolName}</span>
                                    <span className="text-[10px] text-slate-500 font-bold bg-white/5 px-2 py-0.5 rounded-full">{schoolAlerts.length}</span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {schoolAlerts.map(alert => (
                                        <Card
                                            key={alert.id}
                                            onClick={() => setSelectedAlert(alert)}
                                            className={`p-5 flex flex-col gap-4 hover:bg-background-dark/30 shadow-lg text-left group h-full border ${alert.severity === 'Crítico' ? 'border-red-500/20 hover:border-red-500/50' : 'border-orange-500/20 hover:border-orange-500/50'
                                                }`}
                                            animate={false}
                                        >
                                            <div className="flex items-center justify-between gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${alert.severity === 'Crítico' ? 'bg-red-500/10 text-red-500' : 'bg-orange-500/10 text-orange-500'
                                                    }`}>
                                                    <span className="material-symbols-outlined">{alert.severity === 'Crítico' ? 'error' : 'warning'}</span>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${alert.severity === 'Crítico' ? 'text-red-400 bg-red-400/5 border-red-400/20' : 'text-orange-400 bg-orange-400/5 border-orange-400/20'
                                                        }`}>
                                                        {alert.severity}
                                                    </span>
                                                    <span className="text-[8px] text-slate-600 font-mono mt-1">
                                                        {new Date(alert.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                            <div>
                                                <h4 className="text-white font-bold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">{alert.title}</h4>
                                                <p className="text-slate-500 text-[11px] mt-2 leading-relaxed line-clamp-2">{alert.description}</p>
                                            </div>
                                            <div className="pt-2 border-t border-border-dark/30 flex items-center justify-end mt-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="text-[10px] text-primary font-black uppercase tracking-tighter flex items-center gap-1">
                                                    Resolver
                                                    <span className="material-symbols-outlined text-xs">chevron_right</span>
                                                </span>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Alert Detail Modal (Rendered here for simplicity, but could be separate) */}
            {
                selectedAlert && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                        <div className="bg-[#1e293b] border border-[#334155] w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
                            <div className={`h-2 w-full ${selectedAlert.severity === 'Crítico' ? 'bg-red-500' : 'bg-orange-500'}`}></div>
                            <div className="p-8">
                                <div className="flex justify-between items-start mb-6">
                                    <div className={`p-4 rounded-2xl ${selectedAlert.severity === 'Crítico' ? 'bg-red-500/10 text-red-500' : 'bg-orange-500/10 text-orange-500'}`}>
                                        <span className="material-symbols-outlined text-3xl">{selectedAlert.severity === 'Crítico' ? 'error' : 'warning'}</span>
                                    </div>
                                    <button onClick={() => setSelectedAlert(null)} className="p-2 hover:bg-white/5 rounded-full text-slate-500 hover:text-white transition-all">
                                        <span className="material-symbols-outlined">close</span>
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${selectedAlert.severity === 'Crítico' ? 'text-red-400 border-red-400/30' : 'text-orange-400 border-orange-400/30'
                                            }`}>
                                            Alerta {selectedAlert.severity}
                                        </span>
                                        <span className="text-slate-500 text-xs font-mono">{new Date(selectedAlert.timestamp).toLocaleString('pt-BR')}</span>
                                    </div>

                                    <h3 className="text-2xl font-black text-white leading-tight">
                                        {selectedAlert.title}
                                    </h3>

                                    <p className="text-slate-400 text-sm leading-relaxed bg-[#0f172a]/50 p-6 rounded-3xl border border-[#334155]/50 italic">
                                        "{selectedAlert.description}"
                                    </p>

                                    <div className="pt-6 flex flex-col gap-3">
                                        <Button
                                            onClick={() => {
                                                setSelectedAlert(null);
                                                navigate('/notifications');
                                            }}
                                            className="w-full"
                                            size="lg"
                                            icon="notifications"
                                        >
                                            Ir para Central de Notificações
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            onClick={() => setSelectedAlert(null)}
                                            className="w-full"
                                            size="lg"
                                        >
                                            Fechar
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </section >
    );
};

export default DashboardAlerts;
