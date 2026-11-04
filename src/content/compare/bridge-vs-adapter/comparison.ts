import type { Comparison } from "../../extras/types";
import bridgePy from "./code/bridge.py?raw";
import bridgeScala from "./code/Bridge.scala?raw";
import adapterPy from "./code/adapter.py?raw";
import adapterScala from "./code/Adapter.scala?raw";

const comparison: Comparison = {
  id: "bridge-vs-adapter",
  title: "Bridge vs Adapter",
  tagline: "Both put an interface between a class and the code that does the low-level work, so their class diagrams look nearly the same.",
  scenario:
    "A shop sends alerts (an outage notice, a bill reminder) by SMS or email. Every alert goes out through a Channel interface with send(to, text). " +
    "In the Bridge version we design both sides from the start; in the Adapter version a vendor's SMS class must be fitted in later.",
  decidingQuestion: "Are you designing two things that vary separately before they exist, or making an existing class fit an interface you already have?",
  sides: [
    {
      slug: "bridge",
      oneLiner: "Alert (what to say) and Channel (how to send) are two separate hierarchies joined by the channel field.",
      code: { python: bridgePy, scala: bridgeScala },
      uml: {
        classes: [
          { name: "Alert", kind: "abstract", members: ["# channel: Channel", "+ deliver(to)"] },
          { name: "OutageAlert", kind: "concrete", members: ["+ deliver(to)"] },
          { name: "BillReminder", kind: "concrete", members: ["+ deliver(to)"] },
          { name: "Channel", kind: "interface", members: ["+ send(to, text)"] },
          { name: "SmsChannel", kind: "concrete", members: ["+ send(to, text)"] },
          { name: "EmailChannel", kind: "concrete", members: ["+ send(to, text)"] }
        ],
        relations: [
          { from: "Alert", to: "Channel", type: "association" },
          { from: "OutageAlert", to: "Alert", type: "inheritance" },
          { from: "BillReminder", to: "Alert", type: "inheritance" },
          { from: "SmsChannel", to: "Channel", type: "realization" },
          { from: "EmailChannel", to: "Channel", type: "realization" }
        ]
      },
      howItWorks: [
        "The client picks one alert and one channel: OutageAlert(SmsChannel()).",
        "The alert decides the words, then calls send() on the channel it was given.",
        "Two alerts and two channels give four combinations from four classes; a third channel adds one class, not two."
      ],
      pickWhen: [
        "Two things vary on their own (what and how), and one class per combination would explode.",
        "You are designing both sides now, and both will grow.",
        "The client should pick the pairing at runtime."
      ]
    },
    {
      slug: "adapter",
      oneLiner: "BulkSmsAdapter makes the vendor's BulkSmsGateway fit the Channel interface that Alert already uses.",
      code: { python: adapterPy, scala: adapterScala },
      uml: {
        classes: [
          { name: "Alert", kind: "concrete", members: ["- channel: Channel", "+ deliver(to, text)"] },
          { name: "Channel", kind: "interface", members: ["+ send(to, text)"] },
          { name: "EmailChannel", kind: "concrete", members: ["+ send(to, text)"] },
          { name: "BulkSmsAdapter", kind: "concrete", members: ["- gateway: BulkSmsGateway", "+ send(to, text)"] },
          { name: "BulkSmsGateway", kind: "concrete", members: ["+ push(msisdn, payload)"] }
        ],
        relations: [
          { from: "Alert", to: "Channel", type: "association" },
          { from: "EmailChannel", to: "Channel", type: "realization" },
          { from: "BulkSmsAdapter", to: "Channel", type: "realization" },
          { from: "BulkSmsAdapter", to: "BulkSmsGateway", type: "association" }
        ]
      },
      howItWorks: [
        "Alert and Channel already exist; Alert only ever calls send().",
        "The vendor's BulkSmsGateway wants push(msisdn, payload) and answers with a status code.",
        "BulkSmsAdapter implements Channel: it strips the phone number, builds the payload, calls push() and turns 202 into \"sent\"."
      ],
      pickWhen: [
        "The class you need already exists (a library, a vendor SDK, old code) and you can't change it.",
        "Your code already depends on an interface, and you want it to stay untouched.",
        "The work is translation: names, argument shapes, units, return values."
      ]
    }
  ],
  table: [
    { aspect: "When you use it", values: ["Up front, while designing", "Afterwards, to fit in a class that already exists"] },
    { aspect: "What varies", values: ["Two hierarchies: kinds of alert and kinds of channel", "Nothing new on our side; one foreign class is made to fit"] },
    { aspect: "Who knows whom", values: ["Alert knows Channel; channels know nothing about alerts", "Alert knows Channel; the adapter knows the vendor class"] },
    { aspect: "How many classes behind the interface", values: ["Several, written for this interface", "One adapter per foreign class"] },
    { aspect: "Does the wrapped code change?", values: ["You write both sides yourself", "Never: the vendor class stays as it is"] },
    { aspect: "Typical smell it fixes", values: ["One class per combination (SmsOutageAlert, EmailOutageAlert…)", "Vendor names and formats spread through your code"] }
  ],
  mixups: [
    "Calling it a Bridge when there is only one class on the abstraction side (just Alert): that is a Strategy, or an Adapter if the channel wraps a foreign class.",
    "Writing classes like SmsOutageAlert and EmailBillReminder and then \"adapting\" between them: the real fix is a Bridge, splitting the two things that vary.",
    "An adapter that adds its own business rules (which alerts may go by SMS) is doing more than translating. Keep those decisions in Alert.",
    "In a Bridge, a channel that keeps a reference back to its Alert ties the two sides together again. The bridge goes one way, from abstraction to implementation."
  ],
  quiz: [
    {
      type: "mcq", tag: "Concept", prompt: "Which sentence best tells Bridge and Adapter apart?",
      options: [
        "Bridge is planned up front to let two hierarchies grow separately; Adapter is added later to make an existing class fit",
        "Bridge wraps one foreign class; Adapter joins two hierarchies",
        "Adapter always needs two abstract classes; Bridge needs none",
        "Bridge is used only for user interfaces; Adapter only for databases"
      ],
      answer: 0,
      hint: "Think about when each one is written: before the classes exist, or after?",
      explain: "Bridge is a design decision you make early, so the 'what' and the 'how' can each grow. Adapter is a fix you add later, so an existing class fits an interface you already use. Option 2 swaps them, and the other two are not true."
    },
    {
      type: "mcq", tag: "Which pattern?",
      prompt: "You are starting a drawing app. Shapes (circle, square, star) must render on screen, to PDF and to SVG, and both lists will grow. Which pattern keeps the class count small?",
      options: ["Adapter", "Bridge", "Template Method", "Facade"],
      answer: 1,
      hint: "Count the classes if you write one per shape and output combination.",
      explain: "Shapes and outputs vary separately, and you are designing both now: Bridge. Shape holds a Renderer, so 3 shapes and 3 renderers need 6 classes, not 9. Adapter fits an existing class; Template Method and Facade don't split two dimensions."
    },
    {
      type: "mcq", tag: "Scenario",
      prompt: "Your Storage interface has save(key, data). The company buys a cloud library whose only class has upload(bucket, path, bytes, metadata). Which pattern fits?",
      options: ["Bridge", "Adapter", "Strategy"],
      answer: 1,
      hint: "The interface exists, the class exists, and they don't match.",
      explain: "An existing interface and an existing class that doesn't fit it: write an adapter that implements Storage and calls upload(). Bridge is a design choice for two hierarchies; Strategy swaps algorithms you write yourself."
    },
    {
      type: "bug", tag: "Find the problem",
      prompt: "This is meant to be a Bridge between alerts and channels. Tap the line that welds the two sides together.",
      code: { lang: "python", text: `class Alert(ABC):
    def __init__(self, channel: Channel) -> None:
        self._channel = channel


class OutageAlert(Alert):
    def __init__(self) -> None:
        super().__init__(SmsChannel())

    def deliver(self, to: str) -> str:
        return self._channel.send(to, "Payments are down.")` },
      answer: 8,
      hint: "Who should choose the channel: the alert or the client?",
      explain: "Line 8 makes OutageAlert create its own SmsChannel, so it can never go by email: you are back to one class per combination. Take the Channel as a constructor parameter and let the client choose."
    }
  ]
};

export default comparison;
