import random
from abc import ABC, abstractmethod


class BackoffStrategy(ABC):
    @abstractmethod
    def delay(self, attempt: int) -> float: ...


class FixedDelay(BackoffStrategy):
    def __init__(self, seconds: float = 1.0):
        self.seconds = seconds

    def delay(self, attempt: int) -> float:
        return self.seconds


class ExponentialBackoff(BackoffStrategy):
    def __init__(self, base: float = 0.5, cap: float = 8.0):
        self.base, self.cap = base, cap

    def delay(self, attempt: int) -> float:
        return min(self.cap, self.base * 2 ** (attempt - 1))


class FullJitter(ExponentialBackoff):
    def __init__(self, base: float = 0.5, cap: float = 8.0, rng: random.Random | None = None):
        super().__init__(base, cap)
        self.rng = rng or random.Random(42)

    def delay(self, attempt: int) -> float:
        return self.rng.uniform(0, super().delay(attempt))


class RetryingClient:
    def __init__(self, backoff: BackoffStrategy, max_attempts: int = 5):
        self.backoff, self.max_attempts = backoff, max_attempts

    def schedule(self) -> list[float]:
        # a real client would call time.sleep(delay) after each failed attempt
        return [round(self.backoff.delay(a), 2) for a in range(1, self.max_attempts + 1)]


for backoff in (FixedDelay(), ExponentialBackoff(), FullJitter()):
    print(type(backoff).__name__, RetryingClient(backoff).schedule())
