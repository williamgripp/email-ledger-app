-- Create emails table
CREATE TABLE emails (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subject TEXT NOT NULL,
  sender TEXT NOT NULL,
  received_at TIMESTAMP WITH TIME ZONE NOT NULL,
  has_attachment BOOLEAN DEFAULT FALSE,
  processed BOOLEAN DEFAULT FALSE,
  body TEXT,
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ledger table
CREATE TABLE ledger (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  source TEXT NOT NULL, -- 'email' | 'manual'
  vendor TEXT,
  pdf_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create uploaded files table
CREATE TABLE uploaded (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create storage buckets (run these in Supabase dashboard storage section)
-- Bucket: invoices (for PDF invoices)
-- Bucket: emails (for email attachments)

-- Insert sample emails (70% with attachments)
INSERT INTO emails (subject, sender, received_at, has_attachment, processed, body) VALUES
('Receipt from Amazon - Order #123456', 'auto-confirm@amazon.com', NOW() - INTERVAL '1 day', TRUE, FALSE, 'Thank you for your recent purchase. Your order has been processed and shipped.'),
('Your Starbucks Receipt', 'receipt@starbucks.com', NOW() - INTERVAL '2 days', TRUE, FALSE, 'Thank you for choosing Starbucks! Your receipt is attached.'),
('Weekly Newsletter - Special Offers', 'newsletter@company.com', NOW() - INTERVAL '3 days', FALSE, FALSE, 'Check out our latest products and special offers this week.'),
('Whole Foods Market Receipt', 'receipts@wholefoods.com', NOW() - INTERVAL '4 days', TRUE, FALSE, 'Thank you for shopping at Whole Foods Market. Your receipt is attached.'),
('Account Security Update', 'support@service.com', NOW() - INTERVAL '5 days', FALSE, FALSE, 'This is a security notification regarding your account.'),
('Office Depot Order Confirmation', 'orders@officedepot.com', NOW() - INTERVAL '6 days', TRUE, FALSE, 'Your office supplies order has been completed. Receipt attached.'),
('Shell Gas Station Receipt', 'receipts@shell.com', NOW() - INTERVAL '7 days', TRUE, FALSE, 'Thank you for fueling up at Shell. Your receipt is attached.'),
('Don''t miss out on our latest deals!', 'marketing@store.com', NOW() - INTERVAL '8 days', FALSE, FALSE, 'Exclusive deals for our valued customers. Limited time only!'),
('Your food delivery receipt', 'noreply@restaurant.com', NOW() - INTERVAL '9 days', TRUE, FALSE, 'Your food order has been delivered. Enjoy your meal!'),
('Important: Please verify your email', 'help@company.com', NOW() - INTERVAL '10 days', FALSE, FALSE, 'Please take a moment to verify your email address.');

-- Add indexes for better performance
CREATE INDEX idx_emails_received_at ON emails(received_at DESC);
CREATE INDEX idx_emails_has_attachment ON emails(has_attachment);
CREATE INDEX idx_ledger_date ON ledger(date DESC);
CREATE INDEX idx_ledger_vendor ON ledger(vendor);

-- Enable Row Level Security (RLS)
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploaded ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust based on your needs)
CREATE POLICY "Enable read access for all users" ON emails FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON emails FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON emails FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON ledger FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON ledger FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON ledger FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON uploaded FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON uploaded FOR INSERT WITH CHECK (true);
