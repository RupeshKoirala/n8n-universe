'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface UserProfile {
  id: string;
  email: string;
  github_id?: string;
  github_username?: string;
  avatar_url?: string;
  username?: string;
  subscription_tier: 'free' | 'basic' | 'pro' | 'enterprise';
  subscription_ends_at: string | null;
  preferences?: {
    email_notifications: boolean;
    marketing_emails: boolean;
    product_updates: boolean;
  };
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    avatar_url: '',
    email_notifications: true,
    marketing_emails: true,
    product_updates: true
  });

  useEffect(() => {
    // Fetch user profile
    async function fetchProfile() {
      try {
        const response = await fetch('/api/auth/session');
        const data = await response.json();

        if (data.authenticated && data.user) {
          setUser(data.user);
          setFormData({
            username: data.user.username || '',
            avatar_url: data.user.avatar_url || '',
            email_notifications: data.user.preferences?.email_notifications ?? true,
            marketing_emails: data.user.preferences?.marketing_emails ?? true,
            product_updates: data.user.preferences?.product_updates ?? true
          });
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.user) {
        setUser(data.user);
        setEditMode(false);
      } else {
        alert('Failed to update profile: ' + data.error);
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile. Please try again.');
    }
  };

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/signout', {
        method: 'POST'
      });
      router.push('/login');
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  const handleGitHubLogin = () => {
    window.location.href = '/api/auth/github';
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
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Profile
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Manage your account settings and preferences
            </p>
          </div>

          {/* Profile Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.username || 'User'}
                    className="w-20 h-20 rounded-full"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                    {user?.username?.[0]?.toUpperCase() || user?.email[0]?.toUpperCase()}
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    {user?.username || user?.email}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300">
                    {user?.email}
                  </p>
                  {user?.github_username && (
                    <div className="flex items-center gap-2 mt-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12s5.373 12 12 12 5.373 12 12-5.373-12-5.373-12-12-5.373-12zm-1.5-.044c.747.0 1.45.665 1.5 1.5.435 0-.695-.665-1.5-1.535.354-1.5-1.5zm12.757 13.743l.009-2.537c-.325-.074-.766.248-1.123.08-1.247.633-.576 1.06-1.575.15.238.15.238-.318.046-.642-.287-1.025-.597.49-1.348-1.348-1.015-.447.726.726-1.347.726-1.548.434-2.046-2.046-.394-.638-2.273-1.548-4.748-4.748-1.015-.394.447.726.726-1.347.726zm-1.015.394c.325.337.335.347.335.347.335.347.335-.347-.335-.347.335-.347.335-.347-335.347zm4.484 4.484l.039.396.039.396c.325.337.335.347.335.347.335.347.335.347.335-.347.335-.347.335.347.335-.347.335-.347zm-.347-.347c.325.337.335.347.335.347.335.347.335.347.335-.347.335-.347.335-.347.335-.347.335-.347.335-.347zm4.484 4.484l-.027.396.027-.396c.325.337.335.347.335.347.335-.347.335-.347.335.347.335-.347.335-.347.335-.347.335-.347zm-.347-.347c.325.337.335.347.335-.347.335-.347.335.347.335-.347.335-.347.335-.347.335-.347.335-.347z"/>
                      </svg>
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        @{user.github_username}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              {!editMode && (
                <button
                  onClick={() => setEditMode(true)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
                >
                  Edit Profile
                </button>
              )}
            </div>

            {/* Subscription Info */}
            <div className="bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900 dark:to-blue-900 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold mb-2">Current Plan</h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="text-3xl font-bold capitalize text-purple-700 dark:text-purple-300">
                    {user?.subscription_tier}
                  </div>
                  {user?.subscription_ends_at && (
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      Renews {new Date(user.subscription_ends_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <Link
                  href="/pricing"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors text-sm"
                >
                  Upgrade Plan
                </Link>
              </div>
            </div>

            {/* Edit Form */}
            {editMode && (
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Choose a username"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Avatar URL
                  </label>
                  <input
                    type="url"
                    value={formData.avatar_url}
                    onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter avatar URL"
                  />
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Notifications
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.email_notifications}
                        onChange={(e) => setFormData({ ...formData, email_notifications: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-2 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Email notifications
                      </span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.marketing_emails}
                        onChange={(e) => setFormData({ ...formData, marketing_emails: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-2 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Marketing emails
                      </span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.product_updates}
                        onChange={(e) => setFormData({ ...formData, product_updates: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-2 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Product updates
                      </span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setEditMode(false)}
                    className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            )}

            {/* GitHub Connection */}
            {!user?.github_id && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-lg font-semibold mb-4">Connect Your Account</h3>
                <div className="flex gap-4">
                  <button
                    onClick={handleGitHubLogin}
                    className="flex-1 px-4 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12s5.373 12 12 12 5.373 12 12-5.373 12-5.373-12-12-5.373-12zm-1.5-.044c.747.0 1.45.665 1.5 1.5.435 0-.695-.665-1.5-1.535.354-1.5-1.5zm12.757 13.743l.009-2.537c-.325-.074-.766.248-1.123.08-1.247.633-.576 1.06-1.575.15.238.15.238-.318.046-.642-.287-1.025-.597.49-1.348-1.348-1.015-.447.726.726-1.347.726zm-1.015.394c.325.337.335.347.335.347.335.347.335-.347.335-.347.335-.347.335-.347.335-.347.335-.347zm4.484 4.484l.039.396.039.396c.325.337.335.347.335.347.335.347.335-.347.335-.347.335-.347.335-.347.335-.347zm-.347-.347c.325.337.335.347.335.347.335-.347.335-.347.335-.347.335-.347.335-.347.335-.347.335-.347zm4.484 4.484l-.027.396.027-.396c.325.337.335.347.335-.347.335-.347.335-.347.335-.347.335-.347.335-.347zm-.347-.347c.325.337.335.347.335-.347.335-.347.335-.347.335-.347.335-.347.335-.347.335-.347z"/>
                    Connect with GitHub
                  </button>
                  <button
                    onClick={() => router.push('/login')}
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Sign In
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link
              href="/settings"
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow block"
            >
              <h3 className="text-lg font-semibold mb-2">Settings</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Configure your account preferences and security
              </p>
            </Link>
            <Link
              href="/dashboard"
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow block"
            >
              <h3 className="text-lg font-semibold mb-2">My Dashboard</h3>
              <p className="text-gray-600 dark:text-gray-300">
                View your downloads and subscription
              </p>
            </Link>
          </div>

          {/* Danger Zone */}
          <div className="mt-8">
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6 border border-red-200 dark:border-red-800">
              <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-4">Danger Zone</h3>
              <div className="space-y-4">
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors w-full sm:w-auto"
                >
                  Sign Out
                </button>
                <button className="px-4 py-2 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors w-full sm:w-auto">
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
