import type { CaseStudy } from "../../extras/types";
import python from "./code/main.py?raw";
import scala from "./code/Main.scala?raw";

const rateLimiter: CaseStudy = {
  slug: "rate-limiter",
  title: "Rate limiter",
  difficulty: 2,
  tagline: "Token bucket, sliding window and fixed window behind one interface, in front of an API.",
  prompt:
    "Design a rate limiter for our public API. Each client may make only a certain number of requests in a time window; extra requests get HTTP 429. We want to try different limiting algorithms without touching the API code.",
  clarify: [
    { q: "Is the limit per client, per endpoint, or global?", a: "Per client (an API key or user id). Per-endpoint rules can come later." },
    { q: "Which algorithm do you want?", a: "Not decided: that's why it must be swappable. We compare token bucket, sliding window log and fixed window counter." },
    { q: "Should a client be able to burst after being quiet?", a: "With token bucket yes, up to the bucket size. The other two never allow more than the limit in any window." },
    { q: "What happens to a rejected request: queue it or drop it?", a: "Drop it at once with 429 Too Many Requests. No queue." },
    { q: "Single server or many?", a: "One process for this design. We discuss many servers as a follow-up." },
    { q: "How do we get the current time?", a: "The caller passes `now` (seconds) into every call. No hidden clock, so tests and the demo are repeatable." }
  ],
  requirements: {
    functional: [
      "allow(key, now) answers yes or no for one request of one client",
      "A rule says the limit, the window length and which algorithm to use",
      "Clients are limited independently: Alice being blocked never blocks Bob",
      "The API answers 429 for a rejected request and serves the request normally otherwise",
      "Adding a new algorithm needs no change in the API or the proxy"
    ],
    nonFunctional: [
      "O(1) time per check for token bucket and fixed window; sliding window log is O(requests in the window)",
      "Small memory per client (two numbers for token bucket and fixed window)",
      "Deterministic: the result depends only on the inputs, never on a clock read inside the limiter"
    ],
    outOfScope: ["Sharing counters between servers (Redis and similar)", "Thread safety", "Queuing or delaying requests", "Removing state of clients that went quiet"]
  },
  entities: [
    { name: "RateLimiter", responsibility: "The one question every algorithm answers: may this key make a request now?" },
    { name: "TokenBucket", responsibility: "Keeps tokens per client that refill at a steady rate; each request spends one." },
    { name: "SlidingWindowLog", responsibility: "Keeps the times of recent accepted requests per client and counts those inside the window." },
    { name: "FixedWindowCounter", responsibility: "Counts requests per client inside the current clock window (0–10 s, 10–20 s…)." },
    { name: "Rule", responsibility: "Configuration: limit, window length and algorithm." },
    { name: "LimiterFactory", responsibility: "Builds the right RateLimiter for a Rule, so no one else names a concrete algorithm." },
    { name: "RateLimitedApi", responsibility: "Sits in front of the real API with the same interface and rejects calls over the limit." },
    { name: "OrderApi", responsibility: "The real service; it knows nothing about limits." }
  ],
  uml: {
    classes: [
      { name: "RateLimiter", kind: "interface", members: ["+ allow(key, now): bool"] },
      { name: "TokenBucket", kind: "concrete", members: ["- capacity", "- rate", "- buckets", "+ allow(key, now)"] },
      { name: "SlidingWindowLog", kind: "concrete", members: ["- limit", "- window", "- log", "+ allow(key, now)"] },
      { name: "FixedWindowCounter", kind: "concrete", members: ["- limit", "- window", "- counts", "+ allow(key, now)"] },
      { name: "Rule", kind: "concrete", members: ["+ limit", "+ window", "+ algorithm"] },
      { name: "Algorithm", kind: "enum", members: ["TOKEN_BUCKET", "SLIDING_WINDOW", "FIXED_WINDOW"] },
      { name: "LimiterFactory", kind: "concrete", members: ["+ create(rule): RateLimiter"] },
      { name: "Api", kind: "interface", members: ["+ handle(clientId, now): Response"] },
      { name: "OrderApi", kind: "concrete", members: ["+ handle(clientId, now)"] },
      { name: "RateLimitedApi", kind: "concrete", members: ["- inner: Api", "- limiter: RateLimiter", "+ handle(clientId, now)"] }
    ],
    relations: [
      { from: "TokenBucket", to: "RateLimiter", type: "realization" },
      { from: "SlidingWindowLog", to: "RateLimiter", type: "realization" },
      { from: "FixedWindowCounter", to: "RateLimiter", type: "realization" },
      { from: "OrderApi", to: "Api", type: "realization" },
      { from: "RateLimitedApi", to: "Api", type: "realization" },
      { from: "RateLimitedApi", to: "RateLimiter", type: "association" },
      { from: "Rule", to: "Algorithm", type: "association" },
      { from: "LimiterFactory", to: "Rule", type: "dependency" }
    ]
  },
  flow: {
    title: "A request over the limit, then one within it",
    sequence: {
      label: "The client calls RateLimitedApi.handle; the proxy asks the RateLimiter; on no it returns 429, on yes it forwards the call to OrderApi and returns its 200 response.",
      participants: [
        { id: "client", name: "Client", kind: "client" },
        { id: "proxy", name: "RateLimitedApi", kind: "concrete" },
        { id: "limiter", name: "RateLimiter", kind: "interface" },
        { id: "api", name: "OrderApi", kind: "concrete" }
      ],
      messages: [
        { from: "client", to: "proxy", label: "handle(\"alice\", 1.0)" },
        { from: "proxy", to: "limiter", label: "allow(\"alice\", 1.0)" },
        { from: "limiter", to: "proxy", label: "false", kind: "return" },
        { from: "proxy", to: "client", label: "429 Too Many Requests", kind: "return" },
        { from: "client", to: "proxy", label: "handle(\"alice\", 3.0)" },
        { from: "proxy", to: "limiter", label: "allow(\"alice\", 3.0)" },
        { from: "limiter", to: "proxy", label: "true", kind: "return" },
        { from: "proxy", to: "api", label: "handle(\"alice\", 3.0)" },
        { from: "api", to: "proxy", label: "200 order #4", kind: "return" },
        { from: "proxy", to: "client", label: "200 order #4", kind: "return" }
      ]
    }
  },
  patterns: [
    {
      slug: "strategy",
      where: "RateLimiter with TokenBucket, SlidingWindowLog and FixedWindowCounter",
      why: "The algorithm is the part most likely to change (or be tuned per tier). RateLimitedApi only talks to RateLimiter, so a new algorithm is a new class, not an edit."
    },
    {
      slug: "proxy",
      where: "RateLimitedApi wraps OrderApi; both implement Api",
      why: "Limiting is a gate in front of the service, not part of its business logic. Callers keep the same Api interface, and OrderApi stays free of limit code."
    },
    {
      slug: "factory-method",
      where: "LimiterFactory.create(rule) (a simple factory method)",
      why: "Rules come from configuration. One method maps a Rule to a concrete limiter, so the if/match on Algorithm lives in exactly one place."
    }
  ],
  code: { python, scala },
  tradeoffs: [
    "We chose to pass `now` in over reading a clock inside the limiter because it makes every result repeatable: tests and the demo never depend on real time.",
    "We chose a token bucket as the default over a sliding window log because it needs two numbers per client instead of a list of timestamps, and it allows short bursts that real users make.",
    "We kept the fixed window counter even though it lets up to twice the limit through around a window edge (in the demo it lets five requests through between t=8 and t=11, the others three), because it is the cheapest and easiest to share between servers.",
    "We chose a Proxy over adding a check inside OrderApi because the same limiter can then guard any Api, and the service code stays about orders.",
    "We chose to reject at once over queuing extra requests because a queue holds memory and connections for clients that are already over their limit."
  ],
  followUps: [
    { q: "How do you make this work across many servers?", a: "Keep the counters in a shared store such as Redis, keyed by client. Do the read-and-update as one atomic step (a Lua script or INCR with expiry), otherwise two servers can both see 'one left' and both accept." },
    { q: "Is it thread-safe?", a: "No. Two threads could read the same bucket and both spend the last token. Lock per key (or use an atomic compare-and-set on the bucket), not one lock for the whole map, so clients don't wait for each other." },
    { q: "Memory grows with every client ever seen. What do you do?", a: "Evict quiet keys: a token bucket that has been idle longer than the window is full again, so you can delete it and recreate it on the next request. An LRU map or a periodic sweep works." },
    { q: "Different limits for free and paid clients?", a: "Keep one Rule per tier and one limiter per Rule, and pick by the client's tier in a small router (or a map from tier to RateLimiter) before calling allow. The algorithms don't change." },
    { q: "How does the client know when to retry?", a: "Return a Retry-After header. Token bucket can compute it: (1 - tokens) / rate seconds. The sliding window log can use: oldest timestamp + window - now." },
    { q: "Why not just use the sliding window log everywhere? It is the most exact.", a: "Its memory grows with the limit (one timestamp per accepted request). For a limit of 10,000 per hour that is a lot per client. A sliding window counter (two fixed windows, weighted) is a good middle ground." }
  ],
  extend: [
    "Add a SlidingWindowCounter that keeps the previous and current fixed-window counts and weights the previous one by how much of it still overlaps the window.",
    "Change allow to return a Decision with allowed, remaining and retry_after, and send Retry-After in the 429 response.",
    "Add a TieredLimiter that holds one RateLimiter per tier (free, pro) and picks by a tier lookup function passed in.",
    "Add an evict_idle(now) method to TokenBucket that removes buckets which are full again, and print how many it removed."
  ],
  quiz: [
    {
      type: "mcq", tag: "Scenario",
      prompt: "The limit is 100 requests per minute. A client sends 100 at 0:59 and 100 more at 1:01. Which algorithm lets all 200 through?",
      options: ["Fixed window counter", "Sliding window log", "Token bucket with capacity 100"],
      answer: 0,
      hint: "Which algorithm forgets everything the moment the clock crosses into a new window?",
      explain: "The fixed window counter resets at 1:00, so both bursts fit in their own window. The sliding window log still sees the first 100 inside the last 60 seconds and blocks. The token bucket has spent its 100 tokens and refills only about 3 in two seconds."
    },
    {
      type: "bug", tag: "Find the problem",
      prompt: "This token bucket should start full and refill over time. Tap the line that breaks deterministic tests.",
      code: { lang: "python", text: `import time

class TokenBucket(RateLimiter):
    def allow(self, key: str) -> bool:
        now = time.monotonic()
        tokens, last = self._buckets.get(key, (self._capacity, now))
        tokens = min(self._capacity, tokens + (now - last) * self._rate)
        allowed = tokens >= 1.0
        self._buckets[key] = (tokens - 1.0 if allowed else tokens, now)
        return allowed` },
      answer: 5,
      hint: "Where does the time come from, and could a test control it?",
      explain: "Line 5 reads the real clock inside the limiter, so the same test can pass or fail depending on how fast the machine is. Pass `now` in as a parameter (or inject a Clock) so tests choose the time. The other lines are the normal refill and spend steps."
    },
    {
      type: "mcq", tag: "Which pattern?",
      prompt: "RateLimitedApi implements Api, holds another Api, and decides whether to forward each call. Which pattern is that?",
      options: ["Proxy", "Adapter", "Strategy", "Chain of Responsibility"],
      answer: 0,
      hint: "Does it change the interface, choose an algorithm, or guard access to an object with the same interface?",
      explain: "Same interface as the real object, controls access to it: Proxy. An Adapter changes the interface. Strategy is the RateLimiter part (the swappable algorithm), not the gate. Chain of Responsibility passes a request along a list of handlers until one takes it."
    },
    {
      type: "order", tag: "Put in order",
      prompt: "Put the steps of TokenBucket.allow(key, now) in order.",
      steps: [
        "Load the client's tokens and last time (a full bucket if new)",
        "Add (now - last) × rate tokens, capped at the capacity",
        "If at least one token is left, spend it and answer yes",
        "Save the tokens and now as the new last time"
      ],
      shuffled: [2, 0, 3, 1],
      hint: "You can't decide before you know how many tokens are there right now.",
      explain: "First load the state, then refill for the time that passed, then decide and spend, then save. Deciding before refilling would reject clients that have waited long enough."
    }
  ]
};

export default rateLimiter;
