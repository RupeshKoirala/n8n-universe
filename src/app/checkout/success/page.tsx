'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface SessionData {
  success: boolean;
  session?: {
    id: string;
    amount_total: number;
    currency: string;
    payment_status: string;
    customer_email?: string;
  };
}

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  const [loading, setLoading] = useState(true);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);

  useEffect(() => {
    async function fetchSession() {
      if (!sessionId) {
        router.push('/checkout/error');
        return;
      }

      try {
        const response = await fetch(`/api/checkout/success?session_id=${sessionId}`);
        const data = await response.json();

        if (data.success && data.session) {
          setSessionData(data.session);
          setLoading(false);
        } else {
          router.push('/checkout/error');
        }
      } catch (error) {
        console.error('Failed to fetch session:', error);
        router.push('/checkout/error');
        setLoading(false);
      }
    }

    fetchSession();
  }, [sessionId, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20">
        <div className="container mx-auto px-4 py-16">
          <div className="flex items-center justify-center h-64">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          {/* Success Message */}
          <div className="text-center mb-12">
            <div className="w-24 h-24 mx-auto mb-6 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-green-600 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L2 19l4 4h10a2 2 0 01-2.83V9.586c0-1.028-.536-1.028-2.83V4.414a2 2 0 012-2.83 2-2.83 12-2.83 12z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 13l4 4L2 19l4 4h10a2 2 0 01-2.83V9.586c0-1.028-.536-1.028-2.83V4.414a2 2 0 012-2.83 2-2.83 12-2.83 12z" />
              </svg>
            </div>
            <h1 className="text-5xl font-bold mb-4 text-gray-900 dark:text-white">
              Payment Successful!
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Thank you for your purchase
            </p>
          </div>

          {/* Session Details */}
          {sessionData && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 mb-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  Order Confirmation
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Your payment has been successfully processed
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-4">
                  <span className="text-gray-600 dark:text-gray-300">Payment Status</span>
                  <span className="px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-full text-sm font-semibold">
                    {sessionData.session.payment_status.toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-4">
                  <span className="text-gray-600 dark:text-gray-300">Amount Paid</span>
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    ${sessionData.session.amount_total.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-4">
                  <span className="text-gray-600 dark:text-gray-300">Customer Email</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {sessionData.session.customer_email || 'Available in your account'}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-4">
                  <span className="text-gray-600 dark:text-gray-300">Session ID</span>
                  <span className="font-mono text-sm text-gray-900 dark:text-white">
                    {sessionData.session.id.substring(0, 8)}...
                  </span>
                </div>
              </div>

              {/* Next Steps */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-8">
                <h3 className="text-xl font-semibold text-purple-900 dark:text-purple-100 mb-4">
                  What's Next?
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-purple-600 text-white rounded-lg flex items-center justify-center flex-shrink-0 font-bold">
                      1
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                        Download Your Workflows
                      </h4>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">
                        You now have unlimited access to our entire marketplace of 25,000+ n8n workflows. Browse and download any workflow you need.
                      </p>
                      <Link
                        href="/workflows"
                        className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                      >
                        Browse Workflows
                      </Link>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center flex-shrink-0 font-bold">
                      2
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                        Check Your Account
                      </h4>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">
                        Your subscription has been activated. Visit your account page to manage your subscription, view download history, and update your preferences.
                      </p>
                      <Link
                        href="/profile"
                        className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                      >
                        Go to Profile
                      </Link>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-pink-600 text-white rounded-lg flex items-center justify-center flex-shrink-0 font-bold">
                      3
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                        Get Support
                      </h4>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">
                        If you have any questions or need help with workflows, our support team is here to assist you. We typically respond within 24 hours.
                      </p>
                      <Link
                        href="/support"
                        className="inline-block px-6 py-3 bg-pink-600 text-white rounded-lg font-semibold hover:bg-pink-700 transition-colors"
                      >
                        Contact Support
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Receipt */}
              <div className="text-center mt-8">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  A confirmation email has been sent to {sessionData.session.customer_email || 'your email address'}. 
                  You can also view your order details in your profile under the "Orders" section.
                </p>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex gap-4">
            <Link
              href="/workflows"
              className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-center"
            >
              ← Back to Workflows
            </Link>
            <Link
              href="/profile"
              className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors text-center"
            >
              View My Profile →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
