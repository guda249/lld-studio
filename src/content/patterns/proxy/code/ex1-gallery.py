from abc import ABC, abstractmethod


class Image(ABC):
    @abstractmethod
    def show(self) -> str: ...


class HighResImage(Image):
    loads = 0

    def __init__(self, file: str) -> None:
        HighResImage.loads += 1                  # the expensive part: download and decode
        self._file = file

    def show(self) -> str:
        return f"[{self._file} 4000x3000]"


class ImageProxy(Image):
    """Virtual proxy: a cheap placeholder until the image is actually shown."""

    def __init__(self, file: str) -> None:
        self._file = file
        self._real: HighResImage | None = None

    def show(self) -> str:
        if self._real is None:
            self._real = HighResImage(self._file)
        return self._real.show()


album: list[Image] = [ImageProxy(f"goa_{n:02}.jpg") for n in range(1, 41)]
print(f"album of {len(album)} photos opened, {HighResImage.loads} loaded")

visible = album[:6]                              # only the first screen is on view
print(" ".join(photo.show() for photo in visible[:2]), "...")
for photo in visible:
    photo.show()
print(f"after scrolling the first screen: {HighResImage.loads} loaded")
album[0].show()                                  # shown again: no second load
print(f"after re-opening photo 1: {HighResImage.loads} loaded")
