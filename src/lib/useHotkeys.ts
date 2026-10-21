'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export interface UseHotkeysOptions {
  rowCount: number;
  onOpenRow?: (index: number) => void;
  onEscape?: () => boolean | void;
  searchInputRef?: React.RefObject<HTMLInputElement>;
  onSync?: () => void;
  activeFilterCount?: number;
  onClearFilters?: () => void;
  enabled?: boolean;
}

export function useHotkeys({
  rowCount,
  onOpenRow,
  onEscape,
  searchInputRef,
  onSync,
  activeFilterCount = 0,
  onClearFilters,
  enabled = true,
}: UseHotkeysOptions) {
  const router = useRouter();
  const pathname = usePathname();

  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);
  const gChordTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isGChordActiveRef = useRef<boolean>(false);

  // Reset selected index if rowCount changes and index is out of bounds
  useEffect(() => {
    if (rowCount === 0) {
      setSelectedIndex(-1);
    } else if (selectedIndex >= rowCount) {
      setSelectedIndex(rowCount - 1);
    } else if (selectedIndex < 0 && rowCount > 0) {
      setSelectedIndex(0);
    }
  }, [rowCount, selectedIndex]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Never run if disabled or in collector view
      if (!enabled || pathname.startsWith('/collector')) return;

      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      // Handle Escape anywhere, even when focused in an input
      if (e.key === 'Escape') {
        e.preventDefault();

        // 1. Close shortcuts drawer if open
        if (isShortcutsOpen) {
          setIsShortcutsOpen(false);
          return;
        }

        // 2. Delegate to custom onEscape (e.g. drawer/sheet)
        if (onEscape) {
          const handled = onEscape();
          if (handled) return;
        }

        // 3. Blur search input if currently focused
        if (
          searchInputRef?.current &&
          document.activeElement === searchInputRef.current
        ) {
          searchInputRef.current.blur();
          return;
        }

        // 4. Clear active filters
        if (activeFilterCount > 0 && onClearFilters) {
          onClearFilters();
          return;
        }
        return;
      }

      // If user is typing in an input/textarea/select, ignore navigation hotkeys
      if (isInput) return;

      // Handle '?' to toggle keyboard shortcuts drawer
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
        return;
      }

      // Handle '/' to focus search box from anywhere
      if (e.key === '/') {
        e.preventDefault();
        searchInputRef?.current?.focus();
        return;
      }

      // Handle 'g then c / i / s' navigation chords
      if (e.key.toLowerCase() === 'g' && !isGChordActiveRef.current) {
        isGChordActiveRef.current = true;
        if (gChordTimeoutRef.current) clearTimeout(gChordTimeoutRef.current);
        gChordTimeoutRef.current = setTimeout(() => {
          isGChordActiveRef.current = false;
        }, 1200);
        return;
      }

      if (isGChordActiveRef.current) {
        isGChordActiveRef.current = false;
        if (gChordTimeoutRef.current) clearTimeout(gChordTimeoutRef.current);

        const key = e.key.toLowerCase();
        if (key === 'c') {
          e.preventDefault();
          router.push('/collection');
          return;
        }
        if (key === 'i') {
          e.preventDefault();
          router.push('/inventory');
          return;
        }
        if (key === 's') {
          e.preventDefault();
          router.push('/settings/sync');
          return;
        }
      }

      // Handle 'j' (move down)
      if (e.key === 'j') {
        e.preventDefault();
        setSelectedIndex((prev) => (rowCount > 0 ? Math.min(prev + 1, rowCount - 1) : 0));
        return;
      }

      // Handle 'k' (move up)
      if (e.key === 'k') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        return;
      }

      // Handle 'Enter' (open selected row)
      if (e.key === 'Enter') {
        if (selectedIndex >= 0 && selectedIndex < rowCount && onOpenRow) {
          e.preventDefault();
          onOpenRow(selectedIndex);
        }
        return;
      }

      // Handle 's' for sync trigger
      if (e.key.toLowerCase() === 's' && onSync) {
        e.preventDefault();
        onSync();
        return;
      }
    },
    [
      enabled,
      pathname,
      isShortcutsOpen,
      onEscape,
      searchInputRef,
      activeFilterCount,
      onClearFilters,
      rowCount,
      selectedIndex,
      onOpenRow,
      onSync,
      router,
    ]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (gChordTimeoutRef.current) clearTimeout(gChordTimeoutRef.current);
    };
  }, [handleKeyDown]);

  return {
    selectedIndex,
    setSelectedIndex,
    isShortcutsOpen,
    setIsShortcutsOpen,
  };
}
