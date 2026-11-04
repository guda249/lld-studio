class Kitchen:
    def cook(self, dish: str) -> str:
        return f"{dish} is ready"


class Waiter:
    def __init__(self, kitchen: Kitchen):
        self.kitchen = kitchen

    def take_order(self, dish: str) -> str:
        return self.kitchen.cook(dish)


# each object = one participant
kitchen = Kitchen()
waiter = Waiter(kitchen)
print(waiter.take_order("Dosa"))  # Dosa is ready
