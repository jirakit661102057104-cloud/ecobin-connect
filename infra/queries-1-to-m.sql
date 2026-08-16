-- ตัวอย่างการหาข้อมูลข้ามตารางแบบ 1:M สำหรับเอกสารวิจัย EcoBin Connect
USE ecobin;

-- 1) users 1:M waste_records — ผู้ใช้คนหนึ่งมีหลายรายการทิ้งขยะ
SELECT u.full_name, u.student_id, w.record_id, w.plastic_type, w.bottle_count, w.verification_status
FROM users u
INNER JOIN waste_records w ON u.user_id = w.user_id AND w.delete_at IS NULL
WHERE u.delete_at IS NULL
ORDER BY u.user_id, w.upload_timestamp DESC;

-- 2) นับด้าน M ต่อหนึ่งผู้ใช้ (GROUP BY)
SELECT u.full_name, COUNT(w.record_id) AS จำนวนรายการขยะ
FROM users u
LEFT JOIN waste_records w ON u.user_id = w.user_id AND w.delete_at IS NULL
WHERE u.delete_at IS NULL
GROUP BY u.user_id, u.full_name;

-- 3) users 1:M point_transactions
SELECT u.full_name, t.transaction_type, t.points_earned, t.description
FROM users u
INNER JOIN point_transactions t ON u.user_id = t.user_id AND t.delete_at IS NULL
WHERE u.delete_at IS NULL
ORDER BY t.transaction_date DESC;

-- 4) rewards 1:M redemptions — ของรางวัลหนึ่งชิ้นถูกแลกได้หลายครั้ง
SELECT rw.reward_name, u.full_name, r.pickup_code, r.points_used
FROM rewards rw
INNER JOIN redemptions r ON rw.reward_id = r.reward_id AND r.delete_at IS NULL
INNER JOIN users u ON u.user_id = r.user_id AND u.delete_at IS NULL
WHERE rw.delete_at IS NULL;

-- 5) smart_bins 1:M waste_records
SELECT b.bin_name, COUNT(w.record_id) AS จำนวนครั้งที่ทิ้ง
FROM smart_bins b
LEFT JOIN waste_records w ON b.bin_id = w.bin_id AND w.delete_at IS NULL
WHERE b.delete_at IS NULL
GROUP BY b.bin_id, b.bin_name;

-- 6) ดึงลูกทั้งหมดของสมาชิกคนเดียว (ระบุ PK ด้าน 1)
SELECT * FROM v_user_waste_1m WHERE user_id = 'USR001';
SELECT * FROM v_user_points_1m WHERE user_id = 'USR001';
SELECT * FROM v_user_redemptions_1m WHERE user_id = 'USR001';
