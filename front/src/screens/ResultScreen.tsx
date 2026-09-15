import { useMemo } from 'react';
import type { AnsweredRecord } from '../App';
import type { Difficulty, FinishSummary } from '../api/types';
import { LEVELS } from '../lib/difficulty';

interface Props {
  name: string;
  difficulty: Difficulty;
  summary: FinishSummary;
  record: AnsweredRecord[];
  pointsLeftOnTable: number;
  onReview: () => void;
  onPlayAgain: () => void;
}

interface Row {
  key: Difficulty;
  label: string;
  weight: string;
  correct: number;
  answered: number;
  hints: number;
  points: number;
}

export function ResultScreen({
  name,
  difficulty,
  summary,
  record,
  pointsLeftOnTable,
  onReview,
  onPlayAgain,
}: Props) {
  const rows = useMemo<Row[]>(() => {
    const map = new Map<Difficulty, Row>();
    for (const r of record) {
      const d = r.question.difficulty;
      const row =
        map.get(d) ??
        { key: d, label: LEVELS[d].label, weight: `${LEVELS[d].fullPoints} pts`, correct: 0, answered: 0, hints: 0, points: 0 };
      row.answered += 1;
      row.points += r.pointsEarned;
      if (r.isCorrect) row.correct += 1;
      if (r.usedHint) row.hints += 1;
      map.set(d, row);
    }
    return [...map.values()];
  }, [record]);

  const maxPoints = summary.totalQuestions * LEVELS[difficulty].fullPoints;

  return (
    <div className="screen">
      <div className="screen-inner screen-inner--wide">
        <div className="result-grid">
          <div className="result-main">
            <div className="kicker" style={{ color: 'var(--cyan)' }}>
              Fim de jogo, {name}
            </div>

            <div style={{ marginTop: 20, display: 'flex', alignItems: 'flex-end', gap: 12 }}>
              <div
                style={{
                  font: '600 clamp(84px, 16vw, 120px)/.85 var(--font)',
                  color: 'var(--q-navy)',
                  letterSpacing: '-.04em',
                  textShadow: '3px 3px 0 rgba(214,0,108,.28),-2px -2px 0 rgba(0,136,176,.22)',
                }}
              >
                {summary.totalScore}
              </div>
              <div style={{ font: '400 16px/1.2 var(--font)', color: 'var(--ink-55)', paddingBottom: 10 }}>
                pontos
                <br />
                <span style={{ fontSize: 13 }}>de {maxPoints} possíveis</span>
              </div>
            </div>

            <div style={{ marginTop: 10, font: '600 20px/1.3 var(--font)', color: 'var(--ink)' }}>
              {summary.correctCount} acertos em {summary.totalQuestions} — conjunto {LEVELS[difficulty].label}
            </div>

            <div style={{ marginTop: 24, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span style={{ width: 5, background: 'var(--cyan)', flex: 'none', alignSelf: 'stretch' }} />
              <div style={{ font: '400 14px/1.45 var(--font)', color: 'var(--ink)' }}>
                {summary.hintsUsed > 0 ? (
                  <>
                    Você usou dica em{' '}
                    <strong style={{ fontWeight: 600 }}>
                      {summary.hintsUsed} {summary.hintsUsed === 1 ? 'vez' : 'vezes'}
                    </strong>{' '}
                    — essas valeram metade
                    {pointsLeftOnTable > 0 && (
                      <>
                        , o que deixou <strong style={{ fontWeight: 600 }}>{pointsLeftOnTable} pontos</strong> na mesa
                      </>
                    )}
                    . Troca justa.
                  </>
                ) : (
                  <>
                    Você não usou <strong style={{ fontWeight: 600 }}>nenhuma dica</strong>. Pontuação cheia em tudo.
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="result-side">
            <div className="kicker kicker--muted" style={{ color: 'var(--ink-55)' }}>
              Por nível
            </div>
            <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column' }}>
              {rows.map((r) => (
                <div
                  key={r.key}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto auto',
                    gap: 16,
                    alignItems: 'baseline',
                    padding: '14px 0',
                    borderBottom: '1px solid rgba(32,30,29,.12)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 9 }}>
                    <span style={{ font: '600 17px/1 var(--font)', color: 'var(--ink)' }}>{r.label}</span>
                    <span style={{ font: '400 12px/1 var(--font)', color: 'var(--ink-45)' }}>{r.weight}</span>
                  </div>
                  <div style={{ font: '400 15px/1 var(--font)', color: 'var(--ink-60)' }}>
                    {r.correct} de {r.answered}
                    {r.hints > 0 && ` · ${r.hints} com dica`}
                  </div>
                  <div style={{ font: '600 17px/1 var(--font)', color: 'var(--q-navy)', minWidth: 66, textAlign: 'right' }}>
                    {r.points} pts
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 28 }}>
              <button className="qbtn qbtn--navy" style={{ height: 62, font: '600 18px/1 var(--font)' }} onClick={onReview}>
                Revisar as {summary.answeredCount} fundamentações
              </button>
              <button className="qbtn qbtn--outline" style={{ height: 56, font: '600 17px/1 var(--font)' }} onClick={onPlayAgain}>
                Jogar outro conjunto
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
