import { useCallback, useEffect, useRef, useState } from "react";
import type { Flashcard, QuizLang } from "../anim/types";
import { formatInterval, freshState, rate, RATINGS, schedule, type CardState, type Rating } from "../lib/sm2";
import { getItem, setItem } from "../lib/store";
import { CodeLines } from "./CodePanel";
import { useReducedMotion } from "../lib/motion";
import { logActivity } from "../lib/progress";

export interface NewCard { id: string; front: string; back: string; code?: { lang: QuizLang; text: string }; src?: string }
type DeckCard = NewCard & CardState;
interface Deck { cards: DeckCard[]; /** shown in review sessions for decks that are not a pattern */ title?: string }

const LABELS: Record<Rating, string> = { again: "Again", hard: "Hard", good: "Good", easy: "Easy" };

/** Loads a deck (saved schedule + any new base cards) and keeps it saved in the browser. */
export function useDeck(slug: string, base: Flashcard[], title?: string) {
  const [deck, setDeck] = useState<Deck | null>(null);
  const key = `deck:${slug}`;
  useEffect(() => {
    let live = true;
    getItem<Deck>(key).then((saved) => {
      if (!live) return;
      const cards = saved?.cards ? [...saved.cards] : [];
      for (const c of base) if (!cards.some((d) => d.id === c.id)) cards.push({ ...c, ...freshState() });
      setDeck({ cards, ...(title ? { title } : {}) });
    });
    return () => { live = false; };
  }, [key, base]);
  const save = useCallback((d: Deck) => { const x = title ? { ...d, title } : d; setDeck(x); setItem(key, x); }, [key, title]);
  const add = useCallback(async (newCards: NewCard[]) => {
    const current = deck ?? { cards: [] };
    const fresh = newCards.filter((c) => !current.cards.some((d) => d.id === c.id));
    save({ cards: [...current.cards, ...fresh.map((c) => ({ ...c, ...freshState() }))] });
    return fresh.length;
  }, [deck, save]);
  const reset = useCallback(() => save({ cards: base.map((c) => ({ ...c, ...freshState() })) }), [base, save]);
  return { deck, save, add, reset };
}

export function dueCount(deck: Deck | null, now = Date.now()): number {
  return deck ? deck.cards.filter((c) => c.due <= now).length : 0;
}

interface Props {
  deckApi: ReturnType<typeof useDeck>;
  patternName: string;
  /** Shown under "All caught up" (the review session puts its "Next pattern" button here). */
  doneExtra?: React.ReactNode;
}

/** Flashcards with simplified SM-2 scheduling: flip, rate Again / Hard / Good / Easy. */
export default function Flashcards({ deckApi, patternName, doneExtra }: Props) {
  const { deck, save, reset } = deckApi;
  const reduce = useReducedMotion();
  const [session, setSession] = useState<string[] | null>(null);
  const [flipped, setFlipped] = useState(false);
  const showBtn = useRef<HTMLButtonElement>(null);
  const goodBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (deck && session === null) setSession(deck.cards.filter((c) => c.due <= Date.now()).map((c) => c.id));
  }, [deck, session]);

  if (!deck || session === null) return <p className="muted-text">Loading your deck…</p>;

  const now = Date.now();
  const due = deck.cards.filter((c) => c.due <= now).length;
  const nextCard = deck.cards.filter((c) => c.due > now).sort((a, b) => a.due - b.due)[0];
  const card = session.length ? deck.cards.find((c) => c.id === session[0]) : undefined;

  function flip() {
    if (!card || flipped) return;
    setFlipped(true);
    window.setTimeout(() => goodBtn.current?.focus(), reduce ? 0 : 300);
  }
  function doRate(r: Rating) {
    if (!card || !flipped || !session) return;
    const updated = rate(card, r);
    void logActivity("cards");
    save({ cards: deck!.cards.map((c) => (c.id === card.id ? { ...c, ...updated } : c)) });
    const rest = session.slice(1);
    setSession(r === "again" ? [...rest, card.id] : rest);
    setFlipped(false);
    window.setTimeout(() => showBtn.current?.focus(), 0);
  }

  return (
    <div
      className="cards-panel"
      onKeyDown={(e) => {
        const tag = (e.target as HTMLElement).tagName;
        if (e.key === " " && !flipped && tag !== "BUTTON") { e.preventDefault(); flip(); }
        const n = Number(e.key);
        if (flipped && n >= 1 && n <= 4) { e.preventDefault(); doRate(RATINGS[n - 1]); }
      }}
    >
      <div className="deck-stats">
        <span><strong>{session.length}</strong> left in this session</span>
        <span><strong>{due}</strong> due of {deck.cards.length} cards</span>
        {nextCard && <span>Next review: <strong>{new Date(nextCard.due).toLocaleDateString(undefined, { day: "numeric", month: "short" })}</strong></span>}
      </div>
      {!card ? (
        <div className="card done-box">
          <h3>All caught up</h3>
          <p className="muted-text">
            {nextCard
              ? `The next card comes back on ${new Date(nextCard.due).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" })}. Reviewing just before you'd forget is what makes it stick.`
              : "No cards yet."}
          </p>
          {doneExtra}
          <button className="btn" type="button" onClick={() => { setSession(deck.cards.map((c) => c.id)); setFlipped(false); }}>Review all cards anyway</button>
        </div>
      ) : (
        <div className="fc-scene">
          <div className={"fc-inner" + (flipped ? " flipped" : "")}>
            <div className="fc-face fc-front" aria-hidden={flipped}>
              <span className="fc-kicker">{card.src ?? patternName}{card.reps ? ` · reviewed ${card.reps}×` : " · new"}</span>
              <p className="fc-text">{card.front}</p>
              {card.code && <pre className="code"><CodeLines text={card.code.text} lang={card.code.lang} /></pre>}
              <span className="grow" />
              <button ref={showBtn} className="btn primary" type="button" tabIndex={flipped ? -1 : 0} onClick={flip}>Show answer</button>
            </div>
            <div className="fc-face fc-back" aria-hidden={!flipped}>
              <span className="fc-kicker">Answer</span>
              <p className="fc-text small">{card.front}</p>
              <p className="fc-answer">{card.back}</p>
              <span className="grow" />
              <div>
                <div className="fc-kicker" style={{ marginBottom: 8 }}>How well did you remember it?</div>
                <div className="ratings" role="group" aria-label="Rate your recall">
                  {RATINGS.map((r, i) => (
                    <button key={r} ref={r === "good" ? goodBtn : undefined} type="button" className={"rate " + r}
                      tabIndex={flipped ? 0 : -1} onClick={() => doRate(r)}>
                      {LABELS[r]} <small>{i + 1} · {formatInterval(schedule(card, r).ivl)}</small>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="actions">
        <span className="kbd">Keyboard: space shows the answer, 1–4 rate it.</span>
        <span className="spacer" />
        <button className="btn" type="button" onClick={() => { reset(); setSession(null); setFlipped(false); }}>Reset this deck</button>
      </div>
    </div>
  );
}
