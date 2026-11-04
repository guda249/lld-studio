# After: the fees are data, so a dict holds them; the one rule is an if.
FEES = {"metro": 40, "town": 60, "remote": 120}
FREE_ABOVE = 999


def shipping_fee(zone: str, total: int) -> int:
    if total > FREE_ABOVE:  # the new rule: one line, one place
        return 0
    return FEES[zone]


if __name__ == "__main__":
    for zone in ["metro", "town", "remote"]:
        print(zone, shipping_fee(zone, 800), shipping_fee(zone, 1200))
