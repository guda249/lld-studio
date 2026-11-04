import time
from concurrent.futures import ThreadPoolExecutor


def pack_box() -> str:
    time.sleep(0.1)
    return "box packed"


def take_payment() -> str:
    time.sleep(0.1)
    return "payment taken"


print("Take order")
with ThreadPoolExecutor() as pool:                 # fork: start both at once
    packing = pool.submit(pack_box)
    paying = pool.submit(take_payment)
    results = [packing.result(), paying.result()]  # join: wait for both
print(results)
print("Ship order")
