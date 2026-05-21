import React, { useEffect } from 'react';
import { User } from '../types';
import { useBankReconciliation } from '../hooks/useBankReconciliation';
import { useAccessibleSchools } from '../hooks/usePermissions';

// Components
import ReconciliationFilters from '../components/reconciliation/ReconciliationFilters';
import ImportZone from '../components/reconciliation/ImportZone';
import TransactionTable from '../components/reconciliation/TransactionTable';
import QuickCreateModal from '../components/reconciliation/QuickCreateModal';
import ManualMatchModal from '../components/reconciliation/ManualMatchModal';
import HelpModal from '../components/reconciliation/HelpModal';
import ReconciliationReport from '../components/reconciliation/ReconciliationReport';
import CapaModal from '../components/reconciliation/CapaModal';
import ReconciliationHistoryModal from '../components/reconciliation/ReconciliationHistoryModal';
import MonthStatusTable from '../components/reconciliation/MonthStatusTable';

const BankReconciliation: React.FC<{ user: User }> = ({ user }) => {
    const recon = useBankReconciliation(user);
    const accessibleSchools = useAccessibleSchools(user, recon.schools);

    // Effect to fetch entries when filters change
    useEffect(() => {
        recon.fetchSystemEntries();
    }, [recon.selectedSchoolId, recon.selectedBankAccountId]);

    return (
        <div className="flex flex-col gap-6 animate-in fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <p className="text-slate-400 text-sm mt-1 italic">Compare seu extrato bancário com os lançamentos do sistema.</p>
            </div>

            <ReconciliationFilters
                user={user}
                schools={recon.schools}
                accessibleSchools={accessibleSchools}
                bankAccounts={recon.bankAccounts}
                selectedSchoolId={recon.selectedSchoolId}
                setSelectedSchoolId={recon.setSelectedSchoolId}
                selectedBankAccountId={recon.selectedBankAccountId}
                setSelectedBankAccountId={recon.setSelectedBankAccountId}
                filterMonth={recon.filterMonth}
                setFilterMonth={recon.setFilterMonth}
                onShowHelp={() => recon.setShowHelp(true)}
                onShowHistory={() => recon.setShowHistory(true)}
                isExportingAll={recon.isExportingAll}
                onExportAll={recon.handleExportAllReconciled}
            />

            {recon.transactions.length === 0 ? (
                recon.showMonthStatus ? (
                    <MonthStatusTable
                        systemEntries={recon.systemEntries}
                        programs={recon.programs}
                        schools={recon.schools}
                        rubrics={recon.rubrics}
                        suppliers={recon.suppliers}
                        filterMonth={recon.filterMonth}
                        onClose={() => recon.setShowMonthStatus(false)}
                    />
                ) : (
                    <ImportZone
                        dragActive={recon.dragActive}
                        setDragActive={recon.setDragActive}
                        uploadType={recon.uploadType}
                        setUploadType={recon.setUploadType}
                        onFileUpload={recon.handleFileUpload}
                        filterMonth={recon.filterMonth}
                        selectedSchoolId={recon.selectedSchoolId}
                        selectedBankAccountId={recon.selectedBankAccountId}
                        onShowStatus={() => recon.setShowMonthStatus(true)}
                    />
                )
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 pb-20">
                    <div className="xl:col-span-12">
                        <TransactionTable
                            transactions={recon.transactions}
                            systemEntries={recon.systemEntries}
                            isMatching={recon.isMatching}
                            onFileUpload={recon.handleFileUpload}
                            onBulkReconcile={recon.handleBulkReconcile}
                            onConfirmMatch={recon.handleConfirmMatch}
                            onQuickCreateStart={recon.handleQuickCreateStart}
                            onManualMatchStart={(bt) => { recon.setManualMatchBT(bt); recon.setShowManualMatch(true); }}
                            onShowReport={() => recon.setShowReport(true)}
                            onClear={() => recon.setTransactions([])}
                            onUnlink={recon.handleUnlink}
                        />
                    </div>
                </div>
            )}

            {/* Modals */}
            {recon.showQuickCreate && recon.quickCreateBT && (
                <QuickCreateModal
                    bt={recon.quickCreateBT}
                    quickForm={recon.quickForm}
                    setQuickForm={recon.setQuickForm}
                    programs={recon.programs}
                    rubrics={recon.rubrics}
                    suppliers={recon.suppliers}
                    isMatching={recon.isMatching}
                    schoolId={recon.selectedSchoolId}
                    onClose={() => recon.setShowQuickCreate(false)}
                    onConfirm={recon.handleQuickCreate}
                />
            )}

            {recon.showManualMatch && recon.manualMatchBT && (
                <ManualMatchModal
                    bt={recon.manualMatchBT}
                    systemEntries={recon.systemEntries}
                    suppliers={recon.suppliers}
                    programs={recon.programs}
                    rubrics={recon.rubrics}
                    manualSearch={recon.manualSearch}
                    setManualSearch={recon.setManualSearch}
                    onConfirmMatch={recon.handleConfirmMatch}
                    onClose={() => recon.setShowManualMatch(false)}
                />
            )}

            {recon.showHelp && (
                <HelpModal onClose={() => recon.setShowHelp(false)} />
            )}

            {recon.showReport && (
                <ReconciliationReport
                    transactions={recon.transactions}
                    systemEntries={recon.systemEntries}
                    schools={recon.schools}
                    bankAccounts={recon.bankAccounts}
                    selectedSchoolId={recon.selectedSchoolId}
                    selectedBankAccountId={recon.selectedBankAccountId}
                    filterMonth={recon.filterMonth}
                    onClose={() => recon.setShowReport(false)}
                />
            )}

            {recon.showCapaModal && (
                <CapaModal
                    capaForm={recon.capaForm}
                    setCapaForm={recon.setCapaForm}
                    onConfirm={recon.handleConfirmCapa}
                    onClose={() => recon.setShowCapaModal(false)}
                    schoolName={recon.schools.find(s => s.id === recon.selectedSchoolId)?.name || ''}
                    accountName={recon.bankAccounts.find(a => a.id === recon.selectedBankAccountId)?.name || ''}
                    monthYear={new Date(recon.filterMonth + '-02').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                    isReimport={recon.isReimport}
                />
            )}

            <ReconciliationHistoryModal
                isOpen={recon.showHistory}
                onClose={() => recon.setShowHistory(false)}
                user={user}
                schoolId={recon.selectedSchoolId}
                bankAccountId={recon.selectedBankAccountId}
            />
        </div>
    );
};

export default BankReconciliation;
