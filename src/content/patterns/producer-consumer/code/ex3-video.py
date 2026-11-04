import threading
from queue import Queue

STOP = None


def transcoder(inbox: Queue[str | None], outbox: Queue[str | None], dead: Queue[str]) -> None:
    # consumer of stage 1 AND producer for stage 2
    while (video := inbox.get()) is not STOP:
        if video.endswith(".corrupt"):
            dead.put(video)                     # park it for a human; keep the line moving
        else:
            outbox.put(video.replace(".mov", ".mp4"))
    outbox.put(STOP)                            # pass the pill down the line


def publisher(inbox: Queue[str | None], published: list[str]) -> None:
    while (video := inbox.get()) is not STOP:
        published.append(video)


def run_pipeline(uploads: list[str]) -> str:
    raw: Queue[str | None] = Queue(maxsize=2)
    encoded: Queue[str | None] = Queue(maxsize=2)
    dead: Queue[str] = Queue()
    published: list[str] = []
    stages = [
        threading.Thread(target=transcoder, args=(raw, encoded, dead)),
        threading.Thread(target=publisher, args=(encoded, published)),
    ]
    for s in stages:
        s.start()
    for video in uploads + [STOP]:
        raw.put(video)
    for s in stages:
        s.join()
    return f"{len(published)} published, {dead.qsize()} dead letter(s): {', '.join(published)}"


if __name__ == "__main__":
    batches = {
        "clean": ["intro.mov", "arrays.mov", "graphs.mov"],
        "one corrupt": ["intro.mov", "arrays.corrupt", "graphs.mov"],
        "two corrupt": ["intro.corrupt", "arrays.mov", "graphs.corrupt"],
    }
    for name, uploads in batches.items():
        print(f"{name}: {run_pipeline(uploads)}")
