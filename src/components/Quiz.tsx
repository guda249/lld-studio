import { useMemo, useRef, useState } from "react";
import type { PatternQuiz, Question } from "../anim/types";
import { grade, isComplete, resultMessage, type Answer, type QuizResult } from "../lib/quizGrade";
import { CodeLines } from "./CodePanel";
import { StaticDiagram } from "../anim/StaticDiagram";
import { highlightLines } from "../lib/highlight";
import { recordQuiz } from "../lib/progress";
import type { NewCard } from "./Flashcards";

interface Props {
  quiz: PatternQuiz;
  patternName: string;
  /** "See this in the lesson": scrolls to the lesson. */
  onReview: () => void;
  onAddCards: (cards: NewCard[]) => Promise<number>;
  onGoToCards: () => void;
}

/** One question at a time: pick, check, see why. Six question types (Notion 08 · Quiz & Flashcards). */
export default function Quiz({ quiz, patternName, onReview, onAddCards, onGoToCards }: Props) {
  const all = quiz.questions;
  const [queue, setQueue] = useState<number[]>(() => all.map((_, i) => i));
  const [qi, setQi] = useState(0);
  const [answer, setAnswer] = useState<Answer>(null);
  const [checked, setChecked] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  const [hintShown, setHintShown] = useState(false);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [done, setDone] = useState(false);
  const [added, setAdded] = useState<number | null>(null);
  const prompt = useRef<HTMLParagraphElement>(null);
  const nextBtn = useRef<HTMLButtonElement>(null);
  const resultsBox = useRef<HTMLDivElement>(null);
  const q = all[queue[qi]];

  const reset = () => { setAnswer(null); setChecked(false); setHintUsed(false); setHintShown(false); };

  function check() {
    if (checked || !isComplete(q, answer)) return;
    const correct = grade(q, answer);
    setChecked(true);
    setResults((r) => { const n = r.slice(); n[qi] = { correct, hint: hintUsed }; return n; });
    window.setTimeout(() => nextBtn.current?.focus(), 0);
  }

  function next() {
    if (qi < queue.length - 1) {
      setQi(qi + 1);
      reset();
      window.setTimeout(() => prompt.current?.focus(), 0);
      return;
    }
    setDone(true);
    const correct = results.filter((r) => r?.correct).length;
    void recordQuiz(quiz.slug, correct, queue.length);
    window.setTimeout(() => resultsBox.current?.focus(), 0);
  }

  function startRound(indices: number[]) {
    setQueue(indices); setQi(0); setResults([]); setDone(false); setAdded(null); reset();
  }

  const onKey = (e: React.KeyboardEvent) => {
    if (done || e.altKey || e.ctrlKey || e.metaKey) return;
    const tag = (e.target as HTMLElement).tagName;
    const n = Number(e.key);
    if (!checked && (q.type === "mcq" || q.type === "diagram") && n >= 1 && n <= q.options.length) { e.preventDefault(); setAnswer(n - 1); return; }
    if (e.key === "Enter" && tag !== "BUTTON" && tag !== "A") {
      if (!checked && isComplete(q, answer)) { e.preventDefault(); check(); }
      else if (checked) { e.preventDefault(); next(); }
    }
  };

  if (done) {
    const correct = results.filter((r) => r?.correct).length;
    const missed = queue.filter((_, pos) => !results[pos]?.correct);
    return (
      <div className="card results" ref={resultsBox} tabIndex={-1}>
        <div className="score-row">
          <span className="score-big">{correct} / {queue.length}</span>
          <span className="score-msg">{resultMessage(correct, queue.length, patternName)}</span>
        </div>
        <ul className="res-list">
          {queue.map((qIndex, pos) => {
            const qq = all[qIndex], r = results[pos];
            return (
              <li key={pos}>
                <span className={"mark " + (r?.correct ? "ok" : "bad")} aria-label={r?.correct ? "correct" : "missed"}>{r?.correct ? "✓" : "✗"}</span>
                <span>{qq.prompt}<span className="tg">{qq.tag}{r?.hint ? " · used a hint" : ""}</span></span>
                {r?.correct ? <span /> : <button type="button" className="btn link" onClick={onReview}>Review</button>}
              </li>
            );
          })}
        </ul>
        {added !== null && <div className="toast" role="status">{added} card{added === 1 ? "" : "s"} added. They're due in your flashcards now.</div>}
        <div className="actions">
          {missed.length > 0 && (
            <>
              <button className="btn primary" type="button" onClick={() => startRound(missed)}>Retry the {missed.length} missed</button>
              <button className="btn" type="button" disabled={added !== null} onClick={async () => {
                const n = await onAddCards(missed.map((i) => {
                  const qq = all[i];
                  return { id: `quiz-${i}`, front: qq.prompt, back: qq.explain, code: "code" in qq ? qq.code : undefined, src: "From your quiz" };
                }));
                setAdded(n);
              }}>Add missed to flashcards</button>
            </>
          )}
          <button className="btn" type="button" onClick={() => startRound(all.map((_, i) => i))}>Retry all</button>
          <span className="spacer" />
          <button className="btn" type="button" onClick={onGoToCards}>Go to flashcards</button>
        </div>
      </div>
    );
  }

  const r = results[qi];
  const keysHint = q.type === "mcq" ? `Keys 1–${q.options.length} pick, Enter checks` : q.type === "diagram" ? "Keys 1–3 pick, Enter checks"
    : q.type === "bug" ? "Tap or tab to a line, then check" : "Tap steps in the order they happen";

  return (
    <div className="card quiz" onKeyDown={onKey}>
      <div className="q-top">
        <span className="q-count">Question {qi + 1} of {queue.length}</span>
        <span className="q-tag">{q.tag}</span>
      </div>
      <div className="q-bar" aria-hidden="true">
        {queue.map((_, pos) => {
          const rr = results[pos];
          return <span key={pos} className={rr ? (rr.correct ? "right" : "wrong") : pos === qi ? "now" : ""} />;
        })}
      </div>
      <p className="q-prompt" ref={prompt} tabIndex={-1}>{q.prompt}</p>
      <QuestionBody q={q} answer={answer} setAnswer={setAnswer} checked={checked} />
      {hintShown && <div className="q-hint">{q.hint}</div>}
      {checked && r && (
        <div className={"feedback " + (r.correct ? "ok" : "bad")} aria-live="polite">
          <span className="verdict">{r.correct ? (r.hint ? "Correct, with a hint." : "Correct.") : "Not quite."}</span>
          <span>{q.explain}</span>
          {!r.correct && q.type === "order" && (
            <div><strong>Correct order:</strong> {q.steps.map((s, i) => `${i + 1}. ${s}`).join(" → ")}</div>
          )}
          <button type="button" className="btn link" onClick={onReview}>See this in the lesson</button>
        </div>
      )}
      <div className="actions">
        {!checked && <button className="btn" type="button" disabled={hintShown} onClick={() => { setHintUsed(true); setHintShown(true); }}>Show a hint</button>}
        <span className="spacer" />
        <span className="kbd">{checked ? "Enter for next" : keysHint}</span>
        {!checked
          ? <button className="btn primary" type="button" disabled={!isComplete(q, answer)} onClick={check}>Check answer</button>
          : <button className="btn primary" type="button" ref={nextBtn} onClick={next}>{qi === queue.length - 1 ? "See results" : "Next question"}</button>}
      </div>
    </div>
  );
}

function QuestionBody({ q, answer, setAnswer, checked }: { q: Question; answer: Answer; setAnswer: (a: Answer) => void; checked: boolean }) {
  const lang = "code" in q && q.code ? q.code.lang : "python";
  const bugLines = useMemo(() => (q.type === "bug" ? q.code.text.replace(/\s+$/, "").split("\n") : []), [q]);
  const bugTokens = useMemo(() => highlightLines(bugLines, lang), [bugLines, lang]);

  if (q.type === "mcq" || q.type === "diagram") {
    return (
      <>
        {q.type === "mcq" && q.code && (
          <pre className="code q-code" tabIndex={0} aria-label="Code"><CodeLines text={q.code.text} lang={q.code.lang} /></pre>
        )}
        <div className={"options" + (q.type === "diagram" ? " diagrams" : "")} role="radiogroup" aria-label="Answers">
          {q.options.map((o, i) => {
            const cls = ["opt"];
            if (checked && i === q.answer) cls.push("right");
            else if (checked && i === answer) cls.push("wrong");
            return (
              <button key={i} type="button" role="radio" aria-checked={answer === i} className={cls.join(" ")} disabled={checked} onClick={() => setAnswer(i)}>
                <span className="k">{q.type === "diagram" ? "ABC"[i] : i + 1}</span>
                {typeof o === "string" ? <span>{o}</span> : <StaticDiagram spec={o} lang="python" allowPortrait={false} />}
              </button>
            );
          })}
        </div>
      </>
    );
  }
  if (q.type === "bug") {
    return (
      <div className="code bug" role="group" aria-label="Tap a line">
        {bugLines.map((l, i) => {
          const n = i + 1;
          const toks = bugTokens[i].map((t, j) => (t.cls ? <span key={j} className={t.cls}>{t.text}</span> : t.text));
          if (!l.trim()) return <span key={i} className="ln"><span className="n">{n}</span> </span>;
          const cls = ["ln"];
          if (checked && n === q.answer) cls.push("right");
          else if (checked && n === answer) cls.push("wrong");
          return (
            <button key={i} type="button" className={cls.join(" ")} aria-pressed={answer === n} disabled={checked}
              aria-label={`Line ${n}: ${l.trim()}`} onClick={() => setAnswer(n)}>
              <span className="n">{n}</span>{toks}
            </button>
          );
        })}
      </div>
    );
  }
  // order
  const placed = Array.isArray(answer) ? answer : [];
  const pool = q.shuffled.filter((s) => !placed.includes(s));
  return (
    <div className="order-wrap">
      <div>
        <h3 className="order-h">Steps</h3>
        <div className="pool">
          {pool.length ? pool.map((s) => (
            <button key={s} type="button" className="chip-step" disabled={checked} onClick={() => setAnswer([...placed, s])}>{q.steps[s]}</button>
          )) : <span className="empty-note">All steps placed.</span>}
        </div>
      </div>
      <div>
        <h3 className="order-h">Your order (tap a step to take it back)</h3>
        <div className="placed">
          {placed.length ? placed.map((s, i) => (
            <button key={s} type="button" className={"chip-step" + (checked ? (s === i ? " right" : " wrong") : "")} disabled={checked}
              onClick={() => setAnswer(placed.filter((_, j) => j !== i))}>
              <span className="num">{i + 1}</span>{q.steps[s]}
            </button>
          )) : <span className="empty-note">Tap the first step on the left.</span>}
        </div>
      </div>
    </div>
  );
}
