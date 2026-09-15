package main

import (
	"math"
	"strings"
)

// Carbon accounting follows Circular Material Hub (CMH) activity math,
// which estimates GHG from TGO emission factors:
//   https://circularmaterialhub.com/Calculate.php
//   CO2e (kgCO2eq) = mass_kg × EF (kgCO2e/kg)
// EcoBin Net Zero credit when a recycle-pathway EF exists:
//   avoided = mass_kg × max(EF_baseline − EF_recycle, 0)
// Baseline = virgin_production (e.g. CMH Aluminium Sheet 3.2231)
// Recycle  = recycled_production (e.g. CMH Aluminium Secondary old scrap 1.4682)

type CarbonCalculation struct {
	PlasticCode           int
	PointsPerBottle       int
	WeightKg              float64
	CarbonFootprint       float64
	CarbonAvoided         float64
	EmissionFactorVersion string
}

func roundCarbon(value float64) float64 {
	return math.Round(value*100000) / 100000
}

func calculateCarbon(
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
	weightKg = roundCarbon(weightKg)
	// CMH: ปริมาณการปล่อย = ปริมาณ(กก.) × EF(KgCO2kg)
	footprint = roundCarbon(weightKg * math.Max(baselineFactor, 0))
	if recycleFactor != nil {
		// เปรียบเทียบสถานการณ์ฐาน (ปัจจุบัน/ผลิตใหม่) กับเส้นทางรีไซเคิล (อนาคต)
		avoided = roundCarbon(weightKg * math.Max(baselineFactor-*recycleFactor, 0))
	}
	return
}

func (s *Store) carbonForPlastic(name string, bottleCount int, actualWeightKg *float64) CarbonCalculation {
	cfg := s.getAppSettings()
	out := CarbonCalculation{PointsPerBottle: cfg.PointsPerBottle}
	types, err := s.listPlasticTypes()
	if err != nil {
		return out
	}
	matched := matchPlasticType(types, name)
	if matched == nil {
		// Legacy fallback has no auditable mass or kg-based TGO factor.
		out.CarbonFootprint = roundCarbon(float64(bottleCount) * cfg.CarbonPerBottle)
		out.EmissionFactorVersion = "legacy-per-bottle"
		return out
	}
	out.PlasticCode = matched.PlasticCode
	out.PointsPerBottle = matched.PointsPerBottle

	var recycled *float64
	if matched.RecycledEmissionFactor > 0 {
		v := matched.RecycledEmissionFactor
		recycled = &v
	}
	if matched.VirginEmissionFactor == 0 {
		// Keep old deployments operational if migration factors are unavailable.
		out.CarbonFootprint = roundCarbon(float64(bottleCount) * matched.CarbonFactor)
		out.EmissionFactorVersion = "legacy-per-bottle"
		return out
	}
	out.WeightKg, out.CarbonFootprint, out.CarbonAvoided = calculateCarbon(
		bottleCount,
		matched.AverageWeightKg,
		actualWeightKg,
		matched.VirginEmissionFactor,
		recycled,
	)
	out.EmissionFactorVersion = matched.EmissionFactorVersion
	return out
}

func matchPlasticType(types []PlasticType, name string) *PlasticType {
	n := strings.ToLower(strings.TrimSpace(name))
	if n == "" {
		return nil
	}
	// Beta labels from Teachable Machine / UI.
	if strings.Contains(n, "กระป๋อง") || strings.Contains(n, "can") || strings.Contains(n, "aluminium") || strings.Contains(n, "aluminum") {
		for i := range types {
			if types[i].PlasticCode == 8 || strings.Contains(strings.ToLower(types[i].ShortName), "can") {
				return &types[i]
			}
		}
	}
	if strings.Contains(n, "ขวดพลาสติก") || strings.Contains(n, "plastic_bottle") || strings.Contains(n, "plastic bottle") || n == "plastic_bottle" {
		for i := range types {
			if types[i].PlasticCode == 1 {
				return &types[i]
			}
		}
	}
	for i := range types {
		p := &types[i]
		hay := strings.ToLower(p.DisplayNameTH + " " + p.ShortName + " " + p.FullName)
		short := strings.ToLower(strings.TrimSpace(strings.Split(p.ShortName, "/")[0]))
		if strings.Contains(hay, n) ||
			strings.Contains(n, strings.ToLower(p.DisplayNameTH)) ||
			(len(short) >= 2 && strings.Contains(n, short)) {
			return p
		}
	}
	return nil
}
