export const REDEEM_QR_PREFIX = 'ECOBIN-REDEEM:';

export function redeemQrPayload(pickupCode: string) {
  return `${REDEEM_QR_PREFIX}${pickupCode}`;
}

export function parseRedeemQr(raw: string) {
  let value = (raw || '').trim();
  if (value.startsWith(REDEEM_QR_PREFIX)) {
    value = value.slice(REDEEM_QR_PREFIX.length);
  }
  return value.trim();
}

export function redeemQrImageUrl(pickupCode: string, size = 200) {
  const data = encodeURIComponent(redeemQrPayload(pickupCode));
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=8&data=${data}`;
}
