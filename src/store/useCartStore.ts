import { create } from 'zustand';
import { BuyerCategory, getStoredCommercialConfig } from '../lib/marketplace';

export interface CartItem {
  id: string; // composite key
  productId: string;
  productName: string;
  scientificName: string;
  imagePath: string;
  batchCode: string;
  depotId: string;
  depotName: string;
  buyerType: BuyerCategory;
  packDescription: string;
  unitWeightKg: number;
  quantityUnits: number;
  totalKg: number;
  unitPriceInr: number;
  subtotalInr: number;
  commissionRate: number;
  commissionAmount: number;
  sellerAmount: number;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'id' | 'totalKg' | 'subtotalInr' | 'commissionAmount' | 'sellerAmount' | 'commissionRate'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, units: number) => void;
  clearCart: () => void;
  getTotalItemsCount: () => number;
  getTotalKg: () => number;
  getTotalGross: () => number;
  getTotalCommission: () => number;
  getTotalSellerSettlement: () => number;
}

const CART_STORAGE_KEY = 'samagna_marketplace_cart';

function loadPersistedCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persistCart(items: CartItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to persist cart:', e);
  }
}

export const useCartStore = create<CartState>((set, get) => ({
  items: typeof window !== 'undefined' ? loadPersistedCart() : [],

  addItem: (itemInput) => {
    const config = getStoredCommercialConfig();
    const commissionRate = itemInput.buyerType === 'B2B' ? config.b2bCommissionPercent : config.b2cCommissionPercent;
    const itemId = `${itemInput.productId}-${itemInput.buyerType}-${itemInput.packDescription}`;

    set((state) => {
      const existingIdx = state.items.findIndex((i) => i.id === itemId);
      let updatedItems: CartItem[];

      if (existingIdx >= 0) {
        const existing = state.items[existingIdx];
        const newUnits = existing.quantityUnits + itemInput.quantityUnits;
        const totalKg = Number((newUnits * existing.unitWeightKg).toFixed(2));
        const subtotalInr = Number((newUnits * existing.unitPriceInr).toFixed(2));
        const commissionAmount = Number(((subtotalInr * commissionRate) / 100).toFixed(2));
        const sellerAmount = Number((subtotalInr - commissionAmount).toFixed(2));

        updatedItems = [...state.items];
        updatedItems[existingIdx] = {
          ...existing,
          quantityUnits: newUnits,
          totalKg,
          subtotalInr,
          commissionAmount,
          sellerAmount,
        };
      } else {
        const totalKg = Number((itemInput.quantityUnits * itemInput.unitWeightKg).toFixed(2));
        const subtotalInr = Number((itemInput.quantityUnits * itemInput.unitPriceInr).toFixed(2));
        const commissionAmount = Number(((subtotalInr * commissionRate) / 100).toFixed(2));
        const sellerAmount = Number((subtotalInr - commissionAmount).toFixed(2));

        const newItem: CartItem = {
          ...itemInput,
          id: itemId,
          commissionRate,
          totalKg,
          subtotalInr,
          commissionAmount,
          sellerAmount,
        };
        updatedItems = [newItem, ...state.items];
      }

      persistCart(updatedItems);
      return { items: updatedItems };
    });
  },

  removeItem: (id) => {
    set((state) => {
      const updated = state.items.filter((i) => i.id !== id);
      persistCart(updated);
      return { items: updated };
    });
  },

  updateQuantity: (id, units) => {
    if (units <= 0) {
      get().removeItem(id);
      return;
    }
    set((state) => {
      const updated = state.items.map((item) => {
        if (item.id !== id) return item;
        const totalKg = Number((units * item.unitWeightKg).toFixed(2));
        const subtotalInr = Number((units * item.unitPriceInr).toFixed(2));
        const commissionAmount = Number(((subtotalInr * item.commissionRate) / 100).toFixed(2));
        const sellerAmount = Number((subtotalInr - commissionAmount).toFixed(2));
        return {
          ...item,
          quantityUnits: units,
          totalKg,
          subtotalInr,
          commissionAmount,
          sellerAmount,
        };
      });
      persistCart(updated);
      return { items: updated };
    });
  },

  clearCart: () => {
    persistCart([]);
    set({ items: [] });
  },

  getTotalItemsCount: () => {
    return get().items.reduce((acc, i) => acc + i.quantityUnits, 0);
  },

  getTotalKg: () => {
    return Number(get().items.reduce((acc, i) => acc + i.totalKg, 0).toFixed(2));
  },

  getTotalGross: () => {
    return Number(get().items.reduce((acc, i) => acc + i.subtotalInr, 0).toFixed(2));
  },

  getTotalCommission: () => {
    return Number(get().items.reduce((acc, i) => acc + i.commissionAmount, 0).toFixed(2));
  },

  getTotalSellerSettlement: () => {
    return Number(get().items.reduce((acc, i) => acc + i.sellerAmount, 0).toFixed(2));
  },
}));
