#!/data/data/com.termux/files/usr/bin/bash
set -u

INSTALL_DIR="${HAZZSCREENS_DIR:-$HOME/HazzScreenS}"
REPO_BASE="${1:-https://github.com/Slymffz/hazztermux}"
REPO_FILE="$INSTALL_DIR/.repo_url"

say() {
    printf '[HazzScreenS] %s\n' "$*"
}

warn() {
    printf '[HazzScreenS] AVISO: %s\n' "$*" >&2
}

fail() {
    printf '[HazzScreenS] ERRO: %s\n' "$*" >&2
    exit 1
}

if ! command -v pkg >/dev/null 2>&1; then
    fail 'execute este instalador dentro do Termux.'
fi

if [ -z "$REPO_BASE" ] && [ -f "$REPO_FILE" ]; then
    REPO_BASE=$(head -n 1 "$REPO_FILE")
fi

REPO_BASE="${REPO_BASE%.git}"
REPO_BASE="${REPO_BASE%/}"
ZIP_URL="$REPO_BASE/archive/refs/heads/main.zip"

say 'atualizando o Termux...'
pkg update -y || warn 'pkg update falhou; continuando.'
pkg upgrade -y || warn 'pkg upgrade falhou; continuando.'
pkg install -y curl unzip python || fail 'não foi possível instalar curl, unzip e Python.'
pkg install -y android-tools || warn 'android-tools não foi instalado; a coleta ADB ao vivo ficará indisponível.'

if command -v termux-setup-storage >/dev/null 2>&1 && [ ! -d "$HOME/storage/shared" ]; then
    say 'solicitando acesso ao armazenamento compartilhado...'
    termux-setup-storage || warn 'permissão de armazenamento não confirmada.'
fi

TMP_DIR=$(mktemp -d 2>/dev/null || printf '%s/hazzscreens-install-%s' "${TMPDIR:-$HOME}" "$$")
cleanup() {
    rm -rf "$TMP_DIR"
}
trap cleanup EXIT

say 'baixando a versão do GitHub...'
curl -fL --retry 2 --connect-timeout 15 "$ZIP_URL" -o "$TMP_DIR/hazzscreens.zip" || fail 'não foi possível baixar o ZIP. Confira a URL e se o repositório é público.'
unzip -q "$TMP_DIR/hazzscreens.zip" -d "$TMP_DIR/unpacked" || fail 'o ZIP do GitHub está inválido.'

SOURCE_DIR=$(find "$TMP_DIR/unpacked" -mindepth 1 -maxdepth 1 -type d -print -quit)
[ -n "$SOURCE_DIR" ] || fail 'a raiz do projeto não foi encontrada no ZIP.'
[ -f "$SOURCE_DIR/bugreport_scanner_termux.py" ] || fail 'o ZIP não contém o scanner principal.'

mkdir -p "$INSTALL_DIR/scripts"
cp "$SOURCE_DIR/bugreport_scanner_termux.py" "$INSTALL_DIR/bugreport_scanner_termux.py"
cp "$SOURCE_DIR/hazzscreens" "$INSTALL_DIR/hazzscreens"
cp "$SOURCE_DIR/install_simple.sh" "$INSTALL_DIR/install_simple.sh"
cp "$SOURCE_DIR/scripts/prepare_termux.sh" "$INSTALL_DIR/scripts/prepare_termux.sh"
cp "$SOURCE_DIR/scripts/update.sh" "$INSTALL_DIR/scripts/update.sh" 2>/dev/null || true
printf '%s\n' "$REPO_BASE" > "$REPO_FILE"

chmod +x "$INSTALL_DIR/hazzscreens" "$INSTALL_DIR/install_simple.sh" "$INSTALL_DIR/scripts/prepare_termux.sh" "$INSTALL_DIR/scripts/update.sh" 2>/dev/null || true

if [ -n "${PREFIX:-}" ]; then
    ln -sf "$INSTALL_DIR/hazzscreens" "$PREFIX/bin/hazzscreens"
    ln -sf "$INSTALL_DIR/install_simple.sh" "$PREFIX/bin/hazzscreens-update"
fi

say 'instalação concluída.'
say 'execute agora: hazzscreens'
say 'na primeira execução, informe a key HazzScreenS recebida na compra.'
say 'para trocar uma key no futuro: hazzscreens trocar-key'
say 'para atualizar depois: hazzscreens-update'
