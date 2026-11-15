/** Three campus drop bins + fixed OCR checkpoint words (SAVE + CFO). */

export const SCAN_DROP_SITES = [
  {
    id: 'science',
    labelTh: 'ตึกคณะวิทย์',
    labelEn: 'Science Faculty',
    match: ['คณะวิทย์', 'วิทยาศาสตร์', 'science'],
    color: '#0ea5e9',
    soft: 'from-sky-50 to-emerald-50/50 border-sky-100',
  },
  {
    id: 'library',
    labelTh: 'หอสมุด',
    labelEn: 'Library',
    match: ['หอสมุด', 'บรรณราช', 'library'],
    color: '#8b5cf6',
    soft: 'from-violet-50 to-slate-50/50 border-violet-100',
  },
  {
    id: 'canteen',
    labelTh: 'โรงอาหาร',
    labelEn: 'Cafeteria',
    match: ['โรงอาหาร', 'canteen', 'cafeteria'],
    color: '#f59e0b',
    soft: 'from-amber-50 to-orange-50/40 border-amber-100',
  },
] as const;

export type ScanDropSiteId = (typeof SCAN_DROP_SITES)[number]['id'];

/** Fixed checkpoint phrase — OCR must find ALL of these words (2 words). */
export const CHECKPOINT_WORDS = ['SAVE', 'CFO'] as const;

export const CHECKPOINT_WORD_COUNT = CHECKPOINT_WORDS.length;

const BIN_QR_PREFIX = 'PCRU-CFO-BIN:';

/** QR payload printed on each physical bin (identifies which of the 3 sites). */
export function binQrPayload(siteId: ScanDropSiteId): string {
  return `${BIN_QR_PREFIX}${siteId}`;
}

/** Parse bin QR / typed code → drop site id, or null. */
export function parseBinQr(raw: string): ScanDropSiteId | null {
  const text = (raw || '').trim();
  if (!text) return null;
  const upper = text.toUpperCase();
  const prefixed = upper.startsWith(BIN_QR_PREFIX.toUpperCase())
    ? text.slice(BIN_QR_PREFIX.length).trim().toLowerCase()
    : text.toLowerCase().replace(/^pcru[_-]?cfo[_-]?bin[_:=]?/i, '');
  const id = prefixed as ScanDropSiteId;
  if (SCAN_DROP_SITES.some((s) => s.id === id)) return id;
  // Allow scanning just the site label keywords
  return matchDropSiteId(text);
}

export function getScanDropSite(siteId: ScanDropSiteId) {
  return SCAN_DROP_SITES.find((s) => s.id === siteId) ?? SCAN_DROP_SITES[0];
}

export function matchDropSiteId(binLocation: string | undefined): ScanDropSiteId | null {
  const loc = (binLocation || '').toLowerCase();
  if (!loc) return null;
  for (const site of SCAN_DROP_SITES) {
    if (site.id === loc) return site.id;
    if (site.match.some((kw) => loc.includes(kw.toLowerCase()))) return site.id;
  }
  if (loc.includes('pcru-cfo-bin:')) {
    const id = loc.split('pcru-cfo-bin:')[1]?.trim() as ScanDropSiteId;
    if (SCAN_DROP_SITES.some((s) => s.id === id)) return id;
  }
  return null;
}

export function formatCheckpointPhrase(words: readonly string[] = CHECKPOINT_WORDS) {
  return words.join(' ');
}

/** Public URL helper to preview/print a bin QR (for stickers). */
export function binQrImageUrl(siteId: ScanDropSiteId, size = 180) {
  const data = encodeURIComponent(binQrPayload(siteId));
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${data}`;
}

/**
 * Audit stamp after a successful OCR pass (do NOT burn before OCR —
 * that would put SAVE/CFO into the image artificially).
 */
export function burnCheckpointOntoCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  words: readonly string[],
  siteLabel: string,
) {
  const bannerH = Math.max(48, Math.round(height * 0.12));
  const y0 = height - bannerH;

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  ctx.fillStyle = 'rgba(6, 78, 59, 0.88)';
  ctx.fillRect(0, y0, width, bannerH);

  ctx.fillStyle = '#ecfdf5';
  ctx.font = `bold ${Math.max(14, Math.round(bannerH * 0.28))}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`CHECKPOINT · ${siteLabel}`, width / 2, y0 + bannerH * 0.32);

  ctx.font = `bold ${Math.max(18, Math.round(bannerH * 0.38))}px ui-monospace, monospace`;
  ctx.fillStyle = '#fef08a';
  ctx.fillText(formatCheckpointPhrase(words), width / 2, y0 + bannerH * 0.68);
  ctx.restore();
}

export const PLASTIC_WATER_BOTTLE_TH = 'ขวดน้ำพลาสติก';
export const PLASTIC_WATER_BOTTLE_EN = 'PET';
export const PLASTIC_WATER_BOTTLE_LABEL = 'PET (เบอร์ 1 - ขวดน้ำใส)';
