import type { Action, ExampleAnimation, PatternAnimation, TryResult } from "../../../anim/types";

/* ---------- story: shoppers queue behind one lock, then share a read lock ---------- */

const SHOPPERS = ["s1", "s2", "s3", "s4"];
const NAMES = ["Asha", "Ravi", "Meera", "Vikram"];

const storyAnim: PatternAnimation["story"] = {
  diagram: {
    label: "Four shopper threads read prices from PriceCatalog and a sale job writes them; after the fix PriceCatalog guards its prices with a ReadWriteLock.",
    width: 900,
    height: 440,
    portraitWidth: 340,
    portraitHeight: 500,
    nodes: [
      ...SHOPPERS.map((id, i) => ({
        id, kind: "client" as const, name: NAMES[i],
        at: { x: 20, y: 24 + 76 * i, w: 140, h: 54 }, portrait: { x: 8 + 84 * i, y: 10, w: 76, h: 50 }
      })),
      { id: "cat", kind: "concrete", name: "PriceCatalog", key: true,
        members: ["- _lock: Lock", "+ quote(cart)", "+ set_price(sku, p)"],
        scalaMembers: ["(synchronized)", "+ quote(cart)", "+ setPrice(sku, p)"],
        at: { x: 300, y: 130, w: 230 }, portrait: { x: 60, y: 110, w: 220 } },
      { id: "lock", kind: "concrete", name: "ReadWriteLock", key: true, hidden: true,
        members: ["- readers: int", "- writing: bool", "+ read(): shared", "+ write(): exclusive"],
        scalaMembers: ["(ReentrantReadWriteLock)", "getReadLockCount", "+ readLock(): shared", "+ writeLock(): exclusive"],
        at: { x: 630, y: 120, w: 240 }, portrait: { x: 50, y: 330, w: 240 } },
      { id: "sale", kind: "client", name: "Sale job", hidden: true,
        at: { x: 335, y: 350, w: 160, h: 54 }, portrait: { x: 8, y: 244, w: 140, h: 54 } }
    ],
    edges: [
      ...SHOPPERS.map((id) => ({ id: "e-" + id, from: id, to: "cat", type: "dependency" as const, route: "straight" as const })),
      { id: "c-l", from: "cat", to: "lock", type: "composition", hidden: true, route: "straight" },
      { id: "w-c", from: "sale", to: "cat", type: "dependency", hidden: true }
    ],
    badges: [
      { id: "warn", text: "Readers wait for readers", tone: "warn", near: "cat" },
      { id: "ok", text: "4 readers at once, writer alone", tone: "ok", near: "cat" },
      { id: "gil", text: "Python GIL: overlap only while waiting", tone: "info", near: "lock", place: "below" }
    ]
  },
  steps: [
    {
      title: "The problem: one lock for readers and writers",
      what: "PriceCatalog guards its prices with one plain lock. Four shoppers quote their carts, and each must wait for the one before, although none of them changes a price.",
      why: "Reads are safe to run together, yet the plain lock makes them queue. With slow reads, every extra user adds to the wait.",
      say: {
        what: "The price catalog guards its prices with one plain lock. Four shoppers quote their carts, and each one waits for the one before, although none of them changes a price.",
        why: "Reads are safe to run together, yet the plain lock makes them queue. With slow reads, every extra user adds to the wait."
      },
      code: "problem",
      lines: { python: [7, 12, 14, 27, 34], scala: [9, 11, 23, 28] },
      actions: [
        { mark: "cat", member: 0 },
        { call: ["s1", "cat"], label: "quote(cart)", result: "₹1800" },
        { call: ["s2", "cat"], label: "quote(cart)", result: "₹3500" },
        { call: ["s3", "cat"], label: "quote(cart)", result: "₹1200" },
        { tag: "cat", text: "readers inside: 1" },
        { flash: "cat" },
        { shake: "cat", together: true },
        { show: ["warn"], together: true }
      ]
    },
    {
      title: "Give the lock two modes",
      what: "PriceCatalog now owns a ReadWriteLock. Its read mode is shared; its write mode is exclusive. In Scala this is ReentrantReadWriteLock.",
      why: "The lock now knows whether a caller only looks or also changes, so it can let lookers in together.",
      say: {
        what: "The price catalog now owns a read write lock. Its read mode is shared, and its write mode is exclusive. In Scala this is the reentrant read write lock.",
        why: "The lock now knows whether a caller only looks or also changes things, so it can let the lookers in together."
      },
      code: "main",
      lines: { python: [6, 7, 16, 30, 48], scala: [2, 5, 7] },
      actions: [
        { hide: ["warn"] },
        { tag: "cat", text: null, together: true },
        { mark: "cat", member: null },
        { members: "cat", lines: ["- _lock: ReadWriteLock", "+ quote(cart)", "+ set_price(sku, p)"],
          scalaLines: ["- rw: ReentrantReadWriteLock", "+ quote(cart)", "+ setPrice(sku, p)"] },
        { spawn: ["lock"], from: "cat" },
        { show: ["c-l"] }
      ]
    },
    {
      title: "Readers share the room",
      what: "All four shoppers call quote() at the same time. Each takes the read lock, and all four are inside together; the barrier in the demo proves it.",
      why: "Reading changes nothing, so readers never need to wait for each other. The demo prints a peak of 4 readers inside.",
      say: {
        what: "All four shoppers ask for a quote at the same time. Each takes the read lock, and all four are inside together. The barrier in the demo proves it.",
        why: "Reading changes nothing, so readers never need to wait for each other. The demo prints a peak of four readers inside."
      },
      code: "main",
      lines: { python: [16, 17, 18, 20, 52, 53, 54, 65, 75], scala: [11, 12, 14, 15, 29, 37] },
      actions: [
        { mark: "lock", member: 2 },
        ...SHOPPERS.map((s, i): Action => ({ call: [s, "cat", "lock"], label: "read()", scalaLabel: "readLock().lock()", together: i > 0 })),
        { tag: "lock", text: "readers = 4" },
        { pulse: "lock" }
      ]
    },
    {
      title: "A writer waits for an empty room",
      what: "The sale job wants to change the price of a kurta. It asks for the write lock, which waits until every reader has left.",
      why: "A writer must never change data while someone is reading it, or the reader could see half a change.",
      say: {
        what: "The sale job wants to change the price of a kurta. It asks for the write lock, which waits until every reader has left.",
        why: "A writer must never change data while someone is reading it, or the reader could see half a change."
      },
      code: "main",
      lines: { python: [30, 31, 32, 33, 34, 58], scala: [19, 20] },
      actions: [
        { show: ["sale"] },
        { show: ["w-c"] },
        { mark: "lock", member: 3 },
        { call: ["sale", "cat", "lock"], label: "write()", scalaLabel: "writeLock().lock()", result: "wait" },
        { tag: "sale", text: "waiting" }
      ]
    },
    {
      title: "New readers queue behind the writer",
      what: "While the sale job waits, a shopper arrives to read. The lock makes her wait too, so the stream of readers cannot starve the writer.",
      why: "This is the policy choice: writer-first. Without it, a busy shop would keep letting readers in and the price would never change.",
      say: {
        what: "While the sale job waits, a shopper arrives to read. The lock makes her wait too, so the stream of readers cannot starve the writer.",
        why: "This is the policy choice: writer first. Without it, a busy shop would keep letting readers in, and the price would never change."
      },
      code: "main",
      lines: { python: [18, 19, 32], scala: [5, 12] },
      actions: [
        { mark: "lock", member: 2 },
        { call: ["s1", "cat", "lock"], label: "read()", scalaLabel: "readLock().lock()", result: "wait: writer queued" },
        { flash: "s1" },
        { tag: "s1", text: "waiting" }
      ]
    },
    {
      title: "The writer works alone",
      what: "The four readers finish and leave. The sale job enters alone and sets the kurta to ₹999. It sees 0 readers inside.",
      why: "Exclusive access makes the change safe: no reader and no other writer can see the prices mid-update.",
      say: {
        what: "The four readers finish and leave. The sale job enters alone and sets the kurta to nine hundred and ninety nine rupees. It sees zero readers inside.",
        why: "Exclusive access makes the change safe. No reader and no other writer can see the prices mid update."
      },
      code: "main",
      lines: { python: [36, 41, 42, 57, 58, 59, 60, 76], scala: [19, 20, 21, 22, 23, 38] },
      actions: [
        { tag: "lock", text: "readers = 0, writing" },
        { tag: "sale", text: null, together: true },
        { mark: "lock", member: 3 },
        { ring: "lock" },
        { call: ["sale", "cat", "lock"], label: "set_price('kurta', 999)", scalaLabel: "setPrice(\"kurta\", 999)", result: "0 readers inside" }
      ]
    },
    {
      title: "Readers see the whole new price",
      what: "The write lock is released and the waiting shopper goes in. Asha's cart now costs ₹1599: kurta ₹999 plus dupatta ₹600.",
      why: "Readers share, writers are exclusive, and nobody ever sees a half-done change. That is the whole pattern.",
      say: {
        what: "The write lock is released, and the waiting shopper goes in. Asha's cart now costs fifteen hundred and ninety nine rupees.",
        why: "Readers share, writers are exclusive, and nobody ever sees a half done change. That is the whole pattern."
      },
      code: "main",
      lines: { python: [41, 42, 77], scala: [39] },
      actions: [
        { ring: null },
        { tag: "lock", text: "readers = 1" },
        { tag: "s1", text: null, together: true },
        { call: ["s1", "cat", "lock"], label: "quote(Asha's cart)", result: "₹1599" },
        { show: ["ok"] },
        { pulse: "cat", together: true }
      ]
    },
    {
      title: "Know the cost before you reach for it",
      what: "A read-write lock does more bookkeeping than a plain lock. In Python, the GIL lets only one thread run Python code at a time, so readers truly overlap only while they wait on I/O.",
      why: "Use it when reads are many and slow. For tiny reads a plain Lock is faster; for small read-mostly data, a copy-on-write snapshot needs no read lock at all.",
      say: {
        what: "A read write lock does more bookkeeping than a plain lock. In Python, the global interpreter lock lets only one thread run Python code at a time, so readers truly overlap only while they wait on input and output.",
        why: "Use it when reads are many and slow. For tiny reads a plain lock is faster. For small read mostly data, a copy on write snapshot needs no read lock at all."
      },
      code: "main",
      lines: { python: [9, 10, 11, 12, 13], scala: [5, 7] },
      actions: [
        { tag: "lock", text: null },
        { mark: "lock", member: null, together: true },
        { hide: ["ok"] },
        { show: ["gil"] },
        { flash: "lock", together: true }
      ]
    }
  ]
};

/* ---------- example 1: who may enter the rate board? ---------- */

type RState = "empty" | "readers" | "writer" | "queued";
const LOCK_STATE: Record<RState, { py: string[]; sc: string[] }> = {
  empty: { py: ["readers = 0", "writing = False", "writers_waiting = 0"], sc: ["readers = 0", "write locked = false", "queued = 0"] },
  readers: { py: ["readers = 2", "writing = False", "writers_waiting = 0"], sc: ["readers = 2", "write locked = false", "queued = 0"] },
  writer: { py: ["readers = 0", "writing = True", "writers_waiting = 0"], sc: ["readers = 0", "write locked = true", "queued = 0"] },
  queued: { py: ["readers = 2", "writing = False", "writers_waiting = 1"], sc: ["readers = 2", "write locked = false", "queued = 1"] }
};
const setLock = (s: RState): Action => ({ members: "lock", lines: LOCK_STATE[s].py, scalaLines: LOCK_STATE[s].sc });

const RATE_OUT: Record<string, string> = {
  "empty|pay": "enters at once (1 reading)",
  "empty|feed": "enters alone",
  "readers|pay": "enters at once (3 reading)",
  "readers|feed": "waits for 2 readers to leave",
  "writer|pay": "waits for the writer to finish",
  "writer|feed": "waits for the writer to finish",
  "queued|pay": "waits: a writer is queued first",
  "queued|feed": "waits behind the queued writer"
};
const RATE_NOTE: Record<RState, string> = {
  empty: "Nobody inside: any reader or writer may enter.",
  readers: "Readers share; a writer needs the room empty.",
  writer: "A writer is alone: everyone else waits.",
  queued: "Writer-first policy: a queued writer closes the door to new readers."
};

function rateResult(state: RState, who: "pay" | "feed"): TryResult {
  const out = RATE_OUT[`${state}|${who}`];
  return {
    output: out,
    note: RATE_NOTE[state],
    actions: [
      setLock(state),
      { ring: who },
      { call: [who, "lock"], label: who === "pay" ? "acquire_read(block=False)" : "acquire_write(block=False)",
        scalaLabel: who === "pay" ? "readLock().tryLock(0, ms)" : "writeLock().tryLock(0, ms)", result: out.startsWith("enters") ? "enters" : "waits" }
    ]
  };
}

const rates: ExampleAnimation = {
  diagram: {
    label: "Payment threads and the rate feed ask the RateBoard's ReadWriteLock to enter; the lock's counters decide who goes in.",
    width: 760, height: 290, portraitWidth: 340, portraitHeight: 370,
    nodes: [
      { id: "pay", kind: "client", name: "payment thread", hidden: true,
        at: { x: 16, y: 30, w: 170, h: 54 }, portrait: { x: 8, y: 10, w: 156, h: 54 } },
      { id: "feed", kind: "client", name: "rate feed", hidden: true,
        at: { x: 16, y: 200, w: 170, h: 54 }, portrait: { x: 176, y: 10, w: 156, h: 54 } },
      { id: "lock", kind: "concrete", name: "ReadWriteLock", key: true, hidden: true,
        members: LOCK_STATE.empty.py, scalaMembers: LOCK_STATE.empty.sc,
        at: { x: 270, y: 90, w: 220 }, portrait: { x: 50, y: 110, w: 240 } },
      { id: "board", kind: "concrete", name: "RateBoard", hidden: true,
        members: ["- lock", "- rates: USD, EUR"],
        at: { x: 580, y: 100, w: 164 }, portrait: { x: 90, y: 262, w: 164 } }
    ],
    edges: [
      { id: "p-l", from: "pay", to: "lock", type: "dependency", hidden: true, route: "straight" },
      { id: "f-l", from: "feed", to: "lock", type: "dependency", hidden: true, route: "straight" },
      { id: "b-l", from: "board", to: "lock", type: "composition", hidden: true, route: "straight" }
    ]
  },
  walk: [
    [{ show: ["pay", "feed", "lock", "board"] }, { show: ["p-l", "f-l", "b-l"] },
      { call: ["pay", "lock"], label: "try read", result: "enters (1 reading)" },
      { call: ["feed", "lock"], label: "try write", result: "enters alone" }],
    [setLock("readers"), { call: ["pay", "lock"], label: "try read", result: "enters (3 reading)" }, { pulse: "lock" }],
    [{ call: ["feed", "lock"], label: "try write", result: "waits for 2 readers" }, { flash: "feed" }],
    [setLock("writer"), { mark: "lock", member: 1 },
      { call: ["pay", "lock"], label: "try read", result: "waits for the writer" },
      { call: ["feed", "lock"], label: "try write", result: "waits for the writer" }],
    [{ mark: "lock", member: null }, setLock("queued"), { tag: "feed", text: "queued" }, { mark: "lock", member: 2 },
      { call: ["pay", "lock"], label: "try read", result: "waits: writer queued" }]
  ],
  tryIt: {
    prompt: "Choose who is inside the lock now, and who arrives. Does the newcomer get in?",
    groups: [
      { label: "Inside now", options: [{ id: "empty", label: "nobody" }, { id: "readers", label: "2 readers" }, { id: "writer", label: "a writer" }, { id: "queued", label: "2 readers + queued writer" }] },
      { label: "Who arrives", options: [{ id: "pay", label: "a payment (reader)" }, { id: "feed", label: "the rate feed (writer)" }] }
    ],
    results: Object.fromEntries((["empty", "readers", "writer", "queued"] as RState[]).flatMap((s) =>
      (["pay", "feed"] as const).map((w) => [`${s}|${w}`, rateResult(s, w)])))
  }
};

/* ---------- example 2: leaderboard policy ---------- */

function boardResult(writerFirst: boolean, viewers: number): TryResult {
  const out = writerFirst ? `writer next; ${viewers} readers wait` : `writer overtaken by ${viewers} readers`;
  return {
    output: out,
    note: writerFirst
      ? "A queued writer closes the door to new readers, so it goes as soon as the 2 viewers leave."
      : `New viewers walk past the waiting updater; it now waits for ${2 + viewers} readers.`,
    actions: [
      { members: "lock", lines: [writerFirst ? "policy: writer-first" : "policy: reader-first", "readers = 2", "writers_waiting = 1"] },
      { ring: "newv" },
      { call: ["newv", "lock"], label: `try_read() × ${viewers}`, scalaLabel: `tryRead() × ${viewers}`, result: writerFirst ? "wait" : "let in" },
      ...(writerFirst ? [] : [{ members: "lock", lines: ["policy: reader-first", `readers = ${2 + viewers}`, "writers_waiting = 1"] } as Action, { flash: "upd" } as Action])
    ]
  };
}

const leaderboard: ExampleAnimation = {
  diagram: {
    label: "Viewers read the Leaderboard through its ReadWriteLock while a score updater waits to write; the lock's policy decides who goes first.",
    width: 760, height: 290, portraitWidth: 340, portraitHeight: 360,
    nodes: [
      { id: "viewers", kind: "client", name: "2 viewers", hidden: true,
        at: { x: 16, y: 24, w: 160, h: 54 }, portrait: { x: 8, y: 10, w: 156, h: 54 } },
      { id: "newv", kind: "client", name: "new viewers", hidden: true,
        at: { x: 16, y: 200, w: 160, h: 54 }, portrait: { x: 176, y: 10, w: 156, h: 54 } },
      { id: "lock", kind: "concrete", name: "ReadWriteLock", key: true, hidden: true,
        members: ["policy: writer-first", "readers = 0", "writers_waiting = 0"],
        at: { x: 270, y: 90, w: 230 }, portrait: { x: 50, y: 100, w: 240 } },
      { id: "board", kind: "concrete", name: "Leaderboard", hidden: true,
        members: ["- lock", "Priya: 8,800"],
        at: { x: 590, y: 20, w: 154 }, portrait: { x: 8, y: 250, w: 150 } },
      { id: "upd", kind: "client", name: "score updater", hidden: true,
        at: { x: 590, y: 196, w: 154, h: 54 }, portrait: { x: 182, y: 264, w: 150, h: 54 } }
    ],
    edges: [
      { id: "v-l", from: "viewers", to: "lock", type: "dependency", hidden: true, route: "straight" },
      { id: "n-l", from: "newv", to: "lock", type: "dependency", hidden: true, route: "straight" },
      { id: "b-l", from: "board", to: "lock", type: "composition", hidden: true, route: "straight" },
      { id: "u-b", from: "upd", to: "board", type: "dependency", hidden: true }
    ]
  },
  walk: [
    [{ show: ["viewers", "lock", "board"] }, { show: ["v-l", "b-l"] },
      { call: ["viewers", "lock"], label: "try_read() × 2", scalaLabel: "tryRead() × 2", result: "inside" },
      { members: "lock", lines: ["policy: writer-first", "readers = 2", "writers_waiting = 0"] }],
    [{ show: ["upd"] }, { show: ["u-b"] },
      { call: ["upd", "board", "lock"], label: "update('Priya', 9100)", scalaLabel: "update(\"Priya\", 9100)", result: "wait" },
      { members: "lock", lines: ["policy: writer-first", "readers = 2", "writers_waiting = 1"] }, { tag: "upd", text: "waiting" }],
    [{ members: "lock", lines: ["policy: reader-first", "readers = 2", "writers_waiting = 1"] }, { show: ["newv"] }, { show: ["n-l"] },
      { call: ["newv", "lock"], label: "try_read() × 5", scalaLabel: "tryRead() × 5", result: "let in" },
      { members: "lock", lines: ["policy: reader-first", "readers = 7", "writers_waiting = 1"] }, { flash: "upd" }],
    [{ members: "lock", lines: ["policy: writer-first", "readers = 2", "writers_waiting = 1"] },
      { call: ["newv", "lock"], label: "try_read() × 5", scalaLabel: "tryRead() × 5", result: "wait" },
      { tag: "newv", text: "waiting" }, { ring: "upd", caption: "goes next" }],
    [{ ring: null }, { members: "lock", lines: ["policy: writer-first", "readers = 0", "writers_waiting = 0"] }, { tag: "upd", text: null },
      { call: ["upd", "board"], label: "write Priya = 9,100", result: "done" },
      { members: "board", lines: ["- lock", "Priya: 9,100"] }, { pulse: "board" }]
  ],
  tryIt: {
    prompt: "Two players are viewing and the updater is queued. Pick the lock's policy and how many new viewers arrive.",
    groups: [
      { label: "Policy", options: [{ id: "reader", label: "reader-first" }, { id: "writer", label: "writer-first" }] },
      { label: "New viewers", options: [{ id: "v2", label: "2" }, { id: "v5", label: "5" }] }
    ],
    results: {
      "reader|v2": boardResult(false, 2), "reader|v5": boardResult(false, 5),
      "writer|v2": boardResult(true, 2), "writer|v5": boardResult(true, 5)
    }
  }
};

/* ---------- example 3: fare cache, check again ---------- */

function fareResult(case_: "one" | "four" | "warm", check: boolean): TryResult {
  const calls = case_ === "warm" ? 0 : case_ === "one" ? 1 : check ? 1 : 4;
  const out = `airline called ${calls} time${calls === 1 ? "" : "s"}`;
  const searches = case_ === "one" ? 1 : 4;
  return {
    output: out,
    note: case_ === "warm"
      ? "The fare is already cached, so every search is a read-lock hit."
      : case_ === "one"
        ? "One search: it misses once and fills the cache."
        : check ? "The first writer fills the cache; the other three find it on the second check."
          : "Every search that saw the miss calls the airline again: 3 wasted, paid calls.",
    actions: [
      { members: "cache", lines: [case_ === "warm" ? "fares: BLR-DEL ₹5,400" : "fares: (empty)", check ? "check_again = True" : "check_again = False", "+ fare(route)"],
        scalaLines: [case_ === "warm" ? "fares: BLR-DEL ₹5,400" : "fares: (empty)", check ? "checkAgain = true" : "checkAgain = false", "+ fare(route)"] },
      { ring: "searches" },
      { call: ["searches", "cache", "lock"], label: `fare("BLR-DEL") × ${searches}`, result: case_ === "warm" ? "hit" : "miss" },
      ...(calls > 0 ? [{ call: ["cache", "airline"], label: `fetch × ${calls}`, result: "₹5,400" } as Action, { members: "airline", lines: [`calls = ${calls}`] } as Action] : []),
      ...(calls > 1 ? [{ flash: "airline" } as Action] : [])
    ]
  };
}

const fares: ExampleAnimation = {
  diagram: {
    label: "Search threads ask FareCache for a fare; FareCache uses its ReadWriteLock and, on a miss, calls the airline.",
    width: 760, height: 290, portraitWidth: 340, portraitHeight: 350,
    nodes: [
      { id: "searches", kind: "client", name: "4 searches", hidden: true,
        at: { x: 16, y: 110, w: 150, h: 54 }, portrait: { x: 95, y: 10, w: 150, h: 54 } },
      { id: "cache", kind: "concrete", name: "FareCache", key: true, hidden: true,
        members: ["fares: (empty)", "check_again = True", "+ fare(route)"],
        scalaMembers: ["fares: (empty)", "checkAgain = true", "+ fare(route)"],
        at: { x: 230, y: 86, w: 230 }, portrait: { x: 55, y: 100, w: 230 } },
      { id: "lock", kind: "concrete", name: "ReadWriteLock", hidden: true,
        members: ["+ read", "+ write"],
        at: { x: 550, y: 20, w: 190 }, portrait: { x: 8, y: 254, w: 156 } },
      { id: "airline", kind: "concrete", name: "Airline API", hidden: true,
        members: ["calls = 0"],
        at: { x: 550, y: 190, w: 190 }, portrait: { x: 176, y: 254, w: 156 } }
    ],
    edges: [
      { id: "s-c", from: "searches", to: "cache", type: "dependency", hidden: true },
      { id: "c-l", from: "cache", to: "lock", type: "composition", hidden: true, route: "straight" },
      { id: "c-a", from: "cache", to: "airline", type: "dependency", hidden: true, route: "straight" }
    ]
  },
  walk: [
    [{ show: ["searches", "cache", "lock", "airline"] }, { show: ["s-c", "c-l", "c-a"] },
      { call: ["searches", "cache", "lock"], label: "read: BLR-DEL?", result: "miss × 4" }],
    [{ tag: "searches", text: "queued for write" }, { call: ["cache", "lock"], label: "release read, take write" }],
    [{ call: ["cache", "airline"], label: "fetch BLR-DEL", result: "₹5,400" },
      { members: "cache", lines: ["fares: BLR-DEL ₹5,400", "check_again = True", "+ fare(route)"],
        scalaLines: ["fares: BLR-DEL ₹5,400", "checkAgain = true", "+ fare(route)"] },
      { members: "airline", lines: ["calls = 1"] }],
    [{ tag: "searches", text: null }, { mark: "cache", member: 1 },
      { call: ["cache", "lock"], label: "check again × 3", result: "found ₹5,400" }, { ring: "airline", caption: "called once" }],
    [{ ring: null }, { mark: "cache", member: null },
      { members: "cache", lines: ["fares: BLR-DEL ₹5,400", "check_again = False", "+ fare(route)"],
        scalaLines: ["fares: BLR-DEL ₹5,400", "checkAgain = false", "+ fare(route)"] },
      { call: ["cache", "airline"], label: "fetch × 4", result: "₹5,400" },
      { members: "airline", lines: ["calls = 4"] }, { flash: "airline" }]
  ],
  tryIt: {
    prompt: "Choose how many searches miss at once and what happens after taking the write lock. How often is the airline called?",
    groups: [
      { label: "Searches", options: [{ id: "one", label: "1 search" }, { id: "four", label: "4 at once" }, { id: "warm", label: "4, cache warm" }] },
      { label: "After the write lock", options: [{ id: "check", label: "check again" }, { id: "nocheck", label: "fetch straight away" }] }
    ],
    results: Object.fromEntries((["one", "four", "warm"] as const).flatMap((c) =>
      (["check", "nocheck"] as const).map((k) => [`${c}|${k}`, fareResult(c, k === "check")])))
  }
};

/* ---------- example 4: patient chart, torn reads ---------- */

const CHART_OUT: Record<string, string> = {
  "nolock|before": "120/80 (old reading)", "nolock|during": "135/80 (torn: never measured)", "nolock|after": "135/90 (new reading)",
  "lock|before": "120/80 (old reading)", "lock|during": "135/90 (new reading)", "lock|after": "135/90 (new reading)"
};

function chartResult(lock: "nolock" | "lock", when: "before" | "during" | "after"): TryResult {
  const out = CHART_OUT[`${lock}|${when}`];
  const fields = when === "before" ? ["systolic = 120", "diastolic = 80"] : when === "during" ? ["systolic = 135", "diastolic = 80"] : ["systolic = 135", "diastolic = 90"];
  const torn = out.includes("torn");
  return {
    output: out,
    note: when !== "during"
      ? "No update is in progress, so both ways read a whole reading."
      : lock === "lock" ? "The read lock made the screen wait until both fields were written." : "The screen read between the two field writes.",
    actions: [
      { members: "chart", lines: [...fields, "+ record_bp(s, d)"], scalaLines: [...fields, "+ recordBp(s, d)"] },
      ...(when === "during" ? [{ tag: "nurse", text: "halfway" } as Action] : [{ tag: "nurse", text: null } as Action]),
      { ring: "doc" },
      lock === "lock"
        ? { call: ["doc", "chart", "lock"], label: "bp_with_lock()", scalaLabel: "bpWithLock()", result: out.split(" ")[0] }
        : { call: ["doc", "chart"], label: "bp_without_lock()", scalaLabel: "bpWithoutLock()", result: out.split(" ")[0] },
      ...(torn ? [{ flash: "doc" } as Action] : [])
    ]
  };
}

const chart: ExampleAnimation = {
  diagram: {
    label: "A nurse writes two blood-pressure fields of PatientChart under the write lock while a doctor's screen reads them, with or without the read lock.",
    width: 760, height: 290, portraitWidth: 340, portraitHeight: 360,
    nodes: [
      { id: "nurse", kind: "client", name: "nurse", hidden: true,
        at: { x: 16, y: 30, w: 150, h: 54 }, portrait: { x: 8, y: 10, w: 156, h: 54 } },
      { id: "doc", kind: "client", name: "doctor's screen", hidden: true,
        at: { x: 16, y: 196, w: 150, h: 54 }, portrait: { x: 176, y: 10, w: 156, h: 54 } },
      { id: "chart", kind: "concrete", name: "PatientChart", key: true, hidden: true,
        members: ["systolic = 120", "diastolic = 80", "+ record_bp(s, d)"],
        scalaMembers: ["systolic = 120", "diastolic = 80", "+ recordBp(s, d)"],
        at: { x: 260, y: 90, w: 230 }, portrait: { x: 50, y: 110, w: 240 } },
      { id: "lock", kind: "concrete", name: "ReadWriteLock", hidden: true,
        members: ["+ read()", "+ write()"],
        at: { x: 580, y: 100, w: 164 }, portrait: { x: 90, y: 262, w: 164 } }
    ],
    edges: [
      { id: "n-c", from: "nurse", to: "chart", type: "dependency", hidden: true, route: "straight" },
      { id: "d-c", from: "doc", to: "chart", type: "dependency", hidden: true, route: "straight" },
      { id: "c-l", from: "chart", to: "lock", type: "composition", hidden: true, route: "straight" }
    ]
  },
  walk: [
    [{ show: ["nurse", "doc", "chart", "lock"] }, { show: ["n-c", "d-c", "c-l"] },
      { call: ["doc", "chart", "lock"], label: "bp_with_lock()", scalaLabel: "bpWithLock()", result: "120/80" }],
    [{ call: ["nurse", "chart", "lock"], label: "record_bp(135, 90)", scalaLabel: "recordBp(135, 90)" },
      { members: "chart", lines: ["systolic = 135", "diastolic = 80", "+ record_bp(s, d)"], scalaLines: ["systolic = 135", "diastolic = 80", "+ recordBp(s, d)"] },
      { mark: "chart", member: 0 }, { tag: "nurse", text: "halfway" }],
    [{ call: ["doc", "chart"], label: "bp_without_lock()", scalaLabel: "bpWithoutLock()", result: "135/80 torn!" }, { flash: "doc" }, { shake: "doc", together: true }],
    [{ call: ["doc", "chart", "lock"], label: "bp_with_lock()", scalaLabel: "bpWithLock()", result: "wait" }, { tag: "doc", text: "waiting" }],
    [{ mark: "chart", member: 1 },
      { members: "chart", lines: ["systolic = 135", "diastolic = 90", "+ record_bp(s, d)"], scalaLines: ["systolic = 135", "diastolic = 90", "+ recordBp(s, d)"] },
      { tag: "nurse", text: null }, { tag: "doc", text: null, together: true },
      { call: ["doc", "chart", "lock"], label: "bp_with_lock()", scalaLabel: "bpWithLock()", result: "135/90" }, { mark: "chart", member: null }]
  ],
  tryIt: {
    prompt: "The nurse records 135/90 over the old 120/80. Choose how the screen reads and when. What does it show?",
    groups: [
      { label: "Screen reads", options: [{ id: "nolock", label: "without a lock" }, { id: "lock", label: "with the read lock" }] },
      { label: "When", options: [{ id: "before", label: "before" }, { id: "during", label: "during" }, { id: "after", label: "after" }] }
    ],
    results: Object.fromEntries((["nolock", "lock"] as const).flatMap((l) =>
      (["before", "during", "after"] as const).map((w) => [`${l}|${w}`, chartResult(l, w)])))
  }
};

const animation: PatternAnimation = {
  slug: "read-write-lock",
  story: storyAnim,
  examples: { rates, leaderboard, fares, chart },
  sequence: {
    label: "Two shoppers read through the shared read lock at the same time; the sale job's write waits until no reader is inside, then writes alone.",
    participants: [
      { id: "asha", name: "Asha (thread)", kind: "client" },
      { id: "ravi", name: "Ravi (thread)", kind: "client" },
      { id: "cat", name: "catalog: PriceCatalog", kind: "concrete" },
      { id: "lock", name: ": ReadWriteLock", kind: "concrete" },
      { id: "sale", name: "Sale job", kind: "client" }
    ],
    messages: [
      { from: "asha", to: "cat", label: "quote(cart)" },
      { from: "cat", to: "lock", label: "read()" },
      { from: "lock", to: "cat", label: "enter (shared)", kind: "return" },
      { from: "ravi", to: "cat", label: "quote(cart)" },
      { from: "cat", to: "lock", label: "read()" },
      { from: "lock", to: "cat", label: "enter too: 2 readers", kind: "return" },
      { from: "cat", to: "asha", label: "₹1800", kind: "return" },
      { from: "sale", to: "cat", label: "set_price('kurta', 999)" },
      { from: "cat", to: "lock", label: "write()" },
      { from: "lock", to: "lock", label: "wait until readers = 0", kind: "self" },
      { from: "lock", to: "cat", label: "enter alone", kind: "return" },
      { from: "cat", to: "sale", label: "0 readers inside", kind: "return" }
    ]
  }
};

export default animation;
