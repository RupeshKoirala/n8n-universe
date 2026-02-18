'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface UserAnalytics {
  total_downloads: number;
  total_searches: number;
  total_page_views: number;
  favorite_workflows_count: number;
  saved_searches_count: number;
  downloads_this_month: number;
  avg_daily_downloads: number;
}

interface Download {
  id: string;
  downloaded_at: string;
  workflows: {
    id: string;
    name: string;
    description: string;
    category: string;
    complexity: string;
    difficulty: string;
    price: number;
    rating: number;
    popularity: number;
  };
}

interface Favorite {
  id: string;
  created_at: string;
  workflows: {
    id: string;
    name: string;
    description: string;
    category: string;
    complexity: string;
    difficulty: string;
    price: number;
    rating: number;
    popularity: number;
  };
}

interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: Record<string, any>;
  usage_count: number;
  is_public: boolean;
  created_at: string;
}

interface ChartData {
  downloadsByDate: Array<{ date: string; count: number }>;
  downloadsByCategory: Array<{ category: string; count: number }>;
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null);
  const [downloads, setDownloads] = useState<Download[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [charts, setCharts] = useState<ChartData>({ downloadsByDate: [], downloadsByCategory: [] });
  const [activeTab, setActiveTab] = useState<'overview' | 'downloads' | 'favorites' | 'searches'>('overview');
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        // Get session
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (!currentSession) {
          router.push('/login');
          return;
        }
        setSession(currentSession);

        // Fetch analytics data
        const token = currentSession.access_token;
        const [analyticsRes, downloadsRes, favoritesRes, searchesRes] = await Promise.all([
          fetch('/api/analytics/user', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch('/api/downloads/history', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch('/api/favorites', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch('/api/saved-searches', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        const analyticsData = await analyticsRes.json();
        const downloadsData = await downloadsRes.json();
        const favoritesData = await favoritesRes.json();
        const searchesData = await searchesRes.json();

        if (analyticsData) {
          setAnalytics(analyticsData.user);
          setCharts(analyticsData.charts || { downloadsByDate: [], downloadsByCategory: [] });
        }
        if (downloadsData.downloads) setDownloads(downloadsData.downloads);
        if (favoritesData.favorites) setFavorites(favoritesData.favorites);
        if (searchesData.saved_searches) setSavedSearches(searchesData.saved_searches);

      } catch (error) {
        console.error('Failed to load dashboard:', error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [router]);

  const handleRemoveFavorite = async (favoriteId: string) => {
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      const token = currentSession.access_token;

      const response = await fetch(`/api/favorites/${favoriteId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        setFavorites(favorites.filter(f => f.id !== favoriteId));
      }
    } catch (error) {
      console.error('Failed to remove favorite:', error);
    }
  };

  const handleDeleteSavedSearch = async (searchId: string) => {
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      const token = currentSession.access_token;

      const response = await fetch(`/api/saved-searches/${searchId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        setSavedSearches(savedSearches.filter(s => s.id !== searchId));
      }
    } catch (error) {
      console.error('Failed to delete saved search:', error);
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
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            My Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Track your activity and manage your account
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="flex space-x-4 border-b border-gray-200 dark:border-gray-700">
            {[
              { id: 'overview' as const, label: 'Overview' },
              { id: 'downloads' as const, label: `Downloads (${downloads.length})` },
              { id: 'favorites' as const, label: `Favorites (${favorites.length})` },
              { id: 'searches' as const, label: `Saved Searches (${savedSearches.length})` }
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
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Downloads"
                value={analytics?.total_downloads || 0}
                icon={<DownloadIcon />}
                color="purple"
              />
              <StatCard
                title="Downloads This Month"
                value={analytics?.downloads_this_month || 0}
                icon={<CalendarIcon />}
                color="blue"
              />
              <StatCard
                title="Favorites"
                value={analytics?.favorite_workflows_count || 0}
                icon={<HeartIcon />}
                color="pink"
              />
              <StatCard
                title="Saved Searches"
                value={analytics?.saved_searches_count || 0}
                icon={<SearchIcon />}
                color="green"
              />
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Recent Downloads</h3>
                {downloads.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400">No downloads yet</p>
                ) : (
                  <div className="space-y-3">
                    {downloads.slice(0, 5).map((download) => (
                      <Link
                        key={download.id}
                        href={`/workflows/${download.workflows.id}`}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {download.workflows.name}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {download.workflows.category}
                          </p>
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(download.downloaded_at).toLocaleDateString()}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
                {downloads.length > 5 && (
                  <button
                    onClick={() => setActiveTab('downloads')}
                    className="mt-4 text-purple-600 hover:text-purple-700 font-medium text-sm"
                  >
                    View all downloads →
                  </button>
                )}
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Usage by Category</h3>
                {charts.downloadsByCategory.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400">No data yet</p>
                ) : (
                  <div className="space-y-3">
                    {charts.downloadsByCategory.slice(0, 5).map((item) => {
                      const maxCount = Math.max(...charts.downloadsByCategory.map(d => d.count));
                      const percentage = (item.count / maxCount) * 100;
                      return (
                        <div key={item.category}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-700 dark:text-gray-300">{item.category}</span>
                            <span className="text-gray-500">{item.count}</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-purple-600 h-2 rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Downloads Tab */}
        {activeTab === 'downloads' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Download History</h3>
            {downloads.length === 0 ? (
              <div className="text-center py-12">
                <DownloadIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500 dark:text-gray-400 mb-4">No downloads yet</p>
                <Link
                  href="/workflows"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
                >
                  Browse Workflows
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {downloads.map((download) => (
                  <Link
                    key={download.id}
                    href={`/workflows/${download.workflows.id}`}
                    className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {download.workflows.name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {download.workflows.category} • {download.workflows.complexity} • {download.workflows.difficulty}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-yellow-500">★</span>
                        <span className="text-sm font-medium">{download.workflows.rating.toFixed(1)}</span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(download.downloaded_at).toLocaleDateString()}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Favorites Tab */}
        {activeTab === 'favorites' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Favorite Workflows</h3>
            {favorites.length === 0 ? (
              <div className="text-center py-12">
                <HeartIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500 dark:text-gray-400 mb-4">No favorites yet</p>
                <Link
                  href="/workflows"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
                >
                  Browse Workflows
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {favorites.map((favorite) => (
                  <div
                    key={favorite.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <Link
                        href={`/workflows/${favorite.workflows.id}`}
                        className="font-medium text-gray-900 dark:text-white hover:text-purple-600"
                      >
                        {favorite.workflows.name}
                      </Link>
                      <button
                        onClick={() => handleRemoveFavorite(favorite.id)}
                        className="text-red-500 hover:text-red-600"
                        title="Remove from favorites"
                      >
                        <HeartIcon className="w-5 h-5 fill-current" />
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                      {favorite.workflows.description}
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded">
                        {favorite.workflows.category}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-500">★</span>
                        <span>{favorite.workflows.rating.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Saved Searches Tab */}
        {activeTab === 'searches' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Saved Searches</h3>
            {savedSearches.length === 0 ? (
              <div className="text-center py-12">
                <SearchIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500 dark:text-gray-400 mb-4">No saved searches yet</p>
                <Link
                  href="/workflows"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
                >
                  Start Searching
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {savedSearches.map((search) => (
                  <div
                    key={search.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">{search.name}</h4>
                        {search.is_public && (
                          <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs rounded">
                            Public
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Query: {search.query || 'All'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        Used {search.usage_count} times • Saved {new Date(search.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/workflows?search=${encodeURIComponent(search.query || '')}`}
                        className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        Use
                      </Link>
                      <button
                        onClick={() => handleDeleteSavedSearch(search.id)}
                        className="px-3 py-1.5 border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 text-sm rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ title, value, icon, color }: { title: string; value: number; icon: React.ReactNode; color: string }) {
  const colorClasses = {
    purple: 'from-purple-500 to-purple-600',
    blue: 'from-blue-500 to-blue-600',
    pink: 'from-pink-500 to-pink-600',
    green: 'from-green-500 to-green-600',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses]}`}>
          {icon}
        </div>
      </div>
      <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
        {value.toLocaleString()}
      </div>
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {title}
      </div>
    </div>
  );
}

// Icons
function DownloadIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  );
}

function CalendarIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function HeartIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  );
}

function SearchIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}
