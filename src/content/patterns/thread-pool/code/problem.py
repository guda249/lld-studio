import threading

# Before: every invoice gets a brand-new thread. Starting a thread costs time and
# memory, nothing limits how many run at once, and the invoice the thread makes
# has nowhere to go: Thread throws the return value away.

created = 0                                     # how many threads we have started


def make_invoice(order_id: int) -> str:
    return f"invoice-{order_id}.pdf"            # nobody ever sees this value


def handle_orders(order_ids: list[int]) -> None:
    global created
    threads: list[threading.Thread] = []
    for oid in order_ids:
        t = threading.Thread(target=make_invoice, args=(oid,))   # one new thread per task
        t.start()                               # no limit: a burst starts a burst of threads
        created += 1
        threads.append(t)
    for t in threads:
        t.join()                                # each thread dies after one invoice


handle_orders(list(range(1, 11)))
print(f"10 orders -> threads created: {created}")
handle_orders(list(range(11, 1011)))
print(f"1,010 orders -> threads created: {created}")
print("Invoices handed back to the caller: none")
