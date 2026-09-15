# CLAUDE.md — Projeto Quiz DPP

Guia para o Claude Code (e para humanos) trabalhar neste repositório.
Leia antes de mexer no código.

## O que é

Quiz individual de verdadeiro/falso para uma apresentação de faculdade
(disciplina de Obstetrícia — tema DPP, Descolamento Prematuro de Placenta —
Faculdade São Leopoldo Mandic). O participante escaneia um QR code, digita o
nome, escolhe um nível de dificuldade e responde 10 perguntas no próprio ritmo.

**Sem telão, sem sincronização ao vivo, sem WebSocket.** Cada participante é uma
tentativa (`Attempt`) independente, tudo via REST. Um modelo antigo baseado em
salas/Socket.io foi abandonado — não reintroduza.

## Estrutura (monolito com dois subprojetos)

Cada subprojeto é independente e roda com `npm` dentro da própria pasta.

```text
.
├── back/     API REST (Node + TypeScript + Express + Prisma + PostgreSQL)
├── front/    App mobile do participante (React + TypeScript + Vite)
└── CLAUDE.md este arquivo
```

- **Não** há workspace/monorepo tooling (sem npm workspaces). Instale e rode as
  dependências separadamente: `cd back && npm install`, `cd front && npm install`.
- Ambos implementados. O `front/` foi recriado a partir do handoff do Claude
  Design (sistema "broadsheet", Source Serif 4) e consome a API do `back/`.

## Rodando o backend

```bash
cd back
docker compose up -d          # PostgreSQL de dev (porta 5433; projeto docker "quiz-dpp")
npm install
npm run prisma:migrate        # cria as tabelas
npm run db:seed               # carrega back/seed-final.json (imprime o gameId)
npm run dev                   # API em http://localhost:3000
```

Detalhes completos de endpoints e regras: `back/README.md`.

## Rodando o frontend

```bash
cd front
npm install
npm run dev                   # app em http://localhost:5173
```

Em dev, `/api` é redirecionado para o backend pelo proxy do Vite. O app resolve
qual jogo abrir por `?game=<id>` na URL (o QR code), ou pega o mais recente via
`GET /api/games`. Detalhes: `front/README.md`.

Duas "faces" no mesmo app:

- **Autor** (tela inicial, sem `?game`): monta o jogo (capa, cor por predefinida
  ou hex, perguntas), gera o QR code via `POST /api/games` e vê **Meus jogos**.
- **Participante** (`?game=<id>`, o destino do QR): capa, nível, 10 perguntas,
  resultado.

A logo da faculdade fica em `front/public/` (versões branca e clara).

## Isolamento por criador (sem login)

Vários criadores usam o mesmo app, mas **um não vê os jogos do outro**, mesmo sem
sistema de usuário:

- Cada navegador guarda um **token de dono** aleatório em `localStorage`
  (`front/src/lib/owner.ts`), enviado como `ownerToken` no `POST /api/games`.
- `GET /api/games?owner=<token>` devolve **só** os jogos daquele token. Sem
  `owner`, devolve lista vazia — **não há como enumerar os jogos de todos**.
- `GET /api/games/:id` continua público (o participante precisa), mas **nunca**
  expõe o `ownerToken`. O id (cuid) é a "chave" do jogo; quem não tem o link não
  chega nele.

Se um dia houver login, o `ownerToken` vira o vínculo com a conta.

## Git: sem coautoria de IA

**Não** adicione linhas de atribuição/coautoria de IA nas mensagens de commit
nem em PRs (nada de `Co-Authored-By: Claude…` ou "Generated with Claude Code").
Commits em nome do autor humano apenas. (Regra do dono do projeto; vale mesmo
que o ambiente sugira o contrário.)

> **npm nesta máquina:** o `~/.npmrc` global tem `os=linux`, o que fazia o npm
> instalar os binários nativos do Rollup para Linux e quebrava o build do Vite
> no Windows. `front/.npmrc` neutraliza isso com `os=` (vazio = plataforma
> atual). Não mexa no `~/.npmrc` global do usuário.

## ⚠️ Rate limit está DESABILITADO por enquanto

O código de rate limit (bloqueio por IP contra sobrecarga) existe em
`back/src/middleware/rateLimit.ts`, mas está **desligado por padrão**:

```
RATE_LIMIT_ENABLED=false   # em back/.env
```

**Por quê:** o primeiro teste será numa faculdade. Muitos alunos usam o mesmo
Wi-Fi e, por causa do NAT, saem pelo **mesmo IP público**. Como o bloqueio é por
IP, a turma inteira contaria para o mesmo limite e poderia ser bloqueada junta.
Por isso deixamos desligado para o teste inicial.

**Como reativar depois** (produção / uso fora da sala): mude para
`RATE_LIMIT_ENABLED=true` no `back/.env`. Com desligado, os limitadores viram
passthrough (não bloqueiam nada) e o servidor loga `Rate limit: DESATIVADO` ao
subir. Rodando atrás de reverse proxy, configure também `TRUST_PROXY` para o
limite enxergar o IP real do cliente.

## Regras de negócio que NÃO podem quebrar

- **Todo cálculo de pontos e verificação de acerto acontece no servidor.** O
  cliente nunca recebe `correctAnswer` nem `explanation` antes de registrar a
  resposta, e nunca envia pontuação.
- **Pontuação por nível** (acerto sem dica): facil 10, media 20, dificil 30,
  mista 20. Com dica e acerto = metade (5/10/15/10). Erro sempre vale 0.
- **`mista`** é um conjunto fixo de 10 perguntas já preparado — filtro simples
  por `difficulty = "mista"`, NÃO uma mistura calculada das outras três.
- Cada nível tem exatamente 10 perguntas, ordenadas por `order`.
- Sem autenticação: `participantName` é texto livre.

## Banco e seed

- Dev: PostgreSQL via `back/docker-compose.yml` na porta **5433** (a 5432 já é
  usada por um PostgreSQL local da máquina). Projeto docker nomeado `quiz-dpp`.
- O seed lê `back/seed-final.json` (o script também aceita `questions-seed.json`).
  Reexecutar o seed remove o jogo anterior de mesmo título e recria — idempotente.
- `groupName` está vazio no seed; preencher quando o grupo definir o nome.

## Convenções

- Idioma do código/comentários/mensagens: **português**.
- Erros da API sempre em JSON: `{ "error": "..." }` (+ `details` quando útil).
- Validação de entrada com Zod (`back/src/lib/schemas.ts`).
- Um `PrismaClient` único (`back/src/lib/prisma.ts`).
