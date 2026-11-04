from dataclasses import dataclass

BANNED_WORDS = {"scam", "crypto-giveaway"}


@dataclass
class Post:
    author_days: int   # how long the author has had an account
    text: str


def moderate(post: Post) -> str:
    # Every rule lives in this one function, in a fixed order.
    if not post.text.strip():
        return "rejected: empty post"
    elif any(word in post.text.lower() for word in BANNED_WORDS):
        return "rejected: banned word"
    elif post.author_days < 3 and "http" in post.text:
        return "held: new account posting a link"
    elif len(post.text) > 280:
        return "held: too long, needs a human look"
    else:
        return "published"


if __name__ == "__main__":
    posts = [
        Post(author_days=40, text="Great meetup tonight!"),
        Post(author_days=40, text="   "),
        Post(author_days=1, text="Check http://example.com"),
        Post(author_days=90, text="Free crypto-giveaway, DM me"),
        Post(author_days=12, text="x" * 300),
    ]
    for post in posts:
        print(f"{post.text[:20]!r:24} -> {moderate(post)}")
