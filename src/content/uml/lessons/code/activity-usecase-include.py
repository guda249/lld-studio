class ShopApp:
    def log_in(self) -> None:
        print("Logged in")

    def apply_coupon(self, code: str) -> None:
        print(f"Coupon {code} applied")

    def place_order(self, coupon: str | None = None) -> None:
        self.log_in()                  # «include»: always happens
        if coupon:
            self.apply_coupon(coupon)  # «extend»: only sometimes
        print("Order placed")


app = ShopApp()
app.place_order()
app.place_order(coupon="SAVE10")
