import type { Action, DiagramSpec, ExampleAnimation, PatternAnimation, TryResult } from "../../../anim/types";

/* ---------- story: copied paging loops become one OrderIterator behind the Iterator interface ---------- */

const story: DiagramSpec = {
  label: "The caller loops over OrderPages, which hands out a fresh OrderIterator; OrderIterator implements Iterator and fetches pages from OrderPages only when its buffer is empty.",
  width: 900,
  height: 400,
  portraitWidth: 340,
  portraitHeight: 460,
  nodes: [
    { id: "invoice", kind: "client", name: "Invoice job", members: [],
      at: { x: 20, y: 20, w: 230 }, portrait: { x: 8, y: 8, w: 158 } },
    { id: "report", kind: "client", name: "Report", members: [],
      at: { x: 20, y: 200, w: 230 }, portrait: { x: 174, y: 8, w: 158 } },
    { id: "api", kind: "concrete", name: "OrderPages", key: true, members: ["+ fetch_page(page)", ""],
      scalaMembers: ["+ fetchPage(page)", ""],
      at: { x: 310, y: 30, w: 250 }, portrait: { x: 8, y: 150, w: 158 } },
    { id: "caller", kind: "client", name: "Caller", hidden: true,
      at: { x: 640, y: 40, w: 220, h: 56 }, portrait: { x: 182, y: 160, w: 150, h: 56 } },
    { id: "it", kind: "concrete", name: "OrderIterator", key: true, hidden: true,
      members: ["- page = 0", "- buffer: empty", "- done = False", "+ __next__()"],
      scalaMembers: ["- page = 0", "- buffer: empty", "- done = false", "+ hasNext / next()"],
      at: { x: 310, y: 230, w: 250, h: 134 }, portrait: { x: 8, y: 300, w: 158, h: 134 } },
    { id: "iface", kind: "interface", name: "Iterator", key: true, hidden: true,
      members: ["+ __iter__()", "+ __next__()"], scalaMembers: ["+ hasNext: Boolean", "+ next(): T"],
      at: { x: 640, y: 250, w: 220 }, portrait: { x: 182, y: 300, w: 150 } }
  ],
  edges: [
    { id: "p1", from: "invoice", to: "api", type: "dependency", route: "straight" },
    { id: "p2", from: "report", to: "api", type: "dependency", route: "straight" },
    { id: "creates", from: "api", to: "it", type: "dependency", label: "«create»", hidden: true },
    { id: "r-it", from: "it", to: "iface", type: "realization", hidden: true },
    { id: "loops", from: "caller", to: "api", type: "dependency", hidden: true },
    { id: "uses", from: "caller", to: "iface", type: "association", hidden: true }
  ],
  badges: [
    { id: "warn", text: "Paging leaks out", tone: "warn", near: "api", place: "below" },
    { id: "ok", text: "Callers unchanged", tone: "ok", near: "caller", place: "above" }
  ]
};

const itState = (page: number, buffer: string, done = false): Action => ({
  members: "it",
  lines: [`- page = ${page}`, `- buffer: ${buffer}`, `- done = ${done ? "True" : "False"}`, "+ __next__()"],
  scalaLines: [`- page = ${page}`, `- buffer: ${buffer}`, `- done = ${done}`, "+ hasNext / next()"]
});
const NEXT = ["caller", "iface", "it"];
const FETCH = [...NEXT, "api"];

const storyAnim: PatternAnimation["story"] = {
  diagram: story,
  steps: [
    {
      title: "The problem: every caller writes the paging loop",
      what: "The invoice job and the report both ask OrderPages for page 0, then page 1, and stop on an empty page. The same loop is copied into every caller.",
      why: "The callers know how the data is stored. Switch the API to cursors and every copied loop breaks (Single Responsibility is broken, and the details leak).",
      say: {
        what: "Here's the problem. The invoice job and the report both ask for page zero, then page one, and stop when a page is empty. The same loop is copied into every caller.",
        why: "The callers know exactly how the data is stored. Switch the API to cursors, and every copied loop breaks."
      },
      code: "problem",
      lines: { python: [14, 15, 16, 18, 19, 23, 24, 25, 27, 28], scala: [13, 14, 15, 17, 18, 23, 24, 25, 27, 28] },
      actions: [
        { members: "invoice", stagger: true, lines: ["page = 0", "while batch: …", "page += 1"],
          scalaLines: ["var page = 0", "while batch.nonEmpty", "page += 1"] },
        { members: "report", stagger: true, lines: ["page = 0", "while batch: …", "page += 1"],
          scalaLines: ["page = 0", "while batch.nonEmpty", "page += 1"], together: true },
        { call: ["invoice", "api"], label: "fetch_page(0, 1, 2, 3)", scalaLabel: "fetchPage(0, 1, 2, 3)" },
        { call: ["report", "api"], label: "fetch_page(0, 1, 2, 3)", scalaLabel: "fetchPage(0, 1, 2, 3)", together: true },
        { flash: "invoice" },
        { flash: "report", together: true },
        { show: ["warn"], together: true }
      ]
    },
    {
      title: "Move the walk into an iterator object",
      what: "The paging state (current page, a small buffer, a done flag) moves out of the callers into one OrderIterator.",
      why: "Walking the data becomes its own job, written once (Single Responsibility). The callers no longer hold any paging variables.",
      say: {
        what: "The paging state, meaning the current page, a small buffer and a done flag, moves out of the callers into one order iterator object.",
        why: "Walking the data becomes its own job, written only once. The callers no longer hold any paging variables."
      },
      code: "main",
      lines: { python: [15, 16, 17, 18, 19, 20], scala: [9, 10, 11, 12] },
      actions: [
        { hide: ["warn"] },
        { dim: ["invoice", "report", "p1", "p2"], together: true },
        { spawn: ["it"], from: "invoice" },
        { show: ["creates"] }
      ]
    },
    {
      title: "One standard interface for the walk",
      what: "OrderIterator implements the language's Iterator: __iter__ and __next__ in Python, hasNext and next() in Scala. OrderPages hands out a fresh one for every loop.",
      why: "Any code that can loop can now walk the orders. The caller depends on the Iterator interface, not on pages (Dependency Inversion).",
      say: {
        what: "The order iterator implements the language's standard iterator interface. In Python that's dunder iter and dunder next; in Scala it's has-next and next. Order pages hands out a fresh one for every loop.",
        why: "Any code that can loop can now walk the orders. The caller depends on the iterator interface, not on pages. That's dependency inversion."
      },
      code: "main",
      lines: { python: [11, 12, 22, 23, 25], scala: [7, 9, 14, 21] },
      actions: [
        { show: ["iface"] },
        { show: ["r-it"] },
        { members: "api", lines: ["+ fetch_page(page)", "+ __iter__()"], scalaLines: ["+ fetchPage(page)", "+ iterator"] },
        { pulse: "api" }
      ]
    },
    {
      title: "The caller just loops",
      what: "The copied loops are gone. The caller writes for order in pages, which asks OrderPages for a fresh iterator.",
      why: "No page numbers in the caller at all. Two loops over the same pages get two iterators, so they never disturb each other.",
      say: {
        what: "The copied loops are gone. The caller simply writes: for order in pages. That asks order pages for a fresh iterator.",
        why: "There are no page numbers in the caller at all. Two loops over the same pages get two separate iterators, so they never disturb each other."
      },
      code: "main",
      lines: { python: [11, 12, 35, 36, 37], scala: [7, 28, 29] },
      actions: [
        { hide: ["invoice", "report", "p1", "p2"] },
        { show: ["caller"] },
        { show: ["loops", "uses"] },
        { call: ["caller", "api", "it"], label: "iter(pages)", scalaLabel: "pages.iterator" },
        { ring: "it", caption: "fresh iterator" }
      ]
    },
    {
      title: "The first next() fetches a page",
      what: "The buffer is empty, so next() fetches page 0 (three orders), keeps them in its buffer and returns order-0.",
      why: "Pages are fetched lazily, only when an item is needed. The caller never sees that a fetch happened.",
      say: {
        what: "The buffer is empty, so the first next call fetches page zero, which holds three orders. The iterator keeps them in its buffer and returns order zero.",
        why: "Pages are fetched lazily, only when an item is actually needed. The caller never sees that a fetch happened."
      },
      code: "main",
      lines: { python: [25, 26, 27, 28, 29, 32], scala: [14, 15, 16, 17, 18, 21, 23, 24, 25] },
      actions: [
        { ring: "it" },
        { call: FETCH, label: "next() → fetch_page(0)", scalaLabel: "next() → fetchPage(0)", result: "order-0" },
        itState(1, "order-1, 2"),
        { tag: "it", text: "1 API call" }
      ]
    },
    {
      title: "The buffer serves the next items",
      what: "The next two calls return order-1 and order-2 straight from the buffer. Only when it is empty again does next() fetch page 1.",
      why: "The iterator decides when to touch the data source. The caller sees one steady stream of orders.",
      say: {
        what: "The next two calls return order one and order two straight from the buffer. Only when the buffer is empty again does the iterator fetch page one.",
        why: "The iterator decides when to touch the data source. The caller just sees one steady stream of orders."
      },
      code: "main",
      lines: { python: [26, 30, 32], scala: [15, 19, 23, 24] },
      actions: [
        { call: NEXT, label: "next()", result: "order-1" },
        itState(1, "order-2"),
        { call: NEXT, label: "next()", result: "order-2" },
        itState(1, "empty"),
        { call: FETCH, label: "next() → fetch_page(1)", scalaLabel: "next() → fetchPage(1)", result: "order-3" },
        itState(2, "order-4, 5"),
        { tag: "it", text: "2 API calls" }
      ]
    },
    {
      title: "An empty page ends the walk",
      what: "After order-6, page 3 comes back empty. The iterator sets done, and the loop ends (StopIteration in Python, hasNext = false in Scala).",
      why: "Knowing when to stop is the iterator's job too. The done flag also stops any further calls to the API.",
      say: {
        what: "After order six, page three comes back empty. The iterator sets its done flag, and the loop ends.",
        why: "Knowing when to stop is the iterator's job too. The done flag also stops any further calls to the API."
      },
      code: "main",
      lines: { python: [20, 29, 30, 31], scala: [12, 18, 19, 22] },
      actions: [
        { call: FETCH, label: "next() → fetch_page(3)", scalaLabel: "hasNext → fetchPage(3)", result: "StopIteration" },
        itState(4, "empty", true),
        { tag: "it", text: "4 API calls, done" },
        { pulse: "it" }
      ]
    },
    {
      title: "Change the storage, keep every caller",
      what: "If the API moves from page numbers to cursors, only OrderPages and OrderIterator change. Every for loop stays exactly as it is.",
      why: "The collection hides how it stores and fetches data, so it can change freely. Callers: 0 lines changed (Open/Closed).",
      say: {
        what: "If the API moves from page numbers to cursors, only order pages and the order iterator change. Every for loop stays exactly as it is.",
        why: "The collection hides how it stores and fetches its data, so it can change freely. The callers need zero changes."
      },
      code: "main",
      lines: { python: [36, 37, 39, 40, 41], scala: [29, 31, 32, 33, 34, 35] },
      actions: [
        { ring: null },
        { tag: "it", text: null, together: true },
        { members: "api", lines: ["+ fetch(cursor)", "+ __iter__()"], scalaLines: ["+ fetch(cursor)", "+ iterator"] },
        { members: "it", lines: ["- cursor", "- buffer", "- done", "+ __next__()"], scalaLines: ["- cursor", "- buffer", "- done", "+ hasNext / next()"], together: true },
        { show: ["ok"] },
        { pulse: "caller", together: true }
      ]
    }
  ]
};

/* ---------- real-world examples ---------- */

/* --- playlist with in-order and shuffled iterators --- */
const playlistDiagram: DiagramSpec = {
  label: "play uses the SongIterator interface; Playlist hands out InOrder and Shuffled iterators, which both implement SongIterator.",
  width: 760, height: 310, portraitWidth: 340, portraitHeight: 400,
  nodes: [
    { id: "client", kind: "client", name: "play", hidden: true, at: { x: 16, y: 20, w: 130, h: 54 }, portrait: { x: 8, y: 8, w: 150, h: 54 } },
    { id: "iface", kind: "interface", name: "SongIterator", key: true, hidden: true,
      members: ["+ has_next()", "+ next()"], scalaMembers: ["+ hasNext", "+ next()"],
      at: { x: 420, y: 14, w: 190 }, portrait: { x: 176, y: 8, w: 156 } },
    { id: "playlist", kind: "concrete", name: "Playlist", key: true, hidden: true,
      members: ["- songs", "+ in_order()", "+ shuffled(seed)"], scalaMembers: ["- songs", "+ inOrder", "+ shuffled(seed)"],
      at: { x: 16, y: 120, w: 200, h: 114 }, portrait: { x: 8, y: 100, w: 156, h: 114 } },
    { id: "inorder", kind: "concrete", name: "InOrder", hidden: true, members: ["- songs (a copy)", "- pos"],
      at: { x: 330, y: 190, w: 180, h: 94 }, portrait: { x: 8, y: 270, w: 156, h: 94 } },
    { id: "shuffled", kind: "concrete", name: "Shuffled", hidden: true, members: ["- order", "- pos"],
      at: { x: 540, y: 190, w: 180, h: 94 }, portrait: { x: 176, y: 270, w: 156, h: 94 } }
  ],
  edges: [
    { id: "e-uses", from: "client", to: "iface", type: "association", hidden: true },
    { id: "e-list", from: "client", to: "playlist", type: "dependency", hidden: true },
    { id: "hands", from: "playlist", to: "iface", type: "dependency", hidden: true, route: "straight" },
    { id: "r-in", from: "inorder", to: "iface", type: "realization", hidden: true, viaPortrait: [[254, 246], [86, 246]] },
    { id: "r-sh", from: "shuffled", to: "iface", type: "realization", hidden: true, viaPortrait: [[254, 246]] }
  ]
};
/** Song playing after 1, 2 and 4 next() calls (from running ex1-playlist.py). */
const SONGS: Record<string, Record<number, string>> = {
  in: { 1: "Monsoon Drive", 2: "Chai at Dawn", 4: "Ghats Sunset" },
  s7: { 1: "Monsoon Drive", 2: "Highway 44", 4: "Coastal Breeze" },
  s42: { 1: "Chai at Dawn", 2: "Ghats Sunset", 4: "Monsoon Drive" }
};
const playTry = (mode: "in" | "s7" | "s42", n: 1 | 2 | 4): TryResult => {
  const box = mode === "in" ? "inorder" : "shuffled";
  const output = SONGS[mode][n];
  return {
    output,
    note: mode === "in"
      ? `InOrder simply moves pos forward: song ${n} of the list.`
      : `Shuffled(seed ${mode.slice(1)}) walks its own mixed order; the playlist itself is untouched.`,
    actions: [
      { tag: box, text: `pos = ${n}` },
      { ring: box },
      { call: ["client", "iface", box], label: `next() × ${n}`, result: output }
    ]
  };
};
const playlist: ExampleAnimation = {
  diagram: playlistDiagram,
  walk: [
    [
      { show: ["client", "playlist", "e-list"] },
      { call: ["client", "playlist"], label: "add() × 5" },
      { tag: "playlist", text: "5 songs" }
    ],
    [
      { show: ["iface", "e-uses"] },
      { show: ["inorder", "r-in", "hands"] },
      { ring: "inorder" },
      { call: ["client", "iface", "inorder"], label: "has_next() / next()", scalaLabel: "hasNext / next()", result: "Monsoon Drive … Coastal Breeze" }
    ],
    [
      { show: ["shuffled", "r-sh"] },
      { ring: "shuffled" },
      { call: ["client", "iface", "shuffled"], label: "has_next() / next()", scalaLabel: "hasNext / next()", result: "Monsoon, Highway 44, Ghats, …" }
    ],
    [
      { ring: "inorder" },
      { call: ["client", "iface", "inorder"], label: "A.next() × 2" },
      { tag: "inorder", text: "A pos 2 · B pos 0" }
    ],
    [
      { call: ["client", "iface", "inorder"], label: "A.next(), B.next()", result: "A: Highway 44, B: Monsoon Drive" },
      { tag: "inorder", text: "A pos 3 · B pos 1" }
    ]
  ],
  tryIt: {
    prompt: "Pick a play mode and how many times next() is called. Which song is playing?",
    groups: [
      { label: "Mode", options: [{ id: "in", label: "In order" }, { id: "s7", label: "Shuffle (seed 7)" }, { id: "s42", label: "Shuffle (seed 42)" }] },
      { label: "next() calls", options: [{ id: "n1", label: "1" }, { id: "n2", label: "2" }, { id: "n4", label: "4" }] }
    ],
    results: Object.fromEntries((["in", "s7", "s42"] as const).flatMap((m) => ([1, 2, 4] as const).map((n) => [`${m}|n${n}`, playTry(m, n)])))
  }
};

/* --- depth-first file tree walker --- */
const treeDiagram: DiagramSpec = {
  label: "fileTreeDemo loops over DepthFirst, which implements Iterator and walks a tree of Node objects with its own stack.",
  width: 760, height: 290, portraitWidth: 340, portraitHeight: 400,
  nodes: [
    { id: "client", kind: "client", name: "fileTreeDemo", hidden: true, at: { x: 16, y: 20, w: 140, h: 54 }, portrait: { x: 8, y: 8, w: 140, h: 54 } },
    { id: "dfs", kind: "concrete", name: "DepthFirst", key: true, hidden: true,
      members: ["- stack", "- visited", "+ __next__()"], scalaMembers: ["- stack", "- visited", "+ next()"],
      at: { x: 210, y: 14, w: 230, h: 114 }, portrait: { x: 60, y: 110, w: 230, h: 114 } },
    { id: "iface", kind: "interface", name: "Iterator", key: true, hidden: true,
      members: ["+ __next__()"], scalaMembers: ["+ next()"],
      at: { x: 510, y: 34, w: 190 }, portrait: { x: 176, y: 8, w: 156 } },
    { id: "node", kind: "concrete", name: "Node", hidden: true,
      members: ["name", "children: list[Node]"], scalaMembers: ["name", "children: List[Node]"],
      at: { x: 210, y: 180, w: 230, h: 94 }, portrait: { x: 60, y: 280, w: 230, h: 94 } }
  ],
  edges: [
    { id: "e-client", from: "client", to: "dfs", type: "association", hidden: true },
    { id: "r-dfs", from: "dfs", to: "iface", type: "realization", hidden: true },
    { id: "walks", from: "dfs", to: "node", type: "association", label: "walks", hidden: true }
  ]
};
const treeTry = (file: string, found: string | null, visited: number): TryResult => {
  const output = found ? `found after ${visited} of 9 nodes` : "none (all 9 nodes visited)";
  return {
    output,
    note: found ? `${found} is node ${visited} in depth-first order; the walk stops there.` : "No path ends with that name, so the iterator runs until its stack is empty.",
    actions: [
      { tag: "dfs", text: `visited ${visited}` },
      { tag: "node", text: found ?? "stack empty" },
      { ring: "dfs" },
      { call: ["client", "dfs", "node"], label: `search ${file}`, result: output }
    ]
  };
};
const filetree: ExampleAnimation = {
  diagram: treeDiagram,
  walk: [
    [
      { show: ["client", "dfs", "e-client"] },
      { show: ["iface", "r-dfs"] },
      { show: ["node", "walks"] },
      { tag: "node", text: "app: 9 nodes" }
    ],
    [{ ring: "dfs" }, { tag: "dfs", text: "stack: app" }],
    [
      { call: ["client", "dfs", "node"], label: "next()", result: '"app"' },
      { tag: "dfs", text: "stack: src, tests, README.md" },
      { call: ["client", "dfs", "node"], label: "next()", result: '"app/src"' },
      { tag: "dfs", text: "stack: main.py, utils, …" }
    ],
    [
      { call: ["client", "dfs", "node"], label: "for path in walker", result: "app … app/README.md" },
      { tag: "dfs", text: "visited 9, stack empty" }
    ],
    [
      { call: ["client", "dfs", "node"], label: "search money.py", result: "app/src/utils/money.py" },
      { tag: "dfs", text: "visited 6 of 9" },
      { pulse: "dfs" }
    ]
  ],
  tryIt: {
    prompt: "Search the project for a file. How much of the tree does the lazy walker visit?",
    groups: [
      { label: "Find", options: [
        { id: "main", label: "main.py" }, { id: "money", label: "money.py" },
        { id: "test", label: "test_money.py" }, { id: "none", label: "nothing.py" }
      ] }
    ],
    results: {
      main: treeTry("main.py", "app/src/main.py", 3),
      money: treeTry("money.py", "app/src/utils/money.py", 6),
      test: treeTry("test_money.py", "app/tests/test_money.py", 8),
      none: treeTry("nothing.py", null, 9)
    }
  }
};

/* --- merged bank statement --- */
const stmtDiagram: DiagramSpec = {
  label: "MergedStatement implements Iterator and reads two Feed iterators, UPI on the left and Card on the right, always returning the earlier transaction.",
  width: 760, height: 300, portraitWidth: 340, portraitHeight: 380,
  nodes: [
    { id: "client", kind: "client", name: "statementDemo", hidden: true, at: { x: 16, y: 20, w: 150, h: 54 }, portrait: { x: 8, y: 8, w: 150, h: 54 } },
    { id: "merged", kind: "concrete", name: "MergedStatement", key: true, hidden: true,
      members: ["- a, b: look-ahead", "+ __next__()"], scalaMembers: ["- a, b: look-ahead", "+ next()"],
      at: { x: 210, y: 14, w: 240, h: 94 }, portrait: { x: 40, y: 104, w: 260, h: 94 } },
    { id: "iface", kind: "interface", name: "Iterator[Txn]", key: true, hidden: true,
      members: ["+ __next__()"], scalaMembers: ["+ next()"],
      at: { x: 520, y: 24, w: 200 }, portrait: { x: 176, y: 8, w: 156 } },
    { id: "upi", kind: "concrete", name: "upi: Feed", hidden: true, members: ["1 Swiggy −350", "4 Salary +85000", "9 Rent −22000"],
      at: { x: 210, y: 170, w: 220 }, portrait: { x: 8, y: 250, w: 158 } },
    { id: "card", kind: "concrete", name: "card: Feed", hidden: true, members: ["2 Amazon −1299", "4 Fuel −2000", "12 Netflix −649"],
      at: { x: 470, y: 170, w: 220 }, portrait: { x: 174, y: 250, w: 158 } }
  ],
  edges: [
    { id: "e-client", from: "client", to: "merged", type: "association", hidden: true },
    { id: "r-merged", from: "merged", to: "iface", type: "realization", hidden: true },
    { id: "left", from: "merged", to: "upi", type: "association", label: "left", hidden: true, route: "straight" },
    { id: "right", from: "merged", to: "card", type: "association", label: "right", hidden: true, route: "straight" }
  ]
};
/** After n next() calls: what was returned, the balance, and which row each look-ahead points at (null = feed used up). */
const STMT: Record<number, [string, string, number, number | null, number | null]> = {
  1: ["day 1 UPI Swiggy −350", "upi", 9650, 1, 0],
  2: ["day 2 Card Amazon −1299", "card", 8351, 1, 1],
  3: ["day 4 UPI Salary +85000", "upi", 93351, 2, 1],
  4: ["day 4 Card Fuel −2000", "card", 91351, 2, 2],
  5: ["day 9 UPI Rent −22000", "upi", 69351, null, 2],
  6: ["day 12 Card Netflix −649", "card", 68702, null, null]
};
const look = (a: number | null, b: number | null): Action[] => [{ mark: "upi", member: a }, { mark: "card", member: b, together: true }];
const stmtTry = (n: number): TryResult => {
  const [txn, side, bal, a, b] = STMT[n];
  const output = `${txn}, balance ₹${bal}`;
  return {
    output: output.length <= 40 ? output : `${txn.replace(/^day \d+ /, "")}, ₹${bal}`,
    note: `Call ${n} returns ${txn}. ${a === null && b === null ? "Both feeds are now used up." : "Only the " + (side === "upi" ? "UPI" : "Card") + " look-ahead was refilled."}`,
    actions: [
      { tag: "merged", text: `balance ₹${bal}` },
      { ring: side },
      { call: ["client", "merged", side], label: `next() × ${n}`, result: txn },
      ...look(a, b)
    ]
  };
};
const statement: ExampleAnimation = {
  diagram: stmtDiagram,
  walk: [
    [
      { show: ["upi", "card"] },
      { show: ["client", "merged", "e-client"] },
      { show: ["iface", "r-merged"] },
      { show: ["left", "right"] }
    ],
    [{ ring: "merged", caption: "reads one ahead" }, ...look(0, 0)],
    [
      { ring: "upi" },
      { call: ["client", "merged", "upi"], label: "next(): day 1 vs day 2", result: "day 1 UPI Swiggy −350" },
      { tag: "merged", text: "balance ₹9650" }
    ],
    [
      { mark: "upi", member: 1 },
      { pulse: "upi", together: true },
      { ring: "card" },
      { call: ["client", "merged", "card"], label: "next(): day 4 vs day 2", result: "day 2 Card Amazon −1299" },
      { mark: "card", member: 1 }
    ],
    [
      { ring: null },
      { call: ["client", "merged"], label: "for t in statement", result: "6 transactions in date order" },
      ...look(null, null),
      { tag: "merged", text: "balance ₹68702" }
    ]
  ],
  tryIt: {
    prompt: "Starting from ₹10000, how many times do you call next()? See which feed answers.",
    groups: [
      { label: "next() calls", options: [{ id: "n1", label: "1" }, { id: "n3", label: "3" }, { id: "n4", label: "4" }, { id: "n6", label: "6" }] }
    ],
    results: { n1: stmtTry(1), n3: stmtTry(3), n4: stmtTry(4), n6: stmtTry(6) }
  }
};

/* --- lazy vitals pipeline --- */
const vitalsDiagram: DiagramSpec = {
  label: "vitalsDemo pulls batches, which pulls from plausible, which pulls from the readings sensor stream, one value at a time.",
  width: 760, height: 210, portraitWidth: 340, portraitHeight: 440,
  nodes: [
    { id: "client", kind: "client", name: "vitalsDemo", hidden: true, at: { x: 16, y: 70, w: 130, h: 54 }, portrait: { x: 8, y: 8, w: 150, h: 54 } },
    { id: "batches", kind: "concrete", name: "batches", stereotype: "«iterator»", key: true, hidden: true, members: ["size = 3"],
      at: { x: 186, y: 54, w: 170, h: 86 }, portrait: { x: 60, y: 100, w: 220, h: 86 } },
    { id: "plausible", kind: "concrete", name: "plausible", stereotype: "«iterator»", key: true, hidden: true, members: ["30 ≤ bpm ≤ 220"],
      at: { x: 386, y: 54, w: 170, h: 86 }, portrait: { x: 60, y: 220, w: 220, h: 86 } },
    { id: "readings", kind: "concrete", name: "readings", stereotype: "«iterator»", hidden: true, members: ["sensor, 9 values"],
      at: { x: 586, y: 54, w: 160, h: 86 }, portrait: { x: 60, y: 340, w: 220, h: 86 } }
  ],
  edges: [
    { id: "e1", from: "client", to: "batches", type: "dependency", hidden: true },
    { id: "e2", from: "batches", to: "plausible", type: "dependency", hidden: true },
    { id: "e3", from: "plausible", to: "readings", type: "dependency", hidden: true }
  ]
};
const PULL = ["client", "batches", "plausible", "readings"];
const VITALS: Record<string, [string, number]> = {
  "s2|b1": ["[72, 75]", 2], "s2|b2": ["[78, 80]", 5],
  "s3|b1": ["[72, 75, 78]", 4], "s3|b2": ["[80, 82, 85]", 8],
  "s4|b1": ["[72, 75, 78, 80]", 5], "s4|b2": ["[82, 85, 83]", 9]
};
const vitalsTry = (key: string): TryResult => {
  const [batch, read] = VITALS[key];
  const size = key[1];
  return {
    output: batch,
    note: `${read} of 9 readings pulled so far${read > 2 ? "; 250 bpm was dropped on the way" : ""}${read > 5 ? ", and so was 0 bpm" : ""}.${key === "s4|b2" ? " The stream ended, so this batch is short." : ""}`,
    actions: [
      { members: "batches", lines: [`size = ${size}`] },
      { tag: "readings", text: `${read} read` },
      { ring: "batches" },
      { call: PULL, label: key.endsWith("b1") ? "first batch" : "second batch", result: batch }
    ]
  };
};
const vitals: ExampleAnimation = {
  diagram: vitalsDiagram,
  walk: [
    [
      { show: ["readings"] },
      { show: ["plausible", "e3"] },
      { show: ["batches", "e2"] },
      { show: ["client", "e1"] },
      { tag: "readings", text: "nothing read yet" }
    ],
    [
      { ring: "batches" },
      { call: PULL, label: "next batch?" },
      { tag: "readings", text: "read #0: 72" }
    ],
    [
      { flash: "plausible" },
      { tag: "plausible", text: "dropped 250" },
      { tag: "readings", text: "read #3: 78" },
      { call: ["readings", "plausible", "batches", "client"], label: "batch 1", result: "[72, 75, 78]" }
    ],
    [
      { call: PULL, label: "next batch?" },
      { flash: "plausible" },
      { tag: "plausible", text: "dropped 0" },
      { tag: "readings", text: "read #7: 85" },
      { call: ["readings", "plausible", "batches", "client"], label: "batch 2", result: "[80, 82, 85]" }
    ],
    [
      { call: PULL, label: "next batch?" },
      { tag: "readings", text: "stream ended" },
      { tag: "batches", text: "short last batch" },
      { call: ["readings", "plausible", "batches", "client"], label: "batch 3", result: "[83]" }
    ]
  ],
  tryIt: {
    prompt: "Pick a batch size and which batch the loop asks for. How many readings had to be pulled?",
    groups: [
      { label: "Batch size", options: [{ id: "s2", label: "2" }, { id: "s3", label: "3" }, { id: "s4", label: "4" }] },
      { label: "Batch", options: [{ id: "b1", label: "1st" }, { id: "b2", label: "2nd" }] }
    ],
    results: Object.fromEntries(Object.keys(VITALS).map((k) => [k, vitalsTry(k)]))
  }
};

const animation: PatternAnimation = {
  slug: "iterator",
  story: storyAnim,
  examples: { playlist, filetree, statement, vitals },
  sequence: {
    label: "The caller gets an OrderIterator from OrderPages; the first next() fetches page 0, the second is served from the buffer.",
    participants: [
      { id: "caller", name: "Caller", kind: "client" },
      { id: "it", name: ": OrderIterator", kind: "concrete" },
      { id: "pages", name: "pages: OrderPages", kind: "concrete" }
    ],
    messages: [
      { from: "caller", to: "pages", label: "iter(pages)" },
      { from: "pages", to: "it", label: "OrderIterator(pages)", kind: "create" },
      { from: "pages", to: "caller", label: "iterator", kind: "return" },
      { from: "caller", to: "it", label: "next()" },
      { from: "it", to: "pages", label: "fetch_page(0)" },
      { from: "pages", to: "it", label: "[order-0, order-1, order-2]", kind: "return" },
      { from: "it", to: "caller", label: '"order-0"', kind: "return" },
      { from: "caller", to: "it", label: "next()" },
      { from: "it", to: "it", label: "buffer.pop(0)", kind: "self" },
      { from: "it", to: "caller", label: '"order-1"', kind: "return" }
    ]
  }
};

export default animation;
