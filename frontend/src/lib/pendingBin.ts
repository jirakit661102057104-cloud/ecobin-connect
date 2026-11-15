import { SCAN_DROP_SITES, type ScanDropSiteId } from './scanCheckpoint';

/**
 * A bin chosen by opening a bin QR link (https://…/?bin=sci-f1) with the phone camera.
 * Kept briefly in localStorage so it survives the login round-trip, then consumed once
 * by the waste scanner.
 */
const KEY = 'pcru_pending_bin';
const MAX_AGE_MS = 30 * 60 * 1000;

function isSiteId(v: string | null | undefined): v is ScanDropSiteId {
  return !!v && SCAN_DROP_SITES.some((s) => s.id === v);
}

export function savePendingBin(id: ScanDropSiteId) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ id, at: Date.now() }));
  } catch {
    /* private mode — the scanner still lets people pick the bin */
  }
}

/** The pending bin, if any and still fresh (does not consume it). */
export function peekPendingBin(): ScanDropSiteId | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const { id, at } = JSON.parse(raw) as { id?: string; at?: number };
    if (!isSiteId(id) || !at || Date.now() - at > MAX_AGE_MS) {
      localStorage.removeItem(KEY);
      return null;
    }
    return id;
  } catch {
    return null;
  }
}

/** Returns the pending bin and clears it. */
export function takePendingBin(): ScanDropSiteId | null {
  const id = peekPendingBin();
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  return id;
}

/**
 * Reads ?bin=<id> from the current URL, stores it as pending and removes the
 * parameter from the address bar. Returns the bin id when one was found.
 */
export function captureBinFromUrl(): ScanDropSiteId | null {
  if (typeof window === 'undefined') return null;
  const url = new URL(window.location.href);
  const id = (url.searchParams.get('bin') || '').trim().toLowerCase();
  if (!url.searchParams.has('bin')) return null;
  url.searchParams.delete('bin');
  window.history.replaceState(null, '', url.pathname + (url.search ? url.search : '') + url.hash);
  if (!isSiteId(id)) return null;
  savePendingBin(id);
  return id;
}
