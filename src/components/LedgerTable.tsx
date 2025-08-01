'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { DollarSign, Calendar, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { TransactionLedgerEntry } from '@/lib/supabase';

interface LedgerTableProps {
  onRefresh?: () => void;
}

export default function LedgerTable({ onRefresh }: LedgerTableProps) {
  const [entries, setEntries] = useState<TransactionLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load ledger entries using the API endpoint (which uses transaction_ledger view)
    const loadLedgerEntries = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/ledger');
        
        if (!response.ok) {
          throw new Error('Failed to fetch ledger entries');
        }
        
        const data = await response.json();
        setEntries(data || []);
      } catch (error) {
        console.error('Error loading ledger entries:', error);
        setEntries([]);
      } finally {
        setLoading(false);
      }
    };

    loadLedgerEntries();
  }, [onRefresh]);

  const totalAmount = entries.reduce((sum, entry) => sum + entry.amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Transaction Ledger
        </h2>
        <div className="flex items-center space-x-2 text-sm">
          <DollarSign className="h-4 w-4 text-gray-500" />
          <span className="font-medium text-gray-900">
            Total: ${totalAmount.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {entries.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {entries.map((entry) => (
                  <tr key={entry.invoice_number} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>{format(new Date(entry.date), 'MMM d, yyyy')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {entry.invoice_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {entry.vendor ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          {entry.vendor}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-xs truncate" title={entry.description}>
                        {entry.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                      <div className="space-y-1">
                        <div className="text-green-600">
                          ${entry.amount.toFixed(2)}
                        </div>
                        {entry.bank_amount && entry.bank_amount !== entry.amount && (
                          <div className="text-xs text-gray-500">
                            Bank: ${entry.bank_amount.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        entry.source === 'email, bank statement' 
                          ? 'bg-green-100 text-green-800' 
                          : entry.source === 'email'
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {entry.source === 'email, bank statement' && (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {entry.source}
                          </>
                        )}
                        {entry.source === 'email' && (
                          <>
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {entry.source}
                          </>
                        )}
                        {entry.source === 'bank statement' && (
                          <>
                            <Info className="h-3 w-3 mr-1" />
                            {entry.source}
                          </>
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
            <p className="text-gray-600">
              Processed receipts will appear here automatically.
            </p>
          </div>
        )}
      </div>

      <div className="text-xs text-gray-500">
        {entries.length} transaction{entries.length !== 1 ? 's' : ''} • 
        Last updated: {format(new Date(), 'MMM d, yyyy h:mm a')}
      </div>
    </div>
  );
}
