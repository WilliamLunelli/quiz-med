import type { AnswerResponse, Difficulty, PlayQuestion } from '../api/types';
import { LEVELS } from '../lib/difficulty';

interface Props {
  feedback: AnswerResponse;
  question: PlayQuestion;
  index: number;
  answerGiven: boolean;
  usedHint: boolean;
  difficulty: Difficulty;
  isLast: boolean;
  onNext: () => void;
  busy: boolean;
}

export function FeedbackScreen({
  feedback,
  question,
  index,
  answerGiven,
  usedHint,
  difficulty,
  isLast,
  onNext,
  busy,
}: Props) {
  const correct = feedback.isCorrect;
  const headerColor = correct ? 'var(--green)' : 'var(--red)';
  const fullPoints = LEVELS[difficulty].fullPoints;
  const givenLabel = answerGiven ? 'verdadeiro' : 'falso';

  return (
    <div className="screen screen--feedback">
      <div className="fb-card">
        {/* Faixa colorida (full-bleed no mobile, topo do cartão no desktop) */}
        <div className="fb-band" style={{ background: headerColor }}>
          <div className="fb-band-inner">
          <span
            style={{ width: 56, height: 56, borderRadius: '50%', background: '#fff', flex: 'none', display: 'grid', placeItems: 'center' }}
          >
            {correct ? (
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M4 12.8l5.2 5.2L20 7.2" stroke="#1d5c43" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M5 5l14 14M19 5L5 19" stroke="#b3122b" strokeWidth="3.2" strokeLinecap="round" />
              </svg>
            )}
          </span>
          <div>
            <div style={{ font: '600 30px/1 var(--font)' }}>{correct ? 'Acertou' : 'Errou'}</div>
            <div style={{ marginTop: 6, font: '400 15px/1.3 var(--font)' }}>
              {correct ? (
                <>
                  <strong style={{ fontWeight: 600 }}>+{feedback.pointsEarned} pontos</strong>{' '}
                  <span style={{ color: 'rgba(255,255,255,.78)' }}>
                    · {usedHint ? 'metade, dica usada' : 'valor cheio, sem dica'}
                  </span>
                </>
              ) : (
                <>
                  A resposta certa era{' '}
                  <strong style={{ fontWeight: 600 }}>{feedback.correctAnswer ? 'Verdadeiro' : 'Falso'}</strong> ·{' '}
                  <strong style={{ fontWeight: 600 }}>0 pontos</strong>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Corpo centralizado */}
      <div className="fb-body">
        <div style={{ font: '600 11px/1 var(--font)', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--ink-45)' }}>
          Pergunta {String(index + 1).padStart(2, '0')} · sua resposta: {givenLabel}
        </div>
        <div style={{ marginTop: 12, font: '400 16.5px/1.4 var(--font)', color: 'var(--ink-78)', textWrap: 'pretty' }}>
          “{question.text}”
        </div>

        {correct && usedHint && (
          <div
            style={{ marginTop: 20, display: 'flex', alignItems: 'baseline', gap: 10, font: '400 13.5px/1.4 var(--font)', color: 'var(--ink-60)' }}
          >
            <span
              style={{ width: 22, height: 22, border: '1px solid var(--cyan)', borderRadius: '50%', display: 'grid', placeItems: 'center', color: 'var(--cyan)', fontSize: 12, flex: 'none' }}
            >
              ?
            </span>
            Valor cheio era {fullPoints} — a dica cobra metade. Justo.
          </div>
        )}

        <div style={{ marginTop: 24, font: '600 11px/1 var(--font)', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--cyan)' }}>
          Por que
        </div>
        <div className="why" style={{ marginTop: 10 }}>
          <span className="why-bar" style={{ background: headerColor }} />
          <div className="why-text">{feedback.explanation}</div>
        </div>

        {!correct && (
          <div style={{ marginTop: 18, font: 'italic 400 13.5px/1.45 var(--font)', color: 'var(--ink-55)' }}>
            Sem susto: dá pra rever todas as fundamentações no fim.
          </div>
        )}

        <button
          className="qbtn qbtn--navy stack-bottom"
          style={{ height: 72, font: '600 20px/1 var(--font)' }}
          onClick={onNext}
          disabled={busy}
        >
          {busy ? 'Só um instante…' : isLast ? 'Ver resultado' : 'Próxima pergunta'}
        </button>
        </div>
      </div>
    </div>
  );
}
