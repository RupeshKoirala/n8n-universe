'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface UserPreferences {
  email_notifications: boolean;
  marketing_emails: boolean;
  product_updates: boolean;
  theme: 'light' | 'dark' | 'system';
  language: string;
}

interface SecuritySettings {
  two_factor_enabled: boolean;
  email_verified: boolean;
  github_connected: boolean;
  last_login: string;
  last_password_change: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState<UserPreferences>({
    email_notifications: true,
    marketing_emails: true,
    product_updates: true,
    theme: 'system',
    language: 'en'
  });
  const [security, setSecurity] = useState<SecuritySettings | null>(null);
  const [activeTab, setActiveTab] = useState<'preferences' | 'security' | 'account'>('preferences');

  useEffect(() => {
    // Fetch user settings
    async function fetchSettings() {
      try {
        // Fetch user session
        const sessionRes = await fetch('/api/auth/session');
        const sessionData = await sessionRes.json();

        if (!sessionData.authenticated) {
          router.push('/login');
          return;
        }

        // Fetch user profile
        const profileRes = await fetch('/api/user/profile');
        const profileData = await profileRes.json();

        if (profileData.user) {
          setPreferences({
            email_notifications: profileData.user.preferences?.email_notifications ?? true,
            marketing_emails: profileData.user.preferences?.marketing_emails ?? true,
            product_updates: profileData.user.preferences?.product_updates ?? true,
            theme: (profileData.user.preferences?.theme as 'light' | 'dark' | 'system') || 'system',
            language: profileData.user.preferences?.language || 'en'
          });

          setSecurity({
            two_factor_enabled: false,
            email_verified: !!profileData.user.email,
            github_connected: !!profileData.user.github_id,
            last_login: new Date().toISOString(),
            last_password_change: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchSettings();
  }, [router]);

  const handlePreferencesUpdate = async () => {
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          preferences
        })
      });

      const data = await response.json();

      if (data.success) {
        alert('Preferences updated successfully');
      } else {
        alert('Failed to update preferences: ' + data.error);
      }
    } catch (error) {
      console.error('Failed to update preferences:', error);
      alert('Failed to update preferences. Please try again.');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const currentPassword = formData.get('current_password') as string;
    const newPassword = formData.get('new_password') as string;

    if (!currentPassword || !newPassword) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });

      const data = await response.json();

      if (data.success) {
        alert('Password changed successfully');
        e.currentTarget.reset();
      } else {
        alert('Failed to change password: ' + data.error);
      }
    } catch (error) {
      console.error('Failed to change password:', error);
      alert('Failed to change password. Please try again.');
    }
  };

  const handleAccountDelete = async () => {
    const confirmed = confirm(
      'Are you sure you want to delete your account? This action cannot be undone and will:\n\n' +
      '• Delete all your data\n' +
      '• Cancel all subscriptions\n' +
      '• Remove you from our systems\n\n' +
      'Type "DELETE" to confirm.'
    );

    if (confirmed !== 'DELETE') {
      return;
    }

    try {
      const response = await fetch('/api/user/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        alert('Account deleted successfully');
        router.push('/login');
      } else {
        alert('Failed to delete account: ' + data.error);
      }
    } catch (error) {
      console.error('Failed to delete account:', error);
      alert('Failed to delete account. Please try again.');
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
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Settings
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Customize your experience and manage your account
            </p>
          </div>

          {/* Tabs */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg mb-8">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="flex gap-8" aria-label="Settings tabs">
                <button
                  onClick={() => setActiveTab('preferences')}
                  className={`flex-1 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'preferences'
                      ? 'border-purple-600 text-purple-600'
                      : 'border-transparent text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Preferences
                </button>
                <button
                  onClick={() => setActiveTab('security')}
                  className={`flex-1 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'security'
                      ? 'border-purple-600 text-purple-600'
                      : 'border-transparent text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Security
                </button>
                <button
                  onClick={() => setActiveTab('account')}
                  className={`flex-1 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'account'
                      ? 'border-purple-600 text-purple-600'
                      : 'border-transparent text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Account
                </button>
              </nav>
            </div>

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div className="p-8 space-y-8">
                <div>
                  <h2 className="text-2xl font-semibold mb-6">Appearance</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Theme
                      </label>
                      <select
                        value={preferences.theme}
                        onChange={(e) => setPreferences({ ...preferences, theme: e.target.value as 'light' | 'dark' | 'system' })}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="system">System (match device)</option>
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Language
                      </label>
                      <select
                        value={preferences.language}
                        onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="en">English</option>
                        <option value="es">Español</option>
                        <option value="fr">Français</option>
                        <option value="de">Deutsch</option>
                        <option value="ja">日本語</option>
                        <option value="zh">中文</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-2xl font-semibold mb-6">Notifications</h2>
                  <div className="space-y-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={preferences.email_notifications}
                        onChange={(e) => setPreferences({ ...preferences, email_notifications: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-2 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Email notifications for account activity
                      </span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={preferences.marketing_emails}
                        onChange={(e) => setPreferences({ ...preferences, marketing_emails: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-2 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Marketing emails and promotional offers
                      </span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={preferences.product_updates}
                        onChange={(e) => setPreferences({ ...preferences, product_updates: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-2 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Product updates and new feature announcements
                      </span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={handlePreferencesUpdate}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
                  >
                    Save Preferences
                  </button>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && security && (
              <div className="p-8 space-y-8">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-4">Account Security Status</h3>
                  <div className="space-y-2 text-sm text-green-800 dark:text-green-200">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${security.email_verified ? 'bg-green-600' : 'bg-gray-400'}`}></div>
                      <span>Email verified</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${security.github_connected ? 'bg-green-600' : 'bg-gray-400'}`}></div>
                      <span>GitHub connected</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                      <span>Two-factor authentication (coming soon)</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-2xl font-semibold mb-6">Change Password</h2>
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Current Password
                      </label>
                      <input
                        type="password"
                        name="current_password"
                        required
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Enter your current password"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        name="new_password"
                        required
                        minLength={8}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Enter your new password (min 8 characters)"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
                    >
                      Change Password
                    </button>
                  </form>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">Password Requirements</h3>
                  <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
                    <li>• Minimum 8 characters</li>
                    <li>• At least one uppercase letter</li>
                    <li>• At least one number</li>
                    <li>• Not the same as your last 3 passwords</li>
                  </ul>
                </div>

                <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Login Activity</h3>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <div className="text-sm space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">Last login</span>
                        <span className="text-gray-900 dark:text-white font-medium">
                          {security.last_login ? new Date(security.last_login).toLocaleString() : 'Never'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">Password changed</span>
                        <span className="text-gray-900 dark:text-white font-medium">
                          {security.last_password_change ? new Date(security.last_password_change).toLocaleString() : 'Never'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Account Tab */}
            {activeTab === 'account' && security && (
              <div className="p-8 space-y-8">
                <div className="bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-2">Account Information</h3>
                  <div className="text-sm text-purple-800 dark:text-purple-200">
                    <div>• Manage your personal details</div>
                    <div>• Update your profile information</div>
                    <div>• Link/unlink social accounts</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <button
                    onClick={() => router.push('/profile')}
                    className="w-full px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-between"
                  >
                    <span>Edit Profile</span>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => router.push('/profile')}
                    className="w-full px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-between"
                  >
                    <span>Manage Subscription</span>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => router.push('/profile')}
                    className="w-full px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-between"
                  >
                    <span>Download History</span>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Danger Zone</h3>
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-6 border border-red-200 dark:border-red-800">
                    <h4 className="text-md font-semibold text-red-900 dark:text-red-100 mb-2">Delete Your Account</h4>
                    <p className="text-sm text-red-800 dark:text-red-200 mb-4">
                      Deleting your account will permanently remove all your data and cancel any active subscriptions. This action cannot be undone.
                    </p>
                    <button
                      onClick={handleAccountDelete}
                      className="px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
