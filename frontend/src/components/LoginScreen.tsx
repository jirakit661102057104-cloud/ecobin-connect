'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'motion/react';
import {
  Recycle,
  Lock,
  Mail,
  Phone,
  User,
  LogIn,
  GraduationCap,
  ShieldCheck,
  UserCheck,
  Eye,
  EyeOff,
  Leaf,
  Camera,
  Gift,
  Loader2,
  ArrowRight,
  Coins,
  MapPin,
  Sparkles,
  TreePine,
  CheckCircle2,
  QrCode,
  Users,
  Code2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DEMO_LOGIN, GOOGLE_CLIENT_ID } from '../lib/config';
import { BrandLogo } from './BrandLogo';
import { GoogleSignInButton } from './GoogleSignInButton';
import { StrongPasswordFields } from './StrongPasswordFields';
import { isStrongPassword } from '../lib/password';

const PLASTICS = [
  { n: 1, name: 'PET' },
  { n: 2, name: 'HDPE' },
  { n: 3, name: 'PVC' },
  { n: 4, name: 'LDPE' },
  { n: 5, name: 'PP' },
  { n: 6, name: 'PS' },
  { n: 7, name: 'OTHER' },
];

const STEPS = [
  { icon: Camera, title: 'ถ่ายรูปขวด', desc: 'วางขวดให้เห็นสัญลักษณ์รีไซเคิล' },
  { icon: Sparkles, title: 'AI ตรวจประเภท', desc: 'ระบบอ่านเบอร์ 1–7 และนับขวด' },
  { icon: Coins, title: 'ได้แต้มทันที', desc: 'สะสมแต้ม แลกของรางวัลใน มรภ.พช.' },
];

export const LoginScreen: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginUser, loginAs, setGuestMode, loginGoogle, registerUser, currentUser, authReady } = useApp();

  const [isLoginMode, setIsLoginMode] = useState(searchParams.get('mode') !== 'register');
  const [authMethod, setAuthMethod] = useState<'account' | 'phone' | 'email'>('account');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [regLogin, setRegLogin] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPasswordConfirm, setRegPasswordConfirm] = useState('');

  const [emailOrStudentId, setEmailOrStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [developerMode, setDeveloperMode] = useState(false);

  const googleHandled = React.useRef(false);
  const googleError = searchParams.get('google_error');

  useEffect(() => {
    if (authReady && currentUser) {
      router.replace('/');
    }
  }, [authReady, currentUser, router]);

  useEffect(() => {
    if (searchParams.get('google_error')) {
      return;
    }
    if (searchParams.get('google') !== '1' || googleHandled.current) return;
    const raw = document.cookie.split('; ').find((c) => c.startsWith('ecobin_google_credential='));
    if (!raw) return;
    googleHandled.current = true;
    const token = decodeURIComponent(raw.slice('ecobin_google_credential='.length));
    document.cookie = 'ecobin_google_credential=; Max-Age=0; path=/';
    (async () => {
      setBusy(true);
      const ok = await loginGoogle({ idToken: token });
      setBusy(false);
      if (ok) router.replace('/');
      else router.replace('/login');
    })();
  }, [searchParams, loginGoogle, router]);

  const enterAsGuest = async () => {
    setBusy(true);
    await setGuestMode();
    setBusy(false);
    router.push('/');
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const success = await loginUser(emailOrStudentId, password);
    setBusy(false);
    if (success) router.push('/');
  };

  const handleQuickLogin = async (role: 'Member' | 'Admin') => {
    setBusy(true);
    await loginAs(role);
    setBusy(false);
    router.push('/');
  };

  const handleGoogleToken = async (idToken: string) => {
    setBusy(true);
    const ok = await loginGoogle({ idToken });
    setBusy(false);
    if (ok) router.push('/');
  };

  const handleRegisterNext = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regLogin.trim() || !isStrongPassword(regPassword) || regPassword !== regPasswordConfirm) return;
    setBusy(true);
    const ok = await registerUser({
      login: regLogin.trim(),
      password: regPassword,
      first_name: '',
      last_name: '',
    });
    setBusy(false);
    if (ok) router.push('/');
  };

  const inputClass =
    'w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 focus:bg-white transition-all';

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.05fr_0.95fr] text-slate-900">
      <div className="relative hidden lg:flex flex-col overflow-hidden bg-emerald-950 text-white">
        <img
          src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=1400&auto=format&fit=crop&q=70"
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-25"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-emerald-900/92 to-teal-950" />
        <div className="absolute -left-24 top-24 w-80 h-80 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="absolute right-0 bottom-0 w-96 h-96 rounded-full bg-teal-400/10 blur-3xl" />

        <div className="relative z-10 flex flex-col h-full p-8 xl:p-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BrandLogo className="w-14 h-14 rounded-2xl shadow-lg shadow-emerald-950/30" />
              <div>
                <p className="text-lg font-black tracking-tight">EcoBin Connect</p>
                <p className="text-emerald-200 text-[11px] font-medium">Green Campus · Smart Recycling</p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/10 border border-white/15">
              PCRU 2026
            </span>
          </div>

          <div className="mt-10 space-y-5 max-w-xl">
            <p className="inline-flex items-center gap-2 text-[11px] font-semibold bg-emerald-400/15 text-emerald-100 px-3 py-1.5 rounded-full border border-emerald-300/20">
              <GraduationCap className="w-3.5 h-3.5" />
              มหาวิทยาลัยราชภัฏเพชรบูรณ์ · คณะวิทยาศาสตร์และเทคโนโลยี
            </p>
            <h1 className="text-4xl xl:text-[2.75rem] font-black leading-[1.15]">
              คัดแยกขวดพลาสติก
              <span className="block text-emerald-300">ได้แต้มจริง แลกของรักษ์โลก</span>
            </h1>
            <p className="text-emerald-50/85 text-sm leading-relaxed max-w-lg">
              เว็บแอปสำหรับนักศึกษาและบุคลากร ถ่ายภาพขวดแล้วให้ AI ช่วยอ่านประเภทพลาสติก
              บันทึกแต้มและปริมาณคาร์บอนที่ลดได้เข้าบัญชีสมาชิก
            </p>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-3">
            {[
              { icon: Recycle, value: '7', label: 'ประเภทพลาสติก' },
              { icon: MapPin, value: 'Soon', label: 'จุดคัดแยกใน มรภ.พช.' },
              { icon: Coins, value: '+50', label: 'แต้มโบนัสสมาชิกใหม่' },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl bg-white/8 border border-white/12 p-3.5 backdrop-blur-sm">
                <s.icon className="w-4 h-4 text-emerald-300 mb-2" />
                <p className="text-2xl font-black text-white">{s.value}</p>
                <p className="text-[11px] text-emerald-100/80 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-5 gap-3 flex-1 min-h-0">
            <div className="col-span-3 relative rounded-3xl overflow-hidden border border-white/15 shadow-2xl min-h-[220px]">
              <img
                src="https://images.unsplash.com/photo-1563245372-f21724e3856d?w=900&auto=format&fit=crop&q=70"
                alt="ขวดพลาสติกรีไซเคิล"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/80 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                <span className="text-xs font-semibold bg-black/40 backdrop-blur px-2.5 py-1 rounded-lg">
                  PET เบอร์ 1 · ขวดน้ำใส
                </span>
                <span className="text-[10px] font-bold bg-emerald-400 text-emerald-950 px-2 py-1 rounded-lg">
                  +10 แต้ม / ขวด
                </span>
              </div>
            </div>
            <div className="col-span-2 flex flex-col gap-3">
              <div className="relative flex-1 rounded-3xl overflow-hidden border border-white/15 min-h-[100px]">
                <img
                  src="https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=600&auto=format&fit=crop&q=70"
                  alt="ขวด HDPE"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
              <div className="rounded-3xl bg-white/10 border border-white/12 p-3.5 backdrop-blur-sm flex-1 flex flex-col justify-center">
                <div className="flex items-center gap-2 text-emerald-200 text-[11px] font-semibold mb-2">
                  <TreePine className="w-3.5 h-3.5" />
                  จุดคัดแยกใกล้คุณ
                </div>
                <p className="text-lg font-black text-white tracking-tight">Coming soon</p>
                <p className="text-[11px] text-emerald-100/75 mt-1 leading-relaxed">
                  แผนที่จุดคัดแยกใน มรภ.พช. กำลังจะเปิดให้ใช้งานเร็วๆ นี้
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {PLASTICS.map((p) => (
              <span
                key={p.n}
                className="inline-flex items-center gap-1.5 text-[11px] font-bold bg-white/10 border border-white/15 rounded-full px-2.5 py-1"
              >
                <span className="w-5 h-5 rounded-full bg-emerald-400 text-emerald-950 flex items-center justify-center text-[10px]">
                  {p.n}
                </span>
                {p.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="relative flex flex-col min-h-screen">
        <div className="absolute inset-0 opacity-[0.35] pointer-events-none bg-[radial-gradient(#10b981_1.2px,transparent_1.2px)] [background-size:18px_18px]" />
        <div className="absolute top-10 right-8 w-40 h-40 rounded-full bg-emerald-200/50 blur-3xl pointer-events-none" />
        <div className="absolute bottom-16 left-6 w-48 h-48 rounded-full bg-teal-200/40 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col flex-1 p-5 sm:p-8 lg:p-10">
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="lg:hidden flex items-center gap-2.5">
              <BrandLogo className="w-11 h-11 rounded-xl" />
              <div>
                <p className="font-bold text-slate-900">EcoBin Connect</p>
                <p className="text-[11px] text-slate-500">มรภ.เพชรบูรณ์</p>
              </div>
            </div>
            <div className="hidden lg:flex items-center gap-2 text-[11px] text-slate-500 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              บัญชีสมาชิกมหาวิทยาลัย
            </div>
            <button
              type="button"
              onClick={enterAsGuest}
              disabled={busy}
              className="ml-auto inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-white border border-emerald-200 px-3 py-2 rounded-xl hover:bg-emerald-50 transition-colors disabled:opacity-60"
            >
              เข้าชมโดยไม่เข้าสู่ระบบ
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="lg:hidden grid grid-cols-3 gap-2 mb-5">
            {[
              { v: '7 ชนิด', l: 'พลาสติก' },
              { v: 'Soon', l: 'จุดคัดแยก' },
              { v: '+50', l: 'แต้มแรกเข้า' },
            ].map((x) => (
              <div key={x.l} className="rounded-2xl bg-white border border-slate-200 p-2.5 text-center">
                <p className="text-sm font-black text-emerald-700">{x.v}</p>
                <p className="text-[10px] text-slate-500">{x.l}</p>
              </div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md mx-auto"
          >
            <div className="bg-white rounded-[28px] border border-slate-200/80 shadow-[0_20px_50px_-24px_rgba(6,78,59,0.35)] p-6 sm:p-8 space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-slate-900">
                    {isLoginMode ? 'ยินดีต้อนรับกลับ' : 'สร้างบัญชีใหม่'}
                  </h2>
                  <p className="text-sm text-slate-500">
                    {isLoginMode
                      ? 'เข้าสู่ระบบเพื่อสแกนขวด สะสมแต้ม และแลกรางวัล'
                      : 'สมัครสมาชิก รับโบนัสต้อนรับ +50 แต้มทันที'}
                  </p>
                </div>
                <BrandLogo className="w-12 h-12 rounded-2xl shrink-0" />
              </div>

              <div className="flex bg-slate-100 p-1 rounded-2xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setIsLoginMode(true)}
                  className={`flex-1 py-2.5 rounded-xl transition-all ${
                    isLoginMode ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  เข้าสู่ระบบ
                </button>
                <button
                  type="button"
                  onClick={() => setIsLoginMode(false)}
                  className={`flex-1 py-2.5 rounded-xl transition-all ${
                    !isLoginMode ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  สมัครสมาชิก
                </button>
              </div>

              {isLoginMode ? (
                <div className="space-y-4">
                <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                  <p className="text-xs text-slate-500">กรอกชื่อผู้ใช้ เบอร์โทร หรืออีเมล และรหัสผ่านเพื่อเข้าสู่ระบบ</p>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">ชื่อผู้ใช้ เบอร์โทร หรือ อีเมล</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        required
                        autoComplete="username"
                        value={emailOrStudentId}
                        onChange={(e) => setEmailOrStudentId(e.target.value)}
                        placeholder="username / 08xxxxxxxx / you@gmail.com"
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">รหัสผ่าน</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="กรอกรหัสผ่าน"
                        className={`${inputClass} pr-11`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                        aria-label="แสดงรหัสผ่าน"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-2xl font-bold text-sm shadow-lg shadow-emerald-600/25 transition-colors flex items-center justify-center gap-2"
                  >
                    {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                    เข้าสู่ระบบ EcoBin
                  </button>
                </form>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-200" />
                  </div>
                  <p className="relative text-center text-[11px] font-semibold text-slate-400 bg-white w-fit mx-auto px-2">หรือ</p>
                </div>
                <GoogleSignInButton
                  mode="login"
                  busy={busy}
                  onCredential={handleGoogleToken}
                />
                {googleError && (
                  <p className="text-[11px] text-rose-600 text-center">
                    เข้าสู่ระบบด้วย Google ไม่สำเร็จ ลองอีกครั้ง
                  </p>
                )}
                {!GOOGLE_CLIENT_ID && (
                  <p className="text-[11px] text-amber-800 text-center">ยังไม่ได้ตั้งค่า Google Client ID</p>
                )}
                </div>
              ) : (
                <>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { id: 'account' as const, label: 'บัญชี', icon: User, disabled: false },
                  { id: 'phone' as const, label: 'เบอร์โทร', icon: Phone, disabled: true },
                  { id: 'email' as const, label: 'อีเมล', icon: Mail, disabled: true },
                ]).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    disabled={m.disabled}
                    title={m.disabled ? 'ยังไม่เปิดให้ใช้งาน' : undefined}
                    onClick={() => {
                      if (!m.disabled) setAuthMethod(m.id);
                    }}
                    className={`py-2.5 rounded-xl text-[11px] font-bold border flex items-center justify-center gap-1.5 ${
                      m.disabled
                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-70'
                        : authMethod === m.id
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300'
                    }`}
                  >
                    {m.icon && <m.icon className="w-3.5 h-3.5" />}
                    {m.label}
                    {m.disabled && (
                      <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-slate-200 text-slate-500">
                        Soon
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {authMethod === 'account' && (
                <form onSubmit={handleRegisterNext} className="space-y-3">
                  <p className="text-xs text-slate-500">
                    ตั้งชื่อผู้ใช้และรหัสผ่านที่แข็งแรง หลังสมัครจะไปกรอกชื่อและเลือกโปรไฟล์ที่หน้าหลัก
                  </p>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">ชื่อผู้ใช้ หรือ อีเมล</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        required
                        autoComplete="username"
                        value={regLogin}
                        onChange={(e) => setRegLogin(e.target.value)}
                        placeholder="เช่น ecobin01 หรือ you@gmail.com"
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <StrongPasswordFields
                    password={regPassword}
                    confirm={regPasswordConfirm}
                    onPasswordChange={setRegPassword}
                    onConfirmChange={setRegPasswordConfirm}
                    disabled={busy}
                  />
                  <button
                    type="submit"
                    disabled={busy || !regLogin.trim() || !isStrongPassword(regPassword) || regPassword !== regPasswordConfirm}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-2xl font-bold text-sm shadow-lg shadow-emerald-600/25 transition-colors flex items-center justify-center gap-2"
                  >
                    {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    สมัครแล้วไปตั้งโปรไฟล์
                  </button>
                </form>
              )}
                </>
              )}

              {DEMO_LOGIN && (
                <div className="pt-4 border-t border-slate-100 space-y-2">
                  <button
                    type="button"
                    onClick={() => setDeveloperMode((v) => !v)}
                    className={`w-full py-2.5 rounded-xl text-[11px] font-bold border transition-all flex items-center justify-center gap-1.5 ${
                      developerMode
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400 hover:text-slate-700'
                    }`}
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    Developer Mode
                  </button>
                  {developerMode && (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleQuickLogin('Member')}
                        className="p-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 hover:bg-emerald-100 text-left disabled:opacity-60"
                      >
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                          <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                          นักศึกษา
                        </div>
                        <span className="text-[10px] text-emerald-700">ศุภณัฐ ปลื้มบุญ</span>
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleQuickLogin('Admin')}
                        className="p-3 rounded-2xl border border-purple-200 bg-purple-50/80 hover:bg-purple-100 text-left disabled:opacity-60"
                      >
                        <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900">
                          <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                          ผู้ดูแลระบบ
                        </div>
                        <span className="text-[10px] text-purple-700">จิรกิตติ์ ตันตระกูล</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2">
              {STEPS.map((step, i) => (
                <div key={step.title} className="rounded-2xl bg-white/90 border border-slate-200 p-3">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="w-5 h-5 rounded-md bg-emerald-600 text-white text-[10px] font-black flex items-center justify-center">
                      {i + 1}
                    </span>
                    <step.icon className="w-3.5 h-3.5 text-emerald-700" />
                  </div>
                  <p className="text-[11px] font-bold text-slate-800">{step.title}</p>
                  <p className="text-[10px] text-slate-500 leading-snug mt-0.5">{step.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[11px] text-slate-500">
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ตรวจภาพด้วย AI Vision
              </span>
              <span className="inline-flex items-center gap-1">
                <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                รหัสรับของที่จุดจ่าย
              </span>
              <span className="inline-flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-emerald-600" />
                สำหรับนักศึกษาและบุคลากร
              </span>
            </div>
          </motion.div>

          <p className="mt-auto pt-6 text-center text-[11px] text-slate-400">
            โครงงานวิจัย EcoBin Connect · มหาวิทยาลัยราชภัฏเพชรบูรณ์
          </p>
        </div>
      </div>
    </div>
  );
};
