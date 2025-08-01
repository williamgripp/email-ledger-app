'use client';

import { useState } from 'react';

export function DatabaseInitializer() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [progress, setProgress] = useState<string>('');

  const handleInitializeDatabase = async () => {
    setIsProcessing(true);
    setStatus('');
    setProgress('');

    try {
      // Step 1: Setup Database
      setProgress('Setting up database...');
      setStatus('🔧 Setting up test database structure');
      
      const setupResponse = await fetch('/api/setup-database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!setupResponse.ok) {
        const errorData = await setupResponse.json();
        throw new Error(`Database setup failed: ${errorData.error || setupResponse.statusText}`);
      }

      const setupResult = await setupResponse.json();
      console.log('Setup database result:', setupResult);
      setStatus('✅ Test database setup completed');

      // Step 2: Wait 5 seconds before sync
      setProgress('Waiting 5 seconds before generating data...');
      for (let i = 5; i >= 1; i--) {
        setStatus(`⏳ Starting test data generation in ${i} seconds...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Step 3: Sync Ledger
      setProgress('Generating test transaction data...');
      setStatus('📧 Processing sample emails and extracting test data');
      
      const syncResponse = await fetch('/api/sync-ledger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!syncResponse.ok) {
        const errorData = await syncResponse.json();
        throw new Error(`Ledger sync failed: ${errorData.error || syncResponse.statusText}`);
      }

      const syncResult = await syncResponse.json();
      console.log('Sync ledger result:', syncResult);
      
      if (syncResult.success) {
        setStatus(`🎉 Test data generation complete! Created ${syncResult.processed}/${syncResult.total} test transactions`);
        setProgress('');
      } else {
        setStatus(`⚠️ Test data generation completed with issues: ${syncResult.message}`);
        setProgress('');
      }

    } catch (error) {
      console.error('Test data generation error:', error);
      setStatus(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
      setProgress('');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Test Data Generator
        </h3>
        <p className="text-sm text-gray-600">
          Generate test data for development and testing. This will set up the database
          and populate it with sample transaction data from email processing.
        </p>
      </div>

      <div className="space-y-4">
        <button
          onClick={handleInitializeDatabase}
          disabled={isProcessing}
          className={`w-full px-4 py-3 rounded-lg font-medium transition-colors ${
            isProcessing
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
          }`}
        >
          {isProcessing ? (
            <span className="flex items-center justify-center space-x-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>Processing...</span>
            </span>
          ) : (
            'Generate Test Data'
          )}
        </button>

        {/* Progress and Status Display */}
        {(progress || status) && (
          <div className="space-y-2">
            {progress && (
              <div className="text-sm text-blue-600 font-medium">
                {progress}
              </div>
            )}
            {status && (
              <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md border">
                {status}
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="text-xs text-gray-500 mt-4 space-y-1">
          <div>• First: Sets up test database tables and views</div>
          <div>• Then: Generates sample transaction data</div>
          <div>• Finally: Populates ledger with test entries</div>
        </div>
      </div>
    </div>
  );
}
