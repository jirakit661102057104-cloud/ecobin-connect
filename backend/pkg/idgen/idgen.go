package idgen

import (
	"fmt"
	"time"
)

// Generator creates prefixed public IDs (REC…, TXN…, GST…).
type Generator interface {
	New(prefix string) string
}

type nanoGen struct{}

// Default matches legacy newID in store.go.
var Default Generator = nanoGen{}

func (nanoGen) New(prefix string) string {
	return fmt.Sprintf("%s%d", prefix, time.Now().UnixNano()%1_000_000_000_000)
}
