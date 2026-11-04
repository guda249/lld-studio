import type { Action, DiagramSpec, DNode, ExampleAnimation, PatternAnimation, TryResult } from "../../../anim/types";

/* ---------- story: logging, caching and retry layers around one HTTP client ---------- */

const story: DiagramSpec = {
  label: "BasicHttpClient and ClientDecorator implement HttpClient; ClientDecorator wraps one HttpClient; LoggingClient, CachingClient and RetryClient extend ClientDecorator; Demo code uses the stack.",
  width: 940,
  height: 440,
  portraitWidth: 340,
  portraitHeight: 528,
  nodes: [
    { id: "client", kind: "client", name: "Demo code", hidden: true,
      at: { x: 16, y: 20, w: 120, h: 56 }, portrait: { x: 220, y: 400, w: 112, h: 56 } },
    { id: "iface", kind: "interface", name: "HttpClient", key: true, hidden: true,
      members: ["+ get(url): str"], scalaMembers: ["+ get(url): String"],
      at: { x: 360, y: 20, w: 220 }, portrait: { x: 110, y: 40, w: 222 } },
    { id: "deco", kind: "abstract", name: "ClientDecorator", key: true, hidden: true,
      members: ["- inner: HttpClient", "+ get(url)"],
      at: { x: 200, y: 150, w: 240 }, portrait: { x: 30, y: 150, w: 176 } },
    { id: "basic", kind: "concrete", name: "BasicHttpClient", members: ["+ get(url)"],
      at: { x: 700, y: 150, w: 180 }, portrait: { x: 216, y: 150, w: 120 } },
    { id: "naive", kind: "concrete", name: "BasicHttpClient subclasses", members: [],
      at: { x: 640, y: 280, w: 290 }, portrait: { x: 8, y: 392, w: 200 } },
    { id: "logging", kind: "concrete", name: "LoggingClient", hidden: true, members: ["+ get(url)"],
      at: { x: 130, y: 320, w: 150 }, portrait: { x: 6, y: 290, w: 104 } },
    { id: "caching", kind: "concrete", name: "CachingClient", hidden: true, members: ["+ get(url)"],
      at: { x: 300, y: 320, w: 150 }, portrait: { x: 118, y: 290, w: 104 } },
    { id: "retry", kind: "concrete", name: "RetryClient", hidden: true, members: ["+ get(url)"],
      at: { x: 470, y: 320, w: 150 }, portrait: { x: 230, y: 290, w: 104 } }
  ],
  edges: [
    { id: "r-basic", from: "basic", to: "iface", type: "realization", hidden: true },
    { id: "r-deco", from: "deco", to: "iface", type: "realization", hidden: true },
    { id: "wraps", from: "deco", to: "iface", type: "association", label: "wraps", hidden: true,
      via: [[150, 57], [150, 197]], viaPortrait: [[12, 77], [12, 197]] },
    { id: "i-log", from: "logging", to: "deco", type: "inheritance", hidden: true },
    { id: "i-cache", from: "caching", to: "deco", type: "inheritance", hidden: true },
    { id: "i-retry", from: "retry", to: "deco", type: "inheritance", hidden: true }
  ],
  badges: [
    { id: "warn", text: "Logging code copied; 8 classes", tone: "warn", near: "naive" },
    { id: "ok", text: "3 classes cover all 8 combinations", tone: "ok", near: "caching", place: "below" }
  ]
};

const DOWN = ["client", "logging", "caching", "retry", "basic"];
const basicCalls = (n: number): Action => ({ members: "basic", lines: [`- calls = ${n}`, "+ get(url)"] });

const storyAnim: PatternAnimation["story"] = {
  diagram: story,
  steps: [
    {
      title: "The problem: a subclass for every combination",
      what: "Logging, caching and retries are added by subclassing: LoggingClient, CachingClient, LoggingCachingClient… The logging code is copied into each one.",
      why: "Three optional features need 2³ = 8 classes to cover every combination, and each new feature doubles that. Inheritance fixes the mix when the code is written.",
      say: {
        what: "Here's the problem. Logging, caching and retries are added by subclassing: a logging client, a caching client, a logging caching client, and so on. The logging code gets copied into each one.",
        why: "Three optional features need eight classes to cover every combination, and each new feature doubles that."
      },
      code: "problem",
      lines: { python: [6, 12, 22, 23, 25], scala: [6, 11, 17, 18, 20] },
      actions: [
        { members: "naive", stagger: true,
          lines: ["LoggingClient", "CachingClient", "LoggingCachingClient", "…8 classes for 3 features"] },
        { flash: "naive" },
        { shake: "naive", together: true },
        { show: ["warn"], together: true }
      ]
    },
    {
      title: "One interface for the real client and every layer",
      what: "HttpClient declares get(url). BasicHttpClient implements it and does the real network call; its first call fails, like a flaky network.",
      why: "Anything that talks to an HttpClient will accept any object with get(url), real or wrapped (Liskov Substitution).",
      say: {
        what: "First, an H T T P client interface declares get. The basic client implements it and makes the real network call. Its first call fails, like a flaky network.",
        why: "Anything that uses an H T T P client will accept any object with get, real or wrapped. That's Liskov substitution."
      },
      code: "main",
      lines: { python: [4, 5, 6, 9, 15], scala: [3, 4, 7, 9] },
      actions: [
        { hide: ["warn"] },
        { dim: ["naive"], together: true },
        { show: ["iface"] },
        { show: ["r-basic"] },
        basicCalls(0)
      ]
    },
    {
      title: "A decorator is a client that wraps a client",
      what: "ClientDecorator implements HttpClient and also holds one inner HttpClient. By default it just passes get() on to it.",
      why: "Is-a plus has-a: because a decorator is itself an HttpClient, decorators can wrap each other in any order.",
      say: {
        what: "Next, a client decorator. It implements the H T T P client interface, and it also holds one inner client. By default, it just passes get on to it.",
        why: "It is an H T T P client, and it has one. Because a decorator is itself a client, decorators can wrap each other, in any order."
      },
      code: "main",
      lines: { python: [22, 23, 24, 26, 27], scala: [14, 15] },
      actions: [
        { hide: ["naive"] },
        { show: ["deco"] },
        { show: ["r-deco"] },
        { show: ["wraps"] },
        { mark: "deco", member: 0 }
      ]
    },
    {
      title: "Each layer adds exactly one behaviour",
      what: "LoggingClient prints a line, CachingClient remembers answers, RetryClient tries again on a network error. Each then calls super().get(), which passes the call inwards.",
      why: "One behaviour per class (Single Responsibility). BasicHttpClient is never edited (Open/Closed).",
      say: {
        what: "Now each layer adds exactly one behaviour. The logging client prints a line, the caching client remembers answers, and the retry client tries again after a network error. Each one then passes the call inwards.",
        why: "One behaviour per class: single responsibility. And the basic client is never edited: open-closed."
      },
      code: "main",
      lines: { python: [30, 32, 36, 42, 49, 59], scala: [17, 19, 22, 25, 29, 38] },
      actions: [
        { mark: "deco", member: null },
        { spawn: ["logging", "caching", "retry"], from: "deco" },
        { show: ["i-log", "i-cache", "i-retry"] }
      ]
    },
    {
      title: "Stack the layers at runtime",
      what: "Demo code builds LoggingClient(CachingClient(RetryClient(basic))). Logging is outermost; the real client sits in the middle.",
      why: "The combination is chosen when objects are created, not when classes are written. Another caller can build a different stack.",
      say: {
        what: "The demo code builds the stack: logging, around caching, around retry, around the basic client. Logging is the outermost layer.",
        why: "The combination is chosen when the objects are created, not when the classes are written. Another caller can build a different stack."
      },
      code: "main",
      lines: { python: [65, 66], scala: [44, 45] },
      actions: [
        { show: ["client"] },
        { call: ["client", "logging"], label: "Logging(Caching(Retry(basic)))" },
        { ring: "logging", caption: "outermost" },
        { pulse: "caching" }, { pulse: "retry" }, { pulse: "basic" }
      ]
    },
    {
      title: "First call travels in and hits a blip",
      what: "get(url) prints the LOG line, misses the cache, and reaches BasicHttpClient through RetryClient. The network blip raises an error.",
      why: "Each layer does its bit and passes the call on. None of them knows what is inside the next one.",
      say: {
        what: "The first get call prints the log line, misses the cache, and reaches the basic client through the retry layer. The network blip raises an error.",
        why: "Each layer does its own bit, and passes the call on. None of them knows what's inside the next one."
      },
      code: "main",
      lines: { python: [16, 17, 18, 32, 33, 45, 57], scala: [10, 11, 19, 20, 26, 35] },
      actions: [
        { ring: null },
        { call: DOWN, label: "get(url)" },
        basicCalls(1),
        { flash: "basic" },
        { shake: "basic", together: true },
        { ring: "retry", caption: "attempt 1 failed" }
      ]
    },
    {
      title: "Retry tries again; the answer flows back out",
      what: "RetryClient calls again and gets the HTML. On the way out CachingClient stores it and LoggingClient returns it to Demo code.",
      why: "The retry is invisible to the caller. Layers add behaviour on the way in and on the way out.",
      say: {
        what: "The retry layer calls again, and this time gets the H T M L. On the way out, the caching layer stores it, and the logging layer returns it to the demo code.",
        why: "The retry is invisible to the caller. Layers can add behaviour on the way in, and on the way out."
      },
      code: "main",
      lines: { python: [19, 45, 46, 58, 59, 67], scala: [12, 27, 37, 38, 41, 46] },
      actions: [
        { call: ["retry", "basic"], label: "attempt 2", result: '"<html for …>"', back: ["basic", "retry", "caching", "logging", "client"] },
        basicCalls(2),
        { ring: "caching", caption: "stored" }
      ]
    },
    {
      title: "Second call: the cache answers",
      what: "The same get(url) is logged again, but CachingClient answers from memory. The call never reaches RetryClient or the network.",
      why: "A layer can also stop early. The real client made only 2 network calls for 2 requests, one of them a retry.",
      say: {
        what: "The same get call is logged again, but this time the caching layer answers from memory. The call never reaches the retry layer, or the network.",
        why: "A layer can also stop early. The real client made only two network calls in total."
      },
      code: "main",
      lines: { python: [42, 43, 46, 68, 69], scala: [25, 27, 47, 48] },
      actions: [
        { call: ["client", "logging", "caching"], label: "get(url)", result: "cache hit" },
        { ring: "caching", caption: "cache hit" },
        { pulse: "basic" }
      ]
    },
    {
      title: "Mix and match: 3 classes, every combination",
      what: "Any subset of the three layers, in any order, is just a different stack of objects. No combination needs its own class.",
      why: "3 decorator classes replace 8 subclasses, and a fourth feature is one more class, not eight more (Open/Closed).",
      say: {
        what: "Any subset of the three layers, in any order, is just a different stack of objects. No combination needs its own class.",
        why: "Three decorator classes replace eight subclasses. And a fourth feature is just one more class, not eight more."
      },
      code: "main",
      lines: { python: [66], scala: [45] },
      actions: [
        { ring: null },
        { show: ["ok"] },
        { pulse: "logging", together: true },
        { pulse: "caching", together: true },
        { pulse: "retry", together: true }
      ]
    }
  ]
};

/* ---------- examples 1 and 2: component interface, base decorator, components and decorators ---------- */

interface Box { name: string; members: string[]; scalaMembers?: string[] }
interface DecoCfg { label: string; client: string; iface: Box; deco: Box; comps: Box[]; decs: Box[] }

const h = (stereo: boolean, n: number) => (stereo ? 44 : 32) + (n ? n * 20 + 10 : 0);

function decoMini(c: DecoCfg): DiagramSpec {
  const ih = h(true, c.iface.members.length), dh = h(true, c.deco.members.length);
  const ch = Math.max(...c.comps.map((b) => h(false, b.members.length)));
  const kh = Math.max(...c.decs.map((b) => h(false, b.members.length)));
  // landscape
  const R2 = 16 + ih + 46, R3 = R2 + Math.max(dh, ch) + 44;
  const compAt = c.comps.length === 1 ? [{ x: 560, w: 180 }] : [{ x: 450, w: 140 }, { x: 602, w: 140 }];
  const decAt = c.decs.length === 3 ? [75, 230, 385] : [152, 307];
  // portrait
  const pR2 = 10 + ih + 36;
  const two = c.comps.length === 2;
  const pDecoY = two ? pR2 + ch + 24 : pR2;
  const pDeco = two ? { x: 80, y: pDecoY, w: 180 } : { x: 30, y: pDecoY, w: 150 };
  const pComp = two ? [{ x: 24, y: pR2, w: 140 }, { x: 176, y: pR2, w: 156 }] : [{ x: 192, y: pR2, w: 140 }];
  const pR3 = Math.max(pDecoY + dh, pR2 + ch) + 36;
  const pDec = c.decs.length === 3 ? [{ x: 8, w: 100 }, { x: 120, w: 100 }, { x: 232, w: 100 }] : [{ x: 30, w: 130 }, { x: 180, w: 130 }];
  const pClientY = pR3 + kh + 36;
  const nodes: DNode[] = [
    { id: "client", kind: "client", name: c.client, hidden: true, at: { x: 16, y: 20, w: 120, h: 54 }, portrait: { x: 8, y: pClientY, w: 120, h: 54 } },
    { id: "iface", kind: "interface", name: c.iface.name, key: true, hidden: true, members: c.iface.members, scalaMembers: c.iface.scalaMembers,
      at: { x: 320, y: 16, w: 220 }, portrait: { x: 110, y: 10, w: 222 } },
    { id: "deco", kind: "abstract", name: c.deco.name, key: true, hidden: true, members: c.deco.members, scalaMembers: c.deco.scalaMembers,
      at: { x: 190, y: R2, w: 220 }, portrait: pDeco },
    ...c.comps.map((b, i): DNode => ({ id: "c" + i, kind: "concrete", name: b.name, hidden: true, members: b.members, scalaMembers: b.scalaMembers,
      at: { x: compAt[i].x, y: R2, w: compAt[i].w }, portrait: pComp[i] })),
    ...c.decs.map((b, i): DNode => ({ id: "d" + i, kind: "concrete", name: b.name, hidden: true, members: b.members, scalaMembers: b.scalaMembers,
      at: { x: decAt[i], y: R3, w: 140 }, portrait: { x: pDec[i].x, y: pR3, w: pDec[i].w } }))
  ];
  return {
    label: c.label, width: 760, height: R3 + kh + 34, portraitWidth: 340, portraitHeight: pClientY + 54 + 14, nodes,
    edges: [
      ...c.comps.map((_, i) => ({ id: "r-c" + i, from: "c" + i, to: "iface", type: "realization" as const, hidden: true })),
      { id: "r-deco", from: "deco", to: "iface", type: "realization", hidden: true },
      { id: "wraps", from: "deco", to: "iface", type: "association", hidden: true,
        via: [[160, 16 + ih / 2], [160, R2 + dh / 2]], viaPortrait: [[12, 10 + ih / 2], [12, pDecoY + dh / 2]] },
      ...c.decs.map((_, i) => ({ id: "i-d" + i, from: "d" + i, to: "deco", type: "inheritance" as const, hidden: true }))
    ]
  };
}

const buildDeco = (comps: number, decs: number): Action[] => {
  const cs = Array.from({ length: comps }, (_, i) => "c" + i), ds = Array.from({ length: decs }, (_, i) => "d" + i);
  return [
    { show: ["client", "iface"] },
    { show: cs }, { show: cs.map((id) => "r-" + id) },
    { show: ["deco"] }, { show: ["r-deco", "wraps"] },
    { show: ds }, { show: ds.map((id) => "i-" + id) }
  ];
};

/* --- 1. chai add-ons --- */

const CHAI: Record<string, { out: string; path: string[]; note: string }> = {
  "chai|none": { out: "Masala chai ₹40", path: ["c0"], note: "No add-ons: the plain component answers on its own." },
  "chai|ginger": { out: "Masala chai + ginger ₹50", path: ["d0", "c0"], note: "40 + 10" },
  "chai|jg": { out: "Masala chai + jaggery + ginger ₹65", path: ["d0", "d1", "c0"], note: "40 + 15 (jaggery) + 10 (ginger)" },
  "chai|oat2": { out: "Masala chai + oat milk + oat milk ₹110", path: ["d2", "c0"], note: "OatMilk wraps OatMilk: 40 + 35 + 35" },
  "coffee|none": { out: "Filter coffee ₹50", path: ["c1"], note: "No add-ons: the plain component answers on its own." },
  "coffee|ginger": { out: "Filter coffee + ginger ₹60", path: ["d0", "c1"], note: "50 + 10" },
  "coffee|jg": { out: "Filter coffee + jaggery + ginger ₹75", path: ["d0", "d1", "c1"], note: "50 + 15 (jaggery) + 10 (ginger)" },
  "coffee|oat2": { out: "Filter coffee + oat milk + oat milk ₹120", path: ["d2", "c1"], note: "OatMilk wraps OatMilk: 50 + 35 + 35" }
};
const chaiResult = (key: string): TryResult => {
  const r = CHAI[key];
  return {
    output: r.out, note: r.note,
    actions: [{ ring: r.path[0] }, { call: ["client", ...r.path], label: "cost()", result: "₹" + r.out.split("₹")[1] }]
  };
};

const chai: ExampleAnimation = {
  diagram: decoMini({
    label: "MasalaChai, FilterCoffee and the AddOn base decorator implement Beverage; AddOn wraps one Beverage; Ginger, Jaggery and OatMilk extend AddOn.",
    client: "Order",
    iface: { name: "Beverage", members: ["+ description()", "+ cost()"] },
    deco: { name: "AddOn", members: ["- drink: Beverage"] },
    comps: [{ name: "MasalaChai", members: ["cost = 40"] }, { name: "FilterCoffee", members: ["cost = 50"] }],
    decs: [{ name: "Ginger", members: ["cost + 10"] }, { name: "Jaggery", members: ["cost + 15"] }, { name: "OatMilk", members: ["cost + 35"] }]
  }),
  walk: [
    [...buildDeco(2, 3), { ring: "c0" }, { call: ["client", "c0"], label: "cost()", result: "₹40" }],
    [{ call: ["client", "d0"], label: "Ginger(Jaggery(MasalaChai()))" }, { ring: "d0", caption: "outer layer" }, { pulse: "d1" }, { pulse: "c0" }],
    [{ call: ["client", "d0", "d1", "c0"], label: "cost()", result: "40 + 15 + 10 = ₹65" }],
    [{ ring: "d2", caption: "used twice" }, { call: ["client", "d2", "c1"], label: "cost()", result: "50 + 35 + 35 = ₹120" }]
  ],
  tryIt: {
    prompt: "Pick a drink and a stack of add-ons. What does the order print?",
    groups: [
      { label: "Drink", options: [{ id: "chai", label: "MasalaChai" }, { id: "coffee", label: "FilterCoffee" }] },
      { label: "Add-ons", options: [{ id: "none", label: "None" }, { id: "ginger", label: "Ginger" }, { id: "jg", label: "Jaggery, then Ginger" }, { id: "oat2", label: "OatMilk × 2" }] }
    ],
    results: Object.fromEntries(Object.keys(CHAI).map((k) => [k, chaiResult(k)]))
  }
};

/* --- 2. layered storage --- */

const RAW: Record<string, string> = {
  "rb|pw": "dGVyYzNzPWRyb3dzc2FwX2Jk", "rb|otp": "MTI4ND1wdG8=",
  "br|pw": "0VmcjNzc9Qmcvd3czFGcfJGZ", "br|otp": "=EjM4QTPwR3b",
  "b|pw": "ZGJfcGFzc3dvcmQ9czNjcmV0", "b|otp": "b3RwPTQ4MjE=",
  "r|pw": "terc3s=drowssap_bd", "r|otp": "1284=pto"
};
const LAYERS: Record<string, string[]> = { rb: ["d1", "d0"], br: ["d0", "d1"], b: ["d0"], r: ["d1"] };
const short = (s: string) => (s.length > 12 ? s.slice(0, 11) + "…" : s);
const storageResult = (key: string): TryResult => {
  const [layers, sec] = key.split("|");
  const secret = sec === "pw" ? "db_password=s3cret" : "otp=4821";
  return {
    output: "disk: " + RAW[key],
    note: `read() unwinds the layers in reverse and returns ${secret}.`,
    actions: [
      { ring: LAYERS[layers][0] },
      { call: ["client", ...LAYERS[layers], "c0"], label: `write("${secret}")` },
      { members: "c0", lines: ["raw: " + short(RAW[key])] },
      { call: ["client", ...LAYERS[layers], "c0"], label: "read()", result: secret }
    ]
  };
};

const storage: ExampleAnimation = {
  diagram: decoMini({
    label: "MemoryStore and the StoreDecorator base implement DataStore; StoreDecorator wraps one DataStore; Base64Layer and ReverseLayer extend StoreDecorator.",
    client: "Service",
    iface: { name: "DataStore", members: ["+ write(data)", "+ read()"] },
    deco: { name: "StoreDecorator", members: ["- inner: DataStore"] },
    comps: [{ name: "MemoryStore", members: ["raw: \"\""] }],
    decs: [{ name: "Base64Layer", members: ["write: encode", "read: decode"] }, { name: "ReverseLayer", members: ["write: reverse", "read: reverse"] }]
  }),
  walk: [
    [...buildDeco(1, 2), { call: ["client", "d1", "d0", "c0"], label: "store A: Reverse(Base64(disk))" },
      { call: ["client", "d0", "d1", "c0"], label: "store B: Base64(Reverse(disk))" }],
    [{ ring: "d1" }, { call: ["client", "d1", "d0", "c0"], label: "A.write(secret)" }, { members: "c0", lines: ["raw: dGVyYzNzPWR…"] },
      { ring: "d0" }, { call: ["client", "d0", "d1", "c0"], label: "B.write(secret)" }, { members: "c0", lines: ["raw: 0VmcjNzc9Qm…"] }],
    [{ ring: "d1" }, { members: "c0", lines: ["raw: dGVyYzNzPWR…"] },
      { call: ["client", "d1", "d0", "c0"], label: "A.read()", result: "reverse, then decode" }],
    [{ ring: null }, { call: ["client", "d1", "d0", "c0"], label: "A.read()", result: "db_password=s3cret" },
      { call: ["client", "d0", "d1", "c0"], label: "B.read()", result: "db_password=s3cret" }]
  ],
  tryIt: {
    prompt: "Choose the layer order and the secret. What lands on disk?",
    groups: [
      { label: "Layers (outer → inner)", options: [{ id: "rb", label: "Reverse → Base64" }, { id: "br", label: "Base64 → Reverse" }, { id: "b", label: "Base64 only" }, { id: "r", label: "Reverse only" }] },
      { label: "Secret", options: [{ id: "pw", label: "db_password=s3cret" }, { id: "otp", label: "otp=4821" }] }
    ],
    results: Object.fromEntries(Object.keys(RAW).map((k) => [k, storageResult(k)]))
  }
};

/* --- 3. stackable payment layers (mixins / stackable traits) --- */

const payDiagram: DiagramSpec = {
  label: "Audited, Metered and UpiGateway implement PaymentGateway; ProductionGateway combines Audited, then Metered, then UpiGateway.",
  width: 760, height: 340, portraitWidth: 340, portraitHeight: 378,
  nodes: [
    { id: "client", kind: "client", name: "Demo code", hidden: true, at: { x: 16, y: 20, w: 120, h: 54 }, portrait: { x: 8, y: 310, w: 110, h: 54 } },
    { id: "iface", kind: "interface", name: "PaymentGateway", key: true, hidden: true, members: ["+ pay(user, amount)"],
      at: { x: 300, y: 16, w: 220 }, portrait: { x: 60, y: 10, w: 220 } },
    { id: "audited", kind: "concrete", name: "Audited", stereotype: "«mixin»", key: true, hidden: true, members: ["AUDIT line"],
      at: { x: 130, y: 140, w: 150 }, portrait: { x: 8, y: 120, w: 96 } },
    { id: "metered", kind: "concrete", name: "Metered", stereotype: "«mixin»", key: true, hidden: true, members: ["calls = 0", "volume = 0"],
      at: { x: 300, y: 140, w: 150 }, portrait: { x: 114, y: 120, w: 112 } },
    { id: "upi", kind: "concrete", name: "UpiGateway", hidden: true, members: ["- next_ref"], scalaMembers: ["- nextRef"],
      at: { x: 470, y: 140, w: 150 }, portrait: { x: 236, y: 120, w: 96 } },
    { id: "prod", kind: "concrete", name: "ProductionGateway", hidden: true,
      at: { x: 300, y: 280, w: 170 }, portrait: { x: 90, y: 250, w: 160 } }
  ],
  edges: [
    { id: "r-aud", from: "audited", to: "iface", type: "realization", hidden: true },
    { id: "r-met", from: "metered", to: "iface", type: "realization", hidden: true },
    { id: "r-upi", from: "upi", to: "iface", type: "realization", hidden: true },
    { id: "p-aud", from: "prod", to: "audited", type: "inheritance", hidden: true,
      via: [[146, 296]], viaPortrait: [[56, 266]] },
    { id: "p-met", from: "prod", to: "metered", type: "inheritance", hidden: true,
      via: [[375, 258]], viaPortrait: [[170, 232]] },
    { id: "p-upi", from: "prod", to: "upi", type: "inheritance", hidden: true,
      via: [[545, 296]], viaPortrait: [[284, 266]] }
  ]
};

const meter = (calls: number, volume: number): Action => ({ members: "metered", lines: [`calls = ${calls}`, `volume = ${volume}`] });
const PAY: Record<string, { out: string; note: string; actions: Action[] }> = {
  "plain|one": { out: "UPI-1001, no audit, no metrics", note: "The plain gateway has no layers: no AUDIT line and no counters.",
    actions: [meter(0, 0), { ring: "upi" }, { call: ["client", "upi"], label: 'pay("asha", 499)', result: "UPI-1001" }] },
  "plain|two": { out: "UPI-1002, no audit, no metrics", note: "Two payments, still no side effects: ideal for tests.",
    actions: [meter(0, 0), { ring: "upi" }, { call: ["client", "upi"], label: 'pay("asha", 499)', result: "UPI-1001" },
      { call: ["client", "upi"], label: 'pay("ravi", 1200)', result: "UPI-1002" }] },
  "prod|one": { out: "1 AUDIT line; 1 payment, ₹499", note: "AUDIT asha paid ₹499 ref=UPI-1001",
    actions: [meter(0, 0), { ring: "prod" }, { call: ["client", "prod", "audited", "metered", "upi"], label: 'pay("asha", 499)', result: "UPI-1001" },
      meter(1, 499), { ring: "audited", caption: "AUDIT asha ₹499" }] },
  "prod|two": { out: "2 AUDIT lines; 2 payments, ₹1699", note: "Refs UPI-1001 and UPI-1002; metrics: 2 payments, ₹1699 total.",
    actions: [meter(0, 0), { ring: "prod" }, { call: ["client", "prod", "audited", "metered", "upi"], label: 'pay("asha", 499)', result: "UPI-1001" },
      meter(1, 499), { call: ["client", "prod", "audited", "metered", "upi"], label: 'pay("ravi", 1200)', result: "UPI-1002" },
      meter(2, 1699), { ring: "audited", caption: "2 AUDIT lines" }] }
};

const payments: ExampleAnimation = {
  diagram: payDiagram,
  walk: [
    [{ show: ["client", "iface"] }, { show: ["audited", "metered", "upi"] }, { show: ["r-aud", "r-met", "r-upi"] },
      { ring: "upi" }, { call: ["client", "upi"], label: 'plain.pay("test-user", 1)', result: "UPI-1001" }],
    [{ show: ["prod"] }, { show: ["p-aud", "p-met", "p-upi"] }, { ring: "prod", caption: "Audited → Metered → Upi" }],
    [{ ring: "metered" }, { call: ["client", "prod", "audited", "metered"], label: 'pay("asha", 499)' }, meter(1, 499)],
    [{ call: ["metered", "upi"], label: "super().pay()", scalaLabel: "super.pay()", result: "UPI-1001", back: ["upi", "metered", "audited"] },
      { ring: "audited", caption: "AUDIT asha ₹499" }],
    [{ call: ["client", "prod", "audited", "metered", "upi"], label: 'pay("ravi", 1200)', result: "UPI-1002" }, meter(2, 1699),
      { ring: "metered" }, { call: ["client", "metered"], label: "metrics", result: "2 payments, ₹1699 total" }]
  ],
  tryIt: {
    prompt: "Pay through the plain gateway or the production one. What side effects do you get?",
    groups: [
      { label: "Gateway", options: [{ id: "plain", label: "UpiGateway" }, { id: "prod", label: "ProductionGateway" }] },
      { label: "Payments", options: [{ id: "one", label: "asha ₹499" }, { id: "two", label: "asha ₹499 + ravi ₹1200" }] }
    ],
    results: Object.fromEntries(Object.entries(PAY).map(([k, v]) => [k, { output: v.out, note: v.note, actions: v.actions }]))
  }
};

/* --- 4. function decorator vs Decorator pattern --- */

const gradeDiagram: DiagramSpec = {
  label: "SimpleGradeBook and AuditedGradeBook implement GradeBook; AuditedGradeBook wraps a GradeBook; SimpleGradeBook calls grade_for, which the logged function decorator wrapped once.",
  width: 760, height: 384, portraitWidth: 340, portraitHeight: 444,
  nodes: [
    { id: "client", kind: "client", name: "Demo code", hidden: true, at: { x: 16, y: 20, w: 120, h: 54 }, portrait: { x: 8, y: 236, w: 110, h: 54 } },
    { id: "iface", kind: "interface", name: "GradeBook", key: true, hidden: true, members: ["+ record(student, marks)"],
      at: { x: 300, y: 16, w: 220 }, portrait: { x: 100, y: 10, w: 232 } },
    { id: "simple", kind: "concrete", name: "SimpleGradeBook", hidden: true, members: ["- entries"],
      at: { x: 180, y: 150, w: 170 }, portrait: { x: 186, y: 120, w: 146 } },
    { id: "audited", kind: "concrete", name: "AuditedGradeBook", key: true, hidden: true, members: ["- inner: GradeBook", "- teacher"],
      at: { x: 420, y: 150, w: 190 }, portrait: { x: 24, y: 120, w: 150 } },
    { id: "gradefor", kind: "concrete", name: "grade_for", stereotype: "«function»", hidden: true, members: ["marks → A, B or C"],
      at: { x: 180, y: 270, w: 170 }, portrait: { x: 186, y: 236, w: 146 } },
    { id: "logged", kind: "concrete", name: "logged", stereotype: "«function decorator»", hidden: true, members: ["prints [fn log]"],
      at: { x: 420, y: 270, w: 190 }, portrait: { x: 186, y: 336, w: 146 } }
  ],
  edges: [
    { id: "r-simple", from: "simple", to: "iface", type: "realization", hidden: true },
    { id: "r-audited", from: "audited", to: "iface", type: "realization", hidden: true },
    { id: "wraps", from: "audited", to: "iface", type: "association", hidden: true,
      via: [[650, 53], [650, 191]], viaPortrait: [[12, 47], [12, 161]] },
    { id: "calls", from: "simple", to: "gradefor", type: "dependency", hidden: true },
    { id: "fwrap", from: "logged", to: "gradefor", type: "dependency", label: "wraps", hidden: true }
  ]
};

const GRADE: Record<string, string> = { m60: "C", m72: "B", m91: "A" };
const gradeResult = (key: string): TryResult => {
  const [book, m] = key.split("|");
  const marks = m.slice(1), g = GRADE[m], audited = book === "audited";
  const path = audited ? ["client", "audited", "simple", "gradefor"] : ["client", "simple", "gradefor"];
  return {
    output: audited ? `${g}: fn log + audit line` : `${g}: fn log only`,
    note: `[fn log] grade_for(${marks}) -> ${g}` + (audited ? `; [audit] Ms. Iyer gave Meera grade ${g}` : ""),
    actions: [
      { ring: audited ? "audited" : "simple" },
      { call: path, label: `record("Meera", ${marks})`, result: g },
      { pulse: "logged" }
    ]
  };
};

const grades: ExampleAnimation = {
  diagram: gradeDiagram,
  walk: [
    [{ show: ["gradefor", "logged"] }, { show: ["fwrap"] }, { ring: "logged", caption: "applied once, at load" }],
    [{ show: ["client", "iface"] }, { show: ["simple"] }, { show: ["r-simple", "calls"] }, { ring: "simple" },
      { call: ["client", "simple", "gradefor"], label: 'record("Ravi", 72)', result: "B" }, { pulse: "logged" }],
    [{ show: ["audited"] }, { show: ["r-audited", "wraps"] },
      { call: ["client", "audited"], label: 'AuditedGradeBook(book, "Ms. Iyer")' }, { ring: "audited" }],
    [{ call: ["client", "audited", "simple", "gradefor"], label: 'record("Meera", 91)', result: "A" }, { pulse: "logged" },
      { ring: "audited", caption: "[audit] Ms. Iyer gave Meera A" }],
    [{ ring: "simple" }, { members: "simple", lines: ["Ravi=B, Meera=A"] }, { pulse: "simple" }]
  ],
  tryIt: {
    prompt: "Record Meera's marks through the plain book or the audited one. What gets printed?",
    groups: [
      { label: "Grade book", options: [{ id: "plain", label: "book (plain)" }, { id: "audited", label: "audited (Ms. Iyer)" }] },
      { label: "Marks", options: [{ id: "m60", label: "60" }, { id: "m72", label: "72" }, { id: "m91", label: "91" }] }
    ],
    results: Object.fromEntries(["plain", "audited"].flatMap((b) => ["m60", "m72", "m91"].map((m) => [`${b}|${m}`, gradeResult(`${b}|${m}`)])))
  }
};

const animation: PatternAnimation = {
  slug: "decorator",
  story: storyAnim,
  examples: { chai, storage, payments, grades },
  sequence: {
    label: "Demo code calls get on LoggingClient, which passes it through CachingClient and RetryClient to BasicHttpClient; the first attempt fails and is retried, and CachingClient stores the answer on the way back.",
    participants: [
      { id: "client", name: "Demo code", kind: "client" },
      { id: "log", name: ": LoggingClient", kind: "concrete" },
      { id: "cache", name: ": CachingClient", kind: "concrete" },
      { id: "retry", name: ": RetryClient", kind: "concrete" },
      { id: "basic", name: "basic: BasicHttpClient", kind: "concrete" }
    ],
    messages: [
      { from: "client", to: "log", label: "get(url)" },
      { from: "log", to: "cache", label: "get(url)" },
      { from: "cache", to: "retry", label: "get(url)" },
      { from: "retry", to: "basic", label: "get(url)" },
      { from: "basic", to: "retry", label: "error: network blip", kind: "return" },
      { from: "retry", to: "basic", label: "get(url) again" },
      { from: "basic", to: "retry", label: '"<html…>"', kind: "return" },
      { from: "retry", to: "cache", label: '"<html…>"', kind: "return" },
      { from: "cache", to: "log", label: '"<html…>" (stored)', kind: "return" },
      { from: "log", to: "client", label: '"<html…>"', kind: "return" }
    ]
  }
};

export default animation;
