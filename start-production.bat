@echo off
setlocal
cd /d "%~dp0"
echo EcoBin production stack
echo Requires Docker Desktop.
echo.
if not exist "backend\backend.env" (
  echo Copy backend\backend.env.production.example to backend\backend.env and fill secrets first.
  exit /b 1
)
if not exist "infra\.env.prod" (
  copy /Y "infra\.env.prod.example" "infra\.env.prod" >nul
  echo Created infra\.env.prod — edit passwords and PUBLIC_ORIGIN then run again.
  exit /b 1
)
where docker >nul 2>&1
if errorlevel 1 (
  echo Docker is not installed or not in PATH.
  exit /b 1
)
cd infra
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build
echo.
echo Open http://localhost  (or PUBLIC_ORIGIN)
echo Students register on the website. Admin logs in with ADMIN_EMAIL from backend.env
exit /b 0
