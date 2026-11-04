import asyncio

# For I/O-bound work (network calls, uploads), asyncio gives the same pattern
# on one thread: awaiting put() / get() pauses a coroutine, not a whole thread.


async def producer(jobs: asyncio.Queue[str], photos: list[str]) -> None:
    for photo in photos:
        await jobs.put(photo)                   # pauses while the queue is full


async def consumer(jobs: asyncio.Queue[str], done: list[str]) -> None:
    while True:
        photo = await jobs.get()                # pauses while the queue is empty
        done.append(f"thumb({photo})")
        jobs.task_done()                        # lets jobs.join() count finished work


async def main() -> None:
    jobs: asyncio.Queue[str] = asyncio.Queue(maxsize=3)
    done: list[str] = []
    workers = [asyncio.create_task(consumer(jobs, done)) for _ in range(2)]
    await producer(jobs, [f"img{n}.jpg" for n in range(1, 9)])
    await jobs.join()                           # every photo taken AND marked done
    for w in workers:
        w.cancel()                              # no poison pills needed
    await asyncio.gather(*workers, return_exceptions=True)
    print(f"Thumbnails made: {len(done)}")
    print(f"First three: {sorted(done)[:3]}")


if __name__ == "__main__":
    asyncio.run(main())
