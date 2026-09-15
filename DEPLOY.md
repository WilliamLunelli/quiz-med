# Deploy — Vercel (front + back) + Neon (Postgres)

Guia para subir o projeto. São **três** peças: banco no Neon, backend na Vercel
e frontend na Vercel. O repositório já está preparado; aqui você faz os cliques
e cola as variáveis.

Ao final você terá:

- API em algo como `https://quiz-med-back.vercel.app`
- App em algo como `https://quiz-med-front.vercel.app`
- QR codes gerados pelo app já apontando para a URL de produção.

---

## 1. Banco de dados no Neon

1. Crie conta em <https://neon.tech> e um **projeto**. Região: **AWS South
   America East 1 (São Paulo)** — a mais perto do Brasil. Deixe **Neon Auth
   desligado** (não usamos). O plano free basta.
2. No painel do projeto, abra **Connection Details**. Você precisa de **duas**
   strings de conexão:
   - **Pooled** (o host tem `-pooler` no nome) → será o `DATABASE_URL`.
   - **Direct / unpooled** (desmarque "Pooled connection") → será o `DIRECT_URL`.
3. Copie as duas. Elas já vêm com `?sslmode=require`. Guarde para os próximos
   passos. Exemplo do formato:

   ```
   DATABASE_URL = postgresql://user:senha@ep-xxx-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
   DIRECT_URL   = postgresql://user:senha@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

---

## 2. Criar as tabelas no Neon (roda do seu PC, uma vez)

No terminal, dentro de `back/`, rode as migrações **apontando para o Neon**
(troque pelas suas strings). Isso usa a conexão direta:

```bash
cd back
DATABASE_URL="<pooled>" DIRECT_URL="<direct>" npx prisma migrate deploy
```

(Opcional) criar o jogo de demonstração no Neon:

```bash
DATABASE_URL="<pooled>" DIRECT_URL="<direct>" npm run db:seed
```

O seed não é obrigatório: qualquer pessoa cria o próprio jogo pela tela inicial.

---

## 3. Backend na Vercel

1. Em <https://vercel.com> → **Add New… → Project** → importe o repositório
   `WilliamLunelli/quiz-med`.
2. Em **Root Directory**, clique em *Edit* e escolha **`back`**.
3. **Environment Variables** (todas em Production):
   - `DATABASE_URL` = string **pooled** do Neon
   - `DIRECT_URL` = string **direct** do Neon
   - `NODE_ENV` = `production`
   - `RATE_LIMIT_ENABLED` = `false` (mantém desligado no teste da faculdade)
4. **Deploy**. Ao terminar, copie a URL do backend (ex.:
   `https://quiz-med-back.vercel.app`).
5. Teste: abra `<URL-do-backend>/health` — deve responder `{"status":"ok",...}`.

> O `back/vercel.json` já faz o Express rodar como função serverless, manda
> todas as rotas para ele, e fixa a região em **São Paulo (`gru1`)** para ficar
> perto do banco no Neon. O `prisma generate` roda sozinho no build.
>
> Se a Vercel reclamar da região no plano free, remova a linha `"regions"` do
> `back/vercel.json` — o backend roda nos EUA e funciona igual, só um pouco mais
> lento por consulta.

---

## 4. Frontend na Vercel

1. **Add New… → Project** → importe **o mesmo repositório** de novo (será um
   segundo projeto na Vercel).
2. Em **Root Directory**, escolha **`front`**. A Vercel detecta Vite sozinha.
3. **Environment Variable** (Production):
   - `VITE_API_URL` = a URL do backend do passo 3 (sem barra no fim), ex.:
     `https://quiz-med-back.vercel.app`
4. **Deploy**. Copie a URL do app (ex.: `https://quiz-med-front.vercel.app`).

---

## 5. Testar de ponta a ponta

1. Abra a URL do app. Deve aparecer a tela **Criar jogo**.
2. Monte um jogo e clique em **Gerar QR code**.
3. O QR e o link apontam para `<URL-do-app>/?game=<id>`. Escaneie com o celular
   e jogue.

Se a primeira ação depois de um tempo parado demorar 1–2 s, é o Neon/Vercel
"acordando". Depois flui normal. Para a apresentação, abra o app um pouco antes
para aquecer.

---

## Variáveis de ambiente (resumo)

| Onde              | Variável             | Valor                                  |
| ----------------- | -------------------- | -------------------------------------- |
| Backend (Vercel)  | `DATABASE_URL`       | Neon **pooled**                        |
| Backend (Vercel)  | `DIRECT_URL`         | Neon **direct**                        |
| Backend (Vercel)  | `NODE_ENV`           | `production`                           |
| Backend (Vercel)  | `RATE_LIMIT_ENABLED` | `false`                                |
| Frontend (Vercel) | `VITE_API_URL`       | URL do backend (sem barra no fim)      |

---

## Notas

- **Migrações novas:** ao mudar o schema, gere a migração local
  (`npm run prisma:migrate`) e depois aplique no Neon com
  `DATABASE_URL=... DIRECT_URL=... npx prisma migrate deploy`. A Vercel **não**
  roda migração no deploy.
- **CORS** está liberado no backend, então o app (outra origem) chama a API sem
  problema. Se quiser restringir depois, trave no `back/src/app.ts`.
- **Rate limit** fica desligado (in-memory não serve para serverless de qualquer
  forma). Se um dia ligar em produção, use um store compartilhado (ex.: Redis).
- **Redeploy automático:** cada push na branch `main` redeploya os dois projetos
  da Vercel.
