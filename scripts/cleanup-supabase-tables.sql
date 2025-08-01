-- Minerva Database Cleanup Script
-- Run this in your Supabase SQL Editor to delete all data

-- Delete in the correct order due to foreign key constraints
-- First, delete all ledger entries (child table)
DELETE FROM ledger;

-- Then delete all emails (parent table)
DELETE FROM emails;

-- Reset auto-increment sequences (if you want IDs to start from 1 again)
-- Note: PostgreSQL uses sequences, not auto_increment like MySQL
-- These commands will reset the ID counters to start from 1

-- Reset emails table sequence
SELECT setval('emails_id_seq', 1, false);

-- Reset ledger table sequence
SELECT setval('ledger_id_seq', 1, false);

-- Verify cleanup - these should return 0 rows
SELECT COUNT(*) as email_count FROM emails;
SELECT COUNT(*) as ledger_count FROM ledger;

-- Success message
SELECT 'Database cleanup completed successfully!' as status;
