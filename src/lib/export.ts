/**
 * Export utility for analytics data
 */

export interface ExportOptions {
  format: 'csv' | 'json';
  filename?: string;
  includeHeaders?: boolean;
}

/**
 * Convert array of objects to CSV
 */
export function arrayToCSV(data: Record<string, any>[], options: ExportOptions = {}): string {
  const { includeHeaders = true } = options;

  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const headerRow = includeHeaders ? headers.join(',') + '\n' : '';

  const rows = data.map(row =>
    headers.map(header => {
      const value = row[header];
      // Handle nested objects, arrays, and special characters
      if (value === null || value === undefined) {
        return '';
      }
      if (typeof value === 'object') {
        return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      }
      // Escape quotes and wrap in quotes if contains comma, newline, or quote
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    }).join(',')
  );

  return headerRow + rows.join('\n');
}

/**
 * Download data as file
 */
export function downloadAsFile(data: string, filename: string, mimeType: string): void {
  const blob = new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export analytics data
 */
export function exportAnalytics(
  data: Record<string, any>[],
  options: ExportOptions = {}
): void {
  const {
    format = 'csv',
    filename = `analytics-${new Date().toISOString().split('T')[0]}`,
  } = options;

  if (format === 'csv') {
    const csv = arrayToCSV(data, options);
    downloadAsFile(csv, `${filename}.csv`, 'text/csv');
  } else if (format === 'json') {
    const json = JSON.stringify(data, null, 2);
    downloadAsFile(json, `${filename}.json`, 'application/json');
  }
}

/**
 * Generate daily analytics report
 */
export function generateDailyReport(dailyAnalytics: any[]) {
  return dailyAnalytics.map(day => ({
    date: day.date,
    uniqueUsers: day.unique_users,
    pageViews: day.page_views,
    downloads: day.downloads,
    searches: day.searches,
    signups: day.signups,
    subscriptionStarts: day.subscription_starts,
    revenue: Number(day.revenue).toFixed(2),
  }));
}

/**
 * Generate user activity report
 */
export function generateUserActivityReport(users: any[], downloads: any[], events: any[]) {
  return users.map(user => {
    const userDownloads = downloads.filter((d: any) => d.user_id === user.id);
    const userEvents = events.filter((e: any) => e.user_id === user.id);

    return {
      userId: user.id,
      email: user.email,
      subscriptionTier: user.subscription_tier,
      joinDate: user.created_at,
      totalDownloads: userDownloads.length,
      totalEvents: userEvents.length,
      lastActivity: userEvents.length > 0
        ? userEvents.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
        : null,
    };
  });
}

/**
 * Generate workflow performance report
 */
export function generateWorkflowReport(workflows: any[], downloads: any[], events: any[]) {
  return workflows.map(workflow => {
    const workflowDownloads = downloads.filter((d: any) => d.workflow_id === workflow.id);
    const workflowViews = events.filter((e: any) =>
      e.event_type === 'workflow_view' && e.properties?.workflow_id === workflow.id
    );

    return {
      workflowId: workflow.id,
      name: workflow.name,
      category: workflow.category,
      complexity: workflow.complexity,
      difficulty: workflow.difficulty,
      price: workflow.price,
      rating: workflow.rating,
      totalDownloads: workflowDownloads.length,
      totalViews: workflowViews.length,
      conversionRate: workflowViews.length > 0
        ? ((workflowDownloads.length / workflowViews.length) * 100).toFixed(2) + '%'
        : '0%',
      revenue: (workflowDownloads.length * workflow.price).toFixed(2),
      createdAt: workflow.created_at,
    };
  });
}

/**
 * Generate search analytics report
 */
export function generateSearchReport(searches: any[]) {
  return searches.map(search => ({
    query: search.query,
    searchCount: search.search_count,
    avgResults: search.avg_results_count,
    clickRate: (search.click_rate * 100).toFixed(2) + '%',
    firstSearched: searches
      .filter(s => s.query === search.query)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0]?.created_at,
    lastSearched: searches
      .filter(s => s.query === search.query)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]?.created_at,
  }));
}

/**
 * Generate revenue report
 */
export function generateRevenueReport(dailyAnalytics: any[], subscriptions: any[]) {
  const dailyRevenue = dailyAnalytics.map(day => ({
    date: day.date,
    revenue: Number(day.revenue).toFixed(2),
    subscriptionRevenue: (day.subscription_starts * 19).toFixed(2), // Assuming $19/mo avg
    oneTimeRevenue: (Number(day.revenue) - day.subscription_starts * 19).toFixed(2),
  }));

  const byTier = subscriptions.reduce((acc: any, sub: any) => {
    const tier = sub.tier;
    if (!acc[tier]) {
      acc[tier] = { count: 0, revenue: 0 };
    }
    acc[tier].count++;
    acc[tier].revenue += sub.amount;
    return acc;
  }, {});

  return {
    daily: dailyRevenue,
    byTier: Object.entries(byTier).map(([tier, data]: [string, any]) => ({
      tier,
      count: data.count,
      revenue: data.revenue.toFixed(2),
    })),
    total: dailyAnalytics.reduce((sum, day) => sum + Number(day.revenue), 0).toFixed(2),
  };
}
