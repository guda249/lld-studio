from collections import defaultdict
from collections.abc import Callable

Handler = Callable[[dict[str, str]], None]


class EventBus:                                        # broker between publishers and subscribers
    def __init__(self) -> None:
        self._handlers: defaultdict[str, list[Handler]] = defaultdict(list)

    def subscribe(self, topic: str, handler: Handler) -> None:
        self._handlers[topic].append(handler)

    def publish(self, topic: str, event: dict[str, str]) -> None:
        for handler in list(self._handlers[topic]):
            try:
                handler(event)
            except Exception as err:                   # one broken handler must not stop the rest
                print(f"  [bus] handler failed on {topic}: {err}")


def chat_notifier(event: dict[str, str]) -> None:
    print(f"  #builds: {event['repo']} failed at step '{event['step']}'")


def pager(event: dict[str, str]) -> None:
    if event["branch"] != "main":
        return
    raise RuntimeError("pager service is down")


def deploy_log(event: dict[str, str]) -> None:
    print(f"  deploy log: {event['repo']} {event['version']} is live")


bus = EventBus()
bus.subscribe("build.failed", chat_notifier)
bus.subscribe("build.failed", pager)
bus.subscribe("deploy.done", deploy_log)

# the CI runner only knows the bus and topic names, not the subscribers
print("CI: publishing build.failed")
bus.publish("build.failed", {"repo": "payments-api", "step": "unit tests", "branch": "main"})
print("CI: publishing deploy.done")
bus.publish("deploy.done", {"repo": "web-app", "version": "v2.8.1"})
print("CI: publishing cache.cleared (nobody listens)")
bus.publish("cache.cleared", {})
