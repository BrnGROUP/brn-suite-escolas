import React, { useEffect } from 'react';
import { User } from '../types';
import { useSettings } from '../hooks/useSettings';

// Sections
import ProfileSection from '../components/settings/ProfileSection';
import SecuritySection from '../components/settings/SecuritySection';
import RubricsSection from '../components/settings/RubricsSection';
import BanksSection from '../components/settings/BanksSection';
import SuppliersSection from '../components/settings/SuppliersSection';
import PeriodsSection from '../components/settings/PeriodsSection';
import PaymentMethodsSection from '../components/settings/PaymentMethodsSection';
import StatusSection from '../components/settings/StatusSection';
import SupportContactsSection from '../components/settings/SupportContactsSection';
import WebsitePlansSection from '../components/settings/WebsitePlansSection';
import AssetsSection from '../components/settings/AssetsSection';
import BillingSection from '../components/settings/BillingSection';
import ModalitiesSection from '../components/settings/ModalitiesSection';

const Settings: React.FC<{ user: User }> = ({ user }) => {
  const settings = useSettings(user);

  const { activeTab, setActiveTab } = settings;

  const configTabs = [
    { id: 'profile', label: 'Minha Conta', icon: 'person', roles: [] },
    { id: 'security', label: 'Segurança', icon: 'lock', roles: [] },
    { id: 'general', label: 'Configurações Gerais', icon: 'tune', roles: ['Administrador', 'Operador'] },
    { id: 'modalities', label: 'Modalidades de Ensino', icon: 'school', roles: ['Administrador', 'Operador'] },
    { id: 'rubrics', label: 'Recursos & Rubricas', icon: 'category', roles: ['Administrador', 'Operador'] },
    { id: 'status', label: 'Status de Movimentação', icon: 'sync_alt', roles: ['Administrador', 'Operador'] },
    { id: 'payment', label: 'Tipos de Pagamento', icon: 'payments', roles: ['Administrador', 'Operador'] },
    { id: 'periods', label: 'Períodos / Semestres', icon: 'calendar_month', roles: ['Administrador', 'Operador'] },
    { id: 'banks', label: 'Contas Bancárias', icon: 'account_balance', roles: ['Administrador', 'Operador'] },
    { id: 'suppliers', label: 'Fornecedores', icon: 'local_shipping', roles: ['Administrador', 'Operador'] },
    { id: 'assets', label: 'Arquivos & Modelos', icon: 'folder_open', roles: ['Administrador', 'Operador'] },
    { id: 'contacts', label: 'Contatos de Suporte', icon: 'contact_support', roles: ['Administrador'] },
    { id: 'website', label: 'Web Site / Planos', icon: 'public', roles: ['Administrador'] },
    { id: 'billing', label: 'Faturamento BRN', icon: 'receipt_long', roles: ['Administrador', 'Diretor', 'Cliente'] }
  ].filter((tab: any) => tab.roles.length === 0 || tab.roles.includes(user.role));

  useEffect(() => {
    if (activeTab === 'rubrics' || activeTab === 'banks') settings.fetchAuxOptions();
    if (activeTab === 'rubrics') settings.fetchRubricData();
    if (activeTab === 'suppliers') settings.fetchSupplierData();
    if (activeTab === 'banks') settings.fetchBankData();
    if (activeTab === 'payment') settings.fetchPaymentData();
    if (activeTab === 'periods') settings.fetchPeriodData();
    if (activeTab === 'contacts') settings.fetchSupportContacts();
    if (activeTab === 'website') settings.fetchPlans();
    if (activeTab === 'assets') settings.fetchAssets();
    if (activeTab === 'modalities') settings.fetchModalityData();
  }, [activeTab]);

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto px-4 md:px-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-white">Configurações do Sistema</h1>
        <p className="text-text-secondary text-sm">Gerencie parâmetros, cadastros base e regras de negócio do BRN Suite.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sidebar Mini - Improved Responsiveness */}
        <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-4 lg:pb-0 no-scrollbar lg:col-span-4 xl:col-span-3 sticky lg:top-8 scroll-smooth">
          <div className="flex flex-row lg:flex-col gap-1.5 w-full">
            {configTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-left min-w-fit lg:min-w-0 group ${activeTab === tab.id
                  ? 'bg-primary/20 text-white border-b-2 lg:border-b-0 lg:border-l-4 border-primary shadow-lg shadow-primary/10'
                  : 'text-slate-500 hover:bg-white/5 hover:text-white'
                  }`}
              >
                <div className={`p-2 rounded-xl transition-colors shrink-0 ${activeTab === tab.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white/5 text-slate-400 group-hover:text-white'}`}>
                    <span className="material-symbols-outlined text-[20px] block">{tab.icon}</span>
                </div>
                <span className={`text-[13px] font-bold leading-tight ${activeTab === tab.id ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`}>
                  {tab.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-6 bg-surface-dark/50 backdrop-blur-md border border-white/5 rounded-[32px] p-6 md:p-10 shadow-2xl relative overflow-hidden min-w-0">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[120px] -mr-48 -mt-48 pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col gap-6 w-full">
            {activeTab === 'profile' && (
              <ProfileSection
                profileData={settings.profileData}
                setProfileData={settings.setProfileData}
                updatingProfile={settings.updatingProfile}
                onUpdate={settings.handleUpdateProfile}
              />
            )}

            {activeTab === 'security' && (
              <SecuritySection
                passwords={settings.passwords}
                setPasswords={settings.setPasswords}
                updatingPassword={settings.updatingPassword}
                onUpdate={settings.handleChangePassword}
              />
            )}

            {activeTab === 'rubrics' && (
              <RubricsSection
                rubrics={settings.rubrics}
                programs={settings.programs}
                schools={settings.schools}
                newRubric={settings.newRubric}
                setNewRubric={settings.setNewRubric}
                editingRubricId={settings.editingRubricId}
                setEditingRubricId={settings.setEditingRubricId}
                onSave={settings.handleSaveRubric}
                onEdit={settings.handleEditRubric}
                onDelete={settings.handleDeleteRubric}
                newProgram={settings.newProgram}
                setNewProgram={settings.setNewProgram}
                onCreateProgram={settings.handleCreateProgram}
                onDeleteProgram={settings.handleDeleteProgram}
                search={settings.rubricSearch}
                setSearch={settings.setRubricSearch}
                filterProgram={settings.rubricFilterProgram}
                setFilterProgram={settings.setRubricFilterProgram}
                filterSchool={settings.rubricFilterSchool}
                setFilterSchool={settings.setRubricFilterSchool}
                loading={settings.loading}
              />
            )}

            {activeTab === 'suppliers' && (
              <SuppliersSection
                suppliers={settings.suppliers}
                newSupplier={settings.newSupplier}
                setNewSupplier={settings.setNewSupplier}
                editingSupplierId={settings.editingSupplierId}
                setEditingSupplierId={settings.setEditingSupplierId}
                onSave={settings.handleCreateSupplier}
                onEdit={settings.handleEditSupplier}
                onDelete={settings.handleDeleteSupplier}
                onStampUpload={settings.handleStampUpload}
                isUploadingStamp={settings.isUploadingStamp}
                cities={settings.cities}
                loadingCities={settings.loadingCities}
                fetchCities={settings.fetchCities}
              />
            )}

            {activeTab === 'banks' && (
              <BanksSection
                bankAccounts={settings.bankAccounts}
                programs={settings.programs}
                schools={settings.schools}
                newBank={settings.newBank}
                setNewBank={settings.setNewBank}
                editingBankId={settings.editingBankId}
                setEditingBankId={settings.setEditingBankId}
                onSave={settings.handleCreateBank}
                onEdit={settings.handleEditBank}
                onDelete={settings.handleDeleteBank}
                search={settings.bankSearch}
                setSearch={settings.setBankSearch}
                filterProgram={settings.bankFilterProgram}
                setFilterProgram={settings.setBankFilterProgram}
                filterSchool={settings.bankFilterSchool}
                setFilterSchool={settings.setBankFilterSchool}
                loading={settings.loading}
              />
            )}

            {activeTab === 'periods' && (
              <PeriodsSection
                periods={settings.periods}
                newPeriod={settings.newPeriod}
                setNewPeriod={settings.setNewPeriod}
                isSavingPeriod={settings.isSavingPeriod}
                onSave={settings.handleCreatePeriod}
                onToggle={settings.handleTogglePeriod}
                onDelete={settings.handleDeletePeriod}
                loading={settings.loading}
              />
            )}

            {activeTab === 'payment' && (
              <PaymentMethodsSection
                paymentMethods={settings.paymentMethods}
                newPaymentMethod={settings.newPaymentMethod}
                setNewPaymentMethod={settings.setNewPaymentMethod}
                onSave={settings.handleCreatePaymentMethod}
                onDelete={settings.handleDeletePaymentMethod}
              />
            )}

            {activeTab === 'modalities' && (
              <ModalitiesSection
                modalities={settings.modalities}
                newModality={settings.newModality}
                setNewModality={settings.setNewModality}
                editingModalityId={settings.editingModalityId}
                setEditingModalityId={settings.setEditingModalityId}
                handleSaveModality={settings.handleSaveModality}
                handleEditModality={settings.handleEditModality}
                handleDeleteModality={settings.handleDeleteModality}
                loading={settings.loadingModalities}
                isSaving={settings.isSavingModality}
              />
            )}

            {activeTab === 'status' && <StatusSection />}

            {activeTab === 'contacts' && (
              <SupportContactsSection
                supportContacts={settings.supportContacts}
                setSupportContacts={settings.setSupportContacts}
                loadingContacts={settings.loadingContacts}
                savingContacts={settings.savingContacts}
                onSave={settings.handleSaveContacts}
              />
            )}

            {activeTab === 'website' && (
              <WebsitePlansSection
                plans={settings.plans}
                savingPlans={settings.savingPlans}
                onSavePlans={settings.handleSavePlans}
                updatePlanField={settings.updatePlanField}
                onAddFeature={settings.handleAddFeature}
                onRemoveFeature={settings.handleRemoveFeature}
                onUpdateFeature={settings.handleUpdateFeature}
                onAddPlan={settings.handleAddPlan}
              />
            )}

            {activeTab === 'assets' && (
              <AssetsSection
                templateUrl={settings.templateUrl}
                loadingAssets={settings.loadingAssets}
                isUploadingTemplate={settings.isUploadingTemplate}
                onUpload={settings.handleTemplateUpload}
              />
            )}

            {activeTab === 'billing' && (
              <BillingSection
                billingRecords={settings.billingRecords}
                schools={settings.schools}
                loading={settings.loadingBilling}
                onUpdateStatus={settings.handleUpdateBilling}
                onGenerate={settings.handleGenerateBilling}
                onCreate={settings.handleCreateBilling}
                currentUser={user}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
