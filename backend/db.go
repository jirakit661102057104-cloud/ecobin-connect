package main

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"github.com/go-sql-driver/mysql"
)

func openDB() (*sql.DB, error) {
	dsn, err := mysqlDSN()
	if err != nil {
		return nil, err
	}
	dsn = ensureMySQLTimeouts(dsn)

	log.Printf("connecting to MySQL (%s) …", redactDSN(dsn))

	db, err := sql.Open("mysql", dsn)
	if err != nil {
		return nil, err
	}
	db.SetMaxOpenConns(10)
	db.SetConnMaxLifetime(30 * time.Minute)

	// Fail fast: do not hang for minutes when Cloud SQL public IP is blocked.
	const attempts = 5
	var last error
	for i := 1; i <= attempts; i++ {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		last = db.PingContext(ctx)
		cancel()
		if last == nil {
			log.Printf("MySQL OK (attempt %d/%d)", i, attempts)
			return db, nil
		}
		log.Printf("MySQL ping failed (%d/%d): %v", i, attempts, last)
		if i < attempts {
			time.Sleep(1 * time.Second)
		}
	}
	_ = db.Close()
	return nil, fmt.Errorf(
		"mysql not ready after %d attempts (%s): %w\n"+
			"  → Local: ใช้ MYSQL_DSN ชี้ 127.0.0.1 หลังรัน Cloud SQL Auth Proxy หรือ MySQL ในเครื่อง\n"+
			"  → หรือเพิ่ม IP ปัจจุบันใน Cloud SQL → Connections → Authorized networks\n"+
			"  → ดูคู่มือ docs/guides/05-พัฒนาบนเครื่อง.md",
		attempts, redactDSN(dsn), last,
	)
}

func ensureMySQLTimeouts(dsn string) string {
	add := []string{}
	if !strings.Contains(dsn, "timeout=") {
		add = append(add, "timeout=5s")
	}
	if !strings.Contains(dsn, "readTimeout=") {
		add = append(add, "readTimeout=10s")
	}
	if !strings.Contains(dsn, "writeTimeout=") {
		add = append(add, "writeTimeout=10s")
	}
	if len(add) == 0 {
		return dsn
	}
	sep := "?"
	if strings.Contains(dsn, "?") {
		sep = "&"
	}
	return dsn + sep + strings.Join(add, "&")
}

// redactDSN hides the password even when it contains / # etc.
// Format: user:password@tcp(host:port)/db?...
func redactDSN(dsn string) string {
	at := strings.LastIndex(dsn, "@")
	if at <= 0 {
		return dsn
	}
	colon := strings.Index(dsn[:at], ":")
	if colon < 0 {
		return dsn
	}
	return dsn[:colon+1] + "***" + dsn[at:]
}

func mysqlDSN() (string, error) {
	if conn := strings.TrimSpace(os.Getenv("CLOUD_SQL_CONNECTION_NAME")); conn != "" {
		cfg := mysql.NewConfig()
		cfg.User = getenv("MYSQL_USER", "root")
		cfg.Passwd = os.Getenv("MYSQL_PASS")
		cfg.Net = "unix"
		cfg.Addr = "/cloudsql/" + conn
		cfg.DBName = getenv("MYSQL_DATABASE", "ecobin")
		cfg.ParseTime = true
		cfg.Params = map[string]string{"charset": "utf8mb4", "loc": "Local"}
		cfg.Timeout = 5 * time.Second
		cfg.ReadTimeout = 10 * time.Second
		cfg.WriteTimeout = 10 * time.Second
		return cfg.FormatDSN(), nil
	}
	dsn := os.Getenv("MYSQL_DSN")
	if dsn == "" {
		dsn = "ecobin:ecobin@tcp(127.0.0.1:3306)/ecobin?parseTime=true&charset=utf8mb4&loc=Local"
	}
	return dsn, nil
}

func nullString(s string) sql.NullString {
	if s == "" {
		return sql.NullString{}
	}
	return sql.NullString{String: s, Valid: true}
}

func nullInt(value int) sql.NullInt64 {
	if value <= 0 {
		return sql.NullInt64{}
	}
	return sql.NullInt64{Int64: int64(value), Valid: true}
}
