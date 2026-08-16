package main

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"golang.org/x/crypto/bcrypt"
)

type Server struct {
	store *Store
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func readJSON(r *http.Request, v any) error {
	defer r.Body.Close()
	return json.NewDecoder(r.Body).Decode(v)
}

func (s *Server) setAuthCookie(w http.ResponseWriter, token string) {
	cookie := &http.Cookie{
		Name:     "ecobin_token",
		Value:    token,
		Path:     "/",
		MaxAge:   7 * 24 * 3600,
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		Secure:   envTrue("COOKIE_SECURE", false),
	}
	http.SetCookie(w, cookie)
}

func (s *Server) clearAuthCookie(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:     "ecobin_token",
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   envTrue("COOKIE_SECURE", false),
	})
}

func tokenFromRequest(r *http.Request) string {
	if c, err := r.Cookie("ecobin_token"); err == nil && c.Value != "" {
		return c.Value
	}
	h := r.Header.Get("Authorization")
	if strings.HasPrefix(h, "Bearer ") {
		return strings.TrimPrefix(h, "Bearer ")
	}
	return ""
}

func (s *Server) currentUser(r *http.Request) *User {
	tok := tokenFromRequest(r)
	if tok == "" {
		return nil
	}
	c, err := parseToken(tok)
	if err != nil {
		return nil
	}
	u, err := s.store.getUserByID(c.UserID)
	if err != nil {
		return nil
	}
	return u
}

func (s *Server) requireUser(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if s.currentUser(r) == nil {
			writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "กรุณาเข้าสู่ระบบ"})
			return
		}
		next.ServeHTTP(w, r)
	})
}

func (s *Server) requireAdmin(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		u := s.currentUser(r)
		if u == nil || u.UserRole != "Admin" {
			writeJSON(w, http.StatusForbidden, map[string]string{"error": "เฉพาะผู้ดูแลระบบ"})
			return
		}
		next.ServeHTTP(w, r)
	})
}

func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	if err := s.store.db.Ping(); err != nil {
		writeJSON(w, http.StatusServiceUnavailable, map[string]string{"status": "error", "error": "database unavailable"})
		return
	}
	writeJSON(w, 200, map[string]string{"status": "ok"})
}

func (s *Server) handleState(w http.ResponseWriter, r *http.Request) {
	me := s.currentUser(r)
	admin := me != nil && me.UserRole == "Admin"
	uid := ""
	if me != nil {
		uid = me.UserID
	}

	users := []User{}
	if admin {
		users, _ = s.store.listUsers()
	}
	rewards, _ := s.store.listRewards()
	bins, _ := s.store.listBins()
	plastics, _ := s.store.listPlasticTypes()
	settings := s.store.getAppSettings()
	var waste []WasteRecord
	var txns []PointTransaction
	var reds []Redemption
	var guests []GuestLog
	if me != nil {
		waste, _ = s.store.listWaste(uid, admin)
		txns, _ = s.store.listTransactions(uid, admin)
		reds, _ = s.store.listRedemptions(uid, admin)
	} else {
		waste = []WasteRecord{}
		txns = []PointTransaction{}
		reds = []Redemption{}
	}
	if admin {
		guests, _ = s.store.listGuestLogs()
	} else {
		guests = []GuestLog{}
	}

	writeJSON(w, 200, map[string]any{
		"user":           me,
		"users":          users,
		"waste_records":  waste,
		"rewards":        rewards,
		"transactions":   txns,
		"redemptions":    reds,
		"guest_logs":     guests,
		"bins":           bins,
		"plastic_types":  plastics,
		"settings":       settings,
	})
}

func (s *Server) handleRegister(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Login     string `json:"login"`
		Email     string `json:"email"`
		Password  string `json:"password"`
		Code      string `json:"code"`
		FirstName string `json:"first_name"`
		LastName  string `json:"last_name"`
		AvatarURL string `json:"avatar_url"`
	}
	if err := readJSON(r, &body); err != nil {
		writeJSON(w, 400, map[string]string{"error": "ข้อมูลไม่ถูกต้อง"})
		return
	}
	login := strings.TrimSpace(body.Login)
	if login == "" {
		login = strings.TrimSpace(body.Email)
	}
	email, sid, provider, err := normalizeRegisterLogin(login)
	if err != nil {
		writeJSON(w, 400, map[string]string{"error": err.Error()})
		return
	}
	if err := validateStrongPassword(body.Password); err != nil {
		writeJSON(w, 400, map[string]string{"error": err.Error()})
		return
	}
	first := strings.TrimSpace(body.FirstName)
	last := strings.TrimSpace(body.LastName)
	if _, err := s.store.getUserByLogin(login); err == nil {
		writeJSON(w, 409, map[string]string{"error": "ชื่อผู้ใช้หรืออีเมลนี้มีบัญชีอยู่แล้ว"})
		return
	}
	if _, err := s.store.getUserByEmail(email); err == nil {
		writeJSON(w, 409, map[string]string{"error": "อีเมลนี้มีบัญชีอยู่แล้ว"})
		return
	}
	if strings.TrimSpace(body.Code) != "" {
		if err := s.consumeEmailOTP(email, body.Code); err != nil {
			writeOTPError(w, err)
			return
		}
	}
	hash, _ := bcrypt.GenerateFromPassword([]byte(body.Password), bcrypt.DefaultCost)
	fullName := first + " " + last
	u, err := s.insertMember(fullName, sid, email, "", provider, "", strings.TrimSpace(body.AvatarURL), string(hash))
	if err != nil {
		writeJSON(w, 409, map[string]string{"error": "ไม่สามารถสร้างบัญชีได้"})
		return
	}
	s.finishAuth(w, u, 201)
}

func (s *Server) handleLogin(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Login    string `json:"login"`
		Password string `json:"password"`
	}
	if err := readJSON(r, &body); err != nil {
		writeJSON(w, 400, map[string]string{"error": "ข้อมูลไม่ถูกต้อง"})
		return
	}
	u, err := s.store.getUserByLogin(strings.TrimSpace(body.Login))
	if err != nil || bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(body.Password)) != nil {
		writeJSON(w, 401, map[string]string{"error": "ไม่พบบัญชีผู้ใช้ หรือรหัสผ่านไม่ถูกต้อง"})
		return
	}
	token, _ := signToken(u.UserID, u.UserRole)
	s.setAuthCookie(w, token)
	writeJSON(w, 200, map[string]any{"user": u, "token": token})
}

func (s *Server) handleLogout(w http.ResponseWriter, r *http.Request) {
	s.clearAuthCookie(w)
	writeJSON(w, 200, map[string]string{"ok": "true"})
}

func (s *Server) handleUpdateProfile(w http.ResponseWriter, r *http.Request) {
	me := s.currentUser(r)
	var body struct {
		FirstName  string `json:"first_name"`
		LastName   string `json:"last_name"`
		FullName   string `json:"full_name"`
		StudentID  string `json:"student_id"`
		Email      string `json:"email"`
		Department string `json:"department"`
		AvatarURL  string `json:"avatar_url"`
	}
	if err := readJSON(r, &body); err != nil {
		writeJSON(w, 400, map[string]string{"error": "ข้อมูลไม่ถูกต้อง"})
		return
	}
	first := strings.TrimSpace(body.FirstName)
	last := strings.TrimSpace(body.LastName)
	if first == "" || last == "" {
		if strings.TrimSpace(body.FullName) != "" && first == "" && last == "" {
			parts := strings.Fields(strings.TrimSpace(body.FullName))
			if len(parts) >= 2 {
				first = parts[0]
				last = strings.Join(parts[1:], " ")
			}
		}
	}
	if first == "" || last == "" {
		writeJSON(w, 400, map[string]string{"error": "กรุณากรอกชื่อและนามสกุล"})
		return
	}
	fullName := first + " " + last
	email := strings.TrimSpace(body.Email)
	if email == "" {
		email = me.Email
	}
	studentID := strings.TrimSpace(body.StudentID)
	if studentID == "" {
		studentID = me.StudentID
	}
	dept := body.Department
	if dept == "" {
		dept = me.Department
	}
	avatar := body.AvatarURL
	if avatar == "" {
		avatar = me.AvatarURL
	}
	if i := strings.Index(avatar, "/uploads/"); i >= 0 {
		avatar = avatar[i:]
	}
	_, err := s.store.db.Exec(`UPDATE users SET first_name=?, last_name=?, full_name=?, student_id=?, email=?, department=?, avatar_url=? WHERE user_id=? AND delete_at IS NULL`,
		first, last, fullName, studentID, email, dept, avatar, me.UserID)
	if err != nil {
		writeJSON(w, 409, map[string]string{"error": "ไม่สามารถบันทึกโปรไฟล์ได้"})
		return
	}
	u, _ := s.store.getUserByID(me.UserID)
	writeJSON(w, 200, map[string]any{"user": u})
}

func (s *Server) handleUploadAvatar(w http.ResponseWriter, r *http.Request) {
	me := s.currentUser(r)
	var body struct {
		ImageData string `json:"image_data"`
	}
	if err := readJSON(r, &body); err != nil || strings.TrimSpace(body.ImageData) == "" {
		writeJSON(w, 400, map[string]string{"error": "กรุณาเลือกรูปภาพ"})
		return
	}
	if len(body.ImageData) > 3_500_000 {
		writeJSON(w, 400, map[string]string{"error": "ไฟล์ใหญ่เกินไป ใช้รูปไม่เกินประมาณ 2 MB"})
		return
	}
	lower := strings.ToLower(body.ImageData)
	if !strings.Contains(lower, "image/jpeg") && !strings.Contains(lower, "image/jpg") && !strings.Contains(lower, "image/png") && !strings.Contains(lower, "image/webp") && !strings.HasPrefix(lower, "/9j/") {
		if !strings.HasPrefix(body.ImageData, "data:image/") {
			writeJSON(w, 400, map[string]string{"error": "รองรับเฉพาะไฟล์ JPG PNG หรือ WEBP"})
			return
		}
	}
	url, err := s.store.saveImage(body.ImageData, "avatar-"+me.UserID)
	if err != nil {
		writeJSON(w, 500, map[string]string{"error": "อัปโหลดรูปไม่สำเร็จ"})
		return
	}
	_, err = s.store.db.Exec(`UPDATE users SET avatar_url=? WHERE user_id=? AND delete_at IS NULL`, url, me.UserID)
	if err != nil {
		writeJSON(w, 500, map[string]string{"error": "บันทึกรูปโปรไฟล์ไม่สำเร็จ"})
		return
	}
	u, _ := s.store.getUserByID(me.UserID)
	writeJSON(w, 200, map[string]any{"user": u, "avatar_url": url})
}

func (s *Server) handleScan(w http.ResponseWriter, r *http.Request) {
	var body struct {
		ImageData string `json:"image_data"`
	}
	if err := readJSON(r, &body); err != nil || body.ImageData == "" {
		writeJSON(w, 400, map[string]string{"error": "ไม่มีรูปภาพ"})
		return
	}
	writeJSON(w, 200, scanImage(body.ImageData))
}

func (s *Server) requireCompleteProfile(w http.ResponseWriter, me *User) bool {
	if me != nil && me.NeedsProfile {
		writeJSON(w, 403, map[string]string{"error": "กรุณากรอกชื่อและนามสกุลก่อนใช้งาน"})
		return false
	}
	return true
}

func (s *Server) handleCreateWaste(w http.ResponseWriter, r *http.Request) {
	me := s.currentUser(r)
	if !s.requireCompleteProfile(w, me) {
		return
	}
	var body struct {
		ImageData   string `json:"image_data"`
		PlasticType string `json:"plastic_type"`
		BottleCount int    `json:"bottle_count"`
		BinLocation string `json:"bin_location"`
	}
	if err := readJSON(r, &body); err != nil {
		writeJSON(w, 400, map[string]string{"error": "ข้อมูลไม่ถูกต้อง"})
		return
	}
	if body.BottleCount < 1 {
		body.BottleCount = 1
	}
	id := newID("REC")
	img, err := s.store.saveImage(body.ImageData, id)
	if err != nil {
		writeJSON(w, 500, map[string]string{"error": "บันทึกรูปไม่สำเร็จ"})
		return
	}
	now := time.Now()
	status := "รอการตรวจสอบ"
	points := 0
	carbon := 0.0
	comment := "รอผู้ดูแลระบบตรวจสอบภาพถ่าย — แต้มจะได้รับเมื่อแอดมินกดอนุมัติ"
	_, err = s.store.db.Exec(`INSERT INTO waste_records (record_id, user_id, image_url, plastic_type, bottle_count, upload_timestamp, verification_status, carbon_saved, points_awarded, admin_comment, bin_location, created_by)
		VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
		id, me.UserID, img, body.PlasticType, body.BottleCount, now, status, carbon, points, comment, body.BinLocation, me.UserID)
	if err != nil {
		writeJSON(w, 500, map[string]string{"error": "บันทึกรายการไม่สำเร็จ"})
		return
	}
	records, _ := s.store.listWaste(me.UserID, false)
	var rec WasteRecord
	for _, x := range records {
		if x.RecordID == id {
			rec = x
			break
		}
	}
	u, _ := s.store.getUserByID(me.UserID)
	writeJSON(w, 201, map[string]any{"record": rec, "user": u})
}

func (s *Server) handleGuestScan(w http.ResponseWriter, r *http.Request) {
	var body struct {
		ImageData       string `json:"image_data"`
		DetectedBottles int    `json:"detected_bottles"`
		ScanResult      string `json:"scan_result"`
	}
	if err := readJSON(r, &body); err != nil {
		writeJSON(w, 400, map[string]string{"error": "ข้อมูลไม่ถูกต้อง"})
		return
	}
	id := newID("GST")
	img, _ := s.store.saveImage(body.ImageData, id)
	now := time.Now()
	cfg := s.store.getAppSettings()
	est := body.DetectedBottles * cfg.PointsPerBottle
	_, _ = s.store.db.Exec(`INSERT INTO guest_logs (guest_session_id, device_id, temp_image_path, temp_scan_result, detected_bottles, estimated_points, timestamp, created_by)
		VALUES (?,?,?,?,?,?,?,?)`, id, "WEB-BROWSER", img, body.ScanResult, body.DetectedBottles, est, now, actorSystem)
	writeJSON(w, 201, GuestLog{
		GuestSessionID:  id,
		DeviceID:        "WEB-BROWSER",
		TempImagePath:   img,
		TempScanResult:  body.ScanResult,
		DetectedBottles: body.DetectedBottles,
		EstimatedPoints: est,
		Timestamp:       fmtTime(now),
	})
}

func (s *Server) handleVerifyWaste(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var body struct {
		Status         string `json:"status"`
		Comment        string `json:"comment"`
		AdjustedPoints *int   `json:"adjusted_points"`
	}
	if err := readJSON(r, &body); err != nil {
		writeJSON(w, 400, map[string]string{"error": "ข้อมูลไม่ถูกต้อง"})
		return
	}
	var rec WasteRecord
	err := s.store.db.QueryRow(`SELECT record_id, user_id, bottle_count, verification_status, points_awarded, plastic_type FROM waste_records WHERE record_id=? AND delete_at IS NULL`, id).
		Scan(&rec.RecordID, &rec.UserID, &rec.BottleCount, &rec.VerificationStatus, &rec.PointsAwarded, &rec.PlasticType)
	if err != nil {
		writeJSON(w, 404, map[string]string{"error": "ไม่พบรายการ"})
		return
	}
	if body.Status != "อนุมัติแล้ว" && body.Status != "ไม่อนุมัติ" && body.Status != "กรุณาส่งภาพมาใหม่" {
		writeJSON(w, 400, map[string]string{"error": "ผลการพิจารณาไม่ถูกต้อง"})
		return
	}
	prev := rec.VerificationStatus
	unitPts, unitCarbon := s.store.scoreForPlastic(rec.PlasticType)
	finalPoints := rec.BottleCount * unitPts
	if body.AdjustedPoints != nil {
		finalPoints = *body.AdjustedPoints
	}
	if body.Status == "ไม่อนุมัติ" || body.Status == "กรุณาส่งภาพมาใหม่" {
		finalPoints = 0
	}
	carbon := 0.0
	if body.Status == "อนุมัติแล้ว" {
		carbon = float64(rec.BottleCount) * unitCarbon
	}
	_, _ = s.store.db.Exec(`UPDATE waste_records SET verification_status=?, admin_comment=?, points_awarded=?, carbon_saved=? WHERE record_id=? AND delete_at IS NULL`,
		body.Status, body.Comment, finalPoints, carbon, id)
	if body.Status == "อนุมัติแล้ว" && prev != "อนุมัติแล้ว" {
		adminID := s.currentUser(r).UserID
		_, _ = s.store.db.Exec(`UPDATE users SET total_points = total_points + ?, total_carbon_saved = total_carbon_saved + ? WHERE user_id=? AND delete_at IS NULL`, finalPoints, carbon, rec.UserID)
		_, _ = s.store.db.Exec(`INSERT INTO point_transactions (transaction_id, user_id, record_id, points_earned, transaction_type, description, transaction_date, created_by)
			VALUES (?,?,?,?,'earn',?,?,?)`, newID("TXN"), rec.UserID, id, finalPoints, "อนุมัติภาพถ่ายขยะ +แต้ม", time.Now(), adminID)
	}
	writeJSON(w, 200, map[string]string{"ok": "true"})
}

func (s *Server) handleRedeem(w http.ResponseWriter, r *http.Request) {
	me := s.currentUser(r)
	if !s.requireCompleteProfile(w, me) {
		return
	}
	id := chi.URLParam(r, "id")
	tx, err := s.store.db.Begin()
	if err != nil {
		writeJSON(w, 500, map[string]string{"error": "transaction failed"})
		return
	}
	defer tx.Rollback()

	var reward Reward
	if err := tx.QueryRow(`SELECT reward_id, reward_name, points_required, reward_stock, reward_image FROM rewards WHERE reward_id=? AND delete_at IS NULL FOR UPDATE`, id).
		Scan(&reward.RewardID, &reward.RewardName, &reward.PointsRequired, &reward.RewardStock, &reward.RewardImage); err != nil {
		writeJSON(w, 404, map[string]string{"error": "ไม่พบของรางวัล"})
		return
	}
	if reward.RewardStock <= 0 {
		writeJSON(w, 409, map[string]string{"error": "ของรางวัลหมดสต็อก"})
		return
	}
	var points int
	if err := tx.QueryRow(`SELECT total_points FROM users WHERE user_id=? AND delete_at IS NULL FOR UPDATE`, me.UserID).Scan(&points); err != nil {
		writeJSON(w, 500, map[string]string{"error": "ไม่พบบัญชี"})
		return
	}
	if points < reward.PointsRequired {
		writeJSON(w, 409, map[string]string{"error": "แต้มสะสมไม่เพียงพอ"})
		return
	}
	pickup := newID("PCRU-ECO-")
	redeemID := newID("RDM")
	now := time.Now()
	_, _ = tx.Exec(`UPDATE users SET total_points = total_points - ? WHERE user_id=? AND delete_at IS NULL`, reward.PointsRequired, me.UserID)
	_, _ = tx.Exec(`UPDATE rewards SET reward_stock = reward_stock - 1 WHERE reward_id=? AND delete_at IS NULL`, id)
	_, _ = tx.Exec(`INSERT INTO redemptions (redeem_id, user_id, reward_id, points_used, redeem_date, redeem_status, pickup_code, created_by)
		VALUES (?,?,?,?,?,'รอรับของรางวัล',?,?)`, redeemID, me.UserID, id, reward.PointsRequired, now, pickup, me.UserID)
	_, _ = tx.Exec(`INSERT INTO point_transactions (transaction_id, user_id, record_id, points_earned, transaction_type, description, transaction_date, created_by)
		VALUES (?,?,NULL,?,'redeem',?,?,?)`, newID("TXN"), me.UserID, -reward.PointsRequired, "แลกของรางวัล: "+reward.RewardName, now, me.UserID)
	if err := tx.Commit(); err != nil {
		writeJSON(w, 500, map[string]string{"error": "บันทึกไม่สำเร็จ"})
		return
	}
	u, _ := s.store.getUserByID(me.UserID)
	writeJSON(w, 201, map[string]any{
		"user": u,
		"redemption": Redemption{
			RedeemID:     redeemID,
			UserID:       me.UserID,
			UserName:     me.FullName,
			StudentID:    me.StudentID,
			RewardID:     reward.RewardID,
			RewardName:   reward.RewardName,
			RewardImage:  reward.RewardImage,
			PointsUsed:   reward.PointsRequired,
			RedeemDate:   fmtTime(now),
			RedeemStatus: "รอรับของรางวัล",
			PickupCode:   pickup,
		},
	})
}

func (s *Server) handleAdminRedeemLookup(w http.ResponseWriter, r *http.Request) {
	code := normalizePickupCode(r.URL.Query().Get("code"))
	if code == "" {
		writeJSON(w, 400, map[string]string{"error": "กรุณาระบุรหัสรับของรางวัล"})
		return
	}
	red, err := s.store.getRedemptionByCode(code)
	if err == sql.ErrNoRows {
		writeJSON(w, 404, map[string]string{"error": "ไม่พบรหัสรับของรางวัลนี้"})
		return
	}
	if err != nil {
		writeJSON(w, 500, map[string]string{"error": "ค้นหาไม่สำเร็จ"})
		return
	}
	writeJSON(w, 200, map[string]any{"redemption": red})
}

func (s *Server) handleAdminRedeemClaim(w http.ResponseWriter, r *http.Request) {
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

	tx, err := s.store.db.Begin()
	if err != nil {
		writeJSON(w, 500, map[string]string{"error": "transaction failed"})
		return
	}
	defer tx.Rollback()

	var redeemID, status string
	err = tx.QueryRow(`SELECT redeem_id, redeem_status FROM redemptions WHERE pickup_code=? AND delete_at IS NULL FOR UPDATE`, code).
		Scan(&redeemID, &status)
	if err == sql.ErrNoRows {
		writeJSON(w, 404, map[string]string{"error": "ไม่พบรหัสรับของรางวัลนี้"})
		return
	}
	if err != nil {
		writeJSON(w, 500, map[string]string{"error": "ค้นหาไม่สำเร็จ"})
		return
	}
	if status == "สำเร็จ" {
		writeJSON(w, 409, map[string]string{"error": "จ่ายของรางวัลไปแล้ว"})
		return
	}
	if status != "รอรับของรางวัล" {
		writeJSON(w, 409, map[string]string{"error": "สถานะรายการนี้ไม่สามารถจ่ายของได้"})
		return
	}
	if _, err := tx.Exec(`UPDATE redemptions SET redeem_status='สำเร็จ' WHERE redeem_id=? AND delete_at IS NULL`, redeemID); err != nil {
		writeJSON(w, 500, map[string]string{"error": "บันทึกไม่สำเร็จ"})
		return
	}
	if err := tx.Commit(); err != nil {
		writeJSON(w, 500, map[string]string{"error": "บันทึกไม่สำเร็จ"})
		return
	}
	red, err := s.store.getRedemptionByCode(code)
	if err != nil {
		writeJSON(w, 200, map[string]any{"ok": true})
		return
	}
	writeJSON(w, 200, map[string]any{"redemption": red})
}

func (s *Server) handleCreateReward(w http.ResponseWriter, r *http.Request) {
	var body Reward
	if err := readJSON(r, &body); err != nil {
		writeJSON(w, 400, map[string]string{"error": "ข้อมูลไม่ถูกต้อง"})
		return
	}
	body.RewardID = newID("REW")
	me := s.currentUser(r)
	_, err := s.store.db.Exec(`INSERT INTO rewards (reward_id, reward_name, points_required, reward_description, reward_stock, reward_image, category, created_by)
		VALUES (?,?,?,?,?,?,?,?)`, body.RewardID, body.RewardName, body.PointsRequired, body.RewardDescription, body.RewardStock, body.RewardImage, body.Category, me.UserID)
	if err != nil {
		writeJSON(w, 400, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, 201, body)
}

func (s *Server) handleUpdateReward(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var body Reward
	if err := readJSON(r, &body); err != nil {
		writeJSON(w, 400, map[string]string{"error": "ข้อมูลไม่ถูกต้อง"})
		return
	}
	_, err := s.store.db.Exec(`UPDATE rewards SET reward_name=?, points_required=?, reward_description=?, reward_stock=?, reward_image=?, category=? WHERE reward_id=? AND delete_at IS NULL`,
		body.RewardName, body.PointsRequired, body.RewardDescription, body.RewardStock, body.RewardImage, body.Category, id)
	if err != nil {
		writeJSON(w, 400, map[string]string{"error": err.Error()})
		return
	}
	body.RewardID = id
	writeJSON(w, 200, body)
}

func (s *Server) handleDeleteReward(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	me := s.currentUser(r)
	res, err := s.store.db.Exec(`UPDATE rewards SET delete_at=NOW(), delete_by=? WHERE reward_id=? AND delete_at IS NULL`, me.UserID, id)
	if err != nil {
		writeJSON(w, 409, map[string]string{"error": "ไม่สามารถลบของรางวัลได้"})
		return
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		writeJSON(w, 404, map[string]string{"error": "ไม่พบของรางวัล หรือถูกลบไปแล้ว"})
		return
	}
	writeJSON(w, 200, map[string]string{"ok": "true"})
}

func (s *Server) handleAdminStats(w http.ResponseWriter, r *http.Request) {
	var bottles, pending, members int
	_ = s.store.db.QueryRow(`SELECT IFNULL(SUM(bottle_count),0) FROM waste_records WHERE verification_status='อนุมัติแล้ว' AND delete_at IS NULL`).Scan(&bottles)
	_ = s.store.db.QueryRow(`SELECT COUNT(*) FROM waste_records WHERE verification_status='รอการตรวจสอบ' AND delete_at IS NULL`).Scan(&pending)
	_ = s.store.db.QueryRow(`SELECT COUNT(*) FROM users WHERE user_role='Member' AND delete_at IS NULL`).Scan(&members)
	writeJSON(w, 200, map[string]int{"approved_bottles": bottles, "pending_records": pending, "members": members})
}

func (s *Server) handleAdminRelations(w http.ResponseWriter, r *http.Request) {
	type userCount struct {
		UserID      string `json:"user_id"`
		FullName    string `json:"full_name"`
		StudentID   string `json:"student_id"`
		UserRole    string `json:"user_role"`
		TotalPoints int    `json:"total_points"`
		WasteCount  int    `json:"waste_count"`
		TxnCount    int    `json:"txn_count"`
		RedeemCount int    `json:"redeem_count"`
	}
	rows, err := s.store.db.Query(`SELECT user_id, full_name, student_id, user_role, total_points, waste_count, txn_count, redeem_count FROM v_user_child_counts ORDER BY waste_count DESC, user_id`)
	if err != nil {
		writeJSON(w, 500, map[string]string{"error": "ยังไม่มีมุมมอง 1:M กรุณารัน infra/views.sql"})
		return
	}
	defer rows.Close()
	users := []userCount{}
	for rows.Next() {
		var u userCount
		if err := rows.Scan(&u.UserID, &u.FullName, &u.StudentID, &u.UserRole, &u.TotalPoints, &u.WasteCount, &u.TxnCount, &u.RedeemCount); err != nil {
			writeJSON(w, 500, map[string]string{"error": err.Error()})
			return
		}
		users = append(users, u)
	}

	type rewardCount struct {
		RewardID   string `json:"reward_id"`
		RewardName string `json:"reward_name"`
		RedeemN    int    `json:"redeem_count"`
	}
	rrows, err := s.store.db.Query(`SELECT rw.reward_id, rw.reward_name, COUNT(r.redeem_id) FROM rewards rw LEFT JOIN redemptions r ON r.reward_id = rw.reward_id AND r.delete_at IS NULL WHERE rw.delete_at IS NULL GROUP BY rw.reward_id, rw.reward_name ORDER BY COUNT(r.redeem_id) DESC`)
	if err != nil {
		writeJSON(w, 500, map[string]string{"error": err.Error()})
		return
	}
	defer rrows.Close()
	rewards := []rewardCount{}
	for rrows.Next() {
		var x rewardCount
		if err := rrows.Scan(&x.RewardID, &x.RewardName, &x.RedeemN); err != nil {
			writeJSON(w, 500, map[string]string{"error": err.Error()})
			return
		}
		rewards = append(rewards, x)
	}

	writeJSON(w, 200, map[string]any{
		"cardinality": "1:M",
		"explanations": []map[string]string{
			{"parent": "users", "child": "waste_records", "join": "users.user_id = waste_records.user_id", "meaning": "หนึ่งผู้ใช้มีหลายรายการทิ้งขยะ"},
			{"parent": "users", "child": "point_transactions", "join": "users.user_id = point_transactions.user_id", "meaning": "หนึ่งผู้ใช้มีหลายรายการแต้ม"},
			{"parent": "users", "child": "redemptions", "join": "users.user_id = redemptions.user_id", "meaning": "หนึ่งผู้ใช้แลกของได้หลายครั้ง"},
			{"parent": "rewards", "child": "redemptions", "join": "rewards.reward_id = redemptions.reward_id", "meaning": "หนึ่งของรางวัลถูกแลกได้หลายครั้ง"},
			{"parent": "smart_bins", "child": "waste_records", "join": "smart_bins.bin_id = waste_records.bin_id", "meaning": "หนึ่งจุดทิ้งมีหลายรายการ"},
			{"parent": "plastic_types", "child": "waste_records", "join": "plastic_types.plastic_code = waste_records.plastic_code", "meaning": "หนึ่งประเภทพลาสติกมีหลายรายการ"},
		},
		"users_1m":   users,
		"rewards_1m": rewards,
	})
}

func (s *Server) handleAdminUserChildren(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	u, err := s.store.getUserByID(id)
	if err != nil {
		writeJSON(w, 404, map[string]string{"error": "ไม่พบผู้ใช้"})
		return
	}
	waste, _ := s.store.listWaste(id, false)
	txns, _ := s.store.listTransactions(id, false)
	reds, _ := s.store.listRedemptions(id, false)
	writeJSON(w, 200, map[string]any{
		"parent":               u,
		"cardinality":          "1:M",
		"waste_records":        waste,
		"point_transactions":   txns,
		"redemptions":          reds,
	})
}

var _ = sql.ErrNoRows
