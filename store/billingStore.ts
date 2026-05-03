import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useNotificationStore } from './notificationStore';

export type AuthRequestType = 'void' | 'discount' | 'refund';
export type AuthRequestStatus = 'pending' | 'approved' | 'rejected';

export interface AuthRequest {
  id: string;
  cashier: string;
  tableLabel: string;
  table_id: string;
  order_id: string;
  type: AuthRequestType;
  description: string;
  amount: number;
  reason: string;
  status: AuthRequestStatus;
  created_at: string;
}

interface BillingStore {
  authRequests: AuthRequest[];
  loading: boolean;
  fetchAuthRequests: () => Promise<void>;
  approveRequest: (id: string) => Promise<void>;
  rejectRequest:  (id: string) => Promise<void>;
  subscribeToAuthRequests: () => () => void;
}

export const useBillingStore = create<BillingStore>((set, get) => ({
  authRequests: [],
  loading: false,

  fetchAuthRequests: async () => {
    set({ loading: true });

    if (!isSupabaseConfigured) {
      // No mock data — auth queue is empty until real requests come in
      set({ authRequests: [], loading: false });
      return;
    }

    const { data, error } = await supabase
      .from('auth_requests')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (!error && data) {
      set({ authRequests: data as AuthRequest[], loading: false });
    } else {
      set({ authRequests: [], loading: false });
    }
  },

  approveRequest: async (id: string) => {
    // Optimistic
    set(state => ({
      authRequests: state.authRequests.map(r =>
        r.id === id ? { ...r, status: 'approved' } : r
      ),
    }));
    if (!isSupabaseConfigured) return;
    await supabase
      .from('auth_requests')
      .update({ status: 'approved' })
      .eq('id', id);

    const req = get().authRequests.find(r => r.id === id);
    if (req) {
      useNotificationStore.getState().emitNotification(
        'Cashier',
        `Auth Request Approved`,
        `Your request to ${req.type} for Table ${req.tableLabel} was approved.`,
        'success'
      );
    }
  },

  rejectRequest: async (id: string) => {
    // Optimistic
    set(state => ({
      authRequests: state.authRequests.map(r =>
        r.id === id ? { ...r, status: 'rejected' } : r
      ),
    }));
    if (!isSupabaseConfigured) return;
    await supabase
      .from('auth_requests')
      .update({ status: 'rejected' })
      .eq('id', id);

    const req = get().authRequests.find(r => r.id === id);
    if (req) {
      useNotificationStore.getState().emitNotification(
        'Cashier',
        `Auth Request Rejected`,
        `Your request to ${req.type} for Table ${req.tableLabel} was rejected.`,
        'error'
      );
    }
  },

  subscribeToAuthRequests: () => {
    if (!isSupabaseConfigured) return () => {};
    const channel = supabase
      .channel('auth-requests-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'auth_requests' },
        () => { get().fetchAuthRequests(); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  },
}));
