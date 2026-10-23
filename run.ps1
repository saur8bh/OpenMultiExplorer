Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Launching OpenMultiExplorer (Pro Multi-Cloud Manager)" -ForegroundColor Cyan
Write-Host "  AES-256 Client-Side Encryption - Unlimited Accounts" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan

Set-Location $PSScriptRoot
$env:PYTHONPATH = $PSScriptRoot

Start-Process "http://localhost:8089"
& ".\.venv\Scripts\python.exe" -m uvicorn backend.main:app --host 127.0.0.1 --port 8089
