import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, WasteRecord, PointTransaction, Reward, RedemptionSimulation, LocalStorageLog, UserRole } from '../types';
import { INITIAL_USERS, INITIAL_REWARDS, INITIAL_WASTE_RECORDS, INITIAL_TRANSACTIONS, INITIAL_REDEMPTIONS } from '../data/mockData';
import confetti from 'canvas-confetti';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
}

interface AppContextType {
  currentUser: User | null;
  currentRole: UserRole;
  users: User[];
  wasteRecords: WasteRecord[];
  rewards: Reward[];
  transactions: PointTransaction[];
  redemptions: RedemptionSimulation[];
  guestLogs: LocalStorageLog[];
  toasts: Toast[];
  language: 'th' | 'en';
  setLanguage: (lang: 'th' | 'en') => void;
  setCurrentUser: (user: User | null) => void;
  switchUser: (userId: string) => void;
  setGuestMode: () => void;
  loginAs: (role: UserRole) => void;
  registerUser: (name: string, studentId: string, email: string, pass: string) => boolean;
  loginUser: (emailOrStudentId: string, pass: string) => boolean;
  updateUserProfile: (data: Partial<User>) => boolean;
  logout: () => void;
  addWasteRecord: (data: { imageUrl: string; plasticType: string; bottleCount: number; binLocation?: string }) => WasteRecord;
  addGuestWasteRecord: (data: { imageUrl: string; detectedBottles: number; scanResult: string }) => LocalStorageLog;
  verifyWasteRecord: (recordId: string, status: 'อนุมัติแล้ว' | 'ไม่อนุมัติ', comment: string, adjustedPoints?: number) => void;
  redeemReward: (rewardId: string) => { success: boolean; message: string; redemption?: RedemptionSimulation };
  addReward: (reward: Omit<Reward, 'reward_id'>) => void;
  updateReward: (rewardId: string, data: Partial<Reward>) => void;
  deleteReward: (rewardId: string) => void;
  addToast: (type: Toast['type'], title: string, message: string) => void;
  removeToast: (id: string) => void;
  triggerConfetti: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY_USERS = 'ecobin_users';
const LOCAL_STORAGE_KEY_WASTE = 'ecobin_waste_records';
const LOCAL_STORAGE_KEY_REWARDS = 'ecobin_rewards';
const LOCAL_STORAGE_KEY_TRANSACTIONS = 'ecobin_transactions';
const LOCAL_STORAGE_KEY_REDEMPTIONS = 'ecobin_redemptions';
const LOCAL_STORAGE_KEY_GUEST = 'ecobin_guest_logs';
const LOCAL_STORAGE_KEY_CURRENT_USER = 'ecobin_current_user_id';
const LOCAL_STORAGE_KEY_LANG = 'ecobin_lang';

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<'th' | 'en'>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_LANG);
    return saved === 'en' ? 'en' : 'th';
  });

  const setLanguage = (lang: 'th' | 'en') => {
    setLanguageState(lang);
    localStorage.setItem(LOCAL_STORAGE_KEY_LANG, lang);
    addToast('info', lang === 'th' ? 'เปลี่ยนภาษาแล้ว' : 'Language changed', lang === 'th' ? 'เปลี่ยนเป็นภาษาไทยเรียบร้อย' : 'Switched to English');
  };
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_USERS);
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [wasteRecords, setWasteRecords] = useState<WasteRecord[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_WASTE);
    return saved ? JSON.parse(saved) : INITIAL_WASTE_RECORDS;
  });

  const [rewards, setRewards] = useState<Reward[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_REWARDS);
    return saved ? JSON.parse(saved) : INITIAL_REWARDS;
  });

  const [transactions, setTransactions] = useState<PointTransaction[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_TRANSACTIONS);
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  const [redemptions, setRedemptions] = useState<RedemptionSimulation[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_REDEMPTIONS);
    return saved ? JSON.parse(saved) : INITIAL_REDEMPTIONS;
  });

  const [guestLogs, setGuestLogs] = useState<LocalStorageLog[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_GUEST);
    return saved ? JSON.parse(saved) : [];
  });

  const [currentUser, setCurrentUserState] = useState<User | null>(() => {
    const savedUserId = localStorage.getItem(LOCAL_STORAGE_KEY_CURRENT_USER);
    if (savedUserId === 'GUEST') return null;
    const found = INITIAL_USERS.find(u => u.user_id === savedUserId);
    return found || INITIAL_USERS[0]; // Default to Supanut (Member)
  });

  const [toasts, setToasts] = useState<Toast[]>([]);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_WASTE, JSON.stringify(wasteRecords));
  }, [wasteRecords]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_REWARDS, JSON.stringify(rewards));
  }, [rewards]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_TRANSACTIONS, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_REDEMPTIONS, JSON.stringify(redemptions));
  }, [redemptions]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_GUEST, JSON.stringify(guestLogs));
  }, [guestLogs]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(LOCAL_STORAGE_KEY_CURRENT_USER, currentUser.user_id);
    } else {
      localStorage.setItem(LOCAL_STORAGE_KEY_CURRENT_USER, 'GUEST');
    }
  }, [currentUser]);

  const addToast = (type: Toast['type'], title: string, message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {
      // ignore
    }
  };

  const setCurrentUser = (user: User | null) => {
    setCurrentUserState(user);
  };

  const switchUser = (userId: string) => {
    const user = users.find(u => u.user_id === userId);
    if (user) {
      setCurrentUserState(user);
      addToast('info', 'สลับบัญชีผู้ใช้', `เข้าสู่ระบบในนาม: ${user.full_name} (${user.user_role})`);
    }
  };

  const setGuestMode = () => {
    setCurrentUserState(null);
    addToast('info', 'โหมดผู้เยี่ยมชม', 'เข้าใช้งานแบบไม่ลงทะเบียน (บันทึกข้อมูลใน Local Storage)');
  };

  const loginAs = (role: UserRole) => {
    if (role === 'Guest') {
      setGuestMode();
    } else if (role === 'Admin') {
      const admin = users.find(u => u.user_role === 'Admin') || users[1];
      setCurrentUserState(admin);
      addToast('success', 'เข้าสู่ระบบสำเร็จ', `เข้าสู่ระบบผู้ดูแลระบบ: ${admin.full_name}`);
    } else {
      const member = users.find(u => u.user_role === 'Member') || users[0];
      setCurrentUserState(member);
      addToast('success', 'เข้าสู่ระบบสำเร็จ', `เข้าสู่ระบบสมาชิก: ${member.full_name}`);
    }
  };

  const registerUser = (name: string, studentId: string, email: string, pass: string): boolean => {
    if (!name || !studentId || !email) {
      addToast('error', 'เกิดข้อผิดพลาด', 'กรุณากรอกข้อมูลให้ครบถ้วน');
      return false;
    }
    const exists = users.some(u => u.student_id === studentId || u.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      addToast('warning', 'มีผู้ใช้นี้แล้ว', 'รหัสนักศึกษาหรืออีเมลนี้มีอยู่ในระบบแล้ว');
      return false;
    }

    const newUser: User = {
      user_id: `USR${String(users.length + 1).padStart(3, '0')}`,
      full_name: name,
      student_id: studentId,
      email: email,
      password: pass,
      user_role: 'Member',
      total_points: 50, // Welcome bonus points!
      total_carbon_saved: 0.00,
      avatar_url: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
      department: 'คณะวิทยาศาสตร์และเทคโนโลยี'
    };

    setUsers(prev => [...prev, newUser]);
    setCurrentUserState(newUser);

    // Add welcome transaction
    const welcomeTxn: PointTransaction = {
      transaction_id: `TXN${Date.now()}`,
      user_id: newUser.user_id,
      points_earned: 50,
      transaction_type: 'bonus',
      description: 'โบนัสต้อนรับสมาชิกใหม่ โครงการ EcoBin Connect',
      transaction_date: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    setTransactions(prev => [welcomeTxn, ...prev]);

    triggerConfetti();
    addToast('success', 'สมัครสมาชิกสำเร็จ!', `ยินดีต้อนรับคุณ ${name} (+50 แต้มโบนัสแรกเข้า)`);
    return true;
  };

  const loginUser = (emailOrStudentId: string, pass: string): boolean => {
    const query = emailOrStudentId.trim().toLowerCase();
    const user = users.find(u => 
      u.email.toLowerCase() === query || 
      u.student_id.toLowerCase() === query
    );
    if (user) {
      setCurrentUserState(user);
      addToast('success', 'เข้าสู่ระบบสำเร็จ', `ยินดีต้อนรับ ${user.full_name}`);
      return true;
    } else {
      addToast('error', 'เข้าสู่ระบบไม่สำเร็จ', 'ไม่พบบัญชีผู้ใช้ หรือรหัสผ่านไม่ถูกต้อง');
      return false;
    }
  };

  const logout = () => {
    setGuestMode();
  };

  const updateUserProfile = (data: Partial<User>): boolean => {
    if (!currentUser) {
      addToast('error', 'ไม่สามารถแก้ไขได้', 'กรุณาเข้าสู่ระบบก่อนทำการแก้ไขโปรไฟล์');
      return false;
    }

    const updatedUser: User = {
      ...currentUser,
      ...data,
      // preserve immutable metrics
      user_id: currentUser.user_id,
      user_role: currentUser.user_role,
      total_points: currentUser.total_points,
      total_carbon_saved: currentUser.total_carbon_saved
    };

    setUsers(prev => prev.map(u => u.user_id === currentUser.user_id ? updatedUser : u));
    setCurrentUserState(updatedUser);
    addToast('success', 'บันทึกโปรไฟล์สำเร็จ', 'ข้อมูลส่วนตัวของคุณได้รับการอัปเดตแล้ว');
    return true;
  };

  // Add Waste Record (Member)
  const addWasteRecord = (data: {
    imageUrl: string;
    plasticType: string;
    bottleCount: number;
    binLocation?: string;
  }): WasteRecord => {
    const now = new Date();
    const formattedDate = now.toISOString().replace('T', ' ').substring(0, 19);
    const count = data.bottleCount || 1;
    const earnedPoints = count * 10; // 10 points per bottle
    const carbonSaved = parseFloat((count * 0.08).toFixed(2)); // 0.08 kg CO2e per PET bottle

    const newRecord: WasteRecord = {
      record_id: `REC${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(Math.floor(1000 + Math.random() * 9000))}`,
      user_id: currentUser ? currentUser.user_id : 'GUEST',
      user_name: currentUser ? currentUser.full_name : 'ผู้ใช้งานทั่วไป (Guest)',
      student_id: currentUser ? currentUser.student_id : '-',
      image_url: data.imageUrl,
      plastic_type: data.plasticType,
      bottle_count: count,
      upload_timestamp: formattedDate,
      verification_status: 'อนุมัติแล้ว', // Auto-verified by smart vision model
      carbon_saved: carbonSaved,
      points_awarded: earnedPoints,
      admin_comment: 'ระบบอัจฉริยะ (AI Vision) ตรวจสอบผ่าน: พลาสติกขวด PET/HDPE ตรงตามเกณฑ์',
      bin_location: data.binLocation || 'จุดคัดแยกหน้าอาคาร 1 คณะวิทยาศาสตร์ฯ'
    };

    setWasteRecords(prev => [newRecord, ...prev]);

    if (currentUser) {
      // Update User Points & Carbon
      setUsers(prev => prev.map(u => {
        if (u.user_id === currentUser.user_id) {
          return {
            ...u,
            total_points: u.total_points + earnedPoints,
            total_carbon_saved: parseFloat((u.total_carbon_saved + carbonSaved).toFixed(2))
          };
        }
        return u;
      }));

      // Update current user state as well
      setCurrentUserState(prev => prev ? {
        ...prev,
        total_points: prev.total_points + earnedPoints,
        total_carbon_saved: parseFloat((prev.total_carbon_saved + carbonSaved).toFixed(2))
      } : null);

      // Create Point Transaction
      const newTxn: PointTransaction = {
        transaction_id: `TXN${Date.now()}`,
        user_id: currentUser.user_id,
        record_id: newRecord.record_id,
        points_earned: earnedPoints,
        transaction_type: 'earn',
        description: `คัดแยกขวดพลาสติก ${data.plasticType} จำนวน ${count} ขวด (${newRecord.bin_location})`,
        transaction_date: formattedDate
      };
      setTransactions(prev => [newTxn, ...prev]);

      triggerConfetti();
      addToast('success', 'บันทึกสำเร็จ!', `ได้รับ +${earnedPoints} แต้ม (ลดก๊าซคาร์บอน ${carbonSaved} kg CO₂e)`);
    }

    return newRecord;
  };

  // Add Guest Waste Log
  const addGuestWasteRecord = (data: {
    imageUrl: string;
    detectedBottles: number;
    scanResult: string;
  }): LocalStorageLog => {
    const now = new Date();
    const guestLog: LocalStorageLog = {
      guest_session_id: `GST-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      device_id: 'POCO-X6-PRO-BROWSER',
      temp_image_path: data.imageUrl,
      temp_scan_result: data.scanResult,
      detected_bottles: data.detectedBottles,
      estimated_points: data.detectedBottles * 10,
      timestamp: now.toISOString().replace('T', ' ').substring(0, 19)
    };

    setGuestLogs(prev => [guestLog, ...prev]);
    addToast('info', 'จำลองการตรวจสอบสำเร็จ (Guest)', `ตรวจพบขวดพลาสติก ${data.detectedBottles} ขวด (สามารถสมัครสมาชิกเพื่อเริ่มสะสมแต้มจริงได้)`);
    return guestLog;
  };

  // Verify / Review Waste Record (Admin)
  const verifyWasteRecord = (
    recordId: string,
    status: 'อนุมัติแล้ว' | 'ไม่อนุมัติ',
    comment: string,
    adjustedPoints?: number
  ) => {
    const record = wasteRecords.find(r => r.record_id === recordId);
    if (!record) return;

    const prevStatus = record.verification_status;
    const finalPoints = adjustedPoints !== undefined ? adjustedPoints : (status === 'อนุมัติแล้ว' ? (record.points_awarded || record.bottle_count * 10) : 0);

    setWasteRecords(prev => prev.map(r => {
      if (r.record_id === recordId) {
        return {
          ...r,
          verification_status: status,
          admin_comment: comment,
          points_awarded: finalPoints,
          carbon_saved: status === 'อนุมัติแล้ว' ? (r.bottle_count * 0.08) : 0
        };
      }
      return r;
    }));

    // If changing from pending or rejected to approved, award points
    if (status === 'อนุมัติแล้ว' && prevStatus !== 'อนุมัติแล้ว') {
      setUsers(prev => prev.map(u => {
        if (u.user_id === record.user_id) {
          return {
            ...u,
            total_points: u.total_points + finalPoints,
            total_carbon_saved: parseFloat((u.total_carbon_saved + (record.bottle_count * 0.08)).toFixed(2))
          };
        }
        return u;
      }));

      // Add transaction
      const newTxn: PointTransaction = {
        transaction_id: `TXN${Date.now()}`,
        user_id: record.user_id,
        record_id: record.record_id,
        points_earned: finalPoints,
        transaction_type: 'earn',
        description: `อนุมัติภาพถ่ายขยะ (${record.plastic_type}) +${finalPoints} แต้ม`,
        transaction_date: new Date().toISOString().replace('T', ' ').substring(0, 19)
      };
      setTransactions(prev => [newTxn, ...prev]);
    }

    addToast(
      status === 'อนุมัติแล้ว' ? 'success' : 'warning',
      `อัปเดตผลการตรวจสอบ (${status})`,
      `รายการ ${recordId}: ${comment}`
    );
  };

  // Redeem Reward Simulation (Chapter 3.3.3.5 / Table 3.7)
  const redeemReward = (rewardId: string): { success: boolean; message: string; redemption?: RedemptionSimulation } => {
    if (!currentUser) {
      addToast('warning', 'กรุณาเข้าสู่ระบบ', 'ผู้ใช้งานทั่วไป (Guest) ต้องเข้าสู่ระบบสมาชิกก่อนทำรายการแลกของรางวัล');
      return { success: false, message: 'กรุณาเข้าสู่ระบบสมาชิกก่อนทำรายการ' };
    }

    const reward = rewards.find(r => r.reward_id === rewardId);
    if (!reward) {
      addToast('error', 'ไม่พบของรางวัล', 'ไม่พบรหัสของรางวัลในระบบ');
      return { success: false, message: 'ไม่พบของรางวัล' };
    }

    if (reward.reward_stock <= 0) {
      addToast('error', 'สินค้าหมด', 'ขออภัย ของรางวัลนี้หมดสต็อกชั่วคราว');
      return { success: false, message: 'ของรางวัลหมดสต็อก' };
    }

    if (currentUser.total_points < reward.points_required) {
      const shortage = reward.points_required - currentUser.total_points;
      addToast('warning', 'แต้มสะสมไม่เพียงพอ', `ต้องการแต้มสะสม ${reward.points_required} แต้ม (ขาดอีก ${shortage} แต้ม)`);
      return { success: false, message: `แต้มสะสมไม่เพียงพอ (ขาดอีก ${shortage} แต้ม)` };
    }

    // Deduct user points
    const newPoints = currentUser.total_points - reward.points_required;
    setUsers(prev => prev.map(u => {
      if (u.user_id === currentUser.user_id) {
        return { ...u, total_points: newPoints };
      }
      return u;
    }));

    setCurrentUserState(prev => prev ? { ...prev, total_points: newPoints } : null);

    // Reduce stock
    setRewards(prev => prev.map(r => {
      if (r.reward_id === rewardId) {
        return { ...r, reward_stock: r.reward_stock - 1 };
      }
      return r;
    }));

    const now = new Date();
    const pickupCode = `PCRU-ECO-${Math.floor(1000 + Math.random() * 9000)}`;

    const newRedemption: RedemptionSimulation = {
      redeem_id: `RDM${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(Math.floor(1000 + Math.random() * 9000))}`,
      user_id: currentUser.user_id,
      user_name: currentUser.full_name,
      student_id: currentUser.student_id,
      reward_id: reward.reward_id,
      reward_name: reward.reward_name,
      reward_image: reward.reward_image,
      points_used: reward.points_required,
      redeem_date: now.toISOString().replace('T', ' ').substring(0, 19),
      redeem_status: 'สำเร็จ',
      pickup_code: pickupCode
    };

    setRedemptions(prev => [newRedemption, ...prev]);

    // Log transaction
    const newTxn: PointTransaction = {
      transaction_id: `TXN${Date.now()}`,
      user_id: currentUser.user_id,
      points_earned: -reward.points_required,
      transaction_type: 'redeem',
      description: `แลกของรางวัล: ${reward.reward_name} (รหัสรับของ: ${pickupCode})`,
      transaction_date: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    setTransactions(prev => [newTxn, ...prev]);

    triggerConfetti();
    addToast('success', 'ทำรายการแลกรางวัลสำเร็จ!', `แลก ${reward.reward_name} ใช้ ${reward.points_required} แต้ม`);

    return { success: true, message: 'ทำรายการแลกรางวัลสำเร็จ', redemption: newRedemption };
  };

  const addReward = (rewardData: Omit<Reward, 'reward_id'>) => {
    const newReward: Reward = {
      ...rewardData,
      reward_id: `REW${String(rewards.length + 1).padStart(3, '0')}`
    };
    setRewards(prev => [...prev, newReward]);
    addToast('success', 'เพิ่มของรางวัลสำเร็จ', `เพิ่ม "${newReward.reward_name}" ในแคตตาล็อกแล้ว`);
  };

  const updateReward = (rewardId: string, data: Partial<Reward>) => {
    setRewards(prev => prev.map(r => r.reward_id === rewardId ? { ...r, ...data } : r));
    addToast('success', 'อัปเดตข้อมูลของรางวัล', `บันทึกการแก้ไขรายการของรางวัลแล้ว`);
  };

  const deleteReward = (rewardId: string) => {
    const reward = rewards.find(r => r.reward_id === rewardId);
    setRewards(prev => prev.filter(r => r.reward_id !== rewardId));
    addToast('info', 'ลบของรางวัลแล้ว', `ลบรายการ "${reward?.reward_name}" เรียบร้อย`);
  };

  const currentRole: UserRole = currentUser ? currentUser.user_role : 'Guest';

  return (
    <AppContext.Provider
      value={{
        currentUser,
        currentRole,
        users,
        wasteRecords,
        rewards,
        transactions,
        redemptions,
        guestLogs,
        toasts,
        language,
        setLanguage,
        setCurrentUser,
        switchUser,
        setGuestMode,
        loginAs,
        registerUser,
        loginUser,
        updateUserProfile,
        logout,
        addWasteRecord,
        addGuestWasteRecord,
        verifyWasteRecord,
        redeemReward,
        addReward,
        updateReward,
        deleteReward,
        addToast,
        removeToast,
        triggerConfetti
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
