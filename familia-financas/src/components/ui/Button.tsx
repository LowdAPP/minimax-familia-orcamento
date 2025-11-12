// Button Component - Primary & Secondary
import { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
  as?: 'button' | 'span';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    children, 
    variant = 'primary', 
    size = 'md', 
    loading = false,
    fullWidth = false,
    disabled,
    className = '',
    as = 'button',
    ...props 
  }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center gap-xs font-semibold rounded-base transition-all duration-base ease-out disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 cursor-pointer';
    
    const variants = {
      primary: 'bg-primary-500 text-white hover:bg-primary-600 hover:-translate-y-0.5 hover:shadow-md active:bg-primary-900 active:translate-y-0',
      secondary: 'bg-transparent border-2 border-neutral-200 text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 hover:scale-105 active:bg-neutral-100',
      outline: 'bg-transparent border border-primary-500 text-primary-500 hover:bg-primary-50',
      ghost: 'bg-transparent text-neutral-700 hover:bg-neutral-100'
    };
    
    const sizes = {
      sm: 'h-10 px-sm text-small',
      md: 'h-12 px-md text-body',
      lg: 'h-14 px-lg text-body-large'
    };
    
    const classNames = `${baseStyles} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`;
    
    if (as === 'span') {
      return (
        <span className={classNames}>
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {children}
        </span>
      );
    }
    
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={classNames}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
