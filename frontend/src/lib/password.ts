export type PasswordRule = { id: string; label: string; ok: boolean };

export function passwordRules(password: string): PasswordRule[] {
  return [
    { id: 'len', label: 'อย่างน้อย 8 ตัวอักษร', ok: password.length >= 8 },
    { id: 'lower', label: 'มีตัวพิมพ์เล็ก (a–z)', ok: /[a-z]/.test(password) },
    { id: 'upper', label: 'มีตัวพิมพ์ใหญ่ (A–Z)', ok: /[A-Z]/.test(password) },
    { id: 'digit', label: 'มีตัวเลข (0–9)', ok: /\d/.test(password) },
    { id: 'special', label: 'มีอักขระพิเศษ (!@#$%...)', ok: /[^A-Za-z0-9]/.test(password) },
  ];
}

export function isStrongPassword(password: string): boolean {
  return passwordRules(password).every((r) => r.ok);
}

export function passwordScore(password: string): number {
  return passwordRules(password).filter((r) => r.ok).length;
}

function pick(chars: string, n: number): string {
  const buf = new Uint32Array(n);
  crypto.getRandomValues(buf);
  let out = '';
  for (let i = 0; i < n; i++) out += chars[buf[i] % chars.length];
  return out;
}

export function generateStrongPassword(length = 14): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const digits = '23456789';
  const special = '!@#$%&*?';
  const all = upper + lower + digits + special;
  const raw = pick(upper, 1) + pick(lower, 1) + pick(digits, 1) + pick(special, 1) + pick(all, Math.max(0, length - 4));
  const arr = raw.split('');
  const order = new Uint32Array(arr.length);
  crypto.getRandomValues(order);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = order[i] % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join('');
}
