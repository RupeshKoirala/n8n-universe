'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function CheckoutCancelPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  const [loading, setLoading] = useState(true);
  const [cancelled, setCancelled] = useState(false);

  useEffect(() => {
    // Auto-redirect after 3 seconds if session_id exists
    if (sessionId && cancelled) {
      const timer = setTimeout(() => {
        router.push('/pricing');
      }, 3000);

      return () => clearTimeout(timer);
    }

    return () => clearTimeout(timer);
  }, [sessionId, cancelled, router]);

  const handleGoBack = () => {
    router.back();
  };

  const handleTryAgain = () => {
    router.push('/pricing');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-16">
          <div className="flex items-center justify-center h-64">
            <div className="w-12 h-12 border-4 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          {/* Cancelled Icon */}
          <div className="text-center mb-12">
            <div className="w-32 h-32 mx-auto bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-8">
              <svg className="w-20 h-20 text-red-600 dark:text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6v12a2 2 0 00-2V9a2 2 0 00-2V5m3 7h-1m-1-1v-2h4a2 2 0 01-2.83l-1-1-2.83V5m3 7h-1m-1-1v-2h4a2 2 0 01-2.83-2.83l-1-1-2.83V5m3 7h-1m-1-1v-2h4a2 2 0 01-2.83-2.83l-1-1-2.83V5m3 7h-1m-1-1v-2h4a2 2 0 01-2.83-2.83l-1-1-2.83V5m3 7h-1m-1-1v-2h4a2 2 0 01-2.83-2.83l-1-1-2.83V5m3 7h-1m-1-1v-2h4a2 2 0 01-2.83-2.83l-1-1-2.83V5m3 7h-1m-1-1v-2h4a2 2 0 01-2.83-2.83l-1-1-2.83V5m3 7h-1m-1-1v-2h4a2 2 0 01-2.83z" />
              </svg>
            </div>
            <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Payment Cancelled
            </h1>
          </div>

          {/* Cancelled Message */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Your payment has been cancelled
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              No charges were made to your payment method. You can try again whenever you're ready.
            </p>

            {/* Possible Reasons */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Why was the payment cancelled?
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-gray-600 dark:text-gray-300">
                    !
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Changed my mind</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      I decided to wait or choose a different plan
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-gray-600 dark:text-gray-300">
                    !
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Not ready yet</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      I need more time to think about it
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-gray-600 dark:text-gray-300">
                    !
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Technical issue</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Something went wrong with the payment page
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-gray-600 dark:text-gray-300">
                    !
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Need help</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      I have questions about the plans or pricing
                    </p>
                  </div>
                </li>
              </ul>

              {/* Support Contact */}
              <div className="flex items-center gap-2 mt-6">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M22 12C22 6.477 22 6.477 20 12 20 12c-1.657 1.657-3 343-3.343-3.343c-1.657-1.657-3.243-1.243-1.243 1.243 3.243 1.243 1.657 3.343 3.343c-1.243 1.243 3.243 1.243 3.243 1.657 3.243 3.243c-1.657 3.657c-1.657 3.657 3.657 3.447 2.12 2.12 2.12c-2.12 2.12 2.12 2.12 3.447 2.12 3.243 3.243 1.657 3.657 3.447 2.12c-2.12 2.12 2.12 2.12 2.12 2.12 3.447 2.12 3.243 3.243 1.243 1.243 1.243 1.243 1.657 3.657 3.343c-1.243-1.243 1.243 3.243 1.657 3.657 3.657c-1.657-3.657 3.657 2.12 3.447 2.12 2.12 2.12 2.12 2.12 3.447 2.12 3.243 1.243 1.243 1.243 1.243 1.243 1.243 1.657 3.657 3.343c-1.243 1.243 1.243 1.657 3.657 3.657c-1.657 3.447 2.12 2.12 2.12 2.12 2.12 3.447 2.12 3.243 1.243 1.243 1.243 1.243 1.657 3.657 3.657c-1.657 3.657 2.12 3.447 2.12 2.12 2.12 2.12 3.447 2.12 3.243 1.243 1.243 1.243 1.243 1.657 3.343c-1.243 1.243 1.243 1.657 3.343c-1.243 1.243 1.243 1.657 3.447 2.12 2.12 2.12 2.12 3.447 2.12 3.243 1.657 3.657c-1.657 3.343c-1.243 1.243 1.243 1.243 1.657 3.343c-1.243 1.243 1.657 3.657 3.657 3.657 3.447 2.12 2.12 2.12 2.12 2.12 3.447 2.12 3.243 1.243 1.243 1.243 1.243 1.657 3.657 3.657c-1.657 3.657 3.447 2.12 2.12 2.12 2.12 3.447 2.12 3.243 1.243 1.657 3.657c-1.657 3.657 3.657c-1.657 3.447 2.12 2.12 2.12 2.12 3.447 2.12 3.243 1.243 1.243 1.243 1.657 3.343c-1.243 1.243 1.243 1.243 1.243 1.657 3.657 3.657 3.343c-1.243 1.243 1.243 1.243 1.657 3.447 2.12 2.12 2.12 3.447 2.12 3.243 1.243 1.657 3.657 3.657c-1.657 3.343c-1.243 1.243 1.243 1.657 3.657 3.657 3.657 3.447 2.12 2.12 2.12 2.12 3.447 2.12 3.243 1.243 1.243 1.243 1.657 3.657 3.657c-1.657 3.343c-1.243 1.243 1.243 1.243 1.657 3.657 3.657 3.447 2.12 2.12 2.12 2.12 2.12 3.447 2.12 3.243 1.243 1.243 1.243 1.243 1.243 1.657 3.657 3.657 3.343c-1.243 1.243 1.243 1.243 1.243 1.243 1.657 3.657 3.657 3.657 3.657 3.657 3.343c-1.243 1.243 1.243 1.243 1.657 3.657 3.447 2.12 2.12 2.12 2.12 3.447 2.12 3.243 1.243 1.243 1.243 1.243 1.657 3.657 3.657 3.657 3.657 3.657 3.447 2.12 2.12 2.12 2.12 3.447 2.12 3.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.657 3.657 3.657 3.657 3.343c-1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.447 2.12 2.12 2.12 2.12 3.447 2.12 3.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.657 3.657 3.657 3.657 3.657 3.447 2.12 2.12 2.12 2.12 3.447 2.12 3.243 1.243 1.243 1.243 1.243 1.243 1.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.447 2.12 2.12 2.12 2.12 3.447 2.12 3.243 1.243 1.243 1.243 1.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.447 2.12 2.12 2.12 2.12 3.447 2.12 3.243 1.243 1.243 1.243 1.243 1.657 3.657 3.657 3.447 2.12 2.12 2.12 2.12 3.447 2.12 3.243 1.243 1.657 3.657 3.657 3.657 3.657 3.657 3.657 3.447 2.12 2.12 2.12 2.12 3.447 2.12 3.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.447 2.12 2.12 2.12 2.12 2.12 3.447 2.12 3.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.447 2.12 2.12 2.12 2.12 2.12 3.447 2.12 3.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.447 2.12 2.12 2.12 2.12 2.12 3.447 2.12 3.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1. Payments - Complete marketplace. No payment method needed!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Support Info */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 flex-shrink-0">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M22 12C22 6.477 22 6.477 20 12 20 12c-1.657 1.657-3.343-3.343-1.657 1.657-3.343c-1.657-1.657 3.657 3.657 3.657 3.657 3.657 3.447 2.12 2.12 2.12 2.12 2.12 3.447 2.12 2.12 2.12 3.447 2.12 2.12 2.12 3.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.447 2.12 2.12 2.12 3.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1.243 1. page.tsx" />" />
                </div>
                <div>
                  <h3 className="font-semibold text-purple-100 mb-2">Payment Options</h3>
                  <p className="text-purple-200">Secure checkout with no payment details</p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 22s-7.428-7.077-7.077-7.428-7.077-7.428l-5.293-5.293-5.293c-5.293-5.293 5.707-5.707-7.077 7.077-5.707-5.707 5.293 2.003-2.003-2.003 2.003-2.003 2.003 2.003 5.707-5.707 7.077 7.077-5.293 5.293 2.003 2.003-2.003 2.003 2.003 5.707-5.707 7.077 7.077 5.293 5.293 2.003 2.003 2.003 2.003 5.707-7.077 7.077-5.293 5.293 5.293 2.003 2.003 2.003 2.12 3.447 2.12 3.243 1.657 3.657 3.657 3.657 3.657 3.657 3.657 3.447 2.12 2.12 2.12 2.12 3.243 1.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.447 2.12 2.12 2.12 2.12 3.243 1.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.447 2.12 2.12 2.12 2.12 3.243 1.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.447 2.12 2.12 2.12 2.12 3.243 1.243 1.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.447 2.12 2.12 2.12 2.12 3.243 1.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3.657 3. checkout/success - Complete marketplace. No payment method needed!
                    </p>
                    <p className="text-purple-200">
                      Secure checkout with no payment details. Payment cancelled.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-6 h-6 bg-purple-300 flex-shrink-0 rounded-full flex items-center justify-center">
                    !
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">No payment details provided</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Check your Stripe account for more information about the cancelled payment.
                    </p>
                  </div>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                We sent you a confirmation email with details about the cancellation.
              </p>
            </div>

            {/* Contact Support */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Need Help Choosing a Plan?
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-gray-600 dark:text-gray-300 mb-2">
                    Compare our Basic ($9/mo), Pro ($19/mo), and Enterprise ($99/mo) plans:
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li><strong>Basic:</strong> 3 downloads/day, Email support</li>
                    <li><strong>Pro:</strong> Unlimited downloads, AI recommendations, Priority support</li>
                    <li><strong>Enterprise:</strong> Everything in Pro + Custom development, White-label marketplace</li>
                  </ul>
                </div>
                <div className="flex gap-3">
                  <Link
                    href="/pricing"
                    className="flex-1 px-4 py-2 bg-gray-900 dark:bg-white text-white rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors text-center"
                  >
                    View Pricing
                  </Link>
                  <button
                    onClick={handleGoBack}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-white rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  >
                    Go Back
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-4">
          <Link
            href="/workflows"
            className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-white rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-center"
          >
            Browse Workflows
          </Link>
          <Link
            href="/profile"
            className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors text-center"
          >
            My Account
          </Link>
        </div>
      </div>
    </div>
  );
}
