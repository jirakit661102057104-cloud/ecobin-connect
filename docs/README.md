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

## ไดอะแกรม (`diagrams/`)

| โฟลเดอร์ | เนื้อหา |
|---|---|
| [uml/](./diagrams/uml/) | Architecture, Use Case, Sequence, Activity, Class (draw.io) |
| [dfd/](./diagrams/dfd/) | Data Flow Diagram Level 0–1 |
| [er/](./diagrams/er/) | ER / schema |
| [context/](./diagrams/context/) | Context diagram |

เปิด UML หลัก: [`diagrams/uml/ecobin-uml-architecture.drawio`](./diagrams/uml/ecobin-uml-architecture.drawio)

## งานวิจัย (`research/`)

เล่ม Word, พจนานุกรมข้อมูล Excel และไฟล์ประกอบอยู่ที่นี่

## ที่อยู่ระบบตอนนี้

- เว็บ: https://ecobin-connect-8ap5.vercel.app
- หน้า login: https://ecobin-connect-8ap5.vercel.app/login
- API (Cloud Run): https://ecobin-api-568301593385.asia-southeast1.run.app
- ตรวจ API: https://ecobin-api-568301593385.asia-southeast1.run.app/health ต้องได้ `{"status":"ok"}`
- โค้ด: https://github.com/jirakit661102057104-cloud/ecobin-connect
