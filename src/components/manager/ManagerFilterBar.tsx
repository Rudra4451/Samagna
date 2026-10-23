'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, SlidersHorizontal, Settings2, X, RotateCcw } from 'lucide-react';
import { cn } from '../../lib/utils';

export type SavedViewType = 'all' | 'today' | 'discrepancies' | 'awaiting_payment' | 'pending_verification';
export type TableDensity = 'comfortable' | 'compact';

export interface ColumnConfig {
  id: string;
  label: string;
  visible: boolean;
}

export interface ManagerFiltersState {
  savedView: SavedViewType;
  search: string;
  statuses: string[];
  village: string;
  dateFrom: string;
  dateTo: string;
}

export const DEFAULT_MANAGER_FILTERS: ManagerFiltersState = {
  savedView: 'all',
  search: '',
  statuses: [],
  village: '',
  dateFrom: '',
  dateTo: '',
};

interface ManagerFilterBarProps {
  roleKey: 'collection' | 'inventory';
  availableStatuses: { value: string; label: string }[];
  availableVillages: string[];
  columns: ColumnConfig[];
  onColumnsChange: (cols: ColumnConfig[]) => void;
  density: TableDensity;
  onDensityChange: (d: TableDensity) => void;
  filters: ManagerFiltersState;
  onFiltersChange: (f: ManagerFiltersState) => void;
  searchInputRef: React.RefObject<HTMLInputElement>;
  totalCount: number;
  filteredCount: number;
  lastRefreshed: Date;
  onRefresh: () => void;
}

export const ManagerFilterBar: React.FC<ManagerFilterBarProps> = ({
  roleKey,
  availableStatuses,
  availableVillages,
  columns,
  onColumnsChange,
  density,
  onDensityChange,
  filters,
  onFiltersChange,
  searchInputRef,
  totalCount,
  filteredCount,
  lastRefreshed,
  onRefresh,
}) => {
  const [searchInput, setSearchInput] = useState(filters.search);
  const [isColPopoverOpen, setIsColPopoverOpen] = useState(false);
  const colPopoverRef = useRef<HTMLDivElement>(null);

  // Time elapsed for refreshed-at indicator (Rule 11)
  const [secondsAgo, setSecondsAgo] = useState(0);

  useEffect(() => {
    const updateElapsed = () => {
      const diff = Math.max(0, Math.floor((Date.now() - lastRefreshed.getTime()) / 1000));
      setSecondsAgo(diff);
    };
    updateElapsed();
    const interval = setInterval(updateElapsed, 2000);
    return () => clearInterval(interval);
  }, [lastRefreshed]);

  // Debounce search 150ms per Rule 2
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        onFiltersChange({ ...filters, search: searchInput });
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [searchInput, filters, onFiltersChange]);

  // Sync internal search input with external filter resets
  useEffect(() => {
    setSearchInput(filters.search);
  }, [filters.search]);

  // Close column popover on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (colPopoverRef.current && !colPopoverRef.current.contains(e.target as Node)) {
        setIsColPopoverOpen(false);
      }
    };
    if (isColPopoverOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isColPopoverOpen]);

  // Toggle single status in multi-select chips
  const toggleStatus = (statusVal: string) => {
    const current = new Set(filters.statuses);
    if (current.has(statusVal)) {
      current.delete(statusVal);
    } else {
      current.add(statusVal);
    }
    onFiltersChange({
      ...filters,
      statuses: Array.from(current),
      // If manually picking status, savedView goes to custom if not matching
      savedView: 'all',
    });
  };

  // Saved view handler (Rule 3)
  const setSavedView = (view: SavedViewType) => {
    if (view === 'all') {
      onFiltersChange({
        ...filters,
        savedView: 'all',
        statuses: [],
      });
    } else if (view === 'today') {
      const todayIso = new Date().toISOString().split('T')[0];
      onFiltersChange({
        ...filters,
        savedView: 'today',
        dateFrom: todayIso,
        dateTo: todayIso,
        statuses: [],
      });
    } else if (view === 'discrepancies') {
      onFiltersChange({
        ...filters,
        savedView: 'discrepancies',
        statuses: roleKey === 'collection' ? ['In Review', 'Quarantined'] : ['Quarantined'],
      });
    } else if (view === 'awaiting_payment') {
      onFiltersChange({
        ...filters,
        savedView: 'awaiting_payment',
        statuses: ['Collected', 'Scheduled'],
      });
    } else if (view === 'pending_verification') {
      onFiltersChange({
        ...filters,
        savedView: 'pending_verification',
        statuses: roleKey === 'collection' ? ['Pending'] : ['Pending Verification'],
      });
    }
  };

  // Toggle single column visibility
  const toggleColumn = (colId: string) => {
    const updated = columns.map((col) =>
      col.id === colId ? { ...col, visible: !col.visible } : col
    );
    onColumnsChange(updated);
  };

  // Active filters calculation
  const hasActiveFilters =
    filters.search.trim().length > 0 ||
    filters.statuses.length > 0 ||
    filters.village !== '' ||
    filters.dateFrom !== '' ||
    filters.dateTo !== '' ||
    filters.savedView !== 'all';

  const clearAllFilters = () => {
    setSearchInput('');
    onFiltersChange({
      savedView: 'all',
      search: '',
      statuses: [],
      village: '',
      dateFrom: '',
      dateTo: '',
    });
  };

  return (
    <div className="space-y-3">
      {/* Rule 11: Refreshed-at indicator & Total count */}
      <div className="flex items-center justify-between text-[11px] font-mono text-ink-subtle">
        <div className="flex items-center gap-1.5">
          <span>
            Showing {filteredCount} of {totalCount} batches
          </span>
          <span>·</span>
          <span>
            refreshed {secondsAgo === 0 ? 'just now' : `${secondsAgo}s ago`}
          </span>
          <span>·</span>
          {/* Manual refresh is a rectangular link, NOT a button */}
          <button
            onClick={onRefresh}
            className="text-ink hover:text-accent underline font-semibold focus:outline-2 focus:outline-accent"
          >
            Refresh
          </button>
        </div>

        {/* Shortcuts Hint (Rule 1: Footer/Header hint in 11px ink-subtle) */}
        <div className="hidden md:flex items-center gap-2.5 text-ink-subtle font-mono">
          <span>
            <kbd className="px-1 border border-rule bg-bg-sunken text-ink font-semibold">j</kbd>/
            <kbd className="px-1 border border-rule bg-bg-sunken text-ink font-semibold">k</kbd> Navigate
          </span>
          <span>·</span>
          <span>
            <kbd className="px-1 border border-rule bg-bg-sunken text-ink font-semibold">Enter</kbd> Open
          </span>
          <span>·</span>
          <span>
            <kbd className="px-1 border border-rule bg-bg-sunken text-ink font-semibold">/</kbd> Search
          </span>
          <span>·</span>
          <span>
            <kbd className="px-1 border border-rule bg-bg-sunken text-ink font-semibold">?</kbd> Shortcuts
          </span>
        </div>
      </div>

      {/* Main Filter Strip: Saved Views & Search Box */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 pt-1">
        {/* Saved Views (Rule 3) */}
        <div
          role="tablist"
          aria-label="Saved Views"
          className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0"
        >
          <button
            onClick={() => setSavedView('all')}
            className={cn(
              'h-[32px] px-3 rounded-[2px] border text-[12px] font-medium transition-colors select-none shrink-0',
              filters.savedView === 'all'
                ? 'border-accent bg-accent text-accent-ink font-semibold'
                : 'border-rule bg-surface text-ink hover:bg-bg-sunken hover:border-ink-subtle'
            )}
          >
            All Batches
          </button>
          <button
            onClick={() => setSavedView('today')}
            className={cn(
              'h-[32px] px-3 rounded-[2px] border text-[12px] font-medium transition-colors select-none shrink-0',
              filters.savedView === 'today'
                ? 'border-accent bg-accent text-accent-ink font-semibold'
                : 'border-rule bg-surface text-ink hover:bg-bg-sunken hover:border-ink-subtle'
            )}
          >
            Today
          </button>
          <button
            onClick={() => setSavedView('discrepancies')}
            className={cn(
              'h-[32px] px-3 rounded-[2px] border text-[12px] font-medium transition-colors select-none shrink-0',
              filters.savedView === 'discrepancies'
                ? 'border-danger bg-danger text-surface font-semibold'
                : 'border-rule bg-surface text-danger hover:bg-danger/5 hover:border-danger'
            )}
          >
            Discrepancies
          </button>
          <button
            onClick={() => setSavedView('awaiting_payment')}
            className={cn(
              'h-[32px] px-3 rounded-[2px] border text-[12px] font-medium transition-colors select-none shrink-0',
              filters.savedView === 'awaiting_payment'
                ? 'border-accent bg-accent text-accent-ink font-semibold'
                : 'border-rule bg-surface text-ink hover:bg-bg-sunken hover:border-ink-subtle'
            )}
          >
            Awaiting Payment
          </button>
          <button
            onClick={() => setSavedView('pending_verification')}
            className={cn(
              'h-[32px] px-3 rounded-[2px] border text-[12px] font-medium transition-colors select-none shrink-0',
              filters.savedView === 'pending_verification'
                ? 'border-warning bg-warning text-surface font-semibold'
                : 'border-rule bg-surface text-ink hover:bg-bg-sunken hover:border-ink-subtle'
            )}
          >
            Pending Verification
          </button>
        </div>

        {/* Global Search Box (Rule 2) */}
        <div className="relative min-w-[260px] max-w-full lg:max-w-[340px]">
          <label htmlFor="manager-search-input" className="sr-only">
            Search code, collector, village, product
          </label>
          <Search
            size={15}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-subtle pointer-events-none"
          />
          <input
            id="manager-search-input"
            ref={searchInputRef}
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search code, collector, village, product… (/)"
            className="w-full h-[34px] pl-8 pr-8 rounded-[2px] border border-rule bg-surface text-[13px] text-ink placeholder:text-ink-subtle focus:border-accent focus:outline-none"
          />
          {searchInput && (
            <button
              onClick={() => {
                setSearchInput('');
                onFiltersChange({ ...filters, search: '' });
                searchInputRef.current?.focus();
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Secondary Controls: Status Chips, Village Select, Date Range, Density & Column Vis */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 border-t border-rule">
        {/* Left Side: Status Chips + Village + Dates */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter Chips (Rectangular) */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-mono text-ink-subtle uppercase font-bold mr-1">
              Status:
            </span>
            {availableStatuses.map((st) => {
              const isSelected = filters.statuses.includes(st.value);
              return (
                <button
                  key={st.value}
                  onClick={() => toggleStatus(st.value)}
                  className={cn(
                    'h-[26px] px-2 rounded-[2px] border text-[11px] font-mono transition-colors select-none',
                    isSelected
                      ? 'border-accent bg-accent/15 text-accent font-bold'
                    : 'border-rule bg-surface text-ink-muted hover:text-ink hover:border-ink-subtle'
                  )}
                >
                  {st.label}
                </button>
              );
            })}
          </div>

          <span className="text-rule">|</span>

          {/* Village Filter (Single select) */}
          <div className="flex items-center gap-1.5">
            <label
              htmlFor="manager-village-select"
              className="text-[11px] font-mono text-ink-subtle uppercase font-bold"
            >
              Village:
            </label>
            <select
              id="manager-village-select"
              value={filters.village}
              onChange={(e) =>
                onFiltersChange({ ...filters, village: e.target.value, savedView: 'all' })
              }
              className="h-[26px] px-2 rounded-[2px] border border-rule bg-surface text-[12px] text-ink font-mono focus:border-accent focus:outline-none"
            >
              <option value="">All Villages</option>
              {availableVillages.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          <span className="text-rule">|</span>

          {/* Date Range: Two rectangular date inputs, no calendar widget */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-mono text-ink-subtle uppercase font-bold">
              Dates:
            </span>
            <label htmlFor="manager-date-from" className="sr-only">
              From date
            </label>
            <input
              id="manager-date-from"
              type="date"
              value={filters.dateFrom}
              onChange={(e) =>
                onFiltersChange({ ...filters, dateFrom: e.target.value, savedView: 'all' })
              }
              className="h-[26px] px-1.5 rounded-[2px] border border-rule bg-surface text-[11px] font-mono text-ink focus:border-accent focus:outline-none"
              title="From date"
            />
            <span className="text-[11px] font-mono text-ink-subtle">to</span>
            <label htmlFor="manager-date-to" className="sr-only">
              To date
            </label>
            <input
              id="manager-date-to"
              type="date"
              value={filters.dateTo}
              onChange={(e) =>
                onFiltersChange({ ...filters, dateTo: e.target.value, savedView: 'all' })
              }
              className="h-[26px] px-1.5 rounded-[2px] border border-rule bg-surface text-[11px] font-mono text-ink focus:border-accent focus:outline-none"
              title="To date"
            />
          </div>
        </div>

        {/* Right Side: Table Density & Column Visibility Gear */}
        <div className="flex items-center gap-2">
          {/* Table Density Toggle (Rule 4) */}
          <div className="flex items-center rounded-[2px] border border-rule bg-surface p-0.5">
            <button
              onClick={() => onDensityChange('comfortable')}
              className={cn(
                'h-[24px] px-2 rounded-[2px] text-[11px] font-mono transition-colors select-none',
                density === 'comfortable'
                  ? 'bg-bg-sunken text-ink font-bold border border-rule'
                  : 'text-ink-muted hover:text-ink'
              )}
              title="Comfortable density (44px rows)"
            >
              Comfortable
            </button>
            <button
              onClick={() => onDensityChange('compact')}
              className={cn(
                'h-[24px] px-2 rounded-[2px] text-[11px] font-mono transition-colors select-none',
                density === 'compact'
                  ? 'bg-bg-sunken text-ink font-bold border border-rule'
                  : 'text-ink-muted hover:text-ink'
              )}
              title="Compact density (32px rows)"
            >
              Compact
            </button>
          </div>

          {/* Column Visibility Gear Popover (Rule 7) */}
          <div className="relative" ref={colPopoverRef}>
            <button
              onClick={() => setIsColPopoverOpen((prev) => !prev)}
              className={cn(
                'w-[28px] h-[28px] rounded-[2px] border flex items-center justify-center transition-colors',
                isColPopoverOpen
                  ? 'border-accent bg-bg-sunken text-accent'
                  : 'border-rule bg-surface text-ink-muted hover:text-ink hover:border-ink-subtle'
              )}
              title="Configure visible columns"
              aria-label="Configure columns"
            >
              <Settings2 size={15} strokeWidth={1.5} />
            </button>

            {isColPopoverOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 rounded-[2px] border border-rule bg-surface p-2 shadow-none z-30 space-y-1.5">
                <span className="text-[10px] font-mono uppercase tracking-[0.06em] text-ink-muted font-bold block pb-1 border-b border-rule">
                  Toggle Columns
                </span>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {columns.map((col) => (
                    <label
                      key={col.id}
                      className="flex items-center gap-2 p-1 text-[12px] font-mono text-ink hover:bg-bg-sunken/60 cursor-pointer rounded-[2px]"
                    >
                      <input
                        type="checkbox"
                        checked={col.visible}
                        onChange={() => toggleColumn(col.id)}
                        disabled={col.id === 'code'} // Primary batch code cannot be hidden
                        className="rounded-[2px] border-rule text-accent focus:ring-0 focus:ring-offset-0"
                      />
                      <span className={cn(col.id === 'code' && 'font-bold text-ink-muted')}>
                        {col.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Active Filters Inline Row (Rule 3) */}
      {hasActiveFilters && (
        <div className="flex items-center gap-1.5 flex-wrap text-[11px] font-mono text-ink-muted bg-bg-sunken/40 p-1.5 border border-rule rounded-[2px]">
          <span className="font-semibold text-ink uppercase">Active:</span>

          {filters.savedView !== 'all' && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] border border-rule bg-surface text-ink">
              View: {filters.savedView.replace('_', ' ')}
            </span>
          )}

          {filters.search && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] border border-rule bg-surface text-ink">
              Search: &quot;{filters.search}&quot;
              <button
                onClick={() => {
                  setSearchInput('');
                  onFiltersChange({ ...filters, search: '' });
                }}
                className="hover:text-danger"
              >
                ✕
              </button>
            </span>
          )}

          {filters.village && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] border border-rule bg-surface text-ink">
              Village: {filters.village}
              <button
                onClick={() => onFiltersChange({ ...filters, village: '', savedView: 'all' })}
                className="hover:text-danger"
              >
                ✕
              </button>
            </span>
          )}

          {filters.statuses.map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] border border-rule bg-surface text-ink"
            >
              Status: {s}
              <button onClick={() => toggleStatus(s)} className="hover:text-danger">
                ✕
              </button>
            </span>
          ))}

          {(filters.dateFrom || filters.dateTo) && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] border border-rule bg-surface text-ink">
              Date: {filters.dateFrom || 'start'} to {filters.dateTo || 'end'}
              <button
                onClick={() =>
                  onFiltersChange({ ...filters, dateFrom: '', dateTo: '', savedView: 'all' })
                }
                className="hover:text-danger"
              >
                ✕
              </button>
            </span>
          )}

          <button
            onClick={clearAllFilters}
            className="ml-auto text-danger hover:underline font-bold"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
};
