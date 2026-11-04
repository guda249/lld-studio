class Song:
    def __init__(self, title: str):
        self.title = title


class Playlist:
    def __init__(self) -> None:
        self.songs: list[Song] = []        # *: a list that may be empty

    def add(self, song: Song) -> None:
        self.songs.append(song)


mix = Playlist()
print(len(mix.songs))                      # 0 is fine
mix.add(Song("Morning Rain"))
mix.add(Song("City Lights"))
print([s.title for s in mix.songs])
