from abc import ABC, abstractmethod


class Deploy(ABC):
    """The recipe is written once, in run(). Subclasses fill in what differs."""

    name = "?"

    def run(self, version: str) -> None:          # the template method
        print(f"[{self.name}] checkout {version}")
        self.build()
        self.test()
        print(f"[{self.name}] upload {self.name}:{version} to the servers")
        print(f"[{self.name}] done")

    @abstractmethod
    def build(self) -> None: ...                  # every project must say how it builds

    def test(self) -> None:                        # a hook: a default that projects may override
        print(f"[{self.name}] test: none for this project")


class ApiDeploy(Deploy):
    name = "api"

    def build(self) -> None:
        print("[api] build: pip install -r requirements.txt")

    def test(self) -> None:
        print("[api] test: pytest -q")


class WebsiteDeploy(Deploy):
    name = "web"

    def build(self) -> None:
        print("[web] build: npm ci && npm run build")


if __name__ == "__main__":
    ApiDeploy().run("v2.4.0")
    WebsiteDeploy().run("v7.1.3")
