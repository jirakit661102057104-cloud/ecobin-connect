"""Re-capture Pattern library Frame 1 + Frame 2 (molecules/organisms)."""
from pathlib import Path
from playwright.sync_api import sync_playwright

OUT = Path(__file__).resolve().parent / "patterns"
OUT.mkdir(parents=True, exist_ok=True)
URL = "http://127.0.0.1:8765/design/patterns.html"


def ascii_slug(text: str, fallback: str) -> str:
    safe = "".join(c if (c.isascii() and (c.isalnum() or c in "-_")) else "-" for c in text)
    while "--" in safe:
        safe = safe.replace("--", "-")
    safe = safe.strip("-")[:60]
    return safe or fallback


def main() -> None:
    for old in OUT.glob("*.png"):
        old.unlink()

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(device_scale_factor=2)
        page.goto(URL, wait_until="networkidle", timeout=60000)
        page.set_viewport_size({"width": 1400, "height": 900})
        page.add_style_tag(
            content="""
            .eco-chrome, .ds-footer, header.doc, .top-shell { display: none !important; }
            body { background: #f4f7f5 !important; padding: 24px !important; }
            """
        )

        frames = page.locator("section.frame")
        for i in range(frames.count()):
            frame = frames.nth(i)
            label = frame.locator(".frame-label").inner_text().strip()
            slug = ascii_slug(label, f"frame-{i+1}")
            out = OUT / f"{i+1:02d}-{slug}.png"
            frame.screenshot(path=str(out), type="png")
            print(f"FRAME {out.name}")

        frame2 = frames.nth(1)
        caps = frame2.locator(".cap")
        for i in range(caps.count()):
            cap = caps.nth(i)
            text = cap.inner_text().strip()
            card = cap.locator("xpath=..")
            kind = "organism" if text.lower().startswith("organism") else "molecule"
            slug = ascii_slug(text, f"item-{i+1}")
            out = OUT / f"{kind}-{i+1:02d}-{slug}.png"
            card.screenshot(path=str(out), type="png")
            print(f"{kind.upper()} {out.name}")

        browser.close()
    print("DONE ->", OUT)


if __name__ == "__main__":
    main()
