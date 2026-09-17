# Event Log + กู้โมเดล Teachable Machine

ออกแบบให้ตามรอยได้ว่าเกิดอะไรที่ไหน และเก็บตัวอย่างรูปไว้เทรนโมเดลใหม่ได้เมื่อไฟล์โมเดลหาย

## คำตอบสั้นๆ

**ได้** — เก็บได้ทั้ง:
1. **ตัวอย่างรูปเทรน** ในตาราง `model_training_samples` (ชี้ไปไฟล์ใน `/uploads`)
2. **Event log** ในตาราง `system_events` ตาม trigger
3. **รุ่นโมเดล** ใน `model_versions` (EcoBin local หรือ Teachable URL)

เมื่อโมเดลหาย: ดึงตัวอย่างจาก DB → อัปโหลดเข้า [Teachable Machine](https://teachablemachine.withgoogle.com/) ตาม label → ลงทะเบียน URL ใหม่ใน `model_versions` / env → flow เดินต่อ

## ตาราง

| ตาราง | หน้าที่ |
|---|---|
| `system_events` | log ตาม event (append-only) |
| `model_training_samples` | รูป+label สำหรับเทรน/กู้โมเดล |
| `model_versions` | รุ่นโมเดลที่ใช้งาน / สำรอง |

SQL: `infra/event-log.sql` (migrate อัตโนมัติตอนสตาร์ท API ด้วย)

## Trigger events

| event_type | เกิดเมื่อ | ที่ไหน |
|---|---|---|
| `MODEL_CLASSIFY` | จำแนกรูปในเบราว์เซอร์ | Frontend → `POST /api/events/classify` |
| `WASTE_SUBMITTED` | สมาชิกกดบันทึกขวด | Backend `POST /api/waste` |
| `POINTS_AWARDED` | ให้แต้ม | Backend หลังบันทึก / แอดมินอนุมัติ |
| `GUEST_SCAN` | Guest ทดลองสแกน | Backend `POST /api/guest/scan` |
| `TRAINING_SAMPLE_SAVED` | เก็บตัวอย่างเทรน | Backend หลังสแกนผ่าน |
| `MODEL_VERSION_REGISTERED` | ลงทะเบียนโมเดล | System / Admin |
| `WASTE_VERIFIED` | แอดมินตรวจภาพ | Backend admin |

ทุก event ที่เกี่ยวกับสแกนครั้งเดียวกันใช้ **`correlation_id`** เดียวกัน → ค้นหา timeline ได้

```
MODEL_CLASSIFY (corr=abc)
   → WASTE_SUBMITTED (corr=abc, record_id)
   → POINTS_AWARDED (corr=abc, points)
   → TRAINING_SAMPLE_SAVED (corr=abc, sample_id)
```

## Flow กู้โมเดล

```
โมเดลหาย / เพี้ยน
  → GET /api/admin/training-samples?label=PLASTIC_BOTTLE|CAN|INVALID
  → ดาวน์โหลด image_url แต่ละอัน
  → อัปโหลดเข้า Teachable Machine (3 คลาส)
  → Export โมเดล → ได้ model URL
  → POST /api/admin/model-versions { activate: true, provider: teachable_machine, model_url }
  → ตั้ง NEXT_PUBLIC_TEACHABLE_MACHINE_MODEL_URL บน Vercel (ถ้าใช้ Teachable)
  → สแกนทำงานต่อ
```

ตัวอย่างจากสแกนจริง (confidence ≥ 80%) จะถูกเก็บอัตโนมัติ — ไม่ต้องพึ่งโฟลเดอร์เทรน TrashNet อย่างเดียว

## API

| Method | Path | ใคร | ทำอะไร |
|---|---|---|---|
| POST | `/api/events/classify` | ทุกคน | log ผลจำแนก |
| GET | `/api/admin/events?type=&correlation_id=` | Admin | ดู event |
| GET | `/api/admin/training-samples?label=` | Admin | รายการตัวอย่างเทรน |
| GET | `/api/admin/model-versions` | Admin | รุ่นโมเดล |
| POST | `/api/admin/model-versions` | Admin | ลงทะเบียน/สลับโมเดล |

## Admin: เมนู Activity Log

แอดมินเห็นอะไรบ้าง:

| ส่วน | รายละเอียด |
|---|---|
| **KPI ย่อ** | จำนวนจำแนก / ส่งขวด / ให้แต้ม / เก็บเทรน / Guest / ตรวจรูป |
| **Timeline** | รายการ event ล่าสุด — เวลา, ประเภท, ข้อความ, ผู้กระทำ, entity |
| **ตัวกรอง** | ตามประเภท event, ค้นหาข้อความ, กรอง `correlation_id` |
| **รายละเอียด** | กดแถวแล้วดู payload JSON (แต้ม, confidence, image_url ฯลฯ) |
| **ตัวอย่างเทรน** | แกลเลอรีรูปที่เก็บไว้กู้โมเดล Teachable ได้ |

ทางลัด: แท็บ **Activity Log** ในแผงแอดมิน + การ์ดจากหน้าภาพรวม
