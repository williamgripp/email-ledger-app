import { InvoiceProcessor } from '@/lib/invoiceProcessor';

class BackgroundInvoiceProcessor {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  start() {
    if (this.isRunning) {
      console.log('Background processor already running');
      return;
    }

    console.log('🚀 Starting background invoice processor...');
    this.isRunning = true;

    // Process immediately on startup
    this.processInvoices();

    // Then process every minute
    this.intervalId = setInterval(() => {
      this.processInvoices();
    }, 60000); // 60 seconds

    console.log('✅ Background processor started - will run every 60 seconds');
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('🛑 Background processor stopped');
  }

  private async processInvoices() {
    try {
      console.log('⏰ Background processing triggered...');
      const result = await InvoiceProcessor.processAllInvoices();
      
      if (result.processed > 0 || result.errors > 0) {
        console.log(`📊 Background processing result: ${result.processed} processed, ${result.errors} errors`);
      }
    } catch (error) {
      console.error('❌ Background processing error:', error);
    }
  }

  isActive(): boolean {
    return this.isRunning;
  }
}

// Create singleton instance
export const backgroundProcessor = new BackgroundInvoiceProcessor();

// Auto-start in production or when explicitly enabled
if (process.env.NODE_ENV === 'production' || process.env.ENABLE_BACKGROUND_PROCESSING === 'true') {
  backgroundProcessor.start();
}
