import type { PatternLesson } from "../../types";
import problemPy from "./code/problem.py?raw";
import problemScala from "./code/problem.scala?raw";
import mainPy from "./code/main.py?raw";
import mainScala from "./code/main.scala?raw";
import idiomaticPy from "./code/idiomatic.py?raw";
import idiomaticScala from "./code/idiomatic.scala?raw";
import ex1Py from "./code/ex1-atc.py?raw";
import ex1Scala from "./code/ex1-atc.scala?raw";
import ex2Py from "./code/ex2-form.py?raw";
import ex2Scala from "./code/ex2-form.scala?raw";
import ex3Py from "./code/ex3-auction.py?raw";
import ex3Scala from "./code/ex3-auction.scala?raw";
import ex4Py from "./code/ex4-smarthome.py?raw";
import ex4Scala from "./code/ex4-smarthome.scala?raw";

const lesson: PatternLesson = {
  slug: "mediator",
  analogy:
    "A group chat. Members do not keep each other's numbers or forward messages one by one; they post to the group, and the group delivers to everyone (or to one person for a direct message).",
  problem: {
    text: "When N users message each other directly, each user holds a link to all the others: N x (N-1) links. A rule such as \"muted users do not receive messages\" ends up copied into every user class, and adding one user means touching all of them.",
    code: { python: problemPy, scala: problemScala },
  },
  solution:
    "Users (the colleagues) hold a link only to the mediator, here a ChatRoom. They call room.send(...) and the room decides who receives it. Many-to-many links become many-to-one, and every interaction rule lives in one place.",
  participants: [
    { role: "Mediator", name: "ChatMediator", kind: "interface", description: "The communication interface colleagues talk to." },
    { role: "Concrete mediator", name: "ChatRoom", kind: "concrete", description: "Knows all members and holds the routing rules: broadcast, direct message, muting." },
    { role: "Colleague", name: "Member", kind: "concrete", description: "Knows only its mediator. Sends through it and receives from it, never calls another member." },
    { role: "Client", name: "mediatorDemo", kind: "client", description: "Creates the room, lets members join and sets rules such as mute." },
  ],
  code: { python: mainPy, scala: mainScala },
  idiomatic: {
    note: "An event bus (publish/subscribe by topic) is a generic, reusable mediator: senders and listeners share only topic names. In UIs, a form controller that enables or disables fields based on other fields is a mediator, often just a class with a few callbacks.",
    code: { python: idiomaticPy, scala: idiomaticScala },
  },
  realWorldUses: [
    "Air-traffic control: planes coordinate through the tower, not with each other.",
    "Chat servers and multiplayer game servers.",
    "UI dialog controllers and MVC controllers coordinating widgets.",
    "In-process event buses and message brokers coordinating services.",
  ],
  whenToUse: [
    "Many objects interact in complex, changing ways and direct references create a tangle.",
    "You want to reuse components elsewhere without dragging their peers along.",
    "Interaction rules (routing, muting, ordering, priority) should live in one place.",
  ],
  whenNotToUse: [
    "Only two or three objects with simple, stable interactions.",
    "The mediator starts holding all the business logic and becomes a god object; split it by feature instead.",
  ],
  pros: [
    "Colleagues are decoupled and reusable; communication rules have one home (Single Responsibility).",
    "New interaction rules change only the mediator.",
    "Fewer links: each colleague knows one object instead of all the others.",
  ],
  cons: [
    "The mediator can grow very large and hard to change.",
    "It is a single point of failure: if it breaks, nobody can talk.",
  ],
  confusedWith: [
    { name: "Observer", difference: "Observer is one subject notifying its subscribers. Mediator coordinates many-to-many interactions and holds the rules; it is often built using observers." },
    { name: "Facade", difference: "Facade simplifies a subsystem for outsiders, and the subsystem classes do not know it exists. Colleagues do know their mediator and talk to it." },
  ],
  solid:
    "Single Responsibility (interaction logic in one place), Open/Closed (new colleagues without changing the others), Dependency Inversion (colleagues depend on the ChatMediator interface).",
  interviewUses: [
    "Chat application",
    "Air-traffic control",
    "Auction system (bidders talk through the auctioneer)",
    "Smart-home hub coordinating devices",
    "Elevator controller coordinating cars and floor requests",
  ],
  examples: [
    {
      id: "atc",
      domain: "Aviation",
      title: "Air-traffic control tower",
      situation:
        "Several planes want the same runway. If each plane had to ask every other plane before landing, every pilot would need to know every flight, and a low-fuel emergency would need everyone to agree.",
      roles: [
        { role: "Mediator", name: "Tower" },
        { role: "Colleague", name: "Plane" },
        { role: "Client", name: "atcDemo" },
      ],
      why: "Planes talk only to the tower. The tower owns the one-runway rule and the landing queue, so a new rule like emergency priority is added in one class.",
      goodToKnow:
        "The tower here is also a state holder (who is on the runway). Keep such state inside the mediator so colleagues cannot get out of sync.",
      walkthrough: [
        "AI101 asks to land; the runway is free, so the tower clears it.",
        "6E202 and UK303 ask next and are told to hold, numbers 1 and 2.",
        "SG404 reports low fuel, so the tower puts it at the front of the queue.",
        "When AI101 vacates the runway, the tower clears SG404 first.",
        "When SG404 vacates, 6E202 is cleared; no plane ever spoke to another plane.",
      ],
      code: { python: ex1Py, scala: ex1Scala },
    },
    {
      id: "form",
      domain: "Web UI",
      title: "Signup form with linked fields",
      situation:
        "A signup form has a \"business account\" checkbox. When ticked, the GSTIN field must turn on, and Submit should work only when the GSTIN has 15 characters. Wiring each widget to the others makes the widgets impossible to reuse.",
      roles: [
        { role: "Mediator", name: "FormMediator" },
        { role: "Concrete mediator", name: "SignupForm" },
        { role: "Colleague", name: "TextField, Checkbox, Button" },
        { role: "Client", name: "formDemo" },
      ],
      why: "Widgets only say \"I changed\" to the form. The form holds every \"if this changes, update that\" rule, so TextField and Checkbox stay generic and reusable on any page.",
      goodToKnow:
        "This is the classic GoF dialog example and how most UI form controllers work. Re-checking all rules on every change is simple and safe; optimise only if the form gets large.",
      walkthrough: [
        "The form creates its widgets and applies the rules once: Submit starts disabled.",
        "Typing a name enables Submit, since a personal account needs no GSTIN.",
        "Ticking business account turns the GSTIN field on and disables Submit again.",
        "Typing a 15-character GSTIN satisfies the rule, so Submit is enabled.",
        "Clicking Submit now works.",
      ],
      code: { python: ex2Py, scala: ex2Scala },
    },
    {
      id: "auction",
      domain: "E-commerce",
      title: "Online auction",
      situation:
        "An online auction must reject bids that are too low, tell the previous top bidder they were outbid, and announce the winner. If bidders messaged each other, every bidder would need a list of all the others.",
      roles: [
        { role: "Mediator", name: "AuctionHouse" },
        { role: "Colleague", name: "Bidder" },
        { role: "Client", name: "auctionDemo" },
      ],
      why: "Bidders send bids only to the auction house, which checks the minimum step and notifies the right people. Changing a rule, such as the step size, touches only the mediator.",
      goodToKnow:
        "In a real system bids arrive at the same time from many users, so the mediator must handle them one at a time (a lock or a queue) to avoid two winners.",
      walkthrough: [
        "Three bidders register with the auction house for a ₹100000 start and ₹5000 step.",
        "Asha opens at ₹100000; Ravi's ₹102000 is rejected because the minimum is ₹105000.",
        "Ravi bids ₹105000 and the house tells Asha she was outbid.",
        "Kabir and then Asha raise the price, and each time only the previous leader is told.",
        "On close, Asha hears she won at ₹125000 and the others hear who won.",
      ],
      code: { python: ex3Py, scala: ex3Scala },
    },
    {
      id: "smarthome",
      domain: "IoT",
      title: "Smart-home hub",
      situation:
        "A home has a door lock, a window sensor, a hall light and an AC. Rules like \"do not run the AC while the window is open\" link devices from different brands that cannot talk to each other.",
      roles: [
        { role: "Mediator", name: "Hub" },
        { role: "Colleague", name: "Device (front door, window, hall light, AC)" },
        { role: "Client", name: "smartHomeDemo" },
      ],
      why: "Devices only report events to the hub and obey its commands. All cross-device rules sit in one match statement, so adding a device or a rule never touches the other devices.",
      goodToKnow:
        "Watch for loops: if the hub switches a device and that device reports the change back as a new event, the hub must not react to it again forever.",
      walkthrough: [
        "The hub registers itself with all four devices.",
        "The window opens; the hub notes it and keeps the AC off.",
        "The door is unlocked: the hub turns the hall light on but keeps the AC off because the window is open.",
        "The window closes and someone is home, so the hub turns the AC on.",
        "An unknown event gets no rule, and locking the door turns both the light and the AC off.",
      ],
      code: { python: ex4Py, scala: ex4Scala },
    },
  ],
};

export default lesson;
