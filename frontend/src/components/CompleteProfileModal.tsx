'use client';

import React, { useMemo, useState } from 'react';
import { Loader2, UserRound } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BrandLogo } from './BrandLogo';
import { AVATAR_PRESETS } from '../lib/avatars';

function splitHint(fullName?: string, first?: string, last?: string) {
  if (first && last && last !== '-') return { first, last };
  const parts = (fullName || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return { first: parts[0], last: parts.slice(1).join(' ') };
  }
  return { first: first || parts[0] || '', last: last && last !== '-' ? last : '' };
}

export const CompleteProfileModal: React.FC = () => {
  const { currentUser, updateUserProfile, language } = useApp();
  const hint = useMemo(
    () => splitHint(currentUser?.full_name, currentUser?.first_name, currentUser?.last_name),
    [currentUser]
  );
  const [step, setStep] = useState(2);
  const [firstName, setFirstName] = useState(hint.first);
  const [lastName, setLastName] = useState(hint.last);
  const [avatar, setAvatar] = useState(currentUser?.avatar_url || AVATAR_PRESETS[0]);
  const [busy, setBusy] = useState(false);

  const th = language === 'th';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 2) {
      if (!firstName.trim() || !lastName.trim()) return;
      setStep(3);
      return;
    }
    setBusy(true);
    await updateUserProfile({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      avatar_url: avatar,
    });
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-emerald-950/55 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white rounded-[28px] border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-5"
      >
        <div className="flex items-start gap-3">
          <BrandLogo className="w-12 h-12 rounded-2xl shrink-0" />
          <div>
            <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wide">EcoBin Connect</p>
            <h2 className="text-xl font-black text-slate-900">
              {step === 2 ? (th ? 'ตั้งชื่อที่ใช้แสดง' : 'Your name') : (th ? 'เลือกโปรไฟล์' : 'Choose profile')}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {th
                ? 'บัญชีพร้อมแล้ว ทำต่อที่หน้าหลัก: ชื่อ แล้วเลือกรูปโปรไฟล์'
                : 'Account created. Finish your name and profile photo on the home page.'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {[
            { n: 1, label: th ? 'บัญชี' : 'Account' },
            { n: 2, label: th ? 'ชื่อ' : 'Name' },
            { n: 3, label: th ? 'โปรไฟล์' : 'Profile' },
          ].map((s) => (
            <div
              key={s.n}
              className={`rounded-xl px-2 py-1.5 text-center border ${
                step === s.n
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : s.n < step || s.n === 1
                  ? 'bg-emerald-600 border-emerald-600 text-white'
                  : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}
            >
              <p className="text-[10px] font-black">{s.n}. {s.label}</p>
            </div>
          ))}
        </div>

        {step === 2 && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {th ? 'ชื่อ (First name)' : 'First name'}
              </label>
              <div className="relative">
                <UserRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  autoFocus
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder={th ? 'เช่น ศุภณัฐ' : 'First name'}
                  className="w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {th ? 'นามสกุล (Last name)' : 'Last name'}
              </label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder={th ? 'เช่น ปลื้มบุญ' : 'Last name'}
                className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <div className="flex justify-center">
              <img src={avatar} alt="" className="w-20 h-20 rounded-2xl object-cover ring-2 ring-emerald-500" />
            </div>
            <div className="grid grid-cols-6 gap-2">
              {AVATAR_PRESETS.map((url) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setAvatar(url)}
                  className={`rounded-xl overflow-hidden border-2 ${
                    avatar === url ? 'border-emerald-600 ring-2 ring-emerald-500/20' : 'border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={url} alt="" className="w-full h-10 object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          {step === 3 && (
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-4 py-3.5 rounded-2xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50"
            >
              {th ? 'ย้อนกลับ' : 'Back'}
            </button>
          )}
          <button
            type="submit"
            disabled={busy || (step === 2 && (!firstName.trim() || !lastName.trim()))}
            className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-2xl font-bold text-sm shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {step === 2 ? (th ? 'ถัดไป' : 'Next') : (th ? 'บันทึกและเข้าใช้งาน' : 'Save and continue')}
          </button>
        </div>
      </form>
    </div>
  );
};
