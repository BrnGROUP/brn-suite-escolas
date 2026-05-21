import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ConfirmModal } from '../components/common/ConfirmModal';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

interface ConfirmContextData {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextData>({} as ConfirmContextData);

export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({ title: '', message: '' });
  
  const resolveRef = useRef<((value: boolean) => void) | null>(null);
  const location = useLocation();
  const prevLocationRef = useRef(location.pathname);

  // Cleanup pending promise on unmount
  useEffect(() => {
    return () => {
      if (resolveRef.current) {
        resolveRef.current(false);
        resolveRef.current = null;
      }
    };
  }, []);

  // Listen to route changes and resolve pending confirmation as false
  useEffect(() => {
    if (isOpen && location.pathname !== prevLocationRef.current) {
      setIsOpen(false);
      if (resolveRef.current) {
        resolveRef.current(false);
        resolveRef.current = null;
      }
    }
    prevLocationRef.current = location.pathname;
  }, [location, isOpen]);

  const confirm = useCallback((confirmOptions: ConfirmOptions): Promise<boolean> => {
    // Resolve any previous pending confirmation as false
    if (resolveRef.current) {
      resolveRef.current(false);
      resolveRef.current = null;
    }

    setOptions(confirmOptions);
    setIsOpen(true);
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const handleConfirm = useCallback(() => {
    setIsOpen(false);
    if (resolveRef.current) {
      resolveRef.current(true);
      resolveRef.current = null;
    }
  }, []);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
    if (resolveRef.current) {
      resolveRef.current(false);
      resolveRef.current = null;
    }
  }, []);

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <ConfirmModal
        isOpen={isOpen}
        title={options.title}
        message={options.message}
        confirmText={options.confirmText}
        cancelText={options.cancelText}
        isDestructive={options.isDestructive}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
};

