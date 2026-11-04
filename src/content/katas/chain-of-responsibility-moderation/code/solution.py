from abc import ABC, abstractmethod
from dataclasses import dataclass

BANNED_WORDS = {"scam", "crypto-giveaway"}


@dataclass
class Post:
    author_days: int   # how long the author has had an account
    text: str


class Moderator(ABC):
    """One link of the chain: decide if you can, otherwise pass the post to the next link."""

    def __init__(self, next_step: "Moderator | None" = None) -> None:
        self._next = next_step

    @abstractmethod
    def verdict(self, post: Post) -> str | None: ...

    def handle(self, post: Post) -> str:
        answer = self.verdict(post)
        if answer is not None:
            return answer
        if self._next is None:
            return "published"            # nobody objected: the end of the chain
        return self._next.handle(post)


class EmptyCheck(Moderator):
    def verdict(self, post: Post) -> str | None:
        return "rejected: empty post" if not post.text.strip() else None


class BannedWordCheck(Moderator):
    def verdict(self, post: Post) -> str | None:
        found = any(word in post.text.lower() for word in BANNED_WORDS)
        return "rejected: banned word" if found else None


class NewAccountLinkCheck(Moderator):
    def verdict(self, post: Post) -> str | None:
        risky = post.author_days < 3 and "http" in post.text
        return "held: new account posting a link" if risky else None


class LengthCheck(Moderator):
    def verdict(self, post: Post) -> str | None:
        return "held: too long, needs a human look" if len(post.text) > 280 else None


if __name__ == "__main__":
    # The client builds the chain; reordering or adding a step touches only this line.
    chain = EmptyCheck(BannedWordCheck(NewAccountLinkCheck(LengthCheck())))
    posts = [
        Post(author_days=40, text="Great meetup tonight!"),
        Post(author_days=40, text="   "),
        Post(author_days=1, text="Check http://example.com"),
        Post(author_days=90, text="Free crypto-giveaway, DM me"),
        Post(author_days=12, text="x" * 300),
    ]
    for post in posts:
        print(f"{post.text[:20]!r:24} -> {chain.handle(post)}")
