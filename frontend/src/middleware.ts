import { NextRequest, NextResponse } from 'next/server';
import { googleCredentialRedirect } from './lib/googleCredentialRedirect';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (req.method === 'POST' && pathname === '/login') {
    return googleCredentialRedirect(req);
  }

  if (req.method !== 'GET') {
    return NextResponse.next();
  }

  const hasSession = Boolean(req.cookies.get('ecobin_token')?.value);
  const isGuest = req.cookies.get('ecobin_guest')?.value === '1';

  if (pathname === '/') {
    if (!hasSession && !isGuest) {
      return NextResponse.redirect(new URL('/login', req.nextUrl.origin));
    }
    return NextResponse.next();
  }

  // Do not bounce /login → / just because a cookie exists.
  // Invalid/expired tokens after deploy caused an infinite redirect loop
  // ("ค้างหน้าเข้าสู่ระบบ"). LoginScreen redirects after /api/state confirms the user.

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login'],
};
