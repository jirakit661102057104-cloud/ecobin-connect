# EcoBin Connect (Web)

เว็บแอปคัดแยกขยะขวดพลาสติก มหาวิทยาลัยราชภัฏเพชรบูรณ์  
Frontend: **Next.js** (ย้ายมาจาก mockup Google AI Studio)  
Backend: **Go** + **MySQL**

หน้าตาเดิมจากโฟลเดอร์ `src/` (AI Studio) ถูกห่อไว้ที่ `frontend` โดยเปลี่ยนเฉพาะชั้นข้อมูลจาก `localStorage` เป็น API จริง

## โครงสร้างโฟลเดอร์

```
frontend/              Next.js UI
  frontend.env         พอร์ตเว็บ และ URL ของ API
  src/                 หน้าจอจาก mockup AI Studio
backend/               Go REST API
  backend.env          พอร์ต API, MySQL, JWT, Gemini
infra/                 Docker MySQL + schema
src/                   mockup AI Studio ต้นฉบับ (เทียบหน้าตา)
run.bat                เคลียร์พอร์ตแล้วรันเทส local
start-production.bat   ขึ้นชุด Docker สำหรับใช้งานจริง
```

## Config

- [`frontend/frontend.env`](frontend/frontend.env) — พอร์ตเว็บ และ URL ของ API
- [`backend/backend.env`](backend/backend.env) — พอร์ต API, MySQL, JWT, Gemini key

## รันเทส local (แนะนำ)

ดับเบิลคลิก หรือรัน:

```bat
run.bat
```

สคริปต์จะปิดโปรเซสที่กินพอร์ตในไฟล์ env แล้วเปิด backend กับ frontend ในหน้าต่างใหม่ จากนั้นเปิดเบราว์เซอร์

ค่าเริ่มต้น: เว็บ http://localhost:3000 และ API http://localhost:8080/health

ปิดสองหน้าต่างที่เปิดขึ้นเพื่อหยุดระบบ แล้วรัน `run.bat` อีกครั้งเมื่ออยากรีสตาร์ท

ถ้าเปลี่ยนพอร์ตเว็บ ให้แก้ `CORS_ORIGIN` ใน `backend/backend.env` ให้ตรงกัน

## ฐานข้อมูล

ถ้ามี Docker:

```bash
cd infra
docker compose up -d
```

phpMyAdmin: http://localhost:8081

ถ้าไม่มี Docker ให้ติดตั้ง MySQL 8 แล้วแก้ `MYSQL_DSN` ใน `backend/backend.env`

## สิ่งที่ต้องมี

- Go 1.22+
- Node.js 20+
- Docker Desktop หรือ MySQL 8

## ขึ้น production ให้ใช้งานจริง

InfinityFree **ใช้ไม่ได้** กับ Next.js + Go ต้องใช้เครื่องที่รัน Docker ได้ เช่น VPS, เซิร์ฟเวอร์มหาวิทยาลัย หรือ Docker Desktop บนเครื่องที่เปิดทิ้งไว้ในเครือข่ายวิทยาเขต

1. คัดลอก config

```bat
copy backend\backend.env.production.example backend\backend.env
copy infra\.env.prod.example infra\.env.prod
```

2. แก้ค่าจริงใน `backend/backend.env`

- `JWT_SECRET` สุ่มยาว ๆ ห้ามใช้ค่าตัวอย่าง
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` สำหรับผู้ดูแลคนแรก (รหัสอย่างน้อย 8 ตัว)
- `GEMINI_API_KEY` ถ้าต้องการสแกนรูปด้วย AI
- `CORS_ORIGIN` เป็นโดเมนหรือ IP ที่ผู้ใช้เปิดเว็บ เช่น `http://10.0.0.5`

3. แก้ `infra/.env.prod`

- `MYSQL_PASSWORD` / `MYSQL_ROOT_PASSWORD` ให้แข็งแรง
- `PUBLIC_ORIGIN` ให้ตรงกับที่ผู้ใช้เปิด
- ถ้ามี HTTPS ค่อยตั้ง `COOKIE_SECURE=true`

4. รัน

```bat
start-production.bat
```

หรือ

```bat
cd infra
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build
```

เปิดพอร์ต **80** บนเซิร์ฟเวอร์ ผู้ใช้เข้าเว็บแล้ว **สมัครสมาชิกเอง** แอดมินล็อกอินด้วย `ADMIN_EMAIL`

โหมด production จะ:

- ไม่ใส่บัญชีทดลอง `ecobin123`
- ไม่โชว์ปุ่มล็อกอินด่วน
- ภาพขยะรอแอดมินอนุมัติก่อนได้แต้ม
- ไม่เปิดพอร์ต MySQL ออกอินเทอร์เน็ต (อยู่ภายใน Docker)

ถ้ามี HTTPS (โดเมนจริง) ให้ใส่ reverse proxy เพิ่ม หรือตั้ง `COOKIE_SECURE=true` และ `CORS_ORIGIN=https://โดเมน`

## บัญชีทดลอง (เฉพาะโหมดพัฒนา / run.bat)

| บทบาท | อีเมล |
|---|---|
| สมาชิก | st661102057106@gmail.com |
| ผู้ดูแลระบบ | st661102057104@gmail.com |

รหัสผ่านทุกคน: `ecobin123`
