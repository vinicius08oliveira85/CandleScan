"""
Ponte CandleScan <-> MetaTrader 5
Execute: uvicorn main:app --host 127.0.0.1 --port 8765
"""
from __future__ import annotations

import asyncio
import json
import os
from typing import AsyncGenerator

from dotenv import load_dotenv
from fastapi import FastAPI, Header, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

import mt5_service as svc

load_dotenv()

DEFAULT_ORIGINS = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000"
cors_origins = [
    o.strip()
    for o in os.environ.get("BRIDGE_CORS_ORIGINS", DEFAULT_ORIGINS).split(",")
    if o.strip()
]

app = FastAPI(title="CandleScan MT5 Bridge", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins if cors_origins != ["*"] else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _check_auth(x_bridge_key: str | None = Header(default=None, alias="X-Bridge-Key")):
    if not svc.verify_api_key(x_bridge_key):
        raise HTTPException(status_code=401, detail="Chave da ponte inválida (X-Bridge-Key)")


@app.get("/health")
def health(x_bridge_key: str | None = Header(default=None, alias="X-Bridge-Key")):
    _check_auth(x_bridge_key)
    return svc.get_health()


@app.get("/diagnose")
def diagnose(x_bridge_key: str | None = Header(default=None, alias="X-Bridge-Key")):
    _check_auth(x_bridge_key)
    return svc.get_diagnose()


@app.get("/symbols/search")
def symbols_search(
    q: str = Query("", min_length=0),
    limit: int = Query(20, ge=1, le=100),
    x_bridge_key: str | None = Header(default=None, alias="X-Bridge-Key"),
):
    _check_auth(x_bridge_key)
    try:
        return {"symbols": svc.search_symbols(q, limit)}
    except Exception as e:
        raise HTTPException(status_code=503, detail=str(e)) from e


@app.get("/candles")
def candles(
    symbol: str = Query(..., min_length=1),
    timeframe: str = Query("M5"),
    count: int = Query(10, ge=2, le=500),
    x_bridge_key: str | None = Header(default=None, alias="X-Bridge-Key"),
):
    _check_auth(x_bridge_key)
    try:
        return svc.copy_candles(symbol, timeframe, count)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=503, detail=str(e)) from e


@app.get("/tick")
def tick(
    symbol: str = Query(..., min_length=1),
    x_bridge_key: str | None = Header(default=None, alias="X-Bridge-Key"),
):
    _check_auth(x_bridge_key)
    try:
        return svc.get_tick(symbol)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=503, detail=str(e)) from e


async def _candle_stream(
    symbol: str, timeframe: str, count: int, interval_ms: int
) -> AsyncGenerator[str, None]:
    while True:
        try:
            data = svc.copy_candles(symbol, timeframe, count)
            tick = svc.get_tick(symbol)
            payload = {**data, "tick": tick}
            yield f"data: {json.dumps(payload)}\n\n"
        except Exception as e:
            err = {"error": str(e)}
            yield f"data: {json.dumps(err)}\n\n"
        await asyncio.sleep(interval_ms / 1000.0)


@app.get("/stream/candles")
async def stream_candles(
    symbol: str = Query(..., min_length=1),
    timeframe: str = Query("M5"),
    count: int = Query(10, ge=2, le=100),
    interval_ms: int = Query(1000, ge=200, le=10000),
    x_bridge_key: str | None = Header(default=None, alias="X-Bridge-Key"),
):
    _check_auth(x_bridge_key)
    return StreamingResponse(
        _candle_stream(symbol, timeframe, count, interval_ms),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
    )


@app.on_event("shutdown")
def on_shutdown():
    svc.shutdown()
