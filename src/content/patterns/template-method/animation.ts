import type { Action, DiagramSpec, ExampleAnimation, PatternAnimation, TryResult } from "../../../anim/types";

/* ---------- story: two copy-pasted importers share one template method in a base class ---------- */

const story: DiagramSpec = {
  label: "The abstract DataImporter owns run() and the hooks; CsvImporter and KeyValueImporter extend it and fill in parse(); a JsonImporter is added at the end; App is the client.",
  width: 880,
  height: 440,
  portraitWidth: 340,
  portraitHeight: 476,
  nodes: [
    { id: "app", kind: "client", name: "App", at: { x: 20, y: 40, w: 100, h: 56 }, portrait: { x: 8, y: 30, w: 96, h: 56 } },
    { id: "base", kind: "abstract", name: "DataImporter", key: true, hidden: true,
      members: ["+ run(raw): template"],
      scalaMembers: ["+ final run(raw)"],
      at: { x: 300, y: 20, w: 300 }, portrait: { x: 120, y: 10, w: 212 } },
    { id: "csv", kind: "concrete", name: "CsvImporter", key: true,
      members: [], at: { x: 120, y: 250, w: 230 }, portrait: { x: 8, y: 200, w: 156 } },
    { id: "kv", kind: "concrete", name: "KeyValueImporter",
      members: [], at: { x: 370, y: 250, w: 230 }, portrait: { x: 176, y: 200, w: 156 } },
    { id: "json", kind: "concrete", name: "JsonImporter", hidden: true, members: ["parse: JSON"],
      at: { x: 620, y: 250, w: 230 }, portrait: { x: 92, y: 360, w: 156 } }
  ],
  edges: [
    { id: "i-csv", from: "csv", to: "base", type: "inheritance", hidden: true },
    { id: "i-kv", from: "kv", to: "base", type: "inheritance", hidden: true },
    { id: "i-json", from: "json", to: "base", type: "inheritance", hidden: true }
  ],
  badges: [
    { id: "warn", text: "Copy-pasted twice", tone: "warn", near: "csv" },
    { id: "ok", text: "run(): 0 lines changed", tone: "ok", near: "json", place: "below" }
  ]
};

const BASE_FULL = ["+ run(raw): template", "# parse(raw) {abstract}", "# is_valid(r): hook", "# save(rs): hook"];
const BASE_FULL_SCALA = ["+ final run(raw)", "# parse(raw) {abstract}", "# isValid(r): hook", "# save(rs): hook"];

const storyAnim: PatternAnimation["story"] = {
  diagram: story,
  steps: [
    {
      title: "The problem: the same steps, copied",
      what: "CsvImporter and KeyValueImporter both parse, drop records with no id and save. Only parsing differs, but validate and save are copy-pasted.",
      why: "A fix to validation must be made twice, and the two copies slowly drift apart. That is duplicated knowledge (Don't Repeat Yourself).",
      say: {
        what: "Here's the problem. The CSV importer and the key-value importer both parse, drop records with no id, and save. Only parsing differs, but the validate and save code is copy-pasted.",
        why: "A fix to validation has to be made twice, and the two copies slowly drift apart."
      },
      code: "problem",
      lines: { python: [9, 10, 20, 21], scala: [8, 9, 17, 18] },
      actions: [
        { members: "csv", stagger: true, lines: ["+ run(raw):", "  parse CSV", "  drop if no id", "  print Saved N"] },
        { members: "kv", stagger: true, lines: ["+ run(raw):", "  parse k=v", "  drop if no id", "  print Saved N"], together: true },
        { flash: "csv" },
        { flash: "kv", together: true },
        { shake: "kv", together: true },
        { show: ["warn"], together: true }
      ]
    },
    {
      title: "Move the fixed order into a base class",
      what: "An abstract DataImporter gets one method, run(), that calls parse, is_valid and save in that order. Both importers extend it.",
      why: "The algorithm's skeleton is written once. This run() is the template method; in Scala it is final, so no subclass can change the order.",
      say: {
        what: "An abstract data importer class gets one method, run, which calls parse, then is-valid, then save, always in that order. Both importers extend it.",
        why: "The skeleton of the algorithm is written once. This run method is the template method. In Scala it's final, so no subclass can change the order."
      },
      code: "main",
      lines: { python: [6, 7, 8, 9, 10, 11, 23, 30], scala: [3, 4, 5, 6, 7, 8, 18, 26] },
      actions: [
        { hide: ["warn"] },
        { show: ["base"] },
        { show: ["i-csv", "i-kv"] },
        { members: "csv", lines: ["# parse(raw)"] },
        { members: "kv", lines: ["# parse(raw)"], together: true }
      ]
    },
    {
      title: "Required steps and optional hooks",
      what: "parse() is abstract, so every importer must write it. is_valid() and save() are hooks with a default; KeyValueImporter overrides is_valid to also need a name.",
      why: "Subclasses fill in only what differs. Required steps cannot be forgotten, and hooks are there for the few that need them.",
      say: {
        what: "Parse is abstract, so every importer must write it. Is-valid and save are hooks with a default. The key-value importer overrides is-valid, so a record also needs a name.",
        why: "Subclasses fill in only what differs. Required steps can't be forgotten, and hooks are there for the few classes that need them."
      },
      code: "main",
      lines: { python: [13, 14, 16, 17, 19, 20, 24, 31, 38, 39], scala: [10, 12, 13, 15, 16, 19, 27, 35, 36] },
      actions: [
        { members: "base", lines: BASE_FULL, scalaLines: BASE_FULL_SCALA, stagger: true },
        { members: "csv", lines: ["parse: CSV rows"] },
        { members: "kv", lines: ["parse: k=v pairs", "is_valid: + name"], scalaLines: ["parse: k=v pairs", "isValid: + name"] }
      ]
    },
    {
      title: "The client calls run()",
      what: "App calls run() on a CsvImporter. The method that runs is the one written in DataImporter.",
      why: "The client sees one entry point. It never calls parse or save itself, so it cannot get the order wrong.",
      say: {
        what: "The app calls run on a CSV importer. The method that actually runs is the one written in the data importer base class.",
        why: "The client sees one entry point. It never calls parse or save itself, so it can't get the order wrong."
      },
      code: "main",
      lines: { python: [7, 42], scala: [4, 39] },
      actions: [
        { call: ["app", "csv"], label: 'run("id,name\\n1,Pen…")', scalaLabel: 'run("id,name\\n1,Pen…")' },
        { ring: "base", caption: "template method runs" },
        { mark: "base", member: 0 }
      ]
    },
    {
      title: "The base class calls down into the steps",
      what: "run() calls parse() on CsvImporter and gets 3 rows. The default is_valid drops the row with no id, and the default save prints the result.",
      why: "“Don't call us, we'll call you” (the Hollywood principle): the base class decides when each step runs.",
      say: {
        what: "Run calls parse on the CSV importer, and gets three rows back. The default is-valid drops the row with no id, and the default save prints the result.",
        why: "Don't call us, we'll call you. That's the Hollywood principle: the base class decides when each step runs."
      },
      code: "main",
      lines: { python: [8, 9, 10, 17, 20, 24, 25, 26, 27], scala: [5, 6, 7, 13, 16, 19, 20, 23] },
      actions: [
        { mark: "base", member: 1 },
        { call: ["base", "csv"], label: "parse(raw)", result: "3 rows" },
        { mark: "base", member: 2 },
        { pulse: "base" },
        { tag: "csv", text: "row with no id dropped" },
        { mark: "base", member: 3 },
        { tag: "csv", text: "Saved 2 records: ['1', '3']" }
      ]
    },
    {
      title: "A subclass overrides a hook",
      what: "KeyValueImporter runs the same run(). Its own is_valid also needs a name, so the record id=2 is dropped and only 1 record is saved.",
      why: "The order of steps stays identical; only one step behaves differently. Any importer works wherever a DataImporter is expected (Liskov Substitution).",
      say: {
        what: "The key-value importer runs the very same run method. Its own is-valid also needs a name, so the record with id 2 is dropped, and only one record is saved.",
        why: "The order of steps stays identical. Only one step behaves differently."
      },
      code: "main",
      lines: { python: [9, 31, 38, 39, 43], scala: [6, 27, 35, 36, 40] },
      actions: [
        { tag: "csv", text: null },
        { mark: "base", member: null },
        { call: ["app", "kv"], label: 'run("id=1;name=Pen\\nid=2")' },
        { call: ["base", "kv"], label: "parse(raw)", result: "2 records" },
        { mark: "kv", member: 1 },
        { call: ["base", "kv"], label: "is_valid(id=2)", scalaLabel: "isValid(id=2)", result: "False: no name" },
        { tag: "kv", text: "Saved 1 records: ['1']" }
      ]
    },
    {
      title: "A new importer writes only parse()",
      what: "Imagine a JsonImporter (not in the code). It extends DataImporter and writes parse(); validation and saving come for free.",
      why: "run(): 0 lines changed. New formats are added, not edited in (Open/Closed), and the order of steps stays enforced.",
      say: {
        what: "Now imagine a JSON importer. It extends the data importer and writes only parse. Validation and saving come for free.",
        why: "Run has zero lines changed. New formats are added, not edited in. That's the open-closed principle."
      },
      code: "main",
      lines: { python: [7, 8, 9, 10, 11, 14], scala: [4, 5, 6, 7, 8, 10] },
      actions: [
        { ring: null },
        { tag: "kv", text: null, together: true },
        { mark: "kv", member: null, together: true },
        { show: ["json"] },
        { show: ["i-json"] },
        { show: ["ok"] },
        { pulse: "base", together: true }
      ]
    }
  ]
};

/* ---------- examples: one abstract base with the template method, two subclasses ---------- */

interface Sub { id: string; name: string; members: string[]; scalaMembers?: string[] }
interface MiniCfg {
  label: string;
  client: string;
  base: string;
  baseMembers: string[];
  baseScala?: string[];
  subs: [Sub, Sub];
}

const hOf = (n: number, stereo = false) => (stereo ? 44 : 32) + (n ? n * 20 + 10 : 0);

function tmMini(c: MiniCfg): DiagramSpec {
  const bh = hOf(c.baseMembers.length, true);
  const sh = Math.max(...c.subs.map((s) => hOf(s.members.length))) + 18; // room for a value tag
  const ly = 14 + bh + 50;
  const py = 84 + bh + 44;
  return {
    label: c.label,
    width: 760, height: ly + sh + 40,
    portraitWidth: 340, portraitHeight: py + sh + 40,
    nodes: [
      { id: "client", kind: "client", name: c.client, hidden: true, at: { x: 16, y: 30, w: 130, h: 54 }, portrait: { x: 8, y: 14, w: 150, h: 54 } },
      { id: "base", kind: "abstract", name: c.base, key: true, hidden: true, members: c.baseMembers, scalaMembers: c.baseScala,
        at: { x: 210, y: 14, w: 330 }, portrait: { x: 20, y: 84, w: 300 } },
      { id: "s1", kind: "concrete", name: c.subs[0].name, hidden: true, members: c.subs[0].members, scalaMembers: c.subs[0].scalaMembers,
        at: { x: 100, y: ly, w: 260, h: sh }, portrait: { x: 8, y: py, w: 156, h: sh } },
      { id: "s2", kind: "concrete", name: c.subs[1].name, hidden: true, members: c.subs[1].members, scalaMembers: c.subs[1].scalaMembers,
        at: { x: 400, y: ly, w: 260, h: sh }, portrait: { x: 176, y: py, w: 156, h: sh } }
    ],
    edges: [
      { id: "i-s1", from: "s1", to: "base", type: "inheritance", hidden: true },
      { id: "i-s2", from: "s2", to: "base", type: "inheritance", hidden: true }
    ]
  };
}

const BUILD: Action[] = [{ show: ["client"] }, { show: ["base"] }, { show: ["s1", "s2"] }, { show: ["i-s1", "i-s2"] }];
const reset: Action[] = [
  { ring: null }, { mark: "base", member: null, together: true },
  { mark: "s1", member: null, together: true }, { mark: "s2", member: null, together: true },
  { tag: "s1", text: null, together: true }, { tag: "s2", text: null, together: true }
];

/* --- bank statements --- */
const stmt: ExampleAnimation = {
  diagram: tmMini({
    label: "StatementGenerator owns generate() and the footer and separator hooks; EmailStatement and SmsStatement fill in header and format_txn.",
    client: "Demo code", base: "StatementGenerator",
    baseMembers: ["+ generate(name, txns)", "# header(name) {abstract}", "# format_txn(t) {abstract}", "# footer(net): hook", "# separator(): hook"],
    baseScala: ["+ final generate(name, txns)", "# header(name) {abstract}", "# formatTxn(t) {abstract}", "# footer(net): hook", "# separator: hook"],
    subs: [
      { id: "s1", name: "EmailStatement", members: ["header: Dear …", "format_txn: long"], scalaMembers: ["header: Dear …", "formatTxn: long"] },
      { id: "s2", name: "SmsStatement", members: ["header: short", "format_txn: short", 'separator: " | "'], scalaMembers: ["header: short", "formatTxn: short", 'separator: " | "'] }
    ]
  }),
  walk: [
    [...BUILD, { tag: "client", text: "3 txns" }],
    [{ ring: "s1" }, { call: ["client", "s1"], label: 'generate("Priya", txns)' }, { mark: "base", member: 1 },
      { call: ["base", "s1"], label: 'header("Priya")', result: "Dear Priya, …" }, { mark: "base", member: 2 },
      { call: ["base", "s1"], label: "format_txn × 3", scalaLabel: "formatTxn × 3", result: "Salary +85,000 …" }],
    [{ mark: "base", member: 3 }, { pulse: "base" }, { tag: "s1", text: "Net: ₹56,600" }],
    [{ mark: "base", member: null }, { ring: "s2" }, { call: ["client", "s2"], label: 'generate("Priya", txns)' }, { mark: "base", member: 2 },
      { call: ["base", "s2"], label: "format_txn × 3", scalaLabel: "formatTxn × 3", result: "Salary +85000 …" }],
    [{ mark: "s2", member: 2 }, { call: ["base", "s2"], label: "separator()", scalaLabel: "separator", result: '" | "' },
      { tag: "s2", text: "Priya: | Salary +85000 | …" }]
  ],
  tryIt: {
    prompt: "Pick a statement and one step of generate(). Who answers: the subclass, or the base class default?",
    groups: [
      { label: "Statement", options: [{ id: "email", label: "EmailStatement" }, { id: "sms", label: "SmsStatement" }] },
      { label: "Step", options: [{ id: "txn", label: "format_txn(Rent UPI)" }, { id: "sep", label: "separator()" }, { id: "foot", label: "footer(56600)" }] }
    ],
    results: (() => {
      const r: Record<string, TryResult> = {};
      const OUT: Record<string, [string, string, boolean]> = {
        "email|txn": ["  Rent UPI     -22,000", "EmailStatement's own format_txn: padded, with commas.", true],
        "email|sep": ['"\\n" (one line each)', "No override, so the base class default runs.", false],
        "email|foot": ["Net: ₹56,600", "No override: the base class footer adds up the amounts.", false],
        "sms|txn": ["Rent U -22000", "SmsStatement's own format_txn: note cut to 6 letters.", true],
        "sms|sep": ['" | "', "SmsStatement overrides the separator hook.", true],
        "sms|foot": ["Net: ₹56,600", "No override: the base class footer adds up the amounts.", false]
      };
      for (const [key, [output, note, own]] of Object.entries(OUT)) {
        const [who, step] = key.split("|");
        const node = who === "email" ? "s1" : "s2";
        const baseRow = { txn: 2, sep: 4, foot: 3 }[step]!;
        const subRow = step === "txn" ? 1 : 2;
        r[key] = {
          output, note,
          actions: [
            ...reset,
            { ring: node },
            own ? { mark: node, member: subRow } : { mark: "base", member: baseRow },
            { call: own ? ["base", node] : [node, "base"], label: step === "txn" ? "format_txn(Rent UPI)" : step === "sep" ? "separator()" : "footer(56600)",
              scalaLabel: step === "txn" ? "formatTxn(Rent UPI)" : step === "sep" ? "separator" : "footer(56600)", result: output }
          ]
        };
      }
      return r;
    })()
  }
};

/* --- turn-based games --- */
const GAME: Record<string, string> = {
  "nim10|p2": "Asha wins after 5 turns", "nim10|p3": "Ravi wins after 5 turns",
  "nim7|p2": "Asha wins after 3 turns", "nim7|p3": "Meena wins after 3 turns",
  "dice|p2": "Asha wins after 9 turns", "dice|p3": "Asha wins after 10 turns"
};
const GAME_NOTE: Record<string, string> = {
  nim10: "Each turn takes sticks % 4 (or 1); whoever takes the last stick wins.",
  nim7: "7 sticks run out after 3 turns; the third player takes the last one.",
  dice: "DiceRace's setup hook zeroes the scores; seeded rolls until someone reaches 15."
};
const game: ExampleAnimation = {
  diagram: tmMini({
    label: "TurnGame owns play() and the setup and max_turns hooks; NimGame and DiceRace fill in take_turn, is_over and winner.",
    client: "Demo code", base: "TurnGame",
    baseMembers: ["+ play(players)", "# setup(), max_turns(): hooks", "# take_turn(p) {abstract}", "# is_over(), winner() {abstract}"],
    baseScala: ["+ final play(players)", "# setup(), maxTurns: hooks", "# takeTurn(p) {abstract}", "# isOver, winner {abstract}"],
    subs: [
      { id: "s1", name: "NimGame", members: ["- sticks", "take_turn: 1–3"], scalaMembers: ["- sticks", "takeTurn: 1–3"] },
      { id: "s2", name: "DiceRace", members: ["- scores", "setup: scores = 0", "take_turn: roll"], scalaMembers: ["- scores", "setup: scores = 0", "takeTurn: roll"] }
    ]
  }),
  walk: [
    [...BUILD, { ring: "base", caption: "the loop lives here" }, { mark: "base", member: 0 }],
    [{ ring: "s1" }, { call: ["client", "s1"], label: 'play(["Asha", "Ravi"])' }, { mark: "base", member: 2 },
      { call: ["base", "s1"], label: "take_turn × 5", scalaLabel: "takeTurn × 5", result: "Asha takes the last stick" }, { tag: "s1", text: "sticks: 10 → 0" }],
    [{ ring: "s2" }, { mark: "base", member: 1 }, { mark: "s2", member: 1 }, { call: ["base", "s2"], label: "setup(players)", result: "scores all 0" }],
    [{ mark: "s2", member: 2 }, { mark: "base", member: 2 }, { call: ["base", "s2"], label: "take_turn(p)", scalaLabel: "takeTurn(p)", result: "+ roll 1–6" }, { tag: "s2", text: "first to 15" }],
    [{ mark: "s2", member: null }, { mark: "base", member: 0 }, { call: ["s1", "client"], label: "play() result", result: "Asha wins after 5 turns" },
      { call: ["s2", "client"], label: "play() result", result: "Asha wins after 10 turns" }]
  ],
  tryIt: {
    prompt: "Pick a game and how many players. The same play() loop runs every time.",
    groups: [
      { label: "Game", options: [{ id: "nim10", label: "Nim, 10 sticks" }, { id: "nim7", label: "Nim, 7 sticks" }, { id: "dice", label: "DiceRace to 15" }] },
      { label: "Players", options: [{ id: "p2", label: "Asha, Ravi" }, { id: "p3", label: "Asha, Ravi, Meena" }] }
    ],
    results: Object.fromEntries(Object.entries(GAME).map(([key, output]) => {
      const [g, p] = key.split("|");
      const node = g === "dice" ? "s2" : "s1";
      return [key, {
        output, note: GAME_NOTE[g],
        actions: [
          ...reset,
          { ring: node },
          { call: ["client", node], label: p === "p2" ? 'play(["Asha", "Ravi"])' : 'play([…, "Meena"])' },
          { mark: "base", member: 2 },
          { call: ["base", node], label: "take_turn …", scalaLabel: "takeTurn …" },
          { mark: "base", member: 0 },
          { call: [node, "client"], label: "winner()", scalaLabel: "winner", result: output }
        ]
      } satisfies TryResult];
    }))
  }
};

/* --- mini test runner --- */
const TESTS: Record<string, [string, string, "own" | "base"]> = {
  "cart|setup": ["cart = [499, 250]", "CartTotalTest overrides the set_up hook.", "own"],
  "cart|test": ["PASS: total is 749", "Its own test(): 499 + 250 = 749.", "own"],
  "cart|teardown": ["nothing (default hook)", "No override, so the empty base class hook runs.", "base"],
  "disc|setup": ["open test database", "DiscountTest overrides the set_up hook.", "own"],
  "disc|test": ["FAIL: expected 910, got 900.0", "10% off ₹1000 is 900, so check() raises.", "own"],
  "disc|teardown": ["close test database", "Runs in run()'s finally block, even after the failure.", "own"]
};
const tests: ExampleAnimation = {
  diagram: tmMini({
    label: "TestCase owns run() with set_up, test and tear_down; CartTotalTest and DiscountTest fill in the steps.",
    client: "Test runner", base: "TestCase",
    baseMembers: ["+ run(): template", "# set_up(), tear_down(): hooks", "# test() {abstract}", "# check(cond, msg)"],
    baseScala: ["+ final run()", "# setUp(), tearDown(): hooks", "# test() {abstract}", "# check(cond, msg)"],
    subs: [
      { id: "s1", name: "CartTotalTest", members: ["set_up: cart", "test: total == 749"], scalaMembers: ["setUp: cart", "test: total == 749"] },
      { id: "s2", name: "DiscountTest", members: ["set_up: open DB", "test: 900 == 910?", "tear_down: close DB"],
        scalaMembers: ["setUp: open DB", "test: 900 == 910?", "tearDown: close DB"] }
    ]
  }),
  walk: [
    [...BUILD, { ring: "base", caption: "framework owns run()" }, { call: ["client", "s1"], label: "run()" }, { call: ["client", "s2"], label: "run()" }],
    [{ ring: "s1" }, { mark: "base", member: 1 }, { call: ["base", "s1"], label: "set_up()", scalaLabel: "setUp()", result: "cart = [499, 250]" },
      { mark: "base", member: 2 }, { call: ["base", "s1"], label: "test()", result: "PASS" }, { tag: "s1", text: "PASS" }],
    [{ ring: "s2" }, { mark: "base", member: 1 }, { mark: "s2", member: 0 }, { call: ["base", "s2"], label: "set_up()", scalaLabel: "setUp()", result: "open test database" }],
    [{ mark: "base", member: 2 }, { mark: "s2", member: 1 }, { call: ["base", "s2"], label: "test()", result: "expected 910, got 900.0" }, { flash: "s2" }],
    [{ mark: "base", member: 1 }, { mark: "s2", member: 2 }, { call: ["base", "s2"], label: "tear_down() in finally", scalaLabel: "tearDown() in finally", result: "close test database" },
      { tag: "s2", text: "FAIL (expected 910, got 900.0)" }]
  ],
  tryIt: {
    prompt: "Pick a test and a step of run(). Which class's code answers?",
    groups: [
      { label: "Test", options: [{ id: "cart", label: "CartTotalTest" }, { id: "disc", label: "DiscountTest" }] },
      { label: "Step", options: [{ id: "setup", label: "set_up" }, { id: "test", label: "test" }, { id: "teardown", label: "tear_down" }] }
    ],
    results: Object.fromEntries(Object.entries(TESTS).map(([key, [output, note, who]]) => {
      const [t, step] = key.split("|");
      const node = t === "cart" ? "s1" : "s2";
      const subRow = { setup: 0, test: 1, teardown: 2 }[step]!;
      const label = { setup: "set_up()", test: "test()", teardown: "tear_down()" }[step]!;
      const scalaLabel = { setup: "setUp()", test: "test()", teardown: "tearDown()" }[step]!;
      return [key, {
        output, note,
        actions: [
          ...reset,
          { ring: node },
          { mark: "base", member: step === "test" ? 2 : 1 },
          ...(who === "own" ? [{ mark: node, member: subRow } as Action] : []),
          { call: who === "own" ? ["base", node] : [node, "base"], label, scalaLabel, result: output },
          ...(output.startsWith("FAIL") ? [{ flash: node } as Action] : [])
        ]
      } satisfies TryResult];
    }))
  }
};

/* --- booking flow --- */
const booking: ExampleAnimation = {
  diagram: tmMini({
    label: "BookingFlow owns book() with hold, optional ID check, charge and create_ticket; FlightBooking overrides the hooks, HotelBooking keeps the defaults.",
    client: "Travel app", base: "BookingFlow",
    baseMembers: ["+ book(traveller, price)", "# hold_inventory() {abstract}", "# create_ticket(t) {abstract}", "# needs_id_check(): hook = False", "# convenience_fee(): hook = 0"],
    baseScala: ["+ final book(traveller, price)", "# holdInventory() {abstract}", "# createTicket(t) {abstract}", "# needsIdCheck: hook = false", "# convenienceFee: hook = 0"],
    subs: [
      { id: "s1", name: "FlightBooking", members: ["hold: seat 14C", "needs_id_check=True", "convenience_fee=350", "create_ticket()"],
        scalaMembers: ["hold: seat 14C", "needsIdCheck=true", "convenienceFee=350", "createTicket()"] },
      { id: "s2", name: "HotelBooking", members: ["hold: room 204", "create_ticket()"], scalaMembers: ["hold: room 204", "createTicket()"] }
    ]
  }),
  walk: [
    [...BUILD, { ring: "s1" }, { call: ["client", "s1"], label: 'book("Karan", 5400)' }, { mark: "base", member: 1 },
      { call: ["base", "s1"], label: "hold_inventory()", scalaLabel: "holdInventory()", result: "seat 14C held" }],
    [{ mark: "base", member: 3 }, { mark: "s1", member: 1 }, { call: ["base", "s1"], label: "needs_id_check()", scalaLabel: "needsIdCheck", result: "True: ID check runs" }],
    [{ mark: "base", member: 4 }, { mark: "s1", member: 2 }, { call: ["base", "s1"], label: "convenience_fee()", scalaLabel: "convenienceFee", result: "₹350" },
      { tag: "s1", text: "charged ₹5,750" }],
    [{ mark: "base", member: 2 }, { mark: "s1", member: 3 }, { call: ["base", "s1"], label: 'create_ticket("Karan")', scalaLabel: 'createTicket("Karan")', result: "Boarding pass" }],
    [{ mark: "s1", member: null }, { mark: "base", member: 3 }, { ring: "s2" }, { call: ["client", "s2"], label: 'book("Karan", 5400)', result: "Hotel voucher" },
      { tag: "s2", text: "no ID check, charged ₹5,400" }]
  ],
  tryIt: {
    prompt: "Book a flight or a hotel at a price. The hooks decide the extras.",
    groups: [
      { label: "Booking", options: [{ id: "flight", label: "FlightBooking" }, { id: "hotel", label: "HotelBooking" }] },
      { label: "Price", options: [{ id: "p5400", label: "₹5,400" }, { id: "p2000", label: "₹2,000" }] }
    ],
    results: Object.fromEntries(["flight", "hotel"].flatMap((b) => [5400, 2000].map((price) => {
      const flight = b === "flight";
      const total = price + (flight ? 350 : 0);
      const node = flight ? "s1" : "s2";
      const output = `₹${total.toLocaleString("en-IN")} + ${flight ? "boarding pass" : "hotel voucher"}`;
      return [`${b}|p${price}`, {
        output,
        note: flight ? "Hooks: ID check on, ₹350 fee added." : "Default hooks: no ID check, no fee.",
        actions: [
          ...reset,
          { ring: node },
          { mark: "base", member: 4 },
          ...(flight ? [{ mark: "s1", member: 2 } as Action] : []),
          { call: flight ? ["base", node] : [node, "base"], label: flight ? "convenience_fee()" : "convenience_fee()", scalaLabel: "convenienceFee", result: flight ? "350" : "0" },
          { call: ["client", node], label: `book("Karan", ${price})`, result: output }
        ]
      } satisfies TryResult];
    })))
  }
};

const animation: PatternAnimation = {
  slug: "template-method",
  story: storyAnim,
  examples: { statement: stmt, game, tests, booking },
  sequence: {
    label: "App calls run on a CsvImporter; the run method inherited from DataImporter calls parse, then the is_valid and save hooks on the same object, save prints to the console, and run returns the valid records.",
    participants: [
      { id: "app", name: "App", kind: "client" },
      { id: "imp", name: ": CsvImporter", kind: "concrete" },
      { id: "out", name: "console", kind: "singleton" }
    ],
    messages: [
      { from: "app", to: "imp", label: "run(raw)" },
      { from: "imp", to: "imp", label: "parse(raw)", kind: "self" },
      { from: "imp", to: "imp", label: "is_valid(r) × 3", kind: "self" },
      { from: "imp", to: "imp", label: "save(valid)", kind: "self" },
      { from: "imp", to: "out", label: "print(\"Saved 2 records…\")" },
      { from: "imp", to: "app", label: "[{id: 1}, {id: 3}]", kind: "return" }
    ]
  }
};

export default animation;
