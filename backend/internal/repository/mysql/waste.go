package mysql

import (
	"context"
	"database/sql"
	"time"

	"github.com/pcru/ecobin-connect/api/internal/domain"
)

// WasteRepo is the MySQL implementation of repository.WasteRepository.
type WasteRepo struct {
	db *sql.DB
}

func NewWasteRepo(db *sql.DB) *WasteRepo {
	return &WasteRepo{db: db}
}

func (r *WasteRepo) ImageHashExists(ctx context.Context, userID, hash string) (bool, error) {
	var n int
	err := r.db.QueryRowContext(ctx, `
		SELECT COUNT(1) FROM waste_records
		WHERE user_id=? AND image_hash=? AND delete_at IS NULL`, userID, hash).Scan(&n)
	return n > 0, err
}

func (r *WasteRepo) Insert(ctx context.Context, rec domain.WasteRecord) error {
	_, err := r.db.ExecContext(ctx, `INSERT INTO waste_records
		(record_id, user_id, image_url, plastic_type, plastic_code, bottle_count, upload_timestamp, verification_status,
		 carbon_saved, weight_kg, carbon_footprint, carbon_avoided, emission_factor_version, points_awarded, admin_comment, bin_location,
		 image_hash, capture_source, created_by)
		VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
		rec.RecordID, rec.UserID, rec.ImageURL, rec.PlasticType, nullInt(rec.PlasticCode), rec.BottleCount, rec.UploadTimestamp, rec.VerificationStatus,
		rec.CarbonSaved, rec.WeightKg, rec.CarbonFootprint, rec.CarbonAvoided, rec.EmissionFactorVersion, rec.PointsAwarded, rec.AdminComment, rec.BinLocation,
		rec.ImageHash, rec.CaptureSource, rec.UserID)
	return err
}

func (r *WasteRepo) GetByID(ctx context.Context, recordID string) (domain.WasteRecord, error) {
	var rec domain.WasteRecord
	var ts time.Time
	var code sql.NullInt64
	err := r.db.QueryRowContext(ctx, `
		SELECT record_id, user_id, image_url, plastic_type, plastic_code, bottle_count, upload_timestamp, verification_status,
		       carbon_saved, weight_kg, carbon_footprint, carbon_avoided, COALESCE(emission_factor_version,''), points_awarded,
		       COALESCE(admin_comment,''), COALESCE(bin_location,''), COALESCE(image_hash,''), COALESCE(capture_source,'')
		FROM waste_records WHERE record_id=? AND delete_at IS NULL`, recordID).Scan(
		&rec.RecordID, &rec.UserID, &rec.ImageURL, &rec.PlasticType, &code, &rec.BottleCount, &ts, &rec.VerificationStatus,
		&rec.CarbonSaved, &rec.WeightKg, &rec.CarbonFootprint, &rec.CarbonAvoided, &rec.EmissionFactorVersion, &rec.PointsAwarded,
		&rec.AdminComment, &rec.BinLocation, &rec.ImageHash, &rec.CaptureSource,
	)
	if err != nil {
		return domain.WasteRecord{}, err
	}
	rec.UploadTimestamp = ts
	if code.Valid {
		v := int(code.Int64)
		rec.PlasticCode = &v
	}
	return rec, nil
}

func nullInt(p *int) any {
	if p == nil {
		return nil
	}
	return *p
}
