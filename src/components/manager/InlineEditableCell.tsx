'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Pencil } from 'lucide-react';
import { cn } from '../../lib/utils';

interface InlineEditableCellProps {
  value: string | number;
  type?: 'number' | 'text' | 'grade';
  options?: string[]; // for grade or predefined choices
  onCommit: (newValue: string | number) => void;
  hasEditIndicator?: boolean;
  className?: string;
  unit?: string;
}

export const InlineEditableCell: React.FC<InlineEditableCellProps> = ({
  value,
  type = 'text',
  options,
  onCommit,
  hasEditIndicator = false,
  className,
  unit,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentVal, setCurrentVal] = useState<string | number>(value);
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement | null>(null);

  useEffect(() => {
    setCurrentVal(value);
  }, [value]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
    }
  }, [isEditing]);

  const handleCommit = () => {
    setIsEditing(false);
    if (currentVal !== value) {
      if (type === 'number') {
        const num = parseFloat(String(currentVal));
        if (!isNaN(num)) {
          onCommit(num);
          return;
        }
      }
      onCommit(currentVal);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCommit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setCurrentVal(value);
      setIsEditing(false);
    }
  };

  const cellId = React.useId();

  if (isEditing) {
    if (type === 'grade' && options) {
      return (
        <span className="inline-flex items-center">
          <label htmlFor={`edit-grade-${cellId}`} className="sr-only">
            Edit quality grade
          </label>
          <select
            id={`edit-grade-${cellId}`}
            ref={inputRef as any}
            value={String(currentVal)}
            onChange={(e) => setCurrentVal(e.target.value)}
            onBlur={handleCommit}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            className="h-[26px] px-1 rounded-[2px] border border-accent bg-surface font-mono text-[12px] text-ink focus:outline-none"
          >
            {options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center">
        <label htmlFor={`edit-input-${cellId}`} className="sr-only">
          Edit table cell value
        </label>
        <input
          id={`edit-input-${cellId}`}
          ref={inputRef as any}
          type={type === 'number' ? 'number' : 'text'}
          value={currentVal}
          step={type === 'number' ? '0.1' : undefined}
          onChange={(e) =>
            setCurrentVal(type === 'number' ? e.target.value : e.target.value)
          }
          onBlur={handleCommit}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
          className="w-20 h-[26px] px-1 rounded-[2px] border border-accent bg-surface font-mono text-[12px] text-ink focus:outline-none"
        />
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        setIsEditing(true);
      }}
      className={cn(
        'group inline-flex items-center gap-1 hover:bg-bg-sunken px-1 py-0.5 rounded-[2px] border border-transparent hover:border-rule text-left select-none transition-colors font-mono tabular-nums',
        className
      )}
      title="Click to correct inline"
    >
      <span>
        {value}
        {unit ? ` ${unit}` : ''}
      </span>
      {hasEditIndicator ? (
        <span title="Modified by inline edit" className="inline-flex items-center">
          <Pencil size={11} className="text-warning shrink-0" />
        </span>
      ) : (
        <Pencil
          size={10}
          className="text-ink-subtle opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
        />
      )}
    </button>
  );
};
