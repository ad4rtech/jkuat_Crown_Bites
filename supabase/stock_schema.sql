-- ==============================================================================
-- CROWN BITES: INVENTORY & STOCK SCHEMA
-- ==============================================================================

-- 1. Create stock_items table
CREATE TABLE IF NOT EXISTS stock_items (
  id text PRIMARY KEY,
  station_id text NOT NULL,
  name text NOT NULL,
  quantity numeric NOT NULL DEFAULT 0,
  unit text NOT NULL,
  threshold numeric NOT NULL DEFAULT 0,
  category text,
  linked_menu_items_count integer DEFAULT 0,
  status text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create realtime publication
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;
ALTER PUBLICATION supabase_realtime ADD TABLE stock_items;

-- 3. Seed Initial Inventory
-- This matches the INITIAL_STATIONS from stockStore.ts
INSERT INTO stock_items (id, station_id, name, quantity, unit, threshold, category, linked_menu_items_count, status)
VALUES
  -- Grill Station
  ('g1', 'grill', 'Beef Patties', 120, 'units', 20, 'Meat', 3, 'ok'),
  ('g2', 'grill', 'Brioche Buns', 15, 'units', 30, 'Bakery', 2, 'low'),
  ('g3', 'grill', 'Cheddar Cheese', 0, 'kg', 2, 'Dairy', 4, 'out'),

  -- Cold Prep
  ('c1', 'cold', 'Tomatoes', 0.8, 'kg', 1.5, 'Produce', 12, 'low'),
  ('c2', 'cold', 'Lettuce', 4, 'heads', 6, 'Produce', 5, 'low'),
  ('c3', 'cold', 'Cucumber', 8, 'units', 4, 'Produce', 3, 'ok'),

  -- Beverages
  ('b1', 'beverages', 'Coffee Beans', 5, 'kg', 2, 'Beverages', 6, 'ok'),
  ('b2', 'beverages', 'Lemon Syrup', 1, 'bottles', 3, 'Beverages', 3, 'low'),
  ('b3', 'beverages', 'Sparkling Water', 0, 'crates', 2, 'Beverages', 1, 'out'),

  -- Dairy & Sauces
  ('d1', 'dairy', 'Heavy Cream', 4, 'litres', 2, 'Dairy', 2, 'ok'),
  ('d2', 'dairy', 'Butter', 2, 'kg', 1, 'Dairy', 4, 'ok'),
  ('d3', 'dairy', 'Pesto Sauce', 0, 'jars', 3, 'Condiment', 8, 'out'),
  ('d5', 'dairy', 'Cooking Oil', 0, 'L', 5, 'Condiment', 8, 'out'),

  -- Dry Goods
  ('y1', 'dry', 'Pasta', 6, 'kg', 3, 'Dry Goods', 2, 'ok'),
  ('y2', 'dry', 'Burger Buns', 10, 'pcs', 30, 'Bakery', 3, 'low'),
  ('y3', 'dry', 'Chicken Breast', 3.5, 'kg', 2, 'Meat', 4, 'ok'),
  ('y4', 'dry', 'Breadcrumbs', 3, 'kg', 1, 'Dry Goods', 1, 'ok')
ON CONFLICT (id) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  status = EXCLUDED.status;
