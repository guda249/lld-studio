from dataclasses import dataclass, replace


@dataclass(frozen=True)
class Resources:
    cpu: float
    memory_gb: int
    replicas: int


@dataclass(frozen=True)
class DeployConfig:
    service: str
    region: str
    resources: Resources
    alerts_on: bool


# one carefully reviewed preset per tier; frozen, so no one can edit it in place
PRESETS: dict[str, DeployConfig] = {
    "prod": DeployConfig("payments-api", "ap-south-1", Resources(2.0, 4, 6), alerts_on=True),
}


def for_staging(prod: DeployConfig) -> DeployConfig:
    # copy the preset and change only what differs; nested values need their own replace()
    smaller = replace(prod.resources, replicas=1, memory_gb=2)
    return replace(prod, resources=smaller, alerts_on=False)


def show(name: str, c: DeployConfig) -> None:
    r = c.resources
    print(f"{name}: {c.service} in {c.region}, {r.replicas} x ({r.cpu} CPU, {r.memory_gb} GB), alerts={c.alerts_on}")


prod = PRESETS["prod"]
staging = for_staging(prod)
dr_site = replace(prod, region="ap-south-2")  # disaster-recovery copy in another region

show("prod", prod)
show("staging", staging)
show("dr", dr_site)
