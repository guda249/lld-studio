import threading
from queue import Queue

STOP = None                                     # poison pill: tells one consumer to finish


class UploadHandler:                            # producer
    def __init__(self, jobs: Queue[str | None]) -> None:
        self._jobs = jobs

    def upload(self, photo: str) -> None:
        self._jobs.put(photo)                   # waits while the queue is full


class ThumbnailWorker(threading.Thread):        # consumer
    def __init__(self, jobs: Queue[str | None], done: list[str], lock: threading.Lock) -> None:
        super().__init__()
        self._jobs, self._done, self._lock = jobs, done, lock

    def run(self) -> None:
        while True:
            photo = self._jobs.get()            # waits while the queue is empty
            if photo is STOP:
                break
            with self._lock:
                self._done.append(f"thumb({photo})")


jobs: Queue[str | None] = Queue(maxsize=3)      # bounded: at most 3 photos waiting
done: list[str] = []
lock = threading.Lock()
workers = [ThumbnailWorker(jobs, done, lock) for _ in range(2)]
for w in workers:
    w.start()

handler = UploadHandler(jobs)
for n in range(1, 9):
    handler.upload(f"img{n}.jpg")
for _ in workers:
    jobs.put(STOP)                              # one pill per consumer
for w in workers:
    w.join()

print(f"Uploaded 8, thumbnails made: {len(done)}")
print(f"First three: {sorted(done)[:3]}")
print(f"Queue empty at the end: {jobs.empty()}")
