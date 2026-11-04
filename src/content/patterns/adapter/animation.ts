import type { Action, DiagramSpec, ExampleAnimation, PatternAnimation, TryResult } from "../../../anim/types";

/* ---------- story: checkout code calls a bank SDK directly, then talks to it through LegacyBankAdapter ---------- */

const story: DiagramSpec = {
  label: "Checkout uses the PaymentGateway interface; LegacyBankAdapter implements it and wraps LegacyBankApi; later NewBankAdapter also implements it.",
  width: 900,
  height: 480,
  portraitWidth: 340,
  portraitHeight: 600,
  nodes: [
    { id: "checkout", kind: "client", name: "Checkout", members: [],
      at: { x: 16, y: 56, w: 300, h: 126 }, portrait: { x: 8, y: 48, w: 324, h: 126 } },
    { id: "iface", kind: "interface", name: "PaymentGateway", key: true, hidden: true,
      members: ["+ pay(amount_inr): str"], scalaMembers: ["+ pay(amountInr): String"],
      at: { x: 370, y: 82, w: 240 }, portrait: { x: 50, y: 216, w: 240 } },
    { id: "adapter", kind: "concrete", name: "LegacyBankAdapter", key: true, hidden: true,
      members: ["- api: LegacyBankApi", "+ pay(amount_inr)"], scalaMembers: ["- api: LegacyBankApi", "+ pay(amountInr)"],
      at: { x: 330, y: 236, w: 250, h: 94 }, portrait: { x: 8, y: 340, w: 164, h: 94 } },
    { id: "next", kind: "concrete", name: "NewBankAdapter", hidden: true,
      members: ["- sdk: NewBankSdk", "+ pay(amount_inr)"], scalaMembers: ["- sdk: NewBankSdk", "+ pay(amountInr)"],
      at: { x: 630, y: 236, w: 250, h: 94 }, portrait: { x: 184, y: 340, w: 148, h: 94 } },
    { id: "bank", kind: "concrete", name: "LegacyBankApi",
      members: ["+ make_transfer(paise, code)"], scalaMembers: ["+ makeTransfer(paise, code)"],
      at: { x: 330, y: 380, w: 250, h: 74 }, portrait: { x: 8, y: 490, w: 220, h: 74 } }
  ],
  edges: [
    { id: "raw", from: "checkout", to: "bank", type: "association", label: "calls directly", hidden: true,
      via: [[156, 417]], viaPortrait: [[178, 314], [26, 314]] },
    { id: "uses", from: "checkout", to: "iface", type: "association", hidden: true },
    { id: "r-adapter", from: "adapter", to: "iface", type: "realization", hidden: true },
    { id: "r-next", from: "next", to: "iface", type: "realization", hidden: true },
    { id: "wraps", from: "adapter", to: "bank", type: "association", label: "wraps", hidden: true }
  ],
  badges: [
    { id: "warn", text: "SDK units copied 3 times", tone: "warn", near: "checkout" },
    { id: "ok", text: "Checkout: 0 lines changed", tone: "ok", near: "checkout" }
  ]
};

const PAY = ["checkout", "iface", "adapter"];

const storyAnim: PatternAnimation["story"] = {
  diagram: story,
  steps: [
    {
      title: "The problem: SDK details in every caller",
      what: "Checkout, wallet top-up and subscription each call the bank SDK's make_transfer() themselves. Each one converts rupees to paise and reads the SDK's dict.",
      why: "The vendor's units and data shape leak into three places. Switching banks, or fixing a conversion, means editing every caller.",
      say: {
        what: "Here's the problem. Checkout, wallet top-up and subscription each call the bank's make transfer method themselves. Each one converts rupees to paise, and reads the bank's dictionary.",
        why: "The vendor's units and data shape leak into three places. Switching banks, or fixing a conversion, means editing every caller."
      },
      code: "problem",
      lines: { python: [12, 13, 17, 18, 22, 23], scala: [7, 8, 11, 12, 15, 16] },
      actions: [
        { show: ["raw"] },
        { members: "checkout", stagger: true,
          lines: ["checkout → make_transfer(inr * 100)", "wallet_top_up → make_transfer(inr * 100)", "subscription → make_transfer(inr)"],
          scalaLines: ["checkout → makeTransfer(inr * 100)", "walletTopUp → makeTransfer(inr * 100)", "subscription → makeTransfer(inr)"] },
        { flash: "checkout" },
        { shake: "checkout", together: true },
        { show: ["warn"], together: true }
      ]
    },
    {
      title: "One copy forgets the conversion",
      what: "subscription(199) sends 199 to the SDK instead of 19900 paise. The bank charges ₹1.99 and returns ref TX199INR.",
      why: "Copied translation code drifts apart. Nothing in the types stops a caller from passing rupees where paise are expected.",
      say: {
        what: "The subscription copy forgot to multiply by a hundred. It sends 199 to the bank, so the bank charges one rupee ninety-nine instead of 199 rupees.",
        why: "Copied translation code drifts apart, and nothing stops a caller from passing rupees where the bank expects paise."
      },
      code: "problem",
      lines: { python: [22, 23, 24, 29], scala: [15, 16, 17, 22] },
      actions: [
        { mark: "checkout", member: 2 },
        { call: ["checkout", "bank"], label: 'make_transfer(199, "INR")', scalaLabel: 'makeTransfer(199, "INR")', result: '"TX199INR"' },
        { flash: "bank" },
        { tag: "bank", text: "charged ₹1.99, not ₹199", together: true }
      ]
    },
    {
      title: "Write the interface your code wants",
      what: "PaymentGateway says what checkout needs: pay(amount_inr) returning a reference. Checkout now holds a PaymentGateway and calls only that.",
      why: "The client depends on your own small interface, not on the vendor's SDK (Dependency Inversion, Interface Segregation).",
      say: {
        what: "First we write the interface our own code wants, called payment gateway. It has one method, pay, which takes rupees and returns a reference. Checkout now holds a payment gateway and calls only that.",
        why: "The client depends on our own small interface, not on the vendor's software kit. That's dependency inversion."
      },
      code: "main",
      lines: { python: [5, 6, 7, 27, 28, 29, 31, 32], scala: [3, 4, 17, 18, 19] },
      actions: [
        { hide: ["warn"] },
        { mark: "checkout", member: null, together: true },
        { tag: "bank", text: null, together: true },
        { dim: ["raw"] },
        { show: ["iface"] },
        { members: "checkout", lines: ["- gateway: PaymentGateway", "+ complete(amount_inr): str"],
          scalaLines: ["- gateway: PaymentGateway", "+ complete(amountInr): String"] },
        { show: ["uses"] }
      ]
    },
    {
      title: "Wrap the SDK in an adapter",
      what: "The conversion code moves out of the callers into LegacyBankAdapter. It implements PaymentGateway and holds the LegacyBankApi it wraps.",
      why: "The SDK is not edited at all, and the translation now lives in one class (Single Responsibility).",
      say: {
        what: "The conversion code moves out of the callers into one new class, the legacy bank adapter. It implements payment gateway, and holds the bank's object that it wraps.",
        why: "The bank's code is not edited at all, and the translation now lives in one class. That's single responsibility."
      },
      code: "main",
      lines: { python: [15, 16, 17, 19, 20, 21], scala: [10, 11, 12, 13] },
      actions: [
        { spawn: ["adapter"], from: "checkout" },
        { hide: ["raw"], together: true },
        { show: ["r-adapter"] },
        { show: ["wraps"] }
      ]
    },
    {
      title: "On the way in: rupees become paise",
      what: "complete(499.50) calls pay(499.50) on the gateway. The adapter turns ₹499.50 into 49950 paise and calls make_transfer(49950, \"INR\").",
      why: "Checkout speaks rupees; the bank speaks paise. Only the adapter knows both languages.",
      say: {
        what: "Checkout completes an order of 499 rupees 50. It calls pay on the gateway. The adapter turns that into 49,950 paise, and calls the bank in the bank's own terms.",
        why: "Checkout speaks rupees, and the bank speaks paise. Only the adapter knows both languages."
      },
      code: "main",
      lines: { python: [19, 20, 21, 32, 36], scala: [11, 12, 13, 19, 23] },
      actions: [
        { call: PAY, label: "pay(₹499.50)" },
        { ring: "adapter" },
        { tag: "adapter", text: "₹499.50 → 49950 paise" },
        { call: ["adapter", "bank"], label: 'make_transfer(49950, "INR")', scalaLabel: 'makeTransfer(49950, "INR")',
          result: '{status: OK, ref: TX49950INR}' }
      ]
    },
    {
      title: "On the way out: the dict becomes a reference",
      what: "The adapter checks status is OK and returns just the ref string. Checkout builds \"Paid ₹499.50, reference TX49950INR\".",
      why: "Adapters translate results and errors too, so the vendor's data shape never reaches your code.",
      say: {
        what: "On the way back, the adapter checks that the status is OK, and returns just the reference string. Checkout builds its message: paid 499 rupees 50, reference T X 49950 I N R.",
        why: "Adapters translate results and errors too, so the vendor's data shape never reaches our code."
      },
      code: "main",
      lines: { python: [22, 23, 24, 32], scala: [14, 15, 19] },
      actions: [
        { tag: "adapter", text: "dict → \"TX49950INR\"" },
        { call: ["adapter", "iface", "checkout"], label: '"TX49950INR"' },
        { tag: "checkout", text: "Paid ₹499.50, reference TX49950INR" }
      ]
    },
    {
      title: "Every caller gets the conversion right",
      what: "complete(199) goes through the same adapter: 19900 paise, ref TX19900INR. The bug from the problem cannot happen any more.",
      why: "The conversion is written once, so no caller can forget it.",
      say: {
        what: "Now a 199 rupee payment goes through the same adapter. It becomes 19,900 paise, and the bank charges the right amount.",
        why: "The conversion is written once, so no caller can forget it."
      },
      code: "main",
      lines: { python: [20, 21, 37], scala: [12, 13, 24] },
      actions: [
        { tag: "checkout", text: null },
        { call: PAY, label: "pay(₹199)" },
        { tag: "adapter", text: "₹199 → 19900 paise" },
        { call: ["adapter", "bank"], label: 'make_transfer(19900, "INR")', scalaLabel: 'makeTransfer(19900, "INR")', result: '"TX19900INR"' },
        { pulse: "adapter" }
      ]
    },
    {
      title: "A new bank is one new adapter",
      what: "To move to another bank, write NewBankAdapter for its SDK and pass it to Checkout where the objects are wired. Checkout and the old SDK stay as they are.",
      why: "Checkout: 0 lines changed. New vendors are added, not edited in (Open/Closed).",
      say: {
        what: "To move to another bank, we write one new adapter for its kit, and hand it to Checkout where the objects are wired together. Checkout and the old bank code stay as they are.",
        why: "Checkout? Zero lines changed. New vendors are added, not edited in. That's the open-closed principle."
      },
      code: "main",
      lines: { python: [15, 35], scala: [10, 22] },
      actions: [
        { ring: null },
        { tag: "adapter", text: null, together: true },
        { show: ["next"] },
        { show: ["r-next"] },
        { show: ["ok"] },
        { pulse: "checkout", together: true }
      ]
    }
  ]
};

/* ---------- 1. SMS: two vendor adapters and a fallback that is itself an SmsSender ---------- */

const smsDiagram: DiagramSpec = {
  label: "send_otp uses SmsSender; QuickSmsAdapter and BharatTelAdapter implement it and wrap QuickSmsClient and BharatTelClient; FallbackSender implements it and tries a list of SmsSenders.",
  width: 760, height: 360, portraitWidth: 340, portraitHeight: 580,
  nodes: [
    { id: "client", kind: "client", name: "send_otp", hidden: true,
      at: { x: 16, y: 21, w: 130, h: 64 }, portrait: { x: 8, y: 14, w: 140, h: 64 } },
    { id: "iface", kind: "interface", name: "SmsSender", key: true, hidden: true,
      members: ["+ send(phone, text): bool"], scalaMembers: ["+ send(phone, text): Boolean"],
      at: { x: 270, y: 16, w: 230 }, portrait: { x: 40, y: 140, w: 260 } },
    { id: "fallback", kind: "concrete", name: "FallbackSender", hidden: true,
      members: ["- senders", "+ send(phone, text)"],
      at: { x: 16, y: 140, w: 210, h: 94 }, portrait: { x: 172, y: 10, w: 160, h: 94 } },
    { id: "quick", kind: "concrete", name: "QuickSmsAdapter", key: true, hidden: true,
      members: ["- client", "+ send(phone, text)"],
      at: { x: 270, y: 140, w: 220, h: 94 }, portrait: { x: 8, y: 256, w: 156, h: 94 } },
    { id: "bharat", kind: "concrete", name: "BharatTelAdapter", key: true, hidden: true,
      members: ["- client", "+ send(phone, text)"],
      at: { x: 520, y: 140, w: 224, h: 94 }, portrait: { x: 176, y: 256, w: 156, h: 94 } },
    { id: "qclient", kind: "concrete", name: "QuickSmsClient", hidden: true,
      members: ["+ send_message(to, body)"], scalaMembers: ["+ sendMessage(to, body)"],
      at: { x: 270, y: 274, w: 220 }, portrait: { x: 8, y: 392, w: 192 } },
    { id: "bclient", kind: "concrete", name: "BharatTelClient", hidden: true,
      members: ["+ dispatch(numbers, …)"],
      at: { x: 520, y: 274, w: 224 }, portrait: { x: 140, y: 482, w: 192 } }
  ],
  edges: [
    { id: "uses", from: "client", to: "iface", type: "association", hidden: true },
    { id: "r-fallback", from: "fallback", to: "iface", type: "realization", hidden: true },
    { id: "r-quick", from: "quick", to: "iface", type: "realization", hidden: true },
    { id: "r-bharat", from: "bharat", to: "iface", type: "realization", hidden: true },
    { id: "tries", from: "fallback", to: "iface", type: "aggregation", hidden: true,
      via: [[246, 170], [246, 78]], viaPortrait: [[318, 177]] },
    { id: "w-quick", from: "quick", to: "qclient", type: "association", hidden: true },
    { id: "w-bharat", from: "bharat", to: "bclient", type: "association", hidden: true }
  ]
};

const SMS_ALL = ["client", "iface", "fallback", "quick", "bharat", "qclient", "bclient"];
const SMS_EDGES = ["uses", "r-fallback", "r-quick", "r-bharat", "tries", "w-quick", "w-bharat"];
const SMS_TAGS: Action[] = ["client", "fallback", "quick", "bharat"].map((n) => ({ tag: n, text: null }));

const quickTry = (healthy: boolean): Action[] => [
  { call: ["fallback", "iface", "quick"], label: "send(phone, text)" },
  { call: ["quick", "qclient"], label: "send_message(to, body)", scalaLabel: "sendMessage(to, body)",
    result: healthy ? '"queued"' : '"error"' },
  ...(healthy ? [] : [{ flash: "quick" } as Action, { tag: "quick", text: "False" } as Action])
];

function smsTry(health: "up" | "down", phone: "in" | "uk"): TryResult {
  const number = phone === "in" ? "+919812345678" : "+447700900123";
  const start: Action[] = [...SMS_TAGS, { ring: "fallback" },
    { call: ["client", "iface", "fallback"], label: `send(${number}, …)` }];
  if (health === "up") {
    return {
      output: "delivered via QuickSms",
      note: "QuickSms is up and returns state \"queued\", so the fallback stops at the first adapter. QuickSms does not check the number format.",
      actions: [...start, { ring: "quick" }, ...quickTry(true), { call: ["fallback", "iface", "client"], label: "True" }, { tag: "client", text: "delivered" }]
    };
  }
  const local = phone === "in" ? "9812345678" : "+447700900123";
  const ok = phone === "in";
  return {
    output: ok ? "delivered via BharatTel" : "not delivered",
    note: ok
      ? "QuickSms returns \"error\", so the fallback tries BharatTel. Its adapter strips +91, leaving 10 digits, and BharatTel returns 200."
      : "QuickSms returns \"error\". BharatTel's adapter only strips +91, so +447700900123 stays 13 characters and BharatTel returns 400.",
    actions: [
      ...start, ...quickTry(false),
      { ring: "bharat" },
      { tag: "bharat", text: `sends ${local}` },
      { call: ["bharat", "bclient"], label: `dispatch([${local}], …)`, result: ok ? "200" : "400" },
      ...(ok ? [] : [{ flash: "bharat" } as Action]),
      { call: ["fallback", "iface", "client"], label: ok ? "True" : "False" },
      { tag: "client", text: ok ? "delivered" : "not delivered" }
    ]
  };
}

const sms: ExampleAnimation = {
  diagram: smsDiagram,
  walk: [
    [
      { show: SMS_ALL },
      { show: SMS_EDGES },
      { ring: "quick" },
      { call: ["client", "iface", "quick"], label: "send(+919812345678, …)" },
      { call: ["quick", "qclient"], label: "send_message(to, body)", scalaLabel: "sendMessage(to, body)", result: '"queued"' },
      { call: ["quick", "iface", "client"], label: "True" }
    ],
    [
      { ring: "fallback" },
      { call: ["client", "iface", "fallback"], label: "send(+919812345678, …)" },
      ...quickTry(false)
    ],
    [
      { tag: "fallback", text: "QuickSms failed" },
      { ring: "bharat" },
      { call: ["fallback", "iface", "bharat"], label: "send(+919812345678, …)" }
    ],
    [
      { tag: "bharat", text: "sends 9812345678" },
      { call: ["bharat", "bclient"], label: "dispatch([9812345678], …)", result: "200" },
      { tag: "fallback", text: "via BharatTel" }
    ],
    [
      { call: ["bharat", "iface", "fallback", "iface", "client"], label: "True" },
      { ring: "client" },
      { tag: "client", text: "delivered ×2" }
    ]
  ],
  tryIt: {
    prompt: "Send an OTP through the FallbackSender. Is QuickSms up, and which phone number do you use?",
    groups: [
      { label: "QuickSms", options: [{ id: "up", label: "Up" }, { id: "down", label: "Down" }] },
      { label: "Phone", options: [{ id: "in", label: "+91 98123 45678" }, { id: "uk", label: "+44 7700 900123" }] }
    ],
    results: {
      "up|in": smsTry("up", "in"),
      "up|uk": smsTry("up", "uk"),
      "down|in": smsTry("down", "in"),
      "down|uk": smsTry("down", "uk")
    }
  }
};

/* ---------- 2. Sensor: a class adapter that inherits the Fahrenheit probe ---------- */

const sensorDiagram: DiagramSpec = {
  label: "check_cold_room uses TemperatureSensor; NativeSensor implements it; ProbeAdapter implements it and inherits from LegacyFahrenheitProbe.",
  width: 760, height: 316, portraitWidth: 340, portraitHeight: 430,
  nodes: [
    { id: "client", kind: "client", name: "check_cold_room", hidden: true,
      at: { x: 16, y: 31, w: 150, h: 64 }, portrait: { x: 8, y: 14, w: 140, h: 64 } },
    { id: "iface", kind: "interface", name: "TemperatureSensor", key: true, hidden: true,
      members: ["+ sensor_id(): str", "+ celsius(): float"], scalaMembers: ["+ sensorId: String", "+ celsius: Double"],
      at: { x: 210, y: 16, w: 240 }, portrait: { x: 160, y: 10, w: 172 } },
    { id: "probe", kind: "concrete", name: "LegacyFahrenheitProbe", hidden: true,
      members: ["- serial", "+ read_f(): float"], scalaMembers: ["- serial", "+ readF(): Double"],
      at: { x: 510, y: 16, w: 234 }, portrait: { x: 120, y: 304, w: 212 } },
    { id: "native", kind: "concrete", name: "NativeSensor", hidden: true,
      members: ["- value_c: float", "+ celsius(): float"], scalaMembers: ["+ sensorId: String", "+ celsius: Double"],
      at: { x: 100, y: 180, w: 200 }, portrait: { x: 8, y: 160, w: 152 } },
    { id: "adapter", kind: "concrete", name: "ProbeAdapter", key: true, hidden: true,
      members: ["+ sensor_id(): str", "+ celsius(): float"], scalaMembers: ["+ sensorId: String", "+ celsius: Double"],
      at: { x: 380, y: 180, w: 264, h: 94 }, portrait: { x: 176, y: 160, w: 156, h: 94 } }
  ],
  edges: [
    { id: "uses", from: "client", to: "iface", type: "association", hidden: true },
    { id: "r-native", from: "native", to: "iface", type: "realization", hidden: true },
    { id: "r-adapter", from: "adapter", to: "iface", type: "realization", hidden: true },
    { id: "inherits", from: "adapter", to: "probe", type: "inheritance", hidden: true }
  ]
};

const SENSORS = {
  rack: { node: "native", id: "rack-A", f: null as number | null, c: 3.5 },
  f102: { node: "adapter", id: "probe-F102", f: 39.2, c: 4.0 },
  f207: { node: "adapter", id: "probe-F207", f: 46.4, c: 8.0 }
};

function sensorTry(which: keyof typeof SENSORS, max: 5 | 8): TryResult {
  const s = SENSORS[which];
  const status = s.c <= max ? "OK" : "ALERT";
  const c = s.c.toFixed(1);
  const reading: Action[] = s.f === null
    ? [{ call: ["client", "iface", "native"], label: "celsius()", result: c }]
    : [
        { call: ["client", "iface", "adapter"], label: "celsius()" },
        { call: ["adapter", "probe"], label: "read_f()", scalaLabel: "readF()", result: `${s.f}` },
        { tag: "adapter", text: `(${s.f} − 32) × 5/9 = ${c}` },
        { call: ["adapter", "iface", "client"], label: c }
      ];
  return {
    output: `${s.id}: ${c} °C ${status}`,
    note: s.f === null
      ? `NativeSensor already reports Celsius, so no conversion is needed. ${c} is ${status === "OK" ? "within" : "above"} the ${max} °C limit.`
      : `The probe reads ${s.f} °F; the adapter computes (${s.f} − 32) × 5/9 = ${c} °C, which is ${status === "OK" ? "within" : "above"} the ${max} °C limit.`,
    actions: [
      { tag: "adapter", text: null }, { tag: "client", text: null },
      { ring: s.node }, ...reading,
      ...(status === "ALERT" ? [{ flash: "client" } as Action] : []),
      { tag: "client", text: `${c} °C ${status}` }
    ]
  };
}

const sensor: ExampleAnimation = {
  diagram: sensorDiagram,
  walk: [
    [
      { show: ["client", "iface"] },
      { show: ["uses"] },
      { show: ["native", "adapter", "probe"] },
      { show: ["r-native", "r-adapter", "inherits"] },
      { tag: "client", text: "3 sensors" }
    ],
    [
      { ring: "native" },
      { call: ["client", "iface", "native"], label: "celsius()", result: "3.5" },
      { tag: "client", text: "3.5 °C OK" }
    ],
    [
      { ring: "adapter" },
      { call: ["client", "iface", "adapter"], label: "celsius()" },
      { call: ["adapter", "probe"], label: "read_f()", scalaLabel: "readF()", result: "39.2" },
      { tag: "adapter", text: "(39.2 − 32) × 5/9 = 4.0" },
      { call: ["adapter", "iface", "client"], label: "4.0" },
      { tag: "client", text: "4.0 °C OK" }
    ],
    [
      { ring: "adapter" },
      { call: ["client", "iface", "adapter"], label: "celsius()" },
      { call: ["adapter", "probe"], label: "read_f()", scalaLabel: "readF()", result: "46.4" },
      { tag: "adapter", text: "(46.4 − 32) × 5/9 = 8.0" },
      { call: ["adapter", "iface", "client"], label: "8.0" },
      { flash: "client" },
      { tag: "client", text: "8.0 °C ALERT", together: true }
    ],
    [
      { tag: "adapter", text: null },
      { ring: "probe" },
      { call: ["adapter", "probe"], label: "read_f()", scalaLabel: "readF()", result: "46.4" },
      { pulse: "adapter" }
    ]
  ],
  tryIt: {
    prompt: "Pick a sensor and the cold-room limit. The dashboard asks every sensor for celsius().",
    groups: [
      { label: "Sensor", options: [{ id: "rack", label: "rack-A (3.5 °C)" }, { id: "f102", label: "F102 (39.2 °F)" }, { id: "f207", label: "F207 (46.4 °F)" }] },
      { label: "Limit", options: [{ id: "5", label: "5 °C" }, { id: "8", label: "8 °C" }] }
    ],
    results: Object.fromEntries((["rack", "f102", "f207"] as const).flatMap((s) =>
      ([5, 8] as const).map((m) => [`${s}|${m}`, sensorTry(s, m)])))
  }
};

/* ---------- 3. Lab: translate the patient ID in, parse the pipe string out ---------- */

const labDiagram: DiagramSpec = {
  label: "print_summary uses LabResultSource; OldLabAdapter implements it, wraps OldLabSystem and creates LabResult values.",
  width: 760, height: 300, portraitWidth: 340, portraitHeight: 500,
  nodes: [
    { id: "client", kind: "client", name: "print_summary", hidden: true,
      at: { x: 16, y: 25, w: 150, h: 64 }, portrait: { x: 8, y: 14, w: 140, h: 64 } },
    { id: "iface", kind: "interface", name: "LabResultSource", key: true, hidden: true,
      members: ["+ results_for(patient_id)"], scalaMembers: ["+ resultsFor(patientId)"],
      at: { x: 210, y: 20, w: 260 }, portrait: { x: 8, y: 140, w: 230 } },
    { id: "result", kind: "enum", name: "LabResult", stereotype: "«value»", hidden: true,
      members: ["test, value, unit", "abnormal: bool"], scalaMembers: ["test, value, unit", "abnormal: Boolean"],
      at: { x: 520, y: 16, w: 224, h: 106 }, portrait: { x: 176, y: 10, w: 156, h: 106 } },
    { id: "adapter", kind: "concrete", name: "OldLabAdapter", key: true, hidden: true,
      members: ["- system", "+ results_for(patient_id)"], scalaMembers: ["- system", "+ resultsFor(patientId)"],
      at: { x: 210, y: 160, w: 260, h: 94 }, portrait: { x: 8, y: 260, w: 240, h: 94 } },
    { id: "old", kind: "concrete", name: "OldLabSystem", hidden: true,
      members: ["+ fetch_report(mrn): str"], scalaMembers: ["+ fetchReport(mrn): String"],
      at: { x: 520, y: 196, w: 224 }, portrait: { x: 8, y: 400, w: 232 } }
  ],
  edges: [
    { id: "uses", from: "client", to: "iface", type: "association", hidden: true },
    { id: "r-adapter", from: "adapter", to: "iface", type: "realization", hidden: true },
    { id: "wraps", from: "adapter", to: "old", type: "association", hidden: true },
    { id: "makes", from: "adapter", to: "result", type: "dependency", label: "creates", hidden: true,
      via: [[495, 69], [495, 180]], viaPortrait: [[268, 282]] }
  ]
};

const SEGMENTS = {
  hb: { seg: "HB|11.2|g/dL|L", out: "HB 11.2 g/dL, abnormal", flag: "L", abnormal: true },
  glu: { seg: "GLU|98|mg/dL|N", out: "GLU 98.0 mg/dL, normal", flag: "N", abnormal: false },
  wbc: { seg: "WBC|12.6|10^3/uL|H", out: "WBC 12.6 10^3/uL, abnormal", flag: "H", abnormal: true }
};

function labTry(id: keyof typeof SEGMENTS): TryResult {
  const s = SEGMENTS[id];
  const parts = s.seg.split("|");
  return {
    output: s.out,
    note: `The adapter splits "${s.seg}" on | into test, value, unit and flag. Flag ${s.flag} ${s.abnormal ? "is not N, so abnormal is true" : "means normal, so abnormal is false"}.`,
    actions: [
      { tag: "adapter", text: null }, { tag: "result", text: null }, { tag: "client", text: null },
      { ring: "adapter" },
      { call: ["adapter", "old"], label: "fetch_report(1042)", scalaLabel: "fetchReport(1042)", result: `"…${s.seg}…"` },
      { tag: "adapter", text: `flag ${s.flag}` },
      { call: ["adapter", "result"], label: `LabResult(${parts[0]}, …)` },
      { ring: "result" },
      { tag: "result", text: `abnormal = ${s.abnormal ? "True" : "False"}` },
      { mark: "result", member: 1 }
    ]
  };
}

const lab: ExampleAnimation = {
  diagram: labDiagram,
  walk: [
    [
      { show: ["client", "iface"] },
      { show: ["uses"] },
      { show: ["adapter", "old", "result"] },
      { show: ["r-adapter", "wraps", "makes"] },
      { call: ["client", "iface", "adapter"], label: 'results_for("PT-1042")', scalaLabel: 'resultsFor("PT-1042")' },
      { ring: "adapter" }
    ],
    [
      { tag: "adapter", text: "PT-1042 → mrn 1042" },
      { call: ["adapter", "old"], label: "fetch_report(1042)", scalaLabel: "fetchReport(1042)", result: '"HB|11.2|g/dL|L~…"' }
    ],
    [
      { tag: "adapter", text: "split on ~ → 3 tests" },
      { call: ["adapter", "result"], label: "LabResult(HB, 11.2, g/dL, …)" },
      { call: ["adapter", "result"], label: "LabResult(GLU, 98.0, mg/dL, …)" },
      { call: ["adapter", "result"], label: "LabResult(WBC, 12.6, 10^3/uL, …)" }
    ],
    [
      { ring: "result" },
      { mark: "result", member: 1 },
      { tag: "result", text: "HB, WBC abnormal" }
    ],
    [
      { mark: "result", member: null },
      { tag: "adapter", text: null },
      { call: ["adapter", "iface", "client"], label: "[3 LabResults]" },
      { ring: "client" },
      { tag: "client", text: "2 of 3 need review" }
    ]
  ],
  tryIt: {
    prompt: "Pick one test from the analyser's export and see the record the adapter builds.",
    groups: [
      { label: "Test", options: [{ id: "hb", label: "Haemoglobin" }, { id: "glu", label: "Glucose" }, { id: "wbc", label: "White cells" }] }
    ],
    results: { hb: labTry("hb"), glu: labTry("glu"), wbc: labTry("wbc") }
  }
};

/* ---------- 4. Ranking: the adaptee is an old comparator function ---------- */

const rankDiagram: DiagramSpec = {
  label: "sorted needs a key with < (Python) or an Ordering (Scala); RankKey / RankOrdering and the built-in cmp_to_key / fromLessThan both adapt the legacy_rank_cmp function.",
  width: 760, height: 370, portraitWidth: 340, portraitHeight: 474,
  nodes: [
    { id: "client", kind: "client", name: "sorted", hidden: true,
      at: { x: 16, y: 21, w: 140, h: 64 }, portrait: { x: 8, y: 14, w: 128, h: 64 } },
    { id: "iface", kind: "interface", name: "key / Ordering", key: true, hidden: true,
      members: ["+ __lt__(other): bool"], scalaMembers: ["+ compare(a, b): Int"],
      at: { x: 200, y: 16, w: 230 }, portrait: { x: 148, y: 10, w: 184 } },
    { id: "adapter", kind: "concrete", name: "RankKey / RankOrdering", key: true, hidden: true,
      members: ["+ __lt__(other): bool"], scalaMembers: ["+ compare(a, b): Int"],
      at: { x: 100, y: 124, w: 230 }, portrait: { x: 30, y: 124, w: 250 } },
    { id: "builtin", kind: "concrete", name: "cmp_to_key / fromLessThan", stereotype: "«built-in»", hidden: true,
      at: { x: 370, y: 124, w: 230 }, portrait: { x: 30, y: 222, w: 250 } },
    { id: "cmp", kind: "concrete", name: "legacy_rank_cmp", stereotype: "«function»", hidden: true,
      members: ["1. in stock first", "2. higher rating", "3. lower price"],
      at: { x: 220, y: 222, w: 260 }, portrait: { x: 30, y: 320, w: 250 } }
  ],
  edges: [
    { id: "uses", from: "client", to: "iface", type: "association", hidden: true },
    { id: "r-adapter", from: "adapter", to: "iface", type: "realization", hidden: true },
    { id: "r-builtin", from: "builtin", to: "iface", type: "realization", hidden: true, viaPortrait: [[310, 249]] },
    { id: "a-cmp", from: "adapter", to: "cmp", type: "association", hidden: true, viaPortrait: [[16, 377], [16, 155]] },
    { id: "b-cmp", from: "builtin", to: "cmp", type: "association", hidden: true }
  ]
};

const LISTINGS: Record<string, { name: string; price: number; inStock: boolean; rating: number }> = {
  kurta: { name: "Kurta", price: 1299, inStock: true, rating: 4.5 },
  saree: { name: "Saree", price: 1899, inStock: true, rating: 4.5 },
  watch: { name: "Watch", price: 999, inStock: true, rating: 4.1 },
  sneakers: { name: "Sneakers", price: 2499, inStock: false, rating: 4.8 }
};
type L = (typeof LISTINGS)[string];

/** Same rules as legacy_rank_cmp in ex4-ranking.py; returns the result and which rule decided (0, 1, 2). */
function legacyCmp(a: L, b: L): [number, number] {
  if (a.inStock !== b.inStock) return [a.inStock ? -1 : 1, 0];
  if (a.rating !== b.rating) return [a.rating > b.rating ? -1 : 1, 1];
  return [Math.sign(a.price - b.price), 2];
}

function rankTry(x: string, y: string): TryResult {
  const a = LISTINGS[x], b = LISTINGS[y];
  const [r, rule] = legacyCmp(a, b);
  const why = [
    `${a.inStock ? a.name : b.name} is in stock and ${a.inStock ? b.name : a.name} is not`,
    `${a.name} is rated ${a.rating} and ${b.name} ${b.rating}`,
    `both are rated ${a.rating}; ${a.name} costs ₹${a.price} and ${b.name} ₹${b.price}`
  ][rule];
  const output = r === 0 ? "0: same listing, a tie" : r < 0 ? `-1: ${a.name} ranks first` : `1: ${b.name} ranks first`;
  return {
    output,
    note: r === 0
      ? "Every rule ties, so the comparator returns 0 and RankKey's < answers False."
      : `${why[0].toUpperCase()}${why.slice(1)}, so the comparator returns ${r} and ${a.name} < ${b.name} is ${r < 0 ? "True" : "False"}.`,
    actions: [
      { tag: "client", text: null },
      { ring: "adapter" },
      { call: ["client", "iface", "adapter"], label: `${a.name} < ${b.name}?`, scalaLabel: `compare(${a.name}, ${b.name})` },
      { call: ["adapter", "cmp"], label: `cmp(${a.name}, ${b.name})`, result: String(r) },
      { mark: "cmp", member: r === 0 ? null : rule },
      { call: ["adapter", "iface", "client"], label: r < 0 ? "True" : "False", scalaLabel: String(r) }
    ]
  };
}

const RANK_IDS = ["kurta", "saree", "watch", "sneakers"];
const RANK_OPTS = RANK_IDS.map((id) => ({ id, label: LISTINGS[id].name }));

const ranking: ExampleAnimation = {
  diagram: rankDiagram,
  walk: [
    [
      { show: ["client", "iface"] },
      { show: ["uses"] },
      { show: ["adapter", "builtin", "cmp"] },
      { show: ["r-adapter", "r-builtin", "a-cmp", "b-cmp"] },
      { tag: "client", text: "4 listings" }
    ],
    [
      { ring: "adapter" },
      { call: ["client", "iface", "adapter"], label: "Kurta < Saree?", scalaLabel: "compare(Kurta, Saree)" },
      { call: ["adapter", "cmp"], label: "cmp(Kurta, Saree)", result: "-1" },
      { call: ["adapter", "iface", "client"], label: "True", scalaLabel: "-1" }
    ],
    [
      { ring: "cmp" },
      { mark: "cmp", member: 0 },
      { wait: 0.6 },
      { mark: "cmp", member: 1 },
      { wait: 0.6 },
      { mark: "cmp", member: 2 }
    ],
    [
      { mark: "cmp", member: null },
      { ring: "client" },
      { tag: "client", text: "Kurta … Sneakers" }
    ],
    [
      { ring: "builtin" },
      { call: ["client", "iface", "builtin", "cmp"], label: "cmp_to_key(legacy_rank_cmp)", scalaLabel: "fromLessThan(cmp < 0)" },
      { tag: "client", text: "same order: True" }
    ]
  ],
  tryIt: {
    prompt: "sorted() asks the adapter whether one listing comes before another. Pick the two listings.",
    groups: [
      { label: "First", options: RANK_OPTS },
      { label: "Second", options: RANK_OPTS }
    ],
    results: Object.fromEntries(RANK_IDS.flatMap((a) => RANK_IDS.map((b) => [`${a}|${b}`, rankTry(a, b)])))
  }
};

const animation: PatternAnimation = {
  slug: "adapter",
  story: storyAnim,
  examples: { sms, sensor, lab, ranking },
  sequence: {
    label: "The app wires Checkout to a LegacyBankAdapter; complete(499.50) calls pay on the adapter, which converts to paise, calls make_transfer on LegacyBankApi and turns the dict into a reference.",
    participants: [
      { id: "app", name: "App", kind: "client" },
      { id: "checkout", name: "checkout: Checkout", kind: "client" },
      { id: "adapter", name: "adapter: LegacyBankAdapter", kind: "concrete" },
      { id: "api", name: ": LegacyBankApi", kind: "concrete" }
    ],
    messages: [
      { from: "app", to: "adapter", label: "LegacyBankAdapter(LegacyBankApi())", kind: "create" },
      { from: "app", to: "checkout", label: "Checkout(adapter)", kind: "create" },
      { from: "app", to: "checkout", label: "complete(499.50)" },
      { from: "checkout", to: "adapter", label: "pay(499.50)" },
      { from: "adapter", to: "adapter", label: "499.50 × 100 → 49950 paise", kind: "self" },
      { from: "adapter", to: "api", label: 'make_transfer(49950, "INR")' },
      { from: "api", to: "adapter", label: '{"ref": "TX49950INR", …}', kind: "return" },
      { from: "adapter", to: "checkout", label: '"TX49950INR"', kind: "return" },
      { from: "checkout", to: "app", label: '"Paid ₹499.50, reference …"', kind: "return" }
    ]
  }
};

export default animation;
