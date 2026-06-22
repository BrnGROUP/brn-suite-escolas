import React from 'react';
import { User, UserRole } from '../types';
import { usePermissions } from '../hooks/usePermissions';
import { useSchools } from '../hooks/useSchools';
import { SchoolCard } from '../components/schools/SchoolCard';
import { SchoolFormModal } from '../components/schools/SchoolFormModal';
import Contract from './Contract';

const Schools: React.FC<{ user: User }> = ({ user }) => {
  const isAuthorized =
    user.role === UserRole.ADMIN ||
    user.role === UserRole.OPERADOR ||
    user.role === UserRole.TECNICO_GEE;

  const schoolPerm = usePermissions(user, 'schools');

  const {
    cities,
    gees,
    loading,
    showForm,
    setShowForm,
    editingId,
    isUploading,
    isLoadingCities,
    viewingContract,
    setViewingContract,
    isFetchingContract,
    availablePlans,
    searchTerm,
    setSearchTerm,
    formData,
    setFormData,
    resetForm,
    handleEdit,
    handleSave,
    handleDelete,
    handleViewContract,
    handleImageUpload,
    handleFileUpload,
    displayedSchools,
  } = useSchools({ user });

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-slate-500">
        <span className="material-symbols-outlined text-6xl opacity-20">lock</span>
        <p className="text-xl font-bold">Acesso Restrito</p>
        <p className="text-sm">Você não tem permissão para gerenciar escolas.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold text-white">
          Escolas
          <span className="text-sm font-normal text-slate-400 block">Gestão de Unidades Escolares</span>
        </h1>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          {/* Search Input */}
          <div className="relative w-full sm:w-64 lg:w-96 group">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors">
              search
            </span>
            <input
              type="text"
              placeholder="Pesquisar escola..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#1e293b] border border-slate-700/50 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder:text-slate-500 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all shadow-inner"
            />
          </div>

          {/* New School Button */}
          {schoolPerm.canCreate && (
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-primary/20 flex items-center gap-2 w-full sm:w-auto justify-center whitespace-nowrap active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined">add</span> Nova Escola
            </button>
          )}
        </div>
      </div>

      {/* Schools Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && displayedSchools.length === 0 ? (
          <div className="col-span-full animate-pulse text-center py-20 text-slate-400">
            Carregando escolas...
          </div>
        ) : displayedSchools.length === 0 ? (
          <div className="col-span-full text-center py-24 bg-surface-dark border border-surface-border border-dashed rounded-3xl">
            <span className="material-symbols-outlined text-5xl text-slate-700 mb-2">search_off</span>
            <p className="text-slate-500 font-medium">Nenhuma escola encontrada para sua busca.</p>
          </div>
        ) : (
          displayedSchools.map((school) => (
            <SchoolCard
              key={school.id}
              school={school}
              canEdit={schoolPerm.canEdit}
              canDelete={schoolPerm.canDelete}
              isFetchingContract={isFetchingContract}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onViewContract={handleViewContract}
            />
          ))
        )}
      </div>

      {/* School Creation/Editing Modal Form */}
      <SchoolFormModal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        editingId={editingId}
        formData={formData}
        setFormData={setFormData}
        gees={gees}
        availablePlans={availablePlans}
        cities={cities}
        isLoadingCities={isLoadingCities}
        isUploading={isUploading}
        loading={loading}
        onImageUpload={handleImageUpload}
        onFileUpload={handleFileUpload}
        onSave={handleSave}
      />

      {/* Contract Viewer Modal */}
      {viewingContract && (
        <div className="fixed inset-0 z-[60] bg-[#0f172a] overflow-y-auto pt-16 md:pt-0 print:bg-white print:overflow-visible print:static print:p-0">
          <div className="sticky top-0 z-[70] bg-[#1e293b] p-4 flex justify-between items-center sm:hidden border-b border-white/10 print:hidden">
            <h3 className="font-bold text-white uppercase text-xs">Visualizando Contrato</h3>
            <button
              onClick={() => setViewingContract(null)}
              className="text-white bg-white/10 p-2 rounded-lg"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="relative print:static">
            <button
              onClick={() => setViewingContract(null)}
              className="fixed top-6 right-10 z-[70] hidden sm:flex items-center gap-2 text-white bg-slate-800/80 hover:bg-slate-700 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 transition-all font-bold uppercase text-xs print:hidden"
            >
              <span className="material-symbols-outlined">close</span> Fechar
            </button>

            <div className="max-w-5xl mx-auto py-8 px-4 print:p-0 print:max-w-none">
              <Contract user={viewingContract.directorUser} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Schools;
