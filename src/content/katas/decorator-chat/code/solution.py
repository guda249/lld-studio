from abc import ABC, abstractmethod


class MessageSender(ABC):  # component
    @abstractmethod
    def send(self, text: str) -> str: ...


class PlainSender(MessageSender):  # the real object at the centre
    def send(self, text: str) -> str:
        return f"sent: {text}"


class SenderDecorator(MessageSender):  # base decorator: is a sender and holds one
    def __init__(self, inner: MessageSender) -> None:
        self._inner = inner

    def send(self, text: str) -> str:
        return self._inner.send(text)


class ProfanityFilter(SenderDecorator):
    def send(self, text: str) -> str:
        return super().send(text.replace("darn", "****"))


class EmojiExpander(SenderDecorator):
    def send(self, text: str) -> str:
        return super().send(text.replace(":wave:", "o/"))


if __name__ == "__main__":
    message = ":wave: darn printer is jammed again"
    print(PlainSender().send(message))
    print(ProfanityFilter(PlainSender()).send(message))
    print(EmojiExpander(PlainSender()).send(message))
    print(EmojiExpander(ProfanityFilter(PlainSender())).send(message))  # stacked at runtime
