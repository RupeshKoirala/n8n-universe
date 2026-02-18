import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface RealTimeStats {
  liveUsers: number;
  downloadsToday: number;
  revenueToday: number;
  lastUpdated: Date;
}

export function useRealTimeAnalytics(refreshInterval = 30000) {
  const [stats, setStats] = useState<RealTimeStats>({
    liveUsers: 0,
    downloadsToday: 0,
    revenueToday: 0,
    lastUpdated: new Date(),
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const token = session.access_token;
      const [adminRes, userRes] = await Promise.all([
        fetch('/api/analytics/admin?days=1', {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => null),
        fetch('/api/analytics/user', {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => null),
      ]);

      const adminData = adminRes ? await adminRes.json().catch(() => null) : null;
      const userData = userRes ? await userRes.json().catch(() => null) : null;

      setStats({
        liveUsers: adminData?.today?.unique_users || 0,
        downloadsToday: adminData?.today?.downloads || 0,
        revenueToday: adminData?.today?.revenue || 0,
        lastUpdated: new Date(),
      });
    } catch (error) {
      console.error('Failed to fetch real-time stats:', error);
    } finally {
      setLoading(false);
    }
  }, [refreshInterval]);

  useEffect(() => {
    fetchStats();

    const interval = setInterval(fetchStats, refreshInterval);

    return () => clearInterval(interval);
  }, [fetchStats, refreshInterval]);

  return { stats, loading, refresh: fetchStats };
}

// Real-time counter component for admin dashboard
export function LiveCounter({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
      <div className="flex-shrink-0 text-green-600 dark:text-green-400">
        {icon}
      </div>
      <div className="flex-1">
        <div className="text-sm text-green-700 dark:text-green-300">{label}</div>
        <div className="text-2xl font-bold text-green-900 dark:text-green-100">{value.toLocaleString()}</div>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-xs text-green-600 dark:text-green-400">LIVE</span>
      </div>
    </div>
  );
}

// Revenue ticker component
export function RevenueTicker({ revenue, growth }: { revenue: number; growth?: number }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg border border-green-200 dark:border-green-800">
      <div className="text-green-600 dark:text-green-400">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div className="flex-1">
        <div className="text-sm text-green-700 dark:text-green-300">Today's Revenue</div>
        <div className="text-2xl font-bold text-green-900 dark:text-green-100">${revenue.toFixed(2)}</div>
      </div>
      {growth !== undefined && (
        <div className={`text-sm font-medium ${growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {growth >= 0 ? '+' : ''}{growth.toFixed(1)}%
        </div>
      )}
    </div>
  );
}
