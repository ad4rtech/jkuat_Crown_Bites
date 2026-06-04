-- ============================================================
-- Crown Bites: Reset Stuck Tables & Orders
-- Run in Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Mark all orders that are stuck at 'Pending' and older than 1 hour as Served
--    (11 stuck pending orders)
UPDATE orders
SET status = 'Served', payment_status = 'paid', payment_method = 'Voided'
WHERE status = 'Pending'
  AND payment_status = 'unpaid'
  AND created_at < now() - interval '1 hour';

-- 2. Free up specifically stuck tables T2, T3, T5
--    (tries both the short ID and full name variations)
UPDATE tables
SET status = 'available'
WHERE id IN ('T2', 'T3', 'T5')
   OR name IN ('T2', 'T3', 'T5', 'Table 2', 'Table 3', 'Table 5');

-- 3. Safety net: free ANY table that has no active unpaid orders attached
UPDATE tables t
SET status = 'available'
WHERE t.status IN ('occupied', 'eating', 'ordered')
  AND NOT EXISTS (
    SELECT 1 FROM orders o
    WHERE o.table_id = t.id
      AND o.payment_status = 'unpaid'
      AND o.status NOT IN ('Served')
  );

-- 4. Verify results
SELECT id, name, status FROM tables ORDER BY name;

SELECT id, table_id, status, payment_status, created_at
FROM orders
WHERE status NOT IN ('Served')
  AND payment_status = 'unpaid'
ORDER BY created_at DESC
LIMIT 20;
