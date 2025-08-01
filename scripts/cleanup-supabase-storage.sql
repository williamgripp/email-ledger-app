-- Minerva Storage Cleanup Script
-- Run this in your Supabase SQL Editor to delete all PDF files from storage

-- Delete all files from the 'invoices' bucket
-- This removes the actual PDF files stored in Supabase Storage
DELETE FROM storage.objects 
WHERE bucket_id = 'invoices';

-- Verify cleanup - this should return 0 rows
SELECT COUNT(*) as file_count 
FROM storage.objects 
WHERE bucket_id = 'invoices';

-- Success message
SELECT 'Storage cleanup completed successfully!' as status;
