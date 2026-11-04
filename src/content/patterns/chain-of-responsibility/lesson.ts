import type { PatternLesson } from "../../types";
import problemPy from "./code/problem.py?raw";
import problemScala from "./code/problem.scala?raw";
import mainPy from "./code/main.py?raw";
import mainScala from "./code/main.scala?raw";
import idiomaticPy from "./code/idiomatic.py?raw";
import idiomaticScala from "./code/idiomatic.scala?raw";
import ex1Py from "./code/ex1-atm.py?raw";
import ex1Scala from "./code/ex1-atm.scala?raw";
import ex2Py from "./code/ex2-middleware.py?raw";
import ex2Scala from "./code/ex2-middleware.scala?raw";
import ex3Py from "./code/ex3-support.py?raw";
import ex3Scala from "./code/ex3-support.scala?raw";
import ex4Py from "./code/ex4-checkout.py?raw";
import ex4Scala from "./code/ex4-checkout.scala?raw";

const lesson: PatternLesson = {
  slug: "chain-of-responsibility",
  analogy:
    "Customer support escalation. The chatbot tries first, then a level-1 agent, then a level-2 specialist, then an engineer. You just raise a ticket; it climbs the ladder until someone can solve it.",
  problem: {
    text: "All approval rules live in one if/elif function. Adding a \"Finance check\" step or reordering the levels means editing that function, and you cannot set up a different chain for each department.",
    code: { python: problemPy, scala: problemScala },
  },
  solution:
    "Make each approver an object with a link to the next approver. It handles what it can and passes everything else on. The chain is assembled from the outside, so the sender only talks to the first link and never knows who finally answered.",
  participants: [
    { role: "Handler", name: "Approver", kind: "abstract", description: "Common interface plus a link to the next handler. Holds the shared \"handle or forward\" logic." },
    { role: "Concrete handler", name: "TeamLead, Manager, Director", kind: "concrete", description: "Each one decides whether the request is within its limit; if not, it forwards it." },
    { role: "Client", name: "chainDemo", kind: "client", description: "Builds the chain in the order it wants and sends every request to the first link." },
  ],
  code: { python: mainPy, scala: mainScala },
  idiomatic: {
    note: "A chain can simply be a list of functions that return None when they cannot handle the request; the first real answer wins. In Scala, PartialFunctions joined with orElse express exactly this.",
    code: { python: idiomaticPy, scala: idiomaticScala },
  },
  realWorldUses: [
    "Web middleware (Django, Express, Java servlet filters): each layer can answer the request or pass it on.",
    "Exception handling: an exception travels up the call stack until some handler catches it.",
    "DOM event bubbling, and Python logging passing records up to parent loggers.",
  ],
  whenToUse: [
    "Several objects may handle a request and you do not know in advance which one will.",
    "You want to add, remove or reorder processing steps by configuration.",
    "The sender should not depend on the receivers.",
  ],
  whenNotToUse: [
    "There is one obvious handler and every request must reach it.",
    "Easy debugging matters more than flexibility: long chains make it hard to see who handled what (add logging if you use one).",
  ],
  pros: [
    "Sender and receivers are decoupled, and the chain can be reconfigured without touching handlers (Open/Closed).",
    "Each handler has one job (Single Responsibility).",
  ],
  cons: [
    "A request can fall off the end unhandled unless you add a default last link.",
    "Harder to trace at runtime which handler did the work.",
  ],
  confusedWith: [
    { name: "Decorator", difference: "Same linked shape, but every decorator does its bit and always passes on. A chain handler may stop the request." },
    { name: "Command", difference: "Command turns a request into an object. That object is often what travels along a chain." },
    { name: "Composite", difference: "Composite is a tree of parts. A request passed from child to parent up a composite behaves like a chain." },
  ],
  solid:
    "Single Responsibility (one check per handler), Open/Closed (a new handler is a new class plus a change where the chain is assembled), Dependency Inversion (the client depends only on Approver).",
  interviewUses: [
    "Expense or leave approval systems",
    "ATM cash dispensing (₹2000 then ₹500 then ₹100 notes)",
    "Logging levels and log handlers",
    "Request validation pipelines",
    "Support-ticket escalation",
  ],
  examples: [
    {
      id: "atm",
      domain: "Banking",
      title: "ATM note dispenser",
      situation:
        "An ATM must pay ₹5600 using the fewest notes from the ₹2000, ₹500 and ₹100 cassettes. Hard-coding the arithmetic for every note size gets messy when a bank adds or removes a cassette.",
      roles: [
        { role: "Handler", name: "NoteDispenser" },
        { role: "Concrete handler", name: "NoteDispenser(2000), NoteDispenser(500), NoteDispenser(100)" },
        { role: "Client", name: "Atm" },
      ],
      why: "Each cassette pays what it can and hands the remainder to the next smaller one. Adding a ₹200 cassette is one more link, no new if/else.",
      goodToKnow:
        "Here every handler does a part of the work instead of one handler doing all of it. Order matters: the chain must go from the largest note to the smallest.",
      walkthrough: [
        "The ATM asks the ₹2000 dispenser for ₹5600.",
        "It pays 2 notes of ₹2000 and passes the remaining ₹1600 on.",
        "The ₹500 dispenser pays 3 notes and passes ₹100 on.",
        "The ₹100 dispenser pays the last note; nothing is left, so the withdrawal succeeds.",
        "For ₹450, ₹50 is still left at the end of the chain, so the ATM refuses.",
      ],
      code: { python: ex1Py, scala: ex1Scala },
    },
    {
      id: "middleware",
      domain: "Web backend",
      title: "HTTP middleware pipeline",
      situation:
        "Every API endpoint needs logging, an auth check and rate limiting. Copying these checks into each endpoint is repetitive and easy to forget.",
      roles: [
        { role: "Handler", name: "Middleware (function type)" },
        { role: "Concrete handler", name: "logger, auth, rateLimit" },
        { role: "Receiver at the end", name: "ordersEndpoint" },
        { role: "Client", name: "build" },
      ],
      why: "Each middleware is a small function that either answers early (401, 429) or calls the next one. build() links them from the outside, so endpoints stay clean.",
      goodToKnow:
        "This is how Express, Django middleware and servlet filters work. A handler that wraps the call (like logger) can also act after the rest of the chain returns.",
      walkthrough: [
        "build() wraps the endpoint in rateLimit, then auth, then logger, starting from the end.",
        "Asha's first request passes every check and reaches the endpoint: 200 OK.",
        "Ravi has no token, so auth stops the chain with 401 before the endpoint runs.",
        "Asha's third request trips the rate limiter, which answers 429.",
        "logger sits at the front, so it sees and prints every final result.",
      ],
      code: { python: ex2Py, scala: ex2Scala },
    },
    {
      id: "support",
      domain: "Customer support",
      title: "Support ticket escalation",
      situation:
        "Tickets about password resets, refunds and bugs all arrive in one queue. The routing code is a long if/else that changes whenever the support team is reorganised.",
      roles: [
        { role: "Handler", name: "SupportHandler" },
        { role: "Concrete handler", name: "Chatbot, Level1Agent, Level2Specialist" },
        { role: "Default handler", name: "Engineer" },
        { role: "Client", name: "supportDemo" },
      ],
      why: "Each level knows only what it can solve and who comes next. The cheapest helper tries first and costly experts see only what is left.",
      goodToKnow:
        "Always end the chain with a catch-all handler (here Engineer) so no ticket is silently dropped. Recording the path makes the chain easy to debug.",
      walkthrough: [
        "The chain is linked with fluent setNext calls: Chatbot, Level1Agent, Level2Specialist, Engineer.",
        "A password reset is solved by the Chatbot at once.",
        "A refund passes the Chatbot and is solved by Level1Agent.",
        "A normal bug climbs to Level2Specialist.",
        "A P1 bug is too urgent for level 2, so it reaches the Engineer safety net.",
      ],
      code: { python: ex3Py, scala: ex3Scala },
    },
    {
      id: "checkout",
      domain: "E-commerce",
      title: "Checkout validation",
      situation:
        "Before placing an order the shop must check stock, the delivery pincode and the UPI id. Each team wants to add its own check without touching the others.",
      roles: [
        { role: "Handler", name: "Check" },
        { role: "Concrete handler", name: "StockCheck, PincodeCheck, PaymentCheck" },
        { role: "Client", name: "buildChain" },
      ],
      why: "Each check passes the order on when it is fine and stops the chain with a reason when it is not. The chain is built from a plain list, so adding a check is one line.",
      goodToKnow:
        "This flips the usual chain: success forwards, failure stops. Put cheap checks first so expensive ones (like a payment call) run only when needed.",
      walkthrough: [
        "buildChain links the three checks in the order of the list.",
        "A valid order passes stock, pincode and payment checks and is placed.",
        "A saree order stops at StockCheck because none are left.",
        "An order with a 4-digit pincode stops at PincodeCheck.",
        "An order with a bad UPI id gets through two checks and stops at PaymentCheck.",
      ],
      code: { python: ex4Py, scala: ex4Scala },
    },
  ],
};

export default lesson;
