package main

import (
	"database/sql"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
)

func (s *Server) handleAdminPatchSettings(w http.ResponseWriter, r *http.Request) {
	var body AppSettings
	if err := readJSON(r, &body); err != nil {
		writeJSON(w, 400, map[string]string{"error": "ข้อมูลไม่ถูกต้อง"})
		return
	}
	if body.PointsPerBottle < 0 {
		body.PointsPerBottle = 0
	}
	if body.CarbonPerBottle < 0 {
		body.CarbonPerBottle = 0
	}
	me := s.currentUser(r)
	by := me.UserID
	_ = s.store.setSetting("points_per_bottle", strconv.Itoa(body.PointsPerBottle), by)
	_ = s.store.setSetting("carbon_per_bottle", strconv.FormatFloat(body.CarbonPerBottle, 'f', 4, 64), by)
	_ = s.store.setSetting("announcement", strings.TrimSpace(body.Announcement), by)
	auto := "false"
	if body.WasteAutoApprove {
		auto = "true"
	}
	_ = s.store.setSetting("waste_auto_approve", auto, by)
	writeJSON(w, 200, s.store.getAppSettings())
}

func (s *Server) handleAdminCreateBin(w http.ResponseWriter, r *http.Request) {
	var body SmartBin
	if err := readJSON(r, &body); err != nil || strings.TrimSpace(body.BinName) == "" {
		writeJSON(w, 400, map[string]string{"error": "กรุณาระบุชื่อจุดทิ้ง"})
		return
	}
	if strings.TrimSpace(body.Status) == "" {
		body.Status = "พร้อมใช้งาน"
	}
	body.BinID = newID("BIN-")
	me := s.currentUser(r)
	_, err := s.store.db.Exec(`INSERT INTO smart_bins (bin_id, bin_name, status, capacity_note, created_by) VALUES (?,?,?,?,?)`,
		body.BinID, strings.TrimSpace(body.BinName), body.Status, body.CapacityNote, me.UserID)
	if err != nil {
		writeJSON(w, 500, map[string]string{"error": "บันทึกจุดทิ้งไม่สำเร็จ"})
		return
	}
	writeJSON(w, 201, body)
}

func (s *Server) handleAdminUpdateBin(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var body SmartBin
	if err := readJSON(r, &body); err != nil {
		writeJSON(w, 400, map[string]string{"error": "ข้อมูลไม่ถูกต้อง"})
		return
	}
	if strings.TrimSpace(body.BinName) == "" {
		writeJSON(w, 400, map[string]string{"error": "กรุณาระบุชื่อจุดทิ้ง"})
		return
	}
	if strings.TrimSpace(body.Status) == "" {
		body.Status = "พร้อมใช้งาน"
	}
	res, err := s.store.db.Exec(`UPDATE smart_bins SET bin_name=?, status=?, capacity_note=? WHERE bin_id=? AND delete_at IS NULL`,
		strings.TrimSpace(body.BinName), body.Status, body.CapacityNote, id)
	if err != nil {
		writeJSON(w, 500, map[string]string{"error": "อัปเดตไม่สำเร็จ"})
		return
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		writeJSON(w, 404, map[string]string{"error": "ไม่พบจุดทิ้ง"})
		return
	}
	body.BinID = id
	writeJSON(w, 200, body)
}

func (s *Server) handleAdminDeleteBin(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	me := s.currentUser(r)
	res, err := s.store.db.Exec(`UPDATE smart_bins SET delete_at=?, delete_by=? WHERE bin_id=? AND delete_at IS NULL`, time.Now(), me.UserID, id)
	if err != nil {
		writeJSON(w, 500, map[string]string{"error": "ลบไม่สำเร็จ"})
		return
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		writeJSON(w, 404, map[string]string{"error": "ไม่พบจุดทิ้ง"})
		return
	}
	writeJSON(w, 200, map[string]string{"ok": "true"})
}

func (s *Server) handleAdminPatchUser(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var body struct {
		UserRole    *string `json:"user_role"`
		Department  *string `json:"department"`
		FullName    *string `json:"full_name"`
		PointsDelta *int    `json:"points_delta"`
		Reason      string  `json:"reason"`
	}
	if err := readJSON(r, &body); err != nil {
		writeJSON(w, 400, map[string]string{"error": "ข้อมูลไม่ถูกต้อง"})
		return
	}
	me := s.currentUser(r)
	target, err := s.store.getUserByID(id)
	if err != nil || target == nil {
		writeJSON(w, 404, map[string]string{"error": "ไม่พบผู้ใช้"})
		return
	}

	if body.UserRole != nil {
		role := strings.TrimSpace(*body.UserRole)
		if role != "Admin" && role != "Member" {
			writeJSON(w, 400, map[string]string{"error": "สิทธิ์ไม่ถูกต้อง"})
			return
		}
		if target.UserRole == "Admin" && role == "Member" {
			if id == me.UserID {
				writeJSON(w, 409, map[string]string{"error": "ไม่สามารถลดสิทธิ์บัญชีตัวเองได้"})
				return
			}
			var n int
			_ = s.store.db.QueryRow(`SELECT COUNT(*) FROM users WHERE user_role='Admin' AND delete_at IS NULL`).Scan(&n)
			if n <= 1 {
				writeJSON(w, 409, map[string]string{"error": "ต้องมีแอดมินอย่างน้อย 1 คน"})
				return
			}
		}
		_, _ = s.store.db.Exec(`UPDATE users SET user_role=? WHERE user_id=? AND delete_at IS NULL`, role, id)
	}
	if body.Department != nil {
		_, _ = s.store.db.Exec(`UPDATE users SET department=? WHERE user_id=? AND delete_at IS NULL`, strings.TrimSpace(*body.Department), id)
	}
	if body.FullName != nil {
		name := strings.TrimSpace(*body.FullName)
		if name != "" {
			_, _ = s.store.db.Exec(`UPDATE users SET full_name=? WHERE user_id=? AND delete_at IS NULL`, name, id)
		}
	}
	if body.PointsDelta != nil && *body.PointsDelta != 0 {
		delta := *body.PointsDelta
		reason := strings.TrimSpace(body.Reason)
		if reason == "" {
			if delta > 0 {
				reason = "แอดมินปรับแต้มโบนัส"
			} else {
				reason = "แอดมินหักแต้ม"
			}
		}
		_, _ = s.store.db.Exec(`UPDATE users SET total_points = GREATEST(0, total_points + ?) WHERE user_id=? AND delete_at IS NULL`, delta, id)
		_, _ = s.store.db.Exec(`INSERT INTO point_transactions (transaction_id, user_id, record_id, points_earned, transaction_type, description, transaction_date, created_by)
			VALUES (?,?,NULL,?,'bonus',?,?,?)`, newID("TXN"), id, delta, reason, time.Now(), me.UserID)
	}
	u, _ := s.store.getUserByID(id)
	writeJSON(w, 200, map[string]any{"user": u})
}

func (s *Server) handleAdminDeleteUser(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	me := s.currentUser(r)
	if id == me.UserID {
		writeJSON(w, 409, map[string]string{"error": "ไม่สามารถปิดบัญชีตัวเองได้"})
		return
	}
	target, err := s.store.getUserByID(id)
	if err != nil || target == nil {
		writeJSON(w, 404, map[string]string{"error": "ไม่พบผู้ใช้"})
		return
	}
	if target.UserRole == "Admin" {
		var n int
		_ = s.store.db.QueryRow(`SELECT COUNT(*) FROM users WHERE user_role='Admin' AND delete_at IS NULL`).Scan(&n)
		if n <= 1 {
			writeJSON(w, 409, map[string]string{"error": "ต้องมีแอดมินอย่างน้อย 1 คน"})
			return
		}
	}
	_, err = s.store.db.Exec(`UPDATE users SET delete_at=?, delete_by=? WHERE user_id=? AND delete_at IS NULL`, time.Now(), me.UserID, id)
	if err != nil {
		writeJSON(w, 500, map[string]string{"error": "ปิดบัญชีไม่สำเร็จ"})
		return
	}
	writeJSON(w, 200, map[string]string{"ok": "true"})
}

func (s *Server) handleAdminRedeemCancel(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Code string `json:"code"`
	}
	if err := readJSON(r, &body); err != nil {
		writeJSON(w, 400, map[string]string{"error": "ข้อมูลไม่ถูกต้อง"})
		return
	}
	code := normalizePickupCode(body.Code)
	if code == "" {
		writeJSON(w, 400, map[string]string{"error": "กรุณาระบุรหัสรับของรางวัล"})
		return
	}
	me := s.currentUser(r)
	tx, err := s.store.db.Begin()
	if err != nil {
		writeJSON(w, 500, map[string]string{"error": "transaction failed"})
		return
	}
	defer tx.Rollback()

	var redeemID, status, userID, rewardID string
	var pointsUsed int
	err = tx.QueryRow(`SELECT redeem_id, redeem_status, user_id, reward_id, points_used FROM redemptions WHERE pickup_code=? AND delete_at IS NULL FOR UPDATE`, code).
		Scan(&redeemID, &status, &userID, &rewardID, &pointsUsed)
	if err == sql.ErrNoRows {
		writeJSON(w, 404, map[string]string{"error": "ไม่พบรหัสรับของรางวัลนี้"})
		return
	}
	if err != nil {
		writeJSON(w, 500, map[string]string{"error": "ค้นหาไม่สำเร็จ"})
		return
	}
	if status != "รอรับของรางวัล" {
		writeJSON(w, 409, map[string]string{"error": "ยกเลิกได้เฉพาะรายการที่รอรับของ"})
		return
	}
	if _, err := tx.Exec(`UPDATE redemptions SET redeem_status='ยกเลิก' WHERE redeem_id=?`, redeemID); err != nil {
		writeJSON(w, 500, map[string]string{"error": "บันทึกไม่สำเร็จ"})
		return
	}
	_, _ = tx.Exec(`UPDATE users SET total_points = total_points + ? WHERE user_id=? AND delete_at IS NULL`, pointsUsed, userID)
	_, _ = tx.Exec(`UPDATE rewards SET reward_stock = reward_stock + 1 WHERE reward_id=? AND delete_at IS NULL`, rewardID)
	_, _ = tx.Exec(`INSERT INTO point_transactions (transaction_id, user_id, record_id, points_earned, transaction_type, description, transaction_date, created_by)
		VALUES (?,?,NULL,?,'bonus',?,?,?)`, newID("TXN"), userID, pointsUsed, fmt.Sprintf("คืนแต้มจากยกเลิกแลกรางวัล %s", code), time.Now(), me.UserID)
	if err := tx.Commit(); err != nil {
		writeJSON(w, 500, map[string]string{"error": "บันทึกไม่สำเร็จ"})
		return
	}
	red, _ := s.store.getRedemptionByCode(code)
	writeJSON(w, 200, map[string]any{"redemption": red})
}

func (s *Server) handleAdminCreatePlastic(w http.ResponseWriter, r *http.Request) {
	var body PlasticType
	if err := readJSON(r, &body); err != nil || strings.TrimSpace(body.DisplayNameTH) == "" {
		writeJSON(w, 400, map[string]string{"error": "กรุณาระบุชื่อขวด/ประเภท"})
		return
	}
	if strings.TrimSpace(body.ShortName) == "" {
		body.ShortName = body.DisplayNameTH
	}
	if strings.TrimSpace(body.FullName) == "" {
		body.FullName = body.DisplayNameTH
	}
	if body.PointsPerBottle < 0 {
		body.PointsPerBottle = 0
	}
	if body.CarbonFactor < 0 {
		body.CarbonFactor = 0
	}
	var next int
	_ = s.store.db.QueryRow(`SELECT IFNULL(MAX(plastic_code),0)+1 FROM plastic_types`).Scan(&next)
	if next < 1 {
		next = 1
	}
	me := s.currentUser(r)
	_, err := s.store.db.Exec(`INSERT INTO plastic_types (plastic_code, short_name, full_name, display_name_th, carbon_factor, points_per_bottle, recycling_tips, created_by)
		VALUES (?,?,?,?,?,?,?,?)`, next, body.ShortName, body.FullName, strings.TrimSpace(body.DisplayNameTH), body.CarbonFactor, body.PointsPerBottle, body.RecyclingTips, me.UserID)
	if err != nil {
		writeJSON(w, 500, map[string]string{"error": "บันทึกชนิดขวดไม่สำเร็จ"})
		return
	}
	body.PlasticCode = next
	writeJSON(w, 201, body)
}

func (s *Server) handleAdminUpdatePlastic(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var body PlasticType
	if err := readJSON(r, &body); err != nil || strings.TrimSpace(body.DisplayNameTH) == "" {
		writeJSON(w, 400, map[string]string{"error": "กรุณาระบุชื่อขวด/ประเภท"})
		return
	}
	if strings.TrimSpace(body.ShortName) == "" {
		body.ShortName = body.DisplayNameTH
	}
	if strings.TrimSpace(body.FullName) == "" {
		body.FullName = body.DisplayNameTH
	}
	if body.PointsPerBottle < 0 {
		body.PointsPerBottle = 0
	}
	res, err := s.store.db.Exec(`UPDATE plastic_types SET short_name=?, full_name=?, display_name_th=?, carbon_factor=?, points_per_bottle=?, recycling_tips=?
		WHERE plastic_code=? AND delete_at IS NULL`,
		body.ShortName, body.FullName, strings.TrimSpace(body.DisplayNameTH), body.CarbonFactor, body.PointsPerBottle, body.RecyclingTips, id)
	if err != nil {
		writeJSON(w, 500, map[string]string{"error": "อัปเดตไม่สำเร็จ"})
		return
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		writeJSON(w, 404, map[string]string{"error": "ไม่พบชนิดขวด"})
		return
	}
	writeJSON(w, 200, body)
}

func (s *Server) handleAdminDeletePlastic(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	me := s.currentUser(r)
	res, err := s.store.db.Exec(`UPDATE plastic_types SET delete_at=?, delete_by=? WHERE plastic_code=? AND delete_at IS NULL`, time.Now(), me.UserID, id)
	if err != nil {
		writeJSON(w, 500, map[string]string{"error": "ลบไม่สำเร็จ"})
		return
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		writeJSON(w, 404, map[string]string{"error": "ไม่พบชนิดขวด"})
		return
	}
	writeJSON(w, 200, map[string]string{"ok": "true"})
}
