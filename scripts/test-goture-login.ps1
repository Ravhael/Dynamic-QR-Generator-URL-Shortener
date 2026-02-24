# Test login user yang dibuat via GoTrue
Write-Host "Testing testgoture login..." -ForegroundColor Yellow

$loginBody = @{
    email = "testgoture@example.com"
    password = "testpassword123"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "http://localhost:5536/token?grant_type=password" -Method POST -Body $loginBody -ContentType "application/json" -Headers @{"apikey"="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"}
    Write-Host "✅ Test User Login Success!" -ForegroundColor Green
    $jsonResponse = $response.Content | ConvertFrom-Json
    Write-Host "User ID: $($jsonResponse.user.id)" -ForegroundColor Green
    Write-Host "Email: $($jsonResponse.user.email)" -ForegroundColor Green
} catch {
    Write-Host "❌ Test User Login Failed: $($_.Exception.Message)" -ForegroundColor Red
}
