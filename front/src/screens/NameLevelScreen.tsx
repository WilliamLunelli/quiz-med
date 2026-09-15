import type { Difficulty, Game } from '../api/types';
import { LEVELS, LEVEL_ORDER } from '../lib/difficulty';

interface Props {
  game: Game;
  name: string;
  onNameChange: (v: string) => void;
  difficulty: Difficulty | null;
  onPickDifficulty: (d: Difficulty) => void;
  onStart: () => void;
  busy: boolean;
  error: string | null;
}

export function NameLevelScreen({
  game,
  name,
  onNameChange,
  difficulty,
  onPickDifficulty,
  onStart,
  busy,
  error,
}: Props) {
  const available = LEVEL_ORDER.filter((d) => (game.questionCounts[d] ?? 0) > 0);
  const canStart = name.trim().length > 0 && difficulty !== null && !busy;

  return (
    <div className="screen">
      <div className="screen-inner screen-inner--wide">
        <div className="kicker" style={{ color: 'var(--cyan)' }}>
          {game.subjectTitle}
        </div>
        <h2 style={{ margin: '14px 0 0', font: '600 clamp(28px, 4vw, 34px)/1.1 var(--font)', color: 'var(--q-navy)', letterSpacing: '-.02em' }}>
          Como a gente te chama?
        </h2>

        <div style={{ marginTop: 20, maxWidth: 520 }}>
          <input
            className="name-input"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="seu nome"
            maxLength={60}
            autoComplete="off"
            autoCapitalize="words"
            aria-label="Seu nome"
          />
        </div>

        <div className="kicker kicker--muted" style={{ marginTop: 34, color: 'var(--ink-55)' }}>
          Escolha o conjunto
        </div>

        <div className="levels-grid">
          {available.map((d) => {
            const meta = LEVELS[d];
            const selected = difficulty === d;
            return (
              <button
                key={d}
                onClick={() => onPickDifficulty(d)}
                className={selected ? 'qbtn qbtn--navy' : 'qbtn qbtn--white'}
                style={{
                  height: 118,
                  padding: 14,
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  borderWidth: selected ? 0 : 1,
                  borderStyle: 'solid',
                  borderColor: 'rgba(22,32,82,.22)',
                }}
                aria-pressed={selected}
              >
                <span style={{ font: '600 20px/1.1 var(--font)', color: selected ? '#fff' : 'var(--q-navy)' }}>
                  {meta.label}
                </span>
                <span
                  style={{
                    font: '400 12.5px/1.35 var(--font)',
                    color: selected ? 'rgba(255,255,255,.78)' : 'var(--ink-60)',
                  }}
                >
                  {meta.note}
                </span>
                {selected && (
                  <span style={{ marginTop: 'auto', font: '400 11.5px/1 var(--font)', color: 'var(--yellow)' }}>
                    selecionado
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="stack-bottom" style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 24 }}>
          {error && <div style={{ font: '400 13px/1.4 var(--font)', color: 'var(--red)' }}>{error}</div>}
          <div style={{ font: 'italic 400 13px/1.4 var(--font)', color: 'var(--ink-55)' }}>
            Cada conjunto tem 10 afirmações fixas. Algumas trazem dica.
          </div>
          <button
            className="qbtn qbtn--navy"
            style={{ height: 64, font: '600 19px/1 var(--font)', maxWidth: 520 }}
            disabled={!canStart}
            onClick={onStart}
          >
            {busy ? 'Preparando…' : 'Bora jogar'}
          </button>
        </div>
      </div>
    </div>
  );
}
