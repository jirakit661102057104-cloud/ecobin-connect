# Deploy EcoBin Go API to Cloud Run + Cloud SQL
$ErrorActionPreference = 'Continue'
Set-Location $PSScriptRoot

function Find-GCloud {
  $candidates = @(
    "$env:ProgramFiles\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd",
    "$env:LOCALAPPDATA\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd"
  )
  foreach ($p in $candidates) {
    if (Test-Path $p) { return $p }
  }
  $cmd = Get-Command gcloud.cmd -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }
  return $null
}

function Read-DotEnv([string]$path) {
  $map = @{}
  if (-not (Test-Path $path)) { return $map }
  Get-Content $path | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith('#')) { return }
    $eq = $line.IndexOf('=')
    if ($eq -lt 1) { return }
    $map[$line.Substring(0, $eq).Trim()] = $line.Substring($eq + 1).Trim()
  }
  return $map
}

$gcloud = Find-GCloud
if (-not $gcloud) {
  Write-Host 'Installing Google Cloud SDK...'
  winget install -e --id Google.CloudSDK --accept-source-agreements --accept-package-agreements
  $env:Path = [System.Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path', 'User')
  $gcloud = Find-GCloud
}
if (-not $gcloud) {
  throw 'Install Google Cloud SDK, open a new terminal, then run: .\deploy-cloud-run.bat'
}

$active = (& $gcloud auth list --filter=status:ACTIVE --format="value(account)" | Out-String).Trim()
if (-not $active) {
  Write-Host 'Login Google Cloud (browser will open)'
  & $gcloud auth login
}

$region = 'asia-southeast1'
$service = 'ecobin-api'
$sqlName = 'ecobin-mysql'

$project = ''
$sqlRegion = ''
$allProjects = & $gcloud projects list --format="value(projectId)"
foreach ($p in $allProjects) {
  $p = $p.Trim()
  if (-not $p) { continue }
  $info = (& $gcloud sql instances describe $sqlName --project=$p --format="value(region)" 2>$null | Out-String).Trim()
  if ($info) {
    $project = $p
    $sqlRegion = $info
    break
  }
}
if (-not $project) {
  throw "Cloud SQL instance not found: $sqlName"
}
& $gcloud config set project $project

$envFile = Join-Path $PSScriptRoot 'backend\backend.env'
$cfg = Read-DotEnv $envFile

Write-Host "Project: $project"
Write-Host '[enable APIs]'
& $gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com sqladmin.googleapis.com --project=$project

Write-Host '[Cloud SQL]'
& $gcloud sql instances list --project=$project
$sqlRegion = (& $gcloud sql instances describe $sqlName --project=$project --format='value(region)' 2>$null | Out-String).Trim()
if (-not $sqlRegion) {
  throw "Cloud SQL instance not found: $sqlName"
}
$cloudSql = "${project}:${sqlRegion}:${sqlName}"
Write-Host "Cloud SQL: $cloudSql"

$projNum = (& $gcloud projects describe $project --format='value(projectNumber)' | Out-String).Trim()
$sa = "${projNum}-compute@developer.gserviceaccount.com"
Write-Host "Grant Cloud SQL Client to $sa"
& $gcloud projects add-iam-policy-binding $project --member="serviceAccount:$sa" --role=roles/cloudsql.client --quiet

$dsn = [string]$cfg['MYSQL_DSN']
$mysqlPass = [string]$cfg['MYSQL_PASS']
if (-not $mysqlPass -and $dsn -match '^[^:]+:([^@]+)@') {
  $mysqlPass = $Matches[1]
}

$jwt = [string]$cfg['JWT_SECRET']
if (-not $jwt -or $jwt -eq 'ecobin-dev-secret-change-me') {
  $bytes = New-Object byte[] 32
  [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
  $jwt = [Convert]::ToBase64String($bytes)
}

$yamlPath = Join-Path $env:TEMP 'ecobin-cloudrun-env.yaml'
$vars = [ordered]@{
  APP_ENV                     = 'production'
  SEED_DEMO                   = 'false'
  WASTE_AUTO_APPROVE          = 'false'
  COOKIE_SECURE               = 'true'
  CLOUD_SQL_CONNECTION_NAME   = $cloudSql
  MYSQL_USER                  = 'root'
  MYSQL_PASS                  = $mysqlPass
  MYSQL_DATABASE              = 'ecobin'
  JWT_SECRET                  = $jwt
  CORS_ORIGIN                 = 'https://ecobin-connect-8ap5.vercel.app,http://localhost:3000'
  GOOGLE_CLIENT_ID            = [string]$cfg['GOOGLE_CLIENT_ID']
  GOOGLE_CLIENT_SECRET        = [string]$cfg['GOOGLE_CLIENT_SECRET']
  GEMINI_API_KEY              = [string]$cfg['GEMINI_API_KEY']
  OTP_DEBUG                   = 'false'
}

$yaml = foreach ($k in $vars.Keys) {
  $v = [string]$vars[$k]
  $safe = $v.Replace('\', '\\').Replace('"', '\"')
  "${k}: `"$safe`""
}
Set-Content -Path $yamlPath -Value ($yaml -join "`n") -Encoding utf8

Write-Host '[deploy Cloud Run]'
Push-Location (Join-Path $PSScriptRoot 'backend')
try {
  & $gcloud run deploy $service `
    --source . `
    --project $project `
    --region $region `
    --allow-unauthenticated `
    --add-cloudsql-instances $cloudSql `
    --memory 512Mi `
    --cpu 1 `
    --min-instances 1 `
    --max-instances 3 `
    --timeout 60 `
    --quiet `
    --env-vars-file $yamlPath
  if ($LASTEXITCODE -ne 0) { throw 'gcloud run deploy failed' }
} finally {
  Pop-Location
  Remove-Item $yamlPath -ErrorAction SilentlyContinue
}

$url = (& $gcloud run services describe $service --region $region --project $project --format='value(status.url)' | Out-String).Trim()
Write-Host ''
Write-Host "Cloud Run URL: $url"
Write-Host 'Set Vercel env API_PROXY_TARGET to this URL, then Redeploy'
Write-Host "Test: curl $url/health"
