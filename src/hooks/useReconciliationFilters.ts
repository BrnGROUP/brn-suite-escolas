import { useState, useEffect } from 'react';
import { User, BankTransaction } from '../types';

export const useReconciliationFilters = (user: User, bankAccounts: any[]) => {
  const [selectedSchoolId, setSelectedSchoolId] = useState(user.schoolId || '');
  const [selectedBankAccountId, setSelectedBankAccountId] = useState('');
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().substring(0, 7)); // YYYY-MM
  const [uploadType, setUploadType] = useState<'Conta Corrente' | 'Conta Investimento'>('Conta Corrente');

  // Modals & UI State
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [showManualMatch, setShowManualMatch] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showCapaModal, setShowCapaModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showMonthStatus, setShowMonthStatus] = useState(false);

  // Form selections and parameters
  const [quickCreateBT, setQuickCreateBT] = useState<BankTransaction | null>(null);
  const [manualMatchBT, setManualMatchBT] = useState<BankTransaction | null>(null);
  const [manualSearch, setManualSearch] = useState('');
  const [capaForm, setCapaForm] = useState({ revenue: 0, taxes: 0, balance: 0 });
  const [quickForm, setQuickForm] = useState({
    program_id: '',
    rubric_id: '',
    supplier_id: '',
    description: '',
    nature: 'Custeio',
    category: 'Compras e Serviços'
  });

  // Auto-select bank account if only one exists for the school
  useEffect(() => {
    if (selectedSchoolId && !selectedBankAccountId && bankAccounts.length > 0) {
      const relevantAccounts = bankAccounts.filter((acc: any) => acc.school_id === selectedSchoolId);
      if (relevantAccounts.length === 1 && relevantAccounts[0]) {
        setSelectedBankAccountId(relevantAccounts[0].id);
      }
    }
  }, [selectedSchoolId, bankAccounts, selectedBankAccountId]);

  useEffect(() => {
    setShowMonthStatus(false);
  }, [selectedSchoolId, selectedBankAccountId, filterMonth]);

  return {
    selectedSchoolId,
    setSelectedSchoolId,
    selectedBankAccountId,
    setSelectedBankAccountId,
    filterMonth,
    setFilterMonth,
    uploadType,
    setUploadType,
    showQuickCreate,
    setShowQuickCreate,
    showManualMatch,
    setShowManualMatch,
    showHelp,
    setShowHelp,
    showReport,
    setShowReport,
    showCapaModal,
    setShowCapaModal,
    showHistory,
    setShowHistory,
    showMonthStatus,
    setShowMonthStatus,
    quickCreateBT,
    setQuickCreateBT,
    manualMatchBT,
    setManualMatchBT,
    manualSearch,
    setManualSearch,
    capaForm,
    setCapaForm,
    quickForm,
    setQuickForm
  };
};
