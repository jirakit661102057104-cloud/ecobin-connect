package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	_ "github.com/go-sql-driver/mysql"
)

func main() {
	dsn := strings.TrimSpace(os.Getenv("MYSQL_DSN"))
	if dsn == "" {
		dsn = "ecobin:ecobin@tcp(127.0.0.1:3306)/ecobin?parseTime=true&charset=utf8mb4&loc=Local"
	}
	db, err := sql.Open("mysql", dsn)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()
	db.SetConnMaxLifetime(5 * time.Second)
	if err := db.Ping(); err != nil {
		log.Fatalf("ping db: %v", err)
	}

	add := func(col, def string) {
		var n int
		_ = db.QueryRow(`SELECT COUNT(*) FROM information_schema.columns
			WHERE table_schema = DATABASE() AND table_name='users' AND column_name=?`, col).Scan(&n)
		if n > 0 {
			fmt.Println("skip column", col)
			return
		}
		q := fmt.Sprintf("ALTER TABLE users ADD COLUMN %s %s", col, def)
		if _, err := db.Exec(q); err != nil {
			log.Fatalf("add %s: %v", col, err)
		}
		fmt.Println("added", col)
	}

	add("first_name", "VARCHAR(100) NOT NULL DEFAULT '' COMMENT 'ชื่อ' AFTER full_name")
	add("last_name", "VARCHAR(100) NOT NULL DEFAULT '' COMMENT 'นามสกุล' AFTER first_name")
	add("username", "VARCHAR(32) NULL COMMENT 'ชื่อผู้ใช้เข้าสู่ระบบ' AFTER last_name")
	add("phone", "VARCHAR(20) NULL COMMENT 'เบอร์โทร 10 หลัก' AFTER department")
	add("auth_provider", "VARCHAR(20) NOT NULL DEFAULT 'username' COMMENT 'username|email|phone|google' AFTER phone")
	add("google_sub", "VARCHAR(64) NULL COMMENT 'Google subject legacy' AFTER auth_provider")

	_, _ = db.Exec(`ALTER TABLE users MODIFY COLUMN avatar_url VARCHAR(1000) NULL`)
	_, _ = db.Exec(`ALTER TABLE users MODIFY COLUMN auth_provider VARCHAR(20) NOT NULL DEFAULT 'username' COMMENT 'username | email | phone | google(legacy)'`)

	ensureIdx := func(name, col string) {
		var n int
		_ = db.QueryRow(`SELECT COUNT(*) FROM information_schema.statistics
			WHERE table_schema=DATABASE() AND table_name='users' AND index_name=?`, name).Scan(&n)
		if n > 0 {
			fmt.Println("skip index", name)
			return
		}
		if _, err := db.Exec(fmt.Sprintf("CREATE UNIQUE INDEX `%s` ON users (`%s`)", name, col)); err != nil {
			log.Printf("index %s: %v", name, err)
			return
		}
		fmt.Println("added index", name)
	}
	ensureIdx("uq_users_username", "username")
	ensureIdx("uq_users_phone", "phone")

	res, err := db.Exec(`UPDATE users SET username = LOWER(student_id)
		WHERE username IS NULL AND (
			auth_provider = 'username'
			OR email LIKE '%@users.ecobin.local'
			OR student_id REGEXP '^[A-Za-z][A-Za-z0-9._]{3,31}$'
		)`)
	if err != nil {
		log.Printf("backfill: %v", err)
	} else {
		n, _ := res.RowsAffected()
		fmt.Println("backfilled username rows:", n)
	}

	var cols string
	_ = db.QueryRow(`SELECT GROUP_CONCAT(column_name ORDER BY ordinal_position)
		FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='users'`).Scan(&cols)
	fmt.Println("users columns:", cols)
	fmt.Println("migrate-auth-username done")
}
