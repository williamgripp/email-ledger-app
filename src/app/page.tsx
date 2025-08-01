import { EmailList } from '@/components/EmailList';

export default function EmailsPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Emails</h1>
        <p className="text-gray-600">
          View and process emails with PDF receipt attachments
        </p>
      </div>
      
      <EmailList />
    </div>
  );
}
