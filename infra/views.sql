USE ecobin;

-- มุมมองสำหรับหาข้อมูลข้ามตารางแบบ 1:M (INNER/LEFT JOIN ผ่าน FK)

CREATE OR REPLACE VIEW v_user_waste_1m AS
SELECT
  u.user_id,
  u.full_name,
  u.student_id,
  u.user_role,
  w.record_id,
  w.plastic_type,
  w.bottle_count,
  w.verification_status,
  w.points_awarded,
  w.bin_location,
  DATE_FORMAT(w.upload_timestamp, '%Y-%m-%d %H:%i:%s') AS upload_timestamp
FROM users u
LEFT JOIN waste_records w ON w.user_id = u.user_id AND w.delete_at IS NULL
WHERE u.delete_at IS NULL;

CREATE OR REPLACE VIEW v_user_points_1m AS
SELECT
  u.user_id,
  u.full_name,
  t.transaction_id,
  t.transaction_type,
  t.points_earned,
  t.description,
  DATE_FORMAT(t.transaction_date, '%Y-%m-%d %H:%i:%s') AS transaction_date
FROM users u
LEFT JOIN point_transactions t ON t.user_id = u.user_id AND t.delete_at IS NULL
WHERE u.delete_at IS NULL;

CREATE OR REPLACE VIEW v_user_redemptions_1m AS
SELECT
  u.user_id,
  u.full_name,
  r.redeem_id,
  rw.reward_name,
  r.points_used,
  r.pickup_code,
  r.redeem_status,
  DATE_FORMAT(r.redeem_date, '%Y-%m-%d %H:%i:%s') AS redeem_date
FROM users u
LEFT JOIN redemptions r ON r.user_id = u.user_id AND r.delete_at IS NULL
LEFT JOIN rewards rw ON rw.reward_id = r.reward_id AND rw.delete_at IS NULL
WHERE u.delete_at IS NULL;

CREATE OR REPLACE VIEW v_reward_redemptions_1m AS
SELECT
  rw.reward_id,
  rw.reward_name,
  rw.points_required,
  r.redeem_id,
  u.full_name AS member_name,
  r.points_used,
  r.pickup_code
FROM rewards rw
LEFT JOIN redemptions r ON r.reward_id = rw.reward_id AND r.delete_at IS NULL
LEFT JOIN users u ON u.user_id = r.user_id AND u.delete_at IS NULL
WHERE rw.delete_at IS NULL;

CREATE OR REPLACE VIEW v_bin_waste_1m AS
SELECT
  b.bin_id,
  b.bin_name,
  w.record_id,
  u.full_name,
  w.bottle_count,
  w.verification_status
FROM smart_bins b
LEFT JOIN waste_records w ON w.bin_id = b.bin_id AND w.delete_at IS NULL
LEFT JOIN users u ON u.user_id = w.user_id AND u.delete_at IS NULL
WHERE b.delete_at IS NULL;

CREATE OR REPLACE VIEW v_user_child_counts AS
SELECT
  u.user_id,
  u.full_name,
  u.student_id,
  u.user_role,
  u.total_points,
  (SELECT COUNT(*) FROM waste_records w WHERE w.user_id = u.user_id AND w.delete_at IS NULL) AS waste_count,
  (SELECT COUNT(*) FROM point_transactions t WHERE t.user_id = u.user_id AND t.delete_at IS NULL) AS txn_count,
  (SELECT COUNT(*) FROM redemptions r WHERE r.user_id = u.user_id AND r.delete_at IS NULL) AS redeem_count
FROM users u
WHERE u.delete_at IS NULL;
