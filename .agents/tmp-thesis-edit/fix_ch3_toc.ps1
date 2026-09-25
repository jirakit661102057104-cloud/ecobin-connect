$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$targetsPath = "d:\Jirakit_IT04\Project\ecobin-connect\.agents\tmp-thesis-edit\ch3-targets.json"
$logPath = "d:\Jirakit_IT04\Project\ecobin-connect\.agents\tmp-thesis-edit\toc-ch3-log.txt"
$work = "d:\Jirakit_IT04\Project\ecobin-connect\.agents\tmp-thesis-edit\toc-ch3-work.docx"

$log = New-Object System.Collections.Generic.List[string]
$targets = Get-Content -LiteralPath $targetsPath -Raw -Encoding UTF8 | ConvertFrom-Json

$desktop = Get-ChildItem "c:\Users\Lenovo\OneDrive\Desktop\*.docx" | Where-Object {
  $_.Name -notlike "*backup*" -and $_.Length -gt 10000000
} | Sort-Object LastWriteTime -Descending | Select-Object -First 1
$log.Add("desktop=$($desktop.Name)")
Copy-Item -LiteralPath $desktop.FullName -Destination $work -Force

function Norm([string]$s) {
  if ($null -eq $s) { return "" }
  $s = $s -replace "[\r\n\u0007]", ""
  $s = $s.Trim()
  $s = $s -replace "\s+", " "
  return $s
}

function Try-SetStyle($para, [string[]]$names) {
  foreach ($n in $names) {
    if ([string]::IsNullOrWhiteSpace($n)) { continue }
    try { $para.Range.Style = $n; return $n } catch {}
  }
  return $null
}

$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0

try {
  $doc = $word.Documents.Open((Resolve-Path $work).Path, $false, $false)
  $inCh3 = $false
  $seen34 = $false
  $h1 = 0; $h2 = 0; $demoted = 0

  $bodyStyle = [string]$targets.body_style
  try { $null = $doc.Styles.Item($bodyStyle) } catch { $bodyStyle = "Normal" }

  foreach ($p in $doc.Paragraphs) {
    $t = Norm $p.Range.Text
    if ([string]::IsNullOrWhiteSpace($t)) { continue }

    if ($t -match "^\u0E1A\u0E17\u0E17\u0E35\u0E48\s*3$") {
      $inCh3 = $true
      $seen34 = $false
      $used = Try-SetStyle $p @([string]$targets.h1_style)
      $log.Add("H1=$t style=$used")
      $h1++
      continue
    }
    if ($t -match "^\u0E1A\u0E17\u0E17\u0E35\u0E48\s*4") { $inCh3 = $false; continue }
    if (-not $inCh3) { continue }

    $styleName = ""
    try { $styleName = [string]$p.Range.Style.NameLocal } catch {}

    $keep = $false
    if ($t -match '^3\.1' -and $t -match 'Analysis') { $keep = $true }
    elseif ($t -match '^3\.2' -and $t -match 'System Analysis') { $keep = $true }
    elseif ($t -match '^3\.3' -and $t -match 'System Design') { $keep = $true }
    elseif ($t -match '^3\.4' -and $t -notmatch '^3\.4\.' -and $t.Length -ge 34) {
      # real heading includes trailing word (mini-outline is shorter)
      $keep = $true
      $seen34 = $true
    }
    elseif ($t -match '^3\.5' -and $t -notmatch '^3\.5\.' -and $seen34 -and $t.Length -lt 80 -and $t -notmatch 'Hardware|Software') {
      $keep = $true
    }

    if ($keep) {
      $used = Try-SetStyle $p @([string]$targets.h2_style)
      $log.Add("H2 keep=$t style=$used")
      $h2++
      continue
    }

    if ($styleName -eq ([string]$targets.h2_style) -or $styleName -eq ([string]$targets.h1_style)) {
      $used = Try-SetStyle $p @($bodyStyle, "Normal")
      $short = $t
      if ($short.Length -gt 60) { $short = $short.Substring(0,60) }
      $log.Add("demote=$short to=$used")
      $demoted++
    }
  }
  $log.Add("counts h1=$h1 h2=$h2 demoted=$demoted")

  if ($doc.TablesOfContents.Count -ge 1) {
    $toc = $doc.TablesOfContents.Item(1)
    try {
      $toc.UseHeadingStyles = $true
      $toc.UpperHeadingLevel = 1
      $toc.LowerHeadingLevel = 2
      $toc.UseFields = $false
      $toc.UseHyperlinks = $true
      $toc.IncludePageNumbers = $true
      $toc.RightAlignPageNumbers = $true
    } catch { $log.Add("toc props: $_") }
    $toc.Update()
    $log.Add("TOC updated")
  }
  $null = $doc.Fields.Update()
  $doc.Save()
  $doc.Close($true)
  $log.Add("saved")
}
finally {
  $word.Quit()
  [System.Runtime.Interopservices.Marshal]::ReleaseComObject($word) | Out-Null
  [GC]::Collect(); [GC]::WaitForPendingFinalizers()
}

Copy-Item -LiteralPath $work -Destination $desktop.FullName -Force
$log.Add("copied back")
[System.IO.File]::WriteAllLines($logPath, $log.ToArray(), [System.Text.UTF8Encoding]::new($false))
Get-Content -LiteralPath $logPath -Encoding UTF8
