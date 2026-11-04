class Directory:
    def create_account(self, name: str, team: str) -> str:
        return f"{name.lower()}@{team}.corp.test"


class LaptopDesk:
    def assign(self, email: str, model: str) -> str:
        return f"{model} -> {email}"


class BadgeOffice:
    def print_badge(self, name: str, floors: list[int]) -> str:
        return f"badge {name} floors {floors}"


class OnboardingFacade:
    """One call to onboard someone. The sequence lives here, once."""

    def __init__(self, directory: Directory, laptops: LaptopDesk, badges: BadgeOffice) -> None:
        self._directory = directory
        self._laptops = laptops
        self._badges = badges

    def onboard(self, name: str, team: str, model: str, floors: list[int]) -> str:
        email = self._directory.create_account(name, team)
        laptop = self._laptops.assign(email, model)
        badge = self._badges.print_badge(name, floors)
        return f"{name}: {email} | {laptop} | {badge}"


if __name__ == "__main__":
    hr = OnboardingFacade(Directory(), LaptopDesk(), BadgeOffice())
    print(hr.onboard("Mira", "eng", "16-inch dev laptop", [3, 4]))
    print(hr.onboard("Theo", "design", "14-inch laptop", [2]))
