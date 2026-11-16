import { apiBase } from './config';

export function mediaUrl(url: string): string {
  if (!url) return url;
  if (url.startsWith('/uploads/')) return `${apiBase()}${url}`;
  return url;
}

/**
 * The API host (Render free plan) sleeps after 15 idle minutes and needs up to ~1 minute
 * to wake. While it wakes, the Vercel proxy answers 502/503/504. Requests that are safe to
 * repeat are retried; the UI is told (window event) so it can show a "waking up" notice.
 */
export const API_WAKING_EVENT = 'pcru-api-waking';
const WAKING_STATUS = new Set([502, 503, 504]);
const RETRY_DELAYS_MS = [3000, 6000, 10000];
const WAKING_MESSAGE =
  'เซิร์ฟเวอร์กำลังเริ่มทำงาน (ครั้งแรกอาจใช้เวลาถึง 1 นาที) กรุณาลองอีกครั้งในอีกสักครู่';

function isRetrySafe(path: string, method: string) {
  if (method === 'GET' || method === 'HEAD') return true;
  // Logging in/out twice has no side effect; other writes (register, scan, claim) are not retried.
  return path === '/api/auth/login' || path === '/api/auth/logout';
}

function announceWaking() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(API_WAKING_EVENT));
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const method = (options.method || 'GET').toUpperCase();
  const canRetry = isRetrySafe(path, method);

  for (let attempt = 0; ; attempt++) {
    let res: Response | null = null;
    try {
      res = await fetch(`${apiBase()}${path}`, {
        ...options,
        headers,
        credentials: 'include',
      });
    } catch {
      res = null; // network error: treat like a waking server
    }

    const waking = !res || WAKING_STATUS.has(res.status);
    if (waking) {
      if (canRetry && attempt < RETRY_DELAYS_MS.length) {
        announceWaking();
        await sleep(RETRY_DELAYS_MS[attempt]);
        continue;
      }
      announceWaking();
      throw new Error(WAKING_MESSAGE);
    }

    const ok = res as Response;
    const data = await ok.json().catch(() => ({}));
    if (!ok.ok) {
      const message = (data as { error?: string }).error || `HTTP ${ok.status}`;
      throw new Error(message);
    }
    return data as T;
  }
}
