package main

import (
	"database/sql"
	"fmt"
	"os"
	"strings"

	_ "github.com/go-sql-driver/mysql"
	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Overload("backend.env")
	dsn := os.Getenv("MYSQL_DSN")
	if !strings.Contains(dsn, "multiStatements=true") {
		if strings.Contains(dsn, "?") {
			dsn += "&multiStatements=true"
		} else {
			dsn += "?multiStatements=true"
		}
	}
	db, err := sql.Open("mysql", dsn)
	if err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
	defer db.Close()
	if err := db.Ping(); err != nil {
		fmt.Println("ping:", err)
		os.Exit(1)
	}

	tables := []string{
		"users", "plastic_types", "smart_bins", "waste_records",
		"point_transactions", "rewards", "redemptions", "guest_logs",
	}
	cols := [][2]string{
		{"created_at", "DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'เวลาที่สร้าง'"},
		{"created_by", "VARCHAR(32) NULL COMMENT 'ผู้สร้าง (user_id หรือ SYSTEM)'"},
		{"delete_at", "DATETIME NULL COMMENT 'เวลาที่ลบแบบ soft delete'"},
		{"delete_by", "VARCHAR(32) NULL COMMENT 'ผู้ลบ (user_id หรือ SYSTEM)'"},
	}
	for _, table := range tables {
		for _, col := range cols {
			var n int
			_ = db.QueryRow(`SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name=? AND column_name=?`, table, col[0]).Scan(&n)
			if n > 0 {
				fmt.Printf("ok %s.%s\n", table, col[0])
				continue
			}
			q := fmt.Sprintf("ALTER TABLE `%s` ADD COLUMN `%s` %s", table, col[0], col[1])
			if _, err := db.Exec(q); err != nil {
				fmt.Printf("fail %s.%s: %v\n", table, col[0], err)
				os.Exit(1)
			}
			fmt.Printf("added %s.%s\n", table, col[0])
		}
	}

	views, err := os.ReadFile("../infra/views.sql")
	if err != nil {
		fmt.Println("views:", err)
		os.Exit(1)
	}
	if _, err := db.Exec(string(views)); err != nil {
		fmt.Println("apply views:", err)
		os.Exit(1)
	}
	fmt.Println("views updated")
}
