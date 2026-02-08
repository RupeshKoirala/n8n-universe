import type { Metadata } from '@/types';

export const metadata: Metadata = {
  title: 'Pricing - n8n Universe Marketplace',
  description: 'Choose the perfect plan for your needs. Free tier, pay-per-download, or monthly subscriptions.',
  keywords: ['pricing', 'subscriptions', 'plans', 'cost', 'monthly', 'annual', 'workflows', 'downloads', 'unlimited'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'n8n Universe',
    title: 'Pricing - n8n Universe Marketplace',
    description: 'Choose from Free, Basic, Pro, or Enterprise plans. Pay-per-download also available.',
    images: [
      {
        url: 'https://n8nuniverse.com/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'n8n Universe Marketplace - Choose Your Plan'
      }
    ]
  },
};

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    billing: 'monthly',
    features: [
      '10 free downloads per month',
      'Limited search access',
      'Basic support via email',
      'Community forum access'
    ],
    limitations: [
      'Limited to 10 downloads per month',
      'No advanced search',
      'No priority support',
      'Community features only'
    ],
    popular: true
  },
  {
    id: 'basic',
    name: 'Basic',
    price: 9,
    billing: 'monthly',
    features: [
      '100 downloads per month',
      'Full search access',
      'Advanced filters',
      'Email support (48h response)',
      'Download history',
      'Workflow preview system',
      'Community forum access',
      'Basic analytics'
    ],
    limitations: [
      '100 downloads per month limit',
      'No API access',
      'No custom workflows'
    ],
    popular: true,
    popular: true
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 19,
    billing: 'monthly',
    features: [
      'Unlimited downloads',
      'Full search + semantic search',
      'Advanced filters & categories',
      'Priority support (24h)',
      'Workflow preview system',
      'Download history',
      'Custom workflow tools',
      'Basic analytics + insights',
      'Community forum access',
      'Early access to new workflows',
      'API access',
      'Integration support'
    ],
    limitations: [
      'None'
    ],
    popular: true,
    popular: true,
    highlighted: true,
    badge: 'MOST POPULAR'
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 99,
    billing: 'monthly',
    features: [
      'Everything in Pro plan',
      'Custom workflow builder',
      'Advanced analytics dashboard',
      'Dedicated account manager',
      'API access (1000 requests/day)',
      'Webhook integrations',
      'Priority support (4h)',
      'Custom development support',
      'SSO for teams',
      'White-labeling',
      'Custom integrations',
      'Compliance documentation',
      'On-premise deployment guide'
    ],
    limitations: [
      'API rate limit: 1000 requests/day'
    ],
    popular: false,
    highlighted: false,
    badge: 'ENTERPRISE'
  }
];

const payPerDownloadTiers = [
  {
    complexity: 'simple',
    minPrice: 1,
    maxPrice: 3,
    files: '1-10 files'
  },
  {
    complexity: 'medium',
    minPrice: 3,
    maxPrice: 7,
    files: '10-50 files'
  },
  {
    complexity: 'complex',
    minPrice: 7,
    maxPrice: 15,
    files: '50+ files'
  }
];

export default function PricingPage() {
  const [selectedPlan, setSelectedPlan] = useState('pro');
  const [billing, setBilling] = useState('monthly');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Choose the perfect plan for your needs. Pay for what you use, or subscribe for unlimited access.
          </p>
        </div>

        {/* Subscription Plans */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Subscription Plans
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 ${
                  plan.highlighted ? 'border-orange-500 ring-2 ring-orange-500 dark:ring-orange-600' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-4 -right-4">
                    <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                      {plan.badge}
                    </span>
                  </div>
                )}

                {plan.popular && (
                  <div className="absolute -top-4 -right-4">
                    <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                      MOST POPULAR
                    </span>
                  </div>
                )}

                <div className="p-6">
                  {/* Plan Header */}
                  <div className="mb-4">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {plan.name}
                    </h3>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                      ${plan.price}/mo
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="space-y-4 mb-6">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <span className="text-green-500 dark:text-green-400 font-semibold">✓</span>
                        <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Limitations */}
                  {plan.limitations && plan.limitations.length > 0 && (
                    <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                        Limitations
                      </h4>
                      <ul className="space-y-2">
                        {plan.limitations.map((limitation) => (
                          <li key={limitation} className="text-sm text-gray-600 dark:text-gray-400">
                            • {limitation}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* CTA Button */}
                  <button
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`w-full py-3 px-6 rounded-lg font-semibold transition-all ${
                      selectedPlan === plan.id
                        ? 'bg-orange-500 text-white hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700'
                        : 'bg-white text-gray-900 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700'
                    }`}
                  >
                    {selectedPlan === plan.id ? (
                      <span>Selected Plan - {plan.name}</span>
                    ) : (
                      <>
                        <span className="text-2xl font-bold">Select {plan.name}</span>
                        <span className="block text-sm text-gray-500 dark:text-gray-400 mt-1">
                          Get started
                        </span>
                      </>
                    )}
                  </button>
                </div>
              ))}
          </div>
        </div>

        {/* Pay-Per-Download */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Pay-Per-Download
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
            Don't need a subscription? Pay only for the workflows you download.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {payPerDownloadTiers.map((tier) => (
              <div
                key={tier.complexity}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300"
              >
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  {tier.complexity.charAt(0).toUpperCase() + tier.complexity.slice(1)} Workflows
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {tier.files}
                </p>
                <div className="mb-4">
                  <p className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    ${tier.minPrice} - ${tier.maxPrice}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    per workflow
                  </p>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-4">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 dark:text-green-400">✓</span>
                    <span className="text-gray-700 dark:text-gray-300">
                      Instant download access
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 dark:text-green-400">✓</span>
                    <span className="text-gray-700 dark:text-gray-300">
                      30-day download history
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 dark:text-green-400">✓</span>
                    <span className="text-gray-700 dark:text-gray-300">
                      {tier.complexity === 'simple' ? 'Easy integration' : 'Advanced features'}
                    </span>
                  </li>
                </ul>

                {/* CTA */}
                <button className="w-full py-3 px-6 rounded-lg bg-green-500 dark:bg-green-700 hover:bg-green-600 dark:hover:bg-green-600 text-white font-semibold transition-all">
                  Browse {tier.complexity.charAt(0).toUpperCase() + tier.complexity.slice(1)} Workflows
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Billing Toggle */}
        <div className="mb-8 bg-blue-50 dark:bg-blue-900 rounded-xl p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Billing Frequency
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Choose how you want to be billed
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => setBilling('monthly')}
              className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
                billing === 'monthly'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-900 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700'
              }`}
            >
              <div className="text-lg font-bold">Monthly</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                20% savings
              </div>
            </button>

            <button
              onClick={() => setBilling('yearly')}
              className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
                billing === 'yearly'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-900 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700'
              }`}
            >
              <div className="text-lg font-bold">Yearly</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Save 20%
              </div>
            </button>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Can I switch plans?
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                Yes! You can upgrade or downgrade at any time. Changes take effect immediately and you'll be billed prorated.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Do downloads expire?
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                Never! You have lifetime access to all workflows you download. Your downloads never expire.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Can I get a refund?
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                We offer a 7-day money-back guarantee on all purchases. Contact support for a refund.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Ready to start automating?
          </p>
          <Link
            href="/workflows"
            className="inline-block bg-orange-500 hover:bg-orange-600 dark:bg-orange-700 dark:hover:bg-orange-600 text-white font-semibold px-8 py-4 rounded-lg transition-all"
          >
            Browse All Workflows
          </Link>
        </div>
      </div>
    </>
  );
}
