from __future__ import annotations


class MachineState:                                    # state
    def insert(self, m: VendingMachine, rupees: int) -> None:
        print(f"  {type(self).__name__}: cannot take money now, returning ₹{rupees}")

    def select(self, m: VendingMachine) -> None:
        print(f"  {type(self).__name__}: insert money first")


class Idle(MachineState):
    def insert(self, m: VendingMachine, rupees: int) -> None:
        m.credit += rupees
        print(f"  credit ₹{m.credit}")
        m.state = HasMoney()                           # the state picks the next state


class HasMoney(MachineState):
    def insert(self, m: VendingMachine, rupees: int) -> None:
        m.credit += rupees
        print(f"  credit ₹{m.credit}")

    def select(self, m: VendingMachine) -> None:
        if m.credit < m.price:
            print(f"  need ₹{m.price - m.credit} more")
            return
        m.stock -= 1
        print(f"  dispensing chips, change ₹{m.credit - m.price}")
        m.credit = 0
        m.state = SoldOut() if m.stock == 0 else Idle()


class SoldOut(MachineState):
    def select(self, m: VendingMachine) -> None:
        print("  SoldOut: nothing left, please call the operator")


class VendingMachine:                                  # context
    def __init__(self, stock: int, price: int) -> None:
        self.stock, self.price, self.credit = stock, price, 0
        self.state: MachineState = Idle()

    def insert(self, rupees: int) -> None:
        self.state.insert(self, rupees)

    def select(self) -> None:
        self.state.select(self)


machine = VendingMachine(stock=1, price=30)
for action, amount in [("select", 0), ("insert", 20), ("select", 0),
                       ("insert", 20), ("select", 0), ("insert", 10), ("select", 0)]:
    print(f"{action} {amount or ''} [{type(machine.state).__name__}]")
    if action == "insert":
        machine.insert(amount)
    else:
        machine.select()
