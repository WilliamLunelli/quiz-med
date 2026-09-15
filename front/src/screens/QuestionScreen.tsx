import { useEffect, useState } from 'react';
import type { Difficulty, PlayQuestion } from '../api/types';
import { LEVELS, halfPoints } from '../lib/difficulty';

interface Props {
  question: PlayQuestion;
  index: number;
  total: number;
  difficulty: Difficulty;
  usedHint: boolean;
  onUseHint: () => void;
  onAnswer: (answerGiven: boolean) => void;
  busy: boolean;
  error: string | null;
}

export function QuestionScreen({
  question,
  index,
  total,
  difficulty,
  usedHint,
  onUseHint,
  onAnswer,
  busy,
  error,
}: Props) {
  const meta = LEVELS[difficulty];
  const [open, setOpen] = useState(usedHint);

  // Ao trocar de pergunta, recolhe a dica.
  useEffect(() => {
    setOpen(false);
  }, [question.id]);

  const hasHint = Boolean(question.hint);
  const points = usedHint ? halfPoints(meta.fullPoints) : meta.fullPoints;
  const pointsNote = usedHint ? 'metade — dica usada' : hasHint ? 'valor cheio' : 'esta não tem dica';

  const openHint = () => {
    setOpen(true);
    onUseHint();
  };

  return (
    <div className="screen">
      <div className="screen-inner screen-inner--wide">
        {/* Cabeçalho: número, nível, pontos */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <div style={{ font: '600 13px/1 var(--font)', color: 'var(--q-navy)' }}>
            {String(index + 1).padStart(2, '0')}{' '}
            <span style={{ color: 'rgba(32,30,29,.4)', fontWeight: 400 }}>/ {total}</span>
          </div>
          <span className={meta.tagClass} style={{ fontSize: 11 }}>
            {meta.label}
          </span>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ font: '600 13px/1 var(--font)', color: 'var(--ink)' }}>vale {points} pontos</div>
            <div style={{ marginTop: 4, font: 'italic 400 11.5px/1 var(--font)', color: 'var(--ink-55)' }}>
              {pointsNote}
            </div>
          </div>
        </div>

        {/* Progresso */}
        <div className="ticks" style={{ marginTop: 12 }}>
          {Array.from({ length: total }, (_, i) => (
            <div key={i} className={i <= index ? 'tick on' : 'tick'} />
          ))}
        </div>

        {/* Afirmação */}
        <div
          style={{
            marginTop: 34,
            font: '600 clamp(24px, 3.2vw, 32px)/1.22 var(--font)',
            letterSpacing: '-.015em',
            textWrap: 'pretty',
            color: 'var(--ink)',
          }}
        >
          {question.text}
        </div>

        {/* Dica (só existe se cadastrada) */}
        {hasHint && (
          <div style={{ marginTop: 20, minHeight: 92 }}>
            {!open ? (
              <button
                className="qbtn--ghost"
                onClick={openHint}
                style={{ padding: 0, display: 'flex', alignItems: 'center', gap: 9, font: '600 15px/1 var(--font)', color: 'var(--cyan)' }}
              >
                <span
                  style={{ width: 26, height: 26, border: '1px solid var(--cyan)', borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: 13 }}
                >
                  ?
                </span>
                Pedir dica
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button
                  className="qbtn--ghost"
                  onClick={() => setOpen(false)}
                  style={{ padding: 0, display: 'flex', alignItems: 'center', gap: 9, font: '400 13.5px/1 var(--font)', color: 'rgba(32,30,29,.45)' }}
                >
                  <span
                    style={{ width: 26, height: 26, border: '1px solid rgba(32,30,29,.3)', borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: 13 }}
                  >
                    ×
                  </span>
                  esconder a dica
                </button>
                <div style={{ display: 'flex', gap: 10 }}>
                  <span style={{ width: 5, background: 'var(--cyan)', flex: 'none' }} />
                  <div style={{ font: 'italic 400 15px/1.45 var(--font)', color: 'var(--ink)', textWrap: 'pretty' }}>
                    {question.hint}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Respostas */}
        <div className="stack-bottom" style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 24 }}>
          {error && <div style={{ font: '400 13px/1.4 var(--font)', color: 'var(--red)' }}>{error}</div>}
          <div className="answers">
            <button
              className="qbtn qbtn--navy"
              style={{ height: 88, font: '600 26px/1 var(--font)' }}
              disabled={busy}
              onClick={() => onAnswer(true)}
            >
              Verdadeiro
            </button>
            <button
              className="qbtn qbtn--white"
              style={{ height: 88, font: '600 26px/1 var(--font)' }}
              disabled={busy}
              onClick={() => onAnswer(false)}
            >
              Falso
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
