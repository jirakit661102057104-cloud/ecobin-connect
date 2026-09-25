# Checklist: ช่องว่าง UX/UI ในเล่มวิจัย EcoBin Connect

เทียบจากเล่ม: `d:\Jirakit_IT04\วิจัยแอปพลิเคชั่น เล่มสมบูรณ์ 09202026.docx`  
กับเอกสารออกแบบใน repo: [docs/design/](../design/) · [DOC-DS-004 Theory](../design/ux-theory.html)

> ใช้ร่วมกับ skill: `thesis-docx` + `docx` (`.agents/skills/`) — บอก Agent ให้ “ปรับเล่มตาม checklist” ได้

---

## A. แก้เนื้อหาให้ตรงระบบจริง (สำคัญ)

> สถานะ: แก้ใน `_updated.docx` แล้ว (2026-09-20) — เก็บฟอนต์เดิมด้วยการแทนที่เฉพาะข้อความใน `<w:t>`  
> ไฟล์: `d:\Jirakit_IT04\วิจัยแอปพลิเคชั่น เล่มสมบูรณ์ 09202026_updated.docx`  
> สำรอง: `…09202026_backup-20260920.docx`

| ตำแหน่งในเล่ม | ข้อความเดิม (สรุป) | ควรแก้เป็น | สถานะ |
|---|---|---|---|
| 1.4.1.2 ผู้ดูแลระบบ | ตรวจสอบและยืนยันความถูกต้องของภาพถ่ายขยะ | **ดูรายการสแกนที่ AI ตรวจแล้ว (อ่านอย่างเดียว)** · ไม่มีปุ่มอนุมัติ/ปฏิเสธรูป | ✅ |
| 1.4.1.* (เพิ่ม) | — | **สแกน QR / รหัสรับของ** (ผนวกในข้อจัดการของรางวัล) | ✅ |
| 1.4.2.2 สมาชิก | ถ่ายภาพและอัปโหลดข้อมูลขยะ | **ถ่ายจากกล้องในแอป** เพื่อได้แต้ม · อัปโหลดแกลเลอรีไม่ได้แต้ม | ✅ |
| 1.4.2.3 | รับการแจ้งเตือนผลการตรวจสอบ | **ได้แต้มทันทีเมื่อ AI ≥ ~80%** (ไม่รอแอดมินตรวจ) | ✅ |
| 1.4.3 Guest | ดูของรางวัลเบื้องต้น | **สแกนทดลองได้** แต่**ไม่ได้แต้มจริง** + CTA เข้าสู่ระบบ | ✅ |
| บทที่ 3 รูป Admin “รอตรวจ” | ภาพรวมรอตรวจ | **รายการสแกนที่ AI ตรวจแล้ว** (คำบรรยายรูป) | ✅ คำบรรยาย |
| 1.6.3 นิยามสะสมแต้ม | เมื่ออัปโหลดภาพ…ถูกต้อง | เมื่อ**ถ่ายจากกล้องในแอป**และโมเดลผ่านเกณฑ์ | ✅ |
| DFD 2.1 / 2.3 / บรรยาย Admin อนุมัติภาพ | อนุมัติโดยแอดมิน | AI ให้แต้ม / แอดมินอ่านอย่างเดียว | ✅ |

---

## B. บทที่ 2 — ทฤษฎีที่ควรเพิ่ม

แนะนำหัวข้อใหม่ เช่น **2.x ทฤษฎีการออกแบบส่วนติดต่อผู้ใช้ (UX/UI)**

- [ ] Design Thinking (5 ขั้นตอน Empathize → Test)
- [ ] Design Principles — C.R.A.P. (Contrast, Repetition, Alignment, Proximity)
- [ ] 10 Usability Heuristics (Nielsen) — อย่างน้อยสรุปข้อที่ใช้จริง
- [ ] Information Architecture (โครงสร้างเมนู Member / Admin)
- [ ] Laws of UX — เลือก Fitts / Hick / Miller
- [ ] Wireframe / Prototype / Usability Testing (นิยาม + ระดับ fidelity)

**อ้างอิงที่ใช้ได้**
- [12 หัวข้อเบื้องต้น UX/UI (Medium)](https://meawzilaz.medium.com/12-topics-you-need-to-learn-for-being-a-ux-ui-designer-cab9a662d715)
- ตาราง map ในโปรเจกต์: [docs/design/ux-theory.html](../design/ux-theory.html) (DOC-DS-004)
- Nielsen: https://www.nngroup.com/articles/ten-usability-heuristics/
- Laws of UX: https://lawsofux.com/

---

## C. บทที่ 3 — ส่วนออกแบบที่ควรเพิ่ม

หลังสถาปัตยกรรม / ก่อนหรือคู่กับรูปหน้าจอจริง:

| หัวข้อย่อย | เนื้อหา | ดึงจาก docs |
|---|---|---|
| Information Architecture | แผนผังเมนู Member / Guest / Admin · สแกนขยะ ≠ สแกน QR | DOC-DS-001, DOC-DS-004 |
| User Journey | Member 6 ขั้น · Guest ย่อ | DOC-DS-004 §05 |
| User Flow | Flow A สแกนได้แต้ม · B Guest · C แลก+QR | DOC-DS-004 §06 · wireframe แผ่น 3–6, 13 |
| Wireframe (Low-fi) | แคปหน้าจอขาวดำ 22 แผ่น (เลือก 6–10 แผ่นสำคัญ) | [wireframes/index.html](../wireframes/index.html) |
| Pattern library | Atom → Molecule → Organism + C.R.A.P. | [patterns.html](../design/patterns.html) |
| UI Design (High-fi) | โทเคนสี + ตัวอย่างหน้าจอ | [ui.html](../design/ui.html) |
| แก้คำบรรยายรูปจอ | ให้ตรง AI / กล้อง / QR | DOC-DS-001 |

ลำดับ fidelity ที่อธิบายในเล่มได้:

1. Low-fidelity Wireframe → DOC-DS-001  
2. Pattern (components) → DOC-DS-002  
3. High-fidelity UI → DOC-DS-003  
4. Interactive prototype → แอปบน Vercel  

---

## D. บททดสอบ (ถ้ามี / จะเพิ่ม)

- [ ] Task-based Usability Testing (จาก DOC-DS-004 §07)
  - T1 Login  
  - T2 สแกนได้แต้ม  
  - T3 แลกรางวัล  
  - T4 Admin สแกน QR  
- [ ] ตาราง Heuristic Evaluation สรุป (คัดจาก DOC-DS-004 §03)
- [ ] ระบุจำนวนผู้ทดลอง / อุปกรณ์ (เช่น POCO ที่ระบุในเล่มแล้ว)

---

## E. สิ่งที่มีในเล่มแล้ว (ไม่ต้องเพิ่มซ้ำ แค่จัดอ้างอิง)

- บทที่ 1 บทนำ / วัตถุประสงค์ / ขอบเขต (ต้อง**แก้**ตามหมวด A)
- บทที่ 2 ทฤษฎีพลาสติก 3Rs คาร์บอน DB DFD
- บทที่ 3 DFD, Architecture, ER, ภาพหน้าจอระบบ, เครื่องมือ (Figma ระบุแล้ว)

---

## F. ไฟล์ช่วยใน repo

| ไฟล์ | ใช้ทำอะไร |
|---|---|
| [design/index.html](../design/index.html) | Hub เอกสารออกแบบ |
| [design/ux-theory.html](../design/ux-theory.html) | Map 12 หัวข้อทฤษฎี |
| [wireframes/index.html](../wireframes/index.html) | แคป wireframe ใส่เล่ม |
| [design/patterns.html](../design/patterns.html) | แคป atom/molecule/organism |
| [design/ui.html](../design/ui.html) | แคป UI high-fi |

**วิธีแทรกใน Word:** เปิด HTML ในเบราว์เซอร์ → Screenshot / Print PDF → แทรกรูป + คำบรรยายใต้ภาพ + อ้าง DOC-ID

---

## G. แผนภาพใน `docs/diagrams` — ER & Context (เทียบ `infra/schema.sql`)

### Context — **ต้องแก้ข้อความ data flow** (โครงสร้าง actor ครบแล้ว)

ไฟล์: [context/ecobin-context-diagram.drawio](../diagrams/context/ecobin-context-diagram.drawio)

| จุด | ตอนนี้ (ผิดกับระบบจริง) | ควรเป็น |
|---|---|---|
| Admin → ระบบ | `อนุมัติ/ไม่อนุมัติ/ขอภาพใหม่` | ลบออก · เหลือจัดการบัญชี/รางวัล/ถัง/กฎ + **สแกน QR** |
| ระบบ → Admin | `คิวภาพรอตรวจสอบ` | **รายการสแกนที่ AI ตรวจแล้ว (อ่านอย่างเดียว)** |
| ระบบ → สมาชิก | `ผลการตรวจสอบภาพจากแอดมิน` | **ผลวิเคราะห์ AI + แต้มที่ได้ทันที** |
| สมาชิก → ระบบ | `รูปภาพขวดพลาสติก` | ระบุ **ถ่ายจากกล้องในแอป** (gallery ไม่ได้แต้ม) |
| หมายเหตุท้ายรูป | สมาชิกได้แต้มหลังแอดมินอนุมัติ | **ได้แต้มเมื่อ AI ≥ ~80%** · Guest ทดลองไม่ได้แต้ม (ถูกแล้วครึ่งแรก) |

Actor ภายนอก (Member / Admin / Guest) + เส้น QR / Guest trial → **ไม่ต้องเพิ่ม actor ใหม่**

### ER — **โครงตารางหลักครบ · ควรเพิ่มฟิลด์สำคัญบางตัว**

ไฟล์หลัก: [er/ecobin-er-schema.drawio](../diagrams/er/ecobin-er-schema.drawio) (+ model-full / entities-bw / relationships)

| สถานะ | รายการ |
|---|---|
| ✅ ครบแล้ว | users, plastic_types, waste_records, point_transactions, rewards, redemptions (`pickup_code`), guest_logs (ไม่มี FK users), smart_bins, ความสัมพันธ์ 1:M · **อัปเดต 2026-09-22:** เพิ่ม `capture_source`/`image_hash`/`weight_kg` ใน waste · `average_weight_kg` ใน plastic · ตาราง `emission_factors` + `app_settings` · หมายเหตุ AI auto |
| ✅ แล้ว (เดิม ⚠️) | `waste_records.capture_source`, `image_hash` |
| ✅ แล้ว (เดิม ⚠️) | `app_settings` + `emission_factors` ใน `ecobin-er-schema.drawio` แท็บ ER Schema |
| ✅ แล้ว (เดิม ⚠️) | หมายเหตุ `verification_status` = ผล AI / ให้แต้มทันที |
| ⭕ ไม่บังคับใน ER เล่ม | `email_otps`, `phone_otps`, `model_*`, `system_events` (ตารางเทคนิค) |

### DFD ที่เกี่ยวข้อง

- [dfd/ecobin-dfd-level0.drawio](../diagrams/dfd/ecobin-dfd-level0.drawio) — ✅ ภาพเดียว 4 process · เลนเส้นแยก (2026-09-21)
- [dfd/ecobin-dfd-level1-process1.drawio](../diagrams/dfd/ecobin-dfd-level1-process1.drawio) — ✅ 1.1–1.3
- [dfd/ecobin-dfd-level1-process2.drawio](../diagrams/dfd/ecobin-dfd-level1-process2.drawio) — ✅ 2.1–2.3 (AI / Guest / Admin อ่านอย่างเดียว)
- [dfd/ecobin-dfd-level1-process3.drawio](../diagrams/dfd/ecobin-dfd-level1-process3.drawio) — ✅ 3.1–3.3 (รวม QR)
- [dfd/ecobin-dfd-level1-process4.drawio](../diagrams/dfd/ecobin-dfd-level1-process4.drawio) — ✅ 4.1–4.3

ควร sync Context diagram คู่กัน (ยังมีป้ายอนุมัติแอดมิน)
