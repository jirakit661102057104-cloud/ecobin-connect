package main

import (
	"strings"
	"testing"
)

func TestRedactDSN(t *testing.T) {
	in := `root:kp/|Njk#gFjE<4G.@tcp(136.85.49.189:3306)/ecobin?parseTime=true`
	out := redactDSN(in)
	if strings.Contains(out, "Njk") || strings.Contains(out, "gFjE") {
		t.Fatalf("password leaked in redactDSN: %s", out)
	}
	want := `root:***@tcp(136.85.49.189:3306)/ecobin?parseTime=true`
	if out != want {
		t.Fatalf("unexpected redact:\n got %s\nwant %s", out, want)
	}
}
