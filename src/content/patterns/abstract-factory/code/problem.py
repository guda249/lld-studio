class S3Storage:
    def upload(self, name: str) -> str:
        return f"s3://reports/{name}"


class GcsStorage:
    def upload(self, name: str) -> str:
        return f"gs://reports/{name}"


class SqsQueue:
    def publish(self, message: str) -> str:
        return f"SQS <- {message}"


class PubSubQueue:
    def publish(self, message: str) -> str:
        return f"Pub/Sub <- {message}"


class ReportService:
    def __init__(self, cloud: str) -> None:
        # business code knows every cloud's classes
        if cloud == "aws":
            self.storage, self.queue = S3Storage(), SqsQueue()
        elif cloud == "gcp":
            # copy-paste slip: an AWS queue next to GCP storage, and nothing complains
            self.storage, self.queue = GcsStorage(), SqsQueue()
        else:
            raise ValueError(f"unknown cloud: {cloud}")

    def publish_report(self, name: str) -> str:
        path = self.storage.upload(name)
        return self.queue.publish(f"report ready at {path}")


print(ReportService("aws").publish_report("q3.pdf"))
print(ReportService("gcp").publish_report("q3.pdf"))  # mixed families: a silent bug
