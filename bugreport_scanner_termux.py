#!/usr/bin/env python3
"""Analisador independente de bugreports Android para Termux.

Pesquisa exclusivamente o pacote com.netflix.mediaclientxx.
Comandos: gerar, analisar e start.
"""

from __future__ import annotations

import argparse
import os
import re
import shlex
import shutil
import subprocess
import sys
import time
import zipfile
from pathlib import Path
from typing import BinaryIO, Iterable

PROXY_CATALOG = [
    ("br.com.intermediumx", "Proxy Inter"),
    ("com.nu.roxinho", "Proxy Nubank"),
    ("com.netflix.mediaclientxx", "Proxy Netflix"),
    ("com.proxy.free", "Proxy Free"),
    ("com.dripclient.proxy", "Drip Proxy"),
    ("com.spotify.musicx", "Spotify Proxy"),
    ("com.aincrad.proxy", "Proxy Aincrad"),
    ("client.by", "Proxy External"),
    ("com.mcdo.mcdonaldss", "Proxy Mcdonald's"),
    ("com.lucasqueiroz.fitcal", "Proxy Fitcal"),
    ("com.sylvaz.app", "Proxy Caixa"),
    ("com.my.newproject7", "Proxy PayPal"),
    ("io.gringoxp.proxy.garena.freefire", "Proxy Gringo"),
    ("com.mycompany.myapp", "Proxy Shopee"),
    ("com.android.system.service.optimizer", "Proxy Snow"),
    ("com.pornhub", "Proxy MthTeam"),
    ("com.nvt.cc", "Proxy Minha Claro"),
    ("com.proxyall", "Proxy Hg Cheats"),
    ("com.android.sellestw", "Proxy Google"),
    ("com.c4dev.ofc", "Proxy CashXiters"),
    ("com.s", "Proxy Auxílio"),
    ("com.snoopy.proxy", "Proxy Snoopy"),
    ("com.snakeio", "Proxy Cobrinha"),
    ("com.bard", "Proxy Gemini"),
    ("android.settings.com", "Proxy Brevent"),
]
PROXY_NAMES = dict(PROXY_CATALOG)
PROXY_PATTERNS = [
    (package, name, re.compile(rb"(?<![A-Za-z0-9_.])" + re.escape(package.encode("utf-8")) + rb"(?![A-Za-z0-9_.])"))
    for package, name in PROXY_CATALOG
]
# Primeiro faz uma única busca rápida; só compara os padrões individuais quando há candidato.
COMBINED_PROXY_PATTERN = re.compile(
    rb"(?<![A-Za-z0-9_.])(?:" + b"|".join(re.escape(package.encode("utf-8")) for package, _name in PROXY_CATALOG) + rb")(?![A-Za-z0-9_.])"
)
SKIP_BINARY_EXTENSIONS = {
    ".apk", ".bin", ".bz2", ".db", ".dex", ".gif", ".gz", ".jar", ".jpeg", ".jpg",
    ".mp3", ".mp4", ".oat", ".odex", ".pb", ".png", ".so", ".sqlite", ".tar", ".webp", ".xz", ".zip",
}
CHUNK_SIZE = 1024 * 1024
MAX_MATCHES_PER_FILE = 200
MAX_EVIDENCE_PER_PROXY = 40
RESET = "\033[0m"
GREEN = "\033[92m"
RED = "\033[91m"
DARK_RED = "\033[31m"
WHITE = "\033[1;97m"
GRAY = "\033[90m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
BLUE = "\033[94m"
COLOR_ENABLED = sys.stdout.isatty() and not os.environ.get("NO_COLOR")


def paint(text: str, color: str) -> str:
    return f"{color}{text}{RESET}" if COLOR_ENABLED else text


def terminal_columns() -> int:
    configured = os.environ.get("COLUMNS")
    try:
        detected = int(configured) if configured else shutil.get_terminal_size((80, 20)).columns
    except ValueError:
        detected = 80
    return max(40, detected)


def clip_text(text: str, width: int) -> str:
    if len(text) <= width:
        return text
    if width <= 3:
        return text[:width]
    return text[:width - 3] + "..."


def progress_line(name: str, bytes_read: int, final: bool = False) -> None:
    megabytes = bytes_read / (1024 * 1024)
    text = f"analisando {name} | {megabytes:.1f} MB lido"
    clear = "\r\033[2K" if sys.stdout.isatty() else "\r"
    print(clear + paint(text, GREEN), end="\n" if final else "", flush=True)


def wrapped_lines(text: str, width: int | None = None) -> list[str]:
    width = width or terminal_columns()
    lines: list[str] = []
    remaining = str(text).strip()
    if not remaining:
        return [""]
    while len(remaining) > width:
        cut = remaining.rfind(" ", 0, width + 1)
        if cut <= 0:
            cut = width
        lines.append(remaining[:cut].rstrip())
        remaining = remaining[cut:].lstrip()
    lines.append(remaining)
    return lines


def print_wrapped(text: str, color: str = "") -> None:
    for line in wrapped_lines(text):
        print(paint(line, color) if color else line)


def print_field(label: str, value: object) -> None:
    prefix = f"{label}: "
    chunks = wrapped_lines(str(value), max(12, terminal_columns() - len(prefix)))
    print(paint(prefix, DARK_RED) + paint(chunks[0], YELLOW))
    indent = " " * len(prefix)
    for chunk in chunks[1:]:
        print(indent + paint(chunk, YELLOW))


def banner_width() -> int:
    return min(max(42, terminal_columns() - 2), 64)


def banner_lines() -> list[str]:
    width = banner_width()
    border = "═" * width
    return [
        border,
        "HazzScreenS | credits: kernel bypass".center(width),
        "Forensic scanner".center(width),
        border,
    ]


def print_hazz_header() -> None:
    for line in banner_lines():
        print(paint(line, WHITE))


def completion_lines() -> list[str]:
    width = banner_width()
    border = "═" * width
    return [
        border,
        "SCANNER COMPLETO | CREDITS: KERNEL BYPASS".center(width),
        "",
        "QUALQUER DÚVIDA ABRIR TICKET NA HAZZSCREENS".center(width),
        "https://discord.gg/Eje3Tkqnj6".center(width),
        border,
    ]


def print_completion_block() -> None:
    print()
    for line in completion_lines():
        print(paint(line, WHITE))


def print_title(text: str) -> None:
    print(paint(text, WHITE))


def print_explanation(text: str) -> None:
    print_wrapped(f"[-] {text}", GRAY)


def print_warning(text: str) -> None:
    print_wrapped(f"[!] {text}", YELLOW)


def print_critical(text: str) -> None:
    print_wrapped(f"[+] {text}", RED)


def stamp() -> str:
    return time.strftime("%Y%m%d_%H%M%S")


def default_shared_dirs() -> list[Path]:
    home = Path.home()
    return [
        home / "storage" / "shared" / "Download",
        home / "storage" / "shared" / "bugreports",
        Path("/sdcard/Download"),
        Path("/sdcard/bugreports"),
        Path("/storage/emulated/0/Download"),
        Path("/storage/emulated/0/bugreports"),
        Path("/bugreports"),
    ]


def output_dir(value: str | None) -> Path:
    path = Path(value or os.environ.get("BUGREPORT_SCANNER_OUT", str(Path.home() / "storage" / "shared" / "Download" / "hazz_bugreports")))
    path.mkdir(parents=True, exist_ok=True)
    if not os.access(path, os.W_OK):
        raise RuntimeError(f"sem permissão de escrita em: {path}")
    return path


def candidate_files(out_dir: Path) -> list[Path]:
    directories = [out_dir, *default_shared_dirs()]
    seen: set[Path] = set()
    candidates: list[Path] = []
    patterns = ("bugreport-*.zip", "bugreport_*.zip", "bugreport-*.txt", "bugreport_*.txt")
    for directory in directories:
        try:
            if not directory.is_dir():
                continue
            for pattern in patterns:
                for path in directory.glob(pattern):
                    try:
                        resolved = path.resolve()
                        if resolved in seen or not path.is_file():
                            continue
                        if path.name.startswith(("bugreport_netflix_", "netflix_matches_")):
                            continue
                        seen.add(resolved)
                        candidates.append(path)
                    except OSError:
                        continue
        except OSError:
            continue
    return candidates


def latest_bugreport(out_dir: Path) -> Path:
    candidates = candidate_files(out_dir)
    if not candidates:
        raise RuntimeError("não encontrei uma bugreport .zip ou .txt nos diretórios acessíveis")
    return max(candidates, key=lambda path: path.stat().st_mtime)


def named_bugreport(name: str, out_dir: Path) -> Path:
    """Localiza uma bugreport pelo nome exato ou por um caminho informado."""
    requested = name.strip().strip('"').strip("'")
    if not requested:
        raise RuntimeError("digite o nome da bugreport que está na pasta Download")

    direct = Path(requested).expanduser()
    if direct.is_file():
        return direct.resolve()

    directories = [out_dir, *default_shared_dirs()]
    seen: set[Path] = set()
    matches: list[Path] = []
    for directory in directories:
        try:
            directory = directory.resolve()
        except OSError:
            continue
        if directory in seen or not directory.is_dir():
            continue
        seen.add(directory)
        try:
            for candidate in directory.iterdir():
                if not candidate.is_file() or candidate.name != requested:
                    continue
                if candidate.suffix.lower() not in {".zip", ".txt"}:
                    continue
                matches.append(candidate)
        except OSError:
            continue

    if matches:
        return matches[0].resolve()
    raise RuntimeError(
        f"não encontrei a bugreport '{requested}'. Confira o nome completo e coloque o arquivo em Download."
    )


def merge_hits(target: dict[str, list[str]], source: dict[str, list[str]]) -> None:
    for package, lines in source.items():
        target.setdefault(package, []).extend(lines)


def line_matches(
    stream: BinaryIO,
    label: str,
    show_progress: bool = False,
    progress_name: str | None = None,
    progress_state: list[int] | None = None,
    progress_final: bool = True,
    access_state: dict[str, object] | None = None,
) -> dict[str, list[str]]:
    """Pesquisa em fluxo, sem carregar o arquivo inteiro na memória."""
    matches: dict[str, list[str]] = {}
    pending = b""
    line_number = 0
    counter = progress_state if progress_state is not None else [0]
    last_progress = time.monotonic()
    display_name = progress_name or Path(label).name

    def process_line(raw_line: bytes, number: int) -> None:
        text = raw_line.decode("utf-8", errors="replace").rstrip("\r\n")
        if len(text) > 4000:
            text = text[:4000] + " [...]"
        if access_state is not None:
            process_access_line(access_state, raw_line, label, number)
        if not COMBINED_PROXY_PATTERN.search(raw_line):
            return
        for package, _name, pattern in PROXY_PATTERNS:
            if pattern.search(raw_line):
                lines = matches.setdefault(package, [])
                if len(lines) < MAX_MATCHES_PER_FILE:
                    lines.append(f"{label}:{number}:{text}")

    while True:
        chunk = stream.read(CHUNK_SIZE)
        if not chunk:
            break
        counter[0] += len(chunk)
        if show_progress and time.monotonic() - last_progress >= 1:
            progress_line(display_name, counter[0])
            last_progress = time.monotonic()
        data = pending + chunk
        parts = data.splitlines(keepends=True)
        if parts and not parts[-1].endswith((b"\n", b"\r")):
            pending = parts.pop()
        else:
            pending = b""
        for raw_line in parts:
            line_number += 1
            process_line(raw_line, line_number)

    if pending:
        line_number += 1
        process_line(pending, line_number)
    if show_progress and progress_final:
        progress_line(display_name, counter[0], final=True)
    return matches


def safe_open(path: Path, access_state: dict[str, object] | None = None) -> dict[str, list[str]]:
    if access_state is not None:
        access_state["entries"] = 1
    with path.open("rb") as stream:
        return line_matches(stream, str(path), show_progress=True, progress_name=path.name, access_state=access_state)


def scan_zip(path: Path, access_state: dict[str, object] | None = None) -> tuple[dict[str, list[str]], int, str | None]:
    """Lê cada ZipInfo individualmente; entradas duplicadas não são colapsadas."""
    matches: dict[str, list[str]] = {}
    entries_scanned = 0
    first_matching_entry: str | None = None
    progress_state = [0]

    with zipfile.ZipFile(path, "r") as archive:
        infos = archive.infolist()
        duplicate_counts: dict[str, int] = {}
        for info in infos:
            if info.is_dir() or info.filename.endswith("/"):
                continue
            entries_scanned += 1
            if access_state is not None:
                access_state["entries"] = entries_scanned
            suffix = Path(info.filename.lower()).suffix
            if suffix in SKIP_BINARY_EXTENSIONS:
                progress_state[0] += max(0, info.file_size)
                continue
            duplicate_counts[info.filename] = duplicate_counts.get(info.filename, 0) + 1
            occurrence = duplicate_counts[info.filename]
            label = info.filename if occurrence == 1 else f"{info.filename} [entrada duplicada #{occurrence}]"
            try:
                with archive.open(info, "r") as stream:
                    found = line_matches(
                        stream,
                        label,
                        show_progress=True,
                        progress_name=path.name,
                        progress_state=progress_state,
                        progress_final=False,
                        access_state=access_state,
                    )
            except (OSError, EOFError, RuntimeError, zipfile.BadZipFile) as exc:
                matches.setdefault("__warnings__", []).append(f"[AVISO] não foi possível ler {label}: {exc}")
                continue
            if found and first_matching_entry is None:
                first_matching_entry = info.filename
            merge_hits(matches, found)
    progress_line(path.name, progress_state[0], final=True)
    return matches, entries_scanned, first_matching_entry


ACCESS_PROP_KEYS = {
    "ro.product.model", "ro.product.marketname", "ro.product.manufacturer", "ro.product.brand",
    "ro.build.version.release", "ro.build.version.sdk", "ro.build.id", "ro.build.type",
    "ro.build.fingerprint", "ro.bootimage.build.fingerprint", "ro.serialno", "ro.boot.serialno",
    "ro.boot.flash.locked", "ro.boot.vbmeta.device_state", "ro.boot.verifiedbootstate",
    "ro.debuggable", "ro.secure", "sys.usb.state", "persist.sys.usb.config", "sys.usb.config",
    "service.adb.tcp.port", "persist.adb.tcp.port",
}
ACCESS_PROP_PATTERN = re.compile(
    r"(?P<key>ro\.product\.model|ro\.product\.marketname|ro\.product\.manufacturer|ro\.product\.brand|"
    r"ro\.build\.version\.release|ro\.build\.version\.sdk|ro\.build\.id|ro\.build\.type|"
    r"ro\.build\.fingerprint|ro\.bootimage\.build\.fingerprint|ro\.serialno|ro\.boot\.serialno|"
    r"ro\.boot\.flash\.locked|ro\.boot\.vbmeta\.device_state|ro\.boot\.verifiedbootstate|"
    r"ro\.debuggable|ro\.secure|sys\.usb\.state|persist\.sys\.usb\.config|sys\.usb\.config|"
    r"service\.adb\.tcp\.port|persist\.adb\.tcp\.port)"
    r"\s*(?:\]\s*:|=|:)\s*\[?(?P<value>[^\]\r\n]*)\]?",
    re.IGNORECASE,
)
ADB_PORT_PATTERN = re.compile(
    r"\b(?:service|persist)\.adb\.tcp\.port\b\s*(?:\]\s*:|=|:)\s*\[?(\d+)",
    re.IGNORECASE,
)
PAIRING_PATTERNS = [
    (re.compile(r"adbd_wifi_secure_connect:\s*connected", re.IGNORECASE), "WIRELESS", "ENTRADA"),
    (re.compile(r"adbd_wifi_secure_connect:\s*disconnected", re.IGNORECASE), "WIRELESS", "SAÍDA"),
    (re.compile(r"adbd_usb_secure_connect:\s*connected", re.IGNORECASE), "USB", "ENTRADA"),
    (re.compile(r"adbd_usb_secure_connect:\s*disconnected", re.IGNORECASE), "USB", "SAÍDA"),
    (re.compile(r"AdbDebuggingManager:\s*Received WIFI TLS connected key message", re.IGNORECASE), "WIRELESS", "ENTRADA"),
    (re.compile(r"AdbDebuggingManager:\s*Received USB TLS connected key message", re.IGNORECASE), "USB", "ENTRADA"),
    (re.compile(r"AdbDebuggingManager.*(?:Received\s+(?:connected|public)\s+key|Logging key)", re.IGNORECASE), "AUTORIZAÇÃO", "ENTRADA"),
    (re.compile(r"AdbDebuggingManager.*WIFI TLS connected key.*u0_a", re.IGNORECASE), "WIRELESS", "ENTRADA"),
    (re.compile(r"AdbDebuggingManager.*(?:WIFI TLS|TLS connected|tls\..*connect)", re.IGNORECASE), "WIRELESS", "ENTRADA"),
    (re.compile(r"adbd\s*:\s*adbd service requested.*getprop.*adb\.tcp\.port", re.IGNORECASE), "SHELL", "CONSULTA"),
    (re.compile(r"(?:service|persist)\.adb\.tcp\.port\s*(?:\]|=|:)\s*\[?\d+", re.IGNORECASE), "CONFIG", "ATIVA"),
]
LOGCAT_TS_PATTERN = re.compile(r"^(\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}\.\d+)")


def new_access_state() -> dict[str, object]:
    return {"props": {}, "remote_hits": [], "pairing_hits": [], "entries": 0, "bytes": 0, "warnings": []}


def property_from_line(line: str) -> tuple[str, str] | None:
    match = ACCESS_PROP_PATTERN.search(line)
    if not match:
        return None
    key = match.group("key").lower()
    if key not in ACCESS_PROP_KEYS:
        return None
    value = match.group("value").strip().strip("[]").strip()
    return key, value


def process_access_line(state: dict[str, object], raw_line: bytes, label: str, number: int = 0) -> None:
    text = raw_line.decode("utf-8", errors="replace").rstrip("\r\n")
    if len(text) > 4000:
        text = text[:4000] + " [...]"
    props = state["props"]
    if isinstance(props, dict):
        prop = property_from_line(text)
        if prop:
            props[prop[0]] = prop[1]

    remote_hits = state["remote_hits"]
    if isinstance(remote_hits, list):
        port_match = ADB_PORT_PATTERN.search(text)
        is_service_request = re.search(r"adbd\s*:\s*adbd service requested.*adb\.tcp\.port", text, re.IGNORECASE)
        if port_match or is_service_request:
            remote_hits.append({
                "path": label,
                "line": text.strip(),
                "port": port_match.group(1) if port_match else None,
                "type": "ADB TCP" if port_match else "solicitação do serviço ADB",
                "number": number,
            })

    pairing_hits = state["pairing_hits"]
    if isinstance(pairing_hits, list) and len(pairing_hits) < 50:
        for pattern, connection_type, direction in PAIRING_PATTERNS:
            if pattern.search(text):
                timestamp_match = LOGCAT_TS_PATTERN.match(text)
                pairing_hits.append({
                    "path": label,
                    "line": text.strip(),
                    "timestamp": timestamp_match.group(1) if timestamp_match else None,
                    "type": connection_type,
                    "dir": direction,
                    "number": number,
                })
                break


def scan_access_stream(
    stream: BinaryIO,
    label: str,
    state: dict[str, object],
    progress_name: str,
    progress_state: list[int],
    progress_final: bool = True,
    show_progress: bool = True,
) -> None:
    pending = b""
    line_number = 0
    last_progress = time.monotonic()
    while True:
        chunk = stream.read(CHUNK_SIZE)
        if not chunk:
            break
        progress_state[0] += len(chunk)
        state["bytes"] = progress_state[0]
        if show_progress and time.monotonic() - last_progress >= 1:
            progress_line(progress_name, progress_state[0])
            last_progress = time.monotonic()
        data = pending + chunk
        parts = data.splitlines(keepends=True)
        if parts and not parts[-1].endswith((b"\n", b"\r")):
            pending = parts.pop()
        else:
            pending = b""
        for raw_line in parts:
            line_number += 1
            process_access_line(state, raw_line, label, line_number)
    if pending:
        line_number += 1
        process_access_line(state, pending, label, line_number)
    if show_progress and progress_final:
        progress_line(progress_name, progress_state[0], final=True)


def scan_access_source(path: Path, show_progress: bool = True) -> dict[str, object]:
    state = new_access_state()
    progress_state = [0]
    if path.suffix.lower() != ".zip":
        state["entries"] = 1
        with path.open("rb") as stream:
            scan_access_stream(stream, str(path), state, path.name, progress_state, show_progress=show_progress)
        return state

    with zipfile.ZipFile(path, "r") as archive:
        for info in archive.infolist():
            if info.is_dir() or info.filename.endswith("/"):
                continue
            if Path(info.filename.lower()).suffix in SKIP_BINARY_EXTENSIONS:
                progress_state[0] += max(0, info.file_size)
                continue
            state["entries"] = int(state["entries"]) + 1
            try:
                with archive.open(info, "r") as stream:
                    scan_access_stream(stream, info.filename, state, path.name, progress_state, progress_final=False, show_progress=show_progress)
            except (OSError, EOFError, RuntimeError, zipfile.BadZipFile) as exc:
                warnings = state["warnings"]
                if isinstance(warnings, list):
                    warnings.append(f"não foi possível ler {info.filename}: {exc}")
    if show_progress:
        progress_line(path.name, progress_state[0], final=True)
    return state


def scan_access_text(text: str, label: str) -> dict[str, object]:
    state = new_access_state()
    state["entries"] = 1
    for number, line in enumerate(text.splitlines(), 1):
        process_access_line(state, line.encode("utf-8", errors="replace"), label, number)
    state["bytes"] = len(text.encode("utf-8", errors="replace"))
    return state


def merge_access_states(target: dict[str, object], source: dict[str, object]) -> None:
    target_props = target["props"]
    source_props = source["props"]
    if isinstance(target_props, dict) and isinstance(source_props, dict):
        for key, value in source_props.items():
            if value:
                target_props[key] = value
    for key in ("remote_hits", "pairing_hits", "warnings"):
        target_list = target[key]
        source_list = source[key]
        if not isinstance(target_list, list) or not isinstance(source_list, list):
            continue
        if key in {"remote_hits", "pairing_hits"}:
            seen = {
                (item.get("type"), item.get("dir"), item.get("line"))
                for item in target_list
                if isinstance(item, dict)
            }
            for item in source_list:
                if not isinstance(item, dict):
                    continue
                token = (item.get("type"), item.get("dir"), item.get("line"))
                if token not in seen:
                    target_list.append(item)
                    seen.add(token)
        else:
            for item in source_list:
                if item not in target_list:
                    target_list.append(item)
    target["entries"] = int(target["entries"]) + int(source["entries"])
    target["bytes"] = int(target["bytes"]) + int(source["bytes"])


def collect_live_access_state(out_dir: Path) -> dict[str, object]:
    state = new_access_state()
    getprop_result = run_adb(out_dir, ["shell", "getprop"], timeout=60)
    if getprop_result.returncode != 0:
        raise RuntimeError(f"getprop falhou: {getprop_result.stdout.strip()[-500:]}")
    merge_access_states(state, scan_access_text(getprop_result.stdout or "", "ADB ao vivo / getprop"))

    logcat_result = run_adb(out_dir, ["logcat", "-d", "-b", "all", "-v", "threadtime", "-t", "2000"], timeout=90)
    if logcat_result.returncode == 0:
        merge_access_states(state, scan_access_text(logcat_result.stdout or "", "ADB ao vivo / logcat"))
    else:
        warnings = state["warnings"]
        if isinstance(warnings, list):
            warnings.append(f"logcat ao vivo indisponível: {logcat_result.stdout.strip()[-500:]}")
    return state


def parse_access_properties(state: dict[str, object]) -> dict[str, str]:
    props = state["props"]
    return props if isinstance(props, dict) else {}


def access_prop(props: dict[str, str], *keys: str, default: str = "-") -> str:
    for key in keys:
        value = props.get(key, "").strip()
        if value:
            return value
    return default


def access_device_summary(state: dict[str, object]) -> dict[str, object]:
    props = parse_access_properties(state)
    fingerprint = access_prop(props, "ro.build.fingerprint", "ro.bootimage.build.fingerprint")
    flash_locked = props.get("ro.boot.flash.locked", "")
    vb_state = props.get("ro.boot.vbmeta.device_state", "")
    if flash_locked == "1" or vb_state == "locked":
        bootloader = "Bloqueado"
        bootloader_ok = True
    elif flash_locked == "0" or vb_state == "unlocked":
        bootloader = "Desbloqueado"
        bootloader_ok = False
    else:
        bootloader = "-"
        bootloader_ok = True
    verified_boot = props.get("ro.boot.verifiedbootstate", "-")
    signature_match = re.search(r"(release-keys|test-keys|dev-keys)", fingerprint)
    signature = signature_match.group(1) if signature_match else "-"
    debuggable = props.get("ro.debuggable", "")
    secure = props.get("ro.secure", "")
    usb_raw = access_prop(props, "sys.usb.state", "persist.sys.usb.config", "sys.usb.config", default="")
    usb_labels = {"mtp": "MTP", "ptp": "PTP", "adb": "ADB", "rndis": "RNDIS (rede)", "midi": "MIDI", "accessory": "Accessory", "none": "Nenhum", "ncm": "NCM (rede)"}
    usb_functions = [part.strip().lower() for part in usb_raw.split(",") if part.strip()]
    usb_mode = " + ".join(usb_labels.get(part, part) for part in usb_functions) if usb_functions else "-"
    return {
        "device": [
            ("Modelo", access_prop(props, "ro.product.model", "ro.product.marketname")),
            ("Fabricante", access_prop(props, "ro.product.manufacturer")),
            ("Marca", access_prop(props, "ro.product.brand")),
            ("Android", access_prop(props, "ro.build.version.release")),
            ("SDK", access_prop(props, "ro.build.version.sdk")),
            ("Build ID", access_prop(props, "ro.build.id")),
            ("Tipo de build", access_prop(props, "ro.build.type")),
            ("Fingerprint", fingerprint),
            ("Serial", access_prop(props, "ro.serialno", "ro.boot.serialno")),
        ],
        "security": [
            ("Bootloader", bootloader, bootloader_ok),
            ("Verified Boot", verified_boot, verified_boot == "green"),
            ("Assinatura do build", signature, signature == "release-keys"),
            ("Debuggable", "Sim" if debuggable == "1" else "Não" if debuggable == "0" else "-", debuggable != "1"),
            ("Modo seguro (ro.secure)", "Sim" if secure == "1" else "Não" if secure == "0" else "-", secure == "1"),
            ("Modo USB (sys.usb.state)", usb_mode, True),
        ],
        "usb_raw": usb_raw or "-",
    }


def parse_bugreport_path(output: str) -> str | None:
    patterns = [
        r"(?:^|\s)(?:OK|BEGIN):\s*([^\s]+\.zip)",
        r"(/[^\s]+\.zip)",
    ]
    for line in output.splitlines():
        for pattern in patterns:
            found = re.search(pattern, line.strip())
            if found:
                return found.group(1).rstrip("\r\n")
    return None


def adb_target_file(out_dir: Path) -> Path:
    return out_dir / ".hazzscreens_adb_target"


def adb_executable() -> str | None:
    return shutil.which("adb")


def connected_adb_serial(out_dir: Path, timeout: int = 30) -> str:
    executable = adb_executable()
    if not executable:
        raise RuntimeError("ADB não está instalado. Execute: pkg install android-tools -y")

    completed = subprocess.run([executable, "devices"], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, timeout=timeout)
    serials = []
    for line in completed.stdout.splitlines():
        parts = line.strip().split()
        if len(parts) >= 2 and parts[1] == "device":
            serials.append(parts[0])

    saved_file = adb_target_file(out_dir)
    saved = saved_file.read_text(encoding="utf-8").strip() if saved_file.is_file() else ""
    if saved and saved in serials:
        return saved
    if len(serials) == 1:
        saved_file.write_text(serials[0] + "\n", encoding="utf-8")
        return serials[0]
    if len(serials) > 1:
        raise RuntimeError("há mais de um dispositivo ADB conectado; remova os demais e tente novamente")
    raise RuntimeError("nenhum dispositivo ADB conectado. Use a opção 4, pareamento")


def run_adb(out_dir: Path, arguments: list[str], *, input_text: str | None = None, timeout: int = 900) -> subprocess.CompletedProcess[str]:
    executable = adb_executable()
    if not executable:
        raise RuntimeError("ADB não está instalado. Execute: pkg install android-tools -y")
    serial = connected_adb_serial(out_dir)
    command = [executable, "-s", serial, *arguments]
    return subprocess.run(command, input=input_text, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, timeout=timeout)


def pair_adb(out_dir: Path) -> int:
    executable = adb_executable()
    if not executable:
        print("ADB não está instalado no Termux.")
        print("Instale com: pkg install android-tools -y")
        return 1

    print("\nAbra no Android: Configurações > Opções do desenvolvedor > Depuração sem fio.")
    print("Toque em 'Parear dispositivo com código de pareamento'.")
    pair_address = input("Endereço de pareamento (IP:porta): ").strip()
    pairing_code = input("Código de pareamento: ").strip()
    if not pair_address or not pairing_code:
        print("Endereço e código são obrigatórios.")
        return 1

    paired = subprocess.run([executable, "pair", pair_address], input=pairing_code + "\n", stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, timeout=60)
    print(paired.stdout.strip())
    if paired.returncode != 0:
        return paired.returncode or 1

    print("\nAgora volte à tela principal de Depuração sem fio e procure 'Endereço IP e porta'.")
    connect_address = input("Endereço de conexão (IP:porta): ").strip()
    if not connect_address:
        print("O endereço de conexão é obrigatório.")
        return 1

    connected = subprocess.run([executable, "connect", connect_address], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, timeout=60)
    print(connected.stdout.strip())
    if connected.returncode != 0 or "connected" not in connected.stdout.lower():
        return connected.returncode or 1

    out_dir.mkdir(parents=True, exist_ok=True)
    adb_target_file(out_dir).write_text(connect_address + "\n", encoding="utf-8")
    print("Pareamento concluído. O dispositivo será usado nas opções gerar e start.")
    return 0


def run_bugreportz_local() -> Path:
    commands: list[list[str]] = []
    for executable in ("bugreportz", "/system/bin/bugreportz"):
        if executable == "bugreportz" and shutil.which(executable):
            commands.append([executable, "-p"])
        elif executable != "bugreportz" and Path(executable).exists():
            commands.append([executable, "-p"])
    if shutil.which("su"):
        for executable in ("bugreportz", "/system/bin/bugreportz"):
            commands.append(["su", "-c", f"{shlex.quote(executable)} -p"])

    if not commands:
        raise RuntimeError("bugreportz não está disponível no Termux; use analisar com um ZIP copiado para o armazenamento compartilhado")

    last_output = ""
    for command in commands:
        try:
            completed = subprocess.run(command, text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, timeout=900)
        except (OSError, subprocess.SubprocessError) as exc:
            last_output = str(exc)
            continue
        last_output = completed.stdout or ""
        generated = parse_bugreport_path(last_output)
        if generated:
            generated_path = Path(generated)
            if generated_path.is_file():
                return generated_path
            if shutil.which("su"):
                probe = subprocess.run(["su", "-c", f"test -f {shlex.quote(generated)}"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                if probe.returncode == 0:
                    return generated_path
        if completed.returncode == 0 and generated:
            break
    raise RuntimeError(f"bugreportz local não retornou um ZIP acessível. Saída: {last_output.strip()[-1000:]}")


def run_bugreportz_adb(out_dir: Path) -> Path:
    completed = run_adb(out_dir, ["shell", "bugreportz", "-p"], timeout=900)
    output = completed.stdout or ""
    generated = parse_bugreport_path(output)
    if completed.returncode != 0 or not generated:
        raise RuntimeError(f"ADB não retornou o caminho da bugreport. Saída: {output.strip()[-1000:]}")

    destination = out_dir / Path(generated).name
    pulled = run_adb(out_dir, ["pull", generated, str(destination)], timeout=900)
    if pulled.returncode != 0 or not destination.is_file():
        raise RuntimeError(f"não consegui baixar a bugreport via adb pull: {generated}")
    return destination


def run_bugreportz(out_dir: Path) -> Path:
    local_error: Exception | None = None
    try:
        return run_bugreportz_local()
    except Exception as exc:
        local_error = exc

    if adb_executable():
        try:
            return run_bugreportz_adb(out_dir)
        except Exception as adb_error:
            raise RuntimeError(f"não foi possível gerar localmente nem via ADB. Local: {local_error}. ADB: {adb_error}") from adb_error
    raise RuntimeError(str(local_error))


def copy_from_device(source: Path, destination: Path) -> Path:
    destination.parent.mkdir(parents=True, exist_ok=True)
    try:
        shutil.copy2(source, destination)
        return destination
    except (OSError, shutil.Error):
        pass

    if shutil.which("su"):
        command = ["su", "-c", f"cp {shlex.quote(str(source))} {shlex.quote(str(destination))}"]
        completed = subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
        if completed.returncode == 0 and destination.is_file():
            return destination
    raise RuntimeError(f"não consegui copiar a bugreport para o armazenamento acessível: {source}")


def generate_bugreport(out_dir: Path) -> Path:
    print(paint("gerando bugreport...", GREEN))
    source = run_bugreportz(out_dir)
    try:
        already_in_output = source.resolve().parent == out_dir.resolve()
    except OSError:
        already_in_output = False
    if already_in_output:
        copied = source
    else:
        destination = out_dir / source.name
        copied = copy_from_device(source, destination)
    print(paint(f"bugreport salva: {copied.name}", GREEN))
    return copied


def line_text(record: str) -> str:
    parts = record.split(":", 2)
    return parts[2] if len(parts) == 3 else record


def extract_date(text: str) -> str | None:
    patterns = (
        r"\b\d{2}/\d{2}/\d{4}[ T]\d{2}:\d{2}(?::\d{2})?\b",
        r"\b\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(?::\d{2})?\b",
    )
    for pattern in patterns:
        found = re.search(pattern, text)
        if found:
            return found.group(0)
    return None


def classify_record(record: str) -> tuple[str, str]:
    text = line_text(record)
    lower = text.lower()
    date = extract_date(text) or "não identificada"
    if "uninstall pkg" in lower or "uninstall" in lower or "removed package" in lower:
        return "remoção", date
    return "instalada", date


def representative_matches(matches: dict[str, list[str]]) -> dict[str, str]:
    """Escolhe uma única linha por package, priorizando qualquer registro de remoção."""
    selected: dict[str, str] = {}
    for package, _name in PROXY_CATALOG:
        records = matches.get(package, [])
        if not records:
            continue
        removal = next((record for record in records if classify_record(record)[0] == "remoção"), None)
        selected[package] = removal or records[0]
    return selected


def proxy_result_lines(matches: dict[str, list[str]], colored: bool = False, compact: bool = False) -> list[str]:
    """Formata no máximo uma ocorrência por package Proxy."""
    output: list[str] = []
    selected = representative_matches(matches)
    number = 0
    for package, name in PROXY_CATALOG:
        record = selected.get(package)
        if not record:
            continue
        number += 1
        status, date = classify_record(record)
        color = RED if status == "remoção" else GREEN
        fields = [
            f"status: {status}",
            f"package: {package}",
        ]
        if status == "remoção":
            fields.append(f"data: {date}")
        output.append(f"{number}. {name}")
        field_width = max(24, terminal_columns() - 3)
        for field in fields:
            shown = clip_text(field, field_width) if compact else field
            output.append(f"   {paint(shown, color) if colored else shown}")
        evidence_text = line_text(record)
        if compact:
            evidence_text = clip_text(evidence_text, max(24, terminal_columns() - 15))
        evidence_line = f"evidência: {evidence_text}"
        output.append(f"   {paint(evidence_line, color) if colored else evidence_line}")
        output.append("")
    return output


def render_cards(matches: dict[str, list[str]], colored: bool = False) -> list[str]:
    return proxy_result_lines(matches, colored=colored)


def warnings_from(matches: dict[str, list[str]]) -> list[str]:
    return matches.get("__warnings__", [])


def clean_matches(matches: dict[str, list[str]]) -> dict[str, list[str]]:
    return {package: lines for package, lines in matches.items() if package != "__warnings__" and lines}


def grouped_selected(matches: dict[str, list[str]]) -> tuple[dict[str, list[str]], dict[str, list[str]]]:
    selected = representative_matches(clean_matches(matches))
    removals: dict[str, list[str]] = {}
    installed: dict[str, list[str]] = {}
    for package, record in selected.items():
        target = removals if classify_record(record)[0] == "remoção" else installed
        target[package] = [record]
    return removals, installed


def proxy_report_lines(matches: dict[str, list[str]]) -> list[str]:
    output: list[str] = []
    removals, installed = grouped_selected(clean_matches(matches))
    for heading, selected in (("[+] PROXYS / W.O. CONFIRMADO", removals), ("[+] PROXYS INSTALADAS / REVISAR", installed)):
        if not selected:
            continue
        output.append(heading)
        for number, (package, records) in enumerate(selected.items(), 1):
            record = records[0]
            status, date = classify_record(record)
            status_label = "removida" if status == "remoção" else "instalada"
            name = PROXY_NAMES.get(package, package)
            output.append(f"[+] {name}")
            output.append(f"status: {status_label}")
            output.append(f"package: {package}")
            if date != "não identificada":
                output.append(f"data: {date}")
            output.append(f"Log: {line_text(record)}")
            output.append("")
    return output


def write_results(out_dir: Path, archive: Path, matches: dict[str, list[str]], entries_scanned: int, error: str | None = None) -> tuple[Path, Path]:
    timestamp = stamp()
    report = out_dir / f"hazzscreens_report_{timestamp}.txt"
    evidence = out_dir / f"hazzscreens_evidence_{timestamp}.txt"
    found = clean_matches(matches)
    warnings = warnings_from(matches)
    report_lines = [
        *banner_lines(),
        f"[-] Arquivo analisado: {archive.name}",
        f"[-] Packages catalogados: {len(PROXY_CATALOG)}",
        f"[-] Entradas/arquivos examinados: {entries_scanned}",
        f"[-] Data da análise: {time.strftime('%Y-%m-%d %H:%M:%S')}",
        "",
    ]
    if error:
        report_lines.extend([f"ERRO: {error}", ""])
    if found:
        removals, installed = grouped_selected(found)
        if removals:
            report_lines.extend(["[!] encontrada logs de remoção/desinstalação de apps Proxys", *proxy_report_lines(removals)])
        if installed:
            report_lines.extend(proxy_report_lines(installed))
    elif not error:
        report_lines.extend([
            "[-] nenhum package do catálogo apareceu na bugreport analisada",
            "[-] ausência na bugreport não prova que um package nunca esteve instalado ou em execução.",
            "",
        ])
    if warnings:
        report_lines.extend(["[!] AVISOS:", *[f"[!] {warning}" for warning in warnings], ""])
    report_lines.extend([
        "[-] cada ocorrência é evidência para revisão humana; sozinha não prova trapaça ou uso durante uma partida.",
        "",
        *completion_lines(),
    ])
    report.write_text("\n".join(report_lines) + "\n", encoding="utf-8")

    evidence_lines = [*banner_lines(), f"[-] Arquivo analisado: {archive.name}", ""]
    if found:
        removals, installed = grouped_selected(found)
        if removals:
            evidence_lines.extend(["[!] encontrada logs de remoção/desinstalação de apps Proxys", *proxy_report_lines(removals)])
        if installed:
            evidence_lines.extend(proxy_report_lines(installed))
    if warnings:
        evidence_lines.extend(["[!] AVISOS:", *[f"[!] {warning}" for warning in warnings]])
    evidence_lines.extend(["", *completion_lines()])
    evidence.write_text("\n".join(evidence_lines) + "\n", encoding="utf-8")
    return report, evidence



def access_security_review_count(state: dict[str, object]) -> int:
    summary = access_device_summary(state)
    security = summary.get("security", [])
    if not isinstance(security, list):
        return 0
    return sum(1 for _label, value, ok in security if value != "-" and not ok)


def result_counts(matches: dict[str, list[str]], access_state: dict[str, object] | None = None) -> tuple[int, int]:
    removals, installed = grouped_selected(clean_matches(matches))
    wo_count = len(removals)
    review_count = len(installed)
    if access_state:
        remote_hits = access_state.get("remote_hits", [])
        pairing_hits = access_state.get("pairing_hits", [])
        review_count += len(remote_hits) if isinstance(remote_hits, list) else 0
        review_count += len(pairing_hits) if isinstance(pairing_hits, list) else 0
    return wo_count, review_count


def print_rule() -> None:
    print(paint("-" * min(terminal_columns(), 60), GRAY))


def proxy_status_label(status: str) -> str:
    return "removida" if status == "remoção" else "instalada"


def print_proxy_card(package: str, record: str) -> None:
    name = PROXY_NAMES.get(package, package)
    status, date = classify_record(record)
    print_rule()
    print_critical(name)
    print_field("status", proxy_status_label(status))
    print_field("package", package)
    if date != "não identificada":
        print_field("data", date)
    print_field("Log", clip_text(line_text(record), max(24, terminal_columns() - 8)))


def print_proxy_sections(matches: dict[str, list[str]]) -> None:
    found = clean_matches(matches)
    removals, installed = grouped_selected(found)
    if removals:
        print_title("PROXYS REMOVIDAS / W.O. CONFIRMADO")
        for package, records in removals.items():
            print_proxy_card(package, records[0])
        print()
    if installed:
        print_title("PROXYS INSTALADAS / REVISAR")
        for package, records in installed.items():
            print_proxy_card(package, records[0])
        print()


def print_access_sections(state: dict[str, object]) -> None:
    summary = access_device_summary(state)
    device = summary.get("device", [])
    security = summary.get("security", [])
    remote_hits = state.get("remote_hits", [])
    pairing_hits = state.get("pairing_hits", [])
    warnings = state.get("warnings", [])
    print_title("APARELHO / ADB")
    if isinstance(device, list):
        for label, value in device[:6]:
            print_explanation(f"{label}: {value}")
    if isinstance(security, list):
        for label, value, ok in security:
            if value != "-" and not ok:
                print_warning(f"{label}: {value}")
            else:
                print_explanation(f"{label}: {value}")
    print()
    print_title("ACESSOS REMOTOS")
    if isinstance(remote_hits, list) and remote_hits:
        print_critical(f"REMOTE DETECTADO ({len(remote_hits)} evidência(s))")
        for hit in remote_hits:
            print_rule()
            print_critical(str(hit.get("type") or "ADB remoto"))
            if hit.get("port"):
                print_field("porta", hit.get("port"))
            print_field("Log", hit.get("line", ""))
    else:
        print_explanation("nenhuma evidência específica de acesso remoto ADB TCP detectada")
    print()
    print_title("PAREAMENTOS USB / WI-FI")
    if isinstance(pairing_hits, list) and pairing_hits:
        print_critical(f"{len(pairing_hits)} evento(s) de conexão detectado(s)")
        for hit in pairing_hits:
            print_rule()
            connection = f"{hit.get('type', '-')} / {hit.get('dir', '-')}"
            print_critical(connection)
            print_field("tipo", connection)
            print_field("Log", hit.get("line", ""))
    else:
        print_explanation("nenhum evento específico de pareamento USB/Wi-Fi detectado")
    if isinstance(warnings, list):
        for warning in warnings:
            print_warning(str(warning))


def print_result_summary(matches: dict[str, list[str]], access_state: dict[str, object] | None = None) -> None:
    wo_count, review_count = result_counts(matches, access_state)
    print()
    print_critical("RESULTADO")
    if wo_count:
        print_critical("W.O. CONFIRMADO")
    else:
        print_warning("W.O. NÃO CONFIRMADO")
    print(
        paint("W.o: ", DARK_RED)
        + paint(str(wo_count), YELLOW)
        + paint(" • ", DARK_RED)
        + paint("Revisar: ", DARK_RED)
        + paint(str(review_count), YELLOW)
    )
    print_explanation("W.O. conta Proxys com evidência de remoção; Revisar reúne evidências instaladas, remotas, pareamentos e alertas de segurança.")


def print_console_cards(
    matches: dict[str, list[str]],
    archive: Path,
    entries_scanned: int,
    access_state: dict[str, object] | None = None,
    access_source: str | None = None,
) -> None:
    found = clean_matches(matches)
    print_hazz_header()
    print_explanation(f"Arquivo analisado: {archive.name}")
    print_explanation(f"Packages catalogados: {len(PROXY_CATALOG)}")
    print_explanation(f"Entradas/arquivos examinados: {entries_scanned}")
    print_explanation(f"Data da análise: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    if found:
        print_proxy_sections(matches)
    else:
        print_explanation("nenhum package do catálogo apareceu na bugreport analisada")
    if access_state is not None:
        print()
        if access_source:
            print_explanation(f"Fonte: {access_source}")
        print_access_sections(access_state)
    print()
    print_result_summary(matches, access_state)


def automatic_access_scan(state: dict[str, object], archive: Path, out_dir: Path) -> tuple[dict[str, object], str, Path | None]:
    source_parts = [archive.name]
    if adb_executable():
        try:
            connected_adb_serial(out_dir, timeout=3)
        except Exception as exc:
            warnings = state["warnings"]
            if isinstance(warnings, list):
                warnings.append(f"ADB ao vivo não consultado: {exc}")
        else:
            try:
                merge_access_states(state, collect_live_access_state(out_dir))
                source_parts.append("ADB ao vivo")
            except Exception as exc:
                warnings = state["warnings"]
                if isinstance(warnings, list):
                    warnings.append(f"não foi possível consultar ADB ao vivo: {exc}")
    else:
        warnings = state["warnings"]
        if isinstance(warnings, list):
            warnings.append("ADB ao vivo indisponível; instale android-tools para consultar o aparelho conectado")
    report = write_access_report(out_dir, " + ".join(source_parts), state)
    return state, " + ".join(source_parts), report


def analyze(archive: Path, out_dir: Path) -> int:
    matches: dict[str, list[str]] = {}
    access_state = new_access_state()
    entries_scanned = 0
    error: str | None = None
    try:
        if archive.suffix.lower() == ".zip":
            matches, entries_scanned, first_entry = scan_zip(archive, access_state=access_state)
        else:
            matches = safe_open(archive, access_state=access_state)
            entries_scanned = 1
    except (OSError, zipfile.BadZipFile, RuntimeError, ValueError) as exc:
        error = f"não foi possível ler a bugreport: {exc}"

    access_state, access_source, access_report = automatic_access_scan(access_state, archive, out_dir)
    report, evidence = write_results(out_dir, archive, matches, entries_scanned, error)
    print_console_cards(matches, archive, entries_scanned, access_state, access_source)
    print_explanation(f"relatório de acessos salvo em: {access_report}")
    if error:
        print_warning(f"falha na análise principal: {error}")
        print_completion_block()
        return 1
    print_completion_block()
    return 0


def access_report_lines(state: dict[str, object], source_label: str) -> list[str]:
    summary = access_device_summary(state)
    device = summary["device"] if isinstance(summary.get("device"), list) else []
    security = summary["security"] if isinstance(summary.get("security"), list) else []
    remote_hits = state["remote_hits"] if isinstance(state.get("remote_hits"), list) else []
    pairing_hits = state["pairing_hits"] if isinstance(state.get("pairing_hits"), list) else []
    warnings = state["warnings"] if isinstance(state.get("warnings"), list) else []
    lines = [
        "HazzScreenS | credits: kernel bypass",
        "Forensic scanner",
        "Módulo: acessos remotos ADB/USB",
        f"Fonte: {source_label}",
        f"Entradas/arquivos examinados: {state.get('entries', 0)}",
        f"Dados lidos: {int(state.get('bytes', 0)) / (1024 * 1024):.1f} MB",
        f"Data da análise: {time.strftime('%Y-%m-%d %H:%M:%S')}",
        "",
        "Dispositivo",
    ]
    lines.extend(f"{label}: {value}" for label, value in device)
    lines.extend(["", "Estado de segurança"])
    lines.extend(f"{label}: {value}" for label, value, _ok in security)
    lines.extend(["", "Acesso remoto ADB/rede"])
    if remote_hits:
        ports = [hit.get("port") for hit in remote_hits if hit.get("port")]
        port_label = ports[0] if ports else "5555"
        lines.append(f"Remote detectado: porta {port_label} aberta ou consultada")
        for hit in remote_hits:
            lines.append(f"LOG: {hit.get('line', '')}")
    else:
        lines.append("Nenhuma evidência específica de porta ADB TCP detectada")
    lines.extend(["", "Pareamentos ADB/USB"])
    if pairing_hits:
        lines.append(f"{len(pairing_hits)} evento(s) de pareamento/conexão detectado(s)")
        for hit in pairing_hits:
            timestamp = f"{hit.get('timestamp')}  " if hit.get("timestamp") else ""
            lines.append(f"{timestamp}[ PC/CELULAR ({hit.get('type', '-')}) ] [ {hit.get('dir', '-')} ]")
            lines.append(f"LOG: {hit.get('line', '')}")
    else:
        lines.append("Nenhum evento de pareamento USB/Wi-Fi específico detectado")
    if warnings:
        lines.extend(["", "AVISOS:", *[str(warning) for warning in warnings]])
    lines.extend([
        "",
        "Nota: uma evidência de ADB, USB ou configuração insegura exige revisão humana e não prova, sozinha, acesso indevido ou trapaça.",
    ])
    return lines


def access_report_lines(state: dict[str, object], source_label: str) -> list[str]:
    summary = access_device_summary(state)
    device = summary.get("device", [])
    security = summary.get("security", [])
    remote_hits = state.get("remote_hits", [])
    pairing_hits = state.get("pairing_hits", [])
    warnings = state.get("warnings", [])
    lines = [
        "HazzScreenS | credits: kernel bypass",
        "Forensic scanner",
        "[-] Módulo automático de acessos remotos ADB/USB",
        f"[-] Fonte: {source_label}",
        f"[-] Entradas/arquivos examinados: {state.get('entries', 0)}",
        f"[-] Dados lidos: {int(state.get('bytes', 0)) / (1024 * 1024):.1f} MB",
        f"[-] Data da análise: {time.strftime('%Y-%m-%d %H:%M:%S')}",
        "",
        "APARELHO / ADB",
    ]
    if isinstance(device, list):
        lines.extend(f"[-] {label}: {value}" for label, value in device)
    lines.append("ESTADO DE SEGURANÇA")
    if isinstance(security, list):
        for label, value, ok in security:
            prefix = "[-]" if value == "-" or ok else "[!]"
            lines.append(f"{prefix} {label}: {value}")
    lines.append("[+] ACESSOS REMOTOS")
    if isinstance(remote_hits, list) and remote_hits:
        lines.append(f"[+] REMOTE DETECTADO ({len(remote_hits)} evidência(s))")
        for hit in remote_hits:
            lines.append("")
            lines.append(f"[+] {hit.get('type') or 'ADB remoto'}")
            if hit.get("port"):
                lines.append(f"porta: {hit.get('port')}")
            lines.append(f"Log: {hit.get('line', '')}")
    else:
        lines.append("[-] nenhuma evidência específica de acesso remoto ADB TCP detectada")
    lines.append("")
    lines.append("[+] PAREAMENTOS USB / WI-FI")
    if isinstance(pairing_hits, list) and pairing_hits:
        lines.append(f"[+] {len(pairing_hits)} evento(s) de conexão detectado(s)")
        for hit in pairing_hits:
            connection = f"{hit.get('type', '-')} / {hit.get('dir', '-') }"
            lines.append("")
            lines.append(f"[+] {connection}")
            lines.append(f"tipo: {connection}")
            lines.append(f"Log: {hit.get('line', '')}")
    else:
        lines.append("[-] nenhum evento específico de pareamento USB/Wi-Fi detectado")
    if isinstance(warnings, list) and warnings:
        lines.append("[!] AVISOS:")
        lines.extend(f"[!] {warning}" for warning in warnings)
    lines.append("[-] uma evidência de ADB, USB ou configuração insegura exige revisão humana e não prova, sozinha, acesso indevido ou trapaça.")
    return lines


def write_access_report(out_dir: Path, source_label: str, state: dict[str, object]) -> Path:
    report = out_dir / f"hazzscreens_access_{stamp()}.txt"
    report.write_text("\n".join(access_report_lines(state, source_label)) + "\n", encoding="utf-8")
    return report


def print_access_report(source_label: str, state: dict[str, object], report: Path) -> None:
    summary = access_device_summary(state)
    device = summary["device"] if isinstance(summary.get("device"), list) else []
    security = summary["security"] if isinstance(summary.get("security"), list) else []
    remote_hits = state["remote_hits"] if isinstance(state.get("remote_hits"), list) else []
    pairing_hits = state["pairing_hits"] if isinstance(state.get("pairing_hits"), list) else []
    warnings = state["warnings"] if isinstance(state.get("warnings"), list) else []
    print_hazz_header()
    print(paint("Módulo: acessos remotos ADB/USB", CYAN))
    print(paint(f"Fonte: {source_label}", CYAN))
    print(paint(f"Entradas/arquivos examinados: {state.get('entries', 0)}", CYAN))
    print(paint(f"Dados lidos: {int(state.get('bytes', 0)) / (1024 * 1024):.1f} MB", CYAN))
    print()
    print(paint("Dispositivo", WHITE))
    for label, value in device:
        print_wrapped(f"{label}: {value}", WHITE)
    print()
    print(paint("Estado de segurança", WHITE))
    for label, value, ok in security:
        if value == "-":
            color = YELLOW
        else:
            color = GREEN if ok else RED
        print_wrapped(f"{label}: {value}", color)
    print()
    print(paint("Acesso remoto ADB/rede", WHITE))
    if remote_hits:
        ports = [hit.get("port") for hit in remote_hits if hit.get("port")]
        port_label = ports[0] if ports else "5555"
        print_wrapped(f"Remote detectado: porta {port_label} aberta ou consultada", RED)
        for hit in remote_hits:
            print_wrapped(f"LOG: {hit.get('line', '')}", RED)
    else:
        print_wrapped("Nenhuma evidência específica de porta ADB TCP detectada", GREEN)
    print()
    print(paint("Pareamentos ADB/USB", WHITE))
    if pairing_hits:
        print_wrapped(f"{len(pairing_hits)} evento(s) de pareamento/conexão detectado(s)", RED)
        for hit in pairing_hits:
            timestamp = f"{hit.get('timestamp')}  " if hit.get("timestamp") else ""
            print_wrapped(f"{timestamp}[ PC/CELULAR ({hit.get('type', '-')}) ] [ {hit.get('dir', '-')} ]", RED)
            print_wrapped(f"LOG: {hit.get('line', '')}", RED)
    else:
        print_wrapped("Nenhum evento de pareamento USB/Wi-Fi específico detectado", GREEN)
    if warnings:
        print()
        print(paint("AVISOS:", YELLOW))
        for warning in warnings:
            print_wrapped(str(warning), YELLOW)
    print()
    print_wrapped(f"Relatório salvo em: {report}", WHITE)


def print_access_report(source_label: str, state: dict[str, object], report: Path) -> None:
    print_hazz_header()
    print_explanation("Módulo automático de acessos remotos ADB/USB")
    print_explanation(f"Fonte: {source_label}")
    print_explanation(f"Entradas/arquivos examinados: {state.get('entries', 0)}")
    print_explanation(f"Dados lidos: {int(state.get('bytes', 0)) / (1024 * 1024):.1f} MB")
    print()
    print_access_sections(state)
    print()
    print_explanation(f"relatório salvo em: {report}")


def analyze_accesses(out_dir: Path, archive: Path | None = None) -> int:
    state = new_access_state()
    source_parts: list[str] = []
    if archive is not None:
        source_parts.append(archive.name)
        file_state = scan_access_source(archive)
        merge_access_states(state, file_state)
    elif not adb_executable():
        raise RuntimeError("informe uma bugreport ou instale o ADB com: pkg install android-tools -y")

    if adb_executable():
        try:
            live_state = collect_live_access_state(out_dir)
            merge_access_states(state, live_state)
            source_parts.append("ADB ao vivo")
        except Exception as exc:
            warnings = state["warnings"]
            if isinstance(warnings, list):
                warnings.append(f"não foi possível consultar ADB ao vivo: {exc}")
    else:
        warnings = state["warnings"]
        if isinstance(warnings, list):
            warnings.append("ADB ao vivo indisponível; instale android-tools para consultar o aparelho conectado")
    if not source_parts:
        raise RuntimeError("nenhuma fonte de dados disponível para a análise de acessos")
    source_label = " + ".join(source_parts)
    report = write_access_report(out_dir, source_label, state)
    print_access_report(source_label, state, report)
    return 0


def show_banner() -> None:
    print_hazz_header()
    print()


def interactive_menu() -> int:
    while True:
        show_banner()
        print(paint("[1] Gerar bugreport", WHITE))
        print(paint("[2] Analisar bugreport mais recente", WHITE))
        print(paint("[3] Start: gerar e analisar", WHITE))
        print(paint("[4] Pareamento da depuração Wi-Fi", WHITE))
        print(paint("[5] Analisar bugreport pelo nome", WHITE))
        print()
        try:
            choice = input("Digite o numero da opcao: ").strip()
        except EOFError:
            print("\nNenhuma opcao informada.")
            return 1

        if choice not in {"1", "2", "3", "4", "5"}:
            print("\nOpcao invalida. Digite 1, 2, 3, 4 ou 5.\n")
            continue

        try:
            out_dir = output_dir(None)
            if choice == "4":
                pair_adb(out_dir)
                input("\nPressione ENTER para voltar ao menu...")
                continue
            if choice == "5":
                requested_name = input("Nome exato da bugreport (na pasta Download): ").strip()
                print()
                archive = named_bugreport(requested_name, out_dir)
                result = analyze(archive, out_dir)
            elif choice == "1":
                generate_bugreport(out_dir)
                result = 0
            elif choice == "2":
                archive = latest_bugreport(out_dir)
                result = analyze(archive, out_dir)
            else:
                generated = generate_bugreport(out_dir)
                result = analyze(generated, out_dir)
        except KeyboardInterrupt:
            print("\nOperacao interrompida.", file=sys.stderr)
            return 130
        except Exception as exc:
            print(f"\nERRO: {exc}", file=sys.stderr)
            result = 1

        print()
        try:
            input("Pressione ENTER para sair...")
        except EOFError:
            pass
        return result


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Analisa packages catalogados em bugreports Android")
    parser.add_argument("comando", choices=("gerar", "analisar", "start", "pareamento"))
    parser.add_argument("arquivo", nargs="?", help="ZIP/TXT específico para analisar")
    parser.add_argument("--out", default=None, help="diretório dos relatórios e cópias temporárias")
    return parser


def main() -> int:
    if len(sys.argv) == 1:
        return interactive_menu()

    args = build_parser().parse_args()
    out_dir = output_dir(args.out)

    try:
        if args.comando == "pareamento":
            return pair_adb(out_dir)
        if args.comando == "gerar":
            generate_bugreport(out_dir)
            return 0
        if args.comando == "analisar":
            archive = Path(args.arquivo).expanduser() if args.arquivo else latest_bugreport(out_dir)
            if not archive.is_file():
                raise RuntimeError(f"arquivo não encontrado: {archive}")
            return analyze(archive, out_dir)
        generated = generate_bugreport(out_dir)
        return analyze(generated, out_dir)
    except KeyboardInterrupt:
        print("\nOperação interrompida.", file=sys.stderr)
        return 130
    except Exception as exc:
        print(f"ERRO: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
