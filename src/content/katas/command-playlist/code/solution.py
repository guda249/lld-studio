from abc import ABC, abstractmethod


class Playlist:
    def __init__(self) -> None:
        self.songs: list[str] = []

    def show(self) -> str:
        return " | ".join(self.songs) or "(empty)"


class Command(ABC):
    @abstractmethod
    def execute(self) -> None: ...

    @abstractmethod
    def undo(self) -> None: ...


class AddSong(Command):
    def __init__(self, playlist: Playlist, song: str) -> None:
        self.playlist = playlist
        self.song = song

    def execute(self) -> None:
        self.playlist.songs.append(self.song)

    def undo(self) -> None:
        self.playlist.songs.remove(self.song)


class RemoveSong(Command):
    def __init__(self, playlist: Playlist, song: str) -> None:
        self.playlist = playlist
        self.song = song
        self.at = 0   # remembered during execute, so undo can put it back

    def execute(self) -> None:
        self.at = self.playlist.songs.index(self.song)
        self.playlist.songs.remove(self.song)

    def undo(self) -> None:
        self.playlist.songs.insert(self.at, self.song)


class MoveSong(Command):
    def __init__(self, playlist: Playlist, song: str, to: int) -> None:
        self.playlist = playlist
        self.song = song
        self.to = to
        self.at = 0

    def execute(self) -> None:
        songs = self.playlist.songs
        self.at = songs.index(self.song)
        songs.insert(self.to, songs.pop(self.at))

    def undo(self) -> None:
        songs = self.playlist.songs
        songs.insert(self.at, songs.pop(self.to))


class PlaylistEditor:
    """The invoker: runs any Command and keeps a history for undo. It never names a concrete command."""

    def __init__(self) -> None:
        self.history: list[Command] = []

    def run(self, command: Command) -> None:
        command.execute()
        self.history.append(command)

    def undo(self) -> None:
        self.history.pop().undo()


if __name__ == "__main__":
    playlist = Playlist()
    editor = PlaylistEditor()
    for title in ["Intro", "Sunrise", "Dust"]:
        editor.run(AddSong(playlist, title))
    editor.run(MoveSong(playlist, "Dust", to=0))
    editor.run(RemoveSong(playlist, "Sunrise"))
    print("after edits:", playlist.show())
    editor.undo()
    print("undo remove:", playlist.show())
    editor.undo()
    print("undo move:  ", playlist.show())
