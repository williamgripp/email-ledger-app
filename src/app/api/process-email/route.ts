import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { emailId } = await request.json();

    if (!emailId) {
      return NextResponse.json(
        { error: 'Email ID is required' },
        { status: 400 }
      );
    }

    // Get the email with its attachment data
    const { data: email, error: emailError } = await supabase
      .from('emails')
      .select('*')
      .eq('id', emailId)
      .single();

    if (emailError) {
      console.error('Error fetching email:', emailError);
      return NextResponse.json(
        { error: 'Failed to fetch email' },
        { status: 500 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: 'Email not found' },
        { status: 404 }
      );
    }

    if (!email.has_attachment) {
      return NextResponse.json(
        { error: 'Email has no attachment to process' },
        { status: 400 }
      );
    }

    if (email.processed) {
      return NextResponse.json(
        { error: 'Email already processed' },
        { status: 400 }
      );
    }

    // In a real implementation, you would:
    // 1. Download the PDF from Supabase storage
    // 2. Use a PDF parsing library to extract text/data
    // 3. Parse the invoice details (amount, date, description, etc.)
    // 
    // For now, we'll simulate this by using the invoice_data if it exists
    const invoiceData = email.invoice_data;
    
    if (!invoiceData) {
      return NextResponse.json(
        { error: 'No invoice data available to process' },
        { status: 400 }
      );
    }

    // Create a ledger entry from the processed invoice data
    const { error: ledgerError } = await supabase
      .from('ledger')
      .insert({
        email_id: emailId,
        amount: invoiceData.total,
        description: `Invoice ${invoiceData.invoiceNumber} - ${invoiceData.items[0]?.description || 'Invoice payment'}`,
        date: invoiceData.date,
        pdf_path: email.pdf_path
      });

    if (ledgerError) {
      console.error('Error creating ledger entry:', ledgerError);
      return NextResponse.json(
        { error: 'Failed to create ledger entry' },
        { status: 500 }
      );
    }

    // Mark the email as processed
    const { error: updateError } = await supabase
      .from('emails')
      .update({ processed: true })
      .eq('id', emailId);

    if (updateError) {
      console.error('Error updating email status:', updateError);
      return NextResponse.json(
        { error: 'Failed to update email status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Email processed successfully',
      ledgerEntry: {
        amount: invoiceData.total,
        description: `Invoice ${invoiceData.invoiceNumber}`,
        date: invoiceData.date
      }
    });

  } catch (error) {
    console.error('Error processing email:', error);
    return NextResponse.json(
      { error: 'Failed to process email' },
      { status: 500 }
    );
  }
}
