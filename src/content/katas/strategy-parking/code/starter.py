class ParkingMeter:
    """Works out what a driver owes. The pricing rule is picked with if/elif on a plan name."""

    def __init__(self, plan: str) -> None:
        self.plan = plan

    def fee(self, hours: int) -> float:
        if self.plan == "hourly":
            return 2.5 * hours
        elif self.plan == "day-pass":
            return 12.0 if hours <= 24 else 12.0 * ((hours + 23) // 24)
        elif self.plan == "resident":
            return 0.0 if hours <= 2 else 1.0 * (hours - 2)
        else:
            raise ValueError(f"unknown plan {self.plan}")


if __name__ == "__main__":
    for plan in ["hourly", "day-pass", "resident"]:
        meter = ParkingMeter(plan)
        print(f"{plan:9} 3h: {meter.fee(3):5.2f}   30h: {meter.fee(30):6.2f}")
