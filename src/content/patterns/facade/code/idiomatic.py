# In a real project this whole file would be a module, orders.py.
# The underscore names are private parts; place_order() is the facade.

_stock: dict[str, int] = {"BOOK-1": 5}


def _reserve(sku: str, qty: int) -> bool:
    if _stock.get(sku, 0) < qty:
        return False
    _stock[sku] -= qty
    return True


def _charge(user: str, amount: int) -> str:
    return f"PAY-{user}-{amount}"


def _ship(user: str, sku: str) -> str:
    return f"TRK-{sku}-{user}"


def place_order(user: str, sku: str, qty: int, amount: int) -> str:
    if not _reserve(sku, qty):
        return "Out of stock"
    return f"OK payment={_charge(user, amount)} tracking={_ship(user, sku)}"


# Callers would write: from orders import place_order
print(place_order("asha", "BOOK-1", 1, 399))
print(place_order("ravi", "BOOK-1", 9, 3591))
