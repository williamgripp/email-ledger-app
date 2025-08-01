import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Email {
  id: string
  subject: string
  sender: string
  received_at: string
  has_attachment: boolean
  body: string
  invoice_number?: string
  pdf_url?: string
  created_at: string
}

export interface LedgerEntry {
  invoice_number: string  // Primary key
  date: string
  amount: number
  description: string
  category?: string
  source: string
  vendor?: string
  pdf_path?: string
  updated_at: string
}

export interface UploadedFile {
  invoice_number: string  // Primary key
  date: string
  amount: number
}

export interface TransactionLedgerEntry {
  invoice_number: string
  date: string
  amount: number
  description: string
  category?: string
  source: string
  vendor?: string
  pdf_path?: string
  bank_amount?: number
  bank_date?: string
}
