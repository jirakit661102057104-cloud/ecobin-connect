'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { parseRedeemQr } from '../lib/redeemQr';
import { mediaUrl } from '../lib/api';
import type { RedemptionSimulation } from '../types';
import {
  QrCode,
  Camera,
  Keyboard,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Gift,
  User,
  Coins,
} from 'lucide-react';

type Detector = {
  detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue?: string }>>;
};

export const AdminQRScanner: React.FC = () => {
  const { language, lookupRedeem, claimRedeem, addToast } = useApp();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanningRef = useRef(true);
  const [cameraError, setCameraError] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [found, setFound] = useState<RedemptionSimulation | null>(null);
  const [lookupError, setLookupError] = useState('');

  const stopCamera = useCallback(() => {
    scanningRef.current = false;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const lookup = useCallback(async (raw: string) => {
    const code = parseRedeemQr(raw);
    if (!code) return;
    scanningRef.current = false;
    setBusy(true);
    setLookupError('');
    try {
      const redemption = await lookupRedeem(code);
      setFound(redemption);
    } catch (e) {
      setFound(null);
      setLookupError(e instanceof Error ? e.message : 'ค้นหาไม่สำเร็จ');
      scanningRef.current = true;
    } finally {
      setBusy(false);
    }
  }, [lookupRedeem]);

  const lookupRef = useRef(lookup);
  lookupRef.current = lookup;

  useEffect(() => {
    scanningRef.current = true;
    let raf = 0;
    let detector: Detector | null = null;
    let cancelled = false;

    const start = async () => {
      setCameraError('');
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch {
        setCameraError(
          language === 'th'
            ? 'เปิดกล้องไม่ได้ — พิมพ์รหัสรับของแทนได้'
            : 'Camera unavailable — enter the pickup code instead'
        );
        return;
      }

      const DetectorCtor = (window as unknown as {
        BarcodeDetector?: new (opts?: { formats: string[] }) => Detector;
      }).BarcodeDetector;
      if (DetectorCtor) {
        try {
          detector = new DetectorCtor({ formats: ['qr_code'] });
        } catch {
          detector = null;
        }
      }
      if (!detector) {
        setCameraError(
          language === 'th'
            ? 'เบราว์เซอร์นี้สแกน QR อัตโนมัติไม่ได้ — พิมพ์รหัสรับของได้'
            : 'This browser cannot auto-scan QR — type the pickup code'
        );
      }

      const tick = async () => {
        if (cancelled) return;
        if (scanningRef.current) {
          const video = videoRef.current;
          if (detector && video && video.readyState >= 2) {
            try {
              const codes = await detector.detect(video);
              const value = codes.find((c) => c.rawValue)?.rawValue;
              if (value) {
                await lookupRef.current(value);
              }
            } catch {
              /* ignore frame errors */
            }
          }
        }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    start();
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      stopCamera();
    };
  }, [language, stopCamera]);

  const handleClaim = async () => {
    if (!found) return;
    setBusy(true);
    try {
      const updated = await claimRedeem(found.pickup_code);
      setFound(updated);
      addToast(
        'success',
        language === 'th' ? 'จ่ายของรางวัลแล้ว' : 'Reward handed over',
        found.reward_name
      );
    } catch (e) {
      addToast('error', language === 'th' ? 'จ่ายของไม่สำเร็จ' : 'Claim failed', e instanceof Error ? e.message : '');
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setFound(null);
    setLookupError('');
    setManualCode('');
    scanningRef.current = true;
  };

  const alreadyClaimed = found?.redeem_status === 'สำเร็จ';

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-5 space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {language === 'th' ? 'สแกน QR แลกรางวัล' : 'Scan reward QR'}
            </h2>
            <p className="text-xs text-slate-500">
              {language === 'th'
                ? 'สแกน QR ที่สมาชิกสร้างตอนขอแลกของรางวัล แล้วกดยืนยันจ่ายของ'
                : 'Scan the QR the member generated when redeeming, then confirm handover.'}
            </p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-slate-900 aspect-[4/3]">
          <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="w-48 h-48 rounded-2xl border-2 border-white/80 shadow-[0_0_0_9999px_rgba(15,23,42,0.35)]" />
          </div>
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/50 text-white text-[10px] font-semibold">
            <Camera className="w-3 h-3" />
            {language === 'th' ? 'กล้องแอดมิน' : 'Admin camera'}
          </div>
        </div>

        {cameraError && (
          <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
            {cameraError}
          </p>
        )}

        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            lookup(manualCode);
          }}
        >
          <div className="flex-1 relative">
            <Keyboard className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder={language === 'th' ? 'หรือพิมพ์รหัสรับของ' : 'Or type pickup code'}
              className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={busy || !manualCode.trim()}
            className="px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold disabled:opacity-50"
          >
            {language === 'th' ? 'ค้นหา' : 'Lookup'}
          </button>
        </form>
      </div>

      {lookupError && (
        <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 flex items-start gap-2 text-rose-800 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          {lookupError}
        </div>
      )}

      {found && (
        <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-3">
            <img
              src={mediaUrl(found.reward_image)}
              alt=""
              className="w-14 h-14 rounded-2xl object-cover border border-slate-200"
            />
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-emerald-700 flex items-center gap-1">
                <Gift className="w-3 h-3" />
                {found.redeem_status}
              </p>
              <h3 className="font-bold text-sm text-slate-900 truncate">{found.reward_name}</h3>
              <p className="text-[11px] text-slate-500 font-mono">{found.pickup_code}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
              <p className="text-[10px] text-slate-400 flex items-center gap-1">
                <User className="w-3 h-3" />
                {language === 'th' ? 'สมาชิก' : 'Member'}
              </p>
              <p className="font-bold text-slate-800 mt-0.5">{found.user_name}</p>
              <p className="text-[10px] text-slate-500">{found.student_id}</p>
            </div>
            <div className="rounded-xl bg-amber-50 border border-amber-100 p-3">
              <p className="text-[10px] text-amber-700 flex items-center gap-1">
                <Coins className="w-3 h-3" />
                {language === 'th' ? 'แต้มที่ใช้' : 'Points used'}
              </p>
              <p className="font-bold text-amber-900 mt-0.5">{found.points_used}</p>
            </div>
          </div>

          {alreadyClaimed ? (
            <div className="flex items-center gap-2 text-emerald-800 text-xs font-semibold bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2.5">
              <CheckCircle2 className="w-4 h-4" />
              {language === 'th' ? 'จ่ายของรางวัลเรียบร้อยแล้ว' : 'Already handed over'}
            </div>
          ) : (
            <button
              onClick={handleClaim}
              disabled={busy}
              className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm disabled:opacity-50"
            >
              {language === 'th' ? 'ยืนยันจ่ายของรางวัล' : 'Confirm handover'}
            </button>
          )}

          <button
            onClick={reset}
            className="w-full py-2 rounded-xl text-slate-600 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-slate-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {language === 'th' ? 'สแกนรายการถัดไป' : 'Scan next'}
          </button>
        </div>
      )}
    </div>
  );
};
