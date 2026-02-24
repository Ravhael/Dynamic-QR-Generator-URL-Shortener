# Test login admin setelah update password
Write-Host "Testing admin login..." -ForegroundColor Yellow

$loginBody = @{
    email = "admin@scanly.indovisual.co.id"
    password = "admin123"
} | ConvertTo-Json

Write-Host "Login body: $loginBody"

try {
    $response = Invoke-WebRequest -Uri "http://localhost:5536/token?grant_type=password" -Method POST -Body $loginBody -ContentType "application/json" -Headers @{"apikey"="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"}
    Write-Host "✅ Login Success!" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Green
    $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
} catch {
    Write-Host "❌ Login Failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Error Response: $responseBody" -ForegroundColor Red
    }
}
