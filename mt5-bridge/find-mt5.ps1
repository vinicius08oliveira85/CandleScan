# Localiza terminal64.exe e grava MT5_PATH no .env
$ErrorActionPreference = "Continue"
Set-Location $PSScriptRoot

Write-Host "=== CandleScan - Localizar MetaTrader 5 (Toro) ===" -ForegroundColor Cyan
Write-Host ""

$found = [System.Collections.Generic.List[string]]::new()

function Add-IfExists($p) {
    if ($p -and (Test-Path -LiteralPath $p)) {
        $full = (Resolve-Path -LiteralPath $p).Path
        if (-not $found.Contains($full)) { $found.Add($full) | Out-Null }
    }
}

# Processo MT5 ja aberto
Get-Process -ErrorAction SilentlyContinue | Where-Object {
    $_.Path -and ($_.Path -match 'terminal64|metatrader|MetaTrader')
} | ForEach-Object { Add-IfExists $_.Path }

$roots = @(
    ${env:ProgramFiles},
    ${env:ProgramFiles(x86)},
    "$env:LOCALAPPDATA\Programs",
    "$env:APPDATA\MetaQuotes",
    "$env:APPDATA\Roaming\MetaQuotes"
)

foreach ($root in $roots) {
    if (-not $root -or -not (Test-Path $root)) { continue }
    try {
        Get-ChildItem -Path $root -Filter "terminal64.exe" -Recurse -Depth 6 -ErrorAction SilentlyContinue |
            ForEach-Object { Add-IfExists $_.FullName }
    } catch { }
}

# Atalhos na area de trabalho e menu iniciar
$shortcutDirs = @(
    [Environment]::GetFolderPath("Desktop"),
    [Environment]::GetFolderPath("CommonDesktopDirectory"),
    "$env:APPDATA\Microsoft\Windows\Start Menu\Programs"
)
$wsh = New-Object -ComObject WScript.Shell
foreach ($dir in $shortcutDirs) {
    if (-not (Test-Path $dir)) { continue }
    Get-ChildItem $dir -Recurse -Filter "*.lnk" -ErrorAction SilentlyContinue | ForEach-Object {
        try {
            $t = $wsh.CreateShortcut($_.FullName).TargetPath
            if ($t -match 'terminal64\.exe$') { Add-IfExists $t }
        } catch { }
    }
}

if ($found.Count -eq 0) {
    Write-Host "Nenhum terminal64.exe encontrado." -ForegroundColor Red
    Write-Host ""
    Write-Host "Faca manualmente:" -ForegroundColor Yellow
    Write-Host "1. Abra o MT5 da Toro"
    Write-Host "2. Arquivo -> Abrir pasta de dados"
    Write-Host "3. No Explorer, suba pastas ate achar terminal64.exe"
    Write-Host "4. Copie o caminho e crie .env com: MT5_PATH=C:\...\terminal64.exe"
    exit 1
}

Write-Host "Encontrado(s):" -ForegroundColor Green
for ($i = 0; $i -lt $found.Count; $i++) {
    Write-Host "  [$i] $($found[$i])"
}

$pick = 0
if ($found.Count -gt 1) {
    $raw = Read-Host "Qual indice usar? (Enter = 0)"
    if ($raw -match '^\d+$') { $pick = [int]$raw }
}

$chosen = $found[$pick]
$envContent = @()
if (Test-Path ".env") {
    $envContent = Get-Content ".env" | Where-Object { $_ -notmatch '^\s*MT5_PATH=' }
}
$envContent += "MT5_PATH=$chosen"
$envContent | Set-Content ".env" -Encoding UTF8

Write-Host ""
Write-Host "Salvo em mt5-bridge\.env :" -ForegroundColor Green
Write-Host "MT5_PATH=$chosen"
Write-Host ""
Write-Host "Proximo passo: abra o MT5, faca login, depois rode: npm run dev:mt5" -ForegroundColor Cyan
