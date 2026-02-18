'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface AdminAnalytics {
  overview: {
    totalUsers: number;
    totalWorkflows: number;
    totalDownloads: number;
    totalRevenue: number;
    mrr: number;
    activeSubscriptions: number;
    conversionRate: string;
    churnRate: string;
  };
  today: {
    unique_users: number;
    page_views: number;
    downloads: number;
    searches: number;
    signups: number;
    subscription_starts: number;
    revenue: number;
  };
  dailyAnalytics: Array<{
    date: string;
    unique_users: number;
    page_views: number;
    downloads: number;
    searches: number;
    signups: number;
    subscription_starts: number;
    revenue: number;
  }>;
  popularSearches: Array<{
    query: string;
    search_count: number;
    avg_results_count: number;
    click_rate: number;
  }>;
  trendingWorkflows: Array<{
    workflow_id: string;
    name: string;
    category: string;
    download_count: number;
    view_count: number;
    trend_score: number;
  }>;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [timeframe, setTimeframe] = useState<'7' | '30' | '90'>('30');
  const [activeTab, setActiveTab] = useState<'overview' | 'revenue' | 'users' | 'workflows' | 'search'>('overview');
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    async function loadAdminDashboard() {
      try {
        // Get session
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (!currentSession) {
          router.push('/login');
          return;
        }
        setSession(currentSession);

        // Fetch admin analytics
        const token = currentSession.access_token;
        const response = await fetch(`/api/analytics/admin?days=${timeframe}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.status === 403) {
          router.push('/dashboard');
          return;
        }

        const data = await response.json();
        setAnalytics(data);

      } catch (error) {
        console.error('Failed to load admin dashboard:', error);
      } finally {
        setLoading(false);
      }
    }

    loadAdminDashboard();
  }, [router, timeframe]);

  const refreshData = async () => {
    setLoading(true);
    try {
      const token = session.access_token;
      const response = await fetch(`/api/analytics/admin?days=${timeframe}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Business analytics and performance metrics
            </p>
          </div>
          <div className="flex gap-3">
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value as any)}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
            <button
              onClick={refreshData}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="flex space-x-4 border-b border-gray-200 dark:border-gray-700">
            {[
              { id: 'overview' as const, label: 'Overview' },
              { id: 'revenue' as const, label: 'Revenue' },
              { id: 'users' as const, label: 'Users' },
              { id: 'workflows' as const, label: 'Workflows' },
              { id: 'search' as const, label: 'Search Analytics' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-purple-600 border-b-2 border-purple-600 dark:text-purple-400'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Total Revenue"
                value={`$${analytics?.overview.totalRevenue.toLocaleString() || 0}`}
                change="+12.5%"
                positive
                icon={<DollarIcon />}
                color="green"
              />
              <MetricCard
                title="MRR"
                value={`$${analytics?.overview.mrr.toFixed(0) || 0}`}
                change="+8.3%"
                positive
                icon={<TrendingUpIcon />}
                color="blue"
              />
              <MetricCard
                title="Active Subscriptions"
                value={analytics?.overview.activeSubscriptions || 0}
                change="+5.2%"
                positive
                icon={<UserIcon />}
                color="purple"
              />
              <MetricCard
                title="Conversion Rate"
                value={`${analytics?.overview.conversionRate || 0}%`}
                change="+2.1%"
                positive
                icon={<ChartIcon />}
                color="pink"
              />
            </div>

            {/* Secondary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Total Users"
                value={analytics?.overview.totalUsers || 0}
                icon={<UsersIcon />}
                color="gray"
              />
              <MetricCard
                title="Total Workflows"
                value={analytics?.overview.totalWorkflows || 0}
                icon={<WorkflowIcon />}
                color="gray"
              />
              <MetricCard
                title="Total Downloads"
                value={analytics?.overview.totalDownloads || 0}
                icon={<DownloadIcon />}
                color="gray"
              />
              <MetricCard
                title="Churn Rate"
                value={`${analytics?.overview.churnRate || 0}%`}
                change="-1.2%"
                positive
                icon={<TrendingDownIcon />}
                color="red"
              />
            </div>

            {/* Today's Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Today's Performance</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {analytics?.today.unique_users || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Unique Users</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {analytics?.today.page_views || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Page Views</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {analytics?.today.downloads || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Downloads</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {analytics?.today.searches || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Searches</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {analytics?.today.signups || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Signups</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    ${analytics?.today.revenue || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Revenue</div>
                </div>
              </div>
            </div>

            {/* Daily Analytics Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Daily Analytics (Last {timeframe} days)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4">Date</th>
                      <th className="text-right py-3 px-4">Users</th>
                      <th className="text-right py-3 px-4">Views</th>
                      <th className="text-right py-3 px-4">Downloads</th>
                      <th className="text-right py-3 px-4">Searches</th>
                      <th className="text-right py-3 px-4">Signups</th>
                      <th className="text-right py-3 px-4">Subscriptions</th>
                      <th className="text-right py-3 px-4">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics?.dailyAnalytics.slice(0, 10).map((day) => (
                      <tr key={day.date} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="py-3 px-4 font-medium">{new Date(day.date).toLocaleDateString()}</td>
                        <td className="text-right py-3 px-4">{day.unique_users}</td>
                        <td className="text-right py-3 px-4">{day.page_views}</td>
                        <td className="text-right py-3 px-4">{day.downloads}</td>
                        <td className="text-right py-3 px-4">{day.searches}</td>
                        <td className="text-right py-3 px-4">{day.signups}</td>
                        <td className="text-right py-3 px-4">{day.subscription_starts}</td>
                        <td className="text-right py-3 px-4 text-green-600 font-medium">${Number(day.revenue).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Revenue Tab */}
        {activeTab === 'revenue' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Revenue Breakdown</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <span className="font-medium">Total Revenue</span>
                    <span className="text-2xl font-bold text-green-600">
                      ${analytics?.overview.totalRevenue.toLocaleString() || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <span className="font-medium">Monthly Recurring Revenue</span>
                    <span className="text-2xl font-bold text-blue-600">
                      ${analytics?.overview.mrr.toFixed(0) || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <span className="font-medium">Today's Revenue</span>
                    <span className="text-2xl font-bold text-purple-600">
                      ${analytics?.today.revenue || 0}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Subscription Revenue</h3>
                <div className="text-center py-8">
                  <div className="text-5xl font-bold text-green-600 mb-2">
                    ${analytics?.overview.mrr.toFixed(0) || 0}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">Monthly Recurring Revenue</div>
                  <div className="mt-4">
                    <span className="px-4 py-2 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-lg">
                      {analytics?.overview.activeSubscriptions || 0} Active Subscriptions
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Revenue History</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4">Date</th>
                      <th className="text-right py-3 px-4">Revenue</th>
                      <th className="text-right py-3 px-4">New Subscriptions</th>
                      <th className="text-right py-3 px-4">Downloads</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics?.dailyAnalytics.slice(0, 14).map((day) => (
                      <tr key={day.date} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="py-3 px-4 font-medium">{new Date(day.date).toLocaleDateString()}</td>
                        <td className="text-right py-3 px-4 font-medium text-green-600">${Number(day.revenue).toFixed(2)}</td>
                        <td className="text-right py-3 px-4">{day.subscription_starts}</td>
                        <td className="text-right py-3 px-4">{day.downloads}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <MetricCard
                title="Total Users"
                value={analytics?.overview.totalUsers || 0}
                icon={<UsersIcon />}
                color="purple"
              />
              <MetricCard
                title="Conversion Rate"
                value={`${analytics?.overview.conversionRate || 0}%`}
                change="+2.1%"
                positive
                icon={<ChartIcon />}
                color="blue"
              />
              <MetricCard
                title="Churn Rate"
                value={`${analytics?.overview.churnRate || 0}%`}
                change="-1.2%"
                positive
                icon={<TrendingDownIcon />}
                color="red"
              />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">User Growth</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4">Date</th>
                      <th className="text-right py-3 px-4">Unique Users</th>
                      <th className="text-right py-3 px-4">New Signups</th>
                      <th className="text-right py-3 px-4">Page Views</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics?.dailyAnalytics.slice(0, 14).map((day) => (
                      <tr key={day.date} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="py-3 px-4 font-medium">{new Date(day.date).toLocaleDateString()}</td>
                        <td className="text-right py-3 px-4">{day.unique_users}</td>
                        <td className="text-right py-3 px-4 text-green-600 font-medium">+{day.signups}</td>
                        <td className="text-right py-3 px-4">{day.page_views}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Workflows Tab */}
        {activeTab === 'workflows' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Workflow Stats</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Total Workflows</span>
                    <span className="text-2xl font-bold">{analytics?.overview.totalWorkflows || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Total Downloads</span>
                    <span className="text-2xl font-bold">{analytics?.overview.totalDownloads || 0}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Trending Workflows (Last 7 days)</h3>
                <div className="space-y-3">
                  {analytics?.trendingWorkflows.slice(0, 5).map((workflow, index) => (
                    <div key={workflow.workflow_id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 flex items-center justify-center bg-purple-600 text-white text-xs rounded-full">
                            {index + 1}
                          </span>
                          <span className="font-medium">{workflow.name}</span>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 ml-8">
                          {workflow.category}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{workflow.download_count}</div>
                        <div className="text-xs text-gray-500">downloads</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search Analytics Tab */}
        {activeTab === 'search' && (
          <div className="space-y-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Popular Searches (Last 7 days)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4">Query</th>
                      <th className="text-right py-3 px-4">Searches</th>
                      <th className="text-right py-3 px-4">Avg Results</th>
                      <th className="text-right py-3 px-4">Click Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics?.popularSearches.slice(0, 20).map((search, index) => (
                      <tr key={search.query || index} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="py-3 px-4 font-medium">{search.query}</td>
                        <td className="text-right py-3 px-4">{search.search_count}</td>
                        <td className="text-right py-3 px-4">{search.avg_results_count.toFixed(0)}</td>
                        <td className="text-right py-3 px-4">
                          <span className={`px-2 py-1 rounded ${
                            search.click_rate > 0.3 ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' :
                            search.click_rate > 0.1 ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300' :
                            'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                          }`}>
                            {(search.click_rate * 100).toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Metric Card Component
function MetricCard({
  title,
  value,
  change,
  positive,
  icon,
  color
}: {
  title: string;
  value: string | number;
  change?: string;
  positive?: boolean;
  icon: React.ReactNode;
  color: string;
}) {
  const colorClasses = {
    purple: 'from-purple-500 to-purple-600',
    blue: 'from-blue-500 to-blue-600',
    pink: 'from-pink-500 to-pink-600',
    green: 'from-green-500 to-green-600',
    red: 'from-red-500 to-red-600',
    gray: 'from-gray-500 to-gray-600',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses]}`}>
          {icon}
        </div>
        {change && (
          <span className={`text-sm font-medium ${positive ? 'text-green-600' : 'text-red-600'}`}>
            {change}
          </span>
        )}
      </div>
      <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
        {value}
      </div>
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {title}
      </div>
    </div>
  );
}

// Icons
function DollarIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function TrendingUpIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );
}

function TrendingDownIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
    </svg>
  );
}

function UserIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function UsersIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function ChartIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function DownloadIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  );
}

function WorkflowIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  );
}
