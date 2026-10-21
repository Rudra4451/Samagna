import { create } from 'zustand';

export type DemoRole = 'collector' | 'collection_manager' | 'inventory_manager';
export type AppLanguage = 'EN' | 'OR';
export type CollectorTab = 'home' | 'prices' | 'requests' | 'help';

export interface PendingRecord {
  id: string;
  title: string;
  detail: string;
  timestamp: string;
}

interface AppState {
  // Offline State
  isOffline: boolean;
  pendingRecords: PendingRecord[];
  isSyncing: boolean;
  toggleOffline: () => void;
  setOffline: (offline: boolean) => void;
  syncNow: () => void;

  // Role State
  activeRole: DemoRole;
  setActiveRole: (role: DemoRole) => void;

  // Language State
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;

  // Collector Tab State
  activeCollectorTab: CollectorTab;
  setActiveCollectorTab: (tab: CollectorTab) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  isOffline: false,
  pendingRecords: [
    {
      id: 'LOC-REC-8840-BS402',
      title: 'Batch #BS-402 Field Verification (100.00 kg)',
      detail: 'Electronic scale readout stored in local device cache (IndexedDB/Simulated).',
      timestamp: '2024-04-18 11:20 AM IST',
    },
  ],
  isSyncing: false,

  toggleOffline: () =>
    set((state) => ({
      isOffline: !state.isOffline,
    })),

  setOffline: (offline: boolean) =>
    set({
      isOffline: offline,
    }),

  syncNow: () => {
    set({ isSyncing: true });
    setTimeout(() => {
      set({
        isSyncing: false,
        pendingRecords: [],
        isOffline: false,
      });
    }, 600);
  },

  activeRole: 'collector',
  setActiveRole: (role: DemoRole) =>
    set({
      activeRole: role,
    }),

  language: 'EN',
  setLanguage: (lang: AppLanguage) =>
    set({
      language: lang,
    }),

  activeCollectorTab: 'home',
  setActiveCollectorTab: (tab: CollectorTab) =>
    set({
      activeCollectorTab: tab,
    }),
}));
