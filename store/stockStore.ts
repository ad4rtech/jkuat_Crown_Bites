import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export type StockStatus = 'ok' | 'low' | 'out';

export interface StockItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  status: StockStatus;
  category: string;
  threshold: number;           // qty at which item becomes "low"
  linkedMenuItemsCount: number;
}

export interface StockStation {
  id: string;
  name: string;
  iconKey: 'grill' | 'cold' | 'beverages' | 'dry' | 'dairy';
  items: StockItem[];
}

interface StockStore {
  stations: StockStation[];
  lastUpdated: Date | null;
  makeableFilterOn: boolean;
  loading: boolean;

  // Actions
  fetchStock: () => Promise<void>;
  subscribeToStock: () => () => void;
  toggleMakeableFilter: () => void;
  flagLow:  (stationId: string, itemId: string) => void;
  flagOut:  (stationId: string, itemId: string) => void;
  restockItem:    (stationId: string, itemId: string, newQty: number) => Promise<void>;
  updateQuantity: (stationId: string, itemId: string, newQty: number) => Promise<void>;
  addStockItem:   (stationId: string, item: Omit<StockItem, 'id' | 'status'>) => Promise<void>;
  deductStock:     (stationId: string, itemId: string, qty: number) => Promise<void>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function calcStatus(qty: number, threshold: number): StockStatus {
  if (qty <= 0)         return 'out';
  if (qty < threshold)  return 'low';
  return 'ok';
}

// ─── Initial Data ─────────────────────────────────────────────────────────────
const INITIAL_STATIONS: StockStation[] = [
  {
    id: 'grill', name: 'Grill Station', iconKey: 'grill',
    items: [
      { id: 'g1', name: 'Beef Patties',   quantity: 120, unit: 'units', status: 'ok',  category: 'Meat',       threshold: 20,  linkedMenuItemsCount: 3 },
      { id: 'g2', name: 'Brioche Buns',   quantity: 15,  unit: 'units', status: 'low', category: 'Bakery',     threshold: 30,  linkedMenuItemsCount: 2 },
      { id: 'g3', name: 'Cheddar Cheese', quantity: 0,   unit: 'kg',    status: 'out', category: 'Dairy',      threshold: 2,   linkedMenuItemsCount: 4 },
    ],
  },
  {
    id: 'cold', name: 'Cold Prep', iconKey: 'cold',
    items: [
      { id: 'c1', name: 'Tomatoes',   quantity: 0.8, unit: 'kg',    status: 'low', category: 'Produce',    threshold: 1.5, linkedMenuItemsCount: 12 },
      { id: 'c2', name: 'Lettuce',    quantity: 4,   unit: 'heads', status: 'low', category: 'Produce',    threshold: 6,   linkedMenuItemsCount: 5  },
      { id: 'c3', name: 'Cucumber',   quantity: 8,   unit: 'units', status: 'ok',  category: 'Produce',    threshold: 4,   linkedMenuItemsCount: 3  },
    ],
  },
  {
    id: 'beverages', name: 'Beverages', iconKey: 'beverages',
    items: [
      { id: 'b1', name: 'Coffee Beans',    quantity: 5,   unit: 'kg',      status: 'ok',  category: 'Beverages', threshold: 2,  linkedMenuItemsCount: 6 },
      { id: 'b2', name: 'Lemon Syrup',     quantity: 1,   unit: 'bottles', status: 'low', category: 'Beverages', threshold: 3,  linkedMenuItemsCount: 3 },
      { id: 'b3', name: 'Sparkling Water', quantity: 0,   unit: 'crates',  status: 'out', category: 'Beverages', threshold: 2,  linkedMenuItemsCount: 1 },
    ],
  },
  {
    id: 'dairy', name: 'Dairy & Sauces', iconKey: 'dairy',
    items: [
      { id: 'd1', name: 'Heavy Cream', quantity: 4,  unit: 'litres', status: 'ok',  category: 'Dairy',      threshold: 2,  linkedMenuItemsCount: 2 },
      { id: 'd2', name: 'Butter',      quantity: 2,  unit: 'kg',     status: 'ok',  category: 'Dairy',      threshold: 1,  linkedMenuItemsCount: 4 },
      { id: 'd3', name: 'Pesto Sauce', quantity: 0,  unit: 'jars',   status: 'out', category: 'Condiment',  threshold: 3,  linkedMenuItemsCount: 8 },
      { id: 'd5', name: 'Cooking Oil', quantity: 0,  unit: 'L',      status: 'out', category: 'Condiment',  threshold: 5,  linkedMenuItemsCount: 8 },
    ],
  },
  {
    id: 'dry', name: 'Dry Goods', iconKey: 'dry',
    items: [
      { id: 'y1', name: 'Pasta',         quantity: 6,   unit: 'kg',  status: 'ok',  category: 'Dry Goods',  threshold: 3,  linkedMenuItemsCount: 2 },
      { id: 'y2', name: 'Burger Buns',   quantity: 10,  unit: 'pcs', status: 'low', category: 'Bakery',     threshold: 30, linkedMenuItemsCount: 3 },
      { id: 'y3', name: 'Chicken Breast',quantity: 3.5, unit: 'kg',  status: 'ok',  category: 'Meat',       threshold: 2,  linkedMenuItemsCount: 4 },
      { id: 'y4', name: 'Breadcrumbs',   quantity: 3,   unit: 'kg',  status: 'ok',  category: 'Dry Goods',  threshold: 1,  linkedMenuItemsCount: 1 },
    ],
  },
];

// ─── Util to patch an item in stations ────────────────────────────────────────
function patchItem(stations: StockStation[], stationId: string, itemId: string, patch: Partial<StockItem>): StockStation[] {
  return stations.map(s =>
    s.id !== stationId ? s : {
      ...s,
      items: s.items.map(i => i.id !== itemId ? i : { ...i, ...patch }),
    }
  );
}

let nextItemId = Date.now();

// ─── Store ────────────────────────────────────────────────────────────────────
export const useStockStore = create<StockStore>((set, get) => ({
  stations:        INITIAL_STATIONS,
  lastUpdated:     null,
  makeableFilterOn: false,
  loading:         false,

  // ── Fetch (Supabase → fallback to initial) ────────────────────────────────
  fetchStock: async () => {
    set({ loading: true });

    if (!isSupabaseConfigured) {
      set({ loading: false, lastUpdated: new Date() });
      return;
    }

    const { data, error } = await supabase
      .from('stock_items')
      .select('*')
      .order('name');

    if (!error && data) {
      // Group by station_id
      const stationMap: Record<string, StockItem[]> = {};
      for (const row of data as any[]) {
        if (!stationMap[row.station_id]) stationMap[row.station_id] = [];
        stationMap[row.station_id].push({
          id:                    row.id,
          name:                  row.name,
          quantity:              row.quantity,
          unit:                  row.unit,
          threshold:             row.threshold ?? 0,
          category:              row.category ?? '',
          linkedMenuItemsCount:  row.linked_menu_items_count ?? 0,
          status:                calcStatus(row.quantity, row.threshold ?? 0),
        });
      }
      set(state => ({
        stations: state.stations.map(s => ({
          ...s,
          items: stationMap[s.id] ?? [],
        })),
        loading: false,
        lastUpdated: new Date(),
      }));
    } else {
      set({ loading: false, lastUpdated: new Date() });
    }
  },

  // ── Real-time subscription ─────────────────────────────────────────────────
  subscribeToStock: () => {
    if (!isSupabaseConfigured) return () => {};
    const channel = supabase
      .channel('stock-items-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stock_items' }, () => {
        get().fetchStock();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  },

  toggleMakeableFilter: () =>
    set(state => ({ makeableFilterOn: !state.makeableFilterOn })),

  flagLow: (stationId, itemId) =>
    set(state => ({ stations: patchItem(state.stations, stationId, itemId, { status: 'low' }) })),

  flagOut: (stationId, itemId) =>
    set(state => ({ stations: patchItem(state.stations, stationId, itemId, { status: 'out', quantity: 0 }) })),

  restockItem: async (stationId, itemId, newQty) => {
    const item = get().stations.find(s => s.id === stationId)?.items.find(i => i.id === itemId);
    const newStatus = calcStatus(newQty, item?.threshold ?? 0);
    set(state => ({ stations: patchItem(state.stations, stationId, itemId, { status: newStatus, quantity: newQty }), lastUpdated: new Date() }));
    if (!isSupabaseConfigured) return;
    await supabase.from('stock_items').update({ quantity: newQty, status: newStatus }).eq('id', itemId);
  },

  updateQuantity: async (stationId, itemId, newQty) => {
    const item = get().stations.find(s => s.id === stationId)?.items.find(i => i.id === itemId);
    const newStatus = calcStatus(newQty, item?.threshold ?? 0);
    set(state => ({ stations: patchItem(state.stations, stationId, itemId, { quantity: newQty, status: newStatus }), lastUpdated: new Date() }));
    if (!isSupabaseConfigured) return;
    await supabase.from('stock_items').update({ quantity: newQty, status: newStatus }).eq('id', itemId);
  },

  addStockItem: async (stationId, itemData) => {
    const newId = `item-${Date.now()}`;
    const status = calcStatus(itemData.quantity, itemData.threshold);
    const newItem: StockItem = { ...itemData, id: newId, status };
    set(state => ({
      stations: state.stations.map(s =>
        s.id !== stationId ? s : { ...s, items: [...s.items, newItem] }
      ),
      lastUpdated: new Date(),
    }));
    if (!isSupabaseConfigured) return;
    const { error } = await supabase.from('stock_items').insert({
      id: newId, station_id: stationId, name: itemData.name,
      quantity: itemData.quantity, unit: itemData.unit,
      threshold: itemData.threshold, category: itemData.category,
      linked_menu_items_count: itemData.linkedMenuItemsCount, status,
    });
    if (error) {
      console.error('Supabase Error adding stock item:', error);
    }
  },

  // ── Deduct stock when an order item is prepared ────────────────────────────
  deductStock: async (stationId, itemId, qty) => {
    const item = get().stations
      .find(s => s.id === stationId)?.items
      .find(i => i.id === itemId);
    if (!item) return;
    const newQty    = Math.max(0, item.quantity - qty);
    const newStatus = calcStatus(newQty, item.threshold);
    set(state => ({
      stations: patchItem(state.stations, stationId, itemId, { quantity: newQty, status: newStatus }),
      lastUpdated: new Date(),
    }));
    if (!isSupabaseConfigured) return;
    await supabase
      .from('stock_items')
      .update({ quantity: newQty, status: newStatus })
      .eq('id', itemId);
  },
}));
