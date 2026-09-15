# การ Deploy

## GitHub

รีโป: https://github.com/jirakit661102057104-cloud/ecobin-connect

สาขาที่ใช้: `main`  
Vercel ดึงจากสาขานี้เมื่อมี push

อัปโค้ดจากเครื่อง (PowerShell ในโฟลเดอร์โปรเจกต์):

```powershell
git add -A
git status
git commit -m "อธิบายสิ่งที่เปลี่ยน"
git push origin main
```

อย่า commit `backend/backend.env` หรือ `frontend/.env.local`

## Vercel (หน้าเว็บ)

1. Import รีโป `ecobin-connect`
2. **Root Directory = `frontend`**
3. Environment Variables ที่ควรมี

| ชื่อ | ค่า | หมายเหตุ |
|---|---|---|
| `API_PROXY_TARGET` | URL Cloud Run ไม่มี `/` ท้าย | ตอนนี้ใส่ใน `frontend/vercel.json` ด้วย |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Client ID ของ OAuth Web | ค่าสาธารณะ |
| `NEXT_PUBLIC_DEMO_LOGIN` | `false` | ปิดโหมดเดโมบนเว็บจริง |

อย่าใส่บน Vercel: `GOOGLE_CLIENT_SECRET`, `MYSQL_DSN`, `JWT_SECRET`, `GEMINI_API_KEY`

หลังแก้ env ที่ขึ้นต้น `NEXT_PUBLIC_` ต้อง Redeploy

หน้าเว็บ: https://ecobin-connect-8ap5.vercel.app

## Cloud Run (API)

สคริปต์: `deploy-cloud-run.bat` เรียก `deploy-cloud-run.ps1`

จากโฟลเดอร์โปรเจกต์ใน PowerShell:

```powershell
.\deploy-cloud-run.bat
```

สคริปต์จะ

- ล็อกอิน gcloud ถ้ายังไม่มี
- หา Cloud SQL ชื่อ `ecobin-mysql` ในโปรเจกต์ที่มีอยู่
- เปิด API ที่ต้องใช้
- ให้สิทธิ์ Cloud SQL แก่บัญชีบริการ
- build จาก `backend/Dockerfile`
- ตั้ง env โหมด production และต่อ Unix socket ไปยัง Cloud SQL

URL ที่ใช้จริง:

https://ecobin-api-568301593385.asia-southeast1.run.app

หลังแก้โค้ดฝั่ง Go ให้รันสคริปต์นี้อีกครั้ง (หรือ `gcloud run deploy`) แล้วตรวจ `/health`

## โดเมน jirakit.site

1. Vercel → Settings → Domains → เพิ่ม `jirakit.site`
2. ที่ Hostinger กด **จัดการ** แล้วตั้ง DNS ตามที่ Vercel บอก โดยทั่วไป
   - A `@` → IP ที่ Vercel แสดง (มักเป็น `76.76.21.21`)
   - CNAME `www` → ค่าที่ Vercel แสดง
3. เพิ่มโดเมนนี้ใน Google OAuth ด้วย
4. ใส่โดเมนใน `CORS_ORIGIN` ของ Cloud Run ถ้ามีการเรียก API ตรงจากเบราว์เซอร์

## สิ่งที่ไม่ต้องเปิดบนเครื่องตอนใช้เว็บจริง

- `run.bat`
- `cloudflared`
- Go API local พอร์ต 8080
