'use client';

import React, { useMemo, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { APP_NAME } from '../lib/brand';
import { downloadCertificate, printCertificate } from '../lib/certificateDownload';
import {
  Leaf,
  Factory,
  Award,
  Coins,
  Printer,
  TreePine,
  Recycle,
  Download,
  FileBarChart2,
} from 'lucide-react';

function isApproved(status: string) {
  return status === 'อนุมัติแล้ว';
}

type ReportSection = 'report' | 'certificate';

export const ReportView: React.FC = () => {
  const { currentUser, wasteRecords, certificates, language } = useApp();
  const th = language === 'th';
  const printRef = useRef<HTMLDivElement>(null);
  const isMember = currentUser?.user_role === 'Member';
  const [section, setSection] = useState<ReportSection>('report');

  const myCertificates = useMemo(() => {
    if (!currentUser) return [];
    return certificates
      .filter((c) => c.user_id === currentUser.user_id)
      .sort((a, b) => (b.issued_at || '').localeCompare(a.issued_at || ''));
  }, [certificates, currentUser]);

  const scopeRecords = useMemo(() => {
    if (isMember && currentUser) {
      return wasteRecords.filter((r) => r.user_id === currentUser.user_id);
    }
    return wasteRecords;
  }, [currentUser, isMember, wasteRecords]);

  const approved = useMemo(
    () => scopeRecords.filter((r) => isApproved(r.verification_status)),
    [scopeRecords],
  );

  const totalBottles = approved.reduce((a, r) => a + (r.bottle_count || 0), 0);
  const totalPoints = isMember && currentUser
    ? currentUser.total_points
    : approved.reduce((a, r) => a + (r.points_awarded || 0), 0);
  const totalFootprint = approved.reduce((a, r) => a + (r.carbon_footprint || 0), 0);
  const totalAvoided = approved.reduce((a, r) => a + (r.carbon_avoided || r.carbon_saved || 0), 0);
  const carbonCredits = totalAvoided / 1000;
  const treesEquiv = (totalAvoided / 20).toFixed(1);

  const titleName =
    isMember && currentUser
      ? currentUser.full_name
      : th
        ? 'ภาพรวมวิทยาเขต'
        : 'Campus overview';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {th ? 'รายงานและเกียรติบัตร' : 'Report & certificates'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {th
              ? 'ดูรายงานคาร์บอนเอง · ดาวน์โหลดเกียรติบัตรเมื่อ Admin ออกให้'
              : 'View your carbon report · download certificates when Admin issues them'}
          </p>
        </div>
        {section === 'report' && (
          <button
            type="button"
            onClick={handlePrint}
            className="eco-btn eco-btn-secondary self-start sm:self-auto min-h-[44px]"
          >
            <Printer className="w-3.5 h-3.5" aria-hidden />
            {th ? 'พิมพ์รายงาน / PDF' : 'Print report / PDF'}
          </button>
        )}
      </div>

      {isMember && (
        <div
          className="print:hidden grid grid-cols-2 gap-1 p-1 rounded-2xl bg-slate-100 border border-slate-200"
          role="tablist"
          aria-label={th ? 'เลือกมุมมอง' : 'Choose view'}
        >
          <button
            type="button"
            role="tab"
            aria-selected={section === 'report'}
            id="tab-report"
            aria-controls="panel-report"
            onClick={() => setSection('report')}
            className={`min-h-[44px] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${
              section === 'report'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileBarChart2 className="w-3.5 h-3.5" aria-hidden />
            {th ? 'รายงานคาร์บอน' : 'Carbon report'}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={section === 'certificate'}
            id="tab-certificate"
            aria-controls="panel-certificate"
            onClick={() => setSection('certificate')}
            className={`min-h-[44px] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${
              section === 'certificate'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Award className="w-3.5 h-3.5" aria-hidden />
            {th ? 'เกียรติบัตร' : 'Certificates'}
            {myCertificates.length > 0 && (
              <span className="ml-0.5 min-w-[1.25rem] h-5 px-1.5 rounded-full bg-emerald-700 text-white text-[10px] leading-5 tabular-nums">
                {myCertificates.length}
              </span>
            )}
          </button>
        </div>
      )}

      {(!isMember || section === 'report') && (
        <div
          ref={printRef}
          id="panel-report"
          role={isMember ? 'tabpanel' : undefined}
          aria-labelledby={isMember ? 'tab-report' : undefined}
          className="space-y-4 report-print-root"
        >
          <section className="eco-panel p-5 sm:p-6 border-2 border-emerald-200 bg-gradient-to-br from-white to-emerald-50/40">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700">
                  {APP_NAME}
                </p>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 mt-1">
                  {th ? 'รายงานการสะสมคาร์บอน' : 'Carbon Accumulation Report'}
                </h2>
                <p className="text-sm font-semibold text-slate-700 mt-2">{titleName}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {th ? 'วันที่ออกรายงาน' : 'Report date'}:{' '}
                  {new Date().toLocaleDateString(th ? 'th-TH' : 'en-GB', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <FileBarChart2 className="w-6 h-6" aria-hidden />
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <section className="eco-panel p-4 sm:p-5" aria-labelledby="report-credit-title">
              <h3 id="report-credit-title" className="eco-panel-title flex items-center gap-2">
                <Leaf className="w-4 h-4 text-teal-600" aria-hidden />
                {th ? 'คาร์บอนเครดิต' : 'Carbon Credit'}
              </h3>
              <p className="mt-3 text-3xl font-black text-teal-700 tabular-nums">
                {carbonCredits.toFixed(4)}
                <span className="text-sm font-bold text-teal-600/80 ml-1.5">tCO₂e</span>
              </p>
              <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                {th
                  ? `คำนวณจากคาร์บอนที่ลดได้ ${totalAvoided.toFixed(3)} kgCO₂e (1 ตัน = 1 เครดิต)`
                  : `From ${totalAvoided.toFixed(3)} kgCO₂e avoided (1 tonne = 1 credit)`}
              </p>
              <p className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-full">
                <TreePine className="w-3 h-3" aria-hidden />
                ≈ {treesEquiv} {th ? 'ต้นไม้เทียบเท่า' : 'trees equiv.'}
              </p>
            </section>

            <section className="eco-panel p-4 sm:p-5" aria-labelledby="report-cf-title">
              <h3 id="report-cf-title" className="eco-panel-title flex items-center gap-2">
                <Factory className="w-4 h-4 text-slate-600" aria-hidden />
                {th ? 'คาร์บอนฟุตพริ้นท์' : 'Carbon Footprint'}
              </h3>
              <p className="mt-3 text-3xl font-black text-slate-800 tabular-nums">
                {totalFootprint.toFixed(3)}
                <span className="text-sm font-bold text-slate-500 ml-1.5">kgCO₂e</span>
              </p>
              <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                {th
                  ? 'ปริมาณ CF ที่บันทึกจากการคัดแยกขวดน้ำพลาสติกที่ผ่านเกณฑ์'
                  : 'Recorded CF from verified plastic water bottle sorting'}
              </p>
              <p className="mt-2 text-[11px] font-semibold text-teal-800">
                {th ? 'ลดได้ (avoided)' : 'Avoided'}: {totalAvoided.toFixed(3)} kgCO₂e
              </p>
            </section>
          </div>

          <section className="eco-panel p-4 sm:p-5">
            <h3 className="eco-panel-title flex items-center gap-2">
              <Recycle className="w-4 h-4 text-emerald-600" aria-hidden />
              {th ? 'สรุปการคัดแยก' : 'Sorting summary'}
            </h3>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Stat label={th ? 'รายการผ่าน' : 'Verified'} value={String(approved.length)} />
              <Stat label={th ? 'ขวดน้ำพลาสติก' : 'Bottles'} value={String(totalBottles)} />
              <Stat
                label={th ? 'แต้มสะสม' : 'Points'}
                value={String(totalPoints)}
                icon={<Coins className="w-3.5 h-3.5 text-amber-500" aria-hidden />}
              />
              <Stat
                label={th ? 'เครดิต (tCO₂e)' : 'Credits'}
                value={carbonCredits.toFixed(4)}
              />
            </div>
          </section>

          <section className="eco-panel p-4 sm:p-5">
            <h3 className="eco-panel-title">
              {th ? 'รายการล่าสุด (ผ่านเกณฑ์)' : 'Recent verified items'}
            </h3>
            {approved.length === 0 ? (
              <p className="text-xs text-slate-500 mt-3">
                {th ? 'ยังไม่มีรายการที่ผ่านเกณฑ์' : 'No verified records yet'}
              </p>
            ) : (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-100">
                      <th className="py-2 pr-2 font-semibold">{th ? 'วันที่' : 'Date'}</th>
                      <th className="py-2 pr-2 font-semibold">{th ? 'ประเภท' : 'Type'}</th>
                      <th className="py-2 pr-2 font-semibold text-right">{th ? 'ขวด' : 'Qty'}</th>
                      <th className="py-2 pr-2 font-semibold text-right">CF</th>
                      <th className="py-2 font-semibold text-right">{th ? 'ลดได้' : 'Avoided'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {[...approved]
                      .sort((a, b) => (b.upload_timestamp || '').localeCompare(a.upload_timestamp || ''))
                      .slice(0, 12)
                      .map((r) => (
                        <tr key={r.record_id}>
                          <td className="py-2 pr-2 text-slate-600 whitespace-nowrap">
                            {(r.upload_timestamp || '').slice(0, 10)}
                          </td>
                          <td className="py-2 pr-2 text-slate-800 font-medium">{r.plastic_type}</td>
                          <td className="py-2 pr-2 text-right tabular-nums">{r.bottle_count}</td>
                          <td className="py-2 pr-2 text-right tabular-nums text-slate-700">
                            {(r.carbon_footprint || 0).toFixed(3)}
                          </td>
                          <td className="py-2 text-right tabular-nums text-teal-700 font-semibold">
                            {(r.carbon_avoided || r.carbon_saved || 0).toFixed(3)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {isMember && myCertificates.length > 0 && (
            <p className="print:hidden text-center text-[11px] text-slate-500">
              {th ? 'มีเกียรติบัตรรอดาวน์โหลด — สลับแท็บ ' : 'Certificates ready — switch to '}
              <button
                type="button"
                onClick={() => setSection('certificate')}
                className="font-bold text-emerald-700 underline underline-offset-2 min-h-[44px] inline-flex items-center"
              >
                {th ? 'เกียรติบัตร' : 'Certificates'}
              </button>
            </p>
          )}
        </div>
      )}

      {isMember && section === 'certificate' && (
        <div
          id="panel-certificate"
          role="tabpanel"
          aria-labelledby="tab-certificate"
          className="space-y-4 print:hidden"
        >
          <section className="eco-panel p-5 border border-amber-200 bg-gradient-to-b from-amber-50/40 to-white">
            <h2 className="eco-panel-title flex items-center gap-2 text-base">
              <Award className="w-4 h-4 text-amber-600" aria-hidden />
              {th ? 'เกียรติบัตรของฉัน' : 'My certificates'}
            </h2>
            <ol className="mt-3 space-y-2 text-xs text-slate-600 leading-relaxed list-decimal list-inside">
              <li>
                {th
                  ? 'Admin เปิดแผงควบคุม → ผู้ใช้ → แก้ไขสมาชิก → กด「ออกเกียรติบัตรให้สมาชิก」'
                  : 'Admin opens Admin → Users → edit member → Issue certificate'}
              </li>
              <li>
                {th
                  ? 'สมาชิกเปิดเมนูรายงาน → แท็บเกียรติบัตร → ดาวน์โหลดหรือพิมพ์ PDF'
                  : 'Member opens Report → Certificates tab → Download or Print PDF'}
              </li>
            </ol>

            {myCertificates.length === 0 ? (
              <div className="mt-4 rounded-2xl border-2 border-dashed border-slate-200 bg-white p-6 text-center">
                <Award className="w-8 h-8 text-slate-300 mx-auto" aria-hidden />
                <p className="text-sm font-semibold text-slate-700 mt-2">
                  {th ? 'ยังไม่มีเกียรติบัตร' : 'No certificates yet'}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  {th
                    ? `ผลสะสมปัจจุบัน: เครดิต ${carbonCredits.toFixed(4)} tCO₂e · ${totalPoints} แต้ม — รอ Admin ออกใบเซอร์`
                    : `Current: ${carbonCredits.toFixed(4)} tCO₂e · ${totalPoints} pts — waiting for Admin`}
                </p>
              </div>
            ) : (
              <ul className="mt-4 space-y-3">
                {myCertificates.map((cert) => (
                  <li
                    key={cert.certificate_id}
                    className="rounded-2xl border border-emerald-200 bg-white p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between"
                  >
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                        {APP_NAME}
                      </p>
                      <p className="text-sm font-black text-slate-900 mt-0.5">
                        {th ? 'เกียรติบัตรการคัดแยกเพื่อลดคาร์บอน' : 'Carbon Reduction Certificate'}
                      </p>
                      <p className="text-[11px] text-slate-600 mt-1">
                        {cert.issued_at} · {cert.credits_tco2e.toFixed(4)} tCO₂e · {cert.points}{' '}
                        {th ? 'แต้ม' : 'pts'}
                      </p>
                      {cert.admin_message?.trim() && (
                        <p className="text-[11px] text-slate-500 mt-1">{cert.admin_message}</p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => downloadCertificate(cert)}
                        className="eco-btn eco-btn-secondary min-h-[44px]"
                      >
                        <Download className="w-3.5 h-3.5" aria-hidden />
                        {th ? 'ดาวน์โหลด' : 'Download'}
                      </button>
                      <button
                        type="button"
                        onClick={() => printCertificate(cert)}
                        className="eco-btn eco-btn-primary min-h-[44px]"
                      >
                        <Printer className="w-3.5 h-3.5" aria-hidden />
                        {th ? 'พิมพ์ / PDF' : 'Print / PDF'}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      <style>{`
        @media print {
          .eco-shell header,
          .eco-shell footer,
          .print\\:hidden { display: none !important; }
          .eco-shell main { padding: 0 !important; max-width: none !important; }
          .report-print-root .eco-panel { break-inside: avoid; box-shadow: none !important; }
        }
      `}</style>
    </div>
  );
};

function Stat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5 min-h-[64px]">
      <p className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
        {icon}
        {label}
      </p>
      <p className="text-lg font-black text-slate-900 tabular-nums mt-0.5">{value}</p>
    </div>
  );
}
