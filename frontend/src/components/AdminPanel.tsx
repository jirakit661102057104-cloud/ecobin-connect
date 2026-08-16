'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Reward, WasteRecord, User, SmartBin, PlasticType } from '../types';
import { api } from '../lib/api';
import { matchBottleScore } from '../lib/bottleScore';
import { persistAdminTab, restoreAdminTab } from '../lib/navState';
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Users, 
  Gift, 
  BarChart3, 
  Plus, 
  Trash2, 
  Edit3, 
  X,
  GitBranch,
  Ticket,
  Search,
  MapPin,
  SlidersHorizontal,
  RefreshCw
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend
} from 'recharts';

export const AdminPanel: React.FC = () => {
  const { 
    wasteRecords, 
    verifyWasteRecord, 
    users, 
    rewards, 
    addReward, 
    updateReward, 
    deleteReward,
    redemptions,
    bins,
    plasticTypes,
    settings,
    currentUser,
    claimRedeem,
    cancelRedeem,
    saveBin,
    deleteBin,
    savePlastic,
    deletePlastic,
    updateAppSettings,
    updateAdminUser,
    deactivateUser,
    addToast,
  } = useApp();

  const [activeAdminTab, setActiveAdminTabState] = useState<'overview' | 'verify' | 'users' | 'rewards' | 'redemptions' | 'bins' | 'rules' | 'relations'>('overview');
  const [adminTabReady, setAdminTabReady] = useState(false);
  const [userQuery, setUserQuery] = useState('');
  const [verifyStatusFilter, setVerifyStatusFilter] = useState<'ทั้งหมด' | 'รอการตรวจสอบ' | 'อนุมัติแล้ว' | 'ไม่อนุมัติ' | 'กรุณาส่งภาพมาใหม่'>('รอการตรวจสอบ');
  const [verifyQuery, setVerifyQuery] = useState('');
  const [verifyBin, setVerifyBin] = useState('ทั้งหมด');
  const [verifyPlastic, setVerifyPlastic] = useState('ทั้งหมด');
  const [relationData, setRelationData] = useState<{
    explanations: { parent: string; child: string; join: string; meaning: string }[];
    users_1m: { user_id: string; full_name: string; student_id: string; waste_count: number; txn_count: number; redeem_count: number }[];
    rewards_1m: { reward_id: string; reward_name: string; redeem_count: number }[];
  } | null>(null);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [parentChildren, setParentChildren] = useState<{
    parent: { full_name: string; student_id: string };
    waste_records: WasteRecord[];
    point_transactions: { transaction_id: string; transaction_type: string; points_earned: number; description: string }[];
    redemptions: { redeem_id: string; reward_name: string; points_used: number; pickup_code: string }[];
  } | null>(null);

  // State for Review Modal
  const [selectedRecordToVerify, setSelectedRecordToVerify] = useState<WasteRecord | null>(null);
  const [verifyStatus, setVerifyStatus] = useState<'อนุมัติแล้ว' | 'ไม่อนุมัติ' | 'กรุณาส่งภาพมาใหม่'>('อนุมัติแล้ว');
  const [verifyComment, setVerifyComment] = useState('');
  const [verifyPoints, setVerifyPoints] = useState<number>(30);

  // State for Add/Edit Reward Modal
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [editingRewardId, setEditingRewardId] = useState<string | null>(null);
  const [rewardForm, setRewardForm] = useState({
    reward_name: '',
    points_required: 100,
    reward_description: '',
    reward_stock: 20,
    reward_image: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=500&auto=format&fit=crop&q=80',
    category: 'ของใช้รักษ์โลก' as Reward['category']
  });
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userDept, setUserDept] = useState('');
  const [userRole, setUserRole] = useState<'Admin' | 'Member'>('Member');
  const [pointsDelta, setPointsDelta] = useState(0);
  const [pointsReason, setPointsReason] = useState('');
  const [showBinModal, setShowBinModal] = useState(false);
  const [editingBin, setEditingBin] = useState<SmartBin | null>(null);
  const [binForm, setBinForm] = useState({ bin_name: '', status: 'พร้อมใช้งาน', capacity_note: '' });
  const [showPlasticModal, setShowPlasticModal] = useState(false);
  const [editingPlastic, setEditingPlastic] = useState<PlasticType | null>(null);
  const [plasticForm, setPlasticForm] = useState({
    display_name_th: '',
    short_name: '',
    full_name: '',
    points_per_bottle: 10,
    carbon_factor: 0.08,
  });
  const [rulesForm, setRulesForm] = useState(settings);

  useEffect(() => {
    setRulesForm(settings);
  }, [settings]);

  useEffect(() => {
    setActiveAdminTabState(restoreAdminTab() as typeof activeAdminTab);
    setAdminTabReady(true);
  }, []);

  useEffect(() => {
    if (adminTabReady) persistAdminTab(activeAdminTab);
  }, [activeAdminTab, adminTabReady]);

  const setActiveAdminTab = (tab: typeof activeAdminTab) => {
    setActiveAdminTabState(tab);
  };

  const openVerifyDialog = (record: WasteRecord) => {
    setSelectedRecordToVerify(record);
    setVerifyStatus('อนุมัติแล้ว');
    setVerifyPoints(
      record.verification_status === 'อนุมัติแล้ว'
        ? (record.points_awarded || 0)
        : record.bottle_count * matchBottleScore(plasticTypes, record.plastic_type, settings.points_per_bottle || 10, settings.carbon_per_bottle || 0.08).points
    );
    setVerifyComment(record.admin_comment || 'ตรวจสอบแล้ว ขยะขวดพลาสติกสะอาด ถูกต้อง');
  };

  const handleSaveVerification = () => {
    if (!selectedRecordToVerify) return;
    verifyWasteRecord(
      selectedRecordToVerify.record_id,
      verifyStatus,
      verifyComment,
      verifyPoints
    );
    setSelectedRecordToVerify(null);
  };

  const openAddRewardDialog = () => {
    setEditingRewardId(null);
    setRewardForm({
      reward_name: '',
      points_required: 80,
      reward_description: '',
      reward_stock: 30,
      reward_image: 'https://images.unsplash.com/photo-1597484661643-2f5fef640dd1?w=500&auto=format&fit=crop&q=80',
      category: 'ของใช้รักษ์โลก'
    });
    setShowRewardModal(true);
  };

  const openEditRewardDialog = (reward: Reward) => {
    setEditingRewardId(reward.reward_id);
    setRewardForm({
      reward_name: reward.reward_name,
      points_required: reward.points_required,
      reward_description: reward.reward_description,
      reward_stock: reward.reward_stock,
      reward_image: reward.reward_image,
      category: reward.category
    });
    setShowRewardModal(true);
  };

  const handleSaveReward = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rewardForm.reward_name) return;

    if (editingRewardId) {
      updateReward(editingRewardId, rewardForm);
    } else {
      addReward(rewardForm);
    }
    setShowRewardModal(false);
  };

  const openUserEditor = (user: User) => {
    setEditingUser(user);
    setUserDept(user.department || '');
    setUserRole(user.user_role === 'Admin' ? 'Admin' : 'Member');
    setPointsDelta(0);
    setPointsReason('');
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    await updateAdminUser(editingUser.user_id, {
      user_role: userRole,
      department: userDept,
      points_delta: pointsDelta || undefined,
      reason: pointsReason,
    });
    setEditingUser(null);
  };

  const openBinDialog = (bin?: SmartBin) => {
    setEditingBin(bin || null);
    setBinForm({
      bin_name: bin?.bin_name || '',
      status: bin?.status || 'พร้อมใช้งาน',
      capacity_note: bin?.capacity_note || '',
    });
    setShowBinModal(true);
  };

  const handleSaveBin = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveBin({
      bin_id: editingBin?.bin_id,
      bin_name: binForm.bin_name,
      status: binForm.status,
      capacity_note: binForm.capacity_note,
    });
    setShowBinModal(false);
  };

  const openPlasticDialog = (item?: PlasticType) => {
    setEditingPlastic(item || null);
    setPlasticForm({
      display_name_th: item?.display_name_th || '',
      short_name: item?.short_name || '',
      full_name: item?.full_name || '',
      points_per_bottle: item?.points_per_bottle ?? 10,
      carbon_factor: item?.carbon_factor ?? 0.08,
    });
    setShowPlasticModal(true);
  };

  const handleSavePlastic = async (e: React.FormEvent) => {
    e.preventDefault();
    await savePlastic({
      plastic_code: editingPlastic?.plastic_code,
      display_name_th: plasticForm.display_name_th,
      short_name: plasticForm.short_name,
      full_name: plasticForm.full_name || plasticForm.display_name_th,
      points_per_bottle: plasticForm.points_per_bottle,
      carbon_factor: plasticForm.carbon_factor,
    });
    setShowPlasticModal(false);
  };

  const handleClaimPickup = async (code: string) => {
    try {
      await claimRedeem(code);
      addToast('success', 'จ่ายของแล้ว', code);
    } catch (e) {
      addToast('error', 'จ่ายของไม่สำเร็จ', e instanceof Error ? e.message : '');
    }
  };

  const handleCancelPickup = async (code: string) => {
    try {
      await cancelRedeem(code);
      addToast('info', 'ยกเลิกและคืนแต้มแล้ว', code);
    } catch (e) {
      addToast('error', 'ยกเลิกไม่สำเร็จ', e instanceof Error ? e.message : '');
    }
  };

  useEffect(() => {
    if (activeAdminTab !== 'relations') return;
    api<NonNullable<typeof relationData>>('/api/admin/relations')
      .then(setRelationData)
      .catch(() => setRelationData(null));
  }, [activeAdminTab]);

  const openUserChildren = async (userId: string) => {
    setSelectedParentId(userId);
    const data = await api<NonNullable<typeof parentChildren>>(`/api/admin/relations/users/${userId}`);
    setParentChildren(data);
  };

  const pendingRecords = wasteRecords.filter((r) => r.verification_status === 'รอการตรวจสอบ');
  const approvedRecords = wasteRecords.filter((r) => r.verification_status === 'อนุมัติแล้ว');
  const pendingPickups = redemptions.filter((r) => r.redeem_status === 'รอรับของรางวัล');
  const totalCampusBottles = approvedRecords.reduce((acc, r) => acc + r.bottle_count, 0);
  const totalCampusCarbon = approvedRecords.reduce((acc, r) => acc + r.carbon_saved, 0);
  const memberCount = users.filter((u) => u.user_role === 'Member').length;
  const verifyBins = useMemo(() => {
    const names = new Set<string>();
    wasteRecords.forEach((r) => { if (r.bin_location) names.add(r.bin_location); });
    bins.forEach((b) => names.add(b.bin_name));
    return ['ทั้งหมด', ...[...names].sort()];
  }, [wasteRecords, bins]);
  const verifyPlastics = useMemo(() => {
    const names = new Set<string>();
    wasteRecords.forEach((r) => { if (r.plastic_type) names.add(r.plastic_type); });
    return ['ทั้งหมด', ...[...names].sort()];
  }, [wasteRecords]);
  const filteredVerify = useMemo(() => {
    const q = verifyQuery.trim().toLowerCase();
    const pending = wasteRecords.filter((r) => r.verification_status === 'รอการตรวจสอบ');
    const rest = wasteRecords.filter((r) => r.verification_status !== 'รอการตรวจสอบ');
    return [...pending, ...rest].filter((r) => {
      if (verifyStatusFilter !== 'ทั้งหมด' && r.verification_status !== verifyStatusFilter) return false;
      if (verifyBin !== 'ทั้งหมด' && (r.bin_location || '') !== verifyBin) return false;
      if (verifyPlastic !== 'ทั้งหมด' && r.plastic_type !== verifyPlastic) return false;
      if (!q) return true;
      return [r.user_name, r.student_id, r.record_id, r.plastic_type, r.bin_location, r.admin_comment]
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [wasteRecords, verifyStatusFilter, verifyQuery, verifyBin, verifyPlastic]);
  const filteredUsers = users.filter((u) => {
    const q = userQuery.trim().toLowerCase();
    if (!q) return true;
    return [u.full_name, u.email, u.student_id, u.user_role].join(' ').toLowerCase().includes(q);
  });

  const plasticDistribution = useMemo(() => {
    const map = new Map<string, number>();
    approvedRecords.forEach((r) => map.set(r.plastic_type || 'อื่นๆ', (map.get(r.plastic_type) || 0) + r.bottle_count));
    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#f43f5e', '#14b8a6', '#64748b'];
    return [...map.entries()].map(([name, value], i) => ({ name, value, color: colors[i % colors.length] }));
  }, [wasteRecords]);

  const buildingStats = useMemo(() => {
    const map = new Map<string, number>();
    approvedRecords.forEach((r) => {
      const loc = r.bin_location || 'ไม่ระบุจุด';
      map.set(loc, (map.get(loc) || 0) + r.bottle_count);
    });
    return [...map.entries()].map(([name, bottles]) => ({ name, bottles })).sort((a, b) => b.bottles - a.bottles).slice(0, 8);
  }, [wasteRecords]);

  return (
    <div className="space-y-4">
      
      {/* Admin Header Banner */}
      <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-lg bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-400/20">
              <ShieldCheck className="w-3.5 h-3.5" />
            </span>
            <span className="text-xs text-purple-300 font-medium">แผงควบคุมระบบ (Admin)</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            แผงควบคุมผู้ดูแลระบบ
          </h2>
          <p className="text-xs text-purple-200 mt-0.5 max-w-xl">
            ตรวจรูป อนุมัติแต้ม จัดการสมาชิก จุดทิ้ง ของรางวัล คิวรับของ และกฎแต้ม — แก้แล้วมีผลกับโปรแกรมทันที
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-2 bg-white/10 px-3.5 py-2 rounded-xl text-xs text-purple-100 border border-white/10">
            <span>รอตรวจรูป:</span>
            <span className="font-bold text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded-md">{pendingRecords.length}</span>
          </div>
          <div className="flex items-center gap-2 bg-white/10 px-3.5 py-2 rounded-xl text-xs text-purple-100 border border-white/10">
            <span>รอรับของ:</span>
            <span className="font-bold text-sky-200 bg-sky-400/20 px-2 py-0.5 rounded-md">{pendingPickups.length}</span>
          </div>
        </div>
      </div>

      {/* Admin Subnav Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {([
          { id: 'overview' as const, label: 'ภาพรวม', icon: BarChart3 },
          { id: 'verify' as const, label: `รอตรวจ (${pendingRecords.length})`, icon: CheckCircle2 },
          { id: 'users' as const, label: `สมาชิก (${memberCount})`, icon: Users },
          { id: 'rewards' as const, label: 'ของรางวัล', icon: Gift },
          { id: 'redemptions' as const, label: `คิวรับของ (${pendingPickups.length})`, icon: Ticket },
          { id: 'bins' as const, label: `จุดทิ้ง (${bins.length})`, icon: MapPin },
          { id: 'rules' as const, label: 'กฎระบบ', icon: SlidersHorizontal },
          { id: 'relations' as const, label: 'ประวัติผู้ใช้', icon: GitBranch },
        ]).map((tab) => (
          <button
            key={tab.id}
            id={`admin-tab-${tab.id}`}
            onClick={() => setActiveAdminTab(tab.id)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeAdminTab === tab.id
                ? 'bg-purple-700 text-white shadow-2xs'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Admin Tab 1: Verify Waste Records Queue */}
      {activeAdminTab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'รอตรวจรูป', value: pendingRecords.length, hint: 'ต้องอนุมัติก่อนให้แต้ม' },
              { label: 'สมาชิก', value: memberCount, hint: 'บัญชี role Member' },
              { label: 'ขวดที่อนุมัติแล้ว', value: `${totalCampusBottles}`, hint: 'ทั้งวิทยาเขต' },
              { label: 'รอรับของรางวัล', value: pendingPickups.length, hint: 'มีรหัสรับของแล้ว' },
            ].map((k) => (
              <div key={k.label} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs">
                <span className="text-[11px] text-slate-400 block">{k.label}</span>
                <strong className="text-2xl font-extrabold text-slate-900">{k.value}</strong>
                <p className="text-[10px] text-slate-400 mt-1">{k.hint}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <button type="button" onClick={() => setActiveAdminTab('verify')} className="text-left bg-amber-50 border border-amber-100 rounded-2xl p-4 hover:bg-amber-100/70">
              <p className="text-xs font-bold text-amber-900">ตรวจรูปขยะ</p>
              <p className="text-[11px] text-amber-800/80 mt-1">อนุมัติหรือปฏิเสธ และปรับแต้มได้</p>
            </button>
            <button type="button" onClick={() => setActiveAdminTab('rewards')} className="text-left bg-purple-50 border border-purple-100 rounded-2xl p-4 hover:bg-purple-100/70">
              <p className="text-xs font-bold text-purple-900">จัดการของรางวัล</p>
              <p className="text-[11px] text-purple-800/80 mt-1">เพิ่ม แก้ สต็อก และแต้มที่ใช้แลก</p>
            </button>
            <button type="button" onClick={() => setActiveAdminTab('redemptions')} className="text-left bg-sky-50 border border-sky-100 rounded-2xl p-4 hover:bg-sky-100/70">
              <p className="text-xs font-bold text-sky-900">คิวรับของ</p>
              <p className="text-[11px] text-sky-800/80 mt-1">จ่ายของหรือยกเลิกคืนแต้มได้จากตาราง</p>
            </button>
            <button type="button" onClick={() => setActiveAdminTab('bins')} className="text-left bg-teal-50 border border-teal-100 rounded-2xl p-4 hover:bg-teal-100/70">
              <p className="text-xs font-bold text-teal-900">จุดทิ้งขยะ</p>
              <p className="text-[11px] text-teal-800/80 mt-1">เพิ่ม/ปิดจุดที่สมาชิกเลือกตอนสแกน</p>
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs">
              <span className="text-xs text-slate-400 block">ก๊าซเรือนกระจกที่ลดได้</span>
              <strong className="text-2xl font-extrabold text-teal-700">{totalCampusCarbon.toFixed(2)} kg CO₂e</strong>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs">
              <span className="text-xs text-slate-400 block">แลกรางวัลทั้งหมด</span>
              <strong className="text-2xl font-extrabold text-amber-700">{redemptions.length} ครั้ง</strong>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs">
              <span className="text-xs text-slate-400 block">รายการสแกนทั้งหมด</span>
              <strong className="text-2xl font-extrabold text-slate-900">{wasteRecords.length}</strong>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-slate-100 shadow-2xs space-y-3">
              <h4 className="text-xs font-bold text-slate-900">ปริมาณขวดที่อนุมัติ แยกตามจุดทิ้ง</h4>
              <div className="h-56">
                {buildingStats.length === 0 ? (
                  <p className="text-xs text-slate-400 pt-8 text-center">ยังไม่มีรายการที่อนุมัติ</p>
                ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={buildingStats} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" />
                    <XAxis dataKey="name" tick={{ fontSize: 9 }} interval={0} angle={-10} textAnchor="end" />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '10px', border: 'none', color: '#fff', fontSize: '11px' }} />
                    <Bar dataKey="bottles" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="จำนวนขวด" />
                  </BarChart>
                </ResponsiveContainer>
                )}
              </div>
            </div>
            <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-100 shadow-2xs space-y-3">
              <h4 className="text-xs font-bold text-slate-900">สัดส่วนประเภทพลาสติก (ที่อนุมัติแล้ว)</h4>
              <div className="h-56 flex items-center justify-center">
                {plasticDistribution.length === 0 ? (
                  <p className="text-xs text-slate-400">ยังไม่มีข้อมูล</p>
                ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={plasticDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={4}>
                      {plasticDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '10px', border: 'none', color: '#fff', fontSize: '11px' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeAdminTab === 'verify' && (
        <div className="space-y-3">
          <div className="bg-white rounded-2xl border border-slate-100 p-3 space-y-2.5">
            <div className="flex flex-wrap gap-1.5">
              {([
                { id: 'รอการตรวจสอบ' as const, label: `รอตรวจ (${pendingRecords.length})` },
                { id: 'ทั้งหมด' as const, label: `ทั้งหมด (${wasteRecords.length})` },
                { id: 'อนุมัติแล้ว' as const, label: `อนุมัติแล้ว (${approvedRecords.length})` },
                { id: 'กรุณาส่งภาพมาใหม่' as const, label: `ส่งภาพใหม่ (${wasteRecords.filter((r) => r.verification_status === 'กรุณาส่งภาพมาใหม่').length})` },
                { id: 'ไม่อนุมัติ' as const, label: `ไม่อนุมัติ (${wasteRecords.filter((r) => r.verification_status === 'ไม่อนุมัติ').length})` },
              ]).map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setVerifyStatusFilter(chip.id)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold ${
                    verifyStatusFilter === chip.id
                      ? 'bg-purple-700 text-white'
                      : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  value={verifyQuery}
                  onChange={(e) => setVerifyQuery(e.target.value)}
                  placeholder="ค้นหาชื่อ รหัส รายการ"
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>
              <select
                value={verifyBin}
                onChange={(e) => setVerifyBin(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
              >
                {verifyBins.map((name) => (
                  <option key={name} value={name}>{name === 'ทั้งหมด' ? 'จุดทิ้งทั้งหมด' : name}</option>
                ))}
              </select>
              <select
                value={verifyPlastic}
                onChange={(e) => setVerifyPlastic(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
              >
                {verifyPlastics.map((name) => (
                  <option key={name} value={name}>{name === 'ทั้งหมด' ? 'ประเภทพลาสติกทั้งหมด' : name}</option>
                ))}
              </select>
            </div>
            <p className="text-[11px] text-slate-400">แสดง {filteredVerify.length} รายการ</p>
          </div>
          {filteredVerify.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center text-sm text-slate-500">
              ไม่พบรายการตามตัวกรอง
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredVerify.map((record) => {
              const isPending = record.verification_status === 'รอการตรวจสอบ';
              return (
                <div 
                  key={record.record_id}
                  className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs space-y-2.5 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <img 
                          src={record.image_url} 
                          alt="" 
                          className="w-13 h-13 rounded-xl object-cover border border-slate-100 shrink-0"
                        />
                        <div>
                          <span className="text-[10px] font-mono text-slate-400 block">{record.record_id}</span>
                          <h4 className="font-bold text-xs text-slate-900">{record.user_name || 'ผู้ใช้งาน'}</h4>
                          <span className="text-[10px] text-slate-400">{record.upload_timestamp}</span>
                        </div>
                      </div>

                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                        record.verification_status === 'อนุมัติแล้ว' ? 'bg-emerald-50 text-emerald-800' :
                        record.verification_status === 'รอการตรวจสอบ' ? 'bg-amber-50 text-amber-800' :
                        record.verification_status === 'กรุณาส่งภาพมาใหม่' ? 'bg-sky-50 text-sky-800' :
                        'bg-rose-50 text-rose-800'
                      }`}>
                        {record.verification_status}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs space-y-0.5">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-500">ประเภท:</span>
                        <strong className="text-slate-800">{record.plastic_type} ({record.bottle_count} ขวด)</strong>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-500">จุดทิ้ง:</span>
                        <strong className="text-slate-700">{record.bin_location || '-'}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-slate-50">
                    <span className="text-xs font-bold text-emerald-700">
                      {record.verification_status === 'อนุมัติแล้ว'
                        ? `+${record.points_awarded} แต้ม`
                        : 'ยังไม่ให้แต้ม'}
                    </span>

                    <button
                      id={`verify-btn-${record.record_id}`}
                      onClick={() => openVerifyDialog(record)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        isPending
                          ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-2xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {isPending ? 'ตรวจสอบ' : 'แก้ไข'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </div>
      )}

      {/* Admin Tab 2: User Account Management */}
      {activeAdminTab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs overflow-hidden p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-xs font-bold text-slate-800">รายชื่อผู้ใช้งานในระบบ</h3>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                placeholder="ค้นหาชื่อ อีเมล รหัส"
                className="pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-xs w-52 outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-100">
                  <th className="p-2.5 font-semibold">User</th>
                  <th className="p-2.5 font-semibold">รหัส / อีเมล</th>
                  <th className="p-2.5 font-semibold">สิทธิ์</th>
                  <th className="p-2.5 font-semibold text-right">แต้ม</th>
                  <th className="p-2.5 font-semibold text-right">ลด CO₂e</th>
                  <th className="p-2.5 font-semibold"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredUsers.map((user) => (
                  <tr key={user.user_id} className="hover:bg-slate-50/50">
                    <td className="p-2.5 font-semibold text-slate-900 flex items-center gap-2">
                      <img src={user.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover" />
                      <span>{user.full_name}</span>
                    </td>
                    <td className="p-2.5 text-slate-500 font-mono text-[11px]">
                      {user.student_id}
                      <div className="text-slate-400 normal-case">{user.email}</div>
                    </td>
                    <td className="p-2.5">
                      <span className={`px-1.5 py-0.5 rounded font-bold text-[9px] ${
                        user.user_role === 'Admin' ? 'bg-purple-50 text-purple-700' : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {user.user_role}
                      </span>
                    </td>
                    <td className="p-2.5 text-right font-bold text-amber-700">{user.total_points}</td>
                    <td className="p-2.5 text-right font-bold text-emerald-700">{user.total_carbon_saved.toFixed(2)} kg</td>
                    <td className="p-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => openUserEditor(user)}
                        className="px-2 py-1 rounded-lg bg-purple-50 text-purple-800 text-[11px] font-bold hover:bg-purple-100"
                      >
                        จัดการ
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Admin Tab 3: Reward Catalog Management */}
      {activeAdminTab === 'rewards' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800">รายการของรางวัล</h3>
            <button
              id="admin-add-reward-btn"
              onClick={openAddRewardDialog}
              className="flex items-center gap-1 px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>เพิ่มของรางวัล</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {rewards.map((reward) => (
              <div key={reward.reward_id} className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-2xs space-y-2.5 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="relative h-28 rounded-xl overflow-hidden bg-slate-100">
                    <img src={reward.reward_image} alt="" className="w-full h-full object-cover" />
                    <span className="absolute top-2 right-2 bg-emerald-600 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">
                      คงเหลือ {reward.reward_stock}
                    </span>
                  </div>

                  <h4 className="font-bold text-xs text-slate-900 leading-snug">{reward.reward_name}</h4>
                  
                  <div className="flex items-center justify-between text-xs pt-0.5">
                    <span className="text-slate-400 text-[10px]">{reward.category}</span>
                    <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full text-xs">
                      {reward.points_required} แต้ม
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 pt-2 border-t border-slate-50">
                  <button
                    onClick={() => openEditRewardDialog(reward)}
                    className="flex-1 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>แก้ไข</span>
                  </button>
                  <button
                    onClick={() => deleteReward(reward.reward_id)}
                    className="p-1 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors cursor-pointer"
                    title="ลบของรางวัล"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeAdminTab === 'redemptions' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs overflow-hidden p-4 space-y-3">
          <h3 className="text-xs font-bold text-slate-800">รายการแลกของรางวัล</h3>
          <p className="text-[11px] text-slate-500">สแกน QR จากเมนู «สแกน QR» หรือให้นิสิตบอกรหัสรับของ แล้วตรวจในตารางนี้ก่อนจ่ายของ</p>
          {redemptions.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">ยังไม่มีรายการแลก</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 border-b border-slate-100">
                    <th className="p-2.5 font-semibold">วันที่</th>
                    <th className="p-2.5 font-semibold">ผู้แลก</th>
                    <th className="p-2.5 font-semibold">ของรางวัล</th>
                    <th className="p-2.5 font-semibold">แต้ม</th>
                    <th className="p-2.5 font-semibold">รหัสรับของ</th>
                    <th className="p-2.5 font-semibold">สถานะ</th>
                    <th className="p-2.5 font-semibold"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {redemptions.map((r) => (
                    <tr key={r.redeem_id} className="hover:bg-slate-50/50">
                      <td className="p-2.5 text-slate-500 whitespace-nowrap">{r.redeem_date}</td>
                      <td className="p-2.5">
                        <div className="font-semibold text-slate-800">{r.user_name || r.user_id}</div>
                        <div className="text-[10px] text-slate-400">{r.student_id}</div>
                      </td>
                      <td className="p-2.5 text-slate-800">{r.reward_name}</td>
                      <td className="p-2.5 font-bold text-amber-700">{r.points_used}</td>
                      <td className="p-2.5 font-mono font-bold text-purple-800">{r.pickup_code}</td>
                      <td className="p-2.5">
                        <span className={`px-1.5 py-0.5 rounded font-bold text-[9px] ${
                          r.redeem_status === 'รอรับของรางวัล' ? 'bg-sky-50 text-sky-800' :
                          r.redeem_status === 'ยกเลิก' ? 'bg-slate-100 text-slate-600' :
                          'bg-emerald-50 text-emerald-700'
                        }`}>
                          {r.redeem_status}
                        </span>
                      </td>
                      <td className="p-2.5 whitespace-nowrap">
                        {r.redeem_status === 'รอรับของรางวัล' && (
                          <div className="flex gap-1">
                            <button type="button" onClick={() => handleClaimPickup(r.pickup_code)} className="px-2 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-bold">จ่ายของ</button>
                            <button type="button" onClick={() => handleCancelPickup(r.pickup_code)} className="px-2 py-1 rounded-lg bg-slate-100 text-slate-700 text-[10px] font-bold">ยกเลิก</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeAdminTab === 'bins' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-800">จุดทิ้งขยะในวิทยาเขต</h3>
              <p className="text-[11px] text-slate-500">รายการนี้ไปโผล่ในหน้าสแกนของสมาชิกทันที</p>
            </div>
            <button type="button" onClick={() => openBinDialog()} className="flex items-center gap-1 px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold">
              <Plus className="w-3.5 h-3.5" />
              เพิ่มจุดทิ้ง
            </button>
          </div>
          {bins.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center text-sm text-slate-500">ยังไม่มีจุดทิ้ง</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {bins.map((bin) => (
                <div key={bin.bin_id} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-mono text-slate-400">{bin.bin_id}</p>
                    <h4 className="font-bold text-xs text-slate-900">{bin.bin_name}</h4>
                    <p className="text-[11px] text-slate-500 mt-1">{bin.status}{bin.capacity_note ? ` · ความจุ ${bin.capacity_note}` : ''}</p>
                  </div>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => openBinDialog(bin)} className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100"><Edit3 className="w-3.5 h-3.5 text-slate-600" /></button>
                    <button type="button" onClick={() => deleteBin(bin.bin_id)} className="p-1.5 rounded-lg hover:bg-rose-50"><Trash2 className="w-3.5 h-3.5 text-rose-600" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeAdminTab === 'rules' && (
        <div className="space-y-4">
        <form
          className="bg-white rounded-2xl border border-slate-100 shadow-2xs p-5 space-y-4 max-w-3xl"
          onSubmit={(e) => {
            e.preventDefault();
            updateAppSettings(rulesForm);
          }}
        >
          <div>
            <h3 className="text-sm font-bold text-slate-900">ค่าเริ่มต้น (ถ้าไม่ตรงชนิดขวด)</h3>
            <p className="text-[11px] text-slate-500">ใช้เมื่อชนิดขวดในภาพไม่ตรงกับรายการด้านล่าง — แต้มจริงเข้าบัญชีเมื่อแอดมินอนุมัติเท่านั้น</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block text-xs font-semibold text-slate-700">
            แต้มต่อขวด (ค่าเริ่มต้น)
            <input type="number" min={0} value={rulesForm.points_per_bottle} onChange={(e) => setRulesForm({ ...rulesForm, points_per_bottle: Number(e.target.value) })} className="mt-1 w-full p-2 rounded-xl border border-slate-200 bg-slate-50" />
          </label>
          <label className="block text-xs font-semibold text-slate-700">
            kg CO₂e ต่อขวด (ค่าเริ่มต้น)
            <input type="number" min={0} step="0.01" value={rulesForm.carbon_per_bottle} onChange={(e) => setRulesForm({ ...rulesForm, carbon_per_bottle: Number(e.target.value) })} className="mt-1 w-full p-2 rounded-xl border border-slate-200 bg-slate-50" />
          </label>
          </div>
          <label className="block text-xs font-semibold text-slate-700">
            ประกาศถึงสมาชิก (หน้าหลัก)
            <textarea rows={3} value={rulesForm.announcement} onChange={(e) => setRulesForm({ ...rulesForm, announcement: e.target.value })} className="mt-1 w-full p-2 rounded-xl border border-slate-200 bg-slate-50" placeholder="ว่างไว้ถ้าไม่ต้องการประกาศ" />
          </label>
          <button type="submit" className="px-4 py-2 rounded-xl bg-purple-700 text-white text-xs font-bold">บันทึกค่าเริ่มต้น</button>
        </form>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs p-5 space-y-3 max-w-3xl">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">ชนิดขวดและแต้ม</h3>
              <p className="text-[11px] text-slate-500">เพิ่มขวดใหม่ กำหนดแต้ม/ขวด แก้ไขหรือลบได้ — ตอนอนุมัติระบบจับคู่จากชื่อประเภทในภาพ</p>
            </div>
            <button type="button" onClick={() => openPlasticDialog()} className="flex items-center gap-1 px-3 py-1.5 bg-purple-700 text-white rounded-xl text-xs font-bold">
              <Plus className="w-3.5 h-3.5" />
              เพิ่มขวด
            </button>
          </div>
          {plasticTypes.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">ยังไม่มีชนิดขวด</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 border-b border-slate-100">
                    <th className="p-2.5 font-semibold">ชื่อขวด</th>
                    <th className="p-2.5 font-semibold">ชื่อย่อ</th>
                    <th className="p-2.5 font-semibold text-right">แต้ม/ขวด</th>
                    <th className="p-2.5 font-semibold text-right">kg CO₂e</th>
                    <th className="p-2.5 font-semibold"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {plasticTypes.map((p) => (
                    <tr key={p.plastic_code} className="hover:bg-slate-50/50">
                      <td className="p-2.5 font-semibold text-slate-800">{p.display_name_th}</td>
                      <td className="p-2.5 text-slate-500">{p.short_name}</td>
                      <td className="p-2.5 text-right font-bold text-amber-700">{p.points_per_bottle}</td>
                      <td className="p-2.5 text-right text-teal-700">{p.carbon_factor}</td>
                      <td className="p-2.5 text-right whitespace-nowrap">
                        <button type="button" onClick={() => openPlasticDialog(p)} className="px-2 py-1 rounded-lg bg-slate-50 text-slate-700 font-bold mr-1">แก้ไข</button>
                        <button type="button" onClick={() => deletePlastic(p.plastic_code)} className="px-2 py-1 rounded-lg text-rose-600 font-bold">ลบ</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        </div>
      )}

      {activeAdminTab === 'relations' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs">
            <h4 className="text-sm font-bold text-slate-900 mb-1">ประวัติการใช้งานของสมาชิก</h4>
            <p className="text-xs text-slate-500 mb-3">
              คลิกชื่อผู้ใช้เพื่อดูรายการสแกน แต้ม และการแลกรางวัล
            </p>
            <div className="space-y-2">
              {(relationData?.explanations || []).map((e) => (
                <div key={`${e.parent}-${e.child}`} className="text-xs bg-slate-50 rounded-xl px-3 py-2 border border-slate-100">
                  <span className="font-bold text-purple-800">{e.parent}</span>
                  <span className="text-slate-400"> 1 → M </span>
                  <span className="font-bold text-emerald-800">{e.child}</span>
                  <p className="text-slate-600 mt-0.5">{e.meaning}</p>
                  <code className="text-[10px] text-slate-400">{e.join}</code>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs overflow-x-auto">
            <h4 className="text-xs font-bold text-slate-900 mb-2">สมาชิก — จำนวนรายการ (คลิกเพื่อดูรายละเอียด)</h4>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-slate-400 border-b border-slate-100">
                  <th className="py-2 font-semibold">ผู้ใช้ (ด้าน 1)</th>
                  <th className="py-2 font-semibold">ขยะ</th>
                  <th className="py-2 font-semibold">แต้ม</th>
                  <th className="py-2 font-semibold">แลกรางวัล</th>
                </tr>
              </thead>
              <tbody>
                {(relationData?.users_1m || []).map((u) => (
                  <tr
                    key={u.user_id}
                    onClick={() => openUserChildren(u.user_id)}
                    className={`border-b border-slate-50 cursor-pointer hover:bg-purple-50 ${selectedParentId === u.user_id ? 'bg-purple-50' : ''}`}
                  >
                    <td className="py-2 font-medium text-slate-800">{u.full_name}<div className="text-[10px] text-slate-400">{u.student_id}</div></td>
                    <td className="py-2">{u.waste_count}</td>
                    <td className="py-2">{u.txn_count}</td>
                    <td className="py-2">{u.redeem_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {parentChildren && (
            <div className="bg-white rounded-2xl p-4 border border-purple-100 shadow-2xs space-y-3">
              <h4 className="text-xs font-bold text-slate-900">
                ข้อมูลลูกของ {parentChildren.parent.full_name} ({parentChildren.parent.student_id})
              </h4>
              <p className="text-[11px] text-slate-500">waste_records {parentChildren.waste_records.length} รายการ · transactions {parentChildren.point_transactions.length} · redemptions {parentChildren.redemptions.length}</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {parentChildren.waste_records.slice(0, 6).map((w) => (
                  <div key={w.record_id} className="text-[11px] border border-slate-100 rounded-xl p-2">
                    <div className="font-semibold text-slate-800">{w.record_id}</div>
                    <div className="text-slate-500">{w.plastic_type} · {w.bottle_count} ขวด</div>
                    <div className="text-slate-400">{w.verification_status}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs">
            <h4 className="text-xs font-bold text-slate-900 mb-2">rewards 1:M redemptions</h4>
            <ul className="text-xs space-y-1">
              {(relationData?.rewards_1m || []).map((rw) => (
                <li key={rw.reward_id} className="flex justify-between border-b border-slate-50 py-1">
                  <span>{rw.reward_name}</span>
                  <span className="font-bold text-purple-700">{rw.redeem_count} ครั้ง</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Review & Verify Modal */}
      {selectedRecordToVerify && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-slate-100 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-purple-700" />
                <h3 className="text-sm font-bold text-slate-900">ตรวจสอบและยืนยันภาพ</h3>
              </div>
              <button 
                onClick={() => setSelectedRecordToVerify(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <img 
                src={selectedRecordToVerify.image_url} 
                alt="" 
                className="w-16 h-16 rounded-lg object-cover border border-slate-200"
              />
              <div className="text-xs space-y-0.5 flex-1">
                <p className="font-bold text-slate-900">{selectedRecordToVerify.user_name}</p>
                <p className="text-slate-500">ประเภท: {selectedRecordToVerify.plastic_type} ({selectedRecordToVerify.bottle_count} ขวด)</p>
                <p className="text-[10px] text-slate-400">{selectedRecordToVerify.upload_timestamp}</p>
              </div>
            </div>

            {/* Decision radio */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">ผลการพิจารณา:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setVerifyStatus('อนุมัติแล้ว')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    verifyStatus === 'อนุมัติแล้ว'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>อนุมัติ</span>
                </button>
                <button
                  type="button"
                  onClick={() => setVerifyStatus('ไม่อนุมัติ')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    verifyStatus === 'ไม่อนุมัติ'
                      ? 'border-rose-500 bg-rose-50 text-rose-800 ring-2 ring-rose-500/20'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <XCircle className="w-3.5 h-3.5 text-rose-600" />
                  <span>ไม่อนุมัติ</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setVerifyStatus('กรุณาส่งภาพมาใหม่');
                    setVerifyComment((prev) =>
                      prev && prev !== 'ตรวจสอบแล้ว ขยะขวดพลาสติกสะอาด ถูกต้อง'
                        ? prev
                        : 'ภาพไม่ชัดหรือไม่ตรงเกณฑ์ กรุณาถ่ายใหม่แล้วส่งอีกครั้ง'
                    );
                  }}
                  className={`col-span-2 p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    verifyStatus === 'กรุณาส่งภาพมาใหม่'
                      ? 'border-sky-500 bg-sky-50 text-sky-800 ring-2 ring-sky-500/20'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <RefreshCw className="w-3.5 h-3.5 text-sky-600" />
                  <span>กรุณาส่งภาพมาใหม่</span>
                </button>
              </div>
            </div>

            {/* Award Points Input */}
            {verifyStatus === 'อนุมัติแล้ว' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  แต้มที่จะมอบให้:
                </label>
                <input
                  type="number"
                  value={verifyPoints}
                  onChange={(e) => setVerifyPoints(Number(e.target.value))}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 font-bold"
                />
              </div>
            )}

            {/* Comment input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                บันทึกความเห็น:
              </label>
              <textarea
                value={verifyComment}
                onChange={(e) => setVerifyComment(e.target.value)}
                rows={2}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="ระบุคำแนะนำ..."
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setSelectedRecordToVerify(null)}
                className="flex-1 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSaveVerification}
                className="flex-1 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                บันทึก
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Add / Edit Reward Modal */}
      {showRewardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-slate-100 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                {editingRewardId ? 'แก้ไขของรางวัล' : 'เพิ่มของรางวัลใหม่'}
              </h3>
              <button onClick={() => setShowRewardModal(false)} className="text-slate-400 p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveReward} className="space-y-2.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-0.5">ชื่อของรางวัล:</label>
                <input
                  type="text"
                  required
                  value={rewardForm.reward_name}
                  onChange={(e) => setRewardForm({ ...rewardForm, reward_name: e.target.value })}
                  placeholder="เช่น แก้วน้ำเก็บความเย็น Eco PCRU"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-0.5">แต้มที่ใช้:</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={rewardForm.points_required}
                    onChange={(e) => setRewardForm({ ...rewardForm, points_required: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-0.5">สต็อก:</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={rewardForm.reward_stock}
                    onChange={(e) => setRewardForm({ ...rewardForm, reward_stock: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-0.5">หมวดหมู่:</label>
                <select
                  value={rewardForm.category}
                  onChange={(e) => setRewardForm({ ...rewardForm, category: e.target.value as any })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="ของใช้รักษ์โลก">ของใช้รักษ์โลก</option>
                  <option value="เครื่องดื่มและอาหาร">เครื่องดื่มและอาหาร</option>
                  <option value="อุปกรณ์การเรียน">อุปกรณ์การเรียน</option>
                  <option value="สิทธิพิเศษ">สิทธิพิเศษ</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-0.5">รูปภาพ URL:</label>
                <input
                  type="text"
                  required
                  value={rewardForm.reward_image}
                  onChange={(e) => setRewardForm({ ...rewardForm, reward_image: e.target.value })}
                  placeholder="https://..."
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-0.5">รายละเอียด:</label>
                <textarea
                  rows={2}
                  value={rewardForm.reward_description}
                  onChange={(e) => setRewardForm({ ...rewardForm, reward_description: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRewardModal(false)}
                  className="flex-1 py-2 border border-slate-200 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold shadow-xs transition-colors cursor-pointer"
                >
                  บันทึก
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <form onSubmit={handleSaveUser} className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">จัดการ {editingUser.full_name}</h3>
              <button type="button" onClick={() => setEditingUser(null)} className="text-slate-400"><X className="w-4 h-4" /></button>
            </div>
            <label className="block text-xs font-semibold">สิทธิ์
              <select value={userRole} onChange={(e) => setUserRole(e.target.value as 'Admin' | 'Member')} className="mt-1 w-full p-2 rounded-xl border border-slate-200 bg-slate-50">
                <option value="Member">Member</option>
                <option value="Admin">Admin</option>
              </select>
            </label>
            <label className="block text-xs font-semibold">คณะ/หน่วยงาน
              <input value={userDept} onChange={(e) => setUserDept(e.target.value)} className="mt-1 w-full p-2 rounded-xl border border-slate-200 bg-slate-50" />
            </label>
            <label className="block text-xs font-semibold">ปรับแต้ม (+ โบนัส / − หัก)
              <input type="number" value={pointsDelta} onChange={(e) => setPointsDelta(Number(e.target.value))} className="mt-1 w-full p-2 rounded-xl border border-slate-200 bg-slate-50" />
            </label>
            <label className="block text-xs font-semibold">เหตุผลปรับแต้ม
              <input value={pointsReason} onChange={(e) => setPointsReason(e.target.value)} placeholder="เช่น โบนัสกิจกรรมคณะ" className="mt-1 w-full p-2 rounded-xl border border-slate-200 bg-slate-50" />
            </label>
            <div className="flex gap-2 pt-1">
              {currentUser?.user_id !== editingUser.user_id && (
                <button
                  type="button"
                  onClick={async () => {
                    await deactivateUser(editingUser.user_id);
                    setEditingUser(null);
                  }}
                  className="px-3 py-2 rounded-xl border border-rose-200 text-rose-700 text-xs font-bold"
                >
                  ปิดบัญชี
                </button>
              )}
              <button type="button" onClick={() => setEditingUser(null)} className="flex-1 py-2 border rounded-xl text-xs font-semibold">ยกเลิก</button>
              <button type="submit" className="flex-1 py-2 bg-purple-700 text-white rounded-xl text-xs font-bold">บันทึก</button>
            </div>
          </form>
        </div>
      )}

      {showBinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <form onSubmit={handleSaveBin} className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold">{editingBin ? 'แก้ไขจุดทิ้ง' : 'เพิ่มจุดทิ้ง'}</h3>
              <button type="button" onClick={() => setShowBinModal(false)} className="text-slate-400"><X className="w-4 h-4" /></button>
            </div>
            <label className="block text-xs font-semibold">ชื่อจุดทิ้ง
              <input required value={binForm.bin_name} onChange={(e) => setBinForm({ ...binForm, bin_name: e.target.value })} className="mt-1 w-full p-2 rounded-xl border border-slate-200 bg-slate-50" />
            </label>
            <label className="block text-xs font-semibold">สถานะ
              <select value={binForm.status} onChange={(e) => setBinForm({ ...binForm, status: e.target.value })} className="mt-1 w-full p-2 rounded-xl border border-slate-200 bg-slate-50">
                <option value="พร้อมใช้งาน">พร้อมใช้งาน</option>
                <option value="ปิดปรับปรุง">ปิดปรับปรุง</option>
                <option value="เต็ม">เต็ม</option>
              </select>
            </label>
            <label className="block text-xs font-semibold">ความจุโดยประมาณ
              <input value={binForm.capacity_note} onChange={(e) => setBinForm({ ...binForm, capacity_note: e.target.value })} placeholder="เช่น 45%" className="mt-1 w-full p-2 rounded-xl border border-slate-200 bg-slate-50" />
            </label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowBinModal(false)} className="flex-1 py-2 border rounded-xl text-xs font-semibold">ยกเลิก</button>
              <button type="submit" className="flex-1 py-2 bg-teal-700 text-white rounded-xl text-xs font-bold">บันทึก</button>
            </div>
          </form>
        </div>
      )}

      {showPlasticModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <form onSubmit={handleSavePlastic} className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold">{editingPlastic ? 'แก้ไขชนิดขวด' : 'เพิ่มขวดใหม่'}</h3>
              <button type="button" onClick={() => setShowPlasticModal(false)} className="text-slate-400"><X className="w-4 h-4" /></button>
            </div>
            <label className="block text-xs font-semibold">ชื่อขวดที่แสดง
              <input required value={plasticForm.display_name_th} onChange={(e) => setPlasticForm({ ...plasticForm, display_name_th: e.target.value })} className="mt-1 w-full p-2 rounded-xl border border-slate-200 bg-slate-50" placeholder="เช่น ขวด PET ใส 600 ml" />
            </label>
            <label className="block text-xs font-semibold">ชื่อย่อ (ใช้จับคู่ตอนอนุมัติ)
              <input value={plasticForm.short_name} onChange={(e) => setPlasticForm({ ...plasticForm, short_name: e.target.value })} className="mt-1 w-full p-2 rounded-xl border border-slate-200 bg-slate-50" placeholder="เช่น PET" />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="block text-xs font-semibold">แต้มต่อขวด
                <input type="number" min={0} required value={plasticForm.points_per_bottle} onChange={(e) => setPlasticForm({ ...plasticForm, points_per_bottle: Number(e.target.value) })} className="mt-1 w-full p-2 rounded-xl border border-slate-200 bg-slate-50" />
              </label>
              <label className="block text-xs font-semibold">kg CO₂e ต่อขวด
                <input type="number" min={0} step="0.01" value={plasticForm.carbon_factor} onChange={(e) => setPlasticForm({ ...plasticForm, carbon_factor: Number(e.target.value) })} className="mt-1 w-full p-2 rounded-xl border border-slate-200 bg-slate-50" />
              </label>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowPlasticModal(false)} className="flex-1 py-2 border rounded-xl text-xs font-semibold">ยกเลิก</button>
              <button type="submit" className="flex-1 py-2 bg-purple-700 text-white rounded-xl text-xs font-bold">บันทึก</button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
