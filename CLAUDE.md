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

- **Participante** (padrão / `?game=<id>`): capa, nível, 10 perguntas, resultado.
- **Autor** (`?criar`): monta o jogo (capa, cor por predefinida ou hex,
  perguntas) e gera o QR code via `POST /api/games`.

A logo da faculdade fica em `front/public/` (versões branca e clara).

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
