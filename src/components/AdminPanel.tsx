import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Reward, WasteRecord } from '../types';
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
  X
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
    redemptions
  } = useApp();

  const [activeAdminTab, setActiveAdminTab] = useState<'verify' | 'users' | 'rewards' | 'reports'>('verify');

  // State for Review Modal
  const [selectedRecordToVerify, setSelectedRecordToVerify] = useState<WasteRecord | null>(null);
  const [verifyStatus, setVerifyStatus] = useState<'อนุมัติแล้ว' | 'ไม่อนุมัติ'>('อนุมัติแล้ว');
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

  const openVerifyDialog = (record: WasteRecord) => {
    setSelectedRecordToVerify(record);
    setVerifyStatus('อนุมัติแล้ว');
    setVerifyPoints(record.points_awarded || record.bottle_count * 10);
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

  // Aggregated stats for Admin Overview
  const totalCampusBottles = wasteRecords.reduce((acc, r) => acc + (r.verification_status === 'อนุมัติแล้ว' ? r.bottle_count : 0), 0);
  const totalCampusCarbon = wasteRecords.reduce((acc, r) => acc + (r.verification_status === 'อนุมัติแล้ว' ? r.carbon_saved : 0), 0);
  const totalPendingReviews = wasteRecords.filter(r => r.verification_status === 'รอการตรวจสอบ').length;

  const plasticDistribution = [
    { name: 'PET (เบอร์ 1)', value: 85, color: '#10b981' },
    { name: 'HDPE (เบอร์ 2)', value: 12, color: '#3b82f6' },
    { name: 'อื่นๆ', value: 3, color: '#f43f5e' }
  ];

  const buildingStats = [
    { name: 'อาคาร 1 คณะวิทย์ฯ', bottles: 48 },
    { name: 'โรงอาหารกลาง', bottles: 62 },
    { name: 'อาคาร IT', bottles: 34 },
    { name: 'หอสมุดกลาง', bottles: 28 },
    { name: 'คณะวิทยาการจัดการ', bottles: 19 }
  ];

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
            ระบบบริหารจัดการ
          </h2>
          <p className="text-xs text-purple-200 mt-0.5">
            ตรวจสอบรายการขยะ จัดการผู้ใช้ ของรางวัล และสถิติ
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white/10 px-3.5 py-2 rounded-xl text-xs text-purple-100 border border-white/10 self-start sm:self-auto">
          <span>รอการตรวจสอบ:</span>
          <span className="font-bold text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded-md">{totalPendingReviews} รายการ</span>
        </div>
      </div>

      {/* Admin Subnav Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          id="admin-tab-verify"
          onClick={() => setActiveAdminTab('verify')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeAdminTab === 'verify'
              ? 'bg-purple-700 text-white shadow-2xs'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>ตรวจสอบภาพ ({wasteRecords.length})</span>
        </button>

        <button
          id="admin-tab-users"
          onClick={() => setActiveAdminTab('users')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeAdminTab === 'users'
              ? 'bg-purple-700 text-white shadow-2xs'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>ผู้ใช้งาน ({users.length})</span>
        </button>

        <button
          id="admin-tab-rewards"
          onClick={() => setActiveAdminTab('rewards')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeAdminTab === 'rewards'
              ? 'bg-purple-700 text-white shadow-2xs'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80'
          }`}
        >
          <Gift className="w-3.5 h-3.5" />
          <span>ของรางวัล ({rewards.length})</span>
        </button>

        <button
          id="admin-tab-reports"
          onClick={() => setActiveAdminTab('reports')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeAdminTab === 'reports'
              ? 'bg-purple-700 text-white shadow-2xs'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>สถิติรวม</span>
        </button>
      </div>

      {/* Admin Tab 1: Verify Waste Records Queue */}
      {activeAdminTab === 'verify' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {wasteRecords.map((record) => {
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
                    <span className="text-xs font-bold text-emerald-700">+{record.points_awarded} แต้ม</span>

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
        </div>
      )}

      {/* Admin Tab 2: User Account Management */}
      {activeAdminTab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs overflow-hidden p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800">รายชื่อผู้ใช้งานในระบบ</h3>
            <span className="text-xs text-slate-400">{users.length} บัญชี</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-100">
                  <th className="p-2.5 font-semibold">User</th>
                  <th className="p-2.5 font-semibold">รหัส</th>
                  <th className="p-2.5 font-semibold">สิทธิ์</th>
                  <th className="p-2.5 font-semibold text-right">แต้ม</th>
                  <th className="p-2.5 font-semibold text-right">ลด CO₂e</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map((user) => (
                  <tr key={user.user_id} className="hover:bg-slate-50/50">
                    <td className="p-2.5 font-semibold text-slate-900 flex items-center gap-2">
                      <img src={user.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover" />
                      <span>{user.full_name}</span>
                    </td>
                    <td className="p-2.5 text-slate-500 font-mono text-[11px]">{user.student_id}</td>
                    <td className="p-2.5">
                      <span className={`px-1.5 py-0.5 rounded font-bold text-[9px] ${
                        user.user_role === 'Admin' ? 'bg-purple-50 text-purple-700' : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {user.user_role}
                      </span>
                    </td>
                    <td className="p-2.5 text-right font-bold text-amber-700">{user.total_points}</td>
                    <td className="p-2.5 text-right font-bold text-emerald-700">{user.total_carbon_saved.toFixed(2)} kg</td>
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

      {/* Admin Tab 4: Overview Reports & Charts */}
      {activeAdminTab === 'reports' && (
        <div className="space-y-4">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs">
              <span className="text-xs text-slate-400 block">ขวดที่คัดแยกทั้งมหาวิทยาลัย</span>
              <strong className="text-2xl font-extrabold text-slate-900">{totalCampusBottles} ขวด</strong>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs">
              <span className="text-xs text-slate-400 block">ก๊าซเรือนกระจกที่ลดได้</span>
              <strong className="text-2xl font-extrabold text-teal-700">{totalCampusCarbon.toFixed(2)} kg CO₂e</strong>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs">
              <span className="text-xs text-slate-400 block">การแลกของรางวัลสะสม</span>
              <strong className="text-2xl font-extrabold text-amber-700">{redemptions.length} ครั้ง</strong>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-slate-100 shadow-2xs space-y-3">
              <h4 className="text-xs font-bold text-slate-900">ปริมาณการคัดแยกขยะแยกตามจุดตู้ขยะ</h4>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={buildingStats} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" />
                    <XAxis dataKey="name" tick={{ fontSize: 9 }} interval={0} angle={-10} textAnchor="end" />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '10px', border: 'none', color: '#fff', fontSize: '11px' }} />
                    <Bar dataKey="bottles" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="จำนวนขวด" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-100 shadow-2xs space-y-3">
              <h4 className="text-xs font-bold text-slate-900">สัดส่วนประเภทพลาสติก</h4>
              <div className="h-56 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={plasticDistribution}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={65}
                      paddingAngle={4}
                    >
                      {plasticDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '10px', border: 'none', color: '#fff', fontSize: '11px' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
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

    </div>
  );
};
