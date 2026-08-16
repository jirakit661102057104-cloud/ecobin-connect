export const DEMO_LOGIN = process.env.NEXT_PUBLIC_DEMO_LOGIN !== 'false';

export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL === undefined
    ? 'http://localhost:8080'
    : process.env.NEXT_PUBLIC_API_URL;

export const GUEST_BROWSE_KEY = 'ecobin_guest_browse';
const GUEST_COOKIE = 'ecobin_guest=1; Path=/; SameSite=Lax; Max-Age=86400';

export function allowGuestBrowse() {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(GUEST_BROWSE_KEY, '1');
  document.cookie = GUEST_COOKIE;
}

export function clearGuestBrowse() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(GUEST_BROWSE_KEY);
  document.cookie = 'ecobin_guest=; Path=/; Max-Age=0';
}

export function isGuestBrowse() {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(GUEST_BROWSE_KEY) === '1';
}
