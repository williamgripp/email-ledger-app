'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Mail, BookOpen } from 'lucide-react';
import { useState } from 'react';

export function Navigation() {
  const pathname = usePathname();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateEmails = async () => {
    setIsGenerating(true);
    
    try {
      // Setup Database
      await fetch('/api/setup-database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      // Wait 5 seconds
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Sync Ledger
      await fetch('/api/sync-ledger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      // Refresh the page after completion
      window.location.reload();

    } catch (error) {
      console.error('Generate emails error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const links = [
    {
      href: '/',
      label: 'Emails',
      icon: Mail,
      description: 'View emails with PDF receipts'
    },
    {
      href: '/ledger',
      label: 'Ledger',
      icon: BookOpen,
      description: 'Manage transactions and bank reconciliation'
    }
  ];

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-xl font-bold text-gray-900">
              Email & Ledger Manager
            </Link>
            
            <div className="flex space-x-4">
              {links.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                    title={link.description}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
              
              <button
                onClick={handleGenerateEmails}
                disabled={isGenerating}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isGenerating
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isGenerating ? 'Generating...' : 'Generate Emails'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
