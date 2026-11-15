import type { Certificate } from '../types';
import { APP_NAME } from './brand';

/** Build a printable HTML document for an issued certificate. */
export function certificateHTML(cert: Certificate): string {
  const dept = cert.department_snapshot?.trim() || '—';
  const note = cert.admin_message?.trim()
    ? `<p style="margin:16px 0 0;font-size:13px;color:#334155;">${escapeHtml(cert.admin_message)}</p>`
    : '';
  return `<!DOCTYPE html>
<html lang="th"><head><meta charset="UTF-8"><title>เกียรติบัตร — ${escapeHtml(cert.full_name_snapshot)}</title>
<style>
  @media print { body { background: #fff !important; padding: 0 !important; } }
  body { margin:0; padding:24px; background:#ecfdf5; font-family:Segoe UI,Tahoma,sans-serif; }
</style></head>
<body>
  <div style="max-width:640px;margin:0 auto;background:#fff;border:2px solid #6ee7b7;border-radius:20px;padding:32px;text-align:center;">
    <p style="margin:0;font-size:11px;letter-spacing:0.16em;font-weight:700;color:#047857;text-transform:uppercase;">${escapeHtml(APP_NAME)}</p>
    <h1 style="margin:12px 0 4px;font-size:22px;color:#0f172a;">เกียรติบัตรการคัดแยกเพื่อลดคาร์บอน</h1>
    <p style="margin:0;font-size:13px;color:#64748b;">Certificate of Carbon Reduction · มหาวิทยาลัยราชภัฏเพชรบูรณ์</p>
    <p style="margin:28px 0 4px;font-size:14px;color:#475569;">มอบให้แก่</p>
    <p style="margin:0;font-size:24px;font-weight:800;color:#065f46;">${escapeHtml(cert.full_name_snapshot)}</p>
    <p style="margin:6px 0 0;font-size:12px;color:#64748b;">${escapeHtml(dept)}</p>
    <div style="margin:28px 0;padding:16px;background:#f0fdf4;border-radius:14px;text-align:left;">
      <p style="margin:0 0 8px;font-size:13px;color:#0f172a;"><strong>คาร์บอนเครดิต:</strong> ${cert.credits_tco2e.toFixed(4)} tCO₂e</p>
      <p style="margin:0 0 8px;font-size:13px;color:#0f172a;"><strong>คาร์บอนที่ลดได้:</strong> ${cert.avoided_kg.toFixed(3)} kgCO₂e</p>
      <p style="margin:0 0 8px;font-size:13px;color:#0f172a;"><strong>คาร์บอนฟุตพริ้นท์ที่บันทึก:</strong> ${cert.footprint_kg.toFixed(3)} kgCO₂e</p>
      <p style="margin:0 0 8px;font-size:13px;color:#0f172a;"><strong>ขวดน้ำพลาสติกที่ผ่านเกณฑ์:</strong> ${cert.bottles} ขวด (${cert.approved_count} รายการ)</p>
      <p style="margin:0;font-size:13px;color:#0f172a;"><strong>แต้มสะสม:</strong> ${cert.points} แต้ม</p>
    </div>
    ${note}
    <p style="margin:20px 0 0;font-size:11px;color:#94a3b8;">ออกให้เมื่อ ${escapeHtml(cert.issued_at)} · รหัส ${escapeHtml(cert.certificate_id)}</p>
  </div>
</body></html>`;
}

function escapeHtml(s: string) {
  return (s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Trigger browser download of the certificate as an .html file (open → Print → PDF). */
export function downloadCertificate(cert: Certificate) {
  const html = certificateHTML(cert);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `certificate-${cert.certificate_id}.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Open certificate in a new window for Print / Save as PDF. */
export function printCertificate(cert: Certificate) {
  const w = window.open('', '_blank', 'noopener,noreferrer,width=800,height=900');
  if (!w) {
    downloadCertificate(cert);
    return;
  }
  w.document.write(certificateHTML(cert));
  w.document.close();
  w.focus();
  setTimeout(() => {
    try {
      w.print();
    } catch {
      /* user can print manually */
    }
  }, 300);
}
