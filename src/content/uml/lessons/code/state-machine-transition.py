class Phone:
    def __init__(self, code: str):
        self.code, self.wrong, self.state = code, 0, "Locked"

    def pin(self, p: str) -> None:  # event: pin
        if self.state != "Locked":
            return
        if p == self.code:  # guard [ok]
            self.state = "Unlocked"
            print("  action: unlock")
        else:
            self.wrong += 1
            if self.wrong == 3:  # guard [3 wrong]
                self.state = "Blocked"
                print("  action: alarm")

    def timeout(self) -> None:  # event: timeout
        if self.state == "Unlocked":
            self.state = "Locked"
            print("  action: lock")


phone = Phone("1234")
for p in ["0000", "1234"]:
    phone.pin(p)
    print(p, "->", phone.state)
phone.timeout()
print("timeout ->", phone.state)
