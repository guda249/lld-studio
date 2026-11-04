def add_items(cart: list[str]) -> None:
    cart.extend(["book", "pen"])
    print("Added", cart)


def pay(cart: list[str]) -> None:
    print(f"Paid for {len(cart)} items")


def send_receipt() -> None:
    print("Receipt sent")


def checkout() -> None:          # start: the call begins
    cart: list[str] = []
    add_items(cart)              # action 1
    pay(cart)                    # action 2
    send_receipt()               # action 3
    # end: the function returns


checkout()
