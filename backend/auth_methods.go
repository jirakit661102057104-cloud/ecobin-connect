package main

import (
	"crypto/rand"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"regexp"
	"strings"
	"time"
	"unicode"

	"golang.org/x/crypto/bcrypt"
)

func validateStrongPassword(pw string) error {
	if len([]rune(pw)) < 8 {
		return fmt.Errorf("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร")
	}
	var upper, lower, digit, special bool
	for _, r := range pw {
		switch {
		case unicode.IsUpper(r):
			upper = true
		case unicode.IsLower(r):
			lower = true
		case unicode.IsDigit(r):
			digit = true
		case unicode.IsPunct(r) || unicode.IsSymbol(r):
			special = true
		}
	}
	if !upper || !lower || !digit || !special {
		return fmt.Errorf("รหัสผ่านต้องมีตัวพิมพ์ใหญ่ ตัวพิมพ์เล็ก ตัวเลข และอักขระพิเศษ")
	}
	return nil
}

func randomPasswordHash() string {
	b := make([]byte, 24)
	_, _ = rand.Read(b)
	h, _ := bcrypt.GenerateFromPassword(b, bcrypt.DefaultCost)
	return string(h)
}

func normalizePhone(raw string) (string, error) {
	re := regexp.MustCompile(`\D`)
	s := re.ReplaceAllString(raw, "")
	if strings.HasPrefix(s, "66") && len(s) == 11 {
		s = "0" + s[2:]
	}
	if len(s) != 10 || !strings.HasPrefix(s, "0") {
		return "", fmt.Errorf("เบอร์โทรไม่ถูกต้อง ใช้รูปแบบ 08xxxxxxxx")
	}
	return s, nil
}

func (s *Server) finishAuth(w http.ResponseWriter, u *User, status int) {
	token, _ := signToken(u.UserID, u.UserRole)
	s.setAuthCookie(w, token)
	writeJSON(w, status, map[string]any{"user": u, "token": token})
}

func (s *Server) grantWelcomeBonus(userID string) {
	txnID := newID("TXN")
	_, _ = s.store.db.Exec(`INSERT INTO point_transactions (transaction_id, user_id, record_id, points_earned, transaction_type, description, transaction_date, created_by)
		VALUES (?,?,NULL,50,'bonus',?,?,?)`, txnID, userID, "โบนัสต้อนรับสมาชิกใหม่ โครงการ EcoBin Connect", time.Now(), userID)
}

func (s *Store) getUserByEmail(email string) (*User, error) {
	return s.getUserByLogin(email)
}

func (s *Store) getUserByGoogleSub(sub string) (*User, error) {
	return s.scanUserRow(s.db.QueryRow(`SELECT `+userSelectCols+` FROM users WHERE google_sub = ? AND delete_at IS NULL`, sub))
}

func (s *Store) getUserByPhone(phone string) (*User, error) {
	return s.scanUserRow(s.db.QueryRow(`SELECT `+userSelectCols+` FROM users WHERE phone = ? AND delete_at IS NULL`, phone))
}

func splitPersonName(full string) (first, last string) {
	parts := strings.Fields(strings.TrimSpace(full))
	if len(parts) == 0 {
		return "", ""
	}
	if len(parts) == 1 {
		return parts[0], ""
	}
	return parts[0], strings.Join(parts[1:], " ")
}

func (s *Server) insertMember(fullName, studentID, email, phone, provider, googleSub, avatar, passwordHash string) (*User, error) {
	if avatar == "" {
		avatar = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80"
	}
	if passwordHash == "" {
		passwordHash = randomPasswordHash()
	}
	first, last := splitPersonName(fullName)
	if strings.TrimSpace(fullName) == "" {
		fullName = strings.TrimSpace(first + " " + last)
	}
	id := newID("USR")
	var phoneArg any
	if phone == "" {
		phoneArg = nil
	} else {
		phoneArg = phone
	}
	var subArg any
	if googleSub == "" {
		subArg = nil
	} else {
		subArg = googleSub
	}
	_, err := s.store.db.Exec(`INSERT INTO users (user_id, full_name, first_name, last_name, student_id, email, password_hash, user_role, total_points, total_carbon_saved, avatar_url, department, created_by, phone, auth_provider, google_sub)
		VALUES (?,?,?,?,?,?,?,'Member',50,0,?,?,?,?,?,?)`,
		id, fullName, first, last, studentID, email, passwordHash, avatar, "คณะวิทยาศาสตร์และเทคโนโลยี", id, phoneArg, provider, subArg)
	if err != nil {
		return nil, err
	}
	s.grantWelcomeBonus(id)
	return s.store.getUserByID(id)
}

type googleTokenInfo struct {
	Aud           string `json:"aud"`
	Sub           string `json:"sub"`
	Email         string `json:"email"`
	EmailVerified string `json:"email_verified"`
	Name          string `json:"name"`
	Picture       string `json:"picture"`
}

func verifyGoogleIDToken(idToken string) (*googleTokenInfo, error) {
	clientID := strings.TrimSpace(os.Getenv("GOOGLE_CLIENT_ID"))
	if clientID == "" {
		return nil, fmt.Errorf("ยังไม่ได้ตั้งค่า GOOGLE_CLIENT_ID")
	}
	resp, err := http.Get("https://oauth2.googleapis.com/tokeninfo?id_token=" + url.QueryEscape(idToken))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("โทเคน Google ไม่ถูกต้อง")
	}
	var info googleTokenInfo
	if err := json.Unmarshal(body, &info); err != nil {
		return nil, err
	}
	if info.Aud != clientID {
		return nil, fmt.Errorf("โทเคน Google ไม่ตรงกับแอปนี้")
	}
	if info.Email == "" || info.Sub == "" {
		return nil, fmt.Errorf("บัญชี Google ไม่มีอีเมล")
	}
	return &info, nil
}

func (s *Server) handleGoogleConfig(w http.ResponseWriter, r *http.Request) {
	clientID := strings.TrimSpace(os.Getenv("GOOGLE_CLIENT_ID"))
	writeJSON(w, 200, map[string]any{
		"enabled":   clientID != "",
		"client_id": clientID,
	})
}

func (s *Server) handleGoogleAuth(w http.ResponseWriter, r *http.Request) {
	var body struct {
		IDToken   string `json:"id_token"`
		DemoEmail string `json:"demo_email"`
		DemoName  string `json:"demo_name"`
	}
	if err := readJSON(r, &body); err != nil {
		writeJSON(w, 400, map[string]string{"error": "ข้อมูลไม่ถูกต้อง"})
		return
	}

	var email, name, picture, sub string
	if strings.TrimSpace(body.IDToken) != "" {
		info, err := verifyGoogleIDToken(strings.TrimSpace(body.IDToken))
		if err != nil {
			writeJSON(w, 401, map[string]string{"error": err.Error()})
			return
		}
		email, name, picture, sub = info.Email, info.Name, info.Picture, info.Sub
	} else if !isProd() && strings.Contains(strings.ToLower(body.DemoEmail), "@") {
		email = strings.TrimSpace(strings.ToLower(body.DemoEmail))
		name = strings.TrimSpace(body.DemoName)
		if name == "" {
			name = strings.Split(email, "@")[0]
		}
		sub = "demo-" + email
	} else {
		writeJSON(w, 400, map[string]string{"error": "กรุณาเข้าสู่ระบบด้วย Google หรือตั้งค่า GOOGLE_CLIENT_ID"})
		return
	}

	if u, err := s.store.getUserByGoogleSub(sub); err == nil {
		s.finishAuth(w, u, 200)
		return
	}
	if u, err := s.store.getUserByEmail(email); err == nil {
		_, _ = s.store.db.Exec(`UPDATE users SET google_sub=?, auth_provider=IF(auth_provider='email','google',auth_provider) WHERE user_id=? AND delete_at IS NULL`, sub, u.UserID)
		u.AuthProvider = "google"
		s.finishAuth(w, u, 200)
		return
	}

	studentID := newID("G")
	if len(studentID) > 16 {
		studentID = studentID[:16]
	}
	u, err := s.insertMember(name, studentID, email, "", "google", sub, picture, "")
	if err != nil {
		writeJSON(w, 409, map[string]string{"error": "ไม่สามารถสร้างบัญชี Google ได้"})
		return
	}
	s.finishAuth(w, u, 201)
}

func randomOTPCode() string {
	var n uint32
	b := make([]byte, 4)
	if _, err := rand.Read(b); err == nil {
		n = uint32(b[0])<<24 | uint32(b[1])<<16 | uint32(b[2])<<8 | uint32(b[3])
	} else {
		n = uint32(time.Now().UnixNano())
	}
	return fmt.Sprintf("%06d", n%1000000)
}

func (s *Server) assertOTPCooldown(table, column, value string) error {
	var created time.Time
	q := fmt.Sprintf("SELECT created_at FROM %s WHERE %s=?", table, column)
	err := s.store.db.QueryRow(q, value).Scan(&created)
	if err == sql.ErrNoRows {
		return nil
	}
	if err != nil {
		return nil
	}
	wait := 60 * time.Second
	left := wait - time.Since(created)
	if left > 0 {
		return fmt.Errorf("รอ %d วินาทีก่อนขอรหัสใหม่", int(left.Seconds())+1)
	}
	return nil
}

func (s *Server) issuePhoneOTP(phone string) (string, error) {
	code := randomOTPCode()
	hash, _ := bcrypt.GenerateFromPassword([]byte(code), bcrypt.DefaultCost)
	_, err := s.store.db.Exec(`INSERT INTO phone_otps (phone, code_hash, expires_at) VALUES (?,?,?)
		ON DUPLICATE KEY UPDATE code_hash=VALUES(code_hash), expires_at=VALUES(expires_at), created_at=CURRENT_TIMESTAMP`,
		phone, string(hash), time.Now().Add(5*time.Minute))
	return code, err
}

func (s *Server) matchPhoneOTP(phone, code string) error {
	var hash string
	var exp time.Time
	err := s.store.db.QueryRow(`SELECT code_hash, expires_at FROM phone_otps WHERE phone=?`, phone).Scan(&hash, &exp)
	if err == sql.ErrNoRows {
		return fmt.Errorf("กรุณาขอรหัส OTP ก่อน")
	}
	if err != nil {
		return fmt.Errorf("ตรวจสอบ OTP ไม่สำเร็จ")
	}
	if time.Now().After(exp) {
		return fmt.Errorf("รหัส OTP หมดอายุแล้ว")
	}
	if bcrypt.CompareHashAndPassword([]byte(hash), []byte(strings.TrimSpace(code))) != nil {
		return fmt.Errorf("รหัส OTP ไม่ถูกต้อง")
	}
	return nil
}

func (s *Server) consumePhoneOTP(phone, code string) error {
	if err := s.matchPhoneOTP(phone, code); err != nil {
		return err
	}
	_, _ = s.store.db.Exec(`DELETE FROM phone_otps WHERE phone=?`, phone)
	return nil
}

func normalizeEmail(raw string) (string, error) {
	email := strings.ToLower(strings.TrimSpace(raw))
	if email == "" || !strings.Contains(email, "@") || strings.Contains(email, " ") {
		return "", fmt.Errorf("อีเมลไม่ถูกต้อง")
	}
	return email, nil
}

var usernameRE = regexp.MustCompile(`^[A-Za-z0-9._]{4,32}$`)

func normalizeRegisterLogin(raw string) (email, studentID, provider string, err error) {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return "", "", "", fmt.Errorf("กรุณากรอกชื่อผู้ใช้หรืออีเมล")
	}
	if strings.Contains(raw, "@") {
		email, err = normalizeEmail(raw)
		if err != nil {
			return "", "", "", err
		}
		sid := newID("S")
		if len(sid) > 16 {
			sid = sid[:16]
		}
		return email, sid, "email", nil
	}
	if !usernameRE.MatchString(raw) {
		return "", "", "", fmt.Errorf("ชื่อผู้ใช้ต้องมี 4–32 ตัว ใช้ได้เฉพาะ a-z 0-9 จุด และขีดล่าง")
	}
	return strings.ToLower(raw) + "@users.ecobin.local", strings.ToLower(raw), "username", nil
}

func (s *Server) issueEmailOTP(email string) (string, error) {
	code := randomOTPCode()
	hash, _ := bcrypt.GenerateFromPassword([]byte(code), bcrypt.DefaultCost)
	_, err := s.store.db.Exec(`INSERT INTO email_otps (email, code_hash, expires_at) VALUES (?,?,?)
		ON DUPLICATE KEY UPDATE code_hash=VALUES(code_hash), expires_at=VALUES(expires_at), created_at=CURRENT_TIMESTAMP`,
		email, string(hash), time.Now().Add(5*time.Minute))
	return code, err
}

func (s *Server) matchEmailOTP(email, code string) error {
	var hash string
	var exp time.Time
	err := s.store.db.QueryRow(`SELECT code_hash, expires_at FROM email_otps WHERE email=?`, email).Scan(&hash, &exp)
	if err == sql.ErrNoRows {
		return fmt.Errorf("กรุณาขอรหัส OTP ก่อน")
	}
	if err != nil {
		return fmt.Errorf("ตรวจสอบ OTP ไม่สำเร็จ")
	}
	if time.Now().After(exp) {
		return fmt.Errorf("รหัส OTP หมดอายุแล้ว")
	}
	if bcrypt.CompareHashAndPassword([]byte(hash), []byte(strings.TrimSpace(code))) != nil {
		return fmt.Errorf("รหัส OTP ไม่ถูกต้อง")
	}
	return nil
}

func (s *Server) consumeEmailOTP(email, code string) error {
	if err := s.matchEmailOTP(email, code); err != nil {
		return err
	}
	_, _ = s.store.db.Exec(`DELETE FROM email_otps WHERE email=?`, email)
	return nil
}

func (s *Server) handleEmailOTP(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Email string `json:"email"`
	}
	if err := readJSON(r, &body); err != nil {
		writeJSON(w, 400, map[string]string{"error": "ข้อมูลไม่ถูกต้อง"})
		return
	}
	email, err := normalizeEmail(body.Email)
	if err != nil {
		writeJSON(w, 400, map[string]string{"error": err.Error()})
		return
	}
	if _, err := s.store.getUserByEmail(email); err == nil {
		writeJSON(w, 409, map[string]string{"error": "อีเมลนี้มีบัญชีอยู่แล้ว กรุณาเข้าสู่ระบบ"})
		return
	}
	if err := s.assertOTPCooldown("email_otps", "email", email); err != nil {
		writeJSON(w, 429, map[string]string{"error": err.Error()})
		return
	}
	code, err := s.issueEmailOTP(email)
	if err != nil {
		writeJSON(w, 500, map[string]string{"error": "สร้างรหัส OTP ไม่สำเร็จ"})
		return
	}
	if err := sendOTPEmail(email, code); err != nil {
		_, _ = s.store.db.Exec(`DELETE FROM email_otps WHERE email=?`, email)
		writeJSON(w, 502, map[string]string{"error": err.Error()})
		return
	}
	out := map[string]any{"ok": true, "email": email, "message": "ส่งรหัส OTP ไปยังอีเมลแล้ว หมดอายุใน 5 นาที"}
	if otpDebug() {
		out["otp"] = code
	}
	writeJSON(w, 200, out)
}

func (s *Server) handlePhoneOTP(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Phone string `json:"phone"`
	}
	if err := readJSON(r, &body); err != nil {
		writeJSON(w, 400, map[string]string{"error": "ข้อมูลไม่ถูกต้อง"})
		return
	}
	phone, err := normalizePhone(body.Phone)
	if err != nil {
		writeJSON(w, 400, map[string]string{"error": err.Error()})
		return
	}
	if err := s.assertOTPCooldown("phone_otps", "phone", phone); err != nil {
		writeJSON(w, 429, map[string]string{"error": err.Error()})
		return
	}
	code, err := s.issuePhoneOTP(phone)
	if err != nil {
		writeJSON(w, 500, map[string]string{"error": "สร้างรหัส OTP ไม่สำเร็จ"})
		return
	}
	if err := sendOTPSMS(phone, code); err != nil {
		_, _ = s.store.db.Exec(`DELETE FROM phone_otps WHERE phone=?`, phone)
		writeJSON(w, 502, map[string]string{"error": err.Error()})
		return
	}
	out := map[string]any{"ok": true, "phone": phone, "message": "ส่งรหัส OTP ไปยังเบอร์โทรแล้ว หมดอายุใน 5 นาที"}
	if otpDebug() {
		out["otp"] = code
	}
	writeJSON(w, 200, out)
}

func writeOTPError(w http.ResponseWriter, err error) {
	status := 400
	if strings.Contains(err.Error(), "ไม่ถูกต้อง") {
		status = 401
	}
	writeJSON(w, status, map[string]string{"error": err.Error()})
}

func (s *Server) handlePhoneOTPCheck(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Phone string `json:"phone"`
		Code  string `json:"code"`
	}
	if err := readJSON(r, &body); err != nil {
		writeJSON(w, 400, map[string]string{"error": "ข้อมูลไม่ถูกต้อง"})
		return
	}
	phone, err := normalizePhone(body.Phone)
	if err != nil {
		writeJSON(w, 400, map[string]string{"error": err.Error()})
		return
	}
	if err := s.matchPhoneOTP(phone, body.Code); err != nil {
		writeOTPError(w, err)
		return
	}
	writeJSON(w, 200, map[string]any{"ok": true, "phone": phone})
}

func (s *Server) handleEmailOTPCheck(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Email string `json:"email"`
		Code  string `json:"code"`
	}
	if err := readJSON(r, &body); err != nil {
		writeJSON(w, 400, map[string]string{"error": "ข้อมูลไม่ถูกต้อง"})
		return
	}
	email, err := normalizeEmail(body.Email)
	if err != nil {
		writeJSON(w, 400, map[string]string{"error": err.Error()})
		return
	}
	if err := s.matchEmailOTP(email, body.Code); err != nil {
		writeOTPError(w, err)
		return
	}
	writeJSON(w, 200, map[string]any{"ok": true, "email": email})
}

func (s *Server) handlePhoneVerify(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Phone    string `json:"phone"`
		Code     string `json:"code"`
		Password string `json:"password"`
	}
	if err := readJSON(r, &body); err != nil {
		writeJSON(w, 400, map[string]string{"error": "ข้อมูลไม่ถูกต้อง"})
		return
	}
	phone, err := normalizePhone(body.Phone)
	if err != nil {
		writeJSON(w, 400, map[string]string{"error": err.Error()})
		return
	}
	existing, existingErr := s.store.getUserByPhone(phone)
	if existingErr != nil {
		if err := validateStrongPassword(body.Password); err != nil {
			writeJSON(w, 400, map[string]string{"error": err.Error()})
			return
		}
	}
	if err := s.consumePhoneOTP(phone, body.Code); err != nil {
		status := 400
		if strings.Contains(err.Error(), "ไม่ถูกต้อง") {
			status = 401
		}
		writeJSON(w, status, map[string]string{"error": err.Error()})
		return
	}

	if existingErr == nil {
		s.finishAuth(w, existing, 200)
		return
	}
	hash, _ := bcrypt.GenerateFromPassword([]byte(body.Password), bcrypt.DefaultCost)
	sid := newID("P")
	if len(sid) > 16 {
		sid = sid[:16]
	}
	email := fmt.Sprintf("%s@phone.ecobin.local", phone)
	u, err := s.insertMember("", sid, email, phone, "phone", "", "", string(hash))
	if err != nil {
		writeJSON(w, 409, map[string]string{"error": "เบอร์นี้มีอยู่ในระบบแล้ว"})
		return
	}
	s.finishAuth(w, u, 201)
}
