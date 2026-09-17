package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
)

const actorSystem = "SYSTEM"

func migrateSoftDelete(db *sql.DB) error {
	tables := []string{
		"users", "plastic_types", "smart_bins", "waste_records",
		"point_transactions", "rewards", "redemptions", "guest_logs",
	}
	for _, table := range tables {
		if err := addColumnIfMissing(db, table, "created_at",
			"DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'เวลาที่สร้าง'"); err != nil {
			return err
		}
		if err := addColumnIfMissing(db, table, "created_by",
			"VARCHAR(32) NULL COMMENT 'ผู้สร้าง (user_id หรือ SYSTEM)'"); err != nil {
			return err
		}
		if err := addColumnIfMissing(db, table, "delete_at",
			"DATETIME NULL COMMENT 'เวลาที่ลบแบบ soft delete — NULL คือยังใช้งาน'"); err != nil {
			return err
		}
		if err := addColumnIfMissing(db, table, "delete_by",
			"VARCHAR(32) NULL COMMENT 'ผู้ลบ (user_id หรือ SYSTEM)'"); err != nil {
			return err
		}
	}
	_, _ = db.Exec(`UPDATE plastic_types SET created_by=? WHERE created_by IS NULL`, actorSystem)
	_, _ = db.Exec(`UPDATE smart_bins SET created_by=? WHERE created_by IS NULL`, actorSystem)
	if err := applyViews(db); err != nil {
		return err
	}
	log.Println("soft-delete columns ready (created_at, created_by, delete_at, delete_by)")
	if err := migrateAuthProviders(db); err != nil {
		return err
	}
	if err := migrateNameFields(db); err != nil {
		return err
	}
	if err := migrateAppSettings(db); err != nil {
		return err
	}
	if err := migrateWasteResubmitStatus(db); err != nil {
		return err
	}
	if err := migratePlasticPoints(db); err != nil {
		return err
	}
	if err := migrateCarbonAccounting(db); err != nil {
		return err
	}
	if err := migrateEventLog(db); err != nil {
		return err
	}
	return nil
}

func migrateEventLog(db *sql.DB) error {
	stmts := []string{
		`CREATE TABLE IF NOT EXISTS model_versions (
		  version_id VARCHAR(40) PRIMARY KEY,
		  provider ENUM('ecobin_local','teachable_machine') NOT NULL DEFAULT 'ecobin_local',
		  display_name VARCHAR(160) NOT NULL,
		  model_url VARCHAR(500) NOT NULL,
		  labels_json JSON NOT NULL,
		  is_active BOOLEAN NOT NULL DEFAULT FALSE,
		  notes TEXT NULL,
		  accuracy_summary_json JSON NULL,
		  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
		  created_by VARCHAR(32) NULL,
		  delete_at DATETIME NULL,
		  delete_by VARCHAR(32) NULL,
		  KEY idx_model_active (is_active, delete_at)
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
		`CREATE TABLE IF NOT EXISTS model_training_samples (
		  sample_id VARCHAR(40) PRIMARY KEY,
		  label ENUM('PLASTIC_BOTTLE','CAN','INVALID') NOT NULL,
		  image_url TEXT NOT NULL,
		  source ENUM('user_scan','trashnet','manual','guest_scan') NOT NULL DEFAULT 'user_scan',
		  confidence DECIMAL(6,2) NULL,
		  record_id VARCHAR(32) NULL,
		  model_version_id VARCHAR(40) NULL,
		  approved_for_train BOOLEAN NOT NULL DEFAULT TRUE,
		  metadata_json JSON NULL,
		  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
		  created_by VARCHAR(32) NULL,
		  delete_at DATETIME NULL,
		  delete_by VARCHAR(32) NULL,
		  KEY idx_sample_label (label, approved_for_train, delete_at),
		  KEY idx_sample_record (record_id),
		  KEY idx_sample_version (model_version_id)
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
		`CREATE TABLE IF NOT EXISTS system_events (
		  event_id VARCHAR(40) PRIMARY KEY,
		  event_type VARCHAR(64) NOT NULL,
		  event_source ENUM('frontend','backend','admin','system') NOT NULL DEFAULT 'backend',
		  actor_user_id VARCHAR(32) NULL,
		  correlation_id VARCHAR(64) NULL,
		  entity_type VARCHAR(40) NULL,
		  entity_id VARCHAR(64) NULL,
		  message VARCHAR(500) NULL,
		  payload_json JSON NULL,
		  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
		  KEY idx_events_type_time (event_type, created_at),
		  KEY idx_events_corr (correlation_id),
		  KEY idx_events_actor (actor_user_id, created_at),
		  KEY idx_events_entity (entity_type, entity_id)
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
	}
	for _, stmt := range stmts {
		if _, err := db.Exec(stmt); err != nil {
			return fmt.Errorf("migrateEventLog: %w", err)
		}
	}
	// Optional FKs — ignore if already exist / engine limits
	_, _ = db.Exec(`ALTER TABLE model_training_samples
		ADD CONSTRAINT fk_sample_record FOREIGN KEY (record_id) REFERENCES waste_records(record_id)
		ON UPDATE CASCADE ON DELETE SET NULL`)
	_, _ = db.Exec(`ALTER TABLE model_training_samples
		ADD CONSTRAINT fk_sample_model FOREIGN KEY (model_version_id) REFERENCES model_versions(version_id)
		ON UPDATE CASCADE ON DELETE SET NULL`)

	store := &Store{db: db}
	store.ensureDefaultModelVersion()
	log.Println("event log tables ready (system_events, model_training_samples, model_versions)")
	return nil
}

func migrateCarbonAccounting(db *sql.DB) error {
	if err := addColumnIfMissing(db, "plastic_types", "average_weight_kg",
		"DECIMAL(8,5) NOT NULL DEFAULT 0.00000 COMMENT 'น้ำหนักเฉลี่ยต่อชิ้น (kg); ใช้เมื่อไม่มีน้ำหนักจริง'"); err != nil {
		return err
	}
	_, _ = db.Exec(`INSERT IGNORE INTO plastic_types
		(plastic_code, short_name, full_name, display_name_th, carbon_factor, average_weight_kg, points_per_bottle, recycling_tips, created_by)
		VALUES (8, 'CAN', 'Aluminium Beverage Can', 'กระป๋องอะลูมิเนียม', 0.082, 0.01400, 10,
			'เทของเหลวออก ล้างและบีบกระป๋องก่อนนำไปรีไซเคิล', ?)`, actorSystem)
	wasteColumns := []struct {
		name string
		ddl  string
	}{
		{"weight_kg", "DECIMAL(10,5) NOT NULL DEFAULT 0.00000 COMMENT 'น้ำหนักที่ใช้คำนวณ kg'"},
		{"carbon_footprint", "DECIMAL(12,5) NOT NULL DEFAULT 0.00000 COMMENT 'คาร์บอนฟุตพริ้นท์ kgCO2e'"},
		{"carbon_avoided", "DECIMAL(12,5) NOT NULL DEFAULT 0.00000 COMMENT 'การปล่อยที่หลีกเลี่ยงได้ kgCO2e'"},
		{"emission_factor_version", "VARCHAR(80) NULL COMMENT 'snapshot รุ่นปัจจัยการปล่อยที่ใช้'"},
	}
	for _, col := range wasteColumns {
		if err := addColumnIfMissing(db, "waste_records", col.name, col.ddl); err != nil {
			return err
		}
	}

	_, err := db.Exec(`CREATE TABLE IF NOT EXISTS emission_factors (
		emission_factor_id VARCHAR(40) PRIMARY KEY,
		plastic_code TINYINT NOT NULL,
		factor_type ENUM('virgin_production','recycled_production') NOT NULL,
		factor_value DECIMAL(10,4) NOT NULL,
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
	) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`)
	if err != nil {
		return fmt.Errorf("create emission_factors: %w", err)
	}

	// EF ยึดตามโปรแกรมคำนวณของ Circular Material Hub (CMH) ซึ่งอ้างอิง Emission Factor ของ TGO
	// https://circularmaterialhub.com/Calculate.php
	// ที่มาที่ CMH ระบุ: คาร์บอนฟุตพริ้นท์ของผลิตภัณฑ์ TGO (2565)
	const cmhURL = "https://circularmaterialhub.com/Calculate.php"
	const tgoEFPDF = "http://thaicarbonlabel.tgo.or.th/admin/uploadfiles/emission/ts_af09c20f4f.pdf"
	factors := []struct {
		id      string
		code    int
		kind    string
		value   float64
		source  string
		url     string
		version string
		active  bool
		expires any
	}{
		// พลาสติก: ค่า EF จากฐาน LCI/TGO (ชุดเดียวกับที่เครื่องมือ CFP ไทยใช้ — CMH อ้างแหล่งเดียวกัน)
		{"TGO-PET-VIRGIN-2026", 1, "virgin_production", 2.9389, "Thai National LCI / TGO (via CMH methodology)", tgoEFPDF, "Update_April2026", true, nil},
		{"TGO-HDPE-VIRGIN-2026", 2, "virgin_production", 2.4664, "Thai National LCI / TGO (via CMH methodology)", tgoEFPDF, "Update_April2026", true, nil},
		{"TGO-PVC-VIRGIN-2026", 3, "virgin_production", 3.0658, "Thai National LCI / TGO (via CMH methodology)", tgoEFPDF, "Update_April2026", true, nil},
		{"TGO-LDPE-VIRGIN-2026", 4, "virgin_production", 2.4345, "Thai National LCI / TGO (via CMH methodology)", tgoEFPDF, "Update_April2026", true, nil},
		{"TGO-PP-VIRGIN-2026", 5, "virgin_production", 2.0366, "Thai National LCI / TGO (via CMH methodology)", tgoEFPDF, "Update_April2026", true, nil},
		{"TGO-PS-VIRGIN-2026", 6, "virgin_production", 2.1815, "Thai National LCI / TGO (via CMH methodology)", tgoEFPDF, "Update_April2026", true, nil},
		// กระป๋อง: ค่าจากตารางกิจกรรม/ผลิตภัณฑ์ของ CMH Calculate.php
		{"CMH-AL-SHEET-2565", 8, "virgin_production", 3.2231, "CMH: Aluminium Sheet (นำกลับมาใช้ประโยชน์)", cmhURL, "CMH-AL-Sheet-2565", true, nil},
		{"CMH-AL-SEC-OLD-SCRAP-2565", 8, "recycled_production", 1.4682, "CMH: Aluminium Secondary (from old scrap)", cmhURL, "CMH-AL-OldScrap-2565", true, nil},
		{"CMH-AL-SEC-NEW-SCRAP-2565", 8, "recycled_production", 0.4329, "CMH: Aluminium Secondary (from new scrap)", cmhURL, "CMH-AL-NewScrap-2565", false, nil},
		// ค่าเดิม/อ้างอิง — ไม่ใช้คำนวณอัตโนมัติ
		{"TGO-AL-FLAT-ROLLED-2026", 8, "virgin_production", 5.8236, "Thai National LCI Database / TGO (legacy)", tgoEFPDF, "Update_April2026-AL-legacy", false, nil},
		{"TGO-PET-RECYCLED-2023", 1, "recycled_production", 1.1000, "TGO CFP FY23-043-0259 (InnoEco TN080FB)", tgoEFPDF, "FY23-043-0259", false, "2025-11-28"},
	}
	for _, f := range factors {
		_, _ = db.Exec(`INSERT INTO emission_factors
			(emission_factor_id, plastic_code, factor_type, factor_value, source_name, source_url, source_version, effective_date, expires_at, is_active, created_by)
			VALUES (?,?,?,?,?,?,?,'2026-04-01',?,?,?)
			ON DUPLICATE KEY UPDATE factor_value=VALUES(factor_value), source_name=VALUES(source_name),
				source_url=VALUES(source_url), is_active=VALUES(is_active), expires_at=VALUES(expires_at)`,
			f.id, f.code, f.kind, f.value, f.source, f.url, f.version, f.expires, f.active, actorSystem)
	}
	// ให้ CMH Aluminium Sheet เป็น baseline ที่ active เพียงตัวเดียวสำหรับรหัส 8
	_, _ = db.Exec(`UPDATE emission_factors SET is_active=FALSE
		WHERE plastic_code=8 AND factor_type='virgin_production' AND emission_factor_id<>'CMH-AL-SHEET-2565'`)
	_, _ = db.Exec(`UPDATE emission_factors SET is_active=TRUE
		WHERE emission_factor_id='CMH-AL-SHEET-2565'`)
	_, _ = db.Exec(`UPDATE emission_factors SET is_active=FALSE
		WHERE plastic_code=8 AND factor_type='recycled_production' AND emission_factor_id<>'CMH-AL-SEC-OLD-SCRAP-2565'`)
	_, _ = db.Exec(`UPDATE emission_factors SET is_active=TRUE
		WHERE emission_factor_id='CMH-AL-SEC-OLD-SCRAP-2565'`)

	// รักษาค่า footprint ต่อชิ้นเดิมโดยแปลงกลับเป็นน้ำหนักเฉลี่ย: legacy kgCO2e/piece ÷ TGO kgCO2e/kg
	_, _ = db.Exec(`UPDATE plastic_types p
		JOIN emission_factors e ON e.plastic_code=p.plastic_code
			AND e.factor_type='virgin_production' AND e.is_active=TRUE
		SET p.average_weight_kg=ROUND(p.carbon_factor/e.factor_value,5)
		WHERE p.average_weight_kg=0`)
	_, _ = db.Exec(`UPDATE waste_records w
		JOIN plastic_types p ON LOWER(w.plastic_type) LIKE
			CONCAT('%', LOWER(TRIM(SUBSTRING_INDEX(p.short_name,'/',1))), '%')
		SET w.plastic_code=p.plastic_code
		WHERE w.plastic_code IS NULL`)
	_, _ = db.Exec(`UPDATE waste_records w
		JOIN plastic_types p ON p.plastic_code=w.plastic_code
		JOIN emission_factors e ON e.plastic_code=p.plastic_code
			AND e.factor_type='virgin_production' AND e.is_active=TRUE
			AND (e.effective_date IS NULL OR e.effective_date<=CURDATE())
			AND (e.expires_at IS NULL OR e.expires_at>=CURDATE())
		SET w.weight_kg=ROUND(w.bottle_count*p.average_weight_kg,5),
			w.carbon_footprint=ROUND(w.bottle_count*p.average_weight_kg*e.factor_value,5),
			w.emission_factor_version=e.source_version
		WHERE w.verification_status='อนุมัติแล้ว' AND w.carbon_footprint=0`)
	log.Println("carbon accounting columns and TGO emission factors ready")
	return nil
}

func migratePlasticPoints(db *sql.DB) error {
	if err := addColumnIfMissing(db, "plastic_types", "points_per_bottle",
		"INT NOT NULL DEFAULT 10 COMMENT 'แต้มต่อขวดเมื่อแอดมินอนุมัติ'"); err != nil {
		return err
	}
	log.Println("plastic_types.points_per_bottle ready")
	return nil
}

func migrateWasteResubmitStatus(db *sql.DB) error {
	_, err := db.Exec(`ALTER TABLE waste_records
		MODIFY COLUMN verification_status ENUM('รอการตรวจสอบ', 'อนุมัติแล้ว', 'ไม่อนุมัติ', 'กรุณาส่งภาพมาใหม่')
		NOT NULL DEFAULT 'รอการตรวจสอบ'`)
	if err != nil {
		return fmt.Errorf("waste resubmit status: %w", err)
	}
	log.Println("waste verification status includes กรุณาส่งภาพมาใหม่")
	return nil
}

func migrateAppSettings(db *sql.DB) error {
	_, err := db.Exec(`CREATE TABLE IF NOT EXISTS app_settings (
		setting_key VARCHAR(64) PRIMARY KEY,
		setting_value TEXT NOT NULL,
		updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
		updated_by VARCHAR(32) NULL
	) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`)
	if err != nil {
		return err
	}
	defaults := map[string]string{
		"points_per_bottle":  "10",
		"carbon_per_bottle":  "0.08",
		"announcement":       "",
		"waste_auto_approve": "true",
	}
	for k, v := range defaults {
		_, _ = db.Exec(`INSERT IGNORE INTO app_settings (setting_key, setting_value, updated_by) VALUES (?,?,?)`, k, v, actorSystem)
	}
	_, _ = db.Exec(`UPDATE app_settings SET setting_value='true' WHERE setting_key='waste_auto_approve'`)
	_, _ = db.Exec(`UPDATE waste_records SET points_awarded=0, carbon_saved=0
		WHERE delete_at IS NULL AND verification_status IN ('รอการตรวจสอบ','ไม่อนุมัติ','กรุณาส่งภาพมาใหม่')`)
	log.Println("app_settings ready")
	return nil
}

func migrateNameFields(db *sql.DB) error {
	if err := addColumnIfMissing(db, "users", "first_name",
		"VARCHAR(100) NOT NULL DEFAULT '' COMMENT 'ชื่อ'"); err != nil {
		return err
	}
	if err := addColumnIfMissing(db, "users", "last_name",
		"VARCHAR(100) NOT NULL DEFAULT '' COMMENT 'นามสกุล'"); err != nil {
		return err
	}
	_, _ = db.Exec(`UPDATE users SET
		first_name = TRIM(SUBSTRING_INDEX(full_name, ' ', 1)),
		last_name = TRIM(CASE
			WHEN TRIM(full_name) LIKE '% %' THEN SUBSTRING(full_name, LOCATE(' ', TRIM(full_name)) + 1)
			ELSE '-'
		END)
		WHERE IFNULL(first_name,'') = '' AND IFNULL(full_name,'') <> ''`)
	_, _ = db.Exec(`CREATE TABLE IF NOT EXISTS email_otps (
		email VARCHAR(255) PRIMARY KEY,
		code_hash VARCHAR(255) NOT NULL,
		expires_at DATETIME NOT NULL,
		created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
	) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`)
	log.Println("name fields and email OTP table ready")
	return nil
}

func migrateAuthProviders(db *sql.DB) error {
	if err := addColumnIfMissing(db, "users", "phone",
		"VARCHAR(20) NULL COMMENT 'เบอร์โทรศัพท์'"); err != nil {
		return err
	}
	if err := addColumnIfMissing(db, "users", "auth_provider",
		"VARCHAR(20) NOT NULL DEFAULT 'email' COMMENT 'email / phone / google'"); err != nil {
		return err
	}
	if err := addColumnIfMissing(db, "users", "google_sub",
		"VARCHAR(64) NULL COMMENT 'Google subject'"); err != nil {
		return err
	}
	// Google avatar URLs can exceed 500 chars with query params.
	_, _ = db.Exec(`ALTER TABLE users MODIFY COLUMN avatar_url VARCHAR(1000) NULL`)
	_, _ = db.Exec(`CREATE TABLE IF NOT EXISTS phone_otps (
		phone VARCHAR(20) PRIMARY KEY,
		code_hash VARCHAR(255) NOT NULL,
		expires_at DATETIME NOT NULL,
		created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
	) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`)
	log.Println("auth provider columns ready (phone, google)")
	return nil
}

func addColumnIfMissing(db *sql.DB, table, column, definition string) error {
	var n int
	err := db.QueryRow(`
		SELECT COUNT(*) FROM information_schema.columns
		WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`,
		table, column).Scan(&n)
	if err != nil {
		return fmt.Errorf("check column %s.%s: %w", table, column, err)
	}
	if n > 0 {
		return nil
	}
	_, err = db.Exec(fmt.Sprintf("ALTER TABLE `%s` ADD COLUMN `%s` %s", table, column, definition))
	if err != nil {
		return fmt.Errorf("add column %s.%s: %w", table, column, err)
	}
	log.Printf("added %s.%s", table, column)
	return nil
}

func applyViews(db *sql.DB) error {
	candidates := []string{
		filepath.Join("..", "infra", "views.sql"),
		filepath.Join("infra", "views.sql"),
	}
	if cwd, err := os.Getwd(); err == nil {
		candidates = append(candidates, filepath.Join(cwd, "..", "infra", "views.sql"))
	}
	var sqlBytes []byte
	var err error
	for _, p := range candidates {
		sqlBytes, err = os.ReadFile(p)
		if err == nil {
			break
		}
	}
	if err != nil {
		log.Printf("skip views.sql: %v", err)
		return nil
	}
	text := strings.ReplaceAll(string(sqlBytes), "\r\n", "\n")
	for _, stmt := range strings.Split(text, ";") {
		stmt = strings.TrimSpace(stmt)
		if stmt == "" || strings.HasPrefix(strings.ToUpper(stmt), "USE ") {
			continue
		}
		if _, err := db.Exec(stmt); err != nil {
			return fmt.Errorf("apply views: %w", err)
		}
	}
	return nil
}
