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
		"waste_auto_approve": "false",
	}
	for k, v := range defaults {
		_, _ = db.Exec(`INSERT IGNORE INTO app_settings (setting_key, setting_value, updated_by) VALUES (?,?,?)`, k, v, actorSystem)
	}
	_, _ = db.Exec(`UPDATE app_settings SET setting_value='false' WHERE setting_key='waste_auto_approve'`)
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
