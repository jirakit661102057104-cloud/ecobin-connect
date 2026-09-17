# Google Sign-In

ใช้ Google Identity Services โหมด redirect กลับมาที่หน้า `/login` จากนั้นเว็บส่ง id token ไปที่ API `POST /api/auth/google`

## ค่าที่ต้องใส่ใน Google Cloud Console

ไปที่ [Credentials](https://console.cloud.google.com/apis/credentials) เปิด OAuth 2.0 Client ID แบบ Web application ชุดเดียวกับที่อยู่ในระบบ

### Authorized JavaScript origins

```
http://localhost:3000
https://ecobin-connect-8ap5.vercel.app
```

ไม่มี `/` ท้ายโดเมน

### Authorized redirect URIs

```
http://localhost:3000
http://localhost:3000/login
https://ecobin-connect-8ap5.vercel.app
https://ecobin-connect-8ap5.vercel.app/login
```

ถ้าใช้ `jirakit.site` ให้เพิ่มคู่ origin และ `/login` ของโดเมนนั้นด้วย

กด **Save** แล้วรอ 2–5 นาที

`GOOGLE_CLIENT_ID` ใส่ที่ Vercel ได้  
`GOOGLE_CLIENT_SECRET` ใส่ได้เฉพาะ Cloud Run / `backend.env` ห้ามใส่ frontend

## Error ที่เคยเจอ

### Google login สำเร็จแล้วแต่เด้งกลับหน้า login (localhost)

Cloud Run ส่ง cookie แบบ `Secure` — บน `http://localhost` เบราว์เซอร์ทิ้ง cookie  
แก้แล้วใน `proxyToApi.ts` (ถอด Secure ตอน proxy ผ่าน HTTP) และใช้ Google **popup** บน localhost

### Error 400: redirect_uri_mismatch

Google ยังไม่มี URL ที่แอปส่งกลับมาในรายการ Redirect URIs หรือมี `/` ท้ายไม่ตรง

ตรวจว่ามี `https://ecobin-connect-8ap5.vercel.app` **ไม่มี slash ท้าย** และมี `.../login`

### Google ไม่สำเร็จ / Failed to fetch

OAuth ผ่านแล้ว แต่เว็บเรียก API ไม่ถึง (เคยยิง localhost) ดู [02-สถาปัตยกรรม.md](./02-สถาปัตยกรรม.md) และตรวจ Cloud Run `/health`

## ไฟล์ที่เกี่ยวข้อง

- `frontend/src/components/GoogleSignInButton.tsx` — ปุ่ม Google, `login_uri` เป็น `{origin}/login`
- `frontend/src/middleware.ts` — รับ POST ที่ `/login` จาก Google
- `frontend/src/lib/googleCredentialRedirect.ts` — เก็บ credential ชั่วคราวแล้วเด้งไป `/login?google=1`
- `backend` — `POST /api/auth/google` ตรวจ token และออก cookie
