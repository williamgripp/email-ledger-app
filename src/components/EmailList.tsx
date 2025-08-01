'use client';

import { useState, useEffect } from 'react';
import { Mail, Paperclip, FileText, Download, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { GeneratedEmail } from '@/lib/emailGenerator';
import { supabase, Email } from '@/lib/supabase';

export function EmailList() {
  const [emails, setEmails] = useState<GeneratedEmail[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<GeneratedEmail | null>(null);
  const [attachmentInfo, setAttachmentInfo] = useState<{[key: string]: {fileName: string, exists: boolean}} | null>(null);
  const [rawEmailsData, setRawEmailsData] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAttachmentInfo = async (emailsData: Email[]) => {
    const attachmentData: {[key: string]: {fileName: string, exists: boolean}} = {};
    
    for (const email of emailsData) {
      if (email.has_attachment && email.invoice_number) {
        try {
          // Check if the specific PDF exists in storage using invoice_number
          // The actual filename is invoice-{invoice_number}.pdf
          const fileName = `invoice-${email.invoice_number}.pdf`;
          
          const { data, error } = await supabase.storage
            .from('invoices')
            .list('', {
              search: fileName
            });
          
          if (!error && data && data.length > 0) {
            attachmentData[email.id] = {
              fileName: fileName,
              exists: true
            };
          } else {
            attachmentData[email.id] = {
              fileName: fileName,
              exists: false
            };
          }
        } catch (error) {
          console.error('Error checking attachment:', error);
          attachmentData[email.id] = {
            fileName: `invoice-${email.invoice_number}.pdf`,
            exists: false
          };
        }
      }
    }
    
    setAttachmentInfo(attachmentData);
  };

  useEffect(() => {
    // Load emails from Supabase
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load all emails (no longer joining with ledger since we removed the foreign key)
        const { data: emailsData, error } = await supabase
          .from('emails')
          .select('*')
          .order('received_at', { ascending: false });

        if (error) {
          console.error('Error loading emails:', error);
          // Don't fallback to sample data - show empty state instead
          setEmails([]);
          return;
        }

        // Fetch attachment info before transforming
        await fetchAttachmentInfo(emailsData);
        
        // Store raw email data for access to pdf_url
        setRawEmailsData(emailsData);

        // Transform Supabase data to our GeneratedEmail format
        const transformedEmails: GeneratedEmail[] = emailsData.map(email => ({
          id: email.id,
          subject: email.subject,
          sender: email.sender,
          receivedAt: new Date(email.received_at),
          hasAttachment: email.has_attachment,
          body: email.body,
          pdfFileName: undefined, // PDF info is now in the invoices storage, not directly linked
          invoiceData: undefined // Invoice data is now processed separately and stored in ledger table
        }));

        setEmails(transformedEmails);
        console.log('Loaded emails:', transformedEmails.length, 'emails found');
      } catch (error) {
        console.error('Error connecting to Supabase:', error);
        // Don't fallback to sample data - show empty state
        setEmails([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleSelectEmail = (email: GeneratedEmail) => {
    setSelectedEmail(email);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Email List */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Emails
          </h2>
          
          {emails.length === 0 && !loading && (
            <div className="text-center">
              <p className="text-gray-600">No emails found. Use the curl command to generate sample data.</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading emails from Supabase...</p>
            </div>
          ) : emails.length === 0 ? (
            <div className="p-8 text-center">
              <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No emails found</h3>
              <p className="text-gray-600 mb-4">
                Use the curl command to generate sample emails: <br />
                <code className="bg-gray-100 px-2 py-1 rounded text-sm">curl -X POST http://localhost:3000/api/setup-database</code>
              </p>
            </div>
          ) : (
            emails.map((email, index) => (
            <div 
              key={email.id} 
              className={`p-4 border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
                index !== emails.length - 1 ? 'border-b' : ''
              } ${selectedEmail?.id === email.id ? 'bg-blue-50 border-blue-200' : ''}`}
              onClick={() => handleSelectEmail(email)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="flex-shrink-0 mt-1">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {email.subject}
                      </h3>
                      {email.hasAttachment && (
                        <Paperclip className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                    
                    <p className="text-xs text-gray-500 mb-2">
                      From: {email.sender}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        {format(email.receivedAt, 'MMM d, yyyy h:mm a')}
                      </span>
                      
                      <div className="flex items-center space-x-2">
                        {email.hasAttachment && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <FileText className="h-3 w-3 mr-1" />
                            PDF
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )))}
        </div>

      </div>

      {/* Email Detail View */}
      <div className="lg:col-span-1">
        {selectedEmail ? (
          <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Email Details</h3>
              <button
                onClick={() => setSelectedEmail(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <Eye className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Subject</label>
                <p className="text-sm text-gray-900 mt-1">{selectedEmail.subject}</p>
              </div>
              
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">From</label>
                <p className="text-sm text-gray-900 mt-1">{selectedEmail.sender}</p>
              </div>
              
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Received</label>
                <p className="text-sm text-gray-900 mt-1">
                  {format(selectedEmail.receivedAt, 'MMMM d, yyyy h:mm a')}
                </p>
              </div>
              
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Message</label>
                <p className="text-sm text-gray-700 mt-1 leading-relaxed">{selectedEmail.body}</p>
              </div>
              
              {selectedEmail.hasAttachment && attachmentInfo && attachmentInfo[selectedEmail.id] && (
                <div className="border-t pt-4">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Attachment</label>
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-6 w-6 text-blue-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-900">
                          {attachmentInfo[selectedEmail.id].fileName}
                        </p>
                        <p className="text-xs text-blue-700">
                          {attachmentInfo[selectedEmail.id].exists ? 'PDF Available' : 'PDF Not Found'}
                        </p>
                      </div>
                      {attachmentInfo[selectedEmail.id].exists && (
                        <button
                          onClick={() => {
                            // Find the raw email data to get the pdf_url
                            const emailData = rawEmailsData.find(e => e.id === selectedEmail.id);
                            if (emailData?.pdf_url) {
                              window.open(emailData.pdf_url, '_blank');
                            } else {
                              console.error('No PDF URL found for email');
                            }
                          }}
                          className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors"
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {selectedEmail.hasAttachment && (!attachmentInfo || !attachmentInfo[selectedEmail.id]) && (
                <div className="border-t pt-4">
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      📎 This email has an attachment but no PDF was found in storage.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
            <Mail className="h-8 w-8 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">Select an email to view details</p>
          </div>
        )}
      </div>
    </div>
  );
}