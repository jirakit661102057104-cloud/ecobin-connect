-- รันใน Cloud Shell หลัง instance พร้อม (ดูคำสั่งใน setup-cloud-sql.bat)
-- mysql -h 127.0.0.1 -u root -p < ไฟล์นี้ ยังไม่ใช้จากเครื่อง Windows โดยตรง

CREATE DATABASE IF NOT EXISTS ecobin
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'ecobin'@'%' IDENTIFIED BY 'CHANGE_APP_PASSWORD';
GRANT ALL PRIVILEGES ON ecobin.* TO 'ecobin'@'%';
FLUSH PRIVILEGES;
