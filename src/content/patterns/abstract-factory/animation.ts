import type { Action, DiagramSpec, ExampleAnimation, PatternAnimation, TryResult } from "../../../anim/types";

/* ---------- story: cloud storage + queue families for a report service ---------- */

const story: DiagramSpec = {
  label: "ReportService uses the CloudFactory interface, Storage and Queue; AwsFactory and GcpFactory implement CloudFactory; S3Storage and GcsStorage implement Storage; SqsQueue and PubSubQueue implement Queue.",
  width: 920,
  height: 440,
  portraitWidth: 340,
  portraitHeight: 736,
  nodes: [
    { id: "rs", kind: "client", name: "ReportService", members: [],
      at: { x: 360, y: 20, w: 240 }, portrait: { x: 50, y: 8, w: 240 } },
    { id: "cf", kind: "interface", name: "CloudFactory", key: true, hidden: true,
      members: ["+ create_storage(): Storage", "+ create_queue(): Queue"],
      scalaMembers: ["+ createStorage(): Storage", "+ createQueue(): Queue"],
      at: { x: 20, y: 30, w: 230 }, portrait: { x: 66, y: 140, w: 204 } },
    { id: "aws", kind: "concrete", name: "AwsFactory", key: true, hidden: true,
      members: ["+ create_storage()", "+ create_queue()"], scalaMembers: ["+ createStorage()", "+ createQueue()"],
      at: { x: 12, y: 220, w: 140 }, portrait: { x: 8, y: 256, w: 150 } },
    { id: "gcp", kind: "concrete", name: "GcpFactory", key: true, hidden: true,
      members: ["+ create_storage()", "+ create_queue()"], scalaMembers: ["+ createStorage()", "+ createQueue()"],
      at: { x: 164, y: 220, w: 140 }, portrait: { x: 170, y: 256, w: 150 } },
    { id: "storage", kind: "interface", name: "Storage", hidden: true,
      members: ["+ upload(name): str"], scalaMembers: ["+ upload(name): String"],
      at: { x: 356, y: 200, w: 200 }, portrait: { x: 64, y: 386, w: 200 } },
    { id: "queue", kind: "interface", name: "Queue", hidden: true,
      members: ["+ publish(message): str"], scalaMembers: ["+ publish(message): String"],
      at: { x: 660, y: 200, w: 210 }, portrait: { x: 59, y: 566, w: 210 } },
    { id: "s3", kind: "concrete", name: "S3Storage", members: ["+ upload(name)"],
      at: { x: 330, y: 330, w: 120 }, portrait: { x: 8, y: 482, w: 150 } },
    { id: "gcs", kind: "concrete", name: "GcsStorage", members: ["+ upload(name)"],
      at: { x: 462, y: 330, w: 120 }, portrait: { x: 170, y: 482, w: 150 } },
    { id: "sqs", kind: "concrete", name: "SqsQueue", members: ["+ publish(message)"],
      at: { x: 610, y: 330, w: 140 }, portrait: { x: 8, y: 662, w: 150 } },
    { id: "pubsub", kind: "concrete", name: "PubSubQueue", members: ["+ publish(message)"],
      at: { x: 762, y: 330, w: 140 }, portrait: { x: 170, y: 662, w: 150 } }
  ],
  edges: [
    { id: "u-cf", from: "rs", to: "cf", type: "association", hidden: true },
    { id: "u-storage", from: "rs", to: "storage", type: "association", hidden: true,
      viaPortrait: [[333, 423], [333, 65]] },
    { id: "u-queue", from: "rs", to: "queue", type: "association", hidden: true,
      via: [[765, 77]], viaPortrait: [[333, 603], [333, 65]] },
    { id: "i-aws", from: "aws", to: "cf", type: "realization", hidden: true },
    { id: "i-gcp", from: "gcp", to: "cf", type: "realization", hidden: true },
    { id: "r-s3", from: "s3", to: "storage", type: "realization", hidden: true },
    { id: "r-gcs", from: "gcs", to: "storage", type: "realization", hidden: true },
    { id: "r-sqs", from: "sqs", to: "queue", type: "realization", hidden: true },
    { id: "r-pubsub", from: "pubsub", to: "queue", type: "realization", hidden: true }
  ],
  badges: [
    { id: "warn", text: "Mixed clouds, and no error", tone: "warn", near: "rs", place: "below" },
    { id: "ok", text: "Families can't mix", tone: "ok", near: "gcp", place: "below" }
  ]
};

const storyAnim: PatternAnimation["story"] = {
  diagram: story,
  steps: [
    {
      title: "The problem: business code picks every cloud class",
      what: "ReportService chooses storage and queue classes with if/elif. A copy-paste slip gives the GCP branch an AWS queue, and the program runs without any error.",
      why: "Nothing keeps related objects together, and the service must change for every new cloud (breaks Open/Closed).",
      say: {
        what: "Here's the problem. The report service picks its storage and queue classes with an if-else on the cloud name. A copy-paste slip gives the G C P branch an A W S queue, and the program runs without any error.",
        why: "Nothing keeps related objects together, and the service has to change for every new cloud. That breaks the open-closed principle."
      },
      code: "problem",
      lines: { python: [24, 25, 26, 27, 28], scala: [21, 22, 23, 24] },
      actions: [
        { members: "rs", stagger: true,
          lines: ["aws → S3Storage(), SqsQueue()", "gcp → GcsStorage(), SqsQueue()"] },
        { call: ["rs", "gcs"], label: "GcsStorage()" },
        { tag: "gcs", text: "GCP" },
        { call: ["rs", "sqs"], label: "SqsQueue()" },
        { tag: "sqs", text: "AWS!" },
        { flash: "sqs" },
        { shake: "rs", together: true },
        { show: ["warn"], together: true }
      ]
    },
    {
      title: "Give each kind of product an interface",
      what: "S3Storage and GcsStorage implement Storage; SqsQueue and PubSubQueue implement Queue. These are the abstract products.",
      why: "Business code can now talk to Storage and Queue without knowing which cloud is behind them (Dependency Inversion).",
      say: {
        what: "First, each kind of product gets an interface. Both storages implement Storage, and both queues implement Queue.",
        why: "Business code can now talk to storage and queue without knowing which cloud is behind them. That's dependency inversion."
      },
      code: "main",
      lines: { python: [4, 6, 9, 11, 14, 19, 24, 29], scala: [1, 2, 4, 5, 7, 10, 13, 16] },
      actions: [
        { hide: ["warn"] },
        { tag: "gcs", text: null },
        { tag: "sqs", text: null, together: true },
        { show: ["storage", "queue"] },
        { show: ["r-s3", "r-gcs", "r-sqs", "r-pubsub"] }
      ]
    },
    {
      title: "One factory interface for the whole family",
      what: "CloudFactory declares create_storage() and create_queue(). ReportService now receives one factory and keeps only a Storage and a Queue.",
      why: "The service never names a concrete class, so it cannot pick a mismatched pair by mistake.",
      say: {
        what: "Next, a cloud factory interface declares one creation method per product: create storage and create queue. The report service now receives one factory, and keeps only a storage and a queue.",
        why: "The service never names a concrete class, so it can't pick a mismatched pair by mistake."
      },
      code: "main",
      lines: { python: [34, 36, 39, 60, 61, 62], scala: [19, 20, 21, 32, 33, 34] },
      actions: [
        { members: "rs", lines: ["- storage: Storage", "- queue: Queue", "+ publish_report(name)"],
          scalaLines: ["- storage: Storage", "- queue: Queue", "+ publishReport(name)"] },
        { show: ["cf"] },
        { show: ["u-cf", "u-storage", "u-queue"] },
        { pulse: "cf" }
      ]
    },
    {
      title: "One concrete factory per family",
      what: "AwsFactory makes S3Storage and SqsQueue; GcpFactory makes GcsStorage and PubSubQueue. Each factory only knows its own family.",
      why: "A family is decided in one class, so matching products always come together (Single Responsibility).",
      say: {
        what: "Now, one concrete factory per family. The A W S factory makes S3 storage and an S Q S queue. The G C P factory makes G C S storage and a Pub Sub queue.",
        why: "Each family is decided in one class, so matching products always come together."
      },
      code: "main",
      lines: { python: [42, 43, 44, 46, 47, 50, 51, 52, 54, 55], scala: [23, 24, 25, 27, 28, 29] },
      actions: [
        { spawn: ["aws", "gcp"], from: "cf" },
        { show: ["i-aws", "i-gcp"] },
        { tag: "s3", text: "AWS" },
        { tag: "sqs", text: "AWS", together: true },
        { tag: "gcs", text: "GCP" },
        { tag: "pubsub", text: "GCP", together: true }
      ]
    },
    {
      title: "Pass in the AWS factory",
      what: "The demo creates ReportService(AwsFactory()). The service asks the factory for storage and a queue, and gets S3Storage and SqsQueue.",
      why: "One argument chooses the whole family. The service code is the same for every cloud.",
      say: {
        what: "The demo passes an A W S factory into the report service. The service asks it for storage and a queue, and gets S3 storage and an S Q S queue.",
        why: "One argument chooses the whole family. The service code is the same for every cloud."
      },
      code: "main",
      lines: { python: [61, 62, 69, 70], scala: [33, 34, 41, 42] },
      actions: [
        { ring: "aws", caption: "chosen family" },
        { call: ["rs", "cf", "aws", "s3"], label: "create_storage()", scalaLabel: "createStorage()", result: "S3Storage" },
        { call: ["rs", "cf", "aws", "sqs"], label: "create_queue()", scalaLabel: "createQueue()", result: "SqsQueue" },
        { pulse: "s3" },
        { pulse: "sqs", together: true }
      ]
    },
    {
      title: "Use the products through their interfaces",
      what: "publish_report(\"q3.pdf\") uploads through Storage and publishes through Queue. Both calls land in the AWS classes.",
      why: "The service only calls interface methods, so it works with any family it is given.",
      say: {
        what: "Publish report uploads the file through the storage interface, and publishes a message through the queue interface. Both calls land in the A W S classes.",
        why: "The service only calls interface methods, so it works with any family it's given."
      },
      code: "main",
      lines: { python: [64, 65, 66, 16, 21], scala: [36, 37, 38, 8, 11] },
      actions: [
        { call: ["rs", "storage", "s3"], label: 'upload("q3.pdf")', result: '"s3://reports/q3.pdf"' },
        { call: ["rs", "queue", "sqs"], label: "publish(…)", result: '"SQS <- report ready at s3://…"' }
      ]
    },
    {
      title: "Swap the whole family in one place",
      what: "The loop passes GcpFactory next. The same service now gets GcsStorage and PubSubQueue, and publishes through Pub/Sub.",
      why: "Changing cloud is one different argument, not edits across the business code.",
      say: {
        what: "The loop passes the G C P factory next. The same service now gets G C S storage and a Pub Sub queue, and publishes through Pub Sub.",
        why: "Changing cloud is one different argument, not edits across the business code."
      },
      code: "main",
      lines: { python: [52, 55, 69, 70], scala: [28, 29, 41, 42] },
      actions: [
        { ring: "gcp", caption: "chosen family" },
        { call: ["rs", "cf", "gcp", "gcs"], label: "create_storage()", scalaLabel: "createStorage()", result: "GcsStorage" },
        { call: ["rs", "cf", "gcp", "pubsub"], label: "create_queue()", scalaLabel: "createQueue()", result: "PubSubQueue" },
        { call: ["rs", "queue", "pubsub"], label: "publish(…)", result: '"Pub/Sub <- report ready at gs://…"' }
      ]
    },
    {
      title: "The mismatched pair can no longer happen",
      what: "GcpFactory only makes GCP products, so an AWS queue next to GCP storage is impossible. A new cloud would be one more factory and its products.",
      why: "Products that must work together always come from one factory. ReportService: 0 lines changed per cloud (Open/Closed).",
      say: {
        what: "The G C P factory only makes G C P products, so an A W S queue next to G C P storage is now impossible. A new cloud would be one more factory and its products.",
        why: "Products that must work together always come from one factory. And the report service doesn't change for a new cloud. That's the open-closed principle."
      },
      code: "main",
      lines: { python: [50, 51, 52, 54, 55], scala: [27, 28, 29] },
      actions: [
        { ring: null },
        { show: ["ok"] },
        { pulse: "gcs" },
        { pulse: "pubsub", together: true },
        { pulse: "gcp", together: true }
      ]
    }
  ]
};

/* ---------- real-world examples: factory hierarchy left, two product hierarchies stacked right ---------- */

interface Cls { name: string; members: string[]; scala?: string[] }
interface MiniCfg {
  label: string;
  client: string;
  factory: Cls & { kind: "interface" | "abstract" };
  factories: [Cls, Cls];
  /** Two abstract products, each with two concrete products (family 0, family 1). */
  a: Cls & { kids: [Cls, Cls] };
  b: Cls & { kids: [Cls, Cls] };
}

const H = (stereo: boolean, lines: number) => (stereo ? 44 : 32) + lines * 20 + 10;

/**
 * Landscape: client and factory hierarchy on the left, product A and product B hierarchies stacked on the right.
 * Portrait: everything stacked; no lines cross between the hierarchies.
 * Node ids: client, factory, f0, f1, ifA, a0, a1, ifB, b0, b1 (family 0 = a0/b0, family 1 = a1/b1).
 */
function miniDiagram(c: MiniCfg): DiagramSpec {
  const fH = H(true, c.factory.members.length);
  const kH = H(false, c.factories[0].members.length);
  const aH = H(true, c.a.members.length), bH = H(true, c.b.members.length);
  const aKidY = 14 + aH + 30, bY = aKidY + 62 + 30, bKidY = bY + bH + 30;
  const fKidY = 14 + fH + 60;
  const pFY = 70, pKY = pFY + fH + 26, pAY = pKY + kH + 28, pAKY = pAY + aH + 26, pBY = pAKY + 62 + 28, pBKY = pBY + bH + 26;
  const node = (id: string, kind: DiagramSpec["nodes"][number]["kind"], k: Cls, at: { x: number; y: number; w: number }, p: { x: number; y: number; w: number }, key = false) => ({
    id, kind, name: k.name, members: k.members, scalaMembers: k.scala, hidden: true, key, at, portrait: p
  });
  return {
    label: c.label,
    width: 800,
    height: Math.max(bKidY + 62, fKidY + kH + 26) + 14,
    portraitWidth: 340,
    portraitHeight: pBKY + 62 + 16,
    nodes: [
      { id: "client", kind: "client", name: c.client, hidden: true, at: { x: 12, y: 14, w: 150, h: 52 }, portrait: { x: 8, y: 8, w: 170, h: 48 } },
      node("factory", c.factory.kind, c.factory, { x: 178, y: 14, w: 270 }, { x: 20, y: pFY, w: 300 }, true),
      node("f0", "concrete", c.factories[0], { x: 140, y: fKidY, w: 170 }, { x: 6, y: pKY, w: 160 }, true),
      node("f1", "concrete", c.factories[1], { x: 322, y: fKidY, w: 170 }, { x: 174, y: pKY, w: 160 }, true),
      node("ifA", "interface", c.a, { x: 529, y: 14, w: 210 }, { x: 55, y: pAY, w: 230 }),
      node("a0", "concrete", c.a.kids[0], { x: 504, y: aKidY, w: 136 }, { x: 8, y: pAKY, w: 158 }),
      node("a1", "concrete", c.a.kids[1], { x: 652, y: aKidY, w: 136 }, { x: 174, y: pAKY, w: 158 }),
      node("ifB", "interface", c.b, { x: 529, y: bY, w: 210 }, { x: 55, y: pBY, w: 230 }),
      node("b0", "concrete", c.b.kids[0], { x: 504, y: bKidY, w: 136 }, { x: 8, y: pBKY, w: 158 }),
      node("b1", "concrete", c.b.kids[1], { x: 652, y: bKidY, w: 136 }, { x: 174, y: pBKY, w: 158 })
    ],
    edges: [
      { id: "uses", from: "client", to: "factory", type: "association", hidden: true },
      { id: "i-f0", from: "f0", to: "factory", type: c.factory.kind === "interface" ? "realization" : "inheritance", hidden: true },
      { id: "i-f1", from: "f1", to: "factory", type: c.factory.kind === "interface" ? "realization" : "inheritance", hidden: true },
      { id: "r-a0", from: "a0", to: "ifA", type: "realization", hidden: true },
      { id: "r-a1", from: "a1", to: "ifA", type: "realization", hidden: true },
      { id: "r-b0", from: "b0", to: "ifB", type: "realization", hidden: true },
      { id: "r-b1", from: "b1", to: "ifB", type: "realization", hidden: true }
    ]
  };
}

const BUILD: Action[] = [
  { show: ["client", "factory"] },
  { show: ["uses"] },
  { show: ["f0", "f1"] },
  { show: ["i-f0", "i-f1"] },
  { show: ["ifA", "ifB"] },
  { show: ["a0", "a1", "b0", "b1"] },
  { show: ["r-a0", "r-a1", "r-b0", "r-b1"] }
];

/** The client asks the chosen factory for both products of its family. */
const family = (i: 0 | 1, aCall: [string, string, string], bCall: [string, string, string], caption?: string): Action[] => [
  { ring: "f" + i, caption },
  { call: ["client", "factory", "f" + i, "a" + i], label: aCall[0], scalaLabel: aCall[1], result: aCall[2] },
  { call: ["client", "factory", "f" + i, "b" + i], label: bCall[0], scalaLabel: bCall[1], result: bCall[2] }
];

/* ----- 1. theme ----- */

const theme: ExampleAnimation = {
  diagram: miniDiagram({
    label: "OrderScreen uses ThemeFactory; LightTheme and DarkTheme create matching Button and Card objects.",
    client: "OrderScreen",
    factory: { name: "ThemeFactory", kind: "interface",
      members: ["+ create_button(): Button", "+ create_card(): Card"], scala: ["+ createButton(): Button", "+ createCard(): Card"] },
    factories: [
      { name: "LightTheme", members: ["+ create_button()", "+ create_card()"], scala: ["+ createButton()", "+ createCard()"] },
      { name: "DarkTheme", members: ["+ create_button()", "+ create_card()"], scala: ["+ createButton()", "+ createCard()"] }
    ],
    a: { name: "Button", members: ["+ render(label): str"], scala: ["+ render(label): String"],
      kids: [{ name: "LightButton", members: ["+ render(label)"] }, { name: "DarkButton", members: ["+ render(label)"] }] },
    b: { name: "Card", members: ["+ render(body): str"], scala: ["+ render(body): String"],
      kids: [{ name: "LightCard", members: ["+ render(body)"] }, { name: "DarkCard", members: ["+ render(body)"] }] }
  }),
  walk: [
    [...BUILD, { tag: "client", text: "asha: light" }, { ring: "f0" }],
    family(0, ["create_button()", "createButton()", "LightButton"], ["create_card()", "createCard()", "LightCard"]),
    [
      { call: ["client", "ifB", "b0"], label: 'render("Order A-42 …")', result: "(white card, grey border)" },
      { call: ["client", "ifA", "a0"], label: 'render("Track")', result: "[ Track ] (black text on white)" }
    ],
    [{ tag: "client", text: "ravi: dark" }, ...family(1, ["create_button()", "createButton()", "DarkButton"], ["create_card()", "createCard()", "DarkCard"])],
    [
      { call: ["client", "ifB", "b1"], label: 'render("Order A-42 …")', result: "(charcoal card, no border)" },
      { call: ["client", "ifA", "a1"], label: 'render("Track")', result: "[ Track ] (white text on charcoal)" },
      { pulse: "client" }
    ]
  ],
  tryIt: {
    prompt: "Pick a theme and a widget. Which class draws it, and how does it look?",
    groups: [
      { label: "Theme", options: [{ id: "light", label: "LightTheme" }, { id: "dark", label: "DarkTheme" }] },
      { label: "Widget", options: [{ id: "card", label: "Order card" }, { id: "button", label: "Track button" }] }
    ],
    results: {
      "light|card": { output: "| … | (white card, grey border)", note: "LightTheme.create_card() → LightCard: \"| Order A-42 is out for delivery | (white card, grey border)\"",
        actions: [{ ring: "f0" }, { call: ["client", "ifB", "b0"], label: "render(body)", result: "(white card, grey border)" }] },
      "light|button": { output: "[ Track ] (black text on white)", note: "LightTheme.create_button() → LightButton",
        actions: [{ ring: "f0" }, { call: ["client", "ifA", "a0"], label: 'render("Track")', result: "[ Track ] (black text on white)" }] },
      "dark|card": { output: "| … | (charcoal card, no border)", note: "DarkTheme.create_card() → DarkCard: \"| Order A-42 is out for delivery | (charcoal card, no border)\"",
        actions: [{ ring: "f1" }, { call: ["client", "ifB", "b1"], label: "render(body)", result: "(charcoal card, no border)" }] },
      "dark|button": { output: "[ Track ] (white text on charcoal)", note: "DarkTheme.create_button() → DarkButton",
        actions: [{ ring: "f1" }, { call: ["client", "ifA", "a1"], label: 'render("Track")', result: "[ Track ] (white text on charcoal)" }] }
    }
  }
};

/* ----- 2. payments ----- */

const payRun = (method: string, fam: 0 | 1, txn: string, refund: string, fallback = false): TryResult => ({
  output: `paid ${txn}`,
  note: `provider_for("${method}") → ${fam === 0 ? "UpiProvider" : "CardProvider"}${fallback ? " (fallback)" : ""}; ${refund}`,
  actions: [
    { ring: "f" + fam, caption: fallback ? "fallback" : undefined },
    { call: ["client", "ifA", "a" + fam], label: "pay(750)", result: `"${txn}"` },
    { call: ["client", "ifB", "b" + fam], label: `refund("${txn}")`, result: "refunded" }
  ]
});

const payments: ExampleAnimation = {
  diagram: miniDiagram({
    label: "The demo uses ProviderFactory; UpiProvider and CardProvider each create a matching PaymentClient and RefundClient.",
    client: "Demo code",
    factory: { name: "ProviderFactory", kind: "interface",
      members: ["+ create_payment_client()", "+ create_refund_client()"], scala: ["+ createPaymentClient()", "+ createRefundClient()"] },
    factories: [
      { name: "UpiProvider", members: ["+ create_payment…()", "+ create_refund…()"], scala: ["+ createPayment…()", "+ createRefund…()"] },
      { name: "CardProvider", members: ["+ create_payment…()", "+ create_refund…()"], scala: ["+ createPayment…()", "+ createRefund…()"] }
    ],
    a: { name: "PaymentClient", members: ["+ pay(amount): str"], scala: ["+ pay(amount): String"],
      kids: [{ name: "UpiPaymentClient", members: ["+ pay(amount)"] }, { name: "CardPaymentClient", members: ["+ pay(amount)"] }] },
    b: { name: "RefundClient", members: ["+ refund(txn_id): str"], scala: ["+ refund(txnId): String"],
      kids: [{ name: "UpiRefundClient", members: ["+ refund(txn_id)"], scala: ["+ refund(txnId)"] },
        { name: "CardRefundClient", members: ["+ refund(txn_id)"], scala: ["+ refund(txnId)"] }] }
  }),
  walk: [
    [
      ...BUILD,
      { tag: "client", text: 'method = "upi"' },
      { ring: "f0" },
      { call: ["client", "factory", "f0", "a0"], label: "create_payment_client()", scalaLabel: "createPaymentClient()" },
      { call: ["client", "ifA", "a0"], label: "pay(750)", result: '"UPI-750"' }
    ],
    [
      { call: ["client", "factory", "f0", "b0"], label: "create_refund_client()", scalaLabel: "createRefundClient()" },
      { call: ["client", "ifB", "b0"], label: 'refund("UPI-750")', result: "refunded UPI-750 to the payer's bank account" }
    ],
    [
      { tag: "client", text: 'method = "card"' },
      ...family(1, ["create_payment_client()", "createPaymentClient()", "CardPaymentClient"], ["create_refund_client()", "createRefundClient()", "CardRefundClient"]),
      { call: ["client", "ifA", "a1"], label: "pay(750)", result: '"CARD-750"' },
      { call: ["client", "ifB", "b1"], label: 'refund("CARD-750")', result: "refunded CARD-750 to the card in 5-7 days" }
    ],
    [
      { tag: "client", text: 'method = "wallet"' },
      { ring: "f0", caption: "fallback" },
      { pulse: "f0" }
    ],
    [
      { call: ["client", "ifA", "a0"], label: "pay(750)", result: '"UPI-750"' },
      { call: ["client", "ifB", "b0"], label: 'refund("UPI-750")', result: "refunded UPI-750 to the payer's bank account" },
      { pulse: "b0" }
    ]
  ],
  tryIt: {
    prompt: "Pick a payment method. Which provider family pays ₹750 and refunds it?",
    groups: [
      { label: "Method", options: [{ id: "upi", label: "upi" }, { id: "card", label: "card" }, { id: "wallet", label: "wallet" }] }
    ],
    results: {
      upi: payRun("upi", 0, "UPI-750", "refunded UPI-750 to the payer's bank account"),
      card: payRun("card", 1, "CARD-750", "refunded CARD-750 to the card in 5-7 days"),
      wallet: payRun("wallet", 0, "UPI-750", "refunded UPI-750 to the payer's bank account", true)
    }
  }
};

/* ----- 3. database ----- */

const DB_OUT = {
  sqlite: { quote: '"users"', placeholder: "?", query: '[sqlite] … WHERE "city" = ? [Kochi]' },
  mysql: { quote: "`users`", placeholder: "%s", query: "[mysql] … WHERE `city` = %s [Kochi]" }
} as const;
const FULL = {
  sqlite: '[sqlite] SELECT * FROM "users" WHERE "city" = ? [Kochi]',
  mysql: "[mysql] SELECT * FROM `users` WHERE `city` = %s [Kochi]"
};

const dbRun = (db: "sqlite" | "mysql", what: "quote" | "placeholder" | "query"): TryResult => {
  const i = db === "sqlite" ? 0 : 1;
  const out = DB_OUT[db][what];
  const call: Action = what === "query"
    ? { call: ["client", "ifB", "b" + i], label: 'execute(sql, ["Kochi"])', scalaLabel: 'execute(sql, List("Kochi"))', result: out }
    : { call: ["client", "ifA", "a" + i], label: what === "quote" ? 'quote("users")' : "placeholder(1)", result: out };
  return { output: out, note: `Full query: ${FULL[db]}`, actions: [{ ring: "f" + i }, call] };
};

const database: ExampleAnimation = {
  diagram: miniDiagram({
    label: "UserRepository uses DatabaseFactory; SqliteFactory and MySqlFactory each create a matching Dialect and Connection.",
    client: "UserRepository",
    factory: { name: "DatabaseFactory", kind: "interface",
      members: ["+ create_dialect(): Dialect", "+ create_connection(): Connection"],
      scala: ["+ createDialect(): Dialect", "+ createConnection(): Connection"] },
    factories: [
      { name: "SqliteFactory", members: ["+ create_dialect()", "+ create_connection()"], scala: ["+ createDialect()", "+ createConnection()"] },
      { name: "MySqlFactory", members: ["+ create_dialect()", "+ create_connection()"], scala: ["+ createDialect()", "+ createConnection()"] }
    ],
    a: { name: "Dialect", members: ["+ quote(name): str", "+ placeholder(pos): str"], scala: ["+ quote(name): String", "+ placeholder(pos): String"],
      kids: [{ name: "SqliteDialect", members: ["+ quote(name)"] }, { name: "MySqlDialect", members: ["+ quote(name)"] }] },
    b: { name: "Connection", members: ["+ execute(sql, params)"],
      kids: [{ name: "SqliteConnection", members: ["+ execute(sql)"] }, { name: "MySqlConnection", members: ["+ execute(sql)"] }] }
  }),
  walk: [
    [...BUILD, ...family(0, ["create_dialect()", "createDialect()", "SqliteDialect"], ["create_connection()", "createConnection()", "SqliteConnection"])],
    [
      { call: ["client", "ifA", "a0"], label: 'quote("users")', result: '"users"' },
      { call: ["client", "ifA", "a0"], label: "placeholder(1)", result: "?" },
      { tag: "client", text: 'sql: "city" = ?' }
    ],
    [{ call: ["client", "ifB", "b0"], label: 'execute(sql, ["Kochi"])', scalaLabel: 'execute(sql, List("Kochi"))', result: DB_OUT.sqlite.query }],
    [
      ...family(1, ["create_dialect()", "createDialect()", "MySqlDialect"], ["create_connection()", "createConnection()", "MySqlConnection"]),
      { call: ["client", "ifA", "a1"], label: 'quote("users")', result: "`users`" },
      { call: ["client", "ifA", "a1"], label: "placeholder(1)", result: "%s" },
      { tag: "client", text: "sql: `city` = %s" }
    ],
    [
      { call: ["client", "ifB", "b1"], label: 'execute(sql, ["Kochi"])', scalaLabel: 'execute(sql, List("Kochi"))', result: DB_OUT.mysql.query },
      { tag: "client", text: "same code, other factory" },
      { pulse: "client" }
    ]
  ],
  tryIt: {
    prompt: "Pick a database factory and what to ask its products for.",
    groups: [
      { label: "Database", options: [{ id: "sqlite", label: "SqliteFactory" }, { id: "mysql", label: "MySqlFactory" }] },
      { label: "Ask for", options: [{ id: "quote", label: 'quote("users")' }, { id: "placeholder", label: "placeholder(1)" }, { id: "query", label: "Full query" }] }
    ],
    results: {
      "sqlite|quote": dbRun("sqlite", "quote"), "sqlite|placeholder": dbRun("sqlite", "placeholder"), "sqlite|query": dbRun("sqlite", "query"),
      "mysql|quote": dbRun("mysql", "quote"), "mysql|placeholder": dbRun("mysql", "placeholder"), "mysql|query": dbRun("mysql", "query")
    }
  }
};

/* ----- 4. exam boards ----- */

const STUDENTS = {
  meena: { marks: "94, 78, 85", cbse: "Maths: A1, Science: B1, English: A2", ib: "Maths=6 Science=5 English=6 | points 17" },
  kabir: { marks: "99, 70, 88", cbse: "Maths: A1, Science: B2, English: A2", ib: "Maths=7 Science=5 English=6 | points 18" }
};

const boardRun = (board: "cbse" | "ib", who: "meena" | "kabir"): TryResult => {
  const i = board === "cbse" ? 0 : 1;
  const s = STUDENTS[who];
  const name = who === "meena" ? "Meena" : "Kabir";
  return {
    output: s[board],
    note: `${board === "cbse" ? "CbseGrader" : "IbGrader (marks // 14)"} on ${s.marks}, then ${board === "cbse" ? "CbseReportCard" : "IbReportCard"} formats it for ${name}.`,
    actions: [
      { ring: "f" + i },
      { call: ["client", "f" + i, "a" + i], label: `make_report("${name}")`, scalaLabel: `makeReport("${name}")` },
      { call: ["factory", "ifB", "b" + i], label: "format(student, grades)", result: s[board], back: ["b" + i, "ifB", "factory", "client"] }
    ]
  };
};

const board: ExampleAnimation = {
  diagram: miniDiagram({
    label: "Abstract BoardFactory creates a Grader and a ReportCard and runs make_report; CbseBoard and IbBoard create matching board products.",
    client: "Demo code",
    factory: { name: "BoardFactory", kind: "abstract",
      members: ["+ create_grader(): Grader", "+ create_report_card()", "+ make_report(student, marks)"],
      scala: ["+ createGrader(): Grader", "+ createReportCard()", "+ makeReport(student, marks)"] },
    factories: [
      { name: "CbseBoard", members: ["+ create_grader()", "+ create_report…()"], scala: ["+ createGrader()", "+ createReportCard()"] },
      { name: "IbBoard", members: ["+ create_grader()", "+ create_report…()"], scala: ["+ createGrader()", "+ createReportCard()"] }
    ],
    a: { name: "Grader", members: ["+ grade(marks): str"], scala: ["+ grade(marks): String"],
      kids: [{ name: "CbseGrader", members: ["+ grade(marks)"] }, { name: "IbGrader", members: ["+ grade(marks)"] }] },
    b: { name: "ReportCard", members: ["+ format(student, grades)"],
      kids: [{ name: "CbseReportCard", members: ["+ format(…)"] }, { name: "IbReportCard", members: ["+ format(…)"] }] }
  }),
  walk: [
    [...BUILD, { tag: "client", text: "Meena: 94, 78, 85" }],
    [
      { ring: "f0" },
      { call: ["client", "f0"], label: 'make_report("Meena", marks)', scalaLabel: 'makeReport("Meena", marks)' },
      { call: ["factory", "f0", "a0"], label: "create_grader()", scalaLabel: "createGrader()", result: "CbseGrader" },
      { call: ["factory", "ifA", "a0"], label: "grade(94), grade(78), grade(85)", result: "A1, B1, A2" }
    ],
    [
      { call: ["factory", "f0", "b0"], label: "create_report_card()", scalaLabel: "createReportCard()", result: "CbseReportCard" },
      { call: ["factory", "ifB", "b0"], label: "format(student, grades)", result: "CBSE | Meena | Maths: A1, …", back: ["b0", "ifB", "factory", "client"] }
    ],
    [
      { ring: "f1" },
      { call: ["client", "f1"], label: 'make_report("Meena", marks)', scalaLabel: 'makeReport("Meena", marks)' },
      { call: ["factory", "f1", "a1"], label: "create_grader()", scalaLabel: "createGrader()", result: "IbGrader" },
      { call: ["factory", "ifA", "a1"], label: "grade(94), grade(78), grade(85)", result: "6, 5, 6" }
    ],
    [
      { call: ["factory", "f1", "b1"], label: "create_report_card()", scalaLabel: "createReportCard()", result: "IbReportCard" },
      { call: ["factory", "ifB", "b1"], label: "format(student, grades)", result: "IB | Meena | … | points 17", back: ["b1", "ifB", "factory", "client"] },
      { tag: "b1", text: "6 + 5 + 6 = 17" }
    ]
  ],
  tryIt: {
    prompt: "Pick a board and a student. Which grader and report card does the board's family produce?",
    groups: [
      { label: "Board", options: [{ id: "cbse", label: "CbseBoard" }, { id: "ib", label: "IbBoard" }] },
      { label: "Student", options: [{ id: "meena", label: "Meena (94, 78, 85)" }, { id: "kabir", label: "Kabir (99, 70, 88)" }] }
    ],
    results: {
      "cbse|meena": boardRun("cbse", "meena"), "cbse|kabir": boardRun("cbse", "kabir"),
      "ib|meena": boardRun("ib", "meena"), "ib|kabir": boardRun("ib", "kabir")
    }
  }
};

const animation: PatternAnimation = {
  slug: "abstract-factory",
  story: storyAnim,
  examples: { theme, payments, database, board },
  sequence: {
    label: "The demo creates ReportService with an AwsFactory; the service asks the factory for storage and a queue, then uploads and publishes through them.",
    participants: [
      { id: "demo", name: "Demo code", kind: "client" },
      { id: "rs", name: ": ReportService", kind: "client" },
      { id: "aws", name: ": AwsFactory", kind: "concrete" },
      { id: "s3", name: ": S3Storage", kind: "concrete" },
      { id: "sqs", name: ": SqsQueue", kind: "concrete" }
    ],
    messages: [
      { from: "demo", to: "rs", label: "ReportService(AwsFactory())", kind: "create" },
      { from: "rs", to: "aws", label: "create_storage()" },
      { from: "aws", to: "s3", label: "S3Storage()", kind: "create" },
      { from: "rs", to: "aws", label: "create_queue()" },
      { from: "aws", to: "sqs", label: "SqsQueue()", kind: "create" },
      { from: "demo", to: "rs", label: 'publish_report("q3.pdf")' },
      { from: "rs", to: "s3", label: 'upload("q3.pdf")' },
      { from: "s3", to: "rs", label: '"s3://reports/q3.pdf"', kind: "return" },
      { from: "rs", to: "sqs", label: "publish(…)" },
      { from: "sqs", to: "rs", label: '"SQS <- report ready at …"', kind: "return" },
      { from: "rs", to: "demo", label: '"SQS <- report ready at …"', kind: "return" }
    ]
  }
};

export default animation;
