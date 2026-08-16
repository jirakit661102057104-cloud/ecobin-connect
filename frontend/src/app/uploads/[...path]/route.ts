import { NextRequest } from 'next/server';
import { proxyToApi } from '../../../lib/proxyToApi';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type Ctx = { params: Promise<{ path: string[] }> };

async function handle(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxyToApi(req, 'uploads', path || []);
}

export const GET = handle;
export const HEAD = handle;
