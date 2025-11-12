// Input Field Component
import { InputHTMLAttributes, forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-small font-medium text-neutral-700 mb-xs">
            {label}
            {props.required && <span className="text-error-500 ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full h-12 px-sm rounded-base border text-body text-neutral-900 
            placeholder:text-neutral-500 bg-white
            transition-all duration-base
            ${error 
              ? 'border-error-500 focus:ring-2 focus:ring-error-500 focus:ring-offset-0' 
              : 'border-neutral-200 hover:border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-0'
            }
            disabled:bg-neutral-100 disabled:cursor-not-allowed
            ${className}
          `}
          {...props}
        />
        {error && (
          <div className="flex items-center gap-xs mt-xs text-small text-error-600">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {helperText && !error && (
          <p className="text-small text-neutral-500 mt-xs">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
