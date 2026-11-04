class GateScreen:
    def show(self, flight: str, gate: str) -> None:
        print(f"[screen] {flight} now boards at gate {gate}")


class SmsService:
    def text_passengers(self, flight: str, gate: str) -> None:
        print(f"[sms] Your flight {flight} moved to gate {gate}")


class Flight:
    def __init__(self, code: str, gate: str) -> None:
        self.code = code
        self.gate = gate
        # The flight creates and calls every consumer itself.
        self.screen = GateScreen()
        self.sms = SmsService()

    def change_gate(self, gate: str) -> None:
        self.gate = gate
        self.screen.show(self.code, gate)
        self.sms.text_passengers(self.code, gate)


if __name__ == "__main__":
    flight = Flight("LX318", "A4")
    flight.change_gate("B12")
    flight.change_gate("B14")
