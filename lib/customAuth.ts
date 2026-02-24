// Custom auth service dengan mock authentication
export const customAuthService = {
  async login(email: string, password: string) {
    try {
      console.warn('[CUSTOM AUTH] Attempting login via simple API for:', email);
      
      // Use simple login API route
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });

      console.warn('[CUSTOM AUTH] Response status:', response.status);
      
      const result = await response.json();
      console.warn('[CUSTOM AUTH] Login result:', { success: result.success, hasData: !!result.data });
      
      if (result.success && result.data) {
        console.warn('[CUSTOM AUTH] Login successful for user:', result.data.user.email);
        return { success: true, data: result.data };
      } else {
        console.error('[CUSTOM AUTH] Login failed:', result.error);
        return { success: false, _error: result.error || 'Login failed' };
      }
    } catch (_error) {
      console.error('[CUSTOM AUTH] Login _error:', _error);
      return { success: false, _error: (_error as Error).message };
    }
  }
};
