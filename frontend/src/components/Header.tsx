'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';
import { BrandLogo } from './BrandLogo';
import type { User } from '../types';
import { 
  Coins, 
  ShieldCheck, 
  User as UserIcon, 
  LogOut, 
  BookOpen, 
  Sparkles, 
  Camera, 
  QrCode,
  Gift, 
  History, 
  LayoutDashboard, 
  GraduationCap,
  ChevronDown,
  Settings as SettingsIcon,
  X,
  Calendar
} from 'lucide-react';

function displayName(user: User) {
  const first = (user.first_name || '').trim();
  const last = (user.last_name || '').trim();
  if (first && last && last !== '-') return `${first} ${last}`;
  if (first) return first;
  const full = (user.full_name || '').trim();
  if (full) return full;
  if (user.email) return user.email.split('@')[0];
  return 'สมาชิก';
}

function providerLabel(user: User) {
  if (user.auth_provider === 'google') return 'Google';
  if (user.auth_provider === 'phone') return 'เบอร์โทร';
  return 'อีเมล';
}

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openAuthModal: () => void;
  openResearchModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  openAuthModal,
  openResearchModal
}) => {
  const { currentUser, currentRole, setGuestMode, logout, language } = useApp();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showPointsInfo, setShowPointsInfo] = useState(false);

  const navItems = currentRole === 'Admin'
    ? [
        { id: 'admin', label: language === 'th' ? 'แผงควบคุม' : 'Admin', icon: ShieldCheck },
        { id: 'scan', label: language === 'th' ? 'สแกน QR' : 'Scan QR', icon: QrCode, highlight: true },
        { id: 'settings', label: language === 'th' ? 'ตั้งค่า' : 'Settings', icon: SettingsIcon },
      ]
    : [
        { id: 'dashboard', label: language === 'th' ? 'หน้าหลัก' : 'Home', icon: LayoutDashboard },
        { id: 'scan', label: language === 'th' ? 'สแกนขยะ' : 'Scan', icon: Camera, highlight: true },
        { id: 'rewards', label: language === 'th' ? 'ของรางวัล' : 'Rewards', icon: Gift },
        { id: 'settings', label: language === 'th' ? 'ตั้งค่า' : 'Settings', icon: SettingsIcon },
      ];

  return (
    <header className="sticky top-0 z-40 pt-3 px-3 sm:px-4">
      <div className="eco-nav max-w-7xl mx-auto rounded-2xl">
      <div className="px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Brand */}
          <div 
            className="flex items-center gap-2.5 cursor-pointer group shrink-0"
            onClick={() => setActiveTab(currentRole === 'Admin' ? 'admin' : 'dashboard')}
          >
            <BrandLogo className="w-10 h-10 rounded-xl group-hover:scale-105 transition-transform" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-extrabold text-slate-900 tracking-tight">
                  EcoBin
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                  PCRU
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Items (Desktop) */}
          <nav className="hidden lg:flex items-center gap-0.5 p-1 rounded-2xl bg-slate-100/70">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-btn-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? item.id === 'admin'
                        ? 'bg-violet-600 text-white shadow-sm'
                        : 'bg-white text-emerald-800 shadow-sm'
                      : item.highlight
                      ? 'text-emerald-700 hover:bg-white/70'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-white/70'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? (item.id === 'admin' ? 'text-white' : 'text-emerald-600') : item.highlight ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action Area */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Points Chip */}
            {currentUser && (
              <div 
                id="header-user-points"
                onClick={() => setShowPointsInfo(true)}
                className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/70 text-amber-900 hover:from-amber-100 hover:to-orange-50 transition-colors shadow-sm"
                title="คลิกเพื่อดูรายละเอียดแต้ม"
              >
                <Coins className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                <span className="font-bold text-xs text-amber-900">{currentUser.total_points}</span>
                <span className="text-[10px] text-amber-700 font-medium">แต้ม</span>
              </div>
            )}

            {/* Research Info Button */}
            <button
              id="header-research-info-btn"
              onClick={openResearchModal}
              title="ข้อมูลโครงการวิจัย"
              className="p-2 rounded-xl text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer border border-transparent hover:border-emerald-100"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
            </button>

            {/* User Dropdown */}
            <div className="relative">
              <button
                id="user-menu-button"
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-xl border border-slate-200/80 hover:bg-slate-50 transition-colors"
              >
                {currentUser ? (
                  <>
                    <img 
                      src={currentUser.avatar_url} 
                      alt={displayName(currentUser)} 
                      className="w-7 h-7 rounded-lg object-cover ring-1 ring-slate-200"
                    />
                    <div className="hidden sm:block text-left leading-tight">
                      <p className="text-xs font-semibold text-slate-800 truncate max-w-[100px]">
                        {displayName(currentUser).split(' ')[0]}
                      </p>
                      <span className={`text-[9px] font-semibold ${
                        currentUser.user_role === 'Admin' ? 'text-purple-600' : 'text-emerald-600'
                      }`}>
                        {currentUser.user_role === 'Admin' ? 'แอดมิน' : 'สมาชิก'}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <span className="hidden sm:inline text-xs font-medium text-slate-700">Guest</span>
                  </>
                )}
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {/* Role Switcher Menu */}
              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95">
                  {currentUser ? (
                    <div className="px-3 py-2.5 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={currentUser.avatar_url}
                          alt=""
                          className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-200"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">{displayName(currentUser)}</p>
                          <p className="text-[11px] text-slate-500 truncate">{currentUser.email || currentUser.phone || currentUser.student_id}</p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                              currentUser.user_role === 'Admin' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'
                            }`}>
                              {currentUser.user_role === 'Admin' ? 'แอดมิน' : 'สมาชิก'}
                            </span>
                            <span className="text-[10px] text-slate-400">{providerLabel(currentUser)}</span>
                            <span className="text-[10px] text-amber-700 font-semibold">{currentUser.total_points} แต้ม</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="px-3 py-1.5 border-b border-slate-100">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        ผู้เยี่ยมชม
                      </p>
                    </div>
                  )}

                  {!currentUser && (
                    <div className="p-1.5">
                      <button
                        id="switch-user-guest"
                        onClick={() => {
                          setGuestMode();
                          setShowRoleMenu(false);
                        }}
                        className="w-full flex items-center justify-between p-2 rounded-xl text-left text-xs bg-slate-100 text-slate-900 font-semibold"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-slate-200 flex items-center justify-center text-slate-600 text-[10px] font-bold">
                            G
                          </div>
                          <span className="font-medium">ผู้เยี่ยมชม (Guest)</span>
                        </div>
                      </button>
                    </div>
                  )}

                  <div className="border-t border-slate-100 p-1.5 pt-2 space-y-1">
                    <button
                      id="header-goto-settings-btn"
                      onClick={() => {
                        setActiveTab('settings');
                        setShowRoleMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <SettingsIcon className="w-3.5 h-3.5 text-slate-500" />
                      <span>ตั้งค่าระบบ & โปรไฟล์</span>
                    </button>

                    {!currentUser ? (
                      <button
                        id="header-open-auth-login"
                        onClick={() => {
                          setShowRoleMenu(false);
                          openAuthModal();
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-xs text-center cursor-pointer"
                      >
                        เข้าสู่ระบบ
                      </button>
                    ) : (
                      <button
                        id="header-logout-btn"
                        onClick={() => {
                          logout();
                          setShowRoleMenu(false);
                        }}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl hover:bg-rose-50 text-rose-600 text-xs font-medium transition-colors cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>ออกจากระบบ</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Login Button */}
            {!currentUser && (
              <button
                id="header-quick-login-btn"
                onClick={openAuthModal}
                className="hidden sm:inline-flex items-center px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-semibold shadow-md shadow-emerald-500/25 transition-all"
              >
                เข้าสู่ระบบ
              </button>
            )}

          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="lg:hidden flex items-center justify-between overflow-x-auto py-2 px-2 border-t border-slate-100/80 gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`mobile-nav-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs whitespace-nowrap font-semibold transition-all ${
                  isActive
                    ? item.id === 'admin'
                      ? 'bg-violet-600 text-white'
                      : 'bg-white text-emerald-800 shadow-sm'
                    : 'text-slate-500 hover:bg-white/70'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      </div>

      {/* Points Info Popup */}
      {showPointsInfo && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2 text-amber-600">
                  <Coins className="w-5 h-5 fill-amber-400" />
                  <h3 className="text-base font-bold text-slate-900">
                    {language === 'th' ? 'รายละเอียดแต้มสะสม' : 'Points Details'}
                  </h3>
                </div>
                <button 
                  onClick={() => setShowPointsInfo(false)}
                  className="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 p-1.5 rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-3">
                <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100/50 space-y-2 text-sm text-slate-700">
                  <p className="font-semibold text-slate-900 flex items-center gap-2">
                    <Gift className="w-4 h-4 text-emerald-600" />
                    {language === 'th' ? 'แต้มนี้ใช้ทำอะไรได้บ้าง?' : 'What can I use them for?'}
                  </p>
                  <p className="pl-6 leading-relaxed">
                    {language === 'th' 
                      ? 'สามารถใช้แลกของรางวัล แลกเป็นส่วนลด หรือบริจาคให้กับโครงการเพื่อสิ่งแวดล้อมได้ที่เมนู "ของรางวัล"' 
                      : 'Can be used to redeem rewards, get discounts, or donate to eco-projects in the "Rewards" menu.'}
                  </p>
                </div>
                
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2 text-sm text-slate-700">
                  <p className="font-semibold text-slate-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-rose-500" />
                    {language === 'th' ? 'วันหมดอายุ' : 'Expiration Date'}
                  </p>
                  <p className="pl-6 text-rose-600 font-bold">
                    31 {language === 'th' ? 'ธันวาคม' : 'December'} 2026
                  </p>
                  <p className="pl-6 text-xs text-slate-500">
                    {language === 'th' ? '* กรุณาใช้แต้มก่อนวันหมดอายุ' : '* Please use points before expiration.'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowPointsInfo(false)}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-xs transition-colors mt-2 cursor-pointer"
              >
                {language === 'th' ? 'เข้าใจแล้ว' : 'Got it'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
};
