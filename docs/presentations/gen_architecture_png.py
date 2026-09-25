# -*- coding: utf-8 -*-
"""Generate EcoBin architecture diagram PNG for slides."""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parent / "assets" / "architecture-diagram.png"
OUT.parent.mkdir(parents=True, exist_ok=True)

W, H = 1600, 900
BG = (250, 252, 251)
INK = (15, 23, 42)
MUTED = (100, 116, 139)
GREEN = (13, 122, 102)
GREEN_DARK = (22, 51, 44)
GREEN_SOFT = (237, 245, 241)
AMBER = (245, 158, 11)
WHITE = (255, 255, 255)
LINE = (203, 213, 225)


def font(size, bold=False):
    candidates = [
        r"C:\Windows\Fonts\arial.ttf",
        r"C:\Windows\Fonts\segoeui.ttf",
        r"C:\Windows\Fonts\calibri.ttf",
        r"C:\Windows\Fonts\tahomabd.ttf" if bold else r"C:\Windows\Fonts\tahoma.ttf",
    ]
    for p in candidates:
        try:
            return ImageFont.truetype(p, size)
        except OSError:
            continue
    return ImageFont.load_default()


def rounded(draw, box, fill, radius=18, outline=None, width=2):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def center_text(draw, box, text, fnt, fill=INK):
    x0, y0, x1, y1 = box
    bbox = draw.textbbox((0, 0), text, font=fnt)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.text(((x0 + x1 - tw) / 2, (y0 + y1 - th) / 2), text, font=fnt, fill=fill)


def multiline_center(draw, cx, cy, lines, fonts, fills):
    heights = []
    widths = []
    for line, fnt in zip(lines, fonts):
        b = draw.textbbox((0, 0), line, font=fnt)
        widths.append(b[2] - b[0])
        heights.append(b[3] - b[1])
    total_h = sum(heights) + 6 * (len(lines) - 1)
    y = cy - total_h / 2
    for line, fnt, fill, h, w in zip(lines, fonts, fills, heights, widths):
        draw.text((cx - w / 2, y), line, font=fnt, fill=fill)
        y += h + 6


def arrow(draw, x1, y1, x2, y2, color=GREEN):
    draw.line((x1, y1, x2, y2), fill=color, width=3)
    # simple arrow head toward (x2,y2)
    if abs(x2 - x1) >= abs(y2 - y1):
        # horizontal
        direction = 1 if x2 > x1 else -1
        draw.polygon(
            [(x2, y2), (x2 - 12 * direction, y2 - 7), (x2 - 12 * direction, y2 + 7)],
            fill=color,
        )
    else:
        direction = 1 if y2 > y1 else -1
        draw.polygon(
            [(x2, y2), (x2 - 7, y2 - 12 * direction), (x2 + 7, y2 - 12 * direction)],
            fill=color,
        )


def build():
    img = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(img)
    f_title = font(28, True)
    f_h = font(18, True)
    f_b = font(15)
    f_s = font(13)
    f_xs = font(12)

    # Header
    draw.text((48, 28), "SYSTEM ARCHITECTURE", font=f_title, fill=GREEN_DARK)
    draw.text((48, 68), "EcoBin Connect  ·  Multi-tier  ·  Client AI + Vercel + Cloud Run + Cloud SQL", font=f_s, fill=MUTED)
    draw.line((48, 100, W - 48, 100), fill=LINE, width=2)

    # Actors row
    actors = [
        (180, "สมาชิก", "Member"),
        (400, "Guest", "ทดลองสแกน"),
        (620, "Admin", "ผู้ดูแล"),
    ]
    for cx, t1, t2 in actors:
        box = (cx - 80, 130, cx + 80, 210)
        rounded(draw, box, GREEN_SOFT, outline=GREEN, width=2)
        multiline_center(
            draw,
            cx,
            170,
            [t1, t2],
            [f_h, f_xs],
            [GREEN_DARK, MUTED],
        )

    # Browser / Client
    browser = (120, 260, 680, 420)
    rounded(draw, browser, WHITE, outline=GREEN_DARK, width=3)
    draw.rectangle((120, 260, 680, 300), fill=GREEN_DARK)
    draw.text((140, 268), "CLIENT  ·  Browser", font=f_h, fill=WHITE)
    # inner cards
    rounded(draw, (145, 320, 390, 395), GREEN_SOFT, outline=GREEN)
    multiline_center(draw, 267, 357, ["Next.js UI", "Vercel (edge)"], [f_b, f_xs], [INK, MUTED])
    rounded(draw, (410, 320, 655, 395), (255, 247, 237), outline=AMBER)
    multiline_center(draw, 532, 357, ["AI in browser", "MobileNet + EcoBin"], [f_b, f_xs], [INK, MUTED])

    # arrows actors -> browser
    for cx, _, _ in actors:
        arrow(draw, cx, 210, cx if cx < 500 else 400, 260, GREEN)

    # Proxy / API
    api = (760, 260, 1120, 420)
    rounded(draw, api, WHITE, outline=GREEN, width=3)
    draw.rectangle((760, 260, 1120, 300), fill=GREEN)
    draw.text((780, 268), "API  ·  Cloud Run", font=f_h, fill=WHITE)
    rounded(draw, (790, 320, 1090, 395), GREEN_SOFT, outline=GREEN)
    multiline_center(draw, 940, 357, ["Go REST API", "Auth · Points · Rewards"], [f_b, f_xs], [INK, MUTED])

    # Data
    db = (1200, 260, 1500, 420)
    rounded(draw, db, WHITE, outline=(71, 85, 105), width=3)
    draw.rectangle((1200, 260, 1500, 300), fill=(51, 65, 85))
    draw.text((1220, 268), "DATA", font=f_h, fill=WHITE)
    rounded(draw, (1230, 320, 1470, 395), (241, 245, 249), outline=(148, 163, 184))
    multiline_center(draw, 1350, 357, ["Cloud SQL", "MySQL ecobin"], [f_b, f_xs], [INK, MUTED])

    # External
    ext = (760, 500, 1500, 680)
    rounded(draw, ext, WHITE, outline=AMBER, width=2)
    draw.rectangle((760, 500, 1500, 540), fill=(254, 243, 199))
    draw.text((780, 508), "EXTERNAL SERVICES", font=f_h, fill=(120, 53, 15))
    rounded(draw, (790, 565, 1080, 650), (255, 251, 235), outline=AMBER)
    multiline_center(draw, 935, 607, ["Google Identity", "OAuth / Sign-In"], [f_b, f_xs], [INK, MUTED])
    rounded(draw, (1120, 565, 1470, 650), (255, 251, 235), outline=AMBER)
    multiline_center(draw, 1295, 607, ["TGO / CMH EF", "Carbon factors"], [f_b, f_xs], [INK, MUTED])

    # Flow arrows
    arrow(draw, 680, 340, 760, 340, GREEN)  # browser -> api
    draw.text((690, 310), "/api proxy", font=f_xs, fill=MUTED)
    arrow(draw, 1120, 340, 1200, 340, GREEN)  # api -> db
    arrow(draw, 400, 420, 400, 480, AMBER)  # not used - instead browser to google
    # browser down-right to google
    draw.line((500, 420, 500, 460, 935, 460, 935, 565), fill=AMBER, width=3)
    draw.polygon([(935, 565), (928, 553), (942, 553)], fill=AMBER)
    draw.text((520, 440), "id_token", font=f_xs, fill=(180, 83, 9))
    # api to google/tgo
    arrow(draw, 940, 420, 940, 500, GREEN)
    arrow(draw, 1000, 420, 1295, 565, MUTED)

    # Foot notes
    notes = [
        "1) AI จำแนกในเบราว์เซอร์  — ไม่ส่งรูปไป classify ภายนอก",
        "2) ให้แต้มทันทีเมื่อความแม่นยำ ≥ ~80%  — Admin อ่านรายการสแกน (ไม่ต้องอนุมัติรูป)",
        "3) Frontend / Backend / DB คนละที่ deploy  — ปิดโน้ตบุ๊กได้ ระบบยังทำงาน",
    ]
    y = 720
    for n in notes:
        draw.text((48, y), n, font=f_s, fill=MUTED)
        y += 28

    # Badge
    rounded(draw, (1280, 28, 1552, 78), GREEN_DARK, radius=12)
    center_text(draw, (1280, 28, 1552, 78), "DOC-DS · Architecture", f_b, WHITE)

    img.save(OUT, "PNG", optimize=True)
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    build()
