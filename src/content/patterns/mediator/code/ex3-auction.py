class Bidder:  # colleague: knows only the auction house, never the other bidders
    def __init__(self, name: str, house: "AuctionHouse") -> None:
        self.name, self._house = name, house
        house.register(self)

    def bid(self, amount: int) -> None:
        self._house.place_bid(self, amount)

    def receive(self, message: str) -> None:
        print(f"  to {self.name}: {message}")


class AuctionHouse:  # mediator: owns the bidding rules and tells people what happened
    def __init__(self, item: str, start: int, step: int) -> None:
        self.item, self._step = item, step
        self._top_amount = start - step  # so the first bid must be at least `start`
        self._top: Bidder | None = None
        self._bidders: list[Bidder] = []

    def register(self, bidder: Bidder) -> None:
        self._bidders.append(bidder)

    def place_bid(self, bidder: Bidder, amount: int) -> None:
        print(f"{bidder.name} bids ₹{amount}")
        minimum = self._top_amount + self._step
        if amount < minimum:
            bidder.receive(f"rejected, minimum is ₹{minimum}")
            return
        if self._top is not None and self._top is not bidder:
            self._top.receive(f"you were outbid at ₹{amount}")
        self._top, self._top_amount = bidder, amount

    def close(self) -> None:
        print(f"Auction for {self.item} closed")
        winner = self._top
        if winner is None:
            print("  no bids")
            return
        for b in self._bidders:
            b.receive(f"you won at ₹{self._top_amount}" if b is winner else f"sold to {winner.name}")


house = AuctionHouse("1975 Royal Enfield Bullet", start=100000, step=5000)
asha, ravi, kabir = Bidder("asha", house), Bidder("ravi", house), Bidder("kabir", house)
asha.bid(100000)
ravi.bid(102000)
ravi.bid(105000)
kabir.bid(120000)
asha.bid(125000)
house.close()
