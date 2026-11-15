'use client';

/**
 * Waste scanning is smartphone-only (camera + daily checkpoint words on backdrop).
 * Accepts plastic water bottles (PET) only. Desktop can browse but not scan.
 */
export function isSmartphoneClient(): boolean {
  if (typeof window === 'undefined') return false;

  const ua = navigator.userAgent || '';

  // Clear phone UAs
  if (/iPhone|iPod|Windows Phone|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
    return true;
  }
  // Android phones include "Mobile"; tablets usually do not
  if (/Android/i.test(ua) && /Mobile/i.test(ua)) {
    return true;
  }

  // DevTools / uncommon phones: narrow + coarse pointer
  const narrow = window.matchMedia('(max-width: 767px)').matches;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const touch = (navigator.maxTouchPoints || 0) > 0;
  return narrow && coarse && touch;
}

export function wasteScanBlockedMessage(th: boolean) {
  return th
    ? {
        title: 'สแกนขยะใช้ได้บนสมาร์ทโฟนเท่านั้น',
        body: 'จากคอมพิวเตอร์ดูแดชบอร์ด ของรางวัล และรายงานได้ตามปกติ แต่การถ่ายรูป/สแกนขยะต้องเปิดเว็บนี้บนมือถือ',
        hint: 'เปิดลิงก์เดียวกันบนสมาร์ทโฟน แล้วกดเมนู “สแกนขยะ”',
      }
    : {
        title: 'Waste scan is smartphone-only',
        body: 'On a computer you can browse the dashboard, rewards, and reports — but scanning requires a phone camera.',
        hint: 'Open the same link on your smartphone, then tap “Scan”.',
      };
}
