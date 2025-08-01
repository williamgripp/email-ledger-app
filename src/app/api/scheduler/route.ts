import { NextResponse } from 'next/server';

let isSchedulerRunning = false;
let generateDataInterval: NodeJS.Timeout | null = null;
let syncLedgerInterval: NodeJS.Timeout | null = null;

async function generateSingleEntry() {
  try {
    console.log('📝 Scheduler: Generating new invoice + email entry...');
    
    const response = await fetch('http://localhost:3000/api/generate-single-entry', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('❌ Scheduler: generate-single-entry failed with status:', response.status);
      return;
    }

    const result = await response.json();
    console.log('✅ Scheduler: Generated entry with invoice number:', result.invoiceNumber);
  } catch (error) {
    console.error('❌ Scheduler: Error generating entry:', error);
  }
}

async function syncLedger() {
  try {
    console.log('🔄 Scheduler: Syncing ledger...');
    
    const response = await fetch('http://localhost:3000/api/sync-ledger', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('❌ Scheduler: sync-ledger failed with status:', response.status);
      return;
    }

    const result = await response.json();
    console.log('✅ Scheduler: Synced ledger, processed:', result.processed);
  } catch (error) {
    console.error('❌ Scheduler: Error syncing ledger:', error);
  }
}

export async function POST() {
  try {
    if (isSchedulerRunning) {
      return NextResponse.json({
        message: 'Scheduler is already running',
        isRunning: true
      });
    }

    console.log('🚀 Starting background scheduler...');
    isSchedulerRunning = true;

    // Generate new data every 30 seconds
    generateDataInterval = setInterval(generateSingleEntry, 30000);
    
    // Sync ledger every 15 seconds
    syncLedgerInterval = setInterval(syncLedger, 15000);

    // Run initial generation and sync
    await generateSingleEntry();
    await syncLedger();

    return NextResponse.json({
      message: 'Background scheduler started successfully',
      isRunning: true,
      intervals: {
        generateData: '30 seconds',
        syncLedger: '15 seconds'
      }
    });

  } catch (error) {
    console.error('Error starting scheduler:', error);
    isSchedulerRunning = false;
    return NextResponse.json(
      { error: 'Failed to start scheduler' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    console.log('🛑 Stopping background scheduler...');
    
    if (generateDataInterval) {
      clearInterval(generateDataInterval);
      generateDataInterval = null;
    }
    
    if (syncLedgerInterval) {
      clearInterval(syncLedgerInterval);
      syncLedgerInterval = null;
    }
    
    isSchedulerRunning = false;

    return NextResponse.json({
      message: 'Background scheduler stopped successfully',
      isRunning: false
    });

  } catch (error) {
    console.error('Error stopping scheduler:', error);
    return NextResponse.json(
      { error: 'Failed to stop scheduler' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    isRunning: isSchedulerRunning,
    intervals: isSchedulerRunning ? {
      generateData: '30 seconds',
      syncLedger: '15 seconds'
    } : null
  });
}
