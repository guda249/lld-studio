import type { Action, ExampleAnimation, PatternAnimation, TryResult } from "../../../anim/types";

/* ---------- story: two services, two configs, then one guarded instance ---------- */

const storyAnim: PatternAnimation["story"] = {
  diagram: {
    label: "Upload and download services each built their own AppConfig; after the fix both, and eight threads, share the one AppConfig instance.",
    width: 900,
    height: 380,
    portraitWidth: 340,
    portraitHeight: 400,
    nodes: [
      { id: "upload", kind: "client", name: "Upload service",
        at: { x: 20, y: 60, w: 170, h: 56 }, portrait: { x: 8, y: 40, w: 150, h: 56 } },
      { id: "download", kind: "client", name: "Download service",
        at: { x: 20, y: 290, w: 170, h: 56 }, portrait: { x: 8, y: 314, w: 150, h: 56 } },
      { id: "cfg1", kind: "concrete", name: "config1: AppConfig", hidden: true,
        members: ["max_upload_mb = 10"], scalaMembers: ["maxUploadMb = 10"],
        at: { x: 620, y: 51, w: 200, h: 74 }, portrait: { x: 178, y: 37, w: 154, h: 66 } },
      { id: "cfg2", kind: "concrete", name: "config2: AppConfig", hidden: true,
        members: ["max_upload_mb = 50"], scalaMembers: ["maxUploadMb = 50"],
        at: { x: 620, y: 281, w: 200, h: 74 }, portrait: { x: 178, y: 311, w: 154, h: 74 } },
      { id: "single", kind: "singleton", name: "AppConfig", key: true, hidden: true,
        members: ["- _instance: AppConfig", "- _lock: Lock", "+ __new__(): AppConfig", "+ get(key): str"],
        scalaMembers: ["(one instance per JVM)", "(thread-safe start)", "(made on first use)", "+ get(key): String"],
        at: { x: 330, y: 135, w: 220 }, portrait: { x: 8, y: 140, w: 196 } },
      { id: "threads", kind: "client", name: "8 threads", hidden: true,
        at: { x: 640, y: 174, w: 170, h: 56 }, portrait: { x: 222, y: 179, w: 110, h: 56 } }
    ],
    edges: [
      { id: "e1", from: "upload", to: "cfg1", type: "dependency", hidden: true },
      { id: "e2", from: "download", to: "cfg2", type: "dependency", hidden: true },
      { id: "u-s", from: "upload", to: "single", type: "dependency", hidden: true, via: [[260, 165], [260, 88]] },
      { id: "d-s", from: "download", to: "single", type: "dependency", hidden: true, via: [[260, 240], [260, 318]] },
      { id: "t-s", from: "threads", to: "single", type: "dependency", hidden: true }
    ],
    badges: [
      { id: "warn", text: "Two copies disagree", tone: "warn", near: "cfg1" },
      { id: "ok", text: "One instance, loaded once", tone: "ok", near: "single" },
      { id: "cost", text: "Hidden global, hard to test", tone: "info", near: "single" }
    ]
  },
  steps: [
    {
      title: "The problem: every service builds its own config",
      what: "The upload and download services each call AppConfig(). Each call reads the config file again, and the file changed in between.",
      why: "Now the two services disagree (10 MB versus 50 MB), and the file is read twice. Some things must exist only once to stay consistent.",
      say: {
        what: "Here's the problem. The upload service and the download service each create their own app config. Each one reads the config file again, and the file changed in between.",
        why: "Now the two services disagree: ten megabytes versus fifty. Some things must exist only once to stay consistent."
      },
      code: "problem",
      lines: { python: [7, 8, 9, 15, 16, 17], scala: [5, 6, 7, 14, 15, 16] },
      actions: [
        { spawn: ["cfg1"], from: "upload" },
        { show: ["e1"] },
        { call: ["upload", "cfg1"], label: "AppConfig()", result: "10 MB" },
        { spawn: ["cfg2"], from: "download" },
        { show: ["e2"] },
        { call: ["download", "cfg2"], label: "AppConfig()", result: "50 MB" },
        { flash: "cfg2" },
        { shake: "cfg2", together: true },
        { show: ["warn"], together: true },
        { tag: "cfg2", text: "file read 2 times" }
      ]
    },
    {
      title: "Let the class guard its own creation",
      what: "AppConfig keeps its one instance in a class attribute. __new__ hands back that instance instead of building a new one. In Scala, an object does this for you.",
      why: "Only the class decides when it is created, so nobody can make a second copy by accident.",
      say: {
        what: "Now app config keeps its one instance inside the class. Its constructor hands back that instance instead of building a new one. In Scala, an object does this for you.",
        why: "Only the class decides when it is created, so nobody can make a second copy by accident."
      },
      code: "main",
      lines: { python: [4, 5, 6, 10, 18], scala: [1, 2, 3] },
      actions: [
        { hide: ["warn"] },
        { tag: "cfg2", text: null, together: true },
        { cross: "cfg1" },
        { cross: "cfg2", together: true },
        { show: ["single"] },
        { mark: "single", member: 2 }
      ]
    },
    {
      title: "Every caller gets the same object",
      what: "Both services still write AppConfig(), but now each call returns the same instance.",
      why: "There is one set of settings, so every part of the program sees the same values.",
      say: {
        what: "Both services still ask for app config, but now each call returns the very same instance.",
        why: "There is one set of settings, so every part of the program sees the same values."
      },
      code: "main",
      lines: { python: [18, 26, 39], scala: [20, 21, 22] },
      actions: [
        { mark: "single", member: null },
        { hide: ["cfg1", "cfg2", "cfg1__x", "cfg2__x", "e1", "e2"] },
        { show: ["u-s", "d-s"] },
        { call: ["upload", "single"], label: "AppConfig()", scalaLabel: "AppConfig", result: "the instance" },
        { call: ["download", "single"], label: "AppConfig()", scalaLabel: "AppConfig", result: "the same instance" },
        { ring: "single" }
      ]
    },
    {
      title: "Eight threads at once: still one instance",
      what: "Eight threads ask at the same moment. The first check skips the lock when the instance exists; the second check, inside the lock, stops two threads from both creating it.",
      why: "Double-checked locking makes the lazy creation thread-safe. The JVM gives a Scala object the same guarantee.",
      say: {
        what: "Now eight threads ask at the same moment. The first check skips the lock once the instance exists. The second check, inside the lock, stops two threads from both creating it.",
        why: "This double-checked locking makes the creation thread safe. In Scala, the J V M gives an object the same guarantee."
      },
      code: "main",
      lines: { python: [11, 12, 13, 14, 17, 31], scala: [1, 2, 3] },
      actions: [
        { ring: null },
        { show: ["threads"] },
        { show: ["t-s"] },
        { mark: "single", member: 1 },
        { call: ["threads", "single"], label: "AppConfig() × 8", scalaLabel: "AppConfig × 8", result: "1 distinct object" },
        { tag: "threads", text: "1 object" }
      ]
    },
    {
      title: "Read the shared settings anywhere",
      what: "A service such as ReportService asks for AppConfig and calls get(\"env\"). The answer comes from the one shared instance.",
      why: "Any code can reach the instance without passing it around. That is the convenience, and, as we will see, the risk.",
      say: {
        what: "A service, such as the report service, asks for app config and reads the env setting. The answer comes from the one shared instance.",
        why: "Any code can reach the instance without passing it around. That is the convenience, and also the risk."
      },
      code: "main",
      lines: { python: [20, 21, 26, 27, 40], scala: [9, 12, 23] },
      actions: [
        { mark: "single", member: 3 },
        { call: ["upload", "single"], label: "get(\"env\")", result: "\"prod\"" },
        { call: ["download", "single"], label: "get(\"region\")", result: "\"ap-south-1\"" }
      ]
    },
    {
      title: "One instance, settings loaded once",
      what: "The demo prints one distinct object, settings loaded 1 time, and Same instance: True.",
      why: "Expensive setup runs once, lazily, and everyone sees the same consistent state.",
      say: {
        what: "The demo prints one distinct object, settings loaded once, and same instance: true.",
        why: "The expensive setup runs once, only when first needed, and everyone sees the same consistent state."
      },
      code: "main",
      lines: { python: [37, 38, 39], scala: [22, 25] },
      actions: [
        { mark: "single", member: null },
        { show: ["ok"] },
        { pulse: "single", together: true },
        { ring: "single" }
      ]
    },
    {
      title: "Know the cost: a hidden global",
      what: "ReportService never shows in its constructor that it needs AppConfig. It just reaches out and grabs it.",
      why: "Hidden dependencies are hard to replace in tests, and state leaks between tests. Injecting the one instance fixes this (Dependency Inversion).",
      say: {
        what: "But notice: the report service never shows in its constructor that it needs app config. It just reaches out and grabs it.",
        why: "Hidden dependencies are hard to replace in tests, and state leaks between tests. Creating the one instance at startup and passing it in fixes this."
      },
      code: "main",
      lines: { python: [24, 25, 26], scala: [11, 12] },
      actions: [
        { ring: null },
        { hide: ["ok"] },
        { show: ["cost"] },
        { flash: "upload", together: true },
        { flash: "download", together: true }
      ]
    }
  ]
};

/* ---------- example 1: airway bill numbers ---------- */

const HUBS = ["h1", "h2", "h3", "h4"];
const hubName = ["BLR", "DEL", "BOM", "HYD"];

function awbResult(issued: number, from: "che" | "h1"): TryResult {
  const code = from === "che" ? "CHE" : "BLR";
  const out = `${code}-${String(issued + 1).padStart(6, "0")}`;
  return {
    output: out,
    note: `${issued} numbers were issued before from the one shared counter, so the next is ${issued + 1}, whichever hub asks.`,
    actions: [
      { tag: "gen", text: `counter = ${issued}` },
      { ring: from },
      { call: [from, "gen"], label: `next_awb('${code}')`, scalaLabel: `nextAwb("${code}")`, result: `"${out}"` }
    ]
  };
}

const awb: ExampleAnimation = {
  diagram: {
    label: "Four hub workers and the Chennai hub all call the one AwbGenerator, which holds a single counter.",
    width: 760, height: 300, portraitWidth: 340, portraitHeight: 360,
    nodes: [
      ...HUBS.map((id, i) => ({
        id, kind: "client" as const, name: "hub " + hubName[i], hidden: true,
        at: { x: 16 + 186 * i, y: 16, w: 140, h: 50 }, portrait: { x: 8 + 84 * i, y: 14, w: 72, h: 50 }
      })),
      { id: "gen", kind: "singleton", name: "AwbGenerator", key: true, hidden: true,
        members: ["- _instance", "- _counter: int", "+ next_awb(hub)"],
        scalaMembers: ["(one object per JVM)", "- counter: AtomicLong", "+ nextAwb(hub)"],
        at: { x: 270, y: 140, w: 220, h: 128 }, portrait: { x: 60, y: 120, w: 220, h: 128 } },
      { id: "che", kind: "client", name: "hub CHE", hidden: true,
        at: { x: 580, y: 170, w: 150, h: 50 }, portrait: { x: 95, y: 290, w: 150, h: 50 } }
    ],
    edges: [
      ...HUBS.map((id) => ({ id: "e-" + id, from: id, to: "gen", type: "dependency" as const, hidden: true, route: "straight" as const })),
      { id: "e-che", from: "che", to: "gen", type: "dependency", hidden: true, route: "straight" }
    ]
  },
  walk: [
    [{ show: HUBS }, { pulse: "h1" }, { pulse: "h4", together: true }],
    [{ show: ["gen"] }, { show: HUBS.map((h) => "e-" + h) }, { ring: "gen", caption: "one instance" }],
    [
      { mark: "gen", member: 1 },
      ...HUBS.map((h, i): Action => ({ call: [h, "gen"], label: `next_awb('${hubName[i]}') × 250`, scalaLabel: `nextAwb("${hubName[i]}") × 250`, together: i > 0 })),
      { tag: "gen", text: "counter = 1000" }
    ],
    [{ mark: "gen", member: null }, { show: ["che"] }, { show: ["e-che"] },
      { call: ["che", "gen"], label: "next_awb('CHE')", scalaLabel: "nextAwb(\"CHE\")", result: "\"CHE-001001\"" }],
    [{ call: ["h1", "gen"], label: "AwbGenerator() is AwbGenerator()", scalaLabel: "AwbGenerator eq AwbGenerator", result: "True" },
      { pulse: "gen" }]
  ],
  tryIt: {
    prompt: "Choose how many numbers were issued, and which hub asks next. What number does it get?",
    groups: [
      { label: "Issued before", options: [{ id: "n1000", label: "4 hubs × 250" }, { id: "n500", label: "2 hubs × 250" }, { id: "n400", label: "4 hubs × 100" }] },
      { label: "Next request from", options: [{ id: "che", label: "Chennai" }, { id: "blr", label: "Bengaluru" }] }
    ],
    results: {
      "n1000|che": awbResult(1000, "che"), "n1000|blr": awbResult(1000, "h1"),
      "n500|che": awbResult(500, "che"), "n500|blr": awbResult(500, "h1"),
      "n400|che": awbResult(400, "che"), "n400|blr": awbResult(400, "h1")
    }
  }
};

/* ---------- example 2: metrics counters (multiton) ---------- */

const COUNTERS: Record<string, { node?: string; value: number }> = {
  http_requests: { node: "http", value: 4 },
  login_failures: { node: "fail", value: 1 },
  search_results: { node: "sres", value: 12 },
  page_views: { value: 0 }
};

function metricResult(name: string, from: "login" | "search"): TryResult {
  const c = COUNTERS[name];
  const output = `${name} = ${c.value}${c.node ? " (shared)" : " (new)"}`;
  const path = c.node ? [from, "reg", c.node] : [from, "reg"];
  return {
    output,
    note: c.node
      ? `Same counter object whichever module asks: one instance per name.`
      : "No counter had this name yet, so named() created one, starting at 0.",
    actions: [
      { ring: c.node ?? "reg" },
      { call: path, label: `named("${name}")`, result: String(c.value) }
    ]
  };
}

const metrics: ExampleAnimation = {
  diagram: {
    label: "handle_login and handle_search ask the Counter registry for counters by name; the registry holds one Counter per name.",
    width: 760, height: 290, portraitWidth: 340, portraitHeight: 474,
    nodes: [
      { id: "login", kind: "client", name: "handle_login", hidden: true,
        at: { x: 16, y: 30, w: 150, h: 54 }, portrait: { x: 8, y: 14, w: 156, h: 54 } },
      { id: "search", kind: "client", name: "handle_search", hidden: true,
        at: { x: 16, y: 200, w: 150, h: 54 }, portrait: { x: 176, y: 14, w: 156, h: 54 } },
      { id: "reg", kind: "singleton", name: "Counter (registry)", key: true, hidden: true,
        members: ["- _registry: dict", "+ named(name)", "+ report()"],
        scalaMembers: ["- registry: LinkedHashMap", "+ named(name)", "+ report()"],
        at: { x: 220, y: 100, w: 210 }, portrait: { x: 8, y: 100, w: 220 } },
      { id: "http", kind: "concrete", name: "http_requests: Counter", hidden: true, members: ["value = 0"],
        at: { x: 540, y: 14, w: 200 }, portrait: { x: 120, y: 250, w: 212 } },
      { id: "fail", kind: "concrete", name: "login_failures: Counter", hidden: true, members: ["value = 0"],
        at: { x: 540, y: 112, w: 200 }, portrait: { x: 120, y: 324, w: 212 } },
      { id: "sres", kind: "concrete", name: "search_results: Counter", hidden: true, members: ["value = 0"],
        at: { x: 540, y: 210, w: 200 }, portrait: { x: 120, y: 398, w: 212 } }
    ],
    edges: [
      { id: "l-r", from: "login", to: "reg", type: "dependency", hidden: true, route: "straight" },
      { id: "s-r", from: "search", to: "reg", type: "dependency", hidden: true, route: "straight" },
      { id: "a-http", from: "reg", to: "http", type: "aggregation", hidden: true, route: "straight", viaPortrait: [[60, 281]] },
      { id: "a-fail", from: "reg", to: "fail", type: "aggregation", hidden: true, route: "straight", viaPortrait: [[60, 355]] },
      { id: "a-sres", from: "reg", to: "sres", type: "aggregation", hidden: true, route: "straight", viaPortrait: [[60, 429]] }
    ]
  },
  walk: [
    [{ show: ["login", "reg"] }, { show: ["l-r"] }, { spawn: ["http", "fail"], from: "reg" }, { show: ["a-http", "a-fail"] },
      { call: ["login", "reg", "http"], label: "inc() × 2" }, { members: "http", lines: ["value = 2"] },
      { call: ["login", "reg", "fail"], label: "inc()" }, { members: "fail", lines: ["value = 1"] }],
    [{ show: ["search"] }, { show: ["s-r"] }, { spawn: ["sres"], from: "reg" }, { show: ["a-sres"] },
      { call: ["search", "reg", "http"], label: "inc() × 2" }, { members: "http", lines: ["value = 4"] },
      { call: ["search", "reg", "sres"], label: "inc(12), inc(0)" }, { members: "sres", lines: ["value = 12"] }],
    [{ call: ["login", "reg", "http"], label: "named(\"http_requests\")" },
      { call: ["search", "reg", "http"], label: "named(\"http_requests\")" }, { pulse: "http" }],
    [{ ring: "http" }, { call: ["login", "reg"], label: "named(…) is named(…)", scalaLabel: "named(…) eq named(…)", result: "True" }],
    [{ ring: "reg" }, { call: ["login", "reg"], label: "Counter.report()", result: "4 requests, 1 failure, 12 results" }]
  ],
  tryIt: {
    prompt: "Pick a metric name and the module that asks for it. Which counter comes back?",
    groups: [
      { label: "Metric name", options: Object.keys(COUNTERS).map((n) => ({ id: n, label: n })) },
      { label: "Asked from", options: [{ id: "login", label: "handle_login" }, { id: "search", label: "handle_search" }] }
    ],
    results: Object.fromEntries(Object.keys(COUNTERS).flatMap((n) =>
      (["login", "search"] as const).map((m) => [`${n}|${m}`, metricResult(n, m)])))
  }
};

/* ---------- example 3: UPI daily limit, injected ---------- */

function limitResult(shared: boolean, last: number): TryResult {
  const blocked = shared && 90000 + last > 100000;
  const lastTxt = last === 20000 ? "₹20,000" : "₹10,000";
  const total = (90000 + last).toLocaleString("en-IN");
  return {
    output: blocked ? `UPI ${lastTxt}: blocked by daily limit` : `UPI ${lastTxt}: sent`,
    note: shared
      ? `One shared total: ₹90,000 + ${lastTxt} = ₹${total} against a ₹1,00,000 cap.`
      : `Each service has its own limit, so UPI sees only ₹60,000. Asha sends ₹${total} today: the cap is bypassed.`,
    actions: [
      { ring: "upi" },
      { members: "limit", lines: ["cap = ₹1,00,000", shared ? "spent(asha) = ₹90,000" : "spent(asha) = ₹60,000"] },
      { call: ["upi", "limit"], label: `send(asha, ${lastTxt})`, result: blocked ? "blocked" : "sent" },
      ...(blocked ? [{ flash: "limit" } as Action] : shared ? [] : [{ flash: "bills" } as Action])
    ]
  };
}

const limit: ExampleAnimation = {
  diagram: {
    label: "build_app creates one DailyLimit and passes it to UpiTransferService and BillPayService; a test passes its own small DailyLimit.",
    width: 760, height: 330, portraitWidth: 340, portraitHeight: 392,
    nodes: [
      { id: "root", kind: "client", name: "build_app", hidden: true,
        at: { x: 16, y: 20, w: 150, h: 54 }, portrait: { x: 95, y: 10, w: 150, h: 54 } },
      { id: "upi", kind: "concrete", name: "UpiTransferService", hidden: true, members: ["- limit: DailyLimit"],
        at: { x: 230, y: 14, w: 210 }, portrait: { x: 8, y: 100, w: 156 } },
      { id: "bills", kind: "concrete", name: "BillPayService", hidden: true, members: ["- limit: DailyLimit"],
        at: { x: 230, y: 180, w: 210 }, portrait: { x: 176, y: 100, w: 156 } },
      { id: "limit", kind: "concrete", name: "DailyLimit", key: true, hidden: true,
        members: ["cap = ₹1,00,000", "spent(asha) = ₹0"],
        at: { x: 520, y: 90, w: 220 }, portrait: { x: 60, y: 200, w: 220 } },
      { id: "test", kind: "client", name: "Test code", hidden: true,
        at: { x: 16, y: 250, w: 150, h: 54 }, portrait: { x: 8, y: 320, w: 130, h: 54 } },
      { id: "tlimit", kind: "concrete", name: "DailyLimit", hidden: true, members: ["cap = ₹500"],
        at: { x: 520, y: 246, w: 220 }, portrait: { x: 176, y: 316, w: 156 } }
    ],
    edges: [
      { id: "r-u", from: "root", to: "upi", type: "dependency", hidden: true },
      { id: "r-b", from: "root", to: "bills", type: "dependency", hidden: true },
      { id: "u-l", from: "upi", to: "limit", type: "association", hidden: true, route: "straight" },
      { id: "b-l", from: "bills", to: "limit", type: "association", hidden: true, route: "straight" },
      { id: "t-t", from: "test", to: "tlimit", type: "dependency", hidden: true }
    ]
  },
  walk: [
    [{ show: ["root"] }, { spawn: ["limit"], from: "root" }, { show: ["upi", "bills"] }, { show: ["r-u", "r-b"] },
      { show: ["u-l", "b-l"] }, { ring: "limit", caption: "one shared total" }],
    [{ call: ["upi", "limit"], label: "send(asha, ₹60,000)", result: "sent" },
      { members: "limit", lines: ["cap = ₹1,00,000", "spent(asha) = ₹60,000"] }],
    [{ call: ["bills", "limit"], label: "pay(BESCOM, ₹30,000)", result: "paid" },
      { members: "limit", lines: ["cap = ₹1,00,000", "spent(asha) = ₹90,000"] }],
    [{ call: ["upi", "limit"], label: "send(asha, ₹20,000)", result: "blocked" }, { flash: "limit" }],
    [{ ring: null }, { show: ["test", "tlimit"] }, { show: ["t-t"] },
      { call: ["test", "tlimit"], label: "send(test-user, ₹600)", result: "blocked by its ₹500 cap" }]
  ],
  tryIt: {
    prompt: "Asha has sent ₹60,000 by UPI and paid a ₹30,000 bill. Choose how the limit is wired and her next UPI transfer.",
    groups: [
      { label: "Limit", options: [{ id: "shared", label: "one shared, injected" }, { id: "separate", label: "one per service" }] },
      { label: "Next UPI transfer", options: [{ id: "t20", label: "₹20,000" }, { id: "t10", label: "₹10,000" }] }
    ],
    results: {
      "shared|t20": limitResult(true, 20000),
      "shared|t10": limitResult(true, 10000),
      "separate|t20": limitResult(false, 20000),
      "separate|t10": limitResult(false, 10000)
    }
  }
};

/* ---------- example 4: feature flags and the test trap ---------- */

function flagResult(extraFirst: boolean, reset: boolean): TryResult {
  const polluted = extraFirst && !reset;
  const order: Action[] = extraFirst
    ? [{ call: ["test1", "flags"], label: "enable(\"extra_time\")" },
      ...(reset ? [{ call: ["test1", "flags"], label: "disable(\"extra_time\")" } as Action] : []),
      { members: "flags", lines: [polluted ? "on: live_proctoring, extra_time" : "on: live_proctoring", "+ enable(name)", "+ is_on(name)"],
        scalaLines: [polluted ? "on: live_proctoring, extra_time" : "on: live_proctoring", "+ enable(name)", "+ isOn(name)"] }]
    : [];
  return {
    output: polluted ? "test_default_exam: + 10 min extra time" : "test_default_exam: normal exam",
    note: polluted
      ? "The first test left extra_time on in the shared object, so the second test fails."
      : extraFirst
        ? "Resetting the flags after each test stops the leak."
        : "It passes only because it ran first. Swap the order and it breaks.",
    actions: [
      { members: "flags", lines: ["on: live_proctoring", "+ enable(name)", "+ is_on(name)"], scalaLines: ["on: live_proctoring", "+ enable(name)", "+ isOn(name)"] },
      ...order,
      { ring: "test2" },
      { call: ["test2", "exam", "flags"], label: "start_exam(\"test-student\")", scalaLabel: "startExam(\"test-student\")",
        result: polluted ? "+ 10 min extra time" : "normal exam" },
      ...(polluted ? [{ flash: "test2" } as Action] : [])
    ]
  };
}

const flags: ExampleAnimation = {
  diagram: {
    label: "start_exam and both tests use the one module-level FeatureFlags object, so a flag set by one test leaks into the next.",
    width: 760, height: 300, portraitWidth: 340, portraitHeight: 370,
    nodes: [
      { id: "flags", kind: "singleton", name: "flags: FeatureFlags", key: true, hidden: true,
        members: ["on: live_proctoring", "+ enable(name)", "+ is_on(name)"],
        scalaMembers: ["on: live_proctoring", "+ enable(name)", "+ isOn(name)"],
        at: { x: 260, y: 20, w: 240 }, portrait: { x: 50, y: 14, w: 240 } },
      { id: "exam", kind: "client", name: "start_exam", hidden: true,
        at: { x: 290, y: 220, w: 180, h: 54 }, portrait: { x: 80, y: 280, w: 180, h: 54 } },
      { id: "test1", kind: "client", name: "test_extra_time", hidden: true,
        at: { x: 16, y: 50, w: 180, h: 54 }, portrait: { x: 8, y: 170, w: 150, h: 54 } },
      { id: "test2", kind: "client", name: "test_default_exam", hidden: true,
        at: { x: 564, y: 220, w: 180, h: 54 }, portrait: { x: 182, y: 170, w: 150, h: 54 } }
    ],
    edges: [
      { id: "e-f", from: "exam", to: "flags", type: "dependency", hidden: true },
      { id: "t1-f", from: "test1", to: "flags", type: "dependency", hidden: true, route: "straight" },
      { id: "t1-e", from: "test1", to: "exam", type: "dependency", hidden: true, route: "straight" },
      { id: "t2-e", from: "test2", to: "exam", type: "dependency", hidden: true, route: "straight" }
    ]
  },
  walk: [
    [{ show: ["flags", "exam"] }, { show: ["e-f"] },
      { call: ["exam", "flags"], label: "start_exam(\"Ravi\")", scalaLabel: "startExam(\"Ravi\")", result: "webcam proctoring" }],
    [{ show: ["test1"] }, { show: ["t1-f", "t1-e"] }, { call: ["test1", "flags"], label: "enable(\"extra_time\")" },
      { members: "flags", lines: ["on: live_proctoring, extra_time", "+ enable(name)", "+ is_on(name)"],
        scalaLines: ["on: live_proctoring, extra_time", "+ enable(name)", "+ isOn(name)"] },
      { mark: "flags", member: 0 }],
    [{ show: ["test2"] }, { show: ["t2-e"] },
      { call: ["test2", "exam", "flags"], label: "start_exam(\"test-student\")", scalaLabel: "startExam(\"test-student\")", result: "+ 10 min extra time" },
      { flash: "test2" }, { shake: "test2", together: true }],
    [{ ring: "flags" }, { pulse: "flags" }, { flash: "test1" }, { flash: "test2", together: true }],
    [{ ring: null }, { mark: "flags", member: null }, { call: ["test1", "flags"], label: "disable(\"extra_time\")" },
      { members: "flags", lines: ["on: live_proctoring", "+ enable(name)", "+ is_on(name)"], scalaLines: ["on: live_proctoring", "+ enable(name)", "+ isOn(name)"] },
      { call: ["test2", "exam", "flags"], label: "start_exam(\"test-student\")", scalaLabel: "startExam(\"test-student\")", result: "normal exam" }]
  ],
  tryIt: {
    prompt: "Choose the order the two tests run in, and whether flags are reset after each test. What does test_default_exam get?",
    groups: [
      { label: "Run first", options: [{ id: "extra", label: "test_extra_time" }, { id: "default", label: "test_default_exam" }] },
      { label: "After each test", options: [{ id: "noreset", label: "no reset" }, { id: "reset", label: "reset flags" }] }
    ],
    results: {
      "extra|noreset": flagResult(true, false),
      "extra|reset": flagResult(true, true),
      "default|noreset": flagResult(false, false),
      "default|reset": flagResult(false, true)
    }
  }
};

const animation: PatternAnimation = {
  slug: "singleton",
  story: storyAnim,
  examples: { awb, metrics, limit, flags },
  sequence: {
    label: "The first AppConfig() call creates the instance under the lock; later calls, including ReportService's, get the same instance back.",
    participants: [
      { id: "demo", name: "Demo code", kind: "client" },
      { id: "cls", name: "AppConfig (class)", kind: "singleton" },
      { id: "inst", name: "config: AppConfig", kind: "singleton" },
      { id: "report", name: ": ReportService", kind: "concrete" }
    ],
    messages: [
      { from: "demo", to: "cls", label: "AppConfig()" },
      { from: "cls", to: "cls", label: "None? lock, check again", kind: "self" },
      { from: "cls", to: "inst", label: "create once", kind: "create" },
      { from: "cls", to: "demo", label: "config", kind: "return" },
      { from: "demo", to: "cls", label: "AppConfig()" },
      { from: "cls", to: "demo", label: "same config (no lock)", kind: "return" },
      { from: "demo", to: "report", label: "header()" },
      { from: "report", to: "cls", label: "AppConfig()" },
      { from: "cls", to: "report", label: "same config", kind: "return" },
      { from: "report", to: "inst", label: "get(\"env\")" },
      { from: "inst", to: "report", label: "\"prod\"", kind: "return" },
      { from: "report", to: "demo", label: "\"Report for prod in ap-south-1\"", kind: "return" }
    ]
  }
};

export default animation;
