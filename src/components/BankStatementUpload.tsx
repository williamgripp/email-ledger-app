'use client';

import { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, X } from 'lucide-react';

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
  const [processResult, setProcessResult] = useState<ProcessResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setError('Please select a CSV file');
      return;
    }

    setUploadedFile(file);
    setError(null);
    setSuccessMessage(null);
    processCSV(file);
  };

  const processCSV = async (file: File) => {
    setIsProcessing(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload-csv', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to process CSV');
      }

      if (result.success) {
        setProcessResult(result.results);
        setSuccessMessage(result.message);
      } else {
        throw new Error(result.error || 'Failed to process CSV');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process CSV');
      setProcessResult(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setProcessResult(null);
    setError(null);
    setSuccessMessage(null);
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
        setSuccessMessage(null);
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
              CSV must have columns: <strong>Invoice Number</strong>, <strong>Date</strong>, and <strong>Amount</strong>
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

        {successMessage && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <p className="text-sm text-green-700">{successMessage}</p>
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

      {processResult && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">
            Processing Results
          </h3>

          {/* Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-800">Matched Entries</span>
              </div>
              <p className="text-2xl font-bold text-green-900 mt-2">
                {processResult.matched}
              </p>
              <p className="text-xs text-green-700 mt-1">
                Found in both email ledger and bank statement
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">New Entries</span>
              </div>
              <p className="text-2xl font-bold text-blue-900 mt-2">
                {processResult.unmatched}
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Bank statement only - added to ledger
              </p>
            </div>
          </div>

          {/* Detailed Results */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4">
              <h4 className="font-medium text-gray-900 mb-4">Transaction Details</h4>
              
              <div className="space-y-4 max-h-64 overflow-y-auto">
                {processResult.details.matched.map((match, index) => (
                  <div key={index} className="border-l-4 border-green-500 pl-4 py-2 bg-green-50">
                    <p className="text-sm font-medium text-green-800">✓ Matched Entry</p>
                    <p className="text-xs text-gray-600">
                      {match.invoice_number} • {match.date} • ${match.amount.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Source: {match.source} • {match.description || 'No description'}
                    </p>
                  </div>
                ))}

                {processResult.details.unmatched.map((entry, index) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50">
                    <p className="text-sm font-medium text-blue-800">+ New Entry</p>
                    <p className="text-xs text-gray-600">
                      {entry.invoice_number} • {entry.date} • ${entry.amount.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Source: {entry.source}
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
