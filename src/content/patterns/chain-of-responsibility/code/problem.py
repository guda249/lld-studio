# Every approval rule lives in one function.
# Adding a "Finance check" or a different order for one department
# means editing this function again and again.
def approve(amount: int) -> str:
    if amount <= 10_000:
        return "TeamLead"
    elif amount <= 100_000:
        return "Manager"
    elif amount <= 1_000_000:
        return "Director"
    return "Rejected"


for amount in (4_000, 75_000, 600_000, 5_000_000):
    print(f"₹{amount} -> {approve(amount)}")
