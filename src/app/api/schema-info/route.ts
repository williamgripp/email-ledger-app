import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    console.log('📋 Fetching current database schema information...');

    // Get emails table structure
    const { data: emailsData, error: emailsError } = await supabase
      .from('emails')
      .select('*')
      .limit(1);

    // Get ledger table structure
    const { data: ledgerData, error: ledgerError } = await supabase
      .from('ledger')
      .select('*')
      .limit(1);

    if (emailsError) {
      console.error('Error fetching emails schema:', emailsError);
    }

    if (ledgerError) {
      console.error('Error fetching ledger schema:', ledgerError);
    }

    // Get counts
    const { count: emailsCount } = await supabase
      .from('emails')
      .select('*', { count: 'exact', head: true });

    const { count: ledgerCount } = await supabase
      .from('ledger')
      .select('*', { count: 'exact', head: true });

    const emailsSchema = emailsData && emailsData.length > 0 ? Object.keys(emailsData[0]) : [];
    const ledgerSchema = ledgerData && ledgerData.length > 0 ? Object.keys(ledgerData[0]) : [];

    return NextResponse.json({
      success: true,
      tables: {
        emails: {
          schema: emailsSchema,
          count: emailsCount || 0,
          sample: emailsData?.[0] || null
        },
        ledger: {
          schema: ledgerSchema,
          count: ledgerCount || 0,
          sample: ledgerData?.[0] || null
        }
      },
      proposed_changes: {
        context: "Based on sync-ledger architecture, we might want to modify ledger table",
        current_primary_key: "invoice_number",
        emails_linking_field: "invoice_number",
        note: "Emails table already has: id, subject, sender, received_at, has_attachment, body, pdf_url, created_at, invoice_number"
      }
    });

  } catch (error) {
    console.error('Schema info error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get schema info',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
