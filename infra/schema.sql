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
  plastic_code TINYINT PRIMARY KEY COMMENT 'รหัสวัสดุรีไซเคิล; 1-7 พลาสติก, 8 กระป๋อง',
  short_name VARCHAR(40) NOT NULL COMMENT 'เช่น PET / HDPE',
  full_name VARCHAR(160) NOT NULL,
  display_name_th VARCHAR(120) NOT NULL,
  carbon_factor DECIMAL(6,3) NOT NULL DEFAULT 0.080 COMMENT 'kg CO2e ต่อขวดโดยประมาณ',
  average_weight_kg DECIMAL(8,5) NOT NULL DEFAULT 0.00000 COMMENT 'น้ำหนักเฉลี่ยต่อชิ้น (kg); ใช้เมื่อไม่มีน้ำหนักจริง',
  recycling_tips TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'เวลาที่สร้าง',
  created_by VARCHAR(32) NULL COMMENT 'ผู้สร้าง (user_id หรือ SYSTEM)',
  delete_at DATETIME NULL COMMENT 'เวลาที่ลบแบบ soft delete — NULL คือยังใช้งาน',
  delete_by VARCHAR(32) NULL COMMENT 'ผู้ลบ (user_id หรือ SYSTEM)',
  KEY idx_plastic_deleted (delete_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='ประเภทวัสดุรีไซเคิลที่ระบบรองรับ';

CREATE TABLE IF NOT EXISTS emission_factors (
  emission_factor_id VARCHAR(40) PRIMARY KEY,
  plastic_code TINYINT NOT NULL,
  factor_type ENUM('virgin_production','recycled_production') NOT NULL,
  factor_value DECIMAL(10,4) NOT NULL COMMENT 'ค่าปัจจัยการปล่อย',
  unit VARCHAR(32) NOT NULL DEFAULT 'kgCO2e/kg',
  source_name VARCHAR(200) NOT NULL,
  source_url VARCHAR(500) NOT NULL,
  source_version VARCHAR(80) NOT NULL,
  effective_date DATE NULL,
  expires_at DATE NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(32) NULL,
  UNIQUE KEY uq_emission_factor_version (plastic_code, factor_type, source_version),
  KEY idx_emission_factor_lookup (plastic_code, factor_type, is_active),
  CONSTRAINT fk_emission_factor_plastic FOREIGN KEY (plastic_code) REFERENCES plastic_types(plastic_code)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='ปัจจัยการปล่อยก๊าซเรือนกระจก (kgCO2e/kg) ตามวิธี CMH/TGO; อ้างอิง circularmaterialhub.com/Calculate.php';

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
  weight_kg DECIMAL(10,5) NOT NULL DEFAULT 0.00000 COMMENT 'น้ำหนักที่ใช้คำนวณ kg',
  carbon_footprint DECIMAL(12,5) NOT NULL DEFAULT 0.00000 COMMENT 'คาร์บอนฟุตพริ้นท์ kgCO2e',
  carbon_avoided DECIMAL(12,5) NOT NULL DEFAULT 0.00000 COMMENT 'การปล่อยที่หลีกเลี่ยงได้ kgCO2e',
  emission_factor_version VARCHAR(80) NULL COMMENT 'snapshot รุ่นปัจจัยการปล่อยที่ใช้',
  points_awarded INT NOT NULL DEFAULT 0,
  admin_comment TEXT NULL,
  bin_location VARCHAR(200) NULL COMMENT 'ชื่อจุดทิ้ง (เก็บข้อความเพื่อแสดงผล)',
  bin_id VARCHAR(16) NULL,
  image_hash CHAR(64) NULL COMMENT 'SHA-256 ของไบต์รูป — กันส่งรูปซ้ำ',
  capture_source VARCHAR(16) NULL COMMENT 'camera | gallery',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'เวลาที่สร้าง',
  created_by VARCHAR(32) NULL COMMENT 'ผู้สร้าง (user_id หรือ SYSTEM)',
  delete_at DATETIME NULL COMMENT 'เวลาที่ลบแบบ soft delete — NULL คือยังใช้งาน',
  delete_by VARCHAR(32) NULL COMMENT 'ผู้ลบ (user_id หรือ SYSTEM)',
  KEY idx_waste_user (user_id),
  KEY idx_waste_status (verification_status),
  KEY idx_waste_time (upload_timestamp),
  KEY idx_waste_image_hash (image_hash),
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

-- Event log / model recovery
-- Event audit + model training recovery (append after guest_logs)

CREATE TABLE IF NOT EXISTS model_versions (
  version_id VARCHAR(40) PRIMARY KEY COMMENT 'เช่น MOD-ECOBIN-2026-04',
  provider ENUM('ecobin_local','teachable_machine') NOT NULL DEFAULT 'ecobin_local',
  display_name VARCHAR(160) NOT NULL,
  model_url VARCHAR(500) NOT NULL COMMENT 'path หรือ URL โหลดโมเดล',
  labels_json JSON NOT NULL COMMENT '["PLASTIC_BOTTLE","CAN","INVALID"]',
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT NULL,
  accuracy_summary_json JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(32) NULL,
  delete_at DATETIME NULL,
  delete_by VARCHAR(32) NULL,
  KEY idx_model_active (is_active, delete_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='รุ่นโมเดล AI ที่ระบบใช้ / สำรองสำหรับ Teachable Machine';

CREATE TABLE IF NOT EXISTS model_training_samples (
  sample_id VARCHAR(40) PRIMARY KEY,
  label ENUM('PLASTIC_BOTTLE','CAN','INVALID') NOT NULL,
  image_url TEXT NOT NULL COMMENT 'พาธรูปใน /uploads หรือ URL',
  source ENUM('user_scan','trashnet','manual','guest_scan') NOT NULL DEFAULT 'user_scan',
  confidence DECIMAL(6,2) NULL COMMENT '% ความมั่นใจตอนจำแนก',
  record_id VARCHAR(32) NULL COMMENT 'ผูก waste_records ถ้ามาจากสแกนจริง',
  model_version_id VARCHAR(40) NULL,
  approved_for_train BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'ใช้เทรน/ส่งเข้า Teachable ได้',
  metadata_json JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(32) NULL,
  delete_at DATETIME NULL,
  delete_by VARCHAR(32) NULL,
  KEY idx_sample_label (label, approved_for_train, delete_at),
  KEY idx_sample_record (record_id),
  KEY idx_sample_version (model_version_id),
  CONSTRAINT fk_sample_record FOREIGN KEY (record_id) REFERENCES waste_records(record_id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_sample_model FOREIGN KEY (model_version_id) REFERENCES model_versions(version_id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='ตัวอย่างรูปสำหรับเทรน/กู้โมเดล (ส่งเข้า Teachable Machine ได้)';

CREATE TABLE IF NOT EXISTS system_events (
  event_id VARCHAR(40) PRIMARY KEY,
  event_type VARCHAR(64) NOT NULL COMMENT 'เช่น MODEL_CLASSIFY, WASTE_SUBMITTED, POINTS_AWARDED',
  event_source ENUM('frontend','backend','admin','system') NOT NULL DEFAULT 'backend',
  actor_user_id VARCHAR(32) NULL,
  correlation_id VARCHAR(64) NULL COMMENT 'ผูก classify → submit → points',
  entity_type VARCHAR(40) NULL COMMENT 'waste_record / point_transaction / training_sample / model_version',
  entity_id VARCHAR(64) NULL,
  message VARCHAR(500) NULL,
  payload_json JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_events_type_time (event_type, created_at),
  KEY idx_events_corr (correlation_id),
  KEY idx_events_actor (actor_user_id, created_at),
  KEY idx_events_entity (entity_type, entity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Event log ตาม trigger — ตามรอยว่าเกิดอะไรที่ไหน';

