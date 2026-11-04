import type { Action, DiagramSpec, DNode, DEdge, ExampleAnimation, PatternAnimation, TryIt } from "../../../anim/types";

/** Box height with 12 px extra at the bottom, so a value tag (drawn on the bottom border) never covers the last member. */
const TAG_H = (lines: number) => 32 + 20 * lines + 10 + 12;

/* ---------- story: History reaching into Editor becomes Editor -> EditorSnapshot <- History ---------- */

const EDITOR_PROBLEM = ["- _text: str", "- _cursor: int", "+ write(s)"];
const EDITOR_PROBLEM_SC = ["+ var text: String", "+ var cursor: Int", "+ write(s)"];
const EDITOR_CLEAN = ["- _text, _cursor (private)", "+ write(s) · move_cursor(p)", "+ save(): EditorSnapshot", "+ restore(snapshot)"];
const EDITOR_CLEAN_SC = ["- text, cursor (private)", "+ write(s) · moveCursor(p)", "+ save(): EditorSnapshot", "+ restore(snapshot)"];

const story: DiagramSpec = {
  label: "Problem: History reads and writes Editor's private fields. Solution: Editor creates an immutable EditorSnapshot and restores from it; History keeps snapshots without looking inside; App uses both.",
  width: 930,
  height: 420,
  portraitWidth: 340,
  portraitHeight: 610,
  nodes: [
    { id: "editor", kind: "concrete", name: "Editor", key: true, members: EDITOR_PROBLEM, scalaMembers: EDITOR_PROBLEM_SC,
      at: { x: 20, y: 90, w: 260, h: TAG_H(4) }, portrait: { x: 20, y: 110, w: 290, h: TAG_H(4) } },
    { id: "history", kind: "concrete", name: "History", key: true,
      members: ["- _saved: list[tuple[str, int]]", "+ backup(editor)", "+ undo(editor)"],
      scalaMembers: ["- saved: List[(String, Int)]", "+ backup(editor)", "+ undo(editor)"],
      at: { x: 650, y: 90, w: 260, h: TAG_H(3) }, portrait: { x: 20, y: 450, w: 290, h: TAG_H(3) } },
    { id: "app", kind: "client", name: "App", hidden: true, at: { x: 395, y: 120, w: 140, h: 56 }, portrait: { x: 100, y: 10, w: 140, h: 56 } },
    { id: "snap", kind: "concrete", name: "EditorSnapshot", key: true, hidden: true, stereotype: "",
      members: ["+ text: str", "+ cursor: int"], scalaMembers: ["+ text: String", "+ cursor: Int"],
      at: { x: 355, y: 290, w: 220, h: 102 }, portrait: { x: 20, y: 300, w: 220, h: 102 } }
  ],
  edges: [
    // the problem: History reaches straight into Editor's fields
    { id: "reach", from: "history", to: "editor", type: "association", label: "reaches in", hidden: true,
      via: [[150, 40], [670, 40]], viaPortrait: [[262, 347]] },
    // the solution
    { id: "creates", from: "editor", to: "snap", type: "dependency", label: "creates", hidden: true,
      via: [[320, 341], [320, 205]], viaPortrait: [[40, 280]] },
    { id: "keeps", from: "history", to: "snap", type: "aggregation", label: "keeps", toMult: "0..*", hidden: true,
      via: [[600, 190], [600, 341]], viaPortrait: [[40, 426]] },
    { id: "uses-e", from: "app", to: "editor", type: "association", hidden: true },
    { id: "uses-h", from: "app", to: "history", type: "association", hidden: true, viaPortrait: [[280, 430], [326, 430], [326, 38]] }
  ],
  badges: [
    { id: "warn", text: "History must change too", tone: "warn", near: "history", place: "below" },
    { id: "ok", text: "History: 0 lines changed", tone: "ok", near: "history", place: "below" }
  ]
};

const storyAnim: PatternAnimation["story"] = {
  diagram: story,
  steps: [
    {
      title: "The problem: undo reaches into private fields",
      what: "History copies the editor's _text and _cursor by reaching straight into them, and writes them back on undo. When Editor gains a selection field, History silently forgets it.",
      why: "History depends on Editor's internals, so encapsulation is broken and every new field means editing two classes (Single Responsibility).",
      say: {
        what: "Here's the problem. To support undo, History reaches straight into the editor's private text and cursor, and writes them back later. When the editor gains a new selection field, History silently forgets to save it.",
        why: "History depends on the editor's insides. Encapsulation is broken, and every new field means editing two classes."
      },
      code: "problem",
      lines: { python: [3, 4, 17, 18, 20, 21], scala: [2, 3, 12, 13, 15, 17, 18] },
      actions: [
        { show: ["reach"] },
        { call: ["history", "editor"], label: "editor._text", scalaLabel: "editor.text", result: '"Hello"' },
        { members: "editor", lines: [...EDITOR_PROBLEM, "- _selection (new field)"], scalaLines: [...EDITOR_PROBLEM_SC, "+ var selection (new)"] },
        { mark: "editor", member: 3 },
        { flash: "history" },
        { shake: "history", together: true },
        { show: ["warn"], together: true }
      ]
    },
    {
      title: "Let the editor snapshot itself",
      what: "Editor gets save(), which returns an immutable EditorSnapshot of its own state, and restore(snapshot), which puts it back. Its fields go private again.",
      why: "Only the object that owns the state reads or writes it. The memento is a sealed copy that nobody else needs to understand.",
      say: {
        what: "Now the editor snapshots itself. Save returns an immutable editor snapshot of its own state, and restore puts a snapshot back. Its fields are private again.",
        why: "Only the object that owns the state reads or writes it. The snapshot is a sealed copy that nobody else needs to understand."
      },
      code: "main",
      lines: { python: [4, 5, 6, 7, 26, 27, 29, 30], scala: [1, 15, 17, 18, 19] },
      actions: [
        { hide: ["warn", "reach"] },
        { mark: "editor", member: null, together: true },
        { members: "editor", lines: EDITOR_CLEAN, scalaLines: EDITOR_CLEAN_SC, stagger: true },
        { spawn: ["snap"], from: "editor" },
        { show: ["creates"] }
      ]
    },
    {
      title: "History only keeps snapshots",
      what: "History becomes a simple stack: push(snapshot) and pop(). It holds EditorSnapshot objects but never reads what is inside them.",
      why: "Keeping the history is a separate job from editing (Single Responsibility), and History no longer depends on Editor at all.",
      say: {
        what: "History becomes a simple stack, with push and pop. It holds editor snapshots, but never reads what is inside them.",
        why: "Keeping history is a separate job from editing. That's single responsibility, and History no longer depends on the editor at all."
      },
      code: "main",
      lines: { python: [33, 34, 35, 37, 38, 40, 41], scala: [21, 22, 24, 26, 27, 28, 29, 30] },
      actions: [
        { members: "history", lines: ["- _stack: list[EditorSnapshot]", "+ push(snapshot)", "+ pop(): EditorSnapshot | None"],
          scalaLines: ["- stack: List[EditorSnapshot]", "+ push(snapshot)", "+ pop(): Option[EditorSnapshot]"], stagger: true },
        { show: ["keeps"] },
        { ring: "history", caption: "never looks inside" }
      ]
    },
    {
      title: "Save before a change",
      what: "App writes “Dear team,”, asks the editor for a snapshot and pushes it onto History.",
      why: "The client decides when to checkpoint; the editor decides what goes into the checkpoint.",
      say: {
        what: "The app writes: Dear team. Then it asks the editor for a snapshot, and pushes it onto the history.",
        why: "The client decides when to save. The editor decides what goes into the snapshot."
      },
      code: "main",
      lines: { python: [44, 45, 46], scala: [33, 34, 35, 36] },
      actions: [
        { ring: null },
        { show: ["app"] },
        { show: ["uses-e", "uses-h"] },
        { call: ["app", "editor"], label: 'write("Dear team,")' },
        { tag: "editor", text: "Dear team," },
        { call: ["app", "editor", "snap"], label: "save()", result: "snapshot #1" },
        { call: ["app", "history"], label: "push(snapshot #1)" },
        { tag: "history", text: "stack: #1" }
      ]
    },
    {
      title: "Keep editing, saving each time",
      what: "App adds “ the release is cancelled.”, saves snapshot #2, then moves the cursor to 10 and inserts “ good news:”.",
      why: "Each snapshot is immutable, so later edits can never change a saved one.",
      say: {
        what: "The app adds: the release is cancelled, and saves snapshot number two. Then it moves the cursor and inserts: good news.",
        why: "Each snapshot is immutable, so later edits can never change one that was already saved."
      },
      code: "main",
      lines: { python: [47, 48, 49, 50, 51], scala: [37, 38, 39, 40, 41] },
      actions: [
        { call: ["app", "editor"], label: 'write(" the release is cancelled.")' },
        { tag: "editor", text: "Dear team, the release is…" },
        { call: ["app", "editor", "snap"], label: "save()", result: "snapshot #2" },
        { call: ["app", "history"], label: "push(snapshot #2)" },
        { tag: "history", text: "stack: #1, #2" },
        { call: ["app", "editor"], label: 'move_cursor(10); write(" good news:")', scalaLabel: 'moveCursor(10); write(" good news:")' },
        { tag: "editor", text: "Dear team, good news: the…" }
      ]
    },
    {
      title: "Undo: restore the newest snapshot",
      what: "App pops snapshot #2 from History and hands it to editor.restore(). The text goes back to “Dear team, the release is cancelled.”",
      why: "History passed the snapshot along without opening it. Only Editor reads its own memento.",
      say: {
        what: "To undo, the app pops snapshot number two from the history, and hands it to the editor's restore method. The text goes back to: Dear team, the release is cancelled.",
        why: "History passed the snapshot along without opening it. Only the editor reads its own snapshot."
      },
      code: "main",
      lines: { python: [29, 30, 53, 54, 55], scala: [17, 18, 19, 43, 44, 45, 46] },
      actions: [
        { call: ["app", "history"], label: "pop()", result: "snapshot #2" },
        { tag: "history", text: "stack: #1" },
        { call: ["app", "editor"], label: "restore(snapshot #2)" },
        { mark: "editor", member: 3 },
        { pulse: "editor", together: true },
        { tag: "editor", text: "Dear team, the release is…" }
      ]
    },
    {
      title: "Undo again until History is empty",
      what: "The next pop() gives snapshot #1 and the text is back to “Dear team,”. Then pop() returns None and the loop stops.",
      why: "Undo is just “pop and restore”. The caretaker never needs to know what an editor contains.",
      say: {
        what: "The next pop gives snapshot number one, and the text is back to: Dear team. Then pop returns nothing, and the loop stops.",
        why: "Undo is just pop and restore. The caretaker never needs to know what an editor contains."
      },
      code: "main",
      lines: { python: [40, 41, 53, 54, 55], scala: [26, 27, 28, 29, 30, 43, 44, 45, 47] },
      actions: [
        { mark: "editor", member: null },
        { call: ["app", "history"], label: "pop()", result: "snapshot #1" },
        { call: ["app", "editor"], label: "restore(snapshot #1)" },
        { tag: "editor", text: "Dear team," },
        { tag: "history", text: "stack: empty" },
        { call: ["app", "history"], label: "pop()", result: "None" }
      ]
    },
    {
      title: "A new field changes only the editor",
      what: "Editor gains a selection. Only Editor and its EditorSnapshot learn about it; save() and restore() handle the new field.",
      why: "History: 0 lines changed. The state can grow without anyone else reading it (encapsulation, Open/Closed).",
      say: {
        what: "Finally, the editor gains a selection. Only the editor and its snapshot learn about it. Save and restore handle the new field.",
        why: "History? Zero lines changed. The state can grow, and nobody else ever reads it."
      },
      code: "main",
      lines: { python: [4, 5, 6, 7, 26, 27, 29, 30], scala: [1, 15, 17, 18, 19] },
      actions: [
        { tag: "history", text: null },
        { tag: "editor", text: null, together: true },
        { members: "editor", lines: ["- _text, _cursor, _selection", "+ write(s) · move_cursor(p)", "+ save(): EditorSnapshot", "+ restore(snapshot)"],
          scalaLines: ["- text, cursor, selection", "+ write(s) · moveCursor(p)", "+ save(): EditorSnapshot", "+ restore(snapshot)"] },
        { mark: "editor", member: 0 },
        { members: "snap", lines: ["+ text: str", "+ cursor: int", "+ selection: tuple[int, int]"],
          scalaLines: ["+ text: String", "+ cursor: Int", "+ selection: (Int, Int)"] },
        { pulse: "snap", together: true },
        { show: ["ok"] },
        { pulse: "history", together: true }
      ]
    }
  ]
};

/* ---------- real-world examples: originator, caretaker, memento and the demo code ---------- */

interface Box3 { id: string; name: string; members: string[]; scalaMembers?: string[]; w: number; stereotype?: string; kind?: DNode["kind"] }

/**
 * Landscape: three boxes in a row (row[1] in the middle) and the memento underneath.
 * "client-both": Demo -> originator and Demo -> caretaker (row = [orig, client, care]).
 * "via-care":    Demo -> caretaker -> originator           (row = [client, care, orig]).
 * Portrait: everything stacked; the long link uses the right-hand gutter.
 */
function snapDiagram(o: {
  label: string; wiring: "client-both" | "via-care";
  client: string; orig: Box3; care: Box3; memo: Box3;
}): DiagramSpec {
  const tall = (b: Box3) => TAG_H(b.members.length) + (b.stereotype ? 12 : 0);
  const memoH = 32 + 20 * o.memo.members.length + 10;
  const clientBox: Box3 = { id: "client", kind: "client", name: o.client, members: [], w: 130 };
  const row = o.wiring === "client-both" ? [o.orig, clientBox, o.care] : [clientBox, o.care, o.orig];
  const widths = row.map((b) => b.w);
  const gap = (728 - widths.reduce((a, b) => a + b, 0)) / 2;
  const xs = [16, 16 + widths[0] + gap, 16 + widths[0] + widths[1] + 2 * gap];
  const topY = 20;
  const bigH = Math.max(tall(o.orig), tall(o.care));
  const memoY = topY + bigH + 50;
  const memoX = 380 - o.memo.w / 2;
  const width = 760, height = memoY + memoH + 30;

  // portrait: client on top, then the first worker, the memento, then the second worker
  const first = o.wiring === "client-both" ? o.orig : o.care;
  const second = o.wiring === "client-both" ? o.care : o.orig;
  const pFirstY = 90, pFirstH = tall(first);
  const pMemoY = pFirstY + pFirstH + 46;
  const pSecondY = pMemoY + memoH + 46;
  const pHeight = pSecondY + tall(second) + 34;

  const nodes: DNode[] = row.map((b, i) => {
    const isClient = b.id === "client";
    const h = isClient ? 56 : tall(b);
    const pY = isClient ? 10 : b === first ? pFirstY : pSecondY;
    return {
      id: b.id, kind: isClient ? "client" : (b.kind ?? "concrete"), name: b.name, hidden: true,
      key: !isClient, members: isClient ? undefined : b.members, scalaMembers: b.scalaMembers, stereotype: b.stereotype,
      at: { x: xs[i], y: topY + (isClient ? (bigH - 56) / 2 : 0), w: b.w, h },
      portrait: isClient ? { x: 105, y: 10, w: 130, h: 56 } : { x: 20, y: pY, w: 290, h }
    };
  });
  nodes.push({ id: o.memo.id, kind: "concrete", name: o.memo.name, key: true, hidden: true, members: o.memo.members, scalaMembers: o.memo.scalaMembers,
    at: { x: memoX, y: memoY, w: o.memo.w }, portrait: { x: 20, y: pMemoY, w: Math.min(o.memo.w, 240) } });

  const memoMidY = memoY + memoH / 2;
  /** Leave a worker near its outer bottom corner (value tags sit at the bottom centre), then turn into the memento's side. */
  const side = (b: Box3): [number, number][] => {
    const i = row.indexOf(b);
    const x = xs[i] + b.w / 2 < 380 ? xs[i] + 15 : xs[i] + b.w - 15;
    return [[x, memoMidY]];
  };
  const origAbove = o.wiring === "client-both";
  const edges: DEdge[] = [
    { id: "creates", from: o.orig.id, to: o.memo.id, type: "dependency", label: "creates", hidden: true, via: side(o.orig),
      viaPortrait: origAbove ? [[40, pMemoY - 23]] : [[40, pMemoY + memoH + 23]] },
    { id: "keeps", from: o.care.id, to: o.memo.id, type: "aggregation", label: "keeps", toMult: "0..*", hidden: true, via: side(o.care),
      viaPortrait: origAbove ? [[40, pMemoY + memoH + 23]] : [[40, pMemoY - 23]] }
  ];
  if (o.wiring === "client-both") {
    edges.push({ id: "use-o", from: "client", to: o.orig.id, type: "association", hidden: true });
    edges.push({ id: "use-c", from: "client", to: o.care.id, type: "association", hidden: true,
      viaPortrait: [[280, pSecondY - 20], [326, pSecondY - 20], [326, 38]] });
  } else {
    edges.push({ id: "use-c", from: "client", to: o.care.id, type: "association", hidden: true });
    edges.push({ id: "use-o", from: o.care.id, to: o.orig.id, type: "association", hidden: true,
      viaPortrait: [[280, pSecondY - 20], [326, pSecondY - 20], [326, pFirstY + 30]] });
  }
  return { label: o.label, width, height, portraitWidth: 340, portraitHeight: pHeight, nodes, edges };
}

const BUILD = (o: string, c: string, m: string): Action[] => [
  { show: ["client", o, c] },
  { show: ["use-o", "use-c"] },
  { show: [m] },
  { show: ["creates", "keeps"] }
];

/* --- canvas with limited undo --- */

const canvasDiagram = snapDiagram({
  label: "Demo uses Canvas and UndoStack; Canvas creates CanvasSnapshot objects and UndoStack keeps at most three of them.",
  wiring: "client-both", client: "Demo",
  orig: { id: "canvas", name: "Canvas", w: 230,
    members: ["- _shapes, _fill", "+ add_shape(s) · set_fill(c)", "+ save() · restore(snap)"],
    scalaMembers: ["- shapes, fill", "+ addShape(s) · setFill(c)", "+ save() · restore(snap)"] },
  care: { id: "undo", name: "UndoStack", w: 230,
    members: ["- _snaps: deque(maxlen=limit)", "+ push(snap) · pop()"],
    scalaMembers: ["- snaps: List (take limit)", "+ push(snap) · pop()"] },
  memo: { id: "snap", name: "CanvasSnapshot", w: 220,
    members: ["+ shapes: tuple[str, ...]", "+ fill: str"], scalaMembers: ["+ shapes: List[String]", "+ fill: String"] }
});

const canvasSave = (n: string): Action[] => [
  { call: ["client", "canvas", "snap"], label: "save()", result: n },
  { call: ["client", "undo"], label: `push(${n})` }
];
const canvasUndo = (snap: string, after: string, left: string): Action[] => [
  { call: ["client", "undo"], label: "pop()", result: snap },
  { call: ["client", "canvas"], label: "restore(snap)" },
  { tag: "canvas", text: after },
  { tag: "undo", text: left, together: true }
];

const canvasTable: Record<string, [string, string]> = {
  l1: ["1 undo → 5 shapes, white", "Only the newest snapshot was kept, so one undo is all you get."],
  l3: ["3 undos → 3 shapes, white", "As in the demo: three snapshots kept, the older three dropped."],
  l5: ["5 undos → 1 shape, white", "Five of the six snapshots fit; only the empty canvas was dropped."],
  l10: ["6 undos → 0 shapes, white", "Everything fits, so you can undo all the way to an empty canvas."]
};
const canvasResults: TryIt["results"] = {};
for (const [k, [output, note]] of Object.entries(canvasTable)) {
  canvasResults[k] = { output, note, actions: [
    { ring: "undo" },
    { tag: "undo", text: `kept: ${Math.min(Number(k.slice(1)), 6)} of 6` },
    { call: ["client", "undo", "client", "canvas"], label: "pop() + restore() until empty", result: output.split("→ ")[1] },
    { tag: "canvas", text: output.split("→ ")[1] }
  ] };
}

const canvas: ExampleAnimation = {
  diagram: canvasDiagram,
  walk: [
    [...BUILD("canvas", "undo", "snap"), ...canvasSave("snap"), { call: ["client", "canvas"], label: "add_shape × 5", scalaLabel: "addShape × 5" },
      { tag: "canvas", text: "5 shapes, white" }, { tag: "undo", text: "slots 3 / 3", together: true }],
    [...canvasSave("snap #6"), { call: ["client", "canvas"], label: 'set_fill("saffron")', scalaLabel: 'setFill("saffron")' },
      { tag: "canvas", text: "5 shapes, saffron" }],
    [{ ring: "undo" }, { pulse: "undo" }, { tag: "undo", text: "kept: 3, 4, 5 shapes" }],
    [{ ring: null }, ...canvasUndo("5 shapes, white", "5 shapes, white", "kept: 3, 4 shapes")],
    [...canvasUndo("4 shapes", "4 shapes, white", "kept: 3 shapes"), ...canvasUndo("3 shapes", "3 shapes, white", "empty"),
      { call: ["client", "undo"], label: "pop()", result: "None" }]
  ],
  tryIt: {
    prompt: "Change the caretaker's limit and undo as far as you can. Where does the canvas end up?",
    groups: [{ label: "Undo limit", options: [
      { id: "l1", label: "1" }, { id: "l3", label: "3" }, { id: "l5", label: "5" }, { id: "l10", label: "10" }
    ] }],
    results: canvasResults
  }
};

/* --- all-or-nothing coupons --- */

const cartDiagram = snapDiagram({
  label: "Demo calls apply_all_or_nothing, which saves a CartMemento of the Cart, applies coupons and restores the memento if one fails.",
  wiring: "via-care", client: "Demo",
  care: { id: "care", name: "apply_all_or_nothing", w: 240, stereotype: "«function»",
    members: ["- checkpoint: CartMemento", "+ (cart, codes)"], scalaMembers: ["- checkpoint: CartMemento", "+ (cart, codes)"] },
  orig: { id: "cart", name: "Cart", w: 230,
    members: ["- _items, _discount", "+ apply_coupons(codes)", "+ save() · restore(m)"],
    scalaMembers: ["- items, discount", "+ applyCoupons(codes)", "+ save() · restore(m)"] },
  memo: { id: "memo", name: "CartMemento", w: 220,
    members: ["+ items: tuple[...]", "+ discount: int"], scalaMembers: ["+ items: List[(String, Int)]", "+ discount: Int"] }
});

const CODES = { flat: "FLAT100", ship: "FREESHIP", diwali: "DIWALI90" } as const;
type Code = keyof typeof CODES;
const cartTotal = (a: Code, b: Code): number | null => {
  if (a === "diwali" || b === "diwali") return null;
  let total = 1499 + 79;
  let shippingFree = false;
  for (const c of [a, b]) {
    if (c === "flat") total -= 100;
    else if (!shippingFree) { total -= 79; shippingFree = true; }
  }
  return total;
};
const cartResults: TryIt["results"] = {};
for (const a of Object.keys(CODES) as Code[]) {
  for (const b of Object.keys(CODES) as Code[]) {
    const t = cartTotal(a, b);
    const label = `apply_all_or_nothing(${CODES[a]}, ${CODES[b]})`;
    const scalaLabel = `applyAllOrNothing(${CODES[a]}, ${CODES[b]})`;
    cartResults[`${a}|${b}`] = t === null
      ? { output: "Rolled back: ₹1578", note: "DIWALI90 is not valid, so the checkpoint is restored and nothing sticks.",
          actions: [{ ring: "care" }, { call: ["client", "care", "cart"], label, scalaLabel }, { flash: "cart" },
            { call: ["care", "cart"], label: "restore(checkpoint)", result: "₹1578" }, { tag: "cart", text: "total ₹1578" }] }
      : { output: `Applied: ₹${t}`, note: a === b && a === "ship" ? "Free shipping twice still saves ₹79 only." : a === b ? "FLAT100 twice takes ₹200 off." : "₹1578 − ₹100 − ₹79 shipping.",
          actions: [{ ring: "care" }, { call: ["client", "care", "cart"], label, scalaLabel, result: `₹${t}` }, { tag: "cart", text: `total ₹${t}` }] };
  }
}

const cart: ExampleAnimation = {
  diagram: cartDiagram,
  walk: [
    [...BUILD("care", "cart", "memo"), { call: ["client", "care", "cart"], label: 'add("kurta", 1499); add("shipping", 79)' },
      { tag: "cart", text: "total ₹1578" }],
    [{ call: ["client", "care"], label: "apply_all_or_nothing(3 codes)", scalaLabel: "applyAllOrNothing(3 codes)" },
      { call: ["care", "cart", "memo"], label: "save()", result: "checkpoint" },
      { tag: "care", text: "holds checkpoint" },
      { call: ["care", "cart"], label: "FLAT100, FREESHIP", },
      { tag: "cart", text: "total ₹1399 (so far)" }],
    [{ call: ["care", "cart"], label: "DIWALI90" }, { flash: "cart" }, { shake: "cart", together: true },
      { call: ["cart", "care"], label: "ValueError: DIWALI90 not valid", scalaLabel: "IllegalArgumentException" }],
    [{ ring: "care" }, { call: ["care", "cart"], label: "restore(checkpoint)" }, { tag: "cart", text: "total ₹1578" }],
    [{ ring: null }, { call: ["client", "care", "cart"], label: "apply_all_or_nothing(FLAT100, FREESHIP)", scalaLabel: "applyAllOrNothing(FLAT100, FREESHIP)", result: "₹1399" },
      { tag: "cart", text: "total ₹1399" }, { tag: "care", text: null, together: true }]
  ],
  tryIt: {
    prompt: "Enter two coupon codes. The caretaker applies both, or neither.",
    groups: [
      { label: "First code", options: [{ id: "flat", label: "FLAT100" }, { id: "ship", label: "FREESHIP" }, { id: "diwali", label: "DIWALI90" }] },
      { label: "Second code", options: [{ id: "flat", label: "FLAT100" }, { id: "ship", label: "FREESHIP" }, { id: "diwali", label: "DIWALI90" }] }
    ],
    results: cartResults
  }
};

/* --- config rollback by release --- */

const configDiagram = snapDiagram({
  label: "Demo uses ServiceConfig and ReleaseLog; ServiceConfig creates labelled ConfigCheckpoint objects that ReleaseLog keeps by name.",
  wiring: "client-both", client: "Demo",
  orig: { id: "config", name: "ServiceConfig", w: 230,
    members: ["- _settings: dict", "+ set(key, value)", "+ checkpoint(label)", "+ rollback(cp)"],
    scalaMembers: ["- settings: LinkedHashMap", "+ set(key, value)", "+ checkpoint(label)", "+ rollback(cp)"] },
  care: { id: "log", name: "ReleaseLog", w: 230,
    members: ["- _by_label: dict", "+ keep(cp) · get(label)"], scalaMembers: ["- byLabel: Map", "+ keep(cp) · get(label)"] },
  memo: { id: "cp", name: "ConfigCheckpoint", w: 240,
    members: ["+ label: str", "+ settings: tuple[...]"], scalaMembers: ["+ label: String", "+ settings: List[...]"] }
});

const LIVE = "api:1.5 · 4 replicas · 50 ms";
const configTable: Record<string, [string, string]> = {
  v14: ["api:1.4 · 2 replicas · 800 ms", "The very first checkpoint: the original image and replica count."],
  v15: ["api:1.5 · 4 replicas · 800 ms", "The release before the hotfix: the timeout is fixed, the new image stays."],
  none: [LIVE, "No rollback: the bad 50 ms timeout is still live."]
};
const configResults: TryIt["results"] = {};
for (const [k, [output, note]] of Object.entries(configTable)) {
  const label = k === "v14" ? "v1.4" : "v1.5";
  configResults[k] = { output, note, actions: k === "none"
    ? [{ ring: "config" }, { flash: "config" }, { tag: "config", text: "timeout 50 ms" }]
    : [{ ring: "log" }, { call: ["client", "log"], label: `get("${label}")`, result: `${label} checkpoint` },
       { call: ["client", "config"], label: "rollback(cp)", result: output }, { tag: "config", text: output.split(" · ")[0] + " · " + output.split(" · ")[2] }] };
}

const config: ExampleAnimation = {
  diagram: configDiagram,
  walk: [
    [...BUILD("config", "log", "cp"), { tag: "config", text: "api:1.4 · 2 · 800 ms" },
      { call: ["client", "config", "cp"], label: 'checkpoint("v1.4")', result: "v1.4" }, { call: ["client", "log"], label: "keep(v1.4)" },
      { tag: "log", text: "v1.4" }],
    [{ call: ["client", "config"], label: 'set("image", "api:1.5"); set("replicas", "4")' }, { tag: "config", text: "api:1.5 · 4 · 800 ms" },
      { call: ["client", "config", "cp"], label: 'checkpoint("v1.5")', result: "v1.5" }, { call: ["client", "log"], label: "keep(v1.5)" },
      { tag: "log", text: "v1.4, v1.5" }],
    [{ call: ["client", "config"], label: 'set("timeout_ms", "50")' }, { flash: "config" }, { tag: "config", text: "api:1.5 · 4 · 50 ms" }],
    [{ call: ["client", "log"], label: 'get("v1.5")', result: "v1.5 checkpoint" }, { call: ["client", "config"], label: "rollback(v1.5)" },
      { tag: "config", text: "api:1.5 · 4 · 800 ms" }],
    [{ call: ["client", "log"], label: 'get("v1.4")', result: "v1.4 checkpoint" }, { call: ["client", "config"], label: "rollback(v1.4)" },
      { tag: "config", text: "api:1.4 · 2 · 800 ms" }]
  ],
  tryIt: {
    prompt: "Production is broken by the hotfix. Pick a release to roll back to.",
    groups: [{ label: "Roll back to", options: [{ id: "v15", label: "v1.5" }, { id: "v14", label: "v1.4" }, { id: "none", label: "Do nothing" }] }],
    results: configResults
  }
};

/* --- undo and redo in a puzzle game --- */

const gameDiagram = snapDiagram({
  label: "Demo plays through UndoRedo, which saves GameSave snapshots of the Player on two stacks and restores them for undo and redo.",
  wiring: "via-care", client: "Demo",
  care: { id: "game", name: "UndoRedo", w: 230,
    members: ["- _undo, _redo: list[GameSave]", "+ play(d) · undo() · redo()"],
    scalaMembers: ["- undos, redos: List[GameSave]", "+ play(d) · undo() · redo()"] },
  orig: { id: "player", name: "Player", w: 230,
    members: ["- _x, _y, _moves", "+ step(direction)", "+ save() · restore(s)"],
    scalaMembers: ["- x, y, moves", "+ step(direction)", "+ save() · restore(s)"] },
  memo: { id: "save", name: "GameSave", w: 220, members: ["+ x, y: int", "+ moves: int"], scalaMembers: ["+ x, y: Int", "+ moves: Int"] }
});

const gameTable: Record<string, [string, string, string, string[]]> = {
  u: ["(2,0) after 2 moves", "One undo takes back the U move.", "undo 2 · redo 1", ["undo()"]],
  uu: ["(1,0) after 1 move", "Two undos take back U and the second R.", "undo 1 · redo 2", ["undo()", "undo()"]],
  uur: ["(2,0) after 2 moves", "Redo replays the second R from the redo stack.", "undo 2 · redo 1", ["undo()", "undo()", "redo()"]],
  uulr: ["(0,0) after 2 moves", "Moving L cleared the redo stack, so redo does nothing.", "undo 2 · redo 0", ["undo()", "undo()", 'play("L")', "redo()"]]
};
const gameResults: TryIt["results"] = {};
for (const [k, [output, note, stacks, calls]] of Object.entries(gameTable)) {
  gameResults[k] = { output, note, actions: [
    { ring: "game" },
    { call: ["client", "game", "player"], label: calls.join("; "), scalaLabel: calls.join("; ").replace('play("L")', "play('L')"), result: output },
    { tag: "player", text: output },
    { tag: "game", text: stacks, together: true }
  ] };
}

const PLAY = (d: string, at: string, stacks: string): Action[] => [
  { call: ["client", "game", "player", "save"], label: `play("${d}")`, scalaLabel: `play('${d}')` },
  { tag: "player", text: at },
  { tag: "game", text: stacks, together: true }
];

const game: ExampleAnimation = {
  diagram: gameDiagram,
  walk: [
    [...BUILD("player", "game", "save"), ...PLAY("R", "(1,0)", "undo 1 · redo 0"), ...PLAY("R", "(2,0)", "undo 2 · redo 0"),
      ...PLAY("U", "(2,1) after 3 moves", "undo 3 · redo 0")],
    [{ call: ["client", "game", "player"], label: "undo(); undo()", result: "(1,0)" }, { tag: "player", text: "(1,0) after 1 move" },
      { tag: "game", text: "undo 1 · redo 2", together: true }],
    [{ call: ["client", "game", "player"], label: "redo()", result: "(2,0)" }, { tag: "player", text: "(2,0) after 2 moves" },
      { tag: "game", text: "undo 2 · redo 1", together: true }],
    [...PLAY("L", "(1,0) after 3 moves", "undo 3 · redo 0"), { ring: "game" }, { pulse: "game", together: true }],
    [{ ring: null }, { call: ["client", "game"], label: "redo()", result: "nothing to redo" }, { pulse: "player" }]
  ],
  tryIt: {
    prompt: "After playing R, R, U the player is at (2,1). Pick what happens next.",
    groups: [{ label: "Then press", options: [
      { id: "u", label: "Undo" }, { id: "uu", label: "Undo ×2" }, { id: "uur", label: "Undo ×2, redo" }, { id: "uulr", label: "Undo ×2, L, redo" }
    ] }],
    results: gameResults
  }
};

const animation: PatternAnimation = {
  slug: "memento",
  story: storyAnim,
  examples: { canvas, cart, config, game },
  sequence: {
    label: "App writes, asks the editor for a snapshot and pushes it onto History; later it pops a snapshot and the editor restores itself from it.",
    participants: [
      { id: "app", name: "App", kind: "client" },
      { id: "editor", name: "editor: Editor", kind: "concrete" },
      { id: "snap", name: ": EditorSnapshot", kind: "concrete" },
      { id: "history", name: "history: History", kind: "concrete" }
    ],
    messages: [
      { from: "app", to: "editor", label: 'write("Dear team,")' },
      { from: "app", to: "editor", label: "save()" },
      { from: "editor", to: "snap", label: 'EditorSnapshot("Dear team,", 10)', kind: "create" },
      { from: "editor", to: "app", label: "snapshot", kind: "return" },
      { from: "app", to: "history", label: "push(snapshot)" },
      { from: "app", to: "editor", label: 'write(" the release…")' },
      { from: "app", to: "history", label: "push(editor.save())" },
      { from: "app", to: "editor", label: 'write(" good news:")' },
      { from: "app", to: "history", label: "pop()" },
      { from: "history", to: "app", label: "snapshot", kind: "return" },
      { from: "app", to: "editor", label: "restore(snapshot)" },
      { from: "editor", to: "editor", label: "text, cursor = snapshot's", kind: "self" }
    ]
  }
};

export default animation;
