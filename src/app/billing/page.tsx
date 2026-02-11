'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Invoice {
  id: string;
  number: string;
  status: string;
  amount: number;
  currency: string;
  created: number;
  pdf_url: string;
  hosted_invoice_url: string;
}

interface Subscription {
  id: string;
  status: string;
  current_period_start: number;
  current_period_end: number;
  cancel_at_period_end: boolean;
  cancel_at: number | null;
}

interface PaymentHistoryProps {
  userId: string;
}

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBillingInfo();
  }, []);

  async function fetchBillingInfo() {
    try {
      // Get current user session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        setError('Please sign in to view billing history');
        setLoading(false);
        return;
      }

      // Fetch subscription status
      const subResponse = await fetch(`/api/subscription/manage?userId=${session.user.id}`);
      if (subResponse.ok) {
        const subData = await subResponse.json();
        setSubscription(subData.subscription);
      }

      // Fetch invoices from Stripe
      const invoicesResponse = await fetch(`/api/billing/invoices?userId=${session.user.id}`);
      if (invoicesResponse.ok) {
        const invoicesData = await invoicesResponse.json();
        setInvoices(invoicesData.invoices || []);
      }

      setLoading(false);
    } catch (err) {
      console.error('Error fetching billing info:', err);
      setError('Failed to load billing information');
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading billing information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-gray-700 text-center">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Billing & Payments</h1>
          <p className="text-gray-600 mt-2">View your invoices and payment history</p>
        </div>

        {/* Current Subscription */}
        {subscription && (
          <div className="bg-white rounded-lg shadow-md mb-8 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Subscription</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`font-medium ${subscription.status === 'active' ? 'text-green-600' : 'text-gray-900'}`}>
                  {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Period:</span>
                <span className="text-gray-900">
                  {new Date(subscription.current_period_start * 1000).toLocaleDateString()} - {new Date(subscription.current_period_end * 1000).toLocaleDateString()}
                </span>
              </div>
              {subscription.cancel_at_period_end && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  <p className="text-yellow-800 text-sm">
                    ⚠️ Your subscription will cancel on {new Date(subscription.current_period_end * 1000).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Invoices Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Payment History</h2>
          </div>

          {invoices.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500">No invoices found</p>
              <p className="text-gray-400 text-sm mt-1">Your payment history will appear here</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {invoice.number || 'Draft'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(invoice.created * 1000).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${(invoice.amount / 100).toFixed(2)} {invoice.currency.toUpperCase()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                          invoice.status === 'open' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <a
                          href={invoice.hosted_invoice_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          View
                        </a>
                        <a
                          href={invoice.pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          PDF
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
