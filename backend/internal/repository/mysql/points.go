package mysql

import (
	"context"
	"database/sql"

	"github.com/pcru/ecobin-connect/api/internal/domain"
)

// PointsRepo updates users.total_points and inserts point_transactions in one place.
type PointsRepo struct {
	db *sql.DB
}

func NewPointsRepo(db *sql.DB) *PointsRepo {
	return &PointsRepo{db: db}
}

func (r *PointsRepo) Earn(ctx context.Context, e domain.PointEarn) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback() }()

	if _, err := tx.ExecContext(ctx, `
		UPDATE users SET total_points = total_points + ?, total_carbon_saved = total_carbon_saved + ?
		WHERE user_id=? AND delete_at IS NULL`, e.Points, e.CarbonSaved, e.UserID); err != nil {
		return err
	}
	if _, err := tx.ExecContext(ctx, `
		INSERT INTO point_transactions
			(transaction_id, user_id, record_id, points_earned, transaction_type, description, transaction_date, created_by)
		VALUES (?,?,?,?,'earn',?,NOW(),?)`,
		e.TransactionID, e.UserID, e.RecordID, e.Points, e.Description, e.UserID); err != nil {
		return err
	}
	return tx.Commit()
}
