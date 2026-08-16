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

export function apiProxyTarget() {
  return (
    process.env.API_PROXY_TARGET ||
    'https://configure-civilian-representations-vid.trycloudflare.com'
  ).replace(/\/$/, '');
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
  req.headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key.toLowerCase())) headers.set(key, value);
  });

  const init: RequestInit = {
    method: req.method,
    headers,
    redirect: 'manual',
  };
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = await req.arrayBuffer();
  }

  let upstream: Response;
  try {
    upstream = await fetch(dest, init);
  } catch {
    return NextResponse.json(
      { error: 'เชื่อมต่อ Go API ไม่ได้ ตรวจว่า API เปิดเน็ตได้ และ API_PROXY_TARGET ถูกต้อง' },
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
  for (const cookie of cookies) {
    res.headers.append('set-cookie', cookie);
  }
  return res;
}
