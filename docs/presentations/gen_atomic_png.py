# -*- coding: utf-8 -*-
"""Atomic Design hierarchy diagram for EcoBin slides."""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parent / "assets" / "atomic-hierarchy.png"
OUT.parent.mkdir(parents=True, exist_ok=True)

W, H = 1400, 780
BG = (250, 252, 251)
INK = (15, 23, 42)
MUTED = (100, 116, 139)
GREEN_DARK = (22, 51, 44)
GREEN = (13, 122, 102)
GREEN_SOFT = (237, 245, 241)
AMBER = (245, 158, 11)
PURPLE = (91, 75, 182)
WHITE = (255, 255, 255)
LINE = (203, 213, 225)


def font(size):
    for p in [
        r"C:\Windows\Fonts\segoeui.ttf",
        r"C:\Windows\Fonts\arial.ttf",
        r"C:\Windows\Fonts\tahoma.ttf",
    ]:
        try:
            return ImageFont.truetype(p, size)
        except OSError:
            pass
    return ImageFont.load_default()


def build():
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    f_t = font(28)
    f_h = font(20)
    f_b = font(15)
    f_s = font(13)

    d.text((48, 28), "ATOMIC DESIGN", font=f_t, fill=GREEN_DARK)
    d.text((48, 68), "Pattern library  ·  DOC-DS-002  ·  Atom → Molecule → Organism", font=f_s, fill=MUTED)
    d.line((48, 100, W - 48, 100), fill=LINE, width=2)

    levels = [
        {
            "y": 140,
            "h": 150,
            "title": "ATOMS",
            "sub": "พื้นฐานเล็กที่สุด",
            "items": "สี · ฟอนต์ · ไอคอน · ปุ่ม · Input · Radio",
            "fill": GREEN_SOFT,
            "bar": GREEN_DARK,
            "example": "Primary button / Icons / Typography scale",
        },
        {
            "y": 320,
            "h": 170,
            "title": "MOLECULES",
            "sub": "รวม Atom เป็นชิ้นใช้งาน",
            "items": "Brand lockup · Points chip · Nav pills · Form field · AI result chip",
            "fill": (236, 253, 245),
            "bar": GREEN,
            "example": "Points chip = icon + number + label",
        },
        {
            "y": 520,
            "h": 200,
            "title": "ORGANISMS",
            "sub": "บล็อกหน้าจอที่ใช้งานได้จริง",
            "items": "App header · Dashboard hero · KPI strip · Scanner · Reward cards · Admin table · Redeem modal",
            "fill": (238, 242, 255),
            "bar": PURPLE,
            "example": "Scanner module = preview + AI chip + Confirm CTA",
        },
    ]

    for lv in levels:
        y, h = lv["y"], lv["h"]
        d.rounded_rectangle((48, y, W - 48, y + h), radius=20, fill=lv["fill"], outline=lv["bar"], width=3)
        d.rounded_rectangle((48, y, 280, y + h), radius=20, fill=lv["bar"])
        # fix right corners of left badge - redraw bar as rect for left portion
        d.rectangle((120, y, 280, y + h), fill=lv["bar"])
        # title on bar
        bbox = d.textbbox((0, 0), lv["title"], font=f_h)
        tw = bbox[2] - bbox[0]
        d.text((48 + (232 - tw) / 2, y + h / 2 - 28), lv["title"], font=f_h, fill=WHITE)
        bbox2 = d.textbbox((0, 0), lv["sub"], font=f_s)
        tw2 = bbox2[2] - bbox2[0]
        d.text((48 + (232 - tw2) / 2, y + h / 2 + 8), lv["sub"], font=f_s, fill=(220, 230, 225))

        d.text((310, y + 28), lv["items"], font=f_b, fill=INK)
        d.text((310, y + 70), lv["example"], font=f_s, fill=MUTED)

        # arrow between levels
        if lv is not levels[-1]:
            ay = y + h + 8
            d.polygon([(W // 2, ay + 18), (W // 2 - 14, ay), (W // 2 + 14, ay)], fill=AMBER)

    img.save(OUT, "PNG", optimize=True)
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    build()
