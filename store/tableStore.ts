import { create } from 'zustand';
import { supabase, isSupabaseConfigured, DbTable, TableStatus } from '../lib/supabase';

// ─── MOCK DATA (used when Supabase is not yet configured) ─────────────────────
const MOCK_TABLES: DbTable[] = [
  { id: 'T1',  name: 'T1',  seats: 4, zone: 'Main Dining',   shape: 'rect',         status: 'available' },
  { id: 'T2',  name: 'T2',  seats: 4, zone: 'Main Dining',   shape: 'rect',         status: 'available' },
  { id: 'T3',  name: 'T3',  seats: 4, zone: 'Main Dining',   shape: 'circle',       status: 'available' },
  { id: 'T4',  name: 'T4',  seats: 4, zone: 'Main Dining',   shape: 'circle',       status: 'available' },
  { id: 'T5',  name: 'T5',  seats: 6, zone: 'Main Dining',   shape: 'rect-vertical',status: 'available' },
  { id: 'T6',  name: 'T6',  seats: 2, zone: 'Outdoor Patio', shape: 'circle',       status: 'available' },
  { id: 'T7',  name: 'T7',  seats: 2, zone: 'Outdoor Patio', shape: 'circle',       status: 'available' },
  { id: 'T8',  name: 'T8',  seats: 4, zone: 'Outdoor Patio', shape: 'rect',         status: 'available' },
  { id: 'T9',  name: 'T9',  seats: 6, zone: 'Outdoor Patio', shape: 'rect-vertical',status: 'available' },
  { id: 'T10', name: 'T10', seats: 4, zone: 'Outdoor Patio', shape: 'rect',         status: 'available' },
];

interface TableStore {
  tables: DbTable[];
  loading: boolean;
  error: string | null;
  fetchTables: () => Promise<void>;
  subscribeToRealtime: () => () => void;
  assignTable: (tableId: string) => Promise<void>;
  markOrdered: (tableId: string) => Promise<void>;
  resetTable: (tableId: string) => Promise<void>;
  setTableEating: (tableId: string) => Promise<void>;
}

const updateLocalStatus = (tableId: string, status: TableStatus) =>
  (state: { tables: DbTable[] }) => ({
    tables: state.tables.map(t =>
      t.id === tableId ? { ...t, status } : t
    ),
  });

export const useTableStore = create<TableStore>((set, get) => ({
  tables: [],
  loading: false,
  error: null,

  fetchTables: async () => {
    if (get().tables.length > 0) return; // already loaded

    if (!isSupabaseConfigured) {
      set({ tables: MOCK_TABLES, loading: false });
      return;
    }

    set({ loading: true, error: null });
    const { data, error } = await supabase
      .from('tables')
      .select('*')
      .order('id');

    if (error) {
      set({ tables: MOCK_TABLES, error: error.message, loading: false });
    } else {
      set({ tables: data ?? MOCK_TABLES, loading: false });
    }
  },

  subscribeToRealtime: () => {
    if (!isSupabaseConfigured) return () => {}; // no-op

    const channel = supabase
      .channel('tables-realtime')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'tables' },
        (payload: { new: DbTable }) => {
          const updated = payload.new as DbTable;
          set((state) => ({
            tables: state.tables.map(t =>
              t.id === updated.id ? updated : t
            ),
          }));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  },

  assignTable: async (tableId: string) => {
    set(updateLocalStatus(tableId, 'occupied')); // optimistic
    if (!isSupabaseConfigured) return;
    await supabase.from('tables').update({ status: 'occupied' }).eq('id', tableId);
  },

  markOrdered: async (tableId: string) => {
    set(updateLocalStatus(tableId, 'ordered')); // optimistic
    if (!isSupabaseConfigured) return;
    await supabase.from('tables').update({ status: 'ordered' }).eq('id', tableId);
  },

  resetTable: async (tableId: string) => {
    set(updateLocalStatus(tableId, 'available'));
    if (isSupabaseConfigured) {
      await supabase.from('tables').update({ status: 'available' }).eq('id', tableId);
    }
  },

  setTableEating: async (tableId: string) => {
    set(updateLocalStatus(tableId, 'eating'));
    if (isSupabaseConfigured) {
      await supabase.from('tables').update({ status: 'eating' }).eq('id', tableId);
    }
  },
}));
