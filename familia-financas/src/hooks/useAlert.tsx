// Hook para usar AlertModal de forma simples
import { useState, useCallback } from 'react';
import { AlertModal, AlertType } from '../components/ui/AlertModal';

interface AlertOptions {
  type?: AlertType;
  title: string;
  message: string;
  confirmText?: string;
  showCancel?: boolean;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export function useAlert() {
  const [isOpen, setIsOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState<AlertOptions>({
    type: 'info',
    title: '',
    message: ''
  });

  const showAlert = useCallback((options: AlertOptions) => {
    setAlertConfig({
      type: 'info',
      confirmText: 'OK',
      showCancel: false,
      ...options
    });
    setIsOpen(true);
  }, []);

  const closeAlert = useCallback(() => {
    setIsOpen(false);
  }, []);

  const AlertComponent = () => (
    <AlertModal
      isOpen={isOpen}
      onClose={closeAlert}
      type={alertConfig.type || 'info'}
      title={alertConfig.title}
      message={alertConfig.message}
      confirmText={alertConfig.confirmText}
      showCancel={alertConfig.showCancel}
      cancelText={alertConfig.cancelText}
      onConfirm={alertConfig.onConfirm}
      onCancel={alertConfig.onCancel}
    />
  );

  return {
    showAlert,
    closeAlert,
    AlertComponent
  };
}

