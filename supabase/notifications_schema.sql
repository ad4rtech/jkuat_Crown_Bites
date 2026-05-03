-- Notifications Schema

-- Drop table if it exists
DROP TABLE IF EXISTS public.notifications CASCADE;

-- Create notifications table
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_role VARCHAR(50) NOT NULL, -- e.g., 'Waiter', 'Kitchen', 'Cashier', 'Manager', 'All'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info', -- 'info', 'success', 'warning', 'error'
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read notifications (filtering will be done client-side by role)
CREATE POLICY "Enable read access for all users" ON public.notifications
    FOR SELECT USING (true);

-- Allow anyone to insert notifications
CREATE POLICY "Enable insert access for all users" ON public.notifications
    FOR INSERT WITH CHECK (true);

-- Allow anyone to update notifications (e.g. marking as read)
CREATE POLICY "Enable update access for all users" ON public.notifications
    FOR UPDATE USING (true);

-- Enable Realtime
-- This requires running `ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;` if not already added.
-- But Supabase usually picks it up if configured via the dashboard. We'll add it just in case.
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR ALL TABLES;
COMMIT;
