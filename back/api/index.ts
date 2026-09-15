import 'dotenv/config';
import { createApp } from '../src/app';

/**
 * Ponto de entrada para a Vercel (função serverless).
 * A Vercel serve o app Express diretamente; todas as rotas caem aqui via
 * vercel.json. Localmente continuamos usando `npm run dev` (src/server.ts),
 * que sobe um servidor HTTP normal — este arquivo é só para produção.
 */
export default createApp();
