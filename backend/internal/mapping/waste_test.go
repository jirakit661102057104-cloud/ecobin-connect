package mapping_test

import (
	"testing"
	"time"

	"github.com/pcru/ecobin-connect/api/internal/domain"
	"github.com/pcru/ecobin-connect/api/internal/mapping"
)

func TestWasteToResponse_ManualMapping(t *testing.T) {
	ts := time.Date(2026, 9, 25, 10, 30, 0, 0, time.Local)
	got := mapping.WasteToResponse(domain.WasteRecord{
		RecordID:           "REC1",
		UserID:             "U1",
		ImageURL:           "/uploads/a.jpg",
		PlasticType:        "ขวดพลาสติก",
		BottleCount:        2,
		UploadTimestamp:    ts,
		VerificationStatus: "อนุมัติแล้ว",
		CarbonSaved:        0.05,
		PointsAwarded:      20,
		BinLocation:        "อาคาร 1",
	}, "สมชาย", "661102057104")

	if got.RecordID != "REC1" || got.UserName != "สมชาย" || got.StudentID != "661102057104" {
		t.Fatalf("identity fields: %+v", got)
	}
	if got.UploadTimestamp != ts.Format("2006-01-02 15:04:05") {
		t.Fatalf("timestamp=%q", got.UploadTimestamp)
	}
	if got.VerificationStatus != "อนุมัติแล้ว" || got.PointsAwarded != 20 {
		t.Fatalf("status/points: %+v", got)
	}
}
