"""Build printable bin materials (A4 landscape).

Page 1: background behind the bin - ONLY the words SAVE and CFO, on one line in the upper part (OCR tests showed
        any other text or a QR next to the words lowers recognition).
Page 2: three QR stickers (one per drop site) with Thai labels/steps, to stick on
        the bin itself - away from the background words.

Usage: python make_bin_bg.py <out_dir>
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "pylib"))
import segno  # noqa: E402

BINS = [
    ("science", "ตึกคณะวิทยาศาสตร์และเทคโนโลยี", "#0ea5e9"),
    ("library", "หอสมุด (อาคารบรรณราชนครินทร์)", "#8b5cf6"),
    ("canteen", "โรงอาหารกลาง", "#f59e0b"),
]


def qr_svg(payload: str) -> str:
    q = segno.make(payload, error="h")
    svg = q.svg_inline(scale=1, border=2, dark="#000000", light="#ffffff", omitsize=True)
    return svg.replace("<svg ", '<svg class="qr" ', 1)


def sticker(site_id: str, label: str, accent: str) -> str:
    return f"""
    <div class="card" style="--accent:{accent}">
      <div class="c-top"><span class="dot"></span>จุดทิ้งขวดน้ำพลาสติก</div>
      <div class="qr-box">{qr_svg("PCRU-CFO-BIN:" + site_id)}</div>
      <div class="c-site">{label}</div>
      <ol>
        <li>สแกน QR นี้ในแอป</li>
        <li>ถือขวดไว้หน้าป้ายพื้นหลัง</li>
        <li>ถ่ายให้เห็นตัวอักษรใหญ่ครบ 2 คำ</li>
      </ol>
      <div class="cut">ตัดตามเส้นแล้วติดที่ตัวถัง</div>
    </div>"""


HTML = """<!doctype html>
<html lang="th"><head><meta charset="utf-8">
<title>ป้ายพื้นหลังจุดทิ้ง</title>
<style>
  @page { size: A4 landscape; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: #fff; }
  body { font-family: "Leelawadee UI", "Leelawadee", Tahoma, sans-serif; color: #111; }
  .page { width: 297mm; height: 210mm; page-break-after: always; break-after: page; overflow: hidden; }
  .page:last-child { page-break-after: auto; break-after: auto; }

  /* Page 1: background - words only, pure black on white */
  /* One line in the upper part: the bin stands in front of the lower half. */
  .bg { display: flex; justify-content: center; align-items: flex-start; padding-top: 28mm; gap: 16mm; }
  .w { font-family: Tahoma, "Segoe UI", Arial, sans-serif; font-weight: 700; color: #000;
       font-size: 52mm; line-height: 1; letter-spacing: 3mm; }

  /* Page 2: QR stickers */
  .stickers { padding: 12mm; display: grid; grid-template-columns: repeat(3, 1fr); gap: 8mm; align-items: start; }
  .card { border: .5mm dashed #9ca3af; border-radius: 4mm; padding: 6mm 5mm; display: flex;
          flex-direction: column; align-items: center; gap: 3mm; border-top: 3mm solid var(--accent); }
  .c-top { font-size: 5.5mm; font-weight: 700; display: flex; align-items: center; gap: 2mm; }
  .dot { width: 4.5mm; height: 4.5mm; border-radius: 50%; background: var(--accent); display: inline-block; }
  .qr-box { width: 62mm; height: 62mm; }
  .qr { width: 100%; height: 100%; display: block; }
  .c-site { font-size: 5mm; font-weight: 700; text-align: center; line-height: 1.3; min-height: 13mm; }
  ol { font-size: 4.2mm; line-height: 1.6; padding-left: 6mm; align-self: stretch; color: #1f2937; }
  .cut { font-size: 3.2mm; color: #9ca3af; }
</style></head><body>
<section class="page bg">
  <div class="w">SAVE</div>
  <div class="w">CFO</div>
</section>
<section class="page stickers">
__STICKERS__
</section>
</body></html>"""


def main():
    out = sys.argv[1]
    os.makedirs(out, exist_ok=True)
    html = HTML.replace("__STICKERS__", "\n".join(sticker(*b) for b in BINS))
    path = os.path.join(out, "bin-background.html")
    with open(path, "w", encoding="utf-8") as f:
        f.write(html)
    print("wrote", path)


if __name__ == "__main__":
    main()
