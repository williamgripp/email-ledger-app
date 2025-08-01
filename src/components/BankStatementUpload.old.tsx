'use client';

import { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, X } from 'lucide-react';

interface CSVRow {
  'Invoice Number': string;
  'Date': string;
  'Amount': string;
}

interface MatchedEntry {
  invoice_number: string;
  date: string;
  amount: number;
  source: string;
  description?: string;
  vendor?: string;
}

interface UnmatchedEntry {
  invoice_number: string;
  date: string;
  amount: number;
  source: string;
}

interface ProcessResult {
  matched: number;
  unmatched: number;
  details: {
    matched: MatchedEntry[];
    unmatched: UnmatchedEntry[];
  };
}

export function BankStatementUpload() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mock ledger data for comparison
  const ledgerData: LedgerEntry[] = [
    { date: '2024-01-15', description: 'Amazon Purchase - Office Supplies', amount: 89.99 },
    { date: '2024-01-14', description: 'Starbucks Coffee', amount: 12.45 },
    { date: '2024-01-13', description: 'Whole Foods Grocery Shopping', amount: 156.78 },
    { date: '2024-01-12', description: 'Office Depot - Printer Paper', amount: 67.23 },
    { date: '2024-01-11', description: 'Shell Gas Station', amount: 45.00 }
  ];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setError('Please select a CSV file');
      return;
    }

    setUploadedFile(file);
    setError(null);
    processCSV(file);
  };

  const processCSV = (file: File) => {
    setIsProcessing(true);
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const transactions = results.data as BankTransaction[];
          
          // Validate required columns
          if (transactions.length === 0) {
            throw new Error('CSV file is empty');
          }

          const firstRow = transactions[0];
          if (!firstRow.date || !firstRow.transaction) {
            throw new Error('CSV must have "date" and "transaction" columns');
          }

          // Process amounts if they exist, otherwise set to 0
          const processedTransactions = transactions.map(t => ({
            ...t,
            amount: t.amount ? parseFloat(t.amount.toString()) : 0
          }));

          compareWithLedger(processedTransactions);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to process CSV');
        } finally {
          setIsProcessing(false);
        }
      },
      error: (error) => {
        setError(`CSV parsing error: ${error.message}`);
        setIsProcessing(false);
      }
    });
  };

  const compareWithLedger = (bankTrans: BankTransaction[]) => {
    const matched: Array<{ ledger: LedgerEntry; bank: BankTransaction }> = [];
    const onlyInBank: BankTransaction[] = [];
    const matchedBankIndices = new Set<number>();
    const matchedLedgerIndices = new Set<number>();

    // Find matches based on date and similar amounts (within $1)
    bankTrans.forEach((bankItem, bankIndex) => {
      const bankDate = bankItem.date;
      const bankAmount = bankItem.amount || 0;

      ledgerData.forEach((ledgerItem, ledgerIndex) => {
        if (matchedLedgerIndices.has(ledgerIndex)) return;

        const ledgerDate = ledgerItem.date;
        const amountDiff = Math.abs(ledgerItem.amount - bankAmount);

        // Match if same date and amount within $1
        if (ledgerDate === bankDate && amountDiff <= 1.0) {
          matched.push({ ledger: ledgerItem, bank: bankItem });
          matchedBankIndices.add(bankIndex);
          matchedLedgerIndices.add(ledgerIndex);
        }
      });
    });

    // Find bank transactions that didn't match
    bankTrans.forEach((bankItem, index) => {
      if (!matchedBankIndices.has(index)) {
        onlyInBank.push(bankItem);
      }
    });

    // Find ledger entries that didn't match
    const onlyInLedger = ledgerData.filter((_, index) => !matchedLedgerIndices.has(index));

    setComparison({ matched, onlyInLedger, onlyInBank });
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setComparison(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.name.endsWith('.csv')) {
        setUploadedFile(file);
        setError(null);
        processCSV(file);
      } else {
        setError('Please drop a CSV file');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Bank Statement Upload
        </h3>

        {!uploadedFile ? (
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-8 w-8 text-gray-400 mx-auto mb-4" />
            <p className="text-sm text-gray-600 mb-2">
              Drop your CSV file here or click to browse
            </p>
            <p className="text-xs text-gray-500">
              CSV should have &quot;date&quot; and &quot;transaction&quot; columns
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        ) : (
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {uploadedFile.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(uploadedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <button
                onClick={handleRemoveFile}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {isProcessing && (
          <div className="mt-4 flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm text-gray-600">Processing CSV...</span>
          </div>
        )}
      </div>

      {comparison && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">
            Comparison Results
          </h3>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-800">Matched</span>
              </div>
              <p className="text-2xl font-bold text-green-900 mt-2">
                {comparison.matched.length}
              </p>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <span className="text-sm font-medium text-orange-800">Ledger Only</span>
              </div>
              <p className="text-2xl font-bold text-orange-900 mt-2">
                {comparison.onlyInLedger.length}
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Bank Only</span>
              </div>
              <p className="text-2xl font-bold text-blue-900 mt-2">
                {comparison.onlyInBank.length}
              </p>
            </div>
          </div>

          {/* Detailed Results */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4">
              <h4 className="font-medium text-gray-900 mb-4">Transaction Details</h4>
              
              <div className="space-y-4 max-h-64 overflow-y-auto">
                {comparison.matched.map((match, index) => (
                  <div key={index} className="border-l-4 border-green-500 pl-4 py-2 bg-green-50">
                    <p className="text-sm font-medium text-green-800">✓ Matched</p>
                    <p className="text-xs text-gray-600">
                      {match.ledger.date} • ${match.ledger.amount.toFixed(2)} • {match.ledger.description}
                    </p>
                  </div>
                ))}

                {comparison.onlyInLedger.map((entry, index) => (
                  <div key={index} className="border-l-4 border-orange-500 pl-4 py-2 bg-orange-50">
                    <p className="text-sm font-medium text-orange-800">⚠ Ledger Only</p>
                    <p className="text-xs text-gray-600">
                      {entry.date} • ${entry.amount.toFixed(2)} • {entry.description}
                    </p>
                  </div>
                ))}

                {comparison.onlyInBank.map((entry, index) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50">
                    <p className="text-sm font-medium text-blue-800">ℹ Bank Only</p>
                    <p className="text-xs text-gray-600">
                      {entry.date} • ${entry.amount ? entry.amount.toFixed(2) : 'N/A'} • {entry.transaction}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
