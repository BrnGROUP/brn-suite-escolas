import React from 'react';
import { School } from '../../types';

interface SchoolCardProps {
  school: School;
  canEdit: boolean;
  canDelete: boolean;
  isFetchingContract: boolean;
  onEdit: (school: School) => void;
  onDelete: (id: string) => void;
  onViewContract: (school: School) => void;
}

export const SchoolCard: React.FC<SchoolCardProps> = ({
  school,
  canEdit,
  canDelete,
  isFetchingContract,
  onEdit,
  onDelete,
  onViewContract,
}) => {
  return (
    <div
      className={`bg-surface-dark border border-surface-border rounded-2xl overflow-hidden shadow-xl hover:border-primary/50 transition-all group ${
        !school.active ? 'opacity-60 saturate-50' : ''
      }`}
    >
      <div className="h-32 bg-gradient-to-r from-primary/20 to-blue-600/20 relative">
        <div className="absolute top-4 left-4 z-10">
          {school.active ? (
            <span className="bg-emerald-500/20 text-emerald-500 text-[10px] font-black px-2.5 py-1 rounded-full border border-emerald-500/30 uppercase tracking-widest backdrop-blur-md">
              Ativo
            </span>
          ) : (
            <span className="bg-red-500/20 text-red-500 text-[10px] font-black px-2.5 py-1 rounded-full border border-red-500/30 uppercase tracking-widest backdrop-blur-md">
              Inativo
            </span>
          )}
        </div>
        
        {school.image_url ? (
          <img
            src={school.image_url}
            alt={school.name}
            className="w-24 h-24 rounded-2xl object-cover absolute -bottom-6 left-6 border-4 border-[#0f172a] shadow-2xl"
          />
        ) : (
          <div className="w-24 h-24 rounded-2xl bg-[#0f172a] flex items-center justify-center absolute -bottom-6 left-6 border-4 border-[#0f172a] shadow-2xl">
            <span className="material-symbols-outlined text-4xl text-primary">school</span>
          </div>
        )}

        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {canEdit && (
            <button
              onClick={() => onEdit(school)}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-md p-2 rounded-lg text-white transition-colors"
              title="Editar escola"
              aria-label="Editar escola"
            >
              <span className="material-symbols-outlined text-sm">edit</span>
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => onDelete(school.id)}
              className="bg-red-500/20 hover:bg-red-500/40 backdrop-blur-md p-2 rounded-lg text-red-400 transition-colors"
              title="Excluir escola"
              aria-label="Excluir escola"
            >
              <span className="material-symbols-outlined text-sm">delete</span>
            </button>
          )}
        </div>
      </div>

      <div className="p-8 pt-10">
        <h3 className="text-xl font-bold text-white mb-1">{school.name}</h3>
        
        <div className="flex items-center gap-2 text-xs text-primary font-bold uppercase tracking-wider mb-2">
          <span className="material-symbols-outlined text-sm">info</span>
          Codes: {school.inep || 'N/A'} / {school.seec || 'N/A'}
        </div>
        
        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-black uppercase mb-4">
          <span className="material-symbols-outlined text-xs">map</span>
          {school.gee || 'SEM REGIONAL'}
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm text-slate-400">
            <span className="material-symbols-outlined text-sm shrink-0">person</span>
            <span className="truncate">Dir: {school.director || 'Não informado'}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-400">
            <span className="material-symbols-outlined text-sm shrink-0">edit_note</span>
            <span className="truncate">Sec: {school.secretary || 'Não informado'}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-400">
            <span className="material-symbols-outlined text-sm shrink-0">location_on</span>
            <span className="truncate">
              {school.city}/{school.uf || '??'}
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-400">
            <span className="material-symbols-outlined text-sm shrink-0">call</span>
            <span>{school.phone || 'N/A'}</span>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-100/5 flex items-center justify-between">
          <button
            onClick={() => onViewContract(school)}
            disabled={isFetchingContract}
            className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-emerald-500 hover:text-emerald-400 transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-sm">description</span>
            Ver Contrato
          </button>

          <span className="text-[9px] text-slate-600 font-bold uppercase">BRN Suite v1.0</span>
        </div>
      </div>
    </div>
  );
};
