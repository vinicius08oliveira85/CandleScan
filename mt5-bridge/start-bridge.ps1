# Inicia a ponte MT5 (MetaTrader 5 deve estar aberto e logado)
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$bridgePort = 8765

if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        if ($_ -match '^\s*MT5_PATH=(.+)$') {
            $env:MT5_PATH = $matches[1].Trim().Trim('"')
        }
        if ($_ -match '^\s*BRIDGE_PORT=(\d+)\s*$') {
            $bridgePort = [int]$matches[1]
        }
    }
}

if (-not (Test-Path ".venv\Scripts\python.exe")) {
    Write-Host "Criando ambiente Python..."
    python -m venv .venv
    .\.venv\Scripts\pip install -r requirements.txt
}

$listener = Get-NetTCPConnection -LocalPort $bridgePort -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if ($listener) {
    $oldPid = $listener.OwningProcess
    $oldName = (Get-Process -Id $oldPid -ErrorAction SilentlyContinue).ProcessName
    Write-Host "Porta $bridgePort ocupada (PID $oldPid - $oldName). Liberando..."
    Stop-Process -Id $oldPid -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

Write-Host "Ponte MT5 em http://127.0.0.1:$bridgePort - mantenha o MT5 (Toro) aberto e logado."
Write-Host "Se falhar MT5: copie o caminho do terminal64.exe para MT5_PATH no arquivo .env"

.\.venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port $bridgePort --reload
