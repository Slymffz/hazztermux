#!/data/data/com.termux/files/usr/bin/bash
set -u

REPO_URL="${HAZZSCREENS_REPO_URL:-https://github.com/slymffz/hazztermux.git}"
INSTALL_DIR="${HAZZSCREENS_DIR:-$HOME/hazztermux}"

say() {
    printf '[HazzScreenS] %s\n' "$*"
}

fail() {
    printf '[HazzScreenS] ERRO: %s\n' "$*" >&2
    exit 1
}

if ! command -v pkg >/dev/null 2>&1; then
    fail 'execute este instalador dentro do Termux.'
fi

if [ "$REPO_URL" = "https://github.com/slymffz/hazztermux.git" ]; then
    fail 'defina HAZZSCREENS_REPO_URL com a URL real do seu repositório GitHub.'
fi

if ! command -v git >/dev/null 2>&1; then
    say 'Git não encontrado; instalando...'
    pkg update -y || true
    pkg install -y git || fail 'não foi possível instalar o Git.'
fi

if [ -e "$INSTALL_DIR" ] && [ ! -d "$INSTALL_DIR/.git" ]; then
    fail "$INSTALL_DIR já existe e não é um clone Git; escolha outro HAZZSCREENS_DIR para não sobrescrever arquivos."
fi

if [ -d "$INSTALL_DIR/.git" ]; then
    say 'atualizando o clone existente...'
    git -C "$INSTALL_DIR" pull --ff-only || fail 'atualização interrompida; não fiz merge forçado nem sobrescrevi alterações locais.'
else
    say 'clonando o repositório...'
    git clone "$REPO_URL" "$INSTALL_DIR" || fail 'não foi possível clonar o repositório.'
fi

chmod +x "$INSTALL_DIR/hazzscreens" "$INSTALL_DIR/scripts/prepare_termux.sh" "$INSTALL_DIR/scripts/update.sh" 2>/dev/null || true

HAZZ_SKIP_TERMUX_UPDATE=0 bash "$INSTALL_DIR/scripts/prepare_termux.sh" || fail 'a preparação do Termux não foi concluída.'

if [ -n "${PREFIX:-}" ]; then
    ln -sf "$INSTALL_DIR/hazzscreens" "$PREFIX/bin/hazzscreens"
    ln -sf "$INSTALL_DIR/scripts/update.sh" "$PREFIX/bin/hazzscreens-update"
    say 'comandos instalados: hazzscreens e hazzscreens-update'
else
    say "adicione manualmente $INSTALL_DIR ao PATH ou execute $INSTALL_DIR/hazzscreens."
fi

say 'instalação concluída.'
say 'execute: hazzscreens'
