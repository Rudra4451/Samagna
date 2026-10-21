'use client';

import React from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerBody,
  DrawerFooter,
  DrawerClose,
} from '../ui/Drawer';
import { Button } from '../ui/Button';
import { Keyboard, X } from 'lucide-react';

interface KeyboardShortcutsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SHORTCUT_GROUPS = [
  {
    title: 'Row Selection & Navigation',
    items: [
      { key: 'j', label: 'Move selection down to next batch' },
      { key: 'k', label: 'Move selection up to previous batch' },
      { key: 'Enter', label: 'Open selected batch drawer' },
    ],
  },
  {
    title: 'Search & Filtering',
    items: [
      { key: '/', label: 'Focus global search box' },
      { key: 'Esc', label: 'Dismiss drawer → blur search → clear filters' },
    ],
  },
  {
    title: 'Rapid Role Routing (Chord)',
    items: [
      { key: 'g then c', label: 'Go to Collection management (/collection)' },
      { key: 'g then i', label: 'Go to Inventory verification (/inventory)' },
      { key: 'g then s', label: 'Go to Sync & queue settings (/settings/sync)' },
    ],
  },
  {
    title: 'Actions & Utilities',
    items: [
      { key: '?', label: 'Open this keyboard shortcuts drawer' },
      { key: 's', label: 'Trigger background synchronization' },
    ],
  },
];

export const KeyboardShortcutsDrawer: React.FC<KeyboardShortcutsDrawerProps> = ({
  open,
  onOpenChange,
}) => {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="w-full sm:max-w-[460px] border-l border-rule bg-surface p-0">
        <DrawerHeader className="border-b border-rule p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-[4px] border border-rule bg-bg-sunken flex items-center justify-center text-ink">
                <Keyboard size={16} strokeWidth={1.5} />
              </div>
              <DrawerTitle className="text-[17px] font-semibold text-ink">
                Keyboard Shortcuts
              </DrawerTitle>
            </div>
            <DrawerClose asChild>
              <button
                className="w-7 h-7 rounded-[4px] border border-rule bg-surface flex items-center justify-center text-ink-muted hover:text-ink hover:bg-bg-sunken focus:outline-2 focus:outline-accent"
                aria-label="Close shortcuts drawer"
              >
                <X size={15} />
              </button>
            </DrawerClose>
          </div>
          <DrawerDescription className="text-[12px] text-ink-subtle mt-1 font-mono">
            Optimized for rapid desktop data entry and zero-mouse inspection.
          </DrawerDescription>
        </DrawerHeader>

        <DrawerBody className="p-4 space-y-5 overflow-y-auto max-h-[calc(100vh-140px)]">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.title} className="space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-[0.06em] text-ink-muted font-bold block">
                {group.title}
              </span>
              <div className="border border-rule rounded-[4px] divide-y divide-rule bg-bg/40">
                {group.items.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between p-2.5 text-[13px]"
                  >
                    <span className="text-ink leading-snug">{item.label}</span>
                    <kbd className="px-2 py-0.5 rounded-[2px] border border-rule bg-bg-sunken font-mono text-[11px] font-semibold text-ink shrink-0 ml-3">
                      {item.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </DrawerBody>

        <DrawerFooter className="border-t border-rule p-3 bg-bg-sunken/40 flex items-center justify-between text-[11px] text-ink-subtle font-mono">
          <span>Press Esc anytime to close</span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-[32px] px-3 text-[12px]"
          >
            Done
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
