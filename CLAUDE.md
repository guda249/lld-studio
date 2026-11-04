# CLAUDE.md: rules for working on LLD Studio

LLD Studio teaches Low-Level Design (UML, SOLID, 22 GoF patterns) to rookies, and is a fast refresher for
seniors. Read `docs/decisions.md` and `docs/design-system.md` before changing anything visual or architectural.

## Hard rules (never break without the owner's written approval)
- **Stay inside this project folder.** Never read, create, change or delete anything outside it. No global installs,
  no `sudo`, no changes to system or user settings. The only commands needed are in `package.json` scripts
  (`npm install`, `npm run dev`, `npm run build`, `npm run preview`). Ask before running anything else.
- **Never push or publish** (no `git push`, no deploys) unless the owner asks in that conversation.
- **Free and open-source only.** No paid APIs, services or models. No AI features at all (not even local models).
- **Fully static.** No backend, no server, no Docker. Must build to `dist/` and run on GitHub Pages / Cloudflare Pages.
- **Code is never executed.** The scratch-pad review reads code with tree-sitter (see `tools/code-reading-check`)
  and applies rules that produce plain-English feedback.
- **Learner data stays in the learner's browser** (IndexedDB; workspace folder on Chrome/Edge; ZIP export/import everywhere).
- **Works in every modern browser.** Features that only some browsers have (folder access) are extras, never required.
- **Default example languages: Python 3.12 and Scala 3.** Every lesson snippet must run as-is
  (Python with imports and `print`, Scala with `@main def demo(): Unit =`). Scala uses Scala 3 indentation syntax.
- **Original content only.** Refactoring.Guru is a reference; never copy its text or illustrations.
- Use exact, pinned dependency versions that are at least two weeks old.

## How we work
- Small, reviewable steps; each ends with `npm run build` passing and a short note of what changed.
- Prototypes in `public/prototypes/` are the **approved behaviour and look**. When porting, match them;
  if something must differ, say why.
- Accessibility: keyboard reachable, visible focus, 44 px touch targets, `prefers-reduced-motion` respected,
  colour never the only signal, light and dark themes.
- Phones: never shrink a desktop diagram into unreadable text. Use the portrait/stacked layout
  (see `docs/design-system.md`, "Layout rules").

## Notion (source of truth for content and decisions)
See `docs/notion-links.md`. Lesson text, SOLID and pattern reference pages, templates and decisions live there.
