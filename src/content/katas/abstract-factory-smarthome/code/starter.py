class ZigbeeLight:
    def turn_on(self, room: str) -> str:
        return f"[zigbee] light on in {room}"


class ZigbeeLock:
    def lock(self, door: str) -> str:
        return f"[zigbee] {door} locked"


class WifiLight:
    def turn_on(self, room: str) -> str:
        return f"[wifi] light on in {room}"


class WifiLock:
    def lock(self, door: str) -> str:
        return f"[wifi] {door} locked"


class HomeHub:
    def __init__(self, protocol: str) -> None:
        self.protocol = protocol

    def evening(self) -> list[str]:
        # every routine repeats this choice; a third protocol means editing each one
        if self.protocol == "zigbee":
            light = ZigbeeLight()
            lock = ZigbeeLock()
        else:
            light = WifiLight()
            lock = WifiLock()
        return [light.turn_on("living room"), lock.lock("front door")]


if __name__ == "__main__":
    for protocol in ("zigbee", "wifi"):
        for line in HomeHub(protocol).evening():
            print(line)
