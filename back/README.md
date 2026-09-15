# Quiz DPP — Backend

Backend REST de um quiz individual de verdadeiro/falso, usado numa apresentação
da disciplina de Obstetrícia (Faculdade São Leopoldo Mandic). Cada participante
escaneia um QR code, digita o nome, escolhe um nível e responde 10 perguntas no
próprio ritmo. Sem telão, sem WebSocket, sem sincronização ao vivo — cada
participante é uma tentativa (`Attempt`) independente.

## Stack

- Node.js + TypeScript
- Express
- Prisma + PostgreSQL
- Validação com Zod

## Estrutura

```text
prisma/
  schema.prisma        modelos Game, Question, Attempt, AttemptAnswer
  seed.ts              popula o banco a partir de seed-final.json
  migrations/          migração inicial
src/
  server.ts            sobe o servidor HTTP
  app.ts               monta o Express (CORS, JSON, rotas, erros)
  config/quiz.ts       níveis, tabela de pontos e cálculo de pontuação
  lib/                 prisma client, erros, schemas Zod, helpers
  middleware/          tratamento central de erros
  routes/
    games.ts           /api/games
    attempts.ts        /api/attempts
docker-compose.yml     PostgreSQL de desenvolvimento (porta 5433)
seed-final.json        jogo + 40 perguntas (10 por nível)
```

## Como rodar

### 1. Banco de dados

O `docker-compose.yml` já sobe um PostgreSQL 16 na porta **5433** (a 5432 já é
usada por outro PostgreSQL nesta máquina). O `.env` aponta para ele.

```bash
docker compose up -d
```

Prefere usar seu PostgreSQL local? Basta editar `DATABASE_URL` no `.env`
(veja `.env.example`).

### 2. Dependências

```bash
npm install
```

### 3. Migração + seed

```bash
npm run prisma:migrate     # cria as tabelas
npm run db:seed            # carrega seed-final.json
```

O seed imprime o `gameId` gerado — use-o na URL do QR code / frontend.

### 4. Servidor

```bash
npm run dev                # desenvolvimento (reload automático)
# ou
npm run build && npm start # produção
```

API em `http://localhost:3000`. Health check: `GET /health`.

## Regras de pontuação

Todo cálculo acontece **no servidor** — o cliente nunca envia pontos nem recebe
`correctAnswer` antes de registrar a resposta.

| Nível   | Acerto sem dica | Acerto com dica | Erro |
| ------- | --------------- | --------------- | ---- |
| facil   | 10              | 5               | 0    |
| media   | 20              | 10              | 0    |
| dificil | 30              | 15              | 0    |
| mista   | 20              | 10              | 0    |

`mista` é um **conjunto fixo** de 10 perguntas já preparado (não é mistura
calculada das outras três) — basta filtrar por `difficulty = "mista"`.

## Endpoints

### `POST /api/games`

Cria o jogo + perguntas. Resposta inclui o gabarito (lado autoria).

```json
{
  "title": "Diagnóstico e Conduta no DPP",
  "groupName": "Grupo A",
  "subjectTitle": "Obstetrícia",
  "coverPhotoUrl": null,
  "primaryColor": "#162052",
  "questions": [
    { "text": "...", "correctAnswer": true, "difficulty": "facil",
      "hint": "opcional", "explanation": "...", "order": 0 }
  ]
}
```

### `GET /api/games`

Lista os jogos (só metadados: id, título, matéria, grupo, data), do mais novo
ao mais antigo. Sem perguntas nem gabarito. Serve para o frontend descobrir qual
jogo abrir quando a URL não traz um id.

### `GET /api/games/:id`

Dados para a tela de capa + `questionCounts` por nível. Não devolve as perguntas.

### `GET /api/games/:id/questions?difficulty=facil`

As 10 perguntas do nível, ordenadas por `order`. **Não** expõe `correctAnswer`
nem `explanation`; a `hint` vem junto (revelada sob demanda pela UI).

### `POST /api/attempts`

Cria uma tentativa e já devolve as perguntas do nível (sem gabarito).

```json
{ "gameId": "...", "participantName": "Maria", "difficulty": "media" }
```

### `POST /api/attempts/:id/answers`

Registra uma resposta. O servidor calcula `isCorrect` e `pointsEarned`.

Requisição:

```json
{ "questionId": "...", "answerGiven": true, "usedHint": false }
```

Resposta (feedback imediato):

```json
{ "isCorrect": true, "pointsEarned": 20, "explanation": "...", "correctAnswer": true }
```

Erros tratados: responder duas vezes a mesma pergunta (`409`), pergunta de outro
nível/jogo (`400`), responder depois de concluída (`409`).

### `POST /api/attempts/:id/finish`

Conclui a tentativa (idempotente) e devolve o resumo:

```json
{
  "attempt": { "id": "...", "score": 120, "finishedAt": "..." },
  "summary": {
    "totalScore": 120, "totalQuestions": 10, "answeredCount": 10,
    "correctCount": 7, "wrongCount": 3, "hintsUsed": 2, "accuracy": 70,
    "correctByLevel": { "media": { "correct": 7, "answered": 10 } },
    "alreadyFinished": false
  }
}
```

## Rate limit (bloqueio por IP)

> **Estado atual: DESABILITADO** (`RATE_LIMIT_ENABLED=false`). O primeiro teste
> será numa faculdade, onde vários alunos saem pelo mesmo IP (NAT do Wi-Fi) e
> estourariam o limite juntos. Para reativar, defina `RATE_LIMIT_ENABLED=true`
> no `.env`. Enquanto desligado, os limitadores viram passthrough (nada é
> bloqueado) e o servidor loga `Rate limit: DESATIVADO` ao subir.

Quando ativado, para evitar sobrecarga/flood a API bloqueia por IP quando há
requisições demais:

- **Limite global** em toda a API: ao estourar, o IP recebe `429` até a janela
  reiniciar. Padrão: **300 requisições por minuto por IP**.
- **Limite estrito** só em `POST /api/games` (autoria, rara): padrão **20 por
  hora por IP**.
- `GET /health` fica **fora** do rate limit (monitoramento nunca é bloqueado).

A resposta `429` traz `{ "error": "Muitas requisições deste IP..." }` e os
cabeçalhos `RateLimit-*` informam o limite e quando reinicia.

Tudo é ajustável por env (`RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW_MS`,
`GAME_RATE_LIMIT_MAX`, `GAME_RATE_LIMIT_WINDOW_MS` — veja `.env.example`).

> **Atenção — Wi-Fi da sala:** o bloqueio é por IP. Se muitos alunos usam a mesma
> rede, eles compartilham o mesmo IP público (NAT) e contam para o mesmo limite.
> Por isso o padrão global é generoso (300/min). Numa turma grande, aumente
> `RATE_LIMIT_MAX`. Rodando atrás de reverse proxy (nginx, Railway, Render...),
> defina `TRUST_PROXY` para o rate limit enxergar o IP real do cliente.

## Notas

- O arquivo de seed fornecido chama-se `seed-final.json`. O script também aceita
  `questions-seed.json` (nome citado no enunciado) se existir.
- Sem autenticação: `participantName` é texto livre.
- CORS liberado — o frontend mobile roda em outra origem.
