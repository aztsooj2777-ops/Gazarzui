﻿$ErrorActionPreference = "Stop"
$SP  = "C:\Users\User\AppData\Local\Temp\claude\C--Users-User-Desktop-website\ec79378e-2f88-461a-b630-a73c9114acba\scratchpad"
$src = Join-Path $SP "mng-adm1.geojson"
$out = "C:\Users\User\Desktop\website\assets\js\data\mn-map.js"

# --- Проекц: games.js / engine.js доторхтой ЯГ ижил байх ёстой ---
$LON0 = 87.5; $LON1 = 120.0; $LAT1 = 52.3; $LAT0 = 41.3; $W = 1000.0
$K = [Math]::Cos(46.8 * [Math]::PI / 180.0)
$S = $W / (($LON1 - $LON0) * $K)
$H = [Math]::Round(($LAT1 - $LAT0) * $S)

# --- Англи → Монгол нэр (GZ.AIMAGS-тай тохирно) ---
$NAME = @{
  "Arkhangai"   = "Архангай";    "Bayan-Ölgii" = "Баян-Өлгий"; "Bayankhongor" = "Баянхонгор"
  "Bulgan"      = "Булган";      "Darkhan-Uul" = "Дархан-Уул"; "Dornod"       = "Дорнод"
  "Dornogovi"   = "Дорноговь";   "Dundgovi"    = "Дундговь";   "Govi-Altai"   = "Говь-Алтай"
  "Govisumber"  = "Говьсүмбэр";  "Hovsgel"     = "Хөвсгөл";    "Khentii"      = "Хэнтий"
  "Khovd"       = "Ховд";        "Orkhon"      = "Орхон";      "Selenge"      = "Сэлэнгэ"
  "Sükhbaatar"  = "Сүхбаатар";   "Töv"         = "Төв";        "Ulaanbaatar"  = "Улаанбаатар"
  "Uvs"         = "Увс";         "Zavkhan"     = "Завхан";     "Ömnögovi"     = "Өмнөговь"
  "Övörkhangai" = "Өвөрхангай"
}

$json = Get-Content $src -Raw -Encoding UTF8 | ConvertFrom-Json
$rows = New-Object System.Collections.ArrayList
$MINSTEP = 0.55   # ойрхон цэгүүдийг хасах босго (пиксель)

function Ring-ToPath($ring) {
  $sb = New-Object System.Text.StringBuilder
  $lastX = -9999.0; $lastY = -9999.0; $n = 0
  foreach ($pt in $ring) {
    $x = ([double]$pt[0] - $LON0) * $K * $S
    $y = ($LAT1 - [double]$pt[1]) * $S
    if ($n -gt 0) {
      $dx = $x - $lastX; $dy = $y - $lastY
      if ([Math]::Sqrt($dx*$dx + $dy*$dy) -lt $MINSTEP) { continue }
    }
    $cmd = if ($n -eq 0) { "M" } else { "L" }
    [void]$sb.Append($cmd)
    [void]$sb.Append([Math]::Round($x, 1))
    [void]$sb.Append(" ")
    [void]$sb.Append([Math]::Round($y, 1))
    $lastX = $x; $lastY = $y; $n++
  }
  if ($n -lt 4) { return "" }
  [void]$sb.Append("Z")
  return $sb.ToString()
}

foreach ($f in $json.features) {
  $en = $f.properties.shapeName
  $mn = $NAME[$en]
  if (-not $mn) { Write-Output ("SKIP unmapped: " + $en); continue }

  $g = $f.geometry
  $paths = New-Object System.Collections.ArrayList

  if ($g.type -eq "Polygon") {
    foreach ($ring in $g.coordinates) {
      $p = Ring-ToPath $ring
      if ($p) { [void]$paths.Add($p) }
    }
  } elseif ($g.type -eq "MultiPolygon") {
    foreach ($poly in $g.coordinates) {
      foreach ($ring in $poly) {
        $p = Ring-ToPath $ring
        if ($p) { [void]$paths.Add($p) }
      }
    }
  }

  $d = ($paths -join "")
  [void]$rows.Add([pscustomobject]@{ n = $mn; d = $d; len = $d.Length })
  Write-Output ("{0,-14} {1,3} ring(s)  {2,7} chars" -f $mn, $paths.Count, $d.Length)
}

# --- JS файл бичих ---
$sb = New-Object System.Text.StringBuilder
[void]$sb.AppendLine("/* ==========================================================================")
[void]$sb.AppendLine("   МОНГОЛ УЛСЫН АЙМГИЙН БОДИТ ХИЛ — SVG зам")
[void]$sb.AppendLine("   --------------------------------------------------------------------------")
[void]$sb.AppendLine("   Эх сурвалж : geoBoundaries (gbOpen, MNG ADM1, simplified) — нээлттэй өгөгдөл")
[void]$sb.AppendLine("   Проекц     : эквидистант цилиндр, дундаж өргөрөг 46.8°")
[void]$sb.AppendLine(("   viewBox    : 0 0 {0} {1}" -f [int]$W, [int]$H))
[void]$sb.AppendLine("   Энэ файлыг гараар засварлахгүй — scratchpad/geo2svg.ps1 скриптээр үүсгэсэн.")
[void]$sb.AppendLine("   ========================================================================== */")
[void]$sb.AppendLine("window.GZ = window.GZ || {};")
[void]$sb.AppendLine(("GZ.MN_VIEW = {{ w: {0}, h: {1} }};" -f [int]$W, [int]$H))
[void]$sb.AppendLine("")
[void]$sb.AppendLine("GZ.MN_SHAPES = [")
foreach ($r in $rows) {
  [void]$sb.AppendLine('  { n: "' + $r.n + '", d: "' + $r.d + '" },')
}
[void]$sb.AppendLine("];")

$enc = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($out, $sb.ToString(), $enc)

""
("НИЙТ: {0} аймаг" -f $rows.Count)
("Файл: {0}" -f $out)
("Хэмжээ: {0:N0} байт" -f (Get-Item $out).Length)
("viewBox: 0 0 {0} {1}" -f [int]$W, [int]$H)
