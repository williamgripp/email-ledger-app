# Storage Bucket Setup for PDF Uploads

## Issue
The PDF uploads are failing due to Row Level Security (RLS) policies on the Supabase storage buckets.

## Quick Fix (Recommended for Development)

1. Go to your **Supabase Dashboard**
2. Navigate to **Storage** in the left sidebar
3. Find your **`invoices`** bucket
4. Click the **settings/configure** button (⚙️ icon)
5. Change the bucket from **"Private"** to **"Public"**
6. Click **Save**

This will allow anyone to upload/read files from the bucket, which is perfect for development.

## Alternative: Manual Policy Setup

If you prefer more control, you can set up custom policies instead:

1. Go to **Storage** > **Policies** in your Supabase dashboard
2. Click **"New Policy"**
3. Select the **`invoices`** bucket
4. Create policies for:
   - **SELECT** (read): Allow for all users
   - **INSERT** (upload): Allow for all users  
   - **UPDATE** (modify): Allow for all users
   - **DELETE** (remove): Allow for all users

## Test After Setup

Once you've made the bucket public or added the policies:

1. Refresh your application at http://localhost:3001
2. Click **"Setup Database (10 emails + 7 invoices)"** again
3. Check your Supabase **Storage** > **invoices** bucket for the uploaded PDFs

## Expected Results

After fixing the storage permissions, you should see:
- ✅ 7 PDF files in the `invoices` storage bucket
- ✅ Realistic invoice filenames like `invoice-INV-123456.pdf`
- ✅ Downloadable PDF attachments in the email interface
- ✅ Proper ledger entries linking to the stored PDFs
