package main

import (
	"testing"
	"time"
)

func TestLoginLimiterLocksAfterMaxFailures(t *testing.T) {
	l := &loginLimiter{failures: map[string][]time.Time{}, max: 3, window: time.Minute}
	for i := 0; i < 2; i++ {
		l.fail("User@Mail.com")
	}
	if locked, _ := l.blocked("user@mail.com"); locked {
		t.Fatal("locked too early")
	}
	l.fail(" user@mail.com ")
	if locked, wait := l.blocked("USER@mail.com"); !locked || wait <= 0 {
		t.Fatalf("expected lock, got locked=%v wait=%v", locked, wait)
	}
	if locked, _ := l.blocked("other"); locked {
		t.Fatal("other login must not be locked")
	}
	l.reset("user@mail.com")
	if locked, _ := l.blocked("user@mail.com"); locked {
		t.Fatal("reset should unlock")
	}
}

func TestLoginLimiterExpiresOldFailures(t *testing.T) {
	l := &loginLimiter{failures: map[string][]time.Time{}, max: 2, window: time.Minute}
	old := time.Now().Add(-2 * time.Minute)
	l.failures["a"] = []time.Time{old, old}
	if locked, _ := l.blocked("a"); locked {
		t.Fatal("expired failures should not lock")
	}
}
