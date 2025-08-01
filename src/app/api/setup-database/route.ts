import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateRandomEmail } from '@/lib/emailGenerator';
import { generateRandomInvoiceData, generatePDFInvoice } from '@/lib/pdfGenerator';

// Helper function to extract vendor name from email domain
function extractVendor(email: string): string {
  try {
    const domain = email.split('@')[1];
    if (!domain) return 'Unknown';
    
    // Remove common TLDs and get the main domain
    const domainParts = domain.split('.');
    const mainDomain = domainParts[0];
    
    // Capitalize first letter
    return mainDomain.charAt(0).toUpperCase() + mainDomain.slice(1);
  } catch {
    return 'Unknown';
  }
}

export async function POST() {
  try {
    console.log('🔄 Setting up database with sample data...');
    
    // Test Supabase connection
    const { error: testError } = await supabase
      .from('emails')
      .select('count')
      .limit(1);
    
    if (testError) {
      return NextResponse.json({ 
        error: 'Database tables not found. Please run the SQL setup script in your Supabase dashboard first.',
        details: testError.message
      }, { status: 400 });
    }
    
    // Delete all existing data
    console.log('Cleaning up existing data...');
    
    // Clear ledger entries
    const { error: ledgerDeleteError } = await supabase
      .from('ledger')
      .delete()
      .neq('id', 'impossible-id'); // This deletes all records
    
    if (ledgerDeleteError) {
      console.error('Error clearing ledger:', ledgerDeleteError);
    }

    // Clear emails
    const { error: emailDeleteError } = await supabase
      .from('emails')
      .delete()
      .neq('id', 'impossible-id'); // This deletes all records
    
    if (emailDeleteError) {
      console.error('Error clearing emails:', emailDeleteError);
    }

    // Clear storage
    const { data: existingFiles } = await supabase.storage
      .from('invoices')
      .list();
    
    if (existingFiles && existingFiles.length > 0) {
      const filePaths = existingFiles.map(file => file.name);
      const { error: storageDeleteError } = await supabase.storage
        .from('invoices')
        .remove(filePaths);
      
      if (storageDeleteError) {
        console.error('Error clearing storage:', storageDeleteError);
      }
    }    const createdEmails = [];
    const createdInvoices = [];
    
    // First, get all existing invoices from the bucket
    const { data: existingInvoices, error: listError } = await supabase.storage
      .from('invoices')
      .list('');
    
    if (listError) {
      console.error('Error listing invoices:', listError);
      return NextResponse.json({ 
        error: 'Failed to list invoices from storage',
        details: listError.message
      }, { status: 500 });
    }
    
    if (!existingInvoices || existingInvoices.length === 0) {
      // If no invoices exist, create some first
      console.log('No invoices found in storage, creating new ones...');
      
      for (let i = 0; i < 7; i++) {
        // Generate invoice data
        const invoiceData = generateRandomInvoiceData();
        
        // Generate PDF and upload to storage
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
          continue;
        }
        
        createdInvoices.push({ fileName, invoiceData });
        console.log(`✅ Created invoice: ${fileName}`);
      }
    } else {
      // Use existing invoices
      console.log(`Found ${existingInvoices.length} existing invoices in storage`);
      createdInvoices.push(...existingInvoices.map(file => ({ fileName: file.name })));
    }
    
    // Now create emails for each invoice
    for (let i = 0; i < createdInvoices.length; i++) {
      const invoice = createdInvoices[i];
      
      // Extract invoice number from filename (remove .pdf extension and "invoice-" prefix)
      const invoiceNumber = invoice.fileName.replace('invoice-', '').replace('.pdf', '');
      
      // Get the public URL for the PDF
      const { data: urlData } = supabase.storage
        .from('invoices')
        .getPublicUrl(invoice.fileName);
      
      const emailData = generateRandomEmail();
      
      const { data: savedEmail, error: emailError } = await supabase
        .from('emails')
        .insert({
          subject: emailData.subject,
          sender: emailData.sender,
          received_at: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)).toISOString(),
          has_attachment: true,
          body: emailData.body,
          invoice_number: invoiceNumber, // Use the invoice number from filename
          pdf_url: urlData.publicUrl // Store the public URL for easy access
        })
        .select()
        .single();
      
      if (emailError) {
        console.error('Error creating email:', emailError);
        continue;
      }
      
      createdEmails.push(savedEmail);
      console.log(`📧 Created email ${savedEmail.id} for invoice ${invoiceNumber}`);
    }
    
    // Create 3 additional emails without attachments
    for (let i = 0; i < 3; i++) {
      const emailData = generateRandomEmail();
      
      const { data: savedEmail, error: emailError } = await supabase
        .from('emails')
        .insert({
          subject: emailData.subject,
          sender: emailData.sender,
          received_at: new Date(Date.now() - ((i + createdInvoices.length) * 24 * 60 * 60 * 1000)).toISOString(),
          has_attachment: false,
          body: emailData.body
          // No invoice_number or pdf_url for emails without attachments
        })
        .select()
        .single();
      
      if (emailError) {
        console.error('Error creating email:', emailError);
        continue;
      }
      
      createdEmails.push(savedEmail);
      console.log(`📧 Created email ${savedEmail.id} without attachment`);
    }
    
    console.log('🎉 Database setup complete!');
    
    return NextResponse.json({
      success: true,
      message: 'Database setup complete!',
      summary: {
        invoices_found: createdInvoices.length,
        emails_created: createdEmails.length,
        emails_with_attachments: createdEmails.filter(e => e.has_attachment).length,
        emails_without_attachments: createdEmails.filter(e => !e.has_attachment).length
      },
      invoices: createdInvoices.map(inv => ({ 
        fileName: inv.fileName
      })),
      emails: createdEmails
    });
    
  } catch (error) {
    console.error('Database setup error:', error);
    return NextResponse.json({
      error: 'Failed to setup database',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
