"""Capture wireframe (22 panels) + pattern library (atoms / molecules+organisms) for Word."""
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = Path(__file__).resolve().parents[2]  # docs/
OUT_WF = Path(__file__).resolve().parent / "wireframe"
OUT_PAT = Path(__file__).resolve().parent / "patterns"
OUT_WF.mkdir(parents=True, exist_ok=True)
OUT_PAT.mkdir(parents=True, exist_ok=True)

WF_URL = "http://127.0.0.1:8765/wireframes/index.html"
PAT_URL = "http://127.0.0.1:8765/design/patterns.html"

WIREFRAMES = [
    ("01-login", "login", "Member · Login / Register / Guest / Google"),
    ("02-dashboard", "dashboard", "Member · Dashboard"),
    ("03-scan", "scan", "Member · สแกนขยะ"),
    ("04-guest-scan", "guest-scan", "Guest · สแกนทดลอง"),
    ("05-rewards", "rewards", "Member · ของรางวัล"),
    ("06-redeem-modal", "redeem-modal", "Member · Modal แลก"),
    ("07-history", "history", "Member · ประวัติ"),
    ("08-guide", "guide", "Member · คู่มือ"),
    ("09-settings", "settings", "Member · ตั้งค่า"),
    ("10-profile-modal", "profile-modal", "Member · กรอกโปรไฟล์"),
    ("11-research-modal", "research-modal", "Member · เกี่ยวกับโครงการ"),
    ("12-admin-overview", "admin", "Admin · ภาพรวม"),
    ("13-admin-qr", "admin-qr", "Admin · สแกน QR"),
    ("14-admin-scans", "admin-scans", "Admin · รายการสแกน"),
    ("15-admin-users", "admin-users", "Admin · สมาชิก"),
    ("16-admin-rewards", "admin-rewards", "Admin · จัดการรางวัล"),
    ("17-admin-redemptions", "admin-redemptions", "Admin · คิวรับของ"),
    ("18-admin-bins", "admin-bins", "Admin · จุดทิ้ง"),
    ("19-admin-rules", "admin-rules", "Admin · กฎระบบ"),
    ("20-admin-activity", "admin-activity", "Admin · Activity Log"),
    ("21-admin-relations", "admin-relations", "Admin · ประวัติผู้ใช้"),
    ("22-admin-crud", "admin-crud", "Admin · Modal CRUD"),
]


def capture_wireframes(page):
    page.goto(WF_URL, wait_until="networkidle", timeout=60000)
    page.set_viewport_size({"width": 1280, "height": 900})
    # hide sticky chrome for cleaner thesis caps
    page.add_style_tag(
        content="""
      .top-shell, .screen-tools, .ds-footer, #screen-nav, #screen-nav-admin { display: none !important; }
      body { background: #edf5f1 !important; }
      .screen-panel { display: none !important; }
      .screen-panel.active { display: block !important; }
    """
    )
    for fname, key, _label in WIREFRAMES:
        # activate panel via JS (same as nav)
        page.evaluate(
            """(key) => {
          document.querySelectorAll('.screen-panel').forEach(el => el.classList.remove('active'));
          const el = document.getElementById('screen-' + key);
          if (el) el.classList.add('active');
          window.scrollTo(0, 0);
        }""",
            key,
        )
        page.wait_for_timeout(200)
        panel = page.locator(f"#screen-{key}")
        panel.wait_for(state="visible")
        out = OUT_WF / f"{fname}.png"
        panel.screenshot(path=str(out), type="png")
        print(f"WF  {out.name}")


def capture_patterns(page):
    page.goto(PAT_URL, wait_until="networkidle", timeout=60000)
    page.set_viewport_size({"width": 1400, "height": 900})
    page.add_style_tag(
        content="""
      .eco-chrome, .ds-footer, header.doc, .top-shell { display: none !important; }
      body { background: #f4f7f5 !important; padding: 24px !important; }
    """
    )
    frames = page.locator("section.frame")
    count = frames.count()
    # Frame 1 Atoms, Frame 2 Molecules/Organisms — also split molecule vs organism blocks if caps exist
    for i in range(count):
        frame = frames.nth(i)
        label = frame.locator(".frame-label").inner_text().strip().replace(" · ", "-").replace(" ", "-")
        safe = "".join(c if c.isalnum() or c in "-_" else "-" for c in label)
        out = OUT_PAT / f"{i+1:02d}-{safe}.png"
        frame.screenshot(path=str(out), type="png")
        print(f"PAT {out.name}")

    # Extra: crop molecule caps and organism caps individually from frame 2
    page.evaluate("window.scrollTo(0, 0)")
    frame2 = page.locator('section.frame[aria-label*="Molecules"]').first
    if frame2.count() == 0:
        frame2 = frames.nth(1) if count > 1 else frames.nth(0)

    # Each .cap's parent card-like block — capture by .cap text groups
    caps = frame2.locator(".cap")
    n = caps.count()
    for i in range(n):
        cap = caps.nth(i)
        text = cap.inner_text().strip()
        card = cap.locator("xpath=..")
        kind = "organism" if text.lower().startswith("organism") else "molecule"
        # ASCII-safe filename
        safe = "".join(c if (c.isascii() and (c.isalnum() or c in "-_")) else "-" for c in text)
        while "--" in safe:
            safe = safe.replace("--", "-")
        safe = safe.strip("-")[:60] or f"item-{i+1}"
        out = OUT_PAT / f"{kind}-{i+1:02d}-{safe}.png"
        try:
            card.screenshot(path=str(out), type="png")
            print(f"PAT {out.name}")
        except Exception as e:
            print(f"skip item {i+1}: {type(e).__name__}")


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(device_scale_factor=2)
        capture_wireframes(page)
        capture_patterns(page)
        browser.close()
    print("DONE")
    print(f"Wireframe -> {OUT_WF}")
    print(f"Patterns  -> {OUT_PAT}")


if __name__ == "__main__":
    main()
