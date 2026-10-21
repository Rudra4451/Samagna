'use client';

import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import { Search } from 'lucide-react';

export interface ShortCodeLookupProps {
  onSelectBatch?: (code: string) => void;
  knownCodes?: string[];
  className?: string;
}

const DEFAULT_CODES = ['BS-402', 'BS-401', 'BS-400', 'BS-399', 'BS-398', 'BS-397', 'BS-396'];

export const ShortCodeLookup: React.FC<ShortCodeLookupProps> = ({
  onSelectBatch,
  knownCodes = DEFAULT_CODES,
  className,
}) => {
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = query.trim().toUpperCase().replace(/^#/, '');

    if (clean.length < 3 || clean.length > 8) {
      setError('Code must be 3–8 alphanumerics');
      return;
    }

    const matched = knownCodes.find(
      (c) => c.toUpperCase() === clean || c.toUpperCase() === `#${clean}`
    );

    if (matched) {
      setError(null);
      const normalizedCode = matched.startsWith('#') ? matched : `#${matched}`;
      onSelectBatch?.(normalizedCode);
    } else {
      setError('No batch with that code');
    }
  };

  return (
    <div className={cn('relative w-full max-w-[280px]', className)}>
      <form onSubmit={handleLookup} className="relative">
        <div className="relative flex items-center">
          <Search
            size={16}
            strokeWidth={1.5}
            className="absolute left-2.5 text-ink-muted pointer-events-none"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              // Accepts 3–8 alphanumerics (plus optional - or #)
              const val = e.target.value.slice(0, 9);
              setQuery(val);
              if (error) setError(null);
            }}
            placeholder="e.g. BS-402"
            maxLength={9}
            className={cn(
              'h-[36px] w-full rounded-[4px] border bg-surface pl-8 pr-3 text-[13px] font-mono tabular-nums text-ink',
              'placeholder:text-ink-subtle placeholder:font-mono transition-colors shadow-none outline-none',
              error
                ? 'border-danger focus:border-danger'
                : 'border-rule hover:border-ink-subtle focus:border-accent',
              'focus:outline-2 focus:outline-accent focus:outline-offset-0'
            )}
          />
        </div>
      </form>

      {/* Inline error only: no toast, no modal */}
      {error && (
        <p className="text-[12px] font-mono text-danger mt-1 pl-1 leading-none select-none">
          {error}
        </p>
      )}
    </div>
  );
};
