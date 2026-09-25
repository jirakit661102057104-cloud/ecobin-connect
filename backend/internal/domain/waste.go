// Package domain holds EcoBin domain entities (DB-facing).
// Keep JSON/API concerns in dto + mapping packages.
package domain

import "time"

type User struct {
	UserID           string
	FullName         string
	StudentID        string
	Email            string
	UserRole         string
	TotalPoints      int
	TotalCarbonSaved float64
}

type WasteRecord struct {
	RecordID              string
	UserID                string
	ImageURL              string
	PlasticType           string
	PlasticCode           *int
	BottleCount           int
	UploadTimestamp       time.Time
	VerificationStatus    string
	CarbonSaved           float64
	WeightKg              float64
	CarbonFootprint       float64
	CarbonAvoided         float64
	EmissionFactorVersion string
	PointsAwarded         int
	AdminComment          string
	BinLocation           string
	ImageHash             string
	CaptureSource         string
}

type PlasticType struct {
	PlasticCode             int
	ShortName               string
	FullName                string
	DisplayNameTH           string
	CarbonFactor            float64
	PointsPerBottle         int
	AverageWeightKg         float64
	VirginEmissionFactor    float64
	RecycledEmissionFactor  float64
	EmissionFactorVersion   string
}

type PointEarn struct {
	TransactionID string
	UserID        string
	RecordID      string
	Points        int
	CarbonSaved   float64
	Description   string
}
