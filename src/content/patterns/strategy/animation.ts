import type { Action, DiagramSpec, ExampleAnimation, PatternAnimation } from "../../../anim/types";

/* ---------- story: port of the approved prototype (public/prototypes/strategy-animation.html) ---------- */

const story: DiagramSpec = {
  label: "Checkout holds one PaymentMethod; CardPayment, UpiPayment, WalletPayment and PayLaterPayment implement it; App is the client.",
  width: 930,
  height: 440,
  portraitWidth: 340,
  portraitHeight: 550,
  nodes: [
    { id: "app", kind: "client", name: "App", at: { x: 20, y: 185, w: 110, h: 60 }, portrait: { x: 8, y: 50, w: 96, h: 56 } },
    { id: "checkout", kind: "concrete", name: "Checkout", key: true, members: [],
      at: { x: 180, y: 150, w: 230 }, portrait: { x: 120, y: 40, w: 212 } },
    { id: "iface", kind: "interface", name: "PaymentMethod", key: true, hidden: true,
      members: ["+ pay(amount): str"], scalaMembers: ["+ pay(amount): String"],
      at: { x: 540, y: 30, w: 230 }, portrait: { x: 60, y: 200, w: 220 } },
    { id: "card", kind: "concrete", name: "CardPayment", hidden: true, members: ["+ pay(amount)"],
      at: { x: 440, y: 330, w: 108 }, portrait: { x: 8, y: 330, w: 156 } },
    { id: "upi", kind: "concrete", name: "UpiPayment", hidden: true, members: ["+ pay(amount)"],
      at: { x: 560, y: 330, w: 108 }, portrait: { x: 176, y: 330, w: 156 } },
    { id: "wallet", kind: "concrete", name: "WalletPayment", hidden: true, members: ["+ pay(amount)"],
      at: { x: 680, y: 330, w: 108 }, portrait: { x: 8, y: 450, w: 156 } },
    { id: "paylater", kind: "concrete", name: "PayLaterPayment", hidden: true, members: ["+ pay(amount)"],
      at: { x: 800, y: 330, w: 118 }, portrait: { x: 176, y: 450, w: 156 } }
  ],
  edges: [
    { id: "holds", from: "checkout", to: "iface", type: "association", label: "holds one", hidden: true, route: "straight" },
    { id: "r-card", from: "card", to: "iface", type: "realization", hidden: true },
    { id: "r-upi", from: "upi", to: "iface", type: "realization", hidden: true },
    { id: "r-wallet", from: "wallet", to: "iface", type: "realization", hidden: true, viaPortrait: [[170, 432], [86, 432]] },
    { id: "r-paylater", from: "paylater", to: "iface", type: "realization", hidden: true, viaPortrait: [[170, 432], [254, 432]] }
  ],
  badges: [
    { id: "warn", text: "Edited for every new type", tone: "warn", near: "checkout" },
    { id: "ok", text: "Checkout: 0 lines changed", tone: "ok", near: "checkout" }
  ]
};

const PAY_PATH = (target: string) => ["app", "checkout", "iface", target];

const storyAnim: PatternAnimation["story"] = {
  diagram: story,
  steps: [
    {
      title: "The problem: one class knows every payment",
      what: "Checkout picks the payment type with if/elif. Each new option adds another branch to the same method.",
      why: "Checkout has to be reopened and re-tested every time a payment type is added. That breaks the Open/Closed Principle.",
      say: {
        what: "Here's the problem. Checkout chooses the payment type with an if-else chain. Every new payment option adds another branch to the same method.",
        why: "So Checkout has to be reopened and re-tested every time we add a payment type. That breaks the open-closed principle."
      },
      code: "problem",
      lines: { python: [3, 4, 5, 6, 7, 8], scala: [3, 4, 5] },
      actions: [
        { members: "checkout", stagger: true,
          lines: ['if kind == "card": …', 'elif kind == "upi": …', 'elif kind == "wallet": …'],
          scalaLines: ['case "card"   => …', 'case "upi"    => …', 'case "wallet" => …'] },
        { flash: "checkout" },
        { shake: "checkout", together: true },
        { show: ["warn"], together: true }
      ]
    },
    {
      title: "Pull each branch out into its own class",
      what: "The logic inside each branch moves into CardPayment, UpiPayment and WalletPayment. Checkout keeps only a reference to “a payment method”.",
      why: "Each algorithm can now change and be tested on its own (Single Responsibility).",
      say: {
        what: "Now we pull each branch out into its own class: card payment, U P I payment, and wallet payment. Checkout keeps just one reference to a payment method.",
        why: "Each algorithm can now change, and be tested, on its own. That's single responsibility."
      },
      code: "main",
      lines: { python: [9, 10, 13, 14, 17, 18], scala: [4, 5, 7, 8, 10, 11] },
      actions: [
        { hide: ["warn"] },
        { members: "checkout", lines: [], together: true },
        { spawn: ["card", "upi", "wallet"], from: "checkout" },
        { members: "checkout", lines: ["- method: PaymentMethod", "+ set_method(m)", "+ pay(amount)"],
          scalaLines: ["- method: PaymentMethod", "+ setMethod(m)", "+ pay(amount)"] }
      ]
    },
    {
      title: "Give them one shared interface",
      what: "All three classes implement PaymentMethod.pay(amount). Checkout only knows about the interface, never the concrete classes.",
      why: "Checkout depends on an abstraction, not on details (Dependency Inversion). Any class that implements the interface fits.",
      say: {
        what: "Next, all three classes share one interface, called payment method, with a single pay method. Checkout only knows about this interface.",
        why: "Checkout depends on an abstraction, not on the details. That's dependency inversion. Any class that implements the interface will fit."
      },
      code: "main",
      lines: { python: [4, 5, 6, 9, 13, 17], scala: [1, 2, 4, 7, 10] },
      actions: [
        { show: ["iface"] },
        { show: ["r-card", "r-upi", "r-wallet"] },
        { show: ["holds"] }
      ]
    },
    {
      title: "The client plugs one in",
      what: "App creates Checkout(CardPayment()). The choice of algorithm is made outside Checkout.",
      why: "Checkout never names a concrete class, so whoever configures it decides the behaviour.",
      say: {
        what: "The app decides which payment to use, and passes a card payment into Checkout.",
        why: "Checkout never names a concrete class. Whoever sets it up chooses the behaviour."
      },
      code: "main",
      lines: { python: [21, 22, 23, 36], scala: [13, 21] },
      actions: [
        { call: ["app", "checkout"], label: "Checkout(CardPayment())" },
        { ring: "card", caption: "active strategy" },
        { pulse: "card", together: true }
      ]
    },
    {
      title: "Checkout delegates the call",
      what: "pay(1200) travels through the interface to CardPayment, and the result comes back to App.",
      why: "Checkout doesn't know or care which algorithm ran. It just forwards the call.",
      say: {
        what: "When the app calls pay, Checkout simply forwards the call through the interface to the card payment. The result comes back to the app.",
        why: "Checkout doesn't know, or care, which algorithm actually ran."
      },
      code: "main",
      lines: { python: [10, 28, 29, 37], scala: [5, 15, 22] },
      actions: [{ call: PAY_PATH("card"), label: "pay(₹1,200)", result: '"Paid ₹1200 by card"' }]
    },
    {
      title: "Swap the strategy while the program runs",
      what: "App calls set_method(UpiPayment()). Only the reference inside Checkout changes.",
      why: "Behaviour changes at runtime with no edit and no restart.",
      say: {
        what: "Now the app swaps in the U P I payment while the program is running. Only the reference inside Checkout changes.",
        why: "Behaviour changes at runtime, with no code edits and no restart."
      },
      code: "main",
      lines: { python: [25, 26, 38], scala: [14, 23] },
      actions: [
        { call: ["app", "checkout"], label: "set_method(UpiPayment())", scalaLabel: "setMethod(UpiPayment())" },
        { ring: "upi", caption: "active strategy" },
        { pulse: "upi" }
      ]
    },
    {
      title: "Same call, new behaviour",
      what: "The exact same pay(1200) now ends up in UpiPayment.",
      why: "One call site, many interchangeable algorithms. This is the whole point of Strategy.",
      say: {
        what: "The exact same pay call now ends up in the U P I payment.",
        why: "One call site, many interchangeable algorithms. That's the whole point of the strategy pattern."
      },
      code: "main",
      lines: { python: [14, 28, 29, 39], scala: [8, 15, 24] },
      actions: [{ call: PAY_PATH("upi"), label: "pay(₹1,200)", result: '"Paid ₹1200 via UPI"' }]
    },
    {
      title: "Add a payment type without touching Checkout",
      what: "PayLaterPayment implements PaymentMethod and plugs straight in.",
      why: "Checkout: 0 lines changed. New behaviour is added, not edited in (Open/Closed).",
      say: {
        what: "Finally, we add a brand new pay-later option. It implements the interface and plugs straight in.",
        why: "And Checkout? Zero lines changed. New behaviour is added, not edited in. That's the open-closed principle in action."
      },
      code: "main",
      lines: { python: [32, 33], scala: [17, 18] },
      actions: [
        { show: ["paylater"] },
        { show: ["r-paylater"] },
        { show: ["ok"] },
        { pulse: "checkout", together: true }
      ]
    }
  ]
};

/* ---------- real-world examples: one small diagram each (client -> context -> interface <- 3 strategies) ---------- */

interface MiniCfg {
  client: string; context: string; field: string; scalaField?: string; iface: string; method: string;
  boxes: [string, string, string];
  twist?: { type: "fallback" | "extends"; label: string };
  label: string;
}

/** Landscape positions follow the prototype's mini stage; portrait puts two strategies on a row and one below. */
export function miniDiagram(c: MiniCfg): DiagramSpec {
  const bx = (i: number) => 250 + 170 * i;
  const pBox = [{ x: 8, y: 225, w: 156 }, { x: 176, y: 225, w: 156 }, { x: 92, y: 315, w: 156 }];
  const ids = ["s0", "s1", "s2"];
  const spec: DiagramSpec = {
    label: c.label,
    width: 760, height: c.twist ? 310 : 275,
    portraitWidth: 340, portraitHeight: c.twist ? 420 : 390,
    nodes: [
      { id: "client", kind: "client", name: c.client, hidden: true, at: { x: 16, y: 34, w: 130, h: 54 }, portrait: { x: 8, y: 14, w: 140, h: 54 } },
      { id: "ctx", kind: "concrete", name: c.context, key: true, hidden: true, members: [c.field], scalaMembers: c.scalaField ? [c.scalaField] : undefined,
        at: { x: 180, y: 30, w: 170 }, portrait: { x: 160, y: 10, w: 172 } },
      { id: "iface", kind: "interface", name: c.iface, key: true, hidden: true, members: [c.method],
        at: { x: 387.5, y: 16, w: 220 }, portrait: { x: 55, y: 105, w: 230 } },
      ...c.boxes.map((name, i) => ({
        id: ids[i], kind: "concrete" as const, name, hidden: true, members: [c.method.replace(/: .*$/, "")],
        at: { x: bx(i), y: 190, w: 155 }, portrait: pBox[i]
      }))
    ],
    edges: [
      { id: "holds", from: "ctx", to: "iface", type: "association", hidden: true, route: "straight" },
      ...ids.map((id) => ({ id: "r-" + id, from: id, to: "iface", type: "realization" as const, hidden: true }))
    ]
  };
  if (c.twist?.type === "fallback") {
    spec.edges.push({ id: "twist", from: "s2", to: "s0", type: "association", label: c.twist.label, hidden: true,
      via: [[327.5, 282], [667.5, 282]], viaPortrait: [[86, 400], [170, 400]] });
  } else if (c.twist?.type === "extends") {
    spec.edges.push({ id: "twist", from: "s2", to: "s1", type: "inheritance", label: c.twist.label, hidden: true,
      via: [[497.5, 282], [667.5, 282]], viaPortrait: [[254, 400], [170, 400]] });
  }
  return spec;
}

const BUILD: Action[] = [
  { show: ["client", "ctx"] },
  { show: ["iface"] },
  { show: ["holds"] },
  { show: ["s0", "s1", "s2"] },
  { show: ["r-s0", "r-s1", "r-s2"] }
];
const PATH = (i: number) => ["client", "ctx", "iface", "s" + i];
/** Ring moves to a strategy after a "use X" pill reaches the context (the prototype's tlPick). */
export const pick = (i: number, name: string): Action[] => [
  { call: ["client", "ctx"], label: "use " + name },
  { ring: "s" + i },
  { pulse: "s" + i }
];
export const callTo = (i: number, label: string, result: string, via?: number): Action[] => [{
  call: via === undefined ? PATH(i) : [...PATH(i), "s" + via],
  label, result
}];

const ride: ExampleAnimation = {
  diagram: miniDiagram({
    label: "Ride holds one PricingStrategy; NormalPricing, SurgePricing and PoolPricing implement it.",
    client: "Rider app", context: "Ride", field: "- pricing", iface: "PricingStrategy", method: "+ fare(km, min)",
    boxes: ["NormalPricing", "SurgePricing", "PoolPricing"]
  }),
  walk: [
    BUILD,
    pick(0, "NormalPricing"),
    callTo(0, "quote(8 km, 25 min)", "₹184"),
    [...pick(1, "SurgePricing"), ...callTo(1, "quote(8 km, 25 min)", "₹330")],
    [...pick(2, "PoolPricing"), ...callTo(2, "quote(8 km, 25 min)", "₹128")]
  ],
  tryIt: { custom: "strategy-ride" }
};

const sort: ExampleAnimation = {
  diagram: miniDiagram({
    label: "SearchResults holds one Ordering; PriceLowHigh, TopRated and Newest are interchangeable orderings.",
    client: "Search page", context: "SearchResults", field: "- ordering", iface: "Ordering[Product]", method: "compare(a, b)",
    boxes: ["PriceLowHigh", "TopRated", "Newest"]
  }),
  walk: [
    BUILD,
    pick(0, "PriceLowHigh"),
    callTo(0, "sort(results)", "Toaster, Kettle, Mixer"),
    [...pick(1, "TopRated"), ...callTo(1, "sort(results)", "Toaster, Mixer, Kettle")],
    [...pick(2, "Newest"), ...callTo(2, "sort(results)", "Toaster, Mixer, Kettle")]
  ],
  tryIt: { custom: "strategy-sort" }
};

const ship: ExampleAnimation = {
  diagram: miniDiagram({
    label: "Order holds one ShippingStrategy; StandardShipping, ExpressShipping and FreeAbove implement it; FreeAbove falls back to StandardShipping.",
    client: "Checkout", context: "Order", field: "- shipping", iface: "ShippingStrategy", method: "+ cost(kg, total)",
    boxes: ["StandardShipping", "ExpressShipping", "FreeAbove(₹499)"], twist: { type: "fallback", label: "falls back to" }
  }),
  walk: [
    [...BUILD, { show: ["twist"] }],
    [...pick(0, "StandardShipping"), ...callTo(0, "cost(2 kg, ₹650)", "₹60")],
    [...pick(1, "ExpressShipping"), ...callTo(1, "cost(2 kg, ₹650)", "₹170")],
    [...pick(2, "FreeAbove(₹499)"), ...callTo(2, "cost(2 kg, ₹650)", "₹0")],
    [{ pulse: "s2" }, ...callTo(2, "cost(2 kg, ₹400)", "₹60", 0)]
  ],
  tryIt: { custom: "strategy-ship" }
};

const retry: ExampleAnimation = {
  diagram: miniDiagram({
    label: "RetryingClient holds one BackoffStrategy; FixedDelay, ExponentialBackoff and FullJitter implement it; FullJitter extends ExponentialBackoff.",
    client: "PaymentService", context: "RetryingClient", field: "- backoff", iface: "BackoffStrategy", method: "+ delay(attempt)",
    boxes: ["FixedDelay", "ExponentialBackoff", "FullJitter"], twist: { type: "extends", label: "extends" }
  }),
  walk: [
    [...BUILD, { show: ["twist"] }],
    [...pick(0, "FixedDelay"), ...callTo(0, "delay(retry 3)", "1.00 s")],
    [...pick(1, "ExponentialBackoff"), ...callTo(1, "delay(retry 3)", "2.00 s")],
    [...pick(2, "FullJitter"), { pulse: "s1" }, ...callTo(2, "delay(retry 3)", "0.55 s")]
  ],
  tryIt: { custom: "strategy-retry" }
};

const animation: PatternAnimation = {
  slug: "strategy",
  story: storyAnim,
  examples: { ride, sort, ship, retry },
  sequence: {
    label: "App calls pay on Checkout, which forwards it to CardPayment; after set_method, the same call reaches UpiPayment.",
    participants: [
      { id: "app", name: "App", kind: "client" },
      { id: "checkout", name: "checkout: Checkout", kind: "concrete" },
      { id: "card", name: ": CardPayment", kind: "concrete" },
      { id: "upi", name: ": UpiPayment", kind: "concrete" }
    ],
    messages: [
      { from: "app", to: "checkout", label: "pay(1200)" },
      { from: "checkout", to: "card", label: "pay(1200)" },
      { from: "card", to: "checkout", label: '"Paid ₹1200 by card"', kind: "return" },
      { from: "checkout", to: "app", label: '"Paid ₹1200 by card"', kind: "return" },
      { from: "app", to: "checkout", label: "set_method(UpiPayment())" },
      { from: "app", to: "checkout", label: "pay(1200)" },
      { from: "checkout", to: "upi", label: "pay(1200)" },
      { from: "upi", to: "checkout", label: '"Paid ₹1200 via UPI"', kind: "return" },
      { from: "checkout", to: "app", label: '"Paid ₹1200 via UPI"', kind: "return" }
    ]
  }
};

export default animation;
