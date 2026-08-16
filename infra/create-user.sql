-- รันใน Cloud SQL / MySQL Workbench / phpMyAdmin ด้วย user ที่มีสิทธิ์
-- ถ้าเป็น Cloud SQL: สร้าง instance ชนิด MySQL 8 แล้ว Import ไฟล์นี้ ตามด้วย schema.sql และ lookups.sql

CREATE DATABASE IF NOT EXISTS ecobin
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- เครื่องตัวเอง / Docker ใช้ user นี้ (Cloud SQL สร้าง user จาก Console แทนได้)
CREATE USER IF NOT EXISTS 'ecobin'@'%' IDENTIFIED BY 'ecobin';
GRANT ALL PRIVILEGES ON ecobin.* TO 'ecobin'@'%';
FLUSH PRIVILEGES;
