import type { Action, ExampleAnimation, PatternAnimation, TryResult } from "../../../anim/types";

/* ---------- story: a new thread per task → a fixed pool of reused workers with Futures ---------- */

/** The pool box's member lines, with its waiting tasks on the first line. */
const tasks = (contents: string): Action => ({
  members: "pool",
  lines: [`tasks: ${contents}`, "+ submit(fn, *args): Future", "+ shutdown()"],
  scalaLines: [`tasks: ${contents}`, "+ submit(task): Future", "+ shutdown()"]
});

const WORKERS = ["w1", "w2", "w3"];

const storyAnim: PatternAnimation["story"] = {
  diagram: {
    label: "The demo first starts a new thread for every invoice; after the fix it submits tasks to a ThreadPool whose three worker threads are made once, take tasks from its queue, and put each result into a Future.",
    width: 900,
    height: 440,
    portraitWidth: 340,
    portraitHeight: 560,
    nodes: [
      { id: "demo", kind: "client", name: "Demo code",
        at: { x: 20, y: 60, w: 180, h: 56 }, portrait: { x: 8, y: 50, w: 150, h: 56 } },
      { id: "spawned", kind: "concrete", name: "new Thread per task",
        members: ["Thread-1: invoice-1", "Thread-2: invoice-2", "Thread-3: invoice-3"],
        at: { x: 20, y: 250, w: 230 }, portrait: { x: 182, y: 50, w: 150 } },
      { id: "pool", kind: "concrete", name: "ThreadPool (3 workers)", key: true, hidden: true,
        members: ["tasks: [ empty ]", "+ submit(fn, *args): Future", "+ shutdown()"],
        scalaMembers: ["tasks: [ empty ]", "+ submit(task): Future", "+ shutdown()"],
        at: { x: 300, y: 40, w: 290 }, portrait: { x: 20, y: 180, w: 300 } },
      { id: "future", kind: "concrete", name: "Future", key: true, hidden: true,
        members: ["state: pending"],
        at: { x: 330, y: 300, w: 230 }, portrait: { x: 8, y: 340, w: 200 } },
      ...WORKERS.map((id, i) => ({
        id, kind: "client" as const, stereotype: "«thread»", name: `Worker ${i + 1}`, hidden: true,
        at: { x: 690, y: 30 + 120 * i, w: 180, h: 56 }, portrait: { x: 232, y: 320 + 70 * i, w: 100, h: 56 }
      }))
    ],
    edges: [
      { id: "d-s", from: "demo", to: "spawned", type: "dependency" },
      { id: "d-p", from: "demo", to: "pool", type: "dependency", label: "submit", hidden: true },
      { id: "p-f", from: "pool", to: "future", type: "dependency", label: "returns", hidden: true },
      ...WORKERS.map((w, i) => ({
        id: `${w}-p`, from: w, to: "pool", type: "dependency" as const, hidden: true, route: "straight" as const,
        viaPortrait: [[220, 296], [220, 348 + 70 * i]] as [number, number][]
      }))
    ],
    badges: [
      { id: "burst", text: "1,010 threads started", tone: "warn", near: "spawned", place: "below" },
      { id: "lost", text: "Result thrown away", tone: "warn", near: "spawned", place: "below" },
      { id: "ok", text: "3 threads for 10 tasks", tone: "ok", near: "future", place: "below" }
    ]
  },
  steps: [
    {
      title: "The problem: a new thread for every task",
      what: "handle_orders starts a brand-new thread for each invoice. Ten orders start ten threads; a burst of 1,000 more starts 1,000 more, all at once.",
      why: "Each thread costs start-up time and memory, and nothing limits how many run together, so a burst can exhaust the machine.",
      say: {
        what: "Handle orders starts a brand-new thread for each invoice. Ten orders start ten threads. A burst of a thousand more starts a thousand more, all at once.",
        why: "Each thread costs start-up time and memory, and nothing limits how many run together, so a burst can exhaust the machine."
      },
      code: "problem",
      lines: { python: [17, 18, 19, 20], scala: [11, 12, 13, 14] },
      actions: [
        { call: ["demo", "spawned"], label: "Thread(make_invoice).start() × 10", scalaLabel: "Thread(() => makeInvoice(id)).start()" },
        { members: "spawned", lines: ["Thread-1: invoice-1", "Thread-2: invoice-2", "Thread-3: invoice-3"], stagger: true },
        { tag: "spawned", text: "10 threads created" },
        { call: ["demo", "spawned"], label: "1,000 more orders", result: "1,000 more threads" },
        { tag: "spawned", text: null },
        { flash: "spawned" },
        { show: ["burst"], together: true }
      ]
    },
    {
      title: "Each thread does one job, and its result is lost",
      what: "Every thread makes one invoice and then dies. The invoice it returns goes nowhere: a plain thread throws its return value away, and an error would only be printed.",
      why: "Threads are thrown away after one use, and the caller has no handle to collect results or notice failures.",
      say: {
        what: "Every thread makes one invoice and then dies. The invoice it returns goes nowhere: a plain thread throws its return value away, and an error would only be printed.",
        why: "Threads are thrown away after one use, and the caller has no handle to collect results or notice failures."
      },
      code: "problem",
      lines: { python: [10, 11, 22, 23, 30], scala: [7, 8, 17, 24] },
      actions: [
        { hide: ["burst"] },
        { tag: "spawned", text: null, together: true },
        { call: ["demo", "spawned"], label: "join()", result: "no invoice back" },
        { cross: "spawned" },
        { show: ["lost"] }
      ]
    },
    {
      title: "Create a few worker threads, once",
      what: "A ThreadPool of 3 starts its three worker threads when it is created, and keeps them. It also owns a queue where submitted tasks wait.",
      why: "Starting threads once and reusing them removes the per-task cost, and the pool size caps how much runs at the same time.",
      say: {
        what: "A thread pool of three starts its three worker threads when it is created, and keeps them. It also owns a queue where submitted tasks wait.",
        why: "Starting threads once and reusing them removes the per-task cost, and the pool size caps how much runs at the same time."
      },
      code: "main",
      lines: { python: [9, 10, 12, 13, 14, 15, 43], scala: [3, 4, 5, 6, 32] },
      actions: [
        { hide: ["lost"] },
        { hide: ["spawned", "spawned__x", "d-s"], together: true },
        { show: ["pool"] },
        { spawn: WORKERS, from: "pool" },
        { show: WORKERS.map((w) => `${w}-p`) },
        { tag: "pool", text: "3 threads, made once" }
      ]
    },
    {
      title: "submit puts the task in the queue and returns a Future",
      what: "The demo submits make_invoice for order 1. The task waits in the pool's queue, and the demo gets an empty Future back at once. Nine more orders follow.",
      why: "submit never waits for the work. The Future is a receipt: the caller can carry on and collect the result later.",
      say: {
        what: "The demo submits make invoice for order one. The task waits in the pool's queue, and the demo gets an empty future back at once. Nine more orders follow.",
        why: "Submit never waits for the work. The future is a receipt: the caller can carry on and collect the result later."
      },
      code: "main",
      lines: { python: [17, 18, 19, 20, 44], scala: [8, 9, 13, 14, 33] },
      actions: [
        { tag: "pool", text: null },
        { show: ["d-p"] },
        { call: ["demo", "pool"], label: "submit(make_invoice, 1)", scalaLabel: "submit(() => makeInvoice(1))", result: "Future" },
        { show: ["future"] },
        { show: ["p-f"] },
        { tag: "future", text: "empty for now" },
        { call: ["demo", "pool"], label: "submit × 9 more", result: "9 more Futures" },
        tasks("[ #1 … #10 ]"),
        { mark: "pool", member: 0 }
      ]
    },
    {
      title: "Workers take tasks, and the same thread runs the next one",
      what: "Workers 1 to 3 take orders 1, 2 and 3. When Worker 1 finishes, it takes order 4 itself: no new thread is started.",
      why: "Each worker loops over the queue, so 3 threads serve all 10 tasks. The queue's lock gives each task to exactly one worker.",
      say: {
        what: "Workers one to three take orders one, two and three. When worker one finishes, it takes order four itself. No new thread is started.",
        why: "Each worker loops over the queue, so three threads serve all ten tasks. The queue's lock gives each task to exactly one worker."
      },
      code: "main",
      lines: { python: [22, 23, 24, 26], scala: [16, 17, 18, 19, 20] },
      actions: [
        { mark: "pool", member: null },
        { tag: "future", text: null, together: true },
        { call: ["w1", "pool"], label: "get()", scalaLabel: "take()", result: "#1" },
        { call: ["w2", "pool"], label: "get()", scalaLabel: "take()", result: "#2", together: true },
        { call: ["w3", "pool"], label: "get()", scalaLabel: "take()", result: "#3", together: true },
        tasks("[ #4 … #10 ]"),
        { tag: "w1", text: "invoice-1" },
        { tag: "w2", text: "invoice-2", together: true },
        { tag: "w3", text: "invoice-3", together: true },
        { call: ["w1", "pool"], label: "get()", scalaLabel: "take()", result: "#4" },
        { tag: "w1", text: "#4, same thread" },
        { pulse: "w1" }
      ]
    },
    {
      title: "Results and errors travel back in the Future",
      what: "Worker 1 puts invoice-1.pdf into order 1's Future. Order 7 has no address, so its worker catches the ValueError and stores it in order 7's Future instead.",
      why: "The caller gets every outcome through one handle: a value, or the exception the task raised. Nothing is lost on a background thread.",
      say: {
        what: "Worker one puts invoice one into order one's future. Order seven has no address, so its worker catches the value error and stores it in order seven's future instead.",
        why: "The caller gets every outcome through one handle: a value, or the exception the task raised. Nothing is lost on a background thread."
      },
      code: "main",
      lines: { python: [25, 26, 27, 28, 38, 39], scala: [10, 11, 12, 28] },
      actions: [
        { tag: "w1", text: null },
        { tag: "w2", text: null, together: true },
        { tag: "w3", text: null, together: true },
        { call: ["w1", "future"], label: "set_result(invoice-1.pdf)", scalaLabel: "complete(invoice-1.pdf)" },
        { members: "future", lines: ["#1: invoice-1.pdf"] },
        { call: ["w3", "future"], label: "set_exception(ValueError)", scalaLabel: "completeExceptionally(e)" },
        { members: "future", lines: ["#1: invoice-1.pdf", "#7: no address (error)"] },
        { flash: "future" },
        tasks("[ empty ]")
      ]
    },
    {
      title: "shutdown: one stop signal per worker",
      what: "shutdown puts one None into the queue for each worker, then joins them. Each worker that takes None leaves its loop and ends.",
      why: "A worker blocked on the queue only wakes when something arrives, so each one needs its own stop signal. Always shut a pool down, or its threads keep the program alive.",
      say: {
        what: "Shutdown puts one stop signal into the queue for each worker, then joins them. Each worker that takes it leaves its loop and ends.",
        why: "A worker waiting on the queue only wakes when something arrives, so each one needs its own stop signal. Always shut a pool down, or its threads keep the program alive."
      },
      code: "main",
      lines: { python: [30, 31, 32, 33, 34, 45], scala: [21, 23, 24, 25, 34] },
      actions: [
        { call: ["demo", "pool"], label: "shutdown()" },
        tasks("[ None × 3 ]"),
        { call: ["w1", "pool"], label: "get()", scalaLabel: "take()", result: "None" },
        { call: ["w2", "pool"], label: "get()", scalaLabel: "take()", result: "None", together: true },
        { call: ["w3", "pool"], label: "get()", scalaLabel: "take()", result: "None", together: true },
        ...WORKERS.map((w, i): Action => ({ tag: w, text: "stopped", together: i > 0 })),
        tasks("[ empty ]")
      ]
    },
    {
      title: "10 orders, 3 threads, every result back",
      what: "The demo reads the Futures and prints: threads created 3, invoices ready 9, and order 7 failed with its reason.",
      why: "Compare with 1,010 threads and no results before. The tasks did not change at all; only who runs them did (Single Responsibility).",
      say: {
        what: "The demo reads the futures and prints: threads created, three. Invoices ready, nine. And order seven failed, with its reason.",
        why: "Compare with over a thousand threads and no results before. The tasks did not change at all; only who runs them did."
      },
      code: "main",
      lines: { python: [47, 48, 49, 50, 51], scala: [36, 37, 38, 39, 40, 41, 42] },
      actions: [
        ...WORKERS.map((w, i): Action => ({ tag: w, text: null, together: i > 0 })),
        { call: ["demo", "pool", "future"], label: "result() × 10", scalaLabel: "get() × 10", result: "9 invoices + 1 error" },
        { show: ["ok"] },
        { ring: "pool" }
      ]
    }
  ]
};

/* ---------- example 1: fare search across six airlines ---------- */

const CALL_MS = 20;

function fareResult(workers: number): TryResult {
  const rounds = Math.ceil(6 / workers);
  const out = `cheapest Kite Air ₹4,180 in ~${rounds * CALL_MS} ms`;
  const dim = WORKERS.slice(Math.min(workers, 3));
  return {
    output: out,
    note: `6 calls shared by ${workers} worker${workers > 1 ? "s" : ""}: ${rounds} round${rounds > 1 ? "s" : ""} of ~20 ms each.${workers > 3 ? " (Only 3 workers are drawn.)" : ""}`,
    actions: [
      { show: WORKERS },
      ...(dim.length ? [{ dim } as Action] : []),
      { members: "search", lines: [`workers = ${workers}`] },
      { ring: "pool" },
      { call: ["search", "pool", "api"], label: `map(fetch_fare) on ${workers} worker${workers > 1 ? "s" : ""}`, scalaLabel: `invokeAll(6 tasks) on ${workers}`, result: out }
    ]
  };
}

const fares: ExampleAnimation = {
  diagram: {
    label: "FareSearch submits six fare calls to a pool; three worker threads take them in turn and call the airline APIs.",
    width: 760, height: 300, portraitWidth: 340, portraitHeight: 350,
    nodes: [
      { id: "search", kind: "client", name: "FareSearch", hidden: true,
        members: ["workers = 3"],
        at: { x: 16, y: 110, w: 150 }, portrait: { x: 8, y: 14, w: 150 } },
      { id: "pool", kind: "concrete", name: "pool", key: true, hidden: true,
        members: ["queue: [ empty ]", "+ map(fetch_fare)"], scalaMembers: ["queue: [ empty ]", "+ invokeAll(tasks)"],
        at: { x: 220, y: 96, w: 200 }, portrait: { x: 182, y: 14, w: 150 } },
      ...WORKERS.map((id, i) => ({
        id, kind: "client" as const, stereotype: "«thread»", name: `Worker ${i + 1}`, hidden: true,
        at: { x: 480, y: 20 + 96 * i, w: 120, h: 56 }, portrait: { x: 8 + 112 * i, y: 150, w: 100, h: 56 }
      })),
      { id: "api", kind: "concrete", name: "Airline APIs", hidden: true,
        at: { x: 646, y: 116, w: 104, h: 56 }, portrait: { x: 95, y: 260, w: 150, h: 56 } }
    ],
    edges: [
      { id: "s-p", from: "search", to: "pool", type: "dependency", label: "submit", hidden: true },
      ...WORKERS.map((w) => ({ id: `${w}-p`, from: w, to: "pool", type: "dependency" as const, hidden: true, route: "straight" as const })),
      ...WORKERS.map((w) => ({ id: `${w}-a`, from: w, to: "api", type: "dependency" as const, hidden: true, route: "straight" as const }))
    ]
  },
  walk: [
    [{ show: ["search", "pool"] }, { show: ["s-p"] },
      { call: ["search", "pool"], label: "submit × 6 airlines", scalaLabel: "invokeAll(6 tasks)" },
      { members: "pool", lines: ["queue: 6 calls", "+ map(fetch_fare)"], scalaLines: ["queue: 6 calls", "+ invokeAll(tasks)"] }],
    [{ show: WORKERS }, { show: WORKERS.map((w) => `${w}-p`) },
      { call: ["w1", "pool"], label: "next task", result: "SkyJet" },
      { call: ["w2", "pool"], label: "next task", result: "BlueWing", together: true },
      { call: ["w3", "pool"], label: "next task", result: "Kite Air", together: true },
      { members: "pool", lines: ["queue: 3 calls", "+ map(fetch_fare)"], scalaLines: ["queue: 3 calls", "+ invokeAll(tasks)"] }],
    [{ show: ["api"] }, { show: WORKERS.map((w) => `${w}-a`) },
      { call: ["w1", "api"], label: "fetch_fare(SkyJet)", scalaLabel: "fetchFare(SkyJet)", result: "₹4,350" },
      { call: ["w1", "pool"], label: "next task", result: "Coastal" },
      { tag: "w1", text: "same thread, 2nd call" },
      { members: "pool", lines: ["queue: [ empty ]", "+ map(fetch_fare)"], scalaLines: ["queue: [ empty ]", "+ invokeAll(tasks)"] }],
    [{ tag: "w1", text: null },
      { call: ["pool", "search"], label: "6 fares, in asking order", result: "~40 ms" },
      { tag: "search", text: "2 rounds × 20 ms" }],
    [{ tag: "search", text: "Kite Air ₹4,180" }, { ring: "search", caption: "cheapest of 6" }]
  ],
  tryIt: {
    prompt: "Choose how many worker threads the pool has. Six airline calls of about 20 ms each: how long does the search take?",
    groups: [
      { label: "Pool size", options: [1, 2, 3, 6].map((n) => ({ id: `n${n}`, label: `${n} worker${n > 1 ? "s" : ""}` })) }
    ],
    results: Object.fromEntries([1, 2, 3, 6].map((n) => [`n${n}`, fareResult(n)]))
  }
};

/* ---------- example 2: sizing pools for a code-grading service ---------- */

const KINDS: Record<string, { label: string; wait: number; compute: number }> = {
  tests: { label: "run tests", wait: 0, compute: 100 },
  mixed: { label: "lint + fetch", wait: 100, compute: 100 },
  fetch: { label: "fetch files", wait: 180, compute: 20 }
};

function sizeResult(kind: string, cores: number): TryResult {
  const k = KINDS[kind];
  const size = cores * (1 + k.wait / k.compute);
  return {
    output: `${size} threads`,
    note: `${cores} × (1 + ${k.wait} ÷ ${k.compute}) = ${size}.${kind === "tests" ? " In Python, use a ProcessPoolExecutor of this size: the GIL stops threads computing in parallel." : ""}`,
    actions: [
      { ring: kind },
      { call: ["sizer", kind], label: `wait ${k.wait}, compute ${k.compute}` },
      { members: "pool", lines: [`size = ${size}`] },
      { call: ["sizer", "pool"], label: `size_for(${k.label}, ${cores})`, scalaLabel: `sizeFor(${k.label}, ${cores})`, result: `${size} threads` }
    ]
  };
}

const sizing: ExampleAnimation = {
  diagram: {
    label: "PoolSizer reads how long each kind of grading task waits and computes, and sizes a pool from the number of cores.",
    width: 760, height: 320, portraitWidth: 340, portraitHeight: 350,
    nodes: [
      { id: "tests", kind: "concrete", name: "run tests", hidden: true, members: ["wait 0, cpu 100"],
        at: { x: 16, y: 16, w: 190 }, portrait: { x: 10, y: 14, w: 150 } },
      { id: "mixed", kind: "concrete", name: "lint + fetch", hidden: true, members: ["wait 100, cpu 100"],
        at: { x: 16, y: 120, w: 190 }, portrait: { x: 180, y: 14, w: 150 } },
      { id: "fetch", kind: "concrete", name: "fetch files", hidden: true, members: ["wait 180, cpu 20"],
        at: { x: 16, y: 224, w: 190 }, portrait: { x: 10, y: 250, w: 150 } },
      { id: "sizer", kind: "client", name: "PoolSizer", key: true, hidden: true,
        members: ["+ size_for(kind, cores)", "cores × (1 + wait ÷ compute)"],
        scalaMembers: ["+ sizeFor(kind, cores)", "cores × (1 + wait ÷ compute)"],
        at: { x: 270, y: 110, w: 220 }, portrait: { x: 60, y: 120, w: 220 } },
      { id: "pool", kind: "concrete", name: "pool", hidden: true, members: ["size = ?"],
        at: { x: 560, y: 120, w: 180 }, portrait: { x: 180, y: 250, w: 150 } }
    ],
    edges: [
      { id: "e-t", from: "sizer", to: "tests", type: "dependency", hidden: true, route: "straight" },
      { id: "e-m", from: "sizer", to: "mixed", type: "dependency", hidden: true, route: "straight" },
      { id: "e-f", from: "sizer", to: "fetch", type: "dependency", hidden: true, route: "straight" },
      { id: "e-p", from: "sizer", to: "pool", type: "dependency", label: "sizes", hidden: true, route: "straight" }
    ]
  },
  walk: [
    [{ show: ["sizer"] }, { show: ["tests", "mixed", "fetch"] }, { show: ["e-t", "e-m", "e-f"] }],
    [{ show: ["pool"] }, { show: ["e-p"] }, { ring: "tests" },
      { call: ["sizer", "tests"], label: "wait 0, compute 100" },
      { members: "pool", lines: ["size = 4"] }, { tag: "pool", text: "4 cores → 4" }],
    [{ ring: "mixed" }, { call: ["sizer", "mixed"], label: "wait 100, compute 100" },
      { members: "pool", lines: ["size = 8"] }, { tag: "pool", text: "4 × (1 + 1) = 8" }],
    [{ ring: "fetch" }, { call: ["sizer", "fetch"], label: "wait 180, compute 20" },
      { members: "pool", lines: ["size = 40"] }, { tag: "pool", text: "4 × (1 + 9) = 40" }],
    [{ ring: null }, { tag: "pool", text: null },
      { call: ["sizer", "pool"], label: "map(fetch_submission, 1..5)", scalaLabel: "traverse(1 to 5)(fetchSubmission)", result: "sub-1.zip … sub-5.zip" },
      { pulse: "pool" }]
  ],
  tryIt: {
    prompt: "Pick the kind of grading task and the number of CPU cores. How many threads should its pool have?",
    groups: [
      { label: "Task", options: Object.entries(KINDS).map(([id, k]) => ({ id, label: k.label })) },
      { label: "Cores", options: [{ id: "c4", label: "4 cores" }, { id: "c8", label: "8 cores" }] }
    ],
    results: Object.fromEntries(Object.keys(KINDS).flatMap((k) => [4, 8].map((c) => [`${k}|c${c}`, sizeResult(k, c)])))
  }
};

/* ---------- example 3: bounded pool at the dinner peak ---------- */

const poolLines = (workers: number, queue: number, running: string, waiting: string): Action => ({
  members: "pool", lines: [`workers ${workers}, queue ${queue}`, `running: ${running}`, `waiting: ${waiting}`]
});

function peakResult(workers: number, queue: number): TryResult {
  const accepted = workers + queue;
  const out = `${accepted} sent, ${10 - accepted} rejected`;
  const run = Array.from({ length: workers }, (_, i) => `#${i + 1}`);
  const wait = Array.from({ length: queue }, (_, i) => `#${workers + i + 1}`);
  return {
    output: out,
    note: `${workers} pushes run, ${queue} wait in the queue; pushes #${accepted + 1} to #10 find no room and are rejected at once.`,
    actions: [
      { tag: "app", text: null },
      poolLines(workers, queue, run.length > 2 ? `${run[0]} … ${run[run.length - 1]}` : run.join(" "),
        wait.length > 2 ? `${wait[0]} … ${wait[wait.length - 1]}` : wait.join(" ")),
      { flash: "pool" },
      { tag: "app", text: `${10 - accepted} rejected` },
      { ring: "pool" },
      { call: ["app", "pool", "push"], label: "try_submit × 10", scalaLabel: "trySubmit × 10", result: out }
    ]
  };
}

const saturation: ExampleAnimation = {
  diagram: {
    label: "The order app offers ten pushes to a BoundedPool with two workers and a queue of two; the workers call the slow push service and the rest are rejected.",
    width: 760, height: 300, portraitWidth: 340, portraitHeight: 440,
    nodes: [
      { id: "app", kind: "client", name: "Order app", hidden: true,
        at: { x: 16, y: 110, w: 140, h: 56 }, portrait: { x: 95, y: 14, w: 150, h: 56 } },
      { id: "pool", kind: "concrete", name: "BoundedPool", key: true, hidden: true,
        members: ["workers 2, queue 2", "running: –", "waiting: –"],
        at: { x: 210, y: 86, w: 240 }, portrait: { x: 50, y: 100, w: 240 } },
      { id: "w1", kind: "client", stereotype: "«thread»", name: "Worker 1", hidden: true,
        at: { x: 506, y: 40, w: 104, h: 56 }, portrait: { x: 8, y: 240, w: 150, h: 56 } },
      { id: "w2", kind: "client", stereotype: "«thread»", name: "Worker 2", hidden: true,
        at: { x: 506, y: 180, w: 104, h: 56 }, portrait: { x: 182, y: 240, w: 150, h: 56 } },
      { id: "push", kind: "concrete", name: "Push service", hidden: true,
        at: { x: 646, y: 110, w: 104, h: 56 }, portrait: { x: 95, y: 340, w: 150, h: 56 } }
    ],
    edges: [
      { id: "e-ap", from: "app", to: "pool", type: "dependency", hidden: true },
      { id: "e-1p", from: "w1", to: "pool", type: "dependency", hidden: true, route: "straight" },
      { id: "e-2p", from: "w2", to: "pool", type: "dependency", hidden: true, route: "straight" },
      { id: "e-1s", from: "w1", to: "push", type: "dependency", hidden: true, route: "straight" },
      { id: "e-2s", from: "w2", to: "push", type: "dependency", hidden: true, route: "straight" }
    ]
  },
  walk: [
    [{ show: ["app", "pool", "push"] }, { show: ["e-ap"] },
      { call: ["app", "pool"], label: "try_submit × 10", scalaLabel: "trySubmit × 10" },
      { tag: "push", text: "slow to answer" }],
    [{ show: ["w1", "w2"] }, { show: ["e-1p", "e-2p", "e-1s", "e-2s"] },
      { call: ["w1", "pool"], label: "start", result: "#1" },
      { call: ["w2", "pool"], label: "start", result: "#2", together: true },
      poolLines(2, 2, "#1 #2", "–")],
    [poolLines(2, 2, "#1 #2", "#3 #4"), { tag: "pool", text: "full" }],
    [{ call: ["app", "pool"], label: "try_submit(#5 … #10)", scalaLabel: "trySubmit(#5 … #10)", result: "rejected" },
      { flash: "pool" }, { tag: "app", text: "6 rejected" }],
    [{ tag: "push", text: null }, { tag: "pool", text: null, together: true },
      { call: ["w1", "push"], label: "push #1, then #3" },
      { call: ["w2", "push"], label: "push #2, then #4", together: true },
      poolLines(2, 2, "–", "–"),
      { tag: "app", text: "4 sent, 6 rejected" }, { ring: "pool", caption: "memory stays flat" }]
  ],
  tryIt: {
    prompt: "Ten pushes arrive at once. Choose the number of workers and the queue size. How many are sent, and how many rejected?",
    groups: [
      { label: "Workers", options: [{ id: "w2", label: "2 workers" }, { id: "w4", label: "4 workers" }] },
      { label: "Queue size", options: [{ id: "q2", label: "queue 2" }, { id: "q4", label: "queue 4" }] }
    ],
    results: Object.fromEntries([2, 4].flatMap((w) => [2, 4].map((q) => [`w${w}|q${q}`, peakResult(w, q)])))
  }
};

/* ---------- example 4: pool starvation ---------- */

function starveResult(separate: boolean, workers: number): TryResult {
  const stuck = !separate && workers <= 2;
  const out = stuck ? "0 confirmed, 2 timed out" : "2 confirmed, 0 timed out";
  const target = separate ? "stock" : "orders";
  return {
    output: out,
    note: stuck
      ? "Both workers wait for stock checks that sit in their own pool's queue, with no worker left to run them."
      : separate
        ? "Stock checks run on their own pool, so the order workers' waits always end."
        : "The third worker is free, so it runs both stock checks while the other two wait.",
    actions: [
      { tag: "w1", text: null },
      { tag: "w2", text: null, together: true },
      separate ? { show: ["stock", "e-1s", "e-2s"] } : { hide: ["stock", "e-1s", "e-2s"] },
      { members: "orders", lines: [`workers: ${workers}`, "queue: 2 stock checks"] },
      { call: ["w1", target], label: "submit(check_stock)", scalaLabel: "submit(checkStock)", result: stuck ? "timed out" : "True" },
      ...(stuck ? [{ flash: "orders" } as Action] : []),
      { ring: "svc" },
      { call: ["svc", "orders"], label: "run(kurta, saree)", result: out }
    ]
  };
}

const starvation: ExampleAnimation = {
  diagram: {
    label: "OrderService submits two confirmations to an orders pool of two workers; each confirmation waits on a stock check, first in the same pool, then in a separate stock pool.",
    width: 760, height: 320, portraitWidth: 340, portraitHeight: 440,
    nodes: [
      { id: "svc", kind: "client", name: "OrderService", hidden: true,
        at: { x: 16, y: 120, w: 150, h: 56 }, portrait: { x: 95, y: 14, w: 150, h: 56 } },
      { id: "orders", kind: "concrete", name: "orders pool", key: true, hidden: true,
        members: ["workers: 2", "queue: –"],
        at: { x: 220, y: 106, w: 220 }, portrait: { x: 60, y: 100, w: 220 } },
      { id: "w1", kind: "client", stereotype: "«thread»", name: "Worker 1", hidden: true,
        at: { x: 520, y: 30, w: 150, h: 56 }, portrait: { x: 8, y: 230, w: 150, h: 56 } },
      { id: "w2", kind: "client", stereotype: "«thread»", name: "Worker 2", hidden: true,
        at: { x: 520, y: 190, w: 150, h: 56 }, portrait: { x: 182, y: 230, w: 150, h: 56 } },
      { id: "stock", kind: "concrete", name: "stock pool", hidden: true,
        members: ["workers: 2"],
        at: { x: 220, y: 240, w: 220 }, portrait: { x: 60, y: 340, w: 220 } }
    ],
    edges: [
      { id: "e-so", from: "svc", to: "orders", type: "dependency", hidden: true },
      { id: "e-1o", from: "w1", to: "orders", type: "dependency", hidden: true, route: "straight" },
      { id: "e-2o", from: "w2", to: "orders", type: "dependency", hidden: true, route: "straight" },
      { id: "e-1s", from: "w1", to: "stock", type: "dependency", hidden: true, route: "straight",
        via: [[700, 270], [700, 58]] },
      { id: "e-2s", from: "w2", to: "stock", type: "dependency", hidden: true, route: "straight" }
    ]
  },
  walk: [
    [{ show: ["svc", "orders", "w1", "w2"] }, { show: ["e-so", "e-1o", "e-2o"] },
      { call: ["svc", "orders"], label: "submit(confirm) × 2" },
      { call: ["w1", "orders"], label: "take", result: "confirm(kurta)" },
      { call: ["w2", "orders"], label: "take", result: "confirm(saree)", together: true }],
    [{ call: ["w1", "orders"], label: "submit(check_stock)", scalaLabel: "submit(checkStock)" },
      { call: ["w2", "orders"], label: "submit(check_stock)", scalaLabel: "submit(checkStock)", together: true },
      { members: "orders", lines: ["workers: 2", "queue: 2 stock checks"] },
      { tag: "w1", text: "waiting" }, { tag: "w2", text: "waiting", together: true }],
    [{ mark: "orders", member: 1 }, { flash: "orders" }, { ring: "orders", caption: "no free worker" }],
    [{ ring: null }, { mark: "orders", member: null },
      { tag: "w1", text: "timed out" }, { tag: "w2", text: "timed out", together: true },
      { tag: "svc", text: "0 confirmed" }],
    [{ tag: "svc", text: null }, { show: ["stock"] }, { show: ["e-1s", "e-2s"] },
      { members: "orders", lines: ["workers: 2", "queue: –"] },
      { call: ["w1", "stock"], label: "check_stock(kurta)", scalaLabel: "checkStock(kurta)", result: "True" },
      { call: ["w2", "stock"], label: "check_stock(saree)", scalaLabel: "checkStock(saree)", result: "True", together: true },
      { tag: "w1", text: "confirmed" }, { tag: "w2", text: "confirmed", together: true },
      { tag: "svc", text: "2 confirmed" }]
  ],
  tryIt: {
    prompt: "Two orders are confirmed at once. Choose where the stock checks run and the orders pool size. Does every order get confirmed?",
    groups: [
      { label: "Stock checks run on", options: [{ id: "same", label: "the same pool" }, { id: "separate", label: "a separate pool" }] },
      { label: "Orders pool", options: [{ id: "n2", label: "2 workers" }, { id: "n3", label: "3 workers" }] }
    ],
    results: Object.fromEntries((["same", "separate"] as const).flatMap((d) => [2, 3].map((n) => [`${d}|n${n}`, starveResult(d === "separate", n)])))
  }
};

const animation: PatternAnimation = {
  slug: "thread-pool",
  story: storyAnim,
  examples: { fares, sizing, saturation, starvation },
  sequence: {
    label: "The demo creates a pool that starts its workers, submits a task and gets a Future back, a worker takes the task from the queue and completes the Future, and the demo shuts the pool down and reads the result.",
    participants: [
      { id: "demo", name: "Demo code", kind: "client" },
      { id: "pool", name: "pool: ThreadPool", kind: "concrete" },
      { id: "tasks", name: "tasks: Queue", kind: "concrete" },
      { id: "w1", name: "worker1: Thread", kind: "concrete" },
      { id: "future", name: "f1: Future", kind: "concrete" }
    ],
    messages: [
      { from: "demo", to: "pool", label: "ThreadPool(3)", kind: "create" },
      { from: "pool", to: "w1", label: "start()" },
      { from: "w1", to: "tasks", label: "get(): waits while empty" },
      { from: "demo", to: "pool", label: "submit(make_invoice, 1)" },
      { from: "pool", to: "future", label: "Future()", kind: "create" },
      { from: "pool", to: "tasks", label: "put(task, f1)" },
      { from: "pool", to: "demo", label: "f1", kind: "return" },
      { from: "tasks", to: "w1", label: "task #1", kind: "return" },
      { from: "w1", to: "w1", label: "make_invoice(1)", kind: "self" },
      { from: "w1", to: "future", label: "set_result(invoice-1.pdf)" },
      { from: "demo", to: "pool", label: "shutdown(): None per worker, join" },
      { from: "demo", to: "future", label: "result()" },
      { from: "future", to: "demo", label: "invoice-1.pdf", kind: "return" }
    ]
  }
};

export default animation;
