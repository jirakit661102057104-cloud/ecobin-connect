# -*- coding: utf-8 -*-
import re
from pathlib import Path

raw = Path(
    r"d:\Jirakit_IT04\Project\ecobin-connect\.agents\tmp-thesis-edit\unpacked\word\document.xml"
).read_text(encoding="utf-8")
full = "".join(re.findall(r"<w:t[^>]*>([^<]*)</w:t>", raw))
checks = [
    "ดูรายการสแกนที่ AI ตรวจแล้ว (อ่านอย่างเดียว",
    "สแกน QR หรือรหัสรับของเพื่อยืนยันการจ่าย",
    "ถ่ายภาพขวดพลาสติกจากกล้องในแอปเพื่อสะสมแต้ม",
    "ได้แต้มทันทีเมื่อผลการวิเคราะห์ของ AI",
    "ทดลองสแกนขวดพลาสติกได้",
    "เมื่อผู้ใช้ถ่ายภาพจากกล้องในแอปและโมเดล",
    "ดูรายการสแกนที่ AI ตรวจแล้ว จัดการข้อมูลผู้ใช้",
    "รายการสแกนที่ AI ตรวจแล้วของ Admin",
    "กระบวนการที่ 2.3 ดูรายการสแกนที่ AI ตรวจแล้ว",
    "สถานะตามผล AI",
    "ตรวจสอบและอนุมัติภาพ",
    "ภาพรวมรอตรวจ",
    "รับการแจ้งเตือนผลการตรวจสอบ",
    "ส่วนผู้ดูแลระบบดูรายการสแกนที่ AI ตรวจแล้วแบบอ่านอย่างเดียว",
]
lines = []
for c in checks:
    flag = "YES" if c in full else "NO "
    lines.append(f"{flag} | {c[:60]}")
Path(r"d:\Jirakit_IT04\Project\ecobin-connect\.agents\tmp-thesis-edit\verify.txt").write_text(
    "\n".join(lines), encoding="utf-8"
)
print("\n".join(lines))
