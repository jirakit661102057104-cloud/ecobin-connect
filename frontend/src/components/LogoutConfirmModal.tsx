'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { LogOut, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface Props {
  open: boolean;
  onClose: () => void;
}

/** "ยืนยันออกจากระบบ" popup — rendered on <body> so the header/menu layout cannot clip it. */
export const LogoutConfirmModal: React.FC<Props> = ({ open, onClose }) => {
  const { logout, language, currentUser } = useApp();
  const th = language === 'th';
  const [busy, setBusy] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, busy, onClose]);

  if (!open || !mounted) return null;

  const confirm = async () => {
    setBusy(true);
    await logout(); // reloads to the home page
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-confirm-title"
      onClick={() => !busy && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-xs w-full p-6 shadow-2xl border border-slate-100 text-center space-y-4"
      >
        <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <LogOut className="w-7 h-7" aria-hidden />
        </div>
        <div>
          <h3 id="logout-confirm-title" className="text-lg font-black text-slate-900">
            {th ? 'ยืนยันออกจากระบบ?' : 'Log out?'}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {th
              ? `ต้องการออกจากระบบ${currentUser?.full_name ? `ของ ${currentUser.full_name}` : ''} ใช่หรือไม่`
              : 'Are you sure you want to log out?'}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            autoFocus
            className="py-2.5 rounded-2xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 disabled:opacity-50"
          >
            {th ? 'ยกเลิก' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={() => void confirm()}
            disabled={busy}
            className="py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm flex items-center justify-center gap-1.5 disabled:opacity-70"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : null}
            {th ? 'ออกจากระบบ' : 'Log out'}
          </button>
        </div>
      </motion.div>
    </div>,
    document.body,
  );
};
