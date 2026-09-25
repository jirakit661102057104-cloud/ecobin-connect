# -*- coding: utf-8 -*-
import zipfile
import re
from pathlib import Path
from xml.etree import ElementTree as ET
from collections import Counter

NS = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
path = Path(r"c:\Users\Lenovo\OneDrive\Desktop\สำรอง.docx")
out_dir = Path(r"d:\Jirakit_IT04\Project\ecobin-connect\.agents\tmp-thesis-edit")

with zipfile.ZipFile(path) as z:
    doc = z.read("word/document.xml").decode("utf-8")
    styles_xml = z.read("word/styles.xml").decode("utf-8")

# Reconstruct full TOC instruction from consecutive instrText
parts = re.findall(r"<w:instrText[^>]*>([^<]*)</w:instrText>", doc)
# find TOC sequence
joined = []
buf = []
in_toc = False
for p in parts:
    if "TOC" in p and not in_toc:
        in_toc = True
        buf = [p]
    elif in_toc:
        if p.strip().startswith("PAGEREF") or p.strip().startswith("HYPERLINK") or p.strip().startswith("REF"):
            break
        buf.append(p)
        if len("".join(buf)) > 80:
            break
print("TOC field reconstructed:", repr("".join(buf)[:200]))

# Style outline levels from styles.xml
root_s = ET.fromstring(styles_xml.encode("utf-8"))
style_ol = {}
style_names = {}
for s in root_s.findall("w:style", NS):
    sid = s.get(f"{W}styleId")
    name_el = s.find("w:name", NS)
    name = name_el.get(f"{W}val") if name_el is not None else None
    pPr = s.find("w:pPr", NS)
    ol = None
    if pPr is not None:
        ol_el = pPr.find("w:outlineLvl", NS)
        if ol_el is not None:
            ol = ol_el.get(f"{W}val")
    based = s.find("w:basedOn", NS)
    based_on = based.get(f"{W}val") if based is not None else None
    style_ol[sid] = (ol, name, based_on)
    style_names[sid] = name

# Resolve outline via basedOn chain
def resolve_ol(sid, depth=0):
    if sid is None or depth > 10:
        return None
    ol, name, based = style_ol.get(sid, (None, None, None))
    if ol is not None:
        return ol
    return resolve_ol(based, depth + 1)

interesting = ["1", "2", "11", "21", "31", "Heading1", "Heading2", "Heading3"]
for sid in interesting:
    if sid in style_ol:
        print(f"style {sid}: name={style_ol[sid][1]} ol={style_ol[sid][0]} based={style_ol[sid][2]} resolved_ol={resolve_ol(sid)}")

# Count how many styles have outline
with_ol = sum(1 for sid in style_ol if resolve_ol(sid) is not None)
print("styles with outlineLvl (resolved):", with_ol)

# List styles that have outline
lines = []
for sid, (ol, name, based) in sorted(style_ol.items(), key=lambda x: x[0]):
    rol = resolve_ol(sid)
    if rol is not None:
        lines.append(f"{sid}\tname={name}\tol={ol}\tbased={based}\tresolved={rol}")
(out_dir / "styles-outline.txt").write_text("\n".join(lines), encoding="utf-8")
print("wrote styles-outline.txt", len(lines))

# Extract TOC region text (first ~100 paragraphs after TOC title)
root = ET.fromstring(doc.encode("utf-8"))
paras = list(root.iter(f"{W}p"))
toc_start = None
for i, p in enumerate(paras):
    texts = "".join(t.text or "" for t in p.iter(f"{W}t")).strip()
    if "สารบัญ" in texts or texts == "สารบัญ":
        toc_start = i
        break
print("สารบัญ para index", toc_start)

# Dump heading styles 1,2,11,21,31 texts
head_lines = []
for i, p in enumerate(paras):
    pPr = p.find("w:pPr", NS)
    style = None
    if pPr is not None:
        ps = pPr.find("w:pStyle", NS)
        if ps is not None:
            style = ps.get(f"{W}val")
    if style not in ("1", "2", "11", "21", "31"):
        continue
    text = "".join(t.text or "" for t in p.iter(f"{W}t")).strip()
    if not text:
        continue
    rol = resolve_ol(style)
    head_lines.append(f"p{i:04d}\tstyle={style}\trol={rol}\t{text}")
(out_dir / "toc-headings.txt").write_text("\n".join(head_lines), encoding="utf-8")
print("heading paras with styles 1/2/11/21/31:", len(head_lines))

# Check if TOC results are empty / broken
if toc_start is not None:
    snippet = []
    for p in paras[toc_start:toc_start + 40]:
        text = "".join(t.text or "" for t in p.iter(f"{W}t")).strip()
        if text:
            snippet.append(text[:100])
    (out_dir / "toc-region.txt").write_text("\n".join(snippet), encoding="utf-8")
    print("toc region lines", len(snippet))
