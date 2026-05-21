import React from 'react';


interface ImportZoneProps {
    dragActive: boolean;
    setDragActive: (active: boolean) => void;
    uploadType: 'Conta Corrente' | 'Conta Investimento';
    setUploadType: (type: 'Conta Corrente' | 'Conta Investimento') => void;
    onFileUpload: (file: File, isNoMovement?: boolean) => void;
    filterMonth: string;
    selectedSchoolId: string;
    selectedBankAccountId: string;
    onShowStatus?: () => void;
}

const ImportZone: React.FC<ImportZoneProps> = ({
    dragActive, setDragActive, uploadType, setUploadType, onFileUpload, filterMonth,
    selectedSchoolId, selectedBankAccountId, onShowStatus
}) => {
    const isSelectionComplete = selectedSchoolId && selectedBankAccountId;
    const [isNoMovement, setIsNoMovement] = React.useState(false);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            onFileUpload(file, isNoMovement);
        }
    };

    return (
        <div
            className={`border-2 border-dashed rounded-3xl p-16 flex flex-col items-center justify-center gap-4 transition-all ${dragActive ? 'border-primary bg-primary/5' : 'border-white/10 bg-card-dark/30'} ${!isSelectionComplete ? 'opacity-75 grayscale-[0.5]' : ''}`}
            onDragOver={(e) => { e.preventDefault(); if (isSelectionComplete) setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => { e.preventDefault(); setDragActive(false); if (isSelectionComplete && e.dataTransfer.files[0]) onFileUpload(e.dataTransfer.files[0], isNoMovement); }}
        >
            <div className={`w-20 h-20 rounded-full flex items-center justify-center ${!isSelectionComplete ? 'bg-amber-500/10 text-amber-500' : 'bg-white/5 text-slate-500'}`}>
                <span className="material-symbols-outlined text-4xl">{!isSelectionComplete ? 'warning' : 'upload_file'}</span>
            </div>
            <div className="text-center">
                <h3 className="text-white font-bold text-lg">Importar Extrato Bancário</h3>
                {!isSelectionComplete ? (
                    <div className="flex flex-col items-center gap-2 mt-2">
                        <p className="text-amber-500 text-sm font-bold bg-amber-500/10 px-4 py-2 rounded-xl border border-amber-500/20">
                            Atenção: Selecione a Escola e a Conta primeiro
                        </p>
                        <p className="text-slate-500 text-[10px] uppercase font-black tracking-widest">Use os filtros no topo da página</p>
                    </div>
                ) : (
                    <p className="text-slate-500 text-sm max-w-xs mx-auto">Selecione o tipo e importe o extrato de <strong>{new Date(filterMonth + '-02').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</strong>.</p>
                )}
            </div>

            <div className="flex bg-black/20 p-1 rounded-2xl border border-white/5">
                <button
                    onClick={() => setUploadType('Conta Corrente')}
                    className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${uploadType === 'Conta Corrente' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-500 hover:text-white'}`}
                >
                    Conta Corrente
                </button>
                <button
                    onClick={() => setUploadType('Conta Investimento')}
                    className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${uploadType === 'Conta Investimento' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'text-slate-500 hover:text-white'}`}
                >
                    Investimento
                </button>
            </div>

            <div className="flex items-center gap-2 mt-2">
                <label className="flex items-center gap-2 cursor-pointer bg-white/5 px-4 py-2 rounded-xl hover:bg-white/10 transition-all border border-white/5">
                    <input
                        type="checkbox"
                        checked={isNoMovement}
                        onChange={(e) => setIsNoMovement(e.target.checked)}
                        disabled={!isSelectionComplete}
                        className="w-4 h-4 rounded border-white/20 bg-black/40 text-primary focus:ring-primary/50 cursor-pointer"
                    />
                    <span className="text-[11px] font-black uppercase text-slate-300">Mês Sem Movimento (Envia Apenas PDF)</span>
                </label>
            </div>

            <div className="flex flex-col md:flex-row gap-3">
                <label className={`px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg ${!isSelectionComplete ? 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-50' : 'bg-primary hover:bg-primary/90 text-white cursor-pointer active:scale-95 shadow-primary/20'}`}>
                    Selecionar Arquivo
                    <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.ofx,.ofc,.csv"
                        onChange={handleFileChange}
                        disabled={!isSelectionComplete}
                    />
                </label>

                {isSelectionComplete && onShowStatus && (
                    <button
                        onClick={onShowStatus}
                        className="px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs transition-all bg-white/5 hover:bg-white/10 text-white border border-white/10 active:scale-95 shadow-lg"
                    >
                        Ver Status Atual
                    </button>
                )}
            </div>
            <div className="flex flex-col items-center gap-1">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">
                    DATA (.OFX, .CSV): Processa os lançamentos automaticamente
                </p>
                <div className="w-1 h-1 rounded-full bg-white/10"></div>
                <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-tight">
                    DOCUMENTO (.PDF): Guarda o extrato oficial para auditoria
                </p>
            </div>
        </div>
    );
};

export default ImportZone;
