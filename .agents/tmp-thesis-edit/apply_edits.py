# -*- coding: utf-8 -*-
"""In-place text replacements in document.xml — only change <w:t> text, never rPr/fonts."""
from __future__ import annotations

import re
import shutil
import zipfile
from pathlib import Path

UNPACKED = Path(r"d:\Jirakit_IT04\Project\ecobin-connect\.agents\tmp-thesis-edit\unpacked")
DOC_XML = UNPACKED / "word" / "document.xml"
OUT_DOCX = Path(r"d:\Jirakit_IT04\วิจัยแอปพลิเคชั่น เล่มสมบูรณ์ 09202026.docx")
REPORT = Path(r"d:\Jirakit_IT04\Project\ecobin-connect\.agents\tmp-thesis-edit\edit-report.txt")

# (old, new) — order matters; longer/more specific first
REPLACEMENTS: list[tuple[str, str]] = [
    # A — 1.4.1.2 Admin photo approve → AI list view only
    (
        "ตรวจสอบและยืนยันความถูกต้องของข้อมูลภาพถ่ายขยะขวดพลาสติก",
        "ดูรายการสแกนที่ AI ตรวจแล้ว (อ่านอย่างเดียว ไม่มีปุ่มอนุมัติหรือปฏิเสธรูป)",
    ),
    # A — add QR into rewards admin duty (same bullet, font-safe)
    (
        "จัดการข้อมูลรายการของรางวัล (เพิ่ม ลบ แก้ไขข้อมูลแคตตาล็อก)",
        "จัดการข้อมูลรายการของรางวัล (เพิ่ม ลบ แก้ไขข้อมูลแคตตาล็อก) และสแกน QR หรือรหัสรับของเพื่อยืนยันการจ่ายของรางวัล",
    ),
    # A — 1.4.2.2 camera for points
    (
        "ถ่ายภาพและอัปโหลดข้อมูลขยะประเภทขวดพลาสติกเข้าสู่ระบบ",
        "ถ่ายภาพขวดพลาสติกจากกล้องในแอปเพื่อสะสมแต้ม (การอัปโหลดจากแกลเลอรีไม่ได้แต้ม)",
    ),
    # A — 1.4.2.3 instant AI points
    (
        "รับการแจ้งเตือนผลการตรวจสอบ",
        "ได้แต้มทันทีเมื่อผลการวิเคราะห์ของ AI ผ่านเกณฑ์ประมาณร้อยละ 80 ขึ้นไป โดยไม่รอผู้ดูแลระบบตรวจ",
    ),
    # A — 1.4.3.2 Guest trial scan
    (
        "เรียกดูข้อมูลรายการของรางวัลในระบบเบื้องต้น",
        "ทดลองสแกนขวดพลาสติกได้ (กล้องหรืออัปโหลด) แต่ไม่ได้แต้มจริง และมีคำเชิญให้เข้าสู่ระบบ",
    ),
    # A — 1.6.3 points definition
    (
        "เมื่อผู้ใช้อัปโหลดภาพขวดพลาสติกเข้าสู่ระบบได้อย่างถูกต้อง",
        "เมื่อผู้ใช้ถ่ายภาพจากกล้องในแอปและโมเดลปัญญาประดิษฐ์ผ่านเกณฑ์ที่กำหนด",
    ),
    # A — 1.6.6 admin definition
    (
        "มีหน้าที่ตรวจสอบความถูกต้องของภาพถ่าย จัดการข้อมูลผู้ใช้ และดูสถิติการทิ้งขยะภาพรวม",
        "มีหน้าที่ดูรายการสแกนที่ AI ตรวจแล้ว จัดการข้อมูลผู้ใช้ แคตตาล็อกของรางวัล สแกน QR เพื่อยืนยันจ่ายของรางวัล และดูสถิติภาพรวม",
    ),
    # A — abstract / intro
    (
        "ถ่ายภาพหรืออัปโหลดภาพขวดพลาสติก",
        "ถ่ายภาพขวดพลาสติกจากกล้องในแอปเพื่อสะสมแต้ม",
    ),
    (
        "สามารถตรวจสอบภาพถ่าย จัดการบัญชีผู้ใช้และแคตตาล็อกของรางวัล รวมทั้งเรียกดูรายงานสถิติภาพรวมได้",
        "สามารถดูรายการสแกนที่ AI ตรวจแล้ว จัดการบัญชีผู้ใช้และแคตตาล็อกของรางวัล สแกน QR เพื่อยืนยันจ่ายของรางวัล รวมทั้งเรียกดูรายงานสถิติภาพรวมได้",
    ),
    # A — chapter 3 figure captions
    (
        "ภาพหน้าจอในส่วนของภาพรวมรอตรวจของ Admin",
        "ภาพหน้าจอในส่วนรายการสแกนที่ AI ตรวจแล้วของ Admin",
    ),
    (
        "ภาพหน้าจอในส่วนของภาพรวมรอตรวจ (Admin)",
        "ภาพหน้าจอในส่วนรายการสแกนที่ AI ตรวจแล้ว (Admin)",
    ),
]


def find_exact_in_xml(raw: str, plain: str) -> str | None:
    """If plain text is split only by XML tags inside, recover contiguous XML substring.
    After merge_runs most phrases are contiguous; prefer simple `in raw`.
    """
    if plain in raw:
        return plain
    return None


def replace_dfd_blocks(raw: str, log: list[str]) -> str:
    """Replace long DFD paragraphs that may contain NBSP (\\xa0)."""
    # Build from joined text so we match whatever whitespace is in the file
    texts = re.findall(r"<w:t[^>]*>([^<]*)</w:t>", raw)
    full = "".join(texts)

    blocks: list[tuple[str, str]] = []

    # Process 2.1 — status wait → AI scored / points granted when pass
    old_21_start = "กระบวนการที่ 2.1 รับภาพและวิเคราะห์ด้วย AI (สมาชิก)"
    i = full.find(old_21_start)
    if i >= 0:
        # take until next process heading
        j = full.find("3.2.4.2 กระบวนการที่ 2.2", i)
        old_21 = full[i:j] if j > i else None
        if old_21:
            new_21 = (
                "กระบวนการที่ 2.1 รับภาพและวิเคราะห์ด้วย AI (สมาชิก) "
                "สมาชิกทั่วไป นำเข้า ข้อมูลภาพถ่ายขวดพลาสติกจากกล้องในแอป เข้าสู่ระบบ "
                "ระบบจะ ดึงประเภทขวด / แต้มประมาณการ จากแหล่งเก็บข้อมูล D5 ประเภทขวด / กฎคะแนน "
                "เพื่อวิเคราะห์ด้วย AI จากนั้น บันทึกรายการขยะ (สถานะตามผล AI) ลงใน D2 ประวัติการทิ้งขยะ "
                "และหากผ่านเกณฑ์จะเพิ่มแต้มทันที พร้อมส่ง ผลวิเคราะห์ / แต้มที่ได้ กลับไปยังสมาชิกทั่วไป"
            )
            blocks.append((old_21, new_21))

    old_23_start = "กระบวนการที่ 2.3 ตรวจสอบและอนุมัติภาพ"
    i = full.find(old_23_start)
    if i >= 0:
        j = full.find("3.2.5", i)
        old_23 = full[i:j] if j > i else None
        if old_23:
            new_23 = (
                "กระบวนการที่ 2.3 ดูรายการสแกนที่ AI ตรวจแล้ว "
                "ระบบ ดึงรายการสแกนจาก D2 ประวัติการทิ้งขยะ แล้วส่ง ข้อมูลภาพและผลการวิเคราะห์ของ AI "
                "ให้ ผู้ดูแลระบบ ดูในโหมดอ่านอย่างเดียว (ไม่มีปุ่มอนุมัติหรือปฏิเสธรูป) "
                "ผู้ดูแลระบบใช้หน้านี้เพื่อติดตามคุณภาพการสแกนภาพรวม "
                "ส่วนการยืนยันจ่ายของรางวัลทำผ่านกระบวนการสแกน QR / รหัสรับของ ในกระบวนการที่ 3.3"
            )
            blocks.append((old_23, new_23))

    # Level-0 style narrative about admin verify
    old_admin = (
        "ส่วนผู้ดูแลระบบจะนำเข้าผลการตรวจสอบและยืนยันความถูกต้องของภาพถ่าย "
        "โดยประวัติการทิ้งขยะของสมาชิกทั่วไปจะถูกจัดเก็บใน D2 ข้อมูลประวัติการทิ้งขยะ "
        "ในสถานะรอการตรวจสอบ ขณะที่ผลการสแกนทดลองของ Guest จะถูกจัดเก็บใน D4 "
        "บันทึกสแกน Guest (guest_logs) ซึ่งไม่ได้แต้มจริง "
        "และเมื่อผู้ดูแลระบบอนุมัติแล้ว ระบบจึงบันทึกธุรกรรมแต้มที่เกี่ยวข้องลงใน D3"
    )
    # tolerate NBSP variants
    old_admin_flex = old_admin.replace(" ", r"[\s\xa0]+")
    m = re.search(old_admin_flex, full)
    if m:
        new_admin = (
            "ส่วนผู้ดูแลระบบดูรายการสแกนที่ AI ตรวจแล้วแบบอ่านอย่างเดียว "
            "โดยประวัติการทิ้งขยะของสมาชิกทั่วไปจะถูกจัดเก็บใน D2 ข้อมูลประวัติการทิ้งขยะ "
            "ตามผลการวิเคราะห์ของ AI ขณะที่ผลการสแกนทดลองของ Guest จะถูกจัดเก็บใน D4 "
            "บันทึกสแกน Guest (guest_logs) ซึ่งไม่ได้แต้มจริง "
            "และเมื่อสมาชิกได้แต้มจาก AI ที่ผ่านเกณฑ์ ระบบจะบันทึกธุรกรรมแต้มที่เกี่ยวข้องลงใน D3"
        )
        blocks.append((m.group(0), new_admin))

    for old, new in blocks:
        # Long blocks usually span multiple <w:t>; never pretty-print XML
        if old in raw:
            raw = raw.replace(old, new, 1)
            log.append(f"OK DFD contiguous ({len(old)}→{len(new)} chars)")
        else:
            ok = replace_spanning(raw, old, new)
            if ok is not None:
                raw = ok
                log.append(f"OK DFD spanning ({len(old)}→{len(new)} chars)")
            else:
                log.append(f"FAIL DFD block start={old[:40]!r}")
                # dump nearby for debug
                log.append(f"  joined_has={old[:20] in ''.join(re.findall(r'<w:t[^>]*>([^<]*)</w:t>', raw))}")
    return raw


def replace_spanning(raw: str, old: str, new: str) -> str | None:
    """Replace text that may be split across multiple <w:t> nodes; preserve all tags/rPr."""
    pattern = re.compile(r"<w:t([^>]*)>([^<]*)</w:t>")
    parts: list[tuple[int, int, str, str]] = []  # start, end, attrs, text
    for m in pattern.finditer(raw):
        parts.append((m.start(), m.end(), m.group(1), m.group(2)))
    joined = "".join(p[3] for p in parts)
    idx = joined.find(old)
    if idx < 0:
        return None
    end = idx + len(old)

    # Map char offsets to runs
    positions: list[tuple[int, int, int]] = []  # run_i, local_start, local_end
    cursor = 0
    for i, (_s, _e, _a, text) in enumerate(parts):
        run_start = cursor
        run_end = cursor + len(text)
        if run_end > idx and run_start < end:
            local_s = max(0, idx - run_start)
            local_e = min(len(text), end - run_start)
            positions.append((i, local_s, local_e))
        cursor = run_end
    if not positions:
        return None

    # Put entire new string in first affected run; clear others
    first_i, first_ls, _first_le = positions[0]
    last_i, _last_ls, last_le = positions[-1]
    new_parts = list(parts)
    first_text = parts[first_i][3]
    last_text = parts[last_i][3]
    if first_i == last_i:
        replaced = first_text[:first_ls] + new + first_text[last_le:]
        s, e, a, _ = new_parts[first_i]
        new_parts[first_i] = (s, e, a, replaced)
    else:
        prefix = first_text[:first_ls]
        suffix = last_text[last_le:]
        s, e, a, _ = new_parts[first_i]
        new_parts[first_i] = (s, e, a, prefix + new)
        for mid_i, _ls, _le in positions[1:-1]:
            s, e, a, _ = new_parts[mid_i]
            new_parts[mid_i] = (s, e, a, "")
        s, e, a, _ = new_parts[last_i]
        new_parts[last_i] = (s, e, a, suffix)

    # Rebuild raw from end to start so offsets stay valid
    out = raw
    for i in sorted({p[0] for p in positions}, reverse=True):
        s, e, a, text = new_parts[i]
        # Preserve xml:space if needed
        if text and (text[0].isspace() or text[-1].isspace()) and "xml:space" not in a:
            a = a + ' xml:space="preserve"' if not a.startswith(" ") else a + ' xml:space="preserve"'
            # attrs already may start with space from regex group
            if not a.startswith(" ") and a:
                a = " " + a.lstrip()
        piece = f"<w:t{a}>{_xml_escape(text)}</w:t>"
        out = out[:s] + piece + out[e:]
    return out


def _xml_escape(text: str) -> str:
    return (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )


def apply_simple(raw: str, log: list[str]) -> str:
    for old, new in REPLACEMENTS:
        count = raw.count(old)
        if count == 0:
            # try spanning
            result = replace_spanning(raw, old, new)
            if result is not None:
                raw = result
                log.append(f"OK spanning: {old[:36]}…")
            else:
                log.append(f"MISS: {old[:36]}…")
            continue
        raw = raw.replace(old, new)
        log.append(f"OK x{count}: {old[:36]}… → {new[:36]}…")
    return raw


def repack(docx_path: Path) -> None:
    tmp = docx_path.with_name(docx_path.stem + ".partial.zip")
    if tmp.exists():
        tmp.unlink()
    with zipfile.ZipFile(tmp, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for path in sorted(UNPACKED.rglob("*")):
            if path.is_file():
                arc = path.relative_to(UNPACKED).as_posix()
                zf.write(path, arcname=arc)
    try:
        if docx_path.exists():
            docx_path.unlink()
        shutil.move(str(tmp), str(docx_path))
    except PermissionError:
        alt = docx_path.with_name(docx_path.stem + "_updated.docx")
        if alt.exists():
            try:
                alt.unlink()
            except PermissionError:
                alt = docx_path.with_name(docx_path.stem + "_updated2.docx")
        shutil.move(str(tmp), str(alt))
        print("LOCKED original; wrote", alt)
        return
    print("wrote", docx_path)


def main() -> None:
    raw = DOC_XML.read_text(encoding="utf-8")
    # Re-extract from backup if this run is a retry after partial apply
    log: list[str] = []
    # Detect already-applied marker
    if "ดูรายการสแกนที่ AI ตรวจแล้ว (อ่านอย่างเดียว ไม่มีปุ่มอนุมัติหรือปฏิเสธรูป)" in raw:
        log.append("NOTE: simple A edits already present in document.xml")
    else:
        raw = apply_simple(raw, log)
        DOC_XML.write_text(raw, encoding="utf-8")
        raw = DOC_XML.read_text(encoding="utf-8")

    if "กระบวนการที่ 2.3 ดูรายการสแกนที่ AI ตรวจแล้ว" in "".join(
        re.findall(r"<w:t[^>]*>([^<]*)</w:t>", raw)
    ):
        log.append("NOTE: DFD 2.3 already updated")
    else:
        raw = replace_dfd_blocks(raw, log)
        DOC_XML.write_text(raw, encoding="utf-8")

    REPORT.write_text("\n".join(log), encoding="utf-8")
    repack(OUT_DOCX)
    print("report", REPORT)


if __name__ == "__main__":
    main()
