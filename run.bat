@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"
set "ECOBIN_ROOT=%~dp0"
if "%ECOBIN_ROOT:~-1%"=="\" set "ECOBIN_ROOT=%ECOBIN_ROOT:~0,-1%"

echo ============================================
echo  EcoBin Connect - local test
echo ============================================
echo.

call :loadenv "%ECOBIN_ROOT%\backend\backend.env"
call :loadenv "%ECOBIN_ROOT%\frontend\frontend.env"

if not defined API_PORT set "API_PORT=8080"
if not defined FRONTEND_PORT set "FRONTEND_PORT=3000"

if not exist "%ECOBIN_ROOT%\logs" mkdir "%ECOBIN_ROOT%\logs"
set "BACKEND_LOG=%ECOBIN_ROOT%\logs\backend.log"

echo [1/6] Free ports %FRONTEND_PORT% (frontend) and %API_PORT% (backend)
call :killport %FRONTEND_PORT%
call :killport %API_PORT%
timeout /t 1 /nobreak >nul

echo [2/6] Start local MariaDB (127.0.0.1:3306^)
call "%ECOBIN_ROOT%\scripts\start-local-mysql.bat"
if errorlevel 1 (
  echo !!! MariaDB did not start — fix scripts\start-local-mysql.bat first
  echo     Then re-run run.bat
  pause
  exit /b 1
)

echo [3/6] Sync frontend\frontend.env -^> frontend\.env.local
copy /Y "%ECOBIN_ROOT%\frontend\frontend.env" "%ECOBIN_ROOT%\frontend\.env.local" >nul
if not defined API_PROXY_TARGET set "API_PROXY_TARGET=http://127.0.0.1:%API_PORT%"
echo       API_PROXY_TARGET=%API_PROXY_TARGET%

if not exist "%ECOBIN_ROOT%\frontend\node_modules\" (
  echo [3b] npm install in frontend ...
  pushd "%ECOBIN_ROOT%\frontend"
  call npm install
  popd
)

echo [4/6] Start backend (Go) on port %API_PORT%
echo       Log: logs\backend.log
pushd "%ECOBIN_ROOT%\backend"
set "ECOBIN_ROOT=%ECOBIN_ROOT%"
echo.>> "%BACKEND_LOG%"
echo ===== backend start %DATE% %TIME% =====>> "%BACKEND_LOG%"
start "EcoBin-API" /min cmd /c "cd /d \"%ECOBIN_ROOT%\backend\" && go run . >> \"%BACKEND_LOG%\" 2>&1"
popd

echo [5/6] Wait for http://127.0.0.1:%API_PORT%/health ...
set "BACKEND_OK=0"
for /L %%i in (1,1,40) do (
  powershell -NoProfile -Command "try { $r = Invoke-WebRequest -UseBasicParsing -TimeoutSec 2 http://127.0.0.1:%API_PORT%/health; if ($r.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>&1
  if not errorlevel 1 (
    set "BACKEND_OK=1"
    echo       Backend ready.
    goto :backend_checked
  )
  timeout /t 1 /nobreak >nul
)

:backend_checked
if "%BACKEND_OK%"=="0" (
  echo.
  echo !!! Backend NOT healthy on port %API_PORT%
  echo     Check MariaDB + MYSQL_DSN in backend\backend.env ^(must be 127.0.0.1^)
  echo     Last lines of logs\backend.log:
  echo --------------------------------------------
  powershell -NoProfile -Command "if (Test-Path '%BACKEND_LOG%') { Get-Content '%BACKEND_LOG%' -Tail 25 }"
  echo --------------------------------------------
  echo     Fix: docs\guides\05-พัฒนาบนเครื่อง.md
  echo.
)

echo [6/6] Start frontend (Next.js) on port %FRONTEND_PORT%
echo.
echo Frontend: http://localhost:%FRONTEND_PORT%/login
echo Backend:  http://localhost:%API_PORT%/health
echo Database: MariaDB local 127.0.0.1:3306 / ecobin
echo Backend log: logs\backend.log
echo Demo login: st661102057104@gmail.com / ecobin123  ^(Admin^)
echo Stop: Ctrl+C  (then this script will free the API port)
echo.

pushd "%ECOBIN_ROOT%\frontend"
call npx next dev --port %FRONTEND_PORT%
popd

echo.
echo Frontend stopped. Stopping backend on port %API_PORT% ...
call :killport %API_PORT%
exit /b 0

:loadenv
if not exist "%~1" (
  echo Missing %~1
  goto :eof
)
for /f "usebackq eol=# tokens=1,* delims==" %%A in ("%~1") do (
  if not "%%A"=="" set "%%A=%%B"
)
goto :eof

:killport
set "PORT=%~1"
echo   - port %PORT%
for /f "tokens=5" %%P in ('netstat -ano ^| findstr /R /C:":%PORT% .*LISTENING"') do (
  if not "%%P"=="0" (
    taskkill /F /PID %%P >nul 2>&1
  )
)
for /f "tokens=5" %%P in ('netstat -ano ^| findstr LISTENING ^| findstr ":%PORT%"') do (
  if not "%%P"=="0" (
    taskkill /F /PID %%P >nul 2>&1
  )
)
goto :eof
