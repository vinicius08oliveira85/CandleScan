# CandleScan — Ponte MetaTrader 5

Serviço local que lê candles e ticks do **MetaTrader 5** e alimenta o CandleScan em tempo quase real.

## Requisitos

- **Windows** (biblioteca oficial `MetaTrader5` só funciona no Windows)
- **MetaTrader 5** instalado e logado (conta demo XP, Clear, Toro, BTG, etc.)
- **Python 3.10+**

## Instalação

```powershell
cd mt5-bridge
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
```

Deixe o **terminal MT5 aberto** antes de iniciar a ponte.

## Executar

```powershell
# Na pasta mt5-bridge, com venv ativo:
uvicorn main:app --host 127.0.0.1 --port 8765
```

Ou na raiz do projeto:

```powershell
npm run dev:mt5
```

## Configuração (`.env` opcional)

```env
BRIDGE_CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,https://candle-scan.vercel.app
BRIDGE_API_KEY=sua_chave_secreta_opcional
```

No CandleScan (Configurações), use a mesma chave em **Chave da ponte MT5** quando `BRIDGE_API_KEY` estiver definida.

## Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/health` | Status MT5 / conta |
| GET | `/symbols/search?q=PETR` | Busca símbolos |
| GET | `/candles?symbol=PETR4&timeframe=M5&count=10` | Últimos candles OHLC |
| GET | `/tick?symbol=PETR4` | Bid/ask atual |
| GET | `/stream/candles?...` | SSE (push periódico) |

Header opcional: `X-Bridge-Key: <BRIDGE_API_KEY>`

## Símbolos por corretora

O nome pode variar: `PETR4`, `#PETR4`, `PETR4.SA`. Use **Testar conexão** no app ou `/symbols/search?q=PETR`.

## Acesso remoto (VPS + túnel)

1. Instale MT5 + esta ponte numa **VPS Windows**.
2. Exponha a porta com túnel HTTPS, por exemplo:

```powershell
ngrok http 8765
```

3. No CandleScan → Configurações → **URL da ponte MT5**: cole a URL HTTPS do ngrok (ex. `https://abc123.ngrok-free.app`).
4. Defina `BRIDGE_API_KEY` no servidor e no app.

**Atenção:** não exponha a ponte publicamente sem `BRIDGE_API_KEY`.

## App Vercel + MT5 no mesmo PC

O site em `https://candle-scan.vercel.app` pode chamar `http://127.0.0.1:8765` **somente se você abrir o site neste mesmo computador** onde a ponte está rodando. Para celular ou outro PC, use VPS + túnel HTTPS.

## Solução de problemas

| Problema | Ação |
|----------|------|
| Falha ao iniciar MT5 | Abra o MT5 manualmente e faça login |
| Símbolo não encontrado | Busque em `/symbols/search` o nome exato |
| CORS bloqueado | Adicione a origem do app em `BRIDGE_CORS_ORIGINS` |
| HTTPS → HTTP bloqueado | Use túnel HTTPS (ngrok/Cloudflare) |
