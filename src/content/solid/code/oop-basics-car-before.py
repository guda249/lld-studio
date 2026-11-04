# Before: Car inherits from Engine to "get" start(). But a car is not an engine.


class Engine:
    def __init__(self) -> None:
        self.running = False

    def start(self) -> str:
        self.running = True
        return "engine on"


class Car(Engine):  # is-a: every Car is now also an Engine
    def drive(self) -> str:
        return self.start() + ", car moving"


if __name__ == "__main__":
    car = Car()
    print(car.drive())
    print(car.running)  # Engine's insides are part of Car's public face
    print(isinstance(car, Engine))  # True: code that wants an Engine will accept a Car
