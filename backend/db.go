package main

import (
	"database/sql"
	"fmt"
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
	db, err := sql.Open("mysql", dsn)
	if err != nil {
		return nil, err
	}
	db.SetMaxOpenConns(10)
	db.SetConnMaxLifetime(30 * time.Minute)

	var last error
	for i := 0; i < 30; i++ {
		if last = db.Ping(); last == nil {
			return db, nil
		}
		time.Sleep(2 * time.Second)
	}
	return nil, fmt.Errorf("mysql not ready: %w", last)
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
