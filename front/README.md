# Quiz DPP — Frontend

App mobile do participante: a tela que abre ao escanear o QR code. Capa, escolha
de nível, 10 afirmações de verdadeiro/falso com dica e feedback imediato, e o
resultado final com revisão das fundamentações. Consome a API REST do backend
(pasta `../back`).

Recriado a partir do handoff de design do Claude Design (sistema "broadsheet",
Source Serif 4, cor institucional `#162052`).

## Stack

- React 18 + TypeScript
- Vite

## Como rodar

Suba o backend antes (veja `../back/README.md`), depois:

```bash
cd front
npm install
npm run dev        # http://localhost:5173
```

Em dev, chamadas a `/api` são redirecionadas para `http://localhost:3000`
(proxy do Vite, em `vite.config.ts`) — não precisa mexer em CORS.

Build de produção:

```bash
npm run build      # gera dist/
npm run preview     # serve o build localmente
```

## Criar um jogo (autor)

Abra `http://localhost:5173/?criar` (ou `?create`). É a tela do autor:

- Capa: título da matéria, título do trabalho, nome do grupo.
- **Cor da capa**: cinco cores predefinidas, um seletor nativo, e um campo
  hexadecimal (aceita `#RGB` ou `#RRGGBB`). A tela inteira reflete a cor
  escolhida em tempo real.
- Foto do grupo: opcional, informada por URL (o backend guarda a URL).
- Perguntas: adiciona/edita/remove cada uma com afirmação, resposta correta,
  nível (fácil/médio/difícil/misto), dica opcional e fundamentação.
- **Gerar QR code**: cria o jogo via `POST /api/games` e mostra o QR code +
  o link `?game=<id>` para os participantes escanearem.

A logo da faculdade (São Leopoldo Mandic) fica em `public/` e aparece na capa
e na tela de criação, como no design.

## Qual jogo o app abre

Resolvido nesta ordem (`src/App.tsx`):

1. `?game=<id>` na URL — **é assim que o QR code aponta para um jogo específico**.
2. `VITE_DEFAULT_GAME_ID` no `.env`, se definido.
3. Senão, busca o jogo mais recente em `GET /api/games`.

Para o QR code, gere uma URL como `https://SEU_APP/?game=<gameId>` (o `gameId`
aparece no log do seed do backend).

## Configuração (`.env`)

| Variável               | Efeito                                                        |
| ---------------------- | ------------------------------------------------------------ |
| `VITE_API_URL`         | Base da API. Vazio = usa o proxy `/api` do Vite (dev).       |
| `VITE_DEFAULT_GAME_ID` | Jogo padrão quando a URL não traz `?game=`.                  |

Em produção, aponte `VITE_API_URL` para a URL pública da API.

## Estrutura

```text
src/
  main.tsx              ponto de entrada
  App.tsx               máquina de estados do fluxo + chamadas à API
  index.css             tokens do design + classes de componente
  api/
    client.ts           wrapper de fetch da API
    types.ts            tipos das respostas
  lib/
    difficulty.ts       níveis: rótulo, pontos, tag, nota
  screens/
    CoverScreen.tsx      capa
    NameLevelScreen.tsx  nome + escolha de nível
    QuestionScreen.tsx   pergunta (com/sem dica)
    FeedbackScreen.tsx   feedback imediato (acerto/erro)
    ResultScreen.tsx     resultado final
    ReviewScreen.tsx     revisão das fundamentações
    CenterMessage.tsx    carregando / erro
```

## Fluxo e integração

1. `GET /api/games/:id` — dados da capa.
2. `POST /api/attempts` — cria a tentativa e recebe as 10 perguntas (sem gabarito).
3. `POST /api/attempts/:id/answers` — a cada resposta; o **servidor** decide
   acerto e pontos e devolve a fundamentação.
4. `POST /api/attempts/:id/finish` — resumo final (pontos, acertos, dicas).

O gabarito e a fundamentação nunca chegam ao app antes de a resposta ser enviada.

## Observação sobre `npm install` nesta máquina

Existe um `.npmrc` neste diretório com `os=` (vazio). Ele neutraliza um
`os=linux` no `~/.npmrc` global da máquina, que fazia o npm baixar os binários
nativos do Rollup para Linux e quebrava o build do Vite no Windows. Vazio = usa
a plataforma atual. Se for publicar o build a partir de um ambiente Linux, esse
arquivo não atrapalha.
