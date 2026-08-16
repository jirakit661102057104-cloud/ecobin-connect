-- EcoBin Connect — ไฟล์สำหรับ Cloud SQL Import (ชนิด SQL)
-- ในหน้า Import ให้เลือก:
--   File format = SQL
--   Destination database = ecobin
-- อย่าใส่ CREATE DATABASE ในไฟล์นี้ เพราะเลือกฐานปลายทางที่หน้าเว็บแล้ว
--
-- Soft delete: ไม่ลบแถวจริง ตั้ง delete_at / delete_by แทน
--   delete_at IS NULL = ยังใช้งาน

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
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'เวลาที่สร้าง',
  created_by VARCHAR(32) NULL COMMENT 'ผู้สร้าง (user_id หรือ SYSTEM)',
  delete_at DATETIME NULL COMMENT 'เวลาที่ลบแบบ soft delete — NULL คือยังใช้งาน',
  delete_by VARCHAR(32) NULL COMMENT 'ผู้ลบ (user_id หรือ SYSTEM)',
  UNIQUE KEY uq_users_student (student_id),
  UNIQUE KEY uq_users_email (email),
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

INSERT INTO plastic_types (plastic_code, short_name, full_name, display_name_th, carbon_factor, recycling_tips, created_by) VALUES
  (1, 'PET / PETE', 'Polyethylene Terephthalate', 'PET (เบอร์ 1 - ขวดน้ำใส)', 0.080, 'เทน้ำออก ล้างสะอาด บีบขวดให้แบน แยกฝา', 'SYSTEM'),
  (2, 'HDPE', 'High-Density Polyethylene', 'HDPE (เบอร์ 2 - ขวดนม/ขวดขาวขุ่น)', 0.080, 'ล้างคราบนมหรือสารเคมี ตากแห้งก่อนทิ้ง', 'SYSTEM'),
  (3, 'PVC', 'Polyvinyl Chloride', 'PVC (เบอร์ 3)', 0.050, 'แยกเข้าโรงงานรีไซเคิลเฉพาะทาง', 'SYSTEM'),
  (4, 'LDPE', 'Low-Density Polyethylene', 'LDPE (เบอร์ 4 - ถุงหิ้ว)', 0.040, 'รวบรวมถุงที่แห้งสะอาด', 'SYSTEM'),
  (5, 'PP', 'Polypropylene', 'PP (เบอร์ 5)', 0.060, 'ล้างคราบอาหารก่อนรีไซเคิล', 'SYSTEM'),
  (6, 'PS', 'Polystyrene', 'PS (เบอร์ 6 - โฟม)', 0.030, 'ลดการใช้ หากทิ้งให้เช็ดคราบอาหาร', 'SYSTEM'),
  (7, 'OTHER', 'Other Plastics', 'พลาสติกอื่นๆ (เบอร์ 7)', 0.020, 'ส่งโครงการขยะกำพร้าหรือ RDF', 'SYSTEM')
ON DUPLICATE KEY UPDATE
  short_name = VALUES(short_name),
  display_name_th = VALUES(display_name_th),
  carbon_factor = VALUES(carbon_factor);

INSERT INTO smart_bins (bin_id, bin_name, status, capacity_note, created_by) VALUES
  ('BIN-01', 'จุดคัดแยกหน้าอาคาร 1 คณะวิทยาศาสตร์และเทคโนโลยี', 'พร้อมใช้งาน', '45%', 'SYSTEM'),
  ('BIN-02', 'จุดคัดแยกโรงอาหารกลาง มหาวิทยาลัยราชภัฏเพชรบูรณ์', 'พร้อมใช้งาน', '78%', 'SYSTEM'),
  ('BIN-03', 'จุดคัดแยกหน้าอาคาร IT และวิทยาการคอมพิวเตอร์', 'พร้อมใช้งาน', '30%', 'SYSTEM'),
  ('BIN-04', 'จุดคัดแยกหอสมุดกลาง (อาคารบรรณราชนครินทร์)', 'พร้อมใช้งาน', '62%', 'SYSTEM'),
  ('BIN-05', 'จุดคัดแยกหน้าอาคารคณะวิทยาการจัดการ', 'พร้อมใช้งาน', '20%', 'SYSTEM'),
  ('BIN-06', 'จุดคัดแยกศูนย์กีฬาและลานกิจกรรมนักศึกษา', 'พร้อมใช้งาน', '50%', 'SYSTEM')
ON DUPLICATE KEY UPDATE
  bin_name = VALUES(bin_name),
  status = VALUES(status);

CREATE OR REPLACE VIEW v_user_waste_1m AS
SELECT
  u.user_id,
  u.full_name,
  u.student_id,
  u.user_role,
  w.record_id,
  w.plastic_type,
  w.bottle_count,
  w.verification_status,
  w.points_awarded,
  w.bin_location,
  DATE_FORMAT(w.upload_timestamp, '%Y-%m-%d %H:%i:%s') AS upload_timestamp
FROM users u
LEFT JOIN waste_records w ON w.user_id = u.user_id AND w.delete_at IS NULL
WHERE u.delete_at IS NULL;

CREATE OR REPLACE VIEW v_user_points_1m AS
SELECT
  u.user_id,
  u.full_name,
  t.transaction_id,
  t.transaction_type,
  t.points_earned,
  t.description,
  DATE_FORMAT(t.transaction_date, '%Y-%m-%d %H:%i:%s') AS transaction_date
FROM users u
LEFT JOIN point_transactions t ON t.user_id = u.user_id AND t.delete_at IS NULL
WHERE u.delete_at IS NULL;

CREATE OR REPLACE VIEW v_user_redemptions_1m AS
SELECT
  u.user_id,
  u.full_name,
  r.redeem_id,
  rw.reward_name,
  r.points_used,
  r.pickup_code,
  r.redeem_status,
  DATE_FORMAT(r.redeem_date, '%Y-%m-%d %H:%i:%s') AS redeem_date
FROM users u
LEFT JOIN redemptions r ON r.user_id = u.user_id AND r.delete_at IS NULL
LEFT JOIN rewards rw ON rw.reward_id = r.reward_id AND rw.delete_at IS NULL
WHERE u.delete_at IS NULL;

CREATE OR REPLACE VIEW v_reward_redemptions_1m AS
SELECT
  rw.reward_id,
  rw.reward_name,
  rw.points_required,
  r.redeem_id,
  u.full_name AS member_name,
  r.points_used,
  r.pickup_code
FROM rewards rw
LEFT JOIN redemptions r ON r.reward_id = rw.reward_id AND r.delete_at IS NULL
LEFT JOIN users u ON u.user_id = r.user_id AND u.delete_at IS NULL
WHERE rw.delete_at IS NULL;

CREATE OR REPLACE VIEW v_bin_waste_1m AS
SELECT
  b.bin_id,
  b.bin_name,
  w.record_id,
  u.full_name,
  w.bottle_count,
  w.verification_status
FROM smart_bins b
LEFT JOIN waste_records w ON w.bin_id = b.bin_id AND w.delete_at IS NULL
LEFT JOIN users u ON u.user_id = w.user_id AND u.delete_at IS NULL
WHERE b.delete_at IS NULL;

CREATE OR REPLACE VIEW v_user_child_counts AS
SELECT
  u.user_id,
  u.full_name,
  u.student_id,
  u.user_role,
  u.total_points,
  (SELECT COUNT(*) FROM waste_records w WHERE w.user_id = u.user_id AND w.delete_at IS NULL) AS waste_count,
  (SELECT COUNT(*) FROM point_transactions t WHERE t.user_id = u.user_id AND t.delete_at IS NULL) AS txn_count,
  (SELECT COUNT(*) FROM redemptions r WHERE r.user_id = u.user_id AND r.delete_at IS NULL) AS redeem_count
FROM users u
WHERE u.delete_at IS NULL;
