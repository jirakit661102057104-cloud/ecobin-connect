# EcoBin Connect — Architecture & UML

เอกสารนี้สรุป**สถาปัตยกรรมจริงของระบบปัจจุบัน** และไดอะแกรม UML สำหรับงานวิจัย / สอบ / นำเสนอ  
(อัปเดตให้ตรงกับ flow: ถ่ายรูป → จำแนกในเบราว์เซอร์ → ให้แต้มทันที → คำนวณคาร์บอนแบบ CMH/TGO)

**เปิดใน draw.io:** [`../diagrams/uml/ecobin-uml-architecture.drawio`](../diagrams/uml/ecobin-uml-architecture.drawio)  
(มี 8 แท็บ: Architecture, Deployment, Use Case, Sequence สแกน, Sequence Google, Activity, Component, Class)

---

## 1. สถาปัตยกรรมระบบ (Architecture)

### 1.1 ภาพรวม (C4 ระดับ Context + Container)

```mermaid
flowchart TB
  subgraph Actors["ผู้ใช้"]
    M[สมาชิก]
    G[ผู้เยี่ยมชม / Guest]
    A[ผู้ดูแลระบบ]
  end

  subgraph Client["Client"]
    BROWSER[เบราว์เซอร์]
    TM[โมเดล AI ในเบราว์เซอร์<br/>MobileNet + EcoBin head]
  end

  subgraph Edge["Frontend — Vercel"]
    NEXT[Next.js App Router]
    PROXY["/api/* proxy"]
  end

  subgraph API["Backend — Cloud Run"]
    GO[Go API]
  end

  subgraph Data["Data — Cloud SQL"]
    MYSQL[(MySQL ecobin)]
  end

  subgraph Ext["บริการภายนอก"]
    GOOGLE[Google Identity]
    TGO[(ค่า Emission Factor<br/>อ้างอิง TGO / CMH)]
  end

  M --> BROWSER
  G --> BROWSER
  A --> BROWSER
  BROWSER --> NEXT
  BROWSER --> TM
  NEXT --> PROXY
  PROXY --> GO
  GO --> MYSQL
  BROWSER --> GOOGLE
  GO --> GOOGLE
  GO -.-> TGO
```

### 1.2 หน้าที่แต่ละชั้น

| ชั้น | เทคโนโลยี | หน้าที่ |
|---|---|---|
| Presentation | Next.js (Vercel) | UI สมาชิก / Guest / Admin, เปิดกล้อง, อัปโหลดรูป |
| Client AI | TensorFlow.js + MobileNet | จำแนกขวดพลาสติก / กระป๋อง / ไม่ผ่าน ในเบราว์เซอร์ |
| API Gateway (thin) | Next.js Route `/api/[...path]` | Proxy ไป Cloud Run, ส่ง cookie เซสชัน |
| Application | Go (Cloud Run) | Auth, บันทึกขยะ, แต้ม, รางวัล, Admin |
| Persistence | MySQL (Cloud SQL) | ผู้ใช้, รายการขยะ, แต้ม, EF, จุดทิ้ง |
| External | Google OAuth, แหล่ง EF ของ TGO/CMH | ล็อกอิน, อ้างอิงค่าคาร์บอน |

### 1.3 หลักการออกแบบสำคัญ

1. **แยก Frontend กับ Backend คนละ deploy** — ปิดโน้ตบุ๊กได้ ระบบยังทำงาน  
2. **จำแนกภาพฝั่ง client** — ไม่ส่งรูปไป Teachable Machine ภายนอกเพื่อ classify; ใช้โมเดลใน `/public/models/ecobin-bottle-can/`  
3. **Same-origin proxy** — เบราว์เซอร์เรียก `/api` บนโดเมนเว็บ ลดปัญหา CORS/cookie  
4. **ให้แต้มทันทีหลังสแกนผ่าน** — สถานะ `อนุมัติแล้ว` ตอนสร้างรายการ (ไม่รอแอดมิน)  
5. **คาร์บอน = มวล × EF** ตามแนว [CMH Calculate](https://circularmaterialhub.com/Calculate.php) ที่อ้าง TGO  

### 1.4 Deployment

```mermaid
flowchart LR
  U[User Browser] -->|HTTPS| V[Vercel<br/>frontend/]
  V -->|HTTPS proxy| CR[Cloud Run<br/>backend/]
  CR -->|Private / Connector| SQL[(Cloud SQL MySQL)]
  U -->|id_token| GGL[Google OAuth]
  CR -->|verify token| GGL
```

| สภาพแวดล้อม | Frontend | Backend | DB |
|---|---|---|---|
| Production | Vercel | Cloud Run `asia-southeast1` | Cloud SQL |
| Local | `npm run dev` :3000 | Go :8080 | MySQL local / Cloud SQL |

---

## 2. UML — Use Case Diagram

```mermaid
flowchart LR
  Member((สมาชิก))
  Guest((Guest))
  Admin((แอดมิน))

  UC1[เข้าสู่ระบบ Google / อีเมล]
  UC2[สแกนขวดหรือกระป๋อง]
  UC3[รับแต้มและคาร์บอน]
  UC4[ดูแดชบอร์ด / ประวัติ]
  UC5[แลกรางวัล]
  UC6[ทดลองสแกนโดยไม่รับแต้ม]
  UC7[จัดการจุดทิ้ง / รางวัล / สมาชิก]
  UC8[ยืนยันรับของรางวัล]

  Member --> UC1
  Member --> UC2
  Member --> UC3
  Member --> UC4
  Member --> UC5
  Guest --> UC6
  Guest --> UC4
  Admin --> UC7
  Admin --> UC8
  Admin --> UC4
```

**ขอบเขตระบบ (System boundary):** EcoBin Connect Web Application  

**หมายเหตุ Guest:** สแกน/ทดลองได้ แต่ไม่ได้รับแต้มจริง — ต้องเข้าสู่ระบบก่อน

---

## 3. UML — Sequence: สแกนและให้แต้ม (Happy Path สมาชิก)

```mermaid
sequenceDiagram
  actor U as สมาชิก
  participant UI as WasteScanner (Next.js)
  participant AI as โมเดลในเบราว์เซอร์
  participant API as Go API
  participant DB as MySQL

  U->>UI: เปิดกล้อง / อัปโหลดรูป
  U->>UI: กดถ่ายรูป
  UI->>AI: classify(image)
  AI-->>UI: PLASTIC_BOTTLE หรือ CAN + ความแม่นยำ %
  alt ความแม่นยำ > 80% และเป็นขวด/กระป๋อง
    UI-->>U: แสดงผลผ่าน + แต้มโดยประมาณ
    U->>UI: กดบันทึก
    UI->>API: POST /api/waste
    API->>API: คำนวณ weight × EF (CMH/TGO)
    API->>DB: INSERT waste_records (อนุมัติแล้ว)
    API->>DB: UPDATE users.total_points / carbon
    API->>DB: INSERT point_transactions
    API-->>UI: รายการสำเร็จ
    UI-->>U: ได้แต้มทันที
  else ไม่ผ่าน
    UI-->>U: แจ้งให้ถ่ายใหม่
  end
```

---

## 4. UML — Sequence: เข้าสู่ระบบ Google

```mermaid
sequenceDiagram
  actor U as ผู้ใช้
  participant UI as Login (Next.js)
  participant G as Google Identity
  participant API as Go API
  participant DB as MySQL

  U->>UI: กดเข้าสู่ระบบด้วย Google
  UI->>G: OAuth / credential
  G-->>UI: id_token
  UI->>API: POST /api/auth/google {id_token}
  API->>G: ตรวจ token (aud = GOOGLE_CLIENT_ID)
  alt มี google_sub / email อยู่แล้ว
    API->>DB: อ่าน / ผูกบัญชี
  else ผู้ใช้ใหม่
    API->>DB: INSERT users (+ กู้คืนถ้า soft-delete)
  end
  API-->>UI: cookie ecobin_token + user
  UI-->>U: เข้าสู่ระบบสำเร็จ<br/>(ถ้ายังไม่มีชื่อ-นามสกุล → กรอกโปรไฟล์)
```

---

## 5. UML — Activity: กระบวนการสแกน

```mermaid
flowchart TD
  Start([เริ่ม]) --> Prep[เตรียมขวด/กระป๋อง<br/>เทน้ำ แยกฝา บีบแบน]
  Prep --> Capture[ถ่ายรูปหรืออัปโหลด]
  Capture --> Classify[จำแนกด้วยโมเดลในเบราว์เซอร์]
  Classify --> Check{เป็นขวดหรือกระป๋อง<br/>และแม่นยำ > 80% ?}
  Check -->|ไม่| Retry[แจ้งเหตุผล / ถ่ายใหม่]
  Retry --> Capture
  Check -->|ใช่| ChooseBin[เลือกจุดทิ้ง + จำนวนชิ้น]
  ChooseBin --> Auth{เข้าสู่ระบบแล้ว?}
  Auth -->|ไม่| GuestSave[บันทึกทดลอง<br/>ไม่ให้แต้ม]
  Auth -->|ใช่| Save[POST /api/waste]
  Save --> Award[ให้แต้ม + คำนวณคาร์บอนทันที]
  Award --> End([จบ — ไปแดชบอร์ด])
  GuestSave --> End2([จบ — ดูประวัติทดลอง])
```

---

## 6. UML — Component / Package

```mermaid
flowchart TB
  subgraph Frontend["frontend/"]
    COMP[components/<br/>WasteScanner, Dashboard, Admin...]
    CTX[context/AppContext]
    LIB[lib/<br/>teachableMachine, proxyToApi, bottleScore]
    MODEL[public/models/ecobin-bottle-can]
    COMP --> CTX
    COMP --> LIB
    LIB --> MODEL
  end

  subgraph Backend["backend/"]
    MAIN[main.go — routes]
    AUTH[auth_methods.go]
    HAND[handlers.go]
    CARB[carbon.go]
    STORE[store.go]
    MIG[migrate.go]
    MAIN --> AUTH
    MAIN --> HAND
    HAND --> CARB
    HAND --> STORE
    AUTH --> STORE
    MIG --> STORE
  end

  LIB -->|HTTPS /api| MAIN
  STORE --> DB[(MySQL)]
```

---

## 7. UML — Class / Domain (สรุปเอนทิตีหลัก)

```mermaid
classDiagram
  class User {
    user_id
    full_name
    email
    user_role
    total_points
    total_carbon_saved
    auth_provider
    google_sub
  }
  class WasteRecord {
    record_id
    plastic_type
    plastic_code
    bottle_count
    weight_kg
    carbon_footprint
    carbon_avoided
    points_awarded
    verification_status
  }
  class PlasticType {
    plastic_code
    short_name
    average_weight_kg
    points_per_bottle
  }
  class EmissionFactor {
    emission_factor_id
    plastic_code
    factor_type
    factor_value
    source_version
    is_active
  }
  class SmartBin {
    bin_id
    bin_name
    status
  }
  class PointTransaction {
    transaction_id
    points_earned
    transaction_type
  }
  class Reward {
    reward_id
    points_required
    reward_stock
  }
  class Redemption {
    redeem_id
    points_used
    redeem_status
    pickup_code
  }

  User "1" --> "*" WasteRecord
  User "1" --> "*" PointTransaction
  User "1" --> "*" Redemption
  PlasticType "1" --> "*" WasteRecord
  PlasticType "1" --> "*" EmissionFactor
  SmartBin "1" --> "*" WasteRecord
  Reward "1" --> "*" Redemption
  WasteRecord "1" --> "*" PointTransaction
```

รายละเอียด ER แบบเต็มมีในไฟล์ draw.io:

- `docs/diagrams/er/ecobin-er-model-full.drawio`
- `docs/diagrams/er/ecobin-er-schema.drawio`
- `docs/diagrams/er/ecobin-er-relationships-1m.drawio`

---

## 8. Data Flow (สรุปจาก DFD ที่มีอยู่)

| ระดับ | ไฟล์ | เนื้อหา |
|---|---|---|
| Context | `docs/diagrams/context/ecobin-context-diagram.drawio` | ระบบกับภายนอก |
| DFD 0 | `docs/diagrams/dfd/ecobin-dfd-level0.drawio` | กระบวนการหลัก |
| DFD 1 | `docs/diagrams/dfd/ecobin-dfd-level1-process1..4.drawio` | แตกกระบวนการย่อย |

**กระแสข้อมูลหลักปัจจุบัน**

```
รูปภาพ → จำแนก (Client AI) → ผลประเภท + ความแม่นยำ
  → บันทึก waste_records + carbon + points (Go API)
  → อัปเดต users / point_transactions
  → แสดงบน Dashboard / History
```

---

## 9. ตารางเทียบ UML ที่ใช้ในเล่มวิจัย

| ไดอะแกรม | ใช้แสดงอะไร | อยู่ในเอกสารนี้ |
|---|---|---|
| Use Case | ใครทำอะไรในระบบ | §2 |
| Sequence | ลำดับการทำงานตามเวลา | §3–4 |
| Activity | การตัดสินใจใน flow สแกน | §5 |
| Component / Deployment | โครงสร้างและที่ deploy | §1, §6 |
| Class / ER | โครงสร้างข้อมูล | §7 + draw.io |

---

## 10. ข้อควรใส่ในบท Architecture ของเล่ม

1. ระบบเป็น **Web Application แบบ 3-tier** (Presentation / Application / Data)  
2. AI จำแนกขยะรัน **ฝั่ง client** เพื่อลดภาระเซิร์ฟเวอร์และ latency  
3. Backend เป็น **stateless API** บน Cloud Run เชื่อม Cloud SQL  
4. ความปลอดภัย: Google ID token ตรวจฝั่งเซิร์ฟเวอร์, เซสชันด้วย cookie, role Admin/Member  
5. ความยั่งยืนของตัวเลขคาร์บอน: ใช้ EF จากแหล่ง TGO ผ่านแนวทาง CMH ไม่ hard-code แบบสุ่ม  

---

## ไฟล์ที่เกี่ยวข้องในโค้ด

| ส่วน | path |
|---|---|
| สแกน + UI | `frontend/src/components/WasteScanner.tsx` |
| โหลดโมเดล | `frontend/src/lib/teachableMachine.ts` |
| Proxy API | `frontend/src/lib/proxyToApi.ts` |
| Routes | `backend/main.go` |
| สร้างรายการขยะ / แต้ม | `backend/handlers.go` |
| คาร์บอน | `backend/carbon.go` |
| Schema / migrate | `infra/schema.sql`, `backend/migrate.go` |
