# -*- coding: utf-8 -*-
import zipfile, re
from pathlib import Path
from xml.etree import ElementTree as ET

NS = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
path = Path(r"c:\Users\Lenovo\OneDrive\Desktop\สำรอง.docx")
out = Path(r"d:\Jirakit_IT04\Project\ecobin-connect\.agents\tmp-thesis-edit\ch3-toc-check.txt")

with zipfile.ZipFile(path) as z:
    root = ET.fromstring(z.read("word/document.xml"))
paras = list(root.iter(f"{W}p"))

def ptext(p):
    return "".join(t.text or "" for t in p.iter(f"{W}t")).strip()
def pstyle(p):
    pPr = p.find("w:pPr", NS)
    if pPr is None: return None
    ps = pPr.find("w:pStyle", NS)
    return ps.get(f"{W}val") if ps is not None else None

lines = []
# TOC region
for i, p in enumerate(paras[133:220]):
    t = ptext(p)
    if t and ("3." in t or "บทที่ 3" in t or "บทที่3" in t):
        lines.append(f"TOC p{i+133} style={pstyle(p)} | {t[:100]}")

lines.append("--- ch3 H1/H2 ---")
in3 = False
for i, p in enumerate(paras):
    t = ptext(p)
    st = pstyle(p)
    if st == "1" and "บทที่ 3" in t:
        in3 = True
    if st == "1" and "บทที่ 4" in t:
        in3 = False
    if in3 and st in ("1", "2"):
        lines.append(f"p{i} style={st} | {t[:120]}")

out.write_text("\n".join(lines), encoding="utf-8")
print("wrote", len(lines))
