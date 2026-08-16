package main

import (
	"database/sql"
	"log"
	"os"

	"golang.org/x/crypto/bcrypt"
)

func seedIfEmpty(db *sql.DB) {
	var n int
	if err := db.QueryRow("SELECT COUNT(*) FROM users WHERE delete_at IS NULL").Scan(&n); err != nil {
		log.Printf("seed check failed: %v", err)
		return
	}
	if n > 0 {
		return
	}

	if isProd() && !envTrue("SEED_DEMO", false) {
		seedProduction(db)
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte("ecobin123"), bcrypt.DefaultCost)
	if err != nil {
		log.Fatal(err)
	}
	pass := string(hash)

	users := [][]any{
		{"USR001", "ศุภณัฐ ปลื้มบุญ", "661102057106", "st661102057106@gmail.com", pass, "Member", 180, 1.44, "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80", "สาขาวิชาเทคโนโลยีสารสนเทศ"},
		{"USR002", "จิรกิตติ์ ตันตระกูล", "661102057104", "st661102057104@gmail.com", pass, "Admin", 450, 3.60, "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80", "คณะวิทยาศาสตร์และเทคโนโลยี (ผู้ดูแลระบบ)"},
		{"USR003", "กิตติศักดิ์ พงษ์ศิริ", "661102057112", "st661102057112@gmail.com", pass, "Member", 90, 0.72, "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80", "สาขาวิชาวิทยาการคอมพิวเตอร์"},
		{"USR004", "นภาพร รักษาสิ่งแวดล้อม", "661102057120", "st661102057120@gmail.com", pass, "Member", 240, 1.92, "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80", "สาขาวิชาเทคโนโลยีสารสนเทศ"},
	}
	for _, u := range users {
		_, err := db.Exec(`INSERT INTO users (user_id, full_name, student_id, email, password_hash, user_role, total_points, total_carbon_saved, avatar_url, department, created_by)
			VALUES (?,?,?,?,?,?,?,?,?,?,?)`, append(u, actorSystem)...)
		if err != nil {
			log.Fatal(err)
		}
	}

	rewards := [][]any{
		{"REW001", "แก้วน้ำเก็บความเย็น Eco PCRU (500 ml)", 150, "แก้วสแตนเลสรักษ์โลก สกรีนโลโก้มหาวิทยาลัยราชภัฏเพชรบูรณ์ ลดการใช้แก้วพลาสติกแบบใช้ครั้งเดียวทิ้ง", 25, "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=500&auto=format&fit=crop&q=80", "ของใช้รักษ์โลก"},
		{"REW002", "ถุงผ้าแคนวาส Green University", 80, "ถุงผ้าฝ้ายธรรมชาติ ทนทาน จุของได้เยอะ ทดแทนถุงพลาสติกหูหิ้วตามหลัก 3Rs", 40, "https://images.unsplash.com/photo-1597484661643-2f5fef640dd1?w=500&auto=format&fit=crop&q=80", "ของใช้รักษ์โลก"},
		{"REW003", "คูปองส่วนลดเครื่องดื่ม 20 บาท ร้านกาแฟ มรภ.พช.", 50, "ใช้เป็นส่วนลดเครื่องดื่มที่โรงอาหารกลางหรือร้านกาแฟคณะวิทยาศาสตร์และเทคโนโลยี", 99, "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=500&auto=format&fit=crop&q=80", "เครื่องดื่มและอาหาร"},
		{"REW004", "สมุดบันทึกกระดาษรีไซเคิล Eco Note A5", 60, "สมุดโน้ตปกคราฟท์ ผลิตจากเยื่อกระดาษรีไซเคิล 100% เขียนลื่น ถนอมสายตา", 35, "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=80", "อุปกรณ์การเรียน"},
		{"REW005", "ชุดหลอดดูดน้ำสแตนเลสพร้อมแปรงทำความสะอาด", 40, "ชุดหลอดสแตนเลส Food Grade พกพาสะดวก พร้อมซองผ้าและแปรงล้าง", 50, "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500&auto=format&fit=crop&q=80", "ของใช้รักษ์โลก"},
		{"REW006", "บัตรกำนัลศูนย์หนังสือมหาวิทยาลัย 50 บาท", 100, "ใช้ซื้อเครื่องเขียน หนังสือเรียน หรืออุปกรณ์การศึกษา ณ ศูนย์หนังสือ มรภ.พช.", 20, "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=500&auto=format&fit=crop&q=80", "อุปกรณ์การเรียน"},
	}
	for _, r := range rewards {
		if _, err := db.Exec(`INSERT INTO rewards (reward_id, reward_name, points_required, reward_description, reward_stock, reward_image, category, created_by)
			VALUES (?,?,?,?,?,?,?,?)`, append(r, actorSystem)...); err != nil {
			log.Fatal(err)
		}
	}

	wastes := [][]any{
		{"REC20260801", "USR001", "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500&auto=format&fit=crop&q=80", "PET (เบอร์ 1 - ขวดน้ำใส)", 3, "2026-08-14 09:30:15", "อนุมัติแล้ว", 0.24, 30, "ตรวจสอบแล้ว ขยะขวดน้ำดื่ม PET ใสสะอาด แยกฝาถูกต้อง", "จุดคัดแยกหน้าอาคารคณะวิทยาศาสตร์ฯ"},
		{"REC20260802", "USR001", "https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=500&auto=format&fit=crop&q=80", "HDPE (เบอร์ 2 - ขวดนม/ขวดขาวขุ่น)", 2, "2026-08-14 13:15:40", "อนุมัติแล้ว", 0.16, 20, "ขวดนม HDPE ผ่านการล้างและเทน้ำออกเรียบร้อย", "โรงอาหารกลาง มหาวิทยาลัยราชภัฏเพชรบูรณ์"},
		{"REC20260803", "USR003", "https://images.unsplash.com/photo-1528190336454-13cd56b45b5a?w=500&auto=format&fit=crop&q=80", "PET (เบอร์ 1 - ขวดน้ำใส)", 5, "2026-08-14 15:20:00", "อนุมัติแล้ว", 0.40, 50, "ขวดน้ำอัดลมและน้ำดื่ม PET ครบ 5 ขวด", "อาคารเทคโนโลยีสารสนเทศ IT"},
		{"REC20260804", "USR004", "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=500&auto=format&fit=crop&q=80", "PET (เบอร์ 1 - ขวดน้ำใส)", 4, "2026-08-14 16:45:10", "รอการตรวจสอบ", 0.00, 0, "อยู่ระหว่างการตรวจสอบภาพจากระบบ — ยังไม่ได้รับแต้ม", "อาคารบรรณราชนครินทร์ (หอสมุดกลาง)"},
		{"REC20260805", "USR001", "https://images.unsplash.com/photo-1577705998148-6da4f3963bc8?w=500&auto=format&fit=crop&q=80", "พลาสติกอื่นๆ / ไม่ตรงประเภท", 1, "2026-08-13 11:10:00", "ไม่อนุมัติ", 0.00, 0, "ภาพถ่ายไม่ตรงกับขวดพลาสติกรีไซเคิล (พบถุงพลาสติกปะปน)", "ลานกิจกรรมนักศึกษา"},
	}
	for _, w := range wastes {
		if _, err := db.Exec(`INSERT INTO waste_records (record_id, user_id, image_url, plastic_type, bottle_count, upload_timestamp, verification_status, carbon_saved, points_awarded, admin_comment, bin_location, created_by)
			VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`, append(w, actorSystem)...); err != nil {
			log.Fatal(err)
		}
	}

	txns := [][]any{
		{"TXN1001", "USR001", "REC20260801", 30, "earn", "คัดแยกขวดน้ำดื่ม PET 3 ขวด (จุดคัดแยกหน้าอาคารคณะวิทยาศาสตร์ฯ)", "2026-08-14 09:35:00"},
		{"TXN1002", "USR001", "REC20260802", 20, "earn", "คัดแยกขวดนม HDPE 2 ขวด (โรงอาหารกลาง)", "2026-08-14 13:20:00"},
		{"TXN1003", "USR001", nil, -50, "redeem", "แลกคูปองส่วนลดเครื่องดื่ม 20 บาท ร้านกาแฟ มรภ.พช.", "2026-08-14 14:00:00"},
		{"TXN1004", "USR001", nil, 50, "bonus", "โบนัสต้อนรับสมาชิกใหม่ โครงการ Green University มรภ.พช.", "2026-08-13 08:00:00"},
	}
	for _, t := range txns {
		if _, err := db.Exec(`INSERT INTO point_transactions (transaction_id, user_id, record_id, points_earned, transaction_type, description, transaction_date, created_by)
			VALUES (?,?,?,?,?,?,?,?)`, append(t, actorSystem)...); err != nil {
			log.Fatal(err)
		}
	}

	if _, err := db.Exec(`INSERT INTO redemptions (redeem_id, user_id, reward_id, points_used, redeem_date, redeem_status, pickup_code, created_by)
		VALUES ('RDM9001','USR001','REW003',50,'2026-08-14 14:00:22','สำเร็จ','PCRU-ECO-7749',?)`, actorSystem); err != nil {
		log.Fatal(err)
	}

	log.Println("seeded demo data (password for all users: ecobin123)")
}

func seedRewards(db *sql.DB) {
	var n int
	_ = db.QueryRow("SELECT COUNT(*) FROM rewards WHERE delete_at IS NULL").Scan(&n)
	if n > 0 {
		return
	}
	rewards := [][]any{
		{"REW001", "แก้วน้ำเก็บความเย็น Eco PCRU (500 ml)", 150, "แก้วสแตนเลสรักษ์โลก สกรีนโลโก้มหาวิทยาลัยราชภัฏเพชรบูรณ์ ลดการใช้แก้วพลาสติกแบบใช้ครั้งเดียวทิ้ง", 25, "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=500&auto=format&fit=crop&q=80", "ของใช้รักษ์โลก"},
		{"REW002", "ถุงผ้าแคนวาส Green University", 80, "ถุงผ้าฝ้ายธรรมชาติ ทนทาน จุของได้เยอะ ทดแทนถุงพลาสติกหูหิ้วตามหลัก 3Rs", 40, "https://images.unsplash.com/photo-1597484661643-2f5fef640dd1?w=500&auto=format&fit=crop&q=80", "ของใช้รักษ์โลก"},
		{"REW003", "คูปองส่วนลดเครื่องดื่ม 20 บาท ร้านกาแฟ มรภ.พช.", 50, "ใช้เป็นส่วนลดเครื่องดื่มที่โรงอาหารกลางหรือร้านกาแฟคณะวิทยาศาสตร์และเทคโนโลยี", 100, "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=500&auto=format&fit=crop&q=80", "เครื่องดื่มและอาหาร"},
		{"REW004", "สมุดบันทึกกระดาษรีไซเคิล Eco Note A5", 60, "สมุดโน้ตปกคราฟท์ ผลิตจากเยื่อกระดาษรีไซเคิล 100% เขียนลื่น ถนอมสายตา", 35, "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=80", "อุปกรณ์การเรียน"},
		{"REW005", "ชุดหลอดดูดน้ำสแตนเลสพร้อมแปรงทำความสะอาด", 40, "ชุดหลอดสแตนเลส Food Grade พกพาสะดวก พร้อมซองผ้าและแปรงล้าง", 50, "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500&auto=format&fit=crop&q=80", "ของใช้รักษ์โลก"},
		{"REW006", "บัตรกำนัลศูนย์หนังสือมหาวิทยาลัย 50 บาท", 100, "ใช้ซื้อเครื่องเขียน หนังสือเรียน หรืออุปกรณ์การศึกษา ณ ศูนย์หนังสือ มรภ.พช.", 20, "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=500&auto=format&fit=crop&q=80", "อุปกรณ์การเรียน"},
	}
	for _, r := range rewards {
		if _, err := db.Exec(`INSERT INTO rewards (reward_id, reward_name, points_required, reward_description, reward_stock, reward_image, category, created_by)
			VALUES (?,?,?,?,?,?,?,?)`, append(r, actorSystem)...); err != nil {
			log.Fatal(err)
		}
	}
}

func seedProduction(db *sql.DB) {
	email := os.Getenv("ADMIN_EMAIL")
	pass := os.Getenv("ADMIN_PASSWORD")
	name := os.Getenv("ADMIN_FULL_NAME")
	studentID := os.Getenv("ADMIN_STUDENT_ID")
	if email == "" || pass == "" {
		log.Fatal("production first run requires ADMIN_EMAIL and ADMIN_PASSWORD in backend.env")
	}
	if name == "" {
		name = "ผู้ดูแลระบบ EcoBin"
	}
	if studentID == "" {
		studentID = "ADMIN001"
	}
	if len(pass) < 8 {
		log.Fatal("ADMIN_PASSWORD must be at least 8 characters")
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(pass), bcrypt.DefaultCost)
	if err != nil {
		log.Fatal(err)
	}
	_, err = db.Exec(`INSERT INTO users (user_id, full_name, student_id, email, password_hash, user_role, total_points, total_carbon_saved, avatar_url, department, created_by)
		VALUES ('USRADMIN',?,?,?,?,'Admin',0,0,'','คณะวิทยาศาสตร์และเทคโนโลยี (ผู้ดูแลระบบ)',?)`,
		name, studentID, email, string(hash), actorSystem)
	if err != nil {
		log.Fatal(err)
	}
	seedRewards(db)
	log.Printf("seeded production admin %s — students register themselves", email)
}
