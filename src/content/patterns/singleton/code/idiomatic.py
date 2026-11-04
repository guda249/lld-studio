class Settings:
    def __init__(self, env: str = "prod", currency: str = "INR") -> None:
        self.env = env
        self.currency = currency


# In a real project this line lives in settings.py. Python runs a module once,
# so every `from settings import settings` gets this same object.
settings = Settings()


class InvoiceService:
    def __init__(self, config: Settings) -> None:  # the dependency is passed in
        self.config = config

    def describe(self, amount: int) -> str:
        return f"[{self.config.env}] invoice for {amount} {self.config.currency}"


# Composition root: build the one instance at startup and hand it out.
service_a = InvoiceService(settings)
service_b = InvoiceService(settings)
print(service_a.describe(1200))
print(f"Both services share one Settings: {service_a.config is service_b.config}")

# A test simply passes its own instance; no global to patch or reset.
print(InvoiceService(Settings(env="test")).describe(1))
