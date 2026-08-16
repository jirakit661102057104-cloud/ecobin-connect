package main

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/go-sql-driver/mysql"
	_ "github.com/go-sql-driver/mysql"
)

func main() {
	user := os.Getenv("MYSQL_USER")
	pass := os.Getenv("MYSQL_PASS")
	host := os.Getenv("MYSQL_HOST")
	if user == "" {
		user = "root"
	}
	cfg := mysql.NewConfig()
	cfg.User = user
	cfg.Passwd = pass
	cfg.Net = "tcp"
	cfg.Addr = host
	cfg.DBName = "mysql"
	cfg.ParseTime = true
	cfg.TLSConfig = "skip-verify"
	cfg.MultiStatements = true
	cfg.Params = map[string]string{"charset": "utf8mb4", "loc": "Local"}

	db, err := sql.Open("mysql", cfg.FormatDSN())
	if err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
	defer db.Close()
	if err := db.Ping(); err != nil {
		fmt.Println("ping:", err)
		os.Exit(1)
	}

	root, err := filepath.Abs(filepath.Join("..", "infra"))
	if cwd, e2 := os.Getwd(); e2 == nil && strings.HasSuffix(strings.ReplaceAll(cwd, "\\", "/"), "/backend") {
		root, _ = filepath.Abs(filepath.Join(cwd, "..", "infra"))
	}
	_ = root
	infra := filepath.Join("..", "infra")
	if _, err := os.Stat(filepath.Join(infra, "schema.sql")); err != nil {
		infra = filepath.Join("infra")
	}

	schema, err := os.ReadFile(filepath.Join(infra, "schema.sql"))
	if err != nil {
		fmt.Println("schema:", err)
		os.Exit(1)
	}
	if _, err := db.Exec(string(schema)); err != nil {
		fmt.Println("exec schema:", err)
		os.Exit(1)
	}
	fmt.Println("schema applied")

	lookups, err := os.ReadFile(filepath.Join(infra, "lookups.sql"))
	if err != nil {
		fmt.Println("lookups:", err)
		os.Exit(1)
	}
	if _, err := db.Exec(string(lookups)); err != nil {
		fmt.Println("exec lookups:", err)
		os.Exit(1)
	}
	fmt.Println("lookups applied")

	views, err := os.ReadFile(filepath.Join(infra, "views.sql"))
	if err != nil {
		fmt.Println("views:", err)
		os.Exit(1)
	}
	if _, err := db.Exec(string(views)); err != nil {
		fmt.Println("exec views:", err)
		os.Exit(1)
	}
	fmt.Println("views applied")

	cfg.DBName = "ecobin"
	dsn := cfg.FormatDSN()
	envPath := "backend.env"
	raw, err := os.ReadFile(envPath)
	if err != nil {
		fmt.Println("write env:", err)
		os.Exit(1)
	}
	text := string(raw)
	const prefix = "MYSQL_DSN="
	out := ""
	found := false
	for _, line := range strings.Split(text, "\n") {
		if strings.HasPrefix(strings.TrimSpace(line), prefix) {
			out += prefix + dsn + "\n"
			found = true
			continue
		}
		out += line + "\n"
	}
	if !found {
		out += prefix + dsn + "\n"
	}
	if err := os.WriteFile(envPath, []byte(strings.TrimRight(out, "\n")+"\n"), 0600); err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
	fmt.Println("updated backend.env MYSQL_DSN")

	cfg.DBName = "ecobin"
	db2, err := sql.Open("mysql", cfg.FormatDSN())
	if err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
	defer db2.Close()
	rows, err := db2.Query(`SELECT table_name FROM information_schema.tables WHERE table_schema='ecobin' ORDER BY table_name`)
	if err != nil {
		fmt.Println("list tables:", err)
		os.Exit(1)
	}
	defer rows.Close()
	fmt.Println("tables in ecobin:")
	for rows.Next() {
		var name string
		_ = rows.Scan(&name)
		var n int
		_ = db2.QueryRow("SELECT COUNT(*) FROM `" + name + "`").Scan(&n)
		fmt.Printf("  - %s (%d rows)\n", name, n)
	}
}
