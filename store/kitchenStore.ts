import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { ActiveOrderWithItems } from './orderStore';
import { useStockStore } from './stockStore';
import { useManagerMenuStore } from './managerMenuStore';
import { useNotificationStore } from './notificationStore';

export type KitchenOrderStatus = 'Pending' | 'In Prep' | 'Ready' | 'Served';

export interface KitchenOrderItem {
  qty: number;
  name: string;
  unit_price: number;
  menu_item_id: string;
  notes?: string;
}

export interface KitchenOrder extends ActiveOrderWithItems {
  minutesAgo: number;
  orderNumber: string;
  items: KitchenOrderItem[];
}

interface KitchenStore {
  orders: KitchenOrder[];
  loading: boolean;
  fetchOrders: () => Promise<void>;
  subscribeToOrders: () => () => void;
  updateOrderStatus: (orderId: string, status: KitchenOrderStatus) => Promise<void>;
  archiveOrder: (orderId: string) => Promise<void>;
}

function minutesSince(isoString: string): number {
  const diff = Date.now() - new Date(isoString).getTime();
  return Math.floor(diff / 60000);
}

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const MOCK_ORDERS: KitchenOrder[] = [
  {
    id: 'k-001',
    table_id: 'T12',
    status: 'Pending',
    payment_status: 'unpaid',
    total_amount: 1650,
    created_at: new Date(Date.now() - 24 * 60000).toISOString(),
    minutesAgo: 24,
    orderNumber: '#1042',
    items: [
      { qty: 2, name: 'Classic Cheese Burger', unit_price: 950, menu_item_id: 'm1', notes: 'No onions\nExtra pickles' },
      { qty: 1, name: 'Large Fries', unit_price: 450, menu_item_id: 'm2' },
    ],
  },
  {
    id: 'k-002',
    table_id: 'T5',
    status: 'In Prep',
    payment_status: 'unpaid',
    total_amount: 2100,
    created_at: new Date(Date.now() - 14 * 60000).toISOString(),
    minutesAgo: 14,
    orderNumber: '#1045',
    items: [
      { qty: 1, name: 'Grilled Chicken Salad', unit_price: 1100, menu_item_id: 'm3', notes: 'Dressing on the side' },
      { qty: 2, name: 'Lemonade', unit_price: 500, menu_item_id: 'm4' },
    ],
  },
  {
    id: 'k-003',
    table_id: 'T8',
    status: 'In Prep',
    payment_status: 'unpaid',
    total_amount: 1350,
    created_at: new Date(Date.now() - 6 * 60000).toISOString(),
    minutesAgo: 6,
    orderNumber: '#1048',
    items: [
      { qty: 3, name: 'Lemon Iced Tea', unit_price: 450, menu_item_id: 'm5' },
    ],
  },
  {
    id: 'k-004',
    table_id: 'T2',
    status: 'Ready',
    payment_status: 'unpaid',
    total_amount: 1100,
    created_at: new Date(Date.now() - 18 * 60000).toISOString(),
    minutesAgo: 18,
    orderNumber: '#1039',
    items: [
      { qty: 1, name: 'Chicken Pesto Pasta', unit_price: 1100, menu_item_id: 'm6' },
    ],
  },
];

export const useKitchenStore = create<KitchenStore>((set, get) => ({
  orders: [],
  loading: false,

  fetchOrders: async () => {
    set({ loading: true });

    if (!isSupabaseConfigured) {
      set({ orders: MOCK_ORDERS, loading: false });
      return;
    }

    // Start of today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('orders')
      .select(`
        id, table_id, status, payment_status, total_amount, created_at,
        order_items (
          quantity, unit_price, menu_item_id,
          manager_menu_items ( name )
        )
      `)
      .gte('created_at', startOfToday.toISOString())
      .order('created_at', { ascending: true });

    if (!error && data) {
      const normalized: KitchenOrder[] = data.map((o: any) => ({
        id: o.id,
        table_id: o.table_id,
        status: o.status,
        payment_status: o.payment_status,
        total_amount: o.total_amount,
        created_at: o.created_at,
        minutesAgo: minutesSince(o.created_at),
        orderNumber: `#${o.id.slice(-4).toUpperCase()}`,
        items: (o.order_items ?? []).map((oi: any) => ({
          qty: oi.quantity,
          name: oi.manager_menu_items?.name ?? 'Unknown',
          unit_price: oi.unit_price,
          menu_item_id: oi.menu_item_id,
        })),
      }));
      set({ orders: normalized, loading: false });
    } else {
      set({ orders: MOCK_ORDERS, loading: false });
    }
  },

  subscribeToOrders: () => {
    if (!isSupabaseConfigured) return () => {};
    const channel = supabase
      .channel('kitchen-orders-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        get().fetchOrders();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  },

  updateOrderStatus: async (orderId: string, status: KitchenOrderStatus) => {
    const currentOrder = get().orders.find(o => o.id === orderId);

    // Optimistic UI update
    set(state => ({
      orders: state.orders.map(o => o.id === orderId ? { ...o, status } : o),
    }));

    // ── Deduct ingredients when kitchen starts preparing ──────────────
    if (status === 'In Prep' && currentOrder) {
      const { stations, deductStock } = useStockStore.getState();
      const { items: menuItems, syncAvailabilityWithStock } = useManagerMenuStore.getState();

      // Build fast lookup: stockItemId -> stationId
      const stockStationMap: Record<string, string> = {};
      stations.forEach(s => s.items.forEach(i => { stockStationMap[i.id] = s.id; }));

      for (const orderItem of currentOrder.items) {
        const menuItem = menuItems.find(m => m.id === orderItem.menu_item_id);
        if (!menuItem) continue;

        for (const li of menuItem.linkedIngredients) {
          const stationId = stockStationMap[li.ingredientId];
          if (!stationId) continue;
          const totalDeduction = li.qtyPerServing * orderItem.qty;
          // Await so each deduction completes in sequence
          await deductStock(stationId, li.ingredientId, totalDeduction);
        }
      }

      // Re-evaluate menu item availability based on new stock levels
      syncAvailabilityWithStock();
    }
    // ────────────────────────────────────────────────────────────

    if (!isSupabaseConfigured) return;
    await supabase.from('orders').update({ status }).eq('id', orderId);

    if (status === 'Ready' && currentOrder) {
      useNotificationStore.getState().emitNotification(
        'Waiter',
        `Order Ready: Table ${currentOrder.table_id}`,
        `Order #${currentOrder.id.slice(-4).toUpperCase()} is ready to be served.`,
        'success'
      );
    }
  },

  archiveOrder: async (orderId: string) => {
    set(state => ({ orders: state.orders.filter(o => o.id !== orderId) }));
    if (!isSupabaseConfigured) return;
    await supabase.from('orders').update({ status: 'Served' }).eq('id', orderId);
  },
}));
