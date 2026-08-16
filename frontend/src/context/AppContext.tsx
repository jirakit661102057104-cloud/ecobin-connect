'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, WasteRecord, PointTransaction, Reward, RedemptionSimulation, LocalStorageLog, UserRole, SmartBin, AppSettings, PlasticType } from '../types';
import confetti from 'canvas-confetti';
import { api, mediaUrl } from '../lib/api';
import { DEMO_LOGIN, allowGuestBrowse, clearGuestBrowse } from '../lib/config';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
}

interface AppStatePayload {
  user: User | null;
  users: User[];
  waste_records: WasteRecord[];
  rewards: Reward[];
  transactions: PointTransaction[];
  redemptions: RedemptionSimulation[];
  guest_logs: LocalStorageLog[];
  bins?: SmartBin[];
  plastic_types?: PlasticType[];
  settings?: AppSettings;
}

interface AppContextType {
  authReady: boolean;
  currentUser: User | null;
  currentRole: UserRole;
  users: User[];
  wasteRecords: WasteRecord[];
  rewards: Reward[];
  transactions: PointTransaction[];
  redemptions: RedemptionSimulation[];
  guestLogs: LocalStorageLog[];
  bins: SmartBin[];
  plasticTypes: PlasticType[];
  settings: AppSettings;
  toasts: Toast[];
  language: 'th' | 'en';
  setLanguage: (lang: 'th' | 'en') => void;
  setCurrentUser: (user: User | null) => void;
  switchUser: (userId: string) => Promise<void>;
  setGuestMode: () => Promise<void>;
  loginAs: (role: UserRole) => Promise<void>;
  registerUser: (payload: {
    login: string;
    password: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
  }) => Promise<boolean>;
  loginUser: (emailOrStudentId: string, pass: string) => Promise<boolean>;
  loginGoogle: (payload: { idToken?: string; demoEmail?: string; demoName?: string }) => Promise<boolean>;
  requestPhoneOTP: (phone: string) => Promise<{ ok: boolean; otp?: string; phone?: string; message?: string }>;
  requestEmailOTP: (email: string) => Promise<{ ok: boolean; otp?: string; email?: string; message?: string }>;
  checkPhoneOTP: (phone: string, code: string) => Promise<boolean>;
  checkEmailOTP: (email: string, code: string) => Promise<boolean>;
  verifyPhone: (data: { phone: string; code: string; password?: string }) => Promise<'ok' | 'error'>;
  updateUserProfile: (data: Partial<User>) => Promise<boolean>;
  uploadAvatar: (imageData: string) => Promise<string | null>;
  logout: () => Promise<void>;
  addWasteRecord: (data: { imageUrl: string; plasticType: string; bottleCount: number; binLocation?: string }) => Promise<WasteRecord>;
  addGuestWasteRecord: (data: { imageUrl: string; detectedBottles: number; scanResult: string }) => Promise<LocalStorageLog>;
  verifyWasteRecord: (recordId: string, status: 'อนุมัติแล้ว' | 'ไม่อนุมัติ' | 'กรุณาส่งภาพมาใหม่', comment: string, adjustedPoints?: number) => Promise<void>;
  redeemReward: (rewardId: string) => Promise<{ success: boolean; message: string; redemption?: RedemptionSimulation }>;
  lookupRedeem: (code: string) => Promise<RedemptionSimulation>;
  claimRedeem: (code: string) => Promise<RedemptionSimulation>;
  addReward: (reward: Omit<Reward, 'reward_id'>) => Promise<void>;
  updateReward: (rewardId: string, data: Partial<Reward>) => Promise<void>;
  deleteReward: (rewardId: string) => Promise<void>;
  updateAppSettings: (data: Partial<AppSettings>) => Promise<void>;
  saveBin: (bin: Partial<SmartBin> & { bin_name: string; bin_id?: string }) => Promise<void>;
  deleteBin: (binId: string) => Promise<void>;
  savePlastic: (item: Partial<PlasticType> & { display_name_th: string; plastic_code?: number }) => Promise<void>;
  deletePlastic: (code: number) => Promise<void>;
  updateAdminUser: (userId: string, data: { user_role?: UserRole; department?: string; full_name?: string; points_delta?: number; reason?: string }) => Promise<void>;
  deactivateUser: (userId: string) => Promise<void>;
  cancelRedeem: (code: string) => Promise<RedemptionSimulation>;
  addToast: (type: Toast['type'], title: string, message: string) => void;
  removeToast: (id: string) => void;
  triggerConfetti: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);
const DEFAULT_SETTINGS: AppSettings = {
  points_per_bottle: 10,
  carbon_per_bottle: 0.08,
  announcement: '',
  waste_auto_approve: false,
};
const LOCAL_STORAGE_KEY_LANG = 'ecobin_lang';
const DEMO_PASSWORD = 'ecobin123';

function mapUser(u: User | null | undefined): User | null {
  if (!u) return null;
  return { ...u, avatar_url: mediaUrl(u.avatar_url || '') };
}

function mapUsers(list: User[] | null | undefined): User[] {
  return (list || []).map((u) => mapUser(u)!);
}

function mapWaste(list: WasteRecord[] | null | undefined): WasteRecord[] {
  return (list || []).map((r) => ({ ...r, image_url: mediaUrl(r.image_url) }));
}

function mapGuests(list: LocalStorageLog[] | null | undefined): LocalStorageLog[] {
  return (list || []).map((g) => ({ ...g, temp_image_path: mediaUrl(g.temp_image_path) }));
}

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<'th' | 'en'>('th');
  const [users, setUsers] = useState<User[]>([]);
  const [wasteRecords, setWasteRecords] = useState<WasteRecord[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [redemptions, setRedemptions] = useState<RedemptionSimulation[]>([]);
  const [guestLogs, setGuestLogs] = useState<LocalStorageLog[]>([]);
  const [bins, setBins] = useState<SmartBin[]>([]);
  const [plasticTypes, setPlasticTypes] = useState<PlasticType[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_LANG);
    if (saved === 'en' || saved === 'th') setLanguageState(saved);
    refreshState();
  }, []);

  const applyState = (data: AppStatePayload) => {
    setCurrentUserState(mapUser(data.user));
    setUsers(mapUsers(data.users));
    setWasteRecords(mapWaste(data.waste_records));
    setRewards(data.rewards || []);
    setTransactions(data.transactions || []);
    setRedemptions(data.redemptions || []);
    setGuestLogs(mapGuests(data.guest_logs));
    setBins(data.bins || []);
    setPlasticTypes(data.plastic_types || []);
    setSettings(data.settings ? { ...DEFAULT_SETTINGS, ...data.settings } : DEFAULT_SETTINGS);
  };

  const refreshState = async () => {
    try {
      const data = await api<AppStatePayload>('/api/state');
      applyState(data);
    } catch {
      // API offline — keep empty guest view
    } finally {
      setAuthReady(true);
    }
  };

  const setLanguage = (lang: 'th' | 'en') => {
    setLanguageState(lang);
    localStorage.setItem(LOCAL_STORAGE_KEY_LANG, lang);
    addToast('info', lang === 'th' ? 'เปลี่ยนภาษาแล้ว' : 'Language changed', lang === 'th' ? 'เปลี่ยนเป็นภาษาไทยเรียบร้อย' : 'Switched to English');
  };

  const addToast = (type: Toast['type'], title: string, message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => removeToast(id), 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const triggerConfetti = () => {
    try {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    } catch {
      // ignore
    }
  };

  const setCurrentUser = (user: User | null) => setCurrentUserState(user);

  const loginGoogle = async (payload: { idToken?: string; demoEmail?: string; demoName?: string }): Promise<boolean> => {
    try {
      const data = await api<{ user?: { needs_profile?: boolean } }>('/api/auth/google', {
        method: 'POST',
        body: JSON.stringify({
          id_token: payload.idToken || '',
          demo_email: payload.demoEmail || '',
          demo_name: payload.demoName || '',
        }),
      });
      await refreshState();
      clearGuestBrowse();
      if (data.user?.needs_profile) {
        addToast('info', 'สมัครด้วย Google สำเร็จ', 'กรุณากรอกชื่อและนามสกุลเพื่อเข้าใช้งาน');
      } else {
        addToast('success', 'เข้าสู่ระบบด้วย Google', 'ยินดีต้อนรับสู่ EcoBin Connect');
      }
      return true;
    } catch (e) {
      addToast('error', 'Google ไม่สำเร็จ', e instanceof Error ? e.message : 'ไม่สามารถเข้าสู่ระบบด้วย Google ได้');
      return false;
    }
  };

  const requestPhoneOTP = async (phone: string) => {
    try {
      const data = await api<{ ok: boolean; otp?: string; phone?: string; message?: string }>('/api/auth/phone/otp', {
        method: 'POST',
        body: JSON.stringify({ phone }),
      });
      addToast('success', 'ส่งรหัส OTP แล้ว', data.message || 'กรุณากรอกรหัส 6 หลัก');
      return data;
    } catch (e) {
      addToast('error', 'ส่ง OTP ไม่สำเร็จ', e instanceof Error ? e.message : 'ตรวจสอบเบอร์โทรอีกครั้ง');
      return { ok: false };
    }
  };

  const requestEmailOTP = async (email: string) => {
    try {
      const data = await api<{ ok: boolean; otp?: string; email?: string; message?: string }>('/api/auth/email/otp', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      addToast('success', 'ส่งรหัส OTP แล้ว', data.message || 'กรุณากรอกรหัส 6 หลักที่อีเมล');
      return data;
    } catch (e) {
      addToast('error', 'ส่ง OTP ไม่สำเร็จ', e instanceof Error ? e.message : 'ตรวจสอบอีเมลอีกครั้ง');
      return { ok: false };
    }
  };

  const checkPhoneOTP = async (phone: string, code: string) => {
    try {
      await api('/api/auth/phone/otp/check', {
        method: 'POST',
        body: JSON.stringify({ phone, code }),
      });
      addToast('success', 'ยืนยัน OTP สำเร็จ', 'ตั้งรหัสผ่านเพื่อสร้างบัญชี');
      return true;
    } catch (e) {
      addToast('error', 'รหัส OTP ไม่ถูกต้อง', e instanceof Error ? e.message : 'ลองอีกครั้ง');
      return false;
    }
  };

  const checkEmailOTP = async (email: string, code: string) => {
    try {
      await api('/api/auth/email/otp/check', {
        method: 'POST',
        body: JSON.stringify({ email, code }),
      });
      addToast('success', 'ยืนยัน OTP สำเร็จ', 'ตั้งรหัสผ่านเพื่อสร้างบัญชี');
      return true;
    } catch (e) {
      addToast('error', 'รหัส OTP ไม่ถูกต้อง', e instanceof Error ? e.message : 'ลองอีกครั้ง');
      return false;
    }
  };

  const verifyPhone = async (data: { phone: string; code: string; password?: string }): Promise<'ok' | 'error'> => {
    try {
      const res = await api<{ user?: { needs_profile?: boolean } }>('/api/auth/phone/verify', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      await refreshState();
      clearGuestBrowse();
      if (res.user?.needs_profile) {
        addToast('info', 'ยืนยันเบอร์สำเร็จ', 'กรุณากรอกชื่อและนามสกุลเพื่อเข้าใช้งาน');
      } else {
        addToast('success', 'เข้าสู่ระบบด้วยเบอร์โทร', 'ยินดีต้อนรับสู่ EcoBin Connect');
      }
      return 'ok';
    } catch (e) {
      addToast('error', 'ยืนยัน OTP ไม่สำเร็จ', e instanceof Error ? e.message : 'รหัสไม่ถูกต้อง');
      return 'error';
    }
  };

  const loginUser = async (emailOrStudentId: string, pass: string): Promise<boolean> => {
    try {
      await api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ login: emailOrStudentId, password: pass }),
      });
      await refreshState();
      clearGuestBrowse();
      addToast('success', 'เข้าสู่ระบบสำเร็จ', 'ยินดีต้อนรับกลับสู่ EcoBin Connect');
      return true;
    } catch (e) {
      addToast('error', 'เข้าสู่ระบบไม่สำเร็จ', e instanceof Error ? e.message : 'ไม่พบบัญชีผู้ใช้ หรือรหัสผ่านไม่ถูกต้อง');
      return false;
    }
  };

  const registerUser = async (payload: {
    login: string;
    password: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
  }): Promise<boolean> => {
    try {
      await api('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          login: payload.login,
          password: payload.password,
          first_name: payload.first_name,
          last_name: payload.last_name,
          avatar_url: payload.avatar_url || '',
        }),
      });
      await refreshState();
      clearGuestBrowse();
      triggerConfetti();
      addToast('success', 'สมัครสมาชิกสำเร็จ', 'กรอกชื่อและเลือกโปรไฟล์ในหน้าหลักเพื่อเริ่มใช้งาน');
      return true;
    } catch (e) {
      addToast('error', 'สมัครไม่สำเร็จ', e instanceof Error ? e.message : 'ลองใหม่อีกครั้ง');
      return false;
    }
  };

  const uploadAvatar = async (imageData: string): Promise<string | null> => {
    try {
      const res = await api<{ avatar_url?: string }>('/api/me/avatar', {
        method: 'POST',
        body: JSON.stringify({ image_data: imageData }),
      });
      await refreshState();
      addToast('success', 'อัปโหลดรูปโปรไฟล์แล้ว', 'บันทึกรูปประจำตัวเรียบร้อย');
      return res.avatar_url ? mediaUrl(res.avatar_url) : null;
    } catch (e) {
      addToast('error', 'อัปโหลดไม่สำเร็จ', e instanceof Error ? e.message : 'ลองเลือกรูปใหม่');
      return null;
    }
  };

  const setGuestMode = async () => {
    allowGuestBrowse();
    await api('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
    await refreshState();
    addToast('info', 'โหมดผู้เยี่ยมชม', 'เข้าใช้งานแบบไม่ลงทะเบียน');
  };

  const logout = async () => {
    clearGuestBrowse();
    await api('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
    await refreshState();
    addToast('info', 'ออกจากระบบแล้ว', 'กรุณาเข้าสู่ระบบอีกครั้ง');
    if (typeof window !== 'undefined') window.location.assign('/login');
  };

  const loginAs = async (role: UserRole) => {
    if (!DEMO_LOGIN) {
      addToast('warning', 'โหมดใช้งานจริง', 'กรุณาเข้าสู่ระบบด้วยอีเมลและรหัสผ่านของท่าน');
      return;
    }
    if (role === 'Guest') {
      await setGuestMode();
      return;
    }
    const login = role === 'Admin' ? 'st661102057104@gmail.com' : 'st661102057106@gmail.com';
    await loginUser(login, DEMO_PASSWORD);
  };

  const switchUser = async (userId: string) => {
    if (!DEMO_LOGIN) return;
    const user = users.find((u) => u.user_id === userId);
    if (!user) return;
    await loginUser(user.email, DEMO_PASSWORD);
  };

  const updateUserProfile = async (data: Partial<User>): Promise<boolean> => {
    try {
      await api('/api/me', {
        method: 'PATCH',
        body: JSON.stringify({
          first_name: data.first_name,
          last_name: data.last_name,
          full_name: data.full_name,
          student_id: data.student_id,
          email: data.email,
          department: data.department,
          avatar_url: data.avatar_url,
        }),
      });
      await refreshState();
      addToast('success', 'บันทึกโปรไฟล์สำเร็จ', 'ข้อมูลส่วนตัวของคุณได้รับการอัปเดตแล้ว');
      return true;
    } catch (e) {
      addToast('error', 'ไม่สามารถแก้ไขได้', e instanceof Error ? e.message : 'กรุณาเข้าสู่ระบบก่อน');
      return false;
    }
  };

  const addWasteRecord = async (data: {
    imageUrl: string;
    plasticType: string;
    bottleCount: number;
    binLocation?: string;
  }): Promise<WasteRecord> => {
    const res = await api<{ record: WasteRecord }>('/api/waste', {
      method: 'POST',
      body: JSON.stringify({
        image_data: data.imageUrl,
        plastic_type: data.plasticType,
        bottle_count: data.bottleCount,
        bin_location: data.binLocation,
      }),
    });
    await refreshState();
    const record = { ...res.record, image_url: mediaUrl(res.record.image_url) };
    if (record.verification_status === 'รอการตรวจสอบ') {
      addToast('info', 'ส่งข้อมูลแล้ว', 'รอผู้ดูแลระบบตรวจสอบภาพก่อนได้รับแต้ม');
    } else {
      triggerConfetti();
      addToast('success', 'บันทึกสำเร็จ!', `ได้รับ +${record.points_awarded} แต้ม (ลดก๊าซคาร์บอน ${record.carbon_saved} kg CO₂e)`);
    }
    return record;
  };

  const addGuestWasteRecord = async (data: {
    imageUrl: string;
    detectedBottles: number;
    scanResult: string;
  }): Promise<LocalStorageLog> => {
    const log = await api<LocalStorageLog>('/api/guest/scan', {
      method: 'POST',
      body: JSON.stringify({
        image_data: data.imageUrl,
        detected_bottles: data.detectedBottles,
        scan_result: data.scanResult,
      }),
    });
    const mapped = { ...log, temp_image_path: mediaUrl(log.temp_image_path) };
    setGuestLogs((prev) => [mapped, ...prev]);
    addToast('info', 'จำลองการตรวจสอบสำเร็จ (Guest)', `ตรวจพบขวดพลาสติก ${data.detectedBottles} ขวด (สมัครสมาชิกเพื่อสะสมแต้มจริง)`);
    return mapped;
  };

  const verifyWasteRecord = async (
    recordId: string,
    status: 'อนุมัติแล้ว' | 'ไม่อนุมัติ' | 'กรุณาส่งภาพมาใหม่',
    comment: string,
    adjustedPoints?: number
  ) => {
    await api(`/api/admin/waste/${recordId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, comment, adjusted_points: adjustedPoints }),
    });
    await refreshState();
    const kind = status === 'อนุมัติแล้ว' ? 'success' : status === 'กรุณาส่งภาพมาใหม่' ? 'info' : 'warning';
    addToast(kind, `อัปเดตผลการตรวจสอบ (${status})`, `รายการ ${recordId}: ${comment}`);
  };

  const redeemReward = async (rewardId: string) => {
    if (!currentUser) {
      addToast('warning', 'กรุณาเข้าสู่ระบบ', 'ผู้ใช้งานทั่วไป (Guest) ต้องเข้าสู่ระบบสมาชิกก่อนทำรายการแลกของรางวัล');
      return { success: false, message: 'กรุณาเข้าสู่ระบบสมาชิกก่อนทำรายการ' };
    }
    try {
      const res = await api<{ redemption: RedemptionSimulation }>(`/api/rewards/${rewardId}/redeem`, { method: 'POST' });
      await refreshState();
      triggerConfetti();
      addToast('success', 'ทำรายการแลกรางวัลสำเร็จ!', 'แสดง QR ให้แอดมินสแกนที่จุดรับของ');
      return { success: true, message: 'ทำรายการแลกรางวัลสำเร็จ', redemption: res.redemption };
    } catch (e) {
      const message = e instanceof Error ? e.message : 'แลกไม่สำเร็จ';
      addToast('error', 'ไม่สามารถแลกของรางวัลได้', message);
      return { success: false, message };
    }
  };

  const lookupRedeem = async (code: string) => {
    const res = await api<{ redemption: RedemptionSimulation }>(
      `/api/admin/redeem/lookup?code=${encodeURIComponent(code)}`
    );
    return res.redemption;
  };

  const claimRedeem = async (code: string) => {
    const res = await api<{ redemption: RedemptionSimulation }>('/api/admin/redeem/claim', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
    await refreshState();
    return res.redemption;
  };

  const addReward = async (rewardData: Omit<Reward, 'reward_id'>) => {
    await api('/api/admin/rewards', { method: 'POST', body: JSON.stringify(rewardData) });
    await refreshState();
    addToast('success', 'เพิ่มของรางวัลสำเร็จ', `เพิ่ม "${rewardData.reward_name}" ในแคตตาล็อกแล้ว`);
  };

  const updateReward = async (rewardId: string, data: Partial<Reward>) => {
    const current = rewards.find((r) => r.reward_id === rewardId);
    await api(`/api/admin/rewards/${rewardId}`, {
      method: 'PUT',
      body: JSON.stringify({ ...current, ...data, reward_id: rewardId }),
    });
    await refreshState();
    addToast('success', 'อัปเดตข้อมูลของรางวัล', 'บันทึกการแก้ไขรายการของรางวัลแล้ว');
  };

  const deleteReward = async (rewardId: string) => {
    const reward = rewards.find((r) => r.reward_id === rewardId);
    await api(`/api/admin/rewards/${rewardId}`, { method: 'DELETE' });
    await refreshState();
    addToast('info', 'ลบของรางวัลแล้ว', `ลบรายการ "${reward?.reward_name}" เรียบร้อย`);
  };

  const updateAppSettings = async (data: Partial<AppSettings>) => {
    const next = { ...settings, ...data, waste_auto_approve: false };
    await api('/api/admin/settings', { method: 'PATCH', body: JSON.stringify(next) });
    await refreshState();
    addToast('success', 'บันทึกกฎระบบแล้ว', 'การสแกน แต้ม และประกาศจะใช้ค่าล่าสุดทันที');
  };

  const saveBin = async (bin: Partial<SmartBin> & { bin_name: string; bin_id?: string }) => {
    if (bin.bin_id) {
      await api(`/api/admin/bins/${bin.bin_id}`, { method: 'PUT', body: JSON.stringify(bin) });
      addToast('success', 'อัปเดตจุดทิ้งแล้ว', bin.bin_name);
    } else {
      await api('/api/admin/bins', { method: 'POST', body: JSON.stringify(bin) });
      addToast('success', 'เพิ่มจุดทิ้งแล้ว', bin.bin_name);
    }
    await refreshState();
  };

  const deleteBin = async (binId: string) => {
    await api(`/api/admin/bins/${binId}`, { method: 'DELETE' });
    await refreshState();
    addToast('info', 'ปิดจุดทิ้งแล้ว', 'สมาชิกจะไม่เห็นจุดนี้ตอนสแกน');
  };

  const savePlastic = async (item: Partial<PlasticType> & { display_name_th: string; plastic_code?: number }) => {
    if (item.plastic_code) {
      await api(`/api/admin/plastics/${item.plastic_code}`, { method: 'PUT', body: JSON.stringify(item) });
      addToast('success', 'อัปเดตชนิดขวดแล้ว', item.display_name_th);
    } else {
      await api('/api/admin/plastics', { method: 'POST', body: JSON.stringify(item) });
      addToast('success', 'เพิ่มชนิดขวดแล้ว', item.display_name_th);
    }
    await refreshState();
  };

  const deletePlastic = async (code: number) => {
    await api(`/api/admin/plastics/${code}`, { method: 'DELETE' });
    await refreshState();
    addToast('info', 'ลบชนิดขวดแล้ว', 'รายการใหม่จะไม่ใช้ชนิดนี้');
  };

  const updateAdminUser = async (
    userId: string,
    data: { user_role?: UserRole; department?: string; full_name?: string; points_delta?: number; reason?: string }
  ) => {
    await api(`/api/admin/users/${userId}`, { method: 'PATCH', body: JSON.stringify(data) });
    await refreshState();
    addToast('success', 'อัปเดตสมาชิกแล้ว', 'สิทธิ์ แต้ม หรือข้อมูลบัญชีมีผลทันที');
  };

  const deactivateUser = async (userId: string) => {
    await api(`/api/admin/users/${userId}`, { method: 'DELETE' });
    await refreshState();
    addToast('info', 'ปิดบัญชีแล้ว', 'ผู้ใช้นี้เข้าสู่ระบบไม่ได้');
  };

  const cancelRedeem = async (code: string) => {
    const res = await api<{ redemption: RedemptionSimulation }>('/api/admin/redeem/cancel', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
    await refreshState();
    return res.redemption;
  };

  const currentRole: UserRole = currentUser ? currentUser.user_role : 'Guest';

  return (
    <AppContext.Provider
      value={{
        authReady,
        currentUser,
        currentRole,
        users,
        wasteRecords,
        rewards,
        transactions,
        redemptions,
        guestLogs,
        bins,
        plasticTypes,
        settings,
        toasts,
        language,
        setLanguage,
        setCurrentUser,
        switchUser,
        setGuestMode,
        loginAs,
        registerUser,
        loginUser,
        loginGoogle,
        requestPhoneOTP,
        requestEmailOTP,
        checkPhoneOTP,
        checkEmailOTP,
        verifyPhone,
        updateUserProfile,
        uploadAvatar,
        logout,
        addWasteRecord,
        addGuestWasteRecord,
        verifyWasteRecord,
        redeemReward,
        lookupRedeem,
        claimRedeem,
        addReward,
        updateReward,
        deleteReward,
        updateAppSettings,
        saveBin,
        deleteBin,
        savePlastic,
        deletePlastic,
        updateAdminUser,
        deactivateUser,
        cancelRedeem,
        addToast,
        removeToast,
        triggerConfetti,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
