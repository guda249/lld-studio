import type { Comparison } from "../../extras/types";
import decoratorPy from "./code/decorator.py?raw";
import decoratorScala from "./code/Decorator.scala?raw";
import proxyPy from "./code/proxy.py?raw";
import proxyScala from "./code/Proxy.scala?raw";
import adapterPy from "./code/adapter.py?raw";
import adapterScala from "./code/Adapter.scala?raw";

const comparison: Comparison = {
  id: "decorator-vs-proxy-vs-adapter",
  title: "Decorator vs Proxy vs Adapter",
  tagline: "All three are wrappers: one object holds another and passes calls to it, so from the outside they look the same.",
  scenario: "An app asks a WeatherService for the temperature in a city, in Celsius. We add rounding and logging (Decorator), avoid asking the slow weather station twice (Proxy), and plug in an old library that speaks Fahrenheit and station codes (Adapter).",
  decidingQuestion: "Does the wrapper add behaviour on top, control access to the same thing, or turn one interface into a different one?",
  sides: [
    {
      slug: "decorator",
      oneLiner: "Rounded and Logged each add one small extra around any WeatherService, and the client stacks them in any order.",
      code: { python: decoratorPy, scala: decoratorScala },
      uml: {
        classes: [
          { name: "WeatherService", kind: "interface", members: ["+ temperature(city): float"] },
          { name: "StationWeather", kind: "concrete", members: ["+ temperature(city): float"] },
          { name: "Rounded", kind: "concrete", members: ["- inner: WeatherService", "+ temperature(city): float"] },
          { name: "Logged", kind: "concrete", members: ["- inner: WeatherService", "+ temperature(city): float"] }
        ],
        relations: [
          { from: "StationWeather", to: "WeatherService", type: "realization" },
          { from: "Rounded", to: "WeatherService", type: "realization" },
          { from: "Logged", to: "WeatherService", type: "realization" }
        ]
      },
      howItWorks: [
        "The client builds a stack: Logged(Rounded(StationWeather())).",
        "Each layer always calls the one inside it, then adds its extra (round the number, print a log line).",
        "Changing the order changes the result: in the second stack the log sees the raw value 7.12.",
        "Every layer is a WeatherService, so the client can't tell how many layers there are."
      ],
      pickWhen: [
        "You want optional extras that can be combined freely (logging, retries, rounding, compression).",
        "Writing one subclass per combination would explode the number of classes.",
        "Every call should still reach the real object."
      ]
    },
    {
      slug: "proxy",
      oneLiner: "CachingWeather stands in for the real station and decides whether a call reaches it at all.",
      code: { python: proxyPy, scala: proxyScala },
      uml: {
        classes: [
          { name: "WeatherService", kind: "interface", members: ["+ temperature(city): float"] },
          { name: "StationWeather", kind: "concrete", members: ["+ temperature(city): float"] },
          { name: "CachingWeather", kind: "concrete", members: ["- real: WeatherService", "- cache: dict", "+ temperature(city): float"] }
        ],
        relations: [
          { from: "StationWeather", to: "WeatherService", type: "realization" },
          { from: "CachingWeather", to: "WeatherService", type: "realization" }
        ]
      },
      howItWorks: [
        "The client gets a CachingWeather, typed as WeatherService, and never knows it isn't the real one.",
        "The first request for Paris goes through to the station and is saved in the cache.",
        "The second request for Paris is answered from the cache: the station is not asked.",
        "There is one proxy in front of one real object; it is not meant to be stacked."
      ],
      pickWhen: [
        "You need to control access to an object: cache, check permission, create it lazily, or limit calls.",
        "The proxy may decide NOT to call the real object.",
        "Callers must keep using the same interface without any change."
      ]
    },
    {
      slug: "adapter",
      oneLiner: "FahrenheitAdapter lets the app use an old Fahrenheit library as if it were a normal WeatherService.",
      code: { python: adapterPy, scala: adapterScala },
      uml: {
        classes: [
          { name: "WeatherService", kind: "interface", members: ["+ temperature(city): float"] },
          { name: "FahrenheitFeed", kind: "concrete", members: ["+ read_f(station_code): float"] },
          { name: "FahrenheitAdapter", kind: "concrete", members: ["- feed: FahrenheitFeed", "+ temperature(city): float"] },
          { name: "WeatherApp", kind: "concrete", members: ["- service: WeatherService", "+ report(city): str"] }
        ],
        relations: [
          { from: "FahrenheitAdapter", to: "WeatherService", type: "realization" },
          { from: "FahrenheitAdapter", to: "FahrenheitFeed", type: "association" },
          { from: "WeatherApp", to: "WeatherService", type: "association" }
        ]
      },
      howItWorks: [
        "FahrenheitFeed has a different method (read_f) that wants a station code and answers in Fahrenheit.",
        "FahrenheitAdapter implements WeatherService and holds the feed.",
        "temperature('Paris') turns the city into 'LFPG', calls read_f, and converts the answer to Celsius.",
        "WeatherApp only knows WeatherService, so it never sees the old library's interface."
      ],
      pickWhen: [
        "You must use an existing class whose interface doesn't match what your code expects.",
        "You can't (or don't want to) change that class: it's a library or old code.",
        "You want the translation (names, units, formats) in one place instead of at every call site."
      ]
    }
  ],
  table: [
    { aspect: "Interface outside vs inside", values: ["The same on both sides", "The same on both sides", "Different: target outside, adaptee inside"] },
    { aspect: "What the wrapper does", values: ["Adds behaviour, always forwards", "Controls access, may not forward", "Translates names, units and formats"] },
    { aspect: "How many wrappers", values: ["Several, stacked in any order", "Usually one, in front of the real object", "One per foreign class"] },
    { aspect: "Who builds the wrapping", values: ["The client, choosing which extras to stack", "Often hidden from the client (a factory or setup code)", "Setup code, once, when wiring the app"] },
    { aspect: "Is the wrapped thing the real one?", values: ["Anything of the same type, even another decorator", "The one real object it stands in for", "A class from another world (library, old code)"] },
    { aspect: "Smell it fixes", values: ["A subclass for every mix of features", "Every caller repeating the same check or cache", "Conversion code copied around every call to a library"] }
  ],
  mixups: [
    "Calling it a Decorator when the wrapper sometimes skips the real call (a cache, a permission check): that is a Proxy. Look for a branch that returns without calling the inner object.",
    "Calling it an Adapter when the wrapper and the wrapped object have the same interface: an adapter must change the interface. If the methods match, it is a Decorator or a Proxy.",
    "Making a decorator hold a concrete class (inner: StationWeather): it can no longer wrap another decorator, so stacking breaks. Type the field as the interface.",
    "Letting the app call the old library next to the adapter: if WeatherApp still names FahrenheitFeed, the adapter is skipped and the conversion is copied again."
  ],
  quiz: [
    {
      type: "mcq", tag: "Concept", prompt: "Which wrapper changes the interface the caller sees?",
      options: ["Decorator", "Proxy", "Adapter"],
      answer: 2,
      hint: "Compare the methods outside the wrapper with the methods of the thing inside it.",
      explain: "Only the Adapter has a different interface inside (read_f, Fahrenheit, station codes) and outside (temperature, Celsius, cities). Decorator and Proxy keep the same interface on both sides."
    },
    {
      type: "mcq", tag: "Which pattern?",
      prompt: "Image thumbnails are expensive to load. You want a stand-in object that loads the real image only the first time someone draws it. Which pattern is this?",
      options: ["Decorator", "Proxy", "Adapter", "Strategy"],
      answer: 1,
      hint: "Is something being added, translated, or is access to the real object being controlled?",
      explain: "Creating the real object only when first needed is access control: a virtual Proxy. A Decorator always forwards to an object that already exists, an Adapter translates a foreign interface, and Strategy picks between algorithms."
    },
    {
      type: "mcq", tag: "Which pattern?",
      prompt: "A payment library has charge_cents(amount_in_cents, currency_code). Your shop code calls pay(amount: Decimal). You write a class that implements pay by calling charge_cents. Which pattern?",
      options: ["Adapter", "Proxy", "Decorator"],
      answer: 0,
      hint: "Do the method names and units match on both sides?",
      explain: "The class turns one interface (pay with Decimal) into another (charge_cents with cents and a code): Adapter. A Proxy or Decorator would offer the same pay method as the object they hold."
    },
    {
      type: "bug", tag: "Find the problem", prompt: "This is meant to be a Decorator that can be stacked with others. Tap the line that breaks stacking.",
      code: { lang: "python", text: `class Logged(WeatherService):
    def __init__(self, inner: StationWeather) -> None:
        self._inner = inner

    def temperature(self, city: str) -> float:
        value = self._inner.temperature(city)
        print(f"log: {city} -> {value}")
        return value` },
      answer: 2,
      hint: "What type of object is Logged allowed to wrap?",
      explain: "Line 2 types the wrapped object as StationWeather, so Logged can't wrap Rounded or any other decorator. Type it as WeatherService so any layer fits inside."
    },
    {
      type: "order", tag: "Put in order", prompt: "Put the steps of app.report('Paris') in order (Adapter version).",
      steps: [
        "WeatherApp calls temperature('Paris') on its WeatherService",
        "FahrenheitAdapter turns 'Paris' into the station code 'LFPG'",
        "FahrenheitFeed.read_f('LFPG') returns 65.23 (Fahrenheit)",
        "The adapter converts 65.23 F to 18.5 C",
        "WeatherApp prints 'Paris: 18.5 C'"
      ],
      shuffled: [3, 0, 2, 4, 1],
      hint: "The adapter translates on the way in, and again on the way out.",
      explain: "The client calls the target method, the adapter translates the argument, calls the adaptee, converts the answer back to the target's units, and only then does the client see the result."
    }
  ]
};

export default comparison;
