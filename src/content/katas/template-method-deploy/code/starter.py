class ApiDeploy:
    """Deploys the Python API. The recipe is copied in every deploy class."""

    def run(self, version: str) -> None:
        print(f"[api] checkout {version}")
        print("[api] build: pip install -r requirements.txt")
        print("[api] test: pytest -q")
        print(f"[api] upload api:{version} to the servers")
        print("[api] done")


class WebsiteDeploy:
    """Deploys the marketing site: same recipe, different build, no tests."""

    def run(self, version: str) -> None:
        print(f"[web] checkout {version}")
        print("[web] build: npm ci && npm run build")
        print("[web] test: none for this project")
        print(f"[web] upload web:{version} to the servers")
        print("[web] done")


if __name__ == "__main__":
    ApiDeploy().run("v2.4.0")
    WebsiteDeploy().run("v7.1.3")
