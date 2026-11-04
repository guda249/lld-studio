import type { CaseStudy } from "../../extras/types";
import python from "./code/main.py?raw";
import scala from "./code/Main.scala?raw";

const vendingMachine: CaseStudy = {
  slug: "vending-machine",
  title: "Vending Machine",
  difficulty: 2,
  tagline: "Coins, change and a machine whose buttons change meaning with its state.",
  prompt:
    "Design a vending machine. It holds products in slots, accepts coins, lets the customer pick a product, gives the " +
    "product and the change, and supports cancel. Show me what happens when it runs out of stock or cannot give change.",
  clarify: [
    { q: "Which coins does it take?", a: "Coins of 1, 2, 5 and 10. No notes and no cards." },
    { q: "When is money taken: before or after choosing?", a: "Coins first, then the product code. Selecting with too little money tells you how much more to insert." },
    { q: "What if the machine cannot give exact change?", a: "It refuses the sale and keeps the coins as a balance; the customer can pick something else or cancel for a full refund." },
    { q: "What happens when everything is sold out?", a: "The machine goes into a sold-out mode and returns any coin straight away until someone restocks it." },
    { q: "Who needs to know when a slot is empty?", a: "An operator alert. Later maybe an app or a restocking service, so it should be easy to add listeners." }
  ],
  requirements: {
    functional: [
      "Accept coins and show the balance",
      "Select a product by slot code; refuse unknown or empty slots",
      "Dispense the product and the change, using coins the machine actually has",
      "Cancel returns exactly the coins inserted",
      "Sold-out mode when all slots are empty; restock brings it back",
      "Alert the operator when a slot runs empty"
    ],
    nonFunctional: [
      "Each button's behaviour per mode lives in one place (no big if/elif on a status string)",
      "The change-making rule can be swapped without touching the machine",
      "Deterministic demo: no clock, no threads"
    ],
    outOfScope: ["Card or mobile payments", "Persistence of stock and coins", "Hardware (motors, coin validator)", "Pricing changes and discounts"]
  },
  entities: [
    { name: "VendingMachine", responsibility: "What the customer touches: forwards each button to the current state; holds balance and coin box." },
    { name: "VendingState", responsibility: "What insert, select, cancel and dispense mean in the current mode." },
    { name: "HasMoneyState", responsibility: "Checks stock, price and change before moving to dispensing." },
    { name: "DispensingState", responsibility: "Releases the product, pays out change, then goes idle or sold out." },
    { name: "Inventory", responsibility: "Products and counts per slot; tells observers when a slot empties." },
    { name: "Product", responsibility: "A name and a price. Plain data." },
    { name: "ChangeStrategy", responsibility: "Picks the coins to give back from the coin box (GreedyChange)." },
    { name: "StockObserver", responsibility: "Anything that wants to hear about empty slots (RefillAlert)." }
  ],
  uml: {
    classes: [
      { name: "VendingMachine", kind: "concrete", members: ["- state: VendingState", "+ inventory: Inventory", "+ change: ChangeStrategy", "+ insert_coin(coin)", "+ select(code)"] },
      { name: "VendingState", kind: "interface", members: ["+ insert_coin(machine, coin)", "+ select(machine, code)", "+ cancel(machine)", "+ dispense(machine)"] },
      { name: "IdleState", kind: "concrete" },
      { name: "HasMoneyState", kind: "concrete" },
      { name: "DispensingState", kind: "concrete", members: ["+ code: str", "+ coins: list[Coin]"] },
      { name: "SoldOutState", kind: "concrete" },
      { name: "Inventory", kind: "concrete", members: ["- items: dict[str, Product]", "+ add(code, product, count)", "+ take(code)", "+ subscribe(observer)"] },
      { name: "Product", kind: "concrete", members: ["+ name: str", "+ price: int"] },
      { name: "ChangeStrategy", kind: "interface", members: ["+ make_change(amount, box)"] },
      { name: "GreedyChange", kind: "concrete", members: ["+ make_change(amount, box)"] },
      { name: "StockObserver", kind: "interface", members: ["+ on_empty(code, product)"] },
      { name: "RefillAlert", kind: "concrete", members: ["+ on_empty(code, product)"] }
    ],
    relations: [
      { from: "VendingMachine", to: "VendingState", type: "composition" },
      { from: "VendingMachine", to: "Inventory", type: "association" },
      { from: "VendingMachine", to: "ChangeStrategy", type: "association" },
      { from: "VendingState", to: "VendingMachine", type: "dependency" },
      { from: "IdleState", to: "VendingState", type: "realization" },
      { from: "HasMoneyState", to: "VendingState", type: "realization" },
      { from: "DispensingState", to: "VendingState", type: "realization" },
      { from: "SoldOutState", to: "VendingState", type: "realization" },
      { from: "GreedyChange", to: "ChangeStrategy", type: "realization" },
      { from: "Inventory", to: "Product", type: "aggregation" },
      { from: "Inventory", to: "StockObserver", type: "aggregation" },
      { from: "RefillAlert", to: "StockObserver", type: "realization" },
      { from: "StockObserver", to: "Product", type: "dependency" }
    ]
  },
  flow: {
    title: "Buying a product with change",
    sequence: {
      label: "The customer selects A1 with 20 inserted; the has-money state checks the price, asks the change strategy for 5 back, switches to dispensing, and the dispensing state takes the product from the inventory and pays out the change.",
      participants: [
        { id: "cust", name: "Customer", kind: "client" },
        { id: "vm", name: "VendingMachine", kind: "concrete" },
        { id: "has", name: "HasMoneyState", kind: "concrete" },
        { id: "chg", name: "GreedyChange", kind: "concrete" },
        { id: "disp", name: "DispensingState", kind: "concrete" },
        { id: "inv", name: "Inventory", kind: "concrete" }
      ],
      messages: [
        { from: "cust", to: "vm", label: "select(\"A1\")" },
        { from: "vm", to: "has", label: "select(machine, \"A1\")" },
        { from: "has", to: "chg", label: "make_change(5, box)" },
        { from: "chg", to: "has", label: "[5]", kind: "return" },
        { from: "has", to: "disp", label: "new DispensingState(\"A1\", [5])", kind: "create" },
        { from: "has", to: "vm", label: "set_state(dispensing); dispense()" },
        { from: "vm", to: "disp", label: "dispense(machine)" },
        { from: "disp", to: "inv", label: "take(\"A1\")" },
        { from: "disp", to: "vm", label: "pay_out([5]); set_state(Idle)" },
        { from: "vm", to: "cust", label: "Water + change 5", kind: "return" }
      ]
    }
  },
  states: {
    name: "The vending machine",
    states: ["Idle", "HasMoney", "Dispensing", "SoldOut"],
    transitions: [
      { from: "Idle", to: "HasMoney", on: "insert coin" },
      { from: "HasMoney", to: "HasMoney", on: "insert coin / not enough money / no change" },
      { from: "HasMoney", to: "Idle", on: "cancel (refund)" },
      { from: "HasMoney", to: "Dispensing", on: "select: in stock, paid, change possible" },
      { from: "Dispensing", to: "Idle", on: "product given, stock left" },
      { from: "Dispensing", to: "SoldOut", on: "last product given" },
      { from: "SoldOut", to: "Idle", on: "restock" }
    ]
  },
  patterns: [
    { slug: "state", where: "VendingState → IdleState, HasMoneyState, DispensingState, SoldOutState; VendingMachine.set_state", why: "The same button means different things in each mode (insert a coin when sold out returns it). Each mode is one class, so adding a MaintenanceState does not touch the others." },
    { slug: "strategy", where: "ChangeStrategy → GreedyChange, passed into VendingMachine", why: "Greedy change can fail when coins run low; a smarter (dynamic-programming) rule or a different coin set is a new class, not an edit to the machine." },
    { slug: "observer", where: "StockObserver → RefillAlert, Inventory.subscribe", why: "Operators, an app or a restocking service can listen for empty slots. Inventory only knows the interface, so new listeners need no changes." }
  ],
  code: { python, scala },
  tradeoffs: [
    "We chose State classes over a status enum with if/elif in every button because four buttons × four modes is sixteen branches spread over the machine; with State each mode's rules sit together.",
    "We chose greedy change-making over an exact (dynamic-programming) search because it is simple and correct for normal coin sets; the ChangeStrategy interface leaves room for the exact version.",
    "We chose to refund the exact coins inserted over computing a fresh refund because the customer expects their own coins back and it can never fail.",
    "We chose to check change before dispensing over dispensing first and hoping, because a machine that keeps money without giving change loses trust."
  ],
  followUps: [
    { q: "Greedy change fails for 6 with coins {5, 2, 2, 2}. How would you fix it?", a: "Write an ExactChange strategy that searches (dynamic programming over amounts, limited by coin counts) and pass it in. Nothing else changes." },
    { q: "How would you add card payments?", a: "Add a PaymentMethod abstraction: coins and card both credit a balance. A card needs no change, so the HasMoney state skips change-making when the balance came from a card." },
    { q: "Two customers press buttons at once on a networked machine. What do you protect?", a: "One physical machine serves one customer, but if commands arrive from an app too, run all button calls through a single queue or a lock so state changes happen one at a time." },
    { q: "How would you add a maintenance mode?", a: "A MaintenanceState that rejects coins and selections. The operator's key switches to it; restock and coin collection happen there." },
    { q: "Where would prices and discounts go?", a: "Keep Product plain and add a PricingStrategy (happy hour, member price) that HasMoneyState asks for the price." }
  ],
  extend: [
    "Write an ExactChange strategy that finds 6 = 2 + 2 + 2 when there is only one 5 coin, and use it in the demo.",
    "Add a MaintenanceState and an operator key that switches to it and back.",
    "Add a LowStockAlert observer that fires when a slot drops to 1 item.",
    "Let the customer buy a second product with the remaining balance instead of getting change at once."
  ],
  quiz: [
    {
      type: "mcq", tag: "Scenario", prompt: "The machine is sold out and someone inserts a coin. In this design, which class decides that the coin is returned?",
      options: ["SoldOutState", "VendingMachine, with an if on a sold-out flag", "Inventory", "GreedyChange"],
      answer: 0,
      hint: "VendingMachine forwards every button to someone. To whom?",
      explain: "VendingMachine forwards insert_coin to its current state, and SoldOutState returns the coin. There is no sold-out flag in the machine, Inventory only tracks stock, and GreedyChange only picks change coins."
    },
    {
      type: "bug", tag: "Find the problem", prompt: "This HasMoneyState.select can keep the customer's money and give no change. Tap the line that causes it.",
      code: { lang: "python", text: `def select(self, machine: VendingMachine, code: str) -> None:
    product = machine.inventory.product(code)
    if machine.balance < product.price:
        print("insert more")
        return
    machine.set_state(DispensingState(code, []))
    machine.dispense()` },
      answer: 6,
      hint: "What does the real version do between checking the price and dispensing?",
      explain: "Line 6 moves to dispensing with no change at all. The machine must ask the ChangeStrategy for the change first, and refuse the sale if the coin box cannot make it."
    },
    {
      type: "order", tag: "Put in order", prompt: "A customer has inserted 20 and selects Water (15). Put the steps in order.",
      steps: [
        "VendingMachine forwards select to HasMoneyState",
        "HasMoneyState checks stock and that 20 covers the price",
        "GreedyChange works out the change: one 5 coin",
        "The machine switches to DispensingState",
        "DispensingState takes Water from the Inventory and pays out the change",
        "The machine switches to Idle (or SoldOut if that was the last item)"
      ],
      shuffled: [4, 1, 5, 0, 3, 2],
      hint: "Check money and change before anything leaves the machine.",
      explain: "Forward, check, plan change, switch, give, settle. Planning change before dispensing is what stops the machine from keeping money it cannot return."
    },
    {
      type: "mcq", tag: "Which pattern?", prompt: "The owner wants an SMS sent to the restocking team when a slot empties. Which part of the design makes that easy?",
      options: [
        "StockObserver (Observer): add an SmsAlert and subscribe it to the Inventory",
        "VendingState (State): add an SmsState",
        "ChangeStrategy (Strategy): send the SMS while making change",
        "Make Inventory a Singleton"
      ],
      answer: 0,
      hint: "Which interface exists for hearing about empty slots?",
      explain: "Inventory already notifies StockObservers when a slot empties, so an SmsAlert is one new class. A new State or a change strategy is the wrong place, and Singleton has nothing to do with notifications."
    }
  ]
};

export default vendingMachine;
