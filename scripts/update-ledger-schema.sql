-- Update ledger table to use invoice_number as primary key
-- Run this in your Supabase SQL Editor

-- First, add the invoice_number column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'ledger' AND column_name = 'invoice_number') THEN
    ALTER TABLE ledger ADD COLUMN invoice_number TEXT;
  END IF;
END $$;

-- Drop the existing primary key constraint
ALTER TABLE ledger DROP CONSTRAINT IF EXISTS ledger_pkey;

-- Drop the existing id column (UUID)
ALTER TABLE ledger DROP COLUMN IF EXISTS id;

-- Make invoice_number the new primary key
ALTER TABLE ledger ADD CONSTRAINT ledger_pkey PRIMARY KEY (invoice_number);

-- Update the table structure to match our needs
-- Remove created_at if it exists (we'll keep updated_at)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'ledger' AND column_name = 'created_at') THEN
    ALTER TABLE ledger DROP COLUMN created_at;
  END IF;
END $$;

-- Ensure all required columns exist with proper types
-- Add any missing columns
DO $$ 
BEGIN
  -- Ensure date column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'ledger' AND column_name = 'date') THEN
    ALTER TABLE ledger ADD COLUMN date DATE NOT NULL DEFAULT CURRENT_DATE;
  END IF;
  
  -- Ensure amount column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'ledger' AND column_name = 'amount') THEN
    ALTER TABLE ledger ADD COLUMN amount DECIMAL(10,2) NOT NULL DEFAULT 0.00;
  END IF;
  
  -- Ensure description column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'ledger' AND column_name = 'description') THEN
    ALTER TABLE ledger ADD COLUMN description TEXT NOT NULL DEFAULT '';
  END IF;
  
  -- Ensure category column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'ledger' AND column_name = 'category') THEN
    ALTER TABLE ledger ADD COLUMN category TEXT;
  END IF;
  
  -- Ensure source column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'ledger' AND column_name = 'source') THEN
    ALTER TABLE ledger ADD COLUMN source TEXT NOT NULL DEFAULT 'email';
  END IF;
  
  -- Ensure vendor column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'ledger' AND column_name = 'vendor') THEN
    ALTER TABLE ledger ADD COLUMN vendor TEXT;
  END IF;
  
  -- Ensure pdf_path column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'ledger' AND column_name = 'pdf_path') THEN
    ALTER TABLE ledger ADD COLUMN pdf_path TEXT;
  END IF;
  
  -- Ensure updated_at column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'ledger' AND column_name = 'updated_at') THEN
    ALTER TABLE ledger ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- Create indexes for performance
DROP INDEX IF EXISTS idx_ledger_date;
DROP INDEX IF EXISTS idx_ledger_vendor;
DROP INDEX IF EXISTS idx_ledger_pdf_path;

CREATE INDEX idx_ledger_date ON ledger(date DESC);
CREATE INDEX idx_ledger_vendor ON ledger(vendor);
CREATE INDEX idx_ledger_pdf_path ON ledger(pdf_path);

-- Verify the new structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'ledger' 
ORDER BY ordinal_position;

SELECT 'Ledger table updated to use invoice_number as primary key!' as status;
