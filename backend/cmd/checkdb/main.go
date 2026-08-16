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
	rows, err := db.Query(`
		SELECT table_name,
		       table_rows
		FROM information_schema.tables
		WHERE table_schema = 'ecobin' AND table_type = 'BASE TABLE'
		ORDER BY table_name`)
	if err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
	defer rows.Close()
	fmt.Println("database: ecobin")
	fmt.Println("table_name\tapprox_rows")
	for rows.Next() {
		var name string
		var n sql.NullInt64
		_ = rows.Scan(&name, &n)
		var exact int
		_ = db.QueryRow("SELECT COUNT(*) FROM `" + name + "`").Scan(&exact)
		fmt.Printf("%s\t%d\n", name, exact)
	}
}
