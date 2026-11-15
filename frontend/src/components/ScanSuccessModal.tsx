'use client';

import React from 'react';
import { motion } from 'motion/react';
import { PartyPopper, Coins, Leaf, Gift, ScanLine, Home, UserPlus } from 'lucide-react';
import { useApp } from '../context/AppContext';

export type ScanSuccessInfo = {
  guest: boolean;
  points: number;
  carbonAvoidedKg: number;
  siteLabel: string;
};

interface Props {
  info: ScanSuccessInfo;
  onScanAgain: () => void;
  onGoHome: () => void;
  onGoRewards: () => void;
  onRegister: () => void;
}

/** "ยินดีด้วย" popup shown after a successful SAVE CFO scan; stays until the user picks an action. */
export const ScanSuccessModal: React.FC<Props> = ({ info, onScanAgain, onGoHome, onGoRewards, onRegister }) => {
  const { currentUser, rewards, redemptions, language } = useApp();
  const th = language === 'th';

  const total = currentUser?.total_points ?? 0;
  const before = total - info.points;
  const claimed = new Set(
    currentUser
      ? redemptions
          .filter((r) => r.user_id === currentUser.user_id && r.redeem_status !== 'ยกเลิก')
          .map((r) => r.reward_id)
      : [],
  );
  const checkpoints = [...rewards].sort((a, b) => a.points_required - b.points_required);
  // A checkpoint this scan just crossed and that is not claimed yet
  const reached = checkpoints.find(
    (r) => r.points_required > before && r.points_required <= total && !claimed.has(r.reward_id),
  );
  const next = checkpoints.find((r) => r.points_required > total);
  const prevLevel = [...checkpoints].reverse().find((r) => r.points_required <= total)?.points_required ?? 0;
  const progressPct = next
    ? Math.min(100, Math.max(4, ((total - prevLevel) / Math.max(next.points_required - prevLevel, 1)) * 100))
    : 100;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="scan-success-title"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center space-y-4"
      >
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
          <PartyPopper className="w-8 h-8" aria-hidden />
        </div>

        <div>
          <h3 id="scan-success-title" className="text-xl font-black text-slate-900">
            {info.guest ? (th ? 'ทดลองสแกนสำเร็จ!' : 'Trial scan complete!') : th ? 'ยินดีด้วย!' : 'Well done!'}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {th ? `ทิ้งขวดที่ ${info.siteLabel} สำเร็จ` : `Bottle dropped at ${info.siteLabel}`}
          </p>
        </div>

        {info.guest ? (
          <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">
            {th
              ? `ถ้าเป็นสมาชิก ครั้งนี้จะได้ +${info.points} แต้ม — สมัครสมาชิกเพื่อสะสมแต้มและรับของรางวัล`
              : `Members would get +${info.points} points — sign up to collect points and rewards`}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-center gap-2 text-emerald-700">
              <Coins className="w-7 h-7 text-amber-500 fill-amber-300" aria-hidden />
              <span className="text-4xl font-black">+{info.points}</span>
              <span className="text-sm font-bold">{th ? 'แต้ม' : 'pts'}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-left">
              <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3">
                <p className="text-[10px] text-slate-500">{th ? 'แต้มสะสมรวม' : 'Total points'}</p>
                <p className="text-lg font-black text-slate-900">{total.toLocaleString()}</p>
              </div>
              <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-3">
                <p className="text-[10px] text-emerald-800 flex items-center gap-1">
                  <Leaf className="w-3 h-3" aria-hidden /> {th ? 'ลดคาร์บอนได้' : 'CO₂e avoided'}
                </p>
                <p className="text-lg font-black text-emerald-800">
                  {info.carbonAvoidedKg.toFixed(3)} <span className="text-[10px] font-semibold">kgCO₂e</span>
                </p>
              </div>
            </div>

            {reached ? (
              <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 flex items-start gap-2 text-left">
                <Gift className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />
                <span>
                  <b>{th ? 'ถึงเช็คพอยต์แล้ว!' : 'Checkpoint reached!'}</b>{' '}
                  {th ? `รับ "${reached.reward_name}" ได้ที่หน้าของรางวัล` : `Claim "${reached.reward_name}" on the rewards page`}
                </span>
              </div>
            ) : next ? (
              <div className="text-left space-y-1.5">
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${progressPct}%` }} />
                </div>
                <p className="text-[11px] text-slate-600">
                  {th
                    ? `อีก ${(next.points_required - total).toLocaleString()} แต้ม ถึง "${next.reward_name}"`
                    : `${(next.points_required - total).toLocaleString()} pts to "${next.reward_name}"`}
                </p>
              </div>
            ) : null}
          </>
        )}

        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={onScanAgain}
            className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2"
          >
            <ScanLine className="w-4 h-4" aria-hidden />
            {th ? 'ทิ้งขวดต่อที่ถังนี้' : 'Drop another bottle here'}
          </button>
          {info.guest ? (
            <button
              type="button"
              onClick={onRegister}
              className="w-full py-2.5 rounded-2xl border border-emerald-200 text-emerald-800 font-bold text-xs flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" aria-hidden />
              {th ? 'สมัครสมาชิก / เข้าสู่ระบบ' : 'Sign up / Log in'}
            </button>
          ) : reached ? (
            <button
              type="button"
              onClick={onGoRewards}
              className="w-full py-2.5 rounded-2xl border border-amber-200 bg-amber-50 text-amber-900 font-bold text-xs flex items-center justify-center gap-2"
            >
              <Gift className="w-4 h-4" aria-hidden />
              {th ? 'ไปรับรางวัล' : 'Go claim the reward'}
            </button>
          ) : (
            <button
              type="button"
              onClick={onGoHome}
              className="w-full py-2.5 rounded-2xl border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" aria-hidden />
              {th ? 'กลับหน้าหลัก' : 'Back to home'}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
