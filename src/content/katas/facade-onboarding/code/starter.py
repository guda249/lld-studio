class Directory:
    def create_account(self, name: str, team: str) -> str:
        return f"{name.lower()}@{team}.corp.test"


class LaptopDesk:
    def assign(self, email: str, model: str) -> str:
        return f"{model} -> {email}"


class BadgeOffice:
    def print_badge(self, name: str, floors: list[int]) -> str:
        return f"badge {name} floors {floors}"


# Each team copies the same three-step sequence, and the copies have to stay in step.
# IT now wants a VPN account created before the laptop is handed over.
def onboard_engineer(directory: Directory, laptops: LaptopDesk, badges: BadgeOffice, name: str) -> str:
    email = directory.create_account(name, "eng")
    laptop = laptops.assign(email, "16-inch dev laptop")
    badge = badges.print_badge(name, [3, 4])
    return f"{name}: {email} | {laptop} | {badge}"


def onboard_designer(directory: Directory, laptops: LaptopDesk, badges: BadgeOffice, name: str) -> str:
    email = directory.create_account(name, "design")
    laptop = laptops.assign(email, "14-inch laptop")
    badge = badges.print_badge(name, [2])
    return f"{name}: {email} | {laptop} | {badge}"


if __name__ == "__main__":
    directory, laptops, badges = Directory(), LaptopDesk(), BadgeOffice()
    print(onboard_engineer(directory, laptops, badges, "Mira"))
    print(onboard_designer(directory, laptops, badges, "Theo"))
