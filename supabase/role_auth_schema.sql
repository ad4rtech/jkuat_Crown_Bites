-- Create the role_auth table
CREATE TABLE public.role_auth (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    role TEXT NOT NULL UNIQUE,
    pin TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.role_auth ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read access so the login screen can verify PINs
CREATE POLICY "Allow public read access to role_auth"
ON public.role_auth
FOR SELECT
TO public, anon
USING (true);

-- Allow anonymous update access so the manager settings can update PINs 
-- (Assuming we are relying on the Manager PIN client-side check to gate the settings page)
CREATE POLICY "Allow public update access to role_auth"
ON public.role_auth
FOR UPDATE
TO public, anon
USING (true);

CREATE POLICY "Allow public insert access to role_auth"
ON public.role_auth
FOR INSERT
TO public, anon
WITH CHECK (true);

-- Insert default roles and PINs (matches previous hardcoded values)
INSERT INTO public.role_auth (role, pin) VALUES
('manager', '1234'),
('waiter', '2345'),
('kitchen', '3456'),
('cashier', '4567')
ON CONFLICT (role) DO NOTHING;
