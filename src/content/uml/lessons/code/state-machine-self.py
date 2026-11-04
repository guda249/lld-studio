class VendingMachine:
    PRICE = 50

    def __init__(self):
        self.state, self.credit = "Idle", 0

    def coin(self, value: int) -> None:
        if self.state == "Idle":
            self.state = "Collecting"  # Idle -> Collecting
        self.credit += value  # self-transition

    def pick(self) -> None:
        if self.state == "Collecting" and self.credit >= self.PRICE:
            print(f"  action: vend (credit {self.credit})")
            self.state, self.credit = "Idle", 0


vm = VendingMachine()
for c in [20, 20, 10]:
    vm.coin(c)
    print(f"coin {c} -> {vm.state}, credit {vm.credit}")
vm.pick()
print("pick ->", vm.state)
