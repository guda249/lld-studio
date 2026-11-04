import type { CaseStudy } from "../../extras/types";
import python from "./code/main.py?raw";
import scala from "./code/Main.scala?raw";

const study: CaseStudy = {
  slug: "notification-service",
  title: "Notification service",
  difficulty: 2,
  tagline: "Turn app events into email, SMS and push messages, respecting each user's choices and limits.",
  prompt:
    "Design a notification service. Other parts of the app (orders, login, marketing) report events such as 'order shipped'. The service turns each event into a message and sends it to the user by email, SMS or push, following the user's preferences. Don't spam people.",
  clarify: [
    { q: "Who sends events to the service, and how?", a: "Other services publish events on an in-process event bus. The notification service is one subscriber; it never calls the order or login code." },
    { q: "Which channels do we need?", a: "Email, SMS and push for now. WhatsApp and in-app inbox are likely next, so a new channel must be a new class." },
    { q: "Does every message go to every channel?", a: "No. Each user picks channels per category, in order. Normal messages stop at the first channel that works. Security messages go to every channel the user picked, because missing one is risky." },
    { q: "What does 'don't spam' mean?", a: "A per-user limit per channel, e.g. at most 2 SMS in 60 minutes. Extra messages are dropped and logged. The current time is passed in, so tests are repeatable." },
    { q: "Where does the message text come from?", a: "A template per event type with {placeholders} filled from the event data and the user's name. Events with no template are ignored and logged." },
    { q: "Do we really send emails and texts?", a: "No. Each channel writes to an outbox list; a real provider would sit behind the same interface. Retries and delivery receipts are follow-ups." }
  ],
  requirements: {
    functional: [
      "Receive events from other services without them knowing about the notification service",
      "Render the message from a template for the event type",
      "Send by email, SMS or push, in the order the user prefers for that category",
      "Fall back to the next channel when one can't deliver (no phone number, app not installed)",
      "Send security messages to every preferred channel",
      "Limit how many messages one user gets per channel in a time window",
      "Log every attempt with its result"
    ],
    nonFunctional: [
      "A new channel is a new class; NotificationService does not change",
      "Rate limiting wraps any channel without editing it",
      "Deterministic: time is a parameter, so the same input gives the same log"
    ],
    outOfScope: ["Real email/SMS providers and their APIs", "Persistence, queues across machines and retries", "Unsubscribe pages and a preferences UI"]
  },
  entities: [
    { name: "User", responsibility: "Contact details (email, phone, push token) and channel preferences per category." },
    { name: "Event", responsibility: "Something that happened: its name, the user, the time and some data for the template." },
    { name: "EventBus", responsibility: "Keeps the subscribers and hands every published event to each of them." },
    { name: "NotificationService", responsibility: "Subscribes to events, renders the text, picks channels from the user's preferences and logs each attempt." },
    { name: "TemplateStore", responsibility: "Maps an event name to a category and a text, and fills in the placeholders." },
    { name: "Channel", responsibility: "Sends one text to one user and says what happened. EmailChannel, SmsChannel and PushChannel are the variants." },
    { name: "RateLimitedChannel", responsibility: "Wraps any Channel and refuses to send more than N messages per user in a time window." },
    { name: "Delivery", responsibility: "One line of the log: event, user, channel and status." }
  ],
  uml: {
    classes: [
      { name: "EventBus", kind: "concrete", members: ["- listeners: list[EventListener]", "+ subscribe(listener)", "+ publish(event)"] },
      { name: "EventListener", kind: "interface", members: ["+ on_event(event)"] },
      { name: "NotificationService", kind: "concrete", members: ["- users: dict[str, User]", "- channels: dict[str, Channel]", "+ log: list[Delivery]", "+ on_event(event)"] },
      { name: "Event", kind: "concrete", members: ["+ name: str", "+ user_id: str", "+ at: int", "+ data: dict"] },
      { name: "User", kind: "concrete", members: ["+ email / phone / push_token", "+ prefs: dict[str, list[str]]"] },
      { name: "TemplateStore", kind: "concrete", members: ["+ render(event, user)"] },
      { name: "Channel", kind: "interface", members: ["+ name()", "+ send(user, text, now)"] },
      { name: "EmailChannel", kind: "concrete" },
      { name: "SmsChannel", kind: "concrete" },
      { name: "PushChannel", kind: "concrete" },
      { name: "RateLimitedChannel", kind: "concrete", members: ["- inner: Channel", "- limit, window: int", "+ send(user, text, now)"] },
      { name: "Delivery", kind: "concrete", members: ["+ event, user, channel, status"] }
    ],
    relations: [
      { from: "NotificationService", to: "EventListener", type: "realization" },
      { from: "EventBus", to: "EventListener", type: "aggregation" },
      { from: "EventListener", to: "Event", type: "dependency" },
      { from: "EmailChannel", to: "Channel", type: "realization" },
      { from: "SmsChannel", to: "Channel", type: "realization" },
      { from: "PushChannel", to: "Channel", type: "realization" },
      { from: "RateLimitedChannel", to: "Channel", type: "realization" },
      { from: "NotificationService", to: "User", type: "aggregation" },
      { from: "NotificationService", to: "Channel", type: "aggregation" },
      { from: "NotificationService", to: "TemplateStore", type: "association" },
      { from: "NotificationService", to: "Delivery", type: "aggregation" },
      { from: "TemplateStore", to: "Event", type: "dependency" },
      { from: "Channel", to: "User", type: "dependency" }
    ]
  },
  flow: {
    title: "An order-shipped event reaches Asha by push",
    sequence: {
      label: "The order service publishes an event on the bus; the notification service renders the template, tries the user's first channel, push, which sends it, and logs the delivery.",
      participants: [
        { id: "orders", name: "Order service", kind: "client" },
        { id: "bus", name: "EventBus", kind: "concrete" },
        { id: "svc", name: "NotificationService", kind: "concrete" },
        { id: "tpl", name: "TemplateStore", kind: "concrete" },
        { id: "push", name: "PushChannel", kind: "concrete" }
      ],
      messages: [
        { from: "orders", to: "bus", label: "publish(order.shipped, u1)" },
        { from: "bus", to: "svc", label: "on_event(event)" },
        { from: "svc", to: "tpl", label: "render(event, Asha)" },
        { from: "tpl", to: "svc", label: "(orders, \"Hi Asha, order #501…\")", kind: "return" },
        { from: "svc", to: "svc", label: "prefs[orders] = push, sms, email", kind: "self" },
        { from: "svc", to: "push", label: "send(Asha, text, now)" },
        { from: "push", to: "svc", label: "\"sent\"", kind: "return" },
        { from: "svc", to: "svc", label: "log Delivery; stop (not security)", kind: "self" }
      ]
    }
  },
  patterns: [
    {
      slug: "observer",
      where: "EventBus keeps a list of EventListener; NotificationService subscribes and gets on_event for every published Event.",
      why: "The order and login services must not know who reacts to their events. Analytics or an audit log can subscribe later without any change to the publishers."
    },
    {
      slug: "strategy",
      where: "Channel with EmailChannel, SmsChannel and PushChannel; NotificationService looks one up by name and calls send.",
      why: "How a message is delivered is the part that keeps growing (WhatsApp, in-app, Slack). Each channel is its own class, so the routing code never changes."
    },
    {
      slug: "decorator",
      where: "RateLimitedChannel implements Channel and wraps another Channel (here the SmsChannel).",
      why: "Limits, retries or quiet hours apply to some channels and not others. A wrapper adds the behaviour to any channel without editing it, and wrappers can be stacked."
    }
  ],
  code: { python, scala },
  tradeoffs: [
    "We chose an event bus over the order service calling NotificationService directly because publishers stay unaware of who listens, so new reactions never touch their code.",
    "We chose a rate-limit decorator over a counter inside SmsChannel because the same limit can then wrap email or push too, and the channel classes stay about delivery only.",
    "We chose 'stop at the first channel that works' for normal messages over sending everywhere because users hate the same message three times; security messages are the exception because a missed alert is worse than a duplicate.",
    "We chose to pass the time (now) in over reading a clock because the rate limiter then gives the same answer in every test run.",
    "We chose to return a status string from send over raising errors because 'no phone number' and 'rate limited' are normal outcomes that drive the fallback, not crashes."
  ],
  followUps: [
    { q: "The SMS provider is down for ten minutes. What happens?", a: "Wrap the channel in a RetryingChannel decorator, or better, put failed messages on a durable retry queue with backoff. The fallback to the next channel already covers users who picked more than one channel." },
    { q: "How does this scale to millions of events per hour?", a: "Replace the in-process bus with a message broker (Kafka, SQS). Run many stateless notification workers that read from it, partitioned by user id so one user's rate-limit state lives on one worker, or keep that state in Redis." },
    { q: "How do you avoid sending the same message twice if a worker crashes and the event is redelivered?", a: "Give each event an id and record (event id, user, channel) before or after sending; skip if it is already there. That makes handling idempotent." },
    { q: "How would you add quiet hours (no push between 22:00 and 07:00)?", a: "Another decorator, QuietHoursChannel, that checks now and returns 'quiet hours' so the service falls back or delays. Nothing else changes; it can wrap the rate-limited channel." },
    { q: "Marketing wants to send one offer to 100,000 users. Does the design hold?", a: "Publish one campaign event and fan it out into per-user events in batches, so the bus and the providers are not flooded; lower-priority categories go on a separate, slower queue than security alerts." }
  ],
  extend: [
    "Add a WhatsAppChannel that needs a phone number and a 'whatsapp opted in' flag on User.",
    "Add a QuietHoursChannel decorator that refuses to send between minute 1320 and minute 420 and returns 'quiet hours'.",
    "Add an AuditLog listener that subscribes to the EventBus and counts events by name.",
    "Make the rate limit per category instead of per channel (security never limited), and check the log."
  ],
  quiz: [
    {
      type: "mcq", tag: "Which pattern?",
      prompt: "We want every channel to retry once when the provider fails, without editing EmailChannel, SmsChannel or PushChannel. Which pattern fits?",
      options: [
        "Decorator: a RetryingChannel that wraps any Channel",
        "Observer: channels subscribe to failures",
        "Singleton: one shared retry manager",
        "Template Method: a base class with a retry step"
      ],
      answer: 0,
      hint: "RateLimitedChannel already does something similar.",
      explain: "A wrapper with the same Channel interface adds retrying to any channel and can be stacked with the rate limiter. Observer is about telling listeners about events, not changing how a send behaves; a Singleton doesn't add behaviour to channels; Template Method would force editing the channel class hierarchy."
    },
    {
      type: "bug", tag: "Find the problem",
      prompt: "This rate limiter lets users get more messages than the limit. Tap the line that causes it.",
      code: { lang: "python", text: `def send(self, user: User, text: str, now: int) -> str:
    times = [t for t in self._recent.get(user.user_id, []) if t > now - self._window]
    if len(times) > self._limit:
        return "rate limited"
    status = self._inner.send(user, text, now)
    if status == "sent":
        times.append(now)
    self._recent[user.user_id] = times
    return status` },
      answer: 3,
      hint: "With limit 2, how many messages get through before it refuses?",
      explain: "Line 3 uses > instead of >=, so with a limit of 2 a third message is still sent (2 > 2 is false). Line 2 correctly keeps only recent times, and lines 6–7 only count messages that were really sent."
    },
    {
      type: "mcq", tag: "Scenario",
      prompt: "Ben has no phone number, and his 'orders' preference is sms then email. An order ships. What does the log show?",
      options: [
        "Only an email line, because SMS is skipped silently",
        "An sms line with 'no phone number', then an email line with 'sent'",
        "An sms line with 'no phone number', and nothing is sent",
        "Both sms and email lines with 'sent'"
      ],
      answer: 1,
      hint: "Every attempt is logged, and normal messages fall back until one works.",
      explain: "The service tries channels in Ben's order and logs each attempt. SMS returns 'no phone number', so it moves on; email sends and, as 'orders' is not security, it stops there. Nothing is skipped silently, and SMS can't succeed without a number."
    },
    {
      type: "order", tag: "Put in order",
      prompt: "Put the steps of handling one event in the right order.",
      steps: [
        "The order service publishes the event on the EventBus",
        "The bus calls on_event on NotificationService",
        "Look up the user and render the template",
        "Try the user's preferred channels for that category in order",
        "Log each attempt as a Delivery"
      ],
      shuffled: [2, 0, 4, 1, 3],
      hint: "Nothing can be sent before the text exists.",
      explain: "The event must be published before any subscriber hears it. The service needs the user and the rendered text before it can try a channel, and each attempt is logged as it happens, so the log matches what was really sent."
    }
  ]
};

export default study;
