-- Remove foreign key constraint and email_id column from ledger table
-- Run this in your Supabase SQL Editor

-- First, drop the foreign key constraint if it exists
DO $$ 
BEGIN
  -- Check if the constraint exists and drop it
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
             WHERE table_name = 'ledger' 
             AND constraint_type = 'FOREIGN KEY'
             AND constraint_name LIKE '%email%') THEN
    -- Find and drop the foreign key constraint
    EXECUTE (
      SELECT 'ALTER TABLE ledger DROP CONSTRAINT ' || constraint_name || ';'
      FROM information_schema.table_constraints 
      WHERE table_name = 'ledger' 
      AND constraint_type = 'FOREIGN KEY'
      AND constraint_name LIKE '%email%'
      LIMIT 1
    );
  END IF;
END $$;

-- Drop the email_id column if it exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'ledger' AND column_name = 'email_id') THEN
    ALTER TABLE ledger DROP COLUMN email_id;
  END IF;
END $$;

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'ledger' 
ORDER BY ordinal_position;

-- Show current ledger structure
\d ledger;

SELECT 'Foreign key and email_id column removed successfully!' as status;
