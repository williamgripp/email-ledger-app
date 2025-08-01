import { NextResponse } from 'next/server';
import { InvoiceProcessor } from '@/lib/invoiceProcessor';

export async function POST() {
  try {
    console.log('🔄 Manual invoice processing triggered...');
    
    const result = await InvoiceProcessor.processAllInvoices();
    
    return NextResponse.json({
      success: true,
      message: `Processing complete: ${result.processed} processed, ${result.errors} errors`,
      result
    });

  } catch (error) {
    console.error('Manual processing failed:', error);
    return NextResponse.json(
      { 
        error: 'Processing failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Allow GET requests for easy testing
  return POST();
}
