# Phase 1: vertical slice (app shell + UML Basics + Strategy, end to end)

Goal: one pattern (Strategy) and one UML lesson fully built as real app components, matching the approved prototypes
in `public/prototypes/`, on desktop and phone. Exit: `npm run build` passes; everything below works with keyboard,
in light and dark themes, and with reduced motion.

Work in this order. Finish and show each step before starting the next.

1. **Content model.** TypeScript types + data files for a pattern lesson: story steps (title, what, why, spoken text,
   highlighted lines per language), runnable code (Python + Scala), real-world examples (situation, strategies,
   why, good-to-know, mini-diagram config, walkthrough steps, Try-it config), quiz questions, flashcards.
   Move the Strategy content out of the prototypes into `src/content/patterns/strategy/`.
2. **Code panel component.** Port the tolerant highlighter; Python / Scala tabs shared across the page;
   highlighted + dimmed lines; long lines scroll sideways; colour legend.
3. **Animation engine.** Install GSAP (pinned) and port the step engine: labelled steps, previous / play all / next /
   replay / step bar / speed, voice-over (Web Speech API, off by default, Play waits for narration),
   reduced motion. Strategy story animation (8 steps) built on it.
4. **Real-world examples.** Reusable mini-diagram engine (client → context → interface ← 3 strategies, ring,
   call/result pills, fallback and extends arrows), walkthrough runner, Try-it widgets for the 4 Strategy examples.
5. **Pattern page.** Assemble per `docs/design-system.md` layout rules (see mockups 4b / 4c), including UML
   class + sequence tabs, participants, when / avoid, confused with, SOLID, previous / next. Phone: portrait stage.
6. **Quiz + flashcards.** Port the component (6 question types, hints, results, retry, add missed to flashcards);
   flashcards with SM-2-lite. Store progress and decks in IndexedDB (add a pinned, free IndexedDB helper such as Dexie).
7. **UML Basics: relationships lesson.** Port the six-relationship lesson and its practice round on the same engines.
8. **Remove the prototype iframes** for Strategy and UML once the components match them.
9. **Checks.** Add Vitest unit tests for the highlighter, the SM-2 scheduler and the quiz grading; manual checklist
   for keyboard, themes, reduced motion and a 390 px wide phone.
