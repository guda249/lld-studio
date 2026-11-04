import type { Action, ExampleAnimation, PatternAnimation, TryResult } from "../../../anim/types";

/* ---------- story: two threads race into get(), then double-checked locking ---------- */

const POOL_MEMBERS = ["connections = 10"];

const storyAnim: PatternAnimation["story"] = {
  diagram: {
    label: "Two threads call DbPool.get() at once; without a lock both create a pool, with double-checked locking only one pool is created and shared.",
    width: 900,
    height: 420,
    portraitWidth: 340,
    portraitHeight: 380,
    nodes: [
      { id: "t1", kind: "client", name: "Thread 1",
        at: { x: 20, y: 60, w: 150, h: 54 }, portrait: { x: 8, y: 10, w: 156, h: 50 } },
      { id: "t2", kind: "client", name: "Thread 2",
        at: { x: 20, y: 300, w: 150, h: 54 }, portrait: { x: 176, y: 10, w: 156, h: 50 } },
      { id: "cls", kind: "singleton", name: "DbPool", key: true,
        members: ["- _instance: None", "+ get(): DbPool"],
        scalaMembers: ["- instance: null", "+ get(): DbPool"],
        at: { x: 310, y: 60, w: 240 }, portrait: { x: 8, y: 110, w: 206 } },
      { id: "lock", kind: "concrete", name: "_lock: Lock", hidden: true,
        members: ["owner: none"],
        at: { x: 360, y: 280, w: 140 }, portrait: { x: 226, y: 126, w: 106 } },
      { id: "p1", kind: "concrete", name: "pool #1: DbPool", hidden: true, members: POOL_MEMBERS,
        at: { x: 660, y: 60, w: 200 }, portrait: { x: 8, y: 260, w: 158 } },
      { id: "p2", kind: "concrete", name: "pool #2: DbPool", hidden: true, members: POOL_MEMBERS,
        at: { x: 660, y: 280, w: 200 }, portrait: { x: 176, y: 260, w: 156 } }
    ],
    edges: [
      { id: "t1-c", from: "t1", to: "cls", type: "dependency", route: "straight" },
      { id: "t2-c", from: "t2", to: "cls", type: "dependency", route: "straight" },
      { id: "c-l", from: "cls", to: "lock", type: "composition", hidden: true },
      { id: "c-p1", from: "cls", to: "p1", type: "dependency", label: "creates", hidden: true, route: "straight" },
      { id: "c-p2", from: "cls", to: "p2", type: "dependency", label: "creates", hidden: true, route: "straight" }
    ],
    badges: [
      { id: "warn", text: "Created twice", tone: "warn", near: "p2", place: "below" },
      { id: "jvm", text: "JVM: needs @volatile", tone: "info", near: "cls", place: "below" },
      { id: "ok", text: "Or: object, lazy val, module", tone: "ok", near: "cls" }
    ]
  },
  steps: [
    {
      title: "The problem: two threads, two pools",
      what: "Two request threads call DbPool.get() at the same moment. Both see that no instance exists, and both create one.",
      why: "The Singleton promise is broken: 20 database connections instead of 10, and one pool is lost but still open.",
      say: {
        what: "Two request threads ask for the database pool at the same moment. Both see that no instance exists yet, and both create one.",
        why: "The singleton promise is broken: twenty database connections instead of ten, and one pool is lost but still open."
      },
      code: "problem",
      lines: { python: [14, 16, 17, 21, 22, 28], scala: [13, 14, 15, 19, 20, 24] },
      actions: [
        { tag: "cls", text: "_instance = None" },
        { call: ["t1", "cls"], label: "get()", result: "pool #1" },
        { call: ["t2", "cls"], label: "get()", result: "pool #2", together: true },
        { spawn: ["p1"], from: "cls" },
        { spawn: ["p2"], from: "cls", together: true },
        { show: ["c-p1", "c-p2"] },
        { flash: "p2" },
        { shake: "p2", together: true },
        { show: ["warn"], together: true }
      ]
    },
    {
      title: "Check, then act: the gap between them",
      what: "get() checks whether the instance exists, and then creates it. Those are two steps; a thread switch can land between them.",
      why: "This check-then-act race is the root of every lazy-initialisation bug. The demo forces the switch with a barrier, so it fails every time.",
      say: {
        what: "Get checks whether the instance exists, and then creates it. Those are two separate steps, and a thread switch can land between them.",
        why: "This check then act race is the root of every lazy initialisation bug. The demo forces the switch with a barrier, so it fails every time."
      },
      code: "problem",
      lines: { python: [14, 16, 17], scala: [13, 14, 15] },
      actions: [
        { mark: "cls", member: 0 },
        { ring: "cls", caption: "both checked before either created" },
        { pulse: "t1" },
        { pulse: "t2", together: true }
      ]
    },
    {
      title: "Add a lock around the creation",
      what: "DbPool gets a class-level lock. Only one thread at a time may run the code that creates the instance.",
      why: "The lock turns check-and-create into one step for everyone who holds it.",
      say: {
        what: "The pool class gets a lock. Only one thread at a time may run the code that creates the instance.",
        why: "The lock turns check and create into one step for everyone who holds it."
      },
      code: "main",
      lines: { python: [5, 6, 18], scala: [11, 12, 17] },
      actions: [
        { ring: null },
        { mark: "cls", member: null },
        { hide: ["warn", "p1", "p2", "c-p1", "c-p2"] },
        { tag: "cls", text: null },
        { members: "cls", lines: ["- _instance: None", "- _lock: Lock", "+ get(): DbPool"],
          scalaLines: ["- @volatile instance: null", "- lock: Object", "+ get(): DbPool"] },
        { spawn: ["lock"], from: "cls" },
        { show: ["c-l"] }
      ]
    },
    {
      title: "Check again inside the lock",
      what: "Both threads still pass the first check. Thread 1 takes the lock, checks again, and creates pool #1. Thread 2 then takes the lock, checks again, finds pool #1, and creates nothing.",
      why: "The second check is the one that matters: another thread may have created the instance while we waited for the lock.",
      say: {
        what: "Both threads still pass the first check. Thread one takes the lock, checks again, and creates pool number one. Thread two then takes the lock, checks again, finds pool number one, and creates nothing.",
        why: "The second check is the one that matters. Another thread may have created the instance while we waited for the lock."
      },
      code: "main",
      lines: { python: [15, 17, 18, 19, 20], scala: [15, 16, 17, 18, 19] },
      actions: [
        { call: ["t1", "cls", "lock"], label: "1st check: None, lock" },
        { members: "lock", lines: ["owner: T1"] },
        { spawn: ["p1"], from: "cls" },
        { show: ["c-p1"] },
        { members: "cls", lines: ["- _instance: pool #1", "- _lock: Lock", "+ get(): DbPool"],
          scalaLines: ["- instance: pool #1", "- lock: Object", "+ get(): DbPool"] },
        { members: "lock", lines: ["owner: T2"] },
        { call: ["t2", "cls", "lock"], label: "2nd check", result: "already exists" },
        { members: "lock", lines: ["owner: none"] }
      ]
    },
    {
      title: "Both threads get the same pool",
      what: "Both calls return pool #1. The demo prints pools created: 1 and Same pool: True.",
      why: "One instance, even when threads race. That is the whole promise of a thread-safe singleton.",
      say: {
        what: "Both calls return pool number one. The demo prints: pools created, one, and same pool, true.",
        why: "One instance, even when threads race. That is the whole promise of a thread safe singleton."
      },
      code: "main",
      lines: { python: [21, 32, 33], scala: [20, 30, 31] },
      actions: [
        { call: ["t1", "cls"], label: "get()", result: "pool #1" },
        { call: ["t2", "cls"], label: "get()", result: "pool #1", together: true },
        { ring: "p1", caption: "the one pool" }
      ]
    },
    {
      title: "The fast path: no lock after creation",
      what: "Later calls find the instance at the first check and return it straight away. 1000 later calls never touch the lock.",
      why: "Locking every call would be correct too, but every caller would pay for it forever. Double-checked locking pays only during creation.",
      say: {
        what: "Later calls find the instance at the first check and return it straight away. A thousand later calls never touch the lock.",
        why: "Locking every call would also be correct, but every caller would pay for it forever. Double checked locking pays only during creation."
      },
      code: "main",
      lines: { python: [15, 21, 34, 35], scala: [15, 20, 32, 33] },
      actions: [
        { ring: null },
        { dim: ["lock", "c-l"] },
        { mark: "cls", member: 0 },
        { call: ["t1", "cls"], label: "get() × 1000", result: "pool #1, no lock" }
      ]
    },
    {
      title: "On the JVM, the field must be volatile",
      what: "In Scala (and Java) the instance field is @volatile. Without it, the first check could see a reference to a pool whose constructor has not finished.",
      why: "The JVM may reorder writes between threads; volatile forbids that. In CPython the GIL makes one assignment atomic, so the plain attribute is enough.",
      say: {
        what: "In Scala and Java, the instance field is marked volatile. Without it, the first check could see a pool whose constructor has not finished yet.",
        why: "The J V M may reorder writes between threads, and volatile forbids that. In C Python, the global interpreter lock makes one assignment atomic, so a plain attribute is enough."
      },
      code: "main",
      lines: { python: [5, 20], scala: [11, 19] },
      actions: [
        { show: ["lock", "c-l"] },
        { show: ["jvm"] },
        { flash: "cls", together: true }
      ]
    },
    {
      title: "Better still: let the language do it",
      what: "A Python module-level instance is created once under the import lock. A Scala object or lazy val is created once, lazily, and thread-safely by the JVM.",
      why: "Hand-written double-checked locking is easy to get subtly wrong. Use it only when you must; the idiomatic tab shows the simpler ways.",
      say: {
        what: "A Python module level instance is created once, under the import lock. A Scala object or lazy val is created once, lazily and thread safely, by the J V M.",
        why: "Hand written double checked locking is easy to get subtly wrong. Use it only when you must. The idiomatic tab shows the simpler ways."
      },
      code: "main",
      lines: { python: [4, 13, 14], scala: [9, 14] },
      actions: [
        { mark: "cls", member: null },
        { hide: ["jvm"] },
        { show: ["ok"] },
        { pulse: "cls", together: true }
      ]
    }
  ]
};

/* ---------- example 1: fraud model, three loaders ---------- */

type Way = "nolock" | "always" | "dcl";
const WAY_LABEL: Record<Way, string> = { nolock: "way: no lock", always: "way: always lock", dcl: "way: double-checked" };
const MODEL_OUT: Record<string, string> = {
  "nolock|r1": "loaded once, lock taken 0 times",
  "nolock|r4": "loaded 4 times, lock taken 0 times",
  "always|r1": "loaded once, lock taken 101 times",
  "always|r4": "loaded once, lock taken 104 times",
  "dcl|r1": "loaded once, lock taken 1 time",
  "dcl|r4": "loaded once, lock taken 4 times"
};
const loaderState = (way: Way, loads: number, locks: number): Action =>
  ({ members: "loader", lines: [WAY_LABEL[way], `loads = ${loads}`, `locks taken = ${locks}`] });

function modelResult(way: Way, racing: 1 | 4): TryResult {
  const out = MODEL_OUT[`${way}|r${racing}`];
  const loads = way === "nolock" ? racing : 1;
  const locks = way === "nolock" ? 0 : way === "always" ? racing + 100 : racing;
  return {
    output: out,
    note: way === "nolock"
      ? racing === 1 ? "Alone, it works: the bug needs a race." : "All four passed the check before anyone loaded."
      : way === "always" ? `${racing} racing calls plus 100 later calls, every one through the lock.`
        : "Only the calls that raced during loading took the lock; the 100 later ones did not.",
    actions: [
      loaderState(way, 0, 0),
      { ring: "threads" },
      { call: ["threads", "loader"], label: `get() × ${racing}, then × 100` },
      { call: ["loader", "model"], label: `load × ${loads}` },
      ...(locks > 0 ? [{ call: ["loader", "lock"], label: `lock × ${locks}` } as Action] : []),
      loaderState(way, loads, locks),
      ...(loads > 1 ? [{ flash: "model" } as Action] : [])
    ]
  };
}

const model: ExampleAnimation = {
  diagram: {
    label: "Request threads ask a ModelLoader for the FraudModel; the loader may use a lock while it loads the model.",
    width: 760, height: 290, portraitWidth: 340, portraitHeight: 350,
    nodes: [
      { id: "threads", kind: "client", name: "4 request threads", hidden: true,
        at: { x: 16, y: 110, w: 170, h: 54 }, portrait: { x: 85, y: 10, w: 170, h: 54 } },
      { id: "loader", kind: "singleton", name: "ModelLoader", key: true, hidden: true,
        members: [WAY_LABEL.dcl, "loads = 0", "locks taken = 0"],
        at: { x: 260, y: 90, w: 230 }, portrait: { x: 50, y: 100, w: 240 } },
      { id: "model", kind: "concrete", name: "FraudModel", hidden: true, members: ["size = 900 MB"],
        at: { x: 580, y: 30, w: 164 }, portrait: { x: 8, y: 260, w: 156 } },
      { id: "lock", kind: "concrete", name: "_lock: Lock", hidden: true, members: ["one at a time"],
        at: { x: 580, y: 180, w: 164 }, portrait: { x: 176, y: 260, w: 156 } }
    ],
    edges: [
      { id: "t-l", from: "threads", to: "loader", type: "dependency", hidden: true },
      { id: "l-m", from: "loader", to: "model", type: "dependency", label: "loads", hidden: true, route: "straight" },
      { id: "l-k", from: "loader", to: "lock", type: "composition", hidden: true, route: "straight" }
    ]
  },
  walk: [
    [{ show: ["threads", "loader"] }, { show: ["t-l"] }, { call: ["threads", "loader"], label: "get() × 4 at once" }],
    [loaderState("nolock", 0, 0), { spawn: ["model"], from: "loader" }, { show: ["l-m"] },
      { call: ["loader", "model"], label: "load × 4" }, loaderState("nolock", 4, 0), { flash: "model" }],
    [loaderState("always", 0, 0), { show: ["lock"] }, { show: ["l-k"] },
      { call: ["loader", "lock"], label: "lock × 104" }, loaderState("always", 1, 104)],
    [loaderState("dcl", 0, 0), { call: ["loader", "lock"], label: "lock × 4 (racing only)" }, loaderState("dcl", 1, 4),
      { ring: "loader", caption: "loaded once" }],
    [{ ring: null }, { call: ["threads", "loader"], label: "get() × 100", result: "same model, no lock" }, { pulse: "model" }]
  ],
  tryIt: {
    prompt: "Pick how get() guards the load and how many threads race at startup. Then 100 more calls follow.",
    groups: [
      { label: "Loader", options: [{ id: "nolock", label: "no lock" }, { id: "always", label: "lock every call" }, { id: "dcl", label: "double-checked" }] },
      { label: "Racing at startup", options: [{ id: "r1", label: "1 thread" }, { id: "r4", label: "4 threads" }] }
    ],
    results: Object.fromEntries((["nolock", "always", "dcl"] as Way[]).flatMap((w) =>
      ([1, 4] as const).map((r) => [`${w}|r${r}`, modelResult(w, r)])))
  }
};

/* ---------- example 2: pincode directory, eager or lazy ---------- */

const svc = (kind: "eager" | "lazy", built: string): Action =>
  ({ members: "services", lines: [`kind: ${kind}`, `directory: ${built}`] });

function pinResult(kind: "eager" | "lazy", used: boolean): TryResult {
  const out = kind === "eager"
    ? used ? "loaded at startup, 1 time" : "loaded at startup, 1 time, never used"
    : used ? "loaded on first use, 1 time" : "never loaded";
  const built = kind === "eager" || used;
  return {
    output: out,
    note: kind === "eager"
      ? used ? "Built before any thread asked, so there was nothing to race for." : "Built at startup and then never needed: wasted time and memory."
      : used ? "The first routing thread built it; the other three waited and got the same one." : "Nobody asked, so it was never built.",
    actions: [
      { hide: ["dir", "s-d"] },
      svc(kind, "(not built)"),
      { call: ["app", "services"], label: "start the app", result: "ready" },
      ...(kind === "eager" ? [svc("eager", "built"), { show: ["dir", "s-d"] } as Action] : []),
      ...(used ? [{ ring: "routers" } as Action, { call: ["routers", "services"], label: "directory × 4", result: "Bengaluru" } as Action] : [{ ring: "app" } as Action]),
      ...(kind === "lazy" && used ? [svc("lazy", "built"), { show: ["dir", "s-d"] } as Action] : []),
      ...(!built ? [{ tag: "services", text: "never built" } as Action] : [{ tag: "services", text: null } as Action])
    ]
  };
}

const pincodes: ExampleAnimation = {
  diagram: {
    label: "The app starts its Services; routing threads ask Services for the PincodeDirectory, which is built eagerly at startup or lazily on first use.",
    width: 760, height: 290, portraitWidth: 340, portraitHeight: 350,
    nodes: [
      { id: "app", kind: "client", name: "app startup", hidden: true,
        at: { x: 16, y: 30, w: 170, h: 54 }, portrait: { x: 8, y: 10, w: 156, h: 54 } },
      { id: "routers", kind: "client", name: "4 routing threads", hidden: true,
        at: { x: 16, y: 196, w: 170, h: 54 }, portrait: { x: 176, y: 10, w: 156, h: 54 } },
      { id: "services", kind: "singleton", name: "Services", key: true, hidden: true,
        members: ["kind: eager", "directory: (not built)"],
        at: { x: 260, y: 90, w: 230 }, portrait: { x: 50, y: 110, w: 240 } },
      { id: "dir", kind: "concrete", name: "PincodeDirectory", hidden: true, members: ["19,000 pincodes"],
        at: { x: 570, y: 106, w: 174 }, portrait: { x: 85, y: 262, w: 170 } }
    ],
    edges: [
      { id: "a-s", from: "app", to: "services", type: "dependency", hidden: true, route: "straight" },
      { id: "r-s", from: "routers", to: "services", type: "dependency", hidden: true, route: "straight" },
      { id: "s-d", from: "services", to: "dir", type: "composition", hidden: true }
    ]
  },
  walk: [
    [{ show: ["app", "services"] }, { show: ["a-s"] }, { call: ["app", "services"], label: "start the app" },
      { spawn: ["dir"], from: "services" }, { show: ["s-d"] }, svc("eager", "built"), { tag: "dir", text: "loaded at startup" }],
    [{ show: ["routers"] }, { show: ["r-s"] },
      { call: ["routers", "services", "dir"], label: "city('560001') × 4", scalaLabel: "city(\"560001\") × 4", result: "Bengaluru" }],
    [{ tag: "dir", text: null }, { hide: ["dir", "s-d"] }, svc("lazy", "(not built)"),
      { call: ["app", "services"], label: "start the app", result: "ready" }],
    [{ call: ["routers", "services"], label: "directory × 4 at once" }, { spawn: ["dir"], from: "services" }, { show: ["s-d"] },
      svc("lazy", "built"), { tag: "dir", text: "loaded on first use, once" }],
    [{ tag: "dir", text: null }, { hide: ["dir", "s-d"] }, svc("lazy", "(not built)"),
      { call: ["app", "services"], label: "start, no parcels today", result: "never loaded" }, { ring: "services", caption: "nothing wasted" }]
  ],
  tryIt: {
    prompt: "Choose eager or lazy creation, and whether any parcel is routed today. When is the directory loaded?",
    groups: [
      { label: "Creation", options: [{ id: "eager", label: "eager (module / val)" }, { id: "lazy", label: "lazy (locked / lazy val)" }] },
      { label: "Today", options: [{ id: "used", label: "4 parcels routed" }, { id: "unused", label: "no parcels" }] }
    ],
    results: {
      "eager|used": pinResult("eager", true), "eager|unused": pinResult("eager", false),
      "lazy|used": pinResult("lazy", true), "lazy|unused": pinResult("lazy", false)
    }
  }
};

/* ---------- example 3: one client per region ---------- */

const reg = (kind: "racy" | "safe", clients: string): Action => ({ members: "reg", lines: [`kind: ${kind}`, `clients: ${clients}`] });

function regionResult(mix: "same" | "mixed", kind: "racy" | "safe"): TryResult {
  const out = mix === "same"
    ? kind === "racy" ? "4 clients for 1 region" : "1 client for 1 region"
    : kind === "racy" ? "4 clients for 2 regions" : "2 clients for 2 regions";
  const mumbai = mix === "same" ? (kind === "racy" ? 4 : 1) : (kind === "racy" ? 2 : 1);
  return {
    output: out,
    note: kind === "racy"
      ? "Every request passed the 'no client yet' check before anyone created one."
      : "Check and create happen together under the lock (computeIfAbsent in Scala).",
    actions: [
      reg(kind, "(none)"),
      { hide: ["fra", "r-f"] },
      { ring: "reqs" },
      { call: ["reqs", "reg"], label: mix === "same" ? "4 × ap-south-1" : "2 × ap-south-1, 2 × eu-central-1" },
      { tag: "mum", text: `created × ${mumbai}` },
      ...(mix === "mixed" ? [{ show: ["fra", "r-f"] } as Action, { tag: "fra", text: `created × ${kind === "racy" ? 2 : 1}` } as Action] : []),
      reg(kind, mix === "same" ? "ap-south-1" : "ap-south-1, eu-central-1"),
      ...(kind === "racy" ? [{ flash: "mum" } as Action] : [])
    ]
  };
}

const regions: ExampleAnimation = {
  diagram: {
    label: "Upload requests ask a registry for the RegionClient of a cloud region; the registry keeps one client per region.",
    width: 760, height: 290, portraitWidth: 340, portraitHeight: 340,
    nodes: [
      { id: "reqs", kind: "client", name: "upload requests", hidden: true,
        at: { x: 16, y: 110, w: 170, h: 54 }, portrait: { x: 85, y: 10, w: 170, h: 54 } },
      { id: "reg", kind: "singleton", name: "Registry", key: true, hidden: true,
        members: ["kind: racy", "clients: (none)"],
        at: { x: 250, y: 90, w: 260 }, portrait: { x: 30, y: 100, w: 280 } },
      { id: "mum", kind: "concrete", name: "RegionClient", hidden: true, members: ["ap-south-1"],
        at: { x: 570, y: 30, w: 174 }, portrait: { x: 8, y: 250, w: 158 } },
      { id: "fra", kind: "concrete", name: "RegionClient", hidden: true, members: ["eu-central-1"],
        at: { x: 570, y: 180, w: 174 }, portrait: { x: 176, y: 250, w: 158 } }
    ],
    edges: [
      { id: "q-r", from: "reqs", to: "reg", type: "dependency", hidden: true },
      { id: "r-m", from: "reg", to: "mum", type: "composition", hidden: true, route: "straight" },
      { id: "r-f", from: "reg", to: "fra", type: "composition", hidden: true, route: "straight" }
    ]
  },
  walk: [
    [{ show: ["reqs", "reg"] }, { show: ["q-r"] }, { call: ["reqs", "reg"], label: "client('ap-south-1') × 4", scalaLabel: "client(\"ap-south-1\", …) × 4" }],
    [reg("racy", "(none)"), { spawn: ["mum"], from: "reg" }, { show: ["r-m"] }, { tag: "mum", text: "created × 4" },
      reg("racy", "ap-south-1"), { flash: "mum" }],
    [reg("safe", "(none)"), { call: ["reqs", "reg"], label: "client('ap-south-1') × 4", scalaLabel: "computeIfAbsent × 4" },
      { tag: "mum", text: "created × 1" }, reg("safe", "ap-south-1"), { ring: "mum" }],
    [{ ring: null }, reg("safe", "(none)"), { call: ["reqs", "reg"], label: "2 × Mumbai, 2 × Frankfurt" },
      { spawn: ["fra"], from: "reg" }, { show: ["r-f"] }, { tag: "fra", text: "created × 1" },
      reg("safe", "ap-south-1, eu-central-1")],
    [{ call: ["reqs", "reg", "mum"], label: "client('ap-south-1')", scalaLabel: "client(\"ap-south-1\", …)", result: "same client" }, { pulse: "mum" }]
  ],
  tryIt: {
    prompt: "Four upload requests arrive at once. Pick the regions they need and the registry. How many clients are created?",
    groups: [
      { label: "Requests", options: [{ id: "same", label: "4 × Mumbai" }, { id: "mixed", label: "2 Mumbai + 2 Frankfurt" }] },
      { label: "Registry", options: [{ id: "racy", label: "check, then create" }, { id: "safe", label: "under one lock" }] }
    ],
    results: {
      "same|racy": regionResult("same", "racy"), "same|safe": regionResult("same", "safe"),
      "mixed|racy": regionResult("mixed", "racy"), "mixed|safe": regionResult("mixed", "safe")
    }
  }
};

/* ---------- example 4: safe to create, not safe to use ---------- */

const counterAt = (n: number): Action =>
  ({ members: "counter", lines: [`_last = ${n}`, "+ next_seat()"], scalaLines: [`last = ${n}`, "+ nextSeat()"] });

function seatResult(locked: boolean, bookings: 2 | 4): TryResult {
  const out = locked ? `${bookings} bookings, seats 1 to ${bookings}` : `${bookings} bookings, all got seat 1`;
  return {
    output: out,
    note: locked
      ? "Read and write happen as one step, so each booking sees the previous one's seat."
      : `All ${bookings} read 0 before anyone wrote, so all wrote 1.`,
    actions: [
      counterAt(0),
      ...(locked ? [{ show: ["lock", "c-l"] } as Action] : [{ hide: ["lock", "c-l"] } as Action]),
      { ring: "bookings" },
      locked
        ? { call: ["bookings", "counter", "lock"], label: `next_seat_locked() × ${bookings}`, scalaLabel: `nextSeatLocked() × ${bookings}`, result: `seats 1 to ${bookings}` }
        : { call: ["bookings", "counter"], label: `next_seat_unlocked() × ${bookings}`, scalaLabel: `nextSeatUnlocked() × ${bookings}`, result: "seat 1 for all" },
      counterAt(locked ? bookings : 1),
      ...(locked ? [] : [{ flash: "bookings" } as Action])
    ]
  };
}

const seats: ExampleAnimation = {
  diagram: {
    label: "Booking threads share the one SeatCounter; its seat counter needs its own lock to hand out unique seats.",
    width: 760, height: 290, portraitWidth: 340, portraitHeight: 340,
    nodes: [
      { id: "bookings", kind: "client", name: "booking threads", hidden: true,
        at: { x: 16, y: 110, w: 170, h: 54 }, portrait: { x: 85, y: 10, w: 170, h: 54 } },
      { id: "counter", kind: "singleton", name: "SeatCounter", key: true, hidden: true,
        members: ["_last = 0", "+ next_seat()"], scalaMembers: ["last = 0", "+ nextSeat()"],
        at: { x: 270, y: 90, w: 230 }, portrait: { x: 50, y: 100, w: 240 } },
      { id: "lock", kind: "concrete", name: "seat lock", hidden: true,
        members: ["read + write as one"], scalaMembers: ["(AtomicInteger)"],
        at: { x: 580, y: 105, w: 164 }, portrait: { x: 85, y: 250, w: 170 } }
    ],
    edges: [
      { id: "b-c", from: "bookings", to: "counter", type: "dependency", hidden: true },
      { id: "c-l", from: "counter", to: "lock", type: "composition", hidden: true }
    ]
  },
  walk: [
    [{ show: ["bookings", "counter"] }, { show: ["b-c"] },
      { call: ["bookings", "counter"], label: "SeatCounter.get() × 4", scalaLabel: "SeatCounter × 4", result: "same counter" }],
    [{ mark: "counter", member: 1 }, { call: ["bookings", "counter"], label: "next_seat() × 4 at once", scalaLabel: "nextSeat() × 4 at once" }],
    [{ mark: "counter", member: 0 }, { call: ["bookings", "counter"], label: "read _last × 4", scalaLabel: "read last × 4", result: "0, 0, 0, 0" },
      { tag: "counter", text: "all read 0" }],
    [counterAt(1), { tag: "counter", text: null }, { call: ["bookings", "counter"], label: "write 1 × 4", result: "seat 1 × 4" },
      { flash: "bookings" }, { shake: "bookings", together: true }],
    [{ mark: "counter", member: null }, counterAt(0), { show: ["lock"] }, { show: ["c-l"] },
      { call: ["bookings", "counter", "lock"], label: "next_seat_locked() × 4", scalaLabel: "nextSeatLocked() × 4", result: "seats 1, 2, 3, 4" },
      counterAt(4)]
  ],
  tryIt: {
    prompt: "The counter is created safely. Pick how next_seat works and how many bookings arrive together.",
    groups: [
      { label: "next_seat", options: [{ id: "unlocked", label: "no lock" }, { id: "locked", label: "with a lock" }] },
      { label: "Bookings at once", options: [{ id: "b2", label: "2" }, { id: "b4", label: "4" }] }
    ],
    results: {
      "unlocked|b2": seatResult(false, 2), "unlocked|b4": seatResult(false, 4),
      "locked|b2": seatResult(true, 2), "locked|b4": seatResult(true, 4)
    }
  }
};

const animation: PatternAnimation = {
  slug: "thread-safe-singleton",
  story: storyAnim,
  examples: { model, pincodes, regions, seats },
  sequence: {
    label: "Two threads call get() together; the first to take the lock creates the pool, the second finds it on the second check, and later calls skip the lock.",
    participants: [
      { id: "t1", name: "Thread 1", kind: "client" },
      { id: "t2", name: "Thread 2", kind: "client" },
      { id: "cls", name: "DbPool (class)", kind: "singleton" },
      { id: "lock", name: "_lock: Lock", kind: "concrete" },
      { id: "pool", name: "pool: DbPool", kind: "singleton" }
    ],
    messages: [
      { from: "t1", to: "cls", label: "get()" },
      { from: "t2", to: "cls", label: "get()" },
      { from: "cls", to: "lock", label: "Thread 1 acquires" },
      { from: "cls", to: "cls", label: "2nd check: None", kind: "self" },
      { from: "cls", to: "pool", label: "create once", kind: "create" },
      { from: "cls", to: "t1", label: "pool", kind: "return" },
      { from: "cls", to: "lock", label: "Thread 2 acquires" },
      { from: "cls", to: "cls", label: "2nd check: exists", kind: "self" },
      { from: "cls", to: "t2", label: "same pool", kind: "return" },
      { from: "t1", to: "cls", label: "get() later" },
      { from: "cls", to: "t1", label: "pool (no lock)", kind: "return" }
    ]
  }
};

export default animation;
