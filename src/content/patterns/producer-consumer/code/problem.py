# Before: the upload handler and the thumbnail workers share a plain list.
# Nothing limits its size, nothing stops two workers taking the same photo,
# and an idle worker has to keep polling "anything yet?".

pending: list[str] = []                 # shared "queue": a plain list, no lock, no limit
thumbnails: list[str] = []


def handle_upload(photo: str) -> None:
    pending.append(photo)               # never waits, so a burst grows the list forever


def worker_peek() -> str | None:
    return pending[0] if pending else None      # 1. check...


def worker_finish(photo: str) -> None:
    thumbnails.append(f"thumb({photo})")
    pending.pop(0)                      # 2. ...then act: someone may have changed the list


for n in range(10_000):
    handle_upload(f"img{n}.jpg")
print(f"After a burst: {len(pending)} photos waiting in memory")

# Two worker threads with unlucky timing, written out step by step:
a = worker_peek()                       # worker A sees img0
b = worker_peek()                       # worker B also sees img0 (A has not removed it yet)
worker_finish(a)                        # A removes img0
worker_finish(b)                        # B removes img1, which nobody processed
print(f"Thumbnails made: {thumbnails}")
print(f"img1.jpg lost: {'img1.jpg' not in pending}")
