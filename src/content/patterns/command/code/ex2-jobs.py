from abc import ABC, abstractmethod
from collections import deque


class Job(ABC):
    """Command: everything needed to do one piece of work later."""

    name = "Job"

    def __init__(self) -> None:
        self.attempts = 0

    @abstractmethod
    def run(self) -> None: ...  # raises on failure


class SendSms(Job):
    def __init__(self, phone: str, text: str) -> None:
        super().__init__()
        self.phone, self.text = phone, text
        self.name = f"SendSms({phone})"

    def run(self) -> None:
        print(f"  SMS to {self.phone}: {self.text}")


class GenerateInvoice(Job):
    def __init__(self, order_id: int, amount: int) -> None:
        super().__init__()
        self.order_id, self.amount = order_id, amount
        self.name = f"GenerateInvoice({order_id})"

    def run(self) -> None:
        print(f"  invoice INV-{self.order_id} for ₹{self.amount}")


class SyncPayment(Job):
    def __init__(self, txn_id: str, failures: int) -> None:
        super().__init__()
        self.txn_id, self.failures = txn_id, failures  # fails this many times first
        self.name = f"SyncPayment({txn_id})"

    def run(self) -> None:
        if self.attempts <= self.failures:
            raise RuntimeError("bank API timeout")
        print(f"  payment {self.txn_id} synced")


class JobQueue:  # invoker: runs jobs later and retries failures
    def __init__(self, max_attempts: int = 3) -> None:
        self._queue: deque[Job] = deque()
        self.max_attempts = max_attempts

    def submit(self, job: Job) -> None:
        self._queue.append(job)

    def work(self) -> None:
        while self._queue:
            job = self._queue.popleft()
            job.attempts += 1
            try:
                job.run()
                print(f"done {job.name} (attempt {job.attempts})")
            except RuntimeError as err:
                if job.attempts < self.max_attempts:
                    print(f"retry {job.name}: {err}")
                    self._queue.append(job)
                else:
                    print(f"gave up {job.name}")


jobs = JobQueue(max_attempts=3)
jobs.submit(SendSms("+91-98450-00000", "Your order is packed"))
jobs.submit(SyncPayment("TXN42", failures=1))
jobs.submit(GenerateInvoice(1042, 1299))
jobs.submit(SyncPayment("TXN43", failures=5))
jobs.work()
