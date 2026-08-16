@echo off
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0deploy-cloud-run.ps1"
exit /b %ERRORLEVEL%
