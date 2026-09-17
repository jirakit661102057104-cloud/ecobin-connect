import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';
import { 
  User as UserIcon, 
  Globe, 
  FileText, 
  Gift, 
  Shield, 
  CheckCircle2, 
  Save, 
  Download, 
  Eye, 
  QrCode, 
  Sparkles, 
  ChevronRight, 
  BookOpen, 
  Recycle, 
  Building, 
  GraduationCap, 
  X, 
  Copy, 
  Check, 
  LogOut, 
  LogIn,
  ExternalLink,
  Edit3
} from 'lucide-react';

interface SettingsViewProps {
  setActiveTab: (tab: string) => void;
  openAuthModal: () => void;
}

type SettingsPopupType = 'profile' | 'language' | 'docs3r' | 'redemptions' | 'privacy' | null;

export const SettingsView: React.FC<SettingsViewProps> = ({
  setActiveTab,
  openAuthModal
}) => {
  const { 
    currentUser, 
    updateUserProfile, 
    language, 
    setLanguage, 
    redemptions,
    setGuestMode,
    addToast
  } = useApp();

  // Active Popup Modal state
  const [activePopup, setActivePopup] = useState<SettingsPopupType>(null);

  // Profile Form State
  const [fullName, setFullName] = useState(currentUser?.full_name || '');
  const [studentId, setStudentId] = useState(currentUser?.student_id || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [department, setDepartment] = useState(currentUser?.department || 'คณะวิทยาศาสตร์และเทคโนโลยี');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80');
  const [isSaving, setIsSaving] = useState(false);

  // Sync state when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.full_name || '');
      setStudentId(currentUser.student_id || '');
      setEmail(currentUser.email || '');
      setDepartment(currentUser.department || 'คณะวิทยาศาสตร์และเทคโนโลยี');
      setAvatarUrl(currentUser.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80');
    }
  }, [currentUser]);

  // Secondary Modals
  const [selectedRedemption, setSelectedRedemption] = useState<any | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<{ title: string; subtitle: string; content: React.ReactNode } | null>(null);

  // Predefined Avatars
  const avatarOptions = [
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
  ];

  // User Redemptions filter
  const userRedemptions = currentUser 
    ? redemptions.filter(r => r.user_id === currentUser.user_id) 
    : redemptions;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      openAuthModal();
      return;
    }
    setIsSaving(true);
    setTimeout(() => {
      updateUserProfile({
        full_name: fullName.trim(),
        student_id: studentId.trim(),
        email: email.trim(),
        department: department,
        avatar_url: avatarUrl
      });
      setIsSaving(false);
      setActivePopup(null);
      addToast('success', 'บันทึกสำเร็จ', 'อัปเดตข้อมูลโปรไฟล์เรียบร้อย');
    }, 350);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    addToast('info', 'คัดลอกรหัสแล้ว', `คัดลอกรหัส ${code} เรียบร้อย`);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const menuList = [
    {
      id: 'profile' as const,
      title: language === 'th' ? 'แก้ไขโปรไฟล์' : 'Edit Profile',
      desc: language === 'th' ? 'จัดการข้อมูลส่วนบุคคล รหัสนักศึกษา คณะ และรูปประจำตัว' : 'Personal information, student ID, department and avatar',
      icon: UserIcon,
      badge: currentUser ? 'บัญชีของฉัน' : 'โหมดผู้เยี่ยมชม',
      color: 'text-blue-600 bg-blue-50 border-blue-100'
    },
    {
      id: 'language' as const,
      title: language === 'th' ? 'เปลี่ยนภาษา (Language)' : 'Language Settings',
      desc: language === 'th' ? 'เลือกภาษาการแสดงผลระบบ (ภาษาไทย / English)' : 'Display language preference (Thai / English)',
      icon: Globe,
      badge: language === 'th' ? '🇹🇭 ภาษาไทย' : '🇬🇧 English',
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100'
    },
    {
      id: 'docs3r' as const,
      title: 'Document 3Rs & คู่มือวิชาการ',
      desc: language === 'th' ? 'เอกสารมาตรฐานการคัดแยก 3Rs ค่าสัมประสิทธิ์คาร์บอน และแผนผังตู้ขยะ' : '3Rs guidelines, emission factors, and smart bin map',
      icon: BookOpen,
      badge: '3 เอกสาร',
      color: 'text-amber-600 bg-amber-50 border-amber-100'
    },
    {
      id: 'redemptions' as const,
      title: language === 'th' ? 'ประวัติการแลกของรางวัล' : 'Redemption History',
      desc: language === 'th' ? 'บัตรกำนัลและรหัสรับของรางวัล (Pickup Ticket / Code)' : 'Vouchers, coupons, and physical reward pickup codes',
      icon: Gift,
      badge: `${userRedemptions.length} รายการ`,
      color: 'text-purple-600 bg-purple-50 border-purple-100'
    },
    {
      id: 'privacy' as const,
      title: language === 'th' ? 'นโยบายความเป็นส่วนตัว' : 'Privacy Policy (PDPA)',
      desc: language === 'th' ? 'นโยบายคุ้มครองข้อมูลส่วนบุคคลตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล' : 'Personal data protection and academic research terms',
      icon: Shield,
      badge: 'PDPA Compliance',
      color: 'text-slate-700 bg-slate-100 border-slate-200'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      
      {/* Menu Action Cards - Click opens Pop-up */}
      <div className="bg-white rounded-3xl p-3 sm:p-4 border border-slate-100 shadow-2xs space-y-1.5">
        {menuList.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              id={`settings-tab-${item.id}`}
              onClick={() => setActivePopup(item.id)}
              className="w-full flex items-center justify-between p-3.5 sm:p-4 rounded-2xl hover:bg-emerald-50/50 transition-all border border-transparent hover:border-emerald-100 cursor-pointer group text-left"
            >
              <div className="flex items-center gap-3.5">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border shrink-0 group-hover:scale-105 transition-transform ${item.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                      {item.title}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                    {item.desc}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-emerald-700 group-hover:bg-white group-hover:shadow-2xs transition-all">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </button>
          );
        })}

        {/* Logout Menu Option inside Menu List */}
        {currentUser && (
          <>
            <div className="my-1.5 border-t border-slate-100" />
            <button
              id="settings-tab-logout"
              onClick={() => {
                setGuestMode();
                addToast('info', 'ออกจากระบบแล้ว', 'เปลี่ยนกลับเข้าสู่โหมดผู้เยี่ยมชม');
              }}
              className="w-full flex items-center justify-between p-3.5 sm:p-4 rounded-2xl hover:bg-rose-50/70 transition-all border border-transparent hover:border-rose-100/80 cursor-pointer group text-left"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center border shrink-0 group-hover:scale-105 transition-transform text-rose-600 bg-rose-50 border-rose-100">
                  <LogOut className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs sm:text-sm font-bold text-rose-600 group-hover:text-rose-700 transition-colors">
                      {language === 'th' ? 'ออกจากระบบ' : 'Log Out'}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                    {language === 'th' ? 'เปลี่ยนกลับเข้าสู่โหมดผู้เยี่ยมชม (Guest Mode)' : 'Switch back to Guest Mode'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-rose-600 group-hover:bg-white group-hover:shadow-2xs transition-all">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </button>
          </>
        )}
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-center sm:justify-start gap-2 px-2 text-xs text-slate-500">
        <GraduationCap className="w-4 h-4 text-emerald-700" />
        <span>EcoBin Connect • {language === 'th' ? 'โครงการวิจัย มรภ.เพชรบูรณ์ 2568' : 'PCRU Research Project 2025'}</span>
      </div>


      {/* ========================================================================= */}
      {/* PORTALLED POPUPS - Render directly to document.body for instant display */}
      {/* ========================================================================= */}

      {/* POPUP 1: EDIT PROFILE */}
      {activePopup === 'profile' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div 
            className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <UserIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">{language === 'th' ? 'แก้ไขโปรไฟล์ (Edit Profile)' : 'Edit Profile'}</h3>
                  <p className="text-[11px] text-slate-500">{language === 'th' ? 'ปรับปรุงข้อมูลส่วนตัว รหัสนักศึกษา และรูปประจำตัว' : 'Update personal info, student ID, and avatar.'}</p>
                </div>
              </div>
              <button 
                onClick={() => setActivePopup(null)} 
                className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!currentUser ? (
              <div className="p-6 bg-slate-50 rounded-2xl text-center space-y-3 border border-slate-100">
                <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center mx-auto text-slate-500">
                  <UserIcon className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">{language === 'th' ? 'โหมดผู้เยี่ยมชม (Guest Mode)' : 'Guest Mode'}</h4>
                <p className="text-xs text-slate-500">{language === 'th' ? 'เข้าสู่ระบบเพื่อแก้ไขข้อมูลส่วนตัวและสะสมแต้ม' : 'Login to edit profile and earn points.'}</p>
                <button
                  onClick={() => {
                    setActivePopup(null);
                    openAuthModal();
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {language === 'th' ? 'เข้าสู่ระบบ / สมัครสมาชิก' : 'Login / Register'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                {/* Avatar Picker */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">{language === 'th' ? 'รูปประจำตัว (Avatar):' : 'Avatar:'}</label>
                  <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <img 
                      src={avatarUrl} 
                      alt="" 
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-500 shrink-0 shadow-xs" 
                    />
                    <div className="flex-1 space-y-1">
                      <span className="text-[11px] text-slate-500 block">{language === 'th' ? 'เลือกรูปภาพโปรไฟล์:' : 'Select Profile Picture:'}</span>
                      <div className="flex flex-wrap gap-1.5">
                        {avatarOptions.map((url, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setAvatarUrl(url)}
                            className={`w-8 h-8 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                              avatarUrl === url ? 'border-emerald-600 ring-2 ring-emerald-500/20 scale-105 shadow-xs' : 'border-slate-200 opacity-70 hover:opacity-100'
                            }`}
                          >
                            <img src={url} alt={`Avatar ${idx}`} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-700">{language === 'th' ? 'ชื่อ-นามสกุล:' : 'Full Name:'}</label>
                    <input 
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-700">{language === 'th' ? 'รหัสนักศึกษา:' : 'Student ID:'}</label>
                    <input 
                      type="text"
                      required
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-700">{language === 'th' ? 'อีเมล:' : 'Email:'}</label>
                    <input 
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-700">{language === 'th' ? 'คณะ / หน่วยงาน:' : 'Department:'}</label>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                    >
                      <option value="คณะวิทยาศาสตร์และเทคโนโลยี">{language === 'th' ? 'คณะวิทยาศาสตร์และเทคโนโลยี' : 'Faculty of Science and Technology'}</option>
                      <option value="คณะวิทยาการจัดการ">{language === 'th' ? 'คณะวิทยาการจัดการ' : 'Faculty of Management Science'}</option>
                      <option value="คณะครุศาสตร์">{language === 'th' ? 'คณะครุศาสตร์' : 'Faculty of Education'}</option>
                      <option value="คณะมนุษยศาสตร์และสังคมศาสตร์">{language === 'th' ? 'คณะมนุษยศาสตร์และสังคมศาสตร์' : 'Faculty of Humanities and Social Sciences'}</option>
                      <option value="คณะเทคโนโลยีการเกษตรและเทคโนโลยีอุตสาหกรรม">{language === 'th' ? 'คณะเทคโนโลยีการเกษตรและเทคโนโลยีอุตสาหกรรม' : 'Faculty of Agricultural and Industrial Technology'}</option>
                      <option value="สำนักวิทยบริการและเทคโนโลยีสารสนเทศ">{language === 'th' ? 'สำนักวิทยบริการและเทคโนโลยีสารสนเทศ' : 'Office of Academic Resources and IT'}</option>
                      <option value="บุคลากร / หน่วยงานทั่วไป">{language === 'th' ? 'บุคลากร / หน่วยงานทั่วไป' : 'Staff / General Department'}</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setActivePopup(null)}
                    className="flex-1 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    {language === 'th' ? 'ยกเลิก' : 'Cancel'}
                  </button>

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSaving ? (language === 'th' ? 'กำลังบันทึก...' : 'Saving...') : (language === 'th' ? 'บันทึกโปรไฟล์' : 'Save Profile')}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>,
        document.body
      )}


      {/* POPUP 2: CHANGE LANGUAGE */}
      {activePopup === 'language' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div 
            className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">เปลี่ยนภาษา (Language)</h3>
                  <p className="text-[11px] text-slate-500">เลือกภาษาที่ต้องการให้ระบบแสดงผล</p>
                </div>
              </div>
              <button 
                onClick={() => setActivePopup(null)} 
                className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Thai Option */}
              <div 
                onClick={() => {
                  setLanguage('th');
                  setActivePopup(null);
                  addToast('info', 'เปลี่ยนภาษาแล้ว', 'ระบบแสดงผลเป็นภาษาไทย (TH)');
                }}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  language === 'th'
                    ? 'border-emerald-600 bg-emerald-50/50 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">🇹🇭</span>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900">ภาษาไทย (Thai)</h4>
                      <p className="text-[11px] text-slate-500">ภาษาเริ่มต้น มหาวิทยาลัยราชภัฏเพชรบูรณ์</p>
                    </div>
                  </div>
                  {language === 'th' && (
                    <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </div>
              </div>

              {/* English Option */}
              <div 
                onClick={() => {
                  setLanguage('en');
                  setActivePopup(null);
                  addToast('info', 'Language Changed', 'System language set to English (EN)');
                }}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  language === 'en'
                    ? 'border-emerald-600 bg-emerald-50/50 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">🇬🇧</span>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900">English (EN)</h4>
                      <p className="text-[11px] text-slate-500">International academic version</p>
                    </div>
                  </div>
                  {language === 'en' && (
                    <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setActivePopup(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}


      {/* POPUP 3: DOCUMENT 3Rs */}
      {activePopup === 'docs3r' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div 
            className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">{language === 'th' ? 'Document 3Rs & คู่มือวิชาการ' : 'Document 3Rs & Guidelines'}</h3>
                  <p className="text-[11px] text-slate-500">{language === 'th' ? 'เอกสารมาตรฐานและแนวทางการคัดแยกขยะ' : 'Standard documents and waste sorting guidelines'}</p>
                </div>
              </div>
              <button 
                onClick={() => setActivePopup(null)} 
                className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto pr-1 space-y-3 flex-1">
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-blue-50 p-2.5 rounded-xl border border-blue-100">
                  <strong className="text-blue-700 block">Reduce</strong>
                  <span className="text-[10px] text-slate-600">{language === 'th' ? 'ลดการใช้' : 'Reduce usage'}</span>
                </div>
                <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
                  <strong className="text-emerald-700 block">Reuse</strong>
                  <span className="text-[10px] text-slate-600">{language === 'th' ? 'ใช้ซ้ำ' : 'Reuse'}</span>
                </div>
                <div className="bg-purple-50 p-2.5 rounded-xl border border-purple-100">
                  <strong className="text-purple-700 block">Recycle</strong>
                  <span className="text-[10px] text-slate-600">{language === 'th' ? 'แปรรูปใหม่' : 'Recycle'}</span>
                </div>
              </div>

              {/* Doc 1 */}
              <div className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{language === 'th' ? 'คู่มือแนวทางการคัดแยกขยะพลาสติก 2568' : 'Plastic Waste Sorting Guidelines 2025'}</h4>
                    <p className="text-[10px] text-slate-500">{language === 'th' ? 'PDF • 18 หน้า • มาตรฐาน TGO' : 'PDF • 18 Pages • TGO Standard'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setViewingDoc({
                      title: language === 'th' ? 'คู่มือแนวทางการคัดแยกขยะพลาสติก มรภ.เพชรบูรณ์ 2568' : 'PCRU Plastic Waste Sorting Guidelines 2025',
                      subtitle: language === 'th' ? 'ฉบับสมบูรณ์สำหรับนักศึกษาและบุคลากร' : 'Complete edition for students and staff',
                      content: (
                        <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
                          <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-emerald-900">
                            <strong>{language === 'th' ? 'บทสรุปผู้บริหาร:' : 'Executive Summary:'}</strong> {language === 'th' ? 'โครงการวิจัยนี้มุ่งยกระดับมหาวิทยาลัยราชภัฏเพชรบูรณ์สู่ Green University ด้วยการส่งเสริมการคัดแยกขยะต้นทางผ่านโมเดล Smart Gamification' : 'This research project aims to elevate PCRU to a Green University by promoting source waste sorting via Smart Gamification.'}
                          </div>
                          <h4 className="font-bold text-slate-900">{language === 'th' ? 'ขั้นตอนการจัดการขยะพลาสติกขวดใส (PET #1)' : 'PET #1 Plastic Sorting Steps'}</h4>
                          <p>• {language === 'th' ? 'เทของเหลวออกให้หมดก่อนทิ้ง' : 'Empty all liquid before disposing'}</p>
                          <p>• {language === 'th' ? 'แกะฉลากและแยกฝาขวดเพื่อเพิ่มมูลค่าการรีไซเคิล' : 'Remove label and separate cap to increase recycling value'}</p>
                          <p>• {language === 'th' ? 'บีบขวดให้แบนเพื่อประหยัดพื้นที่ในถังขยะอัจฉริยะ' : 'Crush the bottle flat to save space'}</p>
                        </div>
                      )
                    })}
                    className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-bold rounded-lg transition-colors cursor-pointer shadow-2xs"
                  >
                    {language === 'th' ? 'เปิดอ่าน' : 'Read'}
                  </button>
                  <button
                    onClick={() => addToast('success', language === 'th' ? 'ดาวน์โหลดสำเร็จ' : 'Download Complete', language === 'th' ? 'ดาวน์โหลดเอกสารคู่มือ 3Rs' : 'Downloaded 3Rs manual')}
                    className="p-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Doc 2 */}
              <div className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Recycle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{language === 'th' ? 'ตาราง Emission Factor (TGO Reference)' : 'Emission Factor Table (TGO Reference)'}</h4>
                    <p className="text-[10px] text-slate-500">0.08 kg CO₂e / 1 PET Bottle</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setViewingDoc({
                      title: language === 'th' ? 'ตารางค่าสัมประสิทธิ์การปล่อยก๊าซเรือนกระจก (Emission Factor Table)' : 'Emission Factor Table',
                      subtitle: language === 'th' ? 'องค์การบริหารจัดการก๊าซเรือนกระจก (องค์การมหาชน) - TGO' : 'Thailand Greenhouse Gas Management Organization - TGO',
                      content: (
                        <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
                          <p>{language === 'th' ? 'สูตรการคำนวณการลดก๊าซเรือนกระจกในระบบ EcoBin PCRU:' : 'Calculation formula for EcoBin PCRU system:'}</p>
                          <div className="p-3 bg-slate-100 rounded-xl font-mono text-slate-800 text-xs">
                            Carbon_Saved (kg CO₂e) = Bottle_Count × 0.08 kg CO₂e
                          </div>
                        </div>
                      )
                    })}
                    className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-bold rounded-lg transition-colors cursor-pointer shadow-2xs"
                  >
                    {language === 'th' ? 'เปิดอ่าน' : 'Read'}
                  </button>
                  <button
                    onClick={() => addToast('success', language === 'th' ? 'ดาวน์โหลดสำเร็จ' : 'Download Complete', language === 'th' ? 'ดาวน์โหลดตารางค่า Emission Factor' : 'Downloaded Emission Factor table')}
                    className="p-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Doc 3 */}
              <div className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <Building className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{language === 'th' ? 'แผนผังตู้ขยะอัจฉริยะในมหาวิทยาลัย' : 'Smart Bin Campus Map'}</h4>
                    <p className="text-[10px] text-slate-500">{language === 'th' ? 'จุดติดตั้ง 5 อาคารหลัก มรภ.เพชรบูรณ์' : '5 main locations at PCRU'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setViewingDoc({
                      title: language === 'th' ? 'แผนผังจุดติดตั้งตู้ขยะอัจฉริยะ (Smart Bins Campus Map)' : 'Smart Bins Campus Map',
                      subtitle: language === 'th' ? 'มหาวิทยาลัยราชภัฏเพชรบูรณ์' : 'PCRU',
                      content: (
                        <div className="space-y-2 text-xs text-slate-700">
                          <p className="font-bold">{language === 'th' ? 'จุดบริการตู้รับขยะขวดพลาสติกอัจฉริยะ:' : 'Smart Plastic Bin Locations:'}</p>
                          <ul className="space-y-1.5">
                            <li className="p-2 rounded-lg bg-slate-100">1. {language === 'th' ? 'อาคาร 1 คณะวิทยาศาสตร์และเทคโนโลยี' : 'Building 1 Faculty of Science'}</li>
                            <li className="p-2 rounded-lg bg-slate-100">2. {language === 'th' ? 'โรงอาหารกลาง (Main Canteen)' : 'Main Canteen'}</li>
                            <li className="p-2 rounded-lg bg-slate-100">3. {language === 'th' ? 'อาคารเทคโนโลยีสารสนเทศ (IT Center)' : 'IT Center'}</li>
                            <li className="p-2 rounded-lg bg-slate-100">4. {language === 'th' ? 'สำนักวิทยบริการและหอสมุดกลาง' : 'Library'}</li>
                            <li className="p-2 rounded-lg bg-slate-100">5. {language === 'th' ? 'อาคารคณะวิทยาการจัดการ' : 'Faculty of Management Science'}</li>
                          </ul>
                        </div>
                      )
                    })}
                    className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-bold rounded-lg transition-colors cursor-pointer shadow-2xs"
                  >
                    {language === 'th' ? 'เปิดอ่าน' : 'Read'}
                  </button>
                  <button
                    onClick={() => addToast('success', language === 'th' ? 'ดาวน์โหลดสำเร็จ' : 'Download Complete', language === 'th' ? 'ดาวน์โหลดแผนที่จุดรับขยะ' : 'Downloaded Campus Map')}
                    className="p-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end shrink-0">
              <button
                onClick={() => setActivePopup(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                {language === 'th' ? 'ปิด' : 'Close'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}


      {/* POPUP 4: REDEMPTIONS HISTORY */}
      {activePopup === 'redemptions' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div 
            className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">{language === 'th' ? 'ประวัติการแลกของรางวัล' : 'Redemption History'}</h3>
                  <p className="text-[11px] text-slate-500">{language === 'th' ? 'รหัสรับของและบัตรกำนัลที่แลกไว้' : 'Claim codes and redeemed vouchers'}</p>
                </div>
              </div>
              <button 
                onClick={() => setActivePopup(null)} 
                className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto pr-1 space-y-2.5 flex-1">
              {userRedemptions.length === 0 ? (
                <div className="p-8 bg-slate-50 rounded-2xl text-center space-y-2 border border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mx-auto">
                    <Gift className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-800">{language === 'th' ? 'ยังไม่มีรายการแลกของรางวัล' : 'No rewards redeemed yet'}</h4>
                  <p className="text-[11px] text-slate-500">{language === 'th' ? 'สะสมแต้มจากการคัดแยกขวดพลาสติกเพื่อแลกรับรางวัล' : 'Earn points by sorting plastic bottles to redeem rewards.'}</p>
                </div>
              ) : (
                userRedemptions.map((redemption) => (
                  <div 
                    key={redemption.redeem_id}
                    className="bg-slate-50/80 rounded-2xl p-3 border border-slate-100 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <img 
                        src={redemption.reward_image} 
                        alt="" 
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0" 
                      />
                      <div>
                        <h4 className="font-bold text-xs text-slate-900">{redemption.reward_name}</h4>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          <span>{language === 'th' ? `ใช้ ${redemption.points_used} แต้ม` : `${redemption.points_used} pts`}</span>
                          <span>•</span>
                          <span className="text-slate-400">{redemption.redeem_date}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedRedemption(redemption)}
                      className="px-2.5 py-1.5 bg-purple-700 hover:bg-purple-800 text-white text-[11px] font-bold rounded-xl shadow-2xs transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <QrCode className="w-3 h-3" />
                      <span>{language === 'th' ? 'แสดงบัตร' : 'Show Voucher'}</span>
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-between items-center shrink-0">
              <button
                onClick={() => {
                  setActivePopup(null);
                  setActiveTab('rewards');
                }}
                className="text-xs text-purple-700 font-bold hover:underline"
              >
                {language === 'th' ? 'ดูแคตตาล็อกของรางวัล \u2192' : 'View Rewards Catalog \u2192'}
              </button>

              <button
                onClick={() => setActivePopup(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                {language === 'th' ? 'ปิด' : 'Close'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}


      {/* POPUP 5: PRIVACY POLICY */}
      {activePopup === 'privacy' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div 
            className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">{language === 'th' ? 'นโยบายความเป็นส่วนตัว (PDPA)' : 'Privacy Policy (PDPA)'}</h3>
                  <p className="text-[11px] text-slate-500">{language === 'th' ? 'คุ้มครองข้อมูลส่วนบุคคลตาม พ.ร.บ. 2562' : 'Personal Data Protection Act 2019'}</p>
                </div>
              </div>
              <button 
                onClick={() => setActivePopup(null)} 
                className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto pr-1 space-y-3 text-xs text-slate-600 flex-1">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1">
                <h4 className="font-bold text-slate-900 text-xs">{language === 'th' ? '1. ข้อมูลที่เราเก็บรวบรวม' : '1. Data We Collect'}</h4>
                <p>• {language === 'th' ? 'ข้อมูลระบุตัวตน: ชื่อ-นามสกุล, รหัสนักศึกษา, อีเมลมหาวิทยาลัย และคณะ/สังกัด' : 'Identity: Name, Student ID, Email, Department'}</p>
                <p>• {language === 'th' ? 'ข้อมูลกิจกรรม: ภาพถ่ายขวดพลาสติกเพื่อตรวจสอบ, จุดทิ้งขยะ (Bin Location), และแต้มสะสม' : 'Activity: Photos of sorted waste, Bin Location, Points'}</p>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1">
                <h4 className="font-bold text-slate-900 text-xs">{language === 'th' ? '2. วัตถุประสงค์ในการประมวลผลข้อมูล' : '2. Purpose of Data Processing'}</h4>
                <p>• {language === 'th' ? 'เพื่อประเมินและยืนยันการคัดแยกขยะพลาสติกตามเกณฑ์โครงการวิจัย' : 'To evaluate and confirm waste sorting per project guidelines'}</p>
                <p>• {language === 'th' ? 'เพื่อคำนวณแต้มสะสมและสถิติการลดก๊าซเรือนกระจก (CO₂e)' : 'To calculate points and CO₂e reduction statistics'}</p>
                <p>• {language === 'th' ? 'เพื่อจัดทำรายงานสถิติวิจัยทางวิชาการ (ข้อมูลภาพรวม)' : 'To compile academic research statistics (aggregated)'}</p>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-900 space-y-0.5 text-[11px]">
                <h5 className="font-bold">{language === 'th' ? 'ติดต่อคณะผู้วิจัย:' : 'Contact Research Team:'}</h5>
                <p>{language === 'th' ? 'คณะวิทยาศาสตร์และเทคโนโลยี มหาวิทยาลัยราชภัฏเพชรบูรณ์' : 'Faculty of Science and Technology, PCRU'}</p>
                <p>{language === 'th' ? 'อีเมล: ecobin-research@pcru.ac.th' : 'Email: ecobin-research@pcru.ac.th'}</p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end shrink-0">
              <button
                onClick={() => setActivePopup(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                {language === 'th' ? 'รับทราบและปิด' : 'Acknowledge & Close'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}


      {/* SECONDARY MODAL: PICKUP TICKET */}
      {selectedRedemption && createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
          <div 
            className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4 text-center animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-purple-700 flex items-center gap-1">
                <Gift className="w-3.5 h-3.5" />
                <span>{language === 'th' ? 'บัตรรับของรางวัล' : 'Reward Voucher'}</span>
              </span>
              <button 
                onClick={() => setSelectedRedemption(null)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="w-18 h-18 rounded-2xl overflow-hidden mx-auto bg-slate-100 border border-slate-200">
                <img src={selectedRedemption.reward_image} alt="" className="w-full h-full object-cover" />
              </div>

              <div>
                <h3 className="font-bold text-sm text-slate-900">{selectedRedemption.reward_name}</h3>
                <p className="text-xs text-slate-500">{language === 'th' ? `ใช้ ${selectedRedemption.points_used} แต้ม` : `${selectedRedemption.points_used} pts`} • {selectedRedemption.redeem_date}</p>
              </div>

              {/* QR Code */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center justify-center space-y-1.5">
                <div className="w-28 h-28 bg-white p-2 rounded-xl border border-slate-300 flex items-center justify-center shadow-2xs">
                  <QrCode className="w-22 h-22 text-slate-900" />
                </div>
                <span className="text-[10px] text-slate-400">{language === 'th' ? 'สแกนที่จุดประชาสัมพันธ์เพื่อรับของ' : 'Scan at info desk to claim'}</span>
              </div>

              {/* Pickup Code */}
              <div className="bg-purple-50 p-3 rounded-2xl border border-purple-200 flex items-center justify-between">
                <div className="text-left">
                  <span className="text-[10px] text-purple-600 block">{language === 'th' ? 'รหัสรับของรางวัล' : 'Pickup Code'}</span>
                  <strong className="text-sm font-mono text-purple-900 tracking-wider">
                    {selectedRedemption.pickup_code}
                  </strong>
                </div>

                <button
                  onClick={() => handleCopyCode(selectedRedemption.pickup_code)}
                  className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? (language === 'th' ? 'คัดลอกแล้ว' : 'Copied') : (language === 'th' ? 'คัดลอก' : 'Copy')}</span>
                </button>
              </div>
            </div>

            <button
              onClick={() => setSelectedRedemption(null)}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              {language === 'th' ? 'ปิดหน้าต่าง' : 'Close Window'}
            </button>
          </div>
        </div>,
        document.body
      )}


      {/* SECONDARY MODAL: DOCUMENT READER */}
      {viewingDoc && createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
          <div 
            className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">{viewingDoc.title}</h3>
                <p className="text-xs text-slate-500">{viewingDoc.subtitle}</p>
              </div>
              <button 
                onClick={() => setViewingDoc(null)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto pr-1 flex-1">
              {viewingDoc.content}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setViewingDoc(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};
