@echo off
setlocal EnableExtensions
cd /d "%~dp0"
echo.
echo EcoBin + Google Cloud SQL (MySQL)
echo ---------------------------------
echo หน้าจอที่เปิดอยู่ให้เลือก MySQL ค้างไว้ (อย่าสลับไป PostgreSQL)
echo pgAdmin 4 ใช้กับ Postgres เท่านั้น ฐานนี้เป็น MySQL
echo.
echo [ทำบนเว็บ Google Cloud]
echo  1. กด Enable billing แล้วผูกบัญชี (ปุ่ม Create จะยังเทาจนกว่าจะเปิดบิลและใส่รหัส root)
echo  2. Database engine = MySQL
echo  3. Instance ID = ecobin-mysql  (หรือใช้ค่าที่กรอกไว้ได้)
echo  4. Password = กด Generate แล้วคัดลอกเก็บไว้ (รหัส root)
echo  5. Region แนะนำ asia-southeast1 (Singapore) ใกล้ไทยกว่า Iowa
echo  6. กด Create free instance รอจนสถานะ RUNNABLE
echo  7. เข้า instance - Connections - Networking
echo     เปิด Public IP
echo     Authorized networks กด Add network
echo       Name: home
echo       Network: IP สาธารณะของเน็ตบ้านคุณ/32
echo       (ดู IP ได้ที่ https://ifconfig.me )
echo  8. หน้า Overview คัดลอก Public IP address
echo.
echo [ใส่ค่าด้านล่าง แล้วรันไฟล์นี้อีกครั้งด้วยโหมด write]
echo.
if "%~1"=="" (
  echo ตัวอย่างหลังมี IP แล้ว:
  echo   setup-cloud-sql.bat 34.xx.xx.xx ROOTPASS APPPASS
  echo.
  echo ROOTPASS = รหัส root ที่ Generate
  echo APPPASS  = รหัส user ecobin ที่จะใช้ในแอป ^(ตั้งเอง^)
  exit /b 0
)

set "CLOUDSQL_IP=%~1"
set "ROOT_PASS=%~2"
set "APP_PASS=%~3"
if "%APP_PASS%"=="" set "APP_PASS=ecobin"

set "DSN=ecobin:%APP_PASS%@tcp(%CLOUDSQL_IP%:3306)/ecobin?parseTime=true&charset=utf8mb4&loc=Local&tls=true"

powershell -NoProfile -Command ^
  "$p='backend\backend.env';" ^
  "$c=Get-Content $p -Raw;" ^
  "$c=[regex]::Replace($c,'MYSQL_DSN=.*',('MYSQL_DSN=%DSN%'));" ^
  "Set-Content -Path $p -Value $c -NoNewline"

echo.
echo Updated backend\backend.env MYSQL_DSN
echo Next: เปิด Cloud Shell ในหน้า Cloud SQL แล้วรันคำสั่งที่พิมพ์ด้านล่าง
echo.
echo gcloud sql connect INSTANCE_ID --user=root --quiet
echo.
echo จากนั้นใน mysql prompt:
echo   source ยัง paste ไม่ได้จากเครื่องนี้โดยตรง
echo   ให้ copy เนื้อหา infra\schema.sql แล้ว lookups.sql ไปวาง
echo   และสร้าง user:
echo   CREATE USER IF NOT EXISTS 'ecobin'@'%%' IDENTIFIED BY '%APP_PASS%';
echo   GRANT ALL PRIVILEGES ON ecobin.* TO 'ecobin'@'%%';
echo   FLUSH PRIVILEGES;
echo.
echo แล้วรัน run.bat เพื่อให้ Go ต่อฐานนี้
exit /b 0
