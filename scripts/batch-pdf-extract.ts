#!/usr/bin/env tsx

/**
 * Test script for batch processing PDF URLs from emails
 * 
 * Usage: npx tsx scripts/batch-pdf-extract.ts [--limit 10] [--unprocessed]
 * 
 * This script fetches PDF URLs from the emails table and processes them in parallel.
 * Options:
 *   --limit N: Process only N emails (default: all)
 *   --unprocessed: Only process emails that don't have ledger entries
 */

import { batchProcessPdfUrls } from '../src/lib/batchPdfProcessor';
import { supabase } from '../src/lib/supabase';

async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const limitArg = args.findIndex(arg => arg === '--limit');
  const limit = limitArg >= 0 && args[limitArg + 1] ? parseInt(args[limitArg + 1]) : undefined;
  const unprocessedOnly = args.includes('--unprocessed');
  
  console.log('📧 Fetching emails with PDF attachments...');
  
  try {
    // First get all invoice numbers currently in ledger (if checking for unprocessed only)
    let existingLedgerInvoices = new Set();
    
    if (unprocessedOnly) {
      console.log('🔍 Identifying emails not yet in ledger...');
      const { data: ledgerInvoices, error: ledgerSelectError } = await supabase
        .from('ledger')
        .select('invoice_number');
  
      if (ledgerSelectError) {
        console.error('Error fetching ledger invoice numbers:', ledgerSelectError);
        process.exit(1);
      }
  
      existingLedgerInvoices = new Set(
        (ledgerInvoices || []).map(item => item.invoice_number)
      );
    }
    
    // Get emails with attachments and PDF URLs
    let query = supabase
      .from('emails')
      .select('*')
      .eq('has_attachment', true)
      .not('pdf_url', 'is', null)
      .order('received_at', { ascending: false });
      
    if (limit) {
      query = query.limit(limit);
    }
    
    const { data: emails, error: emailsError } = await query;
  
    if (emailsError) {
      console.error('Error fetching emails:', emailsError);
      process.exit(1);
    }
    
    // Filter to only emails whose invoice numbers are NOT in ledger (if requested)
    const emailsToProcess = unprocessedOnly
      ? (emails || []).filter(email => 
          !existingLedgerInvoices.has(email.invoice_number)
        )
      : (emails || []);
    
    // Extract PDF URLs from emails
    const urls = emailsToProcess.map(email => email.pdf_url).filter(Boolean);
    
    console.log(`🔄 Starting batch processing of ${urls.length} PDFs from emails...`);
    
    // Process all PDFs in parallel
    const results = await batchProcessPdfUrls(urls);
    
    // Map results back to emails for better reporting
    const processedResults = results.map((result, index) => ({
      id: emailsToProcess[index].id,
      invoiceNumber: emailsToProcess[index].invoice_number,
      sender: emailsToProcess[index].sender,
      subject: emailsToProcess[index].subject,
      pdfUrl: urls[index],
      amount: result.amount,
      success: result.success,
      error: result.error || 'None'
    }));
    
    // Display results in a formatted table
    console.log('\n=== Batch PDF Processing Results ===\n');
    
    // Summary stats
    const successful = processedResults.filter(r => r.success).length;
    const amountsFound = processedResults.filter(r => r.amount > 0).length;
    
    console.log(`Total emails processed: ${processedResults.length}`);
    console.log(`Successful extractions: ${successful} (${Math.round(successful/processedResults.length*100)}%)`);
    console.log(`Amounts found: ${amountsFound} (${Math.round(amountsFound/processedResults.length*100)}%)`);
    
    console.log('\n--- Detailed Results ---\n');
    console.table(processedResults.map(result => ({
      Invoice: result.invoiceNumber,
      Subject: result.subject.substring(0, 30) + (result.subject.length > 30 ? '...' : ''),
      Sender: result.sender.split('@')[1].split('.')[0],
      Success: result.success,
      Amount: result.amount > 0 ? `$${result.amount.toFixed(2)}` : 'Not found',
      Error: result.error
    })));
    
    console.log('\n✅ Batch processing complete!');
    
    // If successful and --unprocessed was used, ask if user wants to sync ledger
    if (unprocessedOnly && amountsFound > 0) {
      console.log('\n🔄 To add these emails to your ledger, run:');
      console.log('curl -X POST http://localhost:3000/api/sync-ledger');
    }
  } catch (error) {
    console.error('❌ Batch processing error:', error);
  }
}

// Run the main function
main().catch(console.error);
