'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { api, mediaUrl } from '../lib/api';
import {
  Activity,
  RefreshCw,
  Search,
  Link2,
  Coins,
  ScanLine,
  Upload,
  Database,
  Shield,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Layers,
} from 'lucide-react';

type SystemEvent = {
  event_id: string;
  event_type: string;
  event_source: string;
  actor_user_id?: string;
  correlation_id?: string;
  entity_type?: string;
  entity_id?: string;
  message?: string;
  payload?: Record<string, unknown> | null;
  created_at: string;
};

type TrainingSample = {
  sample_id: string;
  label: string;
  image_url: string;
  source: string;
  confidence: number;
  record_id?: string;
  created_at: string;
};

/** แยกตามงานแอดมิน — โมเดล AI ตรวจรูปแล้ว ไม่มีคิวอนุมัติมือ */
const GROUPS = [
  {
    id: 'scan' as const,
    label: 'สแกน & แต้ม',
    hint: 'จำแนก → ส่งขวด → ให้แต้ม / Guest',
    types: ['MODEL_CLASSIFY', 'WASTE_SUBMITTED', 'POINTS_AWARDED', 'GUEST_SCAN'],
  },
  {
    id: 'model' as const,
    label: 'โมเดล & เทรน',
    hint: 'เก็บตัวอย่าง / ลงทะเบียนโมเดล',
    types: ['TRAINING_SAMPLE_SAVED', 'MODEL_VERSION_REGISTERED'],
  },
  {
    id: 'all' as const,
    label: 'ทั้งหมด',
    hint: 'ทุกประเภท',
    types: [] as string[],
  },
];

const EVENT_META: Record<
  string,
  { label: string; color: string; icon: React.ComponentType<{ className?: string }> }
> = {
  MODEL_CLASSIFY: { label: 'จำแนกรูป', color: 'bg-sky-50 text-sky-800 border-sky-200', icon: ScanLine },
  WASTE_SUBMITTED: { label: 'ส่งขวด', color: 'bg-emerald-50 text-emerald-800 border-emerald-200', icon: Upload },
  POINTS_AWARDED: { label: 'ให้แต้ม', color: 'bg-amber-50 text-amber-900 border-amber-200', icon: Coins },
  GUEST_SCAN: { label: 'Guest สแกน', color: 'bg-slate-50 text-slate-700 border-slate-200', icon: ScanLine },
  TRAINING_SAMPLE_SAVED: { label: 'เก็บตัวอย่างเทรน', color: 'bg-violet-50 text-violet-800 border-violet-200', icon: Database },
  MODEL_VERSION_REGISTERED: { label: 'ลงทะเบียนโมเดล', color: 'bg-indigo-50 text-indigo-800 border-indigo-200', icon: Shield },
  WASTE_VERIFIED: { label: 'ตรวจรูป (ระบบเก่า)', color: 'bg-slate-100 text-slate-700 border-slate-200', icon: Shield },
};

function payloadObj(p: SystemEvent['payload']): Record<string, unknown> {
  if (!p) return {};
  if (typeof p === 'object') return p as Record<string, unknown>;
  return {};
}

export const AdminActivityLog: React.FC = () => {
  const [events, setEvents] = useState<SystemEvent[]>([]);
  const [samples, setSamples] = useState<TrainingSample[]>([]);
  const [loading, setLoading] = useState(false);
  const [group, setGroup] = useState<(typeof GROUPS)[number]['id']>('scan');
  const [typeWithin, setTypeWithin] = useState('');
  const [corrFilter, setCorrFilter] = useState('');
  const [query, setQuery] = useState('');
  const [sampleLabel, setSampleLabel] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [view, setView] = useState<'timeline' | 'samples'>('timeline');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ limit: '200' });
      if (corrFilter.trim()) params.set('correlation_id', corrFilter.trim());
      const sampleParams = new URLSearchParams({ limit: '80' });
      if (sampleLabel) sampleParams.set('label', sampleLabel);
      const [ev, sm] = await Promise.all([
        api<SystemEvent[]>(`/api/admin/events?${params}`),
        api<{ samples: TrainingSample[] }>(`/api/admin/training-samples?${sampleParams}`),
      ]);
      setEvents(Array.isArray(ev) ? ev : []);
      setSamples(sm?.samples || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'โหลดไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }, [corrFilter, sampleLabel]);

  useEffect(() => {
    void load();
  }, [load]);

  const activeGroup = GROUPS.find((g) => g.id === group) || GROUPS[0];

  const groupCounts = useMemo(() => {
    const out: Record<string, number> = { all: events.length, scan: 0, model: 0 };
    for (const e of events) {
      if (GROUPS[0].types.includes(e.event_type)) out.scan += 1;
      if (GROUPS[1].types.includes(e.event_type)) out.model += 1;
    }
    return out;
  }, [events]);

  const typeChips = useMemo(() => {
    if (group === 'all') {
      return Object.keys(EVENT_META).map((id) => ({ id, label: EVENT_META[id].label }));
    }
    return activeGroup.types.map((id) => ({ id, label: EVENT_META[id]?.label || id }));
  }, [group, activeGroup]);

  const filtered = useMemo(() => {
    let list = events;
    if (group !== 'all') {
      list = list.filter((e) => activeGroup.types.includes(e.event_type));
    }
    if (typeWithin) {
      list = list.filter((e) => e.event_type === typeWithin);
    }
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((e) =>
        [e.event_type, e.message, e.actor_user_id, e.correlation_id, e.entity_id, e.event_id]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q)),
      );
    }
    return list;
  }, [events, group, activeGroup, typeWithin, query]);

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-700" />
              Activity Log
            </h3>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed max-w-xl">
              แยกตามงาน: สแกน/แต้ม · โมเดล · แอดมิน — กด correlation เพื่อตามรอยครั้งเดียว
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-xl border border-slate-200 overflow-hidden text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setView('timeline')}
                className={`px-3 py-1.5 ${view === 'timeline' ? 'bg-purple-700 text-white' : 'bg-white text-slate-600'}`}
              >
                Timeline
              </button>
              <button
                type="button"
                onClick={() => setView('samples')}
                className={`px-3 py-1.5 ${view === 'samples' ? 'bg-purple-700 text-white' : 'bg-white text-slate-600'}`}
              >
                ตัวอย่างเทรน ({samples.length})
              </button>
            </div>
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-[11px] font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              รีเฟรช
            </button>
          </div>
        </div>

        {view === 'timeline' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {GROUPS.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => {
                  setGroup(g.id);
                  setTypeWithin('');
                }}
                className={`text-left rounded-xl border px-3 py-2.5 transition-colors ${
                  group === g.id
                    ? 'border-purple-400 bg-purple-50'
                    : 'border-slate-100 bg-slate-50/80 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-bold text-slate-800">{g.label}</p>
                  <span className="text-sm font-bold text-slate-900">{groupCounts[g.id] ?? 0}</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">{g.hint}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
          {error}
        </div>
      )}

      {view === 'timeline' && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="p-3 border-b border-slate-100 space-y-2">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
              <Layers className="w-3 h-3" />
              ย่อยในกลุ่ม «{activeGroup.label}»
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setTypeWithin('')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                  !typeWithin
                    ? 'bg-purple-700 text-white border-purple-700'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                ในกลุ่มนี้ทั้งหมด
              </button>
              {typeChips.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setTypeWithin(f.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                    typeWithin === f.id
                      ? 'bg-purple-700 text-white border-purple-700'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="ค้นหาข้อความ / ผู้ใช้ / entity"
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>
              <div className="relative">
                <Link2 className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  value={corrFilter}
                  onChange={(e) => setCorrFilter(e.target.value)}
                  placeholder="correlation id — ตามรอยครั้งเดียว (Enter)"
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-purple-400"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void load();
                  }}
                />
              </div>
            </div>
          </div>

          {loading && filtered.length === 0 ? (
            <p className="p-6 text-center text-xs text-slate-400">กำลังโหลด…</p>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center space-y-1">
              <p className="text-sm font-bold text-slate-700">ยังไม่มี activity ในกลุ่มนี้</p>
              <p className="text-[11px] text-slate-500">ลองกลุ่มอื่น หรือให้สมาชิกสแกนขวดก่อน</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50 max-h-[560px] overflow-y-auto">
              {filtered.map((e) => {
                const meta = EVENT_META[e.event_type] || {
                  label: e.event_type,
                  color: 'bg-slate-50 text-slate-700 border-slate-200',
                  icon: Activity,
                };
                const Icon = meta.icon;
                const open = expandedId === e.event_id;
                const payload = payloadObj(e.payload);
                return (
                  <div key={e.event_id} className="px-3 py-2.5 hover:bg-slate-50/80">
                    <button
                      type="button"
                      className="w-full text-left flex gap-3 items-start"
                      onClick={() => setExpandedId(open ? null : e.event_id)}
                    >
                      <div className={`mt-0.5 p-1.5 rounded-lg border ${meta.color}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${meta.color}`}>
                            {meta.label}
                          </span>
                          <span className="text-[10px] text-slate-400">{e.created_at}</span>
                          <span className="text-[10px] text-slate-400">· {e.event_source}</span>
                        </div>
                        <p className="text-xs font-semibold text-slate-800 mt-0.5 truncate">
                          {e.message || e.event_type}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                          {e.actor_user_id ? `โดย ${e.actor_user_id}` : 'ระบบ / Guest'}
                          {e.entity_type ? ` · ${e.entity_type}:${e.entity_id}` : ''}
                          {typeof payload.points === 'number' ? ` · +${payload.points} แต้ม` : ''}
                          {typeof payload.confidence === 'number' ? ` · ${payload.confidence}%` : ''}
                        </p>
                      </div>
                      {open ? (
                        <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                    </button>

                    {open && (
                      <div className="mt-2 ml-10 space-y-2">
                        {e.correlation_id && (
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 hover:underline"
                            onClick={() => {
                              setCorrFilter(e.correlation_id || '');
                              setGroup('all');
                              setTypeWithin('');
                            }}
                          >
                            <Link2 className="w-3 h-3" />
                            ดูทั้งชุด correlation: {e.correlation_id}
                          </button>
                        )}
                        <pre className="text-[10px] bg-slate-900 text-slate-100 rounded-xl p-3 overflow-x-auto max-h-48">
                          {JSON.stringify(
                            {
                              event_id: e.event_id,
                              type: e.event_type,
                              actor: e.actor_user_id,
                              entity: e.entity_type ? `${e.entity_type}/${e.entity_id}` : null,
                              payload,
                            },
                            null,
                            2,
                          )}
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {view === 'samples' && (
        <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
          <div>
            <h4 className="text-xs font-bold text-slate-900">ตัวอย่างรูปสำหรับเทรน / กู้โมเดล</h4>
            <p className="text-[11px] text-slate-500 mt-1">
              แยกจาก Timeline — ใช้ส่งเข้า Teachable Machine เมื่อโมเดลหาย
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: '', label: 'ทุก label' },
              { id: 'PLASTIC_BOTTLE', label: 'ขวด' },
              { id: 'CAN', label: 'กระป๋อง' },
              { id: 'INVALID', label: 'ไม่ผ่าน' },
            ].map((f) => (
              <button
                key={f.id || 'all'}
                type="button"
                onClick={() => setSampleLabel(f.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                  sampleLabel === f.id
                    ? 'bg-purple-700 text-white border-purple-700'
                    : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          {samples.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">ยังไม่มีตัวอย่าง — สแกนขวดผ่านระบบแล้วจะสะสมที่นี่</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {samples.map((s) => (
                <a
                  key={s.sample_id}
                  href={mediaUrl(s.image_url)}
                  target="_blank"
                  rel="noreferrer"
                  className="group rounded-xl border border-slate-100 overflow-hidden hover:border-purple-300 hover:shadow-sm transition-all"
                >
                  <div className="aspect-square bg-slate-100 relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={mediaUrl(s.image_url)} alt={s.label} className="w-full h-full object-cover" />
                    <span className="absolute top-1.5 left-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-black/70 text-white">
                      {s.label}
                    </span>
                  </div>
                  <div className="p-2 space-y-0.5">
                    <p className="text-[10px] font-semibold text-slate-800 truncate flex items-center gap-1">
                      <ImageIcon className="w-3 h-3 text-slate-400" />
                      {s.source}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {s.confidence ? `${s.confidence}% · ` : ''}
                      {s.created_at}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
