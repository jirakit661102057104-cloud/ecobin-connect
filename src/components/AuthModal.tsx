import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  User, 
  Lock, 
  Mail, 
  UserPlus, 
  LogIn, 
  X, 
  Sparkles, 
  CheckCircle2, 
  GraduationCap, 
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { motion } from 'motion/react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { registerUser, loginUser, loginAs } = useApp();

  const [isLoginMode, setIsLoginMode] = useState(true);
  const [emailOrStudentId, setEmailOrStudentId] = useState('');
  const [password, setPassword] = useState('');

  // Register state
  const [regName, setRegName] = useState('');
  const [regStudentId, setRegStudentId] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  if (!isOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = loginUser(emailOrStudentId, password);
    if (success) {
      onClose();
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = registerUser(regName, regStudentId, regEmail, regPassword);
    if (success) {
      onClose();
    }
  };

  const handleQuickLogin = (role: 'Member' | 'Admin' | 'Guest') => {
    loginAs(role);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 relative space-y-5"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto mb-2">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">
            {isLoginMode ? 'เข้าสู่ระบบ EcoBin Connect' : 'สมัครสมาชิกใหม่'}
          </h3>
          <p className="text-xs text-slate-500">
            ระบบบริหารจัดการข้อมูลการคัดแยกขยะ มรภ.เพชรบูรณ์
          </p>
        </div>

        {/* Tab switch (Login / Register) */}
        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setIsLoginMode(true)}
            className={`flex-1 py-2 rounded-lg transition-all ${
              isLoginMode ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            เข้าสู่ระบบ (Login)
          </button>
          <button
            type="button"
            onClick={() => setIsLoginMode(false)}
            className={`flex-1 py-2 rounded-lg transition-all ${
              !isLoginMode ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            สมัครสมาชิก (Register)
          </button>
        </div>

        {/* Form */}
        {isLoginMode ? (
          <form onSubmit={handleLoginSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                อีเมล หรือ รหัสนักศึกษา / บุคลากร:
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={emailOrStudentId}
                  onChange={(e) => setEmailOrStudentId(e.target.value)}
                  placeholder="เช่น st661102057106@gmail.com หรือ 661102057106"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                รหัสผ่าน (Password):
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="กรอกรหัสผ่าน"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-1.5"
            >
              <LogIn className="w-4 h-4" />
              <span>เข้าสู่ระบบ</span>
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="space-y-2.5 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">ชื่อ-นามสกุล:</label>
              <input
                type="text"
                required
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="เช่น ศุภณัฐ ปลื้มบุญ"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">รหัสนักศึกษา/บุคลากร:</label>
                <input
                  type="text"
                  required
                  value={regStudentId}
                  onChange={(e) => setRegStudentId(e.target.value)}
                  placeholder="เช่น 661102057106"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">อีเมล:</label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="st...@gmail.com"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">กำหนดรหัสผ่าน:</label>
              <input
                type="password"
                required
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="อย่างน้อย 6 ตัวอักษร"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-1.5 mt-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>สมัครสมาชิกและรับโบนัส +50 แต้ม</span>
            </button>
          </form>
        )}

        {/* Quick Demo One-Click Logins */}
        <div className="pt-3 border-t border-slate-100 space-y-2">
          <p className="text-[11px] font-semibold text-slate-400 text-center uppercase tracking-wider">
            หรือคลิกเข้าสู่ระบบด่วนด้วยบัญชีทดสอบ (Demo Accounts)
          </p>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              id="quick-login-member"
              onClick={() => handleQuickLogin('Member')}
              className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-900 text-left transition-colors"
            >
              <div className="flex items-center gap-1.5 font-bold">
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>นักศึกษา (Member)</span>
              </div>
              <span className="text-[10px] text-emerald-700 block mt-0.5">ศุภณัฐ ปลื้มบุญ</span>
            </button>

            <button
              type="button"
              id="quick-login-admin"
              onClick={() => handleQuickLogin('Admin')}
              className="p-2.5 rounded-xl border border-purple-200 bg-purple-50/70 hover:bg-purple-100 text-purple-900 text-left transition-colors"
            >
              <div className="flex items-center gap-1.5 font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                <span>ผู้ดูแลระบบ (Admin)</span>
              </div>
              <span className="text-[10px] text-purple-700 block mt-0.5">จิรกิตติ์ ตันตระกูล</span>
            </button>
          </div>
        </div>

      </motion.div>
    </div>
  );
};
