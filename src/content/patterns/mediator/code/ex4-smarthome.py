class Device:  # colleague: reports to the hub and obeys it, never talks to other devices
    def __init__(self, name: str) -> None:
        self.name, self.on = name, False
        self.hub: "Hub | None" = None

    def report(self, event: str) -> None:
        print(f"{self.name}: {event}")
        if self.hub is not None:
            self.hub.on_event(self, event)

    def switch(self, turn_on: bool) -> None:
        if self.on != turn_on:
            self.on = turn_on
            print(f"  hub -> {self.name} {'ON' if turn_on else 'OFF'}")


class Hub:  # mediator: every cross-device rule lives in on_event()
    def __init__(self, *devices: Device) -> None:
        self._by_name = {d.name: d for d in devices}
        self._window_open = False
        for d in devices:
            d.hub = self

    def on_event(self, sender: Device, event: str) -> None:
        light, ac = self._by_name["hall light"], self._by_name["AC"]
        match event:
            case "unlocked":
                light.switch(True)
                if self._window_open:
                    print("  hub: window is open, AC stays off")
                else:
                    ac.switch(True)
            case "opened" if sender.name == "window":
                self._window_open = True
                ac.switch(False)
            case "closed" if sender.name == "window":
                self._window_open = False
                if light.on:  # someone is home
                    ac.switch(True)
            case "locked":
                light.switch(False)
                ac.switch(False)
            case _:
                print("  hub: no rule for this event")


door, window, light, ac = Device("front door"), Device("window"), Device("hall light"), Device("AC")
hub = Hub(door, window, light, ac)
window.report("opened")
door.report("unlocked")
window.report("closed")
light.report("flickering")
door.report("locked")
