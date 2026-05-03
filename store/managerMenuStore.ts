import { create } from 'zustand';
import { supabase, isSupabaseConfigured, DbMenuCategory, DbManagerMenuItem } from '../lib/supabase';
import { useStockStore, StockStatus } from './stockStore';

// ─── Types ────────────────────────────────────────────────────────────────────
export type MenuItemStatus = 'active' | 'unavailable' | 'deactivated';

export interface LinkedIngredient {
  ingredientId: string;
  name: string;
  qtyPerServing: number;
  unit: string;
}

export interface MenuItem {
  id: string;
  name: string;
  categoryId: string;
  price: number;
  status: MenuItemStatus;
  description?: string;
  photo?: string;
  linkedIngredients: LinkedIngredient[];
}

export interface MenuCategory {
  id: string;
  name: string;
  order: number;
  isActive: boolean;
}

interface ManagerMenuStore {
  categories: MenuCategory[];
  items: MenuItem[];
  loading: boolean;
  // Actions
  fetchMenu: () => Promise<void>;
  toggleAvailability: (itemId: string) => Promise<void>;
  activateItem: (itemId: string) => Promise<void>;
  updatePrice: (itemId: string, price: number) => Promise<void>;
  addItem: (data: Omit<MenuItem, 'id'>) => Promise<void>;
  updateItem: (id: string, data: Partial<MenuItem>) => Promise<void>;
  deactivateItem: (id: string) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  addCategory: (name: string) => Promise<void>;
  renameCategory: (id: string, name: string) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  reorderCategories: (ids: string[]) => void;
  toggleCategoryActive: (id: string) => Promise<void>;
  syncAvailabilityWithStock: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function mapDbCategory(c: DbMenuCategory): MenuCategory {
  return { id: c.id, name: c.name, order: c.sort_order, isActive: c.is_active };
}

function mapDbItem(i: DbManagerMenuItem): MenuItem {
  return {
    id: i.id,
    name: i.name,
    categoryId: i.category_id ?? '',
    price: i.price,
    status: i.status,
    description: i.description ?? undefined,
    photo: i.photo ?? undefined,
    linkedIngredients: [],
  };
}

// ─── Mock Data (fallback when Supabase is not configured) ─────────────────────
const MOCK_CATEGORIES: MenuCategory[] = [
  { id: 'cat-1', name: 'Starters',  order: 0, isActive: true },
  { id: 'cat-2', name: 'Mains',     order: 1, isActive: true },
  { id: 'cat-3', name: 'Grills',    order: 2, isActive: true },
  { id: 'cat-4', name: 'Sides',     order: 3, isActive: true },
  { id: 'cat-5', name: 'Drinks',    order: 4, isActive: true },
  { id: 'cat-6', name: 'Desserts',  order: 5, isActive: true },
];

const MOCK_ITEMS: MenuItem[] = [
  { id: 'i-01', name: 'Chicken Wings',        categoryId: 'cat-1', price: 850,  status: 'active',      description: 'Crispy wings with dipping sauce', linkedIngredients: [], photo: undefined },
  { id: 'i-02', name: 'Bruschetta',            categoryId: 'cat-1', price: 600,  status: 'active',      description: 'Toasted bread with fresh tomato', linkedIngredients: [], photo: undefined },
  { id: 'i-13', name: 'Garlic Bread',          categoryId: 'cat-1', price: 400,  status: 'active',      description: 'Toasted baguette with garlic butter', linkedIngredients: [], photo: undefined },
  { id: 'i-03', name: 'Classic Cheese Burger', categoryId: 'cat-2', price: 1200, status: 'active',      description: 'Beef patty with cheddar and pickles', linkedIngredients: [], photo: undefined },
  { id: 'i-14', name: 'BBQ Bacon Burger',      categoryId: 'cat-2', price: 1350, status: 'active',      description: 'Smoky BBQ beef patty with crispy bacon', linkedIngredients: [], photo: undefined },
  { id: 'i-04', name: 'Chicken Pesto Pasta',  categoryId: 'cat-2', price: 1100, status: 'active',      description: 'Pesto tossed pasta with grilled chicken', linkedIngredients: [], photo: undefined },
  { id: 'i-05', name: 'Grilled Chicken',      categoryId: 'cat-3', price: 1350, status: 'active',      description: 'Whole quarter chicken, charcoal grilled', linkedIngredients: [], photo: undefined },
  { id: 'i-06', name: 'Beef Steak',           categoryId: 'cat-3', price: 2200, status: 'unavailable', description: '250g sirloin, medium rare', linkedIngredients: [], photo: undefined },
  { id: 'i-07', name: 'Large Fries',          categoryId: 'cat-4', price: 450,  status: 'active',      description: 'Seasoned crispy fries', linkedIngredients: [], photo: undefined },
  { id: 'i-08', name: 'Coleslaw',             categoryId: 'cat-4', price: 300,  status: 'active',      description: 'Creamy house coleslaw', linkedIngredients: [], photo: undefined },
  { id: 'i-09', name: 'Lemonade',             categoryId: 'cat-5', price: 350,  status: 'active',      description: 'Fresh squeezed lemonade', linkedIngredients: [], photo: undefined },
  { id: 'i-10', name: 'Lemon Iced Tea',       categoryId: 'cat-5', price: 400,  status: 'active',      description: 'Chilled black tea with lemon', linkedIngredients: [], photo: undefined },
  { id: 'i-11', name: 'Sparkling Water',      categoryId: 'cat-5', price: 200,  status: 'unavailable', description: '500ml sparkling', linkedIngredients: [], photo: undefined },
  { id: 'i-12', name: 'Chocolate Lava Cake',  categoryId: 'cat-6', price: 750,  status: 'active',      description: 'Warm cake with liquid chocolate centre', linkedIngredients: [], photo: undefined },
  { id: 'i-15', name: 'Classic Tiramisu',     categoryId: 'cat-6', price: 650,  status: 'active',      description: 'Italian coffee and mascarpone dessert', linkedIngredients: [], photo: undefined },
];

// ─── Store ────────────────────────────────────────────────────────────────────
export const useManagerMenuStore = create<ManagerMenuStore>((set, get) => ({
  categories: [],
  items: [],
  loading: false,

  // ── Fetch ──────────────────────────────────────────────────────────────────
  fetchMenu: async () => {
    if (!isSupabaseConfigured) {
      set(state => state.items.length > 0 ? state : { categories: MOCK_CATEGORIES, items: MOCK_ITEMS, loading: false });
      return;
    }

    set({ loading: true });
    const [catRes, itemRes] = await Promise.all([
      supabase.from('menu_categories').select('*').order('sort_order'),
      supabase.from('manager_menu_items').select('*').order('created_at'),
    ]);

    if (catRes.error || itemRes.error) {
      // Fallback to mock on error, but don't overwrite existing session data
      set(state => state.items.length > 0 ? { loading: false } : { categories: MOCK_CATEGORIES, items: MOCK_ITEMS, loading: false });
      return;
    }

    set({
      categories: (catRes.data as DbMenuCategory[]).map(mapDbCategory),
      items: (itemRes.data as DbManagerMenuItem[]).map(mapDbItem),
      loading: false,
    });
  },

  // ── Toggle active/unavailable ──────────────────────────────────────────────
  toggleAvailability: async (itemId) => {
    const item = get().items.find(i => i.id === itemId);
    if (!item) return;
    const newStatus: MenuItemStatus = item.status === 'active' ? 'unavailable' : 'active';
    // Optimistic update
    set(state => ({ items: state.items.map(i => i.id === itemId ? { ...i, status: newStatus } : i) }));
    if (isSupabaseConfigured) {
      await supabase.from('manager_menu_items').update({ status: newStatus }).eq('id', itemId);
    }
  },

  // ── Activate a deactivated item ────────────────────────────────────────────
  activateItem: async (itemId) => {
    set(state => ({ items: state.items.map(i => i.id === itemId ? { ...i, status: 'active' } : i) }));
    if (isSupabaseConfigured) {
      await supabase.from('manager_menu_items').update({ status: 'active' }).eq('id', itemId);
    }
  },

  // ── Update price ───────────────────────────────────────────────────────────
  updatePrice: async (itemId, price) => {
    set(state => ({ items: state.items.map(i => i.id === itemId ? { ...i, price } : i) }));
    if (isSupabaseConfigured) {
      await supabase.from('manager_menu_items').update({ price }).eq('id', itemId);
    }
  },

  // ── Add item ───────────────────────────────────────────────────────────────
  addItem: async (data) => {
    if (!isSupabaseConfigured) {
      const newId = `i-local-${Date.now()}`;
      set(state => ({ items: [...state.items, { ...data, id: newId }] }));
      return;
    }
    const newId = `i-${Date.now()}`;
    const { data: row, error } = await supabase
      .from('manager_menu_items')
      .insert({
        id: newId,
        name: data.name,
        category_id: data.categoryId || null,
        price: data.price,
        status: data.status,
        description: data.description || null,
        photo: data.photo || null,
      })
      .select()
      .single();

    if (!error && row) {
      set(state => ({ items: [...state.items, mapDbItem(row as DbManagerMenuItem)] }));
    }
  },

  // ── Update item ────────────────────────────────────────────────────────────
  updateItem: async (id, data) => {
    set(state => ({ items: state.items.map(i => i.id === id ? { ...i, ...data } : i) }));
    if (isSupabaseConfigured) {
      const update: Record<string, unknown> = {};
      if (data.name        !== undefined) update.name        = data.name;
      if (data.categoryId  !== undefined) update.category_id = data.categoryId;
      if (data.price       !== undefined) update.price       = data.price;
      if (data.status      !== undefined) update.status      = data.status;
      if (data.description !== undefined) update.description = data.description;
      if (data.photo       !== undefined) update.photo       = data.photo;
      await supabase.from('manager_menu_items').update(update).eq('id', id);
    }
  },

  // ── Deactivate item ────────────────────────────────────────────────────────
  deactivateItem: async (id) => {
    set(state => ({ items: state.items.map(i => i.id === id ? { ...i, status: 'deactivated' } : i) }));
    if (isSupabaseConfigured) {
      await supabase.from('manager_menu_items').update({ status: 'deactivated' }).eq('id', id);
    }
  },

  // ── Delete item ────────────────────────────────────────────────────────────
  deleteItem: async (id) => {
    set(state => ({ items: state.items.filter(i => i.id !== id) }));
    if (isSupabaseConfigured) {
      await supabase.from('manager_menu_items').delete().eq('id', id);
    }
  },

  // ── Add category ──────────────────────────────────────────────────────────
  addCategory: async (name) => {
    if (!isSupabaseConfigured) {
      const newId = `cat-local-${Date.now()}`;
      set(state => ({
        categories: [...state.categories, { id: newId, name, order: state.categories.length, isActive: true }],
      }));
      return;
    }
    const { data: row, error } = await supabase
      .from('menu_categories')
      .insert({ id: `cat-${Date.now()}`, name, sort_order: get().categories.length, is_active: true })
      .select()
      .single();

    if (!error && row) {
      set(state => ({ categories: [...state.categories, mapDbCategory(row as DbMenuCategory)] }));
    }
  },

  // ── Rename category ────────────────────────────────────────────────────────
  renameCategory: async (id, name) => {
    set(state => ({ categories: state.categories.map(c => c.id === id ? { ...c, name } : c) }));
    if (isSupabaseConfigured) {
      await supabase.from('menu_categories').update({ name }).eq('id', id);
    }
  },

  // ── Delete category ────────────────────────────────────────────────────────
  deleteCategory: async (id) => {
    set(state => ({ categories: state.categories.filter(c => c.id !== id) }));
    if (isSupabaseConfigured) {
      await supabase.from('menu_categories').delete().eq('id', id);
    }
  },

  // ── Reorder (local only — called during drag) ──────────────────────────────
  reorderCategories: (ids) =>
    set(state => ({
      categories: ids.map((id, i) => {
        const cat = state.categories.find(c => c.id === id)!;
        return { ...cat, order: i };
      }),
    })),

  // ── Toggle category active ─────────────────────────────────────────────────
  toggleCategoryActive: async (id) => {
    const cat = get().categories.find(c => c.id === id);
    if (!cat) return;
    const newActive = !cat.isActive;
    set(state => ({ categories: state.categories.map(c => c.id === id ? { ...c, isActive: newActive } : c) }));
    if (isSupabaseConfigured) {
      await supabase.from('menu_categories').update({ is_active: newActive }).eq('id', id);
    }
  },

  // ── Sync availability from stock ──────────────────────────────────────────
  syncAvailabilityWithStock: () => {
    const { stations } = useStockStore.getState();
    const stockMap: Record<string, StockStatus> = {};
    stations.forEach(s => s.items.forEach(i => { stockMap[i.id] = i.status; }));

    set(state => ({
      items: state.items.map(item => {
        if (item.status === 'deactivated') return item;
        if (item.linkedIngredients.length === 0) return item;
        const anyOut = item.linkedIngredients.some(li => stockMap[li.ingredientId] === 'out');
        if (anyOut && item.status === 'active')       return { ...item, status: 'unavailable' };
        if (!anyOut && item.status === 'unavailable') return { ...item, status: 'active' };
        return item;
      }),
    }));
  },
}));
