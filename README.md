# LLD Studio

Learn Low-Level Design: UML, SOLID and the 22 classic design patterns, with step-by-step animations,
real-world examples, and runnable code in **Python** and **Scala 3**.

- Fully static: no server, no accounts, no AI. Code is read, never run.
- Learner progress stays in the learner's own browser (with folder / ZIP backup).
- Free and open-source tools only.

## Run it on your computer

Requirements: [Node.js](https://nodejs.org/) 20 or newer (includes npm).

```bash
npm install        # once
npm run dev        # starts http://localhost:5173 and opens your browser
```

Stop it with `Ctrl+C`.

### Test the production build locally (what will be deployed)

```bash
npm run build      # type-checks and builds into dist/
npm run preview    # serves dist/ at http://localhost:4173
```

If both work, the same `dist/` folder can be deployed to Cloudflare Pages (see `docs/deploy.md`: build command,
`SITE_URL`, security headers). The code is minified and has no source maps.

### Checks

```bash
npm test           # unit tests, a content check of all 22 patterns and the UML lesson,
                   # and review tests for every pattern (Python + Scala)
npm test -- "review: observer"   # only the tests whose name contains the text
```

### Double-click version (no commands, no server)

```bash
npm run build:standalone
```

Creates `dist-standalone/`: an `index.html` with all the app's code packed inside, plus `prototypes/`.
Double-click `index.html` to open it in your browser. It works offline too (fonts are packed in). Pages use `/` addresses here.

### Feedback address

"Suggest a correction" emails go to the address in `src/config.ts`:

```ts
export const FEEDBACK = { user: "your.name", domain: "gmail.com" };
```

Leave both empty to hide the email button (visitors can still copy their report).

Optional: send reports into a free Google Form instead, without visitors leaving the page. Make a form whose
questions are all "Short answer" or "Paragraph" (page, link, problem type, what's wrong, correction, name, browser),
then fill in `GOOGLE_FORM` in `src/config.ts` with the form id (from `.../forms/d/e/<id>/viewform`) and each
question's `entry.NNN` id (Form menu ⋮ → "Get pre-filled link" shows them). Answers collect in the form's Sheet.

### Checking the Scala code

Download the official Scala 3 compiler once (free, Apache-2.0) into `.tools/` (ignored by git):

```bash
mkdir -p .tools && cd .tools
curl -LO https://github.com/scala/scala3/releases/download/3.3.8/scala3-3.3.8.tar.gz
tar xzf scala3-3.3.8.tar.gz && cd ..
npm run check:scala      # compiles and runs every Scala example (needs Java)
```

## What's in here

| Path | What it is |
| --- | --- |
| `src/` | The app (React + TypeScript + Vite). Clean addresses like `/patterns/strategy` on the website; `/` in the double-click build. |
| `src/content/patterns.ts` | The 22-pattern catalog (category, problem lens, difficulty, confused-with). |
| `src/content/patterns/<slug>/` | One folder per pattern: `lesson.ts` (text), `code/` (runnable Python + Scala files), `animation.ts` (story, examples, sequence diagram), `quiz.ts` (quiz + flashcards), `exercise.ts` (scratch-pad task, goals, hints). |
| `src/anim/` | The animation engine: diagrams, GSAP step timelines, story player, real-world examples, Try it. |
| `src/content/compare/`, `cases/`, `katas/` | Phase 6 extras as data + real code files (types in `src/content/extras/types.ts`, checks in `extras.test.ts`). |
| `src/review/` | The scratch-pad review: tree-sitter code reader (`parser.ts`, `model.ts`, grammars), per-pattern rules + test cases (`rules/`), diagram-vs-code check (`uml.ts`). |
| `src/lib/progress.ts` | Progress tracking (lessons opened, quiz history, activity per day) and the dashboard's numbers (tested in `progress.test.ts`). |
| `src/scratch/` | Scratch-pad editor (CodeMirror), class-diagram editor, saving (browser storage, workspace folder, ZIP). |
| `src/content/uml/` | UML Basics lesson content (the six relationships). |
| `src/styles/tokens.css` | Design tokens: colours (light + dark), UML colour palette, fonts. |
| `public/prototypes/` | The approved interactive prototypes (Strategy animation + examples, UML relationships lesson, quiz + flashcards), kept as the reference for look and behaviour. |
| `tools/code-reading-check/` | Proof that Python and Scala 3 can be read in the browser and reviewed (tree-sitter). |
| `docs/` | Decisions, design system, roadmap, deployment notes, and the Phase 1 task list. |
| `CLAUDE.md` | Project rules for Claude Code. |

Note: the prototypes and fonts load GSAP and IBM Plex from public CDNs, so the first local run needs an
internet connection. Phase 1 bundles GSAP into the app.

## Status

Phase 1 is built: app shell, the animation engine, code panels, quiz + flashcards (saved in the browser),
the UML Basics relationships lesson, and **all 22 patterns** with story animation, four animated real-world
examples with Try it, UML class + sequence diagrams, participants, classic + idiomatic code, quiz and flashcards.

Phases 3+4 are built: the **scratch pad** (`/scratch-pad/<pattern>`, or "Practise" on a pattern page). Each pattern
has an exercise that starts from its problem code. Write Python or Scala, optionally draw the class diagram, and
press "Review my design" for a score and plain-English findings with line links and fixes. Drafts and attempts stay
in the browser; export / import a ZIP anywhere, or connect a workspace folder in Chrome / Edge.

Phase 5 is built: the **dashboard** (`/dashboard`) shows patterns mastered, a colour-and-label pattern map,
coverage by category, day streak, quiz and review averages, learning minutes for the last 7 days, flashcards due
(with a **review session** at `/review`), the scratch-pad score trend and recent attempts. Progress survives closing
the browser and can be exported / imported as a ZIP.

Phase 6 is built: **Compare look-alikes** (`/compare`, 8 side-by-side comparisons), **LLD case studies**
(`/case-studies`, 9 interview problems with full Python + Scala designs), **refactoring katas** (`/katas`, one per
pattern, reviewed in the scratch pad) and 4 **concurrency patterns** (Producer–Consumer, Thread Pool, Read–Write Lock,
Thread-safe Singleton) in the pattern catalog.

Also built: **UML Basics** as 9 lessons plus a notation lab (`/uml`), an **OOP & SOLID** primer (`/solid`),
**anti-patterns** (`/anti-patterns`), site **search** (`/search`) and **Save SVG / PNG** for diagrams.

See `docs/decisions.md`.

## Licence

- **Source code**: MIT, see [`LICENSE`](LICENSE).
- **Learning content** (lessons, quizzes, diagrams, the Python and Scala examples in `src/content/`, images):
  [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/), see [`LICENSE-CONTENT.md`](LICENSE-CONTENT.md).
- Fonts, grammars and libraries keep their own licences (listed on the site's About page).

Made by Uma Shanker Guda ([LinkedIn](https://www.linkedin.com/in/guda-uma-shanker/)). Source: https://github.com/guda249/lld-studio

