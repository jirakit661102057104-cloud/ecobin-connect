'use client';

import React, { useState } from 'react';
import { Check, Eye, EyeOff, Lock, Sparkles, X } from 'lucide-react';
import { generateStrongPassword, isStrongPassword, passwordRules, passwordScore } from '../lib/password';

interface StrongPasswordFieldsProps {
  password: string;
  confirm: string;
  onPasswordChange: (value: string) => void;
  onConfirmChange: (value: string) => void;
  disabled?: boolean;
}

export const StrongPasswordFields: React.FC<StrongPasswordFieldsProps> = ({
  password,
  confirm,
  onPasswordChange,
  onConfirmChange,
  disabled,
}) => {
  const [show, setShow] = useState(false);
  const rules = passwordRules(password);
  const score = passwordScore(password);
  const match = confirm.length > 0 && password === confirm;
  const strong = isStrongPassword(password);

  const meter =
    score <= 2 ? { w: 'w-1/4', color: 'bg-rose-500', label: 'อ่อน' }
    : score <= 3 ? { w: 'w-2/4', color: 'bg-amber-500', label: 'ปานกลาง' }
    : score === 4 ? { w: 'w-3/4', color: 'bg-lime-500', label: 'ค่อนข้างแข็งแรง' }
    : { w: 'w-full', color: 'bg-emerald-600', label: 'แข็งแรง' };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <label className="block text-xs font-semibold text-slate-700">ตั้งรหัสผ่าน (Strong Password)</label>
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            const next = generateStrongPassword();
            onPasswordChange(next);
            onConfirmChange(next);
            setShow(true);
          }}
          className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg hover:bg-emerald-100 disabled:opacity-50"
        >
          <Sparkles className="w-3 h-3" />
          สร้างรหัสผ่านที่แข็งแรง
        </button>
      </div>
      <div className="relative">
        <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
        <input
          type={show ? 'text' : 'password'}
          required
          autoComplete="new-password"
          disabled={disabled}
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          placeholder="อย่างน้อย 8 ตัว · ใหญ่ เล็ก ตัวเลข อักขระพิเศษ"
          className="w-full pl-10 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 focus:bg-white"
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
          aria-label="แสดงรหัสผ่าน"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {password.length > 0 && (
        <div className="space-y-1.5">
          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div className={`h-full ${meter.w} ${meter.color} transition-all`} />
          </div>
          <p className="text-[11px] font-semibold text-slate-500">ความแข็งแรง: {meter.label}</p>
          <ul className="grid grid-cols-1 gap-1">
            {rules.map((r) => (
              <li key={r.id} className={`flex items-center gap-1.5 text-[11px] ${r.ok ? 'text-emerald-700' : 'text-slate-400'}`}>
                {r.ok ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                {r.label}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">ยืนยันรหัสผ่าน</label>
        <input
          type={show ? 'text' : 'password'}
          required
          autoComplete="new-password"
          disabled={disabled}
          value={confirm}
          onChange={(e) => onConfirmChange(e.target.value)}
          placeholder="พิมพ์รหัสผ่านอีกครั้ง"
          className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
        />
        {confirm.length > 0 && (
          <p className={`text-[11px] mt-1 ${match ? 'text-emerald-700' : 'text-rose-600'}`}>
            {match ? 'รหัสผ่านตรงกัน' : 'รหัสผ่านไม่ตรงกัน'}
          </p>
        )}
      </div>
      {password.length > 0 && (!strong || !match) && (
        <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
          ต้องใช้รหัสผ่านที่แข็งแรงและยืนยันให้ตรงกันก่อนสมัคร
        </p>
      )}
    </div>
  );
};
