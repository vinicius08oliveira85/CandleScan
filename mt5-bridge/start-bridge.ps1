# Inicia a ponte MT5 (MetaTrader 5 deve estar aberto e logado)
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if (-not (Test-Path ".venv\Scripts\python.exe")) {
    Write-Host "Criando ambiente Python..."
    python -m venv .venv
    .\.venv\Scripts\pip install -r requirements.txt
}

Write-Host "Ponte MT5 em http://127.0.0.1:8765 — mantenha o MT5 aberto."
.\.venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8765 --reload
