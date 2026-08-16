@echo off
setlocal
cd /d "%~dp0"
echo ============================================
echo  EcoBin - setup MySQL
echo ============================================
echo.
echo Schema:  infra\schema.sql
echo Lookups: infra\lookups.sql
echo DSN:     ecobin:ecobin@tcp(127.0.0.1:3306)/ecobin
echo.

where docker >nul 2>&1
if errorlevel 1 (
  echo Docker not found.
  echo.
  echo ทางเลือก:
  echo  1^) ติดตั้ง Docker Desktop แล้วรันไฟล์นี้ใหม่
  echo  2^) เปิด phpMyAdmin / MySQL Workbench / Cloud SQL
  echo     แล้วรันตามลำดับ:
  echo       infra\create-user.sql
  echo       infra\schema.sql
  echo       infra\lookups.sql
  echo  3^) แก้ MYSQL_DSN ใน backend\backend.env ให้ตรงกับ user/host จริง
  echo.
  exit /b 1
)

echo Starting MySQL + phpMyAdmin with Docker...
cd infra
docker compose up -d
echo.
echo phpMyAdmin: http://localhost:8081
echo user: ecobin   password: ecobin   database: ecobin
echo.
echo After MySQL is healthy, start the app with run.bat
echo Go will insert demo users/rewards if the users table is empty.
exit /b 0
