import * as React from 'react';

interface AuditLogTabProps {
    entryLogs: any[];
}

export const AuditLogTab: React.FC<AuditLogTabProps> = ({ entryLogs }) => {
    return (
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <div className="flex flex-col gap-6 relative before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-[2px] before:bg-white/5">
                {entryLogs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-4">
                        <span className="material-symbols-outlined text-5xl opacity-20">history_toggle_off</span>
                        <p className="text-sm italic">Nenhuma alteração registrada.</p>
                    </div>
                ) : (
                    entryLogs.map((log, idx) => (
                        <div key={log.id || idx} className="relative pl-10">
                            <div className="absolute left-0 top-1.5 w-9 h-9 rounded-xl bg-[#1e293b] border border-white/10 flex items-center justify-center z-10">
                                <span className="material-symbols-outlined text-[18px] text-cyan-400">
                                    {log.action === 'CREATE' ? 'add_circle' : 'edit'}
                                </span>
                            </div>
                            <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <span className="text-xs font-black text-white uppercase">{log.user_name || 'Sistema'}</span>
                                        <p className="text-[10px] text-slate-500 mt-0.5">{new Date(log.timestamp).toLocaleString('pt-BR')}</p>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${log.action === 'CREATE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-cyan-500/10 text-cyan-400'}`}>
                                        {log.action === 'CREATE' ? 'Criação' : 'Alteração'}
                                    </span>
                                </div>
                                {log.changes ? (
                                    <div className="flex flex-col gap-2 mt-3">
                                        {Object.entries(log.changes).map(([field, values]: [string, any]) => (
                                            <div key={field} className="text-[11px] bg-black/20 rounded-lg p-2 border border-white/[0.02]">
                                                <span className="text-slate-500 font-bold uppercase">{field}:</span> 
                                                <span className="text-red-400 line-through mx-1">{String(values.old)}</span> 
                                                <span className="text-emerald-400">{String(values.new)}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-400 italic mt-2">{log.details || 'Sem detalhes adicionais.'}</p>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
