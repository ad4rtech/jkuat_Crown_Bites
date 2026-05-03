-- ============================================================
-- CROWN BITES ROKMS — Supabase Database Schema & Seed
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. MENU ITEMS
-- ─────────────────────────────────────────────────────────────
create table if not exists menu_items (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  price       int4 not null,        -- price in KES (no decimals)
  image_url   text,
  category    text not null,        -- 'Starters','Mains','Drinks','Desserts'
  available   bool not null default true,
  created_at  timestamptz default now()
);

-- 2. TABLES
-- ─────────────────────────────────────────────────────────────
create table if not exists tables (
  id     text primary key,          -- e.g. 'T1'
  name   text not null,
  seats  int4 not null,
  zone   text not null,             -- 'Main Dining' | 'Outdoor Patio'
  shape  text not null,             -- 'rect' | 'circle' | 'rect-vertical'
  status text not null default 'available'  -- 'available' | 'occupied' | 'ordered'
);

-- 3. ORDERS
-- ─────────────────────────────────────────────────────────────
create table if not exists orders (
  id              uuid primary key default gen_random_uuid(),
  table_id        text references tables(id) on delete cascade,
  status          text not null default 'Pending',    -- 'Pending'|'In Prep'|'Ready'|'Served'
  payment_status  text not null default 'unpaid',     -- 'unpaid' | 'paid'
  total_amount    int4 not null default 0,
  created_at      timestamptz default now()
);

-- 4. ORDER ITEMS
-- ─────────────────────────────────────────────────────────────
create table if not exists order_items (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid references orders(id) on delete cascade,
  menu_item_id   uuid references menu_items(id),
  quantity       int4 not null,
  unit_price     int4 not null   -- snapshot of price at time of order
);

-- ─────────────────────────────────────────────────────────────
-- ENABLE REALTIME
-- ─────────────────────────────────────────────────────────────
alter publication supabase_realtime add table tables;
alter publication supabase_realtime add table orders;

-- ─────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY — open for waiter app (no auth for now)
-- ─────────────────────────────────────────────────────────────
alter table menu_items enable row level security;
alter table tables enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

create policy "Allow all for anon" on menu_items for all using (true) with check (true);
create policy "Allow all for anon" on tables      for all using (true) with check (true);
create policy "Allow all for anon" on orders      for all using (true) with check (true);
create policy "Allow all for anon" on order_items for all using (true) with check (true);

-- ─────────────────────────────────────────────────────────────
-- SEED: TABLES
-- ─────────────────────────────────────────────────────────────
insert into tables (id, name, seats, zone, shape) values
  ('T1',  'T1',  4, 'Main Dining',   'rect'),
  ('T2',  'T2',  4, 'Main Dining',   'rect'),
  ('T3',  'T3',  4, 'Main Dining',   'circle'),
  ('T4',  'T4',  4, 'Main Dining',   'circle'),
  ('T5',  'T5',  6, 'Main Dining',   'rect-vertical'),
  ('T6',  'T6',  2, 'Outdoor Patio', 'circle'),
  ('T7',  'T7',  2, 'Outdoor Patio', 'circle'),
  ('T8',  'T8',  4, 'Outdoor Patio', 'rect'),
  ('T9',  'T9',  6, 'Outdoor Patio', 'rect-vertical'),
  ('T10', 'T10', 4, 'Outdoor Patio', 'rect')
on conflict (id) do nothing;

-- ─────────────────────────────────────────────────────────────
-- SEED: MENU ITEMS
-- ─────────────────────────────────────────────────────────────
insert into menu_items (title, description, price, image_url, category, available) values
  -- Starters
  ('Crispy Calamari',       'Golden fried calamari rings served with house-made tartar',          650, 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=400&q=80', 'Starters', true),
  ('Classic Bruschetta',    'Toasted ciabatta topped with diced roma tomatoes and fresh basil',   500, 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?auto=format&fit=crop&w=400&q=80', 'Starters', true),
  ('Garlic Bread',          'Oven-baked baguette slices generously coated in garlic herb butter', 550, 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?auto=format&fit=crop&w=400&q=80', 'Starters', false),
  ('Spring Rolls',          'Crispy golden wrappers filled with seasoned vegetables',             600, 'https://images.unsplash.com/photo-1598514982205-f36b96d1e8d4?auto=format&fit=crop&w=400&q=80', 'Starters', true),
  -- Mains
  ('Grilled Ribeye Steak',       '12oz prime ribeye grilled to perfection with asparagus',       900, 'https://images.unsplash.com/photo-1544025162-8111f4e1f7b8?auto=format&fit=crop&w=400&q=80', 'Mains', true),
  ('Truffle Mushroom Risotto',   'Creamy Arborio rice with wild mushrooms and truffle oil',      850, 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=400&q=80', 'Mains', true),
  ('Pan-Seared Salmon',          'Fresh Atlantic salmon with lemon butter caper sauce',           880, 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=400&q=80', 'Mains', true),
  ('Golden Spicy Chicken',       'Crispy chicken fillet with spicy mayo, fresh lettuce',         750, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=80', 'Mains', true),
  ('Classic Cheese Burger',      'Single beef patty with melted cheddar, fresh lettuce',         650, 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=500&q=80', 'Mains', true),
  ('BBQ Bacon Burger',           'Double beef patty with smoked bacon and BBQ sauce',            800, 'https://images.unsplash.com/photo-1594212204909-00913988b488?auto=format&fit=crop&w=500&q=80', 'Mains', false),
  ('Spicy Loaded Fries',         'Crispy fries with cheese, jalapenos, and spicy ground beef',   600, 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=500&q=80', 'Mains', true),
  -- Drinks
  ('Classic Mojito',             'Rum, fresh mint, lime juice, and soda',                        600, 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=400&q=80', 'Drinks', true),
  ('Mango Smoothie',             'Fresh tropical mango blended with creamy yogurt',              500, 'https://images.unsplash.com/photo-1536935338788-846bb9981813?auto=format&fit=crop&w=400&q=80', 'Drinks', true),
  ('Classic Lemonade',           'Freshly squeezed lemons with mint leaves and crushed ice',     450, 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=500&q=80', 'Drinks', true),
  ('Sparkling Water',            'Chilled sparkling mineral water with lemon wedge',             250, 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&w=400&q=80', 'Drinks', true),
  -- Desserts
  ('Molten Chocolate Cake',      'Warm chocolate cake with gooey center and vanilla ice cream',  750, 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=400&q=80', 'Desserts', true),
  ('Classic Tiramisu',           'Espresso-soaked ladyfingers with mascarpone cream',            700, 'https://images.unsplash.com/photo-1571115177098-24eccfb22d10?auto=format&fit=crop&w=400&q=80', 'Desserts', false),
  ('Chocolate Lava Cake',        'Individual lava cake served with cream and berries',           650, 'https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?auto=format&fit=crop&w=400&q=80', 'Desserts', true)
on conflict do nothing;
