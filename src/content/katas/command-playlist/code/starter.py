class Playlist:
    def __init__(self) -> None:
        self.songs: list[str] = []

    def show(self) -> str:
        return " | ".join(self.songs) or "(empty)"


class PlaylistEditor:
    """Does an edit, and remembers it as a tuple so undo can reverse it."""

    def __init__(self, playlist: Playlist) -> None:
        self.playlist = playlist
        self.history: list[tuple[str, str, int, int]] = []

    def edit(self, action: str, song: str, to: int = 0) -> None:
        songs = self.playlist.songs
        if action == "add":
            songs.append(song)
            self.history.append(("add", song, 0, 0))
        elif action == "remove":
            at = songs.index(song)
            songs.remove(song)
            self.history.append(("remove", song, at, 0))
        elif action == "move":
            at = songs.index(song)
            songs.insert(to, songs.pop(at))
            self.history.append(("move", song, at, to))

    def undo(self) -> None:
        # The same if/elif again, backwards. Every new action means editing both methods.
        action, song, at, to = self.history.pop()
        songs = self.playlist.songs
        if action == "add":
            songs.remove(song)
        elif action == "remove":
            songs.insert(at, song)
        elif action == "move":
            songs.insert(at, songs.pop(to))


if __name__ == "__main__":
    playlist = Playlist()
    editor = PlaylistEditor(playlist)
    for title in ["Intro", "Sunrise", "Dust"]:
        editor.edit("add", title)
    editor.edit("move", "Dust", to=0)
    editor.edit("remove", "Sunrise")
    print("after edits:", playlist.show())
    editor.undo()
    print("undo remove:", playlist.show())
    editor.undo()
    print("undo move:  ", playlist.show())
