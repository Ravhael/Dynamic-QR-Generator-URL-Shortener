# Script migrasi user ke GoTrue
Write-Host "Migrating users to GoTrue..." -ForegroundColor Yellow

$users = @(
    @{ email = "admin@scanly.com"; password = "admin123"; name = "Admin User"; role = "admin" },
    @{ email = "john@scanly.com"; password = "editor123"; name = "John Editor"; role = "editor" },
    @{ email = "jane@scanly.com"; password = "viewer123"; name = "Jane Viewer"; role = "viewer" }
)

$apikey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"

foreach ($user in $users) {
    Write-Host "`nProcessing $($user.email)..." -ForegroundColor Cyan
    
    $signupBody = @{
        email = $user.email
        password = $user.password
    } | ConvertTo-Json
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5536/signup" -Method POST -Body $signupBody -ContentType "application/json" -Headers @{"apikey"=$apikey}
        $jsonResponse = $response.Content | ConvertFrom-Json
        $userId = $jsonResponse.user.id
        
        Write-Host "✅ Created GoTrue user: $userId" -ForegroundColor Green
        
        # Output SQL command to update public.users
        Write-Host "SQL: UPDATE public.users SET auth_user_id = '$userId' WHERE email = '$($user.email)';" -ForegroundColor Yellow
        
    } catch {
        Write-Host "❌ Failed to create $($user.email): $($_.Exception.Message)" -ForegroundColor Red
    }
}
