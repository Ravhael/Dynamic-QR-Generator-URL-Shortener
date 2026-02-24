# Signup admin user melalui GoTrue
Write-Host "Creating admin user via GoTrue..." -ForegroundColor Yellow

$signupBody = @{
    email = "admin@scanly.indovisual.co.id"
    password = "admin123"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "http://localhost:5536/signup" -Method POST -Body $signupBody -ContentType "application/json" -Headers @{"apikey"="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"}
    Write-Host "✅ Admin Signup Success!" -ForegroundColor Green
    $jsonResponse = $response.Content | ConvertFrom-Json
    Write-Host "New Admin User ID: $($jsonResponse.user.id)" -ForegroundColor Green
    Write-Host "Email: $($jsonResponse.user.email)" -ForegroundColor Green
    
    # Output the user ID for database update
    Write-Host "`nUser ID for database update: $($jsonResponse.user.id)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Admin Signup Failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Error Response: $responseBody" -ForegroundColor Red
    }
}
