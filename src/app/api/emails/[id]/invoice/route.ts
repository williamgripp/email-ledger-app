import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateRandomInvoiceData } from '@/lib/pdfGenerator';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Get email first
    const email = await prisma.email.findUnique({
      where: { id }
    });

    if (!email) {
      return NextResponse.json(
        { error: 'Email not found' },
        { status: 404 }
      );
    }

    if (!email.hasAttachment) {
      return NextResponse.json({ invoiceData: null });
    }

    // Check if ledger entry already exists for this email
    const existingLedgerEntry = await prisma.ledgerEntry.findFirst({
      where: { emailId: id }
    });

    if (existingLedgerEntry) {
      // Reconstruct invoice data from existing ledger entry
      const invoiceData = reconstructInvoiceData(email, existingLedgerEntry);
      return NextResponse.json({ invoiceData });
    }

    // Generate new invoice data and create ledger entry
    const invoiceData = generateRandomInvoiceData();
    
    await prisma.ledgerEntry.create({
      data: {
        date: new Date(invoiceData.date),
        amount: invoiceData.total,
        description: `${invoiceData.vendor.name} - Invoice ${invoiceData.invoiceNumber}`,
        category: getCategoryFromVendor(invoiceData.vendor.name),
        source: 'email',
        emailId: email.id,
        pdfPath: `/pdfs/invoice-${invoiceData.invoiceNumber}.pdf`
      }
    });

    return NextResponse.json({ invoiceData });
  } catch (error) {
    console.error('Error getting email invoice:', error);
    return NextResponse.json(
      { error: 'Failed to get email invoice' },
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

function reconstructInvoiceData(email: any, ledgerEntry: any) {
  const vendorName = getVendorFromSender(email.sender);
  const invoiceNumber = email.subject.match(/[#]\w+/)?.[0]?.substring(1) || 
    `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  
  return {
    invoiceNumber,
    date: ledgerEntry.date.toISOString().split('T')[0],
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
    subtotal: Math.round(ledgerEntry.amount * 0.92 * 100) / 100,
    tax: Math.round(ledgerEntry.amount * 0.08 * 100) / 100,
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
  interface VendorInfo {
    name: string;
    address: string;
    phone: string;
    email: string;
  }
  
  const vendors: Record<string, VendorInfo> = {
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
