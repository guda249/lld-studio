import type { PatternLesson } from "../../types";
import problemPy from "./code/problem.py?raw";
import problemScala from "./code/problem.scala?raw";
import mainPy from "./code/main.py?raw";
import mainScala from "./code/main.scala?raw";
import idiomaticPy from "./code/idiomatic.py?raw";
import idiomaticScala from "./code/idiomatic.scala?raw";
import ex1Py from "./code/ex1-movie.py?raw";
import ex1Scala from "./code/ex1-movie.scala?raw";
import ex2Py from "./code/ex2-tickets.py?raw";
import ex2Scala from "./code/ex2-tickets.scala?raw";
import ex3Py from "./code/ex3-kyc.py?raw";
import ex3Scala from "./code/ex3-kyc.scala?raw";
import ex4Py from "./code/ex4-hospital.py?raw";
import ex4Scala from "./code/ex4-hospital.scala?raw";

const lesson: PatternLesson = {
  slug: "facade",
  analogy:
    "A hotel concierge. You say “book me dinner and a cab for 8 pm”, and the concierge calls the restaurant, the taxi firm and the front desk. You never deal with them yourself, but you still could if you wanted to.",
  problem: {
    text: "Every controller that places an order repeats the same choreography: reserve stock, charge the payment, schedule shipping, send a notification. Each caller depends on four services and on the right order of calls. When the flow changes, every caller must change, and sooner or later one copy forgets a step.",
    code: { python: problemPy, scala: problemScala },
  },
  solution:
    "An OrderFacade offers one method, place_order(), and does the coordination inside. Callers now depend on one class instead of four. The subsystem classes do not change and do not know the facade exists, so code that needs fine control can still use them directly.",
  participants: [
    { role: "Facade", name: "OrderFacade", kind: "concrete", description: "Knows which subsystem class handles each step and calls them in the right order. It coordinates; it holds no business rules of its own." },
    { role: "Subsystem classes", name: "Inventory, PaymentService, ShippingService, Notifier", kind: "concrete", description: "Do the real work. They have no reference to the facade." },
    { role: "Client", name: "Demo code", kind: "client", description: "Calls place_order() instead of talking to four services." },
  ],
  code: { python: mainPy, scala: mainScala },
  idiomatic: {
    note: "A facade does not have to be a class. In Python a module is often the facade: one public function such as place_order() and private helpers with a leading underscore. In Scala a singleton object with private members and one public method plays the same role.",
    code: { python: idiomaticPy, scala: idiomaticScala },
  },
  realWorldUses: [
    "The requests library: requests.get(url) hides connection pools, encoding, redirects and retries.",
    "Apache Spark's SparkSession: one entry point for SQL, DataFrames and configuration.",
    "Service layers in web apps, such as a CheckoutService that controllers call instead of using repositories directly.",
    "Cloud SDK helpers such as boto3's upload_file, which hides multipart uploads behind one call.",
  ],
  whenToUse: [
    "A subsystem is complex and most clients only need a common slice of it.",
    "You want to layer a system, with each layer talking to the one below only through a facade.",
    "You want to cut down how many classes each client depends on.",
  ],
  whenNotToUse: [
    "The facade starts to collect business logic and grows into a “god object” (one class that does everything). Keep it to coordination.",
    "Clients need fine-grained control. Do not hide the subsystem; offer the facade and the subsystem side by side.",
    "There is only one simple class behind it; a facade would just add a layer.",
  ],
  pros: [
    "A simple API with fewer dependencies for clients, so new team members get going faster.",
    "The subsystem can be refactored behind a stable surface.",
    "The order of steps, and the clean-up when one fails, live in one place.",
  ],
  cons: [
    "Risk of a bloated class that is coupled to everything.",
    "A facade that is too simple pushes power users back to the subsystem anyway.",
  ],
  confusedWith: [
    { name: "Adapter", difference: "An adapter makes one existing interface fit another that a client expects. A facade defines a new, simpler interface over many classes." },
    { name: "Mediator", difference: "Subsystem objects talk through a mediator and know it exists. With a facade, the subsystem does not know about it; only clients do." },
    { name: "Singleton", difference: "A facade is often a single instance, but that is a separate decision." },
  ],
  solid:
    "Single Responsibility for clients (they no longer orchestrate the flow), Interface Segregation (clients see a small surface) and Dependency Inversion when the facade is injected as an interface.",
  interviewUses: [
    "E-commerce checkout: stock, payment, shipping and notification.",
    "Movie ticket booking: seat lock, payment and ticket.",
    "Home automation “movie mode”.",
    "Computer start-up: CPU, memory and disk behind one boot() call.",
  ],
  examples: [
    {
      id: "movie",
      domain: "Smart home (IoT)",
      title: "Movie mode button",
      situation:
        "A smart-home app has separate controls for lights, AC, projector and sound bar. Users want one Movie mode button, not four screens to tap through every evening.",
      roles: [
        { role: "Facade", name: "HomeTheaterFacade" },
        { role: "Subsystem classes", name: "Lights, AirConditioner, Projector, SoundBar" },
        { role: "Client", name: "Demo code" },
      ],
      why: "The button needs a fixed sequence across four devices. The facade owns that sequence, and the device classes stay unchanged for the screens that still control them one by one.",
      goodToKnow:
        "Order matters: in end_movie the sound is muted before the lights come up. Keep sequences like this in the facade, not in the UI code.",
      walkthrough: [
        "The demo builds the facade with all four devices.",
        "watch_movie() dims the lights to 10% and sets the AC to 24°C.",
        "It then switches on the projector and the surround sound, and starts Sholay.",
        "end_movie() mutes the sound, turns off the projector and brings the lights back to 80%.",
      ],
      code: { python: ex1Py, scala: ex1Scala },
    },
    {
      id: "tickets",
      domain: "Entertainment",
      title: "Movie ticket booking",
      situation:
        "A ticketing app must lock seats, take a UPI payment and issue a ticket. If the payment fails, the seats must be freed again, and every screen that books tickets was getting that clean-up slightly wrong.",
      roles: [
        { role: "Facade", name: "BookingFacade" },
        { role: "Subsystem classes", name: "SeatLock, PaymentGateway, TicketService" },
        { role: "Client", name: "Demo code" },
      ],
      why: "The facade hides not only the order of the steps but also what to undo when one fails. Callers get one call and one clear result.",
      goodToKnow:
        "Undoing earlier steps after a failure is called compensation. A facade is a natural home for it, but keep the rules simple or move them into their own class.",
      walkthrough: [
        "Asha books F7 and F8; the seats lock, the payment works and she gets a ticket.",
        "Ravi asks for F8 and F9, but F8 is already locked, so he is told the seats are taken.",
        "A third user locks G1, but the UPI payment bounces.",
        "The facade releases G1 again, so only F7 and F8 stay locked.",
      ],
      code: { python: ex2Py, scala: ex2Scala },
    },
    {
      id: "kyc",
      domain: "Fintech",
      title: "Bank account opening",
      situation:
        "A bank's mobile app opens accounts using four vendor APIs: PAN check, Aadhaar OTP, credit bureau and core banking. The app team should not learn four APIs or decide the card limit rules.",
      roles: [
        { role: "Facade", name: "AccountOpeningFacade" },
        { role: "Subsystem classes", name: "PanVerifier, AadhaarOtp, CreditBureau, CoreBanking" },
        { role: "Client", name: "Mobile app (demo code)" },
      ],
      why: "The facade turns four calls with different shapes into one call that returns one simple result. The app checks ok and shows detail.",
      goodToKnow:
        "Here the facade creates its own subsystem objects. That is easy to start with, but passing them in, as the main example does, makes the facade easier to test.",
      walkthrough: [
        "Priya's PAN and OTP pass, her credit score is high, and she gets a ₹200,000 card limit.",
        "Karan passes too, but his lower score gives a ₹50,000 limit.",
        "Imran's PAN has the wrong format, so the flow stops at the first step.",
        "Neha enters the wrong OTP, so no account is opened.",
      ],
      code: { python: ex3Py, scala: ex3Scala },
    },
    {
      id: "hospital",
      domain: "Healthcare",
      title: "Hospital admission desk",
      situation:
        "Front-desk staff admit patients: find a bed, check insurance and take a deposit. Billing has its own team and its own rules, and the admission screen should not reach into them.",
      roles: [
        { role: "Facade", name: "AdmissionFacade" },
        { role: "Facade (lower layer)", name: "BillingFacade" },
        { role: "Subsystem classes", name: "BedManager, InsuranceDesk, InvoiceService" },
      ],
      why: "This is the layered flavour: a facade can sit on top of another facade. The admission desk talks to billing only through BillingFacade, so each team can change its own insides freely.",
      goodToKnow:
        "Layers of facades keep teams apart, but each layer adds a hop. Stop when a layer only passes calls through unchanged.",
      walkthrough: [
        "Mr. Rao gets general bed G-12.",
        "BillingFacade asks the insurance desk, which covers ₹100,000 of the ₹140,000 estimate.",
        "So the deposit is ₹40,000.",
        "Ms. Das needs an ICU bed, but none is free, so she goes on the waitlist.",
        "Mr. Sen has no insurance, so he gets bed G-14 and pays the full ₹60,000 deposit.",
      ],
      code: { python: ex4Py, scala: ex4Scala },
    },
  ],
};

export default lesson;
