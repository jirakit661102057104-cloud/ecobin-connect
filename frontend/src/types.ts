export type UserRole = 'Admin' | 'Member' | 'Guest';

export interface User {
  user_id: string;
  full_name: string;
  first_name?: string;
  last_name?: string;
  needs_profile?: boolean;
  student_id: string;
  email: string;
  password?: string;
  user_role: UserRole;
  total_points: number;
  total_carbon_saved: number; // in kg CO2e
  avatar_url?: string;
  department?: string;
  phone?: string;
  auth_provider?: string;
}

export type VerificationStatus = 'รอการตรวจสอบ' | 'อนุมัติแล้ว' | 'ไม่อนุมัติ' | 'กรุณาส่งภาพมาใหม่';

export interface WasteRecord {
  record_id: string;
  user_id: string;
  user_name?: string;
  student_id?: string;
  image_url: string;
  plastic_type: string; // e.g. "PET (เบอร์ 1)", "HDPE (เบอร์ 2)"
  bottle_count: number;
  upload_timestamp: string;
  verification_status: VerificationStatus;
  carbon_saved: number; // in kg CO2e
  points_awarded: number;
  admin_comment: string;
  bin_location?: string;
}

export interface PointTransaction {
  transaction_id: string;
  user_id: string;
  record_id?: string;
  points_earned: number; // positive for earn, negative for redeem
  transaction_type: 'earn' | 'redeem' | 'bonus';
  description: string;
  transaction_date: string;
}

export interface Reward {
  reward_id: string;
  reward_name: string;
  points_required: number;
  reward_description: string;
  reward_stock: number;
  reward_image: string;
  category: 'เครื่องดื่มและอาหาร' | 'ของใช้รักษ์โลก' | 'อุปกรณ์การเรียน' | 'สิทธิพิเศษ';
}

export interface RedemptionSimulation {
  redeem_id: string;
  user_id: string;
  user_name?: string;
  student_id?: string;
  reward_id: string;
  reward_name: string;
  reward_image: string;
  points_used: number;
  redeem_date: string;
  redeem_status: 'สำเร็จ' | 'รอรับของรางวัล' | 'ยกเลิก';
  pickup_code: string;
}

export interface SmartBin {
  bin_id: string;
  bin_name: string;
  status: string;
  capacity_note?: string;
}

export interface AppSettings {
  points_per_bottle: number;
  carbon_per_bottle: number;
  announcement: string;
  waste_auto_approve: boolean;
}

export interface PlasticType {
  plastic_code: number;
  short_name: string;
  full_name: string;
  display_name_th: string;
  carbon_factor: number;
  points_per_bottle: number;
  recycling_tips?: string;
}

export interface LocalStorageLog {
  guest_session_id: string;
  device_id: string;
  temp_image_path: string;
  temp_scan_result: string;
  detected_bottles: number;
  estimated_points: number;
  timestamp: string;
}

export interface PlasticInfo {
  code: number;
  name: string;
  fullName: string;
  shortName: string;
  properties: string;
  examples: string[];
  recyclingTips: string;
  carbonFactor: number; // kg CO2e saved per kg recycled
  badgeColor: string;
}
