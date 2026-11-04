import type { Action, DiagramSpec, ExampleAnimation, PatternAnimation, TryResult } from "../../../anim/types";

/* ---------- story: order notifications, one creator subclass per channel ---------- */

const story: DiagramSpec = {
  label: "Abstract Notifier declares the factory method create_message and uses the Message interface; EmailNotifier, SmsNotifier and PushNotifier override it to return EmailMessage, SmsMessage and PushMessage.",
  width: 900,
  height: 440,
  portraitWidth: 340,
  portraitHeight: 700,
  nodes: [
    { id: "client", kind: "client", name: "Demo code", at: { x: 16, y: 20, w: 120, h: 52 }, portrait: { x: 8, y: 8, w: 100, h: 50 } },
    { id: "order", kind: "concrete", name: "OrderNotifier", members: [],
      at: { x: 16, y: 100, w: 196 }, portrait: { x: 120, y: 8, w: 212 } },
    { id: "notifier", kind: "abstract", name: "Notifier", key: true, hidden: true,
      members: ["+ create_message(): Message", "+ send(text): str"],
      scalaMembers: ["+ createMessage(): Message", "+ send(text): String"],
      at: { x: 230, y: 20, w: 250 }, portrait: { x: 40, y: 128, w: 260 } },
    { id: "message", kind: "interface", name: "Message", key: true, hidden: true,
      members: ["+ deliver(text): str"], scalaMembers: ["+ deliver(text): String"],
      at: { x: 640, y: 20, w: 200 }, portrait: { x: 75, y: 432, w: 190 } },
    { id: "emailN", kind: "concrete", name: "EmailNotifier", hidden: true,
      members: ["+ create_message()"], scalaMembers: ["+ createMessage()"],
      at: { x: 16, y: 330, w: 142 }, portrait: { x: 22, y: 250, w: 150 } },
    { id: "smsN", kind: "concrete", name: "SmsNotifier", hidden: true,
      members: ["+ create_message()"], scalaMembers: ["+ createMessage()"],
      at: { x: 170, y: 330, w: 142 }, portrait: { x: 184, y: 250, w: 148 } },
    { id: "pushN", kind: "concrete", name: "PushNotifier", hidden: true,
      members: ["+ create_message()"], scalaMembers: ["+ createMessage()"],
      at: { x: 324, y: 330, w: 142 }, portrait: { x: 103, y: 330, w: 150 } },
    { id: "emailM", kind: "concrete", name: "EmailMessage", members: ["+ deliver(text)"],
      at: { x: 490, y: 330, w: 122 }, portrait: { x: 22, y: 534, w: 150 } },
    { id: "smsM", kind: "concrete", name: "SmsMessage", members: ["+ deliver(text)"],
      at: { x: 624, y: 330, w: 122 }, portrait: { x: 184, y: 534, w: 148 } },
    { id: "pushM", kind: "concrete", name: "PushMessage", hidden: true, members: ["+ deliver(text)"],
      at: { x: 758, y: 330, w: 122 }, portrait: { x: 103, y: 614, w: 150 } }
  ],
  edges: [
    { id: "uses", from: "notifier", to: "message", type: "association", hidden: true, route: "straight",
      viaPortrait: [[11, 469], [11, 175]] },
    { id: "i-email", from: "emailN", to: "notifier", type: "inheritance", hidden: true },
    { id: "i-sms", from: "smsN", to: "notifier", type: "inheritance", hidden: true },
    { id: "i-push", from: "pushN", to: "notifier", type: "inheritance", hidden: true },
    { id: "r-email", from: "emailM", to: "message", type: "realization", hidden: true },
    { id: "r-sms", from: "smsM", to: "message", type: "realization", hidden: true },
    { id: "r-push", from: "pushM", to: "message", type: "realization", hidden: true }
  ],
  badges: [
    { id: "warn", text: "Edited for every new channel", tone: "warn", near: "order", place: "below" },
    { id: "ok", text: "Notifier: 0 lines changed", tone: "ok", near: "pushN", place: "below" }
  ]
};

const storyAnim: PatternAnimation["story"] = {
  diagram: story,
  steps: [
    {
      title: "The problem: send() creates every message itself",
      what: "OrderNotifier.send() picks EmailMessage or SmsMessage with if/elif, then sends it. A push notification falls into the else branch and fails.",
      why: "Creating objects and using them are tangled in one method, so every new channel means editing it again (breaks Open/Closed).",
      say: {
        what: "Here's the problem. The order notifier's send method chooses between an email message and an S M S message with an if-else chain, and then sends it. Ask for a push notification and it fails.",
        why: "Creating objects and using them are tangled together in one method. Every new channel means editing it again. That breaks the open-closed principle."
      },
      code: "problem",
      lines: { python: [14, 15, 16, 17, 19, 20], scala: [10, 11, 12, 13, 14] },
      actions: [
        { members: "order", stagger: true,
          lines: ['"email" → EmailMessage()', '"sms" → SmsMessage()', "else → raise error"],
          scalaLines: ['"email" → EmailMessage()', '"sms" → SmsMessage()', "other → throw error"] },
        { call: ["client", "order", "emailM"], label: 'send("email", text)', result: '"Email: …"' },
        { call: ["client", "order"], label: 'send("push", text)', result: "error: unknown channel" },
        { flash: "order" },
        { shake: "order", together: true },
        { show: ["warn"], together: true }
      ]
    },
    {
      title: "Give the products one interface",
      what: "EmailMessage and SmsMessage both implement Message.deliver(text). Code that sends a message will only ever talk to Message.",
      why: "The sending code can depend on an abstraction instead of on concrete classes (Dependency Inversion).",
      say: {
        what: "First, email message and S M S message both implement one interface, called message, with a deliver method. The sending code will only ever talk to this interface.",
        why: "So the sending code depends on an abstraction, not on concrete classes. That's dependency inversion."
      },
      code: "main",
      lines: { python: [4, 5, 6, 9, 14], scala: [1, 2, 4, 7] },
      actions: [
        { hide: ["warn"] },
        { show: ["message"] },
        { show: ["r-email", "r-sms"] },
        { pulse: "message" }
      ]
    },
    {
      title: "Move creation into a factory method",
      what: "The abstract Notifier declares create_message(), the factory method. Its send() calls that method and delivers whatever comes back through Message.",
      why: "Creation now lives in one overridable place, apart from the business logic (Single Responsibility).",
      say: {
        what: "Next, an abstract notifier class declares a create message method. This is the factory method. Its send method calls it, and delivers whatever comes back, through the message interface.",
        why: "Creating the object now lives in one overridable place, apart from the business logic. That's single responsibility."
      },
      code: "main",
      lines: { python: [19, 20, 21, 24, 25, 26], scala: [10, 11, 13, 14, 15] },
      actions: [
        { dim: ["order"] },
        { show: ["notifier"] },
        { show: ["uses"] },
        { mark: "notifier", member: 0 }
      ]
    },
    {
      title: "Each subclass decides which product to make",
      what: "EmailNotifier and SmsNotifier extend Notifier and override only create_message(). The old OrderNotifier and its if/elif are gone.",
      why: "The choice of concrete class is pushed down to subclasses. The base class knows when to create, the subclass knows which.",
      say: {
        what: "Now, an email notifier and an S M S notifier extend the notifier, and override only the create message method. The old order notifier, with its if-else chain, is gone.",
        why: "The choice of concrete class moves down into the subclasses. The base class knows when to create something. The subclass knows which thing to create."
      },
      code: "main",
      lines: { python: [29, 30, 31, 34, 35, 36], scala: [17, 18, 20, 21] },
      actions: [
        { mark: "notifier", member: null },
        { cross: "order" },
        { hide: ["order", "order__x"] },
        { spawn: ["emailN", "smsN"], from: "notifier" },
        { show: ["i-email", "i-sms"] }
      ]
    },
    {
      title: "send() asks the subclass for a message",
      what: "The demo calls send() on an EmailNotifier. The inherited send() calls create_message(), and EmailNotifier answers with a new EmailMessage.",
      why: "The client picked a creator, never a product. Which object gets made is decided in one overridden method.",
      say: {
        what: "The demo calls send on an email notifier. The inherited send method calls create message, and the email notifier answers with a brand new email message.",
        why: "The client picked a creator, never a product. Which object gets made is decided in one overridden method."
      },
      code: "main",
      lines: { python: [25, 30, 31, 39, 40], scala: [14, 18, 24, 25] },
      actions: [
        { ring: "emailN", caption: "chosen creator" },
        { call: ["client", "emailN"], label: 'send("Your order has shipped")' },
        { call: ["emailN", "emailM"], label: "create_message()", scalaLabel: "createMessage()", result: "EmailMessage" },
        { pulse: "emailM" },
        { tag: "emailM", text: "new instance" }
      ]
    },
    {
      title: "Use the product through its interface",
      what: "send() calls deliver(text) on the Message it got back. The call lands in EmailMessage and the result returns to the demo.",
      why: "send() is the same code for every channel. It never names EmailMessage, so it never has to change.",
      say: {
        what: "Send then calls deliver on the message it got back. The call lands in the email message, and the result returns to the demo.",
        why: "Send is the same code for every channel. It never names email message, so it never has to change."
      },
      code: "main",
      lines: { python: [26, 10, 11], scala: [15, 5] },
      actions: [
        { call: ["notifier", "message", "emailM"], label: "deliver(text)", result: '"Email: Your order has shipped"',
          back: ["emailM", "message", "notifier", "client"] },
        { tag: "emailM", text: null }
      ]
    },
    {
      title: "Same send(), different creator",
      what: "The loop moves on to SmsNotifier. The same send() runs, but create_message() now returns an SmsMessage.",
      why: "Swapping the creator swaps the product, with no if/elif anywhere.",
      say: {
        what: "The loop moves on to the S M S notifier. The same send method runs, but create message now returns an S M S message.",
        why: "Swapping the creator swaps the product, with no if-else anywhere."
      },
      code: "main",
      lines: { python: [35, 36, 39, 40], scala: [21, 24, 25] },
      actions: [
        { ring: "smsN", caption: "chosen creator" },
        { call: ["client", "smsN"], label: 'send("Your order has shipped")' },
        { call: ["smsN", "smsM"], label: "create_message()", scalaLabel: "createMessage()", result: "SmsMessage" },
        { call: ["notifier", "message", "smsM"], label: "deliver(text)", result: '"SMS: Your order has shipped"',
          back: ["smsM", "message", "notifier", "client"] }
      ]
    },
    {
      title: "Add push notifications without touching send()",
      what: "PushMessage implements Message and PushNotifier overrides create_message() to return it. Two new classes, and that is all.",
      why: "Notifier: 0 lines changed. A new channel is added, not edited in (Open/Closed).",
      say: {
        what: "Finally, push notifications. A push message implements the message interface, and a push notifier overrides create message to return it. Two new classes, and that's all.",
        why: "And the notifier? Zero lines changed. A new channel is added, not edited in. That's the open-closed principle."
      },
      code: "main",
      lines: { python: [24, 25, 26], scala: [13, 14, 15] },
      actions: [
        { ring: null },
        { show: ["pushM"] },
        { show: ["r-push"] },
        { show: ["pushN"] },
        { show: ["i-push"] },
        { show: ["ok"] },
        { pulse: "notifier", together: true }
      ]
    }
  ]
};

/* ---------- real-world examples: creator + subclasses on the left, product + concrete products on the right ---------- */

interface Cls { name: string; members: string[]; scala?: string[] }
interface MiniCfg {
  label: string;
  client: string;
  creator: Cls & { kind: "abstract" | "concrete" };
  product: Cls & { kind: "interface" | "abstract" };
  creators: Cls[];
  products: [Cls, Cls];
}

const height = (kind: string, lines: number) => (kind === "concrete" ? 32 : 44) + lines * 20 + 10;

/** Landscape: creator hierarchy left, product hierarchy right. Portrait: the two hierarchies stacked, the "uses" line in the right gutter. */
function miniDiagram(c: MiniCfg): DiagramSpec {
  const cH = height(c.creator.kind, c.creator.members.length);
  const pH = height(c.product.kind, c.product.members.length);
  const childY = 14 + Math.max(cH, pH) + 70;
  const pCreatorY = 70 + cH + 26;
  const pProductY = pCreatorY + 62 + 28;
  const pPChildY = pProductY + pH + 26;
  const one = c.creators.length === 1;
  const creatorAt = one
    ? [{ x: 216, w: 160 }]
    : [{ x: 130, w: 160 }, { x: 302, w: 160 }];
  const creatorPortrait = one ? [{ x: 95, w: 150 }] : [{ x: 8, w: 154 }, { x: 174, w: 154 }];
  return {
    label: c.label,
    width: 780,
    height: childY + 62 + 34,
    portraitWidth: 340,
    portraitHeight: pPChildY + 62 + 32,
    nodes: [
      { id: "client", kind: "client", name: c.client, hidden: true, at: { x: 12, y: 22, w: 128, h: 52 }, portrait: { x: 8, y: 8, w: 170, h: 48 } },
      { id: "creator", kind: c.creator.kind, name: c.creator.name, key: true, hidden: true,
        members: c.creator.members, scalaMembers: c.creator.scala,
        at: { x: 160, y: 14, w: 272 }, portrait: { x: 20, y: 70, w: 300 } },
      { id: "product", kind: c.product.kind, name: c.product.name, key: true, hidden: true,
        members: c.product.members, scalaMembers: c.product.scala,
        at: { x: 517, y: 14, w: 220 }, portrait: { x: 55, y: pProductY, w: 230 } },
      ...c.creators.map((k, i) => ({
        id: "cC" + i, kind: "concrete" as const, name: k.name, hidden: true, members: k.members, scalaMembers: k.scala,
        at: { x: creatorAt[i].x, y: childY, w: creatorAt[i].w }, portrait: { x: creatorPortrait[i].x, y: pCreatorY, w: creatorPortrait[i].w }
      })),
      ...c.products.map((k, i) => ({
        id: "pC" + i, kind: "concrete" as const, name: k.name, hidden: true, members: k.members, scalaMembers: k.scala,
        at: { x: 486 + 147 * i, y: childY, w: 135 }, portrait: { x: 8 + 162 * i, y: pPChildY, w: 150 }
      }))
    ],
    edges: [
      { id: "uses", from: "creator", to: "product", type: "association", hidden: true, route: "straight",
        viaPortrait: [[334, pProductY + pH / 2], [334, 70 + cH / 2]] },
      ...c.creators.map((_, i) => ({ id: "i-cC" + i, from: "cC" + i, to: "creator", type: "inheritance" as const, hidden: true })),
      ...c.products.map((_, i) => ({
        id: "r-pC" + i, from: "pC" + i, to: "product",
        type: (c.product.kind === "interface" ? "realization" : "inheritance") as "realization" | "inheritance", hidden: true
      }))
    ]
  };
}

const build = (creators: number): Action[] => [
  { show: ["client", "creator"] },
  { show: ["product"] },
  { show: ["uses"] },
  { show: [...Array.from({ length: creators }, (_, i) => "cC" + i), "pC0", "pC1"] },
  { show: [...Array.from({ length: creators }, (_, i) => "i-cC" + i), "r-pC0", "r-pC1"] }
];

/* ----- 1. report export ----- */

const exportEx: ExampleAnimation = {
  diagram: miniDiagram({
    label: "Abstract ReportExporter declares create_formatter and uses Formatter; CsvExporter and JsonExporter return CsvFormatter and JsonFormatter.",
    client: "Dashboard",
    creator: { name: "ReportExporter", kind: "abstract",
      members: ["+ create_formatter(): Formatter", "+ export_report(name, sales)"],
      scala: ["+ createFormatter(): Formatter", "+ exportReport(name, sales)"] },
    product: { name: "Formatter", kind: "interface", members: ["+ format(sales): str"], scala: ["+ format(sales): String"] },
    creators: [
      { name: "CsvExporter", members: ["+ create_formatter()"], scala: ["+ createFormatter()"] },
      { name: "JsonExporter", members: ["+ create_formatter()"], scala: ["+ createFormatter()"] }
    ],
    products: [{ name: "CsvFormatter", members: ["+ format(sales)"] }, { name: "JsonFormatter", members: ["+ format(sales)"] }]
  }),
  walk: [
    [...build(2), { tag: "client", text: "2 rows" }],
    [
      { ring: "cC0" },
      { call: ["client", "cC0"], label: 'export_report("daily-sales")', scalaLabel: 'exportReport("daily-sales")' },
      { call: ["cC0", "pC0"], label: "create_formatter()", scalaLabel: "createFormatter()", result: "CsvFormatter" },
      { pulse: "pC0" }
    ],
    [
      { call: ["creator", "product", "pC0"], label: "format(sales)", result: "== daily-sales.csv (2 rows) ==",
        back: ["pC0", "product", "creator", "client"] },
      { tag: "pC0", text: "3 CSV lines" }
    ],
    [
      { tag: "pC0", text: null },
      { ring: "cC1" },
      { call: ["client", "cC1"], label: 'export_report("daily-sales")', scalaLabel: 'exportReport("daily-sales")' },
      { call: ["cC1", "pC1"], label: "create_formatter()", scalaLabel: "createFormatter()", result: "JsonFormatter" },
      { call: ["creator", "product", "pC1"], label: "format(sales)", result: "== daily-sales.json (2 rows) ==",
        back: ["pC1", "product", "creator", "client"] }
    ],
    [
      { tag: "client", text: "no rows" },
      { ring: "cC0" },
      { call: ["client", "cC0", "creator"], label: 'export_report("empty-day", [])', scalaLabel: 'exportReport("empty-day", Nil)',
        result: '"empty-day: nothing to export"', back: ["creator", "client"] },
      { pulse: "creator" }
    ]
  ],
  tryIt: {
    prompt: "Pick an exporter and a day. Which formatter gets created, and what comes back?",
    groups: [
      { label: "Exporter", options: [{ id: "csv", label: "CsvExporter" }, { id: "json", label: "JsonExporter" }] },
      { label: "Day", options: [{ id: "rows", label: "2 sales rows" }, { id: "empty", label: "Empty day" }] }
    ],
    results: {
      "csv|rows": {
        output: "== daily-sales.csv (2 rows) ==",
        note: "create_formatter() returns CsvFormatter: city,orders / Pune,120 / Jaipur,85",
        actions: [{ ring: "cC0" }, { call: ["client", "cC0", "pC0"], label: "export_report(...)", scalaLabel: "exportReport(...)", result: "== daily-sales.csv (2 rows) ==" }]
      },
      "json|rows": {
        output: "== daily-sales.json (2 rows) ==",
        note: "create_formatter() returns JsonFormatter: [{\"city\": \"Pune\", \"orders\": 120}, …]",
        actions: [{ ring: "cC1" }, { call: ["client", "cC1", "pC1"], label: "export_report(...)", scalaLabel: "exportReport(...)", result: "== daily-sales.json (2 rows) ==" }]
      },
      "csv|empty": {
        output: "empty-day: nothing to export",
        note: "export_report() returns early, so no formatter is ever created.",
        actions: [{ ring: "cC0" }, { call: ["client", "cC0", "creator"], label: "export_report(..., [])", scalaLabel: "exportReport(..., Nil)", result: "nothing to export" }]
      },
      "json|empty": {
        output: "empty-day: nothing to export",
        note: "Same shared check in the base class, so the JSON formatter is never created either.",
        actions: [{ ring: "cC1" }, { call: ["client", "cC1", "creator"], label: "export_report(..., [])", scalaLabel: "exportReport(..., Nil)", result: "nothing to export" }]
      }
    }
  }
};

/* ----- 2. checkout gateway ----- */

const gw = (who: "creator" | "cC0", amount: number, out: string, note: string): TryResult => {
  const product = who === "creator" ? "pC0" : "pC1";
  return {
    output: out,
    note,
    actions: amount === 0
      ? [{ ring: who }, { call: ["client", who], label: `pay(₹${amount})`, result: out }, { flash: who }]
      : [{ ring: who }, { call: ["client", who, product], label: `pay(₹${amount})`, result: out }]
  };
};

const checkout: ExampleAnimation = {
  diagram: miniDiagram({
    label: "Checkout's factory method create_gateway returns UpiGateway by default; CardCheckout overrides it to return CardGateway. Both implement PaymentGateway.",
    client: "Store",
    creator: { name: "Checkout", kind: "concrete",
      members: ["+ create_gateway(): PaymentGateway", "+ pay(order_id, amount)"],
      scala: ["+ createGateway(): PaymentGateway", "+ pay(orderId, amount)"] },
    product: { name: "PaymentGateway", kind: "interface", members: ["+ charge(amount): str"], scala: ["+ charge(amount): String"] },
    creators: [{ name: "CardCheckout", members: ["+ create_gateway()"], scala: ["+ createGateway()"] }],
    products: [{ name: "UpiGateway", members: ["+ charge(amount)"] }, { name: "CardGateway", members: ["+ charge(amount)"] }]
  }),
  walk: [
    [
      ...build(1),
      { ring: "creator" },
      { call: ["client", "creator"], label: 'pay("ORD-101", 499)', scalaLabel: 'pay("ORD-101", 499)' },
      { mark: "creator", member: 0 }
    ],
    [
      { call: ["creator", "pC0"], label: "create_gateway()", scalaLabel: "createGateway()", result: "UpiGateway" },
      { mark: "creator", member: null },
      { call: ["creator", "product", "pC0"], label: "charge(499)", result: "UPI collect request for ₹499.00 sent" }
    ],
    [
      { ring: "cC0" },
      { call: ["client", "cC0"], label: 'pay("ORD-102", 1200)' },
      { call: ["cC0", "pC1"], label: "create_gateway()", scalaLabel: "createGateway()", result: "CardGateway" },
      { pulse: "pC1" }
    ],
    [
      { call: ["creator", "product", "pC1"], label: "charge(1200)", result: "card charged ₹1224.00 (incl. 2% fee)" },
      { tag: "pC1", text: "1200 + 2% = 1224" }
    ],
    [
      { tag: "pC1", text: null },
      { ring: "creator" },
      { call: ["client", "creator"], label: 'pay("ORD-103", 0)', result: '"ORD-103: invalid amount"' },
      { flash: "creator" }
    ]
  ],
  tryIt: {
    prompt: "Pick a checkout class and an amount. Which gateway does the factory method create?",
    groups: [
      { label: "Checkout", options: [{ id: "default", label: "Checkout" }, { id: "card", label: "CardCheckout" }] },
      { label: "Amount", options: [{ id: "499", label: "₹499" }, { id: "1200", label: "₹1200" }, { id: "0", label: "₹0" }] }
    ],
    results: {
      "default|499": gw("creator", 499, "UPI collect request for ₹499.00 sent", "Default factory method: UpiGateway, no fee."),
      "default|1200": gw("creator", 1200, "UPI collect request for ₹1200.00 sent", "Default factory method: UpiGateway, no fee."),
      "default|0": gw("creator", 0, "invalid amount", "pay() rejects it before create_gateway() is called."),
      "card|499": gw("cC0", 499, "card charged ₹508.98 (incl. 2% fee)", "CardGateway: 499 + 2% (9.98) = 508.98"),
      "card|1200": gw("cC0", 1200, "card charged ₹1224.00 (incl. 2% fee)", "CardGateway: 1200 + 2% (24) = 1224"),
      "card|0": gw("cC0", 0, "invalid amount", "The inherited pay() rejects it before any gateway is created.")
    }
  }
};

/* ----- 3. enemy waves ----- */

const wave = (lvl: 0 | 1, w: number): TryResult => {
  const hp = lvl === 0 ? 40 + 10 * w : 30 + 15 * w;
  const name = lvl === 0 ? "Wolf" : "Scorpion";
  const out = `${w + 1} x ${name} (${hp} HP) ${lvl === 0 ? "bites" : "stings"}`;
  return {
    output: out,
    note: `count = wave + 1 = ${w + 1}; ${name} HP = ${lvl === 0 ? `40 + 10 × ${w}` : `30 + 15 × ${w}`} = ${hp}`,
    actions: [
      { ring: "cC" + lvl },
      { call: ["client", "cC" + lvl], label: `spawn_wave(${w})`, scalaLabel: `spawnWave(${w})` },
      { call: ["cC" + lvl, "pC" + lvl], label: `create_enemy(${w}) × ${w + 1}`, scalaLabel: `createEnemy(${w}) × ${w + 1}`, result: out }
    ]
  };
};

const enemy: ExampleAnimation = {
  diagram: miniDiagram({
    label: "Abstract Level declares create_enemy and uses Enemy; ForestLevel returns Wolf and DesertLevel returns Scorpion.",
    client: "Game loop",
    creator: { name: "Level", kind: "abstract",
      members: ["+ create_enemy(wave): Enemy", "+ spawn_wave(wave): list"],
      scala: ["+ createEnemy(wave): Enemy", "+ spawnWave(wave): List"] },
    product: { name: "Enemy", kind: "abstract", members: ["+ health: int", "+ attack(): str"], scala: ["+ health: Int", "+ attack(): String"] },
    creators: [
      { name: "ForestLevel", members: ["+ create_enemy(wave)"], scala: ["+ createEnemy(wave)"] },
      { name: "DesertLevel", members: ["+ create_enemy(wave)"], scala: ["+ createEnemy(wave)"] }
    ],
    products: [{ name: "Wolf", members: ["+ attack()"] }, { name: "Scorpion", members: ["+ attack()"] }]
  }),
  walk: [
    [
      ...build(2),
      { ring: "cC0" },
      { call: ["client", "cC0"], label: "spawn_wave(1)", scalaLabel: "spawnWave(1)" },
      { tag: "creator", text: "count = 2" }
    ],
    [
      { call: ["cC0", "pC0"], label: "create_enemy(1) × 2", scalaLabel: "createEnemy(1) × 2", result: "Wolf (50 HP)" },
      { tag: "pC0", text: "2 × 50 HP" }
    ],
    [
      { call: ["client", "cC0"], label: "spawn_wave(2)", scalaLabel: "spawnWave(2)" },
      { tag: "creator", text: "count = 3" },
      { call: ["cC0", "pC0"], label: "create_enemy(2) × 3", scalaLabel: "createEnemy(2) × 3", result: "Wolf (60 HP)" },
      { tag: "pC0", text: "3 × 60 HP" }
    ],
    [
      { ring: "cC1" },
      { call: ["client", "cC1"], label: "spawn_wave(1)", scalaLabel: "spawnWave(1)" },
      { tag: "creator", text: "count = 2" },
      { call: ["cC1", "pC1"], label: "create_enemy(1) × 2", scalaLabel: "createEnemy(1) × 2", result: "Scorpion (45 HP)" },
      { tag: "pC1", text: "2 × 45 HP" }
    ],
    [
      { ring: null },
      { tag: "creator", text: null },
      { tag: "client", text: "total = 10" },
      { pulse: "client" }
    ]
  ],
  tryIt: {
    prompt: "Pick a level and a wave. What does spawn_wave() create?",
    groups: [
      { label: "Level", options: [{ id: "forest", label: "ForestLevel" }, { id: "desert", label: "DesertLevel" }] },
      { label: "Wave", options: [{ id: "1", label: "Wave 1" }, { id: "2", label: "Wave 2" }, { id: "3", label: "Wave 3" }] }
    ],
    results: {
      "forest|1": wave(0, 1), "forest|2": wave(0, 2), "forest|3": wave(0, 3),
      "desert|1": wave(1, 1), "desert|2": wave(1, 2), "desert|3": wave(1, 3)
    }
  }
};

/* ----- 4. fake for tests ----- */

const fakeRun = (t: number): TryResult => {
  const out = `Nagpur: ${t}°C, ${t >= 35 ? "carry water" : "enjoy the day"}`;
  return {
    output: out,
    note: `The fake reports ${t}°C; ${t >= 35 ? "35 or more" : "below 35"} → "${t >= 35 ? "carry water" : "enjoy the day"}".`,
    actions: [
      { ring: "cC0" },
      { tag: "pC1", text: `temp_c = ${t}` },
      { call: ["client", "cC0", "pC1"], label: 'advice("Nagpur")', result: out }
    ]
  };
};

const testing: ExampleAnimation = {
  diagram: miniDiagram({
    label: "WeatherService's factory method create_client returns RealHttpClient; the test subclass FakeWeatherService overrides it to return a FakeHttpClient.",
    client: "Unit test",
    creator: { name: "WeatherService", kind: "concrete",
      members: ["+ create_client(): HttpClient", "+ advice(city): str"],
      scala: ["+ createClient(): HttpClient", "+ advice(city): String"] },
    product: { name: "HttpClient", kind: "interface", members: ["+ get(url): dict"], scala: ["+ get(url): Map"] },
    creators: [{ name: "FakeWeatherService", members: ["+ create_client()"], scala: ["+ createClient()"] }],
    products: [{ name: "RealHttpClient", members: ["+ get(url)"] }, { name: "FakeHttpClient", members: ["+ get(url)"] }]
  }),
  walk: [
    [...build(1), { pulse: "pC1" }, { tag: "pC1", text: "temp_c = 41" }],
    [
      { ring: "cC0" },
      { call: ["client", "cC0"], label: 'advice("Nagpur")' },
      { call: ["cC0", "pC1"], label: "create_client()", scalaLabel: "createClient()", result: "the fake" }
    ],
    [
      { call: ["creator", "product", "pC1"], label: "get(.../Nagpur)", result: '{"temp_c": 41}' },
      { tag: "pC1", text: "1 call recorded" }
    ],
    [
      { call: ["client", "cC0"], label: 'advice("Nagpur")', result: '"Nagpur: 41°C, carry water"' },
      { pulse: "creator" }
    ],
    [
      { tag: "pC1", text: null },
      { ring: "creator" },
      { call: ["client", "creator"], label: 'advice("Nagpur")' },
      { call: ["creator", "pC0"], label: "create_client()", scalaLabel: "createClient()", result: "RealHttpClient" },
      { call: ["creator", "product", "pC0"], label: "get(.../Nagpur)", result: "error: no network" },
      { flash: "pC0" }
    ]
  ],
  tryIt: {
    prompt: "Pick which service the test builds. Which client does create_client() hand back?",
    groups: [
      { label: "Service", options: [
        { id: "fake41", label: "Fake at 41°C" },
        { id: "fake35", label: "Fake at 35°C" },
        { id: "fake28", label: "Fake at 28°C" },
        { id: "real", label: "WeatherService" }
      ] }
    ],
    results: {
      fake41: fakeRun(41),
      fake35: fakeRun(35),
      fake28: fakeRun(28),
      real: {
        output: "Error: no network in this demo",
        note: "The default factory method returns RealHttpClient, which raises ConnectionError offline.",
        actions: [
          { ring: "creator" },
          { call: ["client", "creator", "pC0"], label: 'advice("Nagpur")', result: "no network" },
          { flash: "pC0" }
        ]
      }
    }
  }
};

const animation: PatternAnimation = {
  slug: "factory-method",
  story: storyAnim,
  examples: { export: exportEx, checkout, enemy, testing },
  sequence: {
    label: "The demo calls send on an EmailNotifier, which calls its own create_message, creates an EmailMessage and calls deliver on it; the same happens with SmsNotifier and SmsMessage.",
    participants: [
      { id: "demo", name: "Demo code", kind: "client" },
      { id: "emailN", name: ": EmailNotifier", kind: "concrete" },
      { id: "emailM", name: ": EmailMessage", kind: "concrete" },
      { id: "smsN", name: ": SmsNotifier", kind: "concrete" },
      { id: "smsM", name: ": SmsMessage", kind: "concrete" }
    ],
    messages: [
      { from: "demo", to: "emailN", label: "send(text)" },
      { from: "emailN", to: "emailN", label: "create_message()", kind: "self" },
      { from: "emailN", to: "emailM", label: "EmailMessage()", kind: "create" },
      { from: "emailN", to: "emailM", label: "deliver(text)" },
      { from: "emailM", to: "emailN", label: '"Email: Your order has shipped"', kind: "return" },
      { from: "emailN", to: "demo", label: '"Email: …"', kind: "return" },
      { from: "demo", to: "smsN", label: "send(text)" },
      { from: "smsN", to: "smsN", label: "create_message()", kind: "self" },
      { from: "smsN", to: "smsM", label: "SmsMessage()", kind: "create" },
      { from: "smsN", to: "smsM", label: "deliver(text)" },
      { from: "smsM", to: "smsN", label: '"SMS: Your order has shipped"', kind: "return" },
      { from: "smsN", to: "demo", label: '"SMS: …"', kind: "return" }
    ]
  }
};

export default animation;
