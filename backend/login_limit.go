package main

import (
	"strings"
	"sync"
	"time"
)

// loginLimiter blocks a login name after too many wrong passwords.
// Keyed by login name (not IP) because requests arrive through the Vercel proxy.
type loginLimiter struct {
	mu       sync.Mutex
	failures map[string][]time.Time
	max      int
	window   time.Duration
}

var loginGuard = &loginLimiter{failures: map[string][]time.Time{}, max: 8, window: 15 * time.Minute}

func (l *loginLimiter) key(login string) string {
	return strings.ToLower(strings.TrimSpace(login))
}

func (l *loginLimiter) prune(k string, now time.Time) []time.Time {
	kept := l.failures[k][:0]
	for _, t := range l.failures[k] {
		if now.Sub(t) < l.window {
			kept = append(kept, t)
		}
	}
	if len(kept) == 0 {
		delete(l.failures, k)
		return nil
	}
	l.failures[k] = kept
	return kept
}

// blocked reports whether the login is locked and for how long.
func (l *loginLimiter) blocked(login string) (bool, time.Duration) {
	l.mu.Lock()
	defer l.mu.Unlock()
	now := time.Now()
	f := l.prune(l.key(login), now)
	if len(f) < l.max {
		return false, 0
	}
	return true, l.window - now.Sub(f[0])
}

func (l *loginLimiter) fail(login string) {
	l.mu.Lock()
	defer l.mu.Unlock()
	k := l.key(login)
	l.failures[k] = append(l.prune(k, time.Now()), time.Now())
}

func (l *loginLimiter) reset(login string) {
	l.mu.Lock()
	defer l.mu.Unlock()
	delete(l.failures, l.key(login))
}
