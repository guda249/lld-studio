from abc import ABC, abstractmethod


class CheckFailed(Exception):
    pass


class TestCase(ABC):
    def run(self) -> str:                         # the template method
        self.set_up()
        try:
            self.test()
            result = "PASS"
        except CheckFailed as error:
            result = f"FAIL ({error})"
        finally:
            self.tear_down()                      # always runs, even after a failure
        return f"{type(self).__name__}: {result}"

    def set_up(self) -> None:                     # hook
        pass

    @abstractmethod
    def test(self) -> None: ...

    def tear_down(self) -> None:                  # hook
        pass

    def check(self, condition: bool, message: str) -> None:
        if not condition:
            raise CheckFailed(message)


class CartTotalTest(TestCase):
    def set_up(self) -> None:
        self.cart = [499, 250]

    def test(self) -> None:
        self.check(sum(self.cart) == 749, "cart total should be 749")


class DiscountTest(TestCase):
    def set_up(self) -> None:
        print("  set_up: open test database")

    def test(self) -> None:
        price = 1000 * 0.9
        self.check(price == 910, f"expected 910, got {price}")

    def tear_down(self) -> None:
        print("  tear_down: close test database")


for case in (CartTotalTest(), DiscountTest()):
    print(case.run())
