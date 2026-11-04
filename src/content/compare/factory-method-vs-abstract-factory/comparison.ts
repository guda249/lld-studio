import type { Comparison } from "../../extras/types";
import fmPy from "./code/factory_method.py?raw";
import fmScala from "./code/FactoryMethod.scala?raw";
import afPy from "./code/abstract_factory.py?raw";
import afScala from "./code/AbstractFactory.scala?raw";

const comparison: Comparison = {
  id: "factory-method-vs-abstract-factory",
  title: "Factory Method vs Abstract Factory",
  tagline: "Both hide which concrete class gets created behind a create_…() method, and an abstract factory is often built from factory methods.",
  scenario: "A delivery company sends parcels in the city by bike and long distance by truck. First only the vehicle changes. Then each kind of delivery also needs matching packaging: a pouch fits on a bike, a crate goes on a truck, and they must never be mixed.",
  decidingQuestion: "Do you need to create one kind of object, or a whole family of objects that must match each other?",
  sides: [
    {
      slug: "factory-method",
      oneLiner: "Delivery runs the shared steps and leaves one decision, which Vehicle to create, to its subclasses.",
      code: { python: fmPy, scala: fmScala },
      uml: {
        classes: [
          { name: "Delivery", kind: "abstract", members: ["+ create_vehicle(): Vehicle", "+ deliver(parcel): str"] },
          { name: "CityDelivery", kind: "concrete", members: ["+ create_vehicle(): Vehicle"] },
          { name: "FreightDelivery", kind: "concrete", members: ["+ create_vehicle(): Vehicle"] },
          { name: "Vehicle", kind: "interface", members: ["+ carry(parcel): str"] },
          { name: "Bike", kind: "concrete", members: ["+ carry(parcel): str"] },
          { name: "Truck", kind: "concrete", members: ["+ carry(parcel): str"] }
        ],
        relations: [
          { from: "CityDelivery", to: "Delivery", type: "inheritance" },
          { from: "FreightDelivery", to: "Delivery", type: "inheritance" },
          { from: "Bike", to: "Vehicle", type: "realization" },
          { from: "Truck", to: "Vehicle", type: "realization" }
        ]
      },
      howItWorks: [
        "deliver() is written once, in Delivery, and calls self.create_vehicle().",
        "CityDelivery overrides create_vehicle() to return a Bike; FreightDelivery returns a Truck.",
        "Delivery only knows the Vehicle interface, never Bike or Truck.",
        "The choice is made by picking a subclass: one creation method, one product."
      ],
      pickWhen: [
        "A class has shared steps and only the object it creates differs between versions.",
        "There is one product to vary (a vehicle, a parser, a message).",
        "You expect people to add a new version by writing a subclass."
      ]
    },
    {
      slug: "abstract-factory",
      oneLiner: "A DeliveryKit makes a matching vehicle AND package, so a Dispatcher can never put a crate on a bike.",
      code: { python: afPy, scala: afScala },
      uml: {
        classes: [
          { name: "DeliveryKit", kind: "interface", members: ["+ create_vehicle(): Vehicle", "+ create_package(): Package"] },
          { name: "CityKit", kind: "concrete", members: ["+ create_vehicle(): Bike", "+ create_package(): Pouch"] },
          { name: "FreightKit", kind: "concrete", members: ["+ create_vehicle(): Truck", "+ create_package(): Crate"] },
          { name: "Vehicle", kind: "interface", members: ["+ carry(parcel): str"] },
          { name: "Package", kind: "interface", members: ["+ wrap(item): str"] },
          { name: "Dispatcher", kind: "concrete", members: ["- kit: DeliveryKit", "+ send(item): str"] }
        ],
        relations: [
          { from: "CityKit", to: "DeliveryKit", type: "realization" },
          { from: "FreightKit", to: "DeliveryKit", type: "realization" },
          { from: "Dispatcher", to: "DeliveryKit", type: "association" }
        ]
      },
      howItWorks: [
        "The client picks one kit (CityKit or FreightKit) and hands it to the Dispatcher.",
        "The Dispatcher asks the kit for a package and a vehicle, through the DeliveryKit interface.",
        "CityKit always returns Bike + Pouch; FreightKit always returns Truck + Crate.",
        "Picking the kit picks the whole family, so mismatched pairs can't happen."
      ],
      pickWhen: [
        "Several products must be used together and must come from the same family (theme, platform, region).",
        "You want to switch the whole family in one place.",
        "The client should never name a concrete product class."
      ]
    }
  ],
  table: [
    { aspect: "How many products", values: ["One (a Vehicle)", "A family of related ones (Vehicle + Package)"] },
    { aspect: "How the choice is made", values: ["By subclassing the creator (inheritance)", "By passing a factory object to the client (composition)"] },
    { aspect: "Who uses the created object", values: ["The creator itself, in its own deliver()", "A separate client (Dispatcher) that holds the factory"] },
    { aspect: "What it protects against", values: ["The creator naming a concrete class", "Mixing parts from different families"] },
    { aspect: "Cost of a new product type", values: ["Small: add a subclass", "Larger: every kit gets a new create_…() method"] },
    { aspect: "Smell it fixes", values: ["if/elif choosing a class inside shared steps", "Several if/elif blocks that must all pick the same family"] }
  ],
  mixups: [
    "Calling a single create method on a separate object an Abstract Factory: if the factory has only one create_…() method, it is a simple factory or Factory Method. Abstract Factory has one method per product in a family.",
    "Calling it Factory Method when nobody overrides anything: a function with an if/elif that returns Bike or Truck is a simple factory, not the pattern. Look for a subclass that overrides the creation method.",
    "Letting the client create one part itself next to the kit (self._kit.create_vehicle() but Crate() by hand): the families can mix again. Every part must come from the same kit.",
    "Reaching for Abstract Factory with one product: it adds a factory interface and a client for nothing. Start with Factory Method and move up when a second matching product appears."
  ],
  quiz: [
    {
      type: "mcq", tag: "Concept", prompt: "What is the key difference between the two delivery versions?",
      options: [
        "Factory Method creates one product; Abstract Factory creates a family of products that match",
        "Abstract Factory never uses inheritance",
        "Factory Method can't return an interface type",
        "Abstract Factory is only for user interfaces"
      ],
      answer: 0,
      hint: "Count the create_…() methods in each version.",
      explain: "Delivery has one factory method (create_vehicle); DeliveryKit has one per product (create_vehicle, create_package) and each kit returns a matching pair. Abstract Factory uses inheritance too (the kits implement DeliveryKit), Factory Method does return the Vehicle interface, and Abstract Factory works in any domain."
    },
    {
      type: "mcq", tag: "Which pattern?",
      prompt: "An app has a light and a dark theme. Each theme must give a button, a text field and a scroll bar that look alike. Which pattern fits?",
      options: ["Factory Method", "Abstract Factory", "Builder"],
      answer: 1,
      hint: "How many kinds of objects are created, and must they match?",
      explain: "Three kinds of widget must all come from the same theme: a family, so Abstract Factory (a LightTheme and a DarkTheme factory). Factory Method varies one product, and Builder assembles one complex object step by step."
    },
    {
      type: "mcq", tag: "Which pattern?",
      prompt: "A report exporter has a fixed export() routine. Only the writer it creates differs: PdfExporter makes a PdfWriter, CsvExporter makes a CsvWriter. Which pattern is this?",
      options: ["Abstract Factory", "Factory Method", "Prototype", "Strategy"],
      answer: 1,
      hint: "Is there one product or several? Who overrides what?",
      explain: "The shared export() calls a creation method that each subclass overrides to make one product: Factory Method. There is no family of products (Abstract Factory), no copying of an existing object (Prototype), and the writer is created by the subclass, not passed in by a client (Strategy)."
    },
    {
      type: "bug", tag: "Find the problem", prompt: "Tap the line that lets a bike end up carrying a crate.",
      code: { lang: "python", text: `class Dispatcher:
    def __init__(self, kit: DeliveryKit) -> None:
        self._kit = kit

    def send(self, item: str) -> str:
        parcel = Crate().wrap(item)
        vehicle = self._kit.create_vehicle()
        return f"Delivered {vehicle.carry(parcel)}"` },
      answer: 6,
      hint: "Which part does not come from the kit?",
      explain: "Line 6 creates a Crate by hand instead of asking the kit, so with a CityKit you get a bike carrying a crate. Use self._kit.create_package() so both parts come from the same family."
    },
    {
      type: "order", tag: "Put in order", prompt: "Put the steps of CityDelivery().deliver('books') in order (Factory Method version).",
      steps: [
        "The client calls deliver('books') on a CityDelivery",
        "deliver(), written in Delivery, calls self.create_vehicle()",
        "CityDelivery's override returns a new Bike",
        "deliver() calls carry('books') on the Vehicle it got",
        "The result 'Delivered books by bike' goes back to the client"
      ],
      shuffled: [2, 4, 0, 3, 1],
      hint: "The shared steps start first and ask the subclass only for the object.",
      explain: "The inherited deliver() runs, asks the factory method for a vehicle, the subclass decides it is a Bike, and the shared code then uses it through the Vehicle interface."
    }
  ]
};

export default comparison;
