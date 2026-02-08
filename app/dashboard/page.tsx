import type { Metadata } from '@/types';

export const metadata: Metadata = {
  title: 'Dashboard - n8n Universe',
  description: 'Manage your workflows, downloads, subscriptions, and account settings.',
  keywords: ['dashboard', 'workflows', 'downloads', 'subscriptions', 'account', 'settings'],
};

export default function Dashboard() {
  const stats = {
    totalWorkflows: 25432,
    totalDownloads: 125847,
    activeSubscriptions: 87,
    monthlyRevenue: 1842.50,
    totalRevenue: 621845.00
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Welcome back! Here's your n8n universe marketplace overview.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="text-4xl font-bold text-orange-500 dark:text-orange-400 mb-2">
              {stats.totalWorkflows.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total Workflows
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="text-4xl font-bold text-blue-500 dark:text-blue-400 mb-2">
              {stats.totalDownloads.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total Downloads
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="text-4xl font-bold text-green-500 dark:text-green-400 mb-2">
              {stats.activeSubscriptions}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Active Subscriptions
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="text-4xl font-bold text-blue-500 dark:text-blue-400 mb-2">
              ${stats.monthlyRevenue.toLocaleString('en-US', {style: 'currency', currency: 'USD'})}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Monthly Revenue
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="text-4xl font-bold text-purple-500 dark:text-purple-400 mb-2">
              ${stats.totalRevenue.toLocaleString('en-US', {style: 'currency', currency: 'USD'})}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total Revenue
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="bg-blue-500 dark:bg-blue-700 hover:bg-blue-600 dark:hover:bg-blue-600 text-white font-semibold py-4 px-6 rounded-lg transition">
              Upload New Workflow
            </button>
            <button className="bg-green-500 dark:bg-green-700 hover:bg-green-600 dark:hover:bg-green-600 text-white font-semibold py-4 px-6 rounded-lg transition">
              Manage Subscriptions
            </button>
            <button className="bg-purple-500 dark:bg-purple-700 hover:bg-purple-600 dark:hover:bg-purple-600 text-white font-semibold py-4 px-6 rounded-lg transition">
              View Analytics
            </button>
            <button className="bg-orange-500 dark:bg-orange-700 hover:bg-orange-600 dark:hover:bg-orange-600 text-white font-semibold py-4 px-6 rounded-lg transition">
              Account Settings
            </button>
          </div>
        </div>

        {/* Recent Downloads */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Recent Downloads
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((download) => (
                <div key={download} className="flex items-center justify-between py-4 border-b border-gray-200 dark:border-gray-700 last:border-0">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Workflow #{download.id}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {download.workflow_name}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {download.date}
                    </span>
                    <span className="text-sm font-medium text-green-500 dark:text-green-400 ml-2">
                      ${download.price}$
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Subscription Management */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Subscription Management
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    Active Subscriptions
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {stats.activeSubscriptions} active subscribers
                  </p>
                </div>
                <button className="bg-blue-500 dark:bg-blue-700 hover:bg-blue-600 dark:hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg text-sm">
                  Manage
                </button>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    Monthly Revenue
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {stats.monthlyRevenue.toLocaleString('en-US', {style: 'currency', currency: 'USD'})} / mo
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    Total Revenue (ARR)
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {stats.totalRevenue.toLocaleString('en-US', {style: 'currency', currency: 'USD'})} total
                  </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
