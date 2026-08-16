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

echo [1/4] Free ports %FRONTEND_PORT% (frontend) and %API_PORT% (backend)
call :killport %FRONTEND_PORT%
call :killport %API_PORT%
timeout /t 1 /nobreak >nul

echo [2/4] Sync frontend\frontend.env -^> frontend\.env.local
copy /Y "%ECOBIN_ROOT%\frontend\frontend.env" "%ECOBIN_ROOT%\frontend\.env.local" >nul

if not exist "%ECOBIN_ROOT%\frontend\node_modules\" (
  echo [2b] npm install in frontend ...
  pushd "%ECOBIN_ROOT%\frontend"
  call npm install
  popd
)

echo [3/4] Start backend (Go) on port %API_PORT%  — same terminal
pushd "%ECOBIN_ROOT%\backend"
set "ECOBIN_ROOT=%ECOBIN_ROOT%"
start /b go run .
popd

echo [4/4] Start frontend (Next.js) on port %FRONTEND_PORT%  — same terminal
echo.
echo Frontend: http://localhost:%FRONTEND_PORT%/login
echo Backend:  http://localhost:%API_PORT%/health
echo Config:   frontend\frontend.env  and  backend\backend.env
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
