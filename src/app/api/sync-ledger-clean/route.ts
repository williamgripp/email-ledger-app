import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST() {
  try {
    console.log('🔄 Starting ledger sync (clean mode)...');

    // First, get all emails with PDF URLs
    const { data: emails, error: emailsError } = await supabase
      .from('emails')
      .select('id, invoice_number, pdf_url, received_at, sender, subject')
      .eq('has_attachment', true)
      .not('pdf_url', 'is', null);

    if (emailsError) {
      console.error('Error fetching emails:', emailsError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch emails',
        details: emailsError
      }, { status: 500 });
    }

    console.log(`📧 Found ${emails?.length || 0} emails with PDF attachments`);

    // Clear existing ledger entries (clean mode)
    const { error: deleteError } = await supabase
      .from('ledger')
      .delete()
      .not('id', 'is', null); // Delete all entries

    if (deleteError) {
      console.error('Error clearing ledger:', deleteError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to clear existing ledger entries',
        details: deleteError
      }, { status: 500 });
    }

    console.log('🗑️ Cleared existing ledger entries');

    let processed = 0;
    let successful = 0;
    const errors: string[] = [];

    // Process each email
    for (const email of emails || []) {
      try {
        processed++;
        
        // Extract amount from PDF
        const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/extract-pdf-amount`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: email.pdf_url })
        });

        const result = await response.json();
        
        if (result.success && result.amount > 0) {
          // Insert into ledger
          const { error: insertError } = await supabase
            .from('ledger')
            .insert({
              invoice_number: email.invoice_number,
              amount: result.amount,
              transaction_date: email.received_at,
              source: 'email',
              email_id: email.id
            });

          if (insertError) {
            errors.push(`Failed to insert ledger entry for ${email.invoice_number}: ${insertError.message}`);
          } else {
            successful++;
            console.log(`✅ Processed ${email.invoice_number}: $${result.amount}`);
          }
        } else {
          errors.push(`Failed to extract amount from ${email.invoice_number}: ${result.error || 'Unknown error'}`);
        }
      } catch (error) {
        errors.push(`Error processing ${email.invoice_number}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    console.log(`✅ Sync complete: ${successful}/${processed} emails processed successfully`);

    return NextResponse.json({
      success: true,
      message: `Ledger sync completed in clean mode`,
      stats: {
        totalEmails: emails?.length || 0,
        processed,
        successful,
        errors: errors.length
      },
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Sync ledger error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error during ledger sync',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
