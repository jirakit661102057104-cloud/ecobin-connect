# Update Table of Contents in thesis docx via Word COM
$ErrorActionPreference = "Stop"
$path = "c:\Users\Lenovo\OneDrive\Desktop\สำรอง.docx"
$log = "d:\Jirakit_IT04\Project\ecobin-connect\.agents\tmp-thesis-edit\toc-update-log.txt"

$lines = New-Object System.Collections.Generic.List[string]
$lines.Add("path=$path")
$lines.Add("exists=$(Test-Path -LiteralPath $path)")

$word = $null
$doc = $null
try {
  $word = New-Object -ComObject Word.Application
  $word.Visible = $false
  $word.DisplayAlerts = 0  # wdAlertsNone

  $doc = $word.Documents.Open($path, $false, $false)  # ConfirmConversions, ReadOnly
  $lines.Add("opened ok; TOC count=$($doc.TablesOfContents.Count)")

  if ($doc.TablesOfContents.Count -eq 0) {
    # Insert TOC after first paragraph containing สารบัญ heading, or at selection start of that para
    $found = $false
    foreach ($p in $doc.Paragraphs) {
      $t = $p.Range.Text
      if ($t -match "สารบัญ" -and $t.Length -lt 40) {
        $rng = $p.Range
        $rng.Collapse(0) # wdCollapseEnd
        $rng.InsertParagraphAfter() | Out-Null
        $rng.Collapse(0)
        # Add TOC field: levels 1-3, hyperlinks
        $toc = $doc.TablesOfContents.Add(
          $rng,
          $true,   # UseHeadingStyles
          1,       # UpperHeadingLevel
          3,       # LowerHeadingLevel
          $false,  # UseFields (TC)
          "",      # TableID
          $true,   # RightAlignPageNumbers
          $true,   # IncludePageNumbers
          "",      # AddedStyles
          $true,   # UseHyperlinks
          $true,   # HidePageNumbersInWeb
          $true    # UseOutlineLevels
        )
        $found = $true
        $lines.Add("inserted new TOC")
        break
      }
    }
    if (-not $found) {
      $lines.Add("ERROR: no สารบัญ heading found to insert TOC")
    }
  } else {
    for ($i = 1; $i -le $doc.TablesOfContents.Count; $i++) {
      $toc = $doc.TablesOfContents.Item($i)
      # Ensure heading levels 1-3
      try {
        $toc.UseHeadingStyles = $true
        $toc.UpperHeadingLevel = 1
        $toc.LowerHeadingLevel = 3
        $toc.UseHyperlinks = $true
        $toc.IncludePageNumbers = $true
        $toc.RightAlignPageNumbers = $true
      } catch {
        $lines.Add("warn set props: $_")
      }
      $toc.Update()
      $lines.Add("updated TOC #$i")
    }
  }

  # Update all fields (page numbers etc.)
  $doc.Fields.Update() | Out-Null
  $lines.Add("fields updated; field count=$($doc.Fields.Count)")

  $doc.Save()
  $lines.Add("saved")
  $doc.Close($true) | Out-Null
  $doc = $null
  $word.Quit() | Out-Null
  $word = $null
  $lines.Add("done")
}
catch {
  $lines.Add("ERROR: $_")
  if ($doc -ne $null) { try { $doc.Close($false) } catch {} }
  if ($word -ne $null) { try { $word.Quit() } catch {} }
  throw
}
finally {
  if ($doc -ne $null) { [System.Runtime.Interopservices.Marshal]::ReleaseComObject($doc) | Out-Null }
  if ($word -ne $null) { [System.Runtime.Interopservices.Marshal]::ReleaseComObject($word) | Out-Null }
  [GC]::Collect()
  [GC]::WaitForPendingFinalizers()
  ($lines -join "`n") | Set-Content -LiteralPath $log -Encoding UTF8
}
Get-Content -LiteralPath $log -Encoding UTF8
