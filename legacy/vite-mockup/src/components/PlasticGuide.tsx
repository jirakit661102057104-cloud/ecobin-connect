import React, { useState } from 'react';
import { PLASTIC_TYPES_DATA } from '../data/mockData';
import { PlasticInfo } from '../types';
import { 
  BookOpen, 
  Leaf, 
  Recycle, 
  Calculator, 
  Sparkles, 
  CheckCircle2
} from 'lucide-react';

export const PlasticGuide: React.FC = () => {
  const [selectedPlastic, setSelectedPlastic] = useState<PlasticInfo>(PLASTIC_TYPES_DATA[0]);
  const [calcBottlesPerDay, setCalcBottlesPerDay] = useState<number>(2);

  const totalMonthlyBottles = calcBottlesPerDay * 30;
  const monthlyCarbonSaved = (totalMonthlyBottles * 0.08).toFixed(2);
  const yearlyCarbonSaved = (totalMonthlyBottles * 12 * 0.08).toFixed(2);
  const monthlyPoints = totalMonthlyBottles * 10;

  return (
    <div className="space-y-5">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 to-teal-900 rounded-3xl p-5 sm:p-6 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/20">
              <BookOpen className="w-3.5 h-3.5" />
            </span>
            <span className="text-xs text-emerald-300 font-medium">คู่มือการคัดแยก</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            สัญลักษณ์พลาสติก 7 ชนิด & หลัก 3Rs
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            เรียนรู้สัญลักษณ์พลาสติกเพื่อการรีไซเคิลอย่างถูกต้อง
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white/10 px-3.5 py-2 rounded-xl text-xs text-emerald-200 border border-white/10 self-start sm:self-auto font-medium">
          <Leaf className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>ลดก๊าซเรือนกระจกสู่ชั้นบรรยากาศ</span>
        </div>
      </div>

      {/* 7 Plastic Types Visual Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Recycle className="w-4 h-4 text-emerald-600" />
            <span>เลือกประเภทพลาสติก (1-7):</span>
          </h3>
          <span className="text-[11px] text-slate-400">คลิกเพื่อดูรายละเอียด</span>
        </div>

        {/* 7 Pills Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {PLASTIC_TYPES_DATA.map((plastic) => {
            const isSelected = selectedPlastic.code === plastic.code;
            return (
              <button
                key={plastic.code}
                id={`plastic-btn-${plastic.code}`}
                onClick={() => setSelectedPlastic(plastic)}
                className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50 shadow-2xs ring-2 ring-emerald-500/20'
                    : 'bg-white border-slate-100 hover:border-emerald-200 hover:bg-slate-50'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs border ${
                  isSelected 
                    ? 'bg-emerald-600 text-white border-emerald-600' 
                    : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}>
                  {plastic.code}
                </div>
                <div className="leading-tight">
                  <span className="font-bold text-xs text-slate-900 block">{plastic.name}</span>
                  <span className="text-[10px] text-slate-400 line-clamp-1">{plastic.shortName.split('/')[0]}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Detailed Selected Plastic Card */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex flex-col items-center justify-center shrink-0">
                <span className="text-[9px] uppercase font-bold">ประเภท</span>
                <span className="text-xl font-black leading-none">#{selectedPlastic.code}</span>
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">{selectedPlastic.name}</h4>
                <p className="text-xs text-slate-400 font-normal">{selectedPlastic.fullName}</p>
              </div>
            </div>

            <div className="bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100 text-xs text-emerald-900 flex items-center gap-1.5 self-start sm:self-auto font-medium">
              <Leaf className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>ลดคาร์บอน ~<strong>{selectedPlastic.carbonFactor}</strong> kg CO₂e/ชิ้น</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1">
              <span className="font-bold text-slate-800 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                คุณสมบัติ:
              </span>
              <p className="text-slate-600 leading-relaxed">{selectedPlastic.properties}</p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1">
              <span className="font-bold text-slate-800 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ตัวอย่างผลิตภัณฑ์:
              </span>
              <ul className="space-y-0.5 text-slate-600 list-disc list-inside">
                {selectedPlastic.examples.map((ex, i) => (
                  <li key={i}>{ex}</li>
                ))}
              </ul>
            </div>

            <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-100 space-y-1">
              <span className="font-bold text-emerald-900 flex items-center gap-1">
                <Recycle className="w-3.5 h-3.5 text-emerald-600" />
                คำแนะนำการคัดแยก:
              </span>
              <p className="text-emerald-950 leading-relaxed">{selectedPlastic.recyclingTips}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Carbon Calculator */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-2xs space-y-4">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-teal-100 text-teal-800">
            <Calculator className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              คำนวณการลดคาร์บอน (Carbon Calculator)
            </h3>
            <p className="text-xs text-slate-400">ประเมินผลลัพธ์จากการคัดแยกขวดน้ำดื่ม PET</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          {/* Slider input */}
          <div className="lg:col-span-5 bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">จำนวนขวด/วัน:</label>
              <span className="text-sm font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-lg">
                {calcBottlesPerDay} ขวด
              </span>
            </div>

            <input
              type="range"
              min="1"
              max="20"
              value={calcBottlesPerDay}
              onChange={(e) => setCalcBottlesPerDay(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />

            <div className="flex justify-between text-[10px] text-slate-400">
              <span>1 ขวด</span>
              <span>10 ขวด</span>
              <span>20 ขวด</span>
            </div>
          </div>

          {/* Result outputs */}
          <div className="lg:col-span-7 grid grid-cols-3 gap-2.5 text-center">
            <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-100">
              <span className="text-[10px] text-slate-500 block">ลด CO₂e/เดือน</span>
              <strong className="text-lg font-bold text-emerald-800">{monthlyCarbonSaved}</strong>
              <span className="text-[10px] text-slate-400 block">kg CO₂e</span>
            </div>

            <div className="bg-teal-50/70 p-3 rounded-xl border border-teal-100">
              <span className="text-[10px] text-slate-500 block">ลด CO₂e/ปี</span>
              <strong className="text-lg font-bold text-teal-800">{yearlyCarbonSaved}</strong>
              <span className="text-[10px] text-slate-400 block">kg CO₂e</span>
            </div>

            <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-100">
              <span className="text-[10px] text-slate-500 block">แต้มสะสม/เดือน</span>
              <strong className="text-lg font-bold text-amber-700">+{monthlyPoints}</strong>
              <span className="text-[10px] text-slate-400 block">แต้ม</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3Rs Principles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-2xs space-y-1.5">
          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
            1R
          </div>
          <h4 className="font-bold text-xs text-slate-900">Reduce (ลดการใช้)</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            พกกระบอกน้ำและถุงผ้าส่วนตัว ลดการใช้พลาสติกแบบครั้งเดียวทิ้ง
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-2xs space-y-1.5">
          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
            2R
          </div>
          <h4 className="font-bold text-xs text-slate-900">Reuse (ใช้ซ้ำ)</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            นำบรรจุภัณฑ์ที่ยังสภาพดีกลับมาใช้ซ้ำให้คุ้มค่าก่อนทิ้ง
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-2xs space-y-1.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
            3R
          </div>
          <h4 className="font-bold text-xs text-slate-900">Recycle (แปรรูปใหม่)</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            แยกขวดพลาสติก PET และ HDPE สะอาด แล้วนำมาหย่อนที่ตู้ EcoBin
          </p>
        </div>
      </div>

    </div>
  );
};
