/** Client-side helpers to reduce fake scans from web-downloaded photos. */

export type CaptureSource = 'camera' | 'gallery';

/** SHA-256 hex of the raw image bytes (after base64 decode for data URLs). */
export async function hashImageDataUrl(imageDataUrl: string): Promise<string> {
  const bytes = await imageBytesFromDataUrl(imageDataUrl);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function imageBytesFromDataUrl(imageDataUrl: string): Promise<ArrayBuffer> {
  if (imageDataUrl.startsWith('http://') || imageDataUrl.startsWith('https://')) {
    throw new Error('ไม่รับ URL รูปจากอินเทอร์เน็ตโดยตรง — ต้องถ่ายจากกล้อง');
  }
  if (!imageDataUrl.startsWith('data:')) {
    throw new Error('รูปแบบรูปไม่ถูกต้อง');
  }
  const comma = imageDataUrl.indexOf(',');
  if (comma < 0) throw new Error('รูปแบบรูปไม่ถูกต้อง');
  const meta = imageDataUrl.slice(0, comma);
  const b64 = imageDataUrl.slice(comma + 1);
  if (!meta.includes('base64')) {
    throw new Error('รูปแบบรูปไม่ถูกต้อง');
  }
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

/**
 * Lightweight JPEG EXIF / header sniff — not proof, but flags common download tools.
 * Returns a Thai/English-ready reason string if suspicious, else null.
 */
export function sniffDownloadedImageHints(imageDataUrl: string): string | null {
  if (imageDataUrl.startsWith('http://') || imageDataUrl.startsWith('https://')) {
    return 'ตรวจพบว่าเป็นลิงก์รูปจากอินเทอร์เน็ต';
  }
  if (!imageDataUrl.startsWith('data:image/jpeg') && !imageDataUrl.includes('image/jpeg')) {
    return null;
  }
  try {
    const comma = imageDataUrl.indexOf(',');
    if (comma < 0) return null;
    const binary = atob(imageDataUrl.slice(comma + 1));
    // Sample first ~64KB of ASCII-ish bytes for software tags
    const sample = binary.slice(0, Math.min(binary.length, 65536));
    const lower = sample.toLowerCase();
    const suspects = [
      'photoshop',
      'canva',
      'gimp',
      'snipping',
      'screenshot',
      'chrome',
      'firefox',
      'edge screenshot',
      'getty',
      'shutterstock',
      'unsplash',
      'pixabay',
      'wikimedia',
    ];
    for (const s of suspects) {
      if (lower.includes(s)) {
        return `พบร่องรอยซอฟต์แวร์/แหล่งดาวน์โหลดในไฟล์รูป (${s})`;
      }
    }
  } catch {
    /* ignore sniff errors */
  }
  return null;
}
