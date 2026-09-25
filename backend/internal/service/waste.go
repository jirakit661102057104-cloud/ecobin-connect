package service

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/pcru/ecobin-connect/api/internal/domain"
	"github.com/pcru/ecobin-connect/api/internal/dto"
	"github.com/pcru/ecobin-connect/api/internal/mapping"
	"github.com/pcru/ecobin-connect/api/internal/repository"
	"github.com/pcru/ecobin-connect/api/pkg/carbon"
	"github.com/pcru/ecobin-connect/api/pkg/idgen"
)

var (
	ErrInvalidBody      = errors.New("ข้อมูลไม่ถูกต้อง")
	ErrNotFromCamera    = errors.New("ต้องถ่ายจากกล้องในแอปเท่านั้น จึงจะบันทึกและรับแต้มได้ (ไม่รับรูปจากคลัง/อินเทอร์เน็ต)")
	ErrHashMismatch     = errors.New("ลายเซ็นรูปไม่ตรง — กรุณาถ่ายใหม่จากกล้อง")
	ErrDuplicateImage   = errors.New("รูปนี้เคยส่งแล้ว — กรุณาถ่ายรูปใหม่จากกล้อง")
	ErrHashCheckFailed  = errors.New("ตรวจสอบรูปซ้ำไม่สำเร็จ")
	ErrSaveImage        = errors.New("บันทึกรูปไม่สำเร็จ")
	ErrInsertWaste      = errors.New("บันทึกรายการไม่สำเร็จ")
)

// WasteService owns camera-scan → award-points business rules.
type WasteService struct {
	waste    repository.WasteRepository
	points   repository.PointsRepository
	plastics repository.PlasticRepository
	users    repository.UserRepository
	settings repository.SettingsRepository
	images   repository.ImageStore
	ids      idgen.Generator
}

func NewWasteService(
	waste repository.WasteRepository,
	points repository.PointsRepository,
	plastics repository.PlasticRepository,
	users repository.UserRepository,
	settings repository.SettingsRepository,
	images repository.ImageStore,
	ids idgen.Generator,
) *WasteService {
	if ids == nil {
		ids = idgen.Default
	}
	return &WasteService{
		waste: waste, points: points, plastics: plastics,
		users: users, settings: settings, images: images, ids: ids,
	}
}

// CreateFromCamera implements the current POST /api/waste rules:
// camera-only, image-hash dedupe, CMH/TGO carbon, immediate points (สถานะอนุมัติแล้ว).
func (s *WasteService) CreateFromCamera(ctx context.Context, userID string, req dto.CreateWasteRequest) (dto.CreateWasteResponse, error) {
	var zero dto.CreateWasteResponse
	if strings.TrimSpace(strings.ToLower(req.CaptureSource)) != "camera" {
		return zero, ErrNotFromCamera
	}
	if req.BottleCount < 1 {
		req.BottleCount = 1
	}

	recordID := s.ids.New("REC")
	imgURL, imageHash, err := s.images.SaveWasteImage(req.ImageData, recordID)
	if err != nil {
		return zero, fmt.Errorf("%w: %v", ErrSaveImage, err)
	}
	if req.ImageHash != "" && !strings.EqualFold(req.ImageHash, imageHash) {
		return zero, ErrHashMismatch
	}
	exists, err := s.waste.ImageHashExists(ctx, userID, imageHash)
	if err != nil {
		return zero, ErrHashCheckFailed
	}
	if exists {
		return zero, ErrDuplicateImage
	}

	calc, err := s.carbonForPlastic(ctx, req.PlasticType, req.BottleCount, req.WeightKg)
	if err != nil {
		return zero, err
	}
	points := req.BottleCount * calc.PointsPerBottle
	carbonSaved := calc.CarbonAvoided
	if carbonSaved <= 0 {
		carbonSaved = calc.CarbonFootprint
	}
	now := time.Now()
	code := calc.PlasticCode
	var plasticCode *int
	if code != 0 {
		plasticCode = &code
	}

	rec := domain.WasteRecord{
		RecordID:              recordID,
		UserID:                userID,
		ImageURL:              imgURL,
		PlasticType:           req.PlasticType,
		PlasticCode:           plasticCode,
		BottleCount:           req.BottleCount,
		UploadTimestamp:       now,
		VerificationStatus:    "อนุมัติแล้ว",
		CarbonSaved:           carbonSaved,
		WeightKg:              calc.WeightKg,
		CarbonFootprint:       calc.CarbonFootprint,
		CarbonAvoided:         calc.CarbonAvoided,
		EmissionFactorVersion: calc.EmissionFactorVersion,
		PointsAwarded:         points,
		AdminComment:          "ถ่ายจากกล้อง + Teachable Machine จำแนกแล้ว — ให้แต้มทันที (CMH/TGO)",
		BinLocation:           req.BinLocation,
		ImageHash:             imageHash,
		CaptureSource:         "camera",
	}
	if err := s.waste.Insert(ctx, rec); err != nil {
		return zero, ErrInsertWaste
	}

	txnID := s.ids.New("TXN")
	if err := s.points.Earn(ctx, domain.PointEarn{
		TransactionID: txnID,
		UserID:        userID,
		RecordID:      recordID,
		Points:        points,
		CarbonSaved:   carbonSaved,
		Description:   "Teachable Machine + CMH/TGO carbon · ให้แต้มทันที",
	}); err != nil {
		return zero, err
	}

	user, err := s.users.GetByID(ctx, userID)
	if err != nil {
		return zero, err
	}
	saved, err := s.waste.GetByID(ctx, recordID)
	if err != nil {
		saved = rec
	}

	return dto.CreateWasteResponse{
		Record:        mapping.WasteToResponse(saved, user.FullName, user.StudentID),
		User:          mapping.UserToResponse(user),
		CorrelationID: req.CorrelationID,
	}, nil
}

func (s *WasteService) carbonForPlastic(ctx context.Context, name string, bottleCount int, actualWeightKg *float64) (carbon.Calculation, error) {
	defaultPts, err := s.settings.DefaultPointsPerBottle(ctx)
	if err != nil {
		return carbon.Calculation{}, err
	}
	out := carbon.Calculation{PointsPerBottle: defaultPts}
	types, err := s.plastics.ListActive(ctx)
	if err != nil {
		return out, nil
	}
	matched := matchPlastic(types, name)
	if matched == nil {
		perBottle, _ := s.settings.DefaultCarbonPerBottle(ctx)
		out.CarbonFootprint = carbon.Round(float64(bottleCount) * perBottle)
		out.EmissionFactorVersion = "legacy-per-bottle"
		return out, nil
	}
	out.PlasticCode = matched.PlasticCode
	out.PointsPerBottle = matched.PointsPerBottle
	var recycled *float64
	if matched.RecycledEmissionFactor > 0 {
		v := matched.RecycledEmissionFactor
		recycled = &v
	}
	if matched.VirginEmissionFactor == 0 {
		out.CarbonFootprint = carbon.Round(float64(bottleCount) * matched.CarbonFactor)
		out.EmissionFactorVersion = "legacy-per-bottle"
		return out, nil
	}
	out.WeightKg, out.CarbonFootprint, out.CarbonAvoided = carbon.Calculate(
		bottleCount,
		matched.AverageWeightKg,
		actualWeightKg,
		matched.VirginEmissionFactor,
		recycled,
	)
	out.EmissionFactorVersion = matched.EmissionFactorVersion
	return out, nil
}

func matchPlastic(types []domain.PlasticType, name string) *domain.PlasticType {
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
