import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    console.warn('[API DEBUG] Test auth request for:', email)
    
    const authUrl = 'http://localhost:5536'
    const anokey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
    
    const response = await fetch(`${authUrl}/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': anokey,
        'Authorization': `Bearer ${anokey}`,
      },
      body: JSON.stringify({ email, password })
    })

    console.warn('[API DEBUG] Auth response status:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API DEBUG] Auth _error:', errorText)
      return NextResponse.json({ success: false, _error: errorText }, { status: response.status })
    }

    const data = await response.json()
    console.warn('[API DEBUG] Auth success:', { hasUser: !!data.user, hasToken: !!data.access_token })
    
    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error('[API DEBUG] Server _error:', err)
    return NextResponse.json({ success: false, _error: 'Server error' }, { status: 500 })
  }
}
