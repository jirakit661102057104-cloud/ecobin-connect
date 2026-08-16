import { NextRequest, NextResponse } from 'next/server';
import { googleCredentialRedirect } from '../../../lib/googleCredentialRedirect';

export async function GET(req: NextRequest) {
  return NextResponse.redirect(new URL('/login', req.nextUrl.origin), 303);
}

export async function POST(req: NextRequest) {
  return googleCredentialRedirect(req);
}
