import { API_BASE } from './config';

export function mediaUrl(url: string): string {
  if (!url) return url;
  if (url.startsWith('/uploads/')) return `${API_BASE}${url}`;
  return url;
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      credentials: 'include',
    });
  } catch {
    throw new Error(
      'เชื่อมต่อ API ไม่ได้ — บน Vercel ต้องตั้ง API_PROXY_TARGET เป็น URL ของ Go API ที่เปิดเน็ตได้ ไม่ใช่ localhost'
    );
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (data as { error?: string }).error || `HTTP ${res.status}`;
    throw new Error(message);
  }
  return data as T;
}
