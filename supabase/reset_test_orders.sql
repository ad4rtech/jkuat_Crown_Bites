-- ==============================================================================
-- 🚨 RESET SCRIPT: CLEARS ALL ORDERS, ITEMS, NOTIFICATIONS & RESTORES TABLES 🚨
-- ==============================================================================

-- 1. Delete all notifications
DELETE FROM public.notifications;

-- 2. Delete all order items (this must be done before deleting orders due to foreign keys)
DELETE FROM public.order_items;

-- 3. Delete all orders
DELETE FROM public.orders;

-- 4. Reset all tables back to 'available'
UPDATE public.tables
SET status = 'available';

-- Note: Shift Reports, Manager Menu Items, and Roles are intentionally kept. 
