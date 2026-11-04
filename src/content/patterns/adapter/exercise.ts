import type { Exercise } from "../../../review/types";

const exercise: Exercise = {
  slug: "adapter",
  task: "Three functions call the bank SDK directly, each converting rupees to paise by hand, and one already gets it wrong. Refactor it into the Adapter pattern so the conversion lives in one place and the rest of the code only knows a simple payment interface.",
  goals: [
    "A target interface (an ABC in Python, a trait in Scala) with the method your code wants, such as pay(amount_inr)",
    "An adapter class that implements the target and receives the LegacyBankApi through its constructor",
    "Each target method translates the call: converts rupees to paise, calls the SDK, and converts the reply back",
    "The client code depends only on the target interface, never on LegacyBankApi or the adapter class"
  ],
  hints: [
    "Write down the one method your checkout, wallet and subscription code would like to call, in rupees. That is your target.",
    "Make a class that implements that target and keeps a LegacyBankApi in a field. Move the paise conversion into it, once.",
    "LegacyBankAdapter(PaymentGateway) takes api: LegacyBankApi; its pay(amount_inr) calls api.make_transfer(paise, \"INR\") and returns the ref. Then give Checkout a PaymentGateway through its constructor and pass in LegacyBankAdapter(LegacyBankApi())."
  ]
};

export default exercise;
