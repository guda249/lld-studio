import type { Comparison } from "../../extras/types";
import facadePy from "./code/facade.py?raw";
import facadeScala from "./code/Facade.scala?raw";
import adapterPy from "./code/adapter.py?raw";
import adapterScala from "./code/Adapter.scala?raw";

const comparison: Comparison = {
  id: "facade-vs-adapter",
  title: "Facade vs Adapter",
  tagline: "Both put a class of your own in front of someone else's code, so from the outside they look like the same wrapper.",
  scenario:
    "Our shop's Checkout must send each parcel with a courier company, using the courier's SDK (a library they give us). " +
    "Checkout wants one call: ship(order_id, weight_kg, pincode). Both versions below give it that call, for different reasons.",
  decidingQuestion: "Is the problem that there are too many classes to call, or that the one class you need has the wrong interface?",
  sides: [
    {
      slug: "facade",
      oneLiner: "ShippingFacade hides a three-step SDK flow (price, label, pickup) behind one simple ship() call.",
      code: { python: facadePy, scala: facadeScala },
      uml: {
        classes: [
          { name: "Checkout", kind: "concrete", members: ["+ complete(order_id, weight_kg, pincode)"] },
          { name: "ShippingFacade", kind: "concrete", members: ["+ ship(order_id, weight_kg, pincode)"] },
          { name: "RateCard", kind: "concrete", members: ["+ price(grams, pincode)"] },
          { name: "LabelPrinter", kind: "concrete", members: ["+ print_label(order_id, pincode)"] },
          { name: "PickupScheduler", kind: "concrete", members: ["+ book_pickup(label)"] }
        ],
        relations: [
          { from: "Checkout", to: "ShippingFacade", type: "association" },
          { from: "ShippingFacade", to: "RateCard", type: "association" },
          { from: "ShippingFacade", to: "LabelPrinter", type: "association" },
          { from: "ShippingFacade", to: "PickupScheduler", type: "association" }
        ]
      },
      howItWorks: [
        "Checkout calls ship() on ShippingFacade, and nothing else.",
        "ShippingFacade converts kilograms to grams, then calls RateCard, LabelPrinter and PickupScheduler in the right order.",
        "The SDK classes don't know the facade exists, so an admin screen can still use them directly."
      ],
      pickWhen: [
        "A library makes you call several classes in a fixed order to do one common job.",
        "Many callers repeat the same multi-step sequence, and you want it written once.",
        "You define a new, smaller interface of your own; nothing in your code expected one before."
      ]
    },
    {
      slug: "adapter",
      oneLiner: "QuickCourierAdapter makes the courier's one SDK class fit the Shipper interface that Checkout already uses.",
      code: { python: adapterPy, scala: adapterScala },
      uml: {
        classes: [
          { name: "Checkout", kind: "concrete", members: ["+ complete(order_id, weight_kg, pincode)"] },
          { name: "Shipper", kind: "interface", members: ["+ ship(order_id, weight_kg, pincode)"] },
          { name: "QuickCourierAdapter", kind: "concrete", members: ["- client: QuickCourierClient", "+ ship(order_id, weight_kg, pincode)"] },
          { name: "QuickCourierClient", kind: "concrete", members: ["+ create_consignment(ref, grams, pin)"] }
        ],
        relations: [
          { from: "Checkout", to: "Shipper", type: "association" },
          { from: "QuickCourierAdapter", to: "Shipper", type: "realization" },
          { from: "QuickCourierAdapter", to: "QuickCourierClient", type: "association" }
        ]
      },
      howItWorks: [
        "Checkout holds a Shipper and calls ship(); it has never heard of QuickCourierClient.",
        "QuickCourierAdapter implements Shipper and translates the call: kilograms to grams, the pincode to a number, ship to create_consignment.",
        "It turns the SDK's reply (a dictionary) back into the text Checkout expects."
      ],
      pickWhen: [
        "Your code already depends on an interface, and the class you must use doesn't match it.",
        "You may switch to another courier later: write one more adapter, and Checkout stays the same.",
        "The job is translation (names, units, data formats), not running several steps."
      ]
    }
  ],
  table: [
    { aspect: "The problem it solves", values: ["Too many classes and steps to call for one job", "One class whose interface doesn't match what your code expects"] },
    { aspect: "Interface", values: ["Defines a new, simpler one", "Implements an existing one (the target)"] },
    { aspect: "How many objects it wraps", values: ["Several (RateCard, LabelPrinter, PickupScheduler)", "Usually one (QuickCourierClient)"] },
    { aspect: "Who knows whom", values: ["Checkout knows the facade; the facade knows the SDK classes", "Checkout knows only Shipper; the adapter knows the SDK class"] },
    { aspect: "Swapping the library", values: ["Edit the facade's body", "Add a new adapter; Checkout doesn't change"] },
    { aspect: "Typical smell it fixes", values: ["The same three calls copied into every caller", "SDK names and units leaking into your business code"] }
  ],
  mixups: [
    "Calling a class a facade when it wraps one class and implements an interface you already had: that is an Adapter. Check for a base class or trait the wrapper implements.",
    "An \"adapter\" that calls price, label and pickup in sequence is doing a facade's job too. That's fine, but name it for what it does, and keep the step order out of Checkout.",
    "A facade that returns the SDK objects (for example get_rate_card()) lets callers talk to the SDK again. Look for methods that hand out a field.",
    "Writing an adapter with no target interface (Checkout holds the adapter's concrete type): you lose the main benefit, swapping couriers without touching Checkout."
  ],
  quiz: [
    {
      type: "mcq", tag: "Concept", prompt: "What is the main difference between a Facade and an Adapter?",
      options: [
        "A Facade simplifies a group of classes with a new interface; an Adapter makes one class fit an interface that already exists",
        "A Facade can only wrap one class; an Adapter can wrap many",
        "A Facade changes the subsystem's code; an Adapter never does",
        "There is no difference; they are two names for the same pattern"
      ],
      answer: 0,
      hint: "Ask whether the interface the caller sees was there before the wrapper was written.",
      explain: "A Facade invents a smaller interface over several classes. An Adapter implements an interface your code already expects and translates to one existing class. A facade usually wraps many classes, and neither pattern edits the wrapped code."
    },
    {
      type: "mcq", tag: "Which pattern?",
      prompt: "Your app logs through a Logger trait with info(msg). The company now requires a vendor library whose only class has write(level: Int, text: String). Which pattern lets the rest of the app keep calling info()?",
      options: ["Facade", "Adapter", "Bridge", "Decorator"],
      answer: 1,
      hint: "Is there an interface the app already uses? How many vendor classes are involved?",
      explain: "There is an existing interface (Logger) and one class that doesn't match it, so you write an adapter that implements Logger and calls write(). A facade would invent a new interface over several classes; Bridge and Decorator solve other problems."
    },
    {
      type: "mcq", tag: "Scenario",
      prompt: "To publish a video, every screen calls Transcoder, ThumbnailMaker, CdnUploader and Notifier in that order, and two screens got the order wrong. Which pattern fits best?",
      options: ["Adapter", "Facade", "Command", "Strategy"],
      answer: 1,
      hint: "The problem is not a wrong interface. It's a sequence repeated by many callers.",
      explain: "Several classes, a fixed order, and many callers copying it: a Facade with one publish() method fixes that. An adapter translates one interface; Command and Strategy don't address a repeated sequence."
    },
    {
      type: "bug", tag: "Find the problem",
      prompt: "This was meant to be an adapter, so Checkout can switch couriers later. Tap the line that stops that.",
      code: { lang: "python", text: `class QuickCourierAdapter(Shipper):
    def __init__(self, client: QuickCourierClient) -> None:
        self._client = client


class Checkout:
    def __init__(self, shipper: QuickCourierAdapter) -> None:
        self._shipper = shipper` },
      answer: 7,
      hint: "Which type should Checkout depend on: the target or one concrete wrapper?",
      explain: "Line 7 types the field as QuickCourierAdapter, so Checkout can only work with that one courier. Type it as Shipper (the target) so any adapter fits. Lines 1–3 are a correct adapter."
    },
    {
      type: "order", tag: "Put in order", prompt: "Put the steps of checkout.complete(\"A101\", 1.2, \"560001\") in the Facade version in order.",
      steps: [
        "Checkout calls ship() on ShippingFacade",
        "ShippingFacade asks RateCard for the price",
        "ShippingFacade asks LabelPrinter for a label",
        "ShippingFacade books a pickup with PickupScheduler",
        "Checkout gets back one line of text"
      ],
      shuffled: [2, 0, 4, 3, 1],
      hint: "The facade needs the label before it can book the pickup.",
      explain: "Checkout makes a single call; the facade runs price, label and pickup in a fixed order (the pickup needs the label) and returns one result. That ordering is exactly what the facade keeps out of Checkout."
    }
  ]
};

export default comparison;
