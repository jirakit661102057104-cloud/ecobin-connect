package main

import (
	"crypto/rand"
	"database/sql"
	"encoding/csv"
	"fmt"
	"math/big"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"golang.org/x/crypto/bcrypt"
)

// --- Admin password reset -------------------------------------------------

// Characters that are hard to confuse when read aloud or copied by hand.
const (
	tempUpper   = "ABCDEFGHJKLMNPQRSTUVWXYZ"
	tempLower   = "abcdefghijkmnpqrstuvwxyz"
	tempDigit   = "23456789"
	tempSpecial = "#@!-"
)

func randFrom(set string) byte {
	n, err := rand.Int(rand.Reader, big.NewInt(int64(len(set))))
	if err != nil {
		panic(err)
	}
	return set[n.Int64()]
}

// newTempPassword returns a 10-char password that passes validateStrongPassword.
func newTempPassword() string {
	b := []byte{randFrom(tempUpper), randFrom(tempLower), randFrom(tempLower), randFrom(tempLower),
		randFrom(tempSpecial), randFrom(tempDigit), randFrom(tempDigit), randFrom(tempDigit),
		randFrom(tempUpper), randFrom(tempLower)}
	return string(b)
}

// handleAdminResetPassword sets a new temporary password for a user and returns
// it once so the admin can hand it over. The password itself is never logged.
func (s *Server) handleAdminResetPassword(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var fullName, username, email string
	err := s.store.db.QueryRow(`SELECT full_name, IFNULL(username,''), IFNULL(email,'') FROM users WHERE user_id=? AND delete_at IS NULL`, id).
		Scan(&fullName, &username, &email)
	if err == sql.ErrNoRows {
		writeJSON(w, 404, map[string]string{"error": "ไม่พบผู้ใช้"})
		return
	}
	if err != nil {
		writeJSON(w, 500, map[string]string{"error": "ค้นหาผู้ใช้ไม่สำเร็จ"})
		return
	}
	temp := newTempPassword()
	hash, err := bcrypt.GenerateFromPassword([]byte(temp), bcrypt.DefaultCost)
	if err != nil {
		writeJSON(w, 500, map[string]string{"error": "สร้างรหัสผ่านไม่สำเร็จ"})
		return
	}
	if _, err := s.store.db.Exec(`UPDATE users SET password_hash=? WHERE user_id=? AND delete_at IS NULL`, string(hash), id); err != nil {
		writeJSON(w, 500, map[string]string{"error": "บันทึกรหัสผ่านไม่สำเร็จ"})
		return
	}
	for _, login := range []string{username, email} {
		if login != "" {
			loginGuard.reset(login)
		}
	}
	s.store.logEvent("ADMIN_PASSWORD_RESET", "admin", s.currentUser(r).UserID, "", "user", id,
		"แอดมินรีเซ็ตรหัสผ่านชั่วคราว", map[string]any{"user_id": id})
	writeJSON(w, 200, map[string]any{
		"user_id":       id,
		"full_name":     fullName,
		"login":         username,
		"temp_password": temp,
	})
}

// --- Research data export (CSV) ------------------------------------------

type exportSpec struct {
	file  string
	query string
}

var exportSpecs = map[string]exportSpec{
	"waste": {"waste_records", `SELECT w.record_id, w.user_id, u.student_id, u.full_name, u.department,
		DATE_FORMAT(w.upload_timestamp, '%Y-%m-%d %H:%i:%s') AS upload_time, w.bin_location, w.plastic_type,
		w.bottle_count, w.weight_kg, w.points_awarded, w.carbon_saved, w.carbon_footprint, w.carbon_avoided,
		w.emission_factor_version, w.verification_status, w.capture_source, w.image_url
		FROM waste_records w LEFT JOIN users u ON u.user_id = w.user_id
		WHERE w.delete_at IS NULL ORDER BY w.upload_timestamp`},
	"points": {"point_transactions", `SELECT t.transaction_id, t.user_id, u.student_id, u.full_name,
		DATE_FORMAT(t.transaction_date, '%Y-%m-%d %H:%i:%s') AS transaction_time, t.transaction_type,
		t.points_earned, t.record_id, t.description
		FROM point_transactions t LEFT JOIN users u ON u.user_id = t.user_id
		WHERE t.delete_at IS NULL ORDER BY t.transaction_date`},
	"redemptions": {"redemptions", `SELECT r.redeem_id, r.user_id, u.student_id, u.full_name, r.reward_id,
		rw.reward_name, rw.points_required AS checkpoint_points, DATE_FORMAT(r.redeem_date, '%Y-%m-%d %H:%i:%s') AS redeem_time,
		r.redeem_status, r.pickup_code
		FROM redemptions r LEFT JOIN users u ON u.user_id = r.user_id LEFT JOIN rewards rw ON rw.reward_id = r.reward_id
		WHERE r.delete_at IS NULL ORDER BY r.redeem_date`},
	"users": {"users", `SELECT u.user_id, u.username, u.full_name, u.student_id, u.email, u.phone, u.department,
		u.user_role, u.total_points, u.total_carbon_saved,
		DATE_FORMAT(u.created_at, '%Y-%m-%d %H:%i:%s') AS registered_at,
		(SELECT COUNT(*) FROM waste_records w WHERE w.user_id=u.user_id AND w.delete_at IS NULL) AS scan_count,
		(SELECT IFNULL(SUM(w.bottle_count),0) FROM waste_records w WHERE w.user_id=u.user_id AND w.delete_at IS NULL) AS bottle_total
		FROM users u WHERE u.delete_at IS NULL ORDER BY u.created_at`},
}

// handleAdminExport streams a dataset as UTF-8 CSV (with BOM so Excel shows Thai).
func (s *Server) handleAdminExport(w http.ResponseWriter, r *http.Request) {
	spec, ok := exportSpecs[chi.URLParam(r, "dataset")]
	if !ok {
		writeJSON(w, 404, map[string]string{"error": "ไม่มีชุดข้อมูลนี้ (waste, points, redemptions, users)"})
		return
	}
	rows, err := s.store.db.Query(spec.query)
	if err != nil {
		writeJSON(w, 500, map[string]string{"error": "ดึงข้อมูลไม่สำเร็จ"})
		return
	}
	defer rows.Close()
	cols, _ := rows.Columns()

	name := fmt.Sprintf("pcru-cfo-savepoint_%s_%s.csv", spec.file, time.Now().Format("20060102-1504"))
	w.Header().Set("Content-Type", "text/csv; charset=utf-8")
	w.Header().Set("Content-Disposition", `attachment; filename="`+name+`"`)
	w.Header().Set("Cache-Control", "no-store")
	_, _ = w.Write([]byte("\xEF\xBB\xBF"))
	cw := csv.NewWriter(w)
	_ = cw.Write(cols)
	vals := make([]sql.RawBytes, len(cols))
	ptrs := make([]any, len(cols))
	for i := range vals {
		ptrs[i] = &vals[i]
	}
	n := 0
	for rows.Next() {
		if err := rows.Scan(ptrs...); err != nil {
			break
		}
		rec := make([]string, len(cols))
		for i, v := range vals {
			rec[i] = string(v)
		}
		_ = cw.Write(rec)
		n++
	}
	cw.Flush()
	s.store.logEvent("ADMIN_DATA_EXPORT", "admin", s.currentUser(r).UserID, "", "export", spec.file,
		"แอดมินดาวน์โหลดข้อมูล CSV", map[string]any{"dataset": spec.file, "rows": n})
}
