import type { PatternLesson } from "../../types";
import problemPy from "./code/problem.py?raw";
import problemScala from "./code/problem.scala?raw";
import mainPy from "./code/main.py?raw";
import mainScala from "./code/main.scala?raw";
import idiomaticPy from "./code/idiomatic.py?raw";
import idiomaticScala from "./code/idiomatic.scala?raw";
import ex1Py from "./code/ex1-sms.py?raw";
import ex1Scala from "./code/ex1-sms.scala?raw";
import ex2Py from "./code/ex2-sensor.py?raw";
import ex2Scala from "./code/ex2-sensor.scala?raw";
import ex3Py from "./code/ex3-lab.py?raw";
import ex3Scala from "./code/ex3-lab.scala?raw";
import ex4Py from "./code/ex4-ranking.py?raw";
import ex4Scala from "./code/ex4-ranking.scala?raw";

const lesson: PatternLesson = {
  slug: "adapter",
  analogy:
    "A travel plug adapter. Your Indian charger does not fit a UK socket. You do not rewire the hotel or your charger; you put an adapter in between.",
  problem: {
    text: "Your checkout wants to call pay(amount_inr). The bank's SDK, which you cannot edit, offers make_transfer(amount_paise, currency_code) and returns a dict. Calling the SDK directly from every place that takes money spreads its units and data shape through the codebase: the rupee-to-paise conversion is copied, one copy forgets it, and switching banks means editing every call site.",
    code: { python: problemPy, scala: problemScala },
  },
  solution:
    "Write an adapter class that implements your own interface (PaymentGateway) and translates each call into the SDK's terms: rupees to paise on the way in, and the response dict to a reference string on the way out. Business code talks only to PaymentGateway, so the SDK's odd shape lives in one class.",
  participants: [
    { role: "Target", name: "PaymentGateway", kind: "interface", description: "The interface your code wants to call." },
    { role: "Adaptee", name: "LegacyBankApi", kind: "concrete", description: "The existing class with the wrong interface, often third-party code you cannot change." },
    { role: "Adapter", name: "LegacyBankAdapter", kind: "concrete", description: "Implements the target, holds the adaptee and translates every call and result." },
    { role: "Client", name: "Checkout", kind: "client", description: "Knows only the target interface, never the SDK." },
  ],
  code: { python: mainPy, scala: mainScala },
  idiomatic: {
    note: "When the target is a single operation, the adapter can be a function. In Python, duck typing lets a small closure or lambda stand in for the whole class. In Scala, an extension method such as bankApi.asGateway returns a lambda that the compiler turns into a PaymentGateway, because the trait has only one abstract method. Both also make test fakes one line long.",
    code: { python: idiomaticPy, scala: idiomaticScala },
  },
  realWorldUses: [
    "Python io.TextIOWrapper turns a binary stream into a text stream; Java InputStreamReader does the same.",
    "Scala's scala.jdk.CollectionConverters (.asScala and .asJava) adapt Java and Scala collections to each other.",
    "Python functools.cmp_to_key adapts an old comparator function to the key= argument of sorted().",
    "Wrapping every third-party SDK (payments, SMS, maps) behind your own interface so vendors can be swapped.",
  ],
  whenToUse: [
    "You want to use an existing class, but its interface does not match what your code needs.",
    "You are integrating legacy code or a third-party library that you cannot modify.",
    "You want to shield your domain from a vendor's names, units and data shapes.",
  ],
  whenNotToUse: [
    "You own both sides and can simply change one of the interfaces.",
    "The interfaces already match; an adapter would be a pointless middle layer.",
  ],
  pros: [
    "Conversion code lives in one place (Single Responsibility); the client and the adaptee stay untouched (Open/Closed).",
    "Vendors become swappable: a new provider is one new adapter.",
  ],
  cons: [
    "One more class per integration.",
    "Long chains of adapters hide what is really happening and can hide slow calls.",
  ],
  confusedWith: [
    { name: "Facade", difference: "A facade defines a new, simpler interface over many classes; an adapter makes one existing class fit an interface you already have." },
    { name: "Decorator", difference: "A decorator keeps the same interface and adds behaviour; an adapter changes the interface." },
    { name: "Proxy", difference: "A proxy keeps the same interface and controls access to the real object." },
    { name: "Bridge", difference: "Bridge is planned up front to let two hierarchies vary; Adapter fixes a mismatch after the fact." },
  ],
  solid:
    "Single Responsibility (translation in one place), Open/Closed (new vendors without changing clients), Dependency Inversion (business code depends on your PaymentGateway, not on the vendor SDK) and Interface Segregation (a fat SDK is narrowed to a small interface).",
  interviewUses: [
    "Payment-gateway integration with several providers.",
    "Maps or geocoding providers behind one interface.",
    "Migrating from a legacy system while the new one is built.",
    "Plugging different logging or notification libraries into one interface.",
  ],
  examples: [
    {
      id: "sms",
      domain: "Telecom",
      title: "OTP via two SMS vendors",
      situation:
        "An app sends one-time passwords by SMS. It uses two vendors whose SDKs have different method names, phone formats and return values, and it must switch to the second vendor when the first one fails.",
      roles: [
        { role: "Target", name: "SmsSender" },
        { role: "Adaptee", name: "QuickSmsClient, BharatTelClient" },
        { role: "Adapter", name: "QuickSmsAdapter, BharatTelAdapter" },
        { role: "Client", name: "send_otp" },
      ],
      why: "Each adapter hides one vendor's quirks behind send(phone, text). Because every adapter is an SmsSender, a FallbackSender that tries them in order is also just an SmsSender, and send_otp never changes.",
      goodToKnow:
        "Adapters should also translate errors: here each one turns its vendor's status into a simple true or false, so the fallback logic does not need to know any vendor's error codes.",
      walkthrough: [
        "The first OTP goes through the QuickSms adapter, which calls send_message and checks for the queued state.",
        "For the second OTP, QuickSms is down, so its adapter returns false.",
        "FallbackSender prints the failure and moves on to the BharatTel adapter.",
        "That adapter strips +91 from the number, because BharatTel wants ten digits, and checks for status 200.",
        "send_otp prints delivered both times without knowing which vendor was used.",
      ],
      code: { python: ex1Py, scala: ex1Scala },
    },
    {
      id: "sensor",
      domain: "IoT",
      title: "Fahrenheit probe in a Celsius dashboard",
      situation:
        "A vaccine cold room uses new sensors that report Celsius and a few imported probes whose firmware reports only Fahrenheit. The alert dashboard expects every sensor to report Celsius.",
      roles: [
        { role: "Target", name: "TemperatureSensor" },
        { role: "Adaptee", name: "LegacyFahrenheitProbe" },
        { role: "Adapter", name: "ProbeAdapter" },
        { role: "Client", name: "check_cold_room" },
      ],
      why: "This is the class adapter flavour: ProbeAdapter inherits from the probe and from the target, so it is both at once and converts the reading in celsius().",
      goodToKnow:
        "A class adapter works only when you can subclass the adaptee and it fixes the adaptee at compile time. The object adapter (holding the adaptee in a field) is more common because it also works with final classes and with objects you are handed.",
      walkthrough: [
        "The room has one native Celsius sensor and two Fahrenheit probes wrapped in ProbeAdapter.",
        "check_cold_room asks every sensor for celsius() through the same interface.",
        "The adapter reads 39.2 °F from the probe and converts it to 4.0 °C, which is fine.",
        "The second probe reads 46.4 °F, which is 8.0 °C, above the 5 °C limit, so it raises an alert.",
        "Because the adapter inherits from the probe, read_f() is still available for debugging.",
      ],
      code: { python: ex2Py, scala: ex2Scala },
    },
    {
      id: "lab",
      domain: "Healthcare",
      title: "Legacy lab analyser",
      situation:
        "A hospital's doctor dashboard shows lab results as tidy records. An old analyser can only export one pipe-delimited string per patient, and it uses a numeric record number instead of the hospital's patient ID.",
      roles: [
        { role: "Target", name: "LabResultSource" },
        { role: "Adaptee", name: "OldLabSystem" },
        { role: "Adapter", name: "OldLabAdapter" },
        { role: "Client", name: "print_summary" },
      ],
      why: "The adapter translates in both directions: our patient ID into the analyser's number on the way in, and its string into LabResult records on the way out. The dashboard never sees the old format.",
      goodToKnow:
        "In Python the target is a Protocol, so OldLabAdapter matches it by shape and needs no base class. Parsing code in an adapter is a good place for validation, because bad data from old systems is common.",
      walkthrough: [
        "print_summary asks the adapter for the results of patient PT-1042.",
        "The adapter strips the PT- prefix and calls fetch_report with the number 1042.",
        "It splits the export on ~ into three tests and each test on | into its fields.",
        "Any flag other than N (normal) marks the result as abnormal.",
        "The summary lists haemoglobin and white cells for review: 2 of 3 results.",
      ],
      code: { python: ex3Py, scala: ex3Scala },
    },
    {
      id: "ranking",
      domain: "E-commerce",
      title: "Old ranking comparator",
      situation:
        "A shopping site's ranking rules live in an old comparator function that returns -1, 0 or 1. The modern sort functions want something else: Python's sorted() wants a key, and Scala's sorted wants an Ordering.",
      roles: [
        { role: "Target", name: "key with < (Python), Ordering (Scala)" },
        { role: "Adaptee", name: "legacy_rank_cmp" },
        { role: "Adapter", name: "RankKey, RankOrdering" },
        { role: "Client", name: "sorted" },
      ],
      why: "Rewriting tested ranking rules is risky. A tiny adapter lets the old function plug straight into the standard sort, and here the adaptee is a function rather than a class.",
      goodToKnow:
        "The standard libraries already ship this adapter: functools.cmp_to_key in Python and Ordering.fromLessThan in Scala. Look for a built-in adapter before writing your own.",
      walkthrough: [
        "The catalogue has four products, one of them out of stock.",
        "The hand-written adapter answers < (or compare) by calling the old comparator.",
        "In-stock items come first, then higher rating, then lower price.",
        "Kurta beats Saree on price because both are rated 4.5, and Sneakers come last because they are out of stock.",
        "The built-in adapter gives exactly the same order.",
      ],
      code: { python: ex4Py, scala: ex4Scala },
    },
  ],
};

export default lesson;
