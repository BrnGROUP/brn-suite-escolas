import React from 'react';
import { useNavigate } from 'react-router-dom';

const ClosureSection: React.FC<any> = () => {
    const navigate = useNavigate();

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="card pb-8 overflow-hidden p-8 flex flex-col items-center justify-center text-center min-h-[300px]">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 mb-4">
                    <span className="material-symbols-outlined text-4xl">event_repeat</span>
                </div>
                <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-wider">
                    Fechamento Semestral
                </h3>
                <p className="text-sm text-slate-500 max-w-md mt-2 mb-6">
                    O encerramento de exercício foi aprimorado e agora conta com uma página dedicada, com validações detalhadas, relatórios em PDF e controle granular por rubricas e contas.
                </p>
                <button
                    onClick={() => navigate('/fechamento')}
                    className="btn-primary bg-amber-500 hover:bg-amber-600 shadow-amber-500/20 px-8 py-3 flex items-center gap-2"
                >
                    <span className="material-symbols-outlined">directions</span>
                    Ir para Página de Fechamento
                </button>
            </div>
        </div>
    );
};

export default ClosureSection;
