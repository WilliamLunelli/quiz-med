import type { AnsweredRecord } from '../App';

interface Props {
  record: AnsweredRecord[];
  onBack: () => void;
}

const bool = (b: boolean) => (b ? 'Verdadeiro' : 'Falso');

export function ReviewScreen({ record, onBack }: Props) {
  return (
    <div className="screen">
      <div className="screen-inner">
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <h2 style={{ margin: 0, font: '600 26px/1.1 var(--font)', color: 'var(--q-navy)', letterSpacing: '-.02em' }}>
            Fundamentações
          </h2>
          <button className="qbtn--ghost" onClick={onBack} style={{ marginLeft: 'auto', font: '400 14px/1 var(--font)' }}>
            voltar
          </button>
        </div>

        <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column' }}>
          {record.map((r, i) => {
            const color = r.isCorrect ? 'var(--green)' : 'var(--red)';
            return (
              <div key={r.question.id} style={{ padding: '18px 0', borderBottom: '1px solid rgba(32,30,29,.12)' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                  <span style={{ font: '600 12px/1 var(--font)', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--ink-45)' }}>
                    Pergunta {String(i + 1).padStart(2, '0')}
                  </span>
                  <span style={{ marginLeft: 'auto', font: '600 12px/1 var(--font)', color }}>
                    {r.isCorrect ? `acertou · +${r.pointsEarned}` : 'errou · 0'}
                  </span>
                </div>

                <div style={{ marginTop: 10, font: '400 16px/1.4 var(--font)', color: 'var(--ink-78)', textWrap: 'pretty' }}>
                  {r.question.text}
                </div>

                <div style={{ marginTop: 8, font: '400 12.5px/1.4 var(--font)', color: 'var(--ink-55)' }}>
                  sua resposta: {bool(r.answerGiven)} · correta: {bool(r.correctAnswer)}
                  {r.usedHint && ' · usou dica'}
                </div>

                <div className="why" style={{ marginTop: 12 }}>
                  <span className="why-bar" style={{ background: color }} />
                  <div className="why-text" style={{ fontSize: 15 }}>
                    {r.explanation}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button
          className="qbtn qbtn--outline stack-bottom"
          style={{ height: 56, font: '600 17px/1 var(--font)' }}
          onClick={onBack}
        >
          Voltar ao resultado
        </button>
      </div>
    </div>
  );
}
