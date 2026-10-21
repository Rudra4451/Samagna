import * as React from 'react';
import { cn } from '../../lib/utils';
import { ChevronDown } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  errorText?: string;
  label?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', error, errorText, label, disabled, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]/g, '-') : undefined);
    const hasError = Boolean(error || errorText);

    return (
      <div className="w-full space-y-1">
        {label && (
          <label
            htmlFor={inputId}
            className="text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-muted block select-none"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          type={type}
          ref={ref}
          disabled={disabled}
          className={cn(
            'flex h-[36px] w-full rounded-[4px] border bg-surface px-3 py-1.5 text-[14px] text-ink',
            'placeholder:text-ink-subtle transition-colors shadow-none outline-none',
            hasError ? 'border-danger' : 'border-rule hover:border-ink-subtle',
            'focus:outline-2 focus:outline-accent focus:outline-offset-0 focus:border-accent',
            'disabled:cursor-not-allowed disabled:bg-bg-sunken disabled:text-ink-muted disabled:border-rule',
            className
          )}
          {...props}
        />
        {errorText && (
          <span className="text-[12px] text-danger block font-normal leading-tight">
            {errorText}
          </span>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export interface NumberInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  unit?: string;
  error?: boolean;
  errorText?: string;
  label?: string;
}

export const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ className, unit, error, errorText, label, disabled, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]/g, '-') : undefined);
    const hasError = Boolean(error || errorText);

    return (
      <div className="w-full space-y-1">
        {label && (
          <label
            htmlFor={inputId}
            className="text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-muted block select-none"
          >
            {label}
          </label>
        )}
        <div
          className={cn(
            'flex h-[36px] w-full items-center rounded-[4px] border bg-surface px-3 transition-colors shadow-none',
            hasError ? 'border-danger' : 'border-rule hover:border-ink-subtle',
            'focus-within:outline-2 focus-within:outline-accent focus-within:outline-offset-0 focus-within:border-accent',
            disabled && 'bg-bg-sunken text-ink-muted cursor-not-allowed'
          )}
        >
          <input
            id={inputId}
            type="number"
            ref={ref}
            disabled={disabled}
            className={cn(
              'w-full bg-transparent text-[14px] text-ink outline-none tabular-nums text-right',
              'placeholder:text-ink-subtle [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
              'disabled:cursor-not-allowed disabled:text-ink-muted',
              className
            )}
            {...props}
          />
          {unit && (
            <span className="ml-2 select-none text-[12px] font-medium uppercase tracking-wider text-ink-muted shrink-0">
              {unit}
            </span>
          )}
        </div>
        {errorText && (
          <span className="text-[12px] text-danger block font-normal leading-tight">
            {errorText}
          </span>
        )}
      </div>
    );
  }
);
NumberInput.displayName = 'NumberInput';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
  errorText?: string;
  label?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, errorText, label, disabled, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]/g, '-') : undefined);
    const hasError = Boolean(error || errorText);

    return (
      <div className="w-full space-y-1">
        {label && (
          <label
            htmlFor={inputId}
            className="text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-muted block select-none"
          >
            {label}
          </label>
        )}
        <textarea
          id={inputId}
          ref={ref}
          disabled={disabled}
          className={cn(
            'flex min-h-[80px] w-full rounded-[4px] border bg-surface p-3 text-[14px] text-ink',
            'placeholder:text-ink-subtle transition-colors shadow-none outline-none leading-relaxed',
            hasError ? 'border-danger' : 'border-rule hover:border-ink-subtle',
            'focus:outline-2 focus:outline-accent focus:outline-offset-0 focus:border-accent',
            'disabled:cursor-not-allowed disabled:bg-bg-sunken disabled:text-ink-muted disabled:border-rule',
            className
          )}
          {...props}
        />
        {errorText && (
          <span className="text-[12px] text-danger block font-normal leading-tight">
            {errorText}
          </span>
        )}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  errorText?: string;
  label?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, error, errorText, label, disabled, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]/g, '-') : undefined);
    const hasError = Boolean(error || errorText);

    return (
      <div className="w-full space-y-1">
        {label && (
          <label
            htmlFor={inputId}
            className="text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-muted block select-none"
          >
            {label}
          </label>
        )}
        <div className="relative w-full">
          <select
            id={inputId}
            ref={ref}
            disabled={disabled}
            className={cn(
              'flex h-[36px] w-full appearance-none rounded-[4px] border bg-surface pl-3 pr-8 text-[14px] text-ink',
              'transition-colors shadow-none outline-none cursor-pointer',
              hasError ? 'border-danger' : 'border-rule hover:border-ink-subtle',
              'focus:outline-2 focus:outline-accent focus:outline-offset-0 focus:border-accent',
              'disabled:cursor-not-allowed disabled:bg-bg-sunken disabled:text-ink-muted disabled:border-rule',
              className
            )}
            {...props}
          >
            {children}
          </select>
          <ChevronDown
            size={16}
            strokeWidth={1.5}
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted"
          />
        </div>
        {errorText && (
          <span className="text-[12px] text-danger block font-normal leading-tight">
            {errorText}
          </span>
        )}
      </div>
    );
  }
);
Select.displayName = 'Select';
