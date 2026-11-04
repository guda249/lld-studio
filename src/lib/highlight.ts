/**
 * Small syntax colouring for Python and Scala, ported from the approved prototypes.
 * It never parses or validates, so half-written code still colours: an unclosed string is coloured to the end of
 * the line, and multi-line strings (""" / ''') and Scala block comments keep their colour until they close.
 */
export type HlLang = "python" | "scala";
export type TokenClass = "cm" | "kw" | "ty" | "fn" | "st" | "nu" | "dc" | "sf";
export interface Token { text: string; cls: TokenClass | null }

const KEYWORDS: Record<HlLang, Set<string>> = {
  python: new Set(("and as assert async await break case class continue def del elif else except finally for from " +
    "global if import in is lambda match nonlocal not or pass raise return try while with yield").split(" ")),
  scala: new Set(("abstract case catch class def do else enum extends extension final finally for given if " +
    "implicit import lazy match new object override package private protected return sealed super " +
    "then throw trait try type using val var while with yield").split(" "))
};
const LITERALS = new Set(["None", "True", "False", "true", "false", "null"]);
const SELF = new Set(["self", "this", "cls"]);
// Groups: 1 line comment | 2 multi-line opener | 3 string (closed, or unclosed to end of line)
//         4 decorator/annotation | 5 number | 6 identifier
const TOKEN_RE: Record<HlLang, RegExp> = {
  python: /(#.*$)|([rbfuRBFU]{0,2}(?:"""|'''))|([rbfuRBFU]{0,2}(?:"(?:[^"\\]|\\.)*(?:"|$)|'(?:[^'\\]|\\.)*(?:'|$)))|(@\w+)|(\b\d[\d_]*(?:\.\d+)?\b)|([A-Za-z_]\w*)/g,
  scala: /(\/\/.*$)|(\/\*|[sfr]?""")|([sfr]?"(?:[^"\\]|\\.)*(?:"|$))|(@\w+)|(\b\d[\d_]*(?:\.\d+)?\b)|([A-Za-z_]\w*)/g
};

/** Tokenises a snippet line by line. Returns one token list per line. */
export function highlightLines(lines: string[], language: HlLang): Token[][] {
  const kw = KEYWORDS[language];
  let open: { close: string; cls: TokenClass } | null = null;
  return lines.map((line) => {
    const out: Token[] = [];
    const push = (text: string, cls: TokenClass | null) => { if (text) out.push({ text, cls }); };
    let pos = 0;
    if (open) {
      const end = line.indexOf(open.close);
      if (end < 0) { push(line, open.cls); return out; }
      push(line.slice(0, end + open.close.length), open.cls);
      pos = end + open.close.length;
      open = null;
    }
    const re = new RegExp(TOKEN_RE[language].source, "g");
    re.lastIndex = pos;
    let last = pos, prev = "";
    let m: RegExpExecArray | null;
    while ((m = re.exec(line)) !== null) {
      if (m[0] === "") { re.lastIndex++; continue; }
      push(line.slice(last, m.index), null);
      const s = m[0];
      if (m[2]) {
        const close = s.endsWith("/*") ? "*/" : s.slice(-3);
        const cls: TokenClass = close === "*/" ? "cm" : "st";
        const end = line.indexOf(close, re.lastIndex);
        if (end < 0) {
          push(line.slice(m.index), cls);
          open = { close, cls };
          last = line.length;
          break;
        }
        push(line.slice(m.index, end + close.length), cls);
        re.lastIndex = last = end + close.length;
        prev = "";
        continue;
      }
      let cls: TokenClass | null = null;
      if (m[1]) cls = "cm";
      else if (m[3]) cls = "st";
      else if (m[4]) cls = "dc";
      else if (m[5]) cls = "nu";
      else if (kw.has(s)) cls = "kw";
      else if (LITERALS.has(s)) cls = "nu";
      else if (SELF.has(s)) cls = "sf";
      else if (prev === "def") cls = "fn";
      else if (/^[A-Z]/.test(s)) cls = "ty";
      prev = m[6] ? s : "";
      push(s, cls);
      last = re.lastIndex;
    }
    push(line.slice(last), null);
    return out;
  });
}

export const LEGEND: { cls: TokenClass; label: string }[] = [
  { cls: "kw", label: "keyword" }, { cls: "ty", label: "Type" }, { cls: "fn", label: "function" },
  { cls: "sf", label: "self/this" }, { cls: "st", label: '"string"' }, { cls: "nu", label: "number" },
  { cls: "dc", label: "@decorator" }, { cls: "cm", label: "# comment" }
];
