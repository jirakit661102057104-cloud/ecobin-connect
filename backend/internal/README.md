# `internal/` — Layered Architecture (กำลัง migrate)

โครงสร้างเป้าหมายของ Backend EcoBin Connect  
**Entry จริงยังอยู่ที่** `backend/main.go` (Cloud Run / `go run .`)

ดูคู่มือเต็ม: [`docs/guides/08-go-layered-architecture.md`](../../docs/guides/08-go-layered-architecture.md)

```
internal/
  domain/        # entities
  dto/           # request/response JSON
  mapping/       # ToResponse manual
  repository/    # interfaces + mysql/
  service/       # business (waste ให้แต้มทันที)
  handler/       # HTTP
  middleware/    # auth context helpers
  server/        # router wiring (Phase 6–7)
```

ตัวอย่างที่พร้อมใช้แนวทาง DI แล้ว: `service.WasteService` + `handler.WasteHandler` + `repository/mysql.WasteRepo`

ยังไม่ผูกเข้า chi routes — ค่อยเปลี่ยน `POST /api/waste` ใน Phase 3–4 ของคู่มือ
