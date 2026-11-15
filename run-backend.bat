@echo off
REM Start / restart API only (port 8080) while Next.js is already running
setlocal EnableExtensions
cd /d "%~dp0"
set "ECOBIN_ROOT=%CD%"
if not exist "%ECOBIN_ROOT%\logs" mkdir "%ECOBIN_ROOT%\logs"
set "API_EXE=%ECOBIN_ROOT%\logs\ecobin-api.exe"
set "BACKEND_LOG=%ECOBIN_ROOT%\logs\backend.log"
set "API_PORT=8080"

echo Free port %API_PORT% ...
for /f "tokens=5" %%P in ('netstat -ano ^| findstr /R /C:":%API_PORT% .*LISTENING"') do (
  if not "%%P"=="0" if not "%%P"=="" taskkill /F /PID %%P >nul 2>&1
)

echo Build API ...
pushd "%ECOBIN_ROOT%\backend"
go build -o "%API_EXE%" .
if errorlevel 1 (
  echo go build failed
  popd
  pause
  exit /b 1
)
popd

(
  echo @echo off
  echo title PCRU-API :%API_PORT%
  echo cd /d "%ECOBIN_ROOT%\backend"
  echo :loop
  echo "%API_EXE%" ^>^> "%BACKEND_LOG%" 2^>^&1
  echo timeout /t 2 /nobreak ^>nul
  echo goto loop
) > "%ECOBIN_ROOT%\logs\_start_api.bat"

start "PCRU-API" /MIN cmd /k "%ECOBIN_ROOT%\logs\_start_api.bat"
echo Waiting for health ...
for /L %%i in (1,1,30) do (
  powershell -NoProfile -Command "try { $r = Invoke-WebRequest -UseBasicParsing -TimeoutSec 2 http://127.0.0.1:%API_PORT%/health; if ($r.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>&1
  if not errorlevel 1 (
    echo Backend READY: http://127.0.0.1:%API_PORT%/health
    exit /b 0
  )
  timeout /t 1 /nobreak >nul
)
echo Backend failed — see logs\backend.log
pause
exit /b 1
