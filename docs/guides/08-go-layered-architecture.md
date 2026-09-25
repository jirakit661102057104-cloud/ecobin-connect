# Backend Go — Standard Layout + Layered Architecture

เอกสารออกแบบโครงสร้าง Backend EcoBin Connect  
สถานะปัจจุบัน: flat `package main` ใน `backend/*.go`  
เป้าหมาย: Standard Go Project Layout + Clean / Layered Architecture  
**Endpoint และ JSON response ต้องไม่เปลี่ยน** ระหว่าง migrate

อ้างอิงระบบจริง: [02-สถาปัตยกรรม.md](./02-สถาปัตยกรรม.md) · [06-uml-architecture.md](./06-uml-architecture.md)

---

## 1. ทำไมต้องปรับ

| ปัญหาวันนี้ | ผลกระทบ |
|---|---|
| `handlers.go` ~39KB รวม middleware + SQL + business | แก้แต้ม/คาร์บอนที่จุดเดียวยาก |
| SQL กระจายใน handler + `store.go` | ทดสอบ business logic ต้องมี MySQL |
| `package main` ทุกไฟล์ | import วน / แยกทีมทำไม่ได้ |
| Points ถูกเขียนหลายที่ (waste, redeem, bonus, admin) | ยอดแต้มกับ ledger เสี่ยงไม่ตรงกัน |

หลักการหลังปรับ:

```
HTTP → Handler (validate/DTO) → Service (business) → Repository (MySQL)
         ↑ middleware(auth/CORS)
Domain model ≠ DTO  (มี ToDomain / ToResponse แบบ manual)
```

---

## 2. ผังโฟลเดอร์เป้าหมาย (Directory Tree)

```
backend/
├── cmd/
│   ├── api/
│   │   └── main.go              # entry จริงของ Cloud Run (ย้ายจาก backend/main.go ใน Phase สุดท้าย)
│   ├── checkdb/                 # ของเดิม คงไว้
│   ├── dbping/
│   ├── migrateaudit/
│   └── setupcloud/
│
├── internal/                    # โค้ดเฉพาะ EcoBin — import จากภายนอกโมดูลนี้ไม่ได้ตาม convention
│   ├── config/
│   │   └── config.go            # อ่าน backend.env / Cloud Run env
│   ├── server/
│   │   └── router.go            # chi routes รวมทุกโมดูล (แทนบล็อกใน main.go)
│   │
│   ├── middleware/
│   │   ├── auth.go              # requireUser / requireAdmin / cookie JWT
│   │   ├── cors.go
│   │   └── request.go           # body size limit, request id
│   │
│   ├── domain/                  # Domain / DB entities (ไม่มี json tag ของ API ก็ได้)
│   │   ├── user.go
│   │   ├── waste.go
│   │   ├── points.go
│   │   ├── reward.go
│   │   ├── redemption.go
│   │   ├── bin.go
│   │   └── plastic.go
│   │
│   ├── dto/                     # Request / Response ตรงกับ Frontend
│   │   ├── waste.go             # CreateWasteRequest, WasteRecordResponse, CreateWasteResponse
│   │   ├── auth.go
│   │   ├── reward.go
│   │   └── common.go            # ErrorResponse
│   │
│   ├── handler/                 # HTTP only — ไม่คิดสูตรคาร์บอนเอง
│   │   ├── waste.go
│   │   ├── auth.go
│   │   ├── reward.go
│   │   ├── admin.go
│   │   ├── state.go             # GET /api/state (BFF aggregate)
│   │   └── health.go
│   │
│   ├── service/                 # Business rules
│   │   ├── waste.go             # camera-only, hash dedupe, ให้แต้มทันที, CMH/TGO
│   │   ├── points.go            # ศูนย์กลาง earn / redeem / bonus / refund
│   │   ├── auth.go
│   │   ├── reward.go
│   │   ├── redemption.go        # QR pickup code
│   │   └── carbon.go            # orchestrate plastic type + pkg/carbon
│   │
│   ├── repository/              # MySQL only
│   │   ├── mysql/
│   │   │   ├── db.go
│   │   │   ├── waste.go
│   │   │   ├── user.go
│   │   │   ├── points.go
│   │   │   ├── reward.go
│   │   │   ├── redemption.go
│   │   │   ├── bin.go
│   │   │   ├── plastic.go
│   │   │   └── event.go
│   │   └── interfaces.go        # interfaces ที่ service พึ่ง (สำหรับ mock เทส)
│   │
│   └── mapping/                 # ToDomain / ToResponse แยกชัด (หรืออยู่คู่ dto ก็ได้)
│       └── waste.go
│
├── pkg/                         # ใช้ซ้ำได้ / ไม่ผูก HTTP
│   ├── carbon/                  # สูตร mass × EF (pure, มี unit test)
│   ├── idgen/                   # newID("REC") / newID("TXN")
│   ├── httpx/                   # WriteJSON / ReadJSON
│   └── clock/                   # interface เวลา (เทสได้)
│
├── migrations/                  # (อนาคต) ย้ายจาก migrate.go runtime → ไฟล์ SQL versioned
├── uploads/
├── backend.env.example
├── Dockerfile                   # ชี้ไป cmd/api หลัง Phase สุดท้าย
├── go.mod                       # module github.com/pcru/ecobin-connect/api
└── go.sum
```

### แมปโมดูลธุรกิจ → ไฟล์

| โมดูล EcoBin | handler | service | repository |
|---|---|---|---|
| Auth & Session (JWT + Google id_token) | `handler/auth.go` | `service/auth.go` | `repository/mysql/user.go` |
| Waste Scanning & Records | `handler/waste.go` | `service/waste.go` + `service/carbon.go` | `repository/mysql/waste.go` |
| Points & Transactions | (เรียกจาก waste/reward) | **`service/points.go` เท่านั้น** | `repository/mysql/points.go` |
| Rewards & Redemptions / QR | `handler/reward.go` | `service/reward.go` + `redemption.go` | `reward.go` + `redemption.go` |
| Smart Bins & Categories | `handler/admin.go` | (บางส่วนใน admin service) | `bin.go` + `plastic.go` |

กฎสำคัญของโปรเจกต์นี้:

- **ให้แต้มทันที** เมื่อ `capture_source=camera` และบันทึก waste สำเร็จ (สถานะ `อนุมัติแล้ว`) — Admin **ไม่อนุมัติรูปเพื่อให้แต้ม**
- **Guest** สแกนได้แต่ไม่แตะ `users.total_points`
- **คาร์บอน** = มวล × EF ตาม CMH/TGO (`pkg/carbon` + ตาราง `plastic_types`)
- **Points ทุกทาง** ต้องผ่าน `PointsService` (earn/redeem/bonus/refund) เพื่อไม่ให้ ledger หลุด

---

## 3. Dependency rule (ลูกศรชี้เข้าด้านใน)

```
cmd/api
  → internal/server (router)
    → internal/handler
      → internal/service
        → internal/repository (interfaces)
          → repository/mysql (impl)
    → internal/middleware
pkg/*  ← ถูกเรียกจาก service ได้โดยตรง (pure helpers)
```

ห้าม:

- `repository` import `handler` / `service`
- `domain` import `dto` หรือ `chi`
- `pkg` import `internal`

---

## 4. ตัวอย่างโค้ด — โมดูล Waste Record

ตัวอย่างด้านล่างสะท้อน flow จริงของ `POST /api/waste` ใน `handlers.go` วันนี้  
ไฟล์ scaffold ที่ compile ได้: ดู `backend/internal/` + `backend/pkg/carbon/`

### 4.1 Domain model

```go
// internal/domain/waste.go
package domain

import "time"

type WasteRecord struct {
	RecordID              string
	UserID                string
	ImageURL              string
	PlasticType           string
	PlasticCode           *int
	BottleCount           int
	UploadTimestamp       time.Time
	VerificationStatus    string
	CarbonSaved           float64
	WeightKg              float64
	CarbonFootprint       float64
	CarbonAvoided         float64
	EmissionFactorVersion string
	PointsAwarded         int
	AdminComment          string
	BinLocation           string
	ImageHash             string
	CaptureSource         string
}
```

### 4.2 DTO + Manual mapping (ไม่ใช้ reflection)

```go
// internal/dto/waste.go
package dto

type CreateWasteRequest struct {
	ImageData     string   `json:"image_data"`
	PlasticType   string   `json:"plastic_type"`
	BottleCount   int      `json:"bottle_count"`
	BinLocation   string   `json:"bin_location"`
	WeightKg      *float64 `json:"weight_kg"`
	Confidence    float64  `json:"confidence"`
	ModelLabel    string   `json:"model_label"`
	CorrelationID string   `json:"correlation_id"`
	CaptureSource string   `json:"capture_source"`
	ImageHash     string   `json:"image_hash"`
}

type WasteRecordResponse struct {
	RecordID              string  `json:"record_id"`
	UserID                string  `json:"user_id"`
	UserName              string  `json:"user_name,omitempty"`
	ImageURL              string  `json:"image_url"`
	PlasticType           string  `json:"plastic_type"`
	BottleCount           int     `json:"bottle_count"`
	UploadTimestamp       string  `json:"upload_timestamp"`
	VerificationStatus    string  `json:"verification_status"`
	CarbonSaved           float64 `json:"carbon_saved"`
	WeightKg              float64 `json:"weight_kg"`
	CarbonFootprint       float64 `json:"carbon_footprint"`
	CarbonAvoided         float64 `json:"carbon_avoided"`
	EmissionFactorVersion string  `json:"emission_factor_version,omitempty"`
	PointsAwarded         int     `json:"points_awarded"`
	AdminComment          string  `json:"admin_comment"`
	BinLocation           string  `json:"bin_location,omitempty"`
}

type CreateWasteResponse struct {
	Record        WasteRecordResponse `json:"record"`
	User          UserResponse        `json:"user"`
	CorrelationID string              `json:"correlation_id"`
}
```

```go
// internal/mapping/waste.go
package mapping

import (
	"github.com/pcru/ecobin-connect/api/internal/domain"
	"github.com/pcru/ecobin-connect/api/internal/dto"
)

func WasteToResponse(w domain.WasteRecord, userName string) dto.WasteRecordResponse {
	return dto.WasteRecordResponse{
		RecordID:              w.RecordID,
		UserID:                w.UserID,
		UserName:              userName,
		ImageURL:              w.ImageURL,
		PlasticType:           w.PlasticType,
		BottleCount:           w.BottleCount,
		UploadTimestamp:       w.UploadTimestamp.Format("2006-01-02 15:04:05"),
		VerificationStatus:    w.VerificationStatus,
		CarbonSaved:           w.CarbonSaved,
		WeightKg:              w.WeightKg,
		CarbonFootprint:       w.CarbonFootprint,
		CarbonAvoided:         w.CarbonAvoided,
		EmissionFactorVersion: w.EmissionFactorVersion,
		PointsAwarded:         w.PointsAwarded,
		AdminComment:          w.AdminComment,
		BinLocation:           w.BinLocation,
	}
}
```

### 4.3 Repository interface + MySQL

```go
// internal/repository/interfaces.go
package repository

import (
	"context"
	"github.com/pcru/ecobin-connect/api/internal/domain"
)

type WasteRepository interface {
	ImageHashExists(ctx context.Context, userID, hash string) (bool, error)
	Insert(ctx context.Context, rec domain.WasteRecord) error
	GetByID(ctx context.Context, recordID string) (domain.WasteRecord, error)
}

type PointsRepository interface {
	AddEarn(ctx context.Context, userID, recordID, txnID string, points int, carbon float64, desc string) error
}

type PlasticRepository interface {
	ListActive(ctx context.Context) ([]domain.PlasticType, error)
}

type UserRepository interface {
	GetByID(ctx context.Context, userID string) (domain.User, error)
}

type ImageStore interface {
	SaveWasteImage(imageData, recordID string) (url string, hash string, err error)
}
```

### 4.4 Service (business)

```go
// internal/service/waste.go (โครงสร้าง)
type WasteService struct {
	waste   repository.WasteRepository
	points  repository.PointsRepository // หรือ PointsService
	plastic repository.PlasticRepository
	users   repository.UserRepository
	images  repository.ImageStore
	ids     idgen.Generator
	carbon  *CarbonService
}

func (s *WasteService) CreateFromCamera(ctx context.Context, userID string, req dto.CreateWasteRequest) (dto.CreateWasteResponse, error) {
	// 1) validate capture_source == "camera"
	// 2) save image + hash; reject duplicate hash (409)
	// 3) carbonCalc := s.carbon.ForPlastic(...)
	// 4) points := bottleCount * pointsPerBottle; status = "อนุมัติแล้ว"
	// 5) insert waste_records
	// 6) s.points.Earn(...)  — ห้าม UPDATE users ใน service อื่น
	// 7) map ToResponse + return 201 shape เดิม
}
```

### 4.5 Handler

```go
// internal/handler/waste.go
type WasteHandler struct {
	svc *service.WasteService
}

func (h *WasteHandler) Create(w http.ResponseWriter, r *http.Request) {
	me := middleware.UserFromContext(r.Context()) // ฉีดจาก requireUser
	var req dto.CreateWasteRequest
	if err := httpx.ReadJSON(r, &req); err != nil {
		httpx.WriteJSON(w, 400, dto.ErrorResponse{Error: "ข้อมูลไม่ถูกต้อง"})
		return
	}
	out, err := h.svc.CreateFromCamera(r.Context(), me.UserID, req)
	// map domain errors → 400/409/500 ให้ข้อความไทยเหมือนเดิม
	httpx.WriteJSON(w, 201, out)
}
```

### 4.6 Dependency Injection ใน `cmd/api/main.go` (เป้าหมาย)

```go
db := mysql.OpenFromEnv()
wasteRepo := mysql.NewWasteRepo(db)
pointsRepo := mysql.NewPointsRepo(db)
plasticRepo := mysql.NewPlasticRepo(db)
userRepo := mysql.NewUserRepo(db)
images := mysql.NewImageStore(uploadDir)

carbonSvc := service.NewCarbonService(plasticRepo, settingsRepo)
pointsSvc := service.NewPointsService(pointsRepo) // ศูนย์กลางแต้ม
wasteSvc := service.NewWasteService(wasteRepo, pointsSvc, plasticRepo, userRepo, images, idgen.Default, carbonSvc)

wasteH := handler.NewWasteHandler(wasteSvc)
authMW := middleware.NewAuth(userRepo, jwtSecret)

r := server.NewRouter(server.Deps{
	Waste: wasteH,
	Auth:  authMW,
	// ...
})
```

---

## 5. Step-by-step Migration (ไม่ให้ endpoint พัง)

หลัก: **strangler fig** — แยกแพ็กเกจทีละชิ้น แล้วให้ `package main` เดิมเรียกของใหม่ จนเหลือแค่ thin wrapper

| Phase | ทำอะไร | เกณฑ์ผ่าน | อย่าทำ |
|---|---|---|---|
| **0** | เอกสารนี้ + สร้างโฟลเดอร์ `internal/`, `pkg/` | `go test ./...` ผ่าน | ย้าย route |
| **1** | ย้าย pure functions → `pkg/carbon`, `pkg/idgen`, `pkg/httpx` | unit test คาร์บอนเท่าเดิม | แตะ handler |
| **2** | สร้าง `domain` + `dto` + `mapping` ของ Waste (ยังไม่ใช้) | compile | เปลี่ยน JSON field |
| **3** | สร้าง `repository/mysql/waste.go` ดึง SQL ออกจาก `handleCreateWaste` | `POST /api/waste` เหมือนเดิม (manual/e2e) | เปลี่ยน status/ข้อความ error |
| **4** | สร้าง `service/waste.go` + `service/points.go` ให้ handler บางลง | points ledger ตรง | ให้ handler อื่น UPDATE points เองต่อ |
| **5** | ทำ Auth / Rewards / Bins แบบเดียวกับ Waste | ทุก route ใน main ยังชี้ของเดิมหรือ facade | big-bang rewrite |
| **6** | รวม routes ใน `internal/server/router.go` | smoke: `/health`, `/api/state`, login, waste, redeem | |
| **7** | ย้าย entry → `cmd/api/main.go` + แก้ Dockerfile / `run.bat` เป็น `go run ./cmd/api` | Cloud Run deploy สำเร็จ | ลบไฟล์เก่าก่อนยืนยัน |

### Checklist ต่อหนึ่ง endpoint ที่ย้าย

1. คัดลอก path / method / auth middleware ให้เหมือนเดิม  
2. คัดลอกข้อความ error ภาษาไทยทุก branch  
3. คัดลอก JSON keys (`record`, `user`, `correlation_id`, …)  
4. รันเทียบ response ก่อน/หลังด้วย request เดิม  
5. ค่อยลบฟังก์ชันเก่าใน `handlers.go`

### สิ่งที่ควรแยกก่อน (ROI สูงสุดในโปรเจกต์นี้)

1. **`pkg/carbon`** — มีสูตรชัด + มี `carbon_test.go` อยู่แล้ว  
2. **`service/points`** — ตัดจุดเสี่ยงยอดแต้มไม่ตรง  
3. **`POST /api/waste`** — flow ธุรกิจหลักของแอป  

### สิ่งที่ควรย้ายทีหลัง

- `GET /api/state` (BFF รวมหลายตาราง — พึ่ง repos ครบก่อน)  
- `migrate.go` / seed (แยกเป็น `cmd` + `internal/migrate` ได้ แต่ไม่เร่ง)  
- Gemini `handleScan` (ไม่ใช่ flow หลักของ client TM)

---

## 6. สถานะ scaffold ใน repo

| path | บทบาท |
|---|---|
| `backend/pkg/carbon/` | สูตร CMH/TGO แยกแล้ว (Phase 1 เริ่มได้) |
| `backend/internal/domain|dto|mapping|repository|service|handler/` | ตัวอย่าง Waste แนว layered |
| `backend/main.go` + `handlers.go` | **ยังเป็น entry จริง** จนกว่า Phase 7 |

ดูโค้ดตัวอย่างที่รันเทสได้ใน `backend/internal/` และคำอธิบายสั้นใน `backend/internal/README.md`

---

## 7. สรุปสั้น

- เป้าหมายคือ **Handler บาง · Service หนา · Repository คุย DB · DTO แยกจาก Domain**  
- EcoBin ต้องมี **PointsService ศูนย์กลาง** และ **Waste ให้แต้มทันทีจากกล้อง**  
- Migrate แบบค่อยเป็นค่อยไป — **อย่าย้าย `cmd/api` จนกว่าทุก route จะผ่าน service แล้ว**
