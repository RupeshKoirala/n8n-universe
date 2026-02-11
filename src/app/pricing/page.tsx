'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface PricingTier {
  id: string;
  name: string;
  price: number;
  interval: 'month';
  features: string[];
  downloadsPerDay: number;
  stripePriceId: string | null;
}

interface User {
  id: string;
  email: string;
  subscription_tier: 'free' | 'basic' | 'pro' | 'enterprise';
  subscription_ends_at: string | null;
}

interface PricingData {
  pricing: PricingTier[];
  currentPlan: string | null;
}

export default function PricingPage() {
  const [loading, setLoading] = useState(true);
  const [pricing, setPricing] = useState<PricingTier[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [selectedTier, setSelectedTier] = useState<'free' | 'basic' | 'pro' | 'enterprise'>('basic');
  const [billingPeriod, setBillingPeriod] = useState<'month' | 'year'>('month');
  const [currentTier, setCurrentTier] = useState<'free' | 'basic' | 'pro' | 'enterprise' | null>(null);

  useEffect(() => {
    // Fetch pricing data
    async function fetchPricing() {
      try {
        const response = await fetch('/api/pricing');
        const data = await response.json();

        if (data.pricing) {
          setPricing(data.pricing);
          setLoading(false);
        }

        // Fetch user session to get current plan
        const sessionRes = await fetch('/api/auth/session');
        const sessionData = await sessionRes.json();

        if (sessionData.authenticated && sessionData.user) {
          setUser(sessionData.user);
          setCurrentTier(sessionData.user.subscription_tier || null);
        }
      } catch (error) {
        console.error('Failed to fetch pricing:', error);
        setLoading(false);
      }
    }

    fetchPricing();
  }, []);

  const handleSubscribe = async (tier: 'basic' | 'pro' | 'enterprise') => {
    if (!user) {
      // Redirect to login with return URL
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      return;
    }

    try {
      const response = await fetch('/api/checkout/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tier,
          billing: billingPeriod === 'year' ? 'annual' : 'monthly',
          userId: user.id
        })
      });

      const data = await response.json();

      if (response.ok && data.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      } else {
        alert('Failed to create checkout: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Subscription error:', error);
      alert('Failed to start checkout. Please try again.');
    }
  };

  const handleUpgrade = async (tier: 'basic' | 'pro' | 'enterprise') => {
    const confirmed = confirm(
      `You're about to upgrade to the ${tier.charAt(0).toUpperCase() + tier.slice(1)} plan at $${pricing.find(p => p.id === tier)?.price || 0}/mo.\n\n` +
      `Your current subscription will be cancelled and replaced.\n\n` +
      `Do you want to continue?`
    );

    if (!confirmed) {
      return;
    }

    await handleSubscribe(tier);
  };

  const isCurrentTier = (tier: string) => currentTier === tier;
  const getAnnualPrice = (price: number) => (price * 12 * 0.83).toFixed(2); // 17% discount for annual

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
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Choose Your Plan
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-2">
              Unlock unlimited access to 25,000+ n8n workflows
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="text-purple-600 font-semibold">Save 17%</span>
              <span>with annual billing</span>
            </div>
          </div>

          {/* Current Plan Banner */}
          {user && currentTier && currentTier !== 'free' && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 mb-12">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 dark:text-blue-300 font-bold">✓</span>
                  </div>
                  <div>
                    <p className="text-sm text-blue-900 dark:text-blue-100 font-medium">
                      Your current plan: <span className="font-bold capitalize">{currentTier}</span>
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      Subscription renews on {new Date(user.subscription_ends_at || '').toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Link
                  href="/settings"
                  className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
                >
                  Manage Subscription →
                </Link>
              </div>
            </div>
          )}

          {/* Toggle Billing Period */}
          <div className="flex justify-center mb-12">
            <div className="bg-white dark:bg-gray-800 rounded-full p-1 shadow-lg">
              <div className="flex gap-4">
                <button
                  onClick={() => setBillingPeriod('month')}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                    billingPeriod === 'month'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingPeriod('year')}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                    billingPeriod === 'year'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white'
                  }`}
                >
                  Annual <span className="ml-2 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full">Save 17%</span>
                </button>
              </div>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {pricing.map((tier) => {
              const annualPrice = getAnnualPrice(parseFloat(tier.price));
              const monthlyPrice = billingPeriod === 'year' ? annualPrice : tier.price;
              const savings = billingPeriod === 'year' ? ((tier.price * 12 - parseFloat(annualPrice)) * 12).toFixed(0) : null;

              return (
                <div
                  key={tier.id}
                  onClick={() => tier.id !== 'price_free_tier' && setSelectedTier(tier.id.replace('price_', '') as 'basic' | 'pro' | 'enterprise')}
                  className={`relative rounded-2xl p-8 transition-all cursor-pointer ${
                    selectedTier === tier.id.replace('price_', '')
                      ? 'border-2 border-purple-600 ring-4 ring-purple-200 shadow-2xl scale-105'
                      : isCurrentTier(tier.id.replace('price_', ''))
                      ? 'border-2 border-blue-400 ring-4 ring-blue-200 shadow-xl'
                      : 'border-2 border-transparent hover:border-purple-300 hover:shadow-lg bg-white dark:bg-gray-800'
                  }`}
                >
                  {/* Current Plan Badge */}
                  {isCurrentTier(tier.id.replace('price_', '')) && (
                    <div className="absolute -top-3 left-4">
                      <div className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                        Current Plan
                      </div>
                    </div>
                  )}

                  {/* Popular Badge */}
                  {tier.id === 'price_basic_monthly' && (
                    <div className="absolute -top-3 right-4">
                      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                        Most Popular
                      </div>
                    </div>
                  )}

                  {/* Tier Name */}
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {tier.name}
                    </h3>
                    <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                      ${monthlyPrice}
                    </div>
                    {billingPeriod === 'month' && tier.interval === 'month' && tier.price !== '0' && (
                      <span className="text-sm text-gray-600 dark:text-gray-300">/mo</span>
                    )}
                    {billingPeriod === 'year' && tier.interval === 'month' && tier.price !== '0' && (
                      <span className="text-sm text-gray-600 dark:text-gray-300">/yr</span>
                    )}
                  </div>

                  {/* Savings Badge */}
                  {billingPeriod === 'year' && tier.price !== '0' && savings && (
                    <div className="text-center mb-4">
                      <div className="inline-block bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-3 py-1 rounded-full text-sm font-semibold">
                        Save ${savings}/year
                      </div>
                    </div>
                  )}

                  {/* Downloads */}
                  {tier.downloadsPerDay > 0 && (
                    <div className="text-center mb-6">
                      <div className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-4 py-2 rounded-lg inline-block">
                        <span className="text-2xl font-bold">{tier.downloadsPerDay}</span>
                        <span className="text-sm"> downloads/day</span>
                      </div>
                    </div>
                  )}

                  {/* Features List */}
                  <div className="space-y-3 mb-8">
                    {tier.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <svg className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L2 9l-4 4H6m-2 5a2 2 0 00-4 0-4-4-2.83V6.25l-2.586 2.586-3.243-2.084-2.828 2.828-6.317-6.317 4.343-6.317 4.343-4.343-6.317 4.343-6.317-4.343-6.317-4.343-6.317-4.343z" />
                        </svg>
                        <span className="text-gray-700 dark:text-gray-300 text-sm">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Action Button */}
                  {tier.id === 'price_free_tier' ? (
                    <button
                      disabled={isCurrentTier('free')}
                      className={`w-full py-4 rounded-xl font-semibold text-lg transition-all ${
                        isCurrentTier('free')
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-900 dark:bg-gray-700 text-white hover:bg-gray-800 dark:hover:bg-gray-600 hover:scale-105 active:scale-95 shadow-lg'
                      }`}
                    >
                      {isCurrentTier('free') ? 'Current Plan' : 'Get Started Free'}
                    </button>
                  ) : (
                    <button
                      onClick={() => isCurrentTier(tier.id.replace('price_', '')) ? handleUpgrade(tier.id.replace('price_', '') as 'basic' | 'pro' | 'enterprise') : handleSubscribe(tier.id.replace('price_', '') as 'basic' | 'pro' | 'enterprise')}
                      disabled={isCurrentTier(tier.id.replace('price_', ''))}
                      className={`w-full py-4 rounded-xl font-semibold text-lg transition-all ${
                        selectedTier === tier.id.replace('price_', '')
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 hover:scale-105 active:scale-95 shadow-xl cursor-wait'
                          : isCurrentTier(tier.id.replace('price_', ''))
                          ? 'bg-blue-600 text-white cursor-not-allowed'
                          : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 hover:scale-105 active:scale-95 shadow-lg'
                      }`}
                    >
                      {isCurrentTier(tier.id.replace('price_', '')) ? 'Current Plan' : selectedTier === tier.id.replace('price_', '') ? 'Processing...' : 'Subscribe Now'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Free Tier Note */}
          {currentTier === 'free' && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6 text-center">
              <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                <strong>Note:</strong> You're currently on the Free tier with limited downloads (3 per day). 
                Upgrade to Basic or Pro for unlimited access to all workflows.
              </p>
            </div>
          )}

          {/* FAQ Section */}
          <div className="mt-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
              Frequently Asked Questions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Can I switch plans?
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Yes! You can upgrade or downgrade your plan at any time from your account settings. Changes will be prorated based on your current billing cycle.
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  What payment methods do you accept?
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  We accept all major credit cards, debit cards, and PayPal. All payments are processed securely through Stripe.
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Can I cancel my subscription?
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Yes! You can cancel your subscription at any time from your account settings. You'll continue to have access until the end of your billing period.
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Do unused downloads roll over?
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  No! Downloads are for individual workflows. Each download counts toward your daily limit, but unused downloads don't carry over.
                </p>
              </div>
            </div>
          </div>

          {/* Money Back Guarantee */}
          <div className="mt-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-12 text-center text-white">
            <h2 className="text-3xl font-bold mb-4">
              30-Day Money Back Guarantee
            </h2>
            <p className="text-xl text-purple-100 mb-6">
              Not satisfied with your plan? Get a full refund within 30 days, no questions asked.
            </p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-sm text-purple-200">
                Try risk-free today
              </span>
              <Link
                href="/workflows"
                className="inline-block px-8 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition-colors"
              >
                Browse Workflows
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
