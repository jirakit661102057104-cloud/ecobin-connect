# Design System Docs — EcoBin Connect

มาตรฐานเอกสารออกแบบ 3 ชั้น + ทฤษฎี UX/UI (เปิดในเบราว์เซอร์)

| DOC-ID | Layer | ไฟล์ | Fidelity |
|---|---|---|---|
| DOC-DS-000 | Index | [index.html](./index.html) | Hub |
| DOC-DS-001 | 01 Wireframe | [../wireframes/index.html](../wireframes/index.html) | Low (B&W) |
| DOC-DS-002 | 02 Pattern library | [patterns.html](./patterns.html) | Mid (Atom → Organism) |
| DOC-DS-003 | 03 UI | [ui.html](./ui.html) | High (tokens + screens) |
| DOC-DS-004 | UX/UI Theory mapping | [ux-theory.html](./ux-theory.html) | Theory → docs |

Checklist สำหรับเล่มวิจัย: [../research/thesis-ux-ui-gap-checklist.md](../research/thesis-ux-ui-gap-checklist.md)

## Format มาตรฐาน (ทุกหน้า)

1. **Sticky chrome** — Brand · แท็บ `01 Wireframe` / `02 Pattern library` / `03 UI`
2. **Doc head** — `DOC-ID` · badge layer · ชื่อเรื่อง · lede
3. **Meta block** — Project · Version · Status · Audience
4. **Sections** — หัวข้อ UPPERCASE + เส้นคั่น
5. **Footer** — path + ลิงก์ข้ามชั้น (+ Theory)

## Atomic Design (Pattern library)

| Level | ใช้เมื่อ |
|---|---|
| **Atom** | สี, ฟอนต์, ไอคอน, ปุ่ม, input |
| **Molecule** | Brand lockup, Points chip, Nav pills, Form field |
| **Organism** | Header, KPI grid, Scanner, Admin table, Modal |

## Workflow ที่แนะนำ

1. วาง flow ใน **Wireframe**
2. แตกคอมโพเนนต์ใน **Pattern library**
3. ล็อกสี/สไตล์ใน **UI** แล้วค่อยลงโค้ด
4. อ้างทฤษฎีในเล่มวิจัยผ่าน **DOC-DS-004**
