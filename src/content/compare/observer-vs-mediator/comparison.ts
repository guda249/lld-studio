import type { Comparison } from "../../extras/types";
import observerPy from "./code/observer.py?raw";
import observerScala from "./code/Observer.scala?raw";
import mediatorPy from "./code/mediator.py?raw";
import mediatorScala from "./code/Mediator.scala?raw";

const comparison: Comparison = {
  id: "observer-vs-mediator",
  title: "Observer vs Mediator",
  tagline: "Both stop objects from calling each other directly and route messages through something in the middle, so they are easy to confuse.",
  scenario: "A smart home has a motion sensor, a light and an alarm. When the sensor sees motion, other devices should react. First every listener simply hears the news; then the home gets rules: light when someone is home, alarm when we are away, and the light flashes when the alarm rings.",
  decidingQuestion: "Is one object broadcasting news to whoever listens, or does a central object decide how several objects work together?",
  sides: [
    {
      slug: "observer",
      oneLiner: "The MotionSensor keeps a list of MotionListeners and tells every one of them when it sees motion.",
      code: { python: observerPy, scala: observerScala },
      uml: {
        classes: [
          { name: "MotionSensor", kind: "concrete", members: ["- listeners: list[MotionListener]", "+ subscribe(l)", "+ unsubscribe(l)", "+ detect()"] },
          { name: "MotionListener", kind: "interface", members: ["+ on_motion(room)"] },
          { name: "Light", kind: "concrete", members: ["+ on_motion(room)"] },
          { name: "Alarm", kind: "concrete", members: ["+ on_motion(room)"] }
        ],
        relations: [
          { from: "MotionSensor", to: "MotionListener", type: "aggregation" },
          { from: "Light", to: "MotionListener", type: "realization" },
          { from: "Alarm", to: "MotionListener", type: "realization" }
        ]
      },
      howItWorks: [
        "The client subscribes a Light and an Alarm to the sensor.",
        "detect() loops over the list and calls on_motion on each listener.",
        "The sensor doesn't know what a Light or an Alarm is, and the listeners don't know each other.",
        "Unsubscribing the Alarm changes who hears the news, not what the sensor does."
      ],
      pickWhen: [
        "One object changes and an open-ended list of others wants to know.",
        "Listeners react on their own; no listener depends on another one's reaction.",
        "Listeners should be added or removed at runtime without editing the source of the news."
      ]
    },
    {
      slug: "mediator",
      oneLiner: "SmartHome holds every device; devices only report to it, and it decides who reacts and how.",
      code: { python: mediatorPy, scala: mediatorScala },
      uml: {
        classes: [
          { name: "HomeHub", kind: "interface", members: ["+ on_event(sender, event)"] },
          { name: "SmartHome", kind: "concrete", members: ["+ away: bool", "+ on_event(sender, event)"] },
          { name: "Device", kind: "concrete", members: ["- hub: HomeHub"] },
          { name: "MotionSensor", kind: "concrete", members: ["+ detect()"] },
          { name: "Light", kind: "concrete", members: ["+ turn_on(why)"] },
          { name: "Alarm", kind: "concrete", members: ["+ ring()"] }
        ],
        relations: [
          { from: "SmartHome", to: "HomeHub", type: "realization" },
          { from: "Device", to: "HomeHub", type: "association" },
          { from: "MotionSensor", to: "Device", type: "inheritance" },
          { from: "Light", to: "Device", type: "inheritance" },
          { from: "Alarm", to: "Device", type: "inheritance" },
          { from: "SmartHome", to: "MotionSensor", type: "composition" },
          { from: "SmartHome", to: "Light", type: "composition" },
          { from: "SmartHome", to: "Alarm", type: "composition" }
        ]
      },
      howItWorks: [
        "SmartHome creates the devices and gives each one a link to itself.",
        "The sensor reports 'motion' to the hub; it doesn't know which device will react.",
        "The hub checks its rules: at home it turns on the light, away it rings the alarm.",
        "The alarm reports back to the hub, and the hub flashes the light: a chain no device knows about."
      ],
      pickWhen: [
        "Several objects would otherwise call each other in a tangled web.",
        "The reaction depends on rules or on the state of several objects (away mode, who sent it).",
        "You want the coordination logic in one place, so the devices stay simple and reusable."
      ]
    }
  ],
  table: [
    { aspect: "Direction of messages", values: ["One-way: one subject to many listeners", "Many-way: any device to the hub, the hub to any device"] },
    { aspect: "Where the logic lives", values: ["In each listener (its own reaction)", "In the mediator (the rules for everyone)"] },
    { aspect: "Who knows whom", values: ["Subject knows only the listener interface", "Devices know only the hub; the hub knows every device"] },
    { aspect: "Does the middle decide anything?", values: ["No: the same news goes to everyone on the list", "Yes: it picks who reacts, based on the event and the state"] },
    { aspect: "Who connects the parts", values: ["The client, by subscribing at runtime", "The mediator, which usually creates or registers the devices"] },
    { aspect: "Smell it fixes", values: ["A class that calls every interested object by name", "A web of objects that all call each other directly"] }
  ],
  mixups: [
    "Calling it Observer when the 'subject' decides which listener gets what (if event == 'motion' and away: alarm.ring()): that routing with rules is a Mediator.",
    "Calling it Mediator when the middle just loops over a list and calls everyone the same way: that is Observer (or an event bus). A mediator holds rules, not only a list.",
    "Letting colleagues call each other next to the mediator (the alarm keeps a Light and calls it directly): the web is back. Every message between devices should go through the hub.",
    "Growing a mediator into a 'god object' that also does each device's job: the hub should decide WHO acts, and each device should still do its OWN work."
  ],
  quiz: [
    {
      type: "mcq", tag: "Concept", prompt: "In the smart home, what does the mediator version add that the observer version doesn't have?",
      options: [
        "A list of listeners",
        "Rules that decide which device reacts, depending on the situation",
        "An interface for the devices",
        "The ability to print messages"
      ],
      answer: 1,
      hint: "Look at SmartHome.on_event. What does it check before calling anyone?",
      explain: "SmartHome checks the event and the away flag before deciding who acts: that coordination is the mediator's job. The observer version also has a list and an interface, and both can print."
    },
    {
      type: "mcq", tag: "Which pattern?",
      prompt: "A stock price object should tell a chart, a log and a phone notifier whenever the price changes. Each of them reacts on its own. Which pattern fits?",
      options: ["Observer", "Mediator", "Command"],
      answer: 0,
      hint: "Is there one source of news, and does any reaction depend on another?",
      explain: "One subject broadcasts the same news to independent listeners: Observer. A Mediator would be needed only if the reactions had to be coordinated, and Command wraps a request as an object."
    },
    {
      type: "mcq", tag: "Which pattern?",
      prompt: "In a booking form, choosing 'one-way' must hide the return-date field, and ticking 'flexible dates' must disable the calendar but only if a date was already picked. Which pattern keeps the widgets from calling each other?",
      options: ["Observer", "Mediator", "Decorator", "Strategy"],
      answer: 1,
      hint: "Several widgets affect several others, and the rules depend on more than one widget.",
      explain: "Many widgets influence each other under rules: a form dialog as Mediator holds the widgets and applies the rules. Observer alone would wire each widget to the others. Decorator adds behaviour by wrapping, and Strategy swaps one algorithm."
    },
    {
      type: "bug", tag: "Find the problem", prompt: "This is meant to be the Mediator version. Tap the line that brings back a direct link between devices.",
      code: { lang: "python", text: `class Alarm(Device):
    def __init__(self, hub: HomeHub, light: Light) -> None:
        super().__init__(hub)
        self._light = light

    def ring(self) -> None:
        print("Alarm: ringing")
        self._light.turn_on("alarm")` },
      answer: 8,
      hint: "Which call skips the hub?",
      explain: "Line 8 calls the Light directly, so the Alarm is tied to the Light again and the hub can't apply its rules. Report to the hub instead, with self._hub.on_event(self, 'alarm'), and let the hub decide. (Line 4 stores the link that makes this possible; removing the call removes the need for it.)"
    },
    {
      type: "order", tag: "Put in order", prompt: "Put the steps in order when the sensor sees motion while we are away (Mediator version).",
      steps: [
        "MotionSensor.detect() reports 'motion' to the hub",
        "SmartHome sees that away is true and calls alarm.ring()",
        "The Alarm rings and reports 'alarm' to the hub",
        "SmartHome calls light.turn_on to flash for the alarm"
      ],
      shuffled: [2, 0, 3, 1],
      hint: "Every message goes to the hub first; the hub decides the next step.",
      explain: "The sensor only talks to the hub, the hub applies its away rule, the alarm reports back to the hub, and the hub decides that the light should flash. No device ever calls another device."
    }
  ]
};

export default comparison;
