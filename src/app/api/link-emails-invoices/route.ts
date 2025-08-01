import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST() {
  try {
    console.log('🔗 Starting email-invoice linking process...');

    // Get all PDFs from invoices storage
    const { data: invoiceFiles, error: storageError } = await supabase.storage
      .from('invoices')
      .list('');

    if (storageError) {
      console.error('❌ Error listing invoices:', storageError);
      return NextResponse.json({ error: 'Failed to list invoices' }, { status: 500 });
    }

    const pdfFiles = invoiceFiles?.filter(file => file.name.endsWith('.pdf')) || [];
    console.log(`📁 Found ${pdfFiles.length} PDF files in storage:`, pdfFiles.map(f => f.name));

    // Get all emails that have attachments but no invoice_number
    const { data: emails, error: emailError } = await supabase
      .from('emails')
      .select('*')
      .eq('has_attachment', true)
      .is('invoice_number', null);

    if (emailError) {
      console.error('❌ Error fetching emails:', emailError);
      return NextResponse.json({ error: 'Failed to fetch emails' }, { status: 500 });
    }

    console.log(`📧 Found ${emails?.length || 0} emails with attachments that need invoice numbers`);

    if (!emails || emails.length === 0) {
      return NextResponse.json({ 
        message: 'No emails found that need invoice numbers',
        updated: 0
      });
    }

    // Extract invoice numbers from PDF filenames
    const invoiceNumbers = pdfFiles.map(file => {
      // Extract invoice number from filename like "invoice-INV-1753998276695-865.pdf"
      const match = file.name.match(/invoice-(.+)\.pdf$/);
      return match ? match[1] : null;
    }).filter(Boolean);

    console.log(`🔢 Extracted invoice numbers:`, invoiceNumbers);

    // Update emails with invoice numbers
    let updatedCount = 0;
    for (let i = 0; i < emails.length && i < invoiceNumbers.length; i++) {
      const email = emails[i];
      const invoiceNumber = invoiceNumbers[i];

      const { error: updateError } = await supabase
        .from('emails')
        .update({ invoice_number: invoiceNumber })
        .eq('id', email.id);

      if (updateError) {
        console.error(`❌ Error updating email ${email.id}:`, updateError);
      } else {
        console.log(`✅ Updated email ${email.id} with invoice number ${invoiceNumber}`);
        updatedCount++;
      }
    }

    console.log(`🎉 Successfully linked ${updatedCount} emails with invoices`);

    return NextResponse.json({
      message: `Successfully linked ${updatedCount} emails with invoices`,
      updated: updatedCount,
      totalEmails: emails.length,
      totalInvoices: pdfFiles.length
    });

  } catch (error) {
    console.error('❌ Error in link-emails-invoices:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
