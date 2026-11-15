'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { takePendingBin } from '../lib/pendingBin';
import { useApp } from '../context/AppContext';
import { matchBottleScore } from '../lib/bottleScore';
import { hashImageDataUrl } from '../lib/imageProvenance';
import {
  SCAN_DROP_SITES,
  type ScanDropSiteId,
  CHECKPOINT_WORDS,
  CHECKPOINT_WORD_COUNT,
  binQrImageUrl,
  binQrPayload,
  burnCheckpointOntoCanvas,
  formatCheckpointPhrase,
  getScanDropSite,
  parseBinQr,
  PLASTIC_WATER_BOTTLE_LABEL,
} from '../lib/scanCheckpoint';
import { ocrCheckpointFromImage, terminateCheckpointOcr } from '../lib/checkpointOcr';
import {
  Camera,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Leaf,
  Coins,
  RotateCcw,
  Check,
  Info,
  ScanLine,
  X,
  MapPin,
  QrCode,
} from 'lucide-react';

interface WasteScannerProps {
  onSuccessNavigate?: (tab: string) => void;
  openAuthModal: () => void;
}

type Detector = {
  detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue?: string }>>;
};

type Phase = 'pick_bin' | 'scan_words' | 'submitting' | 'done';

export const WasteScanner: React.FC<WasteScannerProps> = ({
  onSuccessNavigate,
  openAuthModal,
}) => {
  const {
    currentUser,
    language,
    addWasteRecord,
    addGuestWasteRecord,
    settings,
    plasticTypes,
  } = useApp();
  const th = language === 'th';

  const [phase, setPhase] = useState<Phase>('pick_bin');
  const [dropSiteId, setDropSiteId] = useState<ScanDropSiteId | null>(null);
  const [binLockedByQr, setBinLockedByQr] = useState(false);
  const [manualBinCode, setManualBinCode] = useState('');

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isOpeningCamera, setIsOpeningCamera] = useState(false);
  const [cameraMode, setCameraMode] = useState<'qr' | 'ocr' | null>(null);
  const [cameraError, setCameraError] = useState('');
  const [mirrorCamera, setMirrorCamera] = useState(false);

  const [isOcrRunning, setIsOcrRunning] = useState(false);
  const [ocrStatus, setOcrStatus] = useState('');
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [missingWords, setMissingWords] = useState<string[]>([...CHECKPOINT_WORDS]);
  const [confidenceScore, setConfidenceScore] = useState(0);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastError, setLastError] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const scanningRef = useRef(false);
  const ocrBusyRef = useRef(false);
  const submittedRef = useRef(false);

  const dropSite = dropSiteId ? getScanDropSite(dropSiteId) : null;
  const siteLabel = dropSite ? (th ? dropSite.labelTh : dropSite.labelEn) : '';

  const bottleScore = matchBottleScore(
    plasticTypes,
    PLASTIC_WATER_BOTTLE_LABEL,
    settings.points_per_bottle || 10,
    settings.carbon_per_bottle || 0.08,
  );
  const estimatedPoints = bottleScore.points;
  const estimatedWeight = bottleScore.matched?.average_weight_kg || 0;
  const virginFactor = bottleScore.matched?.virgin_emission_factor || 0;
  const recycledFactor = bottleScore.matched?.recycled_emission_factor || 0;
  const estimatedCarbon =
    recycledFactor > 0
      ? estimatedWeight * Math.max(virginFactor - recycledFactor, 0)
      : estimatedWeight * virginFactor;

  const stopCamera = useCallback(() => {
    scanningRef.current = false;
    cameraStreamRef.current?.getTracks().forEach((t) => t.stop());
    cameraStreamRef.current = null;
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
    setIsOpeningCamera(false);
    setMirrorCamera(false);
    setCameraMode(null);
  }, []);

  useEffect(() => () => {
    stopCamera();
    void terminateCheckpointOcr();
  }, [stopCamera]);

  useEffect(() => {
    const video = videoRef.current;
    const stream = cameraStreamRef.current;
    if (!isCameraOpen || !video || !stream) return;
    video.srcObject = stream;
    void video.play().catch(() => {});
  }, [isCameraOpen]);

  const startCameraStream = async (preferEnvironment: boolean) => {
    setIsOpeningCamera(true);
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: preferEnvironment
          ? { facingMode: { ideal: 'environment' } }
          : { facingMode: { ideal: 'user' } },
        audio: false,
      });
      cameraStreamRef.current = stream;
      const facing = stream.getVideoTracks()[0]?.getSettings()?.facingMode;
      setMirrorCamera(facing !== 'environment');
      setIsCameraOpen(true);
      scanningRef.current = true;
    } catch {
      setCameraError(
        th
          ? 'เปิดกล้องไม่ได้ — ตรวจสิทธิ์กล้องแล้วลองใหม่'
          : 'Could not open camera — check permissions and try again',
      );
      throw new Error('camera');
    } finally {
      setIsOpeningCamera(false);
    }
  };

  const lockBin = (id: ScanDropSiteId, fromQr: boolean) => {
    setDropSiteId(id);
    setBinLockedByQr(fromQr);
    setPhase('scan_words');
    setFoundWords([]);
    setMissingWords([...CHECKPOINT_WORDS]);
    setOcrStatus('');
    setLastError('');
    submittedRef.current = false;
  };

  const applyBinFromRaw = (raw: string) => {
    const id = parseBinQr(raw);
    if (!id) {
      setLastError(th ? 'QR/รหัสถังไม่รู้จัก — ต้องเป็น 1 ใน 3 จุดทิ้ง' : 'Unknown bin QR/code');
      return false;
    }
    stopCamera();
    lockBin(id, true);
    return true;
  };

  /** Phase 1: scan bin QR */
  const startBinQrScan = async () => {
    stopCamera();
    setCameraMode('qr');
    cameraModeRef.current = 'qr';
    setLastError('');
    try {
      await startCameraStream(true);
    } catch {
      return;
    }

    const DetectorCtor = (window as unknown as {
      BarcodeDetector?: new (opts?: { formats: string[] }) => Detector;
    }).BarcodeDetector;

    let detector: Detector | null = null;
    if (DetectorCtor) {
      try {
        detector = new DetectorCtor({ formats: ['qr_code'] });
      } catch {
        detector = null;
      }
    }
    if (!detector) {
      setCameraError(
        th
          ? 'เบราว์เซอร์นี้สแกน QR อัตโนมัติไม่ได้ — พิมพ์รหัสถังด้านล่าง หรือเลือกจุดทิ้ง'
          : 'This browser cannot auto-scan QR — type the bin code or pick a site',
      );
      return;
    }

    const tick = async () => {
      if (!scanningRef.current || cameraModeRef.current !== 'qr') return;
      const video = videoRef.current;
      if (detector && video && video.readyState >= 2) {
        try {
          const codes = await detector.detect(video);
          const value = codes.find((c) => c.rawValue)?.rawValue;
          if (value && applyBinFromRaw(value)) return;
        } catch {
          /* keep scanning */
        }
      }
      if (scanningRef.current && cameraModeRef.current === 'qr') {
        requestAnimationFrame(() => void tick());
      }
    };
    requestAnimationFrame(() => void tick());
  };

  const cameraModeRef = useRef(cameraMode);
  cameraModeRef.current = cameraMode;

  const submitSuccess = useCallback(
    async (imageDataUrl: string, score: number) => {
      if (submittedRef.current || !dropSiteId || !dropSite) return;
      submittedRef.current = true;
      setIsSubmitting(true);
      setPhase('submitting');
      setSelectedImage(imageDataUrl);

      const binLocation = `${siteLabel} · ${binQrPayload(dropSiteId)} · CP:${formatCheckpointPhrase()}`;

      try {
        const imageHash = await hashImageDataUrl(imageDataUrl);
        if (currentUser) {
          await addWasteRecord({
            imageUrl: imageDataUrl,
            plasticType: PLASTIC_WATER_BOTTLE_LABEL,
            bottleCount: 1,
            binLocation,
            confidence: score,
            modelLabel: 'CHECKPOINT_OCR',
            captureSource: 'camera',
            imageHash,
          });
        } else {
          await addGuestWasteRecord({
            imageUrl: imageDataUrl,
            detectedBottles: 1,
            scanResult: `OCR checkpoint OK · ${binLocation}`,
            confidence: score,
            modelLabel: 'CHECKPOINT_OCR',
          });
        }
        setPhase('done');
        setTimeout(() => {
          handleFullReset();
          onSuccessNavigate?.(currentUser ? 'dashboard' : 'history');
        }, 900);
      } catch (e) {
        submittedRef.current = false;
        setPhase('scan_words');
        setLastError(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ');
        setIsSubmitting(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [addGuestWasteRecord, addWasteRecord, currentUser, dropSite, dropSiteId, onSuccessNavigate, siteLabel],
  );

  const captureFrame = () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return null;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    if (mirrorCamera) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas;
  };

  /** Live OCR loop — award when SAVE + CFO both found (2/2). */
  const runOcrTick = useCallback(async () => {
    if (!scanningRef.current || cameraModeRef.current !== 'ocr' || ocrBusyRef.current) return;
    if (submittedRef.current) return;
    const canvas = captureFrame();
    if (!canvas) {
      if (scanningRef.current && cameraModeRef.current === 'ocr') {
        window.setTimeout(() => void runOcrTick(), 800);
      }
      return;
    }

    ocrBusyRef.current = true;
    setIsOcrRunning(true);
    setOcrStatus(th ? 'กำลังอ่านคำจากภาพ...' : 'Reading words from image...');
    try {
      const result = await ocrCheckpointFromImage(canvas);
      setFoundWords(result.found);
      setMissingWords(result.missing);
      setConfidenceScore(result.score);

      if (result.complete) {
        // Stamp audit banner AFTER successful OCR (does not affect the OCR decision)
        const ctx = canvas.getContext('2d');
        if (ctx && dropSite) {
          burnCheckpointOntoCanvas(
            ctx,
            canvas.width,
            canvas.height,
            CHECKPOINT_WORDS,
            siteLabel,
          );
        }
        const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
        stopCamera();
        setOcrStatus(
          th
            ? `เจอครบ ${CHECKPOINT_WORD_COUNT} คำ (SAVE CFO) — กำลังให้แต้ม`
            : `Found all ${CHECKPOINT_WORD_COUNT} words (SAVE CFO) — awarding points`,
        );
        await submitSuccess(dataUrl, result.score);
        return;
      }

      setOcrStatus(
        th
          ? `ยังไม่ครบ — เจอ: ${result.found.join(' ') || '—'} · ขาด: ${result.missing.join(' ')}`
          : `Incomplete — found: ${result.found.join(' ') || '—'} · missing: ${result.missing.join(' ')}`,
      );
    } catch (e) {
      setOcrStatus(
        th
          ? `OCR ผิดพลาด: ${e instanceof Error ? e.message : 'ลองใหม่'}`
          : `OCR error: ${e instanceof Error ? e.message : 'retry'}`,
      );
    } finally {
      ocrBusyRef.current = false;
      setIsOcrRunning(false);
      if (scanningRef.current && cameraModeRef.current === 'ocr' && !submittedRef.current) {
        window.setTimeout(() => void runOcrTick(), 1200);
      }
    }
  }, [dropSite, siteLabel, stopCamera, submitSuccess, th]);

  const startWordScan = async () => {
    if (!dropSiteId) {
      setLastError(th ? 'กรุณาสแกน QR ถังหรือเลือกจุดทิ้งก่อน' : 'Scan a bin QR or pick a drop site first');
      return;
    }
    stopCamera();
    setCameraMode('ocr');
    cameraModeRef.current = 'ocr';
    setFoundWords([]);
    setMissingWords([...CHECKPOINT_WORDS]);
    setSelectedImage(null);
    submittedRef.current = false;
    try {
      await startCameraStream(true);
      window.setTimeout(() => void runOcrTick(), 600);
    } catch {
      /* camera error already set */
    }
  };

  // Opened from a bin QR link (?bin=…): lock that bin and go straight to the SAVE CFO camera.
  const autoStartOcrRef = useRef(false);
  useEffect(() => {
    const pending = takePendingBin();
    if (!pending) return;
    autoStartOcrRef.current = true;
    lockBin(pending, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!autoStartOcrRef.current || !dropSiteId || phase !== 'scan_words') return;
    autoStartOcrRef.current = false;
    // If the browser blocks opening the camera without a tap, the "open camera" button stays.
    void startWordScan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dropSiteId, phase]);

  const handleManualCapture = async () => {
    if (ocrBusyRef.current || submittedRef.current) return;
    const canvas = captureFrame();
    if (!canvas) {
      setCameraError(th ? 'กล้องยังไม่พร้อม' : 'Camera not ready');
      return;
    }
    ocrBusyRef.current = true;
    setIsOcrRunning(true);
    try {
      const result = await ocrCheckpointFromImage(canvas);
      setFoundWords(result.found);
      setMissingWords(result.missing);
      setConfidenceScore(result.score);
      if (!result.complete) {
        setLastError(
          th
            ? `ยังไม่ครบ ${CHECKPOINT_WORD_COUNT} คำ — ต้องเจอทั้ง SAVE และ CFO บนพื้นหลัง`
            : `Need all ${CHECKPOINT_WORD_COUNT} words — SAVE and CFO must be visible`,
        );
        return;
      }
      const ctx = canvas.getContext('2d');
      if (ctx && dropSite) {
        burnCheckpointOntoCanvas(ctx, canvas.width, canvas.height, CHECKPOINT_WORDS, siteLabel);
      }
      stopCamera();
      await submitSuccess(canvas.toDataURL('image/jpeg', 0.88), result.score);
    } finally {
      ocrBusyRef.current = false;
      setIsOcrRunning(false);
    }
  };

  const handleFullReset = () => {
    stopCamera();
    setPhase('pick_bin');
    setDropSiteId(null);
    setBinLockedByQr(false);
    setManualBinCode('');
    setFoundWords([]);
    setMissingWords([...CHECKPOINT_WORDS]);
    setSelectedImage(null);
    setIsSubmitting(false);
    setOcrStatus('');
    setLastError('');
    setCameraError('');
    setConfidenceScore(0);
    submittedRef.current = false;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-white shadow-sm space-y-3">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
            <ScanLine className="w-4 h-4" aria-hidden />
          </span>
          {th ? 'เช็คพอยต์ SAVE CFO' : 'SAVE CFO checkpoint'}
        </h2>
        <ol className="text-[11px] text-slate-600 grid grid-cols-1 sm:grid-cols-3 gap-1.5 list-none">
          <li className="rounded-lg bg-slate-50 px-2.5 py-1.5 border border-slate-100">
            <span className="font-bold text-emerald-700">1.</span>{' '}
            {th ? 'สแกน QR บนถัง (3 จุดทิ้ง)' : 'Scan bin QR (3 drop sites)'}
          </li>
          <li className="rounded-lg bg-slate-50 px-2.5 py-1.5 border border-slate-100">
            <span className="font-bold text-emerald-700">2.</span>{' '}
            {th
              ? `ถ่ายพื้นหลังให้ OCR เจอครบ ${CHECKPOINT_WORD_COUNT} คำ: SAVE CFO`
              : `OCR must find all ${CHECKPOINT_WORD_COUNT} words: SAVE CFO`}
          </li>
          <li className="rounded-lg bg-slate-50 px-2.5 py-1.5 border border-slate-100">
            <span className="font-bold text-emerald-700">3.</span>{' '}
            {th ? 'ผ่านแล้วให้แต้มทันที (ไม่เช็คว่าเป็นขวด)' : 'Points awarded instantly (no bottle AI)'}
          </li>
        </ol>
      </div>

      {!currentUser && (
        <div className="bg-amber-50/80 border border-amber-200/70 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-amber-950 text-xs">
          <div className="flex items-center gap-2.5">
            <Info className="w-4 h-4 text-amber-600 shrink-0" aria-hidden />
            <span>
              {th
                ? 'ยังไม่ได้เข้าสู่ระบบ — ลองสแกนได้ แต่จะยังไม่ได้รับแต้มจริง'
                : 'Not signed in — you can try, but no real points'}
            </span>
          </div>
          <button
            type="button"
            onClick={openAuthModal}
            className="shrink-0 min-h-[40px] px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold"
          >
            {th ? 'เข้าสู่ระบบ' : 'Sign in'}
          </button>
        </div>
      )}

      {/* Step 1: bin QR / pick site */}
      {phase === 'pick_bin' && (
        <section className="eco-panel p-4 sm:p-5 space-y-4">
          <h3 className="eco-panel-title flex items-center gap-2">
            <QrCode className="w-4 h-4 text-emerald-700" aria-hidden />
            {th ? 'ระบุจุดทิ้งจาก QR บนถัง' : 'Identify drop bin via QR'}
          </h3>
          <p className="text-xs text-slate-600">
            {th
              ? 'แต่ละจุดทิ้งมี QR ต่างกัน ระบบจะบันทึกว่าข้อมูลมาจากถังไหน'
              : 'Each bin has its own QR so records know which bin was used'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {SCAN_DROP_SITES.map((site) => (
              <div
                key={site.id}
                className="rounded-2xl border border-slate-200 bg-white p-3 text-center space-y-2"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={binQrImageUrl(site.id, 140)}
                  alt={binQrPayload(site.id)}
                  className="mx-auto w-[120px] h-[120px] rounded-lg bg-white"
                />
                <p className="text-xs font-bold text-slate-900">
                  {th ? site.labelTh : site.labelEn}
                </p>
                <p className="text-[10px] font-mono text-slate-500 break-all">
                  {binQrPayload(site.id)}
                </p>
                <button
                  type="button"
                  onClick={() => lockBin(site.id, false)}
                  className="w-full min-h-[40px] rounded-xl border border-emerald-200 text-emerald-800 text-[11px] font-bold hover:bg-emerald-50"
                >
                  {th ? 'เลือกจุดนี้' : 'Use this site'}
                </button>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={() => void startBinQrScan()}
              disabled={isOpeningCamera}
              className="eco-btn eco-btn-primary min-h-[44px] flex-1"
            >
              <QrCode className="w-4 h-4" aria-hidden />
              {isOpeningCamera
                ? th
                  ? 'กำลังเปิดกล้อง...'
                  : 'Opening…'
                : th
                  ? 'เปิดกล้องสแกน QR ถัง'
                  : 'Scan bin QR with camera'}
            </button>
          </div>

          <label className="block text-[11px] font-semibold text-slate-700">
            {th ? 'หรือพิมพ์รหัสถัง' : 'Or type bin code'}
            <div className="mt-1 flex gap-2">
              <input
                value={manualBinCode}
                onChange={(e) => setManualBinCode(e.target.value)}
                placeholder="PCRU-CFO-BIN:science"
                className="flex-1 min-h-[44px] rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-mono"
              />
              <button
                type="button"
                onClick={() => applyBinFromRaw(manualBinCode)}
                className="eco-btn eco-btn-secondary min-h-[44px]"
              >
                {th ? 'ใช้รหัส' : 'Apply'}
              </button>
            </div>
          </label>
        </section>
      )}

      {/* Camera shared for QR / OCR */}
      {isCameraOpen && (
        <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 relative">
          <div className="relative w-full h-[360px] bg-black">
            <video
              ref={videoRef}
              muted
              playsInline
              className={`w-full h-full object-cover ${mirrorCamera ? 'scale-x-[-1]' : ''}`}
            />
            <div className="absolute inset-x-3 top-3 pointer-events-none">
              <div className="rounded-xl bg-emerald-950/90 border border-amber-300/40 px-3 py-2 text-center">
                <p className="text-[9px] font-bold text-emerald-200 uppercase tracking-wide">
                  {cameraMode === 'qr'
                    ? th
                      ? 'สแกน QR บนถัง'
                      : 'Scan bin QR'
                    : th
                      ? 'คำที่ต้องเจอ (OCR)'
                      : 'Words required (OCR)'}
                </p>
                <p className="text-sm font-black text-amber-200 font-mono tracking-wider">
                  {cameraMode === 'qr'
                    ? th
                      ? 'เล็งไปที่สติ๊กเกอร์ QR'
                      : 'Aim at the QR sticker'
                    : formatCheckpointPhrase()}
                </p>
              </div>
            </div>
            {cameraMode === 'ocr' && isOcrRunning && (
              <div className="absolute inset-0 bg-emerald-950/30 flex items-center justify-center pointer-events-none">
                <Sparkles className="w-8 h-8 text-emerald-300 animate-pulse" aria-hidden />
              </div>
            )}
            <div className="absolute inset-x-3 bottom-3 flex gap-2">
              {cameraMode === 'ocr' && (
                <button
                  type="button"
                  onClick={() => void handleManualCapture()}
                  disabled={isOcrRunning || isSubmitting}
                  className="flex-1 min-h-[44px] rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2"
                >
                  <Camera className="w-4 h-4" aria-hidden />
                  {th ? 'ถ่ายแล้วตรวจ OCR ตอนนี้' : 'Capture & OCR now'}
                </button>
              )}
              <button
                type="button"
                onClick={stopCamera}
                className="min-h-[44px] min-w-[44px] p-2.5 bg-black/60 text-white rounded-xl"
                aria-label={th ? 'ปิดกล้อง' : 'Close camera'}
              >
                <X className="w-4 h-4" aria-hidden />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: OCR checkpoint */}
      {(phase === 'scan_words' || phase === 'submitting' || phase === 'done') && dropSite && (
        <section className="eco-panel p-4 sm:p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="eco-panel-title flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-700" aria-hidden />
                {siteLabel}
              </h3>
              <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                {binQrPayload(dropSiteId!)}
                {binLockedByQr ? (th ? ' · จาก QR' : ' · via QR') : ''}
              </p>
            </div>
            <button
              type="button"
              onClick={handleFullReset}
              className="text-[11px] font-bold text-slate-500 underline min-h-[40px]"
            >
              {th ? 'เปลี่ยนถัง' : 'Change bin'}
            </button>
          </div>

          <div className="rounded-xl bg-emerald-900 text-center px-3 py-3">
            <p className="text-[10px] font-semibold text-emerald-200 uppercase tracking-wide mb-1">
              {th
                ? `ต้องเจอครบ ${CHECKPOINT_WORD_COUNT} คำบนพื้นหลัง`
                : `Must find all ${CHECKPOINT_WORD_COUNT} background words`}
            </p>
            <p className="text-xl font-black text-amber-200 tracking-wider font-mono">
              {formatCheckpointPhrase()}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3">
              <p className="text-[10px] text-emerald-800 font-semibold">{th ? 'เจอแล้ว' : 'Found'}</p>
              <p className="font-mono font-bold text-emerald-900 mt-1">
                {foundWords.join(' ') || '—'}
              </p>
            </div>
            <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-3">
              <p className="text-[10px] text-rose-800 font-semibold">{th ? 'ยังขาด' : 'Missing'}</p>
              <p className="font-mono font-bold text-rose-900 mt-1">
                {missingWords.join(' ') || (th ? 'ครบแล้ว' : 'None')}
              </p>
            </div>
          </div>

          {ocrStatus && (
            <p className="text-[11px] text-slate-600 flex items-center gap-1.5">
              {isOcrRunning ? <Sparkles className="w-3.5 h-3.5 animate-spin" aria-hidden /> : null}
              {ocrStatus}
            </p>
          )}

          {!isCameraOpen && phase === 'scan_words' && (
            <button
              type="button"
              onClick={() => void startWordScan()}
              disabled={isOpeningCamera || isSubmitting}
              className="eco-btn eco-btn-primary w-full min-h-[44px]"
            >
              <Camera className="w-4 h-4" aria-hidden />
              {th ? 'เปิดกล้องอ่านคำ SAVE CFO' : 'Open camera to read SAVE CFO'}
            </button>
          )}

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-slate-600">
              <Coins className="w-3.5 h-3.5 text-amber-500" aria-hidden />
              {th ? 'แต้มเมื่อผ่าน OCR' : 'Points when OCR passes'}
            </span>
            <span className="font-black text-emerald-800">+{estimatedPoints}</span>
          </div>
          <div className="rounded-xl border border-teal-100 bg-teal-50/70 p-3 flex items-center justify-between text-xs text-teal-900">
            <span className="flex items-center gap-1.5">
              <Leaf className="w-3.5 h-3.5" aria-hidden />
              {th ? 'คาร์บอนโดยประมาณ' : 'Est. carbon'}
            </span>
            <span className="font-bold">{estimatedCarbon.toFixed(3)} kgCO₂e</span>
          </div>

          {(phase === 'submitting' || phase === 'done') && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" aria-hidden />
              {phase === 'done'
                ? th
                  ? 'บันทึกและให้แต้มแล้ว'
                  : 'Saved and points awarded'
                : th
                  ? 'กำลังบันทึก...'
                  : 'Saving...'}
            </div>
          )}

          {selectedImage && (
            <div className="relative rounded-xl overflow-hidden border border-slate-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={selectedImage} alt="" className="w-full max-h-48 object-contain bg-black" />
              <button
                type="button"
                onClick={handleFullReset}
                className="absolute top-2 right-2 p-2 bg-black/60 text-white rounded-lg"
                aria-label={th ? 'เริ่มใหม่' : 'Reset'}
              >
                <RotateCcw className="w-4 h-4" aria-hidden />
              </button>
            </div>
          )}
        </section>
      )}

      {(cameraError || lastError) && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />
          <span>{cameraError || lastError}</span>
        </div>
      )}

      {confidenceScore > 0 && phase === 'scan_words' && (
        <p className="text-[11px] text-slate-500 text-center">
          {th ? 'ความครบของคำ' : 'Word completeness'}: {confidenceScore}% ·{' '}
          <Check className="w-3 h-3 inline" aria-hidden /> SAVE + CFO
        </p>
      )}
    </div>
  );
};
