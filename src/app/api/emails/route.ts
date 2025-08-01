import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data: emails, error } = await supabase
      .from('emails')
      .select('*')
      .order('received_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch emails' },
        { status: 500 }
      );
    }

    // Transform emails to include invoice data if available
    const emailsWithInvoiceData = emails?.map(email => {
      return {
        ...email,
        receivedAt: email.received_at, // Match frontend interface
        hasAttachment: email.has_attachment,
        // Note: invoice data is now in ledger table keyed by PDF filename, not email_id
        invoiceData: undefined // We'll populate this differently if needed
      };
    }) || [];
    
    return NextResponse.json(emailsWithInvoiceData);
  } catch (error) {
    console.error('Error fetching emails:', error);
    return NextResponse.json(
      { error: 'Failed to fetch emails' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subject, sender, receivedAt, hasAttachment, body: emailBody } = body;

    const { data: email, error } = await supabase
      .from('emails')
      .insert({
        subject,
        sender,
        received_at: receivedAt,
        has_attachment: hasAttachment,
        processed: false,
        body: emailBody
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to create email' },
        { status: 500 }
      );
    }

    return NextResponse.json(email);
  } catch (error) {
    console.error('Error creating email:', error);
    return NextResponse.json(
      { error: 'Failed to create email' },
      { status: 500 }
    );
  }
}