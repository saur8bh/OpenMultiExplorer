@echo off
title Build OpenMultiExplorer.exe
cd /d "%~dp0"
echo ========================================================
echo   Building OpenMultiExplorer.exe v1.0 from Source
echo ========================================================
echo.
".\.venv\Scripts\python.exe" build_exe.py
pause
