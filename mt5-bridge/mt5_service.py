"""Serviço de leitura de dados do MetaTrader 5 (Windows)."""
from __future__ import annotations

import os
import time
from datetime import datetime, timezone
from typing import Any

try:
    import MetaTrader5 as mt5
except ImportError:
    mt5 = None  # type: ignore

TIMEFRAME_MAP: dict[str, int] = {}
if mt5 is not None:
    _tf_names = (
        "M1", "M5", "M15", "M30", "H1", "H4", "D1", "W1", "MN1",
        "M2", "M3", "M4", "M6", "M10", "M12", "M20", "H2", "H3",
    )
    for name in _tf_names:
        val = getattr(mt5, f"TIMEFRAME_{name}", None)
        if val is not None:
            TIMEFRAME_MAP[name] = val

_last_error: str | None = None
_initialized = False


def _set_error(msg: str) -> None:
    global _last_error
    _last_error = msg


def ensure_mt5() -> None:
    if mt5 is None:
        raise RuntimeError(
            "Pacote MetaTrader5 não instalado. Execute: pip install -r requirements.txt"
        )


def _candidate_terminal_paths() -> list[str]:
    """Caminhos comuns do terminal64 (MetaTrader / Toro / XP / Clear)."""
    candidates: list[str] = []

    env_path = (os.environ.get("MT5_PATH") or "").strip().strip('"')
    if env_path:
        candidates.append(env_path)

    program_dirs = [
        os.environ.get("ProgramFiles", r"C:\Program Files"),
        os.environ.get("ProgramFiles(x86)", r"C:\Program Files (x86)"),
        os.path.join(os.environ.get("LOCALAPPDATA", ""), "Programs"),
    ]

    folder_names = (
        "MetaTrader 5",
        "MetaTrader5",
        "Toro",
        "Toro Investimentos",
        "Toro Invest",
        "XP Investimentos",
        "Clear Investimentos",
        "Rico",
    )

    for base in program_dirs:
        if not base or not os.path.isdir(base):
            continue
        for folder in folder_names:
            candidates.append(os.path.join(base, folder, "terminal64.exe"))
        try:
            for entry in os.scandir(base):
                if not entry.is_dir():
                    continue
                name = entry.name.lower()
                if "metatrader" in name or "toro" in name or "xp " in name or name == "clear":
                    candidates.append(os.path.join(entry.path, "terminal64.exe"))
        except OSError:
            pass

    appdata = os.path.join(os.environ.get("APPDATA", ""), "MetaQuotes", "Terminal")
    if os.path.isdir(appdata):
        try:
            for entry in os.scandir(appdata):
                if entry.is_dir():
                    candidates.append(os.path.join(entry.path, "terminal64.exe"))
        except OSError:
            pass

    seen: set[str] = set()
    unique: list[str] = []
    for p in candidates:
        norm = os.path.normpath(p)
        if norm not in seen and os.path.isfile(norm):
            seen.add(norm)
            unique.append(norm)
    return unique


def initialize() -> bool:
    global _initialized, _last_error
    ensure_mt5()
    if _initialized:
        return True

    if mt5.initialize():
        _initialized = True
        _last_error = None
        return True

    first_err = mt5.last_error()
    for terminal_path in _candidate_terminal_paths():
        if mt5.initialize(path=terminal_path):
            _initialized = True
            _last_error = None
            return True

    paths_hint = _candidate_terminal_paths()
    hint = (
        f" Defina MT5_PATH com o caminho do terminal64.exe (ex.: Toro)."
        if not paths_hint
        else f" Tentados: {', '.join(paths_hint[:3])}..."
    )
    _set_error(
        f"Falha ao iniciar MT5: {first_err}.{hint} "
        "Abra o MetaTrader 5 (Toro), faca login e deixe o programa aberto."
    )
    return False


def shutdown() -> None:
    global _initialized
    if mt5 is not None and _initialized:
        mt5.shutdown()
    _initialized = False


def get_health() -> dict[str, Any]:
    ensure_mt5()
    if not initialize():
        return {
            "ok": False,
            "mt5Connected": False,
            "error": _last_error or "MT5 não conectado",
        }
    info = mt5.terminal_info()
    account = mt5.account_info()
    return {
        "ok": True,
        "mt5Connected": info is not None and info.connected,
        "terminal": info.name if info else None,
        "company": info.company if info else None,
        "build": info.build if info else None,
        "account": account.login if account else None,
        "server": account.server if account else None,
        "tradeMode": account.trade_mode if account else None,
        "serverTime": datetime.now(timezone.utc).isoformat(),
    }


def resolve_symbol(query: str) -> str | None:
    """Resolve símbolo (PETR4, #PETR4, PETR4.SA, etc.)."""
    ensure_mt5()
    if not initialize():
        return None
    q = (query or "").strip().upper()
    if not q:
        return None

    info = mt5.symbol_info(q)
    if info is not None:
        if not info.visible:
            mt5.symbol_select(q, True)
        return q

    candidates: list[str] = []
    all_syms = mt5.symbols_get()
    if all_syms:
        for s in all_syms:
            name = s.name.upper()
            if q in name or name.replace("#", "").replace(".SA", "") == q.replace(".SA", ""):
                candidates.append(s.name)
    if not candidates:
        return None
    # Prefer exact match without prefix
    for c in candidates:
        if c.upper() == q:
            return c
    for c in candidates:
        if c.upper().endswith(q) or c.upper().replace("#", "") == q:
            return c
    return candidates[0]


def search_symbols(q: str, limit: int = 20) -> list[dict[str, str]]:
    ensure_mt5()
    if not initialize():
        return []
    query = (q or "").strip().upper()
    all_syms = mt5.symbols_get()
    if not all_syms:
        return []
    out: list[dict[str, str]] = []
    for s in all_syms:
        name = s.name
        if not query or query in name.upper():
            out.append({"name": name, "description": s.description or name})
        if len(out) >= limit:
            break
    return out


def timeframe_to_mt5(tf: str) -> int:
    key = (tf or "M5").strip().upper()
    if key in TIMEFRAME_MAP:
        return TIMEFRAME_MAP[key]
    # "5 Minutos" -> M5
    import re

    m = re.search(r"(\d+)\s*(MIN|M|H|D)", key, re.I)
    if m:
        n, unit = int(m.group(1)), m.group(2).upper()
        if unit.startswith("H"):
            key = f"H{n}"
        elif unit.startswith("D"):
            key = "D1"
        else:
            key = f"M{n}"
    return TIMEFRAME_MAP.get(key, TIMEFRAME_MAP.get("M5", 5))


def copy_candles(symbol: str, timeframe: str, count: int = 10) -> dict[str, Any]:
    ensure_mt5()
    if not initialize():
        raise RuntimeError(_last_error or "MT5 não inicializado")

    resolved = resolve_symbol(symbol)
    if not resolved:
        raise ValueError(f"Símbolo não encontrado no MT5: {symbol}")

    tf = timeframe_to_mt5(timeframe)
    rates = mt5.copy_rates_from_pos(resolved, tf, 0, max(2, min(count, 500)))
    if rates is None or len(rates) == 0:
        err = mt5.last_error()
        raise RuntimeError(f"Sem candles para {resolved}: {err}")

    candles = []
    for row in rates:
        candles.append(
            {
                "open": float(row["open"]),
                "high": float(row["high"]),
                "low": float(row["low"]),
                "close": float(row["close"]),
                "time": int(row["time"]),
                "tick_volume": int(row["tick_volume"]),
            }
        )

    return {
        "symbol": resolved,
        "timeframe": timeframe.upper() if timeframe else "M5",
        "candles": candles,
        "serverTime": datetime.now(timezone.utc).isoformat(),
    }


def get_tick(symbol: str) -> dict[str, Any]:
    ensure_mt5()
    if not initialize():
        raise RuntimeError(_last_error or "MT5 não inicializado")

    resolved = resolve_symbol(symbol)
    if not resolved:
        raise ValueError(f"Símbolo não encontrado: {symbol}")

    tick = mt5.symbol_info_tick(resolved)
    if tick is None:
        err = mt5.last_error()
        raise RuntimeError(f"Sem tick para {resolved}: {err}")

    mid = (tick.bid + tick.ask) / 2.0
    return {
        "symbol": resolved,
        "bid": float(tick.bid),
        "ask": float(tick.ask),
        "last": float(tick.last) if tick.last else mid,
        "mid": mid,
        "time": int(tick.time),
        "serverTime": datetime.now(timezone.utc).isoformat(),
    }


def verify_api_key(header_key: str | None) -> bool:
    expected = os.environ.get("BRIDGE_API_KEY", "").strip()
    if not expected:
        return True
    return (header_key or "").strip() == expected
