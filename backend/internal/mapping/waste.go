package mapping

import (
	"github.com/pcru/ecobin-connect/api/internal/domain"
	"github.com/pcru/ecobin-connect/api/internal/dto"
)

// WasteToResponse is a manual type-safe mapper (no reflection / no external lib).
func WasteToResponse(w domain.WasteRecord, userName, studentID string) dto.WasteRecordResponse {
	return dto.WasteRecordResponse{
		RecordID:              w.RecordID,
		UserID:                w.UserID,
		UserName:              userName,
		StudentID:             studentID,
		ImageURL:              w.ImageURL,
		PlasticType:           w.PlasticType,
		BottleCount:           w.BottleCount,
		UploadTimestamp:       w.UploadTimestamp.Format("2006-01-02 15:04:05"),
		VerificationStatus:    w.VerificationStatus,
		CarbonSaved:           w.CarbonSaved,
		WeightKg:              w.WeightKg,
		CarbonFootprint:       w.CarbonFootprint,
		CarbonAvoided:         w.CarbonAvoided,
		EmissionFactorVersion: w.EmissionFactorVersion,
		PointsAwarded:         w.PointsAwarded,
		AdminComment:          w.AdminComment,
		BinLocation:           w.BinLocation,
	}
}

func UserToResponse(u domain.User) dto.UserResponse {
	return dto.UserResponse{
		UserID:           u.UserID,
		FullName:         u.FullName,
		StudentID:        u.StudentID,
		Email:            u.Email,
		UserRole:         u.UserRole,
		TotalPoints:      u.TotalPoints,
		TotalCarbonSaved: u.TotalCarbonSaved,
	}
}
