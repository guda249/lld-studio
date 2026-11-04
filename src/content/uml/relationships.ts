/**
 * UML Basics, lesson 3: the six relationships. Ported from the approved prototype
 * (public/prototypes/uml-relationships.html). Every code example runs as-is.
 */
import type { Lang } from "../types";
import type { Action, DiagramSpec, RelType } from "../../anim/types";

export interface Relationship {
  id: "dep" | "assoc" | "agg" | "comp" | "inh" | "real";
  type: RelType;
  name: string;
  short: string;
  label: string;
  notation: string;
  src: string;
  tgt: string;
  tgtKind: "concrete" | "interface";
  mult: [string, string];
  members: Record<Lang, { src: string[]; tgt: string[] }>;
  hlMember: number;
  what: string;
  spot: string;
  why: string;
  code: Record<Lang, string>;
  hl: Record<Lang, number[]>;
  /** The scene that shows what the relationship means. */
  scene: Action[];
}

export interface SpotQuestion { lang: Lang; answer: Relationship["id"]; prompt: string; code: string; why: string }

const TYPE: Record<string, RelType> = { dep: "dependency", assoc: "association", agg: "aggregation", comp: "composition", inh: "inheritance", real: "realization" };

export const RELATIONSHIPS: Relationship[] = [
  {
    "id": "dep",
    "name": "Dependency",
    "short": "uses briefly",
    "label": "uses",
    "notation": "Dashed line, open arrow",
    "src": "Invoice",
    "tgt": "Printer",
    "tgtKind": "concrete",
    "mult": [
      "",
      ""
    ],
    "members": {
      "python": {
        "src": [
          "- total: float",
          "+ print_with(printer)"
        ],
        "tgt": [
          "+ print(text)"
        ]
      },
      "scala": {
        "src": [
          "- total: BigDecimal",
          "+ printWith(printer)"
        ],
        "tgt": [
          "+ print(text)"
        ]
      }
    },
    "hlMember": 1,
    "what": "One class uses another only for a moment, as a method parameter or a local variable. It doesn't keep it.",
    "spot": "The other class appears as a parameter or a local variable, never as a field.",
    "why": "It's the loosest tie. Prefer it whenever you only need something during one call; both classes stay easy to change.",
    "code": {
      "python": "class Printer:\n    def print(self, text: str) -> None:\n        print(f\"Printing: {text}\")\n\nclass Invoice:\n    def __init__(self, total: float):\n        self.total = total\n\n    def print_with(self, printer: Printer) -> None:   # Printer is only a parameter\n        printer.print(f\"Invoice total ₹{self.total}\")\n\nInvoice(499).print_with(Printer())",
      "scala": "class Printer:\n  def print(text: String): Unit = println(s\"Printing: $text\")\n\nclass Invoice(total: BigDecimal):\n  def printWith(printer: Printer): Unit =   // Printer is only a parameter\n    printer.print(s\"Invoice total ₹$total\")\n\n@main def demo(): Unit = Invoice(499).printWith(Printer())"
    },
    "hl": {
      "python": [
        9,
        10,
        12
      ],
      "scala": [
        5,
        6,
        8
      ]
    },
    "type": TYPE["dep"],
    "scene": [
      { call: ["src", "tgt"], label: "print_with(printer)", scalaLabel: "printWith(printer)" },
      { dim: ["rel"] },
      { show: ["note"] }
    ]
  },
  {
    "id": "assoc",
    "name": "Association",
    "short": "knows a",
    "label": "knows a",
    "notation": "Solid line, open arrow",
    "src": "Order",
    "tgt": "Customer",
    "tgtKind": "concrete",
    "mult": [
      "",
      "1"
    ],
    "members": {
      "python": {
        "src": [
          "- order_id: str",
          "- customer: Customer"
        ],
        "tgt": [
          "- name: str"
        ]
      },
      "scala": {
        "src": [
          "- orderId: String",
          "- customer: Customer"
        ],
        "tgt": [
          "- name: String"
        ]
      }
    },
    "hlMember": 1,
    "what": "One class knows another and keeps a reference to it as a field, for as long as it lives.",
    "spot": "A field that points to another object, usually passed in through the constructor.",
    "why": "Use it when an object needs to reach the other one again and again, like an order and its customer.",
    "code": {
      "python": "class Customer:\n    def __init__(self, name: str):\n        self.name = name\n\nclass Order:\n    def __init__(self, order_id: str, customer: Customer):\n        self.order_id = order_id\n        self.customer = customer          # kept as a field: \"knows a\"\n\nasha = Customer(\"Asha\")\norder = Order(\"A-101\", asha)\nprint(order.customer.name)                # Asha",
      "scala": "class Customer(val name: String)\n\nclass Order(val orderId: String, val customer: Customer)   // kept as a field: \"knows a\"\n\n@main def demo(): Unit =\n  val asha = Customer(\"Asha\")\n  val order = Order(\"A-101\", asha)\n  println(order.customer.name)           // Asha"
    },
    "hl": {
      "python": [
        6,
        8,
        12
      ],
      "scala": [
        3,
        8
      ]
    },
    "type": TYPE["assoc"],
    "scene": [{ call: ["src", "tgt"], label: "order.customer", result: "Customer(Asha)", hold: 0.8 }]
  },
  {
    "id": "agg",
    "name": "Aggregation",
    "short": "has a (parts live on)",
    "label": "has a",
    "notation": "Solid line, hollow diamond at the whole",
    "src": "Team",
    "tgt": "Player",
    "tgtKind": "concrete",
    "mult": [
      "1",
      "1..*"
    ],
    "members": {
      "python": {
        "src": [
          "- players: list[Player]"
        ],
        "tgt": [
          "- name: str"
        ]
      },
      "scala": {
        "src": [
          "- players: List[Player]"
        ],
        "tgt": [
          "- name: String"
        ]
      }
    },
    "hlMember": 0,
    "what": "A whole made of parts, but the parts have a life of their own. Delete the team and the players still exist.",
    "spot": "A field holding objects that were created somewhere else and passed in.",
    "why": "Use it when parts can be shared or moved: a player can join another team.",
    "code": {
      "python": "class Player:\n    def __init__(self, name: str):\n        self.name = name\n\nclass Team:\n    def __init__(self, players: list[Player]):\n        self.players = players            # parts are passed in\n\nravi, meera = Player(\"Ravi\"), Player(\"Meera\")\nteam = Team([ravi, meera])\ndel team                                  # the team is gone...\nprint(ravi.name)                          # ...but the players still exist",
      "scala": "class Player(val name: String)\n\nclass Team(val players: List[Player])     // parts are passed in\n\n@main def demo(): Unit =\n  val ravi = Player(\"Ravi\")\n  val meera = Player(\"Meera\")\n  locally {\n    val team = Team(List(ravi, meera))\n    println(team.players.size)\n  }                                       // the team is gone here...\n  println(ravi.name)                      // ...but the players still exist"
    },
    "hl": {
      "python": [
        6,
        7,
        11,
        12
      ],
      "scala": [
        3,
        11,
        12
      ]
    },
    "type": TYPE["agg"],
    "scene": [
      { wait: 0.4 },
      { cross: "src" },
      { show: ["gone"], together: true },
      { dim: ["rel"] },
      { pulse: "tgt" },
      { show: ["fate"], together: true }
    ]
  },
  {
    "id": "comp",
    "name": "Composition",
    "short": "owns (parts die with it)",
    "label": "owns",
    "notation": "Solid line, filled diamond at the whole",
    "src": "Car",
    "tgt": "Engine",
    "tgtKind": "concrete",
    "mult": [
      "1",
      "1"
    ],
    "members": {
      "python": {
        "src": [
          "- model: str",
          "- _engine: Engine"
        ],
        "tgt": [
          "+ start(): str"
        ]
      },
      "scala": {
        "src": [
          "- model: String",
          "- engine: Engine"
        ],
        "tgt": [
          "+ start(): String"
        ]
      }
    },
    "hlMember": 1,
    "what": "A whole that owns its parts. It creates them itself, and they are destroyed with it.",
    "spot": "The whole creates the part itself, usually in its constructor, and never hands it out.",
    "why": "Use it when a part makes no sense on its own and nobody else should hold it.",
    "code": {
      "python": "class Engine:\n    def start(self) -> str:\n        return \"vroom\"\n\nclass Car:\n    def __init__(self, model: str):\n        self.model = model\n        self._engine = Engine()           # created inside: Car owns it\n\n    def drive(self) -> str:\n        return f\"{self.model}: {self._engine.start()}\"\n\nprint(Car(\"Nexon\").drive())               # nobody else holds the Engine",
      "scala": "class Engine:\n  def start(): String = \"vroom\"\n\nclass Car(model: String):\n  private val engine = Engine()           // created inside: Car owns it\n  def drive(): String = s\"$model: ${engine.start()}\"\n\n@main def demo(): Unit = println(Car(\"Nexon\").drive())"
    },
    "hl": {
      "python": [
        8,
        13
      ],
      "scala": [
        5
      ]
    },
    "type": TYPE["comp"],
    "scene": [
      { wait: 0.4 },
      { cross: "src" },
      { show: ["gone"], together: true },
      { dim: ["rel"] },
      { cross: "tgt" },
      { show: ["fate"], together: true }
    ]
  },
  {
    "id": "inh",
    "name": "Inheritance",
    "short": "is a kind of",
    "label": "is a",
    "notation": "Solid line, hollow triangle at the parent",
    "src": "SavingsAccount",
    "tgt": "BankAccount",
    "tgtKind": "concrete",
    "mult": [
      "",
      ""
    ],
    "members": {
      "python": {
        "src": [
          "+ add_interest(rate)"
        ],
        "tgt": [
          "- balance: float",
          "+ deposit(amount)"
        ]
      },
      "scala": {
        "src": [
          "+ addInterest(rate)"
        ],
        "tgt": [
          "# balance: BigDecimal",
          "+ deposit(amount)"
        ]
      }
    },
    "hlMember": 0,
    "what": "A class is a more specific kind of another class, and reuses its code.",
    "spot": "class SavingsAccount(BankAccount) in Python, or extends BankAccount in Scala.",
    "why": "Use it only for a true “is a”. If you only want to reuse code, composition is usually the safer choice.",
    "code": {
      "python": "class BankAccount:\n    def __init__(self, balance: float = 0):\n        self.balance = balance\n\n    def deposit(self, amount: float) -> None:\n        self.balance += amount\n\nclass SavingsAccount(BankAccount):        # \"is a\" BankAccount\n    def add_interest(self, rate: float) -> None:\n        self.deposit(self.balance * rate)  # reuses the parent's code\n\naccount = SavingsAccount(1000)\naccount.add_interest(0.04)\nprint(account.balance)                    # 1040.0",
      "scala": "class BankAccount(protected var balance: BigDecimal = 0):\n  def deposit(amount: BigDecimal): Unit = balance += amount\n  def current: BigDecimal = balance\n\nclass SavingsAccount(start: BigDecimal) extends BankAccount(start):   // \"is a\" BankAccount\n  def addInterest(rate: BigDecimal): Unit = deposit(balance * rate)   // reuses the parent's code\n\n@main def demo(): Unit =\n  val account = SavingsAccount(1000)\n  account.addInterest(BigDecimal(\"0.04\"))\n  println(account.current)                // 1040.00"
    },
    "hl": {
      "python": [
        8,
        10
      ],
      "scala": [
        5,
        6
      ]
    },
    "type": TYPE["inh"],
    "scene": [
      { call: ["tgt", "src"], label: "+ deposit(amount)" },
      { members: "src", lines: ["+ add_interest(rate)", "+ deposit(amount)  inherited"], scalaLines: ["+ addInterest(rate)", "+ deposit(amount)  inherited"] },
      { pulse: "tgt", together: true }
    ]
  },
  {
    "id": "real",
    "name": "Realization",
    "short": "implements an interface",
    "label": "implements",
    "notation": "Dashed line, hollow triangle at the interface",
    "src": "SmsNotifier",
    "tgt": "Notifier",
    "tgtKind": "interface",
    "mult": [
      "",
      ""
    ],
    "members": {
      "python": {
        "src": [
          "+ send(text): str"
        ],
        "tgt": [
          "+ send(text): str"
        ]
      },
      "scala": {
        "src": [
          "+ send(text): String"
        ],
        "tgt": [
          "+ send(text): String"
        ]
      }
    },
    "hlMember": 0,
    "what": "A class promises to do what an interface describes, and provides the code for it.",
    "spot": "The parent is an abstract base class or Protocol in Python, or a trait in Scala, with methods that have no body.",
    "why": "This is how design patterns stay flexible: code depends on the interface, and any class that realizes it can be plugged in.",
    "code": {
      "python": "from abc import ABC, abstractmethod\n\nclass Notifier(ABC):                      # an interface: only promises\n    @abstractmethod\n    def send(self, text: str) -> str: ...\n\nclass SmsNotifier(Notifier):              # realizes (implements) Notifier\n    def send(self, text: str) -> str:\n        return f\"SMS: {text}\"\n\ndef alert(notifier: Notifier) -> None:\n    print(notifier.send(\"Server is down\"))\n\nalert(SmsNotifier())",
      "scala": "trait Notifier:                           // an interface: only promises\n  def send(text: String): String\n\nclass SmsNotifier extends Notifier:       // realizes (implements) Notifier\n  def send(text: String): String = s\"SMS: $text\"\n\ndef alert(notifier: Notifier): Unit = println(notifier.send(\"Server is down\"))\n\n@main def demo(): Unit = alert(SmsNotifier())"
    },
    "hl": {
      "python": [
        3,
        5,
        7,
        8
      ],
      "scala": [
        1,
        2,
        4,
        5
      ]
    },
    "type": TYPE["real"],
    "scene": [
      { pulse: "tgt" },
      { show: ["fate"] }
    ]
  },
];

export const SPOT_QUESTIONS: SpotQuestion[] = [
  {
    "lang": "python" as const,
    "answer": "dep" as const,
    "prompt": "What is the relationship from Report to PdfExporter?",
    "code": "class Report:\n    def export(self, exporter: PdfExporter) -> None:\n        exporter.save(self)",
    "why": "PdfExporter is only a parameter of one method. Report never keeps it, so this is a dependency."
  },
  {
    "lang": "python" as const,
    "answer": "agg" as const,
    "prompt": "What is the relationship from Library to Book?",
    "code": "class Library:\n    def __init__(self, books: list[Book]):\n        self.books = books",
    "why": "The books are created elsewhere and passed in. Delete the library and the books still exist: aggregation."
  },
  {
    "lang": "python" as const,
    "answer": "comp" as const,
    "prompt": "What is the relationship from House to Room?",
    "code": "class House:\n    def __init__(self):\n        self.rooms = [Room(\"kitchen\"), Room(\"bedroom\")]",
    "why": "House creates its rooms itself, and they only exist as part of this house: composition."
  },
  {
    "lang": "scala" as const,
    "answer": "assoc" as const,
    "prompt": "What is the relationship from Ticket to Passenger?",
    "code": "class Ticket(val passenger: Passenger)",
    "why": "Ticket keeps a field pointing to a Passenger created elsewhere. It's a single reference, not a whole made of parts: association."
  },
  {
    "lang": "scala" as const,
    "answer": "real" as const,
    "prompt": "What is the relationship from S3Storage to Storage?",
    "code": "trait Storage:\n  def upload(name: String): String\n\nclass S3Storage extends Storage:\n  def upload(name: String) = s\"s3://$name\"",
    "why": "Storage is a trait with a method that has no body. S3Storage provides it: realization (dashed line, hollow triangle)."
  },
  {
    "lang": "scala" as const,
    "answer": "inh" as const,
    "prompt": "What is the relationship from Manager to Employee?",
    "code": "class Employee(val name: String):\n  def badge: String = s\"ID-$name\"\n\nclass Manager(name: String) extends Employee(name)",
    "why": "Employee is a normal class with real code, and Manager extends it to reuse that code: inheritance (solid line, hollow triangle)."
  }
];

/** Two class boxes and the relationship line, in landscape and portrait (phones). */
export function relDiagram(r: Relationship): DiagramSpec {
  const badges: NonNullable<DiagramSpec["badges"]> = [];
  if (r.id === "dep") badges.push({ id: "note", text: "only during the call", tone: "info", near: "src" });
  if (r.id === "agg" || r.id === "comp") badges.push({ id: "gone", text: `${r.src} deleted`, tone: "warn", near: "src" });
  if (r.id === "agg") badges.push({ id: "fate", text: `${r.tgt} still exists ✓`, tone: "ok", near: "tgt", place: "below" });
  if (r.id === "comp") badges.push({ id: "fate", text: `${r.tgt} is gone too`, tone: "warn", near: "tgt", place: "below" });
  if (r.id === "real") badges.push({ id: "fate", text: "✓ promise kept", tone: "ok", near: "src" });
  return {
    label: `${r.src} and ${r.tgt}, joined by ${r.name.toLowerCase()}: ${r.notation.toLowerCase()}.`,
    width: 760, height: 210, portraitWidth: 340, portraitHeight: 375,
    nodes: [
      { id: "src", kind: "concrete", name: r.src, hidden: true, members: r.members.python.src, scalaMembers: r.members.scala.src,
        at: { x: 30, y: 60, w: 240 }, portrait: { x: 50, y: 50, w: 240 } },
      { id: "tgt", kind: r.tgtKind, name: r.tgt, hidden: true, members: r.members.python.tgt, scalaMembers: r.members.scala.tgt,
        at: { x: 490, y: 60, w: 240 }, portrait: { x: 50, y: 230, w: 240 } }
    ],
    edges: [{ id: "rel", from: "src", to: "tgt", type: r.type, label: r.label, fromMult: r.mult[0] || undefined, toMult: r.mult[1] || undefined, hidden: true }],
    badges
  };
}

/** Draw the two classes, highlight the member that creates the relationship, draw the line, then play the scene. */
export function relActions(r: Relationship): Action[] {
  return [
    { show: ["src"] },
    { show: ["tgt"], together: true },
    { mark: "src", member: r.hlMember },
    { show: ["rel"] },
    ...r.scene
  ];
}
