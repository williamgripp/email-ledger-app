import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Query the transaction_ledger view which handles all the matching logic in SQL
    const { data: entries, error } = await supabase
      .from('transaction_ledger')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch transaction ledger entries' },
        { status: 500 }
      );
    }

    return NextResponse.json(entries || []);
  } catch (error) {
    console.error('Error fetching transaction ledger entries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transaction ledger entries' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { invoice_number, date, amount, description, category, source, vendor, pdf_path } = body;

    const { data: entry, error } = await supabase
      .from('ledger')
      .insert({
        invoice_number,
        date,
        amount: parseFloat(amount),
        description,
        category,
        source,
        vendor,
        pdf_path
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to create ledger entry' },
        { status: 500 }
      );
    }

    return NextResponse.json(entry);
  } catch (error) {
    console.error('Error creating ledger entry:', error);
    return NextResponse.json(
      { error: 'Failed to create ledger entry' },
      { status: 500 }
    );
  }
}
