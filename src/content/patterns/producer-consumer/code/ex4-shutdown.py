import threading
from queue import Queue

STOP = None


class SmsSender(threading.Thread):              # consumer
    def __init__(self, outbox: Queue[str | None], sent: list[str]) -> None:
        super().__init__(daemon=True)           # daemon: a stuck sender cannot keep the process alive
        self._outbox, self._sent = outbox, sent

    def run(self) -> None:
        while (message := self._outbox.get()) is not STOP:
            self._sent.append(message)


def deploy_shutdown(senders: int, pills: int) -> str:
    outbox: Queue[str | None] = Queue()
    sent: list[str] = []
    workers = [SmsSender(outbox, sent) for _ in range(senders)]
    for w in workers:
        w.start()
    for n in range(1, 7):
        outbox.put(f"OTP {n}")                  # 6 messages, all queued before any pill
    for _ in range(pills):
        outbox.put(STOP)
    for w in workers:
        w.join(timeout=0.05)                    # a sender with no pill waits on get() forever
    stuck = sum(w.is_alive() for w in workers)
    return f"{len(sent)} sent, {senders - stuck} of {senders} stopped, {stuck} stuck"


if __name__ == "__main__":
    for senders in (2, 3):
        for pills in (1, 2, 3):
            print(f"{senders} senders, {pills} pill(s): {deploy_shutdown(senders, pills)}")
