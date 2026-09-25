---
name: thesis-docx
description: >-
  Edit the EcoBin Connect thesis Word document (.docx) to close UX/UI and
  product-behavior gaps. Use when the user asks to ปรับเล่ม, แก้เอกสาร Word,
  อัปเดตเล่มวิจัย, sync thesis with docs/design, or apply
  thesis-ux-ui-gap-checklist.md. Always load the docx skill first for
  create/read/edit mechanics.
---

# Thesis DOCX (EcoBin Connect)

## Default files

| Role | Path |
|---|---|
| Thesis | `d:\Jirakit_IT04\วิจัยแอปพลิเคชั่น เล่มสมบูรณ์ 09202026.docx` |
| Gap checklist | `docs/research/thesis-ux-ui-gap-checklist.md` |
| Design hub | `docs/design/` (DOC-DS-001…004) |
| DOCX mechanics | `.agents/skills/docx/SKILL.md` |

## Workflow

1. **Read** `.agents/skills/docx/SKILL.md` and follow its edit/create/read rules.
2. **Read** `docs/research/thesis-ux-ui-gap-checklist.md` — that is the source of truth for *what* to change.
3. **Backup** before writing: copy the `.docx` to the same folder with suffix `_backup-YYYYMMDD`.
4. **Apply** checklist sections in order: **A** (fix wrong product claims) → **B** (UX theory) → **C** (design artifacts) → **D** (usability tests). Skip **E**.
5. Prefer **in-place edit** of the existing thesis (unpack → XML → repack) over regenerating the whole book, so headings, styles, and page layout stay intact.
6. For new theory/design sections, draft Thai academic prose aligned with DOC-DS-004 / wireframes / patterns / UI pages; do not invent product behavior that contradicts the checklist.
7. After edits, validate with the docx skill scripts when available; summarize which checklist rows were done.

## Hard rules

- Do not invent Admin “approve photo” or gallery-upload-for-points flows — checklist **A** wins.
- Keep Thai academic tone; match existing chapter numbering when inserting subsections.
- Screenshots for wireframe/pattern/UI: instruct capture from HTML docs or insert images the user provides — do not fabricate fake app screenshots.
- Never commit the thesis `.docx` unless the user explicitly asks.

## Dependencies (this machine)

| Tool | Role | If missing |
|---|---|---|
| Python 3 | unpack/edit/validate scripts | required |
| `pandoc` | read `.docx` → markdown | install via `winget install JohnMacFarlane.Pandoc` or extract text with Python (`zipfile` + `word/document.xml`) |
| `docx` (npm) | create new docs only | `npm install docx` in a temp script dir when needed |
| LibreOffice / `pdftoppm` | visual QA | optional; skip if not installed |
