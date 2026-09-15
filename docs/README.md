# เอกสาร EcoBin Connect

โฟลเดอร์นี้สรุปงานที่ปรับระบบให้ขึ้นเว็บจริง ล็อกอิน Google ได้ และ API ทำงานตลอดเวลาโดยไม่ต้องเปิดโน้ตบุ๊ก

| ไฟล์ | เนื้อหา |
|---|---|
| [01-สรุปงานที่ทำ.md](./01-สรุปงานที่ทำ.md) | สิ่งที่แก้ในรอบนี้ ทีละเรื่อง |
| [02-สถาปัตยกรรม.md](./02-สถาปัตยกรรม.md) | เว็บ / API / ฐานข้อมูล อยู่ที่ไหน |
| [03-deploy.md](./03-deploy.md) | GitHub, Vercel, Cloud Run, โดเมน |
| [04-google-login.md](./04-google-login.md) | ตั้งค่า Google OAuth และ error ที่เจอ |
| [05-พัฒนาบนเครื่อง.md](./05-พัฒนาบนเครื่อง.md) | รัน local ด้วย `run.bat` |

## ที่อยู่ระบบตอนนี้

- เว็บ: https://ecobin-connect-8ap5.vercel.app
- หน้า login: https://ecobin-connect-8ap5.vercel.app/login
- API (Cloud Run): https://ecobin-api-568301593385.asia-southeast1.run.app
- ตรวจ API: https://ecobin-api-568301593385.asia-southeast1.run.app/health ต้องได้ `{"status":"ok"}`
- โค้ด: https://github.com/jirakit661102057104-cloud/ecobin-connect
- โดเมนที่ซื้อไว้: `jirakit.site` (ผูก DNS กับ Vercel แล้วค่อยใช้เป็นชื่อหลัก)

## เล่มวิจัย Word

- `docs/วิจัยแอปพลิเคชั่น เล่ม.docx` — ปรับเนื้อหาให้สอดคล้องกับเว็บแอป EcoBin Connect แล้ว
- `docs/วิจัยแอปพลิเคชั่น เล่ม-ต้นฉบับก่อนปรับ.docx` — สำเนาเดิมก่อนแก้ (ออกแบบเป็นแอปมือถือ)

ปิดเครื่องได้ เว็บกับ API ยังทำงาน เพราะไม่ได้รันจากเทอร์มินัลบนโน้ตบุ๊กแล้ว
