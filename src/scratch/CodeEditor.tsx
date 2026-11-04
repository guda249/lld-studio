import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { EditorState, Compartment, StateEffect, StateField, type Extension } from "@codemirror/state";
import {
  EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter, drawSelection,
  highlightSpecialChars, Decoration, type DecorationSet
} from "@codemirror/view";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import {
  indentOnInput, bracketMatching, syntaxHighlighting, HighlightStyle, StreamLanguage, indentUnit, foldGutter, foldKeymap
} from "@codemirror/language";
import { searchKeymap, highlightSelectionMatches } from "@codemirror/search";
import { closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete";
import { python } from "@codemirror/lang-python";
import { scala } from "@codemirror/legacy-modes/mode/clike";
import { tags as t } from "@lezer/highlight";
import type { Lang } from "../content/types";

/** Same token colours as the lesson code panels (docs/design-system.md, "Code panels"). */
const highlight = HighlightStyle.define([
  { tag: [t.keyword, t.controlKeyword, t.definitionKeyword, t.moduleKeyword, t.operatorKeyword, t.modifier], color: "#C792EA", fontWeight: "500" },
  { tag: [t.typeName, t.className, t.namespace], color: "#FFCB6B" },
  { tag: [t.function(t.variableName), t.function(t.definition(t.variableName)), t.function(t.propertyName)], color: "#82AAFF" },
  { tag: [t.self, t.special(t.variableName)], color: "#F07178", fontStyle: "italic" },
  { tag: [t.string, t.special(t.string)], color: "#C3E88D" },
  { tag: [t.number, t.bool, t.null, t.atom], color: "#F78C6C" },
  { tag: [t.meta, t.annotation], color: "#89DDFF" },
  { tag: [t.comment, t.lineComment, t.blockComment], color: "#9AA3B2", fontStyle: "italic" },
  { tag: t.invalid, color: "#FF8A80" }
]);

const theme = EditorView.theme({
  "&": { backgroundColor: "var(--code-bg)", color: "var(--code-ink)", fontSize: "14px", height: "100%" },
  ".cm-content": { fontFamily: "var(--mono)", caretColor: "#E6E9EF", padding: "10px 0" },
  ".cm-scroller": { fontFamily: "var(--mono)", lineHeight: "1.65" },
  ".cm-gutters": { backgroundColor: "var(--code-bg)", color: "var(--code-dim)", border: "none" },
  ".cm-activeLine": { backgroundColor: "#1C222C" },
  ".cm-activeLineGutter": { backgroundColor: "#1C222C", color: "#C9CED6" },
  "&.cm-focused .cm-cursor": { borderLeftColor: "#E6E9EF", borderLeftWidth: "2px" },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection": { backgroundColor: "#2E3266 !important" },
  ".cm-matchingBracket": { backgroundColor: "#2E3266", outline: "1px solid #A5ACFF" },
  ".cm-flash-line": { backgroundColor: "#3A3320", boxShadow: "inset 4px 0 0 #E69F00" },
  ".cm-foldGutter span": { color: "var(--code-dim)" },
  "&.cm-focused": { outline: "3px solid var(--accent)", outlineOffset: "-3px" }
}, { dark: true });

/* a temporary highlight for "go to line N" */
const flashLine = StateEffect.define<number | null>();
const flashField = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(deco, tr) {
    deco = deco.map(tr.changes);
    for (const e of tr.effects) {
      if (e.is(flashLine)) {
        if (e.value === null) deco = Decoration.none;
        else {
          const line = tr.state.doc.line(Math.min(Math.max(1, e.value), tr.state.doc.lines));
          deco = Decoration.set([Decoration.line({ class: "cm-flash-line" }).range(line.from)]);
        }
      }
    }
    return deco;
  },
  provide: (f) => EditorView.decorations.from(f)
});

const languageOf = (lang: Lang): Extension => (lang === "python" ? python() : StreamLanguage.define(scala));
const indentOf = (lang: Lang) => indentUnit.of(lang === "python" ? "    " : "  ");

export interface CodeEditorHandle {
  gotoLine(n: number): void;
  focus(): void;
  setValue(s: string): void;
}

interface Props {
  value: string;
  lang: Lang;
  onChange: (s: string) => void;
  label: string;
}

/** CodeMirror 6 editor for Python / Scala, styled like the lesson code panels. */
const CodeEditor = forwardRef<CodeEditorHandle, Props>(function CodeEditor({ value, lang, onChange, label }, ref) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const langComp = useRef(new Compartment());
  const indentComp = useRef(new Compartment());
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!host.current) return;
    const v = new EditorView({
      parent: host.current,
      state: EditorState.create({
        doc: value,
        extensions: [
          lineNumbers(), highlightActiveLineGutter(), highlightSpecialChars(), history(), foldGutter(), drawSelection(),
          indentOnInput(), bracketMatching(), closeBrackets(), highlightActiveLine(), highlightSelectionMatches(),
          syntaxHighlighting(highlight), theme, flashField,
          langComp.current.of(languageOf(lang)), indentComp.current.of(indentOf(lang)),
          keymap.of([...closeBracketsKeymap, ...defaultKeymap, ...searchKeymap, ...historyKeymap, ...foldKeymap, indentWithTab]),
          EditorView.contentAttributes.of({ "aria-label": label, spellcheck: "false", autocorrect: "off", autocapitalize: "off" }),
          EditorView.updateListener.of((u) => {
            if (u.docChanged) {
              onChangeRef.current(u.state.doc.toString());
              u.view.dispatch({ effects: flashLine.of(null) });
            }
          })
        ]
      })
    });
    view.current = v;
    return () => { v.destroy(); view.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    view.current?.dispatch({ effects: [langComp.current.reconfigure(languageOf(lang)), indentComp.current.reconfigure(indentOf(lang))] });
  }, [lang]);

  // outside value changes (switching language / pattern / opening an attempt)
  useEffect(() => {
    const v = view.current;
    if (v && v.state.doc.toString() !== value) v.dispatch({ changes: { from: 0, to: v.state.doc.length, insert: value } });
  }, [value]);

  useImperativeHandle(ref, () => ({
    gotoLine(n: number) {
      const v = view.current;
      if (!v) return;
      const line = v.state.doc.line(Math.min(Math.max(1, n), v.state.doc.lines));
      v.dispatch({ selection: { anchor: line.from }, effects: [flashLine.of(n), EditorView.scrollIntoView(line.from, { y: "center" })] });
      v.focus();
    },
    focus() { view.current?.focus(); },
    setValue(s: string) {
      const v = view.current;
      if (v) v.dispatch({ changes: { from: 0, to: v.state.doc.length, insert: s } });
    }
  }), []);

  return <div ref={host} className="cm-host" />;
});

export default CodeEditor;
