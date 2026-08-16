-- EcoBin Connect — MySQL 8 schema (utf8mb4)
-- ใช้ได้ทั้ง Docker local, XAMPP, และ Google Cloud SQL (MySQL)
--
-- ความสัมพันธ์แบบ 1 ต่อ หลาย (1:M) — ใช้ FK + JOIN เพื่อหาข้อมูลข้ามตาราง
--   users          1 ── M  waste_records        หนึ่งผู้ใช้มีหลายรายการทิ้งขยะ
--   users          1 ── M  point_transactions   หนึ่งผู้ใช้มีหลายรายการแต้ม
--   users          1 ── M  redemptions          หนึ่งผู้ใช้แลกของได้หลายครั้ง
--   rewards        1 ── M  redemptions          หนึ่งของรางวัลถูกแลกได้หลายครั้ง
--   plastic_types  1 ── M  waste_records        หนึ่งประเภทพลาสติกมีหลายรายการ
--   smart_bins     1 ── M  waste_records        หนึ่งจุดทิ้งมีหลายรายการ
--   waste_records  1 ── M  point_transactions   หนึ่งรายการขยะอาจผูกหลายแถวแต้ม (earn)
--
-- Soft delete: ไม่ลบแถวจริง ตั้ง delete_at / delete_by แทน
--   created_at, created_by = ใครสร้างเมื่อใด
--   delete_at IS NULL = ยังใช้งาน / มีค่า = ถูกลบแล้ว

CREATE DATABASE IF NOT EXISTS ecobin
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE ecobin;

-- ---------------------------------------------------------------------------
-- ตารางหลัก
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS users (
  user_id VARCHAR(32) PRIMARY KEY COMMENT 'รหัสผู้ใช้ เช่น USR001',
  full_name VARCHAR(120) NOT NULL COMMENT 'ชื่อ-นามสกุล',
  student_id VARCHAR(32) NOT NULL COMMENT 'รหัสนักศึกษา / รหัสบุคลากร',
  email VARCHAR(160) NOT NULL COMMENT 'อีเมลเข้าสู่ระบบ',
  password_hash VARCHAR(255) NOT NULL COMMENT 'รหัสผ่านแบบ bcrypt',
  user_role ENUM('Admin', 'Member') NOT NULL DEFAULT 'Member' COMMENT 'บทบาทในระบบ',
  total_points INT NOT NULL DEFAULT 0 COMMENT 'แต้มสะสมปัจจุบัน',
  total_carbon_saved DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT 'kg CO2e ที่ลดได้รวม',
  avatar_url VARCHAR(500) NULL,
  department VARCHAR(200) NULL COMMENT 'คณะ/สาขา',
  phone VARCHAR(20) NULL COMMENT 'เบอร์โทรศัพท์ (เข้าสู่ระบบด้วย OTP)',
  auth_provider VARCHAR(20) NOT NULL DEFAULT 'email' COMMENT 'email / phone / google',
  google_sub VARCHAR(64) NULL COMMENT 'Google account subject',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'เวลาที่สร้าง',
  created_by VARCHAR(32) NULL COMMENT 'ผู้สร้าง (user_id หรือ SYSTEM)',
  delete_at DATETIME NULL COMMENT 'เวลาที่ลบแบบ soft delete — NULL คือยังใช้งาน',
  delete_by VARCHAR(32) NULL COMMENT 'ผู้ลบ (user_id หรือ SYSTEM)',
  UNIQUE KEY uq_users_student (student_id),
  UNIQUE KEY uq_users_email (email),
  UNIQUE KEY uq_users_phone (phone),
  UNIQUE KEY uq_users_google (google_sub),
  KEY idx_users_role (user_role),
  KEY idx_users_deleted (delete_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='บัญชีผู้ใช้สมาชิกและผู้ดูแลระบบ';

CREATE TABLE IF NOT EXISTS plastic_types (
  plastic_code TINYINT PRIMARY KEY COMMENT 'เบอร์ 1-7 ตามสัญลักษณ์รีไซเคิล',
  short_name VARCHAR(40) NOT NULL COMMENT 'เช่น PET / HDPE',
  full_name VARCHAR(160) NOT NULL,
  display_name_th VARCHAR(120) NOT NULL,
  carbon_factor DECIMAL(6,3) NOT NULL DEFAULT 0.080 COMMENT 'kg CO2e ต่อขวดโดยประมาณ',
  recycling_tips TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'เวลาที่สร้าง',
  created_by VARCHAR(32) NULL COMMENT 'ผู้สร้าง (user_id หรือ SYSTEM)',
  delete_at DATETIME NULL COMMENT 'เวลาที่ลบแบบ soft delete — NULL คือยังใช้งาน',
  delete_by VARCHAR(32) NULL COMMENT 'ผู้ลบ (user_id หรือ SYSTEM)',
  KEY idx_plastic_deleted (delete_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='ประเภทพลาสติก 7 ชนิด ตามเอกสารวิจัย';

CREATE TABLE IF NOT EXISTS smart_bins (
  bin_id VARCHAR(16) PRIMARY KEY COMMENT 'เช่น BIN-01',
  bin_name VARCHAR(200) NOT NULL COMMENT 'ชื่อจุดคัดแยกในมหาวิทยาลัย',
  status VARCHAR(40) NOT NULL DEFAULT 'พร้อมใช้งาน',
  capacity_note VARCHAR(20) NULL COMMENT 'ความจุโดยประมาณ เช่น 45%',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'เวลาที่สร้าง',
  created_by VARCHAR(32) NULL COMMENT 'ผู้สร้าง (user_id หรือ SYSTEM)',
  delete_at DATETIME NULL COMMENT 'เวลาที่ลบแบบ soft delete — NULL คือยังใช้งาน',
  delete_by VARCHAR(32) NULL COMMENT 'ผู้ลบ (user_id หรือ SYSTEM)',
  KEY idx_bins_deleted (delete_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='จุดคัดแยกขยะอัจฉริยะในพื้นที่ มรภ.เพชรบูรณ์';

CREATE TABLE IF NOT EXISTS waste_records (
  record_id VARCHAR(32) PRIMARY KEY COMMENT 'รหัสรายการทิ้งขยะ',
  user_id VARCHAR(32) NOT NULL,
  image_url TEXT NOT NULL COMMENT 'พาธรูปหรือ URL',
  plastic_type VARCHAR(120) NOT NULL COMMENT 'ข้อความประเภทที่ระบบ/AI ตรวจได้',
  plastic_code TINYINT NULL COMMENT 'FK ไป plastic_types ถ้าจับเบอร์ได้',
  bottle_count INT NOT NULL DEFAULT 1,
  upload_timestamp DATETIME NOT NULL,
  verification_status ENUM('รอการตรวจสอบ', 'อนุมัติแล้ว', 'ไม่อนุมัติ', 'กรุณาส่งภาพมาใหม่')
    NOT NULL DEFAULT 'รอการตรวจสอบ',
  carbon_saved DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  points_awarded INT NOT NULL DEFAULT 0,
  admin_comment TEXT NULL,
  bin_location VARCHAR(200) NULL COMMENT 'ชื่อจุดทิ้ง (เก็บข้อความเพื่อแสดงผล)',
  bin_id VARCHAR(16) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'เวลาที่สร้าง',
  created_by VARCHAR(32) NULL COMMENT 'ผู้สร้าง (user_id หรือ SYSTEM)',
  delete_at DATETIME NULL COMMENT 'เวลาที่ลบแบบ soft delete — NULL คือยังใช้งาน',
  delete_by VARCHAR(32) NULL COMMENT 'ผู้ลบ (user_id หรือ SYSTEM)',
  KEY idx_waste_user (user_id),
  KEY idx_waste_status (verification_status),
  KEY idx_waste_time (upload_timestamp),
  KEY idx_waste_deleted (delete_at),
  CONSTRAINT fk_waste_user FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_waste_plastic FOREIGN KEY (plastic_code) REFERENCES plastic_types(plastic_code)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_waste_bin FOREIGN KEY (bin_id) REFERENCES smart_bins(bin_id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='รายการอัปโหลดภาพขวดพลาสติก';

CREATE TABLE IF NOT EXISTS point_transactions (
  transaction_id VARCHAR(32) PRIMARY KEY,
  user_id VARCHAR(32) NOT NULL,
  record_id VARCHAR(32) NULL COMMENT 'ผูกกับรายการขยะถ้าเป็นการได้แต้มจากคัดแยก',
  points_earned INT NOT NULL COMMENT 'บวก=ได้แต้ม ลบ=แลกรางวัล',
  transaction_type ENUM('earn', 'redeem', 'bonus') NOT NULL,
  description VARCHAR(500) NOT NULL,
  transaction_date DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'เวลาที่สร้าง',
  created_by VARCHAR(32) NULL COMMENT 'ผู้สร้าง (user_id หรือ SYSTEM)',
  delete_at DATETIME NULL COMMENT 'เวลาที่ลบแบบ soft delete — NULL คือยังใช้งาน',
  delete_by VARCHAR(32) NULL COMMENT 'ผู้ลบ (user_id หรือ SYSTEM)',
  KEY idx_txn_user_date (user_id, transaction_date),
  KEY idx_txn_deleted (delete_at),
  CONSTRAINT fk_txn_user FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_txn_record FOREIGN KEY (record_id) REFERENCES waste_records(record_id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='ประวัติแต้ม (ได้ / แลก / โบนัส)';

CREATE TABLE IF NOT EXISTS rewards (
  reward_id VARCHAR(32) PRIMARY KEY,
  reward_name VARCHAR(200) NOT NULL,
  points_required INT NOT NULL,
  reward_description TEXT NOT NULL,
  reward_stock INT NOT NULL DEFAULT 0,
  reward_image VARCHAR(500) NOT NULL,
  category ENUM('เครื่องดื่มและอาหาร', 'ของใช้รักษ์โลก', 'อุปกรณ์การเรียน', 'สิทธิพิเศษ') NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'เวลาที่สร้าง',
  created_by VARCHAR(32) NULL COMMENT 'ผู้สร้าง (user_id หรือ SYSTEM)',
  delete_at DATETIME NULL COMMENT 'เวลาที่ลบแบบ soft delete — NULL คือยังใช้งาน',
  delete_by VARCHAR(32) NULL COMMENT 'ผู้ลบ (user_id หรือ SYSTEM)',
  KEY idx_rewards_points (points_required),
  KEY idx_rewards_deleted (delete_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='แคตตาล็อกของรางวัล';

CREATE TABLE IF NOT EXISTS redemptions (
  redeem_id VARCHAR(32) PRIMARY KEY,
  user_id VARCHAR(32) NOT NULL,
  reward_id VARCHAR(32) NOT NULL,
  points_used INT NOT NULL,
  redeem_date DATETIME NOT NULL,
  redeem_status ENUM('สำเร็จ', 'รอรับของรางวัล', 'ยกเลิก') NOT NULL DEFAULT 'สำเร็จ',
  pickup_code VARCHAR(64) NOT NULL COMMENT 'รหัสรับของที่จุดจ่าย',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'เวลาที่สร้าง',
  created_by VARCHAR(32) NULL COMMENT 'ผู้สร้าง (user_id หรือ SYSTEM)',
  delete_at DATETIME NULL COMMENT 'เวลาที่ลบแบบ soft delete — NULL คือยังใช้งาน',
  delete_by VARCHAR(32) NULL COMMENT 'ผู้ลบ (user_id หรือ SYSTEM)',
  UNIQUE KEY uq_pickup_code (pickup_code),
  KEY idx_redeem_user (user_id),
  KEY idx_redeem_deleted (delete_at),
  CONSTRAINT fk_redeem_user FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_redeem_reward FOREIGN KEY (reward_id) REFERENCES rewards(reward_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='ประวัติแลกของรางวัล';

CREATE TABLE IF NOT EXISTS guest_logs (
  guest_session_id VARCHAR(32) PRIMARY KEY,
  device_id VARCHAR(80) NOT NULL,
  temp_image_path TEXT NOT NULL,
  temp_scan_result VARCHAR(500) NOT NULL,
  detected_bottles INT NOT NULL DEFAULT 0,
  estimated_points INT NOT NULL DEFAULT 0,
  timestamp DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'เวลาที่สร้าง',
  created_by VARCHAR(32) NULL COMMENT 'ผู้สร้าง (user_id หรือ SYSTEM)',
  delete_at DATETIME NULL COMMENT 'เวลาที่ลบแบบ soft delete — NULL คือยังใช้งาน',
  delete_by VARCHAR(32) NULL COMMENT 'ผู้ลบ (user_id หรือ SYSTEM)',
  KEY idx_guest_time (timestamp),
  KEY idx_guest_deleted (delete_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='บันทึกการสแกนของผู้เยี่ยมชม (ยังไม่สมัคร)';
