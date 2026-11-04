import type { Comparison } from "../../extras/types";
import strategyPy from "./code/strategy.py?raw";
import strategyScala from "./code/Strategy.scala?raw";
import statePy from "./code/state.py?raw";
import stateScala from "./code/State.scala?raw";

const comparison: Comparison = {
  id: "strategy-vs-state",
  title: "Strategy vs State",
  tagline: "Both put behaviour in small classes behind one interface and delegate to the one being held, so their class diagrams look almost the same.",
  scenario: "A ceiling fan runs at some speed. In the first version a remote control picks the speed directly. In the second, the fan has a pull chain: each pull moves it to the next speed (Off, Low, High, back to Off).",
  decidingQuestion: "Who decides when the behaviour changes: the code outside the object, or the object's own current state?",
  sides: [
    {
      slug: "strategy",
      oneLiner: "The remote control (the client) chooses a Speed and hands it to the Fan; the Fan just uses whatever it was given.",
      code: { python: strategyPy, scala: strategyScala },
      uml: {
        classes: [
          { name: "Speed", kind: "interface", members: ["+ rpm(): int"] },
          { name: "Low", kind: "concrete", members: ["+ rpm(): int"] },
          { name: "High", kind: "concrete", members: ["+ rpm(): int"] },
          { name: "Fan", kind: "concrete", members: ["- speed: Speed", "+ set_speed(s)", "+ run(): str"] }
        ],
        relations: [
          { from: "Low", to: "Speed", type: "realization" },
          { from: "High", to: "Speed", type: "realization" },
          { from: "Fan", to: "Speed", type: "association" }
        ]
      },
      howItWorks: [
        "The client creates a Low speed and passes it into the Fan.",
        "fan.run() asks the held Speed for its rpm and prints it.",
        "The client calls set_speed(High()) whenever it wants; the Fan never changes speed on its own.",
        "Low and High don't know each other: they are interchangeable options."
      ],
      pickWhen: [
        "The caller (a user setting, a config, a request) picks the algorithm.",
        "The options are independent: none of them knows which one comes next.",
        "You want to add a new option without touching the class that uses it."
      ]
    },
    {
      slug: "state",
      oneLiner: "The Fan starts Off, and each state decides which state the next pull of the chain leads to.",
      code: { python: statePy, scala: stateScala },
      uml: {
        classes: [
          { name: "FanState", kind: "interface", members: ["+ rpm(): int", "+ pull(): FanState"] },
          { name: "Off", kind: "concrete", members: ["+ pull(): FanState"] },
          { name: "Low", kind: "concrete", members: ["+ pull(): FanState"] },
          { name: "High", kind: "concrete", members: ["+ pull(): FanState"] },
          { name: "Fan", kind: "concrete", members: ["- state: FanState", "+ pull_chain()", "+ run(): str"] }
        ],
        relations: [
          { from: "Off", to: "FanState", type: "realization" },
          { from: "Low", to: "FanState", type: "realization" },
          { from: "High", to: "FanState", type: "realization" },
          { from: "Fan", to: "FanState", type: "composition" }
        ]
      },
      howItWorks: [
        "The Fan creates its first state, Off, itself.",
        "pull_chain() asks the current state for the next one and stores it.",
        "Off returns Low, Low returns High, High returns Off: the rules live in the states.",
        "The same call (pull_chain) does something different each time, because the state changed."
      ],
      pickWhen: [
        "An object moves through stages, and the same action means something different in each stage.",
        "You see one status field checked with if/elif in many methods.",
        "The rules for 'what comes next' belong to the stages, not to the caller."
      ]
    }
  ],
  table: [
    { aspect: "Who chooses the behaviour", values: ["The client, from outside (set_speed)", "The current state, from inside (pull returns the next state)"] },
    { aspect: "When it changes", values: ["Whenever the client calls the setter, maybe never", "On every action that triggers a transition"] },
    { aspect: "Do the classes know each other?", values: ["No: Low and High are unaware of each other", "Yes: each state names the state that comes next"] },
    { aspect: "Where the first one comes from", values: ["Passed into the constructor", "Usually created by the context itself (starts in Off)"] },
    { aspect: "What varies", values: ["How one job is done (an algorithm)", "How the whole object behaves in each stage of its life"] },
    { aspect: "Smell it fixes", values: ["if/elif on an option or setting chosen by the caller", "if/elif on a status field, repeated in many methods"] }
  ],
  mixups: [
    "Calling it State when nothing ever changes the state: if the client always sets it and no state returns another, it is Strategy. Look for a method in a state class that returns or sets another state.",
    "Calling it Strategy when the 'strategies' pick their successor: if Low returns High, the objects are stages, not options. That is State.",
    "Putting the transitions back in the context: a State context with if state == Low: state = High has the old status checks again. Let each state return its own next state.",
    "Making the Strategy context create its own strategy (self._speed = Low() inside Fan): it is locked to one option. Accept it as a parameter instead."
  ],
  quiz: [
    {
      type: "mcq", tag: "Concept", prompt: "In the fan example, what is the clearest difference between the two versions?",
      options: [
        "Strategy uses an interface, State does not",
        "In State, each state returns the next state; in Strategy, the client picks the speed",
        "State needs more classes, so it is always better",
        "Strategy can only have two options"
      ],
      answer: 1,
      hint: "Look at what pull() returns and who calls set_speed().",
      explain: "In the State version, Off returns Low, Low returns High, and so on: the states drive the change. In the Strategy version, only the client calls set_speed. Both versions use an interface, the number of classes is not the point, and Strategy can have any number of options."
    },
    {
      type: "mcq", tag: "Which pattern?",
      prompt: "A video app lets the user choose a compression method (fast, balanced, small file) in the settings. The encoder uses whatever was chosen. Which pattern fits?",
      options: ["Strategy", "State", "Observer"],
      answer: 0,
      hint: "Does a compression method ever decide to switch to another one by itself?",
      explain: "The user picks the method from outside and the methods are independent options, so it is Strategy. State would fit if the encoder moved through stages on its own. Observer is about notifying listeners, which this scenario doesn't need."
    },
    {
      type: "mcq", tag: "Which pattern?",
      prompt: "A turnstile is Locked until a coin goes in, then Unlocked until someone walks through, then Locked again. 'push' does nothing when locked. Which pattern fits?",
      options: ["Strategy", "State", "Template Method", "Adapter"],
      answer: 1,
      hint: "Does the same action (push) behave differently depending on what happened before?",
      explain: "The turnstile moves itself between Locked and Unlocked, and push means something different in each: State. Strategy would need a client to choose the behaviour. Template Method fixes the order of steps, and Adapter converts an interface; neither changes behaviour over time."
    },
    {
      type: "bug", tag: "Find the problem", prompt: "This is meant to be the State version. Tap the line that puts the transition rules in the wrong place.",
      code: { lang: "python", text: `class Fan:
    def __init__(self) -> None:
        self._state: FanState = Off()

    def pull_chain(self) -> None:
        if isinstance(self._state, Off):
            self._state = Low()
        else:
            self._state = self._state.pull()` },
      answer: 6,
      hint: "Which line makes the Fan check which state it is in?",
      explain: "Line 6 checks the type of the current state inside the context. That is the if/elif the pattern removes: Off should return Low from its own pull(), and the Fan should just call self._state.pull()."
    },
    {
      type: "order", tag: "Put in order", prompt: "Put the steps of fan.pull_chain() (State version, fan currently Low) in order.",
      steps: [
        "The user calls fan.pull_chain()",
        "Fan calls pull() on its current state, Low",
        "Low creates and returns a High state",
        "Fan stores High as its new state",
        "The next fan.run() reports 1200 rpm"
      ],
      shuffled: [2, 0, 4, 1, 3],
      hint: "The Fan asks first; the state answers; only then is the new state stored.",
      explain: "The context forwards the action to the current state, the state decides and returns the next one, and the context stores it. Only after that does run() use the new state."
    }
  ]
};

export default comparison;
