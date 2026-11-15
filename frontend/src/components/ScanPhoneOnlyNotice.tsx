'use client';

import React from 'react';
import { Camera, Monitor, Smartphone } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { wasteScanBlockedMessage } from '../lib/device';

interface Props {
  setActiveTab?: (tab: string) => void;
}

/** Shown on desktop/tablet when user opens the waste-scan tab. */
export const ScanPhoneOnlyNotice: React.FC<Props> = ({ setActiveTab }) => {
  const { language } = useApp();
  const th = language === 'th';
  const msg = wasteScanBlockedMessage(th);

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-white rounded-[28px] border border-slate-200 shadow-sm p-6 sm:p-8 space-y-5 text-center">
        <div className="flex items-center justify-center gap-3">
          <span className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center">
            <Monitor className="w-6 h-6" />
          </span>
          <span className="text-slate-300 font-black text-lg">→</span>
          <span className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center ring-2 ring-emerald-200">
            <Smartphone className="w-6 h-6" />
          </span>
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
            <Camera className="w-3.5 h-3.5" />
            {th ? 'จำกัดอุปกรณ์' : 'Device restriction'}
          </div>
          <h2 className="text-xl font-black text-slate-900">{msg.title}</h2>
          <p className="text-sm text-slate-600 leading-relaxed">{msg.body}</p>
          <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-2xl px-3 py-2.5 leading-relaxed">
            {msg.hint}
          </p>
        </div>

        {setActiveTab && (
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className="py-3 rounded-2xl border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              {th ? 'กลับหน้าหลัก' : 'Home'}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('rewards')}
              className="py-3 rounded-2xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700"
            >
              {th ? 'ดูของรางวัล' : 'Rewards'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
