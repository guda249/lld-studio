import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { Lang, PatternLesson } from "../content/types";
import { PATTERNS } from "../content/patterns";
import { loadExercise, loadLesson } from "../content/lessons";
import { loadKata } from "../content/extras/load";
import type { Kata } from "../content/extras/types";
import CodePanel from "../components/CodePanel";
import type { Exercise, Finding, Report, UmlModel } from "../review/types";
import { LangTabs, useCodeLang } from "../components/CodePanel";
import CodeEditor, { type CodeEditorHandle } from "../scratch/CodeEditor";
import UmlEditor from "../scratch/UmlEditor";
import { codeToUml } from "../review/uml";
import {
  type Attempt, type Draft, connectFolder, connectedFolder, download, emptyDiagram, exportZip, folderSupported, forgetFolder,
  importZip, listAttempts, loadDraft, saveAttempt, saveDraft, writeToFolder
} from "../scratch/storage";
import { usePreference } from "../components/usePreference";
import { logActivity } from "../lib/progress";

const SEV: Record<Finding["sev"], { icon: string; label: string }> = {
  fail: { icon: "✗", label: "Problem" }, warn: { icon: "⚠", label: "Improve" }, note: { icon: "ℹ", label: "Note" }, pass: { icon: "✓", label: "Good" }
};

export default function ScratchPad() {
  const { slug: routeSlug, kata: kataId } = useParams();
  const navigate = useNavigate();
  const [lastSlug, setLastSlug] = usePreference<string>("scratchSlug", "strategy");
  // kata mode (#/scratch-pad/kata/<id>): the kata's starter code, checked by its pattern's rules
  const [kata, setKata] = useState<Kata | null | undefined>(kataId ? undefined : null);
  const [showSolution, setShowSolution] = useState(false);
  useEffect(() => {
    setShowSolution(false);
    if (!kataId) { setKata(null); return; }
    setKata(undefined);
    void loadKata(kataId).then((k) => { if (k) setKata(k); else navigate("/katas", { replace: true }); });
  }, [kataId]); // eslint-disable-line react-hooks/exhaustive-deps
  const slug = kata ? kata.slug : PATTERNS.some((p) => p.slug === routeSlug) ? routeSlug! : PATTERNS.some((p) => p.slug === lastSlug) ? lastSlug : "strategy";
  const draftKey = kata ? `kata-${kata.id}` : slug;
  const ready = kata !== undefined;
  const info = PATTERNS.find((p) => p.slug === slug)!;
  const [lang, setLang] = useCodeLang();
  const [lesson, setLesson] = useState<PatternLesson | null>(null);
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [tab, setTab] = useState<"code" | "diagram">("code");
  const [report, setReport] = useState<Report | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hints, setHints] = useState(0);
  const [confirmReset, setConfirmReset] = useState(false);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [folder, setFolder] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const editor = useRef<CodeEditorHandle>(null);
  const saveTimer = useRef<number | undefined>(undefined);
  const importInput = useRef<HTMLInputElement>(null);
  const reportBox = useRef<HTMLDivElement>(null);

  useEffect(() => { if (kataId) return; if (routeSlug !== slug) navigate(`/scratch-pad/${slug}`, { replace: true }); setLastSlug(slug); }, [slug, kataId]); // eslint-disable-line react-hooks/exhaustive-deps

  // load lesson (for the starting code), exercise and the saved draft
  useEffect(() => {
    let live = true;
    setDraft(null); setReport(null); setHints(0); setError(null); setConfirmReset(false);
    if (!ready) return;
    Promise.all([loadLesson(slug), loadExercise(slug), loadDraft(draftKey), listAttempts(slug)]).then(([l, ex, d, at]) => {
      if (!live || !l) return;
      const start = kata ? kata.starter : l.problem.code;
      setLesson(l); setExercise(ex); setAttempts(at.filter((a) => (a.kata ?? null) === (kata?.id ?? null)));
      setDraft(d ?? { slug: draftKey, python: start.python, scala: start.scala, diagram: emptyDiagram(), updatedAt: Date.now() });
    });
    return () => { live = false; };
  }, [slug, draftKey, ready]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { connectedFolder().then((h) => setFolder(h ? h.name : null)).catch(() => setFolder(null)); }, []);

  const update = useCallback((patch: Partial<Draft>) => {
    setDraft((d) => {
      if (!d) return d;
      const next = { ...d, ...patch, updatedAt: Date.now() };
      window.clearTimeout(saveTimer.current);
      saveTimer.current = window.setTimeout(() => { saveDraft(next); }, 500);
      return next;
    });
  }, []);
  useEffect(() => () => window.clearTimeout(saveTimer.current), []);

  const code = draft ? draft[lang] : "";

  async function runReview() {
    if (!draft) return;
    setReviewing(true); setError(null);
    try {
      const { review } = await import("../review/index");
      const r = await review({ slug, lang, code: draft[lang], diagram: draft.diagram });
      setReport(r);
      const a: Attempt = { id: String(r.createdAt), slug, lang, code: draft[lang], diagram: draft.diagram, report: r, createdAt: r.createdAt, ...(kata ? { kata: kata.id } : {}) };
      await saveAttempt(a);
      void logActivity("reviews");
      setAttempts((await listAttempts(slug)).filter((x) => (x.kata ?? null) === (kata?.id ?? null)));
      if (folder) {
        const ok = await writeToFolder(a).catch(() => false);
        setToast(ok ? `Saved to your folder "${folder}".` : "Couldn't write to your folder (permission). The attempt is saved in this browser.");
      }
      window.setTimeout(() => reportBox.current?.focus(), 0);
    } catch (e) {
      setError(`The code reader couldn't start: ${(e as Error).message}. Check that the page was fully loaded and try again.`);
    } finally {
      setReviewing(false);
    }
  }

  const fromCode = useCallback(async (): Promise<UmlModel> => {
    const { readCode } = await import("../review/index");
    return codeToUml(await readCode(draft ? draft[lang] : "", lang));
  }, [draft, lang]);

  const groups = useMemo(() => {
    if (!report) return [];
    return (["fail", "warn", "note", "pass"] as const).map((s) => ({ s, items: report.findings.filter((f) => f.sev === s) })).filter((g) => g.items.length);
  }, [report]);

  return (
    <div className="page scratch">
      <div className="pattern-head">
        <h1>Scratch pad</h1>
        <p className="lede">Write the pattern in Python or Scala, draw its class diagram, and get a plain-English review. Your code is read, never run, and never leaves this browser.</p>
      </div>

      <div className="card scratch-bar">
        <label className="scratch-pick">Pattern
          <select value={slug} onChange={(e) => navigate(`/scratch-pad/${e.target.value}`)}>
            {PATTERNS.map((p) => <option key={p.slug} value={p.slug}>{p.name}</option>)}
          </select>
        </label>
        <LangTabs lang={lang} setLang={(l: Lang) => { setLang(l); setReport(null); }} label="Code language" />
        <span className="spacer" />
        <div className="scratch-store">
          {folderSupported() && (folder
            ? <><span className="small-text">Saving reviews to folder <strong>{folder}</strong></span><button type="button" className="btn" onClick={async () => { await forgetFolder(); setFolder(null); }}>Disconnect</button></>
            : <button type="button" className="btn" onClick={async () => { try { setFolder(await connectFolder()); setToast("Folder connected. Every review is also written there."); } catch { /* cancelled */ } }}>Connect workspace folder</button>)}
          <button type="button" className="btn" onClick={async () => download(await exportZip(), `lldstudio-workspace-${new Date().toISOString().slice(0, 10)}.zip`)}>Export ZIP</button>
          <button type="button" className="btn" onClick={() => importInput.current?.click()}>Import ZIP</button>
          <input ref={importInput} type="file" accept=".zip,application/zip" hidden onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f) return;
            try {
              const n = await importZip(f);
              setToast(`Imported ${n} item${n === 1 ? "" : "s"}.`);
              const d = await loadDraft(draftKey);
              if (d) setDraft(d);
              setAttempts(await listAttempts(slug));
            } catch (err) { setToast((err as Error).message); }
          }} />
        </div>
      </div>
      {toast && <div className="toast" role="status">{toast} <button type="button" className="btn link" onClick={() => setToast(null)}>Dismiss</button></div>}

      {kata ? (
        <section className="card exercise" aria-labelledby="ex-h">
          <h2 id="ex-h">Kata: {kata.title}</h2>
          <p className="small-text muted-text">{kata.domain} · {"★".repeat(kata.difficulty)}{"☆".repeat(3 - kata.difficulty)} · checked as {info.name}</p>
          <p>{kata.task}</p>
          <h3>A good answer has</h3>
          <ul className="ticks">{kata.goals.map((g) => <li key={g}>{g}</li>)}</ul>
          {kata.hints.slice(0, hints).map((h, i) => <p key={i} className="q-hint"><strong>Hint {i + 1}:</strong> {h}</p>)}
          <div className="actions">
            {hints < kata.hints.length && <button type="button" className="btn" onClick={() => setHints(hints + 1)}>{hints ? "Another hint" : "Show a hint"}</button>}
            <button type="button" className="btn" aria-expanded={showSolution} onClick={() => setShowSolution(!showSolution)}>{showSolution ? "Hide the solution" : "Show a solution"}</button>
            <Link className="btn link" to={`/katas?pattern=${slug}`}>More katas</Link>
            <Link className="btn link" to={`/patterns/${slug}`}>Open the {info.name} lesson</Link>
          </div>
          {showSolution && <CodePanel code={kata.solution} title="One good solution" note="Try your own first: there is more than one right answer, and the review tells you if yours works." maxHeight={420} />}
        </section>
      ) : (
      <section className="card exercise" aria-labelledby="ex-h">
        <h2 id="ex-h">Exercise: {info.name}</h2>
        <p>{exercise?.task ?? `The code below is the "before" version from the ${info.name} lesson. Refactor it into the ${info.name} pattern, then ask for a review.`}</p>
        {exercise && (
          <>
            <h3>A good answer has</h3>
            <ul className="ticks">{exercise.goals.map((g) => <li key={g}>{g}</li>)}</ul>
            {exercise.hints.slice(0, hints).map((h, i) => <p key={i} className="q-hint"><strong>Hint {i + 1}:</strong> {h}</p>)}
            <div className="actions">
              {hints < exercise.hints.length && <button type="button" className="btn" onClick={() => setHints(hints + 1)}>{hints ? "Another hint" : "Show a hint"}</button>}
              <Link className="btn link" to={`/patterns/${slug}`}>Open the {info.name} lesson</Link>
              <Link className="btn link" to={`/katas?pattern=${slug}`}>Try a kata</Link>
            </div>
          </>
        )}
      </section>
      )}

      <div className={"scratch-grid" + (tab === "diagram" ? " wide" : "")}>
        <section className="card scratch-work" aria-label="Your work">
          <div className="view-tabs" role="tablist" aria-label="Code or diagram">
            <button type="button" role="tab" className="view-tab" aria-selected={tab === "code"} tabIndex={tab === "code" ? 0 : -1} onClick={() => setTab("code")}>
              {lang === "python" ? "solution.py" : "Solution.scala"}
            </button>
            <button type="button" role="tab" className="view-tab" aria-selected={tab === "diagram"} tabIndex={tab === "diagram" ? 0 : -1} onClick={() => setTab("diagram")}>
              Class diagram{draft?.diagram.classes.length ? ` (${draft.diagram.classes.length})` : ""}
            </button>
          </div>
          {!draft ? <p className="muted-text">Loading…</p> : (
            <>
              <div hidden={tab !== "code"} className="editor-wrap">
                <CodeEditor ref={editor} value={code} lang={lang} label={`${info.name} solution in ${lang === "python" ? "Python" : "Scala 3"}`}
                  onChange={(s) => update({ [lang]: s } as Partial<Draft>)} />
                <p className="small-text muted-text">Saved in this browser as you type. Keyboard: Tab indents; press Esc then Tab to leave the editor.</p>
              </div>
              <div hidden={tab !== "diagram"}>
                <UmlEditor value={draft.diagram} onChange={(diagram) => update({ diagram })} fromCode={fromCode} />
              </div>
              <div className="actions">
                <button type="button" className="btn primary" onClick={runReview} disabled={reviewing}>{reviewing ? "Reading your code…" : "Review my design"}</button>
                <button type="button" className="btn" onClick={() => {
                  if (!confirmReset) { setConfirmReset(true); return; }
                  setConfirmReset(false);
                  if (kata) update({ [lang]: kata.starter[lang] } as Partial<Draft>);
                  else if (lesson) update({ [lang]: lesson.problem.code[lang] } as Partial<Draft>);
                }}>{confirmReset ? "Replace my code? Click again" : "Start over"}</button>
                {confirmReset && <button type="button" className="btn" onClick={() => setConfirmReset(false)}>Keep my code</button>}
              </div>
            </>
          )}
        </section>

        <section className="card scratch-review" aria-labelledby="rev-h" ref={reportBox} tabIndex={-1}>
          <h2 id="rev-h">Review</h2>
          {error && <div className="notice warn">{error}</div>}
          {!report && !error && (
            <p className="muted-text">Press <strong>Review my design</strong>. The first review loads the code reader (a few seconds; after that it's instant and works offline). Draw your class diagram too, and the review checks it against your code.</p>
          )}
          {report && (
            <>
              <div className="score-row">
                <span className="score-big" aria-label={`Score ${report.score} out of 100`}>{report.score}<small>/100</small></span>
                <span className={"chip " + (report.patternFound ? "ok-chip" : "warn-chip")}>{report.patternFound ? `${info.name} recognised` : `${info.name} not found yet`}</span>
              </div>
              <p className="review-summary">{report.summary}</p>
              {groups.map((g) => (
                <div key={g.s} className="finding-group">
                  <h3 className={`sev-${g.s}`}>{SEV[g.s].icon} {SEV[g.s].label} ({g.items.length})</h3>
                  <ul className="findings">
                    {g.items.map((f, i) => (
                      <li key={f.id + i} className={`finding sev-${f.sev}`}>
                        <span className="f-icon" aria-hidden="true">{SEV[f.sev].icon}</span>
                        <div>
                          <strong>{f.title}</strong>
                          <p>{f.text}</p>
                          {f.fix && <p className="f-fix"><strong>How to fix:</strong> {f.fix}</p>}
                          <div className="f-actions">
                            {f.line && <button type="button" className="btn link" onClick={() => { setTab("code"); window.setTimeout(() => editor.current?.gotoLine(f.line!), 0); }}>Go to line {f.line}</button>}
                            {f.lesson && <Link className="btn link" to={`/patterns/${slug}`}>Read about it in the lesson</Link>}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <button type="button" className="btn" onClick={() => download(new Blob([report.markdown], { type: "text/markdown" }), `${slug}-review.md`)}>Download review.md</button>
            </>
          )}
          {attempts.length > 0 && (
            <details className="attempts">
              <summary>Your attempts ({attempts.length})</summary>
              <ul>
                {attempts.slice(0, 20).map((a) => (
                  <li key={a.id}>
                    <span>{new Date(a.createdAt).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} · {a.lang === "python" ? "Python" : "Scala"} · <strong>{a.report.score}</strong>/100</span>
                    <button type="button" className="btn link" onClick={() => { setLang(a.lang); update({ [a.lang]: a.code, diagram: a.diagram } as Partial<Draft>); setReport(a.report); setTab("code"); }}>Open</button>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </section>
      </div>
    </div>
  );
}
