// /services/api/dashboardService.ts
export const dashboardService = {
  getDashboard: async () => {
    const res = await fetch('/api/analytics/dashboard', { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch dashboard');
    return res.json();
  },
  // Bisa ditambah endpoint lain jika dibutuhkan
};
