// /app/api/dashboardService.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const dashboardService = {
  getDashboard: async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const res = await fetch(`${API_URL}/analytics/dashboard`, { 
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!res.ok) {
      if (res.status === 401) {
        throw new Error('Authentication failed. Please login again.');
      }
      throw new Error(`Failed to fetch dashboard: ${res.status}`);
    }
    return res.json();
  },
  
  getRecentActivity: async (limit = 20) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const res = await fetch(`${API_URL}/analytics/activity?limit=${limit}`, { 
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!res.ok) {
      if (res.status === 401) {
        throw new Error('Authentication failed. Please login again.');
      }
      throw new Error(`Failed to fetch recent activity: ${res.status}`);
    }
    return res.json();
  },
  // Bisa ditambah endpoint lain jika dibutuhkan
};
