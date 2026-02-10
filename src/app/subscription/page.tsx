'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface User {
  id: string;
  email: string;
  subscription_tier: 'free' | 'basic' | 'pro' | 'enterprise';
  subscription_ends_at: string | null;
  stripe_customer_id: string | null;
}

interface SubscriptionData {
  current_tier: 'free' | 'basic' | 'pro' | 'enterprise';
  current_plan_ends_at: string | null;
  stripe_subscription_id: string | null;
  status: 'active' | 'past_due' | 'cancelled' | 'expired';
  billing_history: BillingHistory[];
}

interface BillingHistory {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'failed' | 'refunded';
  description: string;
  invoice_url: string;
}

const pricingTiers = {
  free: {
    name: 'Free Tier',
    price: 0,
    features: ['3 downloads/day', 'Basic workflow search', 'Community support'],
    downloadsPerDay: 3
  },
  basic: {
    name: 'Basic Plan',
    price: 900, // $9.00
    features: ['Unlimited downloads', 'Advanced workflow search', 'Email support', 'Priority workflow reviews'],
    downloadsPerDay: 0
  },
  pro: {
    name: 'Pro Plan',
    price: 1900, // $19.00
    features: ['Unlimited downloads', 'AI-powered workflow recommendations', 'Priority support', 'Early access to new workflows', 'Workflow analytics dashboard'],
    downloadsPerDay: 0
  },
  enterprise: {
    name: 'Enterprise Plan',
    price: 9900, // $99.00
    features: ['Everything in Pro', 'Custom workflow development', 'Dedicated account manager', 'SLA guarantee', 'White-label marketplace option'],
    downloadsPerDay: 0
  }
} as const;

export default function SubscriptionPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    // Fetch user and subscription data
    async function fetchData() {
      try {
        const response = await fetch('/api/subscription');
        const data = await response.json();

        if (data.user) {
          setUser(data.user);
          setSubscription(data.subscription);
          setLoading(false);
        }
      } catch (error) {
        console.error('Failed to fetch subscription:', error);
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleUpgrade = async (tier: 'basic' | 'pro' | 'enterprise') => {
    if (!user) return;

    const confirmed = confirm(
      `Upgrade to ${pricingTiers[tier].name} for $${pricingTiers[tier].price}/mo?\n\n` +
      `Your current plan (${pricingTiers[user.subscription_tier]?.name}) will be cancelled and replaced.\n\n` +
      `Billing will start immediately.\n\n` +
      `Type "CONFIRM" to proceed.`
    );

    if (!confirmed) return;

    setCancelling(true);

    try {
      // Redirect to checkout with upgrade
      window.location.href = `/pricing?upgrade=${tier}`;
    } catch (error) {
      console.error('Upgrade error:', error);
      setCancelling(false);
      alert('Failed to initiate upgrade. Please try again.');
    }
  };

  const handleDowngrade = async (tier: 'free') => {
    if (!user) return;

    const confirmed = confirm(
      `Downgrade to Free tier?\n\n` +
      `• Your paid subscription will be cancelled\n` +
      `• You'll lose unlimited downloads\n` +
      `• Reverts to 3 downloads/day limit\n\n` +
      `• No access to premium features\n\n` +
      `• Subscription ends immediately\n\n` +
      `Type "CONFIRM" to proceed.`
    );

    if (!confirmed) return;

    setCancelling(true);

    try {
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        alert('Successfully downgraded to Free tier. Your subscription has been cancelled.');
        setUser({ ...user, subscription_tier: 'free', subscription_ends_at: null, stripe_customer_id: null });
        setSubscription({
          current_tier: 'free',
          current_plan_ends_at: null,
          stripe_subscription_id: null,
          status: 'cancelled',
          billing_history: subscription?.billing_history || []
        });
      } else {
        alert('Failed to downgrade. Please try again.');
      }
    } catch (error) {
      console.error('Downgrade error:', error);
      setCancelling(false);
      alert('Failed to downgrade. Please try again.');
    }
  };

  const getSubscriptionStatus = () => {
    if (!subscription) return { color: 'gray', text: 'Loading...' };

    const now = new Date();
    const endDate = subscription.current_plan_ends_at ? new Date(subscription.current_plan_ends_at) : null;

    if (subscription.status === 'cancelled') {
      return { color: 'red', text: 'Cancelled' };
    }

    if (subscription.status === 'expired' || (endDate && endDate < now)) {
      return { color: 'red', text: 'Expired' };
    }

    if (subscription.status === 'past_due' && endDate && endDate < now) {
      return { color: 'yellow', text: 'Past Due' };
    }

    return { color: 'green', text: 'Active' };
  };

  const getNextBillingDate = () => {
    if (!subscription || !subscription.current_plan_ends_at) return null;

    const endDate = new Date(subscription.current_plan_ends_at);
    return endDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

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

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Please Sign In
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              You need to sign in to view your subscription and billing information.
            </p>
            <Link
              href="/login"
              className="inline-block px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all"
            >
              Sign In to Your Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const status = getSubscriptionStatus();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Subscription & Billing
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Manage your subscription plan, view billing history, and upgrade or downgrade as needed
            </p>
          </div>

          {/* Subscription Status Card */}
          {subscription && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Current Plan
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300">
                    {pricingTiers[subscription.current_tier]?.name || 'Free Tier'}
                  </p>
                </div>
                <div className={`px-4 py-2 rounded-full text-sm font-semibold ${status.color} dark:bg-opacity-20`}>
                  {status.text}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">Plan Price</div>
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    ${subscription.current_tier !== 'free' ? `$${pricingTiers[subscription.current_tier]?.price}/mo` : '$0.00'}
                  </div>
                  {subscription.current_tier !== 'free' && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Billed monthly
                    </div>
                  )}
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">Next Billing Date</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {getNextBillingDate() || 'N/A'}
                  </div>
                </div>
              </div>

              {subscription.current_tier !== 'free' && getNextBillingDate() && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Reminder:</strong> Your subscription will automatically renew on {getNextBillingDate()}.
                  </p>
                </div>
              )}

              {/* Download Usage */}
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 mb-8">
                <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  Downloads This Month
                </div>
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  42 {subscription.current_tier !== 'free' ? '/∞' : '/3'}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {subscription.current_tier === 'free' ? 'of 3 limit reached' : 'unlimited'}
                </div>
              </div>
            </div>
          )}

          {/* Plan Management */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Upgrade Your Plan
            </h2>

            {/* Upgrade Options */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Available Plans
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(pricingTiers).map(([key, tier]) => {
                  const isCurrentPlan = subscription?.current_tier === key;
                  const tierData = pricingTiers[key as keyof typeof pricingTiers];

                  return (
                    <div
                      key={key}
                      className={`relative rounded-xl p-6 border-2 transition-all ${
                        isCurrentPlan
                          ? 'border-purple-600 ring-4 ring-purple-200 bg-purple-50 dark:bg-purple-900/20 dark:ring-purple-700'
                          : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 hover:shadow-lg bg-white dark:bg-gray-800 cursor-pointer'
                      }`}
                    >
                      {isCurrentPlan && (
                        <div className="absolute -top-3 left-4">
                          <div className="bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                            Current Plan
                          </div>
                        </div>
                      )}

                      <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                        {tierData.name}
                      </h4>

                      <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                        ${tierData.price === 0 ? 'Free' : `$${tierData.price}/mo`}
                      </div>

                      <div className="space-y-2 mb-4">
                        {tierData.price === 0 && (
                          <div className="text-sm text-gray-600 dark:text-gray-300">
                            <span className="font-semibold">{tierData.downloadsPerDay} downloads/day</span>
                            </div>
                        )}
                        {tierData.price !== 0 && (
                          <div className="text-sm text-green-600 dark:text-green-400 font-semibold">
                            Unlimited downloads
                          </div>
                        )}
                      </div>

                      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                        {tierData.features.slice(0, 3).map((feature, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4H7a2 2 0 01-2.83V6.25l-5.87 5.87a1 1 0 01-2.83 0-1.42V7a2 2 0 003 4.716-1.34 4.716-1.34z" />
                            </svg>
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>

                      {isCurrentPlan && (
                        <div className="text-center pt-4">
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            You're currently on this plan
                          </span>
                        </div>
                      )}

                      {!isCurrentPlan && subscription?.current_tier !== 'free' && (
                        <button
                          onClick={() => handleUpgrade(key as 'basic' | 'pro' | 'enterprise')}
                          disabled={cancelling}
                          className={`w-full mt-4 py-3 rounded-lg font-semibold transition-all ${
                            cancelling
                              ? 'bg-gray-400 text-white cursor-not-allowed'
                              : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700'
                          }`}
                        >
                          {cancelling ? 'Processing...' : `Upgrade to ${tierData.name}`}
                        </button>
                      )}

                      {tierData.price !== 0 && isCurrentPlan && (
                        <button
                          onClick={() => handleUpgrade('free')}
                          disabled={cancelling}
                          className={`w-full mt-4 py-3 border border-purple-600 text-purple-600 rounded-lg font-semibold transition-all hover:bg-purple-700 dark:hover:border-purple-500 ${
                            cancelling ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          {cancelling ? 'Processing...' : 'Downgrade to Free'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Cancel Subscription Modal */}
            {showCancelModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6">
                  <h3 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
                    Cancel Subscription
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    Are you sure you want to cancel your {pricingTiers[subscription.current_tier]?.name || 'subscription'}? This action cannot be undone.
                  </p>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setShowCancelModal(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-white rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Keep Subscription
                    </button>
                    <button
                      onClick={() => handleDowngrade('free')}
                      disabled={cancelling}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      {cancelling ? 'Cancelling...' : 'Yes, Cancel It'}
                    </button>
                  </div>
                  </div>
                </div>
              </div>
            )}

            {/* Cancel Warning for Active Subscriptions */}
            {subscription?.current_tier !== 'free' && subscription.status !== 'cancelled' && !showCancelModal && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 mb-6">
                <div className="flex items-start gap-4">
                  <svg className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m3 9.5a2 2 0 018 9.5a2 2 0 018 9.5a2 2 0 012 2.412V7.525l-2.586 2.412 0 01-2.828 12.414 2.828 2.414-2.828V7.525l-2.586 2.412 2.414-2.828 2.414 2.828V7.525l-2.586 2.412 2.414-2.828-2.414 2.828 2.414 2.828z" />
                  </svg>
                  <div>
                    <p className="text-red-900 dark:text-red-100 font-semibold mb-2">
                      Downgrade to Free
                    </p>
                    <p className="text-sm text-red-800 dark:text-red-200 mb-1">
                      Switch back to Free tier with limited downloads
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
                >
                  Cancel Plan
                </button>
              </div>
            )}

            {/* Billing History */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Billing History
                </h2>
                <Link
                  href="/api/subscription/invoice"
                  className="text-sm text-purple-600 dark:text-purple-400 hover:underline font-medium"
                >
                  Download All Invoices (PDF)
                </Link>
              </div>

              <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="text-sm text-gray-600 dark:text-gray-300">Last Payment</div>
                  <div className="text-sm text-gray-900 dark:text-white font-semibold">
                    {subscription?.billing_history?.[0]?.date || 'N/A'}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="text-sm text-gray-600 dark:text-gray-300">Amount</div>
                  <div className="text-sm text-gray-900 dark:text-white font-semibold">
                    {subscription?.billing_history?.[0]?.amount ? `$${subscription.billing_history[0].amount.toFixed(2)}` : 'N/A'}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="text-sm text-gray-600 dark:text-gray-300">Status</div>
                  <div className="text-sm">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      subscription?.billing_history?.[0]?.status === 'paid'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                        : subscription?.billing_history?.[0]?.status === 'failed'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                    }`}>
                      {subscription?.billing_history?.[0]?.status?.toUpperCase() || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {(!subscription?.billing_history || subscription.billing_history.length === 0) && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <p>No billing history available</p>
                </div>
              )}
            </div>

            {/* Support */}
            <div className="bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-8 text-center">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Need Help?
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                Our support team is here to help you with any questions about your subscription, billing, or account.
              </p>
              <div className="flex gap-4 justify-center">
                <Link
                  href="/contact"
                  className="px-6 py-3 bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Contact Support
                </Link>
                <a
                  href="mailto:support@n8n-universe.com"
                  className="px-6 py-3 bg-transparent border border-white dark:border-gray-800 text-purple-600 dark:text-purple-400 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  support@n8n-universe.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
