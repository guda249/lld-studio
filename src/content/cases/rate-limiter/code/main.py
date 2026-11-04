from abc import ABC, abstractmethod
from collections import deque
from dataclasses import dataclass
from enum import Enum


class Algorithm(Enum):
    TOKEN_BUCKET = "token bucket"
    SLIDING_WINDOW = "sliding window"
    FIXED_WINDOW = "fixed window"


@dataclass(frozen=True)
class Rule:
    """At most `limit` requests per `window` seconds, for each client."""
    limit: int
    window: float
    algorithm: Algorithm


@dataclass(frozen=True)
class Response:
    status: int
    body: str


class RateLimiter(ABC):
    """Strategy: every algorithm answers the same question the same way."""

    @abstractmethod
    def allow(self, key: str, now: float) -> bool: ...


class TokenBucket(RateLimiter):
    """Each client has a bucket of `limit` tokens that refills smoothly over `window` seconds."""

    def __init__(self, limit: int, window: float) -> None:
        self._capacity = float(limit)
        self._rate = limit / window  # tokens added per second
        self._buckets: dict[str, tuple[float, float]] = {}  # key -> (tokens, last time)

    def allow(self, key: str, now: float) -> bool:
        tokens, last = self._buckets.get(key, (self._capacity, now))
        tokens = min(self._capacity, tokens + (now - last) * self._rate)
        allowed = tokens >= 1.0
        if allowed:
            tokens -= 1.0
        self._buckets[key] = (tokens, now)
        return allowed


class SlidingWindowLog(RateLimiter):
    """Remembers the time of each accepted request in the last `window` seconds."""

    def __init__(self, limit: int, window: float) -> None:
        self._limit = limit
        self._window = window
        self._log: dict[str, deque[float]] = {}

    def allow(self, key: str, now: float) -> bool:
        times = self._log.setdefault(key, deque())
        while times and times[0] <= now - self._window:
            times.popleft()  # forget requests that left the window
        if len(times) < self._limit:
            times.append(now)
            return True
        return False


class FixedWindowCounter(RateLimiter):
    """Counts requests per clock window (0-10 s, 10-20 s, ...). Cheap, but bursty at the edges."""

    def __init__(self, limit: int, window: float) -> None:
        self._limit = limit
        self._window = window
        self._counts: dict[str, tuple[int, int]] = {}  # key -> (window number, count)

    def allow(self, key: str, now: float) -> bool:
        current = int(now // self._window)
        window_no, count = self._counts.get(key, (current, 0))
        if window_no != current:
            window_no, count = current, 0  # a new window starts from zero
        allowed = count < self._limit
        self._counts[key] = (window_no, count + 1 if allowed else count)
        return allowed


class LimiterFactory:
    """Turns a configuration Rule into the right algorithm, so callers never name a concrete class."""

    def create(self, rule: Rule) -> RateLimiter:
        if rule.algorithm is Algorithm.TOKEN_BUCKET:
            return TokenBucket(rule.limit, rule.window)
        if rule.algorithm is Algorithm.SLIDING_WINDOW:
            return SlidingWindowLog(rule.limit, rule.window)
        return FixedWindowCounter(rule.limit, rule.window)


class Api(ABC):
    @abstractmethod
    def handle(self, client_id: str, now: float) -> Response: ...


class OrderApi(Api):
    """The real service. It knows nothing about rate limits."""

    def __init__(self) -> None:
        self._served = 0

    def handle(self, client_id: str, now: float) -> Response:
        self._served += 1
        return Response(200, f"order #{self._served} for {client_id}")


class RateLimitedApi(Api):
    """Proxy: same interface as the real Api; it checks the limiter before passing the call on."""

    def __init__(self, inner: Api, limiter: RateLimiter) -> None:
        self._inner = inner
        self._limiter = limiter

    def handle(self, client_id: str, now: float) -> Response:
        if not self._limiter.allow(client_id, now):
            return Response(429, "too many requests, try again later")
        return self._inner.handle(client_id, now)


def compare_algorithms(factory: LimiterFactory) -> None:
    times = [0.0, 8.0, 9.0, 9.5, 10.0, 10.5, 11.0, 19.0]
    print("Rule: 3 requests per 10 s. Requests at", times)
    for algorithm in Algorithm:
        limiter = factory.create(Rule(3, 10.0, algorithm))
        results = [limiter.allow("alice", t) for t in times]
        marks = " ".join("ok" if ok else "--" for ok in results)
        burst = sum(ok for t, ok in zip(times, results) if 8.0 <= t <= 11.0)
        print(f"  {algorithm.value:<15} {marks}   ({burst} allowed between t=8 and t=11)")


def show_refill(factory: LimiterFactory) -> None:
    """A token bucket lets a quiet client burst again, but only up to its capacity."""
    limiter = factory.create(Rule(3, 3.0, Algorithm.TOKEN_BUCKET))  # refills 1 token per second
    print("\nToken bucket, 3 per 3 s:")
    for now in [0.0, 0.0, 0.0, 0.0, 1.0, 1.0, 9.0, 9.0, 9.0, 9.0]:
        print(f"  t={now:<4} -> {'allowed' if limiter.allow('carol', now) else 'rejected'}")


def serve_through_proxy(factory: LimiterFactory) -> None:
    api = RateLimitedApi(OrderApi(), factory.create(Rule(2, 4.0, Algorithm.TOKEN_BUCKET)))
    calls = [("alice", 0.0), ("alice", 0.5), ("alice", 1.0), ("bob", 1.0), ("alice", 3.0)]
    print("\nOrder API behind a token bucket (2 per 4 s):")
    for client, now in calls:
        response = api.handle(client, now)
        print(f"  t={now:<4} {client:<6} -> {response.status} {response.body}")


if __name__ == "__main__":
    factory = LimiterFactory()
    compare_algorithms(factory)
    show_refill(factory)
    serve_through_proxy(factory)
