-- Add vendor column to ledger table
-- Run this in your Supabase SQL Editor to add the vendor column

-- Add vendor column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'ledger' AND column_name = 'vendor') THEN
    ALTER TABLE ledger ADD COLUMN vendor TEXT;
  END IF;
END $$;

-- Since we're removing the email foreign key, vendor will be populated
-- during PDF processing from invoice data

-- Verify the update
SELECT COUNT(*) as total_records, 
       COUNT(vendor) as records_with_vendor 
FROM ledger;

-- Show sample records
SELECT id, vendor, description, amount 
FROM ledger 
ORDER BY id 
LIMIT 5;

SELECT 'Vendor column added successfully!' as status;
