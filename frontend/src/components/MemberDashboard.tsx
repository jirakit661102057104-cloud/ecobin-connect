'use client';

import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Leaf, 
  Coins, 
  Trash2, 
  TrendingUp, 
  Award, 
  ArrowRight, 
  Camera, 
  Gift, 
  TreePine, 
  Sparkles,
  CheckCircle2,
  X,
  History
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';

interface MemberDashboardProps {
  setActiveTab: (tab: string) => void;
  openAuthModal: () => void;
}

export const MemberDashboard: React.FC<MemberDashboardProps> = ({ setActiveTab, openAuthModal }) => {
  const { currentUser, wasteRecords, transactions, language, settings } = useApp();
  const [showHistoryPopup, setShowHistoryPopup] = useState(false);
  const [metricDetail, setMetricDetail] = useState<'points' | 'bottles' | 'carbon' | 'trees' | null>(null);

  const userRecords = currentUser 
    ? wasteRecords.filter(r => r.user_id === currentUser.user_id)
    : [];

  const approvedRecords = userRecords.filter(r => r.verification_status === 'อนุมัติแล้ว');
  const approvedCount = approvedRecords.length;
  const totalBottles = approvedRecords.reduce((acc, r) => acc + r.bottle_count, 0);
  const totalPoints = currentUser ? currentUser.total_points : 0;
  const totalCarbon = currentUser ? currentUser.total_carbon_saved : 0;
  const TREE_KG = 20;
  const treesEquiv = (totalCarbon / TREE_KG).toFixed(1);
  const ptsPerBottle = settings.points_per_bottle || 10;
  const carbonPerBottle = settings.carbon_per_bottle || 0.08;

  const { weeklyData, weekBottles, weekPoints, weekCarbon } = useMemo(() => {
    const dayTh = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัส', 'ศุกร์', 'เสาร์'];
    const dayEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const parseStamp = (value: string) => {
      const d = new Date(value.replace(' ', 'T'));
      return Number.isNaN(d.getTime()) ? null : d;
    };

    const days = Array.from({ length: 7 }, (_, i) => {
      const start = new Date(today);
      start.setDate(today.getDate() - (6 - i));
      const end = new Date(start);
      end.setDate(start.getDate() + 1);
      const ofDay = userRecords.filter((r) => {
        if (r.verification_status !== 'อนุมัติแล้ว') return false;
        const t = parseStamp(r.upload_timestamp);
        return t ? t >= start && t < end : false;
      });
      return {
        day: language === 'th' ? dayTh[start.getDay()] : dayEn[start.getDay()],
        bottles: ofDay.reduce((acc, r) => acc + r.bottle_count, 0),
        points: ofDay.reduce((acc, r) => acc + (r.points_awarded || 0), 0),
        carbon: ofDay.reduce((acc, r) => acc + (r.carbon_saved || 0), 0),
      };
    });

    return {
      weeklyData: days,
      weekBottles: days.reduce((acc, d) => acc + d.bottles, 0),
      weekPoints: days.reduce((acc, d) => acc + d.points, 0),
      weekCarbon: days.reduce((acc, d) => acc + d.carbon, 0),
    };
  }, [userRecords, language]);

  const metricCopy = {
    points: {
      title: language === 'th' ? 'ที่มาของแต้มสะสม' : 'Where points come from',
      icon: <Coins className="w-5 h-5 fill-amber-400 text-amber-600" />,
    },
    bottles: {
      title: language === 'th' ? 'ที่มาของจำนวนขวด' : 'Where bottle count comes from',
      icon: <Trash2 className="w-5 h-5 text-emerald-600" />,
    },
    carbon: {
      title: language === 'th' ? 'ที่มาของการลด CO₂e' : 'Where CO₂e savings come from',
      icon: <Leaf className="w-5 h-5 text-teal-600" />,
    },
    trees: {
      title: language === 'th' ? 'ที่มาของต้นไม้เทียบเท่า' : 'Where tree equivalent comes from',
      icon: <TreePine className="w-5 h-5 text-emerald-700" />,
    },
  } as const;

  return (
    <div className="space-y-6">
      {settings.announcement?.trim() && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-950">
          <span className="font-bold">ประกาศจากผู้ดูแล: </span>
          {settings.announcement}
        </div>
      )}
      
      {/* Modern Compact Hero */}
      <div className="bg-gradient-to-br from-emerald-950 via-teal-900 to-slate-900 text-white rounded-[28px] p-6 sm:p-8 shadow-xl shadow-emerald-900/20 relative overflow-hidden border border-white/10">
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_80%_20%,rgba(52,211,153,0.45),transparent_42%),radial-gradient(circle_at_10%_90%,rgba(45,212,191,0.28),transparent_40%)]"></div>
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-emerald-400/15 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 rounded-full bg-teal-500/10 blur-3xl mix-blend-overlay"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <img 
              src={currentUser?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'} 
              alt={currentUser?.full_name || 'Guest'} 
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover ring-2 ring-white/20 shadow-md"
            />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  {currentUser ? (currentUser.user_role === 'Admin' ? 'Admin' : 'PCRU Member') : 'Guest Mode'}
                </span>
                <span className="text-xs text-slate-300">
                  {currentUser?.student_id || 'มรภ.เพชรบูรณ์'}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                {currentUser 
                  ? currentUser.full_name 
                  : language === 'th' ? 'ยินดีต้อนรับสู่ EcoBin' : 'Welcome to EcoBin'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <button
              id="dashboard-scan-action-btn"
              onClick={() => setActiveTab('scan')}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 text-emerald-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>{language === 'th' ? 'สแกนขวด' : 'Scan Bottle'}</span>
            </button>

            <button
              id="dashboard-rewards-action-btn"
              onClick={() => setActiveTab('rewards')}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/15 backdrop-blur-md transition-all cursor-pointer"
            >
              <Gift className="w-4 h-4" />
              <span>{language === 'th' ? 'แลกรางวัล' : 'Rewards'}</span>
            </button>

            {!currentUser && (
              <button
                id="hero-register-btn"
                onClick={openAuthModal}
                className="hidden sm:inline-flex items-center px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold text-xs transition-colors"
              >
                {language === 'th' ? 'เข้าสู่ระบบ' : 'Login'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        
        {/* Total Points */}
        <button
          type="button"
          onClick={() => setMetricDetail('points')}
          className="text-left bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-5 border border-white/80 shadow-[0_8px_30px_-18px_rgba(6,95,70,0.35)] hover:shadow-[0_12px_36px_-12px_rgba(16,185,129,0.28)] hover:-translate-y-0.5 hover:border-emerald-100 transition-all duration-300 cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">{language === 'th' ? 'แต้มสะสม' : 'Total Points'}</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <Coins className="w-4 h-4 fill-amber-400" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{totalPoints}</span>
            <span className="text-xs font-semibold text-amber-600">{language === 'th' ? 'แต้ม' : 'pts'}</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>{language === 'th' ? 'แตะเพื่อดูที่มาของแต้ม' : 'Tap to see how points are calculated'}</span>
          </div>
        </button>

        {/* Bottles Sorted */}
        <button
          type="button"
          onClick={() => setMetricDetail('bottles')}
          className="text-left bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-5 border border-white/80 shadow-[0_8px_30px_-18px_rgba(6,95,70,0.35)] hover:shadow-[0_12px_36px_-12px_rgba(16,185,129,0.28)] hover:-translate-y-0.5 hover:border-emerald-100 transition-all duration-300 cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">{language === 'th' ? 'ขวดที่คัดแยก' : 'Bottles Sorted'}</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Trash2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{totalBottles}</span>
            <span className="text-xs font-semibold text-emerald-600">{language === 'th' ? 'ขวด' : 'bottles'}</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            <span>{language === 'th' ? `อนุมัติ ${approvedCount} รายการ` : `Approved ${approvedCount} items`}</span>
          </div>
        </button>

        {/* Carbon Saved */}
        <button
          type="button"
          onClick={() => setMetricDetail('carbon')}
          className="text-left bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-5 border border-white shadow-sm hover:shadow-[0_8px_30px_rgb(20,184,166,0.12)] hover:-translate-y-0.5 hover:border-teal-100 transition-all duration-300 cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">{language === 'th' ? 'ลด CO₂e' : 'CO₂e Saved'}</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
              <Leaf className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{totalCarbon.toFixed(2)}</span>
            <span className="text-xs font-semibold text-teal-600">kg</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-teal-500" />
            <span>{language === 'th' ? 'แตะเพื่อดูสูตรคำนวณ' : 'Tap to see the formula'}</span>
          </div>
        </button>

        {/* Tree Equivalent */}
        <button
          type="button"
          onClick={() => setMetricDetail('trees')}
          className="text-left bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-5 border border-white/80 shadow-[0_8px_30px_-18px_rgba(6,95,70,0.35)] hover:shadow-[0_12px_36px_-12px_rgba(16,185,129,0.28)] hover:-translate-y-0.5 hover:border-emerald-100 transition-all duration-300 cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">{language === 'th' ? 'เทียบเท่าปลูกต้นไม้' : 'Trees Equivalent'}</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700">
              <TreePine className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{treesEquiv}</span>
            <span className="text-xs font-semibold text-emerald-700">{language === 'th' ? 'ต้น' : 'trees'}</span>
          </div>
          <div className="mt-1 text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
            <Award className="w-3 h-3 text-amber-500" />
            <span>{language === 'th' ? 'แตะเพื่อดูที่มา' : 'Tap for source'}</span>
          </div>
        </button>

      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Full width: Trend Chart (12 cols) */}
        <div className="lg:col-span-12 bg-white/80 backdrop-blur-md rounded-2xl p-5 sm:p-6 border border-white shadow-sm hover:shadow-md transition-shadow duration-300 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">{language === 'th' ? 'สถิติการคัดแยกรายสัปดาห์' : 'Weekly Sorting Stats'}</h3>
              <p className="text-[11px] text-slate-400">{language === 'th' ? 'จำนวนขวดที่คัดแยกใน 7 วันที่ผ่านมา' : 'Bottles sorted in the last 7 days'}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowHistoryPopup(true)}
                className="text-[11px] px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <History className="w-3.5 h-3.5" />
                {language === 'th' ? 'ประวัติล่าสุด' : 'Recent History'}
              </button>
              <span className="hidden sm:inline-flex text-[11px] px-2.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 font-bold border border-emerald-100">
                {language === 'th' ? 'สัปดาห์นี้' : 'This Week'}
              </span>
            </div>
          </div>

          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBottles" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '10px', border: 'none', color: '#fff', fontSize: '11px' }}
                  formatter={(value, name) => [
                    String(name) === 'bottles' ? `${value} ขวด` : `${value} แต้ม`,
                    String(name) === 'bottles' ? 'ขวด' : 'แต้ม'
                  ]}
                />
                <Area type="monotone" dataKey="bottles" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorBottles)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-50 text-center text-xs">
            <div className="p-2 bg-slate-50/70 rounded-xl">
              <span className="text-slate-400 block text-[10px]">{language === 'th' ? 'ยอดรวมขวด' : 'Total Bottles'}</span>
              <strong className="text-slate-800 text-sm">{weekBottles}</strong>
            </div>
            <div className="p-2 bg-slate-50/70 rounded-xl">
              <span className="text-slate-400 block text-[10px]">{language === 'th' ? 'ลด CO₂e' : 'CO₂e Saved'}</span>
              <strong className="text-emerald-700 text-sm">{weekCarbon.toFixed(2)} kg</strong>
            </div>
            <div className="p-2 bg-slate-50/70 rounded-xl">
              <span className="text-slate-400 block text-[10px]">{language === 'th' ? 'แต้มรวม' : 'Total Points'}</span>
              <strong className="text-amber-700 text-sm">+{weekPoints}</strong>
            </div>
          </div>
        </div>

      </div>

      {/* History Popup */}
      {showHistoryPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-slate-800">
                  <History className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-base font-bold text-slate-900">
                    {language === 'th' ? 'ประวัติล่าสุด' : 'Recent History'}
                  </h3>
                </div>
                <button 
                  onClick={() => setShowHistoryPopup(false)}
                  className="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 p-1.5 rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                {userRecords.length > 0 ? (
                  userRecords.slice(0, 5).map((record) => {
                    const statusLabel = language === 'th' 
                      ? record.verification_status 
                      : (record.verification_status === 'อนุมัติแล้ว' ? 'Approved' 
                        : record.verification_status === 'รอการตรวจสอบ' ? 'Pending'
                        : record.verification_status === 'กรุณาส่งภาพมาใหม่' ? 'Resubmit photo' : 'Rejected');

                    const statusBadge = {
                      'อนุมัติแล้ว': 'bg-emerald-50 text-emerald-700 border-emerald-100',
                      'รอการตรวจสอบ': 'bg-amber-50 text-amber-700 border-amber-100',
                      'ไม่อนุมัติ': 'bg-rose-50 text-rose-700 border-rose-100',
                      'กรุณาส่งภาพมาใหม่': 'bg-sky-50 text-sky-800 border-sky-100'
                    }[record.verification_status];

                    return (
                      <div 
                        key={record.record_id}
                        className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors"
                      >
                        <img 
                          src={record.image_url} 
                          alt="waste" 
                          className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-200"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <p className="text-sm font-bold text-slate-900 truncate">
                              {record.plastic_type.split(' ')[0]} ({record.bottle_count} {language === 'th' ? 'ขวด' : 'bottles'})
                            </p>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusBadge}`}>
                              {statusLabel}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-1 text-xs text-slate-500">
                            <span>{record.upload_timestamp.split(' ')[0]}</span>
                            <span className={`font-bold ${record.verification_status === 'อนุมัติแล้ว' ? 'text-emerald-600' : 'text-slate-400'}`}>
                              {record.verification_status === 'อนุมัติแล้ว'
                                ? `+${record.points_awarded} ${language === 'th' ? 'แต้ม' : 'pts'}`
                                : (language === 'th' ? 'รออนุมัติ' : 'Pending')}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-slate-400 text-sm">
                    <Trash2 className="w-10 h-10 mx-auto mb-3 text-slate-200" />
                    <p>{language === 'th' ? 'ยังไม่มีรายการบันทึก' : 'No records yet'}</p>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100">
                <button
                  onClick={() => {
                    setShowHistoryPopup(false);
                    setActiveTab('history');
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-sm rounded-xl transition-colors cursor-pointer"
                >
                  {language === 'th' ? 'ดูประวัติทั้งหมด' : 'View Full History'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {metricDetail && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={() => setMetricDetail(null)}>
          <div
            className="bg-white w-full max-w-md rounded-3xl shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  {metricCopy[metricDetail].icon}
                  <h3 className="text-base font-bold text-slate-900">{metricCopy[metricDetail].title}</h3>
                </div>
                <button type="button" onClick={() => setMetricDetail(null)} className="p-1.5 rounded-full bg-slate-100 text-slate-500">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {metricDetail === 'points' && (
                <div className="space-y-2">
                  <p className="text-[11px] text-slate-500">
                    {language === 'th'
                      ? `คงเหลือ ${totalPoints} แต้ม · ได้แต้มเมื่อแอดมินอนุมัติภาพเท่านั้น`
                      : `Balance ${totalPoints} pts · awarded only after admin approval`}
                  </p>
                  <div className="max-h-[50vh] overflow-y-auto space-y-2 pr-0.5">
                    {transactions.length === 0 ? (
                      <p className="text-center text-xs text-slate-400 py-8">{language === 'th' ? 'ยังไม่มีประวัติแต้ม' : 'No point history'}</p>
                    ) : (
                      [...transactions]
                        .sort((a, b) => b.transaction_date.localeCompare(a.transaction_date))
                        .map((t) => (
                          <div key={t.transaction_id} className="flex items-start justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 px-3 py-2.5">
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-800 truncate">{t.description || t.transaction_type}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">{t.transaction_date} · {t.transaction_type}</p>
                            </div>
                            <strong className={`text-sm shrink-0 ${t.points_earned >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                              {t.points_earned >= 0 ? '+' : ''}{t.points_earned}
                            </strong>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              )}

              {metricDetail === 'bottles' && (
                <div className="space-y-2">
                  <p className="text-[11px] text-slate-500">
                    {language === 'th'
                      ? `นับเฉพาะที่อนุมัติแล้ว ${totalBottles} ขวด จาก ${approvedCount} รายการ`
                      : `${totalBottles} bottles from ${approvedCount} approved records`}
                  </p>
                  <div className="max-h-[50vh] overflow-y-auto space-y-2 pr-0.5">
                    {userRecords.length === 0 ? (
                      <p className="text-center text-xs text-slate-400 py-8">{language === 'th' ? 'ยังไม่มีรายการสแกน' : 'No scan records'}</p>
                    ) : (
                      [...userRecords]
                        .sort((a, b) => b.upload_timestamp.localeCompare(a.upload_timestamp))
                        .map((r) => {
                          const counted = r.verification_status === 'อนุมัติแล้ว';
                          return (
                            <div key={r.record_id} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 px-3 py-2.5">
                              <img src={r.image_url} alt="" className="w-11 h-11 rounded-xl object-cover border border-slate-200 shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-slate-800 truncate">{r.plastic_type}</p>
                                <p className="text-[10px] text-slate-400">{r.upload_timestamp} · {r.verification_status}</p>
                              </div>
                              <strong className={`text-sm shrink-0 ${counted ? 'text-emerald-700' : 'text-slate-400'}`}>
                                {counted ? `+${r.bottle_count}` : r.bottle_count} {language === 'th' ? 'ขวด' : ''}
                              </strong>
                            </div>
                          );
                        })
                    )}
                  </div>
                </div>
              )}

              {metricDetail === 'carbon' && (
                <div className="space-y-2">
                  <p className="text-[11px] text-slate-500">
                    {language === 'th'
                      ? `รวม ${totalCarbon.toFixed(2)} kg · สูตร = ขวด × ${carbonPerBottle} kg`
                      : `Total ${totalCarbon.toFixed(2)} kg · bottles × ${carbonPerBottle} kg`}
                  </p>
                  <div className="max-h-[50vh] overflow-y-auto space-y-2 pr-0.5">
                    {approvedRecords.length === 0 ? (
                      <p className="text-center text-xs text-slate-400 py-8">{language === 'th' ? 'ยังไม่มีรายการที่อนุมัติ' : 'No approved records'}</p>
                    ) : (
                      [...approvedRecords]
                        .sort((a, b) => b.upload_timestamp.localeCompare(a.upload_timestamp))
                        .map((r) => (
                          <div key={r.record_id} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 px-3 py-2.5">
                            <img src={r.image_url} alt="" className="w-11 h-11 rounded-xl object-cover border border-slate-200 shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-slate-800 truncate">{r.plastic_type} · {r.bottle_count} {language === 'th' ? 'ขวด' : 'btl'}</p>
                              <p className="text-[10px] text-slate-400">{r.upload_timestamp}</p>
                            </div>
                            <strong className="text-sm text-teal-700 shrink-0">{(r.carbon_saved || 0).toFixed(2)} kg</strong>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              )}

              {metricDetail === 'trees' && (
                <div className="space-y-2">
                  <p className="text-[11px] text-slate-500">
                    {language === 'th'
                      ? `รวม ${treesEquiv} ต้น · สูตร = CO₂e ÷ ${TREE_KG} (ไม่ใช่ปลูกจริง)`
                      : `Total ${treesEquiv} trees · CO₂e ÷ ${TREE_KG} (not actual planting)`}
                  </p>
                  <div className="max-h-[50vh] overflow-y-auto space-y-2 pr-0.5">
                    {approvedRecords.length === 0 ? (
                      <p className="text-center text-xs text-slate-400 py-8">{language === 'th' ? 'ยังไม่มีรายการที่อนุมัติ' : 'No approved records'}</p>
                    ) : (
                      [...approvedRecords]
                        .sort((a, b) => b.upload_timestamp.localeCompare(a.upload_timestamp))
                        .map((r) => (
                          <div key={r.record_id} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 px-3 py-2.5">
                            <img src={r.image_url} alt="" className="w-11 h-11 rounded-xl object-cover border border-slate-200 shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-slate-800 truncate">{r.plastic_type} · {(r.carbon_saved || 0).toFixed(2)} kg CO₂e</p>
                              <p className="text-[10px] text-slate-400">{r.upload_timestamp}</p>
                            </div>
                            <strong className="text-sm text-emerald-700 shrink-0">
                              {((r.carbon_saved || 0) / TREE_KG).toFixed(2)} {language === 'th' ? 'ต้น' : ''}
                            </strong>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => setMetricDetail(null)}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl"
              >
                {language === 'th' ? 'เข้าใจแล้ว' : 'Got it'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
