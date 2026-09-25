@echo off
REM Start local MariaDB for EcoBin (no Cloud SQL needed)
setlocal
set "MYSQLD=C:\Program Files\MariaDB 13.0\bin\mysqld.exe"
set "DEFAULTS=D:\ecobin-mariadb\my.ini"
set "LOGDIR=%~dp0..\logs"

if not exist "%MYSQLD%" (
  echo MariaDB not found at "%MYSQLD%"
  echo Install with: winget install -e --id MariaDB.Server
  exit /b 1
)
if not exist "%DEFAULTS%" (
  echo Config not found: %DEFAULTS%
  exit /b 1
)

netstat -an | findstr ":3306" | findstr LISTENING >nul
if %ERRORLEVEL%==0 (
  echo MariaDB already listening on port 3306
  exit /b 0
)

if not exist "%LOGDIR%" mkdir "%LOGDIR%"
echo Starting MariaDB on 127.0.0.1:3306 ...
start "EcoBin-MariaDB" /MIN "%MYSQLD%" --defaults-file="%DEFAULTS%" --console
timeout /t 4 /nobreak >nul
netstat -an | findstr ":3306" | findstr LISTENING >nul
if %ERRORLEVEL%==0 (
  echo OK - MariaDB is up
  echo DSN: ecobin:ecobin@tcp(127.0.0.1:3306)/ecobin
  exit /b 0
)
echo FAILED to start MariaDB - see if another app holds port 3306
exit /b 1
