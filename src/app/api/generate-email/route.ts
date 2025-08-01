import { NextResponse } from 'next/server';
import { generateRandomEmail } from '@/lib/emailGenerator';
import { generateRandomInvoiceData, generatePDFInvoice } from '@/lib/pdfGenerator';
import { supabase } from '@/lib/supabase';

export async function POST() {
  try {
    const emailData = generateRandomEmail();
    
    // Save email to database first
    const { data: savedEmail, error: emailError } = await supabase
      .from('emails')
      .insert({
        subject: emailData.subject,
        sender: emailData.sender,
        received_at: emailData.receivedAt.toISOString(),
        has_attachment: emailData.hasAttachment,
        body: emailData.body
      })
      .select()
      .single();

    if (emailError) {
      console.error('Error saving email:', emailError);
      return NextResponse.json(
        { error: 'Failed to save email' },
        { status: 500 }
      );
    }

    // If email has attachment, generate PDF invoice data and store in Supabase
    if (emailData.hasAttachment) {
      const invoiceData = generateRandomInvoiceData();
      emailData.invoiceData = invoiceData;

      // Generate PDF
      const pdfBuffer = generatePDFInvoice(invoiceData);
      const fileName = `invoice-${invoiceData.invoiceNumber}.pdf`;

      // Upload PDF to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('invoices')
        .upload(fileName, pdfBuffer, {
          contentType: 'application/pdf',
          upsert: true
        });

      if (uploadError) {
        console.error('Error uploading PDF:', uploadError);
      }

      // Create ledger entry using email-based approach
      const emailVendor = savedEmail.sender ? 
        savedEmail.sender.split('@')[1]?.split('.')[0]?.charAt(0).toUpperCase() + 
        savedEmail.sender.split('@')[1]?.split('.')[0]?.slice(1) : 'Unknown';
      
      const { error: ledgerError } = await supabase
        .from('ledger')
        .insert({
          invoice_number: invoiceData.invoiceNumber, // Use invoice number as primary key
          date: invoiceData.date,
          amount: invoiceData.total,
          description: savedEmail.subject, // Use email subject as description
          vendor: emailVendor, // Use vendor extracted from email domain
          category: getCategoryFromVendor(emailVendor),
          source: 'email',
          pdf_path: uploadData?.path || null
        });

      if (ledgerError) {
        console.error('Error creating ledger entry:', ledgerError);
      }
    }

    return NextResponse.json({
      success: true,
      email: {
        ...emailData,
        id: savedEmail.id,
        receivedAt: emailData.receivedAt
      }
    });
  } catch (error) {
    console.error('Error generating email:', error);
    return NextResponse.json(
      { error: 'Failed to generate email' },
      { status: 500 }
    );
  }
}

function getCategoryFromVendor(vendorName: string): string {
  if (vendorName.includes('Amazon') || vendorName.includes('Office')) return 'Office Supplies';
  if (vendorName.includes('Starbucks')) return 'Food & Beverage';
  if (vendorName.includes('Whole Foods')) return 'Groceries';
  if (vendorName.includes('Shell')) return 'Transportation';
  return 'General';
}
