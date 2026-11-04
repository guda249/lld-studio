import { useEffect, useMemo, useRef } from "react";
import type { CodePair, Lang } from "../content/types";
import { highlightLines, LEGEND } from "../lib/highlight";
import { usePreference } from "./usePreference";
import { useReducedMotion } from "../lib/motion";

/** The Python / Scala choice is shared by every code panel on every page. */
export function useCodeLang(): [Lang, (l: Lang) => void] {
  return usePreference<Lang>("codeLang", "python");
}

export function LangTabs({ lang, setLang, label = "Language" }: { lang: Lang; setLang: (l: Lang) => void; label?: string }) {
  return (
    <div className="lang-tabs" role="group" aria-label={label}>
      <button type="button" aria-pressed={lang === "python"} onClick={() => setLang("python")}>Python</button>
      <button type="button" aria-pressed={lang === "scala"} onClick={() => setLang("scala")}>Scala 3</button>
    </div>
  );
}

export function CodeLines({ text, lang, hl, newLines }: { text: string; lang: Lang; hl?: number[]; newLines?: number[] }) {
  const lines = useMemo(() => text.replace(/\s+$/, "").split("\n"), [text]);
  const tokens = useMemo(() => highlightLines(lines, lang), [lines, lang]);
  const hlSet = new Set(hl ?? []);
  const fresh = new Set(newLines ?? []);
  return (
    <>
      {lines.map((_, i) => {
        const n = i + 1;
        const cls = ["ln"];
        if (hlSet.size) cls.push(hlSet.has(n) ? "hl" : "dimmed");
        if (fresh.has(n)) cls.push("new");
        return (
          <span key={i} className={cls.join(" ")}>
            <span className="n">{n}</span>
            {tokens[i].length ? tokens[i].map((t, j) => (t.cls ? <span key={j} className={t.cls}>{t.text}</span> : t.text)) : " "}
          </span>
        );
      })}
    </>
  );
}

export function CodeLegend() {
  return (
    <div className="code-legend" aria-label="Code colour legend">
      {LEGEND.map((l) => <span key={l.cls} className={l.cls}>{l.label}</span>)}
    </div>
  );
}

interface Props {
  code: CodePair;
  title?: string;
  note?: string;
  /** Highlighted lines per language (1-based). */
  hl?: { python: number[]; scala: number[] };
  maxHeight?: number;
  label?: string;
  showTabs?: boolean;
  legend?: boolean;
  /** Extra controls in the header (e.g. Classic / Idiomatic switch). */
  extra?: React.ReactNode;
}

/** Dark code panel with Python / Scala tabs, highlighted + dimmed lines and the colour legend. */
export default function CodePanel({ code, title = "Code", note, hl, maxHeight = 560, label, showTabs = true, legend = true, extra }: Props) {
  const [lang, setLang] = useCodeLang();
  const pre = useRef<HTMLPreElement>(null);
  const reduce = useReducedMotion();
  const lines = hl?.[lang];
  const key = (lines ?? []).join(",");

  // keep the first highlighted line in view (scrolls the panel only, never the page)
  useEffect(() => {
    const el = pre.current;
    if (!el) return;
    const first = el.querySelector<HTMLElement>(".ln.hl");
    if (!first) return;
    const top = Math.max(first.offsetTop - 48, 0);
    el.scrollTo({ top, behavior: reduce ? "auto" : "smooth" });
  }, [key, lang, code, reduce]);

  return (
    <section className="code-card" aria-label={label ?? title}>
      <div className="code-head">
        <h3>{title}</h3>
        <div className="code-head-tools">
          {extra}
          {showTabs && <LangTabs lang={lang} setLang={setLang} />}
        </div>
      </div>
      {note && <div className="code-note">{note}</div>}
      <pre ref={pre} className="code" tabIndex={0} style={{ maxHeight }} aria-label={`${label ?? title} in ${lang === "python" ? "Python" : "Scala 3"}`}>
        <CodeLines text={code[lang]} lang={lang} hl={lines} />
      </pre>
      {legend && <CodeLegend />}
    </section>
  );
}
