from collections.abc import Iterable, Iterator


def readings(count: int) -> Iterator[int]:
    """Pretend heart-rate sensor: a fixed pattern, produced one value at a time."""
    pattern = [72, 75, 250, 78, 80, 0, 82, 85, 83]
    for i in range(count):
        bpm = pattern[i % len(pattern)]
        print(f"  read #{i}: {bpm} bpm")
        yield bpm


def plausible(values: Iterable[int]) -> Iterator[int]:
    return (v for v in values if 30 <= v <= 220)  # drop sensor glitches


def batches(values: Iterable[int], size: int) -> Iterator[list[int]]:
    batch: list[int] = []
    for v in values:
        batch.append(v)
        if len(batch) == size:
            yield batch
            batch = []
    if batch:
        yield batch


pipeline = batches(plausible(readings(9)), size=3)
print("pipeline built, nothing read yet")
for batch in pipeline:
    avg = sum(batch) / len(batch)
    print(f"upload {batch} avg {avg:.2f} bpm")
