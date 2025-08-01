-- Create transaction_ledger view in Supabase
-- This view combines ledger and uploaded tables with proper matching logic using FULL OUTER JOIN

CREATE OR REPLACE VIEW transaction_ledger AS
SELECT 
  COALESCE(l.invoice_number, u.invoice_number) as invoice_number,
  COALESCE(l.date, u.date) as date,
  COALESCE(l.amount, u.amount) as amount,
  COALESCE(l.description, 'Bank statement entry - ' || u.invoice_number) as description,
  COALESCE(l.category, 'Bank Statement') as category,
  COALESCE(l.vendor, 'Unknown') as vendor,
  l.pdf_path,
  COALESCE(l.created_at, NOW()) as created_at,
  COALESCE(l.updated_at, NOW()) as updated_at,
  -- Determine source based on which tables have data
  CASE 
    WHEN l.invoice_number IS NOT NULL AND u.invoice_number IS NOT NULL THEN 'email, bank statement'
    WHEN l.invoice_number IS NOT NULL THEN 'email'
    ELSE 'bank statement'
  END as source,
  -- Determine match status
  CASE 
    WHEN l.invoice_number IS NOT NULL AND u.invoice_number IS NOT NULL THEN 'matched'
    WHEN l.invoice_number IS NOT NULL THEN 'email_only'
    ELSE 'bank_only'
  END as match_status,
  u.amount as bank_amount,
  u.date as bank_date
FROM ledger l
FULL OUTER JOIN uploaded u ON (
  l.invoice_number = u.invoice_number 
  AND ROUND(l.amount, 0) = ROUND(u.amount, 0)
)
ORDER BY COALESCE(l.date, u.date) DESC;

-- Grant permissions to read the view
GRANT SELECT ON transaction_ledger TO authenticated;
GRANT SELECT ON transaction_ledger TO anon;
