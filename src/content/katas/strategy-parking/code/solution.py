from abc import ABC, abstractmethod


class RatePlan(ABC):
    @abstractmethod
    def fee(self, hours: int) -> float: ...


class Hourly(RatePlan):
    def fee(self, hours: int) -> float:
        return 2.5 * hours


class DayPass(RatePlan):
    def fee(self, hours: int) -> float:
        days = (hours + 23) // 24
        return 12.0 * max(days, 1)


class Resident(RatePlan):
    def fee(self, hours: int) -> float:
        return 0.0 if hours <= 2 else 1.0 * (hours - 2)


class ParkingMeter:
    """Works out what a driver owes by asking its rate plan. It never names a concrete plan."""

    def __init__(self, plan: RatePlan) -> None:
        self._plan = plan

    def set_plan(self, plan: RatePlan) -> None:
        self._plan = plan

    def fee(self, hours: int) -> float:
        return self._plan.fee(hours)


if __name__ == "__main__":
    plans: dict[str, RatePlan] = {"hourly": Hourly(), "day-pass": DayPass(), "resident": Resident()}
    for name, plan in plans.items():
        meter = ParkingMeter(plan)
        print(f"{name:9} 3h: {meter.fee(3):5.2f}   30h: {meter.fee(30):6.2f}")
