import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { SMART_BIN_LOCATIONS } from '../data/mockData';
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

interface SampleImage {
  title_th: string;
  title_en: string;
  url: string;
  type_th: string;
  type_en: string;
  count: number;
  valid: boolean;
  notes_th: string;
  notes_en: string;
}

const SAMPLE_IMAGES: SampleImage[] = [
  {
    title_th: 'ขวด PET ใส (3 ขวด)',
    title_en: 'Clear PET (3 Bottles)',
    url: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&auto=format&fit=crop&q=80',
    type_th: 'PET (เบอร์ 1 - ขวดน้ำใส)',
    type_en: 'PET (#1 - Clear Bottle)',
    count: 3,
    valid: true,
    notes_th: 'ผ่านเกณฑ์: ขวดน้ำ PET ใสสะอาด',
    notes_en: 'Pass: Clean clear PET bottle'
  },
  {
    title_th: 'ขวดนม HDPE (2 ขวด)',
    title_en: 'HDPE Milk (2 Bottles)',
    url: 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=800&auto=format&fit=crop&q=80',
    type_th: 'HDPE (เบอร์ 2 - ขวดนม/ขุ่น)',
    type_en: 'HDPE (#2 - Milk/Opaque)',
    count: 2,
    valid: true,
    notes_th: 'ผ่านเกณฑ์: พลาสติก HDPE ล้างสะอาด',
    notes_en: 'Pass: Clean HDPE plastic'
  },
  {
    title_th: 'ขวดน้ำอัดลม PET (5 ขวด)',
    title_en: 'PET Soda (5 Bottles)',
    url: 'https://images.unsplash.com/photo-1528190336454-13cd56b45b5a?w=800&auto=format&fit=crop&q=80',
    type_th: 'PET (เบอร์ 1 - ขวดน้ำใส)',
    type_en: 'PET (#1 - Clear Bottle)',
    count: 5,
    valid: true,
    notes_th: 'ผ่านเกณฑ์: ขวด PET แยกฝาเรียบร้อย',
    notes_en: 'Pass: PET bottles separated cap'
  },
  {
    title_th: 'ขยะไม่ตรงประเภท (ถุง/ขยะผสม)',
    title_en: 'Invalid (Mixed Waste)',
    url: 'https://images.unsplash.com/photo-1577705998148-6da4f3963bc8?w=800&auto=format&fit=crop&q=80',
    type_th: 'ขยะทั่วไป / พลาสติกอื่น',
    type_en: 'General / Other Plastic',
    count: 0,
    valid: false,
    notes_th: 'ไม่ผ่านเกณฑ์: พบถุงพลาสติกและขยะผสม',
    notes_en: 'Fail: Found plastic bags and mixed waste'
  }
];

interface WasteScannerProps {
  onSuccessNavigate?: (tab: string) => void;
  openAuthModal: () => void;
}

export const WasteScanner: React.FC<WasteScannerProps> = ({ onSuccessNavigate, openAuthModal }) => {
  const { currentUser, language, addWasteRecord, addGuestWasteRecord } = useApp();

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedBin, setSelectedBin] = useState<string>(SMART_BIN_LOCATIONS[0].name);
  const [isScanning, setIsScanning] = useState(false);
  const [scanCompleted, setScanCompleted] = useState(false);
  const [detectedPlasticType, setDetectedPlasticType] = useState<string>('PET (#1)');
  const [bottleCount, setBottleCount] = useState<number>(3);
  const [isValidBottle, setIsValidBottle] = useState<boolean>(true);
  const [confidenceScore, setConfidenceScore] = useState<number>(98.5);
  const [detectionNotes, setDetectionNotes] = useState<string>('');
  const [showGuidePopup, setShowGuidePopup] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenCameraClick = () => {
    const hasSeenGuide = sessionStorage.getItem('hasSeenEcoBinScannerGuide');
    if (!hasSeenGuide) {
      setShowGuidePopup(true);
    } else {
      fileInputRef.current?.click();
    }
  };

  const proceedToCamera = () => {
    setShowGuidePopup(false);
    sessionStorage.setItem('hasSeenEcoBinScannerGuide', 'true');
    fileInputRef.current?.click();
  };

  const handleSelectSample = (sample: SampleImage) => {
    setSelectedImage(sample.url);
    setIsScanning(true);
    setScanCompleted(false);

    setTimeout(() => {
      setIsScanning(false);
      setScanCompleted(true);
      setDetectedPlasticType(language === 'th' ? sample.type_th : sample.type_en);
      setBottleCount(sample.count);
      setIsValidBottle(sample.valid);
      setConfidenceScore(sample.valid ? 97.8 : 42.1);
      setDetectionNotes(language === 'th' ? sample.notes_th : sample.notes_en);
    }, 1100);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        setSelectedImage(url);
        simulateAiScan();
      };
      reader.readAsDataURL(file);
    }
  };

  const simulateAiScan = () => {
    setIsScanning(true);
    setScanCompleted(false);

    setTimeout(() => {
      setIsScanning(false);
      setScanCompleted(true);
      setDetectedPlasticType(language === 'th' ? 'PET (เบอร์ 1 - ขวดน้ำใส)' : 'PET (#1 - Clear Bottle)');
      setBottleCount(2);
      setIsValidBottle(true);
      setConfidenceScore(96.4);
      setDetectionNotes(language === 'th' ? 'ตรวจพบขวดพลาสติก PET ใส 2 ขวด สภาพพร้อมรีไซเคิล' : 'Detected 2 clear PET bottles, ready for recycling');
    }, 1200);
  };

  const handleReset = () => {
    setSelectedImage(null);
    setScanCompleted(false);
    setIsScanning(false);
  };

  const handleSubmitRecord = () => {
    if (!selectedImage) return;

    if (!isValidBottle) {
      alert(language === 'th' ? 'ไม่สามารถส่งข้อมูลได้ เนื่องจากภาพไม่ตรงกับเงื่อนไขขวดพลาสติกรีไซเคิล' : 'Cannot submit. The image does not match the recyclable plastic bottle criteria.');
      return;
    }

    if (currentUser) {
      addWasteRecord({
        imageUrl: selectedImage,
        plasticType: detectedPlasticType,
        bottleCount: bottleCount,
        binLocation: selectedBin
      });
    } else {
      addGuestWasteRecord({
        imageUrl: selectedImage,
        detectedBottles: bottleCount,
        scanResult: detectionNotes
      });
    }

    setTimeout(() => {
      handleReset();
      if (onSuccessNavigate) {
        onSuccessNavigate(currentUser ? 'dashboard' : 'history');
      }
    }, 600);
  };

  const estimatedPoints = bottleCount * 10;
  const estimatedCarbon = (bottleCount * 0.08).toFixed(2);

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      
      {/* Header Bar */}
      <div className="bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-white shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
            <Camera className="w-4 h-4" />
          </span>
          {language === 'th' ? 'สแกนและคัดแยกขวดพลาสติก' : 'Scan and Sort Plastic Bottles'}
        </h2>
      </div>

      {/* Guest Mode Notice */}
      {!currentUser && (
        <div className="bg-amber-50/80 border border-amber-200/70 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-amber-950 text-xs">
          <div className="flex items-center gap-2.5">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{language === 'th' ? 'โหมดผู้เยี่ยมชม: ผลการทดสอบจะบันทึกลงเครื่อง (Local Storage)' : 'Guest Mode: Results are saved to your local storage.'}</span>
          </div>
          <button
            id="scanner-login-prompt-btn"
            onClick={openAuthModal}
            className="shrink-0 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            {language === 'th' ? 'เข้าสู่ระบบ' : 'Login'}
          </button>
        </div>
      )}

      {/* Main Scanner Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left: Camera / Preview (7 cols) */}
        <div className="lg:col-span-7 space-y-3.5">
          <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-sm relative min-h-[340px] flex flex-col items-center justify-center text-white">
            
            {selectedImage ? (
              <div className="relative w-full h-[340px] bg-black">
                <img 
                  src={selectedImage} 
                  alt="Uploaded waste" 
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
                      {language === 'th' ? 'กำลังประมวลผลภาพถ่าย...' : 'Processing image...'}
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
                            {detectedPlasticType} ({confidenceScore}%)
                          </span>
                        ) : (
                          <span className="text-rose-400 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            {language === 'th' ? 'ไม่ตรงเกณฑ์' : 'Does not match criteria'} ({confidenceScore}%)
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
                  title={language === 'th' ? 'เปลี่ยนรูปภาพ' : 'Change Image'}
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
                  {language === 'th' ? 'ถ่ายรูปหรืออัปโหลดภาพขวด' : 'Take a photo or upload an image'}
                </h3>
                <p className="text-[11px] text-slate-400 mb-5">
                  {language === 'th' ? 'เลือกภาพหรือทดสอบจากตัวอย่างด้านล่าง' : 'Select an image or use samples below'}
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
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>{language === 'th' ? 'เปิดกล้อง / อัปโหลด' : 'Open Camera / Upload'}</span>
                </button>
              </div>
            )}
          </div>



        </div>

        {/* Right: Results & Bin Selector (5 cols) */}
        <div className="lg:col-span-5 space-y-3.5">
          


          {/* Analysis & Points Card */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white shadow-sm space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-900">{language === 'th' ? 'ผลการวิเคราะห์' : 'Analysis Results'}</span>
              {scanCompleted && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  isValidBottle ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {isValidBottle ? (language === 'th' ? 'ผ่านการตรวจสอบ' : 'Passed') : (language === 'th' ? 'ไม่ผ่านเกณฑ์' : 'Failed')}
                </span>
              )}
            </div>

            {scanCompleted ? (
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 text-[11px] block">{language === 'th' ? 'ชนิดพลาสติก:' : 'Plastic Type:'}</span>
                  <p className="text-slate-900 font-bold text-xs flex items-center gap-1 mt-0.5">
                    <Leaf className="w-3.5 h-3.5 text-emerald-600" />
                    {detectedPlasticType}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-slate-400 text-[10px] block mb-1">{language === 'th' ? 'จำนวนขวด:' : 'Bottle Count:'}</span>
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
                    <span className="text-emerald-800 text-[10px] block mb-1">{language === 'th' ? 'แต้มที่จะได้รับ:' : 'Points to earn:'}</span>
                    <div className="flex items-baseline gap-1 text-emerald-900 font-bold">
                      <Coins className="w-3.5 h-3.5 text-amber-500 fill-amber-400 inline" />
                      <span className="text-base">+{isValidBottle ? estimatedPoints : 0}</span>
                      <span className="text-[10px] font-normal">{language === 'th' ? 'แต้ม' : 'pts'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-teal-50/70 p-2.5 rounded-xl border border-teal-100 text-teal-900 text-xs font-medium">
                  <span className="flex items-center gap-1.5">
                    <Leaf className="w-3.5 h-3.5 text-teal-600" />
                    {language === 'th' ? 'ลด CO₂e:' : 'CO₂e Reduced:'}
                  </span>
                  <span className="font-bold">{isValidBottle ? estimatedCarbon : 0.00} kg</span>
                </div>

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
                      ? (language === 'th' ? `ยืนยันและรับ ${estimatedPoints} แต้ม` : `Confirm and get ${estimatedPoints} pts`) 
                      : (language === 'th' ? 'บันทึกผล (โหมด Guest)' : 'Save (Guest Mode)')}
                  </span>
                </button>
              </div>
            ) : (
              <div className="py-6 text-center text-slate-400 text-xs space-y-1.5">
                <ScanLine className="w-6 h-6 mx-auto text-slate-300" />
                <p>{language === 'th' ? 'เลือกหรือถ่ายรูปภาพเพื่อเริ่มวิเคราะห์' : 'Select or take an image to start analyzing'}</p>
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
                    {language === 'th' ? 'เกณฑ์การคัดแยกก่อนหย่อนถัง' : 'Sorting Criteria'}
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
                  <span className="text-sm font-medium text-slate-700">{language === 'th' ? 'แยกฝาและฉลาก' : 'Remove cap and label'}</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-amber-50/50 rounded-xl border border-amber-100/50">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-amber-700 font-bold shadow-sm shrink-0">3</div>
                  <span className="text-sm font-medium text-slate-700">{language === 'th' ? 'บีบขวดให้แบน' : 'Crush bottle flat'}</span>
                </div>
              </div>

              <button
                onClick={proceedToCamera}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-xs transition-colors mt-2 cursor-pointer"
              >
                {language === 'th' ? 'เข้าใจแล้ว เริ่มถ่ายภาพ' : 'Got it, start scanning'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
