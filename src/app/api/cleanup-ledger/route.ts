import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST() {
  try {
    console.log('🧹 Clearing ledger entries...');
    
    // First, get all ledger entries using invoice_number as the primary key
    const { data: entries, error: selectError } = await supabase
      .from('ledger')
      .select('invoice_number');
    
    if (selectError) {
      console.error('Error fetching ledger entries:', selectError);
      return NextResponse.json({
        error: 'Failed to fetch ledger entries',
        details: selectError.message
      }, { status: 500 });
    }
    
    const entriesCount = entries?.length || 0;
    
    if (entriesCount === 0) {
      return NextResponse.json({
        success: true,
        message: 'No ledger entries to delete'
      });
    }
    
    // Delete all entries by invoice_number
    const invoiceNumbers = entries!.map(entry => entry.invoice_number);
    const { error: ledgerDeleteError } = await supabase
      .from('ledger')
      .delete()
      .in('invoice_number', invoiceNumbers);
    
    if (ledgerDeleteError) {
      console.error('Error deleting ledger entries:', ledgerDeleteError);
      return NextResponse.json({
        error: 'Failed to clear ledger entries',
        details: ledgerDeleteError.message
      }, { status: 500 });
    }
    
    console.log(`✅ Cleared ${entriesCount} ledger entries`);
    
    return NextResponse.json({
      success: true,
      message: `Successfully cleared ${entriesCount} ledger entries (files left intact)`,
      deletedCount: entriesCount
    });
    
  } catch (error) {
    console.error('Ledger cleanup error:', error);
    return NextResponse.json({
      error: 'Failed to cleanup ledger',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
