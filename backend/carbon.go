package main

import (
	"strings"

	"github.com/pcru/ecobin-connect/api/pkg/carbon"
)

// CarbonCalculation mirrors pkg/carbon.Calculation for legacy package main callers.
type CarbonCalculation = carbon.Calculation

func roundCarbon(value float64) float64 {
	return carbon.Round(value)
}

func calculateCarbon(
	bottleCount int,
	averageWeightKg float64,
	actualWeightKg *float64,
	baselineFactor float64,
	recycleFactor *float64,
) (weightKg, footprint, avoided float64) {
	return carbon.Calculate(bottleCount, averageWeightKg, actualWeightKg, baselineFactor, recycleFactor)
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
