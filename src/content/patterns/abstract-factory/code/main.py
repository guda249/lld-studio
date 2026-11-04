from abc import ABC, abstractmethod


class Storage(ABC):
    @abstractmethod
    def upload(self, name: str) -> str: ...


class Queue(ABC):
    @abstractmethod
    def publish(self, message: str) -> str: ...


class S3Storage(Storage):
    def upload(self, name: str) -> str:
        return f"s3://reports/{name}"


class SqsQueue(Queue):
    def publish(self, message: str) -> str:
        return f"SQS <- {message}"


class GcsStorage(Storage):
    def upload(self, name: str) -> str:
        return f"gs://reports/{name}"


class PubSubQueue(Queue):
    def publish(self, message: str) -> str:
        return f"Pub/Sub <- {message}"


class CloudFactory(ABC):
    @abstractmethod
    def create_storage(self) -> Storage: ...

    @abstractmethod
    def create_queue(self) -> Queue: ...


class AwsFactory(CloudFactory):
    def create_storage(self) -> Storage:
        return S3Storage()

    def create_queue(self) -> Queue:
        return SqsQueue()


class GcpFactory(CloudFactory):
    def create_storage(self) -> Storage:
        return GcsStorage()

    def create_queue(self) -> Queue:
        return PubSubQueue()


class ReportService:
    # the client sees only the interfaces, never a concrete class
    def __init__(self, cloud: CloudFactory) -> None:
        self._storage = cloud.create_storage()
        self._queue = cloud.create_queue()

    def publish_report(self, name: str) -> str:
        path = self._storage.upload(name)
        return self._queue.publish(f"report ready at {path}")


for factory in (AwsFactory(), GcpFactory()):
    print(ReportService(factory).publish_report("q3.pdf"))
