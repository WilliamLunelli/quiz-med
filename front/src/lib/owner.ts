/**
 * Identidade do criador, guardada no navegador (sem login).
 * É um token aleatório e secreto: o backend só lista os jogos deste token,
 * então um criador nunca vê os jogos de outro. Trocar de navegador/dispositivo
 * = outra identidade (e outros jogos).
 */
const OWNER_KEY = 'quizdpp.owner';

let cached: string | null = null;

function newToken(): string {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  } catch {
    /* ignora */
  }
  return `own-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function getOwnerToken(): string {
  if (cached) return cached;
  try {
    let t = localStorage.getItem(OWNER_KEY);
    if (!t) {
      t = newToken();
      localStorage.setItem(OWNER_KEY, t);
    }
    cached = t;
    return t;
  } catch {
    // localStorage indisponível (aba privada, etc.): usa um token de sessão.
    cached = newToken();
    return cached;
  }
}
