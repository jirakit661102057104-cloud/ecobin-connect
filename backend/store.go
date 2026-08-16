package main

import (
	"database/sql"
	"encoding/base64"
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"
)

type Store struct {
	db       *sql.DB
	uploadDir string
}

const userSelectCols = `user_id, full_name, IFNULL(first_name,''), IFNULL(last_name,''), student_id, email, password_hash, user_role, total_points, total_carbon_saved, IFNULL(avatar_url,''), IFNULL(department,''), IFNULL(phone,''), IFNULL(auth_provider,'email')`

func hydrateUser(u *User) *User {
	u.FirstName = strings.TrimSpace(u.FirstName)
	u.LastName = strings.TrimSpace(u.LastName)
	u.NeedsProfile = u.FirstName == "" || u.LastName == ""
	return u
}

func (s *Store) scanUserRow(row *sql.Row) (*User, error) {
	u := &User{}
	err := row.Scan(&u.UserID, &u.FullName, &u.FirstName, &u.LastName, &u.StudentID, &u.Email, &u.PasswordHash, &u.UserRole, &u.TotalPoints, &u.TotalCarbonSaved, &u.AvatarURL, &u.Department, &u.Phone, &u.AuthProvider)
	if err != nil {
		return nil, err
	}
	return hydrateUser(u), nil
}

func (s *Store) getUserByLogin(q string) (*User, error) {
	return s.scanUserRow(s.db.QueryRow(`SELECT `+userSelectCols+` FROM users WHERE (email = ? OR student_id = ? OR phone = ?) AND delete_at IS NULL`, q, q, q))
}

func (s *Store) getUserByID(id string) (*User, error) {
	return s.scanUserRow(s.db.QueryRow(`SELECT `+userSelectCols+` FROM users WHERE user_id = ? AND delete_at IS NULL`, id))
}

func (s *Store) listUsers() ([]User, error) {
	rows, err := s.db.Query(`SELECT user_id, full_name, IFNULL(first_name,''), IFNULL(last_name,''), student_id, email, user_role, total_points, total_carbon_saved, IFNULL(avatar_url,''), IFNULL(department,'') FROM users WHERE delete_at IS NULL ORDER BY user_id`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []User
	for rows.Next() {
		var u User
		if err := rows.Scan(&u.UserID, &u.FullName, &u.FirstName, &u.LastName, &u.StudentID, &u.Email, &u.UserRole, &u.TotalPoints, &u.TotalCarbonSaved, &u.AvatarURL, &u.Department); err != nil {
			return nil, err
		}
		out = append(out, *hydrateUser(&u))
	}
	return out, rows.Err()
}

func (s *Store) listWaste(userID string, admin bool) ([]WasteRecord, error) {
	q := `SELECT w.record_id, w.user_id, u.full_name, u.student_id, w.image_url, w.plastic_type, w.bottle_count,
		DATE_FORMAT(w.upload_timestamp, '%Y-%m-%d %H:%i:%s'), w.verification_status, w.carbon_saved, w.points_awarded, IFNULL(w.admin_comment,''), IFNULL(w.bin_location,'')
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
		if err := rows.Scan(&r.RecordID, &r.UserID, &r.UserName, &r.StudentID, &r.ImageURL, &r.PlasticType, &r.BottleCount, &r.UploadTimestamp, &r.VerificationStatus, &r.CarbonSaved, &r.PointsAwarded, &r.AdminComment, &r.BinLocation); err != nil {
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
	if err := os.MkdirAll(s.uploadDir, 0755); err != nil {
		return "", err
	}
	name := id + ".jpg"
	if strings.Contains(strings.ToLower(imageData), "image/png") {
		name = id + ".png"
	} else if strings.Contains(strings.ToLower(imageData), "image/webp") {
		name = id + ".webp"
	}
	path := filepath.Join(s.uploadDir, name)
	if err := os.WriteFile(path, b, 0644); err != nil {
		return "", err
	}
	return "/uploads/" + name, nil
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
	rows, err := s.db.Query(`SELECT plastic_code, short_name, full_name, display_name_th, carbon_factor, IFNULL(points_per_bottle,10), IFNULL(recycling_tips,'')
		FROM plastic_types WHERE delete_at IS NULL ORDER BY plastic_code`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []PlasticType
	for rows.Next() {
		var p PlasticType
		if err := rows.Scan(&p.PlasticCode, &p.ShortName, &p.FullName, &p.DisplayNameTH, &p.CarbonFactor, &p.PointsPerBottle, &p.RecyclingTips); err != nil {
			return nil, err
		}
		out = append(out, p)
	}
	if out == nil {
		out = []PlasticType{}
	}
	return out, rows.Err()
}

func (s *Store) scoreForPlastic(name string) (int, float64) {
	cfg := s.getAppSettings()
	pts, carbon := cfg.PointsPerBottle, cfg.CarbonPerBottle
	types, err := s.listPlasticTypes()
	if err != nil {
		return pts, carbon
	}
	n := strings.ToLower(strings.TrimSpace(name))
	if n == "" {
		return pts, carbon
	}
	for _, p := range types {
		hay := strings.ToLower(p.DisplayNameTH + " " + p.ShortName + " " + p.FullName)
		short := strings.ToLower(strings.TrimSpace(strings.Split(p.ShortName, "/")[0]))
		if strings.Contains(hay, n) || strings.Contains(n, strings.ToLower(p.DisplayNameTH)) || (len(short) >= 2 && strings.Contains(n, short)) {
			pts = p.PointsPerBottle
			carbon = p.CarbonFactor
			if strings.Contains(n, strings.ToLower(p.DisplayNameTH)) {
				break
			}
		}
	}
	return pts, carbon
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

func newID(prefix string) string {
	return fmt.Sprintf("%s%d", prefix, time.Now().UnixNano()%1_000_000_000_000)
}
