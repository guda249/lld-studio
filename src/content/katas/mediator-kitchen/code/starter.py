class Waiter:
    def __init__(self) -> None:
        self.grill: "Grill | None" = None
        self.fryer: "Fryer | None" = None

    def take_order(self, table: int) -> None:
        print(f"table {table}: order sent to grill and fryer")
        self.grill.start(table)
        self.fryer.start(table)

    def serve(self, table: int) -> None:
        print(f"table {table}: served")


class Grill:
    def __init__(self, waiter: Waiter) -> None:
        self.waiter = waiter
        self.fryer: "Fryer | None" = None
        self.cooking: set[int] = set()

    def start(self, table: int) -> None:
        self.cooking.add(table)

    def finish(self, table: int) -> None:
        self.cooking.discard(table)
        print(f"  grill: burger for table {table} ready")
        if table not in self.fryer.cooking:      # the grill peeks inside the fryer
            self.waiter.serve(table)


class Fryer:
    def __init__(self, waiter: Waiter) -> None:
        self.waiter = waiter
        self.grill: Grill | None = None
        self.cooking: set[int] = set()

    def start(self, table: int) -> None:
        self.cooking.add(table)

    def finish(self, table: int) -> None:
        self.cooking.discard(table)
        print(f"  fryer: fries for table {table} ready")
        if table not in self.grill.cooking:      # and the fryer peeks inside the grill
            self.waiter.serve(table)


if __name__ == "__main__":
    waiter = Waiter()
    grill, fryer = Grill(waiter), Fryer(waiter)
    waiter.grill, waiter.fryer = grill, fryer
    grill.fryer, fryer.grill = fryer, grill      # everyone wired to everyone
    waiter.take_order(1)
    waiter.take_order(2)
    grill.finish(1)
    fryer.finish(2)
    fryer.finish(1)
    grill.finish(2)
