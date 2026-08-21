#!/data/data/com.termux/files/usr/bin/bash
set -u

log() {
    printf '[HazzScreenS] %s\n' "$*"
}

warn() {
    printf '[HazzScreenS] AVISO: %s\n' "$*" >&2
}

if ! command -v pkg >/dev/null 2>&1; then
    warn 'este script precisa ser executado dentro do Termux.'
    exit 1
fi

PREFIX_DIR="${PREFIX:-$HOME/.termux}"
STATE_DIR="$PREFIX_DIR/var/lib/hazzscreens"
if ! mkdir -p "$STATE_DIR" 2>/dev/null; then
    STATE_DIR="$HOME/.cache/hazzscreens"
    mkdir -p "$STATE_DIR"
fi
STAMP_FILE="$STATE_DIR/last_termux_update"

# A permissão de armazenamento é solicitada somente quando o link ainda não existe.
if command -v termux-setup-storage >/dev/null 2>&1 && [ ! -d "$HOME/storage/shared" ]; then
    log 'solicitando acesso ao armazenamento compartilhado...'
    termux-setup-storage || warn 'não foi possível solicitar o armazenamento; a análise ainda pode usar caminhos acessíveis.'
fi

# Atualiza o ambiente no primeiro uso e, depois, no máximo uma vez a cada 24 horas.
now=$(date +%s)
last=0
if [ -f "$STAMP_FILE" ]; then
    last=$(cat "$STAMP_FILE" 2>/dev/null || printf '0')
fi
case "$last" in
    ''|*[!0-9]*) last=0 ;;
esac

if [ "${HAZZ_SKIP_TERMUX_UPDATE:-0}" != "1" ] && [ $((now - last)) -ge 86400 ]; then
    log 'atualizando índices do Termux...'
    if ! pkg update -y; then
        warn 'pkg update falhou; continuando com o ambiente atual.'
    fi
    if [ "${HAZZ_SKIP_TERMUX_UPGRADE:-0}" != "1" ]; then
        log 'atualizando pacotes do Termux...'
        if ! pkg upgrade -y; then
            warn 'pkg upgrade falhou; continuando com o ambiente atual.'
        fi
    fi
    printf '%s\n' "$now" > "$STAMP_FILE"
fi

log 'verificando dependências do HazzScreenS...'
if ! pkg install -y python git; then
    warn 'Python ou Git não pôde ser instalado automaticamente.'
fi

# android-tools é usado somente para ADB; se falhar, o scanner continua funcionando com bugreports.
if ! command -v adb >/dev/null 2>&1; then
    if ! pkg install -y android-tools; then
        warn 'android-tools não pôde ser instalado; a coleta ADB ao vivo ficará indisponível.'
    fi
fi

if ! command -v python >/dev/null 2>&1 && ! command -v python3 >/dev/null 2>&1; then
    warn 'Python não está disponível no PATH.'
    exit 1
fi

exit 0
