# Quiz DPP

Quiz individual de verdadeiro/falso para uma apresentação de faculdade
(disciplina de Obstetrícia — tema DPP, Descolamento Prematuro de Placenta —
Faculdade São Leopoldo Mandic). Cada participante escaneia um QR code, digita
o nome, escolhe um nível de dificuldade e responde 10 perguntas no próprio
ritmo. Sem telão, sem sincronização ao vivo, sem WebSocket — cada participante
é uma tentativa independente, tudo via REST.

## Estrutura

Monolito com dois subprojetos independentes, cada um com seu próprio
`package.json` e rodando com `npm` na própria pasta.

```text
.
├── back/        API REST — Node + TypeScript + Express + Prisma + PostgreSQL
├── front/       App — React + TypeScript + Vite (participante e autor)
├── CLAUDE.md    guia de trabalho no repositório (convenções, regras, decisões)
└── DEPLOY.md    passo a passo de deploy (Vercel + Neon)
```

Duas "faces" no mesmo app do frontend:

- **Autor** (tela inicial): monta o jogo — capa, cor, perguntas — e gera o QR
  code. Vê só os próprios jogos ("Meus jogos"), isolados por um token de dono
  guardado no navegador, sem precisar de login.
- **Participante** (o que o QR abre, `?game=<id>`): capa, escolha de nível, 10
  perguntas com dica opcional e feedback imediato, resultado final com revisão
  das fundamentações.

## Como rodar

Backend:

```bash
cd back
docker compose up -d      # PostgreSQL de dev
npm install
npm run prisma:migrate
npm run db:seed           # opcional — jogo de exemplo
npm run dev               # API em http://localhost:3000
```

Frontend:

```bash
cd front
npm install
npm run dev                # app em http://localhost:5173
```

Detalhes de cada parte — endpoints, regras de pontuação, variáveis de
ambiente, estrutura de pastas — estão em `back/README.md` e `front/README.md`.
Como subir em produção (Vercel + Neon): `DEPLOY.md`.

## Regras de negócio principais

- Todo cálculo de pontos e verificação de acerto acontece **no servidor**; o
  cliente nunca recebe a resposta certa antes de responder.
- Pontuação por nível (acerto sem dica): fácil 10, médio 20, difícil 30, misto
  20. Com dica e acerto, metade. Errar sempre vale 0.
- Cada nível tem 10 perguntas fixas; "misto" é um conjunto próprio, não uma
  mistura calculada dos outros três.

Guia completo de convenções e decisões do projeto: `CLAUDE.md`.
