from abc import ABC, abstractmethod


class GateListener(ABC):
    @abstractmethod
    def gate_changed(self, flight: str, gate: str) -> None: ...


class GateScreen(GateListener):
    def gate_changed(self, flight: str, gate: str) -> None:
        print(f"[screen] {flight} now boards at gate {gate}")


class SmsService(GateListener):
    def gate_changed(self, flight: str, gate: str) -> None:
        print(f"[sms] Your flight {flight} moved to gate {gate}")


class Flight:
    def __init__(self, code: str, gate: str) -> None:
        self.code = code
        self.gate = gate
        self._listeners: list[GateListener] = []

    def subscribe(self, listener: GateListener) -> None:
        self._listeners.append(listener)

    def unsubscribe(self, listener: GateListener) -> None:
        self._listeners.remove(listener)

    def change_gate(self, gate: str) -> None:
        self.gate = gate
        self._notify()

    def _notify(self) -> None:
        for listener in list(self._listeners):
            listener.gate_changed(self.code, self.gate)


if __name__ == "__main__":
    flight = Flight("LX318", "A4")
    flight.subscribe(GateScreen())
    flight.subscribe(SmsService())
    flight.change_gate("B12")
    flight.change_gate("B14")
