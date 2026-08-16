const MAIN_TAB_KEY = 'ecobin_active_tab';
const ADMIN_TAB_KEY = 'ecobin_admin_tab';
const HISTORY_TAB_KEY = 'ecobin_history_tab';

const MEMBER_TABS = ['dashboard', 'scan', 'rewards', 'settings', 'history', 'guide'];
const ADMIN_TABS = ['admin', 'scan', 'settings', 'history', 'guide'];
const GUEST_TABS = ['dashboard', 'scan', 'rewards', 'settings', 'history', 'guide'];
const ADMIN_SUBTABS = ['overview', 'verify', 'users', 'rewards', 'redemptions', 'bins', 'rules', 'relations'];
const HISTORY_SUBTABS = ['waste', 'points', 'redeem', 'guest'];

function read(key: string) {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore quota / private mode */
  }
}

export function allowedMainTabs(role: string) {
  if (role === 'Admin') return ADMIN_TABS;
  if (role === 'Guest') return GUEST_TABS;
  return MEMBER_TABS;
}

export function defaultMainTab(role: string) {
  return role === 'Admin' ? 'admin' : 'dashboard';
}

export function restoreMainTab(role: string, userId?: string | null) {
  const allowed = allowedMainTabs(role);
  const saved = read(`${MAIN_TAB_KEY}:${userId || role || 'guest'}`);
  if (saved && allowed.includes(saved)) return saved;
  return defaultMainTab(role);
}

export function persistMainTab(tab: string, userId?: string | null, role?: string) {
  write(`${MAIN_TAB_KEY}:${userId || role || 'guest'}`, tab);
}

export function restoreAdminTab() {
  const saved = read(ADMIN_TAB_KEY);
  if (saved && ADMIN_SUBTABS.includes(saved)) {
    return saved as (typeof ADMIN_SUBTABS)[number];
  }
  return 'overview' as const;
}

export function persistAdminTab(tab: string) {
  write(ADMIN_TAB_KEY, tab);
}

export function restoreHistoryTab() {
  const saved = read(HISTORY_TAB_KEY);
  if (saved && HISTORY_SUBTABS.includes(saved)) return saved as 'waste' | 'points' | 'redeem' | 'guest';
  return 'waste' as const;
}

export function persistHistoryTab(tab: string) {
  write(HISTORY_TAB_KEY, tab);
}
