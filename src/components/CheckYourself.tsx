import { useState } from "react";
import type { PatternQuiz } from "../anim/types";
import Quiz from "./Quiz";
import Flashcards, { dueCount, useDeck } from "./Flashcards";

/** Quiz + flashcards for one pattern (end of every pattern page). */
export default function CheckYourself({ quiz, patternName, onReview, deckTitle }: { quiz: PatternQuiz; patternName: string; onReview: () => void; deckTitle?: string }) {
  const [view, setView] = useState<"quiz" | "cards">("quiz");
  const deckApi = useDeck(quiz.slug, quiz.cards, deckTitle);
  const due = dueCount(deckApi.deck);
  return (
    <div className="check">
      <div className="view-tabs" role="tablist" aria-label="Check yourself">
        <button type="button" role="tab" className="view-tab" aria-selected={view === "quiz"} tabIndex={view === "quiz" ? 0 : -1} onClick={() => setView("quiz")}>Quiz</button>
        <button type="button" role="tab" className="view-tab" aria-selected={view === "cards"} tabIndex={view === "cards" ? 0 : -1} onClick={() => setView("cards")}>
          Flashcards{due ? ` (${due} due)` : ""}
        </button>
      </div>
      {view === "quiz"
        ? <Quiz quiz={quiz} patternName={patternName} onReview={onReview} onAddCards={deckApi.add} onGoToCards={() => setView("cards")} />
        : <Flashcards deckApi={deckApi} patternName={patternName} />}
    </div>
  );
}
