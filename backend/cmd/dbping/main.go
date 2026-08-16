package main

import (
	"database/sql"
	"fmt"
	"os"

	"github.com/go-sql-driver/mysql"
	_ "github.com/go-sql-driver/mysql"
)

func main() {
	user := os.Getenv("MYSQL_USER")
	pass := os.Getenv("MYSQL_PASS")
	host := os.Getenv("MYSQL_HOST")
	if user == "" || pass == "" || host == "" {
		fmt.Println("set MYSQL_USER MYSQL_PASS MYSQL_HOST")
		os.Exit(1)
	}
	cfg := mysql.NewConfig()
	cfg.User = user
	cfg.Passwd = pass
	cfg.Net = "tcp"
	cfg.Addr = host
	cfg.DBName = "mysql"
	cfg.ParseTime = true
	cfg.Params = map[string]string{"charset": "utf8mb4"}

	for _, tls := range []string{"skip-verify", "false"} {
		cfg.TLSConfig = tls
		if tls == "false" {
			cfg.TLSConfig = ""
		}
		db, err := sql.Open("mysql", cfg.FormatDSN())
		if err != nil {
			fmt.Println("open", tls, err)
			continue
		}
		err = db.Ping()
		_ = db.Close()
		if err == nil {
			fmt.Println("connected OK as", user, "tls="+tls)
			os.Exit(0)
		}
		fmt.Println("fail", user, "tls="+tls, ":", err)
	}
	os.Exit(1)
}
