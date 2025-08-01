import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateRandomEmail } from '@/lib/emailGenerator';
import { generateRandomInvoiceData, generatePDFInvoice } from '@/lib/pdfGenerator';

export async function POST() {
  try {
    console.log('📝 Generating single invoice + email entry...');

    // 1. Generate invoice data
    const invoiceData = generateRandomInvoiceData();
    console.log(`Generated invoice data: ${invoiceData.invoiceNumber}`);
    
    // 2. Generate PDF and upload to storage
    const pdfBuffer = generatePDFInvoice(invoiceData);
    const fileName = `invoice-${invoiceData.invoiceNumber}.pdf`;
    
    const { error: uploadError } = await supabase.storage
      .from('invoices')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true
      });
    
    if (uploadError) {
      console.error('Error uploading PDF:', uploadError);
      return NextResponse.json({
        error: 'Failed to upload PDF invoice',
        details: uploadError.message
      }, { status: 500 });
    }
    
    console.log(`✅ Uploaded PDF: ${fileName}`);
    
    // 3. Get the public URL for the PDF
    const { data: urlData } = supabase.storage
      .from('invoices')
      .getPublicUrl(fileName);
    
    // 4. Generate email data
    const emailData = generateRandomEmail();
    
    // 5. Create email entry with attachment linking to the invoice
    const { data: savedEmail, error: emailError } = await supabase
      .from('emails')
      .insert({
        subject: emailData.subject,
        sender: emailData.sender,
        received_at: new Date().toISOString(),
        has_attachment: true,
        body: emailData.body,
        invoice_number: invoiceData.invoiceNumber,
        pdf_url: urlData.publicUrl
      })
      .select()
      .single();
    
    if (emailError) {
      console.error('Error creating email:', emailError);
      
      // Clean up the uploaded PDF if email creation failed
      await supabase.storage
        .from('invoices')
        .remove([fileName]);
      
      return NextResponse.json({
        error: 'Failed to create email entry',
        details: emailError.message
      }, { status: 500 });
    }
    
    console.log(`📧 Created email ${savedEmail.id} for invoice ${invoiceData.invoiceNumber}`);
    
    return NextResponse.json({
      success: true,
      message: 'Successfully generated invoice and email entry',
      data: {
        invoice: {
          number: invoiceData.invoiceNumber,
          fileName: fileName,
          amount: invoiceData.total,
          url: urlData.publicUrl
        },
        email: {
          id: savedEmail.id,
          subject: savedEmail.subject,
          sender: savedEmail.sender,
          received_at: savedEmail.received_at
        }
      }
    });
    
  } catch (error) {
    console.error('Generate single entry error:', error);
    return NextResponse.json({
      error: 'Failed to generate entry',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
