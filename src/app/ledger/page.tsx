import LedgerTable from '@/components/LedgerTable';
import { BankStatementUpload } from '@/components/BankStatementUpload';

export default function LedgerPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Ledger</h1>
        <p className="text-gray-600">
          Manage your transaction ledger and compare with bank statements
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <LedgerTable />
        </div>
        
        <div className="lg:col-span-1">
          <BankStatementUpload />
        </div>
      </div>
    </div>
  );
}
