# -*- coding: utf-8 -*-
"""Build EcoBin Connect thesis defense presentation from thesis content."""
from pathlib import Path

from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.oxml.ns import nsmap
from pptx.oxml import parse_xml
from pptx.util import Inches, Pt, Emu

OUT = Path(__file__).resolve().parent / "EcoBin-Connect-พรีเซนต์เล่มวิจัย.pptx"

# Brand (from docs/design/ui.html)
GREEN_DARK = RGBColor(0x16, 0x33, 0x2C)
GREEN = RGBColor(0x0D, 0x7A, 0x66)
GREEN_MID = RGBColor(0x05, 0x96, 0x69)
GREEN_LIGHT = RGBColor(0xED, 0xF5, 0xF1)
GREEN_PALE = RGBColor(0xDC, 0xEE, 0xE6)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
INK = RGBColor(0x0F, 0x17, 0x2A)
MUTED = RGBColor(0x64, 0x74, 0x8B)
CARD = RGBColor(0xF8, 0xFA, 0xFC)
ACCENT_LINE = RGBColor(0x0B, 0x5C, 0x4D)

SLIDE_W = Inches(13.333)
SLIDE_H = Inches(7.5)


def set_run(run, size=18, bold=False, color=INK, font="Sarabun"):
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.color.rgb = color
    run.font.name = font
    # East Asian / Thai fallback
    rPr = run._r.get_or_add_rPr()
    # Ensure ea font for Thai
    from pptx.oxml.ns import qn
    ea = rPr.find(qn("a:ea"))
    if ea is None:
        ea = parse_xml(f'<a:ea xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" typeface="{font}"/>')
        rPr.append(ea)
    else:
        ea.set("typeface", font)


def add_text(tf, text, size=18, bold=False, color=INK, align=PP_ALIGN.LEFT, space_after=6):
    p = tf.paragraphs[0] if not tf.paragraphs[0].text else tf.add_paragraph()
    if not tf.paragraphs[0].text and tf.paragraphs[0] is p:
        pass
    else:
        if tf.paragraphs[0].text == "" and len(tf.paragraphs) == 1:
            p = tf.paragraphs[0]
        elif tf.paragraphs[0].text and p is tf.paragraphs[0]:
            p = tf.add_paragraph()
    p.clear()
    run = p.add_run()
    run.text = text
    set_run(run, size=size, bold=bold, color=color)
    p.alignment = align
    p.space_after = Pt(space_after)
    p.space_before = Pt(0)
    return p


def write_block(shape, lines, default_size=18, default_color=INK):
    """lines: list of str or (text, size, bold, color)"""
    tf = shape.text_frame
    tf.word_wrap = True
    tf.clear()
    first = True
    for item in lines:
        if isinstance(item, str):
            text, size, bold, color = item, default_size, False, default_color
        else:
            text = item[0]
            size = item[1] if len(item) > 1 else default_size
            bold = item[2] if len(item) > 2 else False
            color = item[3] if len(item) > 3 else default_color
        if first:
            p = tf.paragraphs[0]
            p.clear()
            first = False
        else:
            p = tf.add_paragraph()
        run = p.add_run()
        run.text = text
        set_run(run, size=size, bold=bold, color=color)
        p.space_after = Pt(8)
        p.space_before = Pt(0)


def rect(slide, left, top, width, height, fill):
    s = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, left, top, width, height)
    s.fill.solid()
    s.fill.fore_color.rgb = fill
    s.line.fill.background()
    return s


def round_rect(slide, left, top, width, height, fill):
    s = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
    s.fill.solid()
    s.fill.fore_color.rgb = fill
    s.line.fill.background()
    return s


def textbox(slide, left, top, width, height):
    return slide.shapes.add_textbox(left, top, width, height)


def footer(slide, page, total=14):
    tb = textbox(slide, Inches(0.5), Inches(7.1), Inches(10), Inches(0.3))
    write_block(tb, [("EcoBin Connect  ·  มหาวิทยาลัยราชภัฏเพชรบูรณ์", 11, False, MUTED)])
    tb2 = textbox(slide, Inches(11.5), Inches(7.1), Inches(1.5), Inches(0.3))
    write_block(tb2, [(f"{page} / {total}", 11, False, MUTED)])
    # align right manually via paragraph
    tb2.text_frame.paragraphs[0].alignment = PP_ALIGN.RIGHT


def header_bar(slide, title, subtitle=None):
    rect(slide, 0, 0, SLIDE_W, Inches(0.08), GREEN)
    rect(slide, 0, 0, Inches(0.18), SLIDE_H, GREEN_DARK)
    tb = textbox(slide, Inches(0.55), Inches(0.28), Inches(12), Inches(0.55))
    write_block(tb, [(title, 28, True, GREEN_DARK)])
    if subtitle:
        tb2 = textbox(slide, Inches(0.55), Inches(0.78), Inches(12), Inches(0.35))
        write_block(tb2, [(subtitle, 14, False, MUTED)])


def blank_content_slide(prs):
    layout = prs.slide_layouts[6]  # blank
    return prs.slides.add_slide(layout)


def add_bullets(slide, left, top, width, height, items, size=16):
    tb = textbox(slide, left, top, width, height)
    lines = []
    for it in items:
        if isinstance(it, tuple):
            lines.append(it)
        else:
            lines.append((f"•  {it}", size, False, INK))
    write_block(tb, lines, default_size=size)
    return tb


def build():
    prs = Presentation()
    prs.slide_width = SLIDE_W
    prs.slide_height = SLIDE_H
    total = 14

    # ========== 1 Cover ==========
    s = blank_content_slide(prs)
    rect(s, 0, 0, SLIDE_W, SLIDE_H, GREEN_DARK)
    # accent band
    rect(s, 0, Inches(5.55), SLIDE_W, Inches(1.95), GREEN)
    tb = textbox(s, Inches(0.8), Inches(1.1), Inches(11.5), Inches(0.4))
    write_block(tb, [("โครงงานวิจัย / ปริญญานิพนธ์  ·  ปีการศึกษา 2568", 14, False, GREEN_PALE)])
    tb = textbox(s, Inches(0.8), Inches(1.7), Inches(11.5), Inches(1.6))
    write_block(
        tb,
        [
            ("EcoBin Connect", 44, True, WHITE),
            ("เว็บแอปพลิเคชันต้นแบบสำหรับบริหารจัดการข้อมูล", 22, False, GREEN_PALE),
            ("การคัดแยกขยะประเภทขวดพลาสติก", 22, False, GREEN_PALE),
        ],
    )
    tb = textbox(s, Inches(0.8), Inches(4.0), Inches(11.5), Inches(1.2))
    write_block(
        tb,
        [
            ("กรณีศึกษา  มหาวิทยาลัยราชภัฏเพชรบูรณ์", 16, False, GREEN_LIGHT),
            ("คณะวิทยาศาสตร์และเทคโนโลยี  ·  สาขาวิชาเทคโนโลยีสารสนเทศ", 14, False, GREEN_PALE),
        ],
    )
    tb = textbox(s, Inches(0.8), Inches(5.75), Inches(7), Inches(1.4))
    write_block(
        tb,
        [
            ("นำเสนอโดย", 12, False, GREEN_PALE),
            ("นายจิรกิตติ์ ตันตระกูล", 18, True, WHITE),
            ("อาจารย์ที่ปรึกษา  ผศ.ศรัญญา ตรีทศ", 14, False, WHITE),
        ],
    )

    # ========== 2 Outline ==========
    s = blank_content_slide(prs)
    header_bar(s, "โครงเรื่องการนำเสนอ", "Agenda")
    items = [
        "1  ความสำคัญและที่มาของปัญหา",
        "2  วัตถุประสงค์ของโครงการวิจัย",
        "3  ขอบเขตระบบและกลุ่มผู้ใช้",
        "4  ประโยชน์ที่คาดว่าจะได้รับ",
        "5  ทฤษฎีและงานวิจัยที่เกี่ยวข้อง (สรุป)",
        "6  วิธีการดำเนินงานวิจัย",
        "7  สถาปัตยกรรมและเทคโนโลยี",
        "8  การวิเคราะห์และออกแบบระบบ",
        "9  ผลลัพธ์ต้นแบบและสรุป",
    ]
    cols = [items[:5], items[5:]]
    for i, col in enumerate(cols):
        card = round_rect(s, Inches(0.55 + i * 6.2), Inches(1.35), Inches(5.9), Inches(5.2), GREEN_LIGHT)
        add_bullets(s, Inches(0.85 + i * 6.2), Inches(1.6), Inches(5.4), Inches(4.7), col, size=18)
    footer(s, 2, total)

    # ========== 3 Problem ==========
    s = blank_content_slide(prs)
    header_bar(s, "ความสำคัญและที่มาของปัญหา", "บทที่ 1  ·  บทนำ")
    problems = [
        ("ขาดการคัดแยกตั้งแต่ต้นทาง", "การทิ้งขยะยังไม่เป็นระบบ ส่งผลต่อสิ่งแวดล้อมและสุขภาพ"),
        ("ไม่มีฐานข้อมูลสถิติ", "ผู้ดูแลไม่ทราบปริมาณและประเภทขยะจริงในพื้นที่"),
        ("ขาดแรงจูงใจ", "ผู้ใช้ไม่มีแรงกระตุ้นให้ปรับพฤติกรรมอย่างต่อเนื่อง"),
        ("เก็บข้อมูลแบบดั้งเดิม", "ยุ่งยาก ตรวจสอบหลักฐานได้ยาก และเสี่ยงสูญหาย"),
    ]
    for i, (t, d) in enumerate(problems):
        x = Inches(0.55 + (i % 2) * 6.3)
        y = Inches(1.35 + (i // 2) * 2.5)
        round_rect(s, x, y, Inches(6.0), Inches(2.2), GREEN_LIGHT)
        rect(s, x, y, Inches(0.12), Inches(2.2), GREEN)
        tb = textbox(s, x + Inches(0.35), y + Inches(0.35), Inches(5.4), Inches(1.6))
        write_block(tb, [(t, 18, True, GREEN_DARK), (d, 15, False, INK)])
    footer(s, 3, total)

    # ========== 4 Solution hook ==========
    s = blank_content_slide(prs)
    header_bar(s, "แนวทางแก้ปัญหา  ·  EcoBin Connect", "เว็บแอปพลิเคชันต้นแบบบนสมาร์ตโฟน")
    add_bullets(
        s,
        Inches(0.55),
        Inches(1.4),
        Inches(12.2),
        Inches(5.2),
        [
            "ใช้กล้องสมาร์ตโฟนถ่ายภาพขวดพลาสติกเข้าสู่ระบบ",
            "ระบบช่วยตรวจสอบประเภทขยะ และบันทึกสถิติ",
            "มอบแต้มสะสมเพื่อสร้างแรงจูงใจในการคัดแยก",
            "มีแคตตาล็อกของรางวัลและการแลกของรางวัล",
            "ผู้ดูแลเรียกดูรายงานภาพรวมเพื่อวางแผนจัดการขยะ",
            "สนับสนุนนโยบาย Green University ของมหาวิทยาลัย",
        ],
        size=18,
    )
    footer(s, 4, total)

    # ========== 5 Objectives ==========
    s = blank_content_slide(prs)
    header_bar(s, "วัตถุประสงค์ของโครงการวิจัย", "ข้อ 1.2")
    objs = [
        ("01", "พัฒนาเว็บแอปพลิเคชันต้นแบบ", "สำหรับบริหารจัดการข้อมูลขยะประเภทขวดพลาสติก ใช้งานได้บน Android และ iOS (ผ่านเบราว์เซอร์)"),
        ("02", "ประเมินประสิทธิภาพของระบบ", "ด้านการจัดเก็บข้อมูลการคัดแยกขยะ และการประมวลผลค่าคาร์บอนฟุตพริ้นท์"),
        ("03", "ศึกษาความพึงพอใจของผู้ใช้", "ด้านความสะดวกในการใช้งาน และการส่งเสริมความตระหนักรู้ด้านสิ่งแวดล้อม"),
    ]
    for i, (num, title, desc) in enumerate(objs):
        y = Inches(1.35 + i * 1.7)
        round_rect(s, Inches(0.55), y, Inches(12.2), Inches(1.5), GREEN_LIGHT)
        circle = s.shapes.add_shape(MSO_SHAPE.OVAL, Inches(0.85), y + Inches(0.35), Inches(0.8), Inches(0.8))
        circle.fill.solid()
        circle.fill.fore_color.rgb = GREEN_DARK
        circle.line.fill.background()
        nt = textbox(s, Inches(0.85), y + Inches(0.5), Inches(0.8), Inches(0.5))
        write_block(nt, [(num, 16, True, WHITE)])
        nt.text_frame.paragraphs[0].alignment = PP_ALIGN.CENTER
        tb = textbox(s, Inches(1.95), y + Inches(0.3), Inches(10.3), Inches(1.1))
        write_block(tb, [(title, 20, True, GREEN_DARK), (desc, 15, False, INK)])
    footer(s, 5, total)

    # ========== 6 Scope users ==========
    s = blank_content_slide(prs)
    header_bar(s, "ขอบเขตระบบตามกลุ่มผู้ใช้", "ข้อ 1.3 / 1.4")
    roles = [
        (
            "ผู้ดูแลระบบ",
            [
                "จัดการบัญชีผู้ใช้",
                "ตรวจสอบข้อมูลภาพถ่ายขยะ",
                "จัดการแคตตาล็อกของรางวัล",
                "ดูรายงานสถิติภาพรวม",
                "สแกน QR ยืนยันรับของ",
            ],
        ),
        (
            "สมาชิกทั่วไป",
            [
                "สมัคร / เข้าสู่ระบบ",
                "ถ่ายภาพขวดพลาสติก",
                "ดูสถิติและแต้มสะสม",
                "แลกของรางวัล",
                "ติดตามประวัติการคัดแยก",
            ],
        ),
        (
            "ผู้ใช้ไม่ลงทะเบียน",
            [
                "เข้าใช้โดยไม่สมัคร",
                "ดูรายการของรางวัลเบื้องต้น",
                "สแกนทดลองได้",
                "(ไม่ได้แต้มจริง)",
            ],
        ),
    ]
    for i, (title, bullets) in enumerate(roles):
        x = Inches(0.45 + i * 4.25)
        round_rect(s, x, Inches(1.3), Inches(4.05), Inches(5.3), GREEN_LIGHT)
        rect(s, x, Inches(1.3), Inches(4.05), Inches(0.7), GREEN_DARK)
        ht = textbox(s, x + Inches(0.2), Inches(1.4), Inches(3.65), Inches(0.5))
        write_block(ht, [(title, 18, True, WHITE)])
        ht.text_frame.paragraphs[0].alignment = PP_ALIGN.CENTER
        add_bullets(s, x + Inches(0.25), Inches(2.2), Inches(3.55), Inches(4.1), bullets, size=15)
    footer(s, 6, total)

    # ========== 7 Benefits ==========
    s = blank_content_slide(prs)
    header_bar(s, "ประโยชน์ที่คาดว่าจะได้รับ", "ข้อ 1.7")
    left = [
        ("ต่อองค์กรและชุมชน", 18, True, GREEN_DARK),
        ("•  บันทึกและเรียกดูสถิติการคัดแยกได้ง่าย", 16, False, INK),
        ("•  สร้างแรงจูงใจผ่านแต้มและของรางวัล", 16, False, INK),
        ("•  ช่วยวางแผนจัดเก็บขยะด้วยข้อมูลจริง", 16, False, INK),
        ("•  สนับสนุนนโยบาย Green University", 16, False, INK),
    ]
    right = [
        ("ต่อผู้พัฒนา", 18, True, GREEN_DARK),
        ("•  พัฒนาทักษะเว็บแอป (TypeScript / Go)", 16, False, INK),
        ("•  ฝึกวิเคราะห์และออกแบบระบบ UI/UX", 16, False, INK),
        ("•  จัดการฐานข้อมูลบนคลาวด์", 16, False, INK),
        ("•  Deploy จริงบน Vercel + Cloud Run", 16, False, INK),
    ]
    round_rect(s, Inches(0.55), Inches(1.35), Inches(6.0), Inches(5.2), GREEN_LIGHT)
    round_rect(s, Inches(6.8), Inches(1.35), Inches(6.0), Inches(5.2), GREEN_LIGHT)
    add_bullets(s, Inches(0.85), Inches(1.6), Inches(5.5), Inches(4.7), left, size=16)
    add_bullets(s, Inches(7.1), Inches(1.6), Inches(5.5), Inches(4.7), right, size=16)
    footer(s, 7, total)

    # ========== 8 Theory ==========
    s = blank_content_slide(prs)
    header_bar(s, "ทฤษฎีที่เกี่ยวข้อง (สรุป)", "บทที่ 2")
    theories = [
        ("การจำแนกพลาสติก", "สัญลักษณ์รีไซเคิล 1–7 โดยเน้น PET / HDPE สำหรับขวดพลาสติก"),
        ("หลัก 3Rs", "Reduce · Reuse · Recycle สอดคล้องนโยบายมหาวิทยาลัยสีเขียว"),
        ("Carbon Footprint", "ประเมินผลกระทบจากการคัดแยกและลดของเสีย"),
        ("SDLC", "วงจรพัฒนาระบบ 7 ขั้นตอน ตั้งแต่ค้นหาปัญหาถึงบำรุงรักษา"),
        ("DFD / ER", "แบบจำลองการไหลของข้อมูลและความสัมพันธ์ฐานข้อมูล"),
        ("สารสนเทศ", "แปลงข้อมูลการทิ้งขยะเป็นรายงานเพื่อการตัดสินใจ"),
    ]
    for i, (t, d) in enumerate(theories):
        x = Inches(0.55 + (i % 3) * 4.2)
        y = Inches(1.35 + (i // 3) * 2.55)
        round_rect(s, x, y, Inches(4.0), Inches(2.3), GREEN_LIGHT)
        tb = textbox(s, x + Inches(0.25), y + Inches(0.35), Inches(3.5), Inches(1.7))
        write_block(tb, [(t, 17, True, GREEN_DARK), (d, 14, False, INK)])
    footer(s, 8, total)

    # ========== 9 Method ==========
    s = blank_content_slide(prs)
    header_bar(s, "วิธีการดำเนินงานวิจัย", "บทที่ 3")
    steps = [
        ("1", "ศึกษาปัญหา\nและความต้องการ"),
        ("2", "วิเคราะห์ระบบ\n(Context / DFD)"),
        ("3", "ออกแบบระบบ\nสถาปัตยกรรม · DB"),
        ("4", "พัฒนาและทดสอบ\nต้นแบบ"),
        ("5", "ประเมินผล\nและสรุป"),
    ]
    for i, (n, label) in enumerate(steps):
        x = Inches(0.45 + i * 2.55)
        ov = s.shapes.add_shape(MSO_SHAPE.OVAL, x + Inches(0.7), Inches(1.7), Inches(0.9), Inches(0.9))
        ov.fill.solid()
        ov.fill.fore_color.rgb = GREEN_DARK
        ov.line.fill.background()
        nt = textbox(s, x + Inches(0.7), Inches(1.9), Inches(0.9), Inches(0.5))
        write_block(nt, [(n, 22, True, WHITE)])
        nt.text_frame.paragraphs[0].alignment = PP_ALIGN.CENTER
        if i < len(steps) - 1:
            line = rect(s, x + Inches(1.7), Inches(2.1), Inches(1.4), Inches(0.06), GREEN)
        card = round_rect(s, x, Inches(2.9), Inches(2.4), Inches(2.4), GREEN_LIGHT)
        tb = textbox(s, x + Inches(0.15), Inches(3.3), Inches(2.1), Inches(1.8))
        write_block(tb, [(label, 14, True, GREEN_DARK)])
        tb.text_frame.paragraphs[0].alignment = PP_ALIGN.CENTER
    note = textbox(s, Inches(0.55), Inches(5.6), Inches(12.2), Inches(1.0))
    write_block(
        note,
        [
            ("ระยะเวลาดำเนินงาน: พฤศจิกายน 2568 – ตุลาคม 2569", 14, False, MUTED),
            ("กรณีศึกษา: มหาวิทยาลัยราชภัฏเพชรบูรณ์  ·  ทดสอบบนสมาร์ตโฟน POCO X6 PRO", 14, False, MUTED),
        ],
    )
    footer(s, 9, total)

    # ========== 10 Architecture ==========
    s = blank_content_slide(prs)
    header_bar(s, "สถาปัตยกรรมและเทคโนโลยี", "Multi-tier  ·  ข้อ 3.3.1 / 1.4.2")
    layers = [
        ("Presentation", "Next.js (React)\nTailwind CSS\nVercel", "หน้าจอ Member / Guest / Admin\nGoogle Sign-In"),
        ("API / Business", "Go (Golang)\nREST API\nCloud Run", "ธุรกิจแต้ม · รางวัล · รายงาน\nเชื่อมฐานข้อมูล"),
        ("Data", "MySQL\nCloud SQL", "ผู้ใช้ · ประวัติสแกน\nแต้ม · ของรางวัล"),
    ]
    for i, (name, tech, desc) in enumerate(layers):
        x = Inches(0.55 + i * 4.2)
        round_rect(s, x, Inches(1.35), Inches(4.0), Inches(5.2), GREEN_LIGHT)
        rect(s, x, Inches(1.35), Inches(4.0), Inches(0.75), GREEN_DARK)
        ht = textbox(s, x + Inches(0.2), Inches(1.48), Inches(3.6), Inches(0.5))
        write_block(ht, [(name, 18, True, WHITE)])
        ht.text_frame.paragraphs[0].alignment = PP_ALIGN.CENTER
        tb = textbox(s, x + Inches(0.3), Inches(2.4), Inches(3.4), Inches(3.8))
        write_block(
            tb,
            [
                (tech, 16, True, GREEN_DARK),
                ("", 8),
                (desc, 14, False, INK),
            ],
        )
    footer(s, 10, total)

    # ========== 11 DFD ==========
    s = blank_content_slide(prs)
    header_bar(s, "กระบวนการหลักของระบบ (DFD Level 0)", "บทที่ 3  ·  4 กระบวนการ")
    procs = [
        ("1.0", "จัดการสมาชิก\nและการเข้าสู่ระบบ", "สมัคร · Login · โปรไฟล์"),
        ("2.0", "รับภาพถ่าย\nวิเคราะห์ด้วย AI", "สแกนขวด · Guest ทดลอง"),
        ("3.0", "แต้ม · ของรางวัล\nและการแลก", "แลกของ · สแกน QR รับของ"),
        ("4.0", "สถิติและรายงาน", "แดชบอร์ดสมาชิก · รายงาน Admin"),
    ]
    for i, (code, title, desc) in enumerate(procs):
        x = Inches(0.45 + i * 3.2)
        round_rect(s, x, Inches(1.4), Inches(3.05), Inches(4.6), GREEN_LIGHT)
        rect(s, x, Inches(1.4), Inches(3.05), Inches(0.9), GREEN)
        ct = textbox(s, x + Inches(0.15), Inches(1.55), Inches(2.75), Inches(0.6))
        write_block(ct, [(code, 26, True, WHITE)])
        ct.text_frame.paragraphs[0].alignment = PP_ALIGN.CENTER
        tb = textbox(s, x + Inches(0.2), Inches(2.55), Inches(2.65), Inches(3.1))
        write_block(tb, [(title, 16, True, GREEN_DARK), ("", 6), (desc, 13, False, INK)])
        tb.text_frame.paragraphs[0].alignment = PP_ALIGN.CENTER
    footer(s, 11, total)

    # ========== 12 Features flow ==========
    s = blank_content_slide(prs)
    header_bar(s, "เส้นทางผู้ใช้หลัก", "Member journey สรุป")
    flow = [
        "เข้าสู่ระบบ",
        "ถ่ายภาพขวด",
        "ได้แต้มสะสม",
        "ดูสถิติ",
        "แลกรางวัล",
        "รับของ (QR)",
    ]
    for i, label in enumerate(flow):
        x = Inches(0.4 + i * 2.15)
        round_rect(s, x, Inches(2.2), Inches(1.95), Inches(1.5), GREEN_DARK if i % 2 == 0 else GREEN)
        tb = textbox(s, x + Inches(0.1), Inches(2.6), Inches(1.75), Inches(0.9))
        write_block(tb, [(label, 15, True, WHITE)])
        tb.text_frame.paragraphs[0].alignment = PP_ALIGN.CENTER
        if i < len(flow) - 1:
            ar = textbox(s, x + Inches(1.85), Inches(2.65), Inches(0.35), Inches(0.5))
            write_block(ar, [("→", 22, True, GREEN_DARK)])
    extras = [
        "Guest: สแกนทดลองได้ แต่ไม่ได้แต้มจริง — ชวนสมัครสมาชิก",
        "Admin: ดูรายการสแกน / จัดการของรางวัล / สแกน QR ยืนยันรับของ / รายงานภาพรวม",
        "จุดเด่น: ใช้งานผ่านสมาร์ตโฟน · บันทึกหลักฐานด้วยภาพ · แรงจูงใจด้วยแต้ม",
    ]
    add_bullets(s, Inches(0.55), Inches(4.2), Inches(12.2), Inches(2.4), extras, size=16)
    footer(s, 12, total)

    # ========== 13 Results ==========
    s = blank_content_slide(prs)
    header_bar(s, "ผลลัพธ์จากการพัฒนา", "จากบทคัดย่อและบทที่ 3")
    results = [
        ("ต้นแบบพร้อมใช้", "ได้เว็บแอปพลิเคชัน EcoBin Connect ที่บันทึกและติดตามการคัดแยกขวดพลาสติกได้เป็นระบบ"),
        ("แรงจูงใจชัดเจน", "ระบบแต้มสะสม + แลกของรางวัล กระตุ้นการมีส่วนร่วมอย่างต่อเนื่อง"),
        ("ข้อมูลเพื่อการบริหาร", "ผู้ดูแลมีรายงานสถิติและฐานข้อมูลเชิงประจักษ์สำหรับวางแผน"),
        ("สอดคล้องนโยบาย", "สนับสนุน Green University และการลดของเสียตามหลัก 3Rs"),
        ("ทักษะผู้พัฒนา", "ครบวงจร วิเคราะห์ · ออกแบบ · พัฒนา · Deploy บนคลาวด์"),
        ("เข้าถึงได้ทุกที่", "รันบนเบราว์เซอร์มือถือ Android / iOS ผ่านอินเทอร์เน็ต"),
    ]
    for i, (t, d) in enumerate(results):
        x = Inches(0.55 + (i % 3) * 4.2)
        y = Inches(1.35 + (i // 3) * 2.55)
        round_rect(s, x, y, Inches(4.0), Inches(2.3), GREEN_LIGHT)
        tb = textbox(s, x + Inches(0.25), y + Inches(0.35), Inches(3.5), Inches(1.7))
        write_block(tb, [(t, 17, True, GREEN_DARK), (d, 14, False, INK)])
    footer(s, 13, total)

    # ========== 14 Closing ==========
    s = blank_content_slide(prs)
    rect(s, 0, 0, SLIDE_W, SLIDE_H, GREEN_DARK)
    rect(s, 0, Inches(5.8), SLIDE_W, Inches(1.7), GREEN)
    tb = textbox(s, Inches(0.8), Inches(2.0), Inches(11.7), Inches(2.5))
    write_block(
        tb,
        [
            ("ขอบคุณครับ", 48, True, WHITE),
            ("พร้อมรับคำถามและข้อเสนอแนะ", 22, False, GREEN_PALE),
        ],
    )
    tb.text_frame.paragraphs[0].alignment = PP_ALIGN.CENTER
    tb.text_frame.paragraphs[1].alignment = PP_ALIGN.CENTER
    tb = textbox(s, Inches(0.8), Inches(6.05), Inches(11.7), Inches(1.2))
    write_block(
        tb,
        [
            ("EcoBin Connect  ·  มหาวิทยาลัยราชภัฏเพชรบูรณ์", 16, True, WHITE),
            ("นายจิรกิตติ์ ตันตระกูล  ·  อาจารย์ที่ปรึกษา ผศ.ศรัญญา ตรีทศ", 14, False, GREEN_PALE),
        ],
    )
    for p in tb.text_frame.paragraphs:
        p.alignment = PP_ALIGN.CENTER

    prs.save(OUT)
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    build()
