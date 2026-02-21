'use client';

import React, { useEffect, useState } from 'react';
import { Metadata } from 'next';
import { Copy, Share2, Gift, TrendingUp, Users, Award } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Referrals - Earn Credits',
  description: 'Invite friends and earn $10 credit for each sign-up. Unlimited referrals!',
};

export default function ReferralsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  useEffect(() => {
    fetchStats();
    fetchLeaderboard();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/referrals/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch('/api/referrals/leaderboard?limit=10');
      const data = await response.json();
      setLeaderboard(data.leaderboard || []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  const copyReferralLink = () => {
    if (stats?.referral_link) {
      navigator.clipboard.writeText(stats.referral_link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareReferralLink = async () => {
    if (stats?.referral_link) {
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'Join n8n Automation Marketplace',
            text: 'Get $10 credit when you sign up with my link!',
            url: stats.referral_link,
          });
        } catch (error) {
          console.error('Error sharing:', error);
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      {/* Hero */}
      <section className="pt-16 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center">
              <Gift className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Invite Friends, Earn Credits
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get <span className="font-bold text-purple-600">$10</span> credit for each friend who signs up.
            Your friend gets <span className="font-bold text-purple-600">$10</span> too!
          </p>
        </div>
      </section>

      {/* Stats Cards */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-md p-6 text-center">
              <Users className="w-8 h-8 text-purple-600 mx-auto mb-3" />
              <div className="text-3xl font-bold text-gray-900">{stats?.stats?.total_referrals || 0}</div>
              <div className="text-gray-600 mt-1">Total Referrals</div>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6 text-center">
              <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-3" />
              <div className="text-3xl font-bold text-gray-900">{stats?.stats?.completed_referrals || 0}</div>
              <div className="text-gray-600 mt-1">Successful</div>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6 text-center">
              <Award className="w-8 h-8 text-yellow-600 mx-auto mb-3" />
              <div className="text-3xl font-bold text-gray-900">${stats?.stats?.total_credits || 0}</div>
              <div className="text-gray-600 mt-1">Credits Earned</div>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6 text-center">
              <Gift className="w-8 h-8 text-purple-600 mx-auto mb-3" />
              <div className="text-3xl font-bold text-gray-900">${stats?.stats?.available_credits || 0}</div>
              <div className="text-gray-600 mt-1">Available</div>
            </div>
          </div>
        </div>
      </section>

      {/* Referral Link */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-purple-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
              Your Referral Link
            </h2>
            <div className="flex gap-3">
              <input
                type="text"
                value={stats?.referral_link || ''}
                readOnly
                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900"
              />
              <button
                onClick={copyReferralLink}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <span className="w-5 h-5 flex items-center justify-center">
                      ✓
                    </span>
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    Copy
                  </>
                )}
              </button>
              <button
                onClick={shareReferralLink}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-2"
              >
                <Share2 className="w-5 h-5" />
                Share
              </button>
            </div>
            {stats?.referral_code && (
              <p className="text-sm text-gray-500 mt-4 text-center">
                Your referral code: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{stats.referral_code}</span>
              </p>
            )}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Three simple steps to earn credits
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Share2 className="w-10 h-10 text-purple-600" />
              </div>
              <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Share Your Link</h3>
              <p className="text-gray-600">
                Share your unique referral link with friends, colleagues, or on social media.
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-10 h-10 text-purple-600" />
              </div>
              <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Friends Sign Up</h3>
              <p className="text-gray-600">
                When they sign up using your link, they get $10 credit on their account.
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Gift className="w-10 h-10 text-purple-600" />
              </div>
              <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">You Earn Credits</h3>
              <p className="text-gray-600">
                You get $10 credit for each successful referral. Use credits on future purchases!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Referral History */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Referral History</h2>

          {stats?.referrals && stats.referrals.length > 0 ? (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Credits</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {stats.referrals.map((referral: any) => (
                    <tr key={referral.id}>
                      <td className="px-6 py-4 text-gray-900">
                        {referral.referee?.name || 'Pending'}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {referral.referee?.email || '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          referral.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {referral.status.charAt(0).toUpperCase() + referral.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-900">
                        ${referral.credits_earned || 0}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {new Date(referral.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-md p-8 text-center">
              <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No referrals yet</h3>
              <p className="text-gray-600">
                Share your link to start earning credits!
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Credit History */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Credit History</h2>

          {stats?.credit_history && stats.credit_history.length > 0 ? (
            <div className="space-y-3">
              {stats.credit_history.map((credit: any) => (
                <div
                  key={credit.id}
                  className="flex items-center justify-between bg-gray-50 rounded-lg p-4"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{credit.description}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(credit.created_at).toLocaleString()}
                    </p>
                  </div>
                  <span className={`text-lg font-bold ${
                    credit.amount > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {credit.amount > 0 ? '+' : ''}${credit.amount}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-md p-8 text-center border border-gray-200">
              <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No credit history</h3>
              <p className="text-gray-600">
                Earn credits by referring friends!
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Leaderboard */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Top Referrers
            </h2>
            <p className="text-xl text-gray-600">
              See who's leading the pack
            </p>
          </div>

          {leaderboard.length > 0 ? (
            <div className="bg-white rounded-xl shadow-md overflow-hidden max-w-2xl mx-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Rank</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">User</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Referrals</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Credits</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {leaderboard.map((item, index) => (
                    <tr key={item.user_id} className={index < 3 ? 'bg-purple-50' : ''}>
                      <td className="px-6 py-4">
                        {index === 0 && '🥇'}
                        {index === 1 && '🥈'}
                        {index === 2 && '🥉'}
                        {index > 2 && index + 1}
                      </td>
                      <td className="px-6 py-4 text-gray-900">
                        {item.user_name || 'Anonymous'}
                      </td>
                      <td className="px-6 py-4 text-gray-900">
                        {item.completed_referrals}
                      </td>
                      <td className="px-6 py-4 text-gray-900 font-bold">
                        ${item.total_credits}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-md p-8 text-center max-w-2xl mx-auto">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Leaderboard is empty</h3>
              <p className="text-gray-600">
                Be the first to refer friends and earn credits!
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Terms */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Terms & Conditions</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• Both referrer and referee receive $10 credit upon successful signup</li>
            <li>• Credits can be applied to any subscription or workflow purchase</li>
            <li>• Referrals must be real users (no fake accounts allowed)</li>
            <li>• Unused credits expire after 12 months</li>
            <li>• We reserve the right to remove credits for fraudulent activity</li>
            <li>• Unlimited referrals - no cap on earnings!</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
