import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { api } from './api/client';
import type { AnswerResponse, Difficulty, FinishSummary, Game, PlayQuestion } from './api/types';
import { LEVELS } from './lib/difficulty';
import { CoverScreen } from './screens/CoverScreen';
import { NameLevelScreen } from './screens/NameLevelScreen';
import { QuestionScreen } from './screens/QuestionScreen';
import { FeedbackScreen } from './screens/FeedbackScreen';
import { ResultScreen } from './screens/ResultScreen';
import { ReviewScreen } from './screens/ReviewScreen';
import { CenterMessage } from './screens/CenterMessage';
import { CreateGameScreen } from './screens/CreateGameScreen';

export interface AnsweredRecord {
  question: PlayQuestion;
  answerGiven: boolean;
  isCorrect: boolean;
  pointsEarned: number;
  correctAnswer: boolean;
  explanation: string;
  usedHint: boolean;
}

type Phase =
  | 'loading'
  | 'error'
  | 'create'
  | 'cover'
  | 'name'
  | 'question'
  | 'feedback'
  | 'result'
  | 'review';

/** Volta para a tela inicial (criar jogo), limpando o ?game da URL. */
function goToCreate() {
  window.location.href = window.location.pathname;
}

export function App() {
  const [phase, setPhase] = useState<Phase>('loading');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [game, setGame] = useState<Game | null>(null);

  const [name, setName] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);

  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<PlayQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [usedHint, setUsedHint] = useState(false);
  const [record, setRecord] = useState<AnsweredRecord[]>([]);
  const [lastFeedback, setLastFeedback] = useState<AnswerResponse | null>(null);
  const [summary, setSummary] = useState<FinishSummary | null>(null);

  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Tela inicial = criar jogo. O participante só entra com ?game=<id> (o QR code).
  useEffect(() => {
    const gameId = new URLSearchParams(window.location.search).get('game');
    if (!gameId) {
      setPhase('create');
      return;
    }
    let active = true;
    (async () => {
      try {
        const g = await api.getGame(gameId);
        if (!active) return;
        setGame(g);
        setPhase('cover');
      } catch (err) {
        if (!active) return;
        setLoadError(err instanceof Error ? err.message : 'Falha ao carregar o jogo.');
        setPhase('error');
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const beginAttempt = useCallback(async () => {
    if (!game || !difficulty || !name.trim()) return;
    setBusy(true);
    setActionError(null);
    try {
      const res = await api.createAttempt({
        gameId: game.id,
        participantName: name.trim(),
        difficulty,
      });
      setAttemptId(res.attempt.id);
      setQuestions(res.questions);
      setIndex(0);
      setRecord([]);
      setUsedHint(false);
      setLastFeedback(null);
      setSummary(null);
      setPhase('question');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Não foi possível começar.');
    } finally {
      setBusy(false);
    }
  }, [game, difficulty, name]);

  const answer = useCallback(
    async (answerGiven: boolean) => {
      if (!attemptId) return;
      const current = questions[index];
      if (!current) return;
      setBusy(true);
      setActionError(null);
      try {
        const res = await api.submitAnswer(attemptId, {
          questionId: current.id,
          answerGiven,
          usedHint,
        });
        setRecord((r) => [
          ...r,
          {
            question: current,
            answerGiven,
            isCorrect: res.isCorrect,
            pointsEarned: res.pointsEarned,
            correctAnswer: res.correctAnswer,
            explanation: res.explanation,
            usedHint,
          },
        ]);
        setLastFeedback(res);
        setPhase('feedback');
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Não foi possível registrar a resposta.');
      } finally {
        setBusy(false);
      }
    },
    [attemptId, questions, index, usedHint],
  );

  const next = useCallback(async () => {
    if (index + 1 < questions.length) {
      setIndex((i) => i + 1);
      setUsedHint(false);
      setLastFeedback(null);
      setPhase('question');
      return;
    }
    if (!attemptId) return;
    setBusy(true);
    setActionError(null);
    try {
      const res = await api.finishAttempt(attemptId);
      setSummary(res.summary);
      setPhase('result');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Não foi possível finalizar.');
    } finally {
      setBusy(false);
    }
  }, [index, questions.length, attemptId]);

  const playAgain = useCallback(() => {
    setDifficulty(null);
    setAttemptId(null);
    setQuestions([]);
    setIndex(0);
    setUsedHint(false);
    setRecord([]);
    setLastFeedback(null);
    setSummary(null);
    setActionError(null);
    setPhase('name');
  }, []);

  const navyStyle = useMemo<CSSProperties>(
    () => ({ ['--q-navy' as string]: game?.primaryColor ?? '#162052' }) as CSSProperties,
    [game],
  );

  const pointsLeftOnTable = useMemo(
    () =>
      record.reduce((sum, r) => {
        if (r.usedHint && r.isCorrect) return sum + (LEVELS[r.question.difficulty].fullPoints - r.pointsEarned);
        return sum;
      }, 0),
    [record],
  );

  let content: React.ReactNode;
  if (phase === 'loading') {
    content = <CenterMessage spinner title="Carregando o jogo…" />;
  } else if (phase === 'error') {
    content = (
      <CenterMessage
        title="Não deu para abrir o jogo"
        message={loadError ?? 'Tente novamente em instantes.'}
        actionLabel="Criar um jogo"
        onAction={goToCreate}
      />
    );
  } else if (phase === 'create') {
    content = <CreateGameScreen />;
  } else if (phase === 'cover' && game) {
    content = <CoverScreen game={game} onStart={() => setPhase('name')} />;
  } else if (phase === 'name' && game) {
    content = (
      <NameLevelScreen
        game={game}
        name={name}
        onNameChange={setName}
        difficulty={difficulty}
        onPickDifficulty={setDifficulty}
        onStart={beginAttempt}
        busy={busy}
        error={actionError}
      />
    );
  } else if (phase === 'question') {
    content = (
      <QuestionScreen
        question={questions[index]}
        index={index}
        total={questions.length}
        difficulty={difficulty!}
        usedHint={usedHint}
        onUseHint={() => setUsedHint(true)}
        onAnswer={answer}
        busy={busy}
        error={actionError}
      />
    );
  } else if (phase === 'feedback' && lastFeedback) {
    content = (
      <FeedbackScreen
        feedback={lastFeedback}
        question={questions[index]}
        index={index}
        answerGiven={record[record.length - 1]?.answerGiven ?? false}
        usedHint={usedHint}
        difficulty={difficulty!}
        isLast={index + 1 >= questions.length}
        onNext={next}
        busy={busy}
      />
    );
  } else if (phase === 'result' && summary) {
    content = (
      <ResultScreen
        name={name}
        difficulty={difficulty!}
        summary={summary}
        record={record}
        pointsLeftOnTable={pointsLeftOnTable}
        onReview={() => setPhase('review')}
        onPlayAgain={playAgain}
      />
    );
  } else if (phase === 'review') {
    content = <ReviewScreen record={record} onBack={() => setPhase('result')} />;
  }

  return (
    <div className="app-shell" style={navyStyle}>
      {content}
    </div>
  );
}
