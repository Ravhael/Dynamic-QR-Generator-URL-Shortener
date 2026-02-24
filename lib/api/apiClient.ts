import axios from 'axios'

// API CLIENT WITH ENHANCED AUTHENTICATION SUPPORT
const apiClient = axios.create({
  baseURL: 'http://localhost:3000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // This enables sending cookies with requests
})

// Helper function to get auth token from multiple sources
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  // Try different token naming conventions for compatibility
  const token = localStorage.getItem('auth_token') || 
                localStorage.getItem('authToken') || 
                localStorage.getItem('scanly_token');
  
  return token;
}

// Add request interceptor to include auth token from localStorage and cookies
apiClient.interceptors.request.use(
  (config) => {
    console.log('[API CLIENT] Making request to:', config.url);
    
    // First try to get token from localStorage (primary method)
    let token = getAuthToken();
    
    // If no localStorage token, try cookies (fallback)
    if (!token && typeof document !== 'undefined') {
      const cookies = document.cookie.split(';')
      const authCookie = cookies.find(cookie => 
        cookie.trim().startsWith('auth_token=') ||
        cookie.trim().startsWith('token=') ||
        cookie.trim().startsWith('scanly_auth=')
      );
      
      if (authCookie) {
        token = authCookie.split('=')[1];
      }
    }
    
    // Add Authorization header if token exists
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('[API CLIENT] Added Authorization header');
    } else {
      console.warn('[API CLIENT] No auth token found');
    }
    
    return config
  },
  (error) => {
    console.error('[API CLIENT] Request interceptor error:', error);
    return Promise.reject(error)
  }
)

// Add response interceptor for better error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log('[API CLIENT] Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      console.warn('[API CLIENT] 401 Unauthorized - clearing auth tokens');
      
      // Clear all possible token storage locations
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('authToken');
        localStorage.removeItem('scanly_token');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('scanly_user');
      }
      
      // Could redirect to login page here if needed
      // window.location.href = '/login';
    }
    
    console.error('[API CLIENT] Response error:', error.response?.status, error.response?.data);
    return Promise.reject(error)
  }
)

export default apiClient
