// Utility function untuk authenticated API calls
export const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
  // Get token from localStorage
  const token = localStorage.getItem('auth_token');
  
  // Prepare headers
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  // Add authorization header if token exists
  if (token) {
    (headers as any)['Authorization'] = `Bearer ${token}`;
  }
  
  // Make the request
  const response = await fetch(url, {
    ...options,
    headers,
  });
  
  // Check for authentication errors
  if (response.status === 401) {
    // Token might be expired, remove it
    localStorage.removeItem('auth_token');
    // Redirect to login or show error
    console.error('Authentication failed - redirecting to login');
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw new Error('Authentication required');
  }
  
  return response;
};

// Wrapper for GET requests
export const authenticatedGet = async (url: string) => {
  return authenticatedFetch(url, { method: 'GET' });
};

// Wrapper for POST requests
export const authenticatedPost = async (url: string, data: any) => {
  return authenticatedFetch(url, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

// Wrapper for PUT requests
export const authenticatedPut = async (url: string, data: any) => {
  return authenticatedFetch(url, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

// Wrapper for DELETE requests
export const authenticatedDelete = async (url: string) => {
  return authenticatedFetch(url, { method: 'DELETE' });
};