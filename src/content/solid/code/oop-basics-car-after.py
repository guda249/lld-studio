# After: Car HAS an Engine (composition). Car shows only what a car does.


class Engine:
    def __init__(self) -> None:
        self.running = False

    def start(self) -> str:
        self.running = True
        return "engine on"


class Car:
    def __init__(self) -> None:
        self._engine = Engine()  # has-a: the car builds and owns its engine

    def drive(self) -> str:
        return self._engine.start() + ", car moving"  # delegate the work


if __name__ == "__main__":
    car = Car()
    print(car.drive())
    print(hasattr(car, "start"))  # False: the engine stays inside
