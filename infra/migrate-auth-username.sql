-- EcoBin Connect: auth signup = username + password + phone + email (+ profile names later)
-- Safe to re-run on existing DBs (ADD COLUMN IF pattern via migrate.go; this file for manual apply)

USE ecobin;

-- Name fields (profile step after register)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS first_name VARCHAR(100) NOT NULL DEFAULT '' COMMENT 'ชื่อ — ว่างได้จนกว่าจะตั้งโปรไฟล์' AFTER full_name,
  ADD COLUMN IF NOT EXISTS last_name VARCHAR(100) NOT NULL DEFAULT '' COMMENT 'นามสกุล — ว่างได้จนกว่าจะตั้งโปรไฟล์' AFTER first_name;

-- Login username (separate from student_id)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS username VARCHAR(32) NULL COMMENT 'ชื่อผู้ใช้เข้าสู่ระบบ (a-z 0-9 ._ )' AFTER last_name;

-- Ensure phone / auth columns exist
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS phone VARCHAR(20) NULL COMMENT 'เบอร์โทร 10 หลัก' AFTER department,
  ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(20) NOT NULL DEFAULT 'username' COMMENT 'username | email | phone | google(legacy)' AFTER phone,
  ADD COLUMN IF NOT EXISTS google_sub VARCHAR(64) NULL COMMENT 'Google subject (legacy)' AFTER auth_provider;

ALTER TABLE users MODIFY COLUMN avatar_url VARCHAR(1000) NULL COMMENT 'URL รูปโปรไฟล์';
ALTER TABLE users MODIFY COLUMN auth_provider VARCHAR(20) NOT NULL DEFAULT 'username' COMMENT 'username | email | phone | google(legacy)';

-- Unique username (ignore if already exists)
-- MariaDB 10.5+ supports IF NOT EXISTS for indexes in some builds; fallback handled in Go migrate.
CREATE UNIQUE INDEX IF NOT EXISTS uq_users_username ON users (username);

-- Backfill username from prior username-style student_id / local emails
UPDATE users
SET username = LOWER(student_id)
WHERE username IS NULL
  AND (
    auth_provider = 'username'
    OR email LIKE '%@users.ecobin.local'
    OR student_id REGEXP '^[A-Za-z][A-Za-z0-9._]{3,31}$'
  );

UPDATE users
SET auth_provider = 'username'
WHERE auth_provider IN ('', 'email')
  AND username IS NOT NULL
  AND email NOT LIKE '%@gmail.com'
  AND email LIKE '%@users.ecobin.local';
