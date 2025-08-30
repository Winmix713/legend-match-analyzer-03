-- Enable RLS on matches table and add policies for public read access
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- Allow public read access to matches (since this is match data that should be publicly available)
CREATE POLICY "Allow public read access to matches" 
ON public.matches 
FOR SELECT 
TO public 
USING (true);

-- Allow authenticated users to read matches
CREATE POLICY "Allow authenticated users to read matches" 
ON public.matches 
FOR SELECT 
TO authenticated 
USING (true);