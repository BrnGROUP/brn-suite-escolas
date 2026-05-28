import React, { useState } from 'react';
import DocumentExemptionModal from './DocumentExemptionModal';

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
  currentUploads?: any[];
  isLoadingUploads?: boolean;
  onDeclareExempt?: (fileType: 'OFX' | 'PDF', reason: string) => void;
  bankAccounts?: any[];
}

const ImportZone: React.FC<ImportZoneProps> = ({
  dragActive,
  setDragActive,
  uploadType,
  setUploadType,
  onFileUpload,
  filterMonth,
  selectedSchoolId,
  selectedBankAccountId,
  onShowStatus,
  currentUploads = [],
  isLoadingUploads = false,
  onDeclareExempt,
  bankAccounts = [],
}) => {
  const isSelectionComplete = selectedSchoolId && selectedBankAccountId;
  
  // Exemption Modal state
  const [exemptModalOpen, setExemptModalOpen] = useState(false);
  const [exemptFileType, setExemptFileType] = useState<'OFX' | 'PDF'>('OFX');
  const [exemptDocName, setExemptDocName] = useState('');

  const currentAccount = bankAccounts.find((ba) => ba.id === selectedBankAccountId);
  const accountName = currentAccount ? currentAccount.name : 'Conta Selecionada';
  const monthName = new Date(filterMonth + '-02').toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  };

  const openExemption = (fileType: 'OFX' | 'PDF', name: string) => {
    setExemptFileType(fileType);
    setExemptDocName(name);
    setExemptModalOpen(true);
  };

  const handleExemptConfirm = (reason: string) => {
    if (onDeclareExempt) {
      onDeclareExempt(exemptFileType, reason);
    }
  };

  // Find the upload record for this account type
  const uploadRecord = currentUploads.find((u: any) => u.account_type === uploadType);

  // Determine requirement status
  const getDocumentStatus = (type: 'OFX' | 'PDF') => {
    if (!uploadRecord) return 'MISSING';
    
    if (type === 'OFX') {
      if (uploadRecord.file_url === 'EXEMPT') return 'EXEMPT';
      return uploadRecord.file_url ? 'UPLOADED' : 'MISSING';
    } else {
      if (uploadRecord.pdf_url === 'EXEMPT') return 'EXEMPT';
      return uploadRecord.pdf_url ? 'UPLOADED' : 'MISSING';
    }
  };

  // Requirements to render
  const requirements = uploadType === 'Conta Corrente'
    ? [
        {
          id: 'OFX' as const,
          name: 'Dados Bancários (OFX / CSV)',
          description: 'Usado para importar as transações e conciliar automaticamente com o sistema.',
          status: getDocumentStatus('OFX'),
          fileName: uploadRecord?.file_name,
        },
        {
          id: 'PDF' as const,
          name: 'Extrato Oficial (PDF)',
          description: 'Documento original e oficial gerado pelo banco para fins de auditoria.',
          status: getDocumentStatus('PDF'),
          fileName: uploadRecord?.pdf_name,
        },
      ]
    : [
        {
          id: 'PDF' as const,
          name: 'Demonstrativo de Rendimentos (PDF)',
          description: 'Extrato oficial de investimentos necessário para registrar rendimentos.',
          status: getDocumentStatus('PDF'),
          fileName: uploadRecord?.pdf_name,
        },
      ];

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto">
      {/* Exemption Modal */}
      <DocumentExemptionModal
        isOpen={exemptModalOpen}
        onClose={() => setExemptModalOpen(false)}
        onConfirm={handleExemptConfirm}
        documentName={exemptDocName}
        monthName={monthName}
        accountName={accountName}
      />

      <div
        className={`border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center gap-6 transition-all ${
          dragActive ? 'border-primary bg-primary/5' : 'border-white/10 bg-card-dark/30'
        } ${!isSelectionComplete ? 'opacity-75 grayscale-[0.5]' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          if (isSelectionComplete) setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          if (isSelectionComplete && e.dataTransfer.files[0]) {
            onFileUpload(e.dataTransfer.files[0]);
          }
        }}
      >
        <div className="flex flex-col items-center gap-2">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
              !isSelectionComplete
                ? 'bg-amber-500/10 text-amber-500'
                : 'bg-white/5 text-slate-500'
            }`}
          >
            <span className="material-symbols-outlined text-3xl">
              {!isSelectionComplete ? 'warning' : 'cloud_upload'}
            </span>
          </div>
          <div className="text-center">
            <h3 className="text-white font-black text-lg uppercase tracking-tight">Importação de Extratos</h3>
            {!isSelectionComplete ? (
              <div className="flex flex-col items-center gap-2 mt-2">
                <p className="text-amber-500 text-xs font-bold bg-amber-500/10 px-4 py-2 rounded-xl border border-amber-500/20 uppercase tracking-wide">
                  Selecione a Escola e a Conta Bancária
                </p>
                <p className="text-slate-500 text-[9px] uppercase font-black tracking-widest">
                  Use os filtros no topo da página
                </p>
              </div>
            ) : (
              <p className="text-slate-400 text-xs max-w-sm mx-auto mt-1">
                Arraste os arquivos aqui ou use o checklist de conformidade abaixo para gerenciar os extratos de <strong>{monthName}</strong>.
              </p>
            )}
          </div>
        </div>

        {isSelectionComplete && (
          <div className="flex bg-black/40 p-1 rounded-2xl border border-white/5">
            <button
              onClick={() => setUploadType('Conta Corrente')}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                uploadType === 'Conta Corrente'
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                  : 'text-slate-500 hover:text-white'
              }`}
            >
              Conta Corrente
            </button>
            <button
              onClick={() => setUploadType('Conta Investimento')}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                uploadType === 'Conta Investimento'
                  ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/25'
                  : 'text-slate-500 hover:text-white'
              }`}
            >
              Investimento
            </button>
          </div>
        )}
      </div>

      {/* Compliance Checklist Section */}
      {isSelectionComplete && (() => {
        const completedCount = requirements.filter((r) => r.status !== 'MISSING').length;
        const totalCount = requirements.length;
        const isAllDone = completedCount === totalCount;
        return (
          <div className="bg-card-dark rounded-3xl border border-white/5 overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
            {/* Header with real-time compliance tracker */}
            <div className="p-6 bg-white/5 border-b border-white/5 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <h4 className="text-sm font-black text-white uppercase tracking-widest">Checklist de Conformidade</h4>
                  <span className={`text-[8px] font-black px-2.5 py-0.5 rounded-full border transition-all duration-300 ${
                    isAllDone 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-md shadow-emerald-950/20' 
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-md shadow-amber-950/20'
                  }`}>
                    {completedCount} de {totalCount} OK
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Status individual dos documentos exigidos para auditoria</p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-56 bg-black/25 p-2.5 rounded-2xl border border-white/5">
                <div className="flex-1 h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className={`h-full transition-all duration-500 ease-out rounded-full ${isAllDone ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.3)]'}`}
                    style={{ width: `${(completedCount / totalCount) * 100}%` }}
                  />
                </div>
                <span className={`text-[10px] font-mono font-black transition-colors duration-300 ${isAllDone ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {Math.round((completedCount / totalCount) * 100)}%
                </span>
              </div>
            </div>

            <div className="divide-y divide-white/5 p-4 bg-[#0e1628]/45 flex flex-col gap-3">
              {isLoadingUploads ? (
                <div className="p-8 text-center text-slate-500 text-xs font-bold uppercase tracking-widest animate-pulse">
                  Carregando status dos documentos...
                </div>
              ) : (
                requirements.map((req) => {
                  const isUploaded = req.status === 'UPLOADED';
                  const isExempt = req.status === 'EXEMPT';
                  return (
                    <div 
                      key={req.id} 
                      className={`p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300 rounded-2xl border-l-4 shadow-sm ${
                        isUploaded
                          ? 'bg-emerald-500/[0.02] border border-emerald-500/10 border-l-emerald-500 hover:bg-emerald-500/[0.04] shadow-emerald-950/5'
                          : isExempt
                          ? 'bg-amber-500/[0.02] border border-amber-500/10 border-l-amber-500 hover:bg-amber-500/[0.04] shadow-amber-950/5'
                          : 'bg-black/20 border border-white/5 border-l-rose-500/40 hover:bg-white/[0.02]'
                      }`}
                    >
                      {/* Info */}
                      <div className="flex gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${
                          isUploaded
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                            : isExempt
                            ? 'bg-amber-500/15 text-amber-500 border border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/5'
                        }`}>
                          <span className="material-symbols-outlined text-2xl transition-transform duration-300">
                            {isUploaded
                              ? 'check_circle'
                              : isExempt
                              ? 'block'
                              : 'pending'}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-black text-white uppercase tracking-tight">{req.name}</span>
                            {isUploaded ? (
                              <span className="text-[8px] font-black px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-widest">
                                Recebido
                              </span>
                            ) : isExempt ? (
                              <span className="text-[8px] font-black px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 uppercase tracking-widest">
                                Não se aplica
                              </span>
                            ) : (
                              <span className="text-[8px] font-black px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 uppercase tracking-widest animate-pulse">
                                Pendente
                              </span>
                            )}
                          </div>
                          <p className="text-slate-500 text-[10px] font-medium leading-relaxed max-w-md">{req.description}</p>
                          
                          {/* Subtitle / File description */}
                          {isUploaded && req.fileName && (
                            <p className="text-emerald-400/90 text-[9px] font-mono mt-1 flex items-center gap-1.5 animate-in slide-in-from-top-1 duration-200">
                              <span className="material-symbols-outlined text-[13px]">attachment</span>
                              {req.fileName}
                            </p>
                          )}
                          {isExempt && req.fileName && (
                            <p className="text-amber-500/90 text-[9px] font-bold uppercase tracking-tight mt-1 flex items-center gap-1.5 animate-in slide-in-from-top-1 duration-200">
                              <span className="material-symbols-outlined text-[13px]">info</span>
                              Motivo: {req.fileName.replace('Não se aplica: ', '')}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0 md:justify-end">
                        {!isUploaded && !isExempt ? (
                          <>
                            <label className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/95 text-white text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer active:scale-95 shadow-md shadow-primary/10">
                              Importar
                              <input
                                type="file"
                                className="hidden"
                                accept={req.id === 'OFX' ? '.ofx,.ofc,.csv' : '.pdf'}
                                onChange={handleFileChange}
                              />
                            </label>
                            <button
                              onClick={() => openExemption(req.id, req.name)}
                              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-amber-500/10 hover:text-amber-500 text-slate-400 border border-white/5 text-[9px] font-black uppercase tracking-widest transition-all active:scale-95"
                            >
                              Não se aplica
                            </button>
                          </>
                        ) : (
                          <label className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/5 text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer active:scale-95">
                            Substituir
                            <input
                              type="file"
                              className="hidden"
                              accept={req.id === 'OFX' ? '.ofx,.ofc,.csv' : '.pdf'}
                              onChange={handleFileChange}
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default ImportZone;
