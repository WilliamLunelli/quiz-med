import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import QRCode from 'qrcode';
import { api, ApiError } from '../api/client';
import type { Difficulty, GameListItem } from '../api/types';
import { LEVELS, LEVEL_ORDER } from '../lib/difficulty';
import { getOwnerToken } from '../lib/owner';

const COLOR_PRESETS = ['#162052', '#0088b0', '#d6006c', '#1d5c43', '#201e1d'];
const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

interface DraftQuestion {
  key: string;
  text: string;
  correctAnswer: boolean;
  difficulty: Difficulty;
  hint: string;
  explanation: string;
}

const emptyDraft = (): Omit<DraftQuestion, 'key'> => ({
  text: '',
  correctAnswer: true,
  difficulty: 'facil',
  hint: '',
  explanation: '',
});

let seq = 0;
const nextKey = () => `q${++seq}`;

export function CreateGameScreen() {
  const owner = getOwnerToken();

  const [subjectTitle, setSubjectTitle] = useState('Obstetrícia — 2026/1');
  const [title, setTitle] = useState('');
  const [groupName, setGroupName] = useState('');
  const [coverPhotoUrl, setCoverPhotoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#162052');

  const [questions, setQuestions] = useState<DraftQuestion[]>([]);
  const [draft, setDraft] = useState<Omit<DraftQuestion, 'key'>>(emptyDraft());
  const [editKey, setEditKey] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [myGames, setMyGames] = useState<GameListItem[]>([]);
  const [qrTarget, setQrTarget] = useState<{ id: string; title: string } | null>(null);
  const [qr, setQr] = useState<string | null>(null);

  const colorValid = HEX_RE.test(primaryColor);
  const rootStyle = useMemo<CSSProperties>(
    () => ({ ['--q-navy' as string]: colorValid ? primaryColor : '#162052' }) as CSSProperties,
    [primaryColor, colorValid],
  );
  const participantUrl = qrTarget
    ? `${window.location.origin}${window.location.pathname}?game=${qrTarget.id}`
    : '';

  const fetchMine = useCallback(async () => {
    try {
      const r = await api.myGames(owner);
      setMyGames(r.games);
    } catch {
      /* silencioso: a lista é auxiliar */
    }
  }, [owner]);

  useEffect(() => {
    void fetchMine();
  }, [fetchMine]);

  // Gera o QR sempre que escolhemos um jogo para exibir.
  useEffect(() => {
    if (!qrTarget) {
      setQr(null);
      return;
    }
    let active = true;
    QRCode.toDataURL(participantUrl, { width: 320, margin: 1, color: { dark: '#162052', light: '#ffffff' } })
      .then((d) => active && setQr(d))
      .catch(() => active && setQr(null));
    return () => {
      active = false;
    };
  }, [qrTarget, participantUrl]);

  const draftValid = draft.text.trim().length > 0 && draft.explanation.trim().length > 0;

  const saveQuestion = () => {
    if (!draftValid) return;
    if (editKey) {
      setQuestions((qs) => qs.map((q) => (q.key === editKey ? { ...draft, key: editKey } : q)));
    } else {
      setQuestions((qs) => [...qs, { ...draft, key: nextKey() }]);
    }
    setDraft(emptyDraft());
    setEditKey(null);
  };

  const editQuestion = (key: string) => {
    const q = questions.find((x) => x.key === key);
    if (!q) return;
    const { key: _omit, ...rest } = q;
    void _omit;
    setDraft(rest);
    setEditKey(key);
  };

  const removeQuestion = (key: string) => {
    setQuestions((qs) => qs.filter((q) => q.key !== key));
    if (editKey === key) {
      setDraft(emptyDraft());
      setEditKey(null);
    }
  };

  const resetForm = () => {
    setTitle('');
    setGroupName('');
    setCoverPhotoUrl('');
    setQuestions([]);
    setDraft(emptyDraft());
    setEditKey(null);
    setError(null);
  };

  const submit = async () => {
    setError(null);
    if (!title.trim()) return setError('Informe o título do trabalho.');
    if (!subjectTitle.trim()) return setError('Informe o título da matéria.');
    if (!colorValid) return setError('Cor inválida. Use um hexadecimal como #162052.');
    if (questions.length === 0) return setError('Adicione ao menos uma pergunta.');

    const counters: Record<string, number> = {};
    const payloadQuestions = questions.map((q) => {
      const order = counters[q.difficulty] ?? 0;
      counters[q.difficulty] = order + 1;
      return {
        text: q.text.trim(),
        correctAnswer: q.correctAnswer,
        difficulty: q.difficulty,
        hint: q.hint.trim() ? q.hint.trim() : null,
        explanation: q.explanation.trim(),
        order,
      };
    });

    setSubmitting(true);
    try {
      const game = await api.createGame({
        ownerToken: owner,
        title: title.trim(),
        groupName: groupName.trim(),
        subjectTitle: subjectTitle.trim(),
        coverPhotoUrl: coverPhotoUrl.trim() ? coverPhotoUrl.trim() : null,
        primaryColor,
        questions: payloadQuestions,
      });
      await fetchMine();
      resetForm();
      setQrTarget({ id: game.id, title: game.title });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível criar o jogo.');
    } finally {
      setSubmitting(false);
    }
  };

  const countsByLevel = useMemo(() => {
    const c: Record<string, number> = {};
    for (const q of questions) c[q.difficulty] = (c[q.difficulty] ?? 0) + 1;
    return c;
  }, [questions]);

  // ---------- Painel do QR code (jogo recém-criado ou escolhido em "Meus jogos") ----------
  if (qrTarget) {
    return (
      <div className="screen" style={rootStyle}>
        <div className="screen-inner" style={{ textAlign: 'center', alignItems: 'center' }}>
          <div className="kicker" style={{ color: 'var(--cyan)' }}>
            QR code do jogo
          </div>
          <h2 style={{ margin: '14px 0 0', font: '600 26px/1.15 var(--font)', color: 'var(--q-navy)' }}>{qrTarget.title}</h2>
          <p style={{ marginTop: 12, font: '400 14px/1.5 var(--font)', color: 'var(--ink-60)' }}>
            Aponte a câmera para o QR code, ou compartilhe o link, para jogar.
          </p>
          {qr && (
            <img src={qr} alt="QR code do jogo" style={{ width: 260, height: 260, marginTop: 20, background: '#fff', padding: 12, borderRadius: 8 }} />
          )}
          <div style={{ marginTop: 16, font: '400 12.5px/1.4 ui-monospace, Menlo, monospace', color: 'var(--ink-60)', wordBreak: 'break-all', maxWidth: 360 }}>
            {participantUrl}
          </div>
          <div className="stack-bottom" style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 360, paddingTop: 26 }}>
            <a href={participantUrl} className="qbtn qbtn--navy" style={{ height: 58, font: '600 17px/58px var(--font)', textAlign: 'center', textDecoration: 'none', display: 'block' }}>
              Abrir como participante
            </a>
            <button className="qbtn qbtn--outline" style={{ height: 52, font: '600 16px/1 var(--font)' }} onClick={() => setQrTarget(null)}>
              Voltar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------- Formulário ----------
  return (
    <div className="screen" style={rootStyle}>
      <div className="screen-inner screen-inner--hero">
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, font: '600 26px/1.1 var(--font)', color: 'var(--q-navy)', letterSpacing: '-.02em' }}>
            Criar jogo
          </h2>
          <img className="create-logo" src="/logo-slm-claro.png" alt="Faculdade São Leopoldo Mandic" style={{ marginLeft: 'auto' }} onError={(e) => (e.currentTarget.style.display = 'none')} />
        </div>

        {/* Meus jogos (só os deste criador) */}
        {myGames.length > 0 && (
          <div style={{ marginTop: 22, border: '1px solid rgba(32,30,29,.12)', padding: 16, borderRadius: 4 }}>
            <div className="kicker kicker--muted" style={{ color: 'var(--ink-55)' }}>
              Meus jogos ({myGames.length})
            </div>
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column' }}>
              {myGames.map((g) => (
                <div key={g.id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 0', borderTop: '1px solid rgba(32,30,29,.08)' }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ font: '600 14.5px/1.3 var(--font)', color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.title}</div>
                    <div style={{ font: '400 12px/1.3 var(--font)', color: 'var(--ink-55)' }}>{g.subjectTitle}</div>
                  </div>
                  <button className="qbtn--ghost" style={{ font: '600 13px/1 var(--font)', flex: 'none' }} onClick={() => setQrTarget({ id: g.id, title: g.title })}>
                    Ver QR
                  </button>
                  <a href={`${window.location.pathname}?game=${g.id}`} className="qbtn--ghost" style={{ font: '400 13px/1 var(--font)', flex: 'none', textDecoration: 'none' }}>
                    abrir
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="create-grid" style={{ marginTop: 24 }}>
          {/* ------- Coluna: capa ------- */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="kicker" style={{ color: 'var(--cyan)' }}>
              Capa do jogo
            </div>

            <div className="field">
              <label>Título da matéria</label>
              <input className="input" value={subjectTitle} onChange={(e) => setSubjectTitle(e.target.value)} placeholder="Ex.: Obstetrícia — 2026/1" />
            </div>
            <div className="field">
              <label>Título do trabalho</label>
              <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Descolamento Prematuro de Placenta" />
            </div>
            <div className="field">
              <label>Nome do grupo</label>
              <input className="input" value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Ex.: Grupo 4 — Ana, Caio, Marina e Téo" />
            </div>

            <div className="field">
              <label>Cor da capa</label>
              <div className="swatches">
                {COLOR_PRESETS.map((c) => (
                  <button key={c} type="button" className="swatch" style={{ background: c }} aria-pressed={primaryColor.toLowerCase() === c} aria-label={`Cor ${c}`} onClick={() => setPrimaryColor(c)} />
                ))}
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 4 }}>
                <input type="color" value={colorValid ? (primaryColor.length === 4 ? expandHex(primaryColor) : primaryColor) : '#162052'} onChange={(e) => setPrimaryColor(e.target.value)} aria-label="Escolher cor" style={{ width: 44, height: 40, padding: 0, border: '1px solid rgba(32,30,29,.18)', background: '#fff', cursor: 'pointer' }} />
                <input className="hex-input" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value.trim())} placeholder="#162052" aria-label="Cor em hexadecimal" spellCheck={false} />
                <span style={{ font: '400 12px/1.3 var(--font)', color: colorValid ? 'var(--ink-45)' : 'var(--red)' }}>{colorValid ? 'cor da capa' : 'hex inválido'}</span>
              </div>
            </div>

            <div className="field">
              <label>
                Foto do grupo <span className="hint-label">opcional — URL da imagem</span>
              </label>
              <input className="input" value={coverPhotoUrl} onChange={(e) => setCoverPhotoUrl(e.target.value)} placeholder="https://…/foto.jpg" />
            </div>
          </div>

          {/* ------- Coluna: perguntas ------- */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <div className="kicker" style={{ color: 'var(--cyan)' }}>
                Perguntas
              </div>
              <div style={{ marginLeft: 'auto', font: '400 12.5px/1 var(--font)', color: 'var(--ink-55)' }}>
                {questions.length} cadastrada{questions.length === 1 ? '' : 's'}
                {LEVEL_ORDER.some((d) => countsByLevel[d]) &&
                  ` · ${LEVEL_ORDER.filter((d) => countsByLevel[d])
                    .map((d) => `${LEVELS[d].label} ${countsByLevel[d]}`)
                    .join(', ')}`}
              </div>
            </div>

            {questions.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {questions.map((q, i) => (
                  <div className="qitem" key={q.key}>
                    <div style={{ font: '600 13px/1.3 var(--font)', color: 'var(--ink-45)', width: 22, flex: 'none' }}>{String(i + 1).padStart(2, '0')}</div>
                    <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                      <div style={{ font: '400 14.5px/1.35 var(--font)', textWrap: 'pretty' }}>{q.text}</div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ font: '600 11px/1 var(--font)', background: 'var(--q-navy)', color: '#fff', padding: '5px 9px' }}>{q.correctAnswer ? 'Verdadeiro' : 'Falso'}</span>
                        <span className={LEVELS[q.difficulty].tagClass} style={{ fontSize: 11 }}>{LEVELS[q.difficulty].label}</span>
                        <span style={{ font: '400 11.5px/1 var(--font)', color: q.hint.trim() ? 'var(--cyan-700)' : 'rgba(32,30,29,.35)' }}>{q.hint.trim() ? 'com dica' : '— sem dica'}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flex: 'none' }}>
                      <button className="qbtn--ghost" style={{ font: '400 13px/1 var(--font)' }} onClick={() => editQuestion(q.key)}>editar</button>
                      <button className="qbtn--ghost" style={{ font: '400 13px/1 var(--font)', color: 'var(--red)' }} onClick={() => removeQuestion(q.key)}>excluir</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Editor de pergunta */}
            <div style={{ borderTop: '1px solid rgba(32,30,29,.1)', paddingTop: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ font: '600 15px/1 var(--font)', color: 'var(--q-navy)' }}>{editKey ? 'Editar pergunta' : `Pergunta ${questions.length + 1}`}</div>

              <div className="field">
                <label>Afirmação</label>
                <textarea className="input" value={draft.text} onChange={(e) => setDraft((d) => ({ ...d, text: e.target.value }))} placeholder="Escreva a afirmação que o colega vai julgar" />
              </div>

              <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
                <div className="field">
                  <label>Resposta correta</label>
                  <div className="seg">
                    <button type="button" className="seg-opt" aria-pressed={draft.correctAnswer} onClick={() => setDraft((d) => ({ ...d, correctAnswer: true }))}>Verdadeiro</button>
                    <button type="button" className="seg-opt" aria-pressed={!draft.correctAnswer} onClick={() => setDraft((d) => ({ ...d, correctAnswer: false }))}>Falso</button>
                  </div>
                </div>
                <div className="field">
                  <label>Nível de dificuldade</label>
                  <div className="seg">
                    {LEVEL_ORDER.map((d) => (
                      <button key={d} type="button" className="seg-opt" aria-pressed={draft.difficulty === d} onClick={() => setDraft((s) => ({ ...s, difficulty: d }))}>
                        {LEVELS[d].label} · {LEVELS[d].fullPoints}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="field">
                <label>
                  Dica <span className="hint-label">opcional — em branco, não aparece botão de dica; quem usa leva metade dos pontos</span>
                </label>
                <input className="input" value={draft.hint} onChange={(e) => setDraft((d) => ({ ...d, hint: e.target.value }))} placeholder="Ex.: considere a idade gestacional limite das diretrizes" />
              </div>

              <div className="field">
                <label>
                  Fundamentação <span className="hint-label">aparece no feedback, acertando ou errando</span>
                </label>
                <textarea className="input" value={draft.explanation} onChange={(e) => setDraft((d) => ({ ...d, explanation: e.target.value }))} placeholder="Explique em uma ou duas frases por que essa é a resposta" />
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button className="qbtn qbtn--navy" style={{ width: 'auto', padding: '10px 20px', height: 44, font: '600 14px/1 var(--font)' }} disabled={!draftValid} onClick={saveQuestion}>
                  {editKey ? 'Salvar alterações' : 'Adicionar pergunta'}
                </button>
                {editKey && (
                  <button className="qbtn qbtn--outline" style={{ width: 'auto', padding: '10px 20px', height: 44, font: '600 14px/1 var(--font)' }} onClick={() => { setDraft(emptyDraft()); setEditKey(null); }}>
                    Cancelar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Ações finais */}
        <div className="stack-bottom" style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 28 }}>
          {error && <div style={{ font: '400 13.5px/1.4 var(--font)', color: 'var(--red)' }}>{error}</div>}
          <button className="qbtn qbtn--navy" style={{ height: 60, font: '600 18px/1 var(--font)', maxWidth: 420 }} disabled={submitting} onClick={submit}>
            {submitting ? 'Criando…' : 'Gerar QR code'}
          </button>
        </div>
      </div>
    </div>
  );
}

/** #abc -> #aabbcc (input type=color exige 6 dígitos). */
function expandHex(hex: string): string {
  const h = hex.replace('#', '');
  if (h.length !== 3) return hex;
  return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`;
}
