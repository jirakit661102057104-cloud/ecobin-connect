import { User, WasteRecord, PointTransaction, Reward, RedemptionSimulation, PlasticInfo } from '../types';

export const INITIAL_USERS: User[] = [
  {
    user_id: 'USR001',
    full_name: 'ศุภณัฐ ปลื้มบุญ',
    student_id: '661102057106',
    email: 'st661102057106@gmail.com',
    user_role: 'Member',
    total_points: 180,
    total_carbon_saved: 1.44,
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    department: 'สาขาวิชาเทคโนโลยีสารสนเทศ'
  },
  {
    user_id: 'USR002',
    full_name: 'จิรกิตติ์ ตันตระกูล',
    student_id: '661102057104',
    email: 'st661102057104@gmail.com',
    user_role: 'Admin',
    total_points: 450,
    total_carbon_saved: 3.60,
    avatar_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    department: 'คณะวิทยาศาสตร์และเทคโนโลยี (ผู้ดูแลระบบ)'
  },
  {
    user_id: 'USR003',
    full_name: 'กิตติศักดิ์ พงษ์ศิริ',
    student_id: '661102057112',
    email: 'st661102057112@gmail.com',
    user_role: 'Member',
    total_points: 90,
    total_carbon_saved: 0.72,
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    department: 'สาขาวิชาวิทยาการคอมพิวเตอร์'
  },
  {
    user_id: 'USR004',
    full_name: 'นภาพร รักษาสิ่งแวดล้อม',
    student_id: '661102057120',
    email: 'st661102057120@gmail.com',
    user_role: 'Member',
    total_points: 240,
    total_carbon_saved: 1.92,
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    department: 'สาขาวิชาเทคโนโลยีสารสนเทศ'
  }
];

export const INITIAL_REWARDS: Reward[] = [
  {
    reward_id: 'REW001',
    reward_name: 'แก้วน้ำเก็บความเย็น Eco PCRU (500 ml)',
    points_required: 150,
    reward_description: 'แก้วสแตนเลสรักษ์โลก สกรีนโลโก้มหาวิทยาลัยราชภัฏเพชรบูรณ์ ลดการใช้แก้วพลาสติกแบบใช้ครั้งเดียวทิ้ง',
    reward_stock: 25,
    reward_image: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=500&auto=format&fit=crop&q=80',
    category: 'ของใช้รักษ์โลก'
  },
  {
    reward_id: 'REW002',
    reward_name: 'ถุงผ้าแคนวาส Green University',
    points_required: 80,
    reward_description: 'ถุงผ้าฝ้ายธรรมชาติ ทนทาน จุของได้เยอะ ทดแทนถุงพลาสติกหูหิ้วตามหลัก 3Rs',
    reward_stock: 40,
    reward_image: 'https://images.unsplash.com/photo-1597484661643-2f5fef640dd1?w=500&auto=format&fit=crop&q=80',
    category: 'ของใช้รักษ์โลก'
  },
  {
    reward_id: 'REW003',
    reward_name: 'คูปองส่วนลดเครื่องดื่ม 20 บาท ร้านกาแฟ มรภ.พช.',
    points_required: 50,
    reward_description: 'ใช้เป็นส่วนลดเครื่องดื่มที่โรงอาหารกลางหรือร้านกาแฟคณะวิทยาศาสตร์และเทคโนโลยี',
    reward_stock: 100,
    reward_image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=500&auto=format&fit=crop&q=80',
    category: 'เครื่องดื่มและอาหาร'
  },
  {
    reward_id: 'REW004',
    reward_name: 'สมุดบันทึกกระดาษรีไซเคิล Eco Note A5',
    points_required: 60,
    reward_description: 'สมุดโน้ตปกคราฟท์ ผลิตจากเยื่อกระดาษรีไซเคิล 100% เขียนลื่น ถนอมสายตา',
    reward_stock: 35,
    reward_image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=80',
    category: 'อุปกรณ์การเรียน'
  },
  {
    reward_id: 'REW005',
    reward_name: 'ชุดหลอดดูดน้ำสแตนเลสพร้อมแปรงทำความสะอาด',
    points_required: 40,
    reward_description: 'ชุดหลอดสแตนเลส Food Grade พกพาสะดวก พร้อมซองผ้าและแปรงล้าง',
    reward_stock: 50,
    reward_image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500&auto=format&fit=crop&q=80',
    category: 'ของใช้รักษ์โลก'
  },
  {
    reward_id: 'REW006',
    reward_name: 'บัตรกำนัลศูนย์หนังสือมหาวิทยาลัย 50 บาท',
    points_required: 100,
    reward_description: 'ใช้ซื้อเครื่องเขียน หนังสือเรียน หรืออุปกรณ์การศึกษา ณ ศูนย์หนังสือ มรภ.พช.',
    reward_stock: 20,
    reward_image: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=500&auto=format&fit=crop&q=80',
    category: 'อุปกรณ์การเรียน'
  }
];

export const INITIAL_WASTE_RECORDS: WasteRecord[] = [
  {
    record_id: 'REC20260801',
    user_id: 'USR001',
    user_name: 'ศุภณัฐ ปลื้มบุญ',
    student_id: '661102057106',
    image_url: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500&auto=format&fit=crop&q=80',
    plastic_type: 'PET (เบอร์ 1 - ขวดน้ำใส)',
    bottle_count: 3,
    upload_timestamp: '2026-08-14 09:30:15',
    verification_status: 'อนุมัติแล้ว',
    carbon_saved: 0.24,
    points_awarded: 30,
    admin_comment: 'ตรวจสอบแล้ว ขยะขวดน้ำดื่ม PET ใสสะอาด แยกฝาถูกต้อง',
    bin_location: 'จุดคัดแยกหน้าอาคารคณะวิทยาศาสตร์ฯ'
  },
  {
    record_id: 'REC20260802',
    user_id: 'USR001',
    user_name: 'ศุภณัฐ ปลื้มบุญ',
    student_id: '661102057106',
    image_url: 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=500&auto=format&fit=crop&q=80',
    plastic_type: 'HDPE (เบอร์ 2 - ขวดนม/ขวดขาวขุ่น)',
    bottle_count: 2,
    upload_timestamp: '2026-08-14 13:15:40',
    verification_status: 'อนุมัติแล้ว',
    carbon_saved: 0.16,
    points_awarded: 20,
    admin_comment: 'ขวดนม HDPE ผ่านการล้างและเทน้ำออกเรียบร้อย',
    bin_location: 'โรงอาหารกลาง มหาวิทยาลัยราชภัฏเพชรบูรณ์'
  },
  {
    record_id: 'REC20260803',
    user_id: 'USR003',
    user_name: 'กิตติศักดิ์ พงษ์ศิริ',
    student_id: '661102057112',
    image_url: 'https://images.unsplash.com/photo-1528190336454-13cd56b45b5a?w=500&auto=format&fit=crop&q=80',
    plastic_type: 'PET (เบอร์ 1 - ขวดน้ำใส)',
    bottle_count: 5,
    upload_timestamp: '2026-08-14 15:20:00',
    verification_status: 'อนุมัติแล้ว',
    carbon_saved: 0.40,
    points_awarded: 50,
    admin_comment: 'ขวดน้ำอัดลมและน้ำดื่ม PET ครบ 5 ขวด',
    bin_location: 'อาคารเทคโนโลยีสารสนเทศ IT'
  },
  {
    record_id: 'REC20260804',
    user_id: 'USR004',
    user_name: 'นภาพร รักษาสิ่งแวดล้อม',
    student_id: '661102057120',
    image_url: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=500&auto=format&fit=crop&q=80',
    plastic_type: 'PET (เบอร์ 1 - ขวดน้ำใส)',
    bottle_count: 4,
    upload_timestamp: '2026-08-14 16:45:10',
    verification_status: 'รอการตรวจสอบ',
    carbon_saved: 0.32,
    points_awarded: 40,
    admin_comment: 'อยู่ระหว่างการตรวจสอบภาพจากระบบ',
    bin_location: 'อาคารบรรณราชนครินทร์ (หอสมุดกลาง)'
  },
  {
    record_id: 'REC20260805',
    user_id: 'USR001',
    user_name: 'ศุภณัฐ ปลื้มบุญ',
    student_id: '661102057106',
    image_url: 'https://images.unsplash.com/photo-1577705998148-6da4f3963bc8?w=500&auto=format&fit=crop&q=80',
    plastic_type: 'พลาสติกอื่นๆ / ไม่ตรงประเภท',
    bottle_count: 1,
    upload_timestamp: '2026-08-13 11:10:00',
    verification_status: 'ไม่อนุมัติ',
    carbon_saved: 0,
    points_awarded: 0,
    admin_comment: 'ภาพถ่ายไม่ตรงกับขวดพลาสติกรีไซเคิล (พบถุงพลาสติกปะปน)',
    bin_location: 'ลานกิจกรรมนักศึกษา'
  }
];

export const INITIAL_TRANSACTIONS: PointTransaction[] = [
  {
    transaction_id: 'TXN1001',
    user_id: 'USR001',
    record_id: 'REC20260801',
    points_earned: 30,
    transaction_type: 'earn',
    description: 'คัดแยกขวดน้ำดื่ม PET 3 ขวด (จุดคัดแยกหน้าอาคารคณะวิทยาศาสตร์ฯ)',
    transaction_date: '2026-08-14 09:35:00'
  },
  {
    transaction_id: 'TXN1002',
    user_id: 'USR001',
    record_id: 'REC20260802',
    points_earned: 20,
    transaction_type: 'earn',
    description: 'คัดแยกขวดนม HDPE 2 ขวด (โรงอาหารกลาง)',
    transaction_date: '2026-08-14 13:20:00'
  },
  {
    transaction_id: 'TXN1003',
    user_id: 'USR001',
    points_earned: -50,
    transaction_type: 'redeem',
    description: 'แลกคูปองส่วนลดเครื่องดื่ม 20 บาท ร้านกาแฟ มรภ.พช.',
    transaction_date: '2026-08-14 14:00:00'
  },
  {
    transaction_id: 'TXN1004',
    user_id: 'USR001',
    points_earned: 50,
    transaction_type: 'bonus',
    description: 'โบนัสต้อนรับสมาชิกใหม่ โครงการ Green University มรภ.พช.',
    transaction_date: '2026-08-13 08:00:00'
  }
];

export const INITIAL_REDEMPTIONS: RedemptionSimulation[] = [
  {
    redeem_id: 'RDM9001',
    user_id: 'USR001',
    user_name: 'ศุภณัฐ ปลื้มบุญ',
    student_id: '661102057106',
    reward_id: 'REW003',
    reward_name: 'คูปองส่วนลดเครื่องดื่ม 20 บาท ร้านกาแฟ มรภ.พช.',
    reward_image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=500&auto=format&fit=crop&q=80',
    points_used: 50,
    redeem_date: '2026-08-14 14:00:22',
    redeem_status: 'สำเร็จ',
    pickup_code: 'PCRU-ECO-7749'
  }
];

export const PLASTIC_TYPES_DATA: PlasticInfo[] = [
  {
    code: 1,
    name: 'PET / PETE',
    fullName: 'พอลิเอทิลีนเทเรฟทาเลต (Polyethylene Terephthalate)',
    shortName: 'ขวดน้ำดื่มใส / น้ำอัดลม',
    properties: 'พลาสติกใส แข็ง ทนแรงกระแทกได้ดี ไม่เปราะแตกง่าย',
    examples: ['ขวดน้ำดื่ม', 'ขวดน้ำอัดลม', 'ขวดน้ำมันพืช', 'กล่องผลไม้ใส'],
    recyclingTips: 'เทน้ำออกให้หมด ล้างน้ำสะอาด บีบขวดให้แบนเพื่อประหยัดพื้นที่ และแยกฝาขวดออก',
    carbonFactor: 0.08, // ~0.08 kg CO2e saved per bottle (~1.8 kg CO2e per kg)
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300'
  },
  {
    code: 2,
    name: 'HDPE',
    fullName: 'พอลิเอทิลีนความหนาแน่นสูง (High-Density Polyethylene)',
    shortName: 'ขวดขาวขุ่น / ขวดแชมพู',
    properties: 'พลาสติกเหนียว แตกยาก ยืดได้มาก ทนสารเคมีและกรดด่าง',
    examples: ['ขวดนมพาสเจอร์ไรส์', 'ขวดแชมพู', 'ขวดน้ำยาล้างจาน', 'ขวดน้ำยาซักผ้า'],
    recyclingTips: 'ล้างคราบสารเคมีหรือคราบนมด้านในให้สะอาด ตากให้แห้งก่อนนำมาหย่อนลงถังขยะรีไซเคิล',
    carbonFactor: 0.08,
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300'
  },
  {
    code: 3,
    name: 'PVC',
    fullName: 'พอลิไวนิลคลอไรด์ (Polyvinyl Chloride)',
    shortName: 'ท่อน้ำ / สายยาง',
    properties: 'แข็งแรง ยืดหยุ่น ทนต่อสภาพอากาศและสารเคมี',
    examples: ['ท่อน้ำประปา', 'สายยางใส', 'แผ่นฟิล์มห่ออาหาร', 'ขวดน้ำยาเคมี'],
    recyclingTips: 'แยกออกจากพลาสติกชนิดอื่นเนื่องจากมีคลอรีนผสม ต้องเข้าสู่โรงงานรีไซเคิลเฉพาะทาง',
    carbonFactor: 0.05,
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300'
  },
  {
    code: 4,
    name: 'LDPE',
    fullName: 'พอลิเอทิลีนความหนาแน่นต่ำ (Low-Density Polyethylene)',
    shortName: 'ถุงหิ้ว / ถุงซิปล็อก',
    properties: 'พลาสติกนิ่ม ยืดหยุ่นสูง ใส เหนียว ทนความเย็นได้ดี',
    examples: ['ถุงหูหิ้วพลาสติก', 'ฟิล์มห่อสินค้า', 'ถุงซิปล็อก', 'ถุงขนมปัง'],
    recyclingTips: 'รวบรวมถุงพลาสติกที่แห้งสะอาด ไม่เปื้อนเศษอาหาร นำมารวมกันเป็นก้อนใหญ่ก่อนทิ้ง',
    carbonFactor: 0.04,
    badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-300'
  },
  {
    code: 5,
    name: 'PP',
    fullName: 'พอลิพรอพิลีน (Polypropylene)',
    shortName: 'กล่องอาหารเวฟ / แก้วกาแฟ',
    properties: 'พลาสติกเหนียว ทนความร้อนสูงและทนสารเคมีได้ดี ผิวมันวาว',
    examples: ['กล่องอาหารอุ่นไมโครเวฟ', 'ถ้วยและแก้วโยเกิร์ต', 'ฝาขวดน้ำดื่ม', 'หลอดดูดน้ำ'],
    recyclingTips: 'ล้างคราบไขมันและเศษอาหารออกให้สะอาด นำไปรีไซเคิลเป็นชิ้นส่วนยานยนต์หรือกล่องเก็บของ',
    carbonFactor: 0.06,
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300'
  },
  {
    code: 6,
    name: 'PS',
    fullName: 'พอลิสไตรีน (Polystyrene)',
    shortName: 'โฟม / ช้อนส้อมพลาสติก',
    properties: 'พลาสติกแข็งแต่เปราะ แตกหักง่าย น้ำหนักเบา',
    examples: ['กล่องโฟมบรรจุอาหาร', 'ช้อนส้อมพลาสติกใช้ครั้งเดียว', 'แก้วกาแฟเย็นแบบเปราะ'],
    recyclingTips: 'แนะนำให้ลดการใช้งาน (Reduce) หากจำเป็นต้องทิ้งให้เช็ดคราบอาหารออกให้สะอาด',
    carbonFactor: 0.03,
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-300'
  },
  {
    code: 7,
    name: 'OTHER',
    fullName: 'พลาสติกชนิดอื่นๆ (Other Plastics)',
    shortName: 'พลาสติกผสม / โพลีคาร์บอเนต',
    properties: 'พลาสติกหลายชนิดผสมกัน หรือพลาสติกสังเคราะห์พิเศษ',
    examples: ['ขวดน้ำดื่มสปอร์ต (PC)', 'เคสโทรศัพท์มือถือ', 'แว่นตา', 'ชิ้นส่วนอิเล็กทรอนิกส์'],
    recyclingTips: 'ส่งเข้าโครงการรับขยะกำพร้าหรือโครงการรีไซเคิลเฉพาะทางเพื่อแปรรูปเป็นพลังงานเชื้อเพลิง RDF',
    carbonFactor: 0.02,
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-300'
  }
];

export const SMART_BIN_LOCATIONS = [
  { id: 'BIN-01', name: 'จุดคัดแยกหน้าอาคาร 1 คณะวิทยาศาสตร์และเทคโนโลยี', status: 'พร้อมใช้งาน', capacity: '45%' },
  { id: 'BIN-02', name: 'จุดคัดแยกโรงอาหารกลาง มหาวิทยาลัยราชภัฏเพชรบูรณ์', status: 'พร้อมใช้งาน', capacity: '78%' },
  { id: 'BIN-03', name: 'จุดคัดแยกหน้าอาคาร IT และวิทยาการคอมพิวเตอร์', status: 'พร้อมใช้งาน', capacity: '30%' },
  { id: 'BIN-04', name: 'จุดคัดแยกหอสมุดกลาง (อาคารบรรณราชนครินทร์)', status: 'พร้อมใช้งาน', capacity: '62%' },
  { id: 'BIN-05', name: 'จุดคัดแยกหน้าอาคารคณะวิทยาการจัดการ', status: 'พร้อมใช้งาน', capacity: '20%' },
  { id: 'BIN-06', name: 'จุดคัดแยกศูนย์กีฬาและลานกิจกรรมนักศึกษา', status: 'พร้อมใช้งาน', capacity: '50%' }
];
