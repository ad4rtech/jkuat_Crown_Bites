-- Create the restaurant_profile table
CREATE TABLE public.restaurant_profile (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.restaurant_profile ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read access
CREATE POLICY "Allow public read access to restaurant_profile"
ON public.restaurant_profile
FOR SELECT
TO public, anon
USING (true);

-- Allow anonymous update access
CREATE POLICY "Allow public update access to restaurant_profile"
ON public.restaurant_profile
FOR UPDATE
TO public, anon
USING (true);

CREATE POLICY "Allow public insert access to restaurant_profile"
ON public.restaurant_profile
FOR INSERT
TO public, anon
WITH CHECK (true);

-- Insert default row if table is empty
INSERT INTO public.restaurant_profile (name, address, phone, email) 
VALUES ('Crown Bites', '123 Main St, Culinary District', '(555) 123-4567', 'contact@crownbites.com')
ON CONFLICT DO NOTHING;
