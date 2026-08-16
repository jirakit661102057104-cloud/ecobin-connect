USE ecobin;

INSERT INTO plastic_types (plastic_code, short_name, full_name, display_name_th, carbon_factor, recycling_tips, created_by) VALUES
  (1, 'PET / PETE', 'Polyethylene Terephthalate', 'PET (เบอร์ 1 - ขวดน้ำใส)', 0.080, 'เทน้ำออก ล้างสะอาด บีบขวดให้แบน แยกฝา', 'SYSTEM'),
  (2, 'HDPE', 'High-Density Polyethylene', 'HDPE (เบอร์ 2 - ขวดนม/ขวดขาวขุ่น)', 0.080, 'ล้างคราบนมหรือสารเคมี ตากแห้งก่อนทิ้ง', 'SYSTEM'),
  (3, 'PVC', 'Polyvinyl Chloride', 'PVC (เบอร์ 3)', 0.050, 'แยกเข้าโรงงานรีไซเคิลเฉพาะทาง', 'SYSTEM'),
  (4, 'LDPE', 'Low-Density Polyethylene', 'LDPE (เบอร์ 4 - ถุงหิ้ว)', 0.040, 'รวบรวมถุงที่แห้งสะอาด', 'SYSTEM'),
  (5, 'PP', 'Polypropylene', 'PP (เบอร์ 5)', 0.060, 'ล้างคราบอาหารก่อนรีไซเคิล', 'SYSTEM'),
  (6, 'PS', 'Polystyrene', 'PS (เบอร์ 6 - โฟม)', 0.030, 'ลดการใช้ หากทิ้งให้เช็ดคราบอาหาร', 'SYSTEM'),
  (7, 'OTHER', 'Other Plastics', 'พลาสติกอื่นๆ (เบอร์ 7)', 0.020, 'ส่งโครงการขยะกำพร้าหรือ RDF', 'SYSTEM')
ON DUPLICATE KEY UPDATE
  short_name = VALUES(short_name),
  display_name_th = VALUES(display_name_th),
  carbon_factor = VALUES(carbon_factor);

INSERT INTO smart_bins (bin_id, bin_name, status, capacity_note, created_by) VALUES
  ('BIN-01', 'จุดคัดแยกหน้าอาคาร 1 คณะวิทยาศาสตร์และเทคโนโลยี', 'พร้อมใช้งาน', '45%', 'SYSTEM'),
  ('BIN-02', 'จุดคัดแยกโรงอาหารกลาง มหาวิทยาลัยราชภัฏเพชรบูรณ์', 'พร้อมใช้งาน', '78%', 'SYSTEM'),
  ('BIN-03', 'จุดคัดแยกหน้าอาคาร IT และวิทยาการคอมพิวเตอร์', 'พร้อมใช้งาน', '30%', 'SYSTEM'),
  ('BIN-04', 'จุดคัดแยกหอสมุดกลาง (อาคารบรรณราชนครินทร์)', 'พร้อมใช้งาน', '62%', 'SYSTEM'),
  ('BIN-05', 'จุดคัดแยกหน้าอาคารคณะวิทยาการจัดการ', 'พร้อมใช้งาน', '20%', 'SYSTEM'),
  ('BIN-06', 'จุดคัดแยกศูนย์กีฬาและลานกิจกรรมนักศึกษา', 'พร้อมใช้งาน', '50%', 'SYSTEM')
ON DUPLICATE KEY UPDATE
  bin_name = VALUES(bin_name),
  status = VALUES(status);
