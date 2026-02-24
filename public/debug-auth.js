// Debug script untuk test auth connection
console.warn('=== SUPABASE AUTH DEBUG ===');
console.warn('Auth URL:', process.env.NEXT_PUBLIC_SUPABASE_AUTH_URL);
console.warn('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.warn('Anon Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

// Test fetch langsung ke auth endpoint
async function testAuthEndpoint() {
    const authUrl = 'http://localhost:5536';
    const anokey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
    
    console.warn('Testing direct auth endpoint...');
    
    try {
        // Test health endpoint
        const healthResponse = await fetch(`${authUrl}/health`);
        console.warn('Health check:', healthResponse.status, await healthResponse.text());
        
        // Test login
        const loginResponse = await fetch(`${authUrl}/token?grant_type=password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': anokey,
                'Authorization': `Bearer ${anokey}`
            },
            body: JSON.stringify({
                email: 'admin@scanly.indovisual.co.id',
                password: 'admin123'
            })
        });
        
        console.warn('Login test:', loginResponse.status);
        const loginData = await loginResponse.text();
        console.warn('Login response:', loginData);
        
    } catch (_error) {
        console.error('Auth test failed:', error);
    }
}

// Run test
testAuthEndpoint();
