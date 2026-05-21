# Inicia a ponte MT5 (MetaTrader 5 deve estar aberto e logado)
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if (-not (Test-Path ".venv\Scripts\python.exe")) {
    Write-Host "Criando ambiente Python..."
    python -m venv .venv
    .\.venv\Scripts\pip install -r requirements.txt
}

Write-Host "Ponte MT5 em http://127.0.0.1:8765 - mantenha o MT5 (Toro) aberto e logado."
Write-Host "Se falhar: copie o caminho do terminal64.exe para MT5_PATH no arquivo .env"

if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        if ($_ -match '^\s*MT5_PATH=(.+)$') {
            $env:MT5_PATH = $matches[1].Trim().Trim('"')
        }
    }
}

.\.venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8765 --reload
