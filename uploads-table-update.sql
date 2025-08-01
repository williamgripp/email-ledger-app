-- Update uploads table to store CSV upload information with matching data
-- This migration adds columns to track CSV processing results

-- Add columns for CSV processing results
ALTER TABLE uploaded ADD COLUMN IF NOT EXISTS processed_entries INTEGER DEFAULT 0;
ALTER TABLE uploaded ADD COLUMN IF NOT EXISTS matched_entries INTEGER DEFAULT 0;
ALTER TABLE uploaded ADD COLUMN IF NOT EXISTS processing_status TEXT DEFAULT 'pending';
ALTER TABLE uploaded ADD COLUMN IF NOT EXISTS processing_error TEXT;

-- Update any existing entries to have a default status
UPDATE uploaded SET processing_status = 'completed' WHERE processing_status IS NULL;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_uploaded_processing_status ON uploaded(processing_status);
CREATE INDEX IF NOT EXISTS idx_uploaded_uploaded_at ON uploaded(uploaded_at DESC);

-- Update the ledger table to support the new source format
-- No changes needed since 'source' column already exists and can handle the new values

-- Add index on invoice_number for faster matching
CREATE INDEX IF NOT EXISTS idx_ledger_invoice_number ON ledger(invoice_number);
CREATE INDEX IF NOT EXISTS idx_ledger_amount ON ledger(amount);
