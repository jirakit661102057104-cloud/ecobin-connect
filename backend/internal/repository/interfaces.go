package repository

import (
	"context"

	"github.com/pcru/ecobin-connect/api/internal/domain"
)

type WasteRepository interface {
	ImageHashExists(ctx context.Context, userID, hash string) (bool, error)
	Insert(ctx context.Context, rec domain.WasteRecord) error
	GetByID(ctx context.Context, recordID string) (domain.WasteRecord, error)
}

type PointsRepository interface {
	Earn(ctx context.Context, e domain.PointEarn) error
}

type PlasticRepository interface {
	ListActive(ctx context.Context) ([]domain.PlasticType, error)
}

type UserRepository interface {
	GetByID(ctx context.Context, userID string) (domain.User, error)
}

type SettingsRepository interface {
	DefaultPointsPerBottle(ctx context.Context) (int, error)
	DefaultCarbonPerBottle(ctx context.Context) (float64, error)
}

// ImageStore saves camera captures under uploads/ and returns public URL + content hash.
type ImageStore interface {
	SaveWasteImage(imageData, recordID string) (url, hash string, err error)
}
