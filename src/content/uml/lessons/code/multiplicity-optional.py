class Passport:
    def __init__(self, number: str):
        self.number = number


class Person:
    def __init__(self, name: str, passport: Passport | None = None):   # 0..1: optional
        self.name = name
        self.passport = passport

    def can_fly_abroad(self) -> bool:
        return self.passport is not None   # 0 is allowed, so check before use


print(Person("Ravi").can_fly_abroad())                      # False
print(Person("Meera", Passport("P123")).can_fly_abroad())   # True
