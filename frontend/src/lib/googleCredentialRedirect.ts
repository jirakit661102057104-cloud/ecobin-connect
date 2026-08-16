import { NextRequest, NextResponse } from 'next/server';

export async function googleCredentialRedirect(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const form = await req.formData();
  const credential = String(form.get('credential') || '').trim();
  const csrfBody = String(form.get('g_csrf_token') || '');
  const csrfCookie = req.cookies.get('g_csrf_token')?.value || '';

  if (!credential || !csrfCookie || csrfCookie !== csrfBody) {
    return NextResponse.redirect(new URL('/login?google_error=1', origin), 303);
  }

  const res = NextResponse.redirect(new URL('/login?google=1', origin), 303);
  res.cookies.set('ecobin_google_credential', credential, {
    path: '/',
    maxAge: 120,
    sameSite: 'lax',
    httpOnly: false,
    secure: origin.startsWith('https'),
  });
  return res;
}
