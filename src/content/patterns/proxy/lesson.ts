import type { PatternLesson } from "../../types";
import problemPy from "./code/problem.py?raw";
import problemScala from "./code/problem.scala?raw";
import mainPy from "./code/main.py?raw";
import mainScala from "./code/main.scala?raw";
import idiomaticPy from "./code/idiomatic.py?raw";
import idiomaticScala from "./code/idiomatic.scala?raw";
import ex1Py from "./code/ex1-gallery.py?raw";
import ex1Scala from "./code/ex1-gallery.scala?raw";
import ex2Py from "./code/ex2-otp.py?raw";
import ex2Scala from "./code/ex2-otp.scala?raw";
import ex3Py from "./code/ex3-fares.py?raw";
import ex3Scala from "./code/ex3-fares.scala?raw";
import ex4Py from "./code/ex4-thermostat.py?raw";
import ex4Scala from "./code/ex4-thermostat.scala?raw";

const lesson: PatternLesson = {
  slug: "proxy",
  analogy:
    "A receptionist outside a director's office. Visitors talk to the receptionist as if it were the office. The receptionist checks your badge and only lets you in, or calls the director, when it is really needed.",
  problem: {
    text: "RealDocumentStore connects to remote storage, which is slow and costly, and it connects as soon as it is created, even if nobody reads anything. It also lets anyone read any document, so every caller has to remember its own permission check. One caller that forgets is a data leak.",
    code: { python: problemPy, scala: problemScala },
  },
  solution:
    "A DocumentStoreProxy implements the same DocumentStore interface. It checks the user's role first, and it creates the real store only on the first allowed read (lazy creation). Clients work with the DocumentStore interface and cannot tell whether they hold the proxy or the real store.",
  participants: [
    { role: "Subject", name: "DocumentStore", kind: "interface", description: "The interface shared by the real object and the proxy, so either can be used." },
    { role: "Real subject", name: "RealDocumentStore", kind: "concrete", description: "Does the actual work. It is expensive to create and has no access rules." },
    { role: "Proxy", name: "DocumentStoreProxy", kind: "concrete", description: "Holds or creates the real subject and controls access to it: here a role check and lazy creation." },
    { role: "Client", name: "print_document", kind: "client", description: "Uses any DocumentStore and never knows a proxy is in the way." },
  ],
  code: { python: mainPy, scala: mainScala },
  idiomatic: {
    note: "Scala's lazy val is a built-in virtual proxy for one value: it is computed on first use and then reused. In Python, functools.cached_property does the same for an attribute, and __getattr__ lets one small class forward every other attribute to the real object, giving a generic proxy for any class. Scala has no __getattr__, so the forwarding methods are written out.",
    code: { python: idiomaticPy, scala: idiomaticScala },
  },
  realWorldUses: [
    "ORMs such as SQLAlchemy and Hibernate return lazy-loading proxies for related objects.",
    "gRPC and other RPC client stubs are remote proxies: calling a method sends a network request.",
    "Reverse proxies and CDNs such as nginx and Cloudflare apply the same idea at network level: caching, auth and rate limiting.",
    "Mocking libraries such as unittest.mock create stand-in objects that record calls.",
  ],
  whenToUse: [
    "An expensive object should be created only when it is first needed (virtual proxy).",
    "Access must be checked without changing the real class (protection proxy).",
    "The real object lives in another process or machine (remote proxy).",
    "Calls should be cached, counted or logged without the client knowing (caching or logging proxy).",
  ],
  whenNotToUse: [
    "The real object is cheap and has no access rules; the proxy is pure overhead.",
    "Callers need to know about slowness or failure. A remote proxy that looks local can hide slow network calls, so make that visible in the interface.",
  ],
  pros: [
    "Controls the real object without changing it or its clients.",
    "Manages the life cycle: create late, reuse, release.",
    "Security, caching or remote calls stay out of the business class.",
  ],
  cons: [
    "One more layer, and possibly extra delay.",
    "Can hide important behaviour, such as a network call that may fail.",
  ],
  confusedWith: [
    { name: "Decorator", difference: "Both keep the same interface. A decorator adds features and the client stacks decorators itself. A proxy controls access to one real object and usually creates and owns it." },
    { name: "Adapter", difference: "An adapter offers a different interface; a proxy offers exactly the same one." },
    { name: "Facade", difference: "A facade simplifies many classes behind a new interface; a proxy stands in for one object with the same interface." },
  ],
  solid:
    "Single Responsibility (access rules and lazy loading are kept out of the document logic), Open/Closed (new controls without editing RealDocumentStore) and Liskov Substitution (the proxy works wherever a DocumentStore is expected).",
  interviewUses: [
    "Lazy image loading in a photo gallery.",
    "An access-controlled file system.",
    "A rate-limited API client.",
    "A caching layer in front of a slow service.",
  ],
  examples: [
    {
      id: "gallery",
      domain: "Media",
      title: "Lazy photo gallery",
      situation:
        "A photo app opens an album of 40 high-resolution holiday photos. Downloading and decoding all of them up front makes the album slow to open and wastes mobile data.",
      roles: [
        { role: "Subject", name: "Image" },
        { role: "Real subject", name: "HighResImage" },
        { role: "Proxy", name: "ImageProxy" },
      ],
      why: "This is a virtual proxy. The album holds cheap placeholders with the same Image interface, and each real image loads only when it is shown.",
      goodToKnow:
        "A real app would also free images that scroll far off screen. A proxy is a good home for that logic too, because it already owns the real object.",
      walkthrough: [
        "The album creates 40 ImageProxy objects, and nothing is loaded yet.",
        "Showing the first two photos loads just those two.",
        "Scrolling through the first screen of six loads the other four.",
        "Showing photo 1 again reuses the loaded image, so the count stays at six.",
      ],
      code: { python: ex1Py, scala: ex1Scala },
    },
    {
      id: "otp",
      domain: "Fintech",
      title: "OTP rate limiter",
      situation:
        "A payments app sends OTPs by SMS, and the vendor charges for each one. Bots and impatient users hammering the resend button were running up the bill.",
      roles: [
        { role: "Subject", name: "SmsGateway" },
        { role: "Real subject", name: "VendorSmsGateway" },
        { role: "Proxy", name: "RateLimitedSms" },
      ],
      why: "This is a protection proxy. It allows a call through to the vendor only when the phone number is within its limit, and the vendor client stays unchanged.",
      goodToKnow:
        "The demo passes the time in as a number so it never sleeps and is easy to test. Real code would read a clock, and a shared store such as Redis when there are many servers.",
      walkthrough: [
        "The proxy allows three OTPs per phone number in any 60 seconds.",
        "Requests at 0, 5 and 10 seconds go through to the vendor.",
        "The request at 15 seconds is blocked and told to wait 45 seconds.",
        "At 70 seconds the old requests have left the window, so the OTP is sent.",
        "A different phone number is not affected, and the vendor bills for 5 SMS.",
      ],
      code: { python: ex2Py, scala: ex2Scala },
    },
    {
      id: "fares",
      domain: "Travel",
      title: "Flight fare cache",
      situation:
        "A travel site calls an airline fare API on every search. Many users search the same route within a minute or two, and the airline bills per call.",
      roles: [
        { role: "Subject", name: "FareService" },
        { role: "Real subject", name: "AirlineFareApi" },
        { role: "Proxy", name: "CachedFareService" },
      ],
      why: "This is a caching proxy. Repeat searches within the time limit (the TTL, time to live) are answered from memory, and the search code does not change at all.",
      goodToKnow:
        "Pick the TTL with the business: too long and users see stale fares, too short and the cache saves little.",
      walkthrough: [
        "The first BLR-DEL search at 0 seconds calls the API: ₹5,400.",
        "Searches at 30 and 90 seconds are within the 120-second TTL, so they come from the cache.",
        "BOM-GOI is a new route, so it calls the API once.",
        "At 400 seconds the cached fare has expired, so the API is called again and returns the new ₹5,500.",
        "Five searches cost only three paid API calls.",
      ],
      code: { python: ex3Py, scala: ex3Scala },
    },
    {
      id: "thermostat",
      domain: "Smart buildings (IoT)",
      title: "Remote thermostat",
      situation:
        "A building dashboard controls thermostats on other floors and in other buildings. The dashboard code should not deal with message formats and network details.",
      roles: [
        { role: "Subject", name: "Thermostat" },
        { role: "Real subject", name: "DeviceThermostat" },
        { role: "Proxy", name: "ThermostatProxy" },
      ],
      why: "This is a remote proxy. It has the same methods as the device, but each call is turned into a message and sent over the network, so the dashboard code reads like local code.",
      goodToKnow:
        "Networks fail. A remote proxy should make timeouts and errors clear to callers instead of pretending every call is as safe as a local one.",
      walkthrough: [
        "A function stands in for the network and passes messages to the device.",
        "reading() on the proxy sends GET, and the device replies with the room and target temperature.",
        "set_target(22) sends SET:22, and the device updates its target.",
        "The next reading shows the new target of 22°C.",
      ],
      code: { python: ex4Py, scala: ex4Scala },
    },
  ],
};

export default lesson;
