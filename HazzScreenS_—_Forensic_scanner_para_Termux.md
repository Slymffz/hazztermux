# HazzScreenS — Forensic scanner para Termux

O HazzScreenS é um scanner Python para Termux que analisa bugreports Android em formato `.zip` ou `.txt`, procura os packages Proxy catalogados, destaca registros de remoção e instalação e incorpora automaticamente evidências técnicas de ADB, USB e depuração Wi‑Fi quando elas aparecem na bugreport ou quando existe um dispositivo ADB conectado.

> O scanner é uma ferramenta de triagem. Um package, uma porta ADB, um pareamento ou uma linha isolada de log não prova, sozinho, acesso indevido, trapaça ou participação em uma partida. O resultado deve ser revisado com contexto.

## Instalação pelo GitHub

Depois de publicar este diretório em um repositório GitHub, execute no Termux:

```sh
pkg install -y curl git
export HAZZSCREENS_REPO_URL="https://github.com/SEU_USUARIO/HazzScreenS.git"
bash -c "$(curl -fsSL \"$HAZZSCREENS_REPO_URL/raw/main/install.sh\")"
```

Como alternativa, para evitar executar um script remoto diretamente, clone primeiro e rode o instalador localmente:

```sh
git clone https://github.com/SEU_USUARIO/HazzScreenS.git ~/HazzScreenS
cd ~/HazzScreenS
bash install.sh
```

A segunda forma é a mais transparente para inspeção. O instalador usa `git pull --ff-only` quando a pasta já é um clone e não sobrescreve alterações locais.

## Execução

Após a instalação, use:

```sh
hazzscreens
```

O comando abre o menu interativo. Também é possível executar diretamente:

```sh
hazzscreens analisar
hazzscreens analisar /caminho/para/bugreport.zip
hazzscreens gerar
hazzscreens start
hazzscreens pareamento
```

As bugreports podem ser colocadas em `~/storage/shared/Download`. Na primeira execução, o preparador tenta solicitar a permissão de armazenamento compartilhado por meio de `termux-setup-storage`.

## Atualização

Para atualizar o código do GitHub e verificar dependências:

```sh
hazzscreens-update
```

O lançador também verifica o ambiente antes de cada execução. Para evitar que `pkg update` e `pkg upgrade` sejam executados repetidamente, a atualização completa do Termux é limitada a uma vez por 24 horas. Para pular temporariamente essa etapa:

```sh
HAZZ_SKIP_TERMUX_UPDATE=1 hazzscreens
```

Para pular somente o upgrade de pacotes:

```sh
HAZZ_SKIP_TERMUX_UPGRADE=1 hazzscreens
```

## Dependências e permissões

O instalador tenta configurar `python`, `git` e `android-tools`. O armazenamento compartilhado é solicitado somente quando o atalho `~/storage/shared` ainda não existe. O HazzScreenS não precisa de root para analisar arquivos acessíveis ou usar ADB por depuração Wi‑Fi.

O Termux não pode conceder silenciosamente permissões protegidas do Android. A autorização de armazenamento pode abrir uma confirmação do sistema, e o pareamento ADB por Wi‑Fi continua exigindo que o usuário confirme o código nas opções de desenvolvedor. O instalador não tenta contornar essas confirmações.

A coleta ADB ao vivo exige que o aparelho esteja pareado/conectado e autorizado. Se isso não ocorrer, a análise da bugreport continua e o scanner registra um aviso.

## Estrutura

| Arquivo | Função |
|---|---|
| `bugreport_scanner_termux.py` | Scanner principal de bugreports, Proxys e evidências ADB/USB. |
| `hazzscreens` | Lançador que prepara o Termux e executa o scanner. |
| `install.sh` | Clone inicial, instalação de dependências e criação dos comandos. |
| `scripts/prepare_termux.sh` | Solicitação de armazenamento e verificação controlada de pacotes. |
| `scripts/update.sh` | Atualização segura do clone com fast-forward. |

## Publicação do repositório

No computador onde o repositório será publicado, ajuste a URL do `README.md`, inicialize o Git e envie os arquivos:

```sh
git init
git add .
git commit -m "Inicializa HazzScreenS para Termux"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/HazzScreenS.git
git push -u origin main
```

Substitua `SEU_USUARIO` pelo seu usuário real do GitHub antes de publicar. Nunca coloque tokens, senhas, dumps pessoais ou bugreports reais no repositório.
