import { create } from 'zustand';

export type NotificationLevel = 'error' | 'success' | 'warning' | 'info';

export interface CashierNotification {
  id: string;
  level: NotificationLevel;
  message: string;
  timestamp: Date;
}

interface BillDiscount {
  amount: number;
  reason: string;
}

interface CashierStore {
  // ── Notifications ──────────────────────────────────────────────────
  notifications: CashierNotification[];
  addNotification: (level: NotificationLevel, message: string) => void;
  dismissNotification: (id: string) => void;
  clearAll: () => void;

  // ── Bill state ─────────────────────────────────────────────────────
  // voidedItems: orderId → Set of item indices that are voided
  voidedItems: Record<string, number[]>;
  // discounts: orderId → discount data
  discounts:   Record<string, BillDiscount>;
  serviceChargeEnabled: boolean;

  voidOrderItem:    (orderId: string, itemIndex: number) => void;
  restoreOrderItem: (orderId: string, itemIndex: number) => void;
  applyDiscount:    (orderId: string, amount: number, reason: string) => void;
  removeDiscount:   (orderId: string) => void;
  toggleServiceCharge: () => void;
  clearBillState:   (orderId: string) => void;

  // ── Shift Cash Tracking ────────────────────────────────────────────
  shiftCashTendered: number;
  shiftChangeDispensed: number;
  addShiftCash: (tendered: number, change: number) => void;
}

// ─── Initial notifications (matches design) ────────────────────────────────
const INITIAL_NOTIFICATIONS: CashierNotification[] = [];

let nextId = 10;

export const useCashierStore = create<CashierStore>((set, get) => ({
  // ── Notifications ──────────────────────────────────────────────────
  notifications: INITIAL_NOTIFICATIONS,

  addNotification: (level, message) =>
    set(state => ({
      notifications: [
        { id: `n${++nextId}`, level, message, timestamp: new Date() },
        ...state.notifications,
      ],
    })),

  dismissNotification: (id) =>
    set(state => ({
      notifications: state.notifications.filter(n => n.id !== id),
    })),

  clearAll: () => set({ notifications: [] }),

  // ── Bill state ─────────────────────────────────────────────────────
  voidedItems:          {},
  discounts:            {},
  serviceChargeEnabled: true,

  voidOrderItem: (orderId, itemIndex) =>
    set(state => {
      const existing = state.voidedItems[orderId] ?? [];
      if (existing.includes(itemIndex)) return state;
      return {
        voidedItems: { ...state.voidedItems, [orderId]: [...existing, itemIndex] },
      };
    }),

  restoreOrderItem: (orderId, itemIndex) =>
    set(state => ({
      voidedItems: {
        ...state.voidedItems,
        [orderId]: (state.voidedItems[orderId] ?? []).filter(i => i !== itemIndex),
      },
    })),

  applyDiscount: (orderId, amount, reason) =>
    set(state => ({
      discounts: { ...state.discounts, [orderId]: { amount, reason } },
    })),

  removeDiscount: (orderId) =>
    set(state => {
      const next = { ...state.discounts };
      delete next[orderId];
      return { discounts: next };
    }),

  toggleServiceCharge: () =>
    set(state => ({ serviceChargeEnabled: !state.serviceChargeEnabled })),

  clearBillState: (orderId) =>
    set(state => {
      const voided   = { ...state.voidedItems };
      const discounts = { ...state.discounts };
      delete voided[orderId];
      delete discounts[orderId];
      return { voidedItems: voided, discounts };
    }),

  // ── Shift Cash Tracking ────────────────────────────────────────────
  shiftCashTendered: 0,
  shiftChangeDispensed: 0,
  addShiftCash: (tendered, change) =>
    set((state) => ({
      shiftCashTendered: state.shiftCashTendered + tendered,
      shiftChangeDispensed: state.shiftChangeDispensed + change,
    })),
}));
