from concurrent.futures import ThreadPoolExecutor

# How many threads should a pool have? A common rule of thumb:
#     threads = cores x (1 + wait time / compute time)
# A task that only computes keeps a core busy, so more threads than cores just queue up.
# A task that mostly waits (disk, network) leaves its core idle, so more threads help.
# Python note: the GIL lets only one thread run Python code at a time, so for CPU-bound
# work use ProcessPoolExecutor with one process per core instead of threads.

TASKS: dict[str, tuple[int, int]] = {           # kind -> (wait ms, compute ms) per task
    "run tests": (0, 100),                      # CPU-bound: compile and run the student's code
    "lint + fetch": (100, 100),                 # half waiting, half computing
    "fetch files": (180, 20),                   # I/O-bound: download submissions from storage
}


class PoolSizer:
    def size_for(self, kind: str, cores: int) -> int:
        wait, compute = TASKS[kind]
        return int(cores * (1 + wait / compute))


def fetch_submission(student: int) -> str:
    return f"sub-{student}.zip"


if __name__ == "__main__":
    sizer = PoolSizer()
    for cores in (4, 8):
        for kind in TASKS:
            print(f"{kind}, {cores} cores: {sizer.size_for(kind, cores)} threads")
    size = sizer.size_for("fetch files", 4)
    with ThreadPoolExecutor(max_workers=size) as pool:
        files = list(pool.map(fetch_submission, range(1, 6)))
    print(f"Fetched with a pool of {size}: {files}")
