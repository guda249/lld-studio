def checkout(in_stock: bool) -> list[str]:
    steps = ["check stock"]
    if in_stock:                          # the diamond: one way or the other
        steps.append("take payment")
        steps.append("ship order")
    else:
        steps.append("tell customer")
    return steps                          # the end dot


print(checkout(True))    # ['check stock', 'take payment', 'ship order']
print(checkout(False))   # ['check stock', 'tell customer']
