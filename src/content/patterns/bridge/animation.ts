import type { Action, DiagramSpec, DNode, ExampleAnimation, PatternAnimation, TryResult } from "../../../anim/types";

/* ---------- story: reports (what) bridged to renderers (how) ---------- */

const story: DiagramSpec = {
  label: "Report holds a Renderer (the bridge); SalesReport and InventoryReport extend Report; CsvRenderer, MarkdownRenderer and PdfRenderer implement Renderer; App is the client.",
  width: 930,
  height: 470,
  portraitWidth: 340,
  portraitHeight: 690,
  nodes: [
    { id: "naive", kind: "concrete", name: "Report classes (inheritance)", members: [],
      at: { x: 310, y: 56, w: 300 }, portrait: { x: 40, y: 46, w: 260 } },
    { id: "app", kind: "client", name: "App", hidden: true,
      at: { x: 16, y: 210, w: 110, h: 56 }, portrait: { x: 8, y: 205, w: 90, h: 56 } },
    { id: "report", kind: "abstract", name: "Report", key: true, hidden: true,
      members: ["- renderer: Renderer", "+ generate()"],
      at: { x: 150, y: 200, w: 240 }, portrait: { x: 116, y: 186, w: 216 } },
    { id: "renderer", kind: "interface", name: "Renderer", key: true, hidden: true,
      members: ["+ render(title, rows)"],
      at: { x: 560, y: 200, w: 250 }, portrait: { x: 50, y: 410, w: 220 } },
    { id: "sales", kind: "concrete", name: "SalesReport", hidden: true, members: ["+ generate()"],
      at: { x: 60, y: 360, w: 150 }, portrait: { x: 8, y: 304, w: 130 } },
    { id: "inventory", kind: "concrete", name: "InventoryReport", hidden: true, members: ["+ generate()"],
      at: { x: 222, y: 360, w: 170 }, portrait: { x: 146, y: 304, w: 132 } },
    { id: "csv", kind: "concrete", name: "CsvRenderer", hidden: true, members: ["+ render(…)"],
      at: { x: 470, y: 360, w: 130 }, portrait: { x: 8, y: 510, w: 156 } },
    { id: "md", kind: "concrete", name: "MarkdownRenderer", hidden: true, members: ["+ render(…)"],
      at: { x: 612, y: 360, w: 160 }, portrait: { x: 176, y: 510, w: 156 } },
    { id: "pdf", kind: "concrete", name: "PdfRenderer", hidden: true, members: ["+ render(…)"],
      at: { x: 784, y: 360, w: 130 }, portrait: { x: 92, y: 596, w: 156 } }
  ],
  edges: [
    { id: "bridge", from: "report", to: "renderer", type: "association", label: "bridge", hidden: true,
      viaPortrait: [[294, 447]] },
    { id: "i-sales", from: "sales", to: "report", type: "inheritance", hidden: true },
    { id: "i-inv", from: "inventory", to: "report", type: "inheritance", hidden: true },
    { id: "r-csv", from: "csv", to: "renderer", type: "realization", hidden: true },
    { id: "r-md", from: "md", to: "renderer", type: "realization", hidden: true },
    { id: "r-pdf", from: "pdf", to: "renderer", type: "realization", hidden: true }
  ],
  badges: [
    { id: "warn", text: "2 × 2 = 4 classes; PDF adds 2 more", tone: "warn", near: "naive" },
    { id: "ok", text: "PDF: 1 new class, 0 edits", tone: "ok", near: "renderer" }
  ]
};

const storyAnim: PatternAnimation["story"] = {
  diagram: story,
  steps: [
    {
      title: "The problem: one class for every report-and-format pair",
      what: "Each report is subclassed once per format: SalesCsvReport, SalesMarkdownReport, InventoryCsvReport, InventoryMarkdownReport. The CSV and Markdown code is copied into each.",
      why: "Two things vary in one hierarchy, so classes multiply: M reports × N formats. Adding PDF means one more class for every report.",
      say: {
        what: "Here's the problem. Every report is subclassed once per format: sales as CSV, sales as Markdown, inventory as CSV, inventory as Markdown. The formatting code is copied into each one.",
        why: "Two things vary inside one hierarchy, so the classes multiply. Reports times formats. Adding PDF means one more class for every report."
      },
      code: "problem",
      lines: { python: [5, 7, 10, 16, 18, 21], scala: [4, 5, 7, 11, 12, 14] },
      actions: [
        { members: "naive", stagger: true,
          lines: ["SalesCsvReport", "SalesMarkdownReport", "InventoryCsvReport", "InventoryMarkdownReport"] },
        { flash: "naive" },
        { shake: "naive", together: true },
        { show: ["warn"], together: true }
      ]
    },
    {
      title: "Split “what” from “how”",
      what: "The four classes mix two questions: which report, and which format. Report keeps the “what”, and a separate Renderer interface takes the “how”.",
      why: "Each side now has one reason to change (Single Responsibility): report content in one place, output format in another.",
      say: {
        what: "Those four classes mix two questions: which report, and which format. So we split them. Report keeps the what, and a separate renderer interface takes the how.",
        why: "Each side now has just one reason to change. That's single responsibility."
      },
      code: "main",
      lines: { python: [6, 7, 8, 22, 23, 27], scala: [3, 4, 15, 16] },
      actions: [
        { hide: ["warn"] },
        { dim: ["naive"], together: true },
        { spawn: ["report", "renderer"], from: "naive" },
        { hide: ["naive"] }
      ]
    },
    {
      title: "Two small hierarchies grow side by side",
      what: "SalesReport and InventoryReport extend Report. CsvRenderer and MarkdownRenderer implement Renderer. Each format's code now exists exactly once.",
      why: "Instead of M × N classes you write M + N. A new report or a new format is one class on its own side.",
      say: {
        what: "Now two small hierarchies grow side by side. Sales report and inventory report extend report. The CSV and Markdown renderers implement renderer. Each format's code now exists exactly once.",
        why: "Instead of reports times formats, you write reports plus formats. A new report, or a new format, is just one class on its own side."
      },
      code: "main",
      lines: { python: [11, 16, 30, 35], scala: [6, 10, 18, 21] },
      actions: [
        { spawn: ["sales", "inventory"], from: "report" },
        { show: ["i-sales", "i-inv"] },
        { spawn: ["csv", "md"], from: "renderer" },
        { show: ["r-csv", "r-md"] }
      ]
    },
    {
      title: "Build the bridge: Report holds a Renderer",
      what: "Report gets a renderer field, passed in through its constructor. That one reference joins the two hierarchies.",
      why: "Report depends on the Renderer interface, never on CSV or Markdown code (Dependency Inversion). Composition replaces inheritance.",
      say: {
        what: "Now we build the bridge. Report gets a renderer field, passed in through its constructor. That one reference joins the two hierarchies.",
        why: "Report depends on the renderer interface, never on CSV or Markdown code. That's dependency inversion: composition instead of inheritance."
      },
      code: "main",
      lines: { python: [23, 24], scala: [15] },
      actions: [
        { show: ["bridge"] },
        { mark: "report", member: 0 },
        { pulse: "report", together: true }
      ]
    },
    {
      title: "The client picks any pair",
      what: "App creates SalesReport(MarkdownRenderer()). The pair is chosen when the object is built, not baked into a class name.",
      why: "Any report works with any renderer, so the combinations come for free.",
      say: {
        what: "The app picks a pair: a sales report with a Markdown renderer. The pair is chosen when the object is built, not baked into a class name.",
        why: "Any report works with any renderer, so every combination comes for free."
      },
      code: "main",
      lines: { python: [40], scala: [25] },
      actions: [
        { mark: "report", member: null },
        { show: ["app"] },
        { call: ["app", "sales"], label: "SalesReport(MarkdownRenderer())" },
        { ring: "md", caption: "its renderer" },
        { pulse: "md", together: true }
      ]
    },
    {
      title: "generate() crosses the bridge",
      what: "SalesReport decides the title and rows, then calls render() on its renderer. MarkdownRenderer formats them and the text comes back to App.",
      why: "The report never knows the output format. It only knows the Renderer interface.",
      say: {
        what: "When the app calls generate, the sales report picks the title and rows, then asks its renderer to render them. The Markdown renderer formats the table, and the text comes back.",
        why: "The report never knows the output format. It only knows the renderer interface."
      },
      code: "main",
      lines: { python: [17, 18, 19, 32, 40], scala: [11, 12, 13, 19, 25] },
      actions: [
        { call: ["app", "sales", "renderer", "md"], label: "generate()", result: '"## Sales | Mon | 1200.0 |…"' }
      ]
    },
    {
      title: "Other report, other format, same code",
      what: "InventoryReport(CsvRenderer()).generate() takes the same route through the bridge and comes back as CSV lines.",
      why: "Both sides vary independently: no class was written for this particular pair.",
      say: {
        what: "Now an inventory report with a CSV renderer. The call takes the same route through the bridge, and comes back as CSV lines.",
        why: "Both sides vary independently. No class was written for this particular pair."
      },
      code: "main",
      lines: { python: [12, 13, 37, 41], scala: [7, 8, 22, 26] },
      actions: [
        { ring: "csv", caption: "its renderer" },
        { call: ["app", "inventory", "renderer", "csv"], label: "generate()", result: '"# Inventory, Pens,40.0, …"' }
      ]
    },
    {
      title: "Add PDF: one class, nothing else edited",
      what: "PdfRenderer implements Renderer and works at once with SalesReport and InventoryReport.",
      why: "One new class instead of one per report. Reports: 0 lines changed (Open/Closed).",
      say: {
        what: "Finally we add a PDF renderer. It implements the renderer interface, and works at once with both reports.",
        why: "One new class, instead of one per report. And the reports? Zero lines changed. That's the open-closed principle."
      },
      code: "main",
      lines: { python: [6, 7, 8], scala: [3, 4] },
      actions: [
        { ring: null },
        { show: ["pdf"] },
        { show: ["r-pdf"] },
        { show: ["ok"] },
        { pulse: "report", together: true }
      ]
    }
  ]
};

/* ---------- real-world examples: client -> refined abstractions -> abstraction --bridge--> implementation <- impls ---------- */

interface Side { name: string; members: string[]; scalaMembers?: string[]; stereotype?: string }
interface BridgeCfg {
  label: string;
  client: string;
  abs: Side;
  refined: [string, string];
  refinedMembers: string[];
  refinedScala?: string[];
  iface: Side;
  impls: Side[];
}

const hOf = (stereo: boolean, lines: number) => (stereo ? 44 : 32) + (lines ? lines * 20 + 10 : 0);

function bridgeMini(c: BridgeCfg): DiagramSpec {
  const absH = hOf(true, c.abs.members.length);
  const ifH = hOf(c.iface.stereotype !== "", c.iface.members.length);
  const implH = Math.max(...c.impls.map((s) => hOf(!!s.stereotype, s.members.length)));
  const refH = hOf(false, c.refinedMembers.length);
  // landscape
  const rowY = Math.max(180, 20 + Math.max(absH, ifH) + 46);
  const implX = c.impls.length === 3 ? [{ x: 410, w: 108 }, { x: 528, w: 108 }, { x: 646, w: 108 }] : [{ x: 440, w: 150 }, { x: 604, w: 150 }];
  const height = rowY + Math.max(refH, implH) + 34;
  // portrait
  const pRef = 10 + absH + 24;
  const pIf = pRef + refH + 24;
  const pImpl = pIf + ifH + 28;
  const pImpl2 = pImpl + implH + 24;
  const pBoxes = [{ x: 8, y: pImpl, w: 156 }, { x: 176, y: pImpl, w: 156 }, { x: 92, y: pImpl2, w: 156 }];
  const pHeight = (c.impls.length === 3 ? pImpl2 : pImpl) + implH + 34;
  const nodes: DNode[] = [
    { id: "client", kind: "client", name: c.client, hidden: true, at: { x: 16, y: 34, w: 130, h: 54 }, portrait: { x: 8, y: 14, w: 110, h: 54 } },
    { id: "abs", kind: "abstract", name: c.abs.name, key: true, hidden: true, members: c.abs.members, scalaMembers: c.abs.scalaMembers,
      at: { x: 170, y: 20, w: 230 }, portrait: { x: 130, y: 10, w: 202 } },
    ...c.refined.map((name, i): DNode => ({
      id: "r" + i, kind: "concrete", name, hidden: true, members: c.refinedMembers, scalaMembers: c.refinedScala,
      at: { x: 40 + 182 * i, y: rowY, w: 165 }, portrait: { x: 8 + 150 * i, y: pRef, w: 138 }
    })),
    { id: "iface", kind: "interface", name: c.iface.name, key: true, hidden: true, stereotype: c.iface.stereotype,
      members: c.iface.members, scalaMembers: c.iface.scalaMembers,
      at: { x: 450, y: 20, w: 290 }, portrait: { x: 8, y: pIf, w: 290 } },
    ...c.impls.map((s, i): DNode => ({
      id: "i" + i, kind: "concrete", name: s.name, hidden: true, stereotype: s.stereotype, members: s.members, scalaMembers: s.scalaMembers,
      at: { x: implX[i].x, y: rowY, w: implX[i].w }, portrait: pBoxes[i]
    }))
  ];
  return {
    label: c.label, width: 760, height, portraitWidth: 340, portraitHeight: pHeight, nodes,
    edges: [
      { id: "bridge", from: "abs", to: "iface", type: "association", hidden: true, viaPortrait: [[318, pIf + ifH / 2]] },
      { id: "e-r0", from: "r0", to: "abs", type: "inheritance", hidden: true },
      { id: "e-r1", from: "r1", to: "abs", type: "inheritance", hidden: true },
      ...c.impls.map((_, i) => ({ id: "e-i" + i, from: "i" + i, to: "iface", type: "realization" as const, hidden: true }))
    ]
  };
}

const build = (impls: number): Action[] => {
  const ids = Array.from({ length: impls }, (_, i) => "i" + i);
  return [
    { show: ["client", "abs"] },
    { show: ["r0", "r1"] },
    { show: ["e-r0", "e-r1"] },
    { show: ["iface"] },
    { show: ["bridge"] },
    { show: ids },
    { show: ids.map((id) => "e-" + id) }
  ];
};
const via = (r: number, i: number) => ["client", "r" + r, "iface", "i" + i];

/* --- 1. bank notifications --- */

const NOTE_OUT: Record<string, [string, string]> = {
  "alert|sms": ["SMS to +919900112233: ₹4,999 spent…", "Full text: SMS to +919900112233: ₹4,999 spent at Croma, Pune. Not you? Call 1800-123-456"],
  "alert|email": ["Email [Debit alert] Dear Meera, ₹4,999…", "Email to meera@example.com [Debit alert] Dear Meera, ₹4,999 spent at Croma, Pune. Not you? Call 1800-123-456"],
  "alert|push": ["Push to Meera's phone: Debit alert", "Push shows only the subject; the body is ignored."],
  "stmt|sms": ["SMS to +919900112233: your statement…", "SMS to +919900112233 with the body only; SMS ignores the subject."],
  "stmt|email": ["Email [October statement] Dear Meera, …", "Email to meera@example.com [October statement] Dear Meera, your statement is ready to download."],
  "stmt|push": ["Push to Meera's phone: October statement", "Push shows only the subject the notice wrote."]
};
const notifyResult = (key: string): TryResult => {
  const [msg, ch] = key.split("|");
  const r = msg === "alert" ? 0 : 1, i = { sms: 0, email: 1, push: 2 }[ch]!;
  return {
    output: NOTE_OUT[key][0], note: NOTE_OUT[key][1],
    actions: [{ ring: "i" + i }, { call: via(r, i), label: "send(meera)", result: NOTE_OUT[key][0] }]
  };
};

const notify: ExampleAnimation = {
  diagram: bridgeMini({
    label: "Notification holds a Channel (the bridge); TransactionAlert and StatementReady extend Notification; SmsChannel, EmailChannel and PushChannel implement Channel.",
    client: "Bank app",
    abs: { name: "Notification", members: ["- channel: Channel", "+ send(customer)"] },
    refined: ["TransactionAlert", "StatementReady"], refinedMembers: ["+ send(customer)"],
    iface: { name: "Channel", members: ["+ deliver(customer, subject, body)"] },
    impls: [
      { name: "SmsChannel", members: ["+ deliver(…)"] },
      { name: "EmailChannel", members: ["+ deliver(…)"] },
      { name: "PushChannel", members: ["+ deliver(…)"] }
    ]
  }),
  walk: [
    [...build(3), { tag: "client", text: "₹4,999 at Croma" }],
    [{ ring: "i0" }, { call: via(0, 0), label: "send(meera)", result: "SMS to +919900112233: ₹4,999 spent…" }],
    [{ ring: "i2" }, { call: via(0, 2), label: "send(meera)", result: "Push to Meera's phone: Debit alert" }],
    [{ ring: "i1" }, { call: via(1, 1), label: "send(meera)", result: "Email [October statement] Dear Meera, …" }],
    [{ ring: null }, { tag: "client", text: "2 × 3 = 6 pairs" },
      { pulse: "r0" }, { pulse: "r1", together: true }, { pulse: "i0" }, { pulse: "i1", together: true }, { pulse: "i2", together: true }]
  ],
  tryIt: {
    prompt: "Pick a message and a channel. What does Meera receive?",
    groups: [
      { label: "Message", options: [{ id: "alert", label: "TransactionAlert" }, { id: "stmt", label: "StatementReady" }] },
      { label: "Channel", options: [{ id: "sms", label: "SMS" }, { id: "email", label: "Email" }, { id: "push", label: "Push" }] }
    ],
    results: Object.fromEntries(Object.keys(NOTE_OUT).map((k) => [k, notifyResult(k)]))
  }
};

/* --- 2. switches and smart bulbs --- */

const LIGHT_OUT: Record<string, [string, string]> = {
  "toggle|wifi": ["0% → HTTP PUT 192.168.1.20/level=0", "Toggle goes 100% then back to 0%; the Wi-Fi bulb sends an HTTP command."],
  "toggle|zigbee": ["0% → Zigbee frame 0x1A2B:00", "Toggle goes 100% then 0%; the Zigbee bulb sends 0 as hex 00."],
  "dimmer|wifi": ["70% → HTTP PUT 192.168.1.20/level=70", "Dimmer steps 30% then 70%; the Wi-Fi bulb sends an HTTP command."],
  "dimmer|zigbee": ["70% → Zigbee frame 0x1A2B:B2", "Dimmer steps 30% then 70%; 70 × 255 ÷ 100 = 178 = hex B2."]
};
const lvl = (r: number, level: number, together = false): Action => ({
  members: "r" + r, lines: ["+ next_level()", `level = ${level}`], scalaLines: ["+ nextLevel()", `level = ${level}`], together
});
const lightResult = (key: string): TryResult => {
  const [sw, bulb] = key.split("|");
  const r = sw === "toggle" ? 0 : 1, i = bulb === "wifi" ? 0 : 1;
  return {
    output: LIGHT_OUT[key][0], note: LIGHT_OUT[key][1],
    actions: [
      { ring: "i" + i },
      lvl(0, 0), lvl(1, 0, true),
      { call: via(r, i), label: "press() twice", result: LIGHT_OUT[key][0] },
      lvl(r, sw === "toggle" ? 0 : 70)
    ]
  };
};

const lights: ExampleAnimation = {
  diagram: bridgeMini({
    label: "Switch holds a Bulb (the bridge); ToggleSwitch and DimmerSwitch extend Switch; WifiBulb and ZigbeeBulb implement Bulb.",
    client: "Smart-home app",
    abs: { name: "Switch", members: ["- bulb: Bulb", "- level: int", "+ press()"], scalaMembers: ["- bulb: Bulb", "- level: Int", "+ press()"] },
    refined: ["ToggleSwitch", "DimmerSwitch"], refinedMembers: ["+ next_level()", "level = 0"], refinedScala: ["+ nextLevel()", "level = 0"],
    iface: { name: "Bulb", members: ["+ set_level(percent)"], scalaMembers: ["+ setLevel(percent)"] },
    impls: [
      { name: "WifiBulb", members: ["+ set_level(…)"], scalaMembers: ["+ setLevel(…)"] },
      { name: "ZigbeeBulb", members: ["+ set_level(…)"], scalaMembers: ["+ setLevel(…)"] }
    ]
  }),
  walk: [
    [...build(2), { ring: "i0" },
      { call: via(0, 0), label: "press()", result: "HTTP PUT 192.168.1.20/level=100" }, lvl(0, 100),
      { call: via(0, 0), label: "press()", result: "HTTP PUT 192.168.1.20/level=0" },
      lvl(0, 0)],
    [{ ring: "i1" }, { call: via(1, 1), label: "press() × 3", result: "30%, 70%, 100%" }, lvl(1, 100)],
    [{ mark: "i1", member: 0 },
      { call: ["r1", "iface", "i1"], label: "set_level(30)", scalaLabel: "setLevel(30)", result: "Zigbee frame 0x1A2B:4C" }],
    [{ mark: "i1", member: null }, { call: ["client", "r1"], label: "bedroom.bulb = WifiBulb(…)" }, { ring: "i0" }, { pulse: "i0" }],
    [{ call: via(1, 0), label: "press()", result: "HTTP PUT 192.168.1.31/level=0" }, lvl(1, 0), { pulse: "r1" }]
  ],
  tryIt: {
    prompt: "Pick a switch and a bulb, then press twice. What reaches the bulb on the second press?",
    groups: [
      { label: "Switch", options: [{ id: "toggle", label: "ToggleSwitch" }, { id: "dimmer", label: "DimmerSwitch" }] },
      { label: "Bulb", options: [{ id: "wifi", label: "WifiBulb" }, { id: "zigbee", label: "ZigbeeBulb" }] }
    ],
    results: Object.fromEntries(Object.keys(LIGHT_OUT).map((k) => [k, lightResult(k)]))
  }
};

/* --- 3. sprites on two back-ends --- */

const RENDER_OUT: Record<string, [string, string]> = {
  "player|debug": ["rect (10,40) 10x20 blue + circle (15,34)", "Two lines: \"rect   (10,40) 10x20 blue\" and \"circle (15,34) r=6 tan\"."],
  "player|svg": ["<rect …/> + <circle …/>", "<rect x=\"10\" y=\"40\" width=\"10\" height=\"20\" fill=\"blue\"/> and <circle cx=\"15\" cy=\"34\" r=\"6\" fill=\"tan\"/>"],
  "coin|debug": ["circle (60,50) r=4 gold", "One line: the coin is a single small circle."],
  "coin|svg": ["<circle cx=\"60\" cy=\"50\" r=\"4\" …/>", "<circle cx=\"60\" cy=\"50\" r=\"4\" fill=\"gold\"/>"]
};
const renderResult = (key: string): TryResult => {
  const [sp, rn] = key.split("|");
  const r = sp === "player" ? 0 : 1, i = rn === "debug" ? 0 : 1;
  return {
    output: RENDER_OUT[key][0], note: RENDER_OUT[key][1],
    actions: [{ ring: "i" + i }, { call: via(r, i), label: "draw()", result: RENDER_OUT[key][0] }]
  };
};

const render: ExampleAnimation = {
  diagram: bridgeMini({
    label: "Sprite holds a Renderer (the bridge); Player and Coin extend Sprite; DebugTextRenderer and SvgRenderer implement Renderer's circle and rect.",
    client: "Game demo",
    abs: { name: "Sprite", members: ["- renderer: Renderer", "+ draw()"] },
    refined: ["Player", "Coin"], refinedMembers: ["+ draw()"],
    iface: { name: "Renderer", members: ["+ circle(x, y, r, colour)", "+ rect(x, y, w, h, colour)"] },
    impls: [
      { name: "DebugTextRenderer", members: ["+ circle(…)", "+ rect(…)"] },
      { name: "SvgRenderer", members: ["+ circle(…)", "+ rect(…)"] }
    ]
  }),
  walk: [
    [...build(2), { pulse: "i0" }, { pulse: "i1" }],
    [{ ring: "i0" }, { call: ["client", "r0"], label: "Player(renderer, 10, 40)" }, { call: ["client", "r1"], label: "Coin(renderer, 60, 50)" },
      { mark: "abs", member: 0 }],
    [{ mark: "abs", member: null },
      { call: via(0, 0), label: "rect(10, 40, 10, 20, blue)", result: "rect   (10,40) 10x20 blue" },
      { call: via(0, 0), label: "circle(15, 34, 6, tan)", result: "circle (15,34) r=6 tan" }],
    [{ call: via(1, 0), label: "circle(60, 50, 4, gold)", result: "circle (60,50) r=4 gold" }],
    [{ ring: "i1" }, { call: via(0, 1), label: "draw()", result: "<rect …/> + <circle …/>" },
      { call: via(1, 1), label: "draw()", result: "<circle cx=\"60\" cy=\"50\" r=\"4\" …/>" }]
  ],
  tryIt: {
    prompt: "Pick a sprite and a back-end. What does draw() produce?",
    groups: [
      { label: "Sprite", options: [{ id: "player", label: "Player" }, { id: "coin", label: "Coin" }] },
      { label: "Renderer", options: [{ id: "debug", label: "DebugTextRenderer" }, { id: "svg", label: "SvgRenderer" }] }
    ],
    results: Object.fromEntries(Object.keys(RENDER_OUT).map((k) => [k, renderResult(k)]))
  }
};

/* --- 4. loggers and sinks --- */

const logResult = (key: string): TryResult => {
  const map: Record<string, { out: string; note: string; actions: Action[] }> = {
    "app|console": { out: "nothing printed", note: "AppLogger drops DEBUG before the sink is ever called.",
      actions: [{ ring: "r0" }, { call: ["client", "r0"], label: 'log("DEBUG", "cache warmed")', result: "filtered out" }, { flash: "r0" }] },
    "app|buffer": { out: "buffer stays empty: []", note: "Same filter, different sink: the line never reaches the buffer.",
      actions: [{ ring: "r0" }, { call: ["client", "r0"], label: 'log("DEBUG", "cache warmed")', result: "filtered out" }, { flash: "r0" }] },
    "audit|console": { out: "AUDIT user=ops DEBUG cache warmed", note: "Printed as \"  console | AUDIT user=ops DEBUG cache warmed\". Audits are never filtered.",
      actions: [{ ring: "i0" }, { call: via(1, 0), label: 'log("DEBUG", "cache warmed")', result: "AUDIT user=ops DEBUG cache warmed" }] },
    "audit|buffer": { out: "[AUDIT user=ops DEBUG cache warmed]", note: "The buffer now holds one line.",
      actions: [{ ring: "i1" }, { call: via(1, 1), label: 'log("DEBUG", "cache warmed")', result: "1 line in the buffer" }] }
  };
  const m = map[key];
  return { output: m.out, note: m.note, actions: m.actions };
};

const logging: ExampleAnimation = {
  diagram: bridgeMini({
    label: "Logger holds a Sink function (the bridge); AppLogger and AuditLogger extend Logger; the console sink and the audit buffer's append are sinks.",
    client: "Service",
    abs: { name: "Logger", members: ["- sink: Sink", "+ log(level, message)"] },
    refined: ["AppLogger", "AuditLogger"], refinedMembers: ["+ log(level, msg)"],
    iface: { name: "Sink", stereotype: "«function type»", members: ["(line: str) -> None"], scalaMembers: ["String => Unit"] },
    impls: [
      { name: "console sink", stereotype: "«function»", members: ["print(line)"], scalaMembers: ["println(line)"] },
      { name: "audit buffer", stereotype: "«function»", members: ["audit_buffer.append"], scalaMembers: ["auditBuffer += line"] }
    ]
  }),
  walk: [
    [...build(2), { ring: "i0" },
      { call: ["client", "r0"], label: 'log("DEBUG", …)', result: "dropped" },
      { call: via(0, 0), label: 'log("INFO", …)', result: "INFO  server started on port 8080" },
      { call: via(0, 0), label: 'log("ERROR", …)', result: "ERROR payment service timed out" }],
    [{ ring: "i1" }, { call: ["client", "r1"], label: "AuditLogger(audit_buffer.append)", scalaLabel: "AuditLogger(line => auditBuffer += line)" }],
    [{ call: via(1, 1), label: 'log("INFO", …)', result: "AUDIT … INFO changed refund limit" },
      { call: via(1, 1), label: 'log("DEBUG", …)', result: "AUDIT … DEBUG viewed customer 1042" }],
    [{ members: "i1", lines: ["holds 2 lines"] }, { pulse: "i1" }],
    [{ members: "i1", lines: ["audit_buffer.append"], scalaLines: ["auditBuffer += line"] }, { ring: "i0" },
      { call: via(1, 0), label: 'log("INFO", "rotated API keys")', result: "AUDIT user=ops INFO rotated API keys" }]
  ],
  tryIt: {
    prompt: "Log the DEBUG line \"cache warmed\". Pick the logger and where its lines go. What comes out?",
    groups: [
      { label: "Logger", options: [{ id: "app", label: "AppLogger" }, { id: "audit", label: "AuditLogger (ops)" }] },
      { label: "Sink", options: [{ id: "console", label: "console sink" }, { id: "buffer", label: "in-memory buffer" }] }
    ],
    results: Object.fromEntries(["app|console", "app|buffer", "audit|console", "audit|buffer"].map((k) => [k, logResult(k)]))
  }
};

const animation: PatternAnimation = {
  slug: "bridge",
  story: storyAnim,
  examples: { notify, lights, render, logging },
  sequence: {
    label: "App builds a SalesReport with a MarkdownRenderer and calls generate, which calls render on the renderer; then the same happens for InventoryReport with CsvRenderer.",
    participants: [
      { id: "app", name: "App", kind: "client" },
      { id: "sales", name: ": SalesReport", kind: "concrete" },
      { id: "md", name: ": MarkdownRenderer", kind: "concrete" },
      { id: "inv", name: ": InventoryReport", kind: "concrete" },
      { id: "csv", name: ": CsvRenderer", kind: "concrete" }
    ],
    messages: [
      { from: "app", to: "sales", label: "SalesReport(…)", kind: "create" },
      { from: "app", to: "sales", label: "generate()" },
      { from: "sales", to: "md", label: 'render("Sales", rows)' },
      { from: "md", to: "sales", label: '"## Sales …"', kind: "return" },
      { from: "sales", to: "app", label: '"## Sales …"', kind: "return" },
      { from: "app", to: "inv", label: "InventoryReport(…)", kind: "create" },
      { from: "app", to: "inv", label: "generate()" },
      { from: "inv", to: "csv", label: 'render("Inventory", rows)' },
      { from: "csv", to: "inv", label: '"# Inventory …"', kind: "return" },
      { from: "inv", to: "app", label: '"# Inventory …"', kind: "return" }
    ]
  }
};

export default animation;
