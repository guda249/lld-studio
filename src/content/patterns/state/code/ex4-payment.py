from enum import Enum


class Pay(Enum):
    CREATED = "created"
    PENDING = "pending"
    SUCCESS = "success"
    FAILED = "failed"
    REFUNDED = "refunded"


# (state, event) -> next state; the table is the single source of truth
TABLE: dict[tuple[Pay, str], Pay] = {
    (Pay.CREATED, "send"): Pay.PENDING,
    (Pay.PENDING, "bank_ok"): Pay.SUCCESS,
    (Pay.PENDING, "bank_declined"): Pay.FAILED,
    (Pay.PENDING, "timeout"): Pay.FAILED,
    (Pay.FAILED, "retry"): Pay.PENDING,
    (Pay.SUCCESS, "refund"): Pay.REFUNDED,
}

ON_ENTER = {                                           # side effects when a state is entered
    Pay.SUCCESS: "send receipt to payer",
    Pay.FAILED: "show 'payment failed, try again'",
    Pay.REFUNDED: "credit money back to the source account",
}


class UpiPayment:                                      # context driven by the table
    def __init__(self, txn_id: str, amount: int) -> None:
        self.txn_id, self.amount = txn_id, amount
        self.state = Pay.CREATED
        self.history = [self.state.value]

    def handle(self, event: str) -> None:
        nxt = TABLE.get((self.state, event))
        if nxt is None:
            print(f"{event:14} ignored in {self.state.value}")
            return
        self.state = nxt
        self.history.append(nxt.value)
        action = ON_ENTER.get(nxt, "")
        print(f"{event:14} -> {nxt.value:9} {action}".rstrip())


payment = UpiPayment("UPI-88213", 1_250)
print(f"{payment.txn_id}: paying ₹{payment.amount:,}")
for event in ["send", "timeout", "refund", "retry", "bank_ok", "refund"]:
    payment.handle(event)
print("History:", " > ".join(payment.history))
