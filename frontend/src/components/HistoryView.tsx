'use client';

import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { persistHistoryTab, restoreHistoryTab } from '../lib/navState';
import { 
  History, 
  Trash2, 
  Coins, 
  Gift, 
  Smartphone, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Leaf, 
  Search,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';

export const HistoryView: React.FC = () => {
  const { currentUser, language, wasteRecords, transactions, redemptions, guestLogs } = useApp();

  const [activeTab, setActiveTabState] = useState<'waste' | 'points' | 'redeem' | 'guest'>('waste');
  const [histTabReady, setHistTabReady] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setActiveTabState(restoreHistoryTab());
    setHistTabReady(true);
  }, []);

  useEffect(() => {
    if (histTabReady) persistHistoryTab(activeTab);
  }, [activeTab, histTabReady]);

  const setActiveTab = (tab: typeof activeTab) => {
    setActiveTabState(tab);
  };

  // Filter records based on role & search
  const userWasteRecords = currentUser
    ? wasteRecords.filter(r => r.user_id === currentUser.user_id || currentUser.user_role === 'Admin')
    : wasteRecords;

  const userTransactions = currentUser
    ? transactions.filter(t => t.user_id === currentUser.user_id || currentUser.user_role === 'Admin')
    : transactions;

  const userRedemptions = currentUser
    ? redemptions.filter(r => r.user_id === currentUser.user_id || currentUser.user_role === 'Admin')
    : redemptions;

  return (
    <div className="space-y-4">
      
      {/* Title Header & Tabs */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
              <History className="w-4 h-4" />
            </span>
            {language === 'th' ? 'ประวัติและบันทึกกิจกรรม' : 'History & Activity Logs'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === 'th' ? 'บันทึกการคัดแยก ธุรกรรมแต้ม และการแลกของรางวัล' : 'Records of sorting, point transactions, and rewards'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100 text-xs overflow-x-auto scrollbar-none">
          <button
            id="hist-tab-waste"
            onClick={() => setActiveTab('waste')}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'waste'
                ? 'bg-white text-emerald-800 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {language === 'th' ? `การทิ้ง (${userWasteRecords.length})` : `Waste (${userWasteRecords.length})`}
          </button>
          <button
            id="hist-tab-points"
            onClick={() => setActiveTab('points')}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'points'
                ? 'bg-white text-emerald-800 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {language === 'th' ? `แต้ม (${userTransactions.length})` : `Points (${userTransactions.length})`}
          </button>
          <button
            id="hist-tab-redeem"
            onClick={() => setActiveTab('redeem')}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'redeem'
                ? 'bg-white text-emerald-800 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {language === 'th' ? `แลกรางวัล (${userRedemptions.length})` : `Rewards (${userRedemptions.length})`}
          </button>
          <button
            id="hist-tab-guest"
            onClick={() => setActiveTab('guest')}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'guest'
                ? 'bg-white text-emerald-800 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Guest Logs ({guestLogs.length})
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={language === 'th' ? 'ค้นหาตามรหัสรายการ, ประเภทพลาสติก...' : 'Search by ID, plastic type...'}
          className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200/80 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none shadow-2xs"
        />
      </div>

      {/* Tab 1: Waste Records */}
      {activeTab === 'waste' && (
        <div className="space-y-2.5">
          {userWasteRecords
            .filter(r => 
              r.record_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
              r.plastic_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
              r.admin_comment.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .map((record) => {
              const statusStyles = {
                'อนุมัติแล้ว': {
                  badge: 'bg-emerald-50 text-emerald-800',
                  icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                },
                'รอการตรวจสอบ': {
                  badge: 'bg-amber-50 text-amber-800',
                  icon: <Clock className="w-3.5 h-3.5 text-amber-600" />
                },
                'ไม่อนุมัติ': {
                  badge: 'bg-rose-50 text-rose-800',
                  icon: <XCircle className="w-3.5 h-3.5 text-rose-600" />
                },
                'กรุณาส่งภาพมาใหม่': {
                  badge: 'bg-sky-50 text-sky-800',
                  icon: <Clock className="w-3.5 h-3.5 text-sky-600" />
                }
              }[record.verification_status] || {
                badge: 'bg-slate-50 text-slate-700',
                icon: <Clock className="w-3.5 h-3.5 text-slate-500" />
              };

              return (
                <div
                  key={record.record_id}
                  className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-100 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <img 
                      src={record.image_url} 
                      alt="" 
                      className="w-14 h-14 rounded-xl object-cover border border-slate-100 shrink-0"
                    />
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-slate-700">
                          {record.record_id}
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 ${statusStyles.badge}`}>
                          {statusStyles.icon}
                          <span>{record.verification_status}</span>
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-900">
                        {record.plastic_type} • {record.bottle_count} ขวด
                      </h4>

                      <div className="flex items-center gap-2 text-[10px] text-slate-400">
                        <span>{record.bin_location || 'จุดคัดแยกกลาง'}</span>
                        <span>•</span>
                        <span>{record.upload_timestamp}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-end justify-between w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-50 gap-1.5">
                    <div className={`flex items-center gap-1 px-2.5 py-0.5 rounded-lg font-bold text-xs ${
                      record.verification_status === 'อนุมัติแล้ว' ? 'text-emerald-800 bg-emerald-50' : 'text-slate-500 bg-slate-50'
                    }`}>
                      <Coins className="w-3 h-3 text-amber-500 fill-amber-400" />
                      <span>
                        {record.verification_status === 'อนุมัติแล้ว'
                          ? `+${record.points_awarded} แต้ม`
                          : record.verification_status === 'รอการตรวจสอบ'
                            ? 'รออนุมัติ'
                            : '0 แต้ม'}
                      </span>
                    </div>
                    {record.verification_status === 'อนุมัติแล้ว' && (
                    <span className="text-[10px] text-teal-700 font-medium">
                      -{record.carbon_saved} kg CO₂e
                    </span>
                    )}
                  </div>
                </div>
              );
            })}

          {userWasteRecords.length === 0 && (
            <div className="bg-white rounded-2xl p-8 text-center text-slate-400 text-xs border border-slate-100">
              <Trash2 className="w-6 h-6 mx-auto mb-1.5 text-slate-300" />
              <p>ยังไม่มีบันทึกประวัติการทิ้ง</p>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Point Transactions */}
      {activeTab === 'points' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs overflow-hidden">
          <div className="divide-y divide-slate-50">
            {userTransactions
              .filter(t => 
                t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.transaction_id.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((txn) => {
                const isEarn = txn.points_earned > 0;
                return (
                  <div key={txn.transaction_id} className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        isEarn 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-rose-100 text-rose-700'
                      }`}>
                        {isEarn ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-900">
                          {txn.description}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {txn.transaction_id} • {txn.transaction_date}
                        </p>
                      </div>
                    </div>

                    <div className={`text-right font-bold text-xs sm:text-sm shrink-0 ${
                      isEarn ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {isEarn ? `+${txn.points_earned}` : txn.points_earned} แต้ม
                    </div>
                  </div>
                );
              })}

            {userTransactions.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-xs">
                <Coins className="w-6 h-6 mx-auto mb-1.5 text-slate-300" />
                <p>ยังไม่มีประวัติแต้ม</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Redemptions */}
      {activeTab === 'redeem' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {userRedemptions
            .filter(r => 
              r.reward_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              r.pickup_code.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .map((red) => (
              <div
                key={red.redeem_id}
                className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <img 
                      src={red.reward_image} 
                      alt="" 
                      className="w-11 h-11 rounded-lg object-cover border border-slate-100" 
                    />
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 leading-tight">{red.reward_name}</h4>
                      <p className="text-[11px] text-rose-600 font-semibold mt-0.5">-{red.points_used} แต้ม</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800">
                    {red.redeem_status}
                  </span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 text-[9px] block">รหัสรับรางวัล:</span>
                    <strong className="font-mono text-emerald-700 text-xs tracking-wider">{red.pickup_code}</strong>
                  </div>
                  <span className="text-[10px] text-slate-400">{red.redeem_date}</span>
                </div>
              </div>
            ))}

          {userRedemptions.length === 0 && (
            <div className="col-span-full bg-white rounded-2xl p-8 text-center text-slate-400 text-xs border border-slate-100">
              <Gift className="w-6 h-6 mx-auto mb-1.5 text-slate-300" />
              <p>ยังไม่มีประวัติการแลกของรางวัล</p>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Guest Local Storage Logs */}
      {activeTab === 'guest' && (
        <div className="space-y-3">
          <div className="bg-blue-50/70 border border-blue-200/60 rounded-2xl p-3 text-xs text-blue-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-blue-600 shrink-0" />
              <span>บันทึกการจำลองตรวจสอบบนอุปกรณ์ (Local Storage)</span>
            </div>
            <span className="font-mono text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-medium">
              POCO X6 PRO
            </span>
          </div>

          <div className="space-y-2">
            {guestLogs.map((log, index) => (
              <div key={index} className="bg-white rounded-2xl p-3 border border-slate-100 shadow-2xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img src={log.temp_image_path} alt="" className="w-10 h-10 rounded-lg object-cover border border-slate-100" />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[11px] font-bold text-slate-800">{log.guest_session_id}</span>
                      <span className="text-[9px] bg-slate-100 text-slate-500 px-1 py-0.2 rounded">{log.device_id}</span>
                    </div>
                    <p className="text-[11px] text-slate-600">{log.temp_scan_result}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-emerald-700 block">+{log.estimated_points} แต้ม</span>
                  <span className="text-[10px] text-slate-400">{log.detected_bottles} ขวด</span>
                </div>
              </div>
            ))}

            {guestLogs.length === 0 && (
              <div className="bg-white rounded-2xl p-8 text-center text-slate-400 text-xs border border-slate-100">
                <Smartphone className="w-6 h-6 mx-auto mb-1.5 text-slate-300" />
                <p>ยังไม่มีบันทึกใน Local Storage</p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
