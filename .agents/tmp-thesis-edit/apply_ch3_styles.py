# -*- coding: utf-8 -*-
"""Set Heading styles for Chapter 3 top sections only (3.1–3.5)."""
import re
import shutil
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

NS = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"

desktop = Path(r"c:\Users\Lenovo\OneDrive\Desktop")
src = next(p for p in desktop.glob("*.docx") if "สำรอง" in p.name and "backup" not in p.name)
work_dir = Path(r"d:\Jirakit_IT04\Project\ecobin-connect\.agents\tmp-thesis-edit\unpacked-toc")
work_docx = Path(r"d:\Jirakit_IT04\Project\ecobin-connect\.agents\tmp-thesis-edit\toc-ch3-work.docx")
log_path = Path(r"d:\Jirakit_IT04\Project\ecobin-connect\.agents\tmp-thesis-edit\toc-ch3-log.txt")

shutil.copy2(src, work_docx)
if work_dir.exists():
    shutil.rmtree(work_dir)
work_dir.mkdir(parents=True)

with zipfile.ZipFile(work_docx, "r") as z:
    z.extractall(work_dir)

# strip any symlinks
for p in work_dir.rglob("*"):
    if p.is_symlink():
        p.unlink()

doc_path = work_dir / "word" / "document.xml"
# Register namespaces to preserve prefixes better - still may rewrite ns
ET.register_namespace("w", NS["w"])
# keep other common namespaces from file
raw = doc_path.read_bytes()
# parse preserving default
root = ET.fromstring(raw)

# Collect namespaces from root
for k, v in root.attrib.items():
    if k.startswith("{http://www.w3.org/2000/xmlns/}"):
        prefix = k.split("}", 1)[1]
        ET.register_namespace(prefix, v)

paras = list(root.iter(f"{W}p"))

def ptext(p):
    return "".join(t.text or "" for t in p.iter(f"{W}t")).strip()

def norm(s: str) -> str:
    s = re.sub(r"[\r\n\x07]", "", s or "")
    s = re.sub(r"\s+", " ", s).strip()
    return s

def set_style(p, style_id: str):
    pPr = p.find("w:pPr", NS)
    if pPr is None:
        pPr = ET.Element(f"{W}pPr")
        p.insert(0, pPr)
    ps = pPr.find("w:pStyle", NS)
    if ps is None:
        ps = ET.Element(f"{W}pStyle")
        # insert at start of pPr
        pPr.insert(0, ps)
    ps.set(f"{W}val", style_id)

# Exact targets for H2 (canonical body headings, not mini-TOC list)
h2_exact = {
    "3.1ศึกษาปัญหาและความต้องการ (Analysis & Requirement)",
    "3.1 ศึกษาปัญหาและความต้องการ (Analysis & Requirement)",
    "3.2การวิเคราะห์ระบบ (System Analysis)",
    "3.2 การวิเคราะห์ระบบ (System Analysis)",
    "3.3 การออกแบบระบบ (System Design)",
    "3.3การออกแบบระบบ (System Design)",
    "3.4ผลลัพธ์การวิเคราะห์และออกแบบระบบ",
    "3.4 ผลลัพธ์การวิเคราะห์และออกแบบระบบ",
    "3.5 ภาษาและเครื่องมือที่ใช้ในการพัฒนา",
    "3.5ภาษาและเครื่องมือที่ใช้ในการพัฒนา",
}
h2_norm = {norm(x) for x in h2_exact}

log = [f"src={src}"]
h1_n = h2_n = 0
in_ch3 = False

for i, p in enumerate(paras):
    t = norm(ptext(p))
    if not t:
        continue
    if re.match(r"^บทที่\s*3$", t):
        in_ch3 = True
        set_style(p, "1")
        h1_n += 1
        log.append(f"p{i}: H1 {t}")
        continue
    if re.match(r"^บทที่\s*4", t):
        in_ch3 = False
        continue
    if not in_ch3:
        continue
    if t in h2_norm:
        set_style(p, "2")
        h2_n += 1
        log.append(f"p{i}: H2 {t}")

log.append(f"h1={h1_n} h2={h2_n}")

# Write XML back without pretty-print
# ElementTree may drop unused namespaces; Word usually OK
xml_out = ET.tostring(root, encoding="utf-8", xml_declaration=True)
doc_path.write_bytes(xml_out)

# Repack
if work_docx.exists():
    work_docx.unlink()
with zipfile.ZipFile(work_docx, "w", zipfile.ZIP_DEFLATED) as z:
    for f in sorted(work_dir.rglob("*")):
        if f.is_file():
            z.write(f, f.relative_to(work_dir).as_posix())

log.append(f"wrote {work_docx}")
log_path.write_text("\n".join(log), encoding="utf-8")
print("OK", h1_n, h2_n)
