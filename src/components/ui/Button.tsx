import * as React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'default' | 'sm';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'default', children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          'inline-flex items-center justify-center gap-2 whitespace-nowrap text-[14px] font-medium transition-colors select-none',
          'h-[36px] px-3.5 rounded-[4px] shadow-none outline-none',
          'focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-0',
          'disabled:pointer-events-none disabled:opacity-40',
          size === 'sm' && 'h-[30px] px-2.5 text-[13px]',
          variant === 'primary' && [
            'bg-accent text-accent-ink border border-accent',
            'hover:bg-accent/90 hover:border-accent active:bg-accent/80',
          ],
          variant === 'secondary' && [
            'bg-surface text-ink border border-rule',
            'hover:bg-bg-sunken hover:border-ink-subtle active:bg-bg-sunken',
          ],
          variant === 'ghost' && [
            'bg-transparent text-ink border border-transparent',
            'hover:bg-bg-sunken hover:border-rule active:bg-bg-sunken',
          ],
          variant === 'danger' && [
            'bg-danger text-white border border-danger',
            'hover:bg-danger/90 hover:border-danger active:bg-danger/80',
          ],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
