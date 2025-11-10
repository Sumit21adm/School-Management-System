import { useState } from 'react';
import { IndianRupee, FileText, CreditCard, Settings } from 'lucide-react';
import FeeHeadsPage from './FeeHeadsPage';
import InvoicesPage from './InvoicesPage';

export default function FeesPage() {
  const [activeTab, setActiveTab] = useState('invoices');

  const tabs = [
    { id: 'invoices', name: 'Invoices', icon: FileText },
    { id: 'fee-heads', name: 'Fee Heads', icon: Settings },
    { id: 'payments', name: 'Payments', icon: CreditCard },
    { id: 'fee-plans', name: 'Fee Plans', icon: IndianRupee },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Fees & Payments</h1>
        </div>
        {/* Tabs */}
        <div className="border-t border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm
                  ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'invoices' && <InvoicesPage />}
        {activeTab === 'fee-heads' && <FeeHeadsPage />}
        {activeTab === 'payments' && (
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600">Payments page coming soon...</p>
          </div>
        )}
        {activeTab === 'fee-plans' && (
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600">Fee Plans page coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
}
