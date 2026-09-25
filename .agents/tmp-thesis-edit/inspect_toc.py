# -*- coding: utf-8 -*-
import zipfile
import re
from collections import Counter
from pathlib import Path
from xml.etree import ElementTree as ET

NS = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
path = Path(r"c:\Users\Lenovo\OneDrive\Desktop\สำรอง.docx")
print("exists", path.exists(), "size", path.stat().st_size)

with zipfile.ZipFile(path) as z:
    xml = z.read("word/document.xml").decode("utf-8")
    names = z.namelist()

print("has instrText TOC", bool(re.search(r"TOC\\?\s*\\o|TOC \\o|w:instrText[^>]*>[^<]*TOC", xml)))
toc_instr = re.findall(r"<w:instrText[^>]*>[^<]*</w:instrText>", xml)
print("instrText samples:")
for t in toc_instr[:20]:
    if "TOC" in t.upper() or "PAGEREF" in t.upper() or "HYPERLINK" in t.upper():
        print(" ", t[:200])

pstyles = re.findall(r'<w:pStyle w:val="([^"]+)"', xml)
print("top styles:", Counter(pstyles).most_common(40))
print("outlineLvl:", Counter(re.findall(r'<w:outlineLvl w:val="(\d+)"', xml)))

# Extract paragraphs with heading-like styles + text
root = ET.fromstring(xml.encode("utf-8"))
headings = []
for i, p in enumerate(root.iter("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p")):
    pPr = p.find("w:pPr", NS)
    style = None
    outline = None
    if pPr is not None:
        ps = pPr.find("w:pStyle", NS)
        if ps is not None:
            style = ps.get("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}val")
        ol = pPr.find("w:outlineLvl", NS)
        if ol is not None:
            outline = ol.get("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}val")
    texts = []
    for t in p.iter("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t"):
        if t.text:
            texts.append(t.text)
    text = "".join(texts).strip()
    if not text:
        continue
    is_heading = False
    if style and (style.startswith("Heading") or style.startswith("หัว") or "Heading" in style or style in ("1", "2", "3", "Title", "Subtitle")):
        is_heading = True
    if outline is not None:
        is_heading = True
    # chapter-like numbered Thai headings even without style
    if re.match(r"^(บทที่\s*\d+|Chapter\s*\d+|\d+(\.\d+){0,3}\s+\S)", text):
        is_heading = True
    if is_heading:
        headings.append((i, style, outline, text[:120]))

print("heading-like count", len(headings))
for h in headings[:80]:
    print(f"p{h[0]:04d} style={h[1]} ol={h[2]} | {h[3]}")

out = Path(__file__).with_name("toc-headings.txt")
with out.open("w", encoding="utf-8") as f:
    for h in headings:
        f.write(f"p{h[0]:04d}\tstyle={h[1]}\tol={h[2]}\t{h[3]}\n")
print("wrote", out)
