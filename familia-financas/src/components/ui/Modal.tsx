// Modal Component
import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  showCloseButton?: boolean;
}

export function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md',
  showCloseButton = true 
}: ModalProps) {
  // Fechar com ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className={`
        relative bg-white rounded-lg shadow-xl w-full ${sizes[size]}
        animate-in fade-in-0 zoom-in-95 duration-200
      `}>
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-lg border-b border-neutral-200">
            {title && (
              <h2 className="text-h3 font-bold text-neutral-900">{title}</h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="ml-auto p-xs rounded-base hover:bg-neutral-100 transition-colors text-neutral-500 hover:text-neutral-700"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
        
        {/* Body */}
        <div className="p-lg">
          {children}
        </div>
      </div>
    </div>
  );
}

// Modal de Resultado (especializado para upload de PDF)
interface ResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  details?: string;
  transactionCount?: number;
  transactionsFound?: number;
}

export function ResultModal({
  isOpen,
  onClose,
  type,
  title,
  message,
  details,
  transactionCount,
  transactionsFound
}: ResultModalProps) {
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };

  const colors = {
    success: 'text-green-600',
    error: 'text-red-600',
    warning: 'text-yellow-600',
    info: 'text-blue-600'
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="md">
      <div className="space-y-md">
        {/* Ícone e Mensagem Principal */}
        <div className="flex items-start gap-md">
          <span className="text-4xl">{icons[type]}</span>
          <div className="flex-1">
            <p className={`text-body font-medium ${colors[type]}`}>
              {message}
            </p>
            
            {/* Detalhes */}
            {details && (
              <p className="text-small text-neutral-600 mt-xs">
                {details}
              </p>
            )}
            
            {/* Estatísticas */}
            {(transactionCount !== undefined || transactionsFound !== undefined) && (
              <div className="mt-md p-md bg-neutral-50 rounded-base">
                {transactionsFound !== undefined && (
                  <p className="text-small text-neutral-700">
                    <span className="font-semibold">Transações encontradas:</span> {transactionsFound}
                  </p>
                )}
                {transactionCount !== undefined && (
                  <p className="text-small text-neutral-700 mt-xs">
                    <span className="font-semibold">Transações importadas:</span> {transactionCount}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Botão de Fechar */}
        <div className="flex justify-end pt-md border-t border-neutral-200">
          <Button onClick={onClose} variant="primary" size="md">
            Fechar
          </Button>
        </div>
      </div>
    </Modal>
  );
}

