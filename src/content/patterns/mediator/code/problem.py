class User:
    def __init__(self, name: str) -> None:
        self.name = name
        self.contacts: list["User"] = []  # every user keeps a link to every other user
        self.muted: set[str] = set()

    def add_contact(self, other: "User") -> None:
        self.contacts.append(other)

    def say(self, text: str) -> None:
        for other in self.contacts:
            if self.name not in other.muted:  # each sender re-checks the muting rule itself
                print(f"{other.name} got '{text}' from {self.name}")


users = [User(n) for n in ("asha", "ravi", "meera", "kabir")]
links = 0
for u in users:
    for other in users:
        if other is not u:
            u.add_contact(other)
            links += 1
users[2].muted.add("ravi")  # meera mutes ravi

users[1].say("PR is ready")
print(f"{len(users)} users already need {links} direct links; a 5th user means editing all of them")
