# Fragile base class: the subclass depends on HOW the base class does its work.
class Playlist:
    def __init__(self) -> None:
        self.songs: list[str] = []

    def add(self, song: str) -> None:
        self.songs.append(song)

    def add_all(self, songs: list[str]) -> None:
        for song in songs:
            self.add(song)  # an internal detail... that subclasses now rely on


class CountingPlaylist(Playlist):
    def __init__(self) -> None:
        super().__init__()
        self.added = 0

    def add(self, song: str) -> None:
        self.added += 1
        super().add(song)

    def add_all(self, songs: list[str]) -> None:
        self.added += len(songs)  # counted here AND again inside add()
        super().add_all(songs)


if __name__ == "__main__":
    p = CountingPlaylist()
    p.add_all(["Raga", "Blues"])
    print("songs:", len(p.songs), "counted:", p.added)  # songs: 2 counted: 4
