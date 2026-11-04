from abc import ABC, abstractmethod


class Bidder(ABC):                                     # observer
    def __init__(self, name: str) -> None:
        self.name = name

    @abstractmethod
    def on_new_bid(self, auction: "Auction", leader: str, amount: int) -> None: ...


class Auction:                                         # subject
    def __init__(self, item: str, start: int) -> None:
        self.item, self.amount, self.leader = item, start, "nobody"
        self._watchers: list[Bidder] = []

    def watch(self, bidder: Bidder) -> None:
        self._watchers.append(bidder)

    def unwatch(self, bidder: Bidder) -> None:
        self._watchers.remove(bidder)

    def bid(self, name: str, amount: int) -> None:
        if amount <= self.amount:
            return
        self.leader, self.amount = name, amount
        print(f"{name} bids ₹{amount:,}")
        for watcher in list(self._watchers):           # copy: watchers may leave mid-loop
            watcher.on_new_bid(self, name, amount)


class AutoBidder(Bidder):
    def __init__(self, name: str, budget: int, step: int) -> None:
        super().__init__(name)
        self._budget, self._step = budget, step

    def on_new_bid(self, auction: Auction, leader: str, amount: int) -> None:
        if leader == self.name:
            return
        if amount + self._step <= self._budget:
            auction.bid(self.name, amount + self._step)
        else:
            print(f"  {self.name} is out (budget ₹{self._budget:,}) and stops watching")
            auction.unwatch(self)                      # unsubscribes during notification


auction = Auction("1971 vintage sitar", start=20_000)
for bidder in (AutoBidder("Meera", budget=26_000, step=2_000),
               AutoBidder("Kabir", budget=30_000, step=1_500)):
    auction.watch(bidder)

auction.bid("Ravi", 21_000)
print(f"Sold to {auction.leader} for ₹{auction.amount:,}")
