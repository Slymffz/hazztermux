#!/data/data/com.termux/files/usr/bin/bash
set -u

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
INSTALL_DIR="$(dirname "$SCRIPT_DIR")"

say() {
    printf '[HazzScreenS] %s\n' "$*"
}

if [ ! -d "$INSTALL_DIR/.git" ]; then
    printf '[HazzScreenS] ERRO: instalação Git não encontrada em %s\n' "$INSTALL_DIR" >&2
    exit 1
fi

say 'verificando atualizações do GitHub...'
git -C "$INSTALL_DIR" fetch --prune || {
    printf '[HazzScreenS] ERRO: não foi possível acessar o GitHub.\n' >&2
    exit 1
}

LOCAL=$(git -C "$INSTALL_DIR" rev-parse HEAD)
REMOTE=$(git -C "$INSTALL_DIR" rev-parse '@{u}' 2>/dev/null || printf '%s' "$LOCAL")

if [ "$LOCAL" = "$REMOTE" ]; then
    say 'scanner já está atualizado.'
else
    git -C "$INSTALL_DIR" diff --quiet || {
        printf '[HazzScreenS] ERRO: existem alterações locais; atualização cancelada para não sobrescrever seu trabalho.\n' >&2
        exit 1
    }
    git -C "$INSTALL_DIR" pull --ff-only || {
        printf '[HazzScreenS] ERRO: atualização não fast-forward; nenhum merge automático foi feito.\n' >&2
        exit 1
    }
    say 'scanner atualizado com sucesso.'
fi

bash "$INSTALL_DIR/scripts/prepare_termux.sh"
chmod +x "$INSTALL_DIR/hazzscreens" "$INSTALL_DIR/scripts/prepare_termux.sh" "$INSTALL_DIR/scripts/update.sh" 2>/dev/null || true
say 'dependências verificadas.'
