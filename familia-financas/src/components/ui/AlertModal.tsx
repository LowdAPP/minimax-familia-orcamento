// AlertModal Component - Substitui alert() do JavaScript
import { ReactNode } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: AlertType;
  title: string;
  message: string;
  confirmText?: string;
  showCancel?: boolean;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export function AlertModal({
  isOpen,
  onClose,
  type,
  title,
  message,
  confirmText = 'OK',
  showCancel = false,
  cancelText = 'Cancelar',
  onConfirm,
  onCancel
}: AlertModalProps) {
  const icons = {
    success: <CheckCircle className="w-6 h-6 text-success-600" />,
    error: <XCircle className="w-6 h-6 text-error-600" />,
    warning: <AlertCircle className="w-6 h-6 text-warning-600" />,
    info: <Info className="w-6 h-6 text-info-600" />
  };

  const bgColors = {
    success: 'bg-success-50',
    error: 'bg-error-50',
    warning: 'bg-warning-50',
    info: 'bg-info-50'
  };

  const borderColors = {
    success: 'border-success-200',
    error: 'border-error-200',
    warning: 'border-warning-200',
    info: 'border-info-200'
  };

  const buttonVariants = {
    success: 'primary' as const,
    error: 'primary' as const,
    warning: 'primary' as const,
    info: 'primary' as const
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" showCloseButton={!showCancel}>
      <div className="space-y-md">
        {/* Ícone e Conteúdo */}
        <div className={`flex items-start gap-md p-md rounded-base border ${bgColors[type]} ${borderColors[type]}`}>
          <div className="flex-shrink-0 mt-0.5">
            {icons[type]}
          </div>
          <div className="flex-1">
            <h3 className="text-h4 font-bold text-neutral-900 mb-xs">
              {title}
            </h3>
            <p className="text-body text-neutral-700">
              {message}
            </p>
          </div>
        </div>

        {/* Botões */}
        <div className="flex justify-end gap-sm pt-md border-t border-neutral-200">
          {showCancel && (
            <Button 
              onClick={handleCancel} 
              variant="outline" 
              size="md"
            >
              {cancelText}
            </Button>
          )}
          <Button 
            onClick={handleConfirm} 
            variant={buttonVariants[type]} 
            size="md"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

