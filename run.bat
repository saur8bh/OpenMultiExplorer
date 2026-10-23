@echo off
title OpenMultiExplorer Pro
echo ========================================================
echo   Launching OpenMultiExplorer (Pro Multi-Cloud Manager)
echo   AES-256 Client-Side Encryption - Unlimited Accounts
echo ========================================================
echo.

cd /d "%~dp0"
set PYTHONPATH=%~dp0

start "" "http://localhost:8089"
".\.venv\Scripts\python.exe" -m uvicorn backend.main:app --host 127.0.0.1 --port 8089
pause
