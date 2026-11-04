from dataclasses import dataclass
from typing import Callable


# a family is just a bundle of matching creation functions
@dataclass(frozen=True)
class CloudKit:
    upload: Callable[[str], str]
    publish: Callable[[str], str]


AWS = CloudKit(
    upload=lambda name: f"s3://reports/{name}",
    publish=lambda msg: f"SQS <- {msg}",
)
GCP = CloudKit(
    upload=lambda name: f"gs://reports/{name}",
    publish=lambda msg: f"Pub/Sub <- {msg}",
)

# one config value picks the whole family, so families cannot be mixed
KITS: dict[str, CloudKit] = {"aws": AWS, "gcp": GCP}


def publish_report(kit: CloudKit, name: str) -> str:
    return kit.publish(f"report ready at {kit.upload(name)}")


config = {"cloud": "gcp"}
print(publish_report(KITS[config["cloud"]], "q3.pdf"))
print(publish_report(KITS["aws"], "q3.pdf"))
