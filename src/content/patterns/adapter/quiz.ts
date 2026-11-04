import type { PatternQuiz } from "../../../anim/types";

const quiz: PatternQuiz = {
  slug: "adapter",
  questions: [
    {
      type: "mcq", tag: "Concept", prompt: "What problem does the Adapter pattern solve?",
      options: [
        "Adding behaviour to an object while keeping its interface",
        "Letting a class with the wrong interface work with code that expects a different interface",
        "Giving many classes one new, simpler entry point",
        "Controlling access to an object that is expensive to create"
      ],
      answer: 1,
      hint: "Think of the travel plug: the charger and the socket both stay as they are. What does the thing in the middle do?",
      explain: "An adapter makes one existing class fit an interface your code already uses, by translating calls and results. Adding behaviour with the same interface is Decorator, a new simple entry point over many classes is Facade, and controlling access is Proxy."
    },
    {
      type: "bug", tag: "Find the problem", prompt: "This adapter compiles and runs, but it charges the wrong amount. Tap the line with the bug.",
      code: { lang: "python", text: `class LegacyBankAdapter(PaymentGateway):
    def __init__(self, api: LegacyBankApi) -> None:
        self._api = api

    def pay(self, amount_inr: Decimal) -> str:
        response = self._api.make_transfer(int(amount_inr), "INR")
        if response["status"] != "OK":
            raise RuntimeError("payment failed")
        return response["ref"]` },
      answer: 6,
      hint: "The SDK's make_transfer() takes paise. What unit is amount_inr in?",
      explain: "Line 6 passes rupees where the SDK expects paise, so ₹199 is charged as ₹1.99. The adapter's whole job is to translate units: convert with amount_inr * 100 (rounded) before calling the SDK. The other lines store the adaptee, check the status and return the reference, which is all correct."
    },
    {
      type: "mcq", tag: "Which pattern?", prompt: "Which pattern does this Scala code use?",
      code: { lang: "scala", text: `trait Logger:
  def info(msg: String): Unit

class VendorLog: // third-party, cannot change
  def write(level: Int, text: String): Unit =
    println(s"[$level] $text")

class VendorLogger(log: VendorLog) extends Logger:
  def info(msg: String): Unit = log.write(2, msg)` },
      options: ["Decorator", "Proxy", "Adapter", "Facade"],
      answer: 2,
      hint: "Does VendorLogger keep VendorLog's interface, or turn it into a different one?",
      explain: "VendorLogger implements our Logger and turns info(msg) into the vendor's write(level, text): it changes the interface, so it is an Adapter. A Decorator or Proxy would keep the same interface as the object it wraps, and a Facade sits in front of several classes, not one."
    },
    {
      type: "mcq", tag: "Scenario",
      prompt: "A team must use a video service made of nine classes for encoding, storage and CDN upload. They want one simple upload(file) method and do not need an existing interface to match. Which pattern fits best?",
      options: ["Adapter", "Facade", "Bridge", "Decorator"],
      answer: 1,
      hint: "Is there an interface the team already has and must match, or are they designing a new, simpler one?",
      explain: "Facade: a new, simpler interface in front of many classes. Adapter would fit if one existing class had to match an interface the team already uses. Bridge splits two hierarchies up front, and Decorator adds behaviour without changing the interface."
    },
    {
      type: "order", tag: "Put in order", prompt: "Put the steps of checkout.complete(Decimal(\"499.50\")) in the right order.",
      steps: [
        "Checkout calls pay(499.50) on its PaymentGateway",
        "LegacyBankAdapter converts ₹499.50 into 49950 paise",
        "The adapter calls make_transfer(49950, \"INR\") on the SDK",
        "The SDK returns a dict with status and ref",
        "The adapter checks the status and returns \"TX49950INR\"",
        "Checkout builds \"Paid ₹499.50, reference TX49950INR\""
      ],
      shuffled: [3, 0, 5, 2, 4, 1],
      hint: "Follow the money in: our units become the SDK's units. Then follow the answer out: the SDK's shape becomes ours.",
      explain: "The client calls the target interface, the adapter translates the request, calls the adaptee, then translates the result back before the client sees it. The client never sees paise or the dict."
    },
    {
      type: "diagram", tag: "Read the diagram", prompt: "Which class diagram shows the Adapter pattern correctly?",
      options: [
        {
          label: "Checkout points to PaymentGateway; LegacyBankApi implements PaymentGateway directly.",
          width: 330, height: 200,
          nodes: [
            { id: "c", kind: "concrete", name: "Checkout", key: true, at: { x: 8, y: 20, w: 100 } },
            { id: "i", kind: "interface", name: "PaymentGateway", at: { x: 150, y: 14, w: 170 } },
            { id: "a", kind: "concrete", name: "LegacyBankApi", at: { x: 160, y: 140, w: 150 } }
          ],
          edges: [
            { id: "e1", from: "c", to: "i", type: "association" },
            { id: "e2", from: "a", to: "i", type: "realization" }
          ]
        },
        {
          label: "Checkout points to PaymentGateway; LegacyBankAdapter implements it and points to LegacyBankApi.",
          width: 330, height: 200,
          nodes: [
            { id: "c", kind: "concrete", name: "Checkout", key: true, at: { x: 8, y: 20, w: 100 } },
            { id: "i", kind: "interface", name: "PaymentGateway", at: { x: 150, y: 14, w: 170 } },
            { id: "d", kind: "concrete", name: "LegacyBankAdapter", at: { x: 8, y: 140, w: 150 } },
            { id: "a", kind: "concrete", name: "LegacyBankApi", at: { x: 190, y: 140, w: 130 } }
          ],
          edges: [
            { id: "e1", from: "c", to: "i", type: "association" },
            { id: "e2", from: "d", to: "i", type: "realization" },
            { id: "e3", from: "d", to: "a", type: "association" }
          ]
        },
        {
          label: "Checkout points straight to LegacyBankApi; LegacyBankAdapter implements PaymentGateway but is not connected to the SDK.",
          width: 330, height: 200,
          nodes: [
            { id: "c", kind: "concrete", name: "Checkout", key: true, at: { x: 8, y: 20, w: 100 } },
            { id: "a", kind: "concrete", name: "LegacyBankApi", at: { x: 8, y: 140, w: 130 } },
            { id: "i", kind: "interface", name: "PaymentGateway", at: { x: 160, y: 14, w: 160 } },
            { id: "d", kind: "concrete", name: "LegacyBankAdapter", at: { x: 170, y: 140, w: 150 } }
          ],
          edges: [
            { id: "e1", from: "c", to: "a", type: "association" },
            { id: "e2", from: "d", to: "i", type: "realization" }
          ]
        }
      ],
      answer: 1,
      hint: "The SDK cannot be edited, and the client should only ever see the target interface.",
      explain: "B is right: Checkout knows only PaymentGateway, the adapter implements it (dashed line, hollow triangle) and holds the SDK (solid arrow). In A, the third-party SDK would have to be edited to implement our interface, which we cannot do. In C, Checkout still calls the SDK directly and the adapter wraps nothing: that is the original problem."
    }
  ],
  cards: [
    { id: "ad-intent", front: "Adapter: what is its intent, in one line?", back: "Make an existing class work with code that expects a different interface, by translating calls and results in one class in between." },
    { id: "ad-vs-facade", front: "Adapter vs Facade: what is the difference?", back: "Adapter makes ONE existing class fit an interface you already have. Facade designs a NEW, simpler interface in front of MANY classes." },
    { id: "ad-solid", front: "Which SOLID principles does Adapter mainly apply?", back: "Single Responsibility (translation lives in one class), Open/Closed (a new vendor is a new adapter, clients stay unchanged) and Dependency Inversion (clients depend on your interface, not the vendor's SDK)." },
    { id: "ad-spot", front: "Which pattern is hiding in this line?", code: { lang: "python", text: "text = io.TextIOWrapper(binary_file, encoding=\"utf-8\")" }, back: "Adapter. TextIOWrapper wraps a binary stream (bytes) and gives your code the text-stream interface (str) it expects." },
    { id: "ad-uml", front: "UML: object adapter vs class adapter, how do they differ in the diagram?", back: "Object adapter: the adapter realizes the target (dashed line, hollow triangle) and has an association arrow to the adaptee it holds. Class adapter: the adapter inherits from the adaptee (solid line, hollow triangle) and also realizes the target." },
    { id: "ad-when-not", front: "When should you NOT use Adapter?", back: "When you own both sides and can simply change one interface, or when the interfaces already match. Then an adapter is only an extra layer." }
  ]
};

export default quiz;
