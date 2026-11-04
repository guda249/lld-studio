import type { PatternLesson } from "../../types";
import problemPy from "./code/problem.py?raw";
import problemScala from "./code/problem.scala?raw";
import mainPy from "./code/main.py?raw";
import mainScala from "./code/main.scala?raw";
import idiomaticPy from "./code/idiomatic.py?raw";
import idiomaticScala from "./code/idiomatic.scala?raw";
import ex1Py from "./code/ex1-notify.py?raw";
import ex1Scala from "./code/ex1-notify.scala?raw";
import ex2Py from "./code/ex2-lights.py?raw";
import ex2Scala from "./code/ex2-lights.scala?raw";
import ex3Py from "./code/ex3-render.py?raw";
import ex3Scala from "./code/ex3-render.scala?raw";
import ex4Py from "./code/ex4-logging.py?raw";
import ex4Scala from "./code/ex4-logging.scala?raw";

const lesson: PatternLesson = {
  slug: "bridge",
  analogy:
    "Light switches and bulbs. Switch types (toggle, dimmer, smart) and bulb types (LED, halogen, filament) are designed separately and joined by a standard fitting. Nobody makes a dimmer-LED product and a separate dimmer-halogen product.",
  problem: {
    text: "Reports (Sales, Inventory) must be exported in several formats (CSV, Markdown). With inheritance alone you get SalesCsvReport, SalesMarkdownReport, InventoryCsvReport and InventoryMarkdownReport, and each format's code is copied once per report. Adding PDF adds one class per report: M reports times N formats means M × N classes.",
    code: { python: problemPy, scala: problemScala },
  },
  solution:
    "Split the two things that vary into two hierarchies. The report (the abstraction) decides what goes into the output; the renderer (the implementation) decides how it looks. Each report holds a renderer and calls it. Reports and renderers now grow independently, so you need M + N classes, and you can even swap the renderer at runtime.",
  participants: [
    { role: "Abstraction", name: "Report", kind: "abstract", description: "High-level logic. Holds a reference to an implementation object; that reference is the bridge." },
    { role: "Refined abstraction", name: "SalesReport, InventoryReport", kind: "concrete", description: "Variants of the high-level logic. Each one decides what data to pass to the renderer." },
    { role: "Implementation", name: "Renderer", kind: "interface", description: "Low-level operations the abstraction relies on, here render(title, rows)." },
    { role: "Concrete implementation", name: "CsvRenderer, MarkdownRenderer", kind: "concrete", description: "Do the low-level work in one particular way." },
  ],
  code: { python: mainPy, scala: mainScala },
  idiomatic: {
    note: "When the implementation side is a single operation, pass a function instead of an object: SalesReport(to_csv) in Python, or SalesReport(toCsv) with a (String, Rows) => String field in Scala. Keep full classes when the implementation has several related operations, like circle and rect in a drawing back-end.",
    code: { python: idiomaticPy, scala: idiomaticScala },
  },
  realWorldUses: [
    "Python logging: loggers decide what to log, handlers decide where it goes, and the two vary independently.",
    "Database APIs (JDBC, Python DB-API): one application-facing API with many vendor drivers behind it.",
    "GUI toolkits: the same widgets drawn by different platform back-ends.",
    "Notification services: message types on one side, delivery channels (SMS, email, push) on the other.",
  ],
  whenToUse: [
    "A class has two (or more) independent reasons to change, and inheritance would multiply the classes.",
    "You want to switch the implementation at runtime, for example the export format.",
    "You are designing up front for several platforms or vendors.",
  ],
  whenNotToUse: [
    "Only one dimension really varies; a plain interface is enough.",
    "The hierarchy is small and stable; Bridge adds a layer of indirection that does not pay off.",
  ],
  pros: [
    "Avoids a class explosion: M + N classes instead of M × N.",
    "Each side can be extended on its own (Open/Closed), and high-level code ignores platform details.",
  ],
  cons: [
    "A more abstract design that newcomers find harder to follow.",
    "You must choose the split carefully: the implementation interface has to suit every abstraction that uses it.",
  ],
  confusedWith: [
    { name: "Adapter", difference: "Adapter fixes a mismatch after the fact; Bridge is designed up front so two sides can vary." },
    { name: "Strategy", difference: "Same shape (an object holding an interface). Strategy swaps one algorithm; Bridge separates two whole hierarchies that both grow." },
    { name: "Abstract Factory", difference: "Often used with Bridge, to create the right implementation for the current platform." },
  ],
  solid:
    "Single Responsibility (what to show is separate from how to show it), Open/Closed (a new report or renderer needs no edits elsewhere) and Dependency Inversion (reports depend on the Renderer interface, not on CSV or Markdown code).",
  interviewUses: [
    "Notification system: message types times channels.",
    "Report or export systems with several formats.",
    "Payment types (one-time, subscription) times payment providers.",
    "Shapes or UI elements times drawing back-ends.",
  ],
  examples: [
    {
      id: "notify",
      domain: "Banking",
      title: "Alerts over many channels",
      situation:
        "A bank sends debit alerts and statement notices by SMS, email and push. A class for every message-and-channel pair (DebitAlertSms, DebitAlertEmail and so on) keeps growing, and each new channel touches every message type.",
      roles: [
        { role: "Abstraction", name: "Notification" },
        { role: "Refined abstraction", name: "TransactionAlert, StatementReady" },
        { role: "Implementation", name: "Channel" },
        { role: "Concrete implementation", name: "SmsChannel, EmailChannel, PushChannel" },
      ],
      why: "What a message says and how it travels change for different reasons. The notification writes the subject and body; the channel picks the address and the format.",
      goodToKnow:
        "Keep the implementation interface general. Here every channel receives a subject and a body, even though SMS ignores the subject and push ignores the body.",
      walkthrough: [
        "Meera spends ₹4,999 at a shop in Pune.",
        "A TransactionAlert built with SmsChannel sends the full text to her phone number.",
        "The same alert with PushChannel shows only the short subject.",
        "A StatementReady notice goes through EmailChannel with a greeting.",
        "Two message types and three channels give six combinations from only five classes.",
      ],
      code: { python: ex1Py, scala: ex1Scala },
    },
    {
      id: "lights",
      domain: "Smart home",
      title: "Switches and smart bulbs",
      situation:
        "A smart-home app supports toggle and dimmer switches, and bulbs that speak Wi-Fi or Zigbee. Users mix any switch with any bulb and sometimes replace the bulb later.",
      roles: [
        { role: "Abstraction", name: "Switch" },
        { role: "Refined abstraction", name: "ToggleSwitch, DimmerSwitch" },
        { role: "Implementation", name: "Bulb" },
        { role: "Concrete implementation", name: "WifiBulb, ZigbeeBulb" },
      ],
      why: "The switch decides the next brightness; the bulb decides how to send it. Because the switch only holds a Bulb reference, swapping the bulb at runtime needs no new switch.",
      goodToKnow:
        "Swapping the implementation at runtime is a key reason to choose Bridge over inheritance. With subclasses such as DimmerZigbeeSwitch you would have to rebuild the object.",
      walkthrough: [
        "The hall toggle switch drives a Wi-Fi bulb: pressing it twice sends 100% and then 0% as HTTP commands.",
        "The bedroom dimmer drives a Zigbee bulb and steps through 30%, 70% and 100%.",
        "The Zigbee bulb turns each percentage into a hex frame, such as 4C for 30%.",
        "The user replaces the bedroom bulb with a Wi-Fi one.",
        "The next press keeps the dimmer logic, wraps round to 0% and now sends an HTTP command.",
      ],
      code: { python: ex2Py, scala: ex2Scala },
    },
    {
      id: "render",
      domain: "Games",
      title: "Sprites on two back-ends",
      situation:
        "A 2D game draws players and coins. During development it logs plain-text drawing calls, and in the browser build it outputs SVG. Writing every sprite twice would double the work for each new sprite.",
      roles: [
        { role: "Abstraction", name: "Sprite" },
        { role: "Refined abstraction", name: "Player, Coin" },
        { role: "Implementation", name: "Renderer" },
        { role: "Concrete implementation", name: "DebugTextRenderer, SvgRenderer" },
      ],
      why: "Sprites are built from a few drawing primitives, so the renderer interface is small (circle and rect). A new sprite works on every back-end, and a new back-end draws every sprite.",
      goodToKnow:
        "Here the implementation has two related operations, which is why it is a class and not a single function. That is the usual sign that the full Bridge is worth it.",
      walkthrough: [
        "The demo loops over two renderers: debug text and SVG.",
        "For each renderer it creates a Player and a Coin that hold that renderer.",
        "Player.draw asks the renderer for a rectangle body and a circle head.",
        "Coin.draw asks for one small gold circle.",
        "The same sprites print as text lines first, then as SVG elements.",
      ],
      code: { python: ex3Py, scala: ex3Scala },
    },
    {
      id: "logging",
      domain: "Developer tools",
      title: "Loggers and sinks",
      situation:
        "A service has an application logger that filters noisy levels and an audit logger that must keep every line. Each one may write to the console in development or to an in-memory buffer in tests.",
      roles: [
        { role: "Abstraction", name: "Logger" },
        { role: "Refined abstraction", name: "AppLogger, AuditLogger" },
        { role: "Implementation", name: "Sink (a function type)" },
        { role: "Concrete implementation", name: "console_sink, audit_buffer.append" },
      ],
      why: "This mirrors Python's logging module: loggers decide what and how, handlers decide where. Because a sink has one operation, the implementation side is just a function.",
      goodToKnow:
        "Any function with the right shape can be a sink, including a bound method like list.append. That makes tests easy: pass a buffer and check its contents.",
      walkthrough: [
        "AppLogger with the console sink drops the DEBUG line and prints INFO and ERROR.",
        "AuditLogger is given audit_buffer.append as its sink.",
        "It records both lines, including DEBUG, because audits are never filtered.",
        "The demo shows that the buffer holds two lines.",
        "A second AuditLogger reuses the console sink without any new class.",
      ],
      code: { python: ex4Py, scala: ex4Scala },
    },
  ],
};

export default lesson;
