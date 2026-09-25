# -*- coding: utf-8 -*-
import zipfile
import re
from pathlib import Path
from xml.etree import ElementTree as ET

NS = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
path = Path(r"c:\Users\Lenovo\OneDrive\Desktop\สำรอง.docx")
out = Path(r"d:\Jirakit_IT04\Project\ecobin-connect\.agents\tmp-thesis-edit\chapter3-all.txt")

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

# From บทที่ 3 to end or บทที่ 4
start = None
end = len(paras)
for i, p in enumerate(paras):
    t = ptext(p)
    if start is None and (t.strip() == "บทที่ 3" or t.startswith("บทที่ 3")):
        start = i
    if start is not None and i > start and (t.strip().startswith("บทที่ 4") or t == "บทที่ 4"):
        end = i
        break

lines = [f"range {start}-{end}"]
keep = []
for i in range(start or 0, end):
    t = ptext(paras[i])
    if not t:
        continue
    # short numbered section headers 3.x
    if re.match(r"^บทที่\s*3\b", t) or re.match(r"^3\.\d+(\s|$)", t) or re.match(r"^3\.\d+[^\d]", t):
        lines.append(f"p{i:04d}\tstyle={pstyle(paras[i])}\tlen={len(t)}\t{t[:180]}")
        keep.append((i, t))

out.write_text("\n".join(lines), encoding="utf-8")
print("paras", end - (start or 0), "section-like", len(keep))
