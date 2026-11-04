import type { PatternLesson } from "../../types";
import problemPy from "./code/problem.py?raw";
import problemScala from "./code/problem.scala?raw";
import mainPy from "./code/main.py?raw";
import mainScala from "./code/main.scala?raw";
import idiomaticPy from "./code/idiomatic.py?raw";
import idiomaticScala from "./code/idiomatic.scala?raw";
import ex1Py from "./code/ex1-order.py?raw";
import ex1Scala from "./code/ex1-order.scala?raw";
import ex2Py from "./code/ex2-sensor.py?raw";
import ex2Scala from "./code/ex2-sensor.scala?raw";
import ex3Py from "./code/ex3-auction.py?raw";
import ex3Scala from "./code/ex3-auction.scala?raw";
import ex4Py from "./code/ex4-bus.py?raw";
import ex4Scala from "./code/ex4-bus.scala?raw";

const lesson: PatternLesson = {
  slug: "observer",
  analogy:
    "Subscribing to a YouTube channel with the bell on. You do not keep checking the channel; when a new video is published, every subscriber is notified. The creator does not know who you are individually.",
  problem: {
    text: "StockTicker calls the price display and the price alert directly every time a price changes. The ticker depends on every consumer by name, so adding a mobile push service or an analytics recorder means editing the ticker again.",
    code: { python: problemPy, scala: problemScala },
  },
  solution:
    "Consumers implement a small Observer interface with one update() method and subscribe to the subject. The subject keeps a list of subscribers and, when its state changes, calls update() on each one. It knows only the interface, never the concrete classes, and subscribers can join or leave at runtime.",
  participants: [
    { role: "Subject", name: "StockTicker", kind: "concrete", description: "Keeps the list of observers, offers subscribe() and unsubscribe(), and notifies every observer when a price changes." },
    { role: "Observer", name: "Observer", kind: "interface", description: "The single method update(symbol, price) that every subscriber must provide." },
    { role: "Concrete observer", name: "PriceDisplay, PriceAlert", kind: "concrete", description: "React to updates in their own way: one prints the price, the other records when a threshold is crossed." },
    { role: "Client", name: "Demo code", kind: "client", description: "Creates the ticker, wires up the observers and pushes new prices." },
  ],
  code: { python: mainPy, scala: mainScala },
  idiomatic: {
    note: "Observers are often just callbacks. subscribe() takes a function and returns another function that unsubscribes it, so no Observer class is needed. For whole streams of events, reactive libraries such as RxPY, fs2 or Akka Streams take the same idea much further.",
    code: { python: idiomaticPy, scala: idiomaticScala },
  },
  realWorldUses: [
    "GUI and browser DOM event listeners (addEventListener).",
    "Django signals such as post_save, and model-view updates in MVC frameworks.",
    "Reactive streams (RxJava, RxPY) and state stores in front-end frameworks.",
    "The distributed version, publish/subscribe, with Kafka, Amazon SNS or Redis pub/sub.",
  ],
  whenToUse: [
    "A change in one object must trigger reactions in others, and the list of reactions keeps growing.",
    "You want the publisher to stay unaware of who is listening.",
    "Listeners need to be added or removed while the program runs.",
  ],
  whenNotToUse: [
    "There is exactly one fixed consumer: a direct method call is clearer.",
    "The order of reactions, or keeping everything consistent in one transaction, really matters and is hard to guarantee across observers.",
  ],
  pros: [
    "Add subscribers without changing the publisher (Open/Closed); the two sides are loosely coupled.",
    "Subscribers can be added and removed at runtime.",
  ],
  cons: [
    "Notification order is not guaranteed, and chains of updates triggering more updates can be hard to debug.",
    "Memory leaks if observers are never unsubscribed, a common bug in UIs.",
  ],
  confusedWith: [
    { name: "Mediator", difference: "Mediator puts many-to-many rules in one central object; Observer is a one-to-many broadcast with no rules about what listeners do." },
    { name: "Publish/Subscribe", difference: "In pub/sub a broker sits in the middle, so publishers and subscribers do not even know each other exist; in classic Observer the subject holds its subscribers directly." },
  ],
  solid:
    "Open/Closed (new observers without changing the subject), Dependency Inversion (the subject depends on the Observer interface, not concrete classes) and Single Responsibility (each observer handles one reaction).",
  interviewUses: [
    "Stock price alerts and weather station displays.",
    "Notification systems (SMS, email, push).",
    "Auction bidding updates.",
    "Order status tracking: notify the customer and the seller when the status changes.",
  ],
  examples: [
    {
      id: "order",
      domain: "Food delivery",
      title: "Order status updates",
      situation:
        "When a food order moves from preparing to picked up to delivered, the customer needs an SMS, the restaurant's kitchen screen needs to update and the analytics team wants counts. The order class kept growing a new call for each team.",
      roles: [
        { role: "Subject", name: "Order" },
        { role: "Observer", name: "OrderListener" },
        { role: "Concrete observer", name: "CustomerSms, RestaurantScreen, DeliveryStats" },
        { role: "Client", name: "Demo code" },
      ],
      why: "Each team owns one listener and decides for itself which statuses it cares about. The order only announces the change, so a new team plugs in without touching Order.",
      goodToKnow:
        "This is the push model: the subject sends the data (order id and status) with the notification. It is simple, but every observer receives the same fields whether it needs them or not.",
      walkthrough: [
        "Three listeners subscribe to order BLR-4471.",
        "The order moves to PREPARING; only the customer SMS reacts out loud, and the stats count it.",
        "On PICKED_UP the kitchen screen also reacts, because it filters for that status.",
        "On DELIVERED the customer gets a final SMS.",
        "The stats listener has counted one of each status.",
      ],
      code: { python: ex1Py, scala: ex1Scala },
    },
    {
      id: "sensor",
      domain: "IoT / Smart home",
      title: "Smart thermostat",
      situation:
        "A room sensor sends a temperature reading every few seconds. The air conditioner and the phone app both need it, but sending repeated identical readings floods the app and wears out the AC relay.",
      roles: [
        { role: "Subject", name: "TemperatureSensor" },
        { role: "Observer", name: "SensorObserver" },
        { role: "Concrete observer", name: "AirConditioner, AppTile" },
        { role: "Client", name: "Demo code" },
      ],
      why: "The sensor broadcasts a change once and each device decides what to do. Here the observers receive the sensor itself and read (pull) only the fields they need.",
      goodToKnow:
        "Notify only on a real change. Skipping duplicate readings in the subject stops useless updates from rippling through every observer.",
      walkthrough: [
        "The AC and the app tile attach to the bedroom sensor.",
        "A reading of 26.5°C updates the app tile; the AC stays off.",
        "At 28.5°C the AC switches on.",
        "A second 28.5°C reading is ignored because nothing changed.",
        "29°C only updates the tile; at 25°C the AC switches off and the tile shows the new value.",
      ],
      code: { python: ex2Py, scala: ex2Scala },
    },
    {
      id: "auction",
      domain: "Online marketplace",
      title: "Auto-bidders in an auction",
      situation:
        "An auction site lets buyers set an auto-bid with a budget. Each auto-bidder must hear about every new bid, bid again if it can afford to, and drop out when the price passes its budget.",
      roles: [
        { role: "Subject", name: "Auction" },
        { role: "Observer", name: "Bidder" },
        { role: "Concrete observer", name: "AutoBidder" },
        { role: "Client", name: "Demo code" },
      ],
      why: "Bidders come and go during the auction, which is exactly what subscribe and unsubscribe are for. The auction does not need any bidding logic of its own.",
      goodToKnow:
        "Observers here change the subject while being notified, which triggers nested notifications. Loop over a copy of the list, and let the subject ignore stale actions, such as a bid that is no longer higher.",
      walkthrough: [
        "Meera (budget ₹26,000) and Kabir (budget ₹30,000) watch the sitar auction.",
        "Ravi bids ₹21,000 and both auto-bidders are notified.",
        "Meera bids ₹23,000, then Kabir answers with ₹24,500.",
        "Meera cannot add ₹2,000 within her budget, so she unsubscribes in the middle of the notification loop.",
        "Older notifications that arrive late are ignored, and Kabir wins at ₹24,500.",
      ],
      code: { python: ex3Py, scala: ex3Scala },
    },
    {
      id: "bus",
      domain: "Developer tools",
      title: "CI event bus",
      situation:
        "A CI system must tell the chat channel and the on-call pager when a build fails, and write to a deploy log when a release goes out. The CI runner should not import the chat, pager or logging code.",
      roles: [
        { role: "Subject", name: "EventBus" },
        { role: "Observer", name: "Handler (a function)" },
        { role: "Concrete observer", name: "chat_notifier, pager, deploy_log" },
        { role: "Client", name: "CI runner (demo code)" },
      ],
      why: "This is the publish/subscribe flavour: subscribers register for a topic name on a bus, and the publisher only knows the bus. Neither side holds a reference to the other.",
      goodToKnow:
        "Catch errors around each handler. Without that, one broken subscriber (here, the pager) would stop every subscriber after it from hearing the event.",
      walkthrough: [
        "Two handlers subscribe to build.failed and one to deploy.done.",
        "The CI runner publishes build.failed for payments-api on main.",
        "The chat notifier posts the failure; the pager throws an error, which the bus catches and logs.",
        "Publishing deploy.done reaches only the deploy log.",
        "Publishing a topic nobody subscribed to does nothing at all.",
      ],
      code: { python: ex4Py, scala: ex4Scala },
    },
  ],
};

export default lesson;
