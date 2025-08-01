-- Storage bucket policies for Supabase
-- Run these commands in your Supabase dashboard under "Storage" > "Policies"

-- For the 'invoices' bucket:
-- 1. Go to Storage > Policies
-- 2. Create new policy for 'invoices' bucket
-- 3. Allow SELECT, INSERT, UPDATE, DELETE for all users

-- Policy 1: Allow public read access to invoices
CREATE POLICY "Allow public read access" ON storage.objects 
FOR SELECT USING (bucket_id = 'invoices');

-- Policy 2: Allow public upload to invoices
CREATE POLICY "Allow public upload" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'invoices');

-- Policy 3: Allow public update to invoices
CREATE POLICY "Allow public update" ON storage.objects 
FOR UPDATE USING (bucket_id = 'invoices');

-- Policy 4: Allow public delete from invoices
CREATE POLICY "Allow public delete" ON storage.objects 
FOR DELETE USING (bucket_id = 'invoices');

-- For the 'emails' bucket (if you created it):
-- Policy 5: Allow public read access to emails bucket
CREATE POLICY "Allow public read access" ON storage.objects 
FOR SELECT USING (bucket_id = 'emails');

-- Policy 6: Allow public upload to emails bucket
CREATE POLICY "Allow public upload" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'emails');

-- Policy 7: Allow public update to emails bucket
CREATE POLICY "Allow public update" ON storage.objects 
FOR UPDATE USING (bucket_id = 'emails');

-- Policy 8: Allow public delete from emails bucket
CREATE POLICY "Allow public delete" ON storage.objects 
FOR DELETE USING (bucket_id = 'emails');

-- Alternative: If you want to make the buckets completely public (easier for development)
-- Go to Storage > Settings and make the buckets "Public" instead of using these policies
