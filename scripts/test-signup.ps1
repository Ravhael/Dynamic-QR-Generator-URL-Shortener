# Test signup GoTrue
$signupBody = @{
    email = "testgoture@example.com"
    password = "testpassword123"
} | ConvertTo-Json

Write-Host "Signup Body: $signupBody"

try {
    $response = Invoke-WebRequest -Uri "http://localhost:5536/signup" -Method POST -Body $signupBody -ContentType "application/json" -Headers @{"apikey"="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"}
    Write-Host "Success: $($response.StatusCode)"
    $response.Content
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody"
    }
}
