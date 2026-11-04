# "Asha orders two books. Each line of the order has a price and a quantity."
# Nouns that hold data AND do something become classes.


class Customer:
    pass


class LineItem:
    pass


class Order:
    pass


for cls in (Customer, LineItem, Order):
    print("Class box:", cls.__name__)
