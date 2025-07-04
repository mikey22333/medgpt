$body = @{
    query = "hypertension treatment"
    sessionId = "test-quality"
    mode = "research"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:3000/api/research" -Method POST -Headers @{"Content-Type"="application/json"} -Body $body

$content = $response.Content | ConvertFrom-Json
Write-Host "Research Scope: " $content.response | Select-String "Research Scope"
Write-Host "Citations Count: " $content.citations.Count
