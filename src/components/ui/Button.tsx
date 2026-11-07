import * as React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'terracotta' | 'forest';
  size?: 'default' | 'sm' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'default', children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          'inline-flex items-center justify-center gap-2 whitespace-nowrap text-[13px] font-sans font-semibold transition-colors select-none tracking-wide',
          'min-h-[40px] px-4 rounded-[6px] shadow-none outline-none touch-manipulation',
          'focus-visible:outline-2 focus-visible:outline-terracotta focus-visible:outline-offset-1',
          'disabled:pointer-events-none disabled:opacity-40',
          size === 'sm' && 'min-h-[36px] px-3 text-[12px]',
          size === 'lg' && 'min-h-[48px] px-6 text-[14px]',
          variant === 'primary' && [
            'bg-forest text-white border border-forest',
            'hover:bg-forest-hover hover:border-forest-hover active:bg-canopy-deep',
          ],
          variant === 'secondary' && [
            'bg-warm-white text-ink border border-soft-border',
            'hover:bg-cream/50 hover:border-charcoal active:bg-sand',
          ],
          variant === 'terracotta' && [
            'bg-terracotta text-white border border-terracotta',
            'hover:bg-terracotta-deep hover:border-terracotta-deep active:bg-terracotta-deep',
          ],
          variant === 'forest' && [
            'bg-canopy text-cream border border-canopy',
            'hover:bg-canopy-deep hover:text-white active:bg-canopy-deep',
          ],
          variant === 'ghost' && [
            'bg-transparent text-ink border border-transparent',
            'hover:bg-cream/40 hover:border-soft-border active:bg-sand',
          ],
          variant === 'danger' && [
            'bg-danger text-white border border-danger',
            'hover:bg-danger/90 hover:border-danger/90',
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
