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
          'h-[36px] px-4 rounded-[4px] shadow-none outline-none',
          'focus-visible:outline-2 focus-visible:outline-[#E27D60] focus-visible:outline-offset-1',
          'disabled:pointer-events-none disabled:opacity-40',
          size === 'sm' && 'h-[30px] px-2.5 text-[12px]',
          size === 'lg' && 'h-[42px] px-5 text-[14px]',
          variant === 'primary' && [
            'bg-[#2D4F1E] text-white border border-[#2D4F1E]',
            'hover:bg-[#25351F] hover:border-[#25351F] active:bg-[#1A2E1A]',
          ],
          variant === 'secondary' && [
            'bg-[#FFFAF2] text-[#1F1A14] border border-[#D7D2C8]',
            'hover:bg-[#F5E6CC]/50 hover:border-[#544E45] active:bg-[#E9DDC9]',
          ],
          variant === 'terracotta' && [
            'bg-[#E27D60] text-white border border-[#E27D60]',
            'hover:bg-[#B84E34] hover:border-[#B84E34] active:bg-[#9E3E28]',
          ],
          variant === 'forest' && [
            'bg-[#25351F] text-[#F5E6CC] border border-[#25351F]',
            'hover:bg-[#1A2E1A] hover:text-white active:bg-[#142414]',
          ],
          variant === 'ghost' && [
            'bg-transparent text-[#1F1A14] border border-transparent',
            'hover:bg-[#F5E6CC]/40 hover:border-[#D7D2C8] active:bg-[#E9DDC9]',
          ],
          variant === 'danger' && [
            'bg-[#8E2F26] text-white border border-[#8E2F26]',
            'hover:bg-[#72251E] hover:border-[#72251E] active:bg-[#5C1D18]',
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
