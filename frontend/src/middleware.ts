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

  if (pathname === '/login' && hasSession) {
    const q = req.nextUrl.searchParams;
    if (!q.get('google') && !q.get('google_error')) {
      return NextResponse.redirect(new URL('/', req.nextUrl.origin));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login'],
};
