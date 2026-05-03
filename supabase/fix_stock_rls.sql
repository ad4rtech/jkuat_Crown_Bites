-- ==============================================================================
-- CROWN BITES: FIX INVENTORY RLS POLICIES
-- ==============================================================================
-- Run this in your Supabase SQL Editor to allow the app to read/write inventory.

-- Ensure RLS is enabled
ALTER TABLE stock_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist so we can recreate them
DROP POLICY IF EXISTS "Enable read access for all users" ON stock_items;
DROP POLICY IF EXISTS "Enable insert access for all users" ON stock_items;
DROP POLICY IF EXISTS "Enable update access for all users" ON stock_items;
DROP POLICY IF EXISTS "Enable delete access for all users" ON stock_items;

-- Create policies that allow the app (anon key) to do everything
CREATE POLICY "Enable read access for all users" ON stock_items FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON stock_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON stock_items FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON stock_items FOR DELETE USING (true);
