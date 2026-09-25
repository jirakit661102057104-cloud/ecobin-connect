# -*- coding: utf-8 -*-
from pathlib import Path
t = Path(r"d:\Jirakit_IT04\Project\ecobin-connect\.agents\tmp-thesis-edit\toc-region.txt").read_text(encoding="utf-8")
err = ("ไม่ได้กำหนดบุ๊กมาร์ก" in t) or ("Bookmark not defined" in t) or ("ผิดพลาด!" in t)
out = []
out.append(f"bookmark_error={err}")
out.append(f"lines={len(t.splitlines())}")
out.append("--- first 40 lines ---")
out.extend(t.splitlines()[:40])
Path(r"d:\Jirakit_IT04\Project\ecobin-connect\.agents\tmp-thesis-edit\toc-verify.txt").write_text("\n".join(out), encoding="utf-8")
print("wrote toc-verify.txt err=", err)
