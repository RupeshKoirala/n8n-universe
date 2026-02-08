import type { Metadata } from '@/types';

export const metadata: Metadata = {
  title: 'Browse Workflows - n8n Universe',
  description: 'Discover 25,000+ n8n automation workflows organized by category, complexity, and integration.',
  keywords: ['n8n', 'workflows', 'automation', 'marketplace', 'templates', 'no-code', 'low-code', 'browse', 'discover'],
  openGraph: {
    title: 'n8n Universe',
    type: 'website',
    url: 'https://n8nuniverse.com',
    images: [
      {
        url: 'https://n8nuniverse.com/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'n8n Universe Marketplace'
      }
    ]
  },
  twitter: {
    handle: '@n8nuniverse',
    cardType: 'summary_large_image'
  },
};

export default function BrowsePage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Browse Workflows
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            Discover 25,000+ n8n automation workflows organized by category, complexity, and integration. Find the perfect workflow for your needs.
          </p>
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-8">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search
              </label>
              <input
                type="text"
                placeholder="Search workflows..."
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-600"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                <option value="">All Categories</option>
                <option value="marketing">Marketing</option>
                <option value="e-commerce">E-Commerce</option>
                <option value="productivity">Productivity</option>
                <option value="customer-support">Customer Support</option>
                <option value="ai">AI & Automation</option>
                <option value="data">Data & Analytics</option>
                <option value="finance">Finance</option>
                <option value="communication">Communication</option>
                <option value="social-media">Social Media</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Complexity
              </label>
              <select className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                <option value="">All Levels</option>
                <option value="simple">Simple</option>
                <option value="medium">Medium</option>
                <option value="complex">Complex</option>
              </select>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Integration
              </label>
              <select className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                <option value="">All Integrations</option>
                <option value="n8n">n8n</option>
                <option value="slack">Slack</option>
                <option value="notion">Notion</option>
                <option value="google">Google (Sheets, Drive, Calendar)</option>
                <option value="airtable">Airtable</option>
                <option value="shopify">Shopify</option>
                <option value="woocommerce">WooCommerce</option>
                <option value="stripe">Stripe</option>
                <option value="zapier">Zapier</option>
                <option value="make">Make</option>
                <option value="hubspot">HubSpot</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Price Range
              </label>
              <select className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                <option value="">All Prices</option>
                <option value="0-1">Free</option>
                <option value="1-5">$1 - $5</option>
                <option value="5-10">$5 - $10</option>
                <option value="10-25">$10 - $25</option>
                <option value="25-50">$25 - $50</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Workflow Cards - Mock Data */}
          {[
            {
              id: 'wf-1',
              name: 'Social Media Content Scheduler',
              description: 'Automate posting content across social media platforms',
              complexity: 'medium',
              category: 'marketing',
              tags: ['social-media', 'content', 'automation', 'marketing'],
              triggers: ['cron'],
              actions: ['http-request', 'set'],
              integrations: ['twitter', 'facebook', 'instagram', 'linkedin'],
              difficulty: 'intermediate',
              price: 5,
              popularity: 250,
              rating: 4.5
            },
            {
              id: 'wf-2',
              name: 'E-commerce Order Processing',
              description: 'Process orders from multiple e-commerce platforms and update inventory',
              complexity: 'complex',
              category: 'e-commerce',
              tags: ['e-commerce', 'automation', 'order-processing', 'inventory'],
              triggers: ['webhook'],
              actions: ['http-request', 'set', 'if-else', 'get'],
              integrations: ['shopify', 'woocommerce', 'magento', 'stripe'],
              difficulty: 'advanced',
              price: 15,
              popularity: 400,
              rating: 4.2
            },
            {
              id: 'wf-3',
              name: 'Email List Cleaning & Categorization',
              description: 'Automatically clean and categorize email inbox, detect spam, prioritize important emails',
              complexity: 'medium',
              category: 'productivity',
              tags: ['email', 'productivity', 'automation', 'cleaning'],
              triggers: ['email-trigger'],
              actions: ['http-request', 'set', 'get', 'delete', 'if-else'],
              integrations: ['gmail', 'outlook'],
              difficulty: 'intermediate',
              price: 3,
              popularity: 150,
              rating: 4.8
            },
            {
              id: 'wf-4',
              name: 'Customer Support AI Chatbot',
              description: 'AI-powered chatbot that handles customer support queries, provides answers, and escalates to human agents',
              complexity: 'complex',
              category: 'customer-support',
              tags: ['ai', 'chatbot', 'customer-support', 'automation', 'nlp'],
              triggers: ['webhook'],
              actions: ['http-request', 'set', 'get', 'post', 'if-else'],
              integrations: ['openai', 'anthropic', 'n8n', 'supabase'],
              difficulty: 'advanced',
              price: 20,
              popularity: 600,
              rating: 4.6
            },
            {
              id: 'wf-5',
              name: 'Newsletter Subscription Manager',
              description: 'Manage newsletter subscriptions, handle unsubscribes, and track engagement metrics',
              complexity: 'medium',
              category: 'marketing',
              tags: ['email', 'newsletter', 'marketing', 'automation', 'subscriptions'],
              triggers: ['webhook', 'email-trigger'],
              actions: ['http-request', 'set', 'get', 'post', 'delete'],
              integrations: ['mailchimp', 'sendgrid', 'convertkit'],
              difficulty: 'intermediate',
              price: 7,
              popularity: 200,
              rating: 4.1
            },
            {
              id: 'wf-6',
              name: 'Website Performance Monitor',
              description: 'Monitor website uptime, page load times, and user engagement metrics',
              complexity: 'simple',
              category: 'productivity',
              tags: ['web', 'monitoring', 'analytics', 'productivity', 'uptime'],
              triggers: ['cron'],
              actions: ['http-request', 'set', 'get', 'if-else'],
              integrations: ['uptime-robot', 'pingdom', 'google-analytics', 'sentry'],
              difficulty: 'beginner',
              price: 2,
              popularity: 120,
              rating: 4.9
            },
            {
              id: 'wf-7',
              name: 'Daily Sales Report Generator',
              description: 'Generate comprehensive daily sales reports across all platforms and channels',
              complexity: 'complex',
              category: 'productivity',
              tags: ['reporting', 'analytics', 'sales', 'automation', 'data'],
              triggers: ['cron'],
              actions: ['http-request', 'set', 'get', 'transform', 'if-else'],
              integrations: ['shopify', 'stripe', 'google-sheets', 'notion'],
              difficulty: 'advanced',
              price: 12,
              popularity: 320,
              rating: 4.7
            }
          ].map((workflow) => (
            <div key={workflow.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition overflow-hidden border border-gray-200 dark:border-gray-700">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {workflow.name}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <span className="inline-flex items-center gap-1">
                        <span className="w-3 h-3 rounded-full bg-blue-500" />
                        {workflow.category}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <span className="w-3 h-3 rounded-full bg-orange-500" />
                        {workflow.difficulty}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <span className="w-3 h-3 rounded-full bg-green-500" />
                        {workflow.difficulty}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    <span className="text-blue-600 dark:text-blue-400">
                      ${workflow.price || '1'}$
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                       • {workflow.popularity} downloads
                    </span>
                  </div>
                </div>

                {/* Overview Tab */}
                <div className="space-y-3">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    What It Does
                  </h4>
                  <p className="text-gray-700 dark:text-gray-300 mb-4 text-sm">
                    {workflow.description}
                  </p>
                  
                  <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-4 mb-4">
                    <h4 className="text-lg font-semibold text-blue-900 dark:text-white mb-3">
                      Benefits
                    </h4>
                    <ul className="space-y-2 text-gray-700 dark:text-gray-300 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 dark:text-blue-400">✓</span>
                        <span>Handles {workflow.integrations.length} integrations</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 dark:text-blue-400">✓</span>
                        <span>Lightweight and fast ({workflow.file_size ? formatBytes(workflow.file_size) : 'under 1KB'})</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 dark:text-blue-400">✓</span>
                        <span>{workflow.difficulty === 'simple' ? 'Easy to modify' : 'Pro-level automation'}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 dark:text-blue-400">✓</span>
                        <span>Save {workflow.popularity ? Math.round(workflow.popularity * 2) : '50'}+ hours per month</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-green-50 dark:bg-green-900 rounded-lg p-4 mb-4">
                    <h4 className="text-lg font-semibold text-green-900 dark:text-white mb-3">
                      Setup Requirements
                    </h4>
                    <ul className="space-y-2 text-gray-700 dark:text-gray-300 text-sm">
                      {workflow.integrations.length > 0 && (
                        <li className="flex items-start gap-2">
                          <span className="text-green-500 dark:text-green-400 font-medium">
                            {workflow.integrations[0].charAt(0).toUpperCase() + workflow.integrations[0].slice(1)}
                          </span>
                          <span>account required</span>
                        </li>
                      )}
                      {workflow.triggers.length > 0 && (
                        <li className="flex items-start gap-2">
                          <span className="text-green-500 dark:text-green-400 font-medium">
                            {workflow.triggers[0]}
                          </span>
                          <span>trigger type</span>
                        </li>
                      )}
                    </ul>
                  </div>

                  <div className="bg-orange-50 dark:bg-orange-900 rounded-lg p-4 mb-4">
                    <h4 className="text-lg font-semibold text-orange-900 dark:text-white mb-3">
                      Est. Setup Time
                    </h4>
                    <p className="text-orange-900 dark:text-orange-300 font-medium mb-2">
                      {workflow.difficulty === 'simple' ? '5-15 minutes' :
                       workflow.difficulty === 'medium' ? '30-60 minutes' :
                       workflow.difficulty === 'complex' ? '1-2 hours'}
                    </p>
                  </div>
                </div>

                {/* Quick Info */}
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">Complexity</span>
                    <p>{workflow.complexity}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">Integrations</span>
                    <p>{workflow.integrations.join(', ')}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">Nodes</span>
                    <p>{workflow.node_count || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">Popularity</span>
                    <p>{workflow.popularity} downloads</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">Rating</span>
                    <p>{workflow.rating || 'No ratings yet'}/5</p>
                  </div>
                </div>

                {/* Price & Download */}
                <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button className="w-full sm:w-auto bg-orange-500 dark:bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-6 rounded-lg transition">
                    Download Workflow - <span className="font-normal">${workflow.price || '1'}$</span>
                  </button>
                  <button className="w-full sm:w-auto bg-blue-500 dark:bg-blue-700 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition">
                    Add to Library
                  </button>
                </div>
              </div>
            </div>
          ))
        </div>
      </div>
    </div>
  );
}
