import { create } from 'zustand';
import { supabase, isSupabaseConfigured, DbMenuItem } from '../lib/supabase';
import { useNotificationStore } from './notificationStore';

export interface CartItem extends DbMenuItem {
  quantity: number;
}

export interface ActiveOrderWithItems {
  id: string;
  table_id: string;
  status: string;
  payment_status: string;
  payment_method?: string;
  total_amount: number;
  created_at: string;
  items: {
    qty: number;
    name: string;
    unit_price: number;
    menu_item_id: string;
  }[];
}

interface OrderStore {
  // Cart
  cart: CartItem[];
  activeTableId: string | null;
  addToCart: (item: DbMenuItem) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  setActiveTable: (tableId: string) => void;
  cartTotal: () => number;
  cartCount: () => number;

  // Active orders (Serves screen)
  activeOrders: ActiveOrderWithItems[];
  ordersLoading: boolean;
  fetchActiveOrders: () => Promise<void>;
  fetchPaidOrders: (filter?: 'Today' | 'Yesterday' | 'This Week' | 'This Month' | 'All') => Promise<void>;
  subscribeToOrders: () => () => void;
  markServed: (orderId: string) => Promise<void>;
  freeTable: (orderId: string, tableId: string) => Promise<void>;

  // Payment
  currentOrder: ActiveOrderWithItems | null;
  paidOrders: ActiveOrderWithItems[];
  cashRequestedOrders: string[];
  setCurrentOrder: (order: ActiveOrderWithItems | null) => void;
  markPaid: (orderId: string, tableId: string, paymentMethod: string, finalAmount: number) => Promise<void>;
  hiddenOrderIds: string[];
  clearPaidOrders: () => void;
  requestCashPayment: (orderId: string) => void;

  // Submit
  submitOrder: (tableId: string) => Promise<{ orderId: string } | null>;
}

export const useOrderStore = create<OrderStore>((set, get) => ({
  // ─── CART ─────────────────────────────────────────────────────────────
  cart: [],
  activeTableId: null,

  setActiveTable: (tableId) => set({ activeTableId: tableId }),

  addToCart: (item: DbMenuItem) => {
    set((state) => {
      const existing = state.cart.find(i => i.id === item.id);
      if (existing) {
        return { cart: state.cart.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i) };
      }
      return { cart: [...state.cart, { ...item, quantity: 1 }] };
    });
  },

  removeFromCart: (itemId: string) => {
    set((state) => {
      const existing = state.cart.find(i => i.id === itemId);
      if (existing && existing.quantity > 1) {
        return { cart: state.cart.map(i => i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i) };
      }
      return { cart: state.cart.filter(i => i.id !== itemId) };
    });
  },

  clearCart: () => set({ cart: [] }),

  cartTotal: () => get().cart.reduce((sum, i) => sum + i.price * i.quantity, 0),
  cartCount: () => get().cart.reduce((sum, i) => sum + i.quantity, 0),

  // ─── SUBMIT ORDER ──────────────────────────────────────────────────────
  submitOrder: async (tableId: string) => {
    const cart = get().cart;
    if (cart.length === 0) return null;
    const total = get().cartTotal();

    // If Supabase not configured, simulate a successful order with a mock ID
    if (!isSupabaseConfigured) {
      const mockOrderId = `mock-${Date.now()}`;
      const mockOrder: ActiveOrderWithItems = {
        id: mockOrderId,
        table_id: tableId,
        status: 'Pending',
        payment_status: 'unpaid',
        total_amount: total,
        created_at: new Date().toISOString(),
        items: cart.map(item => ({
          qty: item.quantity,
          name: item.title,
          unit_price: item.price,
          menu_item_id: item.id,
        })),
      };
      set(state => ({
        activeOrders: [...state.activeOrders, mockOrder],
        currentOrder: mockOrder,
        cart: [],
      }));
      return { orderId: mockOrderId };
    }

    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({ table_id: tableId, total_amount: total, status: 'Pending' })
      .select()
      .single();

    if (orderError || !orderData) return null;

    const orderItems = cart.map(item => ({
      order_id: orderData.id,
      menu_item_id: item.id,
      quantity: item.quantity,
      unit_price: item.price,
    }));

    const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
    if (itemsError) return null;

    // Emit Notification to Kitchen
    useNotificationStore.getState().emitNotification(
      'Kitchen',
      `New Order: Table ${tableId}`,
      `${cart.length} items ordered and waiting for preparation.`,
      'info'
    );

    get().clearCart();
    return { orderId: orderData.id };
  },

  // ─── ACTIVE ORDERS ─────────────────────────────────────────────────────
  activeOrders: [],
  ordersLoading: false,

  fetchActiveOrders: async () => {
    set({ ordersLoading: true });

    if (!isSupabaseConfigured) {
      set({ ordersLoading: false });
      return;
    }

    // Fetch orders that are EITHER unpaid OR not yet served (prepaid food still cooking)
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id, table_id, status, payment_status, payment_method, total_amount, created_at,
        order_items (
          quantity, unit_price, menu_item_id,
          manager_menu_items ( name )
        )
      `)
      .or('payment_status.eq.unpaid,status.neq.Served')
      .order('created_at', { ascending: true });

    if (!error && data) {
      const normalized: ActiveOrderWithItems[] = data.map((o: any) => ({
        id: o.id,
        table_id: o.table_id,
        status: o.status,
        payment_status: o.payment_status,
        payment_method: o.payment_method,
        total_amount: o.total_amount,
        created_at: o.created_at,
        items: (o.order_items ?? []).map((oi: any) => ({
          qty: oi.quantity,
          name: oi.manager_menu_items?.name ?? 'Unknown',
          unit_price: oi.unit_price,
          menu_item_id: oi.menu_item_id,
        })),
      }));
      set({ activeOrders: normalized, ordersLoading: false });
    } else {
      set({ ordersLoading: false });
    }
  },

  fetchPaidOrders: async (filter: 'Today' | 'Yesterday' | 'This Week' | 'This Month' | 'All' = 'Today') => {
    if (!isSupabaseConfigured) return;

    let query = supabase
      .from('orders')
      .select(`
        id, table_id, status, payment_status, payment_method, total_amount, created_at,
        order_items (
          quantity, unit_price, menu_item_id,
          manager_menu_items ( name )
        )
      `)
      .eq('payment_status', 'paid')
      .order('created_at', { ascending: false });

    if (filter === 'Today') {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      query = query.gte('created_at', startOfToday.toISOString());
    } else if (filter === 'Yesterday') {
      const startOfYesterday = new Date();
      startOfYesterday.setDate(startOfYesterday.getDate() - 1);
      startOfYesterday.setHours(0, 0, 0, 0);
      
      const endOfYesterday = new Date();
      endOfYesterday.setDate(endOfYesterday.getDate() - 1);
      endOfYesterday.setHours(23, 59, 59, 999);
      
      query = query.gte('created_at', startOfYesterday.toISOString()).lte('created_at', endOfYesterday.toISOString());
    } else if (filter === 'This Week') {
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Sunday
      startOfWeek.setHours(0, 0, 0, 0);
      query = query.gte('created_at', startOfWeek.toISOString());
    } else if (filter === 'This Month') {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      query = query.gte('created_at', startOfMonth.toISOString());
    }

    const { data, error } = await query;

    if (!error && data) {
      const normalized: ActiveOrderWithItems[] = data.map((o: any) => ({
        id: o.id,
        table_id: o.table_id,
        status: o.status,
        payment_status: o.payment_status,
        payment_method: o.payment_method,
        total_amount: o.total_amount,
        created_at: o.created_at,
        items: (o.order_items ?? []).map((oi: any) => ({
          qty: oi.quantity,
          name: oi.manager_menu_items?.name ?? 'Unknown',
          unit_price: oi.unit_price,
          menu_item_id: oi.menu_item_id,
        })),
      }));
      set({ paidOrders: normalized });
    }
  },

  subscribeToOrders: () => {
    if (!isSupabaseConfigured) return () => {};

    const channel = supabase
      .channel('orders-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        get().fetchActiveOrders();
        get().fetchPaidOrders('Today'); // Refresh today by default
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  },

  markServed: async (orderId: string) => {
    const orderToMark = get().activeOrders.find(o => o.id === orderId);
    
    // Add notification to Kitchen
    if (orderToMark) {
      useNotificationStore.getState().emitNotification(
        'Kitchen',
        `Order Collected`,
        `Table ${orderToMark.table_id} order has been collected by the waiter.`,
        'info'
      );
    }

    // Optimistic update
    set(state => ({ 
      activeOrders: state.activeOrders.map(o => o.id === orderId ? { ...o, status: 'Eating' } : o) 
    }));
    
    if (!isSupabaseConfigured) return;
    await supabase.from('orders').update({ status: 'Eating' }).eq('id', orderId);
  },

  freeTable: async (orderId: string, tableId: string) => {
    // 1. Mark Order as Served locally and remote
    set(state => ({
      activeOrders: state.activeOrders.filter(o => o.id !== orderId) // Assuming we still want it to leave the screen once finally freed
    }));
    
    if (isSupabaseConfigured) {
      await supabase.from('orders').update({ status: 'Served' }).eq('id', orderId);
    }
    
    // 2. Reset the Table using tableStore directly
    const { useTableStore } = require('./tableStore');
    await useTableStore.getState().resetTable(tableId);
  },

  // ─── PAYMENT ───────────────────────────────────────────────────────────
  currentOrder: null,
  paidOrders: [],
  cashRequestedOrders: [],
  setCurrentOrder: (order) => set({ currentOrder: order }),
  requestCashPayment: async (orderId) => {
    set(state => ({ cashRequestedOrders: [...state.cashRequestedOrders, orderId] }));
    if (isSupabaseConfigured) {
      await supabase.from('orders').update({ payment_method: 'Cash' }).eq('id', orderId);
      
      const orderToMark = get().activeOrders.find(o => o.id === orderId);
      if (orderToMark) {
        useNotificationStore.getState().emitNotification(
          'Cashier',
          `Cash Payment Requested`,
          `Table ${orderToMark.table_id} is ready to pay cash.`,
          'warning'
        );
      }
    }
  },

  markPaid: async (orderId: string, tableId: string, paymentMethod: string, finalAmount: number) => {
    const orderToMark = get().activeOrders.find(o => o.id === orderId);
    
    if (isSupabaseConfigured) {
      await supabase.from('orders').update({ payment_status: 'paid', payment_method: paymentMethod, total_amount: finalAmount }).eq('id', orderId);
      // Change to eating instead of available
      await supabase.from('tables').update({ status: 'eating' }).eq('id', tableId);
    }
    
    // Use tableStore to optimistically update the table to eating
    const { useTableStore } = require('./tableStore');
    await useTableStore.getState().setTableEating(tableId);
    
    set(state => {
      const isAlreadyPaid = state.paidOrders.some(o => o.id === orderId);
      const updatedOrder = (orderToMark && !isAlreadyPaid) ? { ...orderToMark, payment_status: 'paid', payment_method: paymentMethod, total_amount: finalAmount } : null;
      
      return {
        currentOrder: state.currentOrder && state.currentOrder.id === orderId ? { ...state.currentOrder, payment_status: 'paid', payment_method: paymentMethod, total_amount: finalAmount } : state.currentOrder,
        activeOrders: state.activeOrders.filter(o => o.id !== orderId),
        paidOrders: updatedOrder ? [updatedOrder, ...state.paidOrders] : state.paidOrders,
      };
    });
  },

  hiddenOrderIds: [],
  clearPaidOrders: () => set(state => ({ hiddenOrderIds: [...state.hiddenOrderIds, ...state.paidOrders.map(o => o.id)] })),
}));
