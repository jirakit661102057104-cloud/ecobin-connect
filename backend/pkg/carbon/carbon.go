// Package carbon implements CMH/TGO mass×EF math used by EcoBin Connect.
//
//	https://circularmaterialhub.com/Calculate.php
//	CO2e (kgCO2eq) = mass_kg × EF (kgCO2e/kg)
//	avoided = mass_kg × max(EF_baseline − EF_recycle, 0)
package carbon

import "math"

// Calculation is the result of mass × emission-factor accounting for one scan.
type Calculation struct {
	PlasticCode           int
	PointsPerBottle       int
	WeightKg              float64
	CarbonFootprint       float64
	CarbonAvoided         float64
	EmissionFactorVersion string
}

// Round keeps five decimal places (matches existing EcoBin storage).
func Round(value float64) float64 {
	return math.Round(value*100000) / 100000
}

// Calculate applies CMH activity math.
// If actualWeightKg is set and > 0 it overrides bottleCount × averageWeightKg.
func Calculate(
	bottleCount int,
	averageWeightKg float64,
	actualWeightKg *float64,
	baselineFactor float64,
	recycleFactor *float64,
) (weightKg, footprint, avoided float64) {
	if bottleCount < 0 {
		bottleCount = 0
	}
	weightKg = float64(bottleCount) * math.Max(averageWeightKg, 0)
	if actualWeightKg != nil && *actualWeightKg > 0 {
		weightKg = *actualWeightKg
	}
	weightKg = Round(weightKg)
	footprint = Round(weightKg * math.Max(baselineFactor, 0))
	if recycleFactor != nil {
		avoided = Round(weightKg * math.Max(baselineFactor-*recycleFactor, 0))
	}
	return
}
