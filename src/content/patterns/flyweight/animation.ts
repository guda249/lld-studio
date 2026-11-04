import type { Action, DiagramSpec, DNode, ExampleAnimation, PatternAnimation, TryResult } from "../../../anim/types";

/* ---------- story: fat CarMarker, then Marker + shared MarkerStyle from a factory ---------- */

const story: DiagramSpec = {
  label: "The client asks MarkerStyleFactory for styles; the factory caches MarkerStyle objects; each Marker keeps its own position and shares one MarkerStyle.",
  width: 900,
  height: 420,
  portraitWidth: 340,
  portraitHeight: 620,
  nodes: [
    { id: "app", kind: "client", name: "App", hidden: true,
      at: { x: 16, y: 40, w: 120, h: 56 }, portrait: { x: 202, y: 40, w: 130, h: 56 } },
    { id: "factory", kind: "singleton", name: "MarkerStyleFactory", key: true, hidden: true,
      members: ["- _styles: dict", "+ get(icon, color)", "+ count(): int"],
      scalaMembers: ["- styles: TrieMap", "+ get(icon, color)", "+ count: Int"],
      at: { x: 250, y: 20, w: 250, h: 126 }, portrait: { x: 8, y: 20, w: 182, h: 126 } },
    { id: "car", kind: "concrete", name: "CarMarker", members: [],
      at: { x: 16, y: 250, w: 220, h: 114 }, portrait: { x: 8, y: 490, w: 240, h: 114 } },
    { id: "marker", kind: "concrete", name: "Marker", hidden: true,
      members: ["- lat, lng: float", "- style: MarkerStyle", "+ draw(): str"],
      scalaMembers: ["- lat, lng: Double", "- style: MarkerStyle", "+ draw(): String"],
      at: { x: 270, y: 250, w: 240, h: 114 }, portrait: { x: 142, y: 170, w: 190, h: 114 } },
    { id: "style", kind: "concrete", name: "MarkerStyle", key: true, hidden: true,
      members: ["+ icon: str  (frozen)", "+ color: str"], scalaMembers: ["+ icon: String  (val)", "+ color: String"],
      at: { x: 640, y: 260, w: 240, h: 94 }, portrait: { x: 8, y: 372, w: 190, h: 94 } }
  ],
  edges: [
    { id: "asks", from: "app", to: "factory", type: "dependency", hidden: true },
    { id: "creates", from: "app", to: "marker", type: "dependency", label: "creates", hidden: true, via: [[310, 200], [76, 200]] },
    { id: "caches", from: "factory", to: "style", type: "aggregation", label: "caches", toMult: "0..*", hidden: true,
      via: [[760, 83]], viaPortrait: [[22, 166], [22, 352]] },
    { id: "shares", from: "marker", to: "style", type: "association", label: "shares", fromMult: "*", toMult: "1", hidden: true }
  ],
  badges: [
    { id: "warn", text: "50 KB icon copied per car", tone: "warn", near: "car" },
    { id: "ok", text: "100,001 markers, 2 styles", tone: "ok", near: "style", place: "below" }
  ]
};

const storyAnim: PatternAnimation["story"] = {
  diagram: story,
  steps: [
    {
      title: "The problem: every car carries its own icon",
      what: "Each CarMarker stores its position and also its own copy of the same 50 KB car icon. 200 markers already hold 10 MB of identical bytes.",
      why: "The data that is the same for every car is copied into every object. At 100,000 cars that is 5 GB for what is really one image.",
      say: {
        what: "Here's the problem. Each car marker stores its position, and also its own copy of the same fifty kilobyte car icon. Two hundred markers already hold ten megabytes of identical bytes.",
        why: "The data that's the same for every car is copied into every object. At a hundred thousand cars, that's five gigabytes, for what is really one image."
      },
      code: "problem",
      lines: { python: [4, 5, 6, 7, 8, 9, 16], scala: [1, 2, 7] },
      actions: [
        { members: "car", stagger: true,
          lines: ["- lat, lng: float", "- icon: bytes  (50 KB)", "- color: str"],
          scalaLines: ["- lat, lng: Double", "- icon: Array[Byte]", "- color: String"] },
        { tag: "car", text: "200 copies: 10.0 MB" },
        { flash: "car" },
        { shake: "car", together: true },
        { show: ["warn"], together: true }
      ]
    },
    {
      title: "Split shared state from per-car state",
      what: "The icon and colour are the same for many cars (intrinsic state), so they move into MarkerStyle. The position is unique to each car (extrinsic state), so it stays in a slim Marker.",
      why: "Each class now has one kind of data (Single Responsibility). MarkerStyle is frozen, because many markers will point at the same object.",
      say: {
        what: "We split the state in two. The icon and the colour are the same for many cars. That's intrinsic state, and it moves into a marker style object. The position is unique to each car. That's extrinsic state, and it stays in a slim marker.",
        why: "Each class now holds one kind of data. And the marker style is frozen, because many markers will point at the same object."
      },
      code: "main",
      lines: { python: [4, 5, 6, 7, 8, 26, 27, 28, 29, 30, 31], scala: [3, 4, 14, 15] },
      actions: [
        { hide: ["warn"] },
        { tag: "car", text: null, together: true },
        { mark: "car", member: 1 },
        { spawn: ["style"], from: "car" },
        { show: ["marker"] },
        { cross: "car" },
        { hide: ["car", "car__x"] },
        { show: ["shares"] }
      ]
    },
    {
      title: "A factory hands out shared styles",
      what: "MarkerStyleFactory keeps a cache keyed by (icon, colour). get() returns the cached style, and only creates a new one the first time it sees a key.",
      why: "Nobody calls MarkerStyle(...) directly, so duplicates cannot sneak in. The factory is the single place that decides sharing.",
      say: {
        what: "Now a marker style factory keeps a cache, keyed by icon and colour. Its get method returns the cached style, and only creates a new one the first time it sees a key.",
        why: "Nobody builds a marker style directly, so duplicates can't sneak in. The factory is the one place that decides sharing."
      },
      code: "main",
      lines: { python: [11, 12, 14, 15, 16, 17, 18, 19], scala: [6, 7, 9, 10] },
      actions: [
        { show: ["factory"] },
        { show: ["caches"] },
        { show: ["app"] },
        { show: ["asks", "creates"] }
      ]
    },
    {
      title: "First car: a cache miss creates one style",
      what: "App calls get(\"car.png\", \"yellow\"). The cache is empty, so the factory builds one MarkerStyle and stores it. App then creates Marker(17.38, 78.48, style).",
      why: "The heavy object is created exactly once. From now on it is only ever looked up.",
      say: {
        what: "The app asks the factory for the yellow car style. The cache is empty, so the factory builds one marker style and stores it. The app then creates the first marker with its own position and that style.",
        why: "The heavy object is created exactly once. From now on, it's only ever looked up."
      },
      code: "main",
      lines: { python: [16, 17, 18, 19, 37, 38], scala: [9, 10, 19, 20] },
      actions: [
        { call: ["app", "factory"], label: 'get("car.png", "yellow")' },
        { ring: "factory" },
        { call: ["factory", "style"], label: "MarkerStyle(car.png, yellow)", result: "style #1" },
        { tag: "factory", text: "miss: styles 1" },
        { call: ["app", "marker"], label: "Marker(17.38, 78.48, style)" }
      ]
    },
    {
      title: "The next 99,999 cars: cache hits",
      what: "Every later get(\"car.png\", \"yellow\") finds the key and returns the same style object. 100,000 markers now point at one MarkerStyle.",
      why: "Memory grows with the number of distinct styles, not with the number of cars.",
      say: {
        what: "Every later request for the yellow car style finds the key, and returns the very same style object. A hundred thousand markers now point at one marker style.",
        why: "Memory now grows with the number of distinct styles, not with the number of cars."
      },
      code: "main",
      lines: { python: [17, 19, 38, 39], scala: [10, 19, 20] },
      actions: [
        { ring: "factory" },
        { call: ["app", "factory"], label: 'get("car.png", "yellow")', result: "same style #1" },
        { tag: "factory", text: "hit: styles 1" },
        { tag: "marker", text: "markers: 100,000" },
        { tag: "style", text: "shared by 100,000" },
        { pulse: "style" }
      ]
    },
    {
      title: "Drawing combines both halves",
      what: "markers[0].draw() reads its own lat and lng and the shared style's icon and colour, and returns \"car.png (yellow) at 17.3800,78.4800\".",
      why: "The flyweight never stores a position. Per-car data stays outside and meets the shared data only when it is used.",
      say: {
        what: "When the first marker draws itself, it reads its own latitude and longitude, plus the shared style's icon and colour.",
        why: "The flyweight never stores a position. Per-car data stays outside, and meets the shared data only when it's used."
      },
      code: "main",
      lines: { python: [33, 34, 43], scala: [16, 23] },
      actions: [
        { ring: "marker" },
        { call: ["app", "marker", "style"], label: "draw()", result: '"car.png (yellow) at 17.3800,78.4800"', back: ["style", "marker", "app"] }
      ]
    },
    {
      title: "A bike needs a new style, nothing else changes",
      what: "get(\"bike.png\", \"green\") is a new key, so the factory adds a second style. 100,001 markers share just 2 MarkerStyle objects.",
      why: "New kinds of marker are added through the factory without touching Marker or the client loop (Open/Closed).",
      say: {
        what: "Finally, a bike appears. Its green bike style is a new key, so the factory adds a second style. A hundred thousand and one markers now share just two style objects.",
        why: "New kinds of marker are added through the factory, without touching the marker class or the client loop. That's the open-closed principle."
      },
      code: "main",
      lines: { python: [41, 42, 45], scala: [21, 22, 25] },
      actions: [
        { ring: "factory" },
        { call: ["app", "factory", "style"], label: 'get("bike.png", "green")', result: "style #2", back: ["style", "factory", "app"] },
        { tag: "factory", text: "miss: styles 2" },
        { tag: "style", text: null },
        { ring: null },
        { show: ["ok"] },
        { pulse: "style", together: true }
      ]
    }
  ]
};

/* ---------- real-world examples: client -> factory -> flyweight <- context ---------- */

interface Part { name: string; members: string[]; scala?: string[]; kind?: DNode["kind"]; stereotype?: string }
interface MiniCfg { label: string; client: string; factory: Part; flyweight: Part; context: Part; ctxEdge?: string }

/** Box height plus 12 px so a value tag under the box does not cover the last member line. */
const hOf = (p: Part) => (p.stereotype || p.kind === "singleton" ? 44 : 32) + 20 * p.members.length + 10 + 12;

/** Landscape: client and factory on top, context and flyweight below. Portrait: a zig-zag down the screen. */
function miniDiagram(c: MiniCfg): DiagramSpec {
  const top = 16;
  const fh = hOf(c.factory);
  const row2 = top + Math.max(fh, 54) + 70;
  const ch = hOf(c.context), wh = hOf(c.flyweight);
  const bh = Math.max(ch, wh);
  const ctxY = row2 + (bh - ch) / 2, fwY = row2 + (bh - wh) / 2;
  const pFy = 10, pCtxY = pFy + fh + 40, pFwY = pCtxY + ch + 50;
  const node = (id: string, p: Part, kind: DNode["kind"], key: boolean, at: DNode["at"], portrait: DNode["portrait"]): DNode => ({
    id, kind: p.kind ?? kind, name: p.name, key, hidden: true, members: p.members, scalaMembers: p.scala,
    stereotype: p.stereotype, at: { ...at, h: hOf(p) }, portrait: portrait && { ...portrait, h: hOf(p) }
  });
  return {
    label: c.label,
    width: 760, height: row2 + bh + 40,
    portraitWidth: 340, portraitHeight: pFwY + wh + 40,
    nodes: [
      { id: "client", kind: "client", name: c.client, hidden: true,
        at: { x: 16, y: top + Math.round(fh / 2) - 27, w: 130, h: 54 }, portrait: { x: 220, y: 14, w: 112, h: 54 } },
      node("factory", c.factory, "concrete", true, { x: 230, y: top, w: 270 }, { x: 8, y: pFy, w: 200 }),
      node("ctx", c.context, "concrete", false, { x: 230, y: ctxY, w: 270 }, { x: 130, y: pCtxY, w: 202 }),
      node("fw", c.flyweight, "concrete", true, { x: 560, y: fwY, w: 190 }, { x: 8, y: pFwY, w: 212 })
    ],
    edges: [
      { id: "asks", from: "client", to: "factory", type: "dependency", hidden: true },
      { id: "creates", from: "client", to: "ctx", type: "dependency", hidden: true, via: [[81, ctxY + ch / 2]] },
      { id: "caches", from: "factory", to: "fw", type: "aggregation", label: "caches", hidden: true,
        via: [[655, top + fh / 2]], viaPortrait: [[22, pFy + fh + 14], [22, pFwY - 14]] },
      { id: "shares", from: "ctx", to: "fw", type: "association", label: c.ctxEdge ?? "shares", hidden: true }
    ]
  };
}

const BUILD: Action[] = [
  { show: ["client", "factory"] },
  { show: ["asks"] },
  { show: ["fw"] },
  { show: ["caches"] },
  { show: ["ctx"] },
  { show: ["creates", "shares"] }
];

/* --- 1. text editor glyphs --- */

const TEXTS: Record<string, { label: string; chars: number; glyphs: number; first: string }> = {
  l1: { label: "namaste duniya", chars: 14, glyphs: 11, first: "'n' Noto Sans-12 at (0,0)" },
  l2: { label: "hello world, hello india", chars: 24, glyphs: 12, first: "'h' Noto Sans-12 at (0,0)" },
  both: { label: "both lines", chars: 38, glyphs: 17, first: "'n' Noto Sans-12 at (0,0)" }
};

function editorTry(id: string): TryResult {
  const t = TEXTS[id];
  return {
    output: `${t.chars} chars, ${t.glyphs} glyph objects`,
    note: `Every repeated letter (and the space) reuses its glyph, so ${t.chars} cells need only ${t.glyphs} distinct (char, font, size) keys.`,
    actions: [
      { ring: "factory" },
      { call: ["client", "factory"], label: `get × ${t.chars}`, result: `${t.glyphs} glyphs` },
      { tag: "factory", text: `glyphs: ${t.glyphs}` },
      { tag: "ctx", text: `cells: ${t.chars}` }
    ]
  };
}

const editor: ExampleAnimation = {
  diagram: miniDiagram({
    label: "The editor asks GlyphFactory for glyphs; the factory caches Glyph objects; each CharCell keeps its row and column and shares one Glyph.",
    client: "Editor",
    factory: { name: "GlyphFactory", members: ["- _glyphs: dict", "+ get(char, font, size)"], scala: ["- glyphs: Map", "+ get(char, font, size)"] },
    flyweight: { name: "Glyph", members: ["+ char, font, size", "+ render(row, col)"] },
    context: { name: "CharCell", members: ["- glyph: Glyph", "- row, col: int"], scala: ["- glyph: Glyph", "- row, col: Int"] }
  }),
  walk: [
    [...BUILD, { tag: "ctx", text: "cells: 38" }],
    [
      { ring: "factory" },
      { call: ["client", "factory", "fw"], label: 'get("n", "Noto Sans", 12)', result: "new Glyph n", back: ["fw", "factory", "client"] },
      { tag: "factory", text: "miss: glyphs 1" }
    ],
    [
      { ring: "factory" },
      { call: ["client", "factory"], label: 'get("a", "Noto Sans", 12)', result: "same Glyph a" },
      { tag: "factory", text: "hit: same glyph" },
      { pulse: "fw" }
    ],
    [
      { ring: null },
      { tag: "factory", text: "glyphs: 17" },
      { pulse: "factory" }
    ],
    [
      { ring: "ctx" },
      { call: ["client", "ctx", "fw"], label: "render(0, 0)", result: "\"'n' Noto Sans-12 at (0,0)\"", back: ["fw", "ctx", "client"] }
    ]
  ],
  tryIt: {
    prompt: "Pick the text on screen and see how many glyph objects the factory needs.",
    groups: [
      { label: "Text", options: Object.entries(TEXTS).map(([id, t]) => ({ id, label: t.label })) }
    ],
    results: Object.fromEntries(Object.keys(TEXTS).map((id) => [id, editorTry(id)]))
  }
};

/* --- 2. forest of trees --- */

const FOREST: Record<string, string> = {
  "1k|one": "0.9 MB shared vs 900 MB copied",
  "1k|two": "2.4 MB shared vs 1,210 MB copied",
  "1k|three": "3.0 MB shared vs 1,006 MB copied",
  "20k|one": "0.9 MB shared vs 18,000 MB copied",
  "20k|two": "2.4 MB shared vs 24,079 MB copied",
  "20k|three": "3.0 MB shared vs 20,034 MB copied"
};
const SPECIES: Record<string, { n: number; list: string }> = {
  one: { n: 1, list: "neem (900 KB)" },
  two: { n: 2, list: "neem (900 KB) and banyan (1,500 KB)" },
  three: { n: 3, list: "neem, banyan and palm (900 + 1,500 + 600 KB)" }
};

function forestTry(size: string, sp: string): TryResult {
  const trees = size === "1k" ? "1,000" : "20,000";
  const s = SPECIES[sp];
  return {
    output: FOREST[`${size}|${sp}`],
    note: `${trees} trees from ${s.list}: the factory builds ${s.n} TreeType object${s.n > 1 ? "s" : ""}. The copied figure is what each tree would hold with its own mesh (Python, seed 42).`,
    actions: [
      { ring: "factory" },
      { call: ["client", "factory"], label: `get(…) × ${trees}`, result: `${s.n} tree type${s.n > 1 ? "s" : ""}` },
      { tag: "factory", text: `types: ${s.n}` },
      { tag: "ctx", text: `trees: ${trees}` },
      { tag: "fw", text: `${FOREST[`${size}|${sp}`].split(" vs")[0]}` }
    ]
  };
}

const forest: ExampleAnimation = {
  diagram: miniDiagram({
    label: "The game asks TreeTypeFactory for tree types; the factory caches TreeType objects; each Tree keeps its x and y and shares one TreeType.",
    client: "Game",
    factory: { name: "TreeTypeFactory", members: ["- _types: dict", "+ get(species, …)"], scala: ["- types: Map", "+ get(species, …)"] },
    flyweight: { name: "TreeType", members: ["+ species, texture", "+ mesh_kb: int"], scala: ["+ species, texture", "+ meshKb: Int"] },
    context: { name: "Tree", members: ["- x, y: int", "- kind: TreeType"], scala: ["- x, y: Int", "- kind: TreeType"] }
  }),
  walk: [
    [...BUILD, { call: ["client", "ctx"], label: "Tree(x, y, kind) × 20,000" }, { tag: "ctx", text: "trees: 20,000" }],
    [
      { ring: "factory" },
      { call: ["client", "factory", "fw"], label: 'get("neem", "neem.png", 900)', result: "new TreeType neem", back: ["fw", "factory", "client"] },
      { tag: "factory", text: "new: types 1" }
    ],
    [
      { ring: "factory" },
      { call: ["client", "factory"], label: 'get("neem", …)', result: "same neem" },
      { tag: "factory", text: "types: 3" },
      { pulse: "fw" }
    ],
    [
      { ring: null },
      { tag: "fw", text: "3.0 MB shared" },
      { tag: "ctx", text: "vs 20,034 MB copied" },
      { pulse: "fw" }
    ]
  ],
  tryIt: {
    prompt: "Choose how big the forest is and how many species it has. Compare shared mesh memory with copying.",
    groups: [
      { label: "Trees", options: [{ id: "1k", label: "1,000" }, { id: "20k", label: "20,000" }] },
      { label: "Species", options: [{ id: "one", label: "Neem only" }, { id: "two", label: "Neem, banyan" }, { id: "three", label: "All three" }] }
    ],
    results: Object.fromEntries(["1k", "20k"].flatMap((n) => ["one", "two", "three"].map((s) => [`${n}|${s}`, forestTry(n, s)])))
  }
};

/* --- 3. airline seat map (pre-built pool) --- */

const SEATS: Record<string, { cls: string; row: number; free: string }> = {
  "1a": { cls: "Business", row: 1, free: "1A Business 110cm ₹24,000" },
  "4c": { cls: "Stretch", row: 4, free: "4C Stretch 86cm ₹9,500" },
  "27f": { cls: "Economy", row: 27, free: "27F Economy 76cm ₹5,200" }
};

function seatTry(seat: string, status: string): TryResult {
  const s = SEATS[seat];
  const no = seat.toUpperCase();
  const out = status === "booked" ? `${no} ${s.free.split(" ").slice(1, 3).join(" ")} booked` : s.free;
  const booked = status === "booked" ? "True" : "False";
  return {
    output: out,
    note: `class_for(${s.row}) returns the shared ${s.cls} object. label("${no}", ${booked}) adds the seat number and status, which are not stored in it.`,
    actions: [
      { ring: "fw" },
      { call: ["client", "factory"], label: `class_for(${s.row})`, scalaLabel: `classFor(${s.row})`, result: s.cls },
      { call: ["client", "ctx", "fw"], label: `label("${no}", ${booked})`, scalaLabel: `label("${no}", ${booked.toLowerCase()})`, result: `"${out}"`, back: ["fw", "ctx", "client"] }
    ]
  };
}

const seats: ExampleAnimation = {
  diagram: miniDiagram({
    label: "The seat map screen gets a SeatClass from the SEAT_CLASSES pool through class_for; each seat map entry keeps its seat number and booked flag and shares one SeatClass.",
    client: "Seat map UI",
    factory: { name: "SEAT_CLASSES", kind: "singleton", stereotype: "«pool»", members: ["3 SeatClass objects", "+ class_for(row)"], scala: ["3 SeatClass objects", "+ classFor(row)"] },
    flyweight: { name: "SeatClass", members: ["+ name, fare, legroom_cm", "+ label(seat_no, booked)"], scala: ["+ name, fare, legroomCm", "+ label(seatNo, booked)"] },
    context: { name: "seat_map entry", stereotype: "«dict value»", members: ["seat_no → (class, booked)"], scala: ["seatNo → (class, booked)"] },
    ctxEdge: "points to"
  }),
  walk: [
    [
      { show: ["client", "factory"] },
      { show: ["fw"] },
      { show: ["caches"] },
      { tag: "factory", text: "3 objects, built once" }
    ],
    [
      { show: ["asks"] },
      { call: ["client", "factory"], label: "class_for(4)", scalaLabel: "classFor(4)", result: "Stretch" },
      { ring: "fw" }
    ],
    [
      { ring: null },
      { show: ["ctx"] },
      { show: ["creates", "shares"] },
      { tag: "ctx", text: "180 entries" },
      { tag: "factory", text: "still 3 objects" }
    ],
    [
      { ring: "fw", caption: "args: seat, flag" },
      { call: ["client", "ctx", "fw"], label: 'label("4C", False)', scalaLabel: 'label("4C", false)', result: '"4C Stretch 86cm ₹9,500"', back: ["fw", "ctx", "client"] }
    ],
    [
      { call: ["client", "ctx", "fw"], label: 'label("1A", True)', scalaLabel: 'label("1A", true)', result: '"1A Business 110cm booked"', back: ["fw", "ctx", "client"] },
      { call: ["client", "ctx", "fw"], label: 'label("27F", False)', scalaLabel: 'label("27F", false)', result: '"27F Economy 76cm ₹5,200"', back: ["fw", "ctx", "client"] }
    ]
  ],
  tryIt: {
    prompt: "Pick a seat and whether it is booked. The same shared SeatClass formats every seat in its cabin.",
    groups: [
      { label: "Seat", options: [{ id: "1a", label: "1A" }, { id: "4c", label: "4C" }, { id: "27f", label: "27F" }] },
      { label: "Status", options: [{ id: "free", label: "Free" }, { id: "booked", label: "Booked" }] }
    ],
    results: Object.fromEntries(["1a", "4c", "27f"].flatMap((s) => ["free", "booked"].map((b) => [`${s}|${b}`, seatTry(s, b)])))
  }
};

/* --- 4. lab test definitions (memoised function) --- */

const READINGS: Record<string, Record<string, { value: string; flag: string }>> = {
  hb: { anil: { value: "11.2", flag: "LOW" }, bina: { value: "13.5", flag: "normal" }, chitra: { value: "14.1", flag: "normal" } },
  glu: { anil: { value: "126.0", flag: "HIGH" }, bina: { value: "64.0", flag: "LOW" }, chitra: { value: "92.0", flag: "normal" } }
};
const TESTS: Record<string, { code: string; unit: string; range: string }> = {
  hb: { code: "HB", unit: "g/dL", range: "12.0 to 16.0" },
  glu: { code: "GLU", unit: "mg/dL", range: "70.0 to 100.0" }
};

function labTry(test: string, who: string): TryResult {
  const t = TESTS[test];
  const r = READINGS[test][who];
  const name = who[0].toUpperCase() + who.slice(1);
  return {
    output: `${name} ${t.code} ${r.value} ${t.unit} ${r.flag}`,
    note: `test_def("${t.code}") returns the cached definition (normal range ${t.range} ${t.unit}); flag(${r.value}) gives ${r.flag}.`,
    actions: [
      { ring: "fw" },
      { call: ["client", "factory"], label: `test_def("${t.code}")`, scalaLabel: `testDef("${t.code}")`, result: "cached" },
      { call: ["client", "ctx", "fw"], label: `flag(${r.value})`, result: `"${r.flag}"`, back: ["fw", "ctx", "client"] }
    ]
  };
}

const labs: ExampleAnimation = {
  diagram: miniDiagram({
    label: "The lab system calls the memoised test_def function; it caches TestDefinition objects; each LabResult keeps the patient and value and shares one TestDefinition.",
    client: "Lab system",
    factory: { name: "test_def(code)", kind: "singleton", stereotype: "«@cache function»", members: ["loads once per code", "+ cache_clear()"], scala: ["loads once per code", "- loaded: Map"] },
    flyweight: { name: "TestDefinition", members: ["+ name, unit, low, high", "+ flag(value): str"], scala: ["+ name, unit, low, high", "+ flag(value): String"] },
    context: { name: "LabResult", members: ["- patient, value", "- test: TestDefinition", "+ line(): str"], scala: ["- patient, value", "- test: TestDefinition", "+ line(): String"] }
  }),
  walk: [
    [...BUILD, { call: ["client", "ctx"], label: "6 readings" }],
    [
      { ring: "factory" },
      { call: ["client", "factory", "fw"], label: 'test_def("HB")', scalaLabel: 'testDef("HB")', result: "TestDefinition HB", back: ["fw", "factory", "client"] },
      { call: ["client", "factory", "fw"], label: 'test_def("GLU")', scalaLabel: 'testDef("GLU")', result: "TestDefinition GLU", back: ["fw", "factory", "client"] },
      { tag: "factory", text: "loaded: 2" }
    ],
    [
      { ring: "factory" },
      { call: ["client", "factory"], label: 'test_def("HB")', scalaLabel: 'testDef("HB")', result: "same HB" },
      { tag: "factory", text: "hit: still 2" },
      { pulse: "fw" }
    ],
    [
      { ring: "fw" },
      { call: ["client", "ctx", "fw"], label: "flag(11.2)", result: '"LOW"', back: ["fw", "ctx", "client"] },
      { call: ["client", "ctx", "fw"], label: "flag(126.0)", result: '"HIGH"', back: ["fw", "ctx", "client"] }
    ],
    [
      { ring: null },
      { tag: "ctx", text: "results: 6" },
      { tag: "fw", text: "definitions: 2" },
      { pulse: "fw" }
    ]
  ],
  tryIt: {
    prompt: "Pick a test and a patient. The shared definition flags their reading.",
    groups: [
      { label: "Test", options: [{ id: "hb", label: "HB" }, { id: "glu", label: "GLU" }] },
      { label: "Patient", options: [{ id: "anil", label: "Anil" }, { id: "bina", label: "Bina" }, { id: "chitra", label: "Chitra" }] }
    ],
    results: Object.fromEntries(["hb", "glu"].flatMap((t) => ["anil", "bina", "chitra"].map((p) => [`${t}|${p}`, labTry(t, p)])))
  }
};

const animation: PatternAnimation = {
  slug: "flyweight",
  story: storyAnim,
  examples: { editor, forest, seats, labs },
  sequence: {
    label: "The client asks MarkerStyleFactory for a style twice: the first call creates a MarkerStyle, the second returns the cached one; then a Marker draws itself using the shared style.",
    participants: [
      { id: "app", name: "App", kind: "client" },
      { id: "factory", name: "MarkerStyleFactory", kind: "singleton" },
      { id: "style", name: "car: MarkerStyle", kind: "concrete" },
      { id: "marker", name: "m0: Marker", kind: "concrete" }
    ],
    messages: [
      { from: "app", to: "factory", label: 'get("car.png", "yellow")' },
      { from: "factory", to: "style", label: "MarkerStyle(car.png, yellow)", kind: "create" },
      { from: "factory", to: "app", label: "car style", kind: "return" },
      { from: "app", to: "marker", label: "Marker(17.38, 78.48, style)", kind: "create" },
      { from: "app", to: "factory", label: 'get("car.png", "yellow")' },
      { from: "factory", to: "app", label: "same car style (cached)", kind: "return" },
      { from: "app", to: "marker", label: "draw()" },
      { from: "marker", to: "style", label: "read icon, color" },
      { from: "marker", to: "app", label: '"car.png (yellow) at 17.3800,78.4800"', kind: "return" }
    ]
  }
};

export default animation;
