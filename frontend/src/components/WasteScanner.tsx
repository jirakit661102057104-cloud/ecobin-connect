'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { matchBottleScore } from '../lib/bottleScore';
import { classifyImageDataUrl } from '../lib/teachableMachine';
import { 
  Camera, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  MapPin, 
  Leaf, 
  Coins, 
  RotateCcw, 
  Check, 
  Info,
  ScanLine,
  Image as ImageIcon,
  X
} from 'lucide-react';

interface WasteScannerProps {
  onSuccessNavigate?: (tab: string) => void;
  openAuthModal: () => void;
}

const DEFAULT_MODEL_URL = '/models/ecobin-bottle-can';
const TEACHABLE_MODEL_URL = (
  process.env.NEXT_PUBLIC_TEACHABLE_MACHINE_MODEL_URL || DEFAULT_MODEL_URL
).replace(/\/+$/, '');
/** SIT: accept only bottle/can when confidence is strictly above this ratio (default 80%). */
const CLASSIFY_CONFIDENCE = Number(process.env.NEXT_PUBLIC_TEACHABLE_MACHINE_CONFIDENCE || 0.8);
const CLASSIFY_CONFIDENCE_PCT = Math.round(CLASSIFY_CONFIDENCE * 1000) / 10;

export const WasteScanner: React.FC<WasteScannerProps> = ({ onSuccessNavigate, openAuthModal }) => {
  const { currentUser, language, addWasteRecord, addGuestWasteRecord, logClassifyEvent, bins, settings, plasticTypes } = useApp();

  const liveBins = bins.filter((b) => b.status !== 'ปิดปรับปรุง');

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedBin, setSelectedBin] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanCompleted, setScanCompleted] = useState(false);
  const [detectedPlasticType, setDetectedPlasticType] = useState<string>(
    language === 'th' ? 'ขวดพลาสติก' : 'Plastic bottle',
  );
  const [bottleCount, setBottleCount] = useState<number>(3);
  const [isValidBottle, setIsValidBottle] = useState<boolean>(true);
  const [confidenceScore, setConfidenceScore] = useState<number>(98.5);
  const [modelLabel, setModelLabel] = useState<string>('');
  const [correlationId, setCorrelationId] = useState<string>('');
  const [detectionNotes, setDetectionNotes] = useState<string>('');
  const [showGuidePopup, setShowGuidePopup] = useState<boolean>(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isOpeningCamera, setIsOpeningCamera] = useState(false);
  const [cameraError, setCameraError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!selectedBin && liveBins[0]) setSelectedBin(liveBins[0].bin_name);
  }, [liveBins, selectedBin]);

  useEffect(() => () => stopCamera(), []);

  useEffect(() => {
    const video = videoRef.current;
    const stream = cameraStreamRef.current;
    if (!isCameraOpen || !video || !stream) return;
    video.srcObject = stream;
    void video.play().catch(() => {
      /* autoplay can fail briefly; capture still works once ready */
    });
  }, [isCameraOpen]);

  const stopCamera = () => {
    cameraStreamRef.current?.getTracks().forEach((track) => {
      track.stop();
    });
    cameraStreamRef.current = null;
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
    setIsOpeningCamera(false);
  };

  const openCameraStream = async (): Promise<MediaStream> => {
    const attempts: MediaStreamConstraints[] = [
      { audio: false, video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } } },
      { audio: false, video: { facingMode: 'user' } },
      { audio: false, video: true },
    ];
    let lastError: unknown;
    for (const constraints of attempts) {
      try {
        return await navigator.mediaDevices.getUserMedia(constraints);
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError instanceof Error ? lastError : new Error('Device in use');
  };

  const cameraErrorMessage = (error: unknown) => {
    const raw = error instanceof Error ? error.message : String(error || 'unknown error');
    const name = error instanceof DOMException ? error.name : '';
    if (
      /Device in use/i.test(raw) ||
      name === 'NotReadableError' ||
      name === 'TrackStartError' ||
      name === 'AbortError'
    ) {
      return language === 'th'
        ? 'กล้องถูกใช้งานอยู่ ปิดแท็บอื่นหรือแอปที่ใช้กล้อง แล้วกดเปิดกล้องอีกครั้ง'
        : 'Camera is in use. Close other tabs/apps using the camera, then try again.';
    }
    if (name === 'NotAllowedError' || /Permission/i.test(raw)) {
      return language === 'th'
        ? 'ยังไม่อนุญาตการใช้กล้อง กรุณาอนุญาตในเบราว์เซอร์แล้วลองใหม่'
        : 'Camera permission denied. Allow camera access and try again.';
    }
    return language === 'th'
      ? `เปิดกล้องไม่สำเร็จ: ${raw}`
      : `Unable to open camera: ${raw}`;
  };

  const startCamera = async () => {
    setCameraError('');
    setScanCompleted(false);
    setSelectedImage(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError(language === 'th' ? 'เบราว์เซอร์นี้ไม่รองรับกล้อง' : 'This browser does not support camera access');
      return;
    }

    try {
      stopCamera();
      await new Promise((resolve) => setTimeout(resolve, 250));

      setIsOpeningCamera(true);
      cameraStreamRef.current = await openCameraStream();
      setIsCameraOpen(true);
    } catch (error) {
      stopCamera();
      setCameraError(cameraErrorMessage(error));
    } finally {
      setIsOpeningCamera(false);
    }
  };

  const captureAndProcess = async () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) {
      setCameraError(
        language === 'th' ? 'กล้องยังไม่พร้อม รอสักครู่แล้วกดถ่ายอีกครั้ง' : 'Camera is not ready yet. Wait a moment and try again.',
      );
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL('image/jpeg', 0.88);

    stopCamera();
    setSelectedImage(imageData);
    await runTeachableScan(imageData);
  };

  const handleOpenCameraClick = () => {
    const hasSeenGuide = sessionStorage.getItem('hasSeenEcoBinScannerGuide');
    if (!hasSeenGuide) {
      setShowGuidePopup(true);
    } else {
      void startCamera();
    }
  };

  const proceedToCamera = () => {
    setShowGuidePopup(false);
    sessionStorage.setItem('hasSeenEcoBinScannerGuide', 'true');
    void startCamera();
  };

  const runTeachableScan = async (imageData: string) => {
    setIsScanning(true);
    setScanCompleted(false);
    setCameraError('');
    try {
      if (!TEACHABLE_MODEL_URL) {
        throw new Error(
          language === 'th'
            ? 'ยังไม่ได้ตั้งโมเดลจำแนกขยะ (NEXT_PUBLIC_TEACHABLE_MACHINE_MODEL_URL)'
            : 'Waste classification model URL is missing',
        );
      }
      const result = await classifyImageDataUrl(TEACHABLE_MODEL_URL, imageData);
      // SIT gate: only plastic bottle / can, and confidence > 80% (configurable).
      const accepted =
        result.valid &&
        (result.plasticTypeEN === 'PLASTIC_BOTTLE' || result.plasticTypeEN === 'CAN') &&
        result.confidence > CLASSIFY_CONFIDENCE_PCT;
      const corr =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `corr-${Date.now()}`;
      setCorrelationId(corr);
      setModelLabel(result.plasticTypeEN);
      void logClassifyEvent({
        correlationId: corr,
        modelLabel: result.plasticTypeEN,
        confidence: result.confidence,
        accepted,
        plasticType: result.plasticTypeTH,
      });
      setDetectedPlasticType(
        accepted
          ? (language === 'th' ? result.plasticTypeTH : result.plasticTypeEN)
          : (language === 'th' ? 'ยังไม่ผ่าน' : 'Not accepted'),
      );
      setBottleCount(accepted ? result.bottleCount : 0);
      setIsValidBottle(accepted);
      setConfidenceScore(result.confidence);
      if (accepted) {
        setDetectionNotes(
          language === 'th'
            ? `ตรวจพบ${result.plasticTypeTH} ความแม่นยำ ${result.confidence}% (ต้องมากกว่า ${CLASSIFY_CONFIDENCE_PCT}%) — กดบันทึกเพื่อรับแต้ม`
            : `Detected ${result.plasticTypeEN} at ${result.confidence}% (need above ${CLASSIFY_CONFIDENCE_PCT}%) — tap Save to earn points`,
        );
      } else if (!result.valid || (result.plasticTypeEN !== 'PLASTIC_BOTTLE' && result.plasticTypeEN !== 'CAN')) {
        setDetectionNotes(
          language === 'th'
            ? `ระบบรับเฉพาะขวดพลาสติกหรือกระป๋องเท่านั้น ลองจัดเฟรมใหม่แล้วถ่ายอีกครั้ง`
            : `Only plastic bottles or cans are accepted. Reframe and try again.`,
        );
      } else {
        setDetectionNotes(
          language === 'th'
            ? `ความแม่นยำ ${result.confidence}% ยังต่ำเกินไป (ต้องมากกว่า ${CLASSIFY_CONFIDENCE_PCT}%) ลองถ่ายใกล้ขึ้น แสงสว่างขึ้น`
            : `Accuracy ${result.confidence}% is too low (need above ${CLASSIFY_CONFIDENCE_PCT}%). Move closer and use better light.`,
        );
      }
      setScanCompleted(true);
    } catch (error) {
      setDetectedPlasticType(language === 'th' ? 'ตรวจไม่สำเร็จ' : 'Could not classify');
      setBottleCount(0);
      setIsValidBottle(false);
      setConfidenceScore(0);
      setDetectionNotes(
        language === 'th'
          ? `ตรวจรูปไม่สำเร็จ: ${error instanceof Error ? error.message : 'เกิดข้อผิดพลาด'} — ลองใหม่หรืออัปโหลดรูปอื่น`
          : `Could not classify: ${error instanceof Error ? error.message : 'unknown error'} — try again`,
      );
      setScanCompleted(true);
    } finally {
      setIsScanning(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        setSelectedImage(url);
        void runTeachableScan(url);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReset = () => {
    stopCamera();
    setSelectedImage(null);
    setScanCompleted(false);
    setIsScanning(false);
    setCameraError('');
  };

  const handleSubmitRecord = async () => {
    if (!selectedImage) return;

    if (!isValidBottle) {
      alert(
        language === 'th'
          ? `ยังบันทึกไม่ได้ — ต้องเป็นขวดพลาสติกหรือกระป๋อง และความแม่นยำมากกว่า ${CLASSIFY_CONFIDENCE_PCT}%`
          : `Cannot save yet — need a plastic bottle or can with accuracy above ${CLASSIFY_CONFIDENCE_PCT}%.`,
      );
      return;
    }

    if (currentUser) {
      await addWasteRecord({
        imageUrl: selectedImage,
        plasticType: detectedPlasticType,
        bottleCount: bottleCount,
        binLocation: selectedBin,
        confidence: confidenceScore,
        modelLabel: modelLabel || undefined,
        correlationId: correlationId || undefined,
      });
    } else {
      await addGuestWasteRecord({
        imageUrl: selectedImage,
        detectedBottles: bottleCount,
        scanResult: detectionNotes,
        confidence: confidenceScore,
        modelLabel: modelLabel || undefined,
        correlationId: correlationId || undefined,
      });
    }

    setTimeout(() => {
      handleReset();
      if (onSuccessNavigate) {
        onSuccessNavigate(currentUser ? 'dashboard' : 'history');
      }
    }, 600);
  };

  const bottleScore = matchBottleScore(
    plasticTypes,
    detectedPlasticType,
    settings.points_per_bottle || 10,
    settings.carbon_per_bottle || 0.08
  );
  const estimatedPoints = bottleCount * bottleScore.points;
  const estimatedWeight = bottleCount * (bottleScore.matched?.average_weight_kg || 0);
  const virginFactor = bottleScore.matched?.virgin_emission_factor || 0;
  const recycledFactor = bottleScore.matched?.recycled_emission_factor || 0;
  const estimatedNetZeroCredit = recycledFactor > 0
    ? estimatedWeight * Math.max(virginFactor - recycledFactor, 0)
    : estimatedWeight * virginFactor;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-white shadow-sm space-y-2">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
            <Camera className="w-4 h-4" />
          </span>
          {language === 'th' ? 'สแกนขวดพลาสติกและกระป๋อง' : 'Scan plastic bottles and cans'}
        </h2>
        <ol className="text-[11px] text-slate-600 grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-2 list-none">
          <li className="rounded-lg bg-slate-50 px-2.5 py-1.5 border border-slate-100">
            <span className="font-bold text-emerald-700">1.</span>{' '}
            {language === 'th' ? 'ถ่ายหรืออัปโหลดรูป' : 'Take or upload a photo'}
          </li>
          <li className="rounded-lg bg-slate-50 px-2.5 py-1.5 border border-slate-100">
            <span className="font-bold text-emerald-700">2.</span>{' '}
            {language === 'th'
              ? `รอผลตรวจ (ผ่านเมื่อแม่นยำ > ${CLASSIFY_CONFIDENCE_PCT}%)`
              : `Wait for result (pass when accuracy > ${CLASSIFY_CONFIDENCE_PCT}%)`}
          </li>
          <li className="rounded-lg bg-slate-50 px-2.5 py-1.5 border border-slate-100">
            <span className="font-bold text-emerald-700">3.</span>{' '}
            {language === 'th' ? 'กดบันทึกเพื่อรับแต้มทันที' : 'Save to earn points right away'}
          </li>
        </ol>
      </div>

      {/* Guest Mode Notice */}
      {!currentUser && (
        <div className="bg-amber-50/80 border border-amber-200/70 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-amber-950 text-xs">
          <div className="flex items-center gap-2.5">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              {language === 'th'
                ? 'คุณยังไม่ได้เข้าสู่ระบบ — ลองสแกนได้ แต่จะยังไม่ได้รับแต้มจริง'
                : 'You are not signed in — you can try scanning, but you will not earn real points yet.'}
            </span>
          </div>
          <button
            id="scanner-login-prompt-btn"
            onClick={openAuthModal}
            className="shrink-0 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            {language === 'th' ? 'เข้าสู่ระบบเพื่อรับแต้ม' : 'Sign in to earn points'}
          </button>
        </div>
      )}

      {/* Main Scanner Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left: Camera / Preview (7 cols) */}
        <div className="lg:col-span-7 space-y-3.5">
          <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-sm relative min-h-[340px] flex flex-col items-center justify-center text-white">
            
            {isCameraOpen ? (
              <div className="relative w-full h-[340px] bg-black">
                <video
                  ref={videoRef}
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-5 border-2 border-emerald-400/80 rounded-2xl pointer-events-none">
                  <div className="absolute left-1/2 top-1/2 w-2/3 h-2/3 -translate-x-1/2 -translate-y-1/2 border border-dashed border-emerald-300 rounded-xl" />
                </div>
                <div className="absolute inset-x-3 bottom-3 flex items-center gap-2">
                  <button
                    id="scanner-capture-btn"
                    onClick={() => void captureAndProcess()}
                    disabled={isOpeningCamera || isScanning}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-xs font-bold flex items-center justify-center gap-2"
                  >
                    <Camera className="w-4 h-4" />
                    {language === 'th' ? 'ถ่ายรูป' : 'Take photo'}
                  </button>
                  <button
                    onClick={stopCamera}
                    className="p-2.5 bg-black/60 hover:bg-black/80 text-white rounded-xl"
                    title={language === 'th' ? 'ปิดกล้อง' : 'Close camera'}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : selectedImage ? (
              <div className="relative w-full h-[340px] bg-black">
                <img 
                  src={selectedImage} 
                  alt={language === 'th' ? 'รูปขยะที่ถ่าย' : 'Captured waste photo'} 
                  className="w-full h-full object-contain"
                />

                {/* Scanning Animation Overlay */}
                {isScanning && (
                  <div className="absolute inset-0 bg-emerald-950/50 backdrop-blur-xs flex flex-col items-center justify-center">
                    <div className="relative w-40 h-40 border-2 border-dashed border-emerald-400 rounded-2xl flex items-center justify-center">
                      <ScanLine className="w-10 h-10 text-emerald-400 animate-pulse" />
                      <div className="absolute inset-x-0 h-0.5 bg-emerald-400 shadow-[0_0_12px_#34d399] animate-bounce" />
                    </div>
                    <p className="mt-3 text-xs font-semibold text-emerald-200 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 animate-spin" />
                      {language === 'th' ? 'กำลังตรวจว่าเป็นขวดหรือกระป๋อง...' : 'Checking if it is a bottle or can...'}
                    </p>
                  </div>
                )}

                {/* Bounding Box Result */}
                {scanCompleted && (
                  <div className="absolute inset-0 pointer-events-none p-5 flex items-center justify-center">
                    <div className={`border-2 rounded-xl p-2.5 backdrop-blur-xs ${
                      isValidBottle 
                        ? 'border-emerald-400 bg-emerald-950/40' 
                        : 'border-rose-400 bg-rose-950/40'
                    }`}>
                      <div className="flex items-center gap-1.5 bg-black/80 px-2.5 py-1 rounded-md text-xs font-bold">
                        {isValidBottle ? (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {language === 'th' ? 'ผ่าน' : 'Passed'}: {detectedPlasticType} ({confidenceScore}%)
                          </span>
                        ) : (
                          <span className="text-rose-400 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            {language === 'th' ? 'ยังไม่ผ่าน' : 'Not passed'} ({confidenceScore}%)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Reset button */}
                <button
                  id="scanner-reset-btn"
                  onClick={handleReset}
                  className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black/80 text-white rounded-xl backdrop-blur-md transition-colors cursor-pointer"
                  title={language === 'th' ? 'ถ่ายใหม่' : 'Retake'}
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* Empty Camera Trigger */
              <div className="p-6 text-center flex flex-col items-center max-w-xs">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3 shadow-inner">
                  <Camera className="w-7 h-7" />
                </div>
                <h3 className="text-sm font-semibold text-white mb-1">
                  {language === 'th' ? 'เริ่มด้วยการถ่ายรูป' : 'Start with a photo'}
                </h3>
                <p className="text-[11px] text-slate-400 mb-5">
                  {language === 'th'
                    ? 'วางขวดหรือกระป๋องให้อยู่กลางภาพ แสงพอ และพื้นหลังไม่รก'
                    : 'Place the bottle or can in the center, with good light and a clear background'}
                </p>

                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  accept="image/*" 
                  className="hidden" 
                />

                <button
                  id="scanner-open-camera-btn"
                  onClick={handleOpenCameraClick}
                  disabled={isOpeningCamera}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>
                    {isOpeningCamera
                      ? (language === 'th' ? 'กำลังเปิดกล้อง...' : 'Opening camera...')
                      : (language === 'th' ? 'เปิดกล้อง' : 'Open camera')}
                  </span>
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full mt-2 flex items-center justify-center gap-2 py-2 px-4 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-xl"
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>{language === 'th' ? 'เลือกจากคลังรูป' : 'Choose from gallery'}</span>
                </button>
              </div>
            )}
          </div>

          {cameraError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
              {cameraError}
            </div>
          )}


        </div>

        {/* Right: Results & Bin Selector (5 cols) */}
        <div className="lg:col-span-5 space-y-3.5">
          


          {/* Analysis & Points Card */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white shadow-sm space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-900">{language === 'th' ? 'ผลตรวจ' : 'Result'}</span>
              {scanCompleted && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  isValidBottle ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {isValidBottle
                    ? (language === 'th' ? 'พร้อมรับแต้ม' : 'Ready for points')
                    : (language === 'th' ? 'ยังรับแต้มไม่ได้' : 'No points yet')}
                </span>
              )}
            </div>

            {scanCompleted ? (
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 text-[11px] block">{language === 'th' ? 'ตรวจพบ:' : 'Detected:'}</span>
                  <p className="text-slate-900 font-bold text-xs flex items-center gap-1 mt-0.5">
                    <Leaf className="w-3.5 h-3.5 text-emerald-600" />
                    {detectedPlasticType}
                    <span className="font-normal text-slate-500">· {confidenceScore}%</span>
                  </p>
                  {detectionNotes && (
                    <p className={`mt-1.5 text-[10px] leading-relaxed ${isValidBottle ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {detectionNotes}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-slate-400 text-[10px] block mb-1">{language === 'th' ? 'จำนวนชิ้น' : 'Quantity'}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setBottleCount(Math.max(1, bottleCount - 1))}
                        disabled={!isValidBottle}
                        className="w-5 h-5 rounded bg-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-300 disabled:opacity-30 cursor-pointer"
                      >
                        -
                      </button>
                      <span className="text-sm font-bold text-slate-900">{bottleCount}</span>
                      <button
                        onClick={() => setBottleCount(bottleCount + 1)}
                        disabled={!isValidBottle}
                        className="w-5 h-5 rounded bg-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-300 disabled:opacity-30 cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
                    <span className="text-emerald-800 text-[10px] block mb-1">{language === 'th' ? 'แต้มที่จะได้' : 'Points to earn'}</span>
                    <div className="flex items-baseline gap-1 text-emerald-900 font-bold">
                      <Coins className="w-3.5 h-3.5 text-amber-500 fill-amber-400 inline" />
                      <span className="text-base">+{isValidBottle ? estimatedPoints : 0}</span>
                      <span className="text-[10px] font-normal">{language === 'th' ? 'หลังกดบันทึก' : 'after save'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-teal-50/70 p-2.5 rounded-xl border border-teal-100 text-teal-900 text-xs font-medium space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5">
                      <Leaf className="w-3.5 h-3.5 text-teal-600" />
                      {language === 'th' ? 'คาร์บอนที่ลดได้โดยประมาณ' : 'Estimated carbon reduced'}
                    </span>
                    <span className="font-bold whitespace-nowrap">{isValidBottle ? estimatedNetZeroCredit.toFixed(3) : '0.000'} kgCO₂e</span>
                  </div>
                  <p className="text-[10px] text-teal-800 leading-relaxed">
                    {language === 'th'
                      ? `น้ำหนักประมาณ ${estimatedWeight.toFixed(3)} กก. · คำนวณจากการคัดแยกเพื่อรีไซเคิล`
                      : `About ${estimatedWeight.toFixed(3)} kg · based on recycling diversion`}
                  </p>
                </div>

                <label className="block">
                  <span className="text-slate-400 text-[11px] flex items-center gap-1 mb-1">
                    <MapPin className="w-3 h-3" />
                    {language === 'th' ? 'จุดทิ้งขยะ' : 'Drop-off location'}
                  </span>
                  <select
                    value={selectedBin}
                    onChange={(e) => setSelectedBin(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800"
                  >
                    {liveBins.map((bin) => (
                      <option key={bin.bin_id} value={bin.bin_name}>
                        {bin.bin_name}{bin.status && bin.status !== 'พร้อมใช้งาน' ? ` (${bin.status})` : ''}
                      </option>
                    ))}
                  </select>
                </label>

                {/* Submit Action */}
                <button
                  id="scanner-submit-btn"
                  onClick={handleSubmitRecord}
                  disabled={!isValidBottle}
                  className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all ${
                    isValidBottle
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {currentUser 
                      ? (language === 'th' ? `บันทึกและรับ +${estimatedPoints} แต้ม` : `Save and earn +${estimatedPoints} pts`)
                      : (language === 'th' ? 'บันทึกการทดลอง (ยังไม่ได้รับแต้ม)' : 'Save trial (no points yet)')}
                  </span>
                </button>
                {!isValidBottle && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="w-full py-2 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800"
                  >
                    {language === 'th' ? 'ถ่ายใหม่' : 'Retake photo'}
                  </button>
                )}
              </div>
            ) : (
              <div className="py-6 text-center text-slate-400 text-xs space-y-1.5">
                <ScanLine className="w-6 h-6 mx-auto text-slate-300" />
                <p>{language === 'th' ? 'ยังไม่มีผลตรวจ — เปิดกล้องหรือเลือกจากคลังรูป' : 'No result yet — open the camera or pick a photo'}</p>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Guide Popup */}
      {showGuidePopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2 text-amber-600">
                  <Sparkles className="w-5 h-5" />
                  <h3 className="text-base font-bold text-slate-900">
                    {language === 'th' ? 'ก่อนถ่ายรูป เตรียมขวด/กระป๋อง' : 'Before you take a photo'}
                  </h3>
                </div>
                <button 
                  onClick={() => setShowGuidePopup(false)}
                  className="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 p-1.5 rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-amber-50/50 rounded-xl border border-amber-100/50">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-amber-700 font-bold shadow-sm shrink-0">1</div>
                  <span className="text-sm font-medium text-slate-700">{language === 'th' ? 'เทน้ำออกให้หมด' : 'Empty liquids'}</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-amber-50/50 rounded-xl border border-amber-100/50">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-amber-700 font-bold shadow-sm shrink-0">2</div>
                  <span className="text-sm font-medium text-slate-700">{language === 'th' ? 'แยกฝา หลอด และสิ่งปนเปื้อน' : 'Remove caps, straws, and contaminants'}</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-amber-50/50 rounded-xl border border-amber-100/50">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-amber-700 font-bold shadow-sm shrink-0">3</div>
                  <span className="text-sm font-medium text-slate-700">{language === 'th' ? 'บีบให้แบน แล้ววางกลางภาพถ่าย' : 'Flatten it, then center it in the photo'}</span>
                </div>
              </div>

              <button
                onClick={proceedToCamera}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-xs transition-colors mt-2 cursor-pointer"
              >
                {language === 'th' ? 'พร้อมแล้ว เปิดกล้อง' : 'Ready — open camera'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
