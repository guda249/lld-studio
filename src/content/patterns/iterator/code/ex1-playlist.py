from abc import ABC, abstractmethod


class SongIterator(ABC):  # iterator interface, classic has_next / next style
    @abstractmethod
    def has_next(self) -> bool: ...

    @abstractmethod
    def next(self) -> str: ...


class InOrder(SongIterator):
    def __init__(self, songs: list[str]) -> None:
        self._songs, self._pos = songs, 0

    def has_next(self) -> bool:
        return self._pos < len(self._songs)

    def next(self) -> str:
        song = self._songs[self._pos]
        self._pos += 1
        return song


def shuffled_indices(n: int, seed: int) -> list[int]:
    order = list(range(n))
    for i in range(n - 1, 0, -1):  # Fisher-Yates with a tiny fixed-seed generator
        seed = (seed * 1103515245 + 12345) % 2147483648
        j = seed % (i + 1)
        order[i], order[j] = order[j], order[i]
    return order


class Shuffled(SongIterator):
    def __init__(self, songs: list[str], seed: int) -> None:
        self._songs, self._order, self._pos = songs, shuffled_indices(len(songs), seed), 0

    def has_next(self) -> bool:
        return self._pos < len(self._order)

    def next(self) -> str:
        song = self._songs[self._order[self._pos]]
        self._pos += 1
        return song


class Playlist:  # aggregate: hands out iterators, keeps its list private
    def __init__(self, name: str) -> None:
        self.name = name
        self._songs: list[str] = []

    def add(self, title: str) -> None:
        self._songs.append(title)

    def in_order(self) -> SongIterator:
        return InOrder(list(self._songs))

    def shuffled(self, seed: int) -> SongIterator:
        return Shuffled(list(self._songs), seed)


def play(label: str, it: SongIterator) -> None:
    titles: list[str] = []
    while it.has_next():
        titles.append(it.next())
    print(f"{label}: {' -> '.join(titles)}")


road_trip = Playlist("Road trip")
for title in ["Monsoon Drive", "Chai at Dawn", "Highway 44", "Ghats Sunset", "Coastal Breeze"]:
    road_trip.add(title)

play("In order", road_trip.in_order())
play("Shuffle ", road_trip.shuffled(seed=7))
a, b = road_trip.in_order(), road_trip.in_order()
a.next()
a.next()
print(f"Two listeners: A is on {a.next()}, B is on {b.next()}")
