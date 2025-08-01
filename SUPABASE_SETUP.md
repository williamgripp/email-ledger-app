# Supabase Setup Guide

## 🚀 Setting up Supabase for Email & Ledger Manager

Follow these steps to configure Supabase for your project:

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new account or sign in
3. Click "New Project"
4. Choose your organization
5. Fill in project details:
   - **Project Name**: `email-ledger-manager`
   - **Database Password**: (choose a strong password)
   - **Region**: (choose closest to your location)
6. Click "Create new project"

### 2. Get Your Project Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (something like: `https://xyz123.supabase.co`)
   - **Anon/Public Key** (starts with `eyJ...`)

### 3. Update Your Environment Variables

Replace the values in your `.env` file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Set Up the Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy and paste the contents of `supabase-setup.sql` 
3. Click "Run" to execute the SQL

This will create:
- **emails** table (for storing email data)
- **ledger** table (for transaction entries)
- **uploaded** table (for CSV file tracking)
- Sample data (10 emails, 70% with attachments)

### 5. Set Up Storage Buckets

1. Go to **Storage** in your Supabase dashboard
2. Create two new buckets:

#### Bucket 1: `invoices`
- **Name**: `invoices`
- **Public**: Yes (for PDF downloads)
- **File size limit**: 50MB
- **Allowed file types**: `application/pdf`

#### Bucket 2: `emails`
- **Name**: `emails` 
- **Public**: No (private email attachments)
- **File size limit**: 100MB
- **Allowed file types**: `application/pdf, image/*`

### 6. Configure Storage Policies (Optional)

For production, you may want to add Row Level Security policies:

```sql
-- Allow public access to invoices bucket
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'invoices');

-- Allow authenticated uploads to invoices
CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'invoices' AND auth.role() = 'authenticated');
```

### 7. Test the Connection

1. Start your development server: `npm run dev`
2. Visit `http://localhost:3000`
3. Click "Generate Email" to test the integration
4. Check your Supabase dashboard to see the data being created

### 8. Real-time Features (Optional)

To enable real-time updates:

1. Go to **Database** → **Replication**
2. Enable replication for these tables:
   - `emails`
   - `ledger`
   - `uploaded`

### 9. Backup & Security (Production)

For production deployment:

1. **Database Backup**: Enable Point-in-Time Recovery
2. **API Keys**: Use service role key for server-side operations
3. **RLS Policies**: Implement proper Row Level Security
4. **CORS**: Configure allowed origins in Supabase settings

## 📊 Expected Data Structure

After setup, you'll have:

### Sample Emails (10 total)
- **7 emails with PDF attachments** (Amazon, Starbucks, Whole Foods, Office Depot, Shell, Restaurant orders)
- **3 emails without attachments** (Newsletters, notifications, security updates)

### Automatic Ledger Entries
- Generated from emails with attachments
- Realistic amounts and categories
- Linked to parent emails

### Storage
- **invoices/** - PDF receipts generated from emails
- **emails/** - Future email attachment storage

## 🔧 Development Workflow

1. **Generate Emails** → Creates database entries + PDFs in storage
2. **View Email Details** → Fetches from database + reconstructs invoice data
3. **Download PDFs** → Retrieves from Supabase storage
4. **Upload CSVs** → Stores in `uploaded` table + Supabase storage
5. **Bank Reconciliation** → Compares database ledger with uploaded CSV

## 🚨 Troubleshooting

### Common Issues:

**"Cannot find module '@/lib/supabase'"**
- Make sure you've created the Supabase client file
- Check your environment variables are set

**"Failed to fetch emails"**
- Verify your Supabase credentials
- Check if the database schema is created
- Ensure RLS policies allow access

**"PDF upload failed"**
- Verify storage buckets are created
- Check bucket permissions
- Ensure file size limits

**"No sample data"**
- Run the `supabase-setup.sql` script in SQL Editor
- Check the emails table in Table Editor

## 🎯 Next Steps

Once Supabase is configured:
1. Test email generation and PDF downloads
2. Upload a sample CSV for bank reconciliation
3. Verify real-time updates (if enabled)
4. Deploy to Vercel with Supabase integration

Your app will now use Supabase for all data storage and file management!
