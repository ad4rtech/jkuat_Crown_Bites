-- ============================================================
-- Crown Bites: Order Items Foreign Key Fix
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Clear existing orders and order_items that have old UUID references
-- (This resolves the foreign key conflict when switching to the new text IDs)
TRUNCATE TABLE order_items CASCADE;
TRUNCATE TABLE orders CASCADE;

-- 2. Drop existing foreign key constraint from order_items to menu_items
ALTER TABLE order_items
DROP CONSTRAINT IF EXISTS order_items_menu_item_id_fkey;

-- 3. Alter the menu_item_id column to be type 'text' instead of 'uuid' 
-- (This is required because manager_menu_items uses text IDs like 'i-01')
ALTER TABLE order_items
ALTER COLUMN menu_item_id TYPE text;

-- 4. Add the new foreign key linking to manager_menu_items
ALTER TABLE order_items
ADD CONSTRAINT order_items_menu_item_id_fkey
FOREIGN KEY (menu_item_id) REFERENCES manager_menu_items(id) ON DELETE CASCADE;
