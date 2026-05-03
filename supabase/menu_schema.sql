-- ============================================================
-- Crown Bites: Manager Menu Schema
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Menu Categories
CREATE TABLE IF NOT EXISTS menu_categories (
  id         text PRIMARY KEY,
  name       text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active  boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Menu Items (manager-controlled)
CREATE TABLE IF NOT EXISTS manager_menu_items (
  id           text PRIMARY KEY,
  name         text NOT NULL,
  category_id  text REFERENCES menu_categories(id) ON DELETE SET NULL,
  price        integer NOT NULL DEFAULT 0,
  status       text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'unavailable', 'deactivated')),
  description  text,
  photo        text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- 3. Enable Row Level Security
ALTER TABLE menu_categories    ENABLE ROW LEVEL SECURITY;
ALTER TABLE manager_menu_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read/write categories" ON menu_categories;
DROP POLICY IF EXISTS "Public read/write menu items" ON manager_menu_items;

CREATE POLICY "Public read/write categories"  ON menu_categories    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public read/write menu items"  ON manager_menu_items FOR ALL USING (true) WITH CHECK (true);

-- 4. Seed Categories
INSERT INTO menu_categories (id, name, sort_order, is_active) VALUES
  ('cat-1', 'Starters',  0, true),
  ('cat-2', 'Mains',     1, true),
  ('cat-3', 'Grills',    2, true),
  ('cat-4', 'Sides',     3, true),
  ('cat-5', 'Drinks',    4, true),
  ('cat-6', 'Desserts',  5, true)
ON CONFLICT (id) DO NOTHING;

-- 5. Seed Menu Items
INSERT INTO manager_menu_items (id, name, category_id, price, status, description) VALUES
  ('i-01', 'Chicken Wings',        'cat-1', 850,  'active',      'Crispy wings with dipping sauce'),
  ('i-02', 'Bruschetta',           'cat-1', 600,  'active',      'Toasted bread with fresh tomato'),
  ('i-13', 'Garlic Bread',         'cat-1', 400,  'active',      'Toasted baguette with garlic butter'),
  ('i-03', 'Classic Cheese Burger','cat-2', 1200, 'active',      'Beef patty with cheddar and pickles'),
  ('i-14', 'BBQ Bacon Burger',     'cat-2', 1350, 'active',      'Smoky BBQ beef patty with crispy bacon'),
  ('i-04', 'Chicken Pesto Pasta',  'cat-2', 1100, 'active',      'Pesto tossed pasta with grilled chicken'),
  ('i-05', 'Grilled Chicken',      'cat-3', 1350, 'active',      'Whole quarter chicken, charcoal grilled'),
  ('i-06', 'Beef Steak',           'cat-3', 2200, 'unavailable', '250g sirloin, medium rare'),
  ('i-07', 'Large Fries',          'cat-4', 450,  'active',      'Seasoned crispy fries'),
  ('i-08', 'Coleslaw',             'cat-4', 300,  'active',      'Creamy house coleslaw'),
  ('i-09', 'Lemonade',             'cat-5', 350,  'active',      'Fresh squeezed lemonade'),
  ('i-10', 'Lemon Iced Tea',       'cat-5', 400,  'active',      'Chilled black tea with lemon'),
  ('i-11', 'Sparkling Water',      'cat-5', 200,  'unavailable', '500ml sparkling'),
  ('i-12', 'Chocolate Lava Cake',  'cat-6', 750,  'active',      'Warm cake with liquid chocolate centre'),
  ('i-15', 'Classic Tiramisu',     'cat-6', 650,  'active',      'Italian coffee and mascarpone dessert')
ON CONFLICT (id) DO NOTHING;
