import type { Metadata } from '@/types';

export const metadata: Metadata = {
  title: 'Categories - n8n Universe',
  description: 'Browse n8n automation workflows by category: Marketing, E-Commerce, Productivity, Customer Support, AI & Automation, Data & Analytics, Finance, Communication, Social Media.',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'n8n Universe',
    title: 'Categories - n8n Automation Marketplace',
    description: 'Discover n8n automation workflows by category. Browse our curated collection of 25,000+ no-code workflows.',
  },
};

export default function CategoriesPage() {
  const categories = [
    { name: 'Marketing', icon: '📢', count: 3500, description: 'Social media, content creation, newsletters, email campaigns' },
    { name: 'E-Commerce', icon: '🛍', count: 5200, description: 'Online stores, order processing, inventory management, payment integrations' },
    { name: 'Productivity', icon: '📊', count: 4100, description: 'Task management, time tracking, automation, document workflows, file organization' },
    { name: 'Customer Support', icon: '💬', count: 2800, description: 'Help desk, chatbots, support ticket systems, FAQ management' },
    { name: 'AI & Automation', icon: '🤖', count: 3600, description: 'AI-powered workflows, machine learning, data processing, automation' },
    { name: 'Data & Analytics', icon: '📈', count: 1900, description: 'Data visualization, analytics dashboards, reporting systems, data transformation' },
    { name: 'Finance', icon: '💰', count: 1200, description: 'Accounting, financial workflows, expense tracking, invoice processing, budget automation' },
    { name: 'Communication', icon: '💬', count: 1500, description: 'Email, Slack, Discord, Telegram bots, messaging systems' },
    { name: 'Social Media', icon: '📱', count: 2200, description: 'Social media posting, content scheduling, comment management, analytics' },
  ];

  const totalWorkflows = 25000;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Categories
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
            Browse {totalWorkflows.toLocaleString()} n8n automation workflows by category
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category, index) => (
            <Link
              key={index}
              href={`/categories/${category.name.toLowerCase().replace(/\s+/g, '-')}`}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 border border-gray-200 dark:border-gray-700 overflow-hidden group"
            >
              <div className="p-8">
                {/* Icon */}
                <div className="mb-4">
                  <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-200 flex items-center justify-center">
                    <span className="text-4xl">{category.icon}</span>
                  </div>
                </div>

                {/* Name & Count */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {category.name}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {category.count.toLocaleString()} workflows
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    {category.description}
                  </p>
                </div>

                {/* Browse Button */}
                <button className="w-full bg-orange-500 dark:bg-orange-600 hover:bg-orange-600 dark:hover:bg-orange-700 text-white font-semibold py-3 px-6 rounded-lg transition">
                  Browse {category.name}
                </button>
              </div>
            </Link>
          ))}
        </div>

        {/* All Categories Link */}
        <div className="text-center mt-12">
          <Link
            href="/workflows"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-500 font-semibold"
          >
            View All {totalWorkflows.toLocaleString()} Workflows →
          </Link>
        </div>
      </div>
    </>
  );
}
