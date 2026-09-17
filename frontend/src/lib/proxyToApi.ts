import { NextRequest, NextResponse } from 'next/server';

const HOP_BY_HOP = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailers',
  'transfer-encoding',
  'upgrade',
  'host',
  'content-length',
]);

const FORWARDED_REQUEST_HEADERS = [
  'accept',
  'authorization',
  'content-type',
  'cookie',
  'user-agent',
] as const;

const DEFAULT_API =
  'https://ecobin-api-568301593385.asia-southeast1.run.app';

function isUsableApiTarget(url: string) {
  if (!url) return false;
  // Production (Vercel) must never proxy to a developer machine.
  if (process.env.VERCEL) {
    if (url.includes('localhost') || url.includes('127.0.0.1')) return false;
    if (url.includes('trycloudflare.com')) return false;
    return /^https:\/\//.test(url);
  }
  // Local Next.js: allow http://localhost:8080 so new API routes work before Cloud Run deploy.
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/?$/.test(url)) return true;
  if (url.includes('trycloudflare.com')) return false;
  return /^https:\/\//.test(url);
}

export function apiProxyTarget() {
  const fromEnv = (process.env.API_PROXY_TARGET || '').replace(/\/$/, '');
  if (isUsableApiTarget(fromEnv)) return fromEnv;
  return DEFAULT_API;
}

export async function proxyToApi(req: NextRequest, prefix: 'api' | 'uploads', path: string[]) {
  const base = apiProxyTarget();
  if (!base) {
    return NextResponse.json(
      {
        error:
          'ยังไม่ได้ตั้ง API_PROXY_TARGET บน Vercel — เว็บเรียก API บนเครื่อง local ไม่ได้',
      },
      { status: 503 }
    );
  }

  const dest = `${base}/${prefix}/${path.map(encodeURIComponent).join('/')}${req.nextUrl.search}`;
  const headers = new Headers();
  // Vercel adds transport-specific headers (for example compressed body
  // metadata) that must not be replayed to Cloud Run with a materialized body.
  for (const key of FORWARDED_REQUEST_HEADERS) {
    const value = req.headers.get(key);
    if (value) headers.set(key, value);
  }

  const init: RequestInit = {
    method: req.method,
    headers,
    redirect: 'manual',
    cache: 'no-store',
  };
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    // Materialize the body as Uint8Array. Passing NextRequest's stream or a
    // bare ArrayBuffer can fail in Vercel's Node runtime before reaching
    // Cloud Run, especially after a Google redirect.
    const body = await req.arrayBuffer();
    init.body = new Uint8Array(body);
  }

  let upstream: Response;
  try {
    upstream = await fetch(dest, init);
  } catch (error) {
    console.error('API proxy upstream fetch failed', {
      method: req.method,
      destination: dest,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      {
        error:
          'เชื่อมต่อ Go API ผ่าน Vercel ไม่ได้ กรุณาตรวจ Deployment Logs ของฟังก์ชัน /api',
      },
      { status: 502 }
    );
  }

  const out = new Headers();
  upstream.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower === 'set-cookie' || HOP_BY_HOP.has(lower)) return;
    out.append(key, value);
  });

  const res = new NextResponse(upstream.body, { status: upstream.status, headers: out });
  const cookies = typeof upstream.headers.getSetCookie === 'function' ? upstream.headers.getSetCookie() : [];
  const requestIsHttps =
    req.nextUrl.protocol === 'https:' ||
    req.headers.get('x-forwarded-proto') === 'https';
  for (const cookie of cookies) {
    // Cloud Run sets Secure cookies; browsers on http://localhost drop them,
    // so Google login appears to fail after a successful API response.
    let rewritten = cookie;
    if (!requestIsHttps) {
      rewritten = rewritten
        .replace(/;\s*Secure/gi, '')
        .replace(/;\s*SameSite=None/gi, '; SameSite=Lax');
    }
    res.headers.append('set-cookie', rewritten);
  }
  return res;
}
