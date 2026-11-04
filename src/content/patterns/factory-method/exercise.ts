import type { Exercise } from "../../../review/types";

const exercise: Exercise = {
  slug: "factory-method",
  task: "OrderNotifier.send() picks the message class with if/else on the channel name, so every new channel means editing it. Refactor it into the Factory Method pattern so a new channel is a new subclass and send() never changes.",
  goals: [
    "A Message interface (an ABC in Python, a trait in Scala) that every message class implements",
    "A Notifier base class with a factory method (create_message / createMessage) that returns a Message",
    "send() calls the factory method and never names EmailMessage or SmsMessage",
    "At least two Notifier subclasses that override the factory method, each returning its own message",
    "No if/else on the channel name left anywhere"
  ],
  hints: [
    "Look at what changes between channels: only which message object gets created. Everything else in send() stays the same.",
    "Pull the creation out into its own method on the base class, and make send() call that method instead of the if/else.",
    "Make that method abstract in Notifier, then write EmailNotifier and SmsNotifier that override it to return EmailMessage() and SmsMessage()."
  ]
};

export default exercise;
