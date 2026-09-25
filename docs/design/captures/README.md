# Captures สำหรับใส่ Word — Wireframe + Pattern library

สร้างด้วย `capture_all.py` / `capture_patterns.py`  
โฟลเดอร์: `docs/design/captures/`

## 1) Wireframe (22 แผ่น) — `wireframe/`

ดูตารางเดิมในประวัติ / ไฟล์ `01`–`22` ยังครบ

**ใส่เล่มแบบย่อ:** Member 01,02,03,04,05,07 · Admin 12,13,14,17

---

## 2) Pattern library — `patterns/` (อัปเดต: Molecules / Organisms ขยาย)

### ทั้งเฟรม
| ไฟล์ | คำบรรยายใต้รูป |
|---|---|
| `01-FRAME-1-ATOMS.png` | Pattern library — Atoms |
| `02-FRAME-2-MOLECULES-ORGANISMS-ECOBIN.png` | Pattern library — Molecules / Organisms (EcoBin) |

### Molecules (15)
| ไฟล์ | คำบรรยาย |
|---|---|
| `molecule-01-Brand-lockup.png` | Brand lockup (EcoBin + PCRU) |
| `molecule-02-Points-chip.png` | Points chip |
| `molecule-03-Badges.png` | Badges / สถานะ |
| `molecule-04-AI-result-chip.png` | AI result chip |
| `molecule-05-Form-field-label.png` | Form field + label |
| `molecule-06-Search-History-Admin.png` | Search (History / Admin) |
| `molecule-07-CTA-buttons.png` | CTA buttons (Login / Google / Guest) |
| `molecule-08-Guest-notice.png` | Guest notice |
| `molecule-09-Pickup-code.png` | Pickup code |
| `molecule-10-Icon-buttons.png` | Icon buttons |
| `molecule-11-Nav-pills-Member-Admin.png` | Nav pills |
| `molecule-12-Subnav-tabs-Admin.png` | Subnav tabs |
| `molecule-13-Scan-flow-stepper.png` | Scan flow stepper |
| `molecule-14-Color-status-dots.png` | Status dots |
| `molecule-15-Dropdown-Admin.png` | Dropdown (Admin) |

### Organisms (8)
| ไฟล์ | คำบรรยาย |
|---|---|
| `organism-16-Organism-App-header.png` | App header |
| `organism-17-Organism-Dashboard-hero.png` | Dashboard hero |
| `organism-18-Organism-KPI-strip.png` | KPI strip |
| `organism-19-Organism-Scanner-module.png` | Scanner module |
| `organism-20-Organism-Reward-cards.png` | Reward cards |
| `organism-21-Organism-Admin-table.png` | Admin table (อ่านอย่างเดียว) |
| `organism-22-Organism-Redeem-modal-QR.png` | Redeem modal + QR |
| `organism-23-Organism-Guest-notice-block.png` | Guest notice block |

**ใส่ Word แบบย่อ:** ใช้ `02-FRAME-2-…png` ทั้งเฟรม  
หรือเลือก organism 16–22 + molecule 01,02,03,04,07,09,11

## สร้างใหม่
```powershell
python -m http.server 8765 --directory docs
python docs/design/captures/capture_patterns.py
```
