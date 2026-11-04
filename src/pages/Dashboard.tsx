import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { CATEGORY_INFO } from "../content/patterns";
import { UML_LESSONS, guideCount } from "../content/guides/load";
import { ago, computeProgress, loadProgressData, MASTERY, type Progress, type Status } from "../lib/progress";
import { storageMode } from "../lib/store";
import "../styles/dashboard.css";

const STATUS: Record<Status, { label: string; mark: string }> = {
  none: { label: "Not started", mark: "" },
  learning: { label: "Learning", mark: "○" },
  practised: { label: "Practised", mark: "●" },
  mastered: { label: "Mastered", mark: "✓" }
};
const pct = (x: number | null) => (x === null ? "–" : `${Math.round(x * 100)}%`);
const LANG = { python: "Python", scala: "Scala" } as Record<string, string>;

export default function Dashboard() {
  const [p, setP] = useState<Progress | null>(null);
  const [mode, setMode] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => setP(computeProgress(await loadProgressData())), []);
  useEffect(() => { void load(); void storageMode().then(setMode); }, [load]);

  async function exportAll() {
    const s = await import("../scratch/storage");
    s.download(await s.exportZip(), `lldstudio-progress-${new Date().toISOString().slice(0, 10)}.zip`);
    setToast("Progress exported. Keep the ZIP somewhere safe, or import it on another device.");
  }
  async function importAll(f: File) {
    try {
      const s = await import("../scratch/storage");
      const n = await s.importZip(f);
      setToast(`Imported ${n} item${n === 1 ? "" : "s"}. Newer items on this device were kept.`);
      await load();
    } catch (e) {
      setToast(e instanceof Error ? e.message : "That file couldn't be read.");
    }
  }

  return (
    <div className="page dash">
      <div className="dash-head">
        <div>
          <h1>Your progress</h1>
          <p className="lede">Everything here is saved only in this browser on this device. Export it to keep a backup or move to another device.</p>
        </div>
        <div className="actions">
          <button type="button" className="btn" onClick={() => fileInput.current?.click()}>Import progress</button>
          <button type="button" className="btn" onClick={exportAll}>Export progress</button>
          <input ref={fileInput} type="file" accept=".zip,application/zip" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void importAll(f); }} />
        </div>
      </div>
      {mode === "memory" && (
        <p className="notice warn" role="status">
          This browser isn't keeping saved data (private window or blocked storage), so your progress will be lost when you close the tab. Export it before you leave, or open LLD Studio in a normal window.
        </p>
      )}
      {toast && <p className="notice" role="status">{toast}</p>}

      {!p ? <p className="muted-text">Loading your progress…</p> : (
        <>
          {p.empty && (
            <div className="notice">
              <strong>Nothing here yet.</strong> Open a pattern, take its quiz, study its flashcards or try its scratch-pad exercise, and your progress shows up here.{" "}
              <Link to="/patterns/strategy">Start with Strategy</Link> or <Link to="/uml">UML Basics</Link>.
            </div>
          )}

          <div className="stat-row">
            <Stat label="Patterns mastered" value={<>{p.counts.mastered} <small>/ 22</small></>} />
            <Stat label="Practised or learning" value={p.counts.practised + p.counts.learning} />
            <Stat label="Day streak" value={<><FlameIcon />{p.streak}</>} note={p.bestStreak > p.streak ? `Best: ${p.bestStreak}` : p.streak && !p.activeToday ? "Learn today to keep it" : undefined} />
            <Stat label="Quiz average" value={pct(p.quizAverage)} note="Latest score per pattern" />
            <Stat label="Review average" value={p.reviewAverage === null ? "–" : <>{Math.round(p.reviewAverage)} <small>/ 100</small></>} note="Latest scratch-pad review" />
          </div>

          <div className="dash-row">
            <section className="card dash-map" aria-labelledby="map-h">
              <div className="dash-sec-head">
                <h2 id="map-h">Pattern map</h2>
                <ul className="legend-list" aria-label="Legend">
                  {(Object.keys(STATUS) as Status[]).map((s) => <li key={s}><span className={`swatch st-${s}`} aria-hidden="true">{STATUS[s].mark}</span>{STATUS[s].label}</li>)}
                </ul>
              </div>
              <div className="tile-grid">
                {p.patterns.map((x) => (
                  <Link key={x.slug} to={`/patterns/${x.slug}`} className={`tile st-${x.status}`}
                    aria-label={`${x.name}: ${STATUS[x.status].label}`}
                    title={[STATUS[x.status].label, x.quizBest !== null ? `best quiz ${pct(x.quizBest)}` : "", x.reviewBest !== null ? `best review ${x.reviewBest}` : ""].filter(Boolean).join(" · ")}>
                    <span className="tile-cat">{CATEGORY_INFO[x.category].label}</span>
                    <span className="tile-name">{x.name}</span>
                    <span className="tile-status" aria-hidden="true">{STATUS[x.status].mark} {x.status === "none" ? "" : STATUS[x.status].label}</span>
                  </Link>
                ))}
              </div>
              <p className="small-text muted-text">
                <strong>Learning</strong>: opened the lesson or studied cards. <strong>Practised</strong>: took the quiz or had a scratch-pad review.{" "}
                <strong>Mastered</strong>: best quiz {Math.round(MASTERY.quiz * 100)}% or more <em>and</em> a scratch-pad review of {MASTERY.review} or more.
              </p>
            </section>

            <div className="dash-side">
              <section className="card" aria-labelledby="cat-h">
                <h2 id="cat-h">By category</h2>
                <p className="small-text muted-text">Practised or mastered</p>
                {p.byCategory.map((c) => <Meter key={c.category} label={CATEGORY_INFO[c.category].label} done={c.done} total={c.total} cls={c.category} />)}
                <Meter label="UML Basics" done={UML_LESSONS.filter((l) => p.guidesSeen.includes(`uml/${l.id}`) || (l.id === "relationships" && p.umlSeen.length > 0)).length} total={UML_LESSONS.length} unit="lessons opened" cls="uml" />
                {guideCount("solid") > 0 && <Meter label="OOP & SOLID" done={p.guidesSeen.filter((k) => k.startsWith("solid/")).length} total={guideCount("solid")} unit="lessons opened" cls="uml" />}
              </section>
              <section className="card" aria-labelledby="act-h">
                <h2 id="act-h">Activity · last 7 days</h2>
                {p.week.every((d) => d.minutes === 0) && <p className="small-text muted-text">Minutes appear here once you've spent a few minutes learning (only time with the tab open and in use counts).</p>}
                <BarChart
                  label="Minutes learned per day, last 7 days"
                  bars={p.week.map((d, i) => ({ key: d.date, label: d.label, value: d.minutes, tip: `${d.minutes} min${d.actions ? `, ${d.actions} activit${d.actions === 1 ? "y" : "ies"}` : ""}`, current: i === 6 }))}
                  unit="min" />
              </section>
            </div>
          </div>

          <div className="dash-row">
            <section className="card dash-due" aria-labelledby="due-h">
              <h2 id="due-h">Due for review</h2>
              {p.due.length === 0
                ? <p className="muted-text">No flashcards yet. Open a pattern's <em>Check yourself</em> section to start a deck; cards come back here when they're due.</p>
                : (
                  <ul className="due-list">
                    {p.due.slice(0, 6).map((d) => (
                      <li key={d.slug}>
                        <Link to={d.cards > 0 ? `/review/${d.slug}` : `/patterns/${d.slug}`}>{d.name}</Link>
                        <span className={`due-${d.tone}`}>{d.label}{d.cards > 0 && d.tone !== "later" && !/new card/.test(d.label) ? ` · ${d.cards} card${d.cards === 1 ? "" : "s"}` : ""}</span>
                      </li>
                    ))}
                  </ul>
                )}
              {p.dueCards > 0
                ? <Link className="btn primary big" to="/review">Start review session · {p.dueCards} card{p.dueCards === 1 ? "" : "s"}</Link>
                : p.due.length > 0 && <p className="small-text muted-text">All caught up. Nothing is due right now.</p>}
            </section>

            <section className="card dash-attempts" aria-labelledby="att-h">
              <h2 id="att-h">Scratch-pad reviews</h2>
              {p.trend.length === 0
                ? <p className="muted-text">No reviews yet. <Link to="/scratch-pad">Try an exercise in the scratch pad</Link> and press <em>Review my design</em>.</p>
                : (
                  <>
                    <h3 className="small-head">Score trend · last {p.trend.length}</h3>
                    <BarChart
                      label={`Scratch-pad review scores, last ${p.trend.length} reviews`}
                      bars={p.trend.map((t, i) => ({ key: `${t.at}-${i}`, label: "", value: t.score, tip: `${t.name} (${LANG[t.lang] ?? t.lang}) · ${t.score}/100 · ${ago(t.at)}`, current: i === p.trend.length - 1 }))}
                      max={100} line={{ value: MASTERY.review, label: `Mastery ${MASTERY.review}` }} unit="/100" />
                    <h3 className="small-head">Recent attempts</h3>
                    <div className="table-scroll">
                      <table className="dash-table">
                        <thead><tr><th scope="col">Exercise</th><th scope="col">Language</th><th scope="col">Score</th><th scope="col">When</th><th scope="col"><span className="sr-only">Open</span></th></tr></thead>
                        <tbody>
                          {p.recent.map((a, i) => (
                            <tr key={`${a.slug}-${a.createdAt}-${i}`}>
                              <td>{a.name}</td>
                              <td>{LANG[a.lang] ?? a.lang}</td>
                              <td><span className={a.report.score >= MASTERY.review ? "score-good" : a.report.score >= 50 ? "score-mid" : "score-low"}>{a.report.score}</span><span className="muted-text"> / 100</span></td>
                              <td className="muted-text">{ago(a.createdAt)}</td>
                              <td><Link to={`/scratch-pad/${a.slug}`}>Open</Link></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, note }: { label: string; value: React.ReactNode; note?: string }) {
  return (
    <div className="card stat">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
      {note && <span className="stat-note">{note}</span>}
    </div>
  );
}

function Meter({ label, done, total, unit, cls }: { label: string; done: number; total: number; unit?: string; cls: string }) {
  const w = total ? Math.round((done / total) * 100) : 0;
  return (
    <div className="meter">
      <div className="meter-top"><span>{label}</span><span className="muted-text">{done} / {total}{unit ? ` ${unit}` : ""}</span></div>
      <div className="meter-track" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={total} aria-valuenow={done}>
        <div className={`meter-fill m-${cls}`} style={{ width: `${w}%` }} />
      </div>
    </div>
  );
}

interface Bar { key: string; label: string; value: number; tip: string; current?: boolean }
/** Single-series bar chart: one hue, the latest bar darker, hover / focus tooltip, and a table for screen readers. */
function BarChart({ bars, label, max, line, unit }: { bars: Bar[]; label: string; max?: number; line?: { value: number; label: string }; unit: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const top = Math.max(max ?? 0, ...bars.map((b) => b.value), 1);
  const labelled = bars.some((b) => b.label);
  return (
    <div className="bars-wrap">
      <div className="bars" aria-hidden="true" onMouseLeave={() => setHover(null)}>
        {line && <div className="bars-line" style={{ bottom: `${(line.value / top) * 100}%` }}><span>{line.label}</span></div>}
        {bars.map((b, i) => (
          <div key={b.key} className="bar-slot" onMouseEnter={() => setHover(i)}>
            <div className={`bar${b.current ? " current" : ""}${b.value === 0 ? " zero" : ""}`} style={{ height: `${Math.max(b.value ? 3 : 0, (b.value / top) * 100)}%` }} />
            {hover === i && <div className="bar-tip">{b.tip}</div>}
          </div>
        ))}
      </div>
      {labelled && <div className="bar-labels" aria-hidden="true">{bars.map((b) => <span key={b.key}>{b.label}</span>)}</div>}
      <table className="sr-only">
        <caption>{label}</caption>
        <tbody>{bars.map((b) => <tr key={b.key}><th scope="row">{b.label || b.tip.split(" · ")[0]}</th><td>{b.value} {unit}</td></tr>)}</tbody>
      </table>
    </div>
  );
}

function FlameIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--warn)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  );
}
