'use client';

import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Leaf,
  Coins,
  TreePine,
  X,
  History,
  ArrowRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { SCAN_DROP_SITES, matchDropSiteId } from '../lib/scanCheckpoint';

interface MemberDashboardProps {
  setActiveTab: (tab: string) => void;
}

type CarbonTrendPeriod = 'day' | 'week' | 'month' | 'year';

/** Plastic drinking-water bottles (PET) — Status panel counts only these */
function isPlasticWaterBottle(plasticType: string) {
  const raw = plasticType || '';
  const u = raw.toUpperCase();
  const l = raw.toLowerCase();
  if (u.includes('HDPE') || l.includes('กระป๋อง') || l.includes('can')) return false;
  return u.includes('PET') || l.includes('ขวดน้ำ') || (u.includes('1') && !u.includes('HDPE'));
}

function parseRecordDate(ts: string | undefined): Date | null {
  if (!ts?.trim()) return null;
  const d = new Date(ts.includes('T') ? ts : ts.replace(' ', 'T'));
  return Number.isNaN(d.getTime()) ? null : d;
}

function recordCo2Kg(r: { carbon_avoided?: number; carbon_footprint?: number }) {
  return r.carbon_avoided || r.carbon_footprint || 0;
}

function startOfWeekMonday(d: Date) {
  const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  return copy;
}

function formatDayLabel(d: Date, th: boolean) {
  if (th) return `${d.getDate()}/${d.getMonth() + 1}`;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function formatWeekLabel(weekStart: Date, th: boolean) {
  if (th) return `${weekStart.getDate()}/${weekStart.getMonth() + 1}`;
  return weekStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function formatMonthLabel(d: Date, th: boolean) {
  if (th) return `${d.getMonth() + 1}/${String(d.getFullYear()).slice(-2)}`;
  return d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
}

export const MemberDashboard: React.FC<MemberDashboardProps> = ({ setActiveTab }) => {
  const { currentUser, wasteRecords, language, settings } = useApp();
  const [showHistoryPopup, setShowHistoryPopup] = useState(false);
  const [carbonPeriod, setCarbonPeriod] = useState<CarbonTrendPeriod>('month');
  const th = language === 'th';

  // Member = personal; Guest = campus-wide overview
  const scopeRecords = useMemo(() => {
    if (currentUser) return wasteRecords.filter((r) => r.user_id === currentUser.user_id);
    return wasteRecords;
  }, [currentUser, wasteRecords]);

  const approvedRecords = scopeRecords.filter((r) => r.verification_status === 'อนุมัติแล้ว');

  const totalPoints = currentUser ? currentUser.total_points : approvedRecords.reduce((a, r) => a + (r.points_awarded || 0), 0);
  const totalCarbon = approvedRecords.reduce((acc, r) => acc + (r.carbon_footprint || 0), 0);
  const totalAvoided = approvedRecords.reduce((acc, r) => acc + (r.carbon_avoided || 0), 0);
  const TREE_KG = 20;
  const treesEquiv = (totalAvoided / TREE_KG).toFixed(1);
  /** Simple carbon-credit proxy: 1 tCO₂e avoided ≈ 1 credit; show kg as credits × 0.001 */
  const carbonCredits = totalAvoided / 1000;

  const plasticWaterBottles = useMemo(
    () =>
      approvedRecords
        .filter((r) => isPlasticWaterBottle(r.plastic_type))
        .reduce((acc, r) => acc + (r.bottle_count || 0), 0),
    [approvedRecords]
  );

  const dropSiteStats = useMemo(() => {
    const base: Record<string, number> = Object.fromEntries(SCAN_DROP_SITES.map((s) => [s.id, 0]));
    for (const r of approvedRecords) {
      if (!isPlasticWaterBottle(r.plastic_type)) continue;
      const id = matchDropSiteId(r.bin_location);
      if (!id) continue;
      base[id] += r.bottle_count || 0;
    }
    return SCAN_DROP_SITES.map((site) => ({
      ...site,
      bottles: base[site.id],
    }));
  }, [approvedRecords]);

  const dropMappedTotal = dropSiteStats.reduce((a, s) => a + s.bottles, 0);

  const statusPieData = useMemo(
    () =>
      dropSiteStats.map((site) => ({
        id: site.id,
        name: th ? site.labelTh : site.labelEn,
        value: site.bottles,
        color: site.color,
      })),
    [dropSiteStats, th]
  );

  const carbonTrend = useMemo(() => {
    const anchor = new Date();

    if (carbonPeriod === 'day') {
      const buckets: { key: string; label: string; co2: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(anchor);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        buckets.push({ key, label: formatDayLabel(d, th), co2: 0 });
      }
      for (const r of approvedRecords) {
        const d = parseRecordDate(r.upload_timestamp);
        if (!d) continue;
        const key = d.toISOString().slice(0, 10);
        const b = buckets.find((x) => x.key === key);
        if (b) b.co2 += recordCo2Kg(r);
      }
      return buckets.map((b) => ({ label: b.label, co2: Number(b.co2.toFixed(3)) }));
    }

    if (carbonPeriod === 'week') {
      const buckets: { key: string; label: string; co2: number }[] = [];
      const thisWeek = startOfWeekMonday(anchor);
      for (let i = 7; i >= 0; i--) {
        const ws = new Date(thisWeek);
        ws.setDate(ws.getDate() - i * 7);
        const key = ws.toISOString().slice(0, 10);
        buckets.push({ key, label: formatWeekLabel(ws, th), co2: 0 });
      }
      for (const r of approvedRecords) {
        const d = parseRecordDate(r.upload_timestamp);
        if (!d) continue;
        const key = startOfWeekMonday(d).toISOString().slice(0, 10);
        const b = buckets.find((x) => x.key === key);
        if (b) b.co2 += recordCo2Kg(r);
      }
      return buckets.map((b) => ({ label: b.label, co2: Number(b.co2.toFixed(3)) }));
    }

    if (carbonPeriod === 'month') {
      const buckets: { key: string; label: string; co2: number }[] = [];
      for (let i = 11; i >= 0; i--) {
        const d = new Date(anchor.getFullYear(), anchor.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        buckets.push({ key, label: formatMonthLabel(d, th), co2: 0 });
      }
      for (const r of approvedRecords) {
        const d = parseRecordDate(r.upload_timestamp);
        if (!d) continue;
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const b = buckets.find((x) => x.key === key);
        if (b) b.co2 += recordCo2Kg(r);
      }
      return buckets.map((b) => ({ label: b.label, co2: Number(b.co2.toFixed(3)) }));
    }

    const years = [2023, 2024, 2025, 2026];
    const byYear: Record<number, number> = {};
    for (const y of years) byYear[y] = 0;
    for (const r of approvedRecords) {
      const d = parseRecordDate(r.upload_timestamp);
      const y = d ? d.getFullYear() : Number((r.upload_timestamp || '').slice(0, 4));
      if (byYear[y] !== undefined) byYear[y] += recordCo2Kg(r);
    }
    return years.map((y) => ({
      label: String(y),
      co2: Number(byYear[y].toFixed(3)),
    }));
  }, [approvedRecords, carbonPeriod, th]);

  const carbonPeriodLabels: { id: CarbonTrendPeriod; th: string; en: string }[] = [
    { id: 'day', th: 'รายวัน', en: 'Daily' },
    { id: 'week', th: 'สัปดาห์', en: 'Weekly' },
    { id: 'month', th: 'เดือน', en: 'Monthly' },
    { id: 'year', th: 'ปี', en: 'Yearly' },
  ];

  const Pill = ({
    label,
    value,
    tone,
  }: {
    label: string;
    value: string | number;
    tone: 'sky' | 'amber' | 'slate' | 'emerald';
  }) => {
    const tones = {
      sky: 'bg-sky-500 text-white',
      amber: 'bg-amber-400 text-amber-950',
      slate: 'bg-slate-800 text-white',
      emerald: 'bg-emerald-500 text-white',
    };
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-slate-300/90 bg-slate-50/90 px-3 py-2.5 min-h-[44px]">
        <span className="text-[11px] font-semibold text-slate-600 leading-snug">{label}</span>
        <span className={`text-xs font-black px-3 py-1 rounded-full shrink-0 ${tones[tone]}`}>{value}</span>
      </div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {settings.announcement?.trim() && (
        <div role="status" className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-950">
          <span className="font-bold">{th ? 'ประกาศจากผู้ดูแล: ' : 'Announcement: '}</span>
          {settings.announcement}
        </div>
      )}

      {/* Compact top bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[var(--color-foreground)] tracking-tight">
            {currentUser ? currentUser.full_name : 'Dashboard'}
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setShowHistoryPopup(true)}
          className="eco-btn eco-btn-secondary self-start sm:self-auto"
        >
          <History className="w-3.5 h-3.5 text-emerald-600" aria-hidden />
          {th ? 'ประวัติล่าสุด' : 'Recent history'}
        </button>
      </div>

      {/* 2×2 industrial-style panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        {/* A — Status: plastic water bottles only */}
        <section className="eco-panel p-4 sm:p-5" aria-labelledby="dash-status-title">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <h2 id="dash-status-title" className="eco-panel-title mb-0">
                Status
              </h2>
              <p className="text-[11px] text-[var(--color-muted-foreground)] mt-1">
                {th
                  ? `นับเฉพาะขวดน้ำพลาสติกที่ทิ้ง · รวม ${plasticWaterBottles} ขวด`
                  : `Plastic water bottles disposed · ${plasticWaterBottles} total`}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-stretch mb-4">
            {plasticWaterBottles === 0 ? (
              <div className="eco-empty-chart w-full sm:w-auto sm:min-w-[10rem] h-40 flex items-center justify-center text-center px-3">
                {th ? 'ยังไม่มีข้อมูลการทิ้งขวดน้ำพลาสติก' : 'No plastic water bottle data yet'}
              </div>
            ) : (
              <div
                className="relative w-40 h-40 shrink-0"
                role="img"
                aria-label={
                  th
                    ? `ขวดน้ำพลาสติกที่ทิ้ง ${plasticWaterBottles} ขวด ตามจุดทิ้ง`
                    : `${plasticWaterBottles} plastic water bottles by drop point`
                }
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dropMappedTotal > 0 ? statusPieData : [{ id: 'all', name: th ? 'ขวดน้ำพลาสติก' : 'PET', value: plasticWaterBottles, color: '#0ea5e9' }]}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={46}
                      outerRadius={70}
                      paddingAngle={2}
                      stroke="none"
                    >
                      {(dropMappedTotal > 0
                        ? statusPieData
                        : [{ id: 'all', name: '', value: plasticWaterBottles, color: '#0ea5e9' }]
                      ).map((d) => (
                        <Cell key={d.id} fill={d.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [
                        `${value} ${th ? 'ขวด' : 'bottles'}`,
                        String(name),
                      ]}
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderRadius: 10,
                        border: 'none',
                        color: '#fff',
                        fontSize: 11,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-black text-slate-900">{plasticWaterBottles}</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">
                    {th ? 'ขวดน้ำ' : 'bottles'}
                  </span>
                </div>
              </div>
            )}

            <ul className="flex-1 w-full space-y-2 self-center">
              {statusPieData.map((d) => {
                const pct =
                  dropMappedTotal === 0 ? 0 : Math.round((d.value / dropMappedTotal) * 100);
                return (
                  <li
                    key={d.id}
                    className="flex items-center justify-between gap-3 text-[11px] font-semibold text-slate-600"
                  >
                    <span className="inline-flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: d.color }}
                        aria-hidden
                      />
                      <span className="truncate">{d.name}</span>
                    </span>
                    <span className="shrink-0 tabular-nums text-slate-800 font-black">
                      {d.value} {th ? 'ขวด' : 'btl'} · {pct}%
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          <p className="text-[10px] font-semibold text-slate-500 mb-2">
            {th ? 'ปริมาณขวดน้ำพลาสติกตามจุดทิ้ง' : 'Plastic water bottles by drop point'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {dropSiteStats.map((site) => {
              const pct =
                dropMappedTotal === 0 ? 0 : Math.round((site.bottles / dropMappedTotal) * 100);
              const miniPie =
                dropMappedTotal === 0
                  ? [
                      { id: 'empty', value: 1, color: '#e2e8f0' },
                      { id: 'site', value: 0, color: site.color },
                    ]
                  : [
                      { id: 'rest', value: Math.max(dropMappedTotal - site.bottles, 0.0001), color: '#e2e8f0' },
                      { id: 'site', value: Math.max(site.bottles, 0.0001), color: site.color },
                    ];
              return (
                <div
                  key={site.id}
                  className={`rounded-2xl border bg-gradient-to-b p-4 flex items-center gap-3 ${site.soft}`}
                >
                  <div
                    className="relative w-14 h-14 shrink-0"
                    role="img"
                    aria-label={`${th ? site.labelTh : site.labelEn}: ${site.bottles} ${th ? 'ขวด' : 'bottles'}`}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={miniPie}
                          dataKey="value"
                          innerRadius={16}
                          outerRadius={26}
                          paddingAngle={0}
                          stroke="none"
                          startAngle={90}
                          endAngle={-270}
                        >
                          {miniPie.map((d) => (
                            <Cell key={d.id} fill={d.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="text-[11px] font-black text-slate-900 tabular-nums">
                        {site.bottles}
                      </span>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-black text-slate-900 leading-snug">
                      {th ? site.labelTh : site.labelEn}
                    </p>
                    <p className="text-[10px] font-semibold text-slate-500 mt-0.5">
                      {th ? 'จุดทิ้งขวด' : 'Drop point'}
                    </p>
                    <p className="text-xs font-black text-slate-800 mt-1 tabular-nums">
                      {site.bottles} {th ? 'ขวด' : 'bottles'}
                      <span className="text-slate-400 font-semibold"> · {pct}%</span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* B — Carbon credit */}
        <section className="eco-panel p-4 sm:p-5" aria-labelledby="dash-credit-title">
          <h2 id="dash-credit-title" className="eco-panel-title">
            {th ? 'คาร์บอนเครดิต' : 'Carbon Credit'}
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 items-stretch">
            <div className="flex-1 flex flex-col items-center justify-center rounded-2xl bg-gradient-to-b from-teal-50 to-emerald-50/70 border border-teal-100 p-4 min-h-[140px]">
              <div className="w-16 h-16 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center mb-2">
                <Leaf className="w-8 h-8" />
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                {th ? 'เครดิตสะสม' : 'Credits earned'}
              </span>
              <span className="mt-1 text-3xl font-black text-white bg-teal-600 px-5 py-1 rounded-full shadow-sm">
                {carbonCredits.toFixed(3)}
              </span>
              <span className="mt-1.5 text-[10px] font-semibold text-teal-800/80">tCO₂e</span>
            </div>
            <div className="flex-1 flex flex-col gap-2 justify-center">
              <Pill
                label={th ? 'คาร์บอนที่ลดได้' : 'CO₂e avoided'}
                value={`${totalAvoided.toFixed(2)} kg`}
                tone="emerald"
              />
              <Pill
                label={th ? 'CF ที่บันทึก' : 'CF recorded'}
                value={`${totalCarbon.toFixed(2)} kg`}
                tone="sky"
              />
              <Pill
                label={th ? 'เทียบเท่าต้นไม้' : 'Tree equiv.'}
                value={`≈ ${treesEquiv}`}
                tone="slate"
              />
            </div>
          </div>
        </section>

        {/* C — Carbon trend with period selector */}
        <section className="eco-panel p-4 sm:p-5 lg:col-span-2" aria-labelledby="dash-cfo-title">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-1">
            <div>
              <h2 id="dash-cfo-title" className="eco-panel-title mb-0">
                {th ? 'แนวโน้มคาร์บอนที่ลดได้' : 'Carbon reduction trend'}
              </h2>
              <p className="text-[11px] text-[var(--color-muted-foreground)] mt-1">
                {th
                  ? `รวม ${totalAvoided.toFixed(2)} kgCO₂e · เทียบเท่า ~${treesEquiv} ต้น`
                  : `Total ${totalAvoided.toFixed(2)} kgCO₂e · ~${treesEquiv} trees equiv.`}
              </p>
            </div>
            <div
              className="flex flex-wrap gap-1.5 p-1 rounded-xl bg-slate-100/80 border border-slate-200/80"
              role="tablist"
              aria-label={th ? 'ช่วงเวลาแสดงกราฟ' : 'Chart time range'}
            >
              {carbonPeriodLabels.map((p) => {
                const active = carbonPeriod === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setCarbonPeriod(p.id)}
                    className={`min-h-[36px] px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
                      active
                        ? 'bg-white text-emerald-800 shadow-sm border border-emerald-100'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    {th ? p.th : p.en}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="h-44 w-full">
            {carbonTrend.every((d) => d.co2 === 0) ? (
              <div className="eco-empty-chart h-full">
                {th ? 'ยังไม่มีข้อมูลในช่วงนี้ — จะแสดงหลังมีรายการคัดแยก' : 'No data in this range yet'}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={carbonTrend} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: 'rgba(148, 163, 184, 0.12)' }}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: 10,
                      border: 'none',
                      color: '#fff',
                      fontSize: 11,
                    }}
                    formatter={(v) => [`${v} kgCO₂e`, th ? 'ลดได้' : 'Avoided']}
                  />
                  <Bar dataKey="co2" fill="#16a34a" radius={[6, 6, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-800 bg-teal-50 border border-teal-100 px-2 py-1 rounded-full">
              <Leaf className="w-3 h-3" /> CFO {totalCarbon.toFixed(2)} kg
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-full">
              <TreePine className="w-3 h-3" /> ≈ {treesEquiv} {th ? 'ต้น' : 'trees'}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-100 px-2 py-1 rounded-full">
              <Coins className="w-3 h-3" /> {totalPoints} {th ? 'แต้ม' : 'pts'}
            </span>
          </div>
        </section>
      </div>

      {/* History popup */}
      {showHistoryPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-xl overflow-hidden">
            <div className="p-5">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-slate-800">
                  <History className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-base font-bold">{th ? 'ประวัติล่าสุด' : 'Recent History'}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowHistoryPopup(false)}
                  className="text-slate-400 hover:text-slate-600 bg-slate-100 p-1.5 rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                {scopeRecords.length === 0 ? (
                  <p className="text-center text-sm text-slate-400 py-8">{th ? 'ยังไม่มีรายการ' : 'No records yet'}</p>
                ) : (
                  scopeRecords.slice(0, 8).map((record) => (
                    <div key={record.record_id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100">
                      <img src={record.image_url} alt="" className="w-12 h-12 rounded-xl object-cover border border-slate-200" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-900 truncate">
                          {record.plastic_type.split(' ')[0]} · {record.bottle_count} {th ? 'ขวด' : 'pcs'}
                        </p>
                        <p className="text-[11px] text-slate-500">{record.upload_timestamp}</p>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700">
                        {record.verification_status === 'อนุมัติแล้ว' ? `+${record.points_awarded}` : '—'}
                      </span>
                    </div>
                  ))
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowHistoryPopup(false);
                  setActiveTab('history');
                }}
                className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-50 text-emerald-700 font-bold text-sm rounded-xl"
              >
                {th ? 'ดูประวัติทั้งหมด' : 'View full history'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
