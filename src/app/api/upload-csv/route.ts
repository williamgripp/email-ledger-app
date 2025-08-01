import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import Papa from 'papaparse';

interface CSVRow {
  'Invoice Number': string;
  'Date': string;
  'Amount': string;
}

interface ProcessedCSVRow {
  invoice_number: string;
  date: string;
  amount: number;
  source: string;
}

interface MatchResult {
  matched: Array<{
    invoice_number: string;
    date: string;
    amount: number;
    source: string; // 'email, bank statement' | 'email' | 'bank statement'
    description?: string;
    vendor?: string;
  }>;
  unmatched: ProcessedCSVRow[];
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({
        success: false,
        error: 'No file provided'
      }, { status: 400 });
    }

    if (!file.name.endsWith('.csv')) {
      return NextResponse.json({
        success: false,
        error: 'Please upload a CSV file'
      }, { status: 400 });
    }

    // Parse CSV file
    const fileText = await file.text();
    
    const parseResult = await new Promise<Papa.ParseResult<CSVRow>>((resolve, reject) => {
      Papa.parse(fileText, {
        header: true,
        skipEmptyLines: true,
        complete: resolve,
        error: reject
      });
    });

    if (parseResult.errors.length > 0) {
      return NextResponse.json({
        success: false,
        error: `CSV parsing error: ${parseResult.errors[0].message}`
      }, { status: 400 });
    }

    const csvData = parseResult.data;

    if (csvData.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'CSV file is empty'
      }, { status: 400 });
    }

    // Validate required columns
    const firstRow = csvData[0];
    const requiredColumns = ['Invoice Number', 'Date', 'Amount'];
    const missingColumns = requiredColumns.filter(col => !(col in firstRow));

    if (missingColumns.length > 0) {
      return NextResponse.json({
        success: false,
        error: `Please ensure your CSV has these columns: Invoice Number, Date, Amount. Missing: ${missingColumns.join(', ')}`
      }, { status: 400 });
    }

    // Process CSV data - convert all to strings first, then validate and convert types
    const processedData: ProcessedCSVRow[] = csvData.map((row, index) => {
      try {
        // Convert all fields to strings first
        const invoiceNumber = String(row['Invoice Number'] || '').trim();
        const dateStr = String(row['Date'] || '').trim();
        const amountStr = String(row['Amount'] || '').trim();

        // Validate required fields
        if (!invoiceNumber) {
          throw new Error(`Invoice Number is required`);
        }
        if (!dateStr) {
          throw new Error(`Date is required`);
        }
        if (!amountStr) {
          throw new Error(`Amount is required`);
        }

        // Validate and parse date
        let parsedDate: Date;
        try {
          // Try parsing common date formats
          if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            // YYYY-MM-DD format
            parsedDate = new Date(dateStr);
          } else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
            // M/D/YYYY or MM/DD/YYYY format
            parsedDate = new Date(dateStr);
          } else if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(dateStr)) {
            // M-D-YYYY or MM-DD-YYYY format
            parsedDate = new Date(dateStr);
          } else {
            // Try generic parsing
            parsedDate = new Date(dateStr);
          }

          // Check if date is valid
          if (isNaN(parsedDate.getTime())) {
            throw new Error(`Invalid date format. Expected formats: YYYY-MM-DD, MM/DD/YYYY, or MM-DD-YYYY`);
          }

          // Check if date is reasonable (not too far in past or future)
          const currentYear = new Date().getFullYear();
          const dateYear = parsedDate.getFullYear();
          if (dateYear < 1900 || dateYear > currentYear + 5) {
            throw new Error(`Date year must be between 1900 and ${currentYear + 5}`);
          }
        } catch (dateError) {
          throw new Error(`Invalid date "${dateStr}": ${dateError instanceof Error ? dateError.message : 'Unknown date error'}`);
        }

        // Validate and parse amount
        let amount: number;
        try {
          // Remove common currency symbols and formatting
          const cleanAmountStr = amountStr.replace(/[$,\s]/g, '');
          
          // Check for valid number format
          if (!/^-?\d*\.?\d+$/.test(cleanAmountStr)) {
            throw new Error(`Invalid amount format. Expected a number, got "${amountStr}"`);
          }

          amount = parseFloat(cleanAmountStr);

          if (isNaN(amount)) {
            throw new Error(`Amount must be a valid number, got "${amountStr}"`);
          }

          // Check for reasonable amount range
          if (amount < -1000000 || amount > 1000000) {
            throw new Error(`Amount must be between -$1,000,000 and $1,000,000`);
          }

          // Ensure amount has reasonable precision (max 2 decimal places)
          if (Math.round(amount * 100) !== amount * 100) {
            amount = Math.round(amount * 100) / 100;
          }
        } catch (amountError) {
          throw new Error(`Invalid amount "${amountStr}": ${amountError instanceof Error ? amountError.message : 'Unknown amount error'}`);
        }

        // Format date to YYYY-MM-DD for database storage
        const formattedDate = parsedDate.toISOString().split('T')[0];

        return {
          invoice_number: invoiceNumber,
          date: formattedDate,
          amount: amount,
          source: 'bank statement'
        };
      } catch (error) {
        throw new Error(`Row ${index + 1}: ${error instanceof Error ? error.message : 'Invalid data'}`);
      }
    });

    // Get current ledger entries
    const { data: ledgerEntries, error: ledgerError } = await supabase
      .from('ledger')
      .select('*');

    if (ledgerError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch ledger entries'
      }, { status: 500 });
    }

    // Match with ledger based on invoice number and amount (rounded to nearest dollar)
    const matchResult: MatchResult = {
      matched: [],
      unmatched: []
    };

    const ledgerMap = new Map();
    (ledgerEntries || []).forEach(entry => {
      const roundedAmount = Math.round(entry.amount);
      const key = `${entry.invoice_number}-${roundedAmount}`;
      ledgerMap.set(key, entry);
    });

    processedData.forEach(csvRow => {
      const roundedAmount = Math.round(csvRow.amount);
      const key = `${csvRow.invoice_number}-${roundedAmount}`;
      const ledgerMatch = ledgerMap.get(key);

      if (ledgerMatch) {
        // Found a match
        matchResult.matched.push({
          invoice_number: csvRow.invoice_number,
          date: csvRow.date,
          amount: csvRow.amount,
          source: 'email, bank statement',
          description: ledgerMatch.description,
          vendor: ledgerMatch.vendor
        });
      } else {
        // No match found
        matchResult.unmatched.push(csvRow);
      }
    });

    // Insert unmatched entries into both uploaded table and ledger
    if (matchResult.unmatched.length > 0) {
      // Insert into uploaded table (bank statement data)
      const uploadedInserts = matchResult.unmatched.map(row => ({
        invoice_number: row.invoice_number,
        date: row.date,
        amount: row.amount
      }));

      const { error: uploadedInsertError } = await supabase
        .from('uploaded')
        .upsert(uploadedInserts, { 
          onConflict: 'invoice_number',
          ignoreDuplicates: false 
        });

      if (uploadedInsertError) {
        console.error('Error inserting into uploaded table:', uploadedInsertError);
        return NextResponse.json({
          success: false,
          error: 'Failed to insert bank statement entries into uploaded table'
        }, { status: 500 });
      }

      // Insert into ledger table with source 'bank statement'
      const ledgerInserts = matchResult.unmatched.map(row => ({
        invoice_number: row.invoice_number,
        date: row.date,
        amount: row.amount,
        description: `Bank statement entry - ${row.invoice_number}`,
        category: 'Bank Statement',
        source: 'bank statement',
        vendor: 'Unknown'
      }));

      const { error: insertError } = await supabase
        .from('ledger')
        .insert(ledgerInserts);

      if (insertError) {
        console.error('Error inserting unmatched entries into ledger:', insertError);
        return NextResponse.json({
          success: false,
          error: 'Failed to insert unmatched entries into ledger'
        }, { status: 500 });
      }
    }

    // Insert matched entries into uploaded table and update ledger source
    if (matchResult.matched.length > 0) {
      // Insert matched entries into uploaded table
      const matchedUploads = matchResult.matched.map(match => ({
        invoice_number: match.invoice_number,
        date: match.date,
        amount: match.amount
      }));

      const { error: matchedUploadError } = await supabase
        .from('uploaded')
        .upsert(matchedUploads, { 
          onConflict: 'invoice_number',
          ignoreDuplicates: false 
        });

      if (matchedUploadError) {
        console.error('Error inserting matched entries into uploaded table:', matchedUploadError);
      }

      // Update source for existing ledger entries that matched
      for (const match of matchResult.matched) {
        const { error: updateError } = await supabase
          .from('ledger')
          .update({ source: 'email, bank statement' })
          .eq('invoice_number', match.invoice_number);

        if (updateError) {
          console.error('Error updating ledger source:', updateError);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `CSV processed successfully. ${matchResult.matched.length} matched, ${matchResult.unmatched.length} new entries added.`,
      results: {
        matched: matchResult.matched.length,
        unmatched: matchResult.unmatched.length,
        details: matchResult
      }
    });

  } catch (error) {
    console.error('CSV upload error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process CSV'
    }, { status: 500 });
  }
}
