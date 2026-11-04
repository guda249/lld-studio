import type { Action, DiagramSpec, ExampleAnimation, PatternAnimation, TryResult } from "../../../anim/types";

/* ---------- story: a document store guarded and lazily created by a proxy ---------- */

const story: DiagramSpec = {
  label: "The client uses the DocumentStore interface; DocumentStoreProxy and RealDocumentStore both implement it, and the proxy creates and holds the real store.",
  width: 930,
  height: 450,
  portraitWidth: 340,
  portraitHeight: 640,
  nodes: [
    { id: "client", kind: "client", name: "Client", members: ["show_document(…)", "export_document(…)"],
      scalaMembers: ["showDocument(…)", "exportDocument(…)"],
      at: { x: 20, y: 190, w: 220 }, portrait: { x: 8, y: 46, w: 220 } },
    { id: "iface", kind: "interface", name: "DocumentStore", key: true, hidden: true,
      members: ["+ read(doc_id): str"], scalaMembers: ["+ read(docId): String"],
      at: { x: 380, y: 30, w: 220 }, portrait: { x: 90, y: 184, w: 220 } },
    { id: "proxy", kind: "concrete", name: "DocumentStoreProxy", key: true, hidden: true,
      members: ["- _role: str", "- _real: RealDocumentStore | None", "+ read(doc_id)"],
      scalaMembers: ["- role: String", "- real: Option[RealDocumentStore]", "+ read(docId)"],
      at: { x: 280, y: 250, w: 270 }, portrait: { x: 30, y: 300, w: 270 } },
    { id: "real", kind: "concrete", name: "RealDocumentStore",
      members: ["connects when created", "+ read(doc_id)"], scalaMembers: ["connects when created", "+ read(docId)"],
      at: { x: 670, y: 250, w: 240, h: 92 }, portrait: { x: 40, y: 478, w: 250, h: 92 } }
  ],
  edges: [
    { id: "direct", from: "client", to: "real", type: "association", label: "calls directly",
      via: [[790, 418], [130, 418]], viaPortrait: [[14, 524], [14, 150]] },
    { id: "uses", from: "client", to: "iface", type: "association", label: "uses", hidden: true, route: "straight" },
    { id: "r-proxy", from: "proxy", to: "iface", type: "realization", hidden: true },
    { id: "r-real", from: "real", to: "iface", type: "realization", hidden: true, viaPortrait: [[322, 221], [322, 524]] },
    { id: "lazy", from: "proxy", to: "real", type: "association", label: "creates lazily", hidden: true,
      viaPortrait: [[20, 524], [20, 351]] }
  ],
  badges: [
    { id: "warn-real", text: "Connects even if unused", tone: "warn", near: "real" },
    { id: "warn-client", text: "Forgot the check: data leak", tone: "warn", near: "client" },
    { id: "ok", text: "RealDocumentStore: 0 lines changed", tone: "ok", near: "real", place: "below" }
  ]
};

const READ = ["client", "iface", "proxy"];

const storyAnim: PatternAnimation["story"] = {
  diagram: story,
  steps: [
    {
      title: "The problem: paid for up front",
      what: "RealDocumentStore connects to slow remote storage the moment it is created, even if nobody ever reads a document.",
      why: "The expensive work happens whether it is needed or not. Every program start pays for it.",
      say: {
        what: "Here's the first problem. The real document store connects to slow remote storage the moment it is created, even if nobody ever reads a document.",
        why: "The expensive work happens whether it is needed or not, so every start pays for it."
      },
      code: "problem",
      lines: { python: [2, 3, 20], scala: [2, 14] },
      actions: [
        { pulse: "real" },
        { tag: "real", text: "connected, unused" },
        { flash: "real" },
        { show: ["warn-real"], together: true }
      ]
    },
    {
      title: "The problem: every caller guards itself",
      what: "Each function that reads documents must copy the role check. export_document forgot it, so a guest reads the contract.",
      why: "The access rule lives in many callers instead of one place. One forgotten copy is a data leak.",
      say: {
        what: "The second problem. Every function that reads documents has to copy the role check. Export document forgot it, so a guest can read the contract.",
        why: "The access rule lives in many callers instead of one place. One forgotten copy is a data leak."
      },
      code: "problem",
      lines: { python: [9, 10, 11, 12, 16, 17, 22], scala: [5, 6, 7, 10, 11, 16] },
      actions: [
        { members: "client", stagger: true,
          lines: ["show_document: checks role", "export_document: no check"],
          scalaLines: ["showDocument: checks role", "exportDocument: no check"] },
        { mark: "client", member: 1 },
        { call: ["client", "real"], label: 'export_document("guest")', scalaLabel: 'exportDocument("guest")', result: '"CONTENTS OF CONTRACT-42"' },
        { flash: "client" },
        { shake: "client", together: true },
        { show: ["warn-client"], together: true }
      ]
    },
    {
      title: "Put an interface in front of the store",
      what: "DocumentStore declares read(doc_id). RealDocumentStore implements it, and the client now depends only on the interface.",
      why: "Anything that implements DocumentStore can now stand in for the real store (Liskov Substitution).",
      say: {
        what: "First, we add an interface called document store, with one read method. The real store implements it, and the client now talks only to the interface.",
        why: "Anything that implements the interface can now stand in for the real store. That's Liskov substitution."
      },
      code: "main",
      lines: { python: [4, 5, 6, 9, 13], scala: [1, 2, 4, 6] },
      actions: [
        { hide: ["warn-real", "warn-client", "direct"] },
        { tag: "real", text: null, together: true },
        { mark: "client", member: null, together: true },
        { members: "client", lines: ["print_document(…)", "knows only the interface"],
          scalaLines: ["printDocument(…)", "knows only the interface"], together: true },
        { show: ["iface"] },
        { show: ["r-real"] },
        { show: ["uses"] }
      ]
    },
    {
      title: "Add a proxy with the same interface",
      what: "DocumentStoreProxy also implements DocumentStore. The role check moves out of the callers into the proxy, which will hold the real store once it exists.",
      why: "The access rule now lives in one place, and RealDocumentStore stays untouched (Single Responsibility, Open/Closed).",
      say: {
        what: "Now we add a document store proxy. It implements the same interface. The role check moves out of the callers and into the proxy, which will hold the real store once it exists.",
        why: "The access rule now lives in one place, and the real store is not touched at all."
      },
      code: "main",
      lines: { python: [17, 18, 20, 21, 22], scala: [8, 9, 10] },
      actions: [
        { spawn: ["proxy"], from: "client" },
        { show: ["r-proxy"] },
        { show: ["lazy"] },
        { pulse: "proxy" }
      ]
    },
    {
      title: "Creating the proxy costs nothing",
      what: "The client creates DocumentStoreProxy(role=\"editor\"). No connection is made yet: the real store does not exist.",
      why: "This is a virtual proxy. The expensive object is created only if it is ever needed.",
      say: {
        what: "The client creates a proxy for an editor. No connection is made yet. The real store does not exist.",
        why: "This is a virtual proxy. The expensive object is created only if it is ever needed."
      },
      code: "main",
      lines: { python: [40, 41], scala: [24, 25] },
      actions: [
        { call: ["client", "proxy"], label: 'DocumentStoreProxy(role="editor")', scalaLabel: 'DocumentStoreProxy("editor")' },
        { members: "proxy", lines: ['- _role = "editor"', "- _real = None", "+ read(doc_id)"],
          scalaLines: ['- role = "editor"', "- real = None", "+ read(docId)"] },
        { mark: "proxy", member: 1 },
        { dim: ["real"], together: true },
        { tag: "real", text: "not created yet" }
      ]
    },
    {
      title: "First read: check, then create",
      what: "read(\"contract-42\") reaches the proxy. The editor passes the role check, so the proxy creates RealDocumentStore now and forwards the call.",
      why: "The client wrote a normal read call. Checking and lazy creation happen behind the interface.",
      say: {
        what: "The client calls read for contract 42. The editor passes the role check, so the proxy creates the real store now, and forwards the call.",
        why: "The client wrote a normal read call. Checking and lazy creation happen behind the interface."
      },
      code: "main",
      lines: { python: [24, 25, 27, 28, 29, 42], scala: [12, 13, 15, 16, 26] },
      actions: [
        { call: READ, label: 'read("contract-42")', scalaLabel: 'read("contract-42")' },
        { ring: "proxy", caption: "role check: editor ok" },
        { show: ["real"] },
        { members: "proxy", lines: ['- _role = "editor"', "- _real = RealDocumentStore", "+ read(doc_id)"],
          scalaLines: ['- role = "editor"', "- real = Some(RealDocumentStore)", "+ read(docId)"] },
        { tag: "real", text: "connected now (1st use)", together: true },
        { pulse: "real" },
        { call: [...READ, "real"], label: 'read("contract-42")', result: '"contents of contract-42"' }
      ]
    },
    {
      title: "Second read reuses the real store",
      what: "read(\"contract-43\") passes the check and goes straight to the RealDocumentStore the proxy already holds.",
      why: "The connection is made once and reused. The proxy manages the real object's life cycle.",
      say: {
        what: "The next read, for contract 43, passes the check and goes straight to the real store the proxy already holds.",
        why: "The connection is made once and then reused. The proxy manages the real object's life."
      },
      code: "main",
      lines: { python: [29, 43], scala: [16, 27] },
      actions: [
        { ring: null },
        { mark: "proxy", member: null, together: true },
        { call: [...READ, "real"], label: 'read("contract-43")', result: '"contents of contract-43"' },
        { tag: "real", text: "reused: still 1 connection" }
      ]
    },
    {
      title: "A guest is stopped at the door",
      what: "A guest's proxy refuses read(\"contract-42\") and raises PermissionError. It never creates a real store, and the client prints \"denied\".",
      why: "No caller can forget the check any more, and RealDocumentStore was never changed (Open/Closed).",
      say: {
        what: "Finally, a guest gets a proxy too. It refuses the read and raises a permission error. It never creates a real store, and the client prints denied.",
        why: "No caller can forget the check any more, and the real store was never changed. That's the open-closed principle."
      },
      code: "main",
      lines: { python: [25, 26, 36, 37, 44], scala: [13, 14, 21, 28] },
      actions: [
        { members: "proxy", lines: ['- _role = "guest"', "- _real = None", "+ read(doc_id)"],
          scalaLines: ['- role = "guest"', "- real = None", "+ read(docId)"] },
        { tag: "real", text: null, together: true },
        { call: READ, label: 'read("contract-42")', result: "denied: guest cannot read" },
        { ring: "proxy", caption: "guest: blocked" },
        { flash: "proxy", together: true },
        { show: ["ok"] },
        { pulse: "real", together: true },
        // back to the class as declared, so the UML class view shows types, not one run's values
        { members: "proxy", lines: ["- _role: str", "- _real: RealDocumentStore | None", "+ read(doc_id)"],
          scalaLines: ["- role: String", "- real: Option[RealDocumentStore]", "+ read(docId)"] }
      ]
    }
  ]
};

/* ---------- real-world examples: client -> proxy -> real, both implementing the subject ---------- */

interface MiniCfg {
  label: string;
  client: string;
  iface: string; ifaceMembers: string[]; ifaceScala?: string[];
  proxy: string; proxyMembers: string[]; proxyScala?: string[];
  real: string; realMembers: string[]; realScala?: string[];
}

/** Landscape: subject on top, proxy and real side by side under it. Portrait: client and subject on one row. */
function miniDiagram(c: MiniCfg): DiagramSpec {
  /** Auto height plus 12 px, so a value tag under the box never covers the last member line. */
  const h = (n: number) => 32 + 20 * n + 10 + 12;
  const hp = h(c.proxyMembers.length);
  const hr = h(c.realMembers.length);
  return {
    label: c.label,
    width: 760, height: 330, portraitWidth: 340, portraitHeight: 320,
    nodes: [
      { id: "client", kind: "client", name: c.client, hidden: true,
        at: { x: 16, y: 40, w: 140, h: 54 }, portrait: { x: 8, y: 20, w: 118, h: 54 } },
      { id: "iface", kind: "interface", name: c.iface, key: true, hidden: true, members: c.ifaceMembers, scalaMembers: c.ifaceScala,
        at: { x: 280, y: 16, w: 230 }, portrait: { x: 138, y: 10, w: 194 } },
      { id: "proxy", kind: "concrete", name: c.proxy, key: true, hidden: true, members: c.proxyMembers, scalaMembers: c.proxyScala,
        at: { x: 170, y: 180, w: 220, h: hp }, portrait: { x: 8, y: 160, w: 150, h: hp } },
      { id: "real", kind: "concrete", name: c.real, hidden: true, members: c.realMembers, scalaMembers: c.realScala,
        at: { x: 480, y: 180, w: 220, h: hr }, portrait: { x: 182, y: 160, w: 150, h: hr } }
    ],
    edges: [
      { id: "r-proxy", from: "proxy", to: "iface", type: "realization", hidden: true },
      { id: "r-real", from: "real", to: "iface", type: "realization", hidden: true },
      { id: "holds", from: "proxy", to: "real", type: "association", hidden: true }
    ]
  };
}

const BUILD: Action[] = [
  { show: ["client", "iface"] },
  { show: ["proxy", "real"] },
  { show: ["r-proxy", "r-real"] },
  { show: ["holds"] }
];
const THROUGH = ["client", "proxy", "real"];
const AT_PROXY = ["client", "proxy"];

/* --- 1. lazy photo gallery (virtual proxy) --- */

const GALLERY_ACTS: Record<string, { label: string; loads: number; shown?: string }> = {
  open: { label: "open album", loads: 0 },
  two: { label: "show() photos 1-2", loads: 2, shown: "[goa_01.jpg 4000x3000]" },
  six: { label: "show() photos 1-6", loads: 6, shown: "[goa_06.jpg 4000x3000]" },
  again: { label: "1-6, then photo 1 again", loads: 6, shown: "[goa_01.jpg 4000x3000]" }
};
const galleryResult = (key: string): TryResult => {
  const [holder, act] = key.split("|");
  const a = GALLERY_ACTS[act];
  if (holder === "real") {
    return {
      output: "40 loaded",
      note: "Without a proxy, every HighResImage downloads in its constructor, so opening the album loads all 40.",
      actions: [
        { ring: "real" },
        { call: ["client", "real"], label: "40 × HighResImage(...)", result: "loads = 40" },
        { tag: "real", text: "loads = 40" }
      ]
    };
  }
  return {
    output: `${a.loads} loaded`,
    note: a.loads === 0
      ? "40 ImageProxy objects hold only a file name. Nothing is downloaded until show() is called."
      : act === "again"
        ? "Photo 1's proxy already holds its HighResImage, so showing it again reuses it: still 6."
        : `Only the ${a.loads} proxies whose show() was called create a HighResImage.`,
    actions: a.loads === 0
      ? [{ members: "proxy", lines: ["- _file", "- _real = None", "+ show()"], scalaLines: ["- file", "- real = None", "+ show()"] },
        { ring: "proxy" }, { call: AT_PROXY, label: "40 × ImageProxy(...)", result: "loads = 0" }, { tag: "real", text: "loads = 0" }]
      : [{ members: "proxy", lines: ["- _file", "- _real = HighRes…", "+ show()"], scalaLines: ["- file", "- real = Some(…)", "+ show()"] },
        { ring: "proxy" }, { call: THROUGH, label: a.label, result: a.shown }, { tag: "real", text: `loads = ${a.loads}` }]
  };
};

const gallery: ExampleAnimation = {
  diagram: miniDiagram({
    label: "Album uses the Image interface; ImageProxy and HighResImage implement it, and each ImageProxy creates its HighResImage on first show.",
    client: "Album", iface: "Image", ifaceMembers: ["+ show(): str"], ifaceScala: ["+ show(): String"],
    proxy: "ImageProxy", proxyMembers: ["- _file", "- _real = None", "+ show()"], proxyScala: ["- file", "- real = None", "+ show()"],
    real: "HighResImage", realMembers: ["loads (class count)", "+ show()"]
  }),
  walk: [
    [...BUILD, { call: AT_PROXY, label: "40 × ImageProxy(...)" }, { tag: "real", text: "loads = 0" }],
    [{ ring: "proxy" }, { call: THROUGH, label: "show() photos 1-2", result: "[goa_01.jpg 4000x3000]" },
      { members: "proxy", lines: ["- _file", "- _real = HighRes…", "+ show()"], scalaLines: ["- file", "- real = Some(…)", "+ show()"] },
      { tag: "real", text: "loads = 2" }],
    [{ call: THROUGH, label: "show() photos 3-6" }, { tag: "real", text: "loads = 6" }, { pulse: "real" }],
    [{ call: AT_PROXY, label: "show() photo 1 again", result: "[goa_01.jpg 4000x3000]" }, { pulse: "proxy" }, { tag: "real", text: "loads = 6 (reused)" }]
  ],
  tryIt: {
    prompt: "Choose what the album holds and how far you scroll. How many full images get loaded?",
    groups: [
      { label: "Album holds", options: [{ id: "proxy", label: "ImageProxy" }, { id: "real", label: "HighResImage (no proxy)" }] },
      { label: "Then", options: [{ id: "open", label: "Just open it" }, { id: "two", label: "Show photos 1-2" }, { id: "six", label: "Scroll photos 1-6" }, { id: "again", label: "1-6, then photo 1 again" }] }
    ],
    results: Object.fromEntries(["proxy", "real"].flatMap((h) => Object.keys(GALLERY_ACTS).map((a) => [`${h}|${a}`, galleryResult(`${h}|${a}`)])))
  }
};

/* --- 2. OTP rate limiter (protection proxy) --- */

const OTP: Record<string, { output: string; sent: number; note: string }> = {
  "w60|t15": { output: "blocked: try after 45s", sent: 3, note: "OTPs at 0, 5 and 10 s are all inside 60 s, so the 4th is blocked until 0 + 60 = 60 s." },
  "w60|t50": { output: "blocked: try after 10s", sent: 3, note: "At 50 s all three earlier OTPs are still inside the 60 s window: wait until 60 s." },
  "w60|t70": { output: "OTP sent to +91-98450-12345", sent: 4, note: "At 70 s the OTPs at 0, 5 and 10 s are 60 s or more old, so they no longer count." },
  "w30|t15": { output: "blocked: try after 15s", sent: 3, note: "All three are inside 30 s, so wait until 0 + 30 = 30 s." },
  "w30|t50": { output: "OTP sent to +91-98450-12345", sent: 4, note: "With a 30 s window, the OTPs at 0, 5 and 10 s have all expired by 50 s." },
  "w30|t70": { output: "OTP sent to +91-98450-12345", sent: 4, note: "Nothing is left in the 30 s window, so the proxy lets the call through." }
};
const otpResult = (key: string): TryResult => {
  const r = OTP[key];
  const t = key.split("|")[1].slice(1);
  const label = `send_otp(phone, ${t})`;
  const scalaLabel = `sendOtp(phone, ${t})`;
  const blocked = r.sent === 3;
  const w = key.slice(1, 3);
  const rule: Action = { members: "proxy", lines: ["- limit = 3", `- window = ${w}`, "+ send_otp(…)"], scalaLines: ["- limit = 3", `- window = ${w}`, "+ sendOtp(…)"] };
  return {
    output: r.output,
    note: `${r.note} Vendor billed for ${r.sent} SMS.`,
    actions: blocked
      ? [rule, { ring: "proxy" }, { call: AT_PROXY, label, scalaLabel, result: r.output }, { flash: "proxy" }, { tag: "real", text: `sent = ${r.sent}` }]
      : [rule, { ring: "real" }, { call: THROUGH, label, scalaLabel, result: "OTP sent" }, { tag: "real", text: `sent = ${r.sent}` }]
  };
};

const otp: ExampleAnimation = {
  diagram: miniDiagram({
    label: "Login uses the SmsGateway interface; RateLimitedSms and VendorSmsGateway implement it, and RateLimitedSms forwards allowed calls to the vendor.",
    client: "Login screen", iface: "SmsGateway", ifaceMembers: ["+ send_otp(phone, now)"], ifaceScala: ["+ sendOtp(phone, now)"],
    proxy: "RateLimitedSms", proxyMembers: ["- limit = 3", "- window = 60", "+ send_otp(…)"], proxyScala: ["- limit = 3", "- window = 60", "+ sendOtp(…)"],
    real: "VendorSmsGateway", realMembers: ["sent = 0", "+ send_otp(…)"], realScala: ["sent = 0", "+ sendOtp(…)"]
  }),
  walk: [
    [...BUILD, { pulse: "proxy" }],
    [{ call: THROUGH, label: "send_otp(phone, 0)", scalaLabel: "sendOtp(phone, 0)", result: "OTP sent" }, { call: THROUGH, label: "at 5 s and 10 s", result: "OTP sent" }, { tag: "real", text: "sent = 3" }],
    [{ ring: "proxy", caption: "4th in 60 s" }, { call: AT_PROXY, label: "send_otp(phone, 15)", scalaLabel: "sendOtp(phone, 15)", result: "blocked: try after 45s" }, { flash: "proxy", together: true }],
    [{ ring: null }, { call: THROUGH, label: "send_otp(phone, 70)", scalaLabel: "sendOtp(phone, 70)", result: "OTP sent" }, { tag: "real", text: "sent = 4" }],
    [{ call: THROUGH, label: "other phone, 20 s", result: "OTP sent" }, { tag: "real", text: "sent = 5 (₹1.00)" }, { pulse: "real" }]
  ],
  tryIt: {
    prompt: "The phone already got OTPs at 0, 5 and 10 seconds. Pick the rule and the time of the next request.",
    groups: [
      { label: "Rule", options: [{ id: "w60", label: "3 per 60 s" }, { id: "w30", label: "3 per 30 s" }] },
      { label: "Next request at", options: [{ id: "t15", label: "15 s" }, { id: "t50", label: "50 s" }, { id: "t70", label: "70 s" }] }
    ],
    results: Object.fromEntries(Object.keys(OTP).map((k) => [k, otpResult(k)]))
  }
};

/* --- 3. flight fare cache (caching proxy) --- */

const FARES: Record<string, { fare: string; hit: boolean; calls: number }> = {
  "ttl60|s30": { fare: "₹5,400", hit: true, calls: 1 },
  "ttl60|s90": { fare: "₹5,400", hit: false, calls: 2 },
  "ttl60|s400": { fare: "₹5,500", hit: false, calls: 2 },
  "ttl120|s30": { fare: "₹5,400", hit: true, calls: 1 },
  "ttl120|s90": { fare: "₹5,400", hit: true, calls: 1 },
  "ttl120|s400": { fare: "₹5,500", hit: false, calls: 2 },
  "ttl600|s30": { fare: "₹5,400", hit: true, calls: 1 },
  "ttl600|s90": { fare: "₹5,400", hit: true, calls: 1 },
  "ttl600|s400": { fare: "₹5,400", hit: true, calls: 1 }
};
const fareResult = (key: string): TryResult => {
  const r = FARES[key];
  const [ttl, s] = key.split("|").map((p) => p.replace(/\D/g, ""));
  const label = `fare("BLR-DEL", ${s})`;
  const stale = key === "ttl600|s400";
  return {
    output: `${r.fare} ${r.hit ? "from the cache" : "from the API"}`,
    note: r.hit
      ? `${s} s is less than the ${ttl} s TTL, so the cached fare from 0 s is returned.${stale ? " Stale: the airline now charges ₹5,500." : ""} ${r.calls} paid API call.`
      : `${s} s is past the ${ttl} s TTL, so the proxy asks the API again. ${r.calls} paid API calls.`,
    actions: r.hit
      ? [{ tag: "proxy", text: null }, { ring: "proxy", caption: stale ? "stale!" : "cache hit" }, { call: AT_PROXY, label, result: r.fare }, { tag: "real", text: `calls = ${r.calls}` }]
      : [{ tag: "proxy", text: null }, { ring: "real", caption: "cache expired" }, { call: THROUGH, label, result: r.fare }, { tag: "real", text: `calls = ${r.calls}` }]
  };
};

const fares: ExampleAnimation = {
  diagram: miniDiagram({
    label: "Search uses the FareService interface; CachedFareService and AirlineFareApi implement it, and the cache calls the API only on a miss.",
    client: "Search page", iface: "FareService", ifaceMembers: ["+ fare(route, now): int"], ifaceScala: ["+ fare(route, now): Int"],
    proxy: "CachedFareService", proxyMembers: ["- ttl = 120", "- _cache: dict", "+ fare(…)"], proxyScala: ["- ttl = 120", "- cache: Map", "+ fare(…)"],
    real: "AirlineFareApi", realMembers: ["calls = 0", "+ fare(…)"]
  }),
  walk: [
    [...BUILD, { call: THROUGH, label: 'fare("BLR-DEL", 0)', result: "₹5,400" }, { tag: "real", text: "calls = 1" }],
    [{ ring: "proxy", caption: "cache hit" }, { call: AT_PROXY, label: "BLR-DEL at 30 s", result: "₹5,400" }, { call: AT_PROXY, label: "BLR-DEL at 90 s", result: "₹5,400" }],
    [{ ring: null }, { call: THROUGH, label: 'fare("BOM-GOI", 45)', result: "₹2,900" }, { tag: "real", text: "calls = 2" }],
    [{ ring: "real", caption: "cache expired" }, { call: THROUGH, label: 'fare("BLR-DEL", 400)', result: "₹5,500" }, { tag: "real", text: "calls = 3" }],
    [{ ring: null }, { pulse: "proxy" }, { tag: "proxy", text: "5 searches" }, { tag: "real", text: "3 paid calls", together: true }]
  ],
  tryIt: {
    prompt: "BLR-DEL was fetched at 0 s for ₹5,400. Pick the TTL and when the next BLR-DEL search comes.",
    groups: [
      { label: "TTL", options: [{ id: "ttl60", label: "60 s" }, { id: "ttl120", label: "120 s" }, { id: "ttl600", label: "600 s" }] },
      { label: "Next search at", options: [{ id: "s30", label: "30 s" }, { id: "s90", label: "90 s" }, { id: "s400", label: "400 s" }] }
    ],
    results: Object.fromEntries(Object.keys(FARES).map((k) => [k, fareResult(k)]))
  }
};

/* --- 4. remote thermostat (remote proxy) --- */

const thermoResult = (key: string): TryResult => {
  const [t, then] = key.split("|");
  const c = t.slice(1);
  if (then === "reply") {
    return {
      output: `target ${c}°C`,
      note: `The proxy sends "SET:${c}" over the wire; the device sets its target and replies.`,
      actions: [{ tag: "proxy", text: null }, { ring: "real" }, { call: THROUGH, label: `set_target(${c}) → SET:${c}`, scalaLabel: `setTarget(${c}) → SET:${c}`, result: `target ${c}°C` },
        { members: "real", lines: [`- _target = ${c}`, "+ set_target(c)", "+ reading()"], scalaLines: [`- target = ${c}`, "+ setTarget(c)", "+ reading()"] }]
    };
  }
  return {
    output: `room 29°C, target ${c}°C`,
    note: `Two messages: "SET:${c}", then "GET". The reading shows the new target.`,
    actions: [{ tag: "proxy", text: null }, { ring: "real" }, { call: THROUGH, label: `set_target(${c}) → SET:${c}`, scalaLabel: `setTarget(${c}) → SET:${c}` },
      { members: "real", lines: [`- _target = ${c}`, "+ set_target(c)", "+ reading()"], scalaLines: [`- target = ${c}`, "+ setTarget(c)", "+ reading()"] },
      { call: THROUGH, label: "reading() → GET", result: `room 29°C, target ${c}°C` }]
  };
};

const thermostat: ExampleAnimation = {
  diagram: {
    ...miniDiagram({
      label: "Dashboard uses the Thermostat interface; ThermostatProxy and DeviceThermostat implement it, and the proxy sends text messages over the network to the device.",
      client: "Dashboard", iface: "Thermostat", ifaceMembers: ["+ set_target(celsius)", "+ reading()"], ifaceScala: ["+ setTarget(celsius)", "+ reading()"],
      proxy: "ThermostatProxy", proxyMembers: ["- _send(message)", "+ set_target(c)", "+ reading()"], proxyScala: ["- send(message)", "+ setTarget(c)", "+ reading()"],
      real: "DeviceThermostat", realMembers: ["- _target = 26", "+ set_target(c)", "+ reading()"], realScala: ["- target = 26", "+ setTarget(c)", "+ reading()"]
    })
  },
  walk: [
    [...BUILD, { tag: "proxy", text: "over the network" }, { pulse: "real" }],
    [{ ring: "real", caption: "another building" }, { call: THROUGH, label: "reading() → GET", result: "room 29°C, target 26°C" }],
    [{ call: THROUGH, label: "set_target(22) → SET:22", scalaLabel: "setTarget(22) → SET:22", result: "target 22°C" },
      { members: "real", lines: ["- _target = 22", "+ set_target(c)", "+ reading()"], scalaLines: ["- target = 22", "+ setTarget(c)", "+ reading()"] }],
    [{ call: THROUGH, label: "reading() → GET", result: "room 29°C, target 22°C" }, { mark: "real", member: 0 }]
  ],
  tryIt: {
    prompt: "Pick a target temperature and what the dashboard does next. What comes back over the wire?",
    groups: [
      { label: "Set target to", options: [{ id: "c18", label: "18°C" }, { id: "c22", label: "22°C" }, { id: "c25", label: "25°C" }] },
      { label: "Then", options: [{ id: "reply", label: "Show set_target's reply" }, { id: "read", label: "Call reading()" }] }
    ],
    results: Object.fromEntries(["c18", "c22", "c25"].flatMap((c) => ["reply", "read"].map((t) => [`${c}|${t}`, thermoResult(`${c}|${t}`)])))
  }
};

const animation: PatternAnimation = {
  slug: "proxy",
  story: storyAnim,
  examples: { gallery, otp, fares, thermostat },
  sequence: {
    label: "The client reads through an editor's proxy, which checks the role, creates the real store on first use and forwards the call; a guest's proxy refuses without creating anything.",
    participants: [
      { id: "client", name: "print_document", kind: "client" },
      { id: "editor", name: "editor: DocumentStoreProxy", kind: "concrete" },
      { id: "real", name: ": RealDocumentStore", kind: "concrete" },
      { id: "guest", name: "guest: DocumentStoreProxy", kind: "concrete" }
    ],
    messages: [
      { from: "client", to: "editor", label: 'read("contract-42")' },
      { from: "editor", to: "editor", label: "role check: editor ok", kind: "self" },
      { from: "editor", to: "real", label: "RealDocumentStore()", kind: "create" },
      { from: "editor", to: "real", label: 'read("contract-42")' },
      { from: "real", to: "editor", label: '"contents of contract-42"', kind: "return" },
      { from: "editor", to: "client", label: '"contents of contract-42"', kind: "return" },
      { from: "client", to: "editor", label: 'read("contract-43")' },
      { from: "editor", to: "real", label: 'read("contract-43")' },
      { from: "real", to: "editor", label: '"contents of contract-43"', kind: "return" },
      { from: "editor", to: "client", label: '"contents of contract-43"', kind: "return" },
      { from: "client", to: "guest", label: 'read("contract-42")' },
      { from: "guest", to: "client", label: "PermissionError", kind: "return" }
    ]
  }
};

export default animation;
