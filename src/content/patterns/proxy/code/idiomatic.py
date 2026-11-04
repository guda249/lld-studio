from functools import cached_property
from typing import Any


class SalesReport:
    def __init__(self) -> None:
        print("  building report from 2 million rows (slow)...")
        self.total = 4_250_000

    def summary(self) -> str:
        return f"total sales ₹{self.total:,}"


class LazyProxy:
    """A generic virtual proxy: builds the real object on first use, then forwards everything."""

    def __init__(self, factory: type[SalesReport]) -> None:
        self._factory = factory

    @cached_property
    def _real(self) -> SalesReport:          # runs once, then the result is stored
        return self._factory()

    def __getattr__(self, name: str) -> Any:  # called only for names the proxy lacks
        return getattr(self._real, name)


report = LazyProxy(SalesReport)
print("dashboard loaded")
print(report.summary())     # built here, on first use
print(report.total)         # forwarded, not rebuilt
