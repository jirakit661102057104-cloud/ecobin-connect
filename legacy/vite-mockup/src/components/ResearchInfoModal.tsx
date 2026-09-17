import React from 'react';
import { 
  GraduationCap, 
  BookOpen, 
  X, 
  Sparkles, 
  Database, 
  Code2, 
  Smartphone, 
  CheckCircle2, 
  Award,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ResearchInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ResearchInfoModal: React.FC<ResearchInfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto relative space-y-6"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Academic Header Header */}
        <div className="text-center space-y-2 border-b border-slate-100 pb-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-inner">
            <GraduationCap className="w-8 h-8" />
          </div>

          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 inline-block">
            เอกสารโครงการวิจัย • ปีการศึกษา 2568
          </span>

          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight">
            แอปพลิเคชั่นคัดแยกขยะ (EcoBin Connect)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium font-sans">
            Recyclable Waste Separation Application with Smart Bin Tracking
          </p>
        </div>

        {/* Authors & Academic Affiliation Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1.5">
            <span className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider block">
              คณะผู้จัดทำโครงการ (Researchers)
            </span>
            <p className="font-bold text-slate-900 text-sm">1. นายจิรกิตติ์ ตันตระกูล</p>
            <p className="font-bold text-slate-900 text-sm">2. นางสาวศุภณัฐ ปลื้มบุญ</p>
            <p className="text-slate-500 text-[11px] pt-1">
              สาขาวิชาเทคโนโลยีสารสนเทศ คณะวิทยาศาสตร์และเทคโนโลยี
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1.5">
            <span className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider block">
              อาจารย์ที่ปรึกษา & สถาบัน
            </span>
            <p className="font-bold text-slate-900 text-sm">ผู้ช่วยศาสตราจารย์ ศรัญญา ตรีทศ</p>
            <p className="text-slate-600 font-medium">อาจารย์ที่ปรึกษาโครงงาน</p>
            <p className="text-emerald-800 text-[11px] font-semibold pt-1">
              มหาวิทยาลัยราชภัฏเพชรบูรณ์ (PCRU)
            </p>
          </div>
        </div>

        {/* Objectives & Scope from Chapter 1 & 2 */}
        <div className="space-y-3 text-xs text-slate-600 leading-relaxed bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100">
          <h4 className="font-bold text-emerald-950 flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-600" />
            <span>วัตถุประสงค์และกรอบการวิจัย (Research Objectives)</span>
          </h4>
          <ul className="space-y-1.5 list-disc list-inside text-slate-700">
            <li>
              พัฒนาแอปพลิเคชันต้นแบบสำหรับบริหารจัดการข้อมูลขยะประเภทขวดพลาสติก (PET / HDPE)
            </li>
            <li>
              ประเมินประสิทธิภาพของระบบสารสนเทศในการจัดเก็บข้อมูลการคัดแยกขยะ และการประมวลผลค่าคาร์บอนฟุตพริ้นท์ (Carbon Footprint)
            </li>
            <li>
              สร้างแรงจูงใจในการคัดแยกขยะผ่านระบบสะสมแต้มและจำลองการแลกของรางวัล (Simulation V.0.1)
            </li>
            <li>
              สนับสนุนนโยบาย Green University มหาวิทยาลัยราชภัฏเพชรบูรณ์ ตามหลัก 3Rs
            </li>
          </ul>
        </div>

        {/* Technical Architecture & Database Schemas (Chapter 2 & 3) */}
        <div className="space-y-3 text-xs">
          <h4 className="font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-4 h-4 text-purple-700" />
            <span>โครงสร้างข้อมูลตาม ER-Model (ตารางที่ 3.3 - 3.7)</span>
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-mono font-bold text-slate-900 block">users</span>
              <span className="text-[10px] text-slate-500">ข้อมูลสมาชิก & แต้ม</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-mono font-bold text-slate-900 block">waste_records</span>
              <span className="text-[10px] text-slate-500">ประวัติภาพถ่าย & ตรวจสอบ</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-mono font-bold text-slate-900 block">point_transactions</span>
              <span className="text-[10px] text-slate-500">ประวัติรับ-แลกคะแนน</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-mono font-bold text-slate-900 block">rewards</span>
              <span className="text-[10px] text-slate-500">แคตตาล็อกของรางวัล</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-mono font-bold text-slate-900 block">redemption_sim</span>
              <span className="text-[10px] text-slate-500">จำลองการขอแลกรางวัล</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-mono font-bold text-slate-900 block">local_storage_logs</span>
              <span className="text-[10px] text-slate-500">บันทึกชั่วคราว Guest</span>
            </div>
          </div>
        </div>

        {/* Tech Stack Chips */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2 text-[11px]">
          <span className="text-slate-400 font-medium">เครื่องมือที่ใช้:</span>
          <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-lg">Dart & Flutter</span>
          <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-lg">Google Firebase</span>
          <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-lg">POCO X6 Pro</span>
          <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-lg">Figma UI/UX</span>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs shadow-md transition-colors"
        >
          ปิดหน้าต่างข้อมูลวิจัย
        </button>
      </motion.div>
    </div>
  );
};
