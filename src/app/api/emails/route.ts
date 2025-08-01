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

function reconstructInvoiceData(email: any, ledgerEntry: any) {
  const vendorName = getVendorFromSender(email.sender);
  const invoiceNumber = email.subject.match(/[#]\w+/)?.[0]?.substring(1) || 
    `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  
  return {
    invoiceNumber,
    date: ledgerEntry.date,
    vendor: getVendorInfo(vendorName),
    customer: {
      name: 'John Doe',
      address: '123 Main St, Anytown, CA 90210'
    },
    items: [
      {
        description: ledgerEntry.description,
        quantity: 1,
        unitPrice: ledgerEntry.amount,
        total: ledgerEntry.amount
      }
    ],
    subtotal: ledgerEntry.amount * 0.92,
    tax: ledgerEntry.amount * 0.08,
    total: ledgerEntry.amount
  };
}

function getVendorFromSender(sender: string): string {
  if (sender.includes('amazon')) return 'Amazon.com, Inc.';
  if (sender.includes('starbucks')) return 'Starbucks Corporation';
  if (sender.includes('wholefoods')) return 'Whole Foods Market';
  if (sender.includes('office')) return 'Office Depot, Inc.';
  if (sender.includes('shell')) return 'Shell Gas Station';
  return 'Generic Vendor';
}

function getVendorInfo(vendorName: string) {
  const vendors: { [key: string]: { name: string; address: string; phone: string; email: string } } = {
    'Amazon.com, Inc.': {
      name: 'Amazon.com, Inc.',
      address: '410 Terry Ave N, Seattle, WA 98109',
      phone: '(206) 266-1000',
      email: 'orders@amazon.com'
    },
    'Starbucks Corporation': {
      name: 'Starbucks Corporation',
      address: '2401 Utah Ave S, Seattle, WA 98134',
      phone: '(800) 782-7282',
      email: 'info@starbucks.com'
    },
    'Whole Foods Market': {
      name: 'Whole Foods Market',
      address: '550 Bowie St, Austin, TX 78703',
      phone: '(512) 477-4455',
      email: 'customercare@wholefoods.com'
    },
    'Office Depot, Inc.': {
      name: 'Office Depot, Inc.',
      address: '6600 N Military Trl, Boca Raton, FL 33496',
      phone: '(561) 438-4800',
      email: 'orders@officedepot.com'
    },
    'Shell Gas Station': {
      name: 'Shell Gas Station',
      address: '150 N Dairy Ashford Rd, Houston, TX 77079',
      phone: '(713) 241-6161',
      email: 'receipts@shell.com'
    }
  };
  
  return vendors[vendorName] || vendors['Amazon.com, Inc.'];
}