'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface RowActionItem {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'danger';
}

interface RowActionMenuProps {
  actions: [RowActionItem, RowActionItem, RowActionItem]; // Exactly 3 actions per Rule 9
  ariaLabel?: string;
}

export const RowActionMenu: React.FC<RowActionMenuProps> = ({
  actions,
  ariaLabel = 'Row actions',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className={cn(
          'w-7 h-7 rounded-[2px] border border-transparent hover:border-rule flex items-center justify-center text-ink-muted hover:text-ink hover:bg-bg-sunken/60 transition-colors',
          isOpen && 'border-rule bg-bg-sunken text-ink'
        )}
        aria-label={ariaLabel}
        aria-expanded={isOpen}
      >
        <MoreVertical size={15} strokeWidth={1.5} />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1 w-44 rounded-[2px] border border-rule bg-surface p-1 shadow-none z-30 space-y-0.5"
          onClick={(e) => e.stopPropagation()}
        >
          {actions.map((act, idx) => (
            <button
              key={idx}
              role="menuitem"
              onClick={() => {
                setIsOpen(false);
                act.onClick();
              }}
              className={cn(
                'w-full text-left px-2.5 py-1.5 rounded-[2px] text-[12px] font-mono transition-colors block',
                act.variant === 'danger'
                  ? 'text-danger hover:bg-danger/10'
                  : 'text-ink hover:bg-bg-sunken'
              )}
            >
              {act.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
