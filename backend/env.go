package main

import (
	"log"
	"os"
	"path/filepath"
	"strings"

	"github.com/joho/godotenv"
)

func loadBackendEnv() {
	var candidates []string
	if root := os.Getenv("ECOBIN_ROOT"); root != "" {
		candidates = append(candidates,
			filepath.Join(root, "backend", "backend.env"),
			filepath.Join(root, "backend.env"),
		)
	}
	cwd, _ := os.Getwd()
	exe, _ := os.Executable()
	candidates = append(candidates,
		filepath.Join(cwd, "backend.env"),
		filepath.Join(cwd, "..", "backend", "backend.env"),
		filepath.Join(cwd, "..", "backend.env"),
	)
	if exe != "" {
		dir := filepath.Dir(exe)
		candidates = append(candidates,
			filepath.Join(dir, "backend.env"),
			filepath.Join(dir, "..", "backend", "backend.env"),
		)
	}

	for _, p := range candidates {
		abs, err := filepath.Abs(p)
		if err != nil {
			continue
		}
		if _, err := os.Stat(abs); err == nil {
			if err := godotenv.Overload(abs); err == nil {
				log.Printf("loaded config %s", abs)
				applyPortDefaults()
				return
			}
		}
	}
	_ = godotenv.Load()
	applyPortDefaults()
}

func applyPortDefaults() {
	if os.Getenv("API_ADDR") != "" {
		return
	}
	port := strings.TrimSpace(os.Getenv("PORT"))
	if port == "" {
		port = strings.TrimSpace(os.Getenv("API_PORT"))
	}
	if port == "" {
		port = "8080"
	}
	_ = os.Setenv("API_ADDR", ":"+port)
}

func isProd() bool {
	v := strings.ToLower(strings.TrimSpace(os.Getenv("APP_ENV")))
	return v == "production" || v == "prod"
}

func envTrue(key string, def bool) bool {
	v := strings.ToLower(strings.TrimSpace(os.Getenv(key)))
	if v == "" {
		return def
	}
	return v == "1" || v == "true" || v == "yes"
}

func getenv(key, def string) string {
	v := strings.TrimSpace(os.Getenv(key))
	if v == "" {
		return def
	}
	return v
}

func corsOrigins() []string {
	raw := os.Getenv("CORS_ORIGIN")
	if raw == "" {
		raw = "http://localhost:3000"
	}
	var out []string
	for _, part := range strings.Split(raw, ",") {
		origin := strings.TrimSpace(part)
		if origin == "" {
			continue
		}
		out = append(out, origin)
		if alt := strings.Replace(origin, "localhost", "127.0.0.1", 1); alt != origin {
			out = append(out, alt)
		}
	}
	return out
}
