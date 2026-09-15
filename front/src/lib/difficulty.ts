import type { Difficulty } from '../api/types';

export interface LevelMeta {
  key: Difficulty;
  /** Rótulo mostrado ao participante. */
  label: string;
  /** Pontuação cheia (acerto sem dica). Metade se usar dica; 0 se errar. */
  fullPoints: number;
  /** Classe visual da tag (design system broadsheet). */
  tagClass: string;
  /** Texto curto do card de seleção de nível. */
  note: string;
}

export const LEVELS: Record<Difficulty, LevelMeta> = {
  facil: {
    key: 'facil',
    label: 'Fácil',
    fullPoints: 10,
    tagClass: 'tag tag-accent',
    note: '10 afirmações · 10 pts cada',
  },
  media: {
    key: 'media',
    label: 'Médio',
    fullPoints: 20,
    tagClass: 'tag tag-outline',
    note: '10 afirmações · 20 pts cada',
  },
  dificil: {
    key: 'dificil',
    label: 'Difícil',
    fullPoints: 30,
    tagClass: 'tag tag-accent-2',
    note: '10 afirmações · 30 pts cada',
  },
  mista: {
    key: 'mista',
    label: 'Misto',
    fullPoints: 20,
    tagClass: 'tag tag-neutral',
    note: 'conjunto misto · 20 pts cada',
  },
};

export const LEVEL_ORDER: Difficulty[] = ['facil', 'media', 'dificil', 'mista'];

export const halfPoints = (full: number) => Math.floor(full / 2);
