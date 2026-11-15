USE ecobin;

INSERT INTO plastic_types (plastic_code, short_name, full_name, display_name_th, carbon_factor, recycling_tips, created_by) VALUES
  (1, 'PET / PETE', 'Polyethylene Terephthalate', 'PET (เบอร์ 1 - ขวดน้ำใส)', 0.080, 'เทน้ำออก ล้างสะอาด บีบขวดให้แบน แยกฝา', 'SYSTEM'),
  (2, 'HDPE', 'High-Density Polyethylene', 'HDPE (เบอร์ 2 - ขวดนม/ขวดขาวขุ่น)', 0.080, 'ล้างคราบนมหรือสารเคมี ตากแห้งก่อนทิ้ง', 'SYSTEM'),
  (3, 'PVC', 'Polyvinyl Chloride', 'PVC (เบอร์ 3)', 0.050, 'แยกเข้าโรงงานรีไซเคิลเฉพาะทาง', 'SYSTEM'),
  (4, 'LDPE', 'Low-Density Polyethylene', 'LDPE (เบอร์ 4 - ถุงหิ้ว)', 0.040, 'รวบรวมถุงที่แห้งสะอาด', 'SYSTEM'),
  (5, 'PP', 'Polypropylene', 'PP (เบอร์ 5)', 0.060, 'ล้างคราบอาหารก่อนรีไซเคิล', 'SYSTEM'),
  (6, 'PS', 'Polystyrene', 'PS (เบอร์ 6 - โฟม)', 0.030, 'ลดการใช้ หากทิ้งให้เช็ดคราบอาหาร', 'SYSTEM'),
  (7, 'OTHER', 'Other Plastics', 'พลาสติกอื่นๆ (เบอร์ 7)', 0.020, 'ส่งโครงการขยะกำพร้าหรือ RDF', 'SYSTEM'),
  (8, 'CAN', 'Aluminium Beverage Can', 'กระป๋องอะลูมิเนียม', 0.082, 'เทของเหลวออก ล้างและบีบกระป๋องก่อนนำไปรีไซเคิล', 'SYSTEM')
ON DUPLICATE KEY UPDATE
  short_name = VALUES(short_name),
  display_name_th = VALUES(display_name_th),
  carbon_factor = VALUES(carbon_factor);

INSERT INTO smart_bins (bin_id, bin_name, status, capacity_note, created_by) VALUES
  ('BIN-01', 'ตึกคณะวิทยาศาสตร์และเทคโนโลยี ชั้น 1 หน้าห้องสำนักงาน', 'พร้อมใช้งาน', '', 'SYSTEM'),
  ('BIN-02', 'ตึกคณะวิทยาศาสตร์และเทคโนโลยี ชั้น 2 หน้าห้องสโมสรนักศึกษา', 'พร้อมใช้งาน', '', 'SYSTEM'),
  ('BIN-03', 'ตึกคณะวิทยาศาสตร์และเทคโนโลยี ชั้น 7 หน้าห้องสาขาสิ่งแวดล้อม', 'พร้อมใช้งาน', '', 'SYSTEM')
ON DUPLICATE KEY UPDATE
  bin_name = VALUES(bin_name),
  status = VALUES(status);
