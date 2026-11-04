class Customer:
    def place_order(self, shop: "Shop") -> None:   # Customer lane
        print("Customer: place order")
        shop.accept_order()

    def receive_parcel(self) -> None:              # Customer lane
        print("Customer: receive parcel")


class Shop:
    def accept_order(self) -> None:                # Shop lane
        print("Shop: accept order")

    def pack_and_ship(self, customer: Customer) -> None:  # Shop lane
        print("Shop: pack and ship")
        customer.receive_parcel()


asha, shop = Customer(), Shop()
asha.place_order(shop)
shop.pack_and_ship(asha)
