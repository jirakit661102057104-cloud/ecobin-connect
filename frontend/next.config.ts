import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import type { NextConfig } from 'next';

function loadFrontendEnv() {
  const file = resolve(__dirname, 'frontend.env');
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadFrontendEnv();

const nextConfig: NextConfig = {
  // Silence multi-lockfile warning (root bun.lock + frontend/package-lock.json)
  outputFileTracingRoot: resolve(__dirname),
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_DEMO_LOGIN: process.env.NEXT_PUBLIC_DEMO_LOGIN || 'true',
    // SIT default: local EcoBin bottle/can model under /public/models
    NEXT_PUBLIC_TEACHABLE_MACHINE_MODEL_URL:
      process.env.NEXT_PUBLIC_TEACHABLE_MACHINE_MODEL_URL || '/models/ecobin-bottle-can/',
    NEXT_PUBLIC_TEACHABLE_MACHINE_CONFIDENCE:
      process.env.NEXT_PUBLIC_TEACHABLE_MACHINE_CONFIDENCE || '0.80',
  },
};

export default nextConfig;
