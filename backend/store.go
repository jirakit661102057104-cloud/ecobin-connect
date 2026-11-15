package main

import (
	"crypto/sha256"
	"database/sql"
	"encoding/base64"
	"encoding/hex"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
)

type Store struct {
	db        *sql.DB
	uploadDir string
}

const userSelectCols = `user_id, full_name, IFNULL(first_name,''), IFNULL(last_name,''), student_id, IFNULL(username,''), email, password_hash, user_role, total_points, total_carbon_saved, IFNULL(avatar_url,''), IFNULL(department,''), IFNULL(phone,''), IFNULL(auth_provider,'username')`

func hydrateUser(u *User) *User {
	u.FirstName = strings.TrimSpace(u.FirstName)
	u.LastName = strings.TrimSpace(u.LastName)
	u.NeedsProfile = u.FirstName == "" || u.LastName == ""
	return u
}

func (s *Store) scanUserRow(row *sql.Row) (*User, error) {
	u := &User{}
	err := row.Scan(&u.UserID, &u.FullName, &u.FirstName, &u.LastName, &u.StudentID, &u.Username, &u.Email, &u.PasswordHash, &u.UserRole, &u.TotalPoints, &u.TotalCarbonSaved, &u.AvatarURL, &u.Department, &u.Phone, &u.AuthProvider)
	if err != nil {
		return nil, err
	}
	return hydrateUser(u), nil
}

func (s *Store) getUserByLogin(q string) (*User, error) {
	return s.scanUserRow(s.db.QueryRow(`SELECT `+userSelectCols+` FROM users WHERE (email = ? OR student_id = ? OR phone = ? OR username = ?) AND delete_at IS NULL`, q, q, q, q))
}

func (s *Store) getUserByID(id string) (*User, error) {
	return s.scanUserRow(s.db.QueryRow(`SELECT `+userSelectCols+` FROM users WHERE user_id = ? AND delete_at IS NULL`, id))
}

func (s *Store) listUsers() ([]User, error) {
	rows, err := s.db.Query(`SELECT user_id, full_name, IFNULL(first_name,''), IFNULL(last_name,''), student_id, IFNULL(username,''), email, user_role, total_points, total_carbon_saved, IFNULL(avatar_url,''), IFNULL(department,''), IFNULL(phone,'') FROM users WHERE delete_at IS NULL ORDER BY user_id`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []User
	for rows.Next() {
		var u User
		if err := rows.Scan(&u.UserID, &u.FullName, &u.FirstName, &u.LastName, &u.StudentID, &u.Username, &u.Email, &u.UserRole, &u.TotalPoints, &u.TotalCarbonSaved, &u.AvatarURL, &u.Department, &u.Phone); err != nil {
			return nil, err
		}
		out = append(out, *hydrateUser(&u))
	}
	return out, rows.Err()
}

func (s *Store) listWaste(userID string, admin bool) ([]WasteRecord, error) {
	q := `SELECT w.record_id, w.user_id, u.full_name, u.student_id, w.image_url, w.plastic_type, w.bottle_count,
		DATE_FORMAT(w.upload_timestamp, '%Y-%m-%d %H:%i:%s'), w.verification_status, w.carbon_saved,
		w.weight_kg, w.carbon_footprint, w.carbon_avoided, IFNULL(w.emission_factor_version,''),
		w.points_awarded, IFNULL(w.admin_comment,''), IFNULL(w.bin_location,'')
		FROM waste_records w JOIN users u ON u.user_id = w.user_id
		WHERE w.delete_at IS NULL AND u.delete_at IS NULL`
	var rows *sql.Rows
	var err error
	if admin {
		rows, err = s.db.Query(q + ` ORDER BY w.upload_timestamp DESC`)
	} else {
		rows, err = s.db.Query(q+` AND w.user_id = ? ORDER BY w.upload_timestamp DESC`, userID)
	}
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []WasteRecord
	for rows.Next() {
		var r WasteRecord
		if err := rows.Scan(&r.RecordID, &r.UserID, &r.UserName, &r.StudentID, &r.ImageURL, &r.PlasticType, &r.BottleCount,
			&r.UploadTimestamp, &r.VerificationStatus, &r.CarbonSaved, &r.WeightKg, &r.CarbonFootprint,
			&r.CarbonAvoided, &r.EmissionFactorVersion, &r.PointsAwarded, &r.AdminComment, &r.BinLocation); err != nil {
			return nil, err
		}
		out = append(out, r)
	}
	if out == nil {
		out = []WasteRecord{}
	}
	return out, rows.Err()
}

func (s *Store) listRewards() ([]Reward, error) {
	rows, err := s.db.Query(`SELECT reward_id, reward_name, points_required, reward_description, reward_stock, reward_image, category FROM rewards WHERE delete_at IS NULL ORDER BY reward_id`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []Reward
	for rows.Next() {
		var r Reward
		if err := rows.Scan(&r.RewardID, &r.RewardName, &r.PointsRequired, &r.RewardDescription, &r.RewardStock, &r.RewardImage, &r.Category); err != nil {
			return nil, err
		}
		out = append(out, r)
	}
	if out == nil {
		out = []Reward{}
	}
	return out, rows.Err()
}

func (s *Store) listTransactions(userID string, admin bool) ([]PointTransaction, error) {
	q := `SELECT transaction_id, user_id, IFNULL(record_id,''), points_earned, transaction_type, description, DATE_FORMAT(transaction_date, '%Y-%m-%d %H:%i:%s') FROM point_transactions WHERE delete_at IS NULL`
	var rows *sql.Rows
	var err error
	if admin {
		rows, err = s.db.Query(q + ` ORDER BY transaction_date DESC`)
	} else {
		rows, err = s.db.Query(q+` AND user_id = ? ORDER BY transaction_date DESC`, userID)
	}
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []PointTransaction
	for rows.Next() {
		var t PointTransaction
		if err := rows.Scan(&t.TransactionID, &t.UserID, &t.RecordID, &t.PointsEarned, &t.TransactionType, &t.Description, &t.TransactionDate); err != nil {
			return nil, err
		}
		out = append(out, t)
	}
	if out == nil {
		out = []PointTransaction{}
	}
	return out, rows.Err()
}

func (s *Store) listRedemptions(userID string, admin bool) ([]Redemption, error) {
	q := `SELECT r.redeem_id, r.user_id, u.full_name, u.student_id, r.reward_id, rw.reward_name, rw.reward_image, r.points_used,
		DATE_FORMAT(r.redeem_date, '%Y-%m-%d %H:%i:%s'), r.redeem_status, r.pickup_code
		FROM redemptions r JOIN users u ON u.user_id = r.user_id JOIN rewards rw ON rw.reward_id = r.reward_id
		WHERE r.delete_at IS NULL AND u.delete_at IS NULL AND rw.delete_at IS NULL`
	var rows *sql.Rows
	var err error
	if admin {
		rows, err = s.db.Query(q + ` ORDER BY r.redeem_date DESC`)
	} else {
		rows, err = s.db.Query(q+` AND r.user_id = ? ORDER BY r.redeem_date DESC`, userID)
	}
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []Redemption
	for rows.Next() {
		var r Redemption
		if err := rows.Scan(&r.RedeemID, &r.UserID, &r.UserName, &r.StudentID, &r.RewardID, &r.RewardName, &r.RewardImage, &r.PointsUsed, &r.RedeemDate, &r.RedeemStatus, &r.PickupCode); err != nil {
			return nil, err
		}
		out = append(out, r)
	}
	if out == nil {
		out = []Redemption{}
	}
	return out, rows.Err()
}

func normalizePickupCode(raw string) string {
	raw = strings.TrimSpace(raw)
	raw = strings.TrimPrefix(raw, "ECOBIN-REDEEM:")
	return strings.TrimSpace(raw)
}

func (s *Store) getRedemptionByCode(code string) (*Redemption, error) {
	code = normalizePickupCode(code)
	var r Redemption
	err := s.db.QueryRow(`SELECT r.redeem_id, r.user_id, u.full_name, u.student_id, r.reward_id, rw.reward_name, rw.reward_image, r.points_used,
		DATE_FORMAT(r.redeem_date, '%Y-%m-%d %H:%i:%s'), r.redeem_status, r.pickup_code
		FROM redemptions r JOIN users u ON u.user_id = r.user_id JOIN rewards rw ON rw.reward_id = r.reward_id
		WHERE r.delete_at IS NULL AND u.delete_at IS NULL AND rw.delete_at IS NULL AND r.pickup_code = ?`, code).
		Scan(&r.RedeemID, &r.UserID, &r.UserName, &r.StudentID, &r.RewardID, &r.RewardName, &r.RewardImage, &r.PointsUsed, &r.RedeemDate, &r.RedeemStatus, &r.PickupCode)
	if err != nil {
		return nil, err
	}
	return &r, nil
}

func (s *Store) listGuestLogs() ([]GuestLog, error) {
	rows, err := s.db.Query(`SELECT guest_session_id, device_id, temp_image_path, temp_scan_result, detected_bottles, estimated_points, DATE_FORMAT(timestamp, '%Y-%m-%d %H:%i:%s') FROM guest_logs WHERE delete_at IS NULL ORDER BY timestamp DESC LIMIT 50`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []GuestLog
	for rows.Next() {
		var g GuestLog
		if err := rows.Scan(&g.GuestSessionID, &g.DeviceID, &g.TempImagePath, &g.TempScanResult, &g.DetectedBottles, &g.EstimatedPoints, &g.Timestamp); err != nil {
			return nil, err
		}
		out = append(out, g)
	}
	if out == nil {
		out = []GuestLog{}
	}
	return out, rows.Err()
}

func (s *Store) saveImage(imageData, id string) (string, error) {
	if strings.HasPrefix(imageData, "http://") || strings.HasPrefix(imageData, "https://") {
		return imageData, nil
	}
	raw := imageData
	if i := strings.Index(imageData, ","); i >= 0 && strings.HasPrefix(imageData, "data:") {
		raw = imageData[i+1:]
	}
	b, err := base64.StdEncoding.DecodeString(raw)
	if err != nil {
		return "", err
	}
	name, ct := imageFileName(imageData, id)
	if err := s.putFile(name, ct, b); err != nil {
		return "", err
	}
	return "/uploads/" + name, nil
}

// maxStoredFileBytes stays under TiDB's 6 MB per-row transaction limit.
const maxStoredFileBytes = 4 << 20

func imageFileName(imageData, id string) (name, contentType string) {
	lower := strings.ToLower(imageData)
	switch {
	case strings.Contains(lower, "image/png"):
		return id + ".png", "image/png"
	case strings.Contains(lower, "image/webp"):
		return id + ".webp", "image/webp"
	default:
		return id + ".jpg", "image/jpeg"
	}
}

// putFile stores an uploaded file in the database (stored_files), served at /uploads/<name>.
func (s *Store) putFile(name, contentType string, b []byte) error {
	if len(b) > maxStoredFileBytes {
		return fmt.Errorf("ไฟล์รูปใหญ่เกินไป (สูงสุด 4 MB)")
	}
	_, err := s.db.Exec(`INSERT INTO stored_files (file_name, content_type, data, size_bytes) VALUES (?,?,?,?)
		ON DUPLICATE KEY UPDATE content_type=VALUES(content_type), data=VALUES(data), size_bytes=VALUES(size_bytes), created_at=CURRENT_TIMESTAMP`,
		name, contentType, b, len(b))
	return err
}

// getFile loads a stored upload; ok=false when it is not in the database.
func (s *Store) getFile(name string) (contentType string, b []byte, ok bool, err error) {
	err = s.db.QueryRow(`SELECT content_type, data FROM stored_files WHERE file_name=?`, name).Scan(&contentType, &b)
	if err == sql.ErrNoRows {
		return "", nil, false, nil
	}
	if err != nil {
		return "", nil, false, err
	}
	return contentType, b, true, nil
}

// decodeImagePayload returns raw bytes for a data: URL (or bare base64). Rejects remote http(s) URLs.
func decodeImagePayload(imageData string) ([]byte, error) {
	if strings.HasPrefix(imageData, "http://") || strings.HasPrefix(imageData, "https://") {
		return nil, fmt.Errorf("ไม่รับ URL รูปจากอินเทอร์เน็ต — ต้องถ่ายจากกล้องในแอป")
	}
	raw := imageData
	if i := strings.Index(imageData, ","); i >= 0 && strings.HasPrefix(imageData, "data:") {
		raw = imageData[i+1:]
	}
	b, err := base64.StdEncoding.DecodeString(raw)
	if err != nil {
		return nil, fmt.Errorf("รูปแบบรูปไม่ถูกต้อง")
	}
	if len(b) < 100 {
		return nil, fmt.Errorf("ไฟล์รูปสั้นเกินไป")
	}
	return b, nil
}

func hashImageBytes(b []byte) string {
	sum := sha256.Sum256(b)
	return hex.EncodeToString(sum[:])
}

// sniffDownloadedHints looks for common download/edit tool markers in JPEG metadata bytes.
func sniffDownloadedHints(b []byte) string {
	n := len(b)
	if n > 65536 {
		n = 65536
	}
	lower := strings.ToLower(string(b[:n]))
	suspects := []string{
		"photoshop", "canva", "gimp", "snipping", "screenshot",
		"getty", "shutterstock", "unsplash", "pixabay", "wikimedia",
	}
	for _, s := range suspects {
		if strings.Contains(lower, s) {
			return s
		}
	}
	return ""
}

func (s *Store) imageHashExists(userID, hash string) (bool, error) {
	if hash == "" {
		return false, nil
	}
	var n int
	err := s.db.QueryRow(`SELECT COUNT(*) FROM waste_records
		WHERE user_id=? AND image_hash=? AND delete_at IS NULL`, userID, hash).Scan(&n)
	return n > 0, err
}

func (s *Store) saveWasteImage(imageData, id string) (url string, hash string, err error) {
	b, err := decodeImagePayload(imageData)
	if err != nil {
		return "", "", err
	}
	if hint := sniffDownloadedHints(b); hint != "" {
		return "", "", fmt.Errorf("พบร่องรอยว่าเป็นรูปจากแหล่งดาวน์โหลด/แก้ภาพ (%s) — กรุณาถ่ายจากกล้องใหม่", hint)
	}
	hash = hashImageBytes(b)
	name, ct := imageFileName(imageData, id)
	if err := s.putFile(name, ct, b); err != nil {
		return "", "", err
	}
	return "/uploads/" + name, hash, nil
}

func (s *Store) listBins() ([]SmartBin, error) {
	rows, err := s.db.Query(`SELECT bin_id, bin_name, status, IFNULL(capacity_note,'') FROM smart_bins WHERE delete_at IS NULL ORDER BY bin_id`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []SmartBin
	for rows.Next() {
		var b SmartBin
		if err := rows.Scan(&b.BinID, &b.BinName, &b.Status, &b.CapacityNote); err != nil {
			return nil, err
		}
		out = append(out, b)
	}
	if out == nil {
		out = []SmartBin{}
	}
	return out, rows.Err()
}

func (s *Store) listPlasticTypes() ([]PlasticType, error) {
	rows, err := s.db.Query(`SELECT plastic_code, short_name, full_name, display_name_th, carbon_factor,
		IFNULL(average_weight_kg,0),
		IFNULL((SELECT factor_value FROM emission_factors e WHERE e.plastic_code=plastic_types.plastic_code
			AND e.factor_type='virgin_production' AND e.is_active=TRUE
			AND (e.effective_date IS NULL OR e.effective_date<=CURDATE())
			AND (e.expires_at IS NULL OR e.expires_at>=CURDATE())
			ORDER BY e.effective_date DESC LIMIT 1),0),
		IFNULL((SELECT factor_value FROM emission_factors e WHERE e.plastic_code=plastic_types.plastic_code
			AND e.factor_type='recycled_production' AND e.is_active=TRUE
			AND (e.effective_date IS NULL OR e.effective_date<=CURDATE())
			AND (e.expires_at IS NULL OR e.expires_at>=CURDATE())
			ORDER BY e.effective_date DESC LIMIT 1),0),
		IFNULL((SELECT source_version FROM emission_factors e WHERE e.plastic_code=plastic_types.plastic_code
			AND e.factor_type='virgin_production' AND e.is_active=TRUE
			AND (e.effective_date IS NULL OR e.effective_date<=CURDATE())
			AND (e.expires_at IS NULL OR e.expires_at>=CURDATE())
			ORDER BY e.effective_date DESC LIMIT 1),''),
		IFNULL(points_per_bottle,10), IFNULL(recycling_tips,'')
		FROM plastic_types WHERE delete_at IS NULL ORDER BY plastic_code`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []PlasticType
	for rows.Next() {
		var p PlasticType
		if err := rows.Scan(&p.PlasticCode, &p.ShortName, &p.FullName, &p.DisplayNameTH, &p.CarbonFactor,
			&p.AverageWeightKg, &p.VirginEmissionFactor, &p.RecycledEmissionFactor,
			&p.EmissionFactorVersion, &p.PointsPerBottle, &p.RecyclingTips); err != nil {
			return nil, err
		}
		out = append(out, p)
	}
	if out == nil {
		out = []PlasticType{}
	}
	return out, rows.Err()
}

func (s *Store) getAppSettings() AppSettings {
	out := AppSettings{
		PointsPerBottle:  10,
		CarbonPerBottle:  0.08,
		WasteAutoApprove: false,
	}
	rows, err := s.db.Query(`SELECT setting_key, setting_value FROM app_settings`)
	if err != nil {
		return out
	}
	defer rows.Close()
	for rows.Next() {
		var k, v string
		if err := rows.Scan(&k, &v); err != nil {
			continue
		}
		switch k {
		case "points_per_bottle":
			if n, err := strconv.Atoi(strings.TrimSpace(v)); err == nil && n >= 0 {
				out.PointsPerBottle = n
			}
		case "carbon_per_bottle":
			if n, err := strconv.ParseFloat(strings.TrimSpace(v), 64); err == nil && n >= 0 {
				out.CarbonPerBottle = n
			}
		case "announcement":
			out.Announcement = v
		case "waste_auto_approve":
			lv := strings.ToLower(strings.TrimSpace(v))
			out.WasteAutoApprove = lv == "1" || lv == "true" || lv == "yes"
		}
	}
	return out
}

func (s *Store) setSetting(key, value, by string) error {
	_, err := s.db.Exec(`INSERT INTO app_settings (setting_key, setting_value, updated_by) VALUES (?,?,?)
		ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value), updated_by=VALUES(updated_by)`, key, value, by)
	return err
}

func (s *Store) listCertificates(userID string, admin bool) ([]Certificate, error) {
	q := `SELECT certificate_id, user_id, issued_by, issued_at, IFNULL(admin_message,''),
		full_name_snapshot, IFNULL(department_snapshot,''), credits_tco2e, avoided_kg, footprint_kg,
		bottles, approved_count, points
		FROM certificates WHERE delete_at IS NULL`
	args := []any{}
	if !admin {
		q += ` AND user_id=?`
		args = append(args, userID)
	}
	q += ` ORDER BY issued_at DESC`
	rows, err := s.db.Query(q, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []Certificate{}
	for rows.Next() {
		var c Certificate
		var issued time.Time
		if err := rows.Scan(&c.CertificateID, &c.UserID, &c.IssuedBy, &issued, &c.AdminMessage,
			&c.FullNameSnapshot, &c.DepartmentSnapshot, &c.CreditsTCO2e, &c.AvoidedKg, &c.FootprintKg,
			&c.Bottles, &c.ApprovedCount, &c.Points); err != nil {
			return nil, err
		}
		c.IssuedAt = fmtTime(issued)
		out = append(out, c)
	}
	return out, rows.Err()
}

func (s *Store) insertCertificate(c *Certificate) error {
	_, err := s.db.Exec(`INSERT INTO certificates
		(certificate_id, user_id, issued_by, issued_at, admin_message, full_name_snapshot, department_snapshot,
		 credits_tco2e, avoided_kg, footprint_kg, bottles, approved_count, points, created_by)
		VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
		c.CertificateID, c.UserID, c.IssuedBy, time.Now(), c.AdminMessage, c.FullNameSnapshot, c.DepartmentSnapshot,
		c.CreditsTCO2e, c.AvoidedKg, c.FootprintKg, c.Bottles, c.ApprovedCount, c.Points, c.IssuedBy)
	return err
}

func newID(prefix string) string {
	return fmt.Sprintf("%s%d", prefix, time.Now().UnixNano()%1_000_000_000_000)
}

// handleUpload serves /uploads/<name> from stored_files, falling back to the
// legacy on-disk uploads folder for files saved before images moved to the DB.
func (s *Server) handleUpload(disk http.Handler) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		name := chi.URLParam(r, "*")
		if name == "" || strings.Contains(name, "/") || strings.Contains(name, "..") {
			http.NotFound(w, r)
			return
		}
		ct, b, ok, err := s.store.getFile(name)
		if err != nil {
			http.Error(w, "file lookup failed", http.StatusInternalServerError)
			return
		}
		if !ok {
			disk.ServeHTTP(w, r)
			return
		}
		w.Header().Set("Content-Type", ct)
		w.Header().Set("Cache-Control", "public, max-age=86400")
		_, _ = w.Write(b)
	}
}
