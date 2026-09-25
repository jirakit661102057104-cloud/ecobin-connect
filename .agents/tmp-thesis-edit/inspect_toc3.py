# -*- coding: utf-8 -*-
import zipfile
import re
from pathlib import Path
from xml.etree import ElementTree as ET

NS = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
path = Path(r"c:\Users\Lenovo\OneDrive\Desktop\สำรอง.docx")
out_dir = Path(r"d:\Jirakit_IT04\Project\ecobin-connect\.agents\tmp-thesis-edit")

with zipfile.ZipFile(path) as z:
    doc = z.read("word/document.xml").decode("utf-8")

root = ET.fromstring(doc.encode("utf-8"))
paras = list(root.iter(f"{W}p"))

def ptext(p):
    return "".join(t.text or "" for t in p.iter(f"{W}t")).strip()

def pstyle(p):
    pPr = p.find("w:pPr", NS)
    if pPr is None:
        return None
    ps = pPr.find("w:pStyle", NS)
    return ps.get(f"{W}val") if ps is not None else None

toc_start = None
for i, p in enumerate(paras):
    t = ptext(p)
    if "สารบัญ" in t and len(t) < 40:
        toc_start = i
        break

lines = []
lines.append(f"toc_start={toc_start}")
if toc_start is not None:
    for p in paras[toc_start:toc_start + 60]:
        t = ptext(p)
        if t:
            lines.append(f"[{pstyle(p)}] {t}")

# heading counts
head_lines = []
for i, p in enumerate(paras):
    st = pstyle(p)
    if st not in ("1", "2", "3"):
        continue
    t = ptext(p)
    if t:
        head_lines.append(f"p{i:04d}\tH{st}\t{t}")

(out_dir / "toc-region.txt").write_text("\n".join(lines), encoding="utf-8")
(out_dir / "toc-headings.txt").write_text("\n".join(head_lines), encoding="utf-8")
sample = "\n".join(head_lines[:5])
(out_dir / "toc-summary.txt").write_text(
    "toc_start=%s\nheading1-3 count=%d\n%s\n" % (toc_start, len(head_lines), sample),
    encoding="utf-8",
)
print("OK", len(head_lines), "headings; toc_start", toc_start)
