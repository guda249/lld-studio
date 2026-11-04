from dataclasses import dataclass
from functools import cache


@dataclass(frozen=True)
class TestDefinition:
    """Flyweight: name, unit and normal range. Identical for every patient."""
    name: str
    unit: str
    low: float
    high: float

    def flag(self, value: float) -> str:
        if value < self.low:
            return "LOW"
        return "HIGH" if value > self.high else "normal"


CATALOGUE = {"HB": ("Haemoglobin", "g/dL", 12.0, 16.0), "GLU": ("Fasting glucose", "mg/dL", 70.0, 100.0)}


@cache                                   # function-based flyweight factory
def test_def(code: str) -> TestDefinition:
    print(f"  (loading definition {code} from the master table)")
    return TestDefinition(*CATALOGUE[code])


@dataclass(slots=True)
class LabResult:
    """Context: the per-patient part."""
    patient: str
    value: float
    test: TestDefinition

    def line(self) -> str:
        return f"{self.patient:<6} {self.test.name:<16} {self.value} {self.test.unit} {self.test.flag(self.value)}"


readings = [("Anil", "HB", 11.2), ("Bina", "HB", 13.5), ("Anil", "GLU", 126.0),
            ("Chitra", "GLU", 92.0), ("Bina", "GLU", 64.0), ("Chitra", "HB", 14.1)]
results = [LabResult(patient, value, test_def(code)) for patient, code, value in readings]
for result in results:
    print(result.line())
print(f"{len(results)} results share {test_def.cache_info().currsize} test definitions")
