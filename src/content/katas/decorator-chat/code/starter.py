class ChatSender:
    def send(self, text: str) -> str:
        return f"sent: {text}"


class FilteredSender(ChatSender):
    def send(self, text: str) -> str:
        return super().send(text.replace("darn", "****"))


class EmojiSender(ChatSender):
    def send(self, text: str) -> str:
        return super().send(text.replace(":wave:", "o/"))


# filter + emoji needs its own class, with the emoji code copied from EmojiSender.
# Adding a "trim spaces" feature would double the number of classes again.
class FilteredEmojiSender(FilteredSender):
    def send(self, text: str) -> str:
        return super().send(text.replace(":wave:", "o/"))


if __name__ == "__main__":
    message = ":wave: darn printer is jammed again"
    print(ChatSender().send(message))
    print(FilteredSender().send(message))
    print(EmojiSender().send(message))
    print(FilteredEmojiSender().send(message))
