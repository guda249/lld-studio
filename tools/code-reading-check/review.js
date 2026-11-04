const Parser = require("web-tree-sitter");

/* ---------------- shared helpers ---------------- */
const isType = (s) => /^[A-Z]/.test(s);
const EXCEPTIONS = new Set(["ValueError", "TypeError", "RuntimeError", "KeyError", "Exception", "IllegalArgumentException", "IllegalStateException", "RuntimeException", "NoSuchElementException", "List", "Map", "Set", "Some", "BigDecimal", "Random", "Decimal"]);
function walk(node, fn) { fn(node); for (let i = 0; i < node.namedChildCount; i++) walk(node.namedChild(i), fn); }
const line = (n) => n.startPosition.row + 1;
function errorLines(root) {
  const lines = new Set();
  walk(root, (n) => { if (n.type === "ERROR" || n.isMissing) lines.add(line(n)); });
  return [...lines].sort((a, b) => a - b);
}

/* ---------------- Python -> class model ---------------- */
function pyModel(root) {
  const classes = [];
  walk(root, (cls) => {
    if (cls.type !== "class_definition") return;
    const name = cls.childForFieldName("name").text;
    const sup = cls.childForFieldName("superclasses");
    const bases = sup ? sup.namedChildren.filter((c) => c.type === "identifier" || c.type === "attribute").map((c) => c.text.split(".").pop()) : [];
    const c = { name, line: line(cls), bases, kind: "class", fields: [], methods: [], ctorParams: [], creates: [] };
    const body = cls.childForFieldName("body");
    if (body) for (const st of body.namedChildren) {
      let fn = st, decos = [];
      if (st.type === "decorated_definition") { decos = st.namedChildren.filter((d) => d.type === "decorator").map((d) => d.text.replace("@", "").split(".").pop()); fn = st.childForFieldName("definition"); }
      if (!fn || fn.type !== "function_definition") continue;
      const mname = fn.childForFieldName("name").text;
      const fbody = fn.childForFieldName("body");
      const onlyStub = fbody && fbody.namedChildren.length === 1 && /^(\.\.\.|pass)$/.test(fbody.namedChildren[0].text.trim());
      c.methods.push({ name: mname, line: line(fn), abstract: decos.includes("abstractmethod") || onlyStub && bases.some((b) => b === "ABC" || b === "Protocol") });
      const params = [];
      const plist = fn.childForFieldName("parameters");
      if (plist) for (const p of plist.namedChildren) {
        if (p.type === "identifier") params.push({ name: p.text, type: null });
        else if (/typed_(default_)?parameter|default_parameter/.test(p.type)) {
          const id = p.namedChildren.find((x) => x.type === "identifier");
          const ty = p.childForFieldName("type");
          params.push({ name: id ? id.text : p.text, type: ty ? ty.text : null });
        }
      }
      const inCtor = mname === "__init__";
      if (inCtor) c.ctorParams = params.filter((p) => p.name !== "self");
      if (fbody) walk(fbody, (n) => {
        if (n.type === "call") {
          const f = n.childForFieldName("function");
          if (f && f.type === "identifier" && isType(f.text) && !EXCEPTIONS.has(f.text)) c.creates.push({ type: f.text, line: line(n), inCtor });
        }
        if (inCtor && n.type === "assignment") {
          const left = n.childForFieldName("left"), right = n.childForFieldName("right");
          if (!left || left.type !== "attribute" || left.childForFieldName("object").text !== "self" || !right) return;
          const fname = left.childForFieldName("attribute").text;
          const p = params.find((x) => x.name === right.text);
          const created = [];
          walk(right, (k) => { if (k.type === "call") { const f = k.childForFieldName("function"); if (f && isType(f.text)) created.push(f.text); } });
          c.fields.push({ name: fname, line: line(n), origin: p ? "param" : created.length ? "created" : "other", type: p ? p.type : created[0] || null, created });
        }
      });
    }
    c.branches = [];
    walk(cls, (n) => { if (n.type === "if_statement") { const k = n.namedChildren.filter((x) => x.type === "elif_clause").length; if (k >= 1) c.branches.push({ line: line(n), count: k + 1 }); } });
    const abstractCount = c.methods.filter((m) => m.abstract).length;
    if (bases.includes("ABC") || bases.includes("Protocol") || abstractCount) c.kind = c.methods.length && abstractCount === c.methods.length ? "interface" : "abstract";
    classes.push(c);
  });
  return classes;
}

/* ---------------- Scala -> class model ---------------- */
function typeName(t) { if (!t) return null; if (t.type === "generic_type") return t.childForFieldName("type").text; return t.text.split("[")[0].split("(")[0]; }
function scModel(root) {
  const classes = [];
  walk(root, (cls) => {
    if (!["class_definition", "trait_definition", "object_definition"].includes(cls.type)) return;
    const name = cls.childForFieldName("name").text;
    const c = { name, line: line(cls), bases: [], kind: cls.type === "trait_definition" ? "interface" : cls.type === "object_definition" ? "object" : "class", fields: [], methods: [], ctorParams: [], creates: [] };
    if (cls.type === "class_definition" && /\babstract\b/.test(cls.text.split("class")[0])) c.kind = "abstract";
    const ext = cls.childForFieldName("extend");
    if (ext) for (const t of ext.namedChildren) { const nm = typeName(t.type === "type_identifier" || t.type === "generic_type" ? t : t.namedChildren[0] || t); if (nm && isType(nm)) c.bases.push(nm); }
    const cps = cls.childForFieldName("class_parameters");
    if (cps) for (const p of cps.namedChildren) {
      if (p.type !== "class_parameter") continue;
      const pname = p.childForFieldName("name").text, ty = typeName(p.childForFieldName("type"));
      c.ctorParams.push({ name: pname, type: ty });
      c.fields.push({ name: pname, line: line(p), origin: "param", type: ty, created: [] });
    }
    const body = cls.childForFieldName("body");
    if (body) for (const st of body.namedChildren) {
      if (st.type === "function_declaration") c.methods.push({ name: st.childForFieldName("name").text, line: line(st), abstract: true });
      if (st.type === "function_definition") c.methods.push({ name: st.childForFieldName("name").text, line: line(st), abstract: false });
      if (st.type === "val_definition" || st.type === "var_definition") {
        const pat = st.childForFieldName("pattern"), val = st.childForFieldName("value");
        const created = [];
        if (val) walk(val, (k) => {
          if (k.type === "instance_expression") { const t = k.namedChildren[0]; if (t) created.push(typeName(t)); }
          if (k.type === "call_expression") { const f = k.childForFieldName("function"); if (f && f.type === "identifier" && isType(f.text)) created.push(f.text); }
        });
        c.fields.push({ name: pat ? pat.text : "?", line: line(st), origin: created.length ? "created" : "other", type: created[0] || null, created });
      }
    }
    walk(cls, (k) => {
      let t = null;
      if (k.type === "instance_expression") t = typeName(k.namedChildren[0]);
      if (k.type === "call_expression") { const f = k.childForFieldName("function"); if (f && f.type === "identifier" && isType(f.text)) t = f.text; }
      if (t && !EXCEPTIONS.has(t)) c.creates.push({ type: t, line: line(k), inCtor: true });
    });
    c.branches = [];
    walk(cls, (n) => { if (n.type === "match_expression") { const body = n.childForFieldName("body"); const k = body ? body.namedChildren.filter((x) => x.type === "case_clause").length : 0; if (k >= 2) c.branches.push({ line: line(n), count: k }); } });
    if (c.kind === "interface" && c.methods.some((m) => !m.abstract)) c.kind = "abstract";
    classes.push(c);
  });
  return classes;
}

/* ---------------- review rules (Strategy) with plain-English templates ---------------- */
function review(classes, lang, diagram, errLines) {
  const out = [];
  const byName = Object.fromEntries(classes.map((c) => [c.name, c]));
  const ifaces = classes.filter((c) => c.kind === "interface" || c.kind === "abstract");
  let strategy = null, concretes = [];
  for (const i of ifaces) {
    const impl = classes.filter((c) => c.bases.includes(i.name) && c.kind !== "interface");
    if (impl.length >= 2) { strategy = i; concretes = impl; break; }
  }
  if (errLines.length) out.push({ sev: "note", text: `I couldn't read line${errLines.length > 1 ? "s" : ""} ${errLines.join(", ")}, so anything there was skipped. The rest was reviewed.` });
  if (!strategy) {
    out.push({ sev: "fail", text: "I couldn't find the Strategy shape yet: an interface (an ABC/Protocol in Python, a trait in Scala) with at least two classes that implement it." });
    const b = classes.flatMap((c) => c.branches.map((x) => Object.assign({ cls: c.name }, x)))[0];
    if (b) out.push({ sev: "note", line: b.line, text: `${b.cls} chooses between ${b.count} behaviours with ${lang === "py" ? "if/elif" : "a match"} (line ${b.line}). That's exactly what Strategy replaces: move each branch into its own class behind one interface, and let ${b.cls} hold one of them.` });
    return out;
  }
  const cNames = new Set(concretes.map((c) => c.name));
  const context = classes.find((c) => c !== strategy && !cNames.has(c.name) &&
    c.fields.some((f) => f.type === strategy.name || cNames.has(f.type) || f.created.some((t) => cNames.has(t))));
  out.push({ sev: context ? "pass" : "fail", text: context
    ? `This is recognisably the Strategy pattern: ${strategy.name} is the strategy, ${concretes.map((c) => c.name).join(" and ")} implement it, and ${context.name} uses one.`
    : `${strategy.name} and its implementations are there, but no class holds a ${strategy.name} and delegates to it yet. Add a context class with a ${strategy.name} field.` });
  if (!context) return out;

  const createdConcrete = context.creates.filter((x) => cNames.has(x.type));
  for (const cc of createdConcrete) out.push({ sev: "warn", line: cc.line,
    text: `${context.name} creates ${cc.type} itself (line ${cc.line}), so it is locked to one algorithm. Accept a ${strategy.name} through the constructor${lang === "py" ? " or a setter" : " or a setter (var + method)"} instead; then new behaviour can be added without editing ${context.name} (Open/Closed Principle).` });
  const concreteTyped = context.fields.filter((f) => f.origin === "param" && cNames.has(f.type));
  for (const f of concreteTyped) out.push({ sev: "warn", line: f.line,
    text: `${context.name}.${f.name} is typed as ${f.type}, a concrete class. Type it as ${strategy.name} so any strategy can be plugged in (Dependency Inversion).` });
  if (!createdConcrete.length && !concreteTyped.length) out.push({ sev: "pass", text: `${context.name} only depends on ${strategy.name}, never on a concrete strategy.` });

  // naming
  const badClasses = classes.filter((c) => !/^[A-Z][A-Za-z0-9]*$/.test(c.name)).map((c) => c.name);
  const methodRe = lang === "py" ? /^_{0,2}[a-z][a-z0-9_]*_{0,2}$/ : /^[a-z][A-Za-z0-9]*$/;
  const badMethods = classes.flatMap((c) => c.methods.filter((m) => !methodRe.test(m.name)).map((m) => c.name + "." + m.name));
  if (badClasses.length || badMethods.length) out.push({ sev: "warn", text: "Naming: " +
    [badClasses.length ? `class names should be PascalCase (${badClasses.join(", ")})` : "",
     badMethods.length ? `method names should be ${lang === "py" ? "snake_case" : "camelCase"} (${badMethods.join(", ")})` : ""].filter(Boolean).join("; ") + "." });
  else out.push({ sev: "pass", text: `Naming follows ${lang === "py" ? "PEP 8" : "Scala"} conventions.` });

  // UML vs code
  if (diagram) {
    const f = context.fields.find((x) => x.type === strategy.name || cNames.has(x.type) || x.created.some((t) => cNames.has(t)));
    const codeRel = f.origin === "created" ? "composition" : "aggregation or association";
    const edge = diagram.edges.find((e) => e.from === context.name && (e.to === strategy.name || cNames.has(e.to)));
    if (!edge) out.push({ sev: "warn", text: `Your diagram has no line from ${context.name} to ${strategy.name}, but the code has one.` });
    else {
      const ok = f.origin === "created" ? edge.type === "composition" : ["aggregation", "association"].includes(edge.type);
      out.push({ sev: ok ? "pass" : "warn", text: ok ? `Diagram and code agree on how ${context.name} holds its strategy.`
        : `Diagram and code disagree. The diagram shows ${edge.type}, but in the code ${context.name} ${f.origin === "created" ? "creates the strategy itself, which is composition" : "receives the strategy from outside, which is " + codeRel}.` });
    }
    for (const c of concretes) if (!diagram.edges.some((e) => e.from === c.name && e.to === strategy.name && e.type === "realization"))
      out.push({ sev: "warn", text: `The diagram is missing the realization (dashed line, hollow triangle) from ${c.name} to ${strategy.name}.` });
  }
  return out;
}

module.exports = { pyModel, scModel, review, errorLines, Parser };
