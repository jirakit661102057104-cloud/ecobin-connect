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
