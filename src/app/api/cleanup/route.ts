import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST() {
  try {
    console.log('🧹 Starting cleanup process...');
    
    // Test Supabase connection
    const { error: testError } = await supabase
      .from('emails')
      .select('count')
      .limit(1);
    
    if (testError) {
      return NextResponse.json({ 
        error: 'Database tables not found. Please check your Supabase configuration.',
        details: testError.message
      }, { status: 400 });
    }
    
    const deletedCounts = {
      ledgerEntries: 0,
      emails: 0,
      uploadedRecords: 0,
      storageFiles: 0
    };
    
    // 1. Clear ledger entries first (due to foreign key constraint)
    const { count: ledgerCount, error: ledgerDeleteError } = await supabase
      .from('ledger')
      .delete({ count: 'exact' })
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows
    
    if (ledgerDeleteError) {
      console.error('Error deleting ledger entries:', ledgerDeleteError);
    } else {
      deletedCounts.ledgerEntries = ledgerCount || 0;
      console.log(`✅ Cleared ${deletedCounts.ledgerEntries} ledger entries`);
    }
    
    // 2. Clear emails
    const { count: emailCount, error: emailDeleteError } = await supabase
      .from('emails')
      .delete({ count: 'exact' })
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows
    
    if (emailDeleteError) {
      console.error('Error deleting emails:', emailDeleteError);
    } else {
      deletedCounts.emails = emailCount || 0;
      console.log(`✅ Cleared ${deletedCounts.emails} emails`);
    }
    
    // 3. Clear uploaded files records
    const { count: uploadedCount, error: uploadedDeleteError } = await supabase
      .from('uploaded')
      .delete({ count: 'exact' })
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows
    
    if (uploadedDeleteError) {
      console.error('Error deleting uploaded records:', uploadedDeleteError);
    } else {
      deletedCounts.uploadedRecords = uploadedCount || 0;
      console.log(`✅ Cleared ${deletedCounts.uploadedRecords} uploaded file records`);
    }
    
    // 4. Clear PDFs from storage bucket
    try {
      // List all files in the invoices bucket
      const { data: files, error: listError } = await supabase.storage
        .from('invoices')
        .list();
      
      if (listError) {
        console.error('Error listing files in storage:', listError);
      } else if (files && files.length > 0) {
        // Delete all files
        const filePaths = files.map(file => file.name);
        const { error: deleteFilesError } = await supabase.storage
          .from('invoices')
          .remove(filePaths);
        
        if (deleteFilesError) {
          console.error('Error deleting files from storage:', deleteFilesError);
        } else {
          deletedCounts.storageFiles = filePaths.length;
          console.log(`✅ Deleted ${deletedCounts.storageFiles} files from invoices bucket`);
        }
      } else {
        console.log('✅ No files to delete from invoices bucket');
      }
    } catch (storageError) {
      console.error('Error clearing storage bucket:', storageError);
    }
    
    console.log('🎉 Cleanup complete!');
    
    return NextResponse.json({
      success: true,
      message: 'Cleanup completed successfully!',
      deletedCounts,
      summary: {
        total_items_deleted: deletedCounts.ledgerEntries + deletedCounts.emails + deletedCounts.uploadedRecords + deletedCounts.storageFiles
      }
    });
    
  } catch (error) {
    console.error('Cleanup error:', error);
    return NextResponse.json({
      error: 'Failed to cleanup database and storage',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
