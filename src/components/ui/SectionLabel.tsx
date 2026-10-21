import * as React from 'react';
import { cn } from '../../lib/utils';

export interface SectionLabelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  as?: 'div' | 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

export const SectionLabel: React.FC<SectionLabelProps> = ({
  className,
  children,
  as: Component = 'div',
  ...props
}) => {
  return (
    <Component
      className={cn(
        'text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-muted select-none leading-none',
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
};
