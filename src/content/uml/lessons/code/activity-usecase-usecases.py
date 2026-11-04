class ShopApp:
    """The system boundary: everything inside is one use case."""

    def browse_products(self) -> None:
        print("Showing products")

    def place_order(self) -> None:
        print("Order placed")

    def track_order(self) -> None:
        print("Order is on its way")

    def add_product(self) -> None:
        print("Product added")


app = ShopApp()
# actor: Customer
app.browse_products()
app.place_order()
app.track_order()
# actor: Admin
app.add_product()
