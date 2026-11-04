import type { Action, ExampleAnimation, PatternAnimation, TryResult } from "../../../anim/types";

/* ---------- story: plain list → bounded queue between an upload handler and worker threads ---------- */

/** The queue box's member lines, with its current contents on the first line. */
const jobs = (contents: string): Action => ({
  members: "queue",
  lines: [contents, "+ put(item): waits if full", "+ get(): waits if empty"],
  scalaLines: [contents, "+ put(item): waits if full", "+ take(): waits if empty"]
});

const storyAnim: PatternAnimation["story"] = {
  diagram: {
    label: "UploadHandler first shares a plain list with two worker threads; after the fix it puts photos into a bounded queue, and the workers take them out one at a time.",
    width: 900,
    height: 400,
    portraitWidth: 340,
    portraitHeight: 440,
    nodes: [
      { id: "handler", kind: "concrete", name: "UploadHandler", key: true,
        members: ["+ upload(photo)"],
        at: { x: 20, y: 150, w: 210 }, portrait: { x: 8, y: 50, w: 150 } },
      { id: "pending", kind: "concrete", name: "pending: list",
        members: ["no lock, no limit"],
        at: { x: 345, y: 260, w: 220 }, portrait: { x: 182, y: 50, w: 150 } },
      { id: "queue", kind: "concrete", name: "jobs: Queue (max 3)", key: true, hidden: true,
        members: ["[ empty ]", "+ put(item): waits if full", "+ get(): waits if empty"],
        scalaMembers: ["[ empty ]", "+ put(item): waits if full", "+ take(): waits if empty"],
        at: { x: 330, y: 40, w: 250 }, portrait: { x: 45, y: 150, w: 250 } },
      { id: "w1", kind: "client", stereotype: "«thread»", name: "Worker 1",
        at: { x: 690, y: 30, w: 180, h: 56 }, portrait: { x: 8, y: 330, w: 100, h: 56 } },
      { id: "w2", kind: "client", stereotype: "«thread»", name: "Worker 2",
        at: { x: 690, y: 150, w: 180, h: 56 }, portrait: { x: 120, y: 330, w: 100, h: 56 } },
      { id: "w3", kind: "client", stereotype: "«thread»", name: "Worker 3", hidden: true,
        at: { x: 690, y: 270, w: 180, h: 56 }, portrait: { x: 232, y: 330, w: 100, h: 56 } }
    ],
    edges: [
      { id: "h-p", from: "handler", to: "pending", type: "dependency" },
      { id: "w1-p", from: "w1", to: "pending", type: "dependency", route: "straight",
        viaPortrait: [[318, 130], [318, 300], [58, 300]] },
      { id: "w2-p", from: "w2", to: "pending", type: "dependency", route: "straight",
        viaPortrait: [[318, 130], [318, 300], [170, 300]] },
      { id: "h-q", from: "handler", to: "queue", type: "dependency", label: "put", hidden: true },
      { id: "w1-q", from: "w1", to: "queue", type: "dependency", hidden: true, route: "straight" },
      { id: "w2-q", from: "w2", to: "queue", type: "dependency", hidden: true, route: "straight" },
      { id: "w3-q", from: "w3", to: "queue", type: "dependency", hidden: true, route: "straight" }
    ],
    badges: [
      { id: "burst", text: "Grows without limit", tone: "warn", near: "pending", place: "below" },
      { id: "race", text: "img0 twice, img1 lost", tone: "warn", near: "pending", place: "below" },
      { id: "ok", text: "Producer unchanged", tone: "ok", near: "handler", place: "below" }
    ]
  },
  steps: [
    {
      title: "The problem: a plain shared list",
      what: "The upload handler appends every photo to a plain list that the workers read. A burst of 10,000 uploads puts 10,000 photos in memory, because append never waits.",
      why: "Nothing slows the producer down when the consumers fall behind, so memory grows without limit.",
      say: {
        what: "The upload handler appends every photo to a plain list that the workers read. A burst of ten thousand uploads puts ten thousand photos in memory, because append never waits.",
        why: "Nothing slows the producer down when the workers fall behind, so memory grows without limit."
      },
      code: "problem",
      lines: { python: [5, 9, 10, 22, 23, 24], scala: [6, 9, 10, 20, 21] },
      actions: [
        { call: ["handler", "pending"], label: "append × 10,000", scalaLabel: "+= × 10,000" },
        { tag: "pending", text: "10,000 waiting" },
        { flash: "pending" },
        { show: ["burst"], together: true }
      ]
    },
    {
      title: "Two workers take the same photo",
      what: "Worker 1 peeks and sees img0. Before it removes it, Worker 2 peeks and also sees img0. Then each one removes the first item.",
      why: "Check-then-act on shared data is a race: img0 is processed twice and img1 is removed without ever being processed.",
      say: {
        what: "Worker one peeks and sees image zero. Before it removes it, worker two peeks and also sees image zero. Then each one removes the first item.",
        why: "Checking and then acting on shared data is a race. Image zero is processed twice, and image one is removed without ever being processed."
      },
      code: "problem",
      lines: { python: [13, 14, 17, 18, 19, 27, 28, 29, 30], scala: [12, 13, 15, 16, 17, 24, 25, 26, 27] },
      actions: [
        { hide: ["burst"] },
        { tag: "pending", text: null, together: true },
        { call: ["w1", "pending"], label: "peek()", result: "img0" },
        { call: ["w2", "pending"], label: "peek()", result: "img0" },
        { call: ["w1", "pending"], label: "pop(0)", scalaLabel: "remove(0)", result: "img0 gone" },
        { call: ["w2", "pending"], label: "pop(0)", scalaLabel: "remove(0)", result: "img1 gone!" },
        { flash: "w2" },
        { shake: "pending", together: true },
        { show: ["race"], together: true }
      ]
    },
    {
      title: "Put a bounded, thread-safe queue in the middle",
      what: "The list is replaced by a queue with room for 3 photos. The handler only calls put; the workers only call get.",
      why: "The queue owns the lock and the waiting, so neither side needs any synchronisation code of its own.",
      say: {
        what: "The list is replaced by a queue with room for three photos. The handler only puts; the workers only get.",
        why: "The queue owns the lock and the waiting, so neither side needs any synchronisation code of its own."
      },
      code: "main",
      lines: { python: [2, 29, 32, 36], scala: [1, 20, 22, 25] },
      actions: [
        { hide: ["race"] },
        { cross: "pending" },
        { hide: ["h-p", "w1-p", "w2-p"], together: true },
        { show: ["queue"] },
        { show: ["h-q", "w1-q", "w2-q"] },
        { tag: "queue", text: "room for 3" }
      ]
    },
    {
      title: "The producer puts; put waits when the queue is full",
      what: "The handler uploads img1, img2 and img3, and the queue is full. Its next put, for img4, waits until a worker makes room.",
      why: "This waiting is back-pressure: a fast producer is slowed to the speed of the consumers, so memory stays bounded.",
      say: {
        what: "The handler uploads image one, two and three, and the queue is full. Its next put, for image four, waits until a worker makes room.",
        why: "This waiting is called back-pressure. A fast producer is slowed to the speed of the consumers, so memory stays bounded."
      },
      code: "main",
      lines: { python: [7, 11, 12, 36, 37, 38], scala: [6, 7, 8, 25, 26] },
      actions: [
        { hide: ["pending", "pending__x"] },
        { call: ["handler", "queue"], label: "upload(img1..img3)" },
        jobs("[ img1, img2, img3 ]"),
        { tag: "queue", text: "3 of 3: full" },
        { mark: "queue", member: 1 },
        { call: ["handler", "queue"], label: "put(img4)" },
        { ring: "handler", caption: "waits: queue is full" }
      ]
    },
    {
      title: "Consumers take; each photo goes to exactly one worker",
      what: "Worker 1 gets img1 and Worker 2 gets img2. That frees room, so the waiting put of img4 goes through.",
      why: "get removes the item under the queue's lock, so two workers can never receive the same photo. An empty queue makes get wait, so there is no polling.",
      say: {
        what: "Worker one gets image one and worker two gets image two. That frees room, so the waiting put of image four goes through.",
        why: "Get removes the item under the queue's lock, so two workers can never receive the same photo. An empty queue makes get wait, so there is no polling."
      },
      code: "main",
      lines: { python: [15, 20, 21, 22, 25, 26], scala: [10, 11, 12, 14, 15, 17] },
      actions: [
        { mark: "queue", member: 2 },
        { call: ["w1", "queue"], label: "get()", scalaLabel: "take()", result: "img1" },
        { tag: "w1", text: "thumb(img1)" },
        { call: ["w2", "queue"], label: "get()", scalaLabel: "take()", result: "img2" },
        { tag: "w2", text: "thumb(img2)" },
        { ring: null },
        jobs("[ img3, img4 ]"),
        { tag: "queue", text: "2 of 3" }
      ]
    },
    {
      title: "Stop with one poison pill per worker",
      what: "After img8 the handler puts STOP twice, once per worker. Each worker that takes STOP leaves its loop and ends.",
      why: "A worker blocked on get only wakes when something arrives. The pill is that something, and it comes after all real work, so nothing is left behind.",
      say: {
        what: "After image eight, the handler puts stop twice, once per worker. Each worker that takes stop leaves its loop and ends.",
        why: "A worker waiting on get only wakes when something arrives. The pill is that something, and it comes after all the real work, so nothing is left behind."
      },
      code: "main",
      lines: { python: [4, 23, 24, 39, 40, 41, 42], scala: [4, 16, 27, 28] },
      actions: [
        { mark: "queue", member: null },
        { tag: "w1", text: null },
        { tag: "w2", text: null, together: true },
        { call: ["handler", "queue"], label: "put(STOP) × 2" },
        jobs("[ STOP, STOP ]"),
        { call: ["w1", "queue"], label: "get()", scalaLabel: "take()", result: "STOP" },
        { tag: "w1", text: "finished" },
        { call: ["w2", "queue"], label: "get()", scalaLabel: "take()", result: "STOP" },
        { tag: "w2", text: "finished" },
        jobs("[ empty ]"),
        { tag: "queue", text: "empty" }
      ]
    },
    {
      title: "8 photos in, 8 thumbnails out",
      what: "join waits for both workers, then the demo prints: Uploaded 8, thumbnails made: 8, and the queue is empty.",
      why: "Every photo was handled exactly once, and memory never held more than 3 waiting photos.",
      say: {
        what: "Join waits for both workers. Then the demo prints: uploaded eight, thumbnails made eight, and the queue is empty.",
        why: "Every photo was handled exactly once, and memory never held more than three waiting photos."
      },
      code: "main",
      lines: { python: [44, 45, 46], scala: [30, 31, 32] },
      actions: [
        { tag: "queue", text: "8 in, 8 out, none twice" },
        { pulse: "queue" },
        { ring: "queue" }
      ]
    },
    {
      title: "Need more speed? Add a worker",
      what: "A third worker joins and takes from the same queue. The upload handler does not change at all.",
      why: "Producers and consumers know only the queue, so each side scales on its own (Open/Closed, Dependency Inversion).",
      say: {
        what: "A third worker joins and takes from the same queue. The upload handler does not change at all.",
        why: "Producers and consumers know only the queue, so each side scales on its own."
      },
      code: "main",
      lines: { python: [32], scala: [22] },
      actions: [
        { ring: null },
        { tag: "queue", text: null, together: true },
        { tag: "w1", text: null, together: true },
        { tag: "w2", text: null, together: true },
        { spawn: ["w3"], from: "queue" },
        { show: ["w3-q"] },
        { call: ["w3", "queue"], label: "get()", scalaLabel: "take()", result: "next photo" },
        { show: ["ok"] },
        { pulse: "handler", together: true }
      ]
    }
  ]
};

/* ---------- example 1: batched log writer ---------- */

function logResult(threads: number, batch: number): TryResult {
  const lines = threads * 4;
  const writes = Math.ceil(lines / batch);
  return {
    output: `${lines} lines in ${writes} disk writes`,
    note: `${threads} threads × 4 lines = ${lines} lines; batches of ${batch} need ${writes} write${writes === 1 ? "" : "s"} (the last batch may be partly full).`,
    actions: [
      { show: ["web0", "web1", "web2"] },
      ...(threads === 2 ? [{ dim: ["web2"] } as Action] : []),
      { members: "writer", lines: [`batch size = ${batch}`, "disk_writes = 0"], scalaLines: [`batchSize = ${batch}`, "diskWrites = 0"] },
      { call: ["web0", "q"], label: `put(line) × ${lines}` },
      { ring: "writer" },
      { members: "writer", lines: [`batch size = ${batch}`, `disk_writes = ${writes}`], scalaLines: [`batchSize = ${batch}`, `diskWrites = ${writes}`] },
      { call: ["writer", "disk"], label: `write × ${writes}`, result: `${lines} lines` }
    ]
  };
}

const logs: ExampleAnimation = {
  diagram: {
    label: "Three request threads put log lines into one queue; the single LogWriter thread takes them and writes batches to app.log.",
    width: 760, height: 300, portraitWidth: 340, portraitHeight: 350,
    nodes: [
      { id: "web0", kind: "client", stereotype: "«thread»", name: "web-0", hidden: true,
        at: { x: 16, y: 20, w: 120, h: 54 }, portrait: { x: 8, y: 14, w: 100, h: 54 } },
      { id: "web1", kind: "client", stereotype: "«thread»", name: "web-1", hidden: true,
        at: { x: 16, y: 120, w: 120, h: 54 }, portrait: { x: 120, y: 14, w: 100, h: 54 } },
      { id: "web2", kind: "client", stereotype: "«thread»", name: "web-2", hidden: true,
        at: { x: 16, y: 220, w: 120, h: 54 }, portrait: { x: 232, y: 14, w: 100, h: 54 } },
      { id: "q", kind: "concrete", name: "lines: Queue", hidden: true,
        members: ["+ put(line)", "+ get()"], scalaMembers: ["+ put(line)", "+ take()"],
        at: { x: 200, y: 106, w: 170 }, portrait: { x: 8, y: 120, w: 150 } },
      { id: "writer", kind: "concrete", name: "LogWriter", key: true, hidden: true,
        members: ["batch size = 5", "disk_writes = 0"], scalaMembers: ["batchSize = 5", "diskWrites = 0"],
        at: { x: 430, y: 96, w: 190 }, portrait: { x: 176, y: 120, w: 156 } },
      { id: "disk", kind: "concrete", name: "app.log", hidden: true,
        at: { x: 640, y: 112, w: 110, h: 50 }, portrait: { x: 176, y: 262, w: 156, h: 50 } }
    ],
    edges: [
      { id: "e0", from: "web0", to: "q", type: "dependency", hidden: true, route: "straight" },
      { id: "e1", from: "web1", to: "q", type: "dependency", hidden: true, route: "straight" },
      { id: "e2", from: "web2", to: "q", type: "dependency", hidden: true, route: "straight" },
      { id: "wq", from: "writer", to: "q", type: "dependency", hidden: true },
      { id: "wd", from: "writer", to: "disk", type: "dependency", hidden: true }
    ]
  },
  walk: [
    [{ show: ["web0", "web1", "web2"] }, { show: ["q"] }, { show: ["e0", "e1", "e2"] },
      { call: ["web0", "q"], label: "put(line) × 4" },
      { call: ["web1", "q"], label: "put(line) × 4", together: true },
      { call: ["web2", "q"], label: "put(line) × 4", together: true },
      { tag: "q", text: "12 lines" }],
    [{ show: ["writer"] }, { show: ["wq"] }, { ring: "writer", caption: "the only file writer" },
      { call: ["writer", "q"], label: "get()", scalaLabel: "take()", result: "\"web-0: request 0 served\"" }],
    [{ show: ["disk"] }, { show: ["wd"] }, { ring: null },
      { call: ["writer", "disk"], label: "write 5 lines" },
      { members: "writer", lines: ["batch size = 5", "disk_writes = 1"], scalaLines: ["batchSize = 5", "diskWrites = 1"] },
      { call: ["writer", "disk"], label: "write 5 lines" },
      { members: "writer", lines: ["batch size = 5", "disk_writes = 2"], scalaLines: ["batchSize = 5", "diskWrites = 2"] },
      { tag: "q", text: "2 lines left" }],
    [{ call: ["q", "writer"], label: "STOP" }, { tag: "q", text: "empty" },
      { call: ["writer", "disk"], label: "write last 2 lines" },
      { members: "writer", lines: ["batch size = 5", "disk_writes = 3"], scalaLines: ["batchSize = 5", "diskWrites = 3"] }],
    [{ tag: "writer", text: "12 lines, 3 writes" }, { pulse: "disk" }]
  ],
  tryIt: {
    prompt: "Choose how many request threads log 4 lines each, and the writer's batch size. How many disk writes does it take?",
    groups: [
      { label: "Request threads", options: [{ id: "t2", label: "2 threads" }, { id: "t3", label: "3 threads" }] },
      { label: "Batch size", options: [{ id: "b1", label: "1 (no batching)" }, { id: "b5", label: "5" }, { id: "b10", label: "10" }] }
    ],
    results: Object.fromEntries([2, 3].flatMap((t) => [1, 5, 10].map((b) => [`t${t}|b${b}`, logResult(t, b)])))
  }
};

/* ---------- example 2: ticket rail with an overflow policy ---------- */

const ORDERS = ["#101", "#102", "#103", "#104", "#105"];

function railResult(capacity: number, policy: "reject" | "drop"): TryResult {
  const kept = policy === "reject" ? ORDERS.slice(0, capacity) : ORDERS.slice(ORDERS.length - capacity);
  const away = ORDERS.filter((o) => !kept.includes(o));
  const label = policy === "reject" ? "reject" : "drop oldest";
  return {
    output: `cooked ${kept.join(" ")} | away ${away.join(" ")}`,
    note: policy === "reject"
      ? `The first ${capacity} orders fill the rail; each later order is refused at once.`
      : `Each new order pushes out the oldest ticket, so the newest ${capacity} stay.`,
    actions: [
      { tag: "chef1", text: null },
      { tag: "chef2", text: null, together: true },
      { members: "rail", lines: [`capacity = ${capacity}, ${label}`, "on rail: (empty)", "turned away: (none)"] },
      { call: ["waiter", "rail"], label: "add(#101 … #105)" },
      { members: "rail", lines: [`capacity = ${capacity}, ${label}`, `on rail: ${kept.join(" ")}`, `turned away: ${away.join(" ")}`] },
      { flash: "rail" },
      { ring: "rail" },
      { call: ["chef1", "rail"], label: "take() until empty", scalaLabel: "take() until None", result: kept.join(" ") }
    ]
  };
}

const kitchen: ExampleAnimation = {
  diagram: {
    label: "A waiter adds order tickets to a TicketRail with a fixed capacity; two chef threads take tickets from it.",
    width: 760, height: 290, portraitWidth: 340, portraitHeight: 350,
    nodes: [
      { id: "waiter", kind: "client", name: "Waiter", hidden: true,
        at: { x: 16, y: 110, w: 140, h: 56 }, portrait: { x: 95, y: 14, w: 150, h: 56 } },
      { id: "rail", kind: "concrete", name: "TicketRail", key: true, hidden: true,
        members: ["capacity = 3, reject", "on rail: (empty)", "turned away: (none)"],
        at: { x: 220, y: 84, w: 260 }, portrait: { x: 40, y: 110, w: 260 } },
      { id: "chef1", kind: "client", stereotype: "«thread»", name: "Chef 1", hidden: true,
        at: { x: 580, y: 40, w: 160, h: 56 }, portrait: { x: 8, y: 262, w: 150, h: 56 } },
      { id: "chef2", kind: "client", stereotype: "«thread»", name: "Chef 2", hidden: true,
        at: { x: 580, y: 190, w: 160, h: 56 }, portrait: { x: 182, y: 262, w: 150, h: 56 } }
    ],
    edges: [
      { id: "w-r", from: "waiter", to: "rail", type: "dependency", label: "add", hidden: true },
      { id: "c1-r", from: "chef1", to: "rail", type: "dependency", hidden: true, route: "straight" },
      { id: "c2-r", from: "chef2", to: "rail", type: "dependency", hidden: true, route: "straight" }
    ]
  },
  walk: [
    [{ show: ["waiter", "chef1", "chef2"] }, { tag: "chef1", text: "busy" }, { tag: "chef2", text: "busy", together: true }],
    [{ show: ["rail"] }, { show: ["w-r", "c1-r", "c2-r"] },
      { call: ["waiter", "rail"], label: "add(#101), add(#102), add(#103)" },
      { members: "rail", lines: ["capacity = 3, reject", "on rail: #101 #102 #103", "turned away: (none)"] },
      { tag: "rail", text: "full" }],
    [{ call: ["waiter", "rail"], label: "add(#104), add(#105)", result: "rejected" },
      { members: "rail", lines: ["capacity = 3, reject", "on rail: #101 #102 #103", "turned away: #104 #105"] },
      { flash: "rail" }],
    [{ tag: "chef1", text: null }, { tag: "chef2", text: null, together: true },
      { call: ["chef1", "rail"], label: "take()", result: "#101" },
      { call: ["chef2", "rail"], label: "take()", result: "#102" },
      { call: ["chef1", "rail"], label: "take()", result: "#103" },
      { members: "rail", lines: ["capacity = 3, reject", "on rail: (empty)", "turned away: #104 #105"] },
      { tag: "rail", text: "empty" }],
    [{ tag: "rail", text: null },
      { members: "rail", lines: ["capacity = 3, drop oldest", "on rail: #103 #104 #105", "turned away: #101 #102"] },
      { pulse: "rail" }]
  ],
  tryIt: {
    prompt: "Five orders arrive while both chefs are busy. Choose the rail size and what happens when it is full. Which orders get cooked?",
    groups: [
      { label: "Rail capacity", options: [{ id: "c2", label: "2" }, { id: "c3", label: "3" }, { id: "c4", label: "4" }] },
      { label: "When full", options: [{ id: "reject", label: "reject newest" }, { id: "drop", label: "drop oldest" }] }
    ],
    results: Object.fromEntries([2, 3, 4].flatMap((c) => (["reject", "drop"] as const).map((p) => [`c${c}|${p}`, railResult(c, p)])))
  }
};

/* ---------- example 3: two-stage video pipeline with a dead-letter queue ---------- */

const BATCHES: Record<string, { label: string; published: string[]; dead: string[] }> = {
  clean: { label: "clean batch", published: ["intro.mp4", "arrays.mp4", "graphs.mp4"], dead: [] },
  one: { label: "one corrupt", published: ["intro.mp4", "graphs.mp4"], dead: ["arrays.corrupt"] },
  two: { label: "two corrupt", published: ["arrays.mp4"], dead: ["intro.corrupt", "graphs.corrupt"] }
};

function videoResult(id: string): TryResult {
  const b = BATCHES[id];
  const out = `${b.published.length} published, ${b.dead.length} dead letter(s)`;
  return {
    output: out,
    note: `Published: ${b.published.join(", ")}.${b.dead.length ? ` Parked for a human: ${b.dead.join(", ")}.` : " Nothing parked."}`,
    actions: [
      { tag: "raw", text: null },
      { tag: "enc", text: null, together: true },
      { tag: "dead", text: b.dead.length ? `${b.dead.length} parked` : null },
      ...(b.dead.length ? [{ call: ["tc", "dead"], label: `put × ${b.dead.length}` } as Action] : []),
      { ring: "pub" },
      { call: ["up", "raw", "tc", "enc", "pub"], label: "3 videos + STOP", result: out }
    ]
  };
}

const video: ExampleAnimation = {
  diagram: {
    label: "Uploader → raw queue → Transcoder → encoded queue → Publisher, with corrupt files parked in a dead-letter queue.",
    width: 760, height: 290, portraitWidth: 340, portraitHeight: 320,
    nodes: [
      { id: "up", kind: "client", name: "Uploader", hidden: true,
        at: { x: 16, y: 60, w: 120, h: 56 }, portrait: { x: 8, y: 14, w: 150, h: 56 } },
      { id: "raw", kind: "concrete", name: "raw: Queue", hidden: true,
        at: { x: 169, y: 60, w: 120, h: 56 }, portrait: { x: 182, y: 14, w: 150, h: 56 } },
      { id: "tc", kind: "concrete", name: "Transcoder", key: true, hidden: true,
        at: { x: 322, y: 60, w: 120, h: 56 }, portrait: { x: 182, y: 120, w: 150, h: 56 } },
      { id: "enc", kind: "concrete", name: "encoded: Queue", hidden: true,
        at: { x: 475, y: 60, w: 120, h: 56 }, portrait: { x: 182, y: 226, w: 150, h: 56 } },
      { id: "pub", kind: "concrete", name: "Publisher", hidden: true,
        at: { x: 628, y: 60, w: 120, h: 56 }, portrait: { x: 8, y: 226, w: 150, h: 56 } },
      { id: "dead", kind: "concrete", name: "dead: Queue", hidden: true,
        at: { x: 322, y: 190, w: 120, h: 56 }, portrait: { x: 8, y: 120, w: 150, h: 56 } }
    ],
    edges: [
      { id: "e-up", from: "up", to: "raw", type: "dependency", hidden: true },
      { id: "e-tr", from: "tc", to: "raw", type: "dependency", hidden: true },
      { id: "e-te", from: "tc", to: "enc", type: "dependency", hidden: true },
      { id: "e-td", from: "tc", to: "dead", type: "dependency", hidden: true },
      { id: "e-pe", from: "pub", to: "enc", type: "dependency", hidden: true }
    ]
  },
  walk: [
    [{ show: ["up", "raw"] }, { show: ["e-up"] },
      { call: ["up", "raw"], label: "put × 3, then STOP" }, { tag: "raw", text: "3 videos + STOP" }],
    [{ show: ["tc", "enc"] }, { show: ["e-tr", "e-te"] },
      { call: ["tc", "raw"], label: "get()", scalaLabel: "take()", result: "intro.mov" },
      { call: ["tc", "enc"], label: "put(intro.mp4)" }, { tag: "enc", text: "intro.mp4" }],
    [{ show: ["dead"] }, { show: ["e-td"] },
      { call: ["tc", "raw"], label: "get()", scalaLabel: "take()", result: "arrays.corrupt" },
      { call: ["tc", "dead"], label: "put(arrays.corrupt)" }, { tag: "dead", text: "1 parked" }, { flash: "dead" },
      { call: ["tc", "enc"], label: "put(graphs.mp4)" }],
    [{ show: ["pub"] }, { show: ["e-pe"] }, { tag: "enc", text: null },
      { call: ["pub", "enc"], label: "get()", scalaLabel: "take()", result: "intro.mp4" },
      { call: ["pub", "enc"], label: "get()", scalaLabel: "take()", result: "graphs.mp4" },
      { tag: "pub", text: "2 published" }],
    [{ tag: "raw", text: null }, { call: ["up", "raw", "tc", "enc", "pub"], label: "STOP" },
      { ring: "pub", caption: "stops last" }]
  ],
  tryIt: {
    prompt: "Pick an upload batch. How many lectures get published, and how many land in the dead-letter queue?",
    groups: [
      { label: "Upload batch", options: Object.entries(BATCHES).map(([id, b]) => ({ id, label: b.label })) }
    ],
    results: Object.fromEntries(Object.keys(BATCHES).map((id) => [id, videoResult(id)]))
  }
};

/* ---------- example 4: poison pills at shutdown ---------- */

const SENDERS = ["s1", "s2", "s3"];

function shutdownResult(senders: number, pills: number): TryResult {
  const stopped = Math.min(senders, pills);
  const stuck = senders - stopped;
  const out = `6 sent, ${stopped} of ${senders} stopped, ${stuck} stuck`;
  const tags: Action[] = SENDERS.map((s, i) => ({
    tag: s, text: i >= senders ? null : i < stopped ? "stopped" : "stuck", together: i > 0
  }));
  return {
    output: out,
    note: stuck
      ? `Each pill stops exactly one sender, so ${stuck} sender${stuck > 1 ? "s wait" : " waits"} on get() forever.`
      : pills > senders
        ? "Every sender got a pill; the extra pill just stays in the queue."
        : "One pill per sender: every thread finishes and exits.",
    actions: [
      { show: SENDERS },
      ...(senders === 2 ? [{ dim: ["s3"] } as Action] : []),
      { call: ["app", "outbox"], label: `put(STOP) × ${pills}` },
      ...tags,
      ...(stuck ? [{ flash: SENDERS[senders - 1] } as Action] : []),
      { ring: "app" },
      { call: ["app", "outbox"], label: "deploy_shutdown()", scalaLabel: "deployShutdown()", result: out }
    ]
  };
}

const shutdown: ExampleAnimation = {
  diagram: {
    label: "The app puts OTP messages and STOP pills into the outbox queue; three SmsSender threads take from it.",
    width: 760, height: 340, portraitWidth: 340, portraitHeight: 360,
    nodes: [
      { id: "app", kind: "client", name: "App (producer)", hidden: true,
        at: { x: 16, y: 124, w: 150, h: 56 }, portrait: { x: 95, y: 14, w: 150, h: 56 } },
      { id: "outbox", kind: "concrete", name: "outbox: Queue", key: true, hidden: true,
        members: ["+ put(msg)", "+ get()"], scalaMembers: ["+ put(msg)", "+ take()"],
        at: { x: 250, y: 110, w: 200 }, portrait: { x: 70, y: 110, w: 200 } },
      ...SENDERS.map((id, i) => ({
        id, kind: "client" as const, stereotype: "«thread»", name: `Sender ${i + 1}`, hidden: true,
        at: { x: 560, y: 24 + 110 * i, w: 170, h: 56 }, portrait: { x: 8 + 112 * i, y: 262, w: 100, h: 56 }
      }))
    ],
    edges: [
      { id: "e-app", from: "app", to: "outbox", type: "dependency", hidden: true },
      ...SENDERS.map((s) => ({ id: "e-" + s, from: s, to: "outbox", type: "dependency" as const, hidden: true, route: "straight" as const }))
    ]
  },
  walk: [
    [{ show: ["outbox"] }, { show: SENDERS }, { show: SENDERS.map((s) => "e-" + s) },
      ...SENDERS.map((s, i): Action => ({ tag: s, text: "waiting", together: i > 0 }))],
    [{ show: ["app"] }, { show: ["e-app"] }, { call: ["app", "outbox"], label: "put(OTP 1 … OTP 6)" },
      ...SENDERS.map((s, i): Action => ({ call: [s, "outbox"], label: "get()", scalaLabel: "take()", result: `OTP ${i + 1}`, together: i > 0 })),
      { tag: "outbox", text: "6 sent" }],
    [{ tag: "outbox", text: null }, { call: ["app", "outbox"], label: "put(STOP) × 1" }, { pulse: "outbox" }],
    [{ call: ["s1", "outbox"], label: "get()", scalaLabel: "take()", result: "STOP" }, { tag: "s1", text: "stopped" },
      { tag: "s2", text: "stuck" }, { tag: "s3", text: "stuck", together: true },
      { flash: "s2" }, { flash: "s3", together: true }],
    [{ call: ["app", "outbox"], label: "put(STOP) × 2" },
      { call: ["s2", "outbox"], label: "get()", scalaLabel: "take()", result: "STOP" },
      { call: ["s3", "outbox"], label: "get()", scalaLabel: "take()", result: "STOP", together: true },
      { tag: "s2", text: "stopped" }, { tag: "s3", text: "stopped", together: true },
      { ring: "app", caption: "deploy finishes" }]
  ],
  tryIt: {
    prompt: "Choose how many sender threads run and how many STOP pills the app sends after the 6 messages. Does every thread stop?",
    groups: [
      { label: "Sender threads", options: [{ id: "n2", label: "2 senders" }, { id: "n3", label: "3 senders" }] },
      { label: "STOP pills", options: [{ id: "p1", label: "1 pill" }, { id: "p2", label: "2 pills" }, { id: "p3", label: "3 pills" }] }
    ],
    results: Object.fromEntries([2, 3].flatMap((n) => [1, 2, 3].map((p) => [`n${n}|p${p}`, shutdownResult(n, p)])))
  }
};

const animation: PatternAnimation = {
  slug: "producer-consumer",
  story: storyAnim,
  examples: { logs, kitchen, video, shutdown },
  sequence: {
    label: "The demo uploads photos through the handler into the queue; two workers take them, the handler waits when the queue is full, and STOP pills end both workers.",
    participants: [
      { id: "demo", name: "Demo code", kind: "client" },
      { id: "handler", name: "handler: UploadHandler", kind: "concrete" },
      { id: "jobs", name: "jobs: Queue", kind: "concrete" },
      { id: "w1", name: "worker1: ThumbnailWorker", kind: "concrete" },
      { id: "w2", name: "worker2: ThumbnailWorker", kind: "concrete" }
    ],
    messages: [
      { from: "demo", to: "handler", label: "upload(img1)" },
      { from: "handler", to: "jobs", label: "put(img1)" },
      { from: "w1", to: "jobs", label: "get()" },
      { from: "jobs", to: "w1", label: "img1", kind: "return" },
      { from: "w1", to: "w1", label: "make thumb(img1)", kind: "self" },
      { from: "handler", to: "jobs", label: "put(img4): waits while full" },
      { from: "w2", to: "jobs", label: "get()" },
      { from: "jobs", to: "w2", label: "img2", kind: "return" },
      { from: "demo", to: "jobs", label: "put(STOP) × 2" },
      { from: "w1", to: "jobs", label: "get()" },
      { from: "jobs", to: "w1", label: "STOP: loop ends", kind: "return" },
      { from: "demo", to: "w1", label: "join()" }
    ]
  }
};

export default animation;
