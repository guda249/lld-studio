import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { PatternQuiz } from "../anim/types";
import { ALL_PATTERNS } from "../content/patterns";
import { loadQuiz } from "../content/lessons";
import Flashcards, { useDeck } from "../components/Flashcards";
import { computeProgress, loadProgressData } from "../lib/progress";
import "../styles/dashboard.css";

/** One review session over every pattern with flashcards due (or one pattern: #/review/<slug>). */
export default function ReviewSession() {
  const { slug } = useParams();
  const [queue, setQueue] = useState<string[] | null>(null);
  const [i, setI] = useState(0);
  const [quiz, setQuiz] = useState<PatternQuiz | null>(null);
  const [names, setNames] = useState<Record<string, string>>({});
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    let live = true;
    loadProgressData().then((d) => {
      if (!live) return;
      const p = computeProgress(d);
      setNames(Object.fromEntries(p.due.map((x) => [x.slug, x.name])));
      const due = p.due.filter((x) => x.cards > 0).map((x) => x.slug);
      setQueue(slug ? (d[`deck:${slug}`] || ALL_PATTERNS.some((x) => x.slug === slug) ? [slug] : []) : due);
      setI(0);
    });
    return () => { live = false; };
  }, [slug]);

  const current = queue?.[i];
  useEffect(() => {
    setQuiz(null);
    if (!current) return;
    let live = true;
    // decks of comparisons and case studies have no base cards: just the questions the learner missed
    void loadQuiz(current).then((q) => { if (live) setQuiz(q ?? { slug: current, questions: [], cards: [] }); });
    return () => { live = false; };
  }, [current]);

  const next = () => { setI((n) => n + 1); window.setTimeout(() => heading.current?.focus(), 0); };
  const name = (s: string) => ALL_PATTERNS.find((p) => p.slug === s)?.name ?? names[s] ?? s;

  return (
    <div className="page">
      <div className="review-head">
        <h1 ref={heading} tabIndex={-1}>Review session</h1>
        <Link to="/dashboard">← Back to your progress</Link>
      </div>
      {queue === null && <p className="muted-text">Finding the cards that are due…</p>}
      {queue && queue.length === 0 && (
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Nothing is due</h2>
          <p className="muted-text">Cards come back here when it's time to review them. Start a deck from any pattern's <em>Check yourself</em> section.</p>
          <Link className="btn" to="/patterns">Browse patterns</Link>
        </div>
      )}
      {queue && queue.length > 0 && i >= queue.length && (
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Session complete</h2>
          <p>You reviewed {queue.length === 1 ? name(queue[0]) : `${queue.length} patterns`}. Each card is now scheduled for the day you're about to forget it.</p>
          <Link className="btn primary" to="/dashboard">See your progress</Link>
        </div>
      )}
      {queue && current && (
        <>
          {queue.length > 1 && (
            <>
              <p className="muted-text" style={{ margin: 0 }}>Pattern {i + 1} of {queue.length}: {queue.map(name).join(", ")}</p>
              <div className="review-progress" role="progressbar" aria-label="Session progress" aria-valuemin={0} aria-valuemax={queue.length} aria-valuenow={i}>
                <div style={{ width: `${(i / queue.length) * 100}%` }} />
              </div>
            </>
          )}
          <h2 style={{ margin: 0 }}>{ALL_PATTERNS.some((p) => p.slug === current) ? <Link to={`/patterns/${current}`}>{name(current)}</Link> : name(current)}</h2>
          {!quiz ? <p className="muted-text">Loading cards…</p> : (
            <SessionDeck key={current} quiz={quiz} name={name(current)} last={i === queue.length - 1} onNext={next} />
          )}
        </>
      )}
    </div>
  );
}

function SessionDeck({ quiz, name, last, onNext }: { quiz: PatternQuiz; name: string; last: boolean; onNext: () => void }) {
  const api = useDeck(quiz.slug, quiz.cards);
  return (
    <Flashcards deckApi={api} patternName={name}
      doneExtra={<button type="button" className="btn primary" onClick={onNext}>{last ? "Finish session" : "Next pattern →"}</button>} />
  );
}
