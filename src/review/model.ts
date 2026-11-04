/**
 * Reads Python or Scala 3 source (already parsed by tree-sitter) into ONE language-neutral class model.
 * The code is only read, never run. Half-written code is fine: unreadable parts are reported as error lines
 * and everything else is still extracted. Ported and extended from tools/code-reading-check/review.js.
 */
import type { Lang } from "../content/types";

/** The subset of web-tree-sitter's SyntaxNode the extractor uses (keeps this file testable and typed). */
export interface TSNode {
  type: string;
  text: string;
  startPosition: { row: number };
  endPosition: { row: number };
  namedChildren: TSNode[];
  namedChildCount: number;
  namedChild(i: number): TSNode | null;
  childForFieldName(name: string): TSNode | null;
  isMissing: boolean | (() => boolean);
  parent: TSNode | null;
}

export interface Param { name: string; type: string | null }
export interface Call {
  /** What the method is called on: "self", "self.strategy", "this.items", "logger", or null for a plain function call. */
  receiver: string | null;
  method: string;
  line: number;
}
export interface Created { type: string; line: number }

export interface MethodInfo {
  name: string;
  line: number;
  abstract: boolean;
  /** @staticmethod / @classmethod in Python; members of a Scala object. */
  static: boolean;
  decorators: string[];
  params: Param[];
  returnType: string | null;
  calls: Call[];
  creates: Created[];
  /** isinstance(x, T) in Python, `case _: T` / isInstanceOf[T] in Scala. */
  typeChecks: Created[];
  /** Field names iterated with a for loop (`for o in self.observers`). */
  loopsOver: string[];
  /** Returns self / this (fluent builder steps). */
  returnsSelf: boolean;
  /** Copies objects (copy.copy / deepcopy / .copy( / clone). */
  copies: boolean;
  /** if/elif or match chains inside this method. */
  branches: { line: number; count: number }[];
  /** Names returned (`return self._x`, `return Foo()` -> "Foo"), used by some rules. */
  returns: string[];
  /** Fields assigned in this method (self.x = ... / x = ... on a var). */
  assigns: string[];
  /** Exception types raised / thrown (`raise ValueError(...)`, `throw IllegalStateException(...)`). */
  raises: string[];
  /** Python generator (contains `yield`). */
  yields: boolean;
}

export interface FieldInfo {
  name: string;
  line: number;
  type: string | null;
  /** param: passed in through the constructor; created: made inside; collection: a list/dict/set; other. */
  origin: "param" | "created" | "collection" | "other";
  created: string[];
  /** Class attribute (Python) or a member of a Scala object. */
  classLevel: boolean;
  /** Element type of a typed collection, e.g. list[Observer] -> Observer. */
  elementType: string | null;
  /** Scala `var` (true) or `val` (false); unknown in Python. */
  mutable?: boolean;
  /** Scala `lazy val`. */
  lazy?: boolean;
}

export type ClassKind = "class" | "abstract" | "interface" | "object" | "enum" | "case";

export interface ClassInfo {
  name: string;
  line: number;
  endLine: number;
  kind: ClassKind;
  bases: string[];
  decorators: string[];
  fields: FieldInfo[];
  methods: MethodInfo[];
  ctorParams: Param[];
  /** Every capitalised constructor call anywhere in the class. */
  creates: (Created & { inCtor: boolean })[];
  branches: { line: number; count: number }[];
  /** Scala `class X private (...)`, or a Python class that overrides __new__. */
  privateCtor: boolean;
  /** Python dataclass / Scala case class (immutable value with copy). */
  dataclass: boolean;
  /** @dataclass(frozen=True), or a Scala case class with no var field. */
  frozen?: boolean;
}

export interface CodeModel {
  lang: Lang;
  classes: ClassInfo[];
  /** Top-level functions (Python def / Scala def outside classes, including @main). */
  functions: MethodInfo[];
  /** Constructor calls at top level (the demo / client code). */
  topCreates: Created[];
  topCalls: Call[];
  /** Lines tree-sitter could not read. */
  errorLines: number[];
}

/* ---------------- helpers ---------------- */
const lineOf = (n: TSNode) => n.startPosition.row + 1;
const isType = (s: string) => /^[A-Z]/.test(s);
const missing = (n: TSNode) => (typeof n.isMissing === "function" ? n.isMissing() : n.isMissing);
export const NOT_CLASSES = new Set([
  "ValueError", "TypeError", "RuntimeError", "KeyError", "IndexError", "Exception", "NotImplementedError", "PermissionError",
  "AttributeError", "LookupError", "StopIteration", "AssertionError", "ConnectionError", "TimeoutError", "IOError", "OSError",
  "IllegalArgumentException", "IllegalStateException", "RuntimeException", "NoSuchElementException", "UnsupportedOperationException",
  "SecurityException", "Exception", "Throwable", "Error",
  "List", "Map", "Set", "Seq", "Vector", "Some", "None", "Option", "Right", "Left", "Either", "Try", "Success", "Failure",
  "BigDecimal", "BigInt", "Random", "Decimal", "Fraction", "String", "Int", "Long", "Double", "Float", "Boolean", "Unit", "Char",
  "StringBuilder", "ListBuffer", "ArrayBuffer", "HashMap", "HashSet", "Array", "LazyList", "Iterator", "Range", "Tuple",
  "True", "False", "Path", "Counter", "OrderedDict", "Thread", "Lock", "RLock", "Enum", "ABC", "Protocol", "Any", "Optional", "Callable",
  "Instant", "Duration", "LocalDate", "UUID", "Ordering", "Math", "System", "Console", "Exception", "TreeMap", "Queue", "Deque"
]);
const COLLECTIONS = /^(list|dict|set|tuple|deque|List|Dict|Set|Seq|Vector|Map|ListBuffer|ArrayBuffer|HashMap|HashSet|mutable\.\w+|scala\.collection\.mutable\.\w+|collection\.mutable\.\w+)\b/;

export function walk(node: TSNode, fn: (n: TSNode) => void | false): void {
  if (fn(node) === false) return;
  for (const c of node.namedChildren) walk(c, fn);
}

export function errorLines(root: TSNode): number[] {
  const lines = new Set<number>();
  walk(root, (n) => { if (n.type === "ERROR" || missing(n)) lines.add(lineOf(n)); });
  return [...lines].sort((a, b) => a - b);
}

/** "list[Observer]" -> "list", "Optional[Foo]" -> "Foo", "mutable.ListBuffer[Foo]" -> ... */
function baseTypeName(t: string | null): string | null {
  if (!t) return null;
  let s = t.trim().replace(/^["']|["']$/g, "");
  const opt = s.match(/^(?:Optional|Option)\[(.+)\]$/);
  if (opt) s = opt[1];
  s = s.split("|")[0].trim();
  return s.split("[")[0].split("(")[0].trim() || null;
}
function elementTypeOf(t: string | null): string | null {
  if (!t) return null;
  const m = t.match(/\[([^\]]+)\]/);
  if (!m) return null;
  const parts = m[1].split(",").map((x) => x.trim());
  const last = parts[parts.length - 1].replace(/^.*\[/, "");
  return isType(last) ? baseTypeName(last) : null;
}

function emptyMethod(name: string, line: number): MethodInfo {
  return { name, line, abstract: false, static: false, decorators: [], params: [], returnType: null, calls: [], creates: [], typeChecks: [], loopsOver: [], returnsSelf: false, copies: false, branches: [], returns: [], assigns: [], raises: [], yields: false };
}

/* ---------------- Python ---------------- */

function pyParams(plist: TSNode | null): Param[] {
  const out: Param[] = [];
  if (!plist) return out;
  for (const p of plist.namedChildren) {
    if (p.type === "identifier") out.push({ name: p.text, type: null });
    else if (p.type === "typed_parameter") {
      const id = p.namedChildren.find((x) => x.type === "identifier");
      out.push({ name: id ? id.text : p.text, type: p.childForFieldName("type")?.text ?? null });
    } else if (p.type === "default_parameter" || p.type === "typed_default_parameter") {
      out.push({ name: p.childForFieldName("name")?.text ?? p.text, type: p.childForFieldName("type")?.text ?? null });
    }
  }
  return out;
}

function pyCalleeType(fn: TSNode): string | null {
  if (fn.type === "identifier") return fn.text;
  if (fn.type === "attribute") return fn.childForFieldName("attribute")?.text ?? null;
  return null;
}

/** Fills calls, creates, type checks, loops, branches, returns of a Python function body. */
function pyScanBody(body: TSNode, m: MethodInfo, onCreate?: (c: Created) => void) {
  walk(body, (n) => {
    if (n.type === "function_definition" || n.type === "class_definition") return n === body ? undefined : false;
    if (n.type === "call") {
      const f = n.childForFieldName("function");
      if (!f) return;
      if (f.type === "attribute") {
        const obj = f.childForFieldName("object")?.text ?? null;
        const meth = f.childForFieldName("attribute")?.text ?? "";
        m.calls.push({ receiver: obj, method: meth, line: lineOf(n) });
        if (/^(copy|deepcopy|clone)$/.test(meth) || (obj === "copy")) m.copies = true;
        if (isType(meth) && !NOT_CLASSES.has(meth)) { const c = { type: meth, line: lineOf(n) }; m.creates.push(c); onCreate?.(c); }
      } else if (f.type === "identifier") {
        const name = f.text;
        if (name === "isinstance") {
          const args = n.childForFieldName("arguments")?.namedChildren ?? [];
          const t = args[1];
          if (t) for (const x of t.type === "tuple" ? t.namedChildren : [t]) m.typeChecks.push({ type: x.text, line: lineOf(n) });
        } else if (name === "deepcopy" || name === "copy") m.copies = true;
        else if (isType(name) && !NOT_CLASSES.has(name)) { const c = { type: name, line: lineOf(n) }; m.creates.push(c); onCreate?.(c); }
        else m.calls.push({ receiver: null, method: name, line: lineOf(n) });
      }
    } else if (n.type === "for_statement") {
      const right = n.childForFieldName("right");
      if (right) {
        const t = right.text.replace(/\.(values|items|keys)\(\)$/, "").replace(/^(list|tuple|reversed|sorted)\((.*)\)$/, "$2");
        const mm = t.match(/^self\.(\w+)/);
        if (mm) m.loopsOver.push(mm[1]);
      }
    } else if (n.type === "if_statement") {
      const k = n.namedChildren.filter((x) => x.type === "elif_clause").length;
      if (k >= 1) m.branches.push({ line: lineOf(n), count: k + 1 });
    } else if (n.type === "match_statement") {
      const body2 = n.childForFieldName("body");
      const k = body2 ? body2.namedChildren.filter((x) => x.type === "case_clause").length : 0;
      if (k >= 2) m.branches.push({ line: lineOf(n), count: k });
    } else if (n.type === "return_statement") {
      const v = n.namedChildren[0];
      if (v) {
        if (v.text === "self") m.returnsSelf = true;
        if (v.type === "call") { const t = pyCalleeType(v.childForFieldName("function")!); if (t) m.returns.push(t); }
        else m.returns.push(v.text);
      }
    } else if (n.type === "assignment" || n.type === "augmented_assignment") {
      const left = n.childForFieldName("left");
      const targets = left?.type === "pattern_list" || left?.type === "tuple_pattern" ? left.namedChildren : left ? [left] : [];
      for (const t of targets) if (t.type === "attribute" && t.childForFieldName("object")?.text === "self") m.assigns.push(t.childForFieldName("attribute")!.text);
    } else if (n.type === "raise_statement") {
      const v = n.namedChildren[0];
      const t = v?.type === "call" ? pyCalleeType(v.childForFieldName("function")!) : v?.text.split(".").pop();
      if (t) m.raises.push(t);
    } else if (n.type === "yield") {
      m.yields = true;
    }
  });
}

function pyFunction(fn: TSNode, decos: string[]): MethodInfo {
  const m = emptyMethod(fn.childForFieldName("name")?.text ?? "?", lineOf(fn));
  m.decorators = decos;
  m.params = pyParams(fn.childForFieldName("parameters"));
  m.returnType = fn.childForFieldName("return_type")?.text ?? null;
  m.static = decos.includes("staticmethod") || decos.includes("classmethod");
  const body = fn.childForFieldName("body");
  const stubOnly = !!body && body.namedChildren.length >= 1 && body.namedChildren.every((s) =>
    /^(\.\.\.|pass)$/.test(s.text.trim()) || (s.type === "expression_statement" && s.namedChildren[0]?.type === "string") ||
    (s.type === "raise_statement" && /NotImplementedError/.test(s.text)));
  m.abstract = decos.includes("abstractmethod") || stubOnly;
  if (body) pyScanBody(body, m);
  return m;
}

function pyClass(cls: TSNode): ClassInfo {
  const name = cls.childForFieldName("name")?.text ?? "?";
  const sup = cls.childForFieldName("superclasses");
  const bases = sup
    ? sup.namedChildren.filter((c) => ["identifier", "attribute", "subscript"].includes(c.type)).map((c) => baseTypeName(c.text.split(".").pop()!)!).filter(Boolean)
    : [];
  const decorators = cls.parent?.type === "decorated_definition"
    ? cls.parent.namedChildren.filter((d) => d.type === "decorator").map((d) => d.text.replace(/^@/, "").split("(")[0].split(".").pop()!)
    : [];
  const c: ClassInfo = {
    name, line: lineOf(cls), endLine: cls.endPosition.row + 1, kind: "class", bases, decorators,
    fields: [], methods: [], ctorParams: [], creates: [], branches: [], privateCtor: false,
    dataclass: decorators.includes("dataclass"),
    frozen: cls.parent?.type === "decorated_definition" && /@(?:\w+\.)?dataclass\s*\([^)]*frozen\s*=\s*True/.test(cls.parent.text.slice(0, cls.parent.text.indexOf("class ")))
  };
  const body = cls.childForFieldName("body");
  if (body) for (const st of body.namedChildren) {
    let fn: TSNode | null = st;
    let decos: string[] = [];
    if (st.type === "decorated_definition") {
      decos = st.namedChildren.filter((d) => d.type === "decorator").map((d) => d.text.replace(/^@/, "").split("(")[0].split(".").pop()!);
      fn = st.childForFieldName("definition");
    }
    if (st.type === "expression_statement") {
      // class attributes:  _instance = None   /   name: str   /   items: list[str] = field(...)
      const a = st.namedChildren[0];
      if (a?.type === "assignment") {
        const left = a.childForFieldName("left"), right = a.childForFieldName("right"), ty = a.childForFieldName("type");
        if (left?.type === "identifier") {
          const type = ty?.text ?? null;
          const created: string[] = [];
          if (right) walk(right, (k) => { if (k.type === "call") { const t = pyCalleeType(k.childForFieldName("function")!); if (t && isType(t) && !NOT_CLASSES.has(t)) created.push(t); } });
          c.fields.push({
            name: left.text, line: lineOf(a), type: baseTypeName(type) ?? created[0] ?? null,
            origin: c.dataclass && !right ? "param" : created.length ? "created" : right && /^[[{(]|^(list|dict|set)\(/.test(right.text) ? "collection" : "other",
            created, classLevel: !c.dataclass, elementType: elementTypeOf(type)
          });
          if (c.dataclass) c.ctorParams.push({ name: left.text, type });
        }
      }
      continue;
    }
    if (!fn || fn.type !== "function_definition") continue;
    const m = pyFunction(fn, decos);
    c.methods.push(m);
    if (m.name === "__new__") c.privateCtor = true;
    const inCtor = m.name === "__init__";
    if (inCtor) c.ctorParams = m.params.filter((p) => p.name !== "self");
    for (const cr of m.creates) c.creates.push({ ...cr, inCtor });
    c.branches.push(...m.branches);
    // fields: self.x = ... (in any method; the constructor decides origin)
    const fbody = fn.childForFieldName("body");
    if (fbody) walk(fbody, (n) => {
      if (n.type !== "assignment") return;
      const L = n.childForFieldName("left"), R = n.childForFieldName("right"), ty = n.childForFieldName("type");
      // self.a, self.b = a, b  → two assignments
      const pairs: [TSNode | null, TSNode | null][] = (L?.type === "pattern_list" || L?.type === "tuple_pattern") && (R?.type === "expression_list" || R?.type === "tuple")
        ? L.namedChildren.map((x, k) => [x, R.namedChildren[k] ?? null]) : [[L, R]];
      for (const [left, right] of pairs) {
      if (!left || left.type !== "attribute" || left.childForFieldName("object")?.text !== "self" || !right) continue;
      const fname = left.childForFieldName("attribute")!.text;
      if (c.fields.some((f) => f.name === fname && !f.classLevel)) continue;
      const p = m.params.find((x) => x.name === right.text);
      const created: string[] = [];
      walk(right, (k) => { if (k.type === "call") { const t = pyCalleeType(k.childForFieldName("function")!); if (t && isType(t) && !NOT_CLASSES.has(t)) created.push(t); } });
      const annotated = ty?.text ?? null;
      const collection = /^[[{(]|^(list|dict|set|deque|defaultdict|OrderedDict)\(/.test(right.text);
      c.fields.push({
        name: fname, line: lineOf(n),
        type: baseTypeName(annotated) ?? (p ? baseTypeName(p.type) : null) ?? (collection ? null : created[0] ?? null),
        origin: p && inCtor ? "param" : collection ? "collection" : created.length ? "created" : "other",
        created, classLevel: false, elementType: elementTypeOf(annotated ?? p?.type ?? null)
      });
      }
    });
  }
  const abstractCount = c.methods.filter((m) => m.abstract).length;
  if (bases.includes("Enum") || bases.includes("IntEnum") || bases.includes("StrEnum")) c.kind = "enum";
  else if (bases.includes("Protocol")) c.kind = "interface";
  else if (bases.includes("ABC") || (abstractCount && c.methods.some((m) => m.decorators.includes("abstractmethod")))) {
    c.kind = c.methods.length > 0 && abstractCount === c.methods.length && !c.fields.some((f) => !f.classLevel) ? "interface" : "abstract";
  }
  return c;
}

function pyModel(root: TSNode): Omit<CodeModel, "lang" | "errorLines"> {
  const classes: ClassInfo[] = [];
  const functions: MethodInfo[] = [];
  const top = emptyMethod("<module>", 1);
  for (const st of root.namedChildren) {
    let node = st;
    let decos: string[] = [];
    if (st.type === "decorated_definition") {
      decos = st.namedChildren.filter((d) => d.type === "decorator").map((d) => d.text.replace(/^@/, "").split("(")[0].split(".").pop()!);
      node = st.childForFieldName("definition") ?? st;
    }
    if (node.type === "class_definition") classes.push(pyClass(node));
    else if (node.type === "function_definition") functions.push(pyFunction(node, decos));
    else pyScanBody(st, top);
  }
  // nested classes (rare) are ignored on purpose
  for (const f of functions) { top.creates.push(...f.creates); top.calls.push(...f.calls); }
  return { classes, functions, topCreates: top.creates, topCalls: top.calls };
}

/* ---------------- Scala ---------------- */

function scTypeName(t: TSNode | null): string | null {
  if (!t) return null;
  if (t.type === "generic_type") return scTypeName(t.childForFieldName("type"));
  if (t.type === "stable_type_identifier" || t.type === "projected_type") return t.text.split(".").pop()!.split("#").pop()!;
  return baseTypeName(t.text);
}

function scParams(plist: TSNode | null): Param[] {
  const out: Param[] = [];
  if (!plist) return out;
  for (const p of plist.namedChildren) {
    if (p.type === "parameter" || p.type === "class_parameter") {
      out.push({ name: p.childForFieldName("name")?.text ?? p.text, type: p.childForFieldName("type")?.text ?? null });
    }
  }
  return out;
}

function scCallee(fn: TSNode | null): { receiver: string | null; method: string } | null {
  if (!fn) return null;
  if (fn.type === "identifier") return { receiver: null, method: fn.text };
  if (fn.type === "field_expression") return { receiver: fn.childForFieldName("value")?.text ?? null, method: fn.childForFieldName("field")?.text ?? "" };
  if (fn.type === "generic_function") return scCallee(fn.childForFieldName("function"));
  return null;
}

function scScanBody(body: TSNode, m: MethodInfo, onCreate?: (c: Created) => void) {
  walk(body, (n) => {
    if (n !== body && ["function_definition", "class_definition", "object_definition", "trait_definition"].includes(n.type)) return false;
    if (n.type === "instance_expression") {
      const t = scTypeName(n.namedChildren[0] ?? null);
      if (t && isType(t) && !NOT_CLASSES.has(t)) { const c = { type: t, line: lineOf(n) }; m.creates.push(c); onCreate?.(c); }
    } else if (n.type === "call_expression") {
      const fn = n.childForFieldName("function");
      const cal = scCallee(fn);
      if (!cal) return;
      if (cal.receiver === null && isType(cal.method)) {
        if (!NOT_CLASSES.has(cal.method)) { const c = { type: cal.method, line: lineOf(n) }; m.creates.push(c); onCreate?.(c); }
      } else {
        m.calls.push({ ...cal, line: lineOf(n) });
        if (/^(copy|clone)$/.test(cal.method)) m.copies = true;
        if (cal.receiver && isType(cal.method) && !NOT_CLASSES.has(cal.method) && !/^[a-z]/.test(cal.receiver.split(".").pop() ?? "")) {
          /* Foo.Bar(...) companion-style creation */
        }
      }
    } else if (n.type === "field_expression") {
      // method calls without parentheses: o.update  (only when used as a statement is ambiguous; skip)
    } else if (n.type === "generic_function") {
      const f = n.childForFieldName("function");
      if (f?.type === "field_expression" && f.childForFieldName("field")?.text === "isInstanceOf") {
        const ta = n.childForFieldName("type_arguments")?.namedChildren[0];
        if (ta) m.typeChecks.push({ type: scTypeName(ta) ?? ta.text, line: lineOf(n) });
      }
    } else if (n.type === "typed_pattern") {
      const t = n.childForFieldName("type");
      if (t) m.typeChecks.push({ type: scTypeName(t) ?? t.text, line: lineOf(n) });
    } else if (n.type === "for_expression") {
      const en = n.childForFieldName("enumerators");
      const g = en?.namedChildren[0];
      const src = g?.namedChildren[g.namedChildren.length - 1]?.text ?? "";
      const mm = src.replace(/^this\./, "").match(/^(\w+)/);
      if (mm) m.loopsOver.push(mm[1]);
    } else if (n.type === "call_expression" || n.type === "infix_expression") {
      // handled above / below
    }
    if (n.type === "call_expression") {
      // xs.foreach(o => o.update(..)) counts as a loop over xs
      const cal = scCallee(n.childForFieldName("function"));
      if (cal && /^(foreach|map|filter|exists|forall|collect|flatMap|find|foldLeft|sum|count)$/.test(cal.method) && cal.receiver) {
        m.loopsOver.push(cal.receiver.replace(/^this\./, "").split(".")[0]);
      }
    }
    if (n.type === "if_expression") {
      // count else-if chains
      let k = 1, cur: TSNode | null = n;
      while (cur && cur.type === "if_expression") { const alt: TSNode | null = cur.childForFieldName("alternative"); if (!alt) break; k++; cur = alt.type === "if_expression" ? alt : null; }
      if (k >= 3 && n.parent?.type !== "if_expression") m.branches.push({ line: lineOf(n), count: k });
    } else if (n.type === "match_expression") {
      const b = n.childForFieldName("body");
      const k = b ? b.namedChildren.filter((x) => x.type === "case_clause").length : 0;
      if (k >= 2) m.branches.push({ line: lineOf(n), count: k });
    } else if (n.type === "infix_expression") {
      const op = n.childForFieldName("operator")?.text;
      const left = n.childForFieldName("left")?.text ?? "";
      if (op && /^(\+=|-=|=)$/.test(op)) m.assigns.push(left.replace(/^this\./, ""));
      if (op && /^(\+=|-=|\+\+=|::=|\+=:)$/.test(op)) m.calls.push({ receiver: left, method: op, line: lineOf(n) });
    } else if (n.type === "assignment_expression") {
      m.assigns.push((n.childForFieldName("left")?.text ?? "").replace(/^this\./, ""));
    } else if (n.type === "throw_expression") {
      const v = n.namedChildren[0];
      const t = v ? (v.type === "instance_expression" ? scTypeName(v.namedChildren[0] ?? null) : scCallee(v.childForFieldName("function"))?.method ?? v.text.split("(")[0].split(".").pop()) : null;
      if (t) m.raises.push(t);
    }
  });
  // last expression of a def body is its return value
  const last = body.type === "indented_block" || body.type === "block" ? body.namedChildren[body.namedChildren.length - 1] : body;
  if (last) {
    if (last.text === "this") m.returnsSelf = true;
    else if (last.type === "call_expression" || last.type === "instance_expression") {
      const t = last.type === "instance_expression" ? scTypeName(last.namedChildren[0] ?? null) : scCallee(last.childForFieldName("function"))?.method;
      if (t) m.returns.push(t);
      if (last.type === "call_expression" && /\bcopy$/.test(last.childForFieldName("function")?.text ?? "")) m.copies = true;
    } else m.returns.push(last.text);
  }
}

function scFunction(fn: TSNode, inObject: boolean): MethodInfo {
  const m = emptyMethod(fn.childForFieldName("name")?.text ?? "?", lineOf(fn));
  m.params = fn.namedChildren.filter((x) => x.type === "parameters").flatMap((x) => scParams(x));
  m.returnType = fn.childForFieldName("return_type")?.text ?? null;
  m.abstract = fn.type === "function_declaration";
  m.static = inObject;
  m.decorators = fn.namedChildren.filter((x) => x.type === "annotation").map((a) => a.text.replace(/^@/, ""));
  const body = fn.childForFieldName("body");
  if (body) scScanBody(body, m);
  return m;
}

function scClass(cls: TSNode): ClassInfo {
  const name = cls.childForFieldName("name")?.text ?? "?";
  const head = cls.text.slice(0, cls.text.indexOf(cls.childForFieldName("name")?.text ?? "\u0000"));
  const mods = cls.namedChildren.filter((x) => x.type === "modifiers").map((x) => x.text).join(" ") + " " + head;
  const isObject = cls.type === "object_definition";
  const c: ClassInfo = {
    name, line: lineOf(cls), endLine: cls.endPosition.row + 1,
    kind: cls.type === "trait_definition" ? "interface" : isObject ? "object" : cls.type === "enum_definition" ? "enum" : /\bcase\b/.test(mods) ? "case" : /\babstract\b/.test(mods) ? "abstract" : "class",
    bases: [], decorators: [], fields: [], methods: [], ctorParams: [], creates: [], branches: [],
    privateCtor: cls.namedChildren.some((x) => x.type === "access_modifier" && /private/.test(x.text)) || /class\s+\w+\s+private\b/.test(cls.text.split("\n")[0]),
    dataclass: /\bcase\b/.test(mods)
  };
  const ext = cls.childForFieldName("extend");
  if (ext) {
    for (const t of ext.namedChildren) {
      const node = ["type_identifier", "generic_type", "stable_type_identifier"].includes(t.type) ? t : t.namedChildren[0] ?? t;
      const nm = scTypeName(node);
      if (nm && isType(nm)) c.bases.push(nm);
    }
    if (!c.bases.length) for (const mm of ext.text.matchAll(/(?:extends|with|,)\s*([A-Z]\w*)/g)) c.bases.push(mm[1]);
  }
  const cps = cls.childForFieldName("class_parameters");
  if (cps) for (const p of cps.namedChildren) {
    if (p.type !== "class_parameter") continue;
    const pname = p.childForFieldName("name")?.text ?? "?";
    const tyText = p.childForFieldName("type")?.text ?? null;
    c.ctorParams.push({ name: pname, type: tyText });
    c.fields.push({ name: pname, line: lineOf(p), origin: "param", type: baseTypeName(tyText), created: [], classLevel: false, elementType: elementTypeOf(tyText), mutable: /^\s*(\w+\s+)*var\b/.test(p.text) });
  }
  const body = cls.childForFieldName("body");
  const onCreateCtor = (cr: Created) => c.creates.push({ ...cr, inCtor: true });
  if (body) for (const st of body.namedChildren) {
    if (st.type === "function_declaration" || st.type === "function_definition") {
      const m = scFunction(st, isObject);
      c.methods.push(m);
      for (const cr of m.creates) c.creates.push({ ...cr, inCtor: false });
      c.branches.push(...m.branches);
    } else if (st.type === "val_definition" || st.type === "var_definition" || st.type === "val_declaration" || st.type === "var_declaration") {
      const pat = st.childForFieldName("pattern") ?? st.childForFieldName("name");
      const val = st.childForFieldName("value");
      const tyText = st.childForFieldName("type")?.text ?? null;
      const created: string[] = [];
      const fake = emptyMethod("<init>", lineOf(st));
      if (val) scScanBody(val, fake, onCreateCtor);
      created.push(...fake.creates.map((x) => x.type));
      const collection = !!val && COLLECTIONS.test(val.text);
      c.fields.push({
        name: pat?.text ?? "?", line: lineOf(st),
        type: baseTypeName(tyText) ?? (collection ? null : created[0] ?? null),
        origin: collection ? "collection" : created.length ? "created" : "other",
        created, classLevel: isObject, elementType: elementTypeOf(tyText) ?? elementTypeOf(val?.text ?? null),
        mutable: st.type === "var_definition" || st.type === "var_declaration",
        lazy: st.namedChildren.some((x) => x.type === "modifiers" && /\blazy\b/.test(x.text))
      });
      if (st.type === "val_declaration" || st.type === "var_declaration") {
        c.methods.push({ ...emptyMethod(pat?.text ?? "?", lineOf(st)), abstract: true });
      }
    } else {
      // statements directly in the class body run in the constructor
      const fake = emptyMethod("<init>", lineOf(st));
      scScanBody(st, fake, onCreateCtor);
    }
  }
  if (c.kind === "interface" && c.methods.some((m) => !m.abstract)) {
    // a trait with some code is still an interface for design purposes unless it has state
    if (c.fields.some((f) => f.origin !== "other" || f.type)) c.kind = "abstract";
  }
  if (c.kind === "class" && c.methods.some((m) => m.abstract)) c.kind = "abstract";
  c.frozen = c.dataclass && !c.fields.some((f) => f.mutable);
  return c;
}

function scModel(root: TSNode): Omit<CodeModel, "lang" | "errorLines"> {
  const classes: ClassInfo[] = [];
  const functions: MethodInfo[] = [];
  const top = emptyMethod("<top>", 1);
  const visit = (n: TSNode) => {
    for (const st of n.namedChildren) {
      if (["class_definition", "trait_definition", "object_definition", "enum_definition"].includes(st.type)) {
        const c = scClass(st);
        // companion object: merge its members into the class as static members
        const companion = c.kind === "object" ? classes.find((x) => x.name === c.name) : undefined;
        if (companion) {
          companion.methods.push(...c.methods.map((m) => ({ ...m, static: true })));
          companion.fields.push(...c.fields.map((f) => ({ ...f, classLevel: true })));
          companion.creates.push(...c.creates);
        } else classes.push(c);
        if (st.type === "enum_definition") {
          const body = st.childForFieldName("body");
          if (body) walk(body, (k) => {
            if (k.type === "full_enum_case") {
              const nm = k.childForFieldName("name")?.text;
              if (nm) classes.push({ ...scClass(k), name: nm, kind: "case", bases: [c.name] });
            }
          });
        }
      } else if (st.type === "function_definition") {
        functions.push(scFunction(st, false));
      } else if (st.type === "package_clause" || st.type === "import_declaration") {
        continue;
      } else {
        scScanBody(st, top);
      }
    }
  };
  visit(root);
  for (const f of functions) { top.creates.push(...f.creates); top.calls.push(...f.calls); }
  return { classes, functions, topCreates: top.creates, topCalls: top.calls };
}

/** Builds the class model from a parsed tree. */
export function buildModel(root: TSNode, lang: Lang): CodeModel {
  const m = lang === "python" ? pyModel(root) : scModel(root);
  return { lang, errorLines: errorLines(root), ...m };
}
