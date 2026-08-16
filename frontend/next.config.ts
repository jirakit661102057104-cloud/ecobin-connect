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
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_DEMO_LOGIN: process.env.NEXT_PUBLIC_DEMO_LOGIN || 'true',
  },
  output: 'standalone',
};

export default nextConfig;
