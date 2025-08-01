import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Helper function to extract vendor name from email domain
function extractVendorFromEmail(email: string): string {
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
    console.log('🔄 Auto-processing unprocessed emails...');
    
    // First, clean up existing ledger entries to start fresh
    console.log('🧹 Clearing existing ledger entries...');
    const { data: existingEntries, error: selectError } = await supabase
      .from('ledger')
      .select('invoice_number');
    
    if (selectError) {
      console.error('Error fetching existing ledger entries:', selectError);
    } else if (existingEntries && existingEntries.length > 0) {
      const invoiceNumbers = existingEntries.map(entry => entry.invoice_number);
      const { error: cleanupError } = await supabase
        .from('ledger')
        .delete()
        .in('invoice_number', invoiceNumbers);
      
      if (cleanupError) {
        console.error('Error cleaning up ledger:', cleanupError);
      } else {
        console.log(`✅ Cleared ${existingEntries.length} existing ledger entries`);
      }
    } else {
      console.log('✅ No existing ledger entries to clear');
    }

    // Get all emails with attachments (remove processed filter since that column may not exist)
    const { data: unprocessedEmails, error: emailsError } = await supabase
      .from('emails')
      .select('*')
      .eq('has_attachment', true);

    if (emailsError) {
      console.error('Error fetching unprocessed emails:', emailsError);
      return NextResponse.json(
        { error: 'Failed to fetch unprocessed emails' },
        { status: 500 }
      );
    }

    if (!unprocessedEmails || unprocessedEmails.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No unprocessed emails found',
        processed: 0
      });
    }

    console.log(`Found ${unprocessedEmails.length} unprocessed emails with attachments`);

    let processedCount = 0;
    const results = [];

    for (const email of unprocessedEmails) {
      try {
        if (!email.pdf_url && !email.invoice_number) {
          console.log(`Skipping email ${email.id} - no PDF URL or invoice number`);
          continue;
        }

        // Extract PDF path from pdf_url or construct from invoice_number
        let pdfPath = null;
        if (email.pdf_url) {
          // Extract path from full URL (e.g., "https://...supabase.co/storage/v1/object/public/invoices/invoice-INV-123.pdf" -> "invoice-INV-123.pdf")
          pdfPath = email.pdf_url.split('/').pop();
        } else if (email.invoice_number) {
          // Construct path from invoice number
          pdfPath = `invoice-${email.invoice_number}.pdf`;
        }

        if (!pdfPath) {
          console.log(`Skipping email ${email.id} - could not determine PDF path`);
          continue;
        }

        // Download PDF from Supabase storage
        const { data: pdfData, error: downloadError } = await supabase.storage
          .from('invoices')
          .download(pdfPath);

        if (downloadError || !pdfData) {
          console.error(`Error downloading PDF for email ${email.id}:`, downloadError);
          continue;
        }

        // Convert to Buffer for parsing
        const pdfBuffer = Buffer.from(await pdfData.arrayBuffer());

        // Call Python PDF parser
        console.log(`📄 Calling Python parser for email ${email.id} (${pdfPath})`);
        
        const parseResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'}/api/parse-pdf-python`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/octet-stream',
          },
          body: pdfBuffer,
        });

        if (!parseResponse.ok) {
          console.error(`PDF parsing failed for email ${email.id}: ${parseResponse.status}`);
          continue;
        }

        const parsedData = await parseResponse.json();
        console.log(`✅ Parsed PDF for email ${email.id}:`, parsedData);

        // Look up the corresponding email using the invoice number from the PDF filename
        let emailVendor = 'Unknown';
        let emailDescription = parsedData.description;
        
        // Extract invoice number from PDF path (e.g., "invoice-INV-123.pdf" -> "INV-123")
        const invoiceNumber = pdfPath.replace('invoice-', '').replace('.pdf', '');
        
        if (invoiceNumber) {
          // Find the email with this invoice number
          const { data: correspondingEmails, error: emailLookupError } = await supabase
            .from('emails')
            .select('sender, subject')
            .eq('invoice_number', invoiceNumber)
            .limit(1);
          
          if (!emailLookupError && correspondingEmails && correspondingEmails.length > 0) {
            const correspondingEmail = correspondingEmails[0];
            // Extract vendor from email domain
            emailVendor = extractVendorFromEmail(correspondingEmail.sender);
            // Use email subject as description
            emailDescription = correspondingEmail.subject;
            
            console.log(`📧 Found email for invoice ${invoiceNumber}: vendor=${emailVendor}, description=${emailDescription}`);
          } else {
            console.log(`⚠️ No email found for invoice ${invoiceNumber}, using fallback data`);
            // Fallback to extracting vendor from current email
            emailVendor = extractVendorFromEmail(email.sender);
          }
        }

        // Create ledger entry from parsed data using email-derived info
        const { error: ledgerError } = await supabase
          .from('ledger')
          .insert({
            invoice_number: invoiceNumber, // Use invoice number as primary key
            date: parsedData.date || new Date().toISOString().split('T')[0], // Ensure date is in YYYY-MM-DD format
            amount: parsedData.amount || 0,
            description: emailDescription, // Use email subject as description
            vendor: emailVendor, // Use vendor extracted from email domain
            category: 'Business Expense',
            source: 'email',
            pdf_path: pdfPath
          });

        if (ledgerError) {
          console.error(`Error creating ledger entry for email ${email.id}:`, ledgerError);
          continue;
        }

        // Update email with parsed data (remove processed field since it may not exist)
        const { error: updateError } = await supabase
          .from('emails')
          .update({ 
            invoice_data: {
              invoiceNumber: parsedData.invoiceNumber,
              total: parsedData.amount,
              date: parsedData.date,
              vendor: emailVendor,
              items: parsedData.items
            }
          })
          .eq('id', email.id);

        if (updateError) {
          console.error(`Error updating email ${email.id}:`, updateError);
          continue;
        }

        processedCount++;
        results.push({
          emailId: email.id,
          amount: parsedData.amount,
          vendor: emailVendor,
          description: emailDescription
        });

        console.log(`✅ Processed email ${email.id}: ${emailVendor} - $${parsedData.amount}`);

      } catch (error) {
        console.error(`Error processing email ${email.id}:`, error);
        continue;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Auto-processed ${processedCount} emails`,
      processed: processedCount,
      total: unprocessedEmails.length,
      results
    });

  } catch (error) {
    console.error('Error in auto-process:', error);
    return NextResponse.json(
      { error: 'Failed to auto-process emails' },
      { status: 500 }
    );
  }
}
