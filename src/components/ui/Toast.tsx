import * as React from 'react';
import { cn } from '../../lib/utils';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export type ToastVariant = 'info' | 'success' | 'warning' | 'danger';

export interface ToastProps {
  id?: string;
  variant?: ToastVariant;
  title: string;
  description?: string;
  onClose?: () => void;
  className?: string;
}

const variantConfig: Record<
  ToastVariant,
  { icon: React.ComponentType<any>; borderColor: string; iconColor: string }
> = {
  info: { icon: Info, borderColor: 'border-info', iconColor: 'text-info' },
  success: { icon: CheckCircle2, borderColor: 'border-success', iconColor: 'text-success' },
  warning: { icon: AlertTriangle, borderColor: 'border-warning', iconColor: 'text-warning' },
  danger: { icon: AlertCircle, borderColor: 'border-danger', iconColor: 'text-danger' },
};

export const Toast: React.FC<ToastProps> = ({
  variant = 'info',
  title,
  description,
  onClose,
  className,
}) => {
  const { icon: Icon, borderColor, iconColor } = variantConfig[variant];

  return (
    <div
      role="status"
      className={cn(
        'flex w-full max-w-[420px] rounded-[4px] border bg-surface px-3.5 py-2.5 text-ink shadow-none',
        description ? 'items-start gap-3' : 'items-center gap-2.5',
        borderColor,
        'transition-transform duration-[180ms] ease-out',
        className
      )}
    >
      <div className={cn('shrink-0', description ? 'mt-0.5' : '', iconColor)}>
        <Icon size={16} strokeWidth={1.5} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-[13px] font-medium text-ink leading-tight', !description && 'truncate')}>
          {title}
        </p>
        {description && (
          <p className="text-[12px] text-ink-muted leading-relaxed mt-0.5">{description}</p>
        )}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="shrink-0 text-ink-subtle hover:text-ink transition-colors p-1 rounded-[2px] focus:outline-2 focus:outline-accent focus:outline-offset-0"
          aria-label="Dismiss notification toast"
        >
          <X size={16} strokeWidth={1.5} />
        </button>
      )}
    </div>
  );
};

export const ToastContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="fixed bottom-6 left-6 z-50 flex flex-col gap-2 pointer-events-none [&>*]:pointer-events-auto">
      {children}
    </div>
  );
};
