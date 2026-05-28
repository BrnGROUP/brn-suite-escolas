import React from 'react';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  importText: string;
  setImportText: (text: string) => void;
  processImport: () => void;
  downloadTemplate: () => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  importText,
  setImportText,
  processImport,
  downloadTemplate
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/99 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#0a0f14] border border-white/10 w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-5 md:p-10 border-b border-white/5 flex justify-between items-center bg-[#0a0f14] rounded-t-3xl">
          <h3 className="text-lg md:text-2xl font-black text-white uppercase tracking-widest leading-tight">
            Importação em Massa
          </h3>
          <button
            onClick={onClose}
            className="w-10 h-10 md:w-12 md:h-12 rounded-full hover:bg-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-all"
          >
            <span className="material-symbols-outlined text-xl md:text-2xl">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 md:p-10 space-y-6 md:space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={downloadTemplate}
              className="h-12 md:h-14 rounded-2xl bg-cyan-500/10 text-cyan-400 font-black uppercase tracking-widest border border-cyan-500/20 hover:bg-cyan-500 hover:text-white transition-all flex items-center justify-center gap-3 text-xs"
            >
              <span className="material-symbols-outlined">download</span> Modelo CSV
            </button>
            <label className="h-12 md:h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 font-black uppercase tracking-widest border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all flex items-center justify-center gap-3 cursor-pointer text-xs">
              <span className="material-symbols-outlined">upload_file</span> Subir CSV{' '}
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={async e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const buf = await file.arrayBuffer();
                  const decoder = new TextDecoder('windows-1252');
                  const text = decoder.decode(buf);
                  if (text) {
                    setImportText(text);
                    setTimeout(() => processImport(), 100);
                  }
                  e.target.value = '';
                }}
              />
            </label>
          </div>

          <div className="space-y-3 md:space-y-4">
            <label className="text-[9px] md:text-[10px] text-slate-500 font-black uppercase tracking-widest">
              Colunas: Descrição, Qtd, Unid, Preço Vencedor, Concorrente 1, Concorrente 2
            </label>
            <textarea
              id="import_text"
              value={importText}
              onChange={e => setImportText(e.target.value)}
              className="w-full h-48 md:h-64 bg-black/40 border border-white/10 rounded-2xl p-4 md:p-6 text-xs font-mono text-white outline-none focus:border-primary transition-all resize-none"
              placeholder="Cole os dados aqui..."
            />
          </div>

          {/* Footer */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t border-white/5">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-8 h-12 text-slate-400 font-bold uppercase tracking-widest hover:bg-white/5 rounded-xl transition-all text-xs"
            >
              Cancelar
            </button>
            <button
              onClick={processImport}
              disabled={!importText.trim()}
              className="w-full sm:w-auto px-8 md:px-12 h-12 bg-primary text-white font-black uppercase tracking-widest rounded-xl shadow-2xl shadow-primary/30 hover:bg-primary-hover transition-all text-xs"
            >
              Importar Itens
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
