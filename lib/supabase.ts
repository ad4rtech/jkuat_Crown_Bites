import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

// ─── SUPABASE PROJECT CREDENTIALS ────────────────────────────────────────────────
// Found in: Supabase Dashboard → Settings → API
// Keys are now stored in .env for security.
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
// ─────────────────────────────────────────────────────────────────────────────

const isConfigured =
  SUPABASE_URL.includes('supabase.co') &&
  !SUPABASE_URL.includes('YOUR_PROJECT_ID');

// Secure storage adapter for Supabase auth sessions
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = isConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      storage: ExpoSecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  })
  : null as any;

export const isSupabaseConfigured = isConfigured;

// ─── TYPED DATABASE HELPERS ───────────────────────────────────────────────────

export type TableStatus = 'available' | 'occupied' | 'ordered' | 'eating';
export type OrderStatus = 'Pending' | 'In Prep' | 'Ready' | 'Eating' | 'Served';
export type PaymentStatus = 'unpaid' | 'paid';

export interface DbMenuItem {
  id: string;
  title: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  available: boolean;
  created_at: string;
}

export interface DbTable {
  id: string;
  name: string;
  seats: number;
  zone: string;
  shape: string;
  status: TableStatus;
}

export interface DbOrder {
  id: string;
  table_id: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  total_amount: number;
  created_at: string;
  order_items?: DbOrderItem[];
}

export interface DbOrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  quantity: number;
  unit_price: number;
  menu_items?: DbMenuItem;
}

// ─── Manager Menu Types ───────────────────────────────────────────────────────
export interface DbMenuCategory {
  id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface DbManagerMenuItem {
  id: string;
  name: string;
  category_id: string | null;
  price: number;
  status: 'active' | 'unavailable' | 'deactivated';
  description: string | null;
  photo: string | null;
  created_at: string;
}
