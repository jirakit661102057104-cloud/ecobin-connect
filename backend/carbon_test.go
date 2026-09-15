package main

import (
	"math"
	"testing"
)

func TestCalculateCarbonUsesAverageBottleWeight(t *testing.T) {
	recycled := 1.1
	weight, footprint, avoided := calculateCarbon(3, 0.02722, nil, 2.9389, &recycled)

	assertClose(t, weight, 0.08166)
	assertClose(t, footprint, 0.23999)
	assertClose(t, avoided, 0.15016)
}

func TestCalculateCarbonPrefersActualWeight(t *testing.T) {
	actual := 0.1
	weight, footprint, avoided := calculateCarbon(3, 0.02722, &actual, 2.9389, nil)

	assertClose(t, weight, 0.1)
	assertClose(t, footprint, 0.29389)
	assertClose(t, avoided, 0)
}

func TestCalculateCarbonNeverReportsNegativeAvoidedEmissions(t *testing.T) {
	recycled := 3.5
	_, _, avoided := calculateCarbon(1, 0.03, nil, 2.9389, &recycled)
	assertClose(t, avoided, 0)
}

// CMH Calculate.php: Aluminium Sheet 3.2231 vs Secondary old scrap 1.4682 (kgCO2e/kg)
func TestCalculateCarbonCMHAluminiumCan(t *testing.T) {
	recycle := 1.4682
	weight, footprint, avoided := calculateCarbon(2, 0.014, nil, 3.2231, &recycle)

	assertClose(t, weight, 0.028)
	assertClose(t, footprint, 0.09025) // 0.028 × 3.2231
	assertClose(t, avoided, 0.04914)   // 0.028 × (3.2231 − 1.4682)
}

func assertClose(t *testing.T, actual, expected float64) {
	t.Helper()
	if math.Abs(actual-expected) > 0.00001 {
		t.Fatalf("got %.5f, want %.5f", actual, expected)
	}
}
