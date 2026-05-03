import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export type PaymentMethod = 'Cash' | 'Card' | 'M-Pesa';
export type VoidDiscountType = 'void' | 'discount';

export interface TransactionRecord {
  id: string;
  tableId: string;
  orderId: string;
  orderNumber: string;
  amount: number;
  paymentMethod: PaymentMethod;
  waiter: string;
  timestamp: Date;
}

export interface VoidDiscountRecord {
  id: string;
  itemName: string;
  type: VoidDiscountType;
  amount: number;
  reason: string;
  timestamp: Date;
  auth: string; // 'Mgr' | 'Auto' | cashier name
}

interface ReportsStore {
  transactions: TransactionRecord[];
  voidDiscountLog: VoidDiscountRecord[];

  recordTransaction: (
    tableId: string,
    orderId: string,
    amount: number,
    method: PaymentMethod,
    waiter?: string,
  ) => void;

  recordVoid: (
    itemName: string,
    amount: number,
    reason: string,
    auth?: string,
  ) => void;

  recordDiscount: (
    label: string,
    amount: number,
    reason: string,
    auth?: string,
    orderId?: string,
    tableId?: string,
  ) => Promise<void>;

  fetchDiscounts: () => Promise<void>;

  clearShiftData: () => void;

  // ── Receipts ───────────────────────────────────────────────────────
  reprintedIds: string[];
  markReprinted: (txId: string) => void;
}

let nextTxId  = 0;
let nextVdId  = 0;

export const useReportsStore = create<ReportsStore>((set) => ({
  transactions:    [],
  voidDiscountLog: [],
  reprintedIds:    [],

  recordTransaction: (tableId, orderId, amount, method, waiter = 'Staff') =>
    set(state => ({
      transactions: [
        {
          id:            `tr${++nextTxId}`,
          tableId,
          orderId,
          orderNumber:   `#${orderId.slice(-4).toUpperCase().padStart(4, '0')}`,
          amount,
          paymentMethod: method,
          waiter,
          timestamp:     new Date(),
        },
        ...state.transactions,
      ],
    })),

  recordVoid: (itemName, amount, reason, auth = 'Cashier') =>
    set(state => ({
      voidDiscountLog: [
        { id: `vd${++nextVdId}`, itemName, type: 'void', amount, reason, timestamp: new Date(), auth },
        ...state.voidDiscountLog,
      ],
    })),

  recordDiscount: async (label, amount, reason, auth = 'Auto', orderId, tableId) => {
    // 1. Insert into Supabase
    if (supabase) {
      try {
        await supabase.from('discounts').insert({
          item_name: label,
          amount,
          reason,
          auth,
          role: auth,
          order_id: orderId || null,
          table_id: tableId || null,
        });
      } catch (e) {
        console.error('Failed to sync discount to Supabase:', e);
      }
    }

    // 2. Update local state
    set(state => ({
      voidDiscountLog: [
        { id: `vd${++nextVdId}`, itemName: label, type: 'discount', amount, reason, timestamp: new Date(), auth },
        ...state.voidDiscountLog,
      ],
    }));
  },

  fetchDiscounts: async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('discounts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        const mappedDiscounts = data.map((d: any) => ({
          id: d.id,
          itemName: d.item_name,
          type: 'discount' as VoidDiscountType,
          amount: d.amount,
          reason: d.reason,
          timestamp: new Date(d.created_at),
          auth: d.auth,
        }));
        
        // Merge with existing void logs, replacing existing discounts
        set(state => {
          const voids = state.voidDiscountLog.filter(v => v.type === 'void');
          const merged = [...voids, ...mappedDiscounts].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
          return { voidDiscountLog: merged };
        });
      }
    } catch (e) {
      console.error('Failed to fetch discounts:', e);
    }
  },

  clearShiftData: () => set({ transactions: [], voidDiscountLog: [], reprintedIds: [] }),

  markReprinted: (txId) =>
    set(state => ({
      reprintedIds: state.reprintedIds.includes(txId)
        ? state.reprintedIds
        : [...state.reprintedIds, txId],
    })),
}));
