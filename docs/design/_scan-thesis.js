const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const doc = "d:\\Jirakit_IT04\\วิจัยแอปพลิเคชั่น เล่มสมบูรณ์ 09202026.docx";
const outDir = path.join(process.env.TEMP || ".", "ecobin-thesis-extract");

if (!fs.existsSync(doc)) {
  console.log("NOT_FOUND", doc);
  process.exit(1);
}

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

// Use PowerShell Expand-Archive won't work on docx; use tar or copy unzip
try {
  execSync(`tar -xf "${doc}" -C "${outDir}"`, { stdio: "pipe" });
} catch (e) {
  // fallback: powershell Expand via .NET in a small ps1
  const ps1 = path.join(outDir, "_unz.ps1");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    ps1,
    `
Add-Type -AssemblyName System.IO.Compression.FileSystem
$doc = '${doc.replace(/'/g, "''")}'
$tmp = '${outDir.replace(/'/g, "''")}'
if (Test-Path -LiteralPath $tmp) { Remove-Item -LiteralPath $tmp -Recurse -Force }
New-Item -ItemType Directory -Path $tmp | Out-Null
[System.IO.Compression.ZipFile]::ExtractToDirectory($doc, $tmp)
`
  );
  execSync(`powershell -NoProfile -File "${ps1}"`, { stdio: "inherit" });
}

const xmlPath = path.join(outDir, "word", "document.xml");
if (!fs.existsSync(xmlPath)) {
  console.log("NO_XML");
  process.exit(1);
}
const xml = fs.readFileSync(xmlPath, "utf8");
const paras = [];
const pRe = /<w:p[\s\S]*?<\/w:p>/g;
let m;
while ((m = pRe.exec(xml))) {
  const ts = [...m[0].matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((x) => x[1]);
  const t = ts.join("").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();
  if (t) paras.push(t);
}

console.log("PARA_COUNT", paras.length);
// Print likely TOC / chapter headings
const headingLike = paras.filter((t) =>
  /^(บทที่|บท\s*\d|สารบัญ|บทคัดย่อ|ABSTRACT|CHAPTER|ส่วนที่|\d+(\.\d+)*\s+|ภาคผนวก|บรรณานุกรม|กิตติกรรม|Abstract)/i.test(
    t
  ) ||
  /ออกแบบ|ผู้ใช้|UX|UI|wireframe|ระบบ|สถาปัต|ทดลอง|สรุป|วัตถุประสงค์|ขอบเขต|ทฤษฎี|framework|heuristic|journey|flow/i.test(
    t
  )
);
console.log("---HEADING_LIKE---");
headingLike.slice(0, 120).forEach((t) => console.log(t));
console.log("---SAMPLE_FIRST_80---");
paras.slice(0, 80).forEach((t) => console.log(t));
