# EcoBin Connect

เว็บแอปคัดแยกขยะขวดพลาสติก / กระป๋อง สำหรับมหาวิทยาลัยราชภัฏเพชรบูรณ์

| ส่วน | เทคโนโลยี | Deploy |
|---|---|---|
| Frontend | Next.js 15 | Vercel |
| Backend | Go (Chi) | Cloud Run |
| Database | MySQL | Cloud SQL |

## โครงสร้างโปรเจกต์

```
ecobin-connect/
├── frontend/          # Next.js UI + โมเดล AI ในเบราว์เซอร์
├── backend/           # Go REST API (auth, waste, points, carbon, admin)
├── infra/             # Docker Compose, schema.sql, nginx
├── docs/              # คู่มือ + ไดอะแกรม + เล่มวิจัย
│   ├── guides/        # เอกสารขั้นตอน (deploy, Google login, UML…)
│   ├── diagrams/      # draw.io (UML, DFD, ER, Context)
│   └── research/      # Word / Excel ของงานวิจัย
├── scripts/           # deploy / setup production
├── legacy/            # mockup Vite เดิม (ไม่ใช้รันจริง)
├── run.bat            # รันทดสอบบนเครื่อง
└── README.md
```

รายละเอียดเอกสาร: [`docs/README.md`](docs/README.md)

## รัน local (แนะนำ)

```bat
run.bat
```

- เว็บ: http://localhost:3000  
- API: http://localhost:8080/health  

ต้องมี: **Go 1.22+**, **Node.js 20+**, และ MySQL (Docker ใน `infra/` หรือติดตั้งเอง)

## Config

| ไฟล์ | ใช้ทำอะไร |
|---|---|
| `frontend/frontend.env` | พอร์ตเว็บ, URL API / โมเดล |
| `backend/backend.env` | MySQL, JWT, Google OAuth |
| `frontend/frontend.env.example` | ตัวอย่าง (ปลอดภัย commit ได้) |
| `backend/backend.env.example` | ตัวอย่าง |

อย่า commit ไฟล์ `.env` จริง

## Production สั้นๆ

- เว็บ: Vercel (`frontend/`)  
- API: `deploy-cloud-run.bat` → Cloud Run  
- คู่มือเต็ม: [`docs/guides/03-deploy.md`](docs/guides/03-deploy.md)

Docker บนเซิร์ฟเวอร์เอง:

```bat
start-production.bat
```

## บัญชีทดลอง (เฉพาะโหมดพัฒนา / `run.bat`)

| บทบาท | อีเมล |
|---|---|
| สมาชิก | st661102057106@gmail.com |
| ผู้ดูแลระบบ | st661102057104@gmail.com |

รหัสผ่าน: `ecobin123`
