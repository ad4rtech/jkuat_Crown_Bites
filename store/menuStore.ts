import { create } from 'zustand';
import { supabase, isSupabaseConfigured, DbMenuItem } from '../lib/supabase';

// ─── MOCK DATA (used when Supabase is not yet configured) ─────────────────────
const MOCK_MENU_ITEMS: DbMenuItem[] = [
  { id: 'm1', title: 'Crispy Calamari',        description: 'Golden fried calamari rings with house-made tartar',    price: 650,  image_url: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=400&q=80', category: 'Starters', available: true,  created_at: '' },
  { id: 'm2', title: 'Classic Bruschetta',      description: 'Toasted ciabatta topped with roma tomatoes and basil', price: 500,  image_url: 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?auto=format&fit=crop&w=400&q=80', category: 'Starters', available: true,  created_at: '' },
  { id: 'm3', title: 'Spring Rolls',            description: 'Crispy wrappers filled with seasoned vegetables',       price: 600,  image_url: 'https://images.unsplash.com/photo-1598514982205-f36b96d1e8d4?auto=format&fit=crop&w=400&q=80', category: 'Starters', available: true,  created_at: '' },
  { id: 'm4', title: 'Grilled Ribeye Steak',    description: '12oz prime ribeye grilled to perfection',               price: 900,  image_url: 'https://images.unsplash.com/photo-1544025162-8111f4e1f7b8?auto=format&fit=crop&w=400&q=80', category: 'Mains',    available: true,  created_at: '' },
  { id: 'm5', title: 'Truffle Mushroom Risotto',description: 'Creamy Arborio rice with wild mushrooms and truffle oil',price: 850, image_url: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=400&q=80', category: 'Mains',    available: true,  created_at: '' },
  { id: 'm6', title: 'Pan-Seared Salmon',       description: 'Fresh salmon with lemon butter caper sauce',            price: 880,  image_url: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=400&q=80', category: 'Mains',    available: true,  created_at: '' },
  { id: 'm7', title: 'Classic Cheese Burger',   description: 'Single beef patty with melted cheddar and lettuce',     price: 650,  image_url: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=500&q=80', category: 'Mains',    available: true,  created_at: '' },
  { id: 'm8', title: 'Spicy Loaded Fries',      description: 'Crispy fries with cheese, jalapenos, and beef',         price: 600,  image_url: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=500&q=80', category: 'Mains',    available: true,  created_at: '' },
  { id: 'm9', title: 'Classic Mojito',          description: 'Rum, fresh mint, lime juice, and soda',                 price: 600,  image_url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=400&q=80', category: 'Drinks',   available: true,  created_at: '' },
  { id: 'm10',title: 'Mango Smoothie',          description: 'Fresh mango blended with creamy yogurt',                price: 500,  image_url: 'https://images.unsplash.com/photo-1536935338788-846bb9981813?auto=format&fit=crop&w=400&q=80', category: 'Drinks',   available: true,  created_at: '' },
  { id: 'm11',title: 'Classic Lemonade',        description: 'Freshly squeezed lemons with mint and crushed ice',     price: 450,  image_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=500&q=80', category: 'Drinks',   available: true,  created_at: '' },
  { id: 'm12',title: 'Molten Chocolate Cake',   description: 'Warm chocolate cake with gooey center, vanilla ice cream',price: 750,image_url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=400&q=80', category: 'Desserts', available: true,  created_at: '' },
  { id: 'm13',title: 'Chocolate Lava Cake',     description: 'Individual lava cake served with cream and berries',    price: 650,  image_url: 'https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?auto=format&fit=crop&w=400&q=80', category: 'Desserts', available: true,  created_at: '' },
];

interface MenuStore {
  items: DbMenuItem[];
  loading: boolean;
  error: string | null;
  fetchItems: () => Promise<void>;
}

export const useMenuStore = create<MenuStore>((set, get) => ({
  items: [],
  loading: false,
  error: null,

  fetchItems: async () => {
    if (get().items.length > 0) return; // already loaded

    if (!isSupabaseConfigured) {
      // Use mock data so the app works without credentials
      set({ items: MOCK_MENU_ITEMS, loading: false });
      return;
    }

    set({ loading: true, error: null });
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .order('category')
      .order('title');

    if (error) {
      // Fall back to mock data on error
      set({ items: MOCK_MENU_ITEMS, error: error.message, loading: false });
    } else {
      set({ items: data ?? MOCK_MENU_ITEMS, loading: false });
    }
  },
}));
