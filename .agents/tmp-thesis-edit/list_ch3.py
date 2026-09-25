# -*- coding: utf-8 -*-
"""List Chapter 3 heading-styled paragraphs for TOC cleanup."""
import zipfile
import re
from pathlib import Path
from xml.etree import ElementTree as ET

NS = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
path = Path(r"c:\Users\Lenovo\OneDrive\Desktop\สำรอง.docx")
out = Path(r"d:\Jirakit_IT04\Project\ecobin-connect\.agents\tmp-thesis-edit\chapter3-heads.txt")

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

# Find chapter 3 start/end
ch3_start = None
ch4_start = None
for i, p in enumerate(paras):
    t = ptext(p)
    st = pstyle(p)
    if st == "1" and re.search(r"บทที่\s*3\b", t):
        ch3_start = i
    if st == "1" and re.search(r"บทที่\s*4\b", t):
        ch4_start = i
        break

lines = [f"ch3_start={ch3_start} ch4_start={ch4_start}"]
if ch3_start is not None:
    end = ch4_start if ch4_start is not None else len(paras)
    for i in range(ch3_start, end):
        p = paras[i]
        st = pstyle(p)
        t = ptext(p)
        if not t:
            continue
        # heading styles 1,2,3 or numbered 3.x
        if st in ("1", "2", "3") or re.match(r"^3\.\d+", t):
            lines.append(f"p{i:04d}\tstyle={st}\t{t[:140]}")

out.write_text("\n".join(lines), encoding="utf-8")
print("wrote", out, "lines", len(lines))
