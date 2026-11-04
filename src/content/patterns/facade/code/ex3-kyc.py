from dataclasses import dataclass


class PanVerifier:
    def verify(self, pan: str) -> bool:
        return len(pan) == 10 and pan[:5].isalpha() and pan[5:9].isdigit()


class AadhaarOtp:
    def check(self, aadhaar: str, otp: str) -> bool:
        return otp == "123456"                     # the sandbox OTP


class CreditBureau:
    def score(self, pan: str) -> int:
        return 780 if pan.endswith("F") else 640


class CoreBanking:
    def __init__(self) -> None:
        self._next = 5000

    def open_account(self, name: str, limit: int) -> str:
        self._next += 1
        return f"SB{self._next}"


@dataclass
class OnboardingResult:
    ok: bool
    detail: str


class AccountOpeningFacade:
    """The mobile app makes ONE call; four vendor APIs stay behind it."""

    def __init__(self) -> None:
        self._pan = PanVerifier()
        self._otp = AadhaarOtp()
        self._bureau = CreditBureau()
        self._core = CoreBanking()

    def open(self, name: str, pan: str, aadhaar: str, otp: str) -> OnboardingResult:
        if not self._pan.verify(pan):
            return OnboardingResult(False, "invalid PAN")
        if not self._otp.check(aadhaar, otp):
            return OnboardingResult(False, "wrong OTP")
        limit = 200_000 if self._bureau.score(pan) >= 750 else 50_000
        account = self._core.open_account(name, limit)
        return OnboardingResult(True, f"account {account}, card limit ₹{limit:,}")


bank = AccountOpeningFacade()
print(bank.open("Priya", "ABCDE1234F", "9999-8888-7777", "123456"))
print(bank.open("Karan", "ABCDE1234K", "9999-8888-6666", "123456"))
print(bank.open("Imran", "ABC123", "9999-8888-5555", "123456"))
print(bank.open("Neha", "PQRSX5678F", "9999-8888-4444", "000000"))
