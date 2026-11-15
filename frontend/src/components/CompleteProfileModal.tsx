'use client';

import React, { useMemo, useState } from 'react';
import { Loader2, UserRound } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BrandLogo } from './BrandLogo';
import { AVATAR_PRESETS } from '../lib/avatars';
import { APP_NAME } from '../lib/brand';

function splitHint(fullName?: string, first?: string, last?: string) {
  if (first && last && last !== '-') return { first, last };
  const parts = (fullName || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return { first: parts[0], last: parts.slice(1).join(' ') };
  }
  return { first: first || parts[0] || '', last: last && last !== '-' ? last : '' };
}

export const CompleteProfileModal: React.FC = () => {
  const { currentUser, updateUserProfile, language, addToast } = useApp();
  const hint = useMemo(
    () => splitHint(currentUser?.full_name, currentUser?.first_name, currentUser?.last_name),
    [currentUser]
  );
  const [firstName, setFirstName] = useState(hint.first);
  const [lastName, setLastName] = useState(hint.last);
  const [avatar, setAvatar] = useState(currentUser?.avatar_url || AVATAR_PRESETS[0]);
  const [busy, setBusy] = useState(false);

  const th = language === 'th';
  const canSave = firstName.trim().length > 0 && lastName.trim().length > 0;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    setBusy(true);
    await updateUserProfile({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      avatar_url: avatar,
    });
    setBusy(false);
  };

  const handleSkip = async () => {
    const fallback =
      (currentUser?.username || '').trim() ||
      (currentUser?.full_name || '').trim() ||
      (currentUser?.email || '').split('@')[0] ||
      (th ? 'สมาชิก' : 'Member');
    setBusy(true);
    const ok = await updateUserProfile(
      {
        first_name: fallback,
        last_name: '-',
        avatar_url: avatar || AVATAR_PRESETS[0],
      },
      { silent: true }
    );
    setBusy(false);
    if (ok) {
      addToast(
        'info',
        th ? 'ข้ามการตั้งโปรไฟล์แล้ว' : 'Profile skipped',
        th ? 'ตั้งชื่อและรูปได้ทีหลังที่เมนูตั้งค่า' : 'You can set name and photo later in Settings'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-emerald-950/55 backdrop-blur-sm">
      <form
        onSubmit={handleSave}
        className="w-full max-w-md bg-white rounded-[28px] border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-5"
      >
        <div className="flex items-start gap-3">
          <BrandLogo className="w-12 h-12 rounded-2xl shrink-0" />
          <div>
            <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wide">{APP_NAME}</p>
            <h2 className="text-xl font-black text-slate-900">
              {th ? 'ตั้งชื่อและโปรไฟล์' : 'Name & profile'}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {th
                ? 'สมัครสำเร็จแล้ว — กรอกชื่อที่ใช้แสดงและเลือกรูป หรือข้ามไปก่อนก็ได้'
                : 'Signup complete — set your display name and photo, or skip for now'}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {th ? 'ชื่อ' : 'First name'}
            </label>
            <div className="relative">
              <UserRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
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
              {th ? 'นามสกุล' : 'Last name'}
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder={th ? 'เช่น ปลื้มบุญ' : 'Last name'}
              className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold text-slate-700">{th ? 'รูปโปรไฟล์' : 'Profile photo'}</p>
          <div className="flex justify-center">
            <img src={avatar} alt="" className="w-20 h-20 rounded-2xl object-cover ring-2 ring-emerald-500" />
          </div>
          <div className="grid grid-cols-6 gap-2">
            {AVATAR_PRESETS.map((url) => (
              <button
                key={url}
                type="button"
                onClick={() => setAvatar(url)}
                className={`rounded-xl overflow-hidden border-2 cursor-pointer ${
                  avatar === url ? 'border-emerald-600 ring-2 ring-emerald-500/20' : 'border-slate-200 opacity-70 hover:opacity-100'
                }`}
              >
                <img src={url} alt="" className="w-full h-10 object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-2">
          <button
            type="button"
            onClick={() => void handleSkip()}
            disabled={busy}
            className="flex-1 py-3.5 rounded-2xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-60 cursor-pointer"
          >
            {th ? 'ข้ามไปก่อน' : 'Skip for now'}
          </button>
          <button
            type="submit"
            disabled={busy || !canSave}
            className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-2xl font-bold text-sm shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {th ? 'บันทึกและเข้าใช้งาน' : 'Save and continue'}
          </button>
        </div>
      </form>
    </div>
  );
};
