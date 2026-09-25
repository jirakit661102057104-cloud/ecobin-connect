# -*- coding: utf-8 -*-
import zipfile
import re
from pathlib import Path
from xml.etree import ElementTree as ET
from collections import Counter

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

# Find any mention of บทที่ 3 or 3.1
hits = []
for i, p in enumerate(paras):
    t = ptext(p)
    if not t:
        continue
    if "บทที่ 3" in t or "บทที่3" in t or t.startswith("3.1") or t.startswith("3.2") or "ศึกษาปัญหาและความต้องการ" in t or "การออกแบบระบบ" in t:
        hits.append(f"p{i:04d}\tstyle={pstyle(p)}\t{t[:160]}")

# Also all H1
h1 = []
for i, p in enumerate(paras):
    if pstyle(p) == "1":
        t = ptext(p)
        if t:
            h1.append(f"p{i:04d}\t{t[:100]}")

# style frequency
styles = Counter(pstyle(p) for p in paras if ptext(p))

out.write_text(
    "=== H1 ===\n" + "\n".join(h1) + "\n\n=== CH3 hits ===\n" + "\n".join(hits[:200]) + f"\n\nstyle top={styles.most_common(15)}\n",
    encoding="utf-8",
)
print("h1", len(h1), "hits", len(hits))
