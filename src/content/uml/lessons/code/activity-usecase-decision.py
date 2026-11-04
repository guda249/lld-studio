STOCK = {"book": 3, "lamp": 0}


def checkout(item: str) -> None:
    print(f"Checking stock for {item}")           # action
    if STOCK[item] > 0:                            # decision
        print("Ship now")                          # [in stock]
    else:
        print("Back-order: ships next week")       # [out of stock]
    print("Send receipt")                          # after the merge


checkout("book")
checkout("lamp")
