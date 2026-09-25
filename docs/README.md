# เอกสาร EcoBin Connect

## คู่มือ (`guides/`)

| ไฟล์ | เนื้อหา |
|---|---|
| [01-สรุปงานที่ทำ.md](./guides/01-สรุปงานที่ทำ.md) | สิ่งที่แก้ในรอบนี้ ทีละเรื่อง |
| [02-สถาปัตยกรรม.md](./guides/02-สถาปัตยกรรม.md) | เว็บ / API / ฐานข้อมูล อยู่ที่ไหน |
| [03-deploy.md](./guides/03-deploy.md) | GitHub, Vercel, Cloud Run, โดเมน |
| [04-google-login.md](./guides/04-google-login.md) | ตั้งค่า Google OAuth และ error ที่เจอ |
| [05-พัฒนาบนเครื่อง.md](./guides/05-พัฒนาบนเครื่อง.md) | รัน local ด้วย `run.bat` |
| [06-uml-architecture.md](./guides/06-uml-architecture.md) | Architecture + UML |
| [07-event-log-model-recovery.md](./guides/07-event-log-model-recovery.md) | Event log + กู้โมเดล Teachable |
| [08-go-layered-architecture.md](./guides/08-go-layered-architecture.md) | ปรับโครงสร้าง Go Backend (Standard Layout + Clean/Layered) + แผน migrate |
| [09-gcp-billing-credit-request.md](./guides/09-gcp-billing-credit-request.md) | ร่างคำขอเครดิต/ยกเลิกบิล Google Cloud (ก.ย. 2569) |

## ไดอะแกรม (`diagrams/`)

| โฟลเดอร์ | เนื้อหา |
|---|---|
| [uml/](./diagrams/uml/) | Architecture, Use Case, Sequence, Activity, Class (draw.io) |
| [dfd/](./diagrams/dfd/) | Data Flow Diagram Level 0–1 |
| [er/](./diagrams/er/) | ER / schema |
| [context/](./diagrams/context/) | Context diagram |
| [README-lucidchart.md](./diagrams/README-lucidchart.md) | วิธี import เข้า Lucidchart |
| [ecobin-diagrams-for-lucidchart.zip](./diagrams/ecobin-diagrams-for-lucidchart.zip) | รวม `.drawio` ทุกไฟล์สำหรับ import |

เปิด UML หลัก: [`diagrams/uml/ecobin-uml-architecture.drawio`](./diagrams/uml/ecobin-uml-architecture.drawio)

## Design System (`design/` + `wireframes/`)

Format มาตรฐาน 3 ชั้น — เปิด [design/index.html](./design/index.html)

| DOC-ID | Layer | ไฟล์ |
|---|---|---|
| DOC-DS-000 | Index | [design/index.html](./design/index.html) |
| DOC-DS-001 | 01 Wireframe | [wireframes/index.html](./wireframes/index.html) |
| DOC-DS-002 | 02 Pattern library (Atom → Molecule → Organism) | [design/patterns.html](./design/patterns.html) |
| DOC-DS-003 | 03 UI | [design/ui.html](./design/ui.html) |
| DOC-DS-004 | UX/UI Theory mapping (12 topics) | [design/ux-theory.html](./design/ux-theory.html) |

Checklist ช่องว่างเล่มวิจัย: [research/thesis-ux-ui-gap-checklist.md](./research/thesis-ux-ui-gap-checklist.md)

รายละเอียด format: [design/README.md](./design/README.md)

## งานวิจัย (`research/`)

เล่ม Word, พจนานุกรมข้อมูล Excel และไฟล์ประกอบอยู่ที่นี่

## ที่อยู่ระบบตอนนี้

- เว็บ: https://ecobin-connect-8ap5.vercel.app
- หน้า login: https://ecobin-connect-8ap5.vercel.app/login
- API production: **ปิดแล้ว** (Cloud Run ถูกระงับ — ไม่ตั้ง `API_PROXY_TARGET` บน Vercel)
- พัฒนาบนเครื่อง: `.\run.bat` → http://localhost:3000/login + API `http://127.0.0.1:8080/health`
- โค้ด: https://github.com/jirakit661102057104-cloud/ecobin-connect
