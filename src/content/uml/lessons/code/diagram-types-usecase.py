class Shop:
    """The system box. Each public method is one thing a customer can do."""

    def browse_items(self) -> list[str]:
        return ["tea", "mug"]

    def place_order(self, item: str) -> str:
        return self._pay(item)            # placing an order always includes paying

    def _pay(self, item: str) -> str:
        return f"paid for {item}"


shop = Shop()                             # the Customer actor uses the shop
print(shop.browse_items())
print(shop.place_order("tea"))
